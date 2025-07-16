// Debugging utilities for AI content system
export const debugAIContent = {
  // Test AI content endpoints
  async testEndpoints(quizAttemptId: number = 4) {
    console.log("� Testing AI Content Endpoints...");

    try {
      // Test getting AI content
      console.log("1. Testing GET endpoint...");
      const getResponse = await fetch(
        `/api/quiz-attempts/${quizAttemptId}/ai-content`,
        {
          credentials: "include",
        },
      );
      console.log("GET Response status:", getResponse.status);

      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log("✅ GET successful:", getData);
      } else {
        console.log("❌ GET failed:", await getResponse.text());
      }

      // Test saving AI content
      console.log("2. Testing POST endpoint...");
      const testData = {
        insights: "Test insights from debugger",
        timestamp: new Date().toISOString(),
        testMode: true,
      };

      const postResponse = await fetch(
        `/api/quiz-attempts/${quizAttemptId}/ai-content`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ aiContent: testData }),
        },
      );

      console.log("POST Response status:", postResponse.status);

      if (postResponse.ok) {
        const postData = await postResponse.json();
        console.log("✅ POST successful:", postData);

        // Verify by getting again
        console.log("3. Verifying saved data...");
        const verifyResponse = await fetch(
          `/api/quiz-attempts/${quizAttemptId}/ai-content`,
          {
            credentials: "include",
          },
        );
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log("✅ Verification successful:", verifyData);
        }
      } else {
        console.log("❌ POST failed:", await postResponse.text());
      }
    } catch (error) {
      console.error("� Test failed:", error);
    }
  },

  // Test quiz attempt switching
  async testQuizSwitching() {
    console.log("� Testing Quiz Attempt Switching...");

    // Get quiz attempts
    try {
      const response = await fetch("/api/quiz-attempts/5", {
        credentials: "include",
      });
      if (response.ok) {
        const attempts = await response.json();
        console.log("� Available attempts:", attempts.length);

        attempts.forEach((attempt: any, index: number) => {
          console.log(
            `  ${index + 1}. Attempt ${attempt.id} - ${new Date(attempt.completedAt).toLocaleDateString()}`,
          );
        });

        return attempts;
      } else {
        console.log("❌ Failed to get quiz attempts:", response.status);
      }
    } catch (error) {
      console.error("� Quiz switching test failed:", error);
    }
  },

  // Simulate clicking on a quiz attempt
  async simulateQuizAttemptClick(attemptId: number) {
    console.log(`� Simulating click on quiz attempt ${attemptId}...`);

    // This mimics what happens when user clicks on a quiz attempt
    try {
      // Get quiz attempts to find the one we want
      const response = await fetch("/api/quiz-attempts/5", {
        credentials: "include",
      });
      if (response.ok) {
        const attempts = await response.json();
        const attempt = attempts.find((a: any) => a.id === attemptId);

        if (attempt) {
          console.log("� Selected attempt:", attempt);

          // Store quiz data
          localStorage.setItem("quizData", JSON.stringify(attempt.quizData));
          localStorage.setItem("currentQuizAttemptId", attempt.id.toString());

          // Fetch AI content
          const aiResponse = await fetch(
            `/api/quiz-attempts/${attempt.id}/ai-content`,
            {
              credentials: "include",
            },
          );
          let aiContent = null;

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiContent = aiData.aiContent;

            if (aiContent) {
              localStorage.setItem(
                "loadedReportData",
                JSON.stringify(aiContent),
              );
              console.log("� AI content loaded and stored");
            } else {
              localStorage.removeItem("loadedReportData");
              console.log("�️ No AI content available");
            }
          } else {
            console.log("⚠️ AI content fetch failed:", aiResponse.status);
          }

          console.log("✅ Quiz attempt switch simulation complete");
          return { attempt, aiContent };
        } else {
          console.log("❌ Attempt not found");
        }
      }
    } catch (error) {
      console.error("� Simulation failed:", error);
    }
  },

  // Check current localStorage state
  checkLocalStorage() {
    console.log("� Current localStorage state:");
    const quizData = localStorage.getItem("quizData");
    const loadedReportData = localStorage.getItem("loadedReportData");
    const quizAttemptId = localStorage.getItem("currentQuizAttemptId");

    console.log("  quizData:", quizData ? "Present" : "Missing");
    console.log(
      "  loadedReportData:",
      loadedReportData ? "Present" : "Missing",
    );
    console.log("  currentQuizAttemptId:", quizAttemptId || "Missing");

    return {
      quizData: !!quizData,
      loadedReportData: !!loadedReportData,
      quizAttemptId,
    };
  },
};

// Make it available globally for browser console testing
(window as any).debugAIContent = debugAIContent;

export default debugAIContent;
