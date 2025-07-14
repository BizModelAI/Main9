import React from "react";
import { RefreshCw, Gift, CreditCard, Clock } from "lucide-react";
import { useQuizRetake } from "@/hooks/useQuizRetake";

interface QuizRetakeDashboardProps {
  userId: number;
  onRetakeQuiz: () => void;
}

export const QuizRetakeDashboard: React.FC<QuizRetakeDashboardProps> = ({
  userId,
  onRetakeQuiz,
}) => {
  const {
    retakeStatus,
    isLoading,
    canRetake,
    isFirstQuiz,
    hasAccessPass,
    quizRetakesRemaining,
    totalQuizRetakesUsed,
    attemptsCount,
    isGuestUser,
  } = useQuizRetake(userId);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!retakeStatus) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quiz Status
        </h3>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {attemptsCount} attempt{attemptsCount !== 1 ? "s" : ""} completed
          </span>
        </div>
      </div>

      {isGuestUser ? (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900 dark:text-green-100">
              Guest User
            </span>
          </div>
          <p className="text-green-800 dark:text-green-200">
            Unlimited free quiz attempts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Access Pass
              </span>
            </div>
            <p className="text-blue-800 dark:text-blue-200">
              {hasAccessPass ? "Active" : "Not purchased"}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900 dark:text-green-100">
                Retakes Available
              </span>
            </div>
            <p className="text-green-800 dark:text-green-200">
              {quizRetakesRemaining}/3 remaining
            </p>
          </div>
        </div>
      )}

      {!isGuestUser && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quiz Retakes Used
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {totalQuizRetakesUsed}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((totalQuizRetakesUsed / 6) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetakeQuiz}
          disabled={!canRetake}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] ${
            canRetake
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {isGuestUser
            ? "Retake Quiz (Free)"
            : isFirstQuiz
              ? "Take Quiz"
              : "Retake Quiz"}
        </button>

        {!canRetake && !isGuestUser && (
          <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-sm font-semibold">
            <CreditCard className="w-4 h-4" />
            {hasAccessPass ? "Purchase more retakes" : "Purchase access pass"}
          </div>
        )}
      </div>

      {!isFirstQuiz && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p className="mb-1">
              <strong>Pricing:</strong> Access Pass ($9.99) includes 3 retakes
            </p>
            <p>Additional retake bundles: $4.99 for 3 more attempts</p>
          </div>
        </div>
      )}
    </div>
  );
};
