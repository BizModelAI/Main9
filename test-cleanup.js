// Test script to verify the AI service cleanup
import { aiService } from "./client/src/utils/aiService.ts";
import { businessModelService } from "./client/src/utils/businessModelService.ts";

console.log("Testing AI Service cleanup...");

// Test that deprecated methods are gone
try {
  if (typeof aiService.generateComprehensiveInsights === "function") {
    console.error(
      "❌ Deprecated method generateComprehensiveInsights still exists",
    );
  } else {
    console.log("✅ generateComprehensiveInsights successfully removed");
  }
} catch (e) {
  console.log("✅ generateComprehensiveInsights successfully removed");
}

try {
  if (typeof aiService.generateAISuccessPredictors === "function") {
    console.error(
      "❌ Deprecated method generateAISuccessPredictors still exists",
    );
  } else {
    console.log("✅ generateAISuccessPredictors successfully removed");
  }
} catch (e) {
  console.log("✅ generateAISuccessPredictors successfully removed");
}

try {
  if (typeof aiService.generateBusinessFitDescriptions === "function") {
    console.error(
      "❌ Deprecated method generateBusinessFitDescriptions still exists",
    );
  } else {
    console.log("✅ generateBusinessFitDescriptions successfully removed");
  }
} catch (e) {
  console.log("✅ generateBusinessFitDescriptions successfully removed");
}

// Test that current methods still exist
if (typeof aiService.generateResultsPreview === "function") {
  console.log("✅ generateResultsPreview method exists");
} else {
  console.error("❌ generateResultsPreview method missing");
}

if (typeof aiService.generatePersonalizedInsights === "function") {
  console.log("✅ generatePersonalizedInsights method exists");
} else {
  console.error("❌ generatePersonalizedInsights method missing");
}

if (typeof aiService.generateModelInsights === "function") {
  console.log("✅ generateModelInsights method exists");
} else {
  console.error("❌ generateModelInsights method missing");
}

// Test business model service
if (typeof businessModelService.getBusinessModelMatches === "function") {
  console.log("✅ BusinessModelService.getBusinessModelMatches method exists");
} else {
  console.error(
    "❌ BusinessModelService.getBusinessModelMatches method missing",
  );
}

console.log("Cleanup verification complete!");
