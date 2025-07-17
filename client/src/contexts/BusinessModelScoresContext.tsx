import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { QuizData } from "../types";
import { businessModelService } from "../utils/businessModelService";

export interface BusinessModelMatch {
  id: string;
  name: string;
  score: number;
  category: string;
  description?: string;
  fitScore?: number; // For backward compatibility
}

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
  calculateAndStoreScores: (quizData: QuizData, attemptId?: number) => Promise<void>;
  clearScores: () => void;
  getTopMatches: (count: number) => BusinessModelMatch[];
  getBottomMatches: (count: number) => BusinessModelMatch[];
  getMatchById: (id: string) => BusinessModelMatch | undefined;
  lastUpdated: number | null;
  quizAttemptId: number | null;
}

const BusinessModelScoresContext = createContext<BusinessModelScoresContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SCORES: "businessModelScores",
  SCORES_TIMESTAMP: "businessModelScoresTimestamp",
  SCORES_EXPIRES: "businessModelScoresExpires",
  QUIZ_DATA_HASH: "businessModelScoresQuizHash",
};

// Generate a hash of quiz data to detect changes
const generateQuizDataHash = (quizData: QuizData): string => {
  const relevantData = {
    mainMotivation: quizData.mainMotivation,
    techSkillsRating: quizData.techSkillsRating,
    riskComfortLevel: quizData.riskComfortLevel,
    weeklyTimeCommitment: quizData.weeklyTimeCommitment,
    selfMotivationLevel: quizData.selfMotivationLevel,
    communicationStyle: quizData.communicationStyle,
    workStylePreference: quizData.workStylePreference,
    onlinePresenceComfort: quizData.onlinePresenceComfort,
    clientCallsComfort: quizData.clientCallsComfort,
    physicalShippingOpenness: quizData.physicalShippingOpenness,
    socialMediaInterest: quizData.socialMediaInterest,
    ecosystemParticipation: quizData.ecosystemParticipation,
    existingAudience: quizData.existingAudience,
    promotingOthersOpenness: quizData.promotingOthersOpenness,
    teachVsSolvePreference: quizData.teachVsSolvePreference,
    meaningfulContributionImportance: quizData.meaningfulContributionImportance,
  };
  
  return btoa(JSON.stringify(relevantData)).slice(0, 16);
};

interface BusinessModelScoresProviderProps {
  children: ReactNode;
}

export const BusinessModelScoresProvider: React.FC<BusinessModelScoresProviderProps> = ({ children }) => {
  const [scores, setScores] = useState<BusinessModelMatch[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null);

  // Load scores from localStorage on mount
  useEffect(() => {
    const loadStoredScores = () => {
      try {
        const storedScores = localStorage.getItem(STORAGE_KEYS.SCORES);
        const storedTimestamp = localStorage.getItem(STORAGE_KEYS.SCORES_TIMESTAMP);
        const storedExpires = localStorage.getItem(STORAGE_KEYS.SCORES_EXPIRES);

        if (storedScores && storedTimestamp && storedExpires) {
          const timestamp = parseInt(storedTimestamp);
          const expiresAt = parseInt(storedExpires);
          const now = Date.now();

          // Check if scores are still valid
          if (now < expiresAt) {
            const scoresData: BusinessModelScoresData = JSON.parse(storedScores);
            setScores(scoresData.scores);
            setLastUpdated(scoresData.timestamp);
            setQuizAttemptId(scoresData.quizAttemptId || null);
            console.log('✅ Loaded cached business model scores from localStorage');
          } else {
            console.log('⏰ Cached business model scores expired, clearing...');
            clearStoredScores();
          }
        }
      } catch (error) {
        console.error('Error loading stored scores:', error);
        clearStoredScores();
      }
    };

    loadStoredScores();
  }, []);

  // Clear scores from storage
  const clearStoredScores = () => {
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.SCORES_TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.SCORES_EXPIRES);
  };

  // Calculate and store scores
  const calculateAndStoreScores = async (quizData: QuizData, attemptId?: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Calculating business model scores for quiz data...');

      // Calculate scores using the sophisticated algorithm
      const calculatedScores = businessModelService.getBusinessModelMatches(quizData);
      
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

      console.log('Business model scores calculated and stored', {
        count: calculatedScores.length,
        topScore: calculatedScores[0].score,
      });

      // Store in database if user is authenticated or provided email
      await saveScoresToDatabase(calculatedScores, quizData, attemptId);

    } catch (error) {
      console.error('❌ Error calculating business model scores:', error);
      setError('Failed to calculate business model scores');
    } finally {
      setIsLoading(false);
    }
  };

  // Save scores to database for authenticated users
  const saveScoresToDatabase = async (
    calculatedScores: BusinessModelMatch[],
    quizData: QuizData,
    attemptId?: number
  ): Promise<void> => {
    try {
      // This would save to database for authenticated users
      // For now, we'll just log it
      console.log('💾 Business model scores would be saved to database', {
        attemptId,
        scoresCount: calculatedScores.length,
      });
    } catch (error) {
      console.error('❌ Error saving business model scores to database:', error);
    }
  };

  // Clear all scores
  const clearScores = () => {
    setScores(null);
    setLastUpdated(null);
    setQuizAttemptId(null);
    setError(null);
    clearStoredScores();
    console.log('🗑️ Business model scores cleared');
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
    return scores.find(match => match.id === id);
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

export const useBusinessModelScores = (): BusinessModelScoresContextType => {
  const context = useContext(BusinessModelScoresContext);
  if (context === undefined) {
    throw new Error('useBusinessModelScores must be used within a BusinessModelScoresProvider');
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
