# Messages Backend

Tiny SQLite-backed API for the `messages.coolbugs.win` guestbook.

## API

- `GET /api/messages` returns `{ "messages": [...] }`
- `POST /api/messages` accepts `{ "alias": "...", "text": "..." }`
- `GET /health` returns `{ "ok": true }`

Messages are capped to 30 characters for aliases and 280 characters for text.
Posts are rate limited per client IP with `RATE_LIMIT_MAX_POSTS` inside
`RATE_LIMIT_WINDOW_SECONDS`.

## Portainer

1. In Portainer, go to `Stacks` -> `Add stack`.
2. Use the Git repository option for this repo.
3. Set the Compose path to `backends/messages/docker-compose.yml`.
4. Deploy the stack.
5. Point nginx for `messages.coolbugs.win` at `http://127.0.0.1:8087`.

If you use the Portainer web editor instead of a Git-backed stack, build the
image from this folder first. The Compose file uses `build: .`, so Portainer
needs the Dockerfile and `app.py` as build context.

## Cloudflare DNS + nginx

Create a proxied Cloudflare DNS record for:

```text
messages.coolbugs.win -> your home public IP
```

Then make sure your router forwards ports `80` and `443` to the nginx proxy
host on the Mac mini side.

If you have Cloudflare cache rules for `coolbugs.win`, bypass cache for
`messages.coolbugs.win/*`. The API sends `Cache-Control: no-store`, but an
explicit bypass rule keeps the guestbook from serving stale messages.

For plain host nginx, use `nginx-messages.coolbugs.win.conf.example` as the
shape:

```text
messages.coolbugs.win -> http://127.0.0.1:8087
```

For Nginx Proxy Manager or nginx running in Docker, either:

- proxy to `host.docker.internal:8087` if that works in your Docker setup, or
- put the proxy container and `messages-api` container on the same Docker
  network and proxy to `http://coolbugs-messages-api:8080`.

For HTTPS, terminate TLS at nginx or use your existing nginx/Cloudflare setup.
The frontend at `terminal.coolbugs.win/pages/messages.html` already calls:

```text
https://messages.coolbugs.win/api/messages
```

The Compose file stores SQLite data in the named volume `messages_data`.
