#!/bin/bash
# Connect to the correct pgvector service in Railway

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🔍 Checking Railway services..."
echo ""

# List all services
echo "Available services in your Railway project:"
railway status

echo ""
echo "📋 To connect to the CORRECT pgvector service:"
echo ""
echo "Option 1: Specify the service name"
echo "  railway connect postgres --service <pgvector-service-name>"
echo ""
echo "Option 2: Get connection details from Railway dashboard"
echo "  1. Click on pgvector service in Railway dashboard"
echo "  2. Go to Variables tab"
echo "  3. Copy PGHOST, PGPORT, PGUSER, PGPASSWORD"
echo "  4. Connect directly with psql:"
echo "     psql -h <PGHOST> -p <PGPORT> -U <PGUSER> -d railway"
echo ""
echo "Option 3: Check which service Railway CLI is connecting to"
echo "  railway connect postgres --help"
echo ""
