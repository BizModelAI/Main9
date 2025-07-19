import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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

interface AIAnalysis {
  fullAnalysis: string;
  keyInsights: string[];
  personalizedRecommendations: string[];
  successPredictors: string[];
  riskFactors: string[];
}

interface AIInsightsData {
  insights: AIInsights;
  analysis: AIAnalysis;
  timestamp: number;
  quizAttemptId?: number;
}

interface AIInsightsContextType {
  aiInsights: AIInsightsData | null;
  setAIInsights: (data: AIInsightsData) => void;
  clearAIInsights: () => void;
  isLoading: boolean;
}

const AIInsightsContext = createContext<AIInsightsContextType | undefined>(undefined);

export const useAIInsights = () => {
  const context = useContext(AIInsightsContext);
  if (context === undefined) {
    throw new Error('useAIInsights must be used within an AIInsightsProvider');
  }
  return context;
};

interface AIInsightsProviderProps {
  children: ReactNode;
}

export const AIInsightsProvider: React.FC<AIInsightsProviderProps> = ({ children }) => {
  const [aiInsights, setAIInsightsState] = useState<AIInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load AI insights from localStorage on mount (for page refreshes)
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        console.log('AIInsightsContext: Loading from localStorage...');
        const stored = localStorage.getItem('ai-insights-data');
        console.log('AIInsightsContext: Stored data:', stored);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('AIInsightsContext: Parsed data:', parsed);
          
          // Add null/undefined check before accessing timestamp
          if (parsed && typeof parsed.timestamp === 'number') {
            // Check if data is still valid (1 hour for anonymous users)
            const isExpired = Date.now() - parsed.timestamp > 60 * 60 * 1000;
            console.log('AIInsightsContext: Data expired?', isExpired);
            
            if (!isExpired) {
              console.log('AIInsightsContext: Setting AI insights from localStorage');
              setAIInsightsState(parsed);
            } else {
              console.log('AIInsightsContext: Removing expired data');
              localStorage.removeItem('ai-insights-data');
            }
          } else {
            // Remove invalid or corrupted data
            console.log('AIInsightsContext: Removing invalid data');
            localStorage.removeItem('ai-insights-data');
          }
        } else {
          console.log('AIInsightsContext: No stored data found');
        }
      } catch (error) {
        console.error('Error loading AI insights from storage:', error);
      }
    };

    loadFromStorage();
  }, []);

  const setAIInsights = (data: AIInsightsData) => {
    console.log('AIInsightsContext: setAIInsights called with data:', data);
    setAIInsightsState(data);
    // Store in localStorage immediately
    try {
      localStorage.setItem('ai-insights-data', JSON.stringify(data));
      console.log('AIInsightsContext: Data stored in localStorage');
    } catch (error) {
      console.error('Error storing AI insights in localStorage:', error);
    }
    // Background sync to database based on user type
    syncToDatabase(data);
  };

  const syncToDatabase = async (data: AIInsightsData) => {
    if (!user) {
      // Anonymous user - only localStorage (1 hour)
      return;
    }
    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          insights: data.insights,
          analysis: data.analysis,
          quizAttemptId: data.quizAttemptId,
          userEmail: user.email,
          // Storage duration based on user type
          storageDuration: user.email ? '3months' : 'forever',
        }),
      });
      if (!response.ok) {
        console.error('Failed to sync AI insights to database');
      }
    } catch (error) {
      console.error('Error syncing AI insights to database:', error);
    }
  };

  const clearAIInsights = () => {
    setAIInsightsState(null);
    localStorage.removeItem('ai-insights-data');
  };

  const value: AIInsightsContextType = {
    aiInsights,
    setAIInsights,
    clearAIInsights,
    isLoading,
  };

  return (
    <AIInsightsContext.Provider value={value}>
      {children}
    </AIInsightsContext.Provider>
  );
}; 