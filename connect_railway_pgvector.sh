#!/bin/bash
# Helper script to connect to Railway pgvector with psql in PATH

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🔌 Connecting to Railway pgvector PostgreSQL..."
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found in PATH"
    echo "   Trying to add PostgreSQL to PATH..."
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
    
    if ! command -v psql &> /dev/null; then
        echo "❌ Still not found. Please install PostgreSQL:"
        echo "   brew install postgresql@16"
        exit 1
    fi
fi

echo "✅ psql found: $(which psql)"
echo "   Version: $(psql --version)"
echo ""

# Connect using Railway CLI
echo "Connecting via Railway CLI..."
railway connect postgres
