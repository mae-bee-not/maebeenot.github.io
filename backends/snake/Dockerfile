FROM python:3.12-slim

WORKDIR /app

COPY app.py /app/app.py

ENV HOST=0.0.0.0
ENV PORT=8080
ENV DATABASE_PATH=/data/snake.sqlite

RUN mkdir -p /data

EXPOSE 8080

CMD ["python", "/app/app.py"]
