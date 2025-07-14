import { storage } from "./server/storage.js";

async function checkQuizData() {
  try {
    console.log("Checking quiz data storage...");
    const attempts = await storage.getQuizAttempts(5);
    console.log("Number of attempts for user 5:", attempts.length);

    if (attempts.length > 0) {
      const quizData = attempts[0].quizData;
      console.log("\nQuiz data structure for latest attempt:");
      console.log("Keys in quiz data:", Object.keys(quizData));
      console.log("\nSample of quiz data:");
      console.log("mainMotivation:", quizData.mainMotivation);
      console.log("techSkillsRating:", quizData.techSkillsRating);
      console.log("weeklyTimeCommitment:", quizData.weeklyTimeCommitment);
      console.log("familiarTools:", quizData.familiarTools);
      console.log("\nTotal fields stored:", Object.keys(quizData).length);

      // Check if individual answers are preserved
      console.log("\nChecking specific answers:");
      console.log("Risk comfort level:", quizData.riskComfortLevel);
      console.log("Learning preference:", quizData.learningPreference);
      console.log(
        "Work structure preference:",
        quizData.workStructurePreference,
      );
      console.log("Brand face comfort:", quizData.brandFaceComfort);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkQuizData();
