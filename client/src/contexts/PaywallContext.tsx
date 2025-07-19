import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface PaywallContextType {
  hasUnlockedAnalysis: boolean;
  hasCompletedQuiz: boolean;
  setHasUnlockedAnalysis: (unlocked: boolean) => void;
  setHasCompletedQuiz: (completed: boolean) => void;
  isUnlocked: () => boolean;
  canAccessBusinessModel: (modelId?: string) => boolean;
  canAccessFullReport: () => boolean;
  hasMadeAnyPayment: () => boolean;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export const usePaywall = () => {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error("usePaywall must be used within a PaywallProvider");
  }
  return context;
};

interface PaywallProviderProps {
  children: React.ReactNode;
}

export const PaywallProvider: React.FC<PaywallProviderProps> = ({
  children,
}) => {
  const [hasUnlockedAnalysis, setHasUnlockedAnalysis] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const { user, getLatestQuizData, isLoading } = useAuth();

  const isDev = process.env.NODE_ENV === 'development';

  // Check user's quiz completion and payment status when user changes
  useEffect(() => {
    let isMounted = true;

    const checkUserStatus = async () => {
      if (!isMounted || isLoading) return;

      if (!user) {
        // For non-authenticated users, check localStorage for temporary state
        const unlocked = localStorage.getItem("hasUnlockedAnalysis") === "true";
        const completed = localStorage.getItem("hasCompletedQuiz") === "true";
        if (isMounted) {
          setHasUnlockedAnalysis(unlocked);
          setHasCompletedQuiz(completed);
        }
        return;
      }

      // For authenticated users, set reasonable defaults without API calls
      // Only fetch quiz data when actually needed (like accessing protected content)

      // For authenticated users, assume they have completed the quiz
      // This handles existing users and prevents access issues
      setHasCompletedQuiz(true);

      // Simplified: Check if user has any payment history
      const hasAnyPayment = localStorage.getItem("hasAnyPayment") === "true";
      const hasBusinessAccess = localStorage.getItem("hasBusinessAccess") === "true";
      const hasPaidDownload = localStorage.getItem("hasPaidDownload") === "true";
      
      // Grant access if user has any payment history
      const shouldUnlock = hasAnyPayment || hasBusinessAccess || hasPaidDownload;
      setHasUnlockedAnalysis(shouldUnlock);

      // Update localStorage for consistency
      localStorage.setItem("hasCompletedQuiz", "true");
      localStorage.setItem("hasUnlockedAnalysis", shouldUnlock.toString());
    };

    checkUserStatus();

    return () => {
      isMounted = false; // Cleanup function to prevent state updates after unmount
    };
  }, [user, isLoading, getLatestQuizData]);

  // Save state to localStorage when it changes (for non-authenticated users)
  useEffect(() => {
    if (!user) {
      localStorage.setItem(
        "hasUnlockedAnalysis",
        hasUnlockedAnalysis.toString(),
      );
    }
  }, [hasUnlockedAnalysis, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("hasCompletedQuiz", hasCompletedQuiz.toString());
    }
  }, [hasCompletedQuiz, user]);

  // Simplified access functions - all return true since access control is handled elsewhere
  const isUnlocked = () => true;
  const canAccessBusinessModel = () => true;
  const canAccessFullReport = () => true;
  const hasMadeAnyPayment = () => false;

  useEffect(() => {
    if (isDev) {
      setHasUnlockedAnalysis(true);
    }
  }, [isDev]);

  return (
    <PaywallContext.Provider
      value={{
        hasUnlockedAnalysis,
        hasCompletedQuiz,
        setHasUnlockedAnalysis,
        setHasCompletedQuiz,
        isUnlocked,
        canAccessBusinessModel,
        canAccessFullReport,
        hasMadeAnyPayment,
      }}
    >
      {children}
    </PaywallContext.Provider>
  );
};
