#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   SENTIMENT ANALYSIS BACKFILL - Starting Process        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Configuration:"
echo "   - Target: ONLY relevant interview posts (is_relevant=true)"
echo "   - Expected: ~487 posts"
echo "   - Cost: ~\$0.63"
echo "   - Time: ~8-10 minutes"
echo "   - Batch size: 50 posts per batch"
echo "   - Rate limit: 5 second delay between batches"
echo ""
echo "⚠️  Press Ctrl+C at any time to stop gracefully"
echo ""
echo "Starting in 3 seconds..."
sleep 3

# Copy the script into the container and run it
docker exec redcube3_xhs-content-service-1 sh -c '
cat > /tmp/runBackfill.js << "EOFSCRIPT"
require("dotenv").config();
const sentimentBackfillService = require("./src/services/sentimentBackfillService");

process.on("SIGINT", () => {
  console.log("\n🛑 Gracefully stopping...");
  sentimentBackfillService.stopBackfill();
});

sentimentBackfillService.startBackfill()
  .then(() => {
    console.log("✅ Backfill completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  });
EOFSCRIPT

node /tmp/runBackfill.js
'

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Backfill process finished!"
echo "════════════════════════════════════════════════════════════"
