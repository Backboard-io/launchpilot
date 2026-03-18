FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Litestream for SQLite → S3 replication.
ARG LITESTREAM_VERSION=v0.3.13
ADD https://github.com/benbjohnson/litestream/releases/download/${LITESTREAM_VERSION}/litestream-${LITESTREAM_VERSION}-linux-amd64.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz litestream && \
    chmod +x /usr/local/bin/litestream && \
    rm /tmp/litestream.tar.gz

WORKDIR /app

# Install Python dependencies first for better layer caching.
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy API source.
COPY apps/api/ .
COPY apps/web/ /app/web

EXPOSE 8000
EXPOSE 3001
WORKDIR /app/web
RUN npm install && npm run build && \
mkdir -p /app/web/.next/standalone/.next && \
cp -r /app/web/.next/static /app/web/.next/standalone/.next/static
# cp -r /app/web/public /app/web/.next/standalone/public
# CMD ["uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "&&", "npm", "run", "dev"]
WORKDIR /app

CMD ["sh", "-c", "cd /app && export DB_PATH=${SQLITE_DB_PATH:-/tmp/data/launchpilot.db} && export SQLITE_DB_PATH=${SQLITE_DB_PATH:-$DB_PATH} && mkdir -p \"$(dirname \"$DB_PATH\")\" && (litestream restore -config /app/litestream.yml -o \"$DB_PATH\" -if-replica-exists \"$DB_PATH\" || true) && alembic upgrade head && litestream replicate -config /app/litestream.yml & uvicorn app.main:app --host 127.0.0.1 --port 9000 & sleep 5 && cd /app/web && NODE_ENV=production HOSTNAME=${HOSTNAME:-0.0.0.0} exec node .next/standalone/server.js"]
