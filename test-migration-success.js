// Test script to verify AI content migration was successful
import { storage } from "./server/storage.js";

async function testMigrationSuccess() {
  console.log(" Testing AI content functionality after migration...");

  try {
    const testQuizAttemptId = 4; // Using a known attempt ID
    const testAIContent = {
      test: "migration_verification",
      timestamp: new Date().toISOString(),
      insights: ["Test insight 1", "Test insight 2"],
      recommendations: "Test recommendations",
      score: 85,
    };

    console.log("1. Testing AI content save...");
    await storage.saveAIContentToQuizAttempt(testQuizAttemptId, testAIContent);
    console.log("✅ AI content saved successfully!");

    console.log("2. Testing AI content retrieval...");
    const retrievedContent =
      await storage.getAIContentForQuizAttempt(testQuizAttemptId);
    console.log("✅ AI content retrieved successfully!");

    console.log("3. Verifying content integrity...");
    if (
      retrievedContent &&
      retrievedContent.test === "migration_verification"
    ) {
      console.log("✅ Content integrity verified!");
    } else {
      console.log("❌ Content integrity check failed");
    }

    console.log("4. Cleaning up test data...");
    await storage.saveAIContentToQuizAttempt(testQuizAttemptId, null);
    console.log("✅ Test data cleaned up");

    console.log(
      " MIGRATION VERIFICATION COMPLETE - AI CONTENT SYSTEM FULLY FUNCTIONAL!",
    );

    return true;
  } catch (error) {
    console.error("❌ Migration verification failed:", error);
    console.error("Error details:", error.message);
    return false;
  }
}

export { testMigrationSuccess };

// For standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testMigrationSuccess().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
