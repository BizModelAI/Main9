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
  static getInstance(): AICacheManager {
    if (!AICacheManager.instance) {
      AICacheManager.instance = new AICacheManager();
    }
    return AICacheManager.instance;
  }
  private static instance: AICacheManager;

  // Store AI content for a quiz attempt
  cacheAIContent(quizAttemptId: number | string, data: {
    resultsInsights?: any;
    fullReport?: any;
  }) {
    const key = `ai-content-${quizAttemptId}`;
    const existing = this.getCachedAIContent(quizAttemptId) || {};
    const toStore = {
      ...existing,
      ...data,
      timestamp: Date.now(),
      synced: existing.synced || false,
    };
    localStorage.setItem(key, JSON.stringify(toStore));
  }

  // Retrieve cached AI content for a quiz attempt
  getCachedAIContent(quizAttemptId: number | string) {
    const key = `ai-content-${quizAttemptId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Mark a quiz attempt's AI content as synced to backend
  markAsSynced(quizAttemptId: number | string) {
    const key = `ai-content-${quizAttemptId}`;
    const cached = this.getCachedAIContent(quizAttemptId);
    if (cached) {
      cached.synced = true;
      localStorage.setItem(key, JSON.stringify(cached));
    }
  }

  // Get all cached AI content that hasn't been synced
  getAllUnsyncedContent() {
    const unsynced: Array<{ quizAttemptId: string; data: any }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai-content-')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (!data.synced) {
              const quizAttemptId = key.replace('ai-content-', '');
              unsynced.push({ quizAttemptId, data });
            }
          } catch {}
        }
      }
    }
    return unsynced;
  }

  // Remove expired content (older than 1 hour for anonymous users)
  cleanupExpiredContent() {
    const now = Date.now();
    const EXPIRY_MS = 60 * 60 * 1000; // 1 hour
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai-content-')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (data.timestamp && now - data.timestamp > EXPIRY_MS && !data.synced) {
              localStorage.removeItem(key);
            }
          } catch {}
        }
      }
    }
  }

  // Add missing method stubs for compatibility
  forceResetCache() {
    // Forcibly clear all AI cache (dev/debug)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai-content-')) {
        localStorage.removeItem(key);
      }
    }
  }

  getCachedSkillsAnalysis(businessId: string) {
    // Stub: return null or implement as needed
    return null;
  }

  cacheSkillsAnalysis(businessId: string, skills: any) {
    // Stub: no-op or implement as needed
  }

  getCacheStatus() {
    // Stub: return a summary of cache keys
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai-content-')) {
        keys.push(key);
      }
    }
    return { count: keys.length, keys };
  }

  clearAllCache() {
    // Clear all AI-related cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai-content-')) {
        localStorage.removeItem(key);
      }
    }
  }
}

// Export singleton instance
export const aiCacheManager = AICacheManager.getInstance();
