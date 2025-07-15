import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, ArrowLeft, AlertCircle } from "lucide-react";
import BusinessReportContent from "../components/BusinessReportContent";
import { QuizData, AIAnalysis, BusinessPath } from "../types";
import { AIService } from "../utils/aiService";
import { aiCacheManager } from "../utils/aiCacheManager";
import { businessPaths } from "../data/businessPaths";
import { generatePersonalizedPaths } from "../utils/quizLogic";

const DownloadReportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<{
    quizData: QuizData;
    aiAnalysis: any;
    topBusinessPath: BusinessPath;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (location.state && location.state.quizData) {
          // Use data passed from Results page
          const { quizData, aiAnalysis, topBusinessPath } =
            location.state as any;
          setReportData({ quizData, aiAnalysis, topBusinessPath });
          setLoading(false);
        } else {
          // Fallback: Generate mock data for demonstration
          console.warn(
            "Report data not found in location state. Generating mock data for demonstration.",
          );

          const mockQuizData: QuizData = {
            mainMotivation: "financial-freedom",
            firstIncomeTimeline: "3-6-months",
            successIncomeGoal: 5000,
            upfrontInvestment: 1000,
            passionIdentityAlignment: 4,
            businessExitPlan: "not-sure",
            businessGrowthSize: "full-time-income",
            passiveIncomeImportance: 3,
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
            brandFaceComfort: 3,
            competitivenessLevel: 3,
            creativeWorkEnjoyment: 4,
            directCommunicationEnjoyment: 4,
            workStructurePreference: "some-structure",
            techSkillsRating: 3,
            workspaceAvailability: "yes",
            supportSystemStrength: "small-helpful-group",
            internetDeviceReliability: 4,
            familiarTools: ["google-docs-sheets", "canva"],
            decisionMakingStyle: "after-some-research",
            riskComfortLevel: 3,
            feedbackRejectionResponse: 3,
            pathPreference: "mix",
            controlImportance: 4,
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
          };

          // Generate personalized paths and get the top one
          const personalizedPaths = generatePersonalizedPaths(mockQuizData);
          const mockTopBusinessPath = personalizedPaths[0];

          // Check cache first, then generate AI analysis
          const cachedContent = aiCacheManager.getCachedAIContent(mockQuizData);

          let combinedAnalysis;
          if (cachedContent.insights && cachedContent.analysis) {
            combinedAnalysis = {
              ...cachedContent.analysis,
              ...cachedContent.insights,
            };
          } else {
            const aiService = AIService.getInstance();
            const mockPersonalizedInsights =
              await aiService.generatePersonalizedInsights(mockQuizData, [
                mockTopBusinessPath,
              ]);
            const mockDetailedAnalysis =
              await aiService.generateDetailedAnalysis(
                mockQuizData,
                mockTopBusinessPath,
              );

            combinedAnalysis = {
              ...mockDetailedAnalysis,
              ...mockPersonalizedInsights,
            };

            // Cache the generated content
            aiCacheManager.cacheAIContent(
              mockQuizData,
              mockPersonalizedInsights,
              mockDetailedAnalysis,
              mockTopBusinessPath,
            );
          }

          setReportData({
            quizData: mockQuizData,
            aiAnalysis: combinedAnalysis,
            topBusinessPath: mockTopBusinessPath,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load report data:", err);
        setError(
          "Failed to load report data. Please try taking the quiz again.",
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  const handleDownloadPdf = async () => {
    if (!reportData) return;

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizData: reportData.quizData,
          userEmail: location.state?.quizData
            ? (location.state as any).userEmail || "user@example.com"
            : "user@example.com",
          aiAnalysis: reportData.aiAnalysis,
          topBusinessPath: reportData.topBusinessPath,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Create blob from response
      const blob = await response.blob();

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "business-report.pdf";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">
            Generating your personalized report...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-red-800 mb-4">
            Error Loading Report
          </h1>
          <p className="text-lg text-red-700 mb-8">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => navigate("/quiz")}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Take the Quiz
            </button>
            <button
              onClick={handleGoBack}
              className="w-full border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Report Not Found
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            It looks like there's no report data available. Please ensure you've
            completed the quiz and generated your results.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate("/quiz")}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Take the Quiz
            </button>
            <button
              onClick={handleGoBack}
              className="w-full border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="download-report-page">
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Results
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Your Business Report</span>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="pt-20 print:pt-0">
        <BusinessReportContent
          quizData={reportData.quizData}
          aiAnalysis={reportData.aiAnalysis}
          topBusinessPath={reportData.topBusinessPath}
        />
      </div>

      {/* Floating Download Button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        <motion.button
          onClick={handleDownloadPdf}
          className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-110"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Download className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
};

export default DownloadReportPage;
