from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import sqlite3
import threading
import time
from urllib.parse import urlparse


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "/data/snake.sqlite"))
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "https://terminal.coolbugs.win",
    ).split(",")
    if origin.strip()
}
LEADERBOARD_LIMIT = int(os.getenv("LEADERBOARD_LIMIT", "10"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_POSTS = int(os.getenv("RATE_LIMIT_MAX_POSTS", "10"))
MAX_NAME_LENGTH = int(os.getenv("MAX_NAME_LENGTH", "30"))
MAX_SETTINGS_LENGTH = int(os.getenv("MAX_SETTINGS_LENGTH", "80"))
MAX_SCORE = int(os.getenv("MAX_SCORE", "999999999"))


db_lock = threading.Lock()
request_times_by_ip: dict[str, deque[float]] = defaultdict(deque)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def init_db() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DATABASE_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                score INTEGER NOT NULL,
                settings TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores(score DESC, id ASC)"
        )
        conn.commit()


def clean_name(value: object) -> str:
    if not isinstance(value, str):
        return "Anonymous"
    normalized = re.sub(r"\s+", " ", value).strip()
    if not normalized:
        return "Anonymous"
    return normalized[:MAX_NAME_LENGTH]


def clean_settings(value: object) -> str:
    if not isinstance(value, str):
        return ""
    normalized = re.sub(r"\s+", " ", value).strip()
    return normalized[:MAX_SETTINGS_LENGTH]


def parse_score(value: object) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        score = value
    elif isinstance(value, float) and value.is_integer():
        score = int(value)
    elif isinstance(value, str) and re.fullmatch(r"\d+", value.strip()):
        score = int(value.strip())
    else:
        return None

    if score < 0 or score > MAX_SCORE:
        return None
    return score


def fetch_leaderboard() -> list[dict[str, object]]:
    with db_lock, sqlite3.connect(DATABASE_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT id, name, score, settings, created_at
            FROM scores
            ORDER BY score DESC, id ASC
            LIMIT ?
            """,
            (LEADERBOARD_LIMIT,),
        ).fetchall()

    return [dict(row) for row in rows]


def create_score(name: str, score: int, settings: str) -> dict[str, object]:
    created_at = utc_now_iso()
    with db_lock, sqlite3.connect(DATABASE_PATH) as conn:
        cursor = conn.execute(
            "INSERT INTO scores (name, score, settings, created_at) VALUES (?, ?, ?, ?)",
            (name, score, settings, created_at),
        )
        conn.commit()
        score_id = cursor.lastrowid

    return {
        "id": score_id,
        "name": name,
        "score": score,
        "settings": settings,
        "created_at": created_at,
    }


def client_ip(handler: BaseHTTPRequestHandler) -> str:
    forwarded_for = handler.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return handler.client_address[0]


def post_rate_limited(ip_address: str) -> bool:
    now = time.monotonic()
    history = request_times_by_ip[ip_address]
    while history and now - history[0] > RATE_LIMIT_WINDOW_SECONDS:
        history.popleft()
    if len(history) >= RATE_LIMIT_MAX_POSTS:
        return True
    history.append(now)
    return False


class SnakeHandler(BaseHTTPRequestHandler):
    server_version = "coolbugs-snake-leaderboard/1.0"

    def log_message(self, fmt: str, *args: object) -> None:
        print(
            f"{self.log_date_time_string()} {client_ip(self)} "
            f"{self.command} {self.path} {fmt % args}",
            flush=True,
        )

    def end_headers(self) -> None:
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def send_json(self, status: HTTPStatus, payload: object) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/health":
            self.send_json(HTTPStatus.OK, {"ok": True})
            return
        if path != "/api/leaderboard":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        self.send_json(HTTPStatus.OK, fetch_leaderboard())

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/scores":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return

        ip_address = client_ip(self)
        if post_rate_limited(ip_address):
            self.send_json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "rate_limited"})
            return

        content_type = self.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            self.send_json(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                {"error": "content_type_must_be_json"},
            )
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0

        if content_length <= 0 or content_length > 4096:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_body"})
            return

        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_json"})
            return
        if not isinstance(payload, dict):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_json"})
            return

        name = clean_name(payload.get("name"))
        score = parse_score(payload.get("score"))
        settings = clean_settings(payload.get("settings"))
        if score is None:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_score"})
            return

        record = create_score(name, score, settings)
        self.send_json(HTTPStatus.CREATED, {"score": record})


def main() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), SnakeHandler)
    print(f"Snake leaderboard API listening on {HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
