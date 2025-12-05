#!/bin/bash
# Run database migrations for Railway PostgreSQL

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb

echo "🚀 Running migrations for Railway PostgreSQL..."
echo ""

# Run migrations for each database
# Note: Make sure railway connect postgres is running in another terminal

echo "📦 Running migrations for redcube_content..."
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/02-create-tables.sql 2>&1 | grep -v "does not exist" || true
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/07-phase4-scraper-tables.sql 2>&1 | grep -v "does not exist" || true
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/08-phase5-enhanced-metadata.sql 2>&1 | grep -v "does not exist" || true
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/09-phase6-pgvector-rag.sql 2>&1 | grep -v "does not exist" || true

echo ""
echo "📦 Running migrations for redcube_users..."
psql -h localhost -p 5432 -U postgres -d redcube_users -f shared/database/init/02-create-tables.sql 2>&1 | grep -v "does not exist" || true
psql -h localhost -p 5432 -U postgres -d redcube_users -f shared/database/init/04-phase3-auth-tables.sql 2>&1 | grep -v "does not exist" || true

echo ""
echo "📦 Running migrations for redcube_interviews..."
psql -h localhost -p 5432 -U postgres -d redcube_interviews -f shared/database/init/02-create-tables.sql 2>&1 | grep -v "does not exist" || true

echo ""
echo "📦 Running migrations for redcube_notifications..."
psql -h localhost -p 5432 -U postgres -d redcube_notifications -f shared/database/init/02-create-tables.sql 2>&1 | grep -v "does not exist" || true

echo ""
echo "✅ Migrations completed!"
