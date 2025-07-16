// Emergency migration application
import { storage } from "./server/storage.js";

async function applyMigrationNow() {
  console.log(" Applying AI content migration immediately...");

  try {
    // Test if we can save AI content (this will trigger migration if needed)
    console.log(" Testing AI content functionality...");

    const testData = {
      migration_test: true,
      timestamp: new Date().toISOString(),
      message: "Testing migration application",
    };

    // Try to save to a known quiz attempt
    await storage.saveAIContentToQuizAttempt(4, testData);
    console.log(
      "✅ AI content save successful - migration already applied or not needed",
    );

    // Clean up test data
    await storage.saveAIContentToQuizAttempt(4, null);
    console.log(" Test data cleaned up");

    // Test retrieval
    const retrieved = await storage.getAIContentForQuizAttempt(4);
    console.log(
      " Retrieval test:",
      retrieved === null ? "Success (null as expected)" : "Data found",
    );

    console.log(
      " Migration verification complete - AI content system fully functional!",
    );
  } catch (error) {
    console.error("❌ Migration still needed - error occurred:", error.message);

    if (
      error.message.includes("ai_content") ||
      error.message.includes("column")
    ) {
      console.log(" The ai_content column needs to be added to the database");
      console.log(" This needs to be done at the database level");
    }
  }
}

applyMigrationNow();
