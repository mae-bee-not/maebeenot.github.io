# Snake Leaderboard Backend

Tiny SQLite-backed API for the `snake-leaderboard.coolbugs.win` scoreboard.

## API

- `GET /api/leaderboard` returns an array of score records.
- `POST /api/scores` accepts `{ "name": "...", "score": 12, "settings": "20x20, 9 tiles/sec, Random wall" }`.
- `GET /health` returns `{ "ok": true }`.

Score records look like this:

```json
{
  "id": 1,
  "name": "Mae",
  "score": 12,
  "settings": "20x20, 9 tiles/sec, Random wall",
  "created_at": "2026-08-25T15:00:00Z"
}
```

The frontend displays `name`, `score`, and `settings`, while the extra fields
make manual debugging easier.

## Portainer

1. In Portainer, go to `Stacks` -> `Add stack`.
2. Use the Git repository option for this repo.
3. Set the Compose path to `backends/snake/docker-compose.yml`.
4. Deploy the stack.
5. Point nginx for `snake-leaderboard.coolbugs.win` at `http://127.0.0.1:8089`.

The Compose file stores SQLite data in the named volume `snake_data`.

## Cloudflare DNS + nginx

Create a proxied Cloudflare DNS record for:

```text
snake-leaderboard.coolbugs.win -> your home public IP
```

Forward ports `80` and `443` on your router to the nginx proxy host.

For plain host nginx, use `nginx-snake-leaderboard.coolbugs.win.conf.example`
as the shape:

```text
snake-leaderboard.coolbugs.win -> http://127.0.0.1:8089
```

For Nginx Proxy Manager or nginx running in Docker, either:

- proxy to `host.docker.internal:8089` if that works in your Docker setup, or
- put the proxy container and `snake-api` container on the same Docker network
  and proxy to `http://coolbugs-snake-api:8080`.

If you have Cloudflare cache rules for `coolbugs.win`, bypass cache for
`snake-leaderboard.coolbugs.win/*`. The API sends `Cache-Control: no-store`,
but an explicit bypass rule keeps scores fresh.

The frontend at `terminal.coolbugs.win/pages/snake.html` already calls:

```text
https://snake-leaderboard.coolbugs.win/api/leaderboard
https://snake-leaderboard.coolbugs.win/api/scores
```

## Smoke Test

```bash
curl https://snake-leaderboard.coolbugs.win/health
curl https://snake-leaderboard.coolbugs.win/api/leaderboard
curl -X POST https://snake-leaderboard.coolbugs.win/api/scores \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mae","score":12,"settings":"20x20, 9 tiles/sec, Random wall"}'
```
