import { QuizData } from "../types";
import { businessModelService } from "./businessModelService";

export const debugBusinessModelScoring = (quizData: QuizData) => {
  console.log("� Debug Business Model Scoring");
  console.log("Quiz Data:", {
    mainMotivation: quizData.mainMotivation,
    techSkillsRating: quizData.techSkillsRating,
    riskComfortLevel: quizData.riskComfortLevel,
    weeklyTimeCommitment: quizData.weeklyTimeCommitment,
  });

  // Clear cache first to ensure fresh calculation
  businessModelService.clearCache();

  // Get business model matches
  const matches = businessModelService.getBusinessModelMatches(quizData);

  console.log("� Top 5 Business Models:");
  matches.slice(0, 5).forEach((match, index) => {
    console.log(`${index + 1}. ${match.name} - ${match.score}%`);
  });

  console.log("� Top model for AI generation:", matches[0]);

  return matches;
};

// Make available globally in development
if (import.meta.env.DEV) {
  (window as any).debugBusinessModelScoring = debugBusinessModelScoring;
  console.log(
    "� Development mode: Run debugBusinessModelScoring(quizData) to test scoring",
  );
}
