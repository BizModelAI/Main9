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

      // For authenticated users, check their database records
      try {
        console.log("PaywallContext: Checking user status for:", user.email);

        // Check if user has completed quiz
        const quizData = await getLatestQuizData();

        if (!isMounted) return; // Component unmounted, don't update state

        const hasQuiz = !!quizData;
        console.log("PaywallContext: Quiz data found:", hasQuiz);

        // For authenticated users who have completed a quiz, give them access
        // This prevents blocking existing users who have already paid
        console.log(
          "PaywallContext: Authenticated user with quiz data - granting access",
        );
        setHasUnlockedAnalysis(hasQuiz);

        // For authenticated users, always assume they have completed the quiz
        // This handles existing users and prevents access issues
        console.log(
          "PaywallContext: User is authenticated - setting quiz as completed",
        );
        setHasCompletedQuiz(true);

        // Development mode bypass disabled to ensure paywall always works
        // if (import.meta.env.MODE === "development") {
        //   console.log(
        //     "PaywallContext: Development mode - also unlocking analysis",
        //   );
        //   setHasUnlockedAnalysis(true);
        // }

        // Update localStorage for consistency
        localStorage.setItem("hasCompletedQuiz", "true");
        localStorage.setItem("hasUnlockedAnalysis", "false");
      } catch (error) {
        if (isMounted) {
          console.error("PaywallContext: Error checking user status:", error);

          // For any errors with authenticated users, assume quiz is completed
          console.log(
            "PaywallContext: Error occurred but user is authenticated - setting quiz as completed",
          );
          setHasCompletedQuiz(true);

          // Development mode bypass disabled to ensure paywall always works
          // if (import.meta.env.MODE === "development") {
          //   console.log(
          //     "PaywallContext: Development mode - also unlocking analysis after error",
          //   );
          //   setHasUnlockedAnalysis(true);
          // }

          // Update localStorage for consistency
          localStorage.setItem("hasCompletedQuiz", "true");
          // Development mode bypass disabled
          // if (import.meta.env.MODE === "development") {
          //   localStorage.setItem("hasUnlockedAnalysis", "true");
          // }
        }
      }
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
    // In pure pay-per-report model, global unlock is not relevant
    return hasUnlockedAnalysis;
  };

  const canAccessBusinessModel = (modelId?: string) => {
    // Must have completed quiz to access any business model details
    if (!hasCompletedQuiz) return false;

    // In pure pay-per-report model, basic access is free
    // Users pay per specific report unlock
    return true;
  };

  const canAccessFullReport = () => {
    // In pure pay-per-report model, users must pay for each full report
    // Check if user has actually unlocked analysis (made payment)
    return hasUnlockedAnalysis;
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
