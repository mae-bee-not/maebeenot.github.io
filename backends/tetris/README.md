# Tetris Leaderboard Backend

Tiny SQLite-backed API for the `tetris-leaderboard.coolbugs.win` scoreboard.

## API

- `GET /api/leaderboard` returns an array of score records.
- `POST /api/scores` accepts `{ "name": "...", "score": 1234 }`.
- `GET /health` returns `{ "ok": true }`.

Score records look like this:

```json
{
  "id": 1,
  "name": "Mae",
  "score": 1200,
  "created_at": "2026-08-25T15:00:00Z"
}
```

The existing frontend only needs `name` and `score`, but the extra fields make
manual debugging easier.

Player names are matched case-insensitively after whitespace cleanup. If a name
already exists, submitting another score updates that row's score instead of
adding a duplicate. When an existing database is migrated, duplicate names are
collapsed by keeping the highest score.

## Portainer

1. In Portainer, go to `Stacks` -> `Add stack`.
2. Use the Git repository option for this repo.
3. Set the Compose path to `backends/tetris/docker-compose.yml`.
4. Deploy the stack.
5. Point nginx for `tetris-leaderboard.coolbugs.win` at `http://127.0.0.1:8088`.

The Compose file stores SQLite data in the named volume `tetris_data`.

## Cloudflare DNS + nginx

Create a proxied Cloudflare DNS record for:

```text
tetris-leaderboard.coolbugs.win -> your home public IP
```

Forward ports `80` and `443` on your router to the nginx proxy host.

For plain host nginx, use `nginx-tetris-leaderboard.coolbugs.win.conf.example`
as the shape:

```text
tetris-leaderboard.coolbugs.win -> http://127.0.0.1:8088
```

For Nginx Proxy Manager or nginx running in Docker, either:

- proxy to `host.docker.internal:8088` if that works in your Docker setup, or
- put the proxy container and `tetris-api` container on the same Docker network
  and proxy to `http://coolbugs-tetris-api:8080`.

If you have Cloudflare cache rules for `coolbugs.win`, bypass cache for
`tetris-leaderboard.coolbugs.win/*`. The API sends `Cache-Control: no-store`,
but an explicit bypass rule keeps scores fresh.

The frontend at `terminal.coolbugs.win/pages/tetris.html` already calls:

```text
https://tetris-leaderboard.coolbugs.win/api/leaderboard
https://tetris-leaderboard.coolbugs.win/api/scores
```

## Smoke Test

```bash
curl https://tetris-leaderboard.coolbugs.win/health
curl https://tetris-leaderboard.coolbugs.win/api/leaderboard
curl -X POST https://tetris-leaderboard.coolbugs.win/api/scores \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mae","score":1200}'
```
