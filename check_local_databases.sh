#!/bin/bash
# Check what data exists in local databases before export

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🔍 Checking Local Databases - Data Inventory"
echo "============================================"
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop first"
    exit 1
fi

# Check if postgres container is running
if ! docker ps | grep -q postgres; then
    echo "⚠️  PostgreSQL container not found"
    echo "   Starting postgres container..."
    docker-compose up -d postgres
    sleep 5
fi

# Get local database connection
export LOCAL_PGHOST=localhost
export LOCAL_PGPORT=5432
export LOCAL_PGUSER=postgres
export LOCAL_PGPASSWORD=postgres

echo "📋 Checking databases..."
echo ""

# List all databases
echo "📦 All databases:"
PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d postgres -c "SELECT datname FROM pg_database WHERE datname NOT IN ('template0', 'template1', 'postgres') ORDER BY datname;" 2>&1

echo ""
echo "============================================"
echo ""

# Check each database
DATABASES=("redcube_content" "redcube_users" "redcube_interviews" "redcube_notifications")

for DB in "${DATABASES[@]}"; do
    echo "📊 Database: $DB"
    echo "----------------------------------------"
    
    # Check if database exists
    EXISTS=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB';" 2>&1)
    
    if [ "$EXISTS" != "1" ]; then
        echo "   ❌ Database does not exist"
        echo ""
        continue
    fi
    
    # Count tables
    TABLE_COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" 2>&1)
    echo "   Tables: $TABLE_COUNT"
    
    # List all tables
    TABLES=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;" 2>&1 | head -10)
    
    if [ -n "$TABLES" ]; then
        echo "   Table names:"
        echo "$TABLES" | sed 's/^/      - /'
        if [ "$TABLE_COUNT" -gt 10 ]; then
            echo "      ... and $((TABLE_COUNT - 10)) more"
        fi
    fi
    
    # Check specific important tables and row counts
    echo ""
    echo "   Row counts:"
    
    case $DB in
        "redcube_content")
            # Check scraped_posts
            COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM scraped_posts;" 2>&1)
            if [ "$COUNT" != "" ] && [ "$COUNT" != "0" ]; then
                echo "      scraped_posts: $COUNT rows"
            fi
            
            # Check analysis_results
            COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM analysis_results;" 2>&1)
            if [ "$COUNT" != "" ] && [ "$COUNT" != "0" ]; then
                echo "      analysis_results: $COUNT rows"
            fi
            
            # Check assistant_conversations
            COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM assistant_conversations;" 2>&1)
            if [ "$COUNT" != "" ] && [ "$COUNT" != "0" ]; then
                echo "      assistant_conversations: $COUNT rows"
            fi
            
            # Check user_workflows
            COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM user_workflows;" 2>&1)
            if [ "$COUNT" != "" ] && [ "$COUNT" != "0" ]; then
                echo "      user_workflows: $COUNT rows"
            fi
            ;;
            
        "redcube_users")
            # Check users
            COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM users;" 2>&1)
            if [ "$COUNT" != "" ] && [ "$COUNT" != "0" ]; then
                echo "      users: $COUNT rows"
            fi
            
            # Check user_profiles
            COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM user_profiles;" 2>&1)
            if [ "$COUNT" != "" ] && [ "$COUNT" != "0" ]; then
                echo "      user_profiles: $COUNT rows"
            fi
            ;;
            
        "redcube_interviews")
            # Check interviews
            COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM interviews;" 2>&1)
            if [ "$COUNT" != "" ] && [ "$COUNT" != "0" ]; then
                echo "      interviews: $COUNT rows"
            fi
            ;;
            
        "redcube_notifications")
            # Check notifications
            COUNT=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "SELECT COUNT(*) FROM notifications;" 2>&1)
            if [ "$COUNT" != "" ] && [ "$COUNT" != "0" ]; then
                echo "      notifications: $COUNT rows"
            fi
            ;;
    esac
    
    # Get total row count across all tables
    TOTAL_ROWS=$(PGPASSWORD=$LOCAL_PGPASSWORD psql -h $LOCAL_PGHOST -p $LOCAL_PGPORT -U $LOCAL_PGUSER -d $DB -tAc "
        SELECT SUM(n_live_tup) 
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public';
    " 2>&1)
    
    if [ "$TOTAL_ROWS" != "" ] && [ "$TOTAL_ROWS" != "0" ]; then
        echo "      TOTAL ROWS: $TOTAL_ROWS"
    else
        echo "      ⚠️  Database appears to be empty or stats not available"
    fi
    
    echo ""
done

echo "============================================"
echo ""
echo "✅ Check complete!"
echo ""
echo "📋 Summary:"
echo "   - Export redcube_content if it has data (scraped_posts, etc.)"
echo "   - Export redcube_users if it has data (users, user_profiles)"
echo "   - Export redcube_interviews if it has data (interviews)"
echo "   - Export redcube_notifications if it has data (notifications)"
echo ""
