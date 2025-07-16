import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PaywallProvider } from "./contexts/PaywallContext";

// Import debug utilities (available as window.debugOpenAI and window.debugAIContent)
import "./utils/debugOpenAI";
import "./utils/debugAIContent";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import BusinessExplorer from "./pages/BusinessExplorer";

import ContactUs from "./pages/ContactUs";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Quiz from "./components/Quiz";
import Results from "./components/Results";
import EmailCapture from "./components/EmailCapture";
import LoggedInCongratulations from "./components/LoggedInCongratulations";
import BusinessModelDetail from "./components/BusinessModelDetail";
import { AICacheManager } from "./utils/aiCacheManager";
import BusinessGuide from "./components/BusinessGuide";
import DownloadReportPage from "./pages/DownloadReportPage";
import PDFReportPage from "./pages/PDFReportPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import UnsubscribePage from "./pages/UnsubscribePage";
import AdminPage from "./pages/Admin";
import AIReportLoading from "./components/AIReportLoading";
import QuizCompletionLoading from "./components/QuizCompletionLoading";
import QuizPaymentRequired from "./pages/QuizPaymentRequired";
import SaveResultsPayment from "./pages/SaveResultsPayment";
import { NavigationGuardWrapper } from "./components/NavigationGuardWrapper";

// Alias for loading page component
const LoadingPage = AIReportLoading;
import { QuizData } from "./types";

function App() {
  const [quizData, setQuizData] = React.useState<QuizData | null>(null);
  const [showEmailCapture, setShowEmailCapture] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [showAILoading, setShowAILoading] = React.useState(false);
  const [loadedReportData, setLoadedReportData] = React.useState<any>(null);
  const [showCongratulations, setShowCongratulations] = React.useState(false);
  const [congratulationsShown, setCongratulationsShown] = React.useState(false);

  // Restore data from localStorage on app start
  React.useEffect(() => {
    console.log(
      "App component initializing - restoring data from localStorage",
    );
    const savedQuizData = localStorage.getItem("quizData");
    const savedUserEmail = localStorage.getItem("userEmail");
    const savedLoadedReportData = localStorage.getItem("loadedReportData");
    const savedCongratulationsShown = localStorage.getItem(
      "congratulationsShown",
    );

    console.log("Saved quiz data found:", !!savedQuizData);
    console.log("Saved user email found:", !!savedUserEmail);
    console.log("Saved loaded report data found:", !!savedLoadedReportData);

    if (savedQuizData) {
      try {
        const parsed = JSON.parse(savedQuizData);
        console.log("Restoring quiz data from localStorage");
        setQuizData(parsed);
      } catch (error) {
        console.error("Error parsing saved quiz data:", error);
      }
    }

    if (savedUserEmail) {
      setUserEmail(savedUserEmail);
    }

    if (savedLoadedReportData) {
      try {
        const parsed = JSON.parse(savedLoadedReportData);
        console.log("Restoring loaded report data from localStorage");
        setLoadedReportData(parsed);
      } catch (error) {
        console.error("Error parsing saved loaded report data:", error);
      }
    }

    if (savedCongratulationsShown) {
      setCongratulationsShown(JSON.parse(savedCongratulationsShown));
    }

    // Clear congratulations tracking if there's no quiz data (fresh start)
    if (!savedQuizData) {
      setCongratulationsShown(false);
      localStorage.setItem("congratulationsShown", "false");
    }
  }, []);

  // Ensure quiz data persists even if React state gets reset
  React.useEffect(() => {
    if (!quizData) {
      // Check if localStorage has quiz data but React state doesn't
      const savedQuizData = localStorage.getItem("quizData");
      if (savedQuizData) {
        try {
          const parsed = JSON.parse(savedQuizData);
          console.log(
            "React state lost quiz data - restoring from localStorage",
          );
          setQuizData(parsed);
        } catch (error) {
          console.error("Error restoring quiz data from localStorage:", error);
        }
      }
    }
  });

  // Handler for AI loading completion
  const handleAILoadingComplete = (data: any) => {
    console.log(
      "AI loading complete, checking if congratulations should be shown",
    );
    setLoadedReportData(data);
    setShowAILoading(false);

    // Only show congratulations if it hasn't been shown yet
    if (!congratulationsShown) {
      console.log("Showing congratulations for the first time");
      setShowCongratulations(true);
      setCongratulationsShown(true);
      localStorage.setItem("congratulationsShown", "true");
    } else {
      console.log("Congratulations already shown, skipping");
    }
  };

  // TEMPORARY: Mock quiz data for testing with COMPLETE data structure
  const generateMockQuizData = (): QuizData => {
    return {
      // Round 1: Motivation & Vision
      mainMotivation: "financial-freedom",
      firstIncomeTimeline: "3-6-months",
      successIncomeGoal: 5000,
      upfrontInvestment: 1000,
      passionIdentityAlignment: 4,
      businessExitPlan: "not-sure",
      businessGrowthSize: "full-time-income",
      passiveIncomeImportance: 3,

      // Round 2: Time, Effort & Learning Style
      weeklyTimeCommitment: 20,
      longTermConsistency: 4,
      trialErrorComfort: 3,
      learningPreference: "hands-on",
      systemsRoutinesEnjoyment: 3,
      discouragementResilience: 4,
      toolLearningWillingness: "yes",
      organizationLevel: 3,
      selfMotivationLevel: 4,
      uncertaintyHandling: 3,
      repetitiveTasksFeeling: "tolerate",
      workCollaborationPreference: "mostly-solo",

      // Round 3: Personality & Preferences
      brandFaceComfort: 3,
      competitivenessLevel: 3,
      creativeWorkEnjoyment: 4,
      directCommunicationEnjoyment: 4,
      workStructurePreference: "some-structure",

      // Round 4: Tools & Work Environment
      techSkillsRating: 3,
      workspaceAvailability: "yes",
      supportSystemStrength: "small-helpful-group",
      internetDeviceReliability: 4,
      familiarTools: ["google-docs-sheets", "canva"],

      // Round 5: Strategy & Decision-Making
      decisionMakingStyle: "after-some-research",
      riskComfortLevel: 3,
      feedbackRejectionResponse: 3,
      pathPreference: "mix",
      controlImportance: 4,

      // Round 6: Business Model Fit Filters
      onlinePresenceComfort: "yes",
      clientCallsComfort: "yes",
      physicalShippingOpenness: "no",
      workStylePreference: "mix-both",
      socialMediaInterest: 3,
      ecosystemParticipation: "yes",
      existingAudience: "no",
      promotingOthersOpenness: "yes",
      teachVsSolvePreference: "both",
      meaningfulContributionImportance: 4,

      // Legacy fields for backward compatibility (mapped from new fields)
      primaryMotivation: "financial-independence",
      incomeGoal: 5000,
      timeToFirstIncome: "3-6-months",
      startupBudget: 1000,
      timeCommitment: 20,
      learningStyle: "hands-on",
      workPreference: "solo-flexible",
      riskTolerance: 3,
      customerInteractionComfort: 4,
      selfMotivation: 4,
      existingSkills: ["writing", "marketing"],
      experienceLevel: "intermediate",
      lifestyle: "freedom",
      stressResponse: "manage-well",
      communicationStyle: "direct",
      perfectionismLevel: 3,
      socialEnergy: "mixed",
      changeAdaptability: 3,
      attentionToDetail: 3,
      competitionMotivation: "neutral",
      failureResponse: "learning-opportunity",
      routinePreference: "some-structure",
      feedbackReception: "welcome-constructive",
      longTermThinking: "annual-goals",
      authorityComfort: 3,
      technologyComfort: 3,
    };
  };

  return (
    <AuthProvider>
      <PaywallProvider>
        <Router>
          <NavigationGuardWrapper>
            <Analytics />
            <SpeedInsights />
            <Routes>
              {/* Public routes with layout */}
              <Route
                path="/"
                element={
                  <Layout>
                    <Index />
                  </Layout>
                }
              />

              <Route
                path="/explore"
                element={
                  <Layout>
                    <BusinessExplorer quizData={quizData} />
                  </Layout>
                }
              />

              <Route
                path="/contact"
                element={
                  <Layout>
                    <ContactUs />
                  </Layout>
                }
              />

              {/* Auth routes (no layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes with layout */}
              <Route
                path="/dashboard"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  </Layout>
                }
              />

              <Route
                path="/settings"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  </Layout>
                }
              />

              {/* Quiz without layout (has its own design) */}
              <Route
                path="/quiz"
                element={
                  <QuizWithNavigation
                    quizData={quizData}
                    setQuizData={setQuizData}
                    showEmailCapture={showEmailCapture}
                    setShowEmailCapture={setShowEmailCapture}
                    userEmail={userEmail}
                    setUserEmail={setUserEmail}
                    generateMockQuizData={generateMockQuizData}
                    showAILoading={showAILoading}
                    setShowAILoading={setShowAILoading}
                    loadedReportData={loadedReportData}
                    setLoadedReportData={setLoadedReportData}
                    showCongratulations={showCongratulations}
                    setShowCongratulations={setShowCongratulations}
                    congratulationsShown={congratulationsShown}
                    setCongratulationsShown={setCongratulationsShown}
                    handleAILoadingComplete={handleAILoadingComplete}
                  />
                }
              />

              {/* Quiz completion loading page - NOW uses AIReportLoading */}
              <Route
                path="/quiz-loading"
                element={
                  <AIReportLoadingWrapper
                    quizData={quizData}
                    setShowCongratulations={setShowCongratulations}
                  />
                }
              />

              {/* Loading page - NOW uses QuizCompletionLoading */}
              <Route
                path="/loading"
                element={
                  <QuizCompletionLoadingWrapper
                    quizData={quizData}
                    userEmail={userEmail}
                    showCongratulations={showCongratulations}
                    setUserEmail={setUserEmail}
                    setShowCongratulations={setShowCongratulations}
                    loadedReportData={loadedReportData}
                    handleAILoadingComplete={handleAILoadingComplete}
                  />
                }
              />

              {/* Results with layout */}
              <Route
                path="/results"
                element={
                  <Layout>
                    <ResultsWrapperWithReset
                      quizData={quizData}
                      userEmail={userEmail}
                      onBack={() => window.history.back()}
                      loadedReportData={loadedReportData}
                      setShowCongratulations={setShowCongratulations}
                    />
                  </Layout>
                }
              />

              {/* Business Model Detail Page */}
              <Route
                path="/business/:businessId"
                element={
                  <Layout>
                    <BusinessModelDetail quizData={quizData} />
                  </Layout>
                }
              />

              {/* Business Guide Page */}
              <Route
                path="/guide/:businessId"
                element={
                  <Layout>
                    <BusinessGuide quizData={quizData} />
                  </Layout>
                }
              />

              {/* Download Report Page */}
              <Route path="/report" element={<DownloadReportPage />} />

              {/* PDF Report Page (no layout) */}
              <Route path="/pdf-report" element={<PDFReportPage />} />

              {/* Privacy Policy */}
              <Route path="/privacy" element={<PrivacyPolicy />} />

              {/* Unsubscribe Page */}
              <Route path="/unsubscribe" element={<UnsubscribePage />} />

              {/* Admin Page */}
              <Route path="/admin" element={<AdminPage />} />

              {/* Quiz Payment Required */}
              <Route
                path="/quiz-payment-required"
                element={<QuizPaymentRequired />}
              />

              {/* Save Results Payment */}
              <Route
                path="/save-results-payment"
                element={<SaveResultsPayment />}
              />
            </Routes>
          </NavigationGuardWrapper>
        </Router>
      </PaywallProvider>
    </AuthProvider>
  );
}

// AIReport loading wrapper component for quiz completion
const AIReportLoadingWrapper: React.FC<{
  quizData: QuizData | null;
  setShowCongratulations: (show: boolean) => void;
}> = ({ quizData, setShowCongratulations }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAILoadingComplete = async (data: any) => {
    console.log(
      "AI loading complete after quiz, checking congratulations tracking",
    );

    // Store loaded report data in localStorage
    localStorage.setItem("loadedReportData", JSON.stringify(data));

    // Save AI content to database if we have a quiz attempt ID and user is authenticated
    const currentQuizAttemptId = localStorage.getItem("currentQuizAttemptId");
    if (currentQuizAttemptId && data && user) {
      try {
        const response = await fetch(
          `/api/quiz-attempts/${currentQuizAttemptId}/ai-content`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ aiContent: data }),
          },
        );

        if (response.ok) {
          console.log(
            `AI content saved to database for quiz attempt ${currentQuizAttemptId}`,
          );
        } else {
          console.error(
            "Failed to save AI content to database:",
            response.status,
          );
        }
      } catch (error) {
        console.error("Error saving AI content to database:", error);
      }
    } else if (currentQuizAttemptId && data && !user) {
      console.log(
        "Skipping AI content save to database - user not authenticated",
      );
    }

    // Check if congratulations was already shown
    const congratulationsShown = localStorage.getItem("congratulationsShown");
    if (!congratulationsShown || congratulationsShown === "false") {
      console.log("Showing congratulations for the first time");
      setShowCongratulations(true);
      localStorage.setItem("congratulationsShown", "true");
      // Navigate to results page where congratulations popup will be handled
      navigate("/results");
    } else {
      console.log(
        "Congratulations already shown, navigating directly to results",
      );
      // Navigate directly to results page
      navigate("/results");
    }
  };

  if (!quizData) {
    // Fallback if no quiz data
    navigate("/quiz");
    return null;
  }

  return (
    <div className="relative">
      <AIReportLoading
        quizData={quizData}
        onComplete={handleAILoadingComplete}
        onExit={() => navigate("/quiz")}
      />
    </div>
  );
};

// Comprehensive cache clearing function for new quiz sessions
const clearQuizRelatedCache = () => {
  console.log("🧹 Clearing all quiz-related cache for new session");

  // Quiz data
  localStorage.removeItem("quizData");
  localStorage.removeItem("hasCompletedQuiz");
  localStorage.removeItem("currentQuizAttemptId");
  localStorage.removeItem("pendingQuizData");
  localStorage.removeItem("requiresQuizPayment");

  // AI-related data
  localStorage.removeItem("quiz-completion-ai-insights");
  localStorage.removeItem("loadedReportData");
  localStorage.removeItem("ai-generation-in-progress");
  localStorage.removeItem("ai-generation-timestamp");

  // UI state flags
  localStorage.removeItem("congratulationsShown");
  localStorage.removeItem("hasEverSelectedModel");
  localStorage.removeItem("selectedBusinessModel");

  // Clear AI service caches (this is the key fix!)
  const aiCacheManager = AICacheManager.getInstance();
  aiCacheManager.forceResetCache();

  // Clear any AI cache keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("ai_insights_") || // AI service cache keys
        key.startsWith("preview_") || // Preview cache keys
        key.startsWith("fullreport_") || // Full report cache keys
        key.startsWith("ai-analysis-") ||
        key.startsWith("skills-analysis-") ||
        key.startsWith("ai-cache-") ||
        key.startsWith("confetti_shown_"))
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  console.log(
    `✅ Cleared AI caches and ${keysToRemove.length + 12} cache entries for new quiz session`,
  );
};

// Quiz completion loading wrapper component for the /loading route
const QuizCompletionLoadingWrapper: React.FC<{
  quizData: QuizData | null;
  userEmail: string | null;
  showCongratulations: boolean;
  setUserEmail: (email: string) => void;
  setShowCongratulations: (show: boolean) => void;
  loadedReportData: any;
  handleAILoadingComplete: (data: any) => void;
}> = ({
  quizData,
  userEmail,
  showCongratulations,
  setUserEmail,
  setShowCongratulations,
  loadedReportData,
  handleAILoadingComplete,
}) => {
  const navigate = useNavigate();

  const handleLoadingComplete = () => {
    console.log(
      "Quiz completion loading complete, checking congratulations tracking",
    );

    // Check if congratulations was already shown
    const congratulationsShown = localStorage.getItem("congratulationsShown");
    if (!congratulationsShown || congratulationsShown === "false") {
      console.log("Showing congratulations for the first time");
      setShowCongratulations(true);
      localStorage.setItem("congratulationsShown", "true");
    } else {
      console.log("Congratulations already shown, skipping");
    }
  };

  // Handler for congratulations completion with proper navigation
  const handleCongratulationsComplete = (email?: string) => {
    console.log("Congratulations complete, navigating to results");
    if (email) {
      setUserEmail(email);
      localStorage.setItem("userEmail", email);
    }
    setShowCongratulations(false);

    // Store data in localStorage before navigation
    if (quizData) {
      localStorage.setItem("quizData", JSON.stringify(quizData));
    }
    if (loadedReportData) {
      localStorage.setItem(
        "loadedReportData",
        JSON.stringify(loadedReportData),
      );
    }

    // Use React Router navigation instead of window.location.href
    navigate("/results");
  };

  return (
    <div className="relative">
      {quizData && (
        <QuizCompletionLoading
          quizData={quizData}
          onComplete={handleLoadingComplete}
        />
      )}
      {showCongratulations && quizData && user && (
        <LoggedInCongratulations
          onContinue={handleCongratulationsComplete}
          onSendEmailPreview={() => {}}
          quizData={quizData}
          onStartAIGeneration={handleCongratulationsComplete}
        />
      )}
      {showCongratulations && quizData && !user && (
        <EmailCapture
          onEmailSubmit={handleCongratulationsComplete}
          onContinueAsGuest={handleCongratulationsComplete}
          onReturnToQuiz={() => navigate("/quiz")}
          quizData={quizData}
          onStartAIGeneration={handleCongratulationsComplete}
        />
      )}
    </div>
  );
};

// Component that handles quiz navigation
const QuizWithNavigation: React.FC<{
  quizData: QuizData | null;
  setQuizData: (data: QuizData | null) => void;
  showEmailCapture: boolean;
  setShowEmailCapture: (show: boolean) => void;
  userEmail: string | null;
  setUserEmail: (email: string) => void;
  generateMockQuizData: () => QuizData;
  showAILoading: boolean;
  setShowAILoading: (show: boolean) => void;
  loadedReportData: any;
  setLoadedReportData: (data: any) => void;
  showCongratulations: boolean;
  setShowCongratulations: (show: boolean) => void;
  congratulationsShown: boolean;
  setCongratulationsShown: (shown: boolean) => void;
  handleAILoadingComplete: (data: any) => void;
}> = ({
  quizData,
  setQuizData,
  showEmailCapture,
  setShowEmailCapture,
  userEmail,
  setUserEmail,
  generateMockQuizData,
  showAILoading,
  setShowAILoading,
  loadedReportData,
  setLoadedReportData,
  showCongratulations,
  setShowCongratulations,
  congratulationsShown,
  setCongratulationsShown,
  handleAILoadingComplete,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleQuizComplete = async (data: QuizData) => {
    console.log("Quiz completed, navigating to quiz loading page");
    setQuizData(data);

    // For authenticated users, save quiz data to database immediately
    if (user && !String(user.id).startsWith("temp_")) {
      console.log("Saving quiz data for authenticated user:", user.email);
      try {
        // Use XMLHttpRequest to avoid FullStory interference
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/auth/save-quiz-data", true);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/json");

        const response = await new Promise<{
          ok: boolean;
          status: number;
          statusText: string;
          text: string;
        }>((resolve, reject) => {
          xhr.onload = () => {
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              text: xhr.responseText,
            });
          };
          xhr.onerror = () => reject(new Error("XMLHttpRequest network error"));
          xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
          xhr.timeout = 10000; // 10 second timeout
          xhr.send(JSON.stringify({ quizData: data }));
        });

        if (response.ok) {
          console.log("Quiz data saved successfully for authenticated user");
          // Store quiz attempt ID for report unlock functionality
          try {
            const responseData = JSON.parse(response.text);
            if (responseData.quizAttemptId) {
              localStorage.setItem(
                "currentQuizAttemptId",
                responseData.quizAttemptId.toString(),
              );
            }
          } catch (parseError) {
            console.error("Error parsing save response:", parseError);
          }
        } else if (response.status === 402) {
          // Payment required for additional quiz
          console.log("Payment required for additional quiz attempt");
          try {
            const responseData = JSON.parse(response.text);
            // Store quiz data temporarily and redirect to payment
            localStorage.setItem("pendingQuizData", JSON.stringify(data));
            localStorage.setItem("requiresQuizPayment", "true");
            navigate("/quiz-payment-required");
            return;
          } catch (parseError) {
            console.error(
              "Error parsing payment required response:",
              parseError,
            );
          }
        } else {
          console.error(
            "Failed to save quiz data:",
            response.status,
            response.statusText,
          );
        }
      } catch (error) {
        console.error("Error saving quiz data for authenticated user:", error);
      }
    } else {
      console.log(
        "User not authenticated or temporary user - quiz data will be saved on payment",
      );
    }

    // Reset congratulations tracking for this new quiz completion
    setCongratulationsShown(false);
    localStorage.setItem("congratulationsShown", "false");
    // Navigate to new loading page instead of showing congratulations immediately
    navigate("/quiz-loading");
  };

  const handleCongratulationsComplete = (email?: string) => {
    console.log("Congratulations complete, navigating to results");
    console.log("Current quizData state:", quizData);
    console.log("Current loadedReportData state:", loadedReportData);

    if (email) {
      setUserEmail(email);
      localStorage.setItem("userEmail", email);
    }

    // IMPORTANT: Reset congratulations state BEFORE navigation
    setShowCongratulations(false);

    // Store quiz data and loaded report data before navigation
    if (quizData) {
      console.log("Storing quizData in localStorage");
      localStorage.setItem("quizData", JSON.stringify(quizData));
    } else {
      console.error(
        "No quizData to store - this may cause the results page to fail",
      );
    }

    if (loadedReportData) {
      console.log("Storing loadedReportData in localStorage");
      localStorage.setItem(
        "loadedReportData",
        JSON.stringify(loadedReportData),
      );
    }

    console.log("Navigating to /results in 100ms");
    // Small delay to ensure state update is processed
    setTimeout(() => {
      navigate("/results");
    }, 100);
  };

  const handleReturnToQuiz = () => {
    console.log("Returning to quiz - clearing all quiz-related cache");

    // Clear all quiz-related state
    setShowCongratulations(false);
    setQuizData(null);
    setUserEmail(null);
    setShowAILoading(false);
    setShowEmailCapture(false);
    setCongratulationsShown(false);
    setLoadedReportData(null);

    // Clear all localStorage cache
    clearQuizRelatedCache();

    // Stay on current page (quiz)
  };

  const handleSkipToResults = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(
      "Skip button clicked! Generating mock data and navigating directly to results...",
    );
    const mockData = generateMockQuizData();
    console.log("Generated mock data:", mockData);

    // Set the data and navigate directly, bypassing all loading states
    setQuizData(mockData);
    setUserEmail("delivered@resend.dev");
    setShowAILoading(false);
    setShowCongratulations(false);
    setShowEmailCapture(false);
    // Reset congratulations tracking
    setCongratulationsShown(false);
    localStorage.setItem("congratulationsShown", "false");

    console.log("Navigating to /results");
    // Navigate immediately for dev purposes
    navigate("/results");
  };

  return (
    <div className="relative">
      {/* TEMPORARY SKIP BUTTON - REMOVE LATER */}
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          type="button"
          onClick={handleSkipToResults}
          className="bg-red-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl hover:bg-red-600 transition-all duration-300 transform hover:scale-105 border-2 border-white"
          style={{ zIndex: 9999 }}
          hidden
        >
          🚀 SKIP TO RESULTS (DEV)
        </button>
      </div>

      <Quiz
        onComplete={handleQuizComplete}
        onBack={() => window.history.back()}
        userId={
          user && !String(user.id).startsWith("temp_")
            ? parseInt(String(user.id))
            : undefined
        }
      />
      {showCongratulations && quizData && user && (
        <LoggedInCongratulations
          onContinue={handleCongratulationsComplete}
          onSendEmailPreview={() => {}}
          quizData={quizData}
          onStartAIGeneration={handleCongratulationsComplete}
        />
      )}
      {showCongratulations && quizData && !user && (
        <EmailCapture
          onEmailSubmit={handleCongratulationsComplete}
          onContinueAsGuest={handleCongratulationsComplete}
          onReturnToQuiz={handleReturnToQuiz}
          quizData={quizData}
          onStartAIGeneration={handleCongratulationsComplete}
        />
      )}
    </div>
  );
};

// Wrapper component to handle results display with congratulations reset
const ResultsWrapperWithReset: React.FC<{
  quizData: QuizData | null;
  userEmail: string | null;
  onBack: () => void;
  loadedReportData?: any;
  setShowCongratulations: (show: boolean) => void;
}> = ({
  quizData,
  userEmail,
  onBack,
  loadedReportData,
  setShowCongratulations,
}) => {
  console.log("ResultsWrapper received quizData:", quizData);
  console.log("ResultsWrapper received userEmail:", userEmail);
  console.log("ResultsWrapper received loadedReportData:", loadedReportData);

  // Check localStorage if no quiz data is provided via props
  const savedQuizData = React.useMemo(() => {
    console.log("ResultsWrapper - checking quiz data...");
    console.log("Props quizData:", quizData);

    if (quizData) {
      console.log("Using quizData from props");
      return quizData;
    }

    console.log("No quizData in props, checking localStorage");
    const saved = localStorage.getItem("quizData");
    console.log("localStorage quizData:", saved);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("Successfully parsed quizData from localStorage:", parsed);
        return parsed;
      } catch (error) {
        console.error("Error parsing quizData from localStorage:", error);
        return null;
      }
    }
    console.log("No quizData found in localStorage");
    return null;
  }, [quizData]);

  // Also check localStorage for loadedReportData
  const savedLoadedReportData = React.useMemo(() => {
    if (loadedReportData) return loadedReportData;

    const saved = localStorage.getItem("loadedReportData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("Retrieved loadedReportData from localStorage:", parsed);
        return parsed;
      } catch (error) {
        console.error(
          "Error parsing loadedReportData from localStorage:",
          error,
        );
        return null;
      }
    }
    return null;
  }, [loadedReportData]);

  // Clear congratulations state when component mounts (user navigated to results)
  React.useEffect(() => {
    setShowCongratulations(false);
  }, [setShowCongratulations]);

  if (savedQuizData) {
    console.log("Rendering Results component with savedQuizData");
    return (
      <Results
        quizData={savedQuizData}
        onBack={onBack}
        userEmail={userEmail}
        preloadedReportData={savedLoadedReportData}
      />
    );
  } else {
    console.error("No quiz data available - showing fallback message");
    console.log("Current localStorage keys:", Object.keys(localStorage));
    return (
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          No Results Found
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Please take the quiz first to see your personalized results.
        </p>
        <a
          href="/quiz"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Take the Quiz
        </a>
      </div>
    );
  }
};

export default App;
