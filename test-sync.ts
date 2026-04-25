import { syncDatamartPlans } from "./src/lib/datamart-sync.ts";

async function testSync() {
  console.log("Testing DataMart sync...\n");
  try {
    const result = await syncDatamartPlans({ force: false });
    console.log("\nSync result:");
    console.log(`  Synced: ${result.syncedCount}`);
    console.log(`  Errors: ${result.errorCount}`);
    console.log(`  Price changes: ${result.priceChanges.length}`);
    if (result.errors.length > 0) {
      console.log("  Error details:");
      result.errors.forEach(e => console.log(`    - ${e}`));
    }
    console.log(`  Synced at: ${result.syncedAt}`);
  } catch (error) {
    console.error("Sync failed:", error);
  }
  process.exit(0);
}

testSync();
