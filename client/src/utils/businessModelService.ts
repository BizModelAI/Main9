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
  private cache = new Map<
    string,
    { matches: BusinessModelMatch[]; timestamp: number }
  >();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static getInstance(): BusinessModelService {
    if (!BusinessModelService.instance) {
      BusinessModelService.instance = new BusinessModelService();
    }
    return BusinessModelService.instance;
  }

  clearCache(): void {
    console.log(" Clearing business model cache");
    this.cache.clear();
  }

  private getCacheKey(quizData: QuizData): string {
    // Create a stable cache key based on quiz data
    return JSON.stringify({
      mainMotivation: quizData.mainMotivation,
      selfMotivationLevel: quizData.selfMotivationLevel,
      weeklyTimeCommitment: quizData.weeklyTimeCommitment,
      upfrontInvestment: quizData.upfrontInvestment,
      riskComfortLevel: quizData.riskComfortLevel,
      techSkillsRating: quizData.techSkillsRating,
      familiarTools: quizData.familiarTools?.sort(),
      primaryMotivation: quizData.primaryMotivation || quizData.mainMotivation,
    });
  }

  /**
   * Get business model matches for quiz data with caching
   */
  getBusinessModelMatches(quizData: QuizData): BusinessModelMatch[] {
    const cacheKey = this.getCacheKey(quizData);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.matches;
    }

    const rawMatches = calculateAdvancedBusinessModelMatches(quizData);

    // Transform to consistent format
    const matches: BusinessModelMatch[] = rawMatches.map((match) => ({
      id: match.id,
      name: match.name,
      score: match.score,
      category: match.category,
      fitScore: match.score, // For backward compatibility
    }));

    // Cache the results
    this.cache.set(cacheKey, { matches, timestamp: now });

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
