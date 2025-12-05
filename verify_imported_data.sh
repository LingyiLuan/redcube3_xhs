#!/bin/bash
# Verify data was imported correctly to Railway pgvector

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

export PGHOST=gondola.proxy.rlwy.net
export PGPORT=25309
export PGUSER=postgres
export PGPASSWORD='zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i'

echo "🔍 Verifying imported data..."
echo ""

# Check redcube_content
echo "📊 redcube_content database:"
echo "   scraped_posts:"
psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_content -tAc "SELECT COUNT(*) FROM scraped_posts;" 2>&1 | sed 's/^/     /'
echo "   analysis_results:"
psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_content -tAc "SELECT COUNT(*) FROM analysis_results;" 2>&1 | sed 's/^/     /'
echo "   assistant_conversations:"
psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_content -tAc "SELECT COUNT(*) FROM assistant_conversations;" 2>&1 | sed 's/^/     /'

echo ""
echo "📊 redcube_users database:"
echo "   users:"
psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_users -tAc "SELECT COUNT(*) FROM users;" 2>&1 | sed 's/^/     /'

echo ""
echo "📊 redcube_interviews database:"
echo "   interviews:"
psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_interviews -tAc "SELECT COUNT(*) FROM interviews;" 2>&1 | sed 's/^/     /'

echo ""
echo "✅ Verification complete!"
