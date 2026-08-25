# Backends

Self-hosted APIs for `terminal.coolbugs.win`.

## Services

- `messages/` powers `https://messages.coolbugs.win/api/messages`
- `tetris/` powers `https://tetris-leaderboard.coolbugs.win/api/leaderboard`
- `snake/` powers `https://snake-leaderboard.coolbugs.win/api/leaderboard`

Each service has its own Dockerfile, Portainer-ready Compose file, SQLite
volume, nginx example config, and deployment notes.

## Portainer Compose Paths

Use these paths for Git-backed stacks:

```text
backends/messages/docker-compose.yml
backends/tetris/docker-compose.yml
backends/snake/docker-compose.yml
```
