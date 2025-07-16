import { QuizData, BusinessPath } from "../types";
import { businessPaths } from "../data/businessPaths";
import { apiPost } from "./apiClient";

// AI-powered business fit analysis
export async function generateAIPersonalizedPaths(
  data: QuizData,
): Promise<BusinessPath[]> {
  try {
    console.log("generateAIPersonalizedPaths: Making AI analysis request");

    // Use XMLHttpRequest to avoid FullStory interference with fetch
    const response = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/ai-business-fit-analysis", true);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.timeout = 40000; // 40 second timeout (server has 35s)

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            console.error(
              "generateAIPersonalizedPaths: Invalid JSON response",
              e,
            );
            reject(new Error("Invalid JSON response"));
          }
        } else if (xhr.status === 429) {
          console.error("generateAIPersonalizedPaths: Rate limited");
          reject(new Error("Rate limited - too many requests"));
        } else {
          console.error(
            `generateAIPersonalizedPaths: API error ${xhr.status}:`,
            xhr.responseText,
          );
          reject(new Error(`API error: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        console.error("generateAIPersonalizedPaths: Network error");
        reject(new Error("Network error"));
      };
      xhr.ontimeout = () => {
        console.error(
          "generateAIPersonalizedPaths: Request timeout after 40 seconds",
        );
        reject(new Error("Request timeout"));
      };

      xhr.send(JSON.stringify({ quizData: data }));
    });

    const analysis = response;

    // Convert the AI analysis to BusinessPath format
    return analysis.topMatches.map((match: any) => ({
      ...match.businessPath,
      aiAnalysis: match.analysis,
      fitScore: match.analysis.fitScore,
    }));
  } catch (error) {
    console.error("AI analysis failed, using fallback scoring:", error);
    return generatePersonalizedPaths(data);
  }
}

// MODERN SCORING: Use BusinessModelService with sophisticated shared/scoring.ts algorithm
import { businessModelService } from "./businessModelService";

// DEPRECATED: This function is replaced by BusinessModelService
export function calculateFitScore(pathId: string, data: QuizData): number {
  console.warn(
    "⚠️ calculateFitScore is deprecated. Use BusinessModelService.getInstance().getBusinessModelMatches() instead.",
  );

  // Fallback: Get score from BusinessModelService for backward compatibility
  try {
    const matches = businessModelService.getBusinessModelMatches(data);
    const match = matches.find((m) => m.id === pathId);
    return match ? match.score : 0;
  } catch (error) {
    console.error("Error getting score from BusinessModelService:", error);
    return 0;
  }
}

// DEPRECATED: Use BusinessModelService instead
export function generatePersonalizedPaths(data: QuizData): BusinessPath[] {
  console.warn(
    "⚠️ generatePersonalizedPaths is deprecated. Use BusinessModelService.getInstance().getBusinessModelMatches() instead.",
  );

  // Fallback: Convert BusinessModelService results to BusinessPath format
  try {
    const matches = businessModelService.getBusinessModelMatches(data);
    return matches.map((match) => {
      const businessPath = businessPaths.find((path) => path.id === match.id);
      return {
        ...businessPath!,
        fitScore: match.score,
      };
    });
  } catch (error) {
    console.error("Error getting paths from BusinessModelService:", error);
    return businessPaths.map((path) => ({ ...path, fitScore: 0 }));
  }
}

export function getNextAdaptiveQuestion(
  currentStep: number,
  data: Partial<QuizData>,
): boolean {
  // Logic to determine if adaptive questions should be shown

  if (
    currentStep === 4 &&
    data.upfrontInvestment &&
    data.upfrontInvestment > 500
  ) {
    return true; // Show inventory comfort question
  }

  if (
    currentStep === 12 &&
    (data.familiarTools?.includes("canva") ||
      (data.creativeWorkEnjoyment && data.creativeWorkEnjoyment >= 4))
  ) {
    return true; // Show digital content comfort question
  }

  return false;
}
