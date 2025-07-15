import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Calendar,
  TrendingUp,
  Eye,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { QuizData } from "../types";
import { calculateAllBusinessModelMatches } from "../utils/advancedScoringAlgorithm";

interface QuizAttempt {
  id: number;
  userId: number;
  quizData: QuizData;
  completedAt: string;
}

interface QuizAttemptHistoryProps {
  userId: number;
  onQuizSelected?: (quizData: QuizData) => void;
}

export const QuizAttemptHistory: React.FC<QuizAttemptHistoryProps> = ({
  userId,
  onQuizSelected,
}) => {
  console.log("QuizAttemptHistory: Rendered with userId:", userId);

  const {
    data: attempts = [],
    isLoading,
    error,
  } = useQuery<QuizAttempt[]>({
    queryKey: [`/api/quiz-attempts/${userId}`],
    enabled: !!userId,
  });

  console.log("QuizAttemptHistory: Query state:", {
    userId,
    isLoading,
    error: error?.message || error,
    attemptsCount: attempts?.length || 0,
  });

  const [selectedAttemptId, setSelectedAttemptId] = React.useState<
    number | null
  >(null);
  const [showAllAttempts, setShowAllAttempts] = React.useState(false);

  // Check if current localStorage quiz data matches any attempt
  React.useEffect(() => {
    const currentQuizData = localStorage.getItem("quizData");
    if (currentQuizData && attempts.length > 0) {
      try {
        const parsedCurrent = JSON.parse(currentQuizData);
        // Find if current quiz data matches any attempt
        const matchingAttempt = attempts.find(
          (attempt) =>
            JSON.stringify(attempt.quizData) === JSON.stringify(parsedCurrent),
        );
        if (matchingAttempt) {
          setSelectedAttemptId(matchingAttempt.id);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, [attempts]);

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

  const handleSelectQuiz = (attempt: QuizAttempt) => {
    // Store the selected quiz data in localStorage
    localStorage.setItem("quizData", JSON.stringify(attempt.quizData));
    setSelectedAttemptId(attempt.id);

    // Call the callback if provided
    if (onQuizSelected) {
      onQuizSelected(attempt.quizData);
    }

    // Refresh the page to update all components that rely on localStorage
    window.location.reload();
  };

  // Since users can't create accounts without taking the quiz,
  // logged-in users should always have at least one quiz attempt.
  // If attempts is empty, it's likely a loading or error state.

  const getTopBusinessPath = (quizData: QuizData) => {
    try {
      // Use the actual scoring algorithm to get the top business model
      const matches = calculateAllBusinessModelMatches(quizData);
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
            const isSelected = selectedAttemptId === attempt.id;
            return (
              <div
                key={attempt.id}
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700"
                    : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
                }`}
                onClick={() => handleSelectQuiz(attempt)}
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
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
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
                    {isSelected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Active
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
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{getIncomeGoal(attempt.quizData)}</span>
                    </div>
                  </div>
                </div>

                {/* Select Button */}
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <div className="p-2 text-blue-600 dark:text-blue-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <Eye className="w-4 h-4" />
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
          <button className="w-full flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            <span>View All Attempts</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
