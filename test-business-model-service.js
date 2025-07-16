// Test script for BusinessModelService functions
console.log("🧪 Testing BusinessModelService Functions...");

// Test data
const mockQuizData = {
  mainMotivation: "financial_freedom",
  successIncomeGoal: "5000",
  weeklyTimeCommitment: "20_40_hours",
  techSkillsRating: 3,
  riskComfortLevel: 4,
  passionIdentityAlignment: 3,
  selfMotivation: 4,
  disciplineLevel: 3,
  creativityImportance: 4,
  leadershipInterest: 3,
  directCommunicationEnjoyment: 4,
  socialComfort: 3,
  feedbackResilience: 4,
  adaptabilityRating: 3,
  focusPreference: 3,
  workStructure: "flexible",
  collaborationStyle: "independent",
  decisionMakingStyle: "analytical",
  learningStyle: "self_directed",
  structurePreference: 3,
};

async function testBusinessModelService() {
  try {
    console.log("\n📋 Importing BusinessModelService...");
    const { businessModelService } = await import(
      "./client/src/utils/businessModelService.ts"
    );

    console.log("✅ BusinessModelService imported successfully");

    // Test core functions exist
    const functions = [
      "getBusinessModelMatches",
      "getTopMatches",
      "getBottomMatches",
      "getBusinessModelMatch",
      "clearCache",
      "getCacheStats",
    ];

    console.log("\n📋 Checking function availability...");
    functions.forEach((funcName) => {
      if (typeof businessModelService[funcName] === "function") {
        console.log(`✅ ${funcName} exists`);
      } else {
        console.error(`❌ ${funcName} missing`);
      }
    });

    // Test actual function calls
    console.log("\n🔄 Testing function execution...");

    try {
      // Test getBusinessModelMatches
      const allMatches =
        businessModelService.getBusinessModelMatches(mockQuizData);
      console.log(
        `✅ getBusinessModelMatches returned ${allMatches.length} matches`,
      );

      // Test getTopMatches
      const topMatches = businessModelService.getTopMatches(mockQuizData, 3);
      console.log(`✅ getTopMatches returned ${topMatches.length} top matches`);

      // Test getBottomMatches
      const bottomMatches = businessModelService.getBottomMatches(
        mockQuizData,
        3,
      );
      console.log(
        `✅ getBottomMatches returned ${bottomMatches.length} bottom matches`,
      );

      // Test getBusinessModelMatch
      if (allMatches.length > 0) {
        const firstMatch = businessModelService.getBusinessModelMatch(
          mockQuizData,
          allMatches[0].id,
        );
        console.log(
          `✅ getBusinessModelMatch found match: ${firstMatch?.name || "Not found"}`,
        );
      }

      // Test cache functions
      const cacheStats = businessModelService.getCacheStats();
      console.log(`✅ getCacheStats: ${cacheStats.size} cached entries`);

      businessModelService.clearCache();
      const emptyCacheStats = businessModelService.getCacheStats();
      console.log(`✅ clearCache: ${emptyCacheStats.size} entries after clear`);
    } catch (error) {
      console.error("❌ Function execution failed:", error.message);
    }

    console.log("\n✅ BusinessModelService tests complete!");
  } catch (error) {
    console.error("❌ BusinessModelService test failed:", error.message);
  }
}

// Run tests
testBusinessModelService().catch(console.error);
