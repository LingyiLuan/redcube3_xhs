#!/bin/bash
# Create missing tables with full output (no filtering)

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
export PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb

echo "🔧 Creating missing tables in redcube_content database..."
echo "⚠️  Make sure 'railway connect postgres' is running in another terminal!"
echo ""

# Create scraped_posts table and other tables - show ALL output
echo "📦 Creating tables from 07-phase4-scraper-tables.sql..."
echo "----------------------------------------"
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/07-phase4-scraper-tables.sql 2>&1
echo "----------------------------------------"

echo ""
echo "📦 Creating additional tables from 08-phase5-enhanced-metadata.sql..."
echo "----------------------------------------"
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/08-phase5-enhanced-metadata.sql 2>&1
echo "----------------------------------------"

echo ""
echo "✅ Done! Check output above for any errors."
echo ""
echo "Now verify tables were created by running:"
echo "  railway connect postgres --command \"\\c redcube_content; \\dt\""
