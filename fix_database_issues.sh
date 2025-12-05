#!/bin/bash
# Fix database issues: credentials and missing tables

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
export PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb

echo "🔧 Fixing Database Issues..."
echo ""

# Step 1: Check if tables exist
echo "📋 Checking if tables exist in redcube_content..."
psql -h localhost -p 5432 -U postgres -d redcube_content -c "\dt" 2>&1 | head -20

echo ""
echo "📋 If tables don't exist, we'll create them..."
echo ""

# Step 2: Create scraped_posts table
echo "🔨 Creating scraped_posts table..."
psql -h localhost -p 5432 -U postgres -d redcube_content -f shared/database/init/07-phase4-scraper-tables.sql 2>&1 | grep -E "(CREATE|ERROR|already exists)" | head -10

echo ""
echo "✅ Done! Check the output above for any errors."
