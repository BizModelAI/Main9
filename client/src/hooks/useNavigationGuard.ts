import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface NavigationGuardState {
  showSaveModal: boolean;
  pendingNavigation: string | null;
  hasPendingQuizResults: boolean;
}

export const useNavigationGuard = () => {
  const [guardState, setGuardState] = useState<NavigationGuardState>({
    showSaveModal: false,
    pendingNavigation: null,
    hasPendingQuizResults: false,
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has unsaved quiz results
  const checkPendingQuizResults = useCallback(() => {
    const quizData = localStorage.getItem("quizData");
    const hasCompletedQuiz =
      localStorage.getItem("hasCompletedQuiz") === "true";
    const hasUnlockedAnalysis =
      localStorage.getItem("hasUnlockedAnalysis") === "true";
    const currentQuizAttemptId = localStorage.getItem("currentQuizAttemptId");

    // For access pass users: check if they have unsaved quiz results that haven't been paid for
    // For non-access pass users: check if they have quiz data but haven't paid for access
    const hasPending = !!(
      quizData &&
      hasCompletedQuiz &&
      user &&
      // Users without unlocked analysis: need to pay for reports
      (!hasUnlockedAnalysis ||
        // Logged users: need to save quiz attempt and optionally pay for report unlock
        !currentQuizAttemptId)
    );

    setGuardState((prev) => ({
      ...prev,
      hasPendingQuizResults: hasPending,
    }));

    return hasPending;
  }, [user]);

  // Update pending status when dependencies change
  useEffect(() => {
    checkPendingQuizResults();
  }, [checkPendingQuizResults, location.pathname]);

  // Custom navigation function that checks for pending results
  const navigateWithGuard = useCallback(
    (path: string) => {
      // Don't guard navigation if already on results page or quiz pages
      const currentPath = location.pathname;
      if (
        currentPath === "/results" ||
        currentPath === "/quiz" ||
        currentPath === "/quiz-loading"
      ) {
        navigate(path);
        return;
      }

      // Check if user has pending quiz results
      if (checkPendingQuizResults()) {
        setGuardState((prev) => ({
          ...prev,
          showSaveModal: true,
          pendingNavigation: path,
        }));
      } else {
        navigate(path);
      }
    },
    [location.pathname, navigate, checkPendingQuizResults],
  );

  // Handle saving quiz results (pay now)
  const handleSaveResults = useCallback(() => {
    setGuardState((prev) => ({ ...prev, showSaveModal: false }));
    // Navigate to payment page or trigger payment modal
    // This will be handled by the component using this hook
  }, []);

  // Handle losing results (use previous quiz)
  const handleLoseResults = useCallback(async () => {
    try {
      // Clear current quiz data
      localStorage.removeItem("quizData");
      localStorage.removeItem("hasCompletedQuiz");
      localStorage.removeItem("currentQuizAttemptId");
      localStorage.removeItem("hasUnlockedAnalysis");

      // For logged-in users, try to load their latest PAID quiz attempt
      if (user) {
        try {
          const response = await fetch("/api/auth/latest-paid-quiz-data", {
            credentials: "include",
          });

          if (response.ok) {
            const latestPaidQuizData = await response.json();
            if (latestPaidQuizData.quizData) {
              localStorage.setItem(
                "quizData",
                JSON.stringify(latestPaidQuizData.quizData),
              );
              localStorage.setItem("hasCompletedQuiz", "true");
              // Set the quiz attempt ID
              if (latestPaidQuizData.quizAttemptId) {
                localStorage.setItem(
                  "currentQuizAttemptId",
                  latestPaidQuizData.quizAttemptId.toString(),
                );
              }
              // If this was a paid report unlock or access pass user, mark as unlocked
              if (latestPaidQuizData.isUnlocked) {
                localStorage.setItem("hasUnlockedAnalysis", "true");
              }
            }
          }
        } catch (error) {
          console.error("Error loading latest paid quiz data:", error);
        }
      }

      // Close modal and proceed with navigation
      const pendingPath = guardState.pendingNavigation;
      setGuardState({
        showSaveModal: false,
        pendingNavigation: null,
        hasPendingQuizResults: false,
      });

      if (pendingPath) {
        navigate(pendingPath);
      }
    } catch (error) {
      console.error("Error handling lose results:", error);
    }
  }, [user, guardState.pendingNavigation, navigate]);

  // Handle closing the modal without action
  const handleCloseModal = useCallback(() => {
    setGuardState((prev) => ({
      ...prev,
      showSaveModal: false,
      pendingNavigation: null,
    }));
  }, []);

  // Check on mount and when user changes
  useEffect(() => {
    checkPendingQuizResults();
  }, [checkPendingQuizResults]);

  return {
    showSaveModal: guardState.showSaveModal,
    hasPendingQuizResults: guardState.hasPendingQuizResults,
    navigateWithGuard,
    handleSaveResults,
    handleLoseResults,
    handleCloseModal,
  };
};
