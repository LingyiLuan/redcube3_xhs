#!/bin/bash
# Import data to Railway pgvector PostgreSQL

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Railway pgvector connection details
export PGHOST=gondola.proxy.rlwy.net
export PGPORT=25309
export PGUSER=postgres
export PGPASSWORD='zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i'

echo "📦 Importing data to Railway pgvector PostgreSQL..."
echo ""

# Import redcube_content data (112MB - will take several minutes)
echo "📦 Importing redcube_content data (112MB - this will take several minutes)..."
psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_content -f redcube_content_data.sql

if [ $? -eq 0 ]; then
    echo "✅ redcube_content data imported successfully!"
else
    echo "❌ redcube_content data import failed!"
    exit 1
fi

echo ""
echo "📦 Importing redcube_users data..."
psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_users -f redcube_users_data.sql

if [ $? -eq 0 ]; then
    echo "✅ redcube_users data imported successfully!"
else
    echo "❌ redcube_users data import failed!"
    exit 1
fi

echo ""
echo "📦 Importing redcube_interviews data..."
psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_interviews -f redcube_interviews_data.sql

if [ $? -eq 0 ]; then
    echo "✅ redcube_interviews data imported successfully!"
else
    echo "❌ redcube_interviews data import failed!"
    exit 1
fi

echo ""
echo "✅ All data imported successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify data: psql -h $PGHOST -p $PGPORT -U $PGUSER -d redcube_content -c 'SELECT COUNT(*) FROM scraped_posts;'"
echo "  2. Update Railway environment variables"
echo "  3. Redeploy services"
