#!/bin/bash

# Database Migration Script for Railway PostgreSQL
# This script exports local database and provides instructions for importing to Railway

set -e

echo "🗄️  Railway Database Migration Script"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if postgres container is running
if ! docker ps | grep -q redcube_postgres; then
    echo "❌ Error: PostgreSQL container is not running"
    echo "Please start Docker containers: docker-compose up -d"
    exit 1
fi

# Create backup directory
BACKUP_DIR="railway-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Exporting databases..."
echo ""

# Export main database
echo "Exporting redcube_main..."
docker exec redcube_postgres pg_dump -U postgres -d redcube_main > "$BACKUP_DIR/redcube_main.sql"

# Export users database
echo "Exporting redcube_users..."
docker exec redcube_postgres pg_dump -U postgres -d redcube_users > "$BACKUP_DIR/redcube_users.sql"

# Export content database
echo "Exporting redcube_content..."
docker exec redcube_postgres pg_dump -U postgres -d redcube_content > "$BACKUP_DIR/redcube_content.sql"

# Export interviews database
echo "Exporting redcube_interviews..."
docker exec redcube_postgres pg_dump -U postgres -d redcube_interviews > "$BACKUP_DIR/redcube_interviews.sql"

# Export notifications database
echo "Exporting redcube_notifications..."
docker exec redcube_postgres pg_dump -U postgres -d redcube_notifications > "$BACKUP_DIR/redcube_notifications.sql"

echo ""
echo "✅ Database exports completed!"
echo ""
echo "📁 Backup files saved to: $BACKUP_DIR"
echo ""

# Get file sizes
echo "📊 Backup file sizes:"
ls -lh "$BACKUP_DIR"/*.sql | awk '{print "  " $9 ": " $5}'

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo ""
echo "1. Get Railway PostgreSQL connection string:"
echo "   - Go to Railway dashboard"
echo "   - Click on PostgreSQL service"
echo "   - Go to 'Variables' tab"
echo "   - Copy DATABASE_URL"
echo ""
echo "2. Import databases to Railway:"
echo "   psql \$DATABASE_URL < $BACKUP_DIR/redcube_main.sql"
echo "   psql \$DATABASE_URL < $BACKUP_DIR/redcube_users.sql"
echo "   psql \$DATABASE_URL < $BACKUP_DIR/redcube_content.sql"
echo "   psql \$DATABASE_URL < $BACKUP_DIR/redcube_interviews.sql"
echo "   psql \$DATABASE_URL < $BACKUP_DIR/redcube_notifications.sql"
echo ""
echo "   OR use Railway's database interface:"
echo "   - Go to PostgreSQL service → 'Data' tab"
echo "   - Click 'Import' and upload each .sql file"
echo ""
echo "3. Verify data:"
echo "   - Connect to Railway PostgreSQL"
echo "   - Run: SELECT COUNT(*) FROM users;"
echo "   - Run: SELECT COUNT(*) FROM posts;"
echo ""
echo "⚠️  Note: Railway uses a single PostgreSQL database."
echo "   You may need to merge databases or use schema prefixes."
echo ""

