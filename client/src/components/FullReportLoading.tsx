import React, { useState, useEffect } from "react";
import { QuizData } from "../types";
import {
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  Target,
  Lightbulb,
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
    }, totalTime);
    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const generateFullReportData = async () => {
    try {
      console.log("🔄 Generating full report data with AI");

      // Dynamic import to avoid bundle issues
      const { AIService } = await import("../utils/aiService");
      const { generateAIPersonalizedPaths } = await import(
        "../utils/quizLogic"
      );

      const aiService = AIService.getInstance();

      // Get business paths
      const paths = await generateAIPersonalizedPaths(quizData);

      // Generate full personalized insights (includes both preview and full report data)
      const insights = await aiService.generatePersonalizedInsights(
        quizData,
        paths.slice(0, 3),
      );

      console.log("✅ Full report data generated successfully");
      setFullReportData({ insights, paths });
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

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Generating Your Full Report
            </h1>
            <p className="text-gray-600">
              Creating your comprehensive business analysis with AI-powered
              insights
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex items-center space-x-3">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                    ${
                      status === "completed"
                        ? "bg-green-100 text-green-600"
                        : status === "active"
                          ? "bg-blue-100 text-blue-600 animate-pulse"
                          : "bg-gray-100 text-gray-400"
                    }
                  `}
                  >
                    {status === "completed" ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className={`font-medium ${
                        status === "active"
                          ? "text-blue-600"
                          : status === "completed"
                            ? "text-green-600"
                            : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion State */}
          {isComplete && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Report Generated Successfully!
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Redirecting to your full report...
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
              style={{
                width: isComplete
                  ? "100%"
                  : `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-500">
            This may take a few moments while we analyze your responses
          </div>

          {/* Exit Button */}
          {onExit && (
            <button
              onClick={onExit}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
