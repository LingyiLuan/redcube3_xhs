#!/bin/bash
# Create tables by piping SQL file through Railway CLI

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🔧 Creating tables using Railway CLI..."
echo ""

# Read SQL file and pipe through Railway CLI
echo "📦 Creating tables from 07-phase4-scraper-tables.sql..."
cat shared/database/init/07-phase4-scraper-tables.sql | railway connect postgres

echo ""
echo "📦 Creating additional tables from 08-phase5-enhanced-metadata.sql..."
cat shared/database/init/08-phase5-enhanced-metadata.sql | railway connect postgres

echo ""
echo "✅ Done! Now verify tables:"
echo "  In Terminal 1 (where you're connected), type: \\dt"
