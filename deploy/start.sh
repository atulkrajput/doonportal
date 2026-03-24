#!/bin/bash
# DoonPortal — Production Server Start
# Usage: ./start.sh
# Or with custom port: PORT=8080 ./start.sh

export NODE_ENV=production
export PORT=${PORT:-3000}
export HOSTNAME="0.0.0.0"

echo "Starting DoonPortal on port $PORT..."
node server.js
