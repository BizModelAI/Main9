// Simple test to verify the AI content endpoints work
console.log("Testing AI content flow...");

const testUserId = 5;
const testQuizAttemptId = 4;
const testAiContent = {
  insights: "Test AI insights",
  recommendations: "Test recommendations",
  timestamp: new Date().toISOString(),
};

async function testFlow() {
  try {
    // Test saving AI content
    console.log("Testing save AI content...");
    const saveResponse = await fetch(
      `http://localhost:8392/api/quiz-attempts/${testQuizAttemptId}/ai-content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "connect.sid=test", // This won't work without proper session
        },
        body: JSON.stringify({ aiContent: testAiContent }),
      },
    );

    console.log("Save response status:", saveResponse.status);

    if (saveResponse.ok) {
      console.log("✅ Save AI content successful");

      // Test retrieving AI content
      console.log("Testing get AI content...");
      const getResponse = await fetch(
        `http://localhost:8392/api/quiz-attempts/${testQuizAttemptId}/ai-content`,
        {
          headers: {
            Cookie: "connect.sid=test",
          },
        },
      );

      console.log("Get response status:", getResponse.status);
      if (getResponse.ok) {
        const data = await getResponse.json();
        console.log("✅ Get AI content successful:", data);
      } else {
        console.log("❌ Get AI content failed");
      }
    } else {
      console.log("❌ Save AI content failed");
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Since we can't actually run this as a script, let's just log the test plan
console.log("Test plan:");
console.log("1. User clicks on an eye icon in quiz history");
console.log("2. QuizAttemptHistory calls handleSelectQuiz");
console.log("3. Function fetches AI content from API");
console.log("4. Updates localStorage with quiz data and AI content");
console.log("5. Calls onQuizSelected callback");
console.log("6. Dashboard updates without page reload");
console.log("7. When new AI content is generated, it gets saved to database");
