import React from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  Clock,
  Calendar,
  TrendingUp,
  Eye,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { QuizData } from "../types";
import { businessModelService } from "../utils/businessModelService";
import { useAuth } from "../contexts/AuthContext";
import { PaywallModal } from './PaywallModals';
import { PaymentAccountModal } from './PaymentAccountModal';

interface QuizAttempt {
  id: number;
  userId: number;
  quizData: QuizData;
  completedAt: string;
}

interface PaymentStatus {
  isUnlocked: boolean;
  paymentId: number | null;
}

interface QuizAttemptHistoryProps {
  userId: number;
  onQuizSelected?: (
    quizData: QuizData,
    aiContent?: any,
    completedAt?: string,
    isHistoricalView?: boolean,
  ) => void;
}

export const QuizAttemptHistory: React.FC<QuizAttemptHistoryProps> = ({
  userId,
  onQuizSelected,
}) => {
  console.log("QuizAttemptHistory: Rendered with userId:", userId);

  const { user } = useAuth();

  const {
    data: attempts = [],
    isLoading,
    error,
  } = useQuery<QuizAttempt[]>({
    queryKey: [`/api/quiz-attempts/${userId}`],
    enabled: !!userId,
  });

  // Check payment status for each attempt using useQueries
  const paymentStatusQueries = useQueries({
    queries: attempts.map((attempt) => ({
      queryKey: [`/api/report-unlock-status/${userId}/${attempt.id}`],
      enabled: !!userId && !!attempt.id,
      staleTime: 5 * 60 * 10, // 5 minutes
    })),
  });

  console.log("QuizAttemptHistory: Query state:", {
    userId,
    isLoading,
    error: error?.message || error,
    attemptsCount: attempts?.length || 0,
  });

  // Remove selectedAttemptId, loadingAttemptId, and click-to-activate logic
  const [showAllAttempts, setShowAllAttempts] = React.useState(false);
  const [showUnlockModal, setShowUnlockModal] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = React.useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quiz History
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error("QuizAttemptHistory: Error loading quiz attempts:", error);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quiz History
        </h3>
        <div className="text-center py-4">
          <p className="text-red-500 dark:text-red-400 mb-2 font-medium">
            Unable to load quiz history
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            UserId: {userId} | Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  const handleViewFullReport = async (attempt: QuizAttempt, isPaid: boolean) => {
    try {
      // Fetch AI content for this attempt
      const response = await fetch(
        `/api/quiz-attempts/${attempt.id}/ai-content`,
        {
          credentials: "include",
        },
      );
      let aiContent = null;
      if (response.ok) {
        const data = await response.json();
        aiContent = data.aiContent;
      }
      if (onQuizSelected) {
        // Pass isHistoricalView=true for all historical attempts (both paid and unpaid)
        onQuizSelected(attempt.quizData, aiContent, attempt.completedAt, true);
      }
    } catch (error) {
      console.error("Error loading full report:", error);
      alert("Failed to load full report for this quiz attempt.");
    }
  };

  const handlePurchaseFullReport = (attempt: QuizAttempt) => {
    setSelectedAttemptId(attempt.id);
    setShowUnlockModal(true);
  };

  const handlePaymentWithAccount = () => {
    setShowPaymentModal(true);
    setShowUnlockModal(false);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowUnlockModal(false);
    // Optionally, trigger a refetch or update payment status for this attempt
    // You might want to refetch the payment status queries here
  };

  // Since users can't create accounts without taking the quiz,
  // logged-in users should always have at least one quiz attempt.
  // If attempts is empty, it's likely a loading or error state.

  const getTopBusinessPath = (quizData: QuizData) => {
    try {
      // Use the BusinessModelService to get the top business model
      const matches = businessModelService.getBusinessModelMatches(quizData);
      if (matches && matches.length > 0) {
        return matches[0].name;
      }
    } catch (error) {
      console.error("Error calculating business matches:", error);
    }

    // Fallback to simple logic
    const motivations = quizData.mainMotivation || "";
    if (motivations.includes("financial")) return "Affiliate Marketing";
    if (motivations.includes("passion")) return "Content Creation";
    if (motivations.includes("freedom")) return "Freelancing";
    return "Digital Services";
  };

  const getIncomeGoal = (quizData: QuizData) => {
    const goal = quizData.successIncomeGoal;
    if (!goal) return "Not specified";
    if (goal < 1000) return `$${goal}/month`;
    if (goal < 10000) return `$${(goal / 1000).toFixed(1)}K/month`;
    return `$${(goal / 1000).toFixed(0)}K/month`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quiz History
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        className={`space-y-4 ${showAllAttempts ? "" : "max-h-96"} overflow-y-auto`}
      >
        {(showAllAttempts ? attempts : attempts.slice(0, 3)).map(
          (attempt: QuizAttempt, index: number) => {
            const paymentStatus = paymentStatusQueries[index]?.data;
            const isPaid = (paymentStatus as any)?.isUnlocked || false;
            const isLoadingPaymentStatus = paymentStatusQueries[index]?.isLoading;

            return (
              <div
                key={attempt.id}
                className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent"
              >
                {/* Attempt Number Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold relative ${
                      index === 0
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : "bg-gray-500"
                    }`}
                  >
                    {attempts.length - index}
                  </div>
                </div>

                {/* Attempt Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getTopBusinessPath(attempt.quizData)}
                    </p>
                    {index === 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Latest
                      </span>
                    )}
                    {isPaid && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Paid
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(attempt.completedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {isLoadingPaymentStatus ? (
                    <div className="px-4 py-2 rounded-xl bg-gray-200 text-gray-500 font-semibold text-sm">
                      <Loader2 className="w-4 animate-spin inline mr-1" />
                      Loading...
                    </div>
                  ) : isPaid ? (
                    <button
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all"
                      onClick={() => handleViewFullReport(attempt, true)}
                    >
                      View Full Report
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all"
                      onClick={() => handlePurchaseFullReport(attempt)}
                    >
                      Purchase Full Report
                    </button>
                  )}
                </div>
              </div>
            );
          },
        )}
      </div>

      {attempts.length > 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowAllAttempts(!showAllAttempts)}
            className="w-full flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <span>{showAllAttempts ? "Show Less" : "View All Attempts"}</span>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${showAllAttempts ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      )}
      {showUnlockModal && selectedAttemptId && (
        <PaywallModal
          isOpen={showUnlockModal}
          onClose={() => setShowUnlockModal(false)}
          onUnlock={handlePaymentWithAccount}
          type="full-report"
        />
      )}

      {/* Payment Account Modal - For handling actual payment */}
      <PaymentAccountModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        type="full-report"
        title="Historical Quiz Report"
      />
    </div>
  );
};
