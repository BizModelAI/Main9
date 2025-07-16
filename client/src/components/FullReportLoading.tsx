import React, { useEffect, useState } from "react";
import { QuizData } from "../types";
import { motion } from "framer-motion";
import { Brain, CheckCircle } from "lucide-react";

interface FullReportLoadingProps {
  quizData: QuizData;
  userEmail?: string | null;
  onComplete: (data: any) => void;
  onExit?: () => void;
}

export default function FullReportLoading({
  quizData,
  userEmail,
  onComplete,
  onExit,
}: FullReportLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [fullReportData, setFullReportData] = useState<any>(null);
  const [apiCallComplete, setApiCallComplete] = useState(false);

  const stages = [
    { text: "Analyzing your entrepreneurial profile...", target: 25 },
    { text: "Generating business fit descriptions...", target: 50 },
    { text: "Creating personalized recommendations...", target: 75 },
    { text: "Finalizing your comprehensive report...", target: 100 },
  ];

  // Generate full report data immediately when component mounts
  const generateFullReportData = async () => {
    try {
      console.log(
        "🚀 Generating full report data with consolidated AI (1 call instead of 4)",
      );

      // Dynamic import to avoid bundle issues
      const { AIService } = await import("../utils/aiService");
      const { businessModelService } = await import(
        "../utils/businessModelService"
      );
      const { getActionPlanForModel, MOTIVATIONAL_MESSAGE } = await import(
        "../utils/hardcodedContent"
      );

      const aiService = AIService.getInstance();

      // Use consistent business model scoring (same as quiz-loading and Results)
      const businessMatches =
        businessModelService.getBusinessModelMatches(quizData);
      const topThreeAdvanced = businessMatches.slice(0, 3);

      console.log("🎯 Generating consolidated content for top 3 models:");
      topThreeAdvanced.forEach((match, index) => {
        console.log(`${index + 1}. ${match.name} (${match.score}%)`);
      });

      // Generate all content with 1 consolidated AI call
      const consolidatedContent = await aiService.generateFullReportContent(
        quizData,
        topThreeAdvanced,
      );

      // Generate business avoid descriptions (hardcoded - no AI needed)
      const bottomThree = businessModelService.getBottomMatches(quizData, 3);
      const businessAvoidDescriptions: { [key: string]: string } = {};

      bottomThree.forEach((match) => {
        businessAvoidDescriptions[match.id] =
          `This business model scored ${match.score}% for your profile, indicating significant misalignment with your current goals, skills, and preferences. Based on your quiz responses, you would likely face substantial challenges in this field that could impact your success. Consider focusing on higher-scoring business models that better match your natural strengths and current situation. Your ${quizData.riskComfortLevel <= 2 ? "lower risk tolerance" : "risk preferences"} and ${quizData.weeklyTimeCommitment} hours/week availability suggest other business models would be more suitable for your entrepreneurial journey.`;
      });

      // Get hardcoded action plan for the top business model
      const topModelActionPlan = getActionPlanForModel(
        topThreeAdvanced[0]?.name || "",
      );

      // Create final insights object with both AI-generated and hardcoded content
      const insights = {
        // Use the 3 paragraphs from Results page (already cached) instead of AI-generated summary
        personalizedSummary: "Analysis will be pulled from Results page cache",

        // AI-generated content from consolidated call
        customRecommendations:
          consolidatedContent.fullReportInsights.customRecommendations,
        potentialChallenges:
          consolidatedContent.fullReportInsights.potentialChallenges,

        // Hardcoded content
        personalizedActionPlan: topModelActionPlan,
        motivationalMessage: MOTIVATIONAL_MESSAGE,

        // These are used in FullReport but generated elsewhere or hardcoded
        successStrategies: [
          "Focus on your top-scoring business model to maximize success potential",
          "Leverage your strong skills while addressing identified challenges",
          "Start small and scale gradually based on market feedback",
          "Build a support network of mentors and fellow entrepreneurs",
        ],
      };

      console.log(
        "✅ Full report data generated successfully (1 AI call + hardcoded content)",
      );

      setFullReportData({
        insights,
        paths: businessMatches.slice(0, 7).map((match) => ({
          id: match.id,
          name: match.name,
          description: `${match.name} with ${match.score}% compatibility`,
          detailedDescription: `This business model scored ${match.score}% based on your quiz responses`,
          fitScore: match.score,
          difficulty:
            match.score >= 75 ? "Easy" : match.score >= 50 ? "Medium" : "Hard",
          timeToProfit:
            match.score >= 80
              ? "1-3 months"
              : match.score >= 60
                ? "3-6 months"
                : "6+ months",
          monthlyIncomeRange:
            match.score >= 80
              ? "$1000-$5000"
              : match.score >= 60
                ? "$500-$2000"
                : "$100-$1000",
        })),
        businessFitDescriptions: consolidatedContent.businessFitDescriptions,
        businessAvoidDescriptions,
      });

      setApiCallComplete(true);
    } catch (error) {
      console.error("❌ Error generating full report data:", error);

      // Create fallback data
      const fallbackData = {
        insights: {
          personalizedSummary:
            "Based on your quiz responses, you have strong entrepreneurial potential.",
          customRecommendations: [
            "Focus on developing your core business skills",
            "Start with a minimum viable product to test the market",
            "Build a strong online presence and network",
            "Track your progress and adjust strategies as needed",
          ],
          potentialChallenges: [
            "Time management while building your business",
            "Learning new skills and technologies",
            "Finding and retaining customers",
            "Managing finances and cash flow",
          ],
          successStrategies: [
            "Leverage your strong skills identified in the quiz",
            "Start small and scale gradually",
            "Focus on your top business model match",
            "Build consistent daily habits",
          ],
          personalizedActionPlan: {
            week1: [
              "Research your target market",
              "Set up basic business structure",
            ],
            month1: [
              "Launch minimum viable product",
              "Establish online presence",
            ],
            month3: [
              "Refine offerings based on feedback",
              "Build customer base",
            ],
            month6: ["Scale successful strategies", "Plan for growth"],
          },
          motivationalMessage:
            "Starting a business is hard, but it's one of the best ways to take control of your future. Every successful entrepreneur began with an idea and the courage to try. Stay focused, learn fast, and keep going—progress comes from consistent action. You don't need to be perfect. You just need to start.",
        },
        paths: [],
        businessFitDescriptions: {},
        businessAvoidDescriptions: {},
      };

      setFullReportData(fallbackData);
      setApiCallComplete(true);
    }
  };

  // Progress animation with smooth stage transitions
  useEffect(() => {
    const startTime = Date.now();
    const minDuration = 10000; // 10 seconds minimum

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const baseProgress = Math.min((elapsed / minDuration) * 100, 100);

      // Determine current stage based on progress
      let newStage = 0;
      for (let i = 0; i < stages.length; i++) {
        if (baseProgress >= stages[i].target - 20) {
          newStage = i;
        }
      }
      setCurrentStage(newStage);

      // Smooth progress animation - don't jump between stages
      const currentStageProgress = stages[newStage].target;
      const smoothProgress = Math.min(baseProgress, currentStageProgress);

      setProgress(smoothProgress);

      // Complete when both API is done and minimum time has passed
      if (apiCallComplete && elapsed >= minDuration) {
        setProgress(100);
        setIsComplete(true);
      } else {
        requestAnimationFrame(animateProgress);
      }
    };

    // Start API call immediately
    generateFullReportData();

    // Start progress animation
    animateProgress();
  }, []);

  // Complete loading and navigate to full report
  useEffect(() => {
    if (isComplete && fullReportData) {
      const timer = setTimeout(() => {
        onComplete(fullReportData);
      }, 500); // Small delay for smooth transition

      return () => clearTimeout(timer);
    }
  }, [isComplete, fullReportData, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Purple Brain Loading UI */}
        <motion.div
          className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative text-center">
            {/* Spinning Brain */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Brain className="h-8 w-8 text-white" />
            </motion.div>

            {/* Title */}
            <h2 className="text-3xl font-bold mb-4">
              Generating Your Full Report...
            </h2>

            {/* Current Stage Text */}
            <p className="text-xl text-blue-100 mb-8">
              {stages[currentStage].text}
            </p>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-white h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <div className="mt-3 text-white/80 text-lg font-medium">
                {Math.round(progress)}%
              </div>
            </div>

            {/* Animated Dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-white/60 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
