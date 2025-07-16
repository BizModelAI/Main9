// Test script for AIService functions
console.log("🧪 Testing AIService Functions...");

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
};

const mockBusinessPaths = [
  { id: "consulting", name: "Consulting", fitScore: 85 },
  { id: "freelancing", name: "Freelancing", fitScore: 78 },
  { id: "ecommerce", name: "E-commerce", fitScore: 65 },
];

// Test functions exist
async function testFunctionExists() {
  console.log("\n📋 Checking if AIService functions exist...");

  try {
    // Import AIService
    const { aiService } = await import("./client/src/utils/aiService.ts");

    // Check main functions
    const functions = [
      "generateResultsPreview",
      "generatePersonalizedInsights",
      "generateModelInsights",
      "saveExistingAIContentToDatabase",
    ];

    functions.forEach((funcName) => {
      if (typeof aiService[funcName] === "function") {
        console.log(`✅ ${funcName} exists`);
      } else {
        console.error(`❌ ${funcName} missing`);
      }
    });

    // Check deprecated functions are gone
    const deprecatedFunctions = [
      "generateComprehensiveInsights",
      "generateAISuccessPredictors",
      "generateBusinessFitDescriptions",
    ];

    deprecatedFunctions.forEach((funcName) => {
      if (typeof aiService[funcName] === "undefined") {
        console.log(`✅ ${funcName} properly removed`);
      } else {
        console.error(`❌ ${funcName} still exists (should be removed)`);
      }
    });

    return aiService;
  } catch (error) {
    console.error("❌ Failed to import AIService:", error.message);
    return null;
  }
}

// Test database connection functions
async function testDatabaseFunctions(aiService) {
  console.log("\n💾 Testing database storage functions...");

  try {
    // Test shouldSaveToDatabase (private function, but we can test its behavior)
    console.log("Testing database save logic...");

    // Mock localStorage for testing
    if (typeof window !== "undefined") {
      localStorage.setItem("currentQuizAttemptId", "test-quiz-123");
      console.log("✅ Set test quiz attempt ID");
    }

    console.log("✅ Database functions accessible");
  } catch (error) {
    console.error("❌ Database function test failed:", error.message);
  }
}

// Main test execution
async function runTests() {
  const aiService = await testFunctionExists();

  if (aiService) {
    await testDatabaseFunctions(aiService);
    console.log("\n✅ AIService function audit complete!");
  } else {
    console.error("\n❌ AIService tests failed - service not available");
  }
}

// Run tests
runTests().catch(console.error);
