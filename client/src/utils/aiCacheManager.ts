// AI Cache Manager - 1-hour cache for current session, cleared between new quiz attempts
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

interface CachedAIData {
  quizDataHash: string;
  timestamp: number;
  insights: AIInsights;
  analysis: AIAnalysis;
  topPath: BusinessPath;
}

export class AICacheManager {
  private static instance: AICacheManager;
  private static readonly CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
  private static readonly CACHE_KEY_PREFIX = "ai-cache-";
  private static readonly CACHE_VERSION = "v3.0"; // Updated for 1-hour session cache

  static getInstance(): AICacheManager {
    if (!AICacheManager.instance) {
      AICacheManager.instance = new AICacheManager();
    }
    return AICacheManager.instance;
  }

  /**
   * Generate a hash of quiz data for cache key
   */
  private generateQuizDataHash(quizData: QuizData): string {
    const key = JSON.stringify({
      version: AICacheManager.CACHE_VERSION,
      mainMotivation: quizData.mainMotivation,
      successIncomeGoal: quizData.successIncomeGoal,
      weeklyTimeCommitment: quizData.weeklyTimeCommitment,
      techSkillsRating: quizData.techSkillsRating,
      riskComfortLevel: quizData.riskComfortLevel,
      directCommunicationEnjoyment: quizData.directCommunicationEnjoyment,
      socialMediaInterest: quizData.socialMediaInterest,
    });
    return btoa(key).substring(0, 16);
  }

  /**
   * Check if cached data is still valid (within 1 hour)
   */
  private isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    const isWithinTimeLimit = now - timestamp < AICacheManager.CACHE_DURATION;

    // Check if cache has been force reset for new quiz
    const resetTimestamp = localStorage.getItem("ai-cache-reset-timestamp");
    const wasReset = resetTimestamp && parseInt(resetTimestamp) > timestamp;

    return isWithinTimeLimit && !wasReset;
  }

  /**
   * Get cached AI content if valid (for page refreshes within 1 hour)
   */
  getCachedAIContent(quizData: QuizData): {
    insights: AIInsights | null;
    analysis: AIAnalysis | null;
    topPath: BusinessPath | null;
  } {
    try {
      const quizHash = this.generateQuizDataHash(quizData);
      const cacheKey = `${AICacheManager.CACHE_KEY_PREFIX}${quizHash}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (!cachedData) {
        console.log("� No cached AI data found for this quiz");
        return { insights: null, analysis: null, topPath: null };
      }

      const parsedData: CachedAIData = JSON.parse(cachedData);

      // Check if cache is valid and quiz data matches
      if (
        parsedData.quizDataHash === quizHash &&
        this.isCacheValid(parsedData.timestamp)
      ) {
        console.log("✅ Using cached AI content (valid for 1 hour)");
        return {
          insights: parsedData.insights,
          analysis: parsedData.analysis,
          topPath: parsedData.topPath,
        };
      } else {
        console.log("� Cached AI data is stale (>1 hour), removing...");
        localStorage.removeItem(cacheKey);
        return { insights: null, analysis: null, topPath: null };
      }
    } catch (error) {
      console.error("❌ Error retrieving cached AI data:", error);
      return { insights: null, analysis: null, topPath: null };
    }
  }

  /**
   * Cache AI content for 1 hour (for page refreshes)
   */
  cacheAIContent(
    quizData: QuizData,
    insights: AIInsights,
    analysis: AIAnalysis,
    topPath: BusinessPath,
  ): void {
    try {
      const quizHash = this.generateQuizDataHash(quizData);
      const cacheData: CachedAIData = {
        quizDataHash: quizHash,
        timestamp: Date.now(),
        insights,
        analysis,
        topPath,
      };

      const cacheKey = `${AICacheManager.CACHE_KEY_PREFIX}${quizHash}`;
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log("� AI content cached for 1 hour (allows page refresh)");
    } catch (error) {
      console.error("❌ Error caching AI content:", error);
    }
  }

  /**
   * Clear all AI cache (called when starting a NEW quiz)
   */
  clearAllCache(): void {
    console.log("� Clearing all AI cache for new quiz session");

    // Set reset timestamp to invalidate existing caches
    localStorage.setItem("ai-cache-reset-timestamp", Date.now().toString());

    // Remove all cache keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("ai-cache-") ||
          key.startsWith("ai-analysis-") ||
          key.startsWith("skills-analysis-") ||
          key.startsWith("quiz-completion-ai-insights"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`� Removed ${keysToRemove.length} cache entries`);
  }

  /**
   * Force reset cache (called when starting a NEW quiz)
   */
  forceResetCache(): void {
    // Check if we've already reset cache recently (prevents double-reset in React StrictMode)
    const lastReset = localStorage.getItem("ai-cache-reset-timestamp");
    if (lastReset && Date.now() - parseInt(lastReset) < 3000) {
      // 3 second window
      console.log(
        "� AI cache already reset recently, skipping duplicate reset",
      );
      return;
    }

    console.log("� Force resetting AI cache for new quiz attempt");
    this.clearAllCache();
  }

  /**
   * Check if data is cached for current quiz
   */
  isCacheHit(quizData: QuizData): boolean {
    const cached = this.getCachedAIContent(quizData);
    return cached.insights !== null;
  }

  /**
   * Skills analysis caching (1-hour cache)
   */
  getCachedSkillsAnalysis(businessId: string): any | null {
    try {
      const cacheKey = `skills-analysis-${businessId}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const parsedData = JSON.parse(cached);

      // Check if cache is valid (1 hour)
      if (this.isCacheValid(parsedData.timestamp)) {
        console.log(`✅ Using cached skills analysis for ${businessId}`);
        return parsedData.skills;
      } else {
        console.log(
          `� Cached skills analysis for ${businessId} is stale, removing...`,
        );
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (error) {
      console.error("❌ Error retrieving cached skills analysis:", error);
      return null;
    }
  }

  /**
   * Cache skills analysis for 1 hour
   */
  cacheSkillsAnalysis(businessId: string, skills: any): void {
    try {
      const cacheKey = `skills-analysis-${businessId}`;
      const cacheData = {
        skills,
        timestamp: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`� Skills analysis cached for ${businessId} (1 hour)`);
    } catch (error) {
      console.error("❌ Error caching skills analysis:", error);
    }
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): any {
    const status = {
      cacheType: "1-hour session cache",
      duration: "1 hour",
      entries: [] as any[],
      totalSize: 0,
    };

    // Count all cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("ai-cache-") || key.startsWith("skills-analysis-"))
      ) {
        const value = localStorage.getItem(key);
        const size = value ? value.length : 0;
        status.entries.push({
          key,
          size,
          sizeKB: Math.round((size / 1024) * 100) / 100,
        });
        status.totalSize += size;
      }
    }

    status.totalSize = Math.round((status.totalSize / 1024) * 100) / 100; // KB
    return status;
  }
}

// Export singleton instance
export const aiCacheManager = AICacheManager.getInstance();
