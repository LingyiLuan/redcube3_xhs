#!/bin/bash
# Create missing tables in redcube_content database

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
export PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb

echo "🔧 Creating missing tables in redcube_content database..."
echo ""

# Make sure railway connect postgres is running in another terminal
echo "⚠️  Make sure 'railway connect postgres' is running in another terminal!"
echo ""

# Create scraped_posts table and other tables
echo "📦 Creating tables from 07-phase4-scraper-tables.sql..."
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/07-phase4-scraper-tables.sql 2>&1 | grep -v "already exists" | grep -E "(CREATE|ERROR|NOTICE)" | head -20

echo ""
echo "📦 Creating additional tables..."
# Run other important migrations
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/08-phase5-enhanced-metadata.sql 2>&1 | grep -v "already exists" | grep -E "(CREATE|ALTER|ERROR)" | head -10

echo ""
echo "✅ Done! Tables should be created now."
