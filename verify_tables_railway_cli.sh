#!/bin/bash
# Verify tables using Railway CLI (works even when port forwarding has issues)

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🔍 Verifying tables using Railway CLI..."
echo ""

# Check if tables exist using Railway CLI
echo "📋 Checking tables in redcube_content database:"
railway connect postgres --command "\c redcube_content; \dt" 2>&1

echo ""
echo "📊 Checking if scraped_posts table exists:"
railway connect postgres --command "\c redcube_content; SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraped_posts');" 2>&1

echo ""
echo "✅ If you see 'scraped_posts' in the table list above, tables were created!"
echo "❌ If the list is empty, tables weren't created."
