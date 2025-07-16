import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Zap,
  Target,
  Users,
  TrendingUp,
  CheckCircle,
  Sparkles,
  BarChart3,
  Award,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { QuizData, BusinessPath } from "../types";
import { reportViewManager } from "../utils/reportViewManager";

// Hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
};

interface AIReportLoadingProps {
  quizData: QuizData;
  userEmail?: string | null;
  onComplete: (data: {
    personalizedPaths: BusinessPath[];
    aiInsights: any;
    allCharacteristics: string[];
    businessFitDescriptions: { [key: string]: string };
    businessAvoidDescriptions: { [key: string]: string };
  }) => void;
  onExit?: () => void;
}

interface LoadingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: "pending" | "active" | "completed";
  estimatedTime: number; // in seconds
}

const AIReportLoading: React.FC<AIReportLoadingProps> = ({
  quizData,
  userEmail,
  onComplete,
  onExit,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loadingResults, setLoadingResults] = useState<any>({});
  const isMobile = useIsMobile();
  const [currentMobileStep, setCurrentMobileStep] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  // Restore targetProgress and smooth animation logic
  const [targetProgress, setTargetProgress] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  const loadingSteps: LoadingStep[] = [
    {
      id: "analyzing-profile",
      title: "Analyzing Your Profile",
      description: "Processing your quiz responses and personality traits",
      icon: Brain,
      status: "pending",
      estimatedTime: 3,
    },
    {
      id: "generating-matches",
      title: "Finding Perfect Business Matches",
      description: "AI is matching you with the best business models",
      icon: Target,
      status: "pending",
      estimatedTime: 5,
    },
    {
      id: "creating-insights",
      title: "Creating Personalized Insights",
      description: "Generating custom recommendations based on your strengths",
      icon: Sparkles,
      status: "pending",
      estimatedTime: 4,
    },
    {
      id: "building-characteristics",
      title: "Building Your Entrepreneur Profile",
      description: "Identifying your unique entrepreneurial characteristics",
      icon: Users,
      status: "pending",
      estimatedTime: 3,
    },
    {
      id: "generating-descriptions",
      title: "Crafting Business Fit Analysis",
      description: "Creating detailed explanations for your top matches",
      icon: BarChart3,
      status: "pending",
      estimatedTime: 4,
    },
    {
      id: "finalizing-report",
      title: "Finalizing Your Report",
      description:
        "Putting together your comprehensive business analysis with personalized insights",
      icon: Award,
      status: "pending",
      estimatedTime: 5,
    },
  ];

  const [steps, setSteps] = useState<LoadingStep[]>(loadingSteps);

  // Clear any potentially stuck state on component mount and handle mobile detection
  useEffect(() => {
    console.log(
      "🚀 AIReportLoading component mounted, clearing any stuck state",
    );
    console.log("📱 Mobile detection:", isMobile);
    localStorage.removeItem("ai-generation-in-progress");
    localStorage.removeItem("ai-generation-timestamp");

    // Mobile vs desktop detection
    if (isMobile) {
      console.log("📱 Mobile detected - auto-cycling cards");
    } else {
      console.log("💻 Desktop detected - showing all cards");
    }
  }, [isMobile]);

  // Auto-cycle through mobile steps every 4 seconds, only once
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentMobileStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        // Stay on the last step (step 6)
        return prev;
      });
    }, 4200); // Slightly longer timing to match step execution

    return () => clearInterval(interval);
  }, [isMobile, steps.length]);

  // Sync mobile step with current step execution for better coordination
  useEffect(() => {
    if (isMobile && currentStep >= 0) {
      // Optionally sync with current executing step, but allow auto-cycling to continue
      // This ensures mobile doesn't fall behind the actual execution
      if (currentStep > currentMobileStep) {
        setCurrentMobileStep(Math.min(currentStep, steps.length - 1));
      }
    }
  }, [currentStep, isMobile, currentMobileStep, steps.length]);

  // Calculate target progress based on step completion and elapsed time
  useEffect(() => {
    const totalSteps = steps.length;
    const completedStepsCount = completedSteps.size;
    const activeStepProgress = currentStep >= 0 ? 1 : 0;

    // Each completed step is worth (100/totalSteps)%
    // Active step gets partial credit
    const stepProgress = (completedStepsCount * 100) / totalSteps;
    const activeProgress = activeStepProgress * (100 / totalSteps) * 0.3; // 30% of step value for active

    // Optionally, add a time-based minimum progress to avoid stalling
    const elapsed = Date.now() - startTime;
    const minProgress = Math.min((elapsed / 20000) * 90, 90); // 20s = 90%

    let newTargetProgress = Math.max(
      stepProgress + activeProgress,
      minProgress,
    );
    if (isLoadingComplete) {
      newTargetProgress = 100;
    } else {
      newTargetProgress = Math.min(newTargetProgress, 99);
    }
    setTargetProgress(newTargetProgress);
  }, [currentStep, completedSteps, steps.length, isLoadingComplete, startTime]);

  // Smooth progress bar animation toward target
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.1) return targetProgress;
        return prev + diff * 0.05; // Smooth interpolation
      });
    }, 50);
    return () => clearInterval(interval);
  }, [targetProgress]);

  // Reset startTime on mount or quizData change
  useEffect(() => {
    setStartTime(Date.now());
  }, [quizData]);

  // When loading is complete and progress reaches 100, delay and then call onComplete
  useEffect(() => {
    if (isLoadingComplete && Math.abs(progress - 100) < 0.1) {
      const timeout = setTimeout(() => {
        // Only call onComplete if not already called
        if (typeof onComplete === "function") {
          onComplete(loadingResults);
        }
      }, 350); // 350ms delay for visual finish
      return () => clearTimeout(timeout);
    }
  }, [isLoadingComplete, progress, onComplete, loadingResults]);

  // Generate all 6 characteristics with OpenAI
  const generateAllCharacteristics = async (
    quizData: QuizData,
  ): Promise<string[]> => {
    try {
      const prompt = `Based on this quiz data, generate exactly 6 short positive characteristics that reflect the user's entrepreneurial strengths. Each should be 3-5 words maximum and highlight unique aspects of their entrepreneurial potential.

Quiz Data:
- Self-motivation level: ${quizData.selfMotivationLevel}/5
- Risk comfort level: ${quizData.riskComfortLevel}/5
- Tech skills rating: ${quizData.techSkillsRating}/5
- Direct communication enjoyment: ${quizData.directCommunicationEnjoyment}/5
- Learning preference: ${quizData.learningPreference}
- Organization level: ${quizData.organizationLevel}/5
- Creative work enjoyment: ${quizData.creativeWorkEnjoyment}/5
- Work collaboration preference: ${quizData.workCollaborationPreference}
- Decision making style: ${quizData.decisionMakingStyle}
- Work structure preference: ${quizData.workStructurePreference}
- Long-term consistency: ${quizData.longTermConsistency}/5
- Uncertainty handling: ${quizData.uncertaintyHandling}/5
- Tools familiar with: ${quizData.familiarTools?.join(", ")}
- Main motivation: ${quizData.mainMotivation}
- Weekly time commitment: ${quizData.weeklyTimeCommitment}
- Income goal: ${quizData.successIncomeGoal}

Return a JSON object with this exact structure:
{
  "characteristics": ["characteristic 1", "characteristic 2", "characteristic 3", "characteristic 4", "characteristic 5", "characteristic 6"]
}

Examples: {"characteristics": ["Highly self-motivated", "Strategic risk-taker", "Tech-savvy innovator", "Clear communicator", "Organized planner", "Creative problem solver"]}`;

      // Add timeout wrapper for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      let data: any;
      try {
        const response = await fetch("/api/openai-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            maxTokens: 200,
            temperature: 0.7,
            responseFormat: { type: "json_object" },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(
            `API request failed with status ${response.status}: ${response.statusText}`,
          );
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`,
          );
        }

        data = await response.json();
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError?.name === "AbortError") {
          console.error("API request timed out after 15 seconds");
          throw new Error("API request timed out");
        }
        throw fetchError;
      }

      // Check if we have content to work with
      if (!data.content) {
        console.error("No content in API response:", data);
        throw new Error("No content in API response");
      }

      // Clean up the response content (remove markdown code blocks if present)
      let cleanContent = data.content || data || "";
      if (
        typeof cleanContent === "string" &&
        cleanContent.includes("```json")
      ) {
        cleanContent = cleanContent
          .replace(/```json\n?/g, "")
          .replace(/```/g, "");
      }

      const parsed = JSON.parse(cleanContent);
      if (
        parsed &&
        parsed.characteristics &&
        Array.isArray(parsed.characteristics) &&
        parsed.characteristics.length === 6
      ) {
        return parsed.characteristics;
      } else {
        console.error("Invalid response format:", parsed);
        throw new Error(
          `Invalid response format - expected 6 characteristics, got: ${parsed?.characteristics?.length || "none"}`,
        );
      }
    } catch (error) {
      console.error("Error generating all characteristics:", error);
      console.log("Using fallback characteristics due to API failure");

      // Robust fallback characteristics based on quiz data
      const fallbackCharacteristics = [
        quizData.selfMotivationLevel >= 4
          ? "Highly self-motivated"
          : "Moderately self-motivated",
        quizData.riskComfortLevel >= 4
          ? "High risk tolerance"
          : "Moderate risk tolerance",
        quizData.techSkillsRating >= 4
          ? "Strong tech skills"
          : "Adequate tech skills",
        quizData.directCommunicationEnjoyment >= 4
          ? "Excellent communicator"
          : "Good communicator",
        quizData.organizationLevel >= 4
          ? "Highly organized planner"
          : "Flexible approach to planning",
        quizData.creativeWorkEnjoyment >= 4
          ? "Creative problem solver"
          : "Analytical approach to challenges",
      ];

      console.log(
        "Generated fallback characteristics:",
        fallbackCharacteristics,
      );
      return fallbackCharacteristics;
    }
  };

  // Generate business fit descriptions
  const generateBusinessFitDescriptions = async (
    quizData: QuizData,
  ): Promise<{ [key: string]: string }> => {
    try {
      const { calculateAdvancedBusinessModelMatches } = await import(
        "../utils/advancedScoringAlgorithm"
      );
      const topThreeAdvanced = calculateAdvancedBusinessModelMatches(quizData);

      const businessModels = topThreeAdvanced.slice(0, 3).map((match) => ({
        id: match.id,
        name: match.name,
        score: match.score,
      }));

      const prompt = `Based on the quiz data and business model matches, generate personalized explanations for why each business model fits this user. Focus on specific aspects of their profile that align with each model.

Quiz Data Summary:
- Self-motivation: ${quizData.selfMotivationLevel}/5
- Risk tolerance: ${quizData.riskComfortLevel}/5
- Tech skills: ${quizData.techSkillsRating}/5
- Time commitment: ${quizData.weeklyTimeCommitment} hours/week
- Income goal: ${quizData.successIncomeGoal}
- Learning preference: ${quizData.learningPreference}
- Work collaboration: ${quizData.workCollaborationPreference}

Business Models:
${businessModels.map((model) => `- ${model.name} (${model.score}% fit)`).join("\n")}

For each business model, write a 2-3 sentence explanation of why it fits this user's profile. Focus on specific strengths and alignments.

Return JSON format:
{
  "descriptions": [
    {"businessId": "business-id", "description": "explanation here"},
    {"businessId": "business-id", "description": "explanation here"},
    {"businessId": "business-id", "description": "explanation here"}
  ]
}`;

      const response = await fetch("/api/generate-business-fit-descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizData, businessMatches: businessModels }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate business fit descriptions");
      }

      const data = await response.json();
      let cleanContent = data.content || "";

      // If data.content is not available, check if data itself is a string
      if (!cleanContent && typeof data === "string") {
        cleanContent = data;
      }

      // If we still don't have content, try to stringify the data object
      if (!cleanContent && typeof data === "object" && data !== null) {
        cleanContent = JSON.stringify(data);
      }

      // Ensure cleanContent is a string before proceeding
      if (typeof cleanContent !== "string") {
        throw new Error("Invalid response format: expected string content");
      }

      if (cleanContent.includes("```json")) {
        cleanContent = cleanContent
          .replace(/```json\n?/g, "")
          .replace(/```/g, "");
      }

      const parsed = JSON.parse(cleanContent);
      const descriptionsMap: { [key: string]: string } = {};

      if (parsed && parsed.descriptions && Array.isArray(parsed.descriptions)) {
        parsed.descriptions.forEach(
          (desc: { businessId: string; description: string }) => {
            descriptionsMap[desc.businessId] = desc.description;
          },
        );
      }

      return descriptionsMap;
    } catch (error) {
      console.error("Error generating business fit descriptions:", error);
      // Set fallback descriptions
      const fallbackDescriptions: { [key: string]: string } = {};
      const { calculateAdvancedBusinessModelMatches } = await import(
        "../utils/advancedScoringAlgorithm"
      );
      const topThreeAdvanced = calculateAdvancedBusinessModelMatches(quizData);

      topThreeAdvanced.slice(0, 3).forEach((match, index) => {
        fallbackDescriptions[match.id] =
          `This business model aligns well with your ${quizData.selfMotivationLevel >= 4 ? "high self-motivation" : "self-driven nature"} and ${quizData.weeklyTimeCommitment} hours/week availability. Your ${quizData.techSkillsRating >= 4 ? "strong" : "adequate"} technical skills and ${quizData.riskComfortLevel >= 4 ? "high" : "moderate"} risk tolerance make this a ${index === 0 ? "perfect" : index === 1 ? "excellent" : "good"} match for your entrepreneurial journey.`;
      });

      return fallbackDescriptions;
    }
  };

  // Generate business avoid descriptions for bottom 3 matches
  const generateBusinessAvoidDescriptions = async (
    quizData: QuizData,
  ): Promise<{ [key: string]: string }> => {
    try {
      const { calculateAdvancedBusinessModelMatches } = await import(
        "../utils/advancedScoringAlgorithm"
      );
      const { businessPaths } = await import("../../../shared/businessPaths");

      const allMatches = calculateAdvancedBusinessModelMatches(quizData);

      // Get the bottom 3 business models (worst matches)
      const bottomThree = allMatches.slice(-3).reverse(); // reverse to get worst-first order

      const businessMatches = bottomThree.map((match) => {
        const pathData = businessPaths.find((path) => path.id === match.id);
        return {
          id: match.id,
          name: match.name,
          fitScore: match.score,
          description:
            pathData?.description || "Business model description not available",
          timeToProfit: pathData?.timeToProfit || "Variable",
          startupCost: pathData?.startupCost || "Variable",
          potentialIncome: pathData?.potentialIncome || "Variable",
        };
      });

      const response = await fetch(
        "/api/generate-business-avoid-descriptions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizData: quizData,
            businessMatches: businessMatches,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate business avoid descriptions");
      }

      const data = await response.json();
      const descriptionsMap: { [key: string]: string } = {};

      if (data && data.descriptions && Array.isArray(data.descriptions)) {
        data.descriptions.forEach(
          (desc: { businessId: string; description: string }) => {
            descriptionsMap[desc.businessId] = desc.description;
          },
        );
      }

      return descriptionsMap;
    } catch (error) {
      console.error("Error generating business avoid descriptions:", error);
      // Set fallback descriptions
      const fallbackDescriptions: { [key: string]: string } = {};
      const { calculateAdvancedBusinessModelMatches } = await import(
        "../utils/advancedScoringAlgorithm"
      );
      const allMatches = calculateAdvancedBusinessModelMatches(quizData);
      const bottomThree = allMatches.slice(-3).reverse();

      bottomThree.forEach((match) => {
        fallbackDescriptions[match.id] =
          `This business model scored ${match.score}% for your profile, indicating significant misalignment with your current goals, skills, and preferences. Based on your quiz responses, you would likely face substantial challenges in this field that could impact your success. Consider focusing on higher-scoring business models that better match your natural strengths and current situation. Your ${quizData.riskComfortLevel <= 2 ? "lower risk tolerance" : "risk preferences"} and ${quizData.weeklyTimeCommitment} hours/week availability suggest other business models would be more suitable for your entrepreneurial journey.`;
      });

      return fallbackDescriptions;
    }
  };

  // Add useRef guard for generateReport
  const hasGeneratedReport = useRef(false);
  useEffect(() => {
    let isMounted = true;
    let stepTimeouts: NodeJS.Timeout[] = [];
    let progressInterval: NodeJS.Timeout | null = null;
    let startTime = Date.now();
    let aiDone = false;
    let aiPromiseResolve: (() => void) | null = null;
    const aiPromiseWrapper = new Promise<void>((resolve) => {
      aiPromiseResolve = resolve;
    });

    // Helper to animate progress bar smoothly
    const animateProgress = (target: number, duration: number) => {
      const initial = progress;
      const start = Date.now();
      if (progressInterval) clearInterval(progressInterval);
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - start;
        const ratio = Math.min(elapsed / duration, 1);
        setProgress(initial + (target - initial) * ratio);
        if (ratio >= 1 && progressInterval) {
          clearInterval(progressInterval);
        }
      }, 30);
    };

    // At the top, set a constant for total loading time
    const TOTAL_LOADING_TIME = 24000; // 24 seconds

    // Step-by-step animation
    const runSteps = async () => {
      startTime = Date.now();
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setProgress(0);
      setIsLoadingComplete(false);
      setTargetProgress(0);
      setSteps(loadingSteps);
      setLoadingResults({});

      // Calculate per-card duration for steps 1-5
      const perCardDuration = 7000; // 7 seconds per card
      let aiDone = false;
      let aiPromiseResolve: (() => void) | null = null;
      const aiPromiseWrapper = new Promise<void>((resolve) => {
        aiPromiseResolve = resolve;
      });

      // Start AI generation in parallel
      const aiPromise = (async () => {
        // Check if AI insights generation is already in progress
        const aiGenerationInProgress = localStorage.getItem(
          "ai-generation-in-progress",
        );
        const flagTimestamp = localStorage.getItem("ai-generation-timestamp");
        const currentTime = Date.now();

        // Clear flag if it's older than 2 minutes (stuck flag)
        if (aiGenerationInProgress === "true" && flagTimestamp) {
          const timeSinceFlag = currentTime - parseInt(flagTimestamp);
          if (timeSinceFlag > 120000) {
            // 2 minutes
            console.log("🧹 Clearing stuck AI generation flag");
            localStorage.removeItem("ai-generation-in-progress");
            localStorage.removeItem("ai-generation-timestamp");
          } else {
            console.log(
              "🔄 AI generation already in progress, skipping duplicate call",
            );
            return;
          }
        } else if (aiGenerationInProgress === "true") {
          console.log(
            "🔄 AI generation already in progress (no timestamp), skipping duplicate call",
          );
          return;
        }

        // Set flag to prevent duplicate calls
        localStorage.setItem("ai-generation-in-progress", "true");
        localStorage.setItem("ai-generation-timestamp", currentTime.toString());

        const aiStartTime = Date.now();
        let currentAiResults = {};

        // Create fallback quiz data for development mode
        const getFallbackQuizData = (): QuizData => ({
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
          pathPreference: "proven-path",
          controlImportance: 4,

          // Round 6: Business Model Fit Filters
          onlinePresenceComfort: "somewhat-comfortable",
          clientCallsComfort: "somewhat-comfortable",
          physicalShippingOpenness: "open-to-it",
          workStylePreference: "structured-flexible-mix",
          socialMediaInterest: 3,
          ecosystemParticipation: "participate-somewhat",
          existingAudience: "none",
          promotingOthersOpenness: "somewhat-open",
          teachVsSolvePreference: "solve-problems",
          meaningfulContributionImportance: 4,
        });

        // Use fallback data if quizData is null/undefined (DEV mode)
        const activeQuizData = quizData || getFallbackQuizData();

        if (!quizData) {
          console.log("Using fallback quiz data for development mode");
        }

        try {
          // Step 1: Analyze profile (immediate)
          const step1Result = await executeStep(0, async () => {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return { profileAnalyzed: true };
          });
          currentAiResults = { ...currentAiResults, ...step1Result };

          // Step 2: Generate AI-powered personalized paths
          const step2Result = await executeStep(1, async () => {
            const { generateAIPersonalizedPaths } = await import(
              "../utils/quizLogic"
            );
            const paths = await generateAIPersonalizedPaths(activeQuizData);
            return { personalizedPaths: paths };
          });
          currentAiResults = { ...currentAiResults, ...step2Result };

          // Step 3: Generate AI insights (SINGLE API CALL)
          const step3Result = await executeStep(2, async () => {
            console.log("🔄 Starting AI insights generation (single call)");
            console.log("Quiz data being used:", {
              mainMotivation: activeQuizData.mainMotivation,
              successIncomeGoal: activeQuizData.successIncomeGoal,
              techSkillsRating: activeQuizData.techSkillsRating,
              riskComfortLevel: activeQuizData.riskComfortLevel,
              directCommunicationEnjoyment:
                activeQuizData.directCommunicationEnjoyment,
            });

            const { AIService } = await import("../utils/aiService");
            const aiService = AIService.getInstance();
            const pathsForInsights =
              (currentAiResults as any).personalizedPaths?.slice(0, 3) || [];

            console.log(
              "Paths for insights:",
              pathsForInsights.map((p: any) => `${p.name} (${p.fitScore}%)`),
            );

            // Make PREVIEW-ONLY API call for quiz loading phase
            try {
              console.log(
                "📊 Generating PREVIEW insights ONLY during quiz loading phase (no full report data)",
              );
              const previewData = await aiService.generateResultsPreview(
                activeQuizData,
                pathsForInsights,
              );

              console.log(
                "✅ Preview insights generation completed successfully",
              );
              console.log(
                "Generated preview summary:",
                previewData.previewInsights?.substring(0, 100) + "...",
              );

              // Convert preview data to expected format for backward compatibility
              const formattedInsights = {
                personalizedSummary: previewData.previewInsights,
                customRecommendations: previewData.keyInsights,
                potentialChallenges: [], // Not used in preview
                successStrategies: previewData.successPredictors,
                personalizedActionPlan: {
                  week1: ["Complete market research", "Set up basic workspace"],
                  month1: [
                    "Launch minimum viable version",
                    "Gather initial feedback",
                  ],
                  month3: [
                    "Optimize based on feedback",
                    "Scale successful elements",
                  ],
                  month6: ["Expand offerings", "Build team if needed"],
                },
                motivationalMessage:
                  "You have the foundation to build a successful business. Stay consistent and trust the process.",
              };

              // Store the topPaths array used for the OpenAI call along with the insights
              localStorage.setItem(
                "quiz-completion-ai-insights",
                JSON.stringify({
                  insights: formattedInsights,
                  topPaths: pathsForInsights, // <-- store the exact topPaths used
                  analysis: null, // Will be generated on-demand if needed
                  timestamp: Date.now(),
                  complete: true,
                  error: false,
                }),
              );

              return { aiInsights: formattedInsights };
            } catch (error) {
              console.error("❌ AI insights generation failed:", error);
              console.error(
                "Error details:",
                error instanceof Error ? error.message : "Unknown error",
              );

              // Return null to trigger fallback in Results component
              return { aiInsights: null, aiGenerationError: error };
            }
          });
          currentAiResults = { ...currentAiResults, ...step3Result };

          // Step 4: Generate characteristics
          const step4Result = await executeStep(3, async () => {
            try {
              const characteristics =
                await generateAllCharacteristics(activeQuizData);
              return { allCharacteristics: characteristics };
            } catch (error) {
              console.error(
                "Error in step 4 - characteristics generation:",
                error,
              );
              // Return fallback characteristics if generation fails
              const fallbackCharacteristics = [
                "Self-motivated entrepreneur",
                "Strategic business thinker",
                "Adaptable problem solver",
                "Goal-oriented achiever",
                "Dedicated professional",
                "Growth-minded individual",
              ];
              console.log(
                "Using step 4 fallback characteristics:",
                fallbackCharacteristics,
              );
              return { allCharacteristics: fallbackCharacteristics };
            }
          });
          currentAiResults = { ...currentAiResults, ...step4Result };

          // Step 5: Generate business fit and avoid descriptions
          const step5Result = await executeStep(4, async () => {
            const [fitDescriptions, avoidDescriptions] = await Promise.all([
              generateBusinessFitDescriptions(activeQuizData),
              generateBusinessAvoidDescriptions(activeQuizData),
            ]);
            return {
              businessFitDescriptions: fitDescriptions,
              businessAvoidDescriptions: avoidDescriptions,
            };
          });
          currentAiResults = { ...currentAiResults, ...step5Result };

          // Step 6: Finalize and store AI data for Results component
          const step6Result = await executeStep(5, async () => {
            // Use the AI insights that were already generated in step 3
            const existingInsights = (currentAiResults as any).aiInsights;

            if (existingInsights) {
              console.log("📦 Storing AI insights for Results component");

              // Store in localStorage for Results component to use
              const aiData = {
                insights: existingInsights,
                analysis: null, // Will be generated on-demand if needed
                topPaths:
                  (currentAiResults as any).personalizedPaths?.slice(0, 3) ||
                  [],
                timestamp: Date.now(),
                complete: true,
                error: false,
              };
              localStorage.setItem(
                "quiz-completion-ai-insights",
                JSON.stringify(aiData),
              );

              console.log(
                "✅ AI data stored successfully for Results component",
              );
              return { finalizedData: true };
            } else {
              console.log("⚠️ No AI insights found, storing fallback data");

              // Store fallback indicator
              const aiData = {
                insights: null,
                analysis: null,
                topPaths:
                  (currentAiResults as any).personalizedPaths?.slice(0, 3) ||
                  [],
                timestamp: Date.now(),
                complete: false,
                error: true,
              };
              localStorage.setItem(
                "quiz-completion-ai-insights",
                JSON.stringify(aiData),
              );

              return { finalizedData: false };
            }
          });
          currentAiResults = { ...currentAiResults, ...step6Result };

          // Ensure minimum 25 seconds duration to match mobile step timing
          const elapsedTime = Date.now() - aiStartTime;
          const minimumDuration = 25000; // 25 seconds (6 steps × 4.2 seconds)

          if (elapsedTime < minimumDuration) {
            const remainingTime = minimumDuration - elapsedTime;
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
          }

          // Set target progress to 100% only when everything is truly complete
          // setTargetProgress(100); // Removed
          setIsLoadingComplete(true);

          // Clear the generation flag
          localStorage.removeItem("ai-generation-in-progress");
          localStorage.removeItem("ai-generation-timestamp");

          // Mark this report as viewed now that it's been fully loaded
          const quizAttemptId = parseInt(
            localStorage.getItem("currentQuizAttemptId") || "0",
          );
          if (quizAttemptId && quizData) {
            reportViewManager.markReportAsViewed(
              quizAttemptId,
              quizData,
              userEmail,
            );
            console.log(
              `Report for quiz attempt ${quizAttemptId} marked as viewed after AI loading completion`,
            );
          }

          // Complete and pass data to parent
          // onComplete({
          //   personalizedPaths: (currentResults as any).personalizedPaths || [],
          //   aiInsights: (currentResults as any).aiInsights || null,
          //   allCharacteristics: (currentResults as any).allCharacteristics || [],
          //   businessFitDescriptions:
          //     (currentResults as any).businessFitDescriptions || {},
          //   businessAvoidDescriptions:
          //     (currentResults as any).businessAvoidDescriptions || {},
          // });
        } catch (error) {
          console.error("Error generating report:", error);

          // Ensure minimum 25 seconds duration even on error
          const elapsedTime = Date.now() - aiStartTime;
          const minimumDuration = 25000; // 25 seconds

          if (elapsedTime < minimumDuration) {
            const remainingTime = minimumDuration - elapsedTime;
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
          }

          // Set target progress to 100% when complete (even with errors)
          // setTargetProgress(100); // Removed
          setIsLoadingComplete(true);

          // Clear the generation flag even on error
          localStorage.removeItem("ai-generation-in-progress");
          localStorage.removeItem("ai-generation-timestamp");

          // Mark this report as viewed even on error (user saw the loading process)
          const quizAttemptId = parseInt(
            localStorage.getItem("currentQuizAttemptId") || "0",
          );
          if (quizAttemptId && quizData) {
            reportViewManager.markReportAsViewed(
              quizAttemptId,
              quizData,
              userEmail,
            );
            console.log(
              `Report for quiz attempt ${quizAttemptId} marked as viewed after AI loading completion (with errors)`,
            );
          }

          // In case of error, still complete with current data
          onComplete({
            personalizedPaths:
              (currentAiResults as any).personalizedPaths || [],
            aiInsights: (currentAiResults as any).aiInsights || null,
            allCharacteristics:
              (currentAiResults as any).allCharacteristics || [],
            businessFitDescriptions:
              (currentAiResults as any).businessFitDescriptions || {},
            businessAvoidDescriptions:
              (currentAiResults as any).businessAvoidDescriptions || {},
          });
        }
      })();

      for (let i = 0; i < loadingSteps.length; i++) {
        if (!isMounted) return;
        setCurrentStep(i);
        setSteps((prev) =>
          prev.map((step, idx) => ({
            ...step,
            status: idx === i ? "active" : idx < i ? "completed" : "pending",
          })),
        );
        if (i < loadingSteps.length - 1) {
          // Steps 1-5: normal duration
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, perCardDuration);
            stepTimeouts.push(timeout);
          });
          setCompletedSteps((prev) => new Set([...Array.from(prev), i]));
        } else {
          // Step 6: wait for AI if not done, otherwise proceed immediately
          setCompletedSteps((prev) => new Set([...Array.from(prev), i]));
          if (!aiDone) {
            await aiPromiseWrapper;
          }
        }
      }

      // Wait for AI to finish if not done (should be instant now)
      await aiPromise;

      // Animate to 100% and rest for <1s
      setTimeout(() => {
        setIsLoadingComplete(true);
        if (typeof onComplete === "function") {
          onComplete(loadingResults);
        }
      }, 700);
    };

    runSteps();

    return () => {
      isMounted = false;
      stepTimeouts.forEach(clearTimeout);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [quizData]);

  const executeStep = async (
    stepIndex: number,
    asyncFunction: () => Promise<any>,
  ) => {
    // Do not update currentStep, setSteps, or setCompletedSteps here
    try {
      const result = await asyncFunction();
      // Store result
      setLoadingResults((prev: any) => ({ ...prev, ...result }));
      return result;
    } catch (error) {
      console.error(`Error in step ${stepIndex}:`, error);
      return {};
    }
  };

  const getStepIcon = (step: LoadingStep, index: number) => {
    const IconComponent = step.icon;

    if (step.status === "completed") {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }

    if (step.status === "active") {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <IconComponent className="h-6 w-6 text-blue-500" />
        </motion.div>
      );
    }

    return <IconComponent className="h-6 w-6 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-white py-4">
      <div className="max-w-4xl mx-auto px-4 relative pt-12">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-4">
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Brain className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI is Creating Your Personalized Report
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our advanced AI is analyzing your responses and generating custom
            insights just for you. This will take about 15-30 seconds.
          </p>
        </motion.div>

        {/* Progress Bar - show at the top for mobile, inside card for desktop */}
        {isMobile ? (
          <div className="w-full max-w-xs mx-auto mb-6">
            <div className="bg-gray-200 rounded-full h-2 mb-2">
              <motion.div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "linear", type: "tween" }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Loading</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        ) : (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gray-50 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "linear", type: "tween" }}
                />
              </div>
            </div>
          </motion.div>
        )}
        {/* Compact Loading Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {isMobile ? (
            // Mobile: Show a unified, single animated loading page
            <motion.div
              className="flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-xl border-2 ring-4 ring-blue-500 border-blue-200 w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
            >
              {/* Animated 3 Dots Loader */}
              <div className="flex items-center justify-center mb-6 h-16">
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    className="w-3 h-3 mx-1 rounded-full bg-blue-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: dot * 0.2,
                    }}
                  />
                ))}
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-2 text-center">
                Generating Your Personalized Report
              </h3>
              <p className="text-base text-blue-700 mb-6 text-center max-w-xs">
                Our advanced AI is analyzing your responses and creating custom
                insights just for you. This usually takes 15-30 seconds.
              </p>
              {/* Removed duplicate progress bar from inside the card */}
            </motion.div>
          ) : (
            // Desktop: Show all cards
            steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`bg-gray-50 rounded-xl p-4 shadow-sm transition-all duration-300 ${
                  step.status === "active"
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : step.status === "completed"
                      ? "ring-2 ring-green-500 bg-green-50"
                      : "ring-1 ring-gray-200"
                }`}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                }}
              >
                <div className="flex items-center mb-2">
                  <div className="flex-shrink-0 mr-3">
                    {getStepIcon(step, index)}
                  </div>
                  {step.status === "active" && (
                    <motion.div
                      className="flex space-x-1 ml-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map((dot) => (
                        <motion.div
                          key={dot}
                          className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: dot * 0.2,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
                <h3
                  className={`text-lg font-semibold mb-1 ${
                    step.status === "active"
                      ? "text-blue-900"
                      : step.status === "completed"
                        ? "text-green-900"
                        : "text-gray-700"
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm ${
                    step.status === "active"
                      ? "text-blue-600"
                      : step.status === "completed"
                        ? "text-green-600"
                        : "text-gray-500"
                  }`}
                >
                  {step.description}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {/* Compact Fun Facts */}
        <motion.div
          className="bg-gray-50 rounded-2xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
            Did you know?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start">
              <div className="text-xl mr-3">🧠</div>
              <div>
                <p className="text-sm text-gray-600">
                  Our AI analyzes over 50 different personality traits and
                  business factors to find your perfect match.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-xl mr-3">🎯</div>
              <div>
                <p className="text-sm text-gray-600">
                  Your personalized report is unique to you - no two reports are
                  exactly the same!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIReportLoading;
