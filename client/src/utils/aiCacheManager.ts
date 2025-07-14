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
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private static readonly CACHE_KEY_PREFIX = "ai-cache-";
  private static readonly INSIGHTS_KEY = "ai-insights";
  private static readonly ANALYSIS_KEY = "ai-analysis";
  private static readonly CACHE_VERSION = "v2.1"; // Increment when prompts change

  private constructor() {}

  static getInstance(): AICacheManager {
    if (!AICacheManager.instance) {
      AICacheManager.instance = new AICacheManager();
    }
    return AICacheManager.instance;
  }

  /**
   * Generate a simple hash of quiz data for cache key
   */
  private generateQuizDataHash(quizData: QuizData): string {
    const key = JSON.stringify({
      version: AICacheManager.CACHE_VERSION, // Include version in hash
      mainMotivation: quizData.mainMotivation,
      successIncomeGoal: quizData.successIncomeGoal,
      weeklyTimeCommitment: quizData.weeklyTimeCommitment,
      techSkillsRating: quizData.techSkillsRating,
      riskComfortLevel: quizData.riskComfortLevel,
      workStructurePreference: quizData.workStructurePreference,
      decisionMakingStyle: quizData.decisionMakingStyle,
      // Add other key fields that affect AI analysis
    });
    return btoa(key).substring(0, 16); // Simple hash
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    // Check if cache has been force reset
    const resetTimestamp = localStorage.getItem("ai-cache-reset-timestamp");
    if (resetTimestamp && parseInt(resetTimestamp) > timestamp) {
      return false; // Cache was reset after this item was cached
    }

    return Date.now() - timestamp < AICacheManager.CACHE_DURATION;
  }

  /**
   * Get cached AI insights and analysis
   */
  getCachedAIContent(quizData: QuizData): {
    insights: AIInsights | null;
    analysis: AIAnalysis | null;
    topPath: BusinessPath | null;
  } {
    try {
      const quizHash = this.generateQuizDataHash(quizData);
      const cachedData = localStorage.getItem(
        `${AICacheManager.CACHE_KEY_PREFIX}${quizHash}`,
      );

      if (!cachedData) {
        return { insights: null, analysis: null, topPath: null };
      }

      const parsedData: CachedAIData = JSON.parse(cachedData);

      // Check if cache is valid and quiz data hasn't changed
      if (
        parsedData.quizDataHash === quizHash &&
        this.isCacheValid(parsedData.timestamp)
      ) {
        console.log("Using cached AI content");
        return {
          insights: parsedData.insights,
          analysis: parsedData.analysis,
          topPath: parsedData.topPath,
        };
      }

      // Cache is invalid or expired, remove it
      this.clearCacheForQuiz(quizData);
      return { insights: null, analysis: null, topPath: null };
    } catch (error) {
      console.error("Error retrieving cached AI content:", error);
      return { insights: null, analysis: null, topPath: null };
    }
  }

  /**
   * Cache AI insights and analysis
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

      localStorage.setItem(
        `${AICacheManager.CACHE_KEY_PREFIX}${quizHash}`,
        JSON.stringify(cacheData),
      );
      console.log("AI content cached successfully");
    } catch (error) {
      console.error("Error caching AI content:", error);
    }
  }

  /**
   * Get cached business model analysis (existing functionality)
   */
  getCachedBusinessAnalysis(businessId: string): AIAnalysis | null {
    try {
      const cachedAnalysis = localStorage.getItem(`ai-analysis-${businessId}`);
      if (cachedAnalysis) {
        return JSON.parse(cachedAnalysis);
      }
      return null;
    } catch (error) {
      console.error("Error retrieving cached business analysis:", error);
      return null;
    }
  }

  /**
   * Cache business model analysis (existing functionality)
   */
  cacheBusinessAnalysis(businessId: string, analysis: AIAnalysis): void {
    try {
      localStorage.setItem(
        `ai-analysis-${businessId}`,
        JSON.stringify(analysis),
      );
      console.log(`Business analysis cached for ${businessId}`);
    } catch (error) {
      console.error("Error caching business analysis:", error);
    }
  }

  /**
   * Get cached skills analysis
   */
  getCachedSkillsAnalysis(businessId: string): any | null {
    try {
      const cachedSkills = localStorage.getItem(
        `skills-analysis-${businessId}`,
      );
      if (cachedSkills) {
        return JSON.parse(cachedSkills);
      }
      return null;
    } catch (error) {
      console.error("Error retrieving cached skills analysis:", error);
      return null;
    }
  }

  /**
   * Cache skills analysis
   */
  cacheSkillsAnalysis(businessId: string, skillsAnalysis: any): void {
    try {
      localStorage.setItem(
        `skills-analysis-${businessId}`,
        JSON.stringify(skillsAnalysis),
      );
      console.log(`Skills analysis cached for ${businessId}`);
    } catch (error) {
      console.error("Error caching skills analysis:", error);
    }
  }

  /**
   * Clear cache for specific quiz data
   */
  clearCacheForQuiz(quizData: QuizData): void {
    try {
      const quizHash = this.generateQuizDataHash(quizData);
      localStorage.removeItem(`${AICacheManager.CACHE_KEY_PREFIX}${quizHash}`);
      console.log("Quiz-specific cache cleared");
    } catch (error) {
      console.error("Error clearing quiz cache:", error);
    }
  }

  /**
   * Clear all AI caches
   */
  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (
          key.startsWith(AICacheManager.CACHE_KEY_PREFIX) ||
          key.startsWith("ai-analysis-") ||
          key.startsWith("skills-analysis-")
        ) {
          localStorage.removeItem(key);
        }
      });
      console.log("All AI caches cleared");
    } catch (error) {
      console.error("Error clearing all caches:", error);
    }
  }

  /**
   * Force clear cache and restart with fresh API responses
   */
  forceResetCache(): void {
    this.clearAllCache();
    // Add a timestamp to force fresh responses
    localStorage.setItem("ai-cache-reset-timestamp", Date.now().toString());
    console.log("AI cache force reset - all responses will be fresh");
  }

  /**
   * Get cache status information
   */
  getCacheStatus(): {
    totalCacheSize: number;
    cacheCount: number;
    oldestCache: number | null;
  } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(
        (key) =>
          key.startsWith(AICacheManager.CACHE_KEY_PREFIX) ||
          key.startsWith("ai-analysis-") ||
          key.startsWith("skills-analysis-"),
      );

      let totalSize = 0;
      let oldestTimestamp: number | null = null;

      cacheKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          try {
            const parsed = JSON.parse(value);
            if (parsed.timestamp) {
              if (!oldestTimestamp || parsed.timestamp < oldestTimestamp) {
                oldestTimestamp = parsed.timestamp;
              }
            }
          } catch (e) {
            // Ignore parsing errors for cache status
          }
        }
      });

      return {
        totalCacheSize: totalSize,
        cacheCount: cacheKeys.length,
        oldestCache: oldestTimestamp,
      };
    } catch (error) {
      console.error("Error getting cache status:", error);
      return {
        totalCacheSize: 0,
        cacheCount: 0,
        oldestCache: null,
      };
    }
  }
}

export const aiCacheManager = AICacheManager.getInstance();
