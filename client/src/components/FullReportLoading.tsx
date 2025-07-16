import React, { useState, useEffect } from "react";
import { QuizData } from "../types";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  Target,
  Lightbulb,
  FileText,
  Zap,
} from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [fullReportData, setFullReportData] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      id: "preparing",
      title: "Preparing Your Full Report",
      description: "Analyzing your quiz responses for detailed insights",
      icon: Clock,
      duration: 2000,
    },
    {
      id: "generating",
      title: "Generating Advanced AI Insights",
      description: "Creating personalized recommendations and strategies",
      icon: BarChart3,
      duration: 8000,
    },
    {
      id: "finalizing",
      title: "Finalizing Your Report",
      description: "Compiling your comprehensive business analysis",
      icon: Target,
      duration: 3000,
    },
  ];

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    let totalTime = 0;
    let progressInterval: NodeJS.Timeout;

    // Start smooth progress animation
    const startTime = Date.now();
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);
    }, 50);

    // Start the step progression
    steps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index);

        // If this is the generation step, start the actual AI generation
        if (step.id === "generating") {
          generateFullReportData();
        }
      }, totalTime);

      timeouts.push(timeout);
      totalTime += step.duration;
    });

    // Complete the loading after all steps
    const completeTimeout = setTimeout(() => {
      setIsComplete(true);
      setProgress(100);
    }, totalTime);
    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, []);

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
        businessFitDescriptions,
        businessAvoidDescriptions,
      });
    } catch (error) {
      console.error("❌ Error generating full report data:", error);
      // Create fallback data
      const fallbackData = {
        insights: {
          personalizedSummary:
            "Based on your quiz responses, you have strong entrepreneurial potential.",
          customRecommendations: [
            "Focus on building your core skills",
            "Start with a proven business model",
            "Develop a consistent routine",
          ],
          potentialChallenges: [
            "Time management may require attention",
            "Building initial momentum takes patience",
            "Market research is essential",
          ],
          successStrategies: [
            "Leverage your existing strengths",
            "Build systems for scalability",
            "Focus on customer value",
          ],
          personalizedActionPlan: {
            week1: ["Set up your workspace", "Research your market"],
            month1: ["Launch MVP", "Gather feedback"],
            month3: ["Optimize processes", "Scale operations"],
            month6: ["Expand offerings", "Build team"],
          },
          motivationalMessage:
            "You have the foundation to build a successful business.",
        },
        paths: [],
      };
      setFullReportData(fallbackData);
    }
  };

  useEffect(() => {
    if (isComplete && fullReportData) {
      const timer = setTimeout(() => {
        onComplete(fullReportData);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, fullReportData, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background animation */}
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-full blur-3xl"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Main content container */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header icon with subtle animation */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <motion.div
                className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg"
                animate={{
                  boxShadow: [
                    "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
                    "0 15px 35px -5px rgba(59, 130, 246, 0.4)",
                    "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <FileText className="w-12 h-12 text-white" />
              </motion.div>

              {/* Floating accent dots */}
              <motion.div
                className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -bottom-1 -left-3 w-3 h-3 bg-purple-400 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </div>
          </motion.div>

          {/* Title and description */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preparing Your Full Report
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
              Our AI is crafting detailed insights and personalized
              recommendations just for you
            </p>
          </motion.div>

          {/* Current step indicator */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
              {!isComplete ? (
                <motion.div
                  key={currentStep}
                  className="flex items-center justify-center space-x-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {React.createElement(steps[currentStep]?.icon || Clock, {
                      className: "w-6 h-6 text-white",
                    })}
                  </motion.div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {steps[currentStep]?.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {steps[currentStep]?.description}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center justify-center space-x-4 text-green-600"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">Report Complete!</h3>
                    <p className="text-green-700 text-sm">
                      Redirecting to your personalized insights...
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="bg-white/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/40">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>
            <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
              <span>Processing...</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </motion.div>

          {/* Step indicators */}
          <motion.div
            className="flex justify-center space-x-4 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex flex-col items-center space-y-2"
              >
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                    index < currentStep
                      ? "bg-green-100 text-green-600"
                      : index === currentStep
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                  }`}
                  animate={
                    index === currentStep
                      ? { scale: [1, 1.1, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </motion.div>
                <span className="text-xs text-gray-500 max-w-20 text-center leading-tight">
                  {step.title.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Footer message */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <p className="text-sm text-gray-500 mb-4">
              This personalized analysis is being generated specifically for
              your entrepreneurial profile
            </p>

            {/* Cancel button */}
            {onExit && !isComplete && (
              <button
                onClick={onExit}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline"
              >
                Cancel and go back
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
