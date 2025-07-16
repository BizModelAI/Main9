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

  // Clear any cached data in memory
  if (window.location.reload) {
    console.log("✅ All caches cleared, reloading page...");
    window.location.reload();
  }
};

// Auto-clear caches in development
if (import.meta.env.DEV) {
  (window as any).clearAllCaches = clearAllCaches;
  console.log("🔧 Development mode: Run clearAllCaches() to clear all caches");
}
