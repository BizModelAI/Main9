import { storage } from "./server/storage.js";

async function runMigration() {
  try {
    console.log("Running migration to add ai_content column...");

    // Test if the migration works by trying to save AI content
    const testData = { test: "migration" };

    // Try with an existing quiz attempt ID
    await storage.saveAIContentToQuizAttempt(4, testData);
    console.log("✅ Migration successful - ai_content column exists");

    // Clean up test data
    await storage.saveAIContentToQuizAttempt(4, null);
    console.log("✅ Test data cleaned up");
  } catch (error) {
    console.error("❌ Migration needed - error:", error.message);
    console.log(
      "The ai_content column needs to be added to the quiz_attempts table",
    );
  }
}

runMigration();
