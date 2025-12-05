#!/bin/bash
# Verify if tables were actually created in Railway PostgreSQL

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
export PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb

echo "🔍 Verifying if tables exist in redcube_content database..."
echo ""

# Check if tables exist
echo "📋 Listing all tables in redcube_content database:"
psql -h localhost -p 5432 -U postgres -d redcube_content -c "\dt" 2>&1

echo ""
echo "📊 Checking if scraped_posts table exists:"
psql -h localhost -p 5432 -U postgres -d redcube_content -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraped_posts');" 2>&1

echo ""
echo "✅ If you see 'scraped_posts' in the table list above, tables were created!"
echo "❌ If the list is empty, tables weren't created."
