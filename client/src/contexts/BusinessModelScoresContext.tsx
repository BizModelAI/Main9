import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { QuizData } from "../types";
import {
  businessModelService,
  BusinessModelMatch,
} from "../utils/businessModelService";

interface BusinessModelScoresData {
  scores: BusinessModelMatch[];
  quizDataHash: string;
  timestamp: number;
  quizAttemptId?: number;
}

interface BusinessModelScoresContextType {
  scores: BusinessModelMatch[] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  calculateAndStoreScores: (
    quizData: QuizData,
    quizAttemptId?: number,
  ) => Promise<void>;
  clearScores: () => void;
  getTopMatches: (count: number) => BusinessModelMatch[];
  getBottomMatches: (count: number) => BusinessModelMatch[];
  getMatchById: (id: string) => BusinessModelMatch | undefined;

  // Metadata
  lastUpdated: number | null;
  quizAttemptId: number | null;
}

const BusinessModelScoresContext = createContext<
  BusinessModelScoresContextType | undefined
>(undefined);

// Generate a simple hash for quiz data to detect changes
function generateQuizDataHash(quizData: QuizData): string {
  return btoa(JSON.stringify(quizData)).slice(0, 16);
}

// Storage keys for localStorage
const STORAGE_KEYS = {
  SCORES: "businessModelScores",
  SCORES_TIMESTAMP: "businessModelScoresTimestamp",
  SCORES_EXPIRES: "businessModelScoresExpires",
};

interface BusinessModelScoresProviderProps {
  children: ReactNode;
}

export const BusinessModelScoresProvider: React.FC<
  BusinessModelScoresProviderProps
> = ({ children }) => {
  const [scores, setScores] = useState<BusinessModelMatch[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null);

  // Load scores from localStorage on mount
  useEffect(() => {
    loadScoresFromStorage();
  }, []);

  // Load scores from localStorage
  const loadScoresFromStorage = () => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.SCORES);
      const storedTimestamp = localStorage.getItem(
        STORAGE_KEYS.SCORES_TIMESTAMP,
      );
      const storedExpires = localStorage.getItem(STORAGE_KEYS.SCORES_EXPIRES);

      if (storedData && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp);
        const now = Date.now();

        // Check if scores have expired (1 hour for anonymous users)
        if (storedExpires) {
          const expiresAt = parseInt(storedExpires);
          if (now > expiresAt) {
            console.log(
              " Business model scores expired, clearing localStorage",
            );
            clearStoredScores();
            return;
          }
        }

        const scoresData: BusinessModelScoresData = JSON.parse(storedData);
        setScores(scoresData.scores);
        setLastUpdated(timestamp);
        setQuizAttemptId(scoresData.quizAttemptId || null);

        console.log(" Business model scores loaded from localStorage", {
          count: scoresData.scores.length,
          timestamp: new Date(timestamp),
          quizAttemptId: scoresData.quizAttemptId,
        });
      }
    } catch (error) {
      console.error(
        "❌ Error loading business model scores from localStorage:",
        error,
      );
      clearStoredScores();
    }
  };

  // Clear scores from storage
  const clearStoredScores = () => {
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.SCORES_TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.SCORES_EXPIRES);
  };

  // Calculate and store scores
  const calculateAndStoreScores = async (
    quizData: QuizData,
    attemptId?: number,
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(" Calculating business model scores for quiz data...");

      // Calculate scores using the sophisticated algorithm
      const calculatedScores =
        businessModelService.getBusinessModelMatches(quizData);

      const timestamp = Date.now();
      const quizDataHash = generateQuizDataHash(quizData);

      // Store in React state
      setScores(calculatedScores);
      setLastUpdated(timestamp);
      setQuizAttemptId(attemptId || null);

      // Store in localStorage with expiration for anonymous users
      const scoresData: BusinessModelScoresData = {
        scores: calculatedScores,
        quizDataHash,
        timestamp,
        quizAttemptId: attemptId,
      };

      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scoresData));
      localStorage.setItem(STORAGE_KEYS.SCORES_TIMESTAMP, timestamp.toString());

      // Set 1-hour expiration for anonymous users (will be overridden for authenticated users)
      const expiresAt = timestamp + 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEYS.SCORES_EXPIRES, expiresAt.toString());

      console.log("✅ Business model scores calculated and stored", {
        count: calculatedScores.length,
        topScore: calculatedScores[0]?.score,
        quizAttemptId: attemptId,
        expiresAt: new Date(expiresAt),
      });

      // Store in database if user is authenticated or provided email
      await saveScoresToDatabase(calculatedScores, quizData, attemptId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to calculate scores";
      console.error("❌ Error calculating business model scores:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Save scores to database (3-tier caching system)
  const saveScoresToDatabase = async (
    scores: BusinessModelMatch[],
    quizData: QuizData,
    attemptId?: number,
  ) => {
    try {
      // Check if user is authenticated
      const authResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      const userEmail = localStorage.getItem("userEmail");
      const shouldSaveToDatabase =
        authResponse.ok || (userEmail && userEmail !== "null");

      if (shouldSaveToDatabase && attemptId) {
        console.log(" Saving business model scores to database...");

        // Save scores as AI content
        const response = await fetch(
          `/api/quiz-attempts/${attemptId}/ai-content`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              contentType: "businessModelScores",
              content: {
                scores,
                timestamp: Date.now(),
                version: "1.0",
              },
            }),
          },
        );

        if (response.ok) {
          console.log("✅ Business model scores saved to database");
          // For authenticated users, remove localStorage expiration
          localStorage.removeItem(STORAGE_KEYS.SCORES_EXPIRES);
        } else {
          console.warn("⚠️ Failed to save business model scores to database");
        }
      } else {
        console.log(
          " Anonymous user - business model scores stored in localStorage only",
        );
      }
    } catch (error) {
      console.error(
        "❌ Error saving business model scores to database:",
        error,
      );
    }
  };

  // Clear all scores
  const clearScores = () => {
    setScores(null);
    setLastUpdated(null);
    setQuizAttemptId(null);
    setError(null);
    clearStoredScores();
    console.log(" Business model scores cleared");
  };

  // Get top N matches
  const getTopMatches = (count: number): BusinessModelMatch[] => {
    if (!scores) return [];
    return scores.slice(0, count);
  };

  // Get bottom N matches
  const getBottomMatches = (count: number): BusinessModelMatch[] => {
    if (!scores) return [];
    return scores.slice(-count).reverse(); // Reverse to get worst first
  };

  // Get match by ID
  const getMatchById = (id: string): BusinessModelMatch | undefined => {
    if (!scores) return undefined;
    return scores.find((match) => match.id === id);
  };

  const contextValue: BusinessModelScoresContextType = {
    scores,
    isLoading,
    error,
    calculateAndStoreScores,
    clearScores,
    getTopMatches,
    getBottomMatches,
    getMatchById,
    lastUpdated,
    quizAttemptId,
  };

  return (
    <BusinessModelScoresContext.Provider value={contextValue}>
      {children}
    </BusinessModelScoresContext.Provider>
  );
};

// Hook to use business model scores
export const useBusinessModelScores = (): BusinessModelScoresContextType => {
  const context = useContext(BusinessModelScoresContext);
  if (context === undefined) {
    throw new Error(
      "useBusinessModelScores must be used within a BusinessModelScoresProvider",
    );
  }
  return context;
};

// Cleanup function for expired scores (called from App.tsx)
export const cleanupExpiredBusinessModelScores = () => {
  try {
    const storedExpires = localStorage.getItem(STORAGE_KEYS.SCORES_EXPIRES);
    if (storedExpires) {
      const expiresAt = parseInt(storedExpires);
      const now = Date.now();

      if (now > expiresAt) {
        console.log(" Cleaning up expired business model scores");
        localStorage.removeItem(STORAGE_KEYS.SCORES);
        localStorage.removeItem(STORAGE_KEYS.SCORES_TIMESTAMP);
        localStorage.removeItem(STORAGE_KEYS.SCORES_EXPIRES);
      }
    }
  } catch (error) {
    console.error("❌ Error cleaning up expired business model scores:", error);
  }
};
