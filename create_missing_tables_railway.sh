#!/bin/bash
# Create missing tables using Railway CLI (without pgvector)

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "🔧 Creating missing tables (analysis_results and interview_questions)..."
echo "⚠️  Note: pgvector extension not available on Railway, creating table without vector column"
echo ""

# Run the SQL file through Railway CLI
(echo "\c redcube_content"; cat CREATE_MISSING_TABLES_NO_VECTOR.sql) | railway connect postgres 2>&1 | grep -E "(CREATE|ALTER|ERROR|NOTICE|relation.*already exists)" | head -15

echo ""
echo "✅ Done! Now verify in Terminal 1:"
echo "  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('analysis_results', 'interview_questions');"
