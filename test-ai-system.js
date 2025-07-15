// Test script to verify AI content system
import { storage } from "./server/storage.js";

async function testAIContentSystem() {
  console.log("🧪 Testing AI Content System...");

  try {
    // Test data
    const testQuizAttemptId = 4; // Assuming this exists
    const testAIContent = {
      insights: "Test AI insights for testing",
      recommendations: ["Test recommendation 1", "Test recommendation 2"],
      personalizedPaths: [
        { id: "content-creation", score: 85 },
        { id: "freelancing", score: 75 },
      ],
      timestamp: new Date().toISOString(),
    };

    console.log("1. Testing saveAIContentToQuizAttempt...");
    await storage.saveAIContentToQuizAttempt(testQuizAttemptId, testAIContent);
    console.log("✅ AI content saved successfully");

    console.log("2. Testing getAIContentForQuizAttempt...");
    const retrievedContent =
      await storage.getAIContentForQuizAttempt(testQuizAttemptId);
    console.log(
      "✅ AI content retrieved:",
      retrievedContent ? "Found" : "Not found",
    );

    if (retrievedContent) {
      console.log("📊 Retrieved content preview:", {
        hasInsights: !!retrievedContent.insights,
        hasRecommendations: !!retrievedContent.recommendations,
        timestamp: retrievedContent.timestamp,
      });
    }

    console.log("🎉 AI Content System test completed successfully!");
  } catch (error) {
    console.error("❌ AI Content System test failed:", error);

    // Check if it's a database column issue
    if (error.message && error.message.includes("ai_content")) {
      console.log(
        "💡 Hint: The ai_content column might not exist in the database yet",
      );
      console.log(
        "   Run the migration to add the column to quiz_attempts table",
      );
    }
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAIContentSystem();
}

export { testAIContentSystem };
