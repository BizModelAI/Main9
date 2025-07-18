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

      // Don't auto-unlock analysis - let them pay per report
      setHasUnlockedAnalysis(false);

      // Update localStorage for consistency
      localStorage.setItem("hasCompletedQuiz", "true");
      localStorage.setItem("hasUnlockedAnalysis", "false");
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

  const isUnlocked = () => {
    if (isDev) return true;
    return true; // Always return true for dev, and for prod, unlock logic is handled elsewhere
  };

  const canAccessBusinessModel = (modelId?: string) => {
    if (isDev) return true;
    return true; // Always return true for dev, and for prod, access logic is handled elsewhere
  };

  const canAccessFullReport = () => {
    if (isDev) return true;
    return true; // Always return true for dev, and for prod, unlock logic is handled elsewhere
  };

  const hasMadeAnyPayment = () => {
    // In pure pay-per-report model, we can't easily check this from client
    // For now, assume no global payment status
    return false;

    // For non-authenticated users, check localStorage flags
    const hasUnlocked = localStorage.getItem("hasUnlockedAnalysis") === "true";
    const hasBusinessAccess =
      localStorage.getItem("hasBusinessAccess") === "true";
    const hasPaidDownload = localStorage.getItem("hasPaidDownload") === "true";
    const hasAnyPayment = localStorage.getItem("hasAnyPayment") === "true";

    return hasUnlocked || hasBusinessAccess || hasPaidDownload || hasAnyPayment;
  };

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
