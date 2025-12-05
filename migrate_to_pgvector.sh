#!/bin/bash
# Helper script for migrating to Railway's pgvector PostgreSQL
# ⚠️ IMPORTANT: This exports from your LOCAL Docker PostgreSQL (which has ~9000 posts)

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🚀 Railway pgvector Migration Helper"
echo "======================================"
echo ""
echo "⚠️  IMPORTANT: This script exports from your LOCAL database"
echo "   Your LOCAL Docker PostgreSQL has:"
echo "   - redcube_content: 9,058 scraped_posts + 11,900 total rows ✅ MUST EXPORT"
echo "   - redcube_users: 10 users ✅ SHOULD EXPORT"
echo "   - redcube_interviews: Empty (optional)"
echo "   - redcube_notifications: Empty (optional)"
echo ""
read -p "Press Enter to continue (or Ctrl+C to exit)..."

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo ""
    echo "❌ Docker is not running!"
    exit 1
fi

# Check if postgres container is running
if ! docker ps | grep -q postgres; then
    echo ""
    echo "⚠️  Starting postgres container..."
    docker-compose up -d postgres
    sleep 5
fi

# Default connection (from docker-compose.yml)
LOCAL_PGHOST=localhost
LOCAL_PGPORT=5432
LOCAL_PGUSER=postgres
LOCAL_PGPASSWORD=postgres

echo ""
echo "📝 Using LOCAL PostgreSQL connection:"
echo "   Host: $LOCAL_PGHOST"
echo "   Port: $LOCAL_PGPORT"
echo "   User: $LOCAL_PGUSER"
echo ""

# Test connection and list databases
echo "🔍 Testing connection and listing databases..."
EXISTING_DBS=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d postgres -tAc "SELECT datname FROM pg_database WHERE datname LIKE 'redcube%' ORDER BY datname;" 2>&1)

if [ $? -ne 0 ] || [ -z "$EXISTING_DBS" ]; then
    echo "❌ Cannot connect or no databases found!"
    echo "   Error output: $EXISTING_DBS"
    exit 1
fi

echo "✅ Connection successful!"
echo "✅ Found databases:"
echo "$EXISTING_DBS" | sed 's/^/   - /'
echo ""

# Ask which databases to export
echo "📦 Which databases do you want to export?"
echo ""
read -p "Export all databases? [Y/n]: " EXPORT_ALL
EXPORT_ALL=${EXPORT_ALL:-Y}

if [[ "$EXPORT_ALL" =~ ^[Yy]$ ]]; then
    DATABASES=$(echo "$EXISTING_DBS" | tr '\n' ' ')
else
    echo ""
    echo "Select databases to export (space-separated numbers):"
    DB_ARRAY=($EXISTING_DBS)
    i=1
    for db in "${DB_ARRAY[@]}"; do
        echo "  $i) $db"
        ((i++))
    done
    read -p "Enter numbers (e.g., 1 2): " SELECTED
    
    DATABASES=()
    for num in $SELECTED; do
        idx=$((num - 1))
        if [ $idx -ge 0 ] && [ $idx -lt ${#DB_ARRAY[@]} ]; then
            DATABASES+=("${DB_ARRAY[$idx]}")
        fi
    done
fi

# Convert to array if it's a string
if [ -z "$DATABASES" ] || [ ${#DATABASES[@]} -eq 0 ]; then
    DATABASES=($EXISTING_DBS)
fi

echo ""
echo "📦 Exporting ${#DATABASES[@]} database(s) from LOCAL PostgreSQL..."
echo ""

for DB in "${DATABASES[@]}"; do
    if [ -z "$DB" ]; then
        continue
    fi
    
    echo "→ Exporting $DB..."
    
    # Export schema
    echo "  📄 Exporting schema..."
    PGPASSWORD=$LOCAL_PGPASSWORD pg_dump -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d "$DB" \
        --schema-only --no-owner --no-privileges \
        > "${DB}_schema.sql" 2>&1
    
    if [ $? -eq 0 ]; then
        FILE_SIZE=$(stat -f%z "${DB}_schema.sql" 2>/dev/null || stat -c%s "${DB}_schema.sql" 2>/dev/null || echo 0)
        if [ $FILE_SIZE -gt 100 ]; then
            FILE_SIZE_H=$(du -h "${DB}_schema.sql" | cut -f1)
            echo "     ✅ Schema: ${DB}_schema.sql ($FILE_SIZE_H)"
        else
            echo "     ⚠️  Schema file is very small or empty"
        fi
    else
        echo "     ❌ Schema export failed"
        tail -3 "${DB}_schema.sql" 2>/dev/null
    fi
    
    # Export data
    echo "  💾 Exporting data..."
    PGPASSWORD=$LOCAL_PGPASSWORD pg_dump -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d "$DB" \
        --data-only --no-owner --no-privileges \
        > "${DB}_data.sql" 2>&1
    
    if [ $? -eq 0 ]; then
        FILE_SIZE=$(stat -f%z "${DB}_data.sql" 2>/dev/null || stat -c%s "${DB}_data.sql" 2>/dev/null || echo 0)
        if [ $FILE_SIZE -gt 100 ]; then
            FILE_SIZE_H=$(du -h "${DB}_data.sql" | cut -f1)
            echo "     ✅ Data: ${DB}_data.sql ($FILE_SIZE_H)"
        else
            echo "     ⚠️  Data file is very small (database might be empty)"
        fi
    else
        echo "     ❌ Data export failed"
        tail -3 "${DB}_data.sql" 2>/dev/null
    fi
    
    echo ""
done

echo "✅ Export complete!"
echo ""
echo "📋 Files created:"
ls -lh *_schema.sql *_data.sql 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
echo ""
