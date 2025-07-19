import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

interface ReportUnlockStatus {
  isUnlocked: boolean;
  paymentId: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useReportUnlock = (
  quizAttemptId: number | null,
): ReportUnlockStatus => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const checkUnlockStatus = async () => {
    if (!user || !quizAttemptId) {
      setIsLoading(false);
      return;
    }

    // In pure pay-per-report model, we need to check if this specific report is unlocked
    // No more global access pass concept

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/report-unlock-status/${user.id}/${quizAttemptId}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to check unlock status");
      }

      const data = await response.json();
      setIsUnlocked(data.isUnlocked);
      setPaymentId(data.paymentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsUnlocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the API call to avoid multiple rapid requests
  const debouncedCheckUnlockStatus = useCallback(
    debounce(checkUnlockStatus, 300),
    [user, quizAttemptId]
  );

  useEffect(() => {
    debouncedCheckUnlockStatus();
  }, [user, quizAttemptId, debouncedCheckUnlockStatus]);

  return {
    isUnlocked,
    paymentId,
    isLoading,
    error,
    refresh: checkUnlockStatus,
  };
};
