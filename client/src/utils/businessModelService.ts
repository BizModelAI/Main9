import { QuizData } from "../types";
import { calculateAdvancedBusinessModelMatches } from "./advancedScoringAlgorithm";

export interface BusinessModelMatch {
  id: string;
  name: string;
  score: number;
  category: string;
  description?: string;
  fitScore?: number; // For backward compatibility
}

/**
 * Centralized business model scoring service
 * Calculates business model matches once and caches results
 */
export class BusinessModelService {
  private static instance: BusinessModelService;

  static getInstance(): BusinessModelService {
    if (!BusinessModelService.instance) {
      BusinessModelService.instance = new BusinessModelService();
    }
    return BusinessModelService.instance;
  }

  /**
   * Get business model matches for quiz data
   * Always calculates fresh - no caching
   */
  getBusinessModelMatches(quizData: QuizData): BusinessModelMatch[] {
    // Always calculate fresh matches - no caching
    console.log("🔄 Calculating fresh business model matches (no cache)");
    const rawMatches = calculateAdvancedBusinessModelMatches(quizData);

    // Transform to consistent format
    const matches: BusinessModelMatch[] = rawMatches.map((match) => ({
      id: match.id,
      name: match.name,
      score: match.score,
      category: match.category,
      fitScore: match.score, // For backward compatibility
    }));

    console.log(
      `✅ Calculated fresh matches for ${matches.length} business models`,
    );

    return matches;
  }

  /**
   * Get top N business model matches
   */
  getTopMatches(quizData: QuizData, count: number = 3): BusinessModelMatch[] {
    const allMatches = this.getBusinessModelMatches(quizData);
    return allMatches.slice(0, count);
  }

  /**
   * Get bottom N business model matches (worst fits)
   */
  getBottomMatches(
    quizData: QuizData,
    count: number = 3,
  ): BusinessModelMatch[] {
    const allMatches = this.getBusinessModelMatches(quizData);
    return allMatches.slice(-count).reverse(); // Last N, reversed to show worst first
  }

  /**
   * Get matches by category
   */
  getMatchesByCategory(
    quizData: QuizData,
    category: string,
  ): BusinessModelMatch[] {
    const allMatches = this.getBusinessModelMatches(quizData);
    return allMatches.filter((match) => match.category === category);
  }

  /**
   * Find specific business model match
   */
  getBusinessModelMatch(
    quizData: QuizData,
    businessId: string,
  ): BusinessModelMatch | undefined {
    const allMatches = this.getBusinessModelMatches(quizData);
    return allMatches.find((match) => match.id === businessId);
  }
}

// Export singleton instance
export const businessModelService = BusinessModelService.getInstance();

// Backward compatibility exports
export { calculateAdvancedBusinessModelMatches } from "./advancedScoringAlgorithm";
