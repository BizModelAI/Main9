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

            // For authenticated users, set reasonable defaults without API calls
      // Only fetch quiz data when actually needed (like accessing protected content)
      console.log("PaywallContext: Setting defaults for authenticated user:", user.email);

      // For authenticated users, assume they have completed the quiz
      // This handles existing users and prevents access issues
      setHasCompletedQuiz(true);

      // Don't auto-unlock analysis - let them pay per report
      setHasUnlockedAnalysis(false);

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