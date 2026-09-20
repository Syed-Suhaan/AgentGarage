FROM --platform=linux/arm64 public.ecr.aws/docker/library/python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

COPY requirements-agentcore.txt .
RUN pip install --no-cache-dir -r requirements-agentcore.txt

COPY agent/ ./agent/
COPY services/ ./services/
COPY agentcore/server.py ./server.py

EXPOSE 8080

CMD ["python", "server.py"]
