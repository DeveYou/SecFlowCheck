#!/bin/sh

# wait-for-service.sh
# Usage: wait-for-service.sh <host> <port> <command...>
# Example: ./wait-for-service.sh postgres 5432 uvicorn app.main:app --host 0.0.0.0 --port 8000

set -e

if [ $# -lt 3 ]; then
  echo "Usage: $0 <host> <port> <command...>"
  exit 1
fi

HOST=$1
PORT=$2
shift 2
CMD="$@"

echo "Waiting for $HOST:$PORT to be ready..."

until nc -z "$HOST" "$PORT"; do
  echo "$HOST:$PORT is unavailable - sleeping"
  sleep 2
done

echo "$HOST:$PORT is up - executing command"
exec $CMD
