export const clearAllCaches = () => {
  console.log("🧹 Clearing all caches...");

  // Clear localStorage items
  localStorage.removeItem("quiz-completion-ai-insights");
  localStorage.removeItem("loadedReportData");
  localStorage.removeItem("quizData");
  localStorage.removeItem("currentQuizAttemptId");
  localStorage.removeItem("hasCompletedQuiz");
  localStorage.removeItem("hasUnlockedAnalysis");

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear business model cache
  try {
    import("./businessModelService").then(({ businessModelService }) => {
      businessModelService.clearCache();
    });
  } catch (error) {
    console.warn("Could not clear business model cache:", error);
  }

  console.log("✅ All caches cleared, reloading page...");
  if (window.location.reload) {
    window.location.reload();
  }
};

// Auto-clear caches in development
if (import.meta.env.DEV) {
  (window as any).clearAllCaches = clearAllCaches;
  console.log("�� Development mode: Run clearAllCaches() to clear all caches");
}
