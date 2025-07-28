#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Start all services in detached mode
echo "Starting Docker containers..."
docker-compose up -d

# Wait for the PostgreSQL container to be healthy
echo "Waiting for PostgreSQL to be ready..."
while ! docker-compose exec postgres pg_isready -U postgres; do
  sleep 1
done

# Create the database if it doesn't exist
echo "Creating database if it doesn't exist..."
docker-compose exec postgres psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'usersdotfun'" | grep -q 1 || \
docker-compose exec postgres createdb -U postgres usersdotfun

# Run database migrations
echo "Running database migrations..."
cd packages/shared-db && bun run db:migrate
