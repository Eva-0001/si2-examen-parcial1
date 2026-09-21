#!/bin/sh
set -e

node dist/database/run-migrations.js
node dist/database/seeds/seed.js

exec "$@"
