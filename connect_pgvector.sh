#!/bin/bash
# Connect to Railway pgvector PostgreSQL

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Railway pgvector connection details
export PGHOST=gondola.proxy.rlwy.net
export PGPORT=25309
export PGUSER=postgres
export PGPASSWORD="zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i"

echo "🔌 Connecting to Railway pgvector PostgreSQL..."
echo "   Host: $PGHOST"
echo "   Port: $PGPORT"
echo ""

# Test connection
psql -h $PGHOST -p $PGPORT -U $PGUSER -d railway -c "SELECT version();" 2>&1 | head -3

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Connection successful!"
    echo ""
    echo "Now you can:"
    echo "  1. Connect interactively: psql -h $PGHOST -p $PGPORT -U $PGUSER -d railway"
    echo "  2. Test pgvector: CREATE EXTENSION IF NOT EXISTS vector;"
    echo ""
    echo "Or run this script with 'interactive' to connect:"
    echo "  ./connect_pgvector.sh interactive"
else
    echo "❌ Connection failed!"
    exit 1
fi

# If argument is "interactive", connect
if [ "$1" == "interactive" ]; then
    echo "Connecting interactively..."
    psql -h $PGHOST -p $PGPORT -U $PGUSER -d railway
fi
