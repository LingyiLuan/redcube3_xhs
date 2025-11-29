#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   METADATA BACKFILL - Starting Process                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Configuration:"
echo "   - Target: Posts with missing metadata (role_type, level, outcome, tech_stack, frameworks)"
echo "   - Expected: ~350-400 posts"
echo "   - Cost: ~$1.50"
echo "   - Time: ~15-20 minutes"
echo "   - Batch size: 30 posts per batch"
echo "   - Rate limit: 5 second delay between batches"
echo ""
echo "⚠️  Press Ctrl+C at any time to stop gracefully"
echo ""
echo "Starting in 3 seconds..."
sleep 3

# Copy the script into the container and run it
docker exec redcube3_xhs-content-service-1 sh -c '
cat > /tmp/runMetadataBackfill.js << "EOFSCRIPT"
require("dotenv").config();
const metadataBackfillService = require("./src/services/metadataBackfillService");

process.on("SIGINT", () => {
  console.log("\\n🛑 Gracefully stopping...");
  metadataBackfillService.stopBackfill();
});

metadataBackfillService.startBackfill()
  .then(() => {
    console.log("✅ Metadata backfill completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Metadata backfill failed:", error);
    process.exit(1);
  });
EOFSCRIPT

node /tmp/runMetadataBackfill.js
'

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Metadata backfill process finished!"
echo "════════════════════════════════════════════════════════════"
