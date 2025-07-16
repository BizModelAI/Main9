// Business Model Results Storage Service
// Stores calculated business model matches in database for consistency and performance

import { QuizData } from "../types";
import { businessModelService } from "./businessModelService";

export interface StoredBusinessModelResults {
  quizAttemptId: string;
  results: Array<{
    id: string;
    name: string;
    score: number;
    category: string;
  }>;
  calculatedAt: string;
}

export class BusinessModelStorageService {
  private static instance: BusinessModelStorageService;

  static getInstance(): BusinessModelStorageService {
    if (!BusinessModelStorageService.instance) {
      BusinessModelStorageService.instance = new BusinessModelStorageService();
    }
    return BusinessModelStorageService.instance;
  }

  /**
   * Get business model results - from database first, calculate if needed
   */
  async getBusinessModelResults(quizData: QuizData): Promise<any[]> {
    try {
      // First, try to get from database
      const quizAttemptId = localStorage.getItem("currentQuizAttemptId");
      if (quizAttemptId) {
        const storedResults = await this.getStoredResults(quizAttemptId);
        if (storedResults) {
          console.log("✅ Using stored business model results from database");
          return storedResults.results;
        }
      }

      // Calculate fresh results if not in database
      console.log("🔄 Calculating fresh business model results");
      const freshResults =
        businessModelService.getBusinessModelMatches(quizData);

      // Store in database for future use
      if (quizAttemptId) {
        await this.storeResults(quizAttemptId, freshResults);
      }

      return freshResults;
    } catch (error) {
      console.error("❌ Error getting business model results:", error);
      // Fallback to fresh calculation
      return businessModelService.getBusinessModelMatches(quizData);
    }
  }

  /**
   * Store business model results in database
   */
  private async storeResults(
    quizAttemptId: string,
    results: any[],
  ): Promise<void> {
    try {
      console.log(
        `💾 Storing business model results for quiz attempt ${quizAttemptId}`,
      );

      const response = await fetch(
        `/api/quiz-attempts/${quizAttemptId}/business-model-results`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            results: results.map((r) => ({
              id: r.id,
              name: r.name,
              score: r.score,
              category: r.category,
            })),
            calculatedAt: new Date().toISOString(),
          }),
        },
      );

      if (response.ok) {
        console.log("✅ Business model results stored in database");
      } else {
        console.warn(
          "⚠️ Failed to store business model results, continuing with cache",
        );
      }
    } catch (error) {
      console.error("❌ Error storing business model results:", error);
      // Non-critical error - results still work from memory
    }
  }

  /**
   * Get stored business model results from database
   */
  private async getStoredResults(
    quizAttemptId: string,
  ): Promise<StoredBusinessModelResults | null> {
    try {
      const response = await fetch(
        `/api/quiz-attempts/${quizAttemptId}/business-model-results`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      } else if (response.status !== 404) {
        console.warn("⚠️ Failed to fetch stored business model results");
      }

      return null;
    } catch (error) {
      console.error("❌ Error fetching stored business model results:", error);
      return null;
    }
  }

  /**
   * Clear any cached results (called when starting new quiz)
   */
  clearCache(): void {
    console.log("🧹 Business model storage service cache cleared");
    // No cache to clear - everything goes to database
  }
}

// Export singleton instance
export const businessModelStorageService =
  BusinessModelStorageService.getInstance();
