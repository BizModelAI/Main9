import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface QuizRetakeStatus {
  canRetake: boolean;
  attemptsCount: number;
  hasAccessPass: boolean;
  quizRetakesRemaining: number;
  totalQuizRetakesUsed: number;
  isFirstQuiz: boolean;
  isFreeQuizUsed: boolean;
  isGuestUser: boolean;
}

export const useQuizRetake = (userId: number | null) => {
  const queryClient = useQueryClient();

  const {
    data: retakeStatus,
    isLoading,
    refetch,
  } = useQuery<QuizRetakeStatus>({
    queryKey: [`/api/quiz-retake-status/${userId}`],
    enabled: !!userId,
    retry: false,
  });

  const recordAttemptMutation = useMutation({
    mutationFn: async (quizData: any) => {
      if (!userId) throw new Error("User ID is required");
      return await apiRequest("POST", "/api/quiz-attempt", {
        userId,
        quizData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/quiz-retake-status/${userId}`],
      });
    },
  });

  // DEPRECATED: Access pass and retake bundle payments no longer exist
  // The new pay-per-report model uses /api/create-report-unlock-payment instead
  const purchaseAccessPassMutation = useMutation({
    mutationFn: async () => {
      throw new Error(
        "Access pass payments are deprecated. Use report unlock payments instead.",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/quiz-retake-status/${userId}`],
      });
    },
  });

  const purchaseRetakeBundleMutation = useMutation({
    mutationFn: async () => {
      throw new Error(
        "Retake bundle payments are deprecated. Quizzes are now free, pay per report unlock.",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/quiz-retake-status/${userId}`],
      });
    },
  });

  // For guest users (no userId), return default values
  if (!userId) {
    return {
      retakeStatus: {
        canRetake: true,
        attemptsCount: 0,
        hasAccessPass: false,
        quizRetakesRemaining: 0,
        totalQuizRetakesUsed: 0,
        isFirstQuiz: true,
        isFreeQuizUsed: false,
        isGuestUser: true,
      },
      isLoading: false,
      canRetake: true,
      isFirstQuiz: true,
      hasAccessPass: false,
      quizRetakesRemaining: 0,
      totalQuizRetakesUsed: 0,
      attemptsCount: 0,
      recordAttempt: async () => Promise.resolve(),
      purchaseAccessPass: async () => Promise.resolve(),
      purchaseRetakeBundle: async () => Promise.resolve(),
      isRecordingAttempt: false,
      isPurchasing: false,
      refetch: async () => ({ data: undefined, error: null }),
      isGuestUser: true,
    };
  }

  return {
    retakeStatus,
    isLoading,
    canRetake: retakeStatus?.canRetake || false,
    isFirstQuiz: retakeStatus?.isFirstQuiz || false,
    hasAccessPass: retakeStatus?.hasAccessPass || false,
    quizRetakesRemaining: retakeStatus?.quizRetakesRemaining || 0,
    totalQuizRetakesUsed: retakeStatus?.totalQuizRetakesUsed || 0,
    attemptsCount: retakeStatus?.attemptsCount || 0,
    recordAttempt: recordAttemptMutation.mutateAsync,
    purchaseAccessPass: purchaseAccessPassMutation.mutateAsync,
    purchaseRetakeBundle: purchaseRetakeBundleMutation.mutateAsync,
    isRecordingAttempt: recordAttemptMutation.isPending,
    isPurchasing:
      purchaseAccessPassMutation.isPending ||
      purchaseRetakeBundleMutation.isPending,
    refetch,
    isGuestUser: !userId,
  };
};
