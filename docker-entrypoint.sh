#!/bin/sh
set -e

echo "Running Prisma db push..."
node /app/node_modules/prisma/build/index.js db push --skip-generate

echo "Starting server..."
exec node server.js
