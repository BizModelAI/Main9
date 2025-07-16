// NO-OP AI Cache Manager - All caching disabled to force fresh data generation
import { QuizData, BusinessPath, AIAnalysis } from "../types";

interface AIInsights {
  personalizedSummary: string;
  customRecommendations: string[];
  potentialChallenges: string[];
  successStrategies: string[];
  personalizedActionPlan: {
    week1: string[];
    month1: string[];
    month3: string[];
    month6: string[];
  };
  motivationalMessage: string;
}

export class AICacheManager {
  private static instance: AICacheManager;

  static getInstance(): AICacheManager {
    if (!AICacheManager.instance) {
      AICacheManager.instance = new AICacheManager();
    }
    return AICacheManager.instance;
  }

  /**
   * CACHE DISABLED - Always returns null to force fresh data generation
   */
  getCachedAIContent(quizData: QuizData): {
    insights: AIInsights | null;
    analysis: AIAnalysis | null;
    topPath: BusinessPath | null;
  } {
    console.log(
      "🚫 AI Cache disabled - returning null to force fresh generation",
    );
    return { insights: null, analysis: null, topPath: null };
  }

  /**
   * CACHE DISABLED - Does nothing, all data goes directly to database
   */
  cacheAIContent(
    quizData: QuizData,
    insights: AIInsights,
    analysis: AIAnalysis,
    topPath: BusinessPath,
  ): void {
    console.log(
      "🚫 AI Cache disabled - not caching content, using database storage",
    );
    // All data goes directly to database via AIService
  }

  /**
   * CACHE DISABLED - No-op
   */
  clearAllCache(): void {
    console.log("🚫 AI Cache disabled - no cache to clear");
    // Clear any remaining localStorage cache keys for cleanup
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("ai-cache-") ||
          key.startsWith("ai-analysis-") ||
          key.startsWith("skills-analysis-"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * CACHE DISABLED - No-op
   */
  forceResetCache(): void {
    console.log("🚫 AI Cache disabled - clearing any remaining cache keys");
    this.clearAllCache();
  }

  /**
   * CACHE DISABLED - Always returns false to indicate cache miss
   */
  isCacheHit(quizData: QuizData): boolean {
    console.log("🚫 AI Cache disabled - always returning cache miss");
    return false;
  }
}
