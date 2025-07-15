import React, { useState, useEffect } from "react";
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
  const [visibleMobileSteps, setVisibleMobileSteps] = useState<Set<number>>(
    () => new Set(isMobile ? [0] : [0, 1, 2, 3, 4, 5]),
  ); // Start with first step on mobile, all steps on desktop

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

    // Set initial visible steps based on mobile detection
    if (isMobile) {
      console.log("📱 Mobile detected - showing only step 0");
      setVisibleMobileSteps(new Set([0]));
    } else {
      console.log("💻 Desktop detected - showing all steps");
      setVisibleMobileSteps(new Set([0, 1, 2, 3, 4, 5]));
    }
  }, [isMobile]);

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
      let cleanContent = data.content;
      if (cleanContent.includes("```json")) {
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

      const response = await fetch("/api/openai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          maxTokens: 800,
          temperature: 0.7,
          responseFormat: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate business fit descriptions");
      }

      const data = await response.json();
      let cleanContent = data.content;
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

  useEffect(() => {
    const generateReport = async () => {
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

      const startTime = Date.now();
      let currentResults = {};

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
        currentResults = { ...currentResults, ...step1Result };

        // Step 2: Generate AI-powered personalized paths
        const step2Result = await executeStep(1, async () => {
          const { generateAIPersonalizedPaths } = await import(
            "../utils/quizLogic"
          );
          const paths = await generateAIPersonalizedPaths(activeQuizData);
          return { personalizedPaths: paths };
        });
        currentResults = { ...currentResults, ...step2Result };

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
            (currentResults as any).personalizedPaths?.slice(0, 3) || [];

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
              potentialChallenges: previewData.successPredictors,
              successStrategies: [
                "Focus on building core skills first",
                "Start with proven strategies",
                "Build consistent daily habits",
                "Connect with other entrepreneurs",
              ],
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
        currentResults = { ...currentResults, ...step3Result };

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
        currentResults = { ...currentResults, ...step4Result };

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
        currentResults = { ...currentResults, ...step5Result };

        // Step 6: Finalize and store AI data for Results component
        const step6Result = await executeStep(5, async () => {
          // Use the AI insights that were already generated in step 3
          const existingInsights = (currentResults as any).aiInsights;

          if (existingInsights) {
            console.log("📦 Storing AI insights for Results component");

            // Store in localStorage for Results component to use
            const aiData = {
              insights: existingInsights,
              analysis: null, // Will be generated on-demand if needed
              topPaths:
                (currentResults as any).personalizedPaths?.slice(0, 3) || [],
              timestamp: Date.now(),
              complete: true,
              error: false,
            };
            localStorage.setItem(
              "quiz-completion-ai-insights",
              JSON.stringify(aiData),
            );

            console.log("✅ AI data stored successfully for Results component");
            return { finalizedData: true };
          } else {
            console.log("⚠️ No AI insights found, storing fallback data");

            // Store fallback indicator
            const aiData = {
              insights: null,
              analysis: null,
              topPaths:
                (currentResults as any).personalizedPaths?.slice(0, 3) || [],
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
        currentResults = { ...currentResults, ...step6Result };

        // Ensure minimum 10 seconds duration
        const elapsedTime = Date.now() - startTime;
        const minimumDuration = 10000; // 10 seconds

        if (elapsedTime < minimumDuration) {
          const remainingTime = minimumDuration - elapsedTime;
          await new Promise((resolve) => setTimeout(resolve, remainingTime));

          // Update progress to 100% during final wait
          setProgress(100);
        }

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
        onComplete({
          personalizedPaths: (currentResults as any).personalizedPaths || [],
          aiInsights: (currentResults as any).aiInsights || null,
          allCharacteristics: (currentResults as any).allCharacteristics || [],
          businessFitDescriptions:
            (currentResults as any).businessFitDescriptions || {},
          businessAvoidDescriptions:
            (currentResults as any).businessAvoidDescriptions || {},
        });
      } catch (error) {
        console.error("Error generating report:", error);

        // Ensure minimum 10 seconds duration even on error
        const elapsedTime = Date.now() - startTime;
        const minimumDuration = 10000; // 10 seconds

        if (elapsedTime < minimumDuration) {
          const remainingTime = minimumDuration - elapsedTime;
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
          setProgress(100);
        }

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
          personalizedPaths: (currentResults as any).personalizedPaths || [],
          aiInsights: (currentResults as any).aiInsights || null,
          allCharacteristics: (currentResults as any).allCharacteristics || [],
          businessFitDescriptions:
            (currentResults as any).businessFitDescriptions || {},
          businessAvoidDescriptions:
            (currentResults as any).businessAvoidDescriptions || {},
        });
      }
    };

    generateReport();
  }, [quizData]);

  const executeStep = async (
    stepIndex: number,
    asyncFunction: () => Promise<any>,
  ) => {
    // Mark step as active
    setCurrentStep(stepIndex);

    // On mobile, immediately show the current step
    if (isMobile) {
      console.log(`📱 Mobile: Showing step ${stepIndex}`);
      setVisibleMobileSteps(new Set([stepIndex]));
    }

    // Update step status to active
    setSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        status:
          index === stepIndex
            ? "active"
            : index < stepIndex
              ? "completed"
              : "pending",
      })),
    );

    // Calculate progress range for this step (each step gets equal portion)
    const startProgress = (stepIndex / steps.length) * 100;
    const endProgress = ((stepIndex + 1) / steps.length) * 100;
    const progressRange = endProgress - startProgress;

    // Start the async function
    const resultPromise = asyncFunction();

    // Animate progress smoothly during step execution
    let currentProgress = startProgress;
    const progressInterval = setInterval(
      () => {
        if (currentProgress < endProgress - 1) {
          currentProgress += 1; // Increment by exactly 1%
          setProgress(Math.round(currentProgress));
        }
      },
      ((steps[stepIndex]?.estimatedTime || 3) * 1000) / progressRange,
    ); // Distribute time evenly across the progress range

    try {
      const result = await resultPromise;

      // Clear the interval and ensure final progress for this step
      clearInterval(progressInterval);
      setProgress(Math.round(endProgress));

      // Store result
      setLoadingResults((prev: any) => ({ ...prev, ...result }));

      // Mark step as completed
      setCompletedSteps((prev) => new Set([...prev, stepIndex]));

      // Update step status to completed
      setSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index <= stepIndex ? "completed" : "pending",
        })),
      );

      // Wait a moment to show completion, then move to next step on mobile
      if (isMobile && stepIndex < steps.length - 1) {
        console.log(
          `📱 Mobile: Step ${stepIndex} completed, moving to step ${stepIndex + 1}`,
        );
        // Small delay to show the completed state
        await new Promise((resolve) => setTimeout(resolve, 800));
        const nextStepIndex = stepIndex + 1;
        console.log(`📱 Mobile: Now showing step ${nextStepIndex}`);
        setVisibleMobileSteps(new Set([nextStepIndex]));
      }

      return result;
    } catch (error) {
      console.error(`Error in step ${stepIndex}:`, error);

      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setProgress(Math.round(endProgress));

      // Continue with fallback - mark as completed despite error
      setCompletedSteps((prev) => new Set([...prev, stepIndex]));

      // Update step status to completed even on error
      setSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index <= stepIndex ? "completed" : "pending",
        })),
      );

      // On mobile, still advance to next step even on error
      if (isMobile && stepIndex < steps.length - 1) {
        console.log(
          `📱 Mobile: Step ${stepIndex} had error, still moving to step ${stepIndex + 1}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 800));
        const nextStepIndex = stepIndex + 1;
        console.log(
          `📱 Mobile: Now showing step ${nextStepIndex} (after error)`,
        );
        setVisibleMobileSteps(new Set([nextStepIndex]));
      }

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

        {/* Progress Bar */}
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
                transition={{
                  duration: 0.3,
                  ease: "linear",
                  type: "tween",
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Compact Loading Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <AnimatePresence mode="wait">
            {steps
              .filter((step, index) => {
                // On mobile, only show steps that are in the visible set
                // On desktop, show all steps
                return !isMobile || visibleMobileSteps.has(index);
              })
              .map((step, index) => {
                // Find the original index for proper step handling
                const originalIndex = steps.findIndex((s) => s.id === step.id);
                return (
                  <motion.div
                    key={step.id}
                    className={`${
                      isMobile
                        ? "bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-xl border-2"
                        : "bg-gray-50 rounded-xl p-4 shadow-sm"
                    } transition-all duration-300 ${
                      step.status === "active"
                        ? isMobile
                          ? "ring-4 ring-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300"
                          : "ring-2 ring-blue-500 bg-blue-50"
                        : step.status === "completed"
                          ? isMobile
                            ? "ring-4 ring-green-400 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300"
                            : "ring-2 ring-green-500 bg-green-50"
                          : isMobile
                            ? "ring-2 ring-gray-200 border-gray-200"
                            : "ring-1 ring-gray-200"
                    }`}
                    initial={{
                      opacity: 0,
                      scale: isMobile ? 0.8 : 0.9,
                      y: isMobile ? 30 : 20,
                      rotateX: isMobile ? 45 : 0,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      rotateX: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: isMobile ? 0.8 : 0.9,
                      y: isMobile ? -30 : -20,
                      rotateX: isMobile ? -45 : 0,
                    }}
                    transition={{
                      duration: isMobile ? 0.5 : 0.3,
                      delay: index * 0.05,
                      type: isMobile ? "spring" : "tween",
                      stiffness: isMobile ? 120 : undefined,
                    }}
                    layout
                  >
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 mr-3">
                        {getStepIcon(step, originalIndex)}
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
                              className={`${
                                isMobile ? "w-3 h-3" : "w-1.5 h-1.5"
                              } bg-blue-500 rounded-full`}
                              animate={{
                                scale: isMobile ? [1, 1.4, 1] : [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5],
                                y: isMobile ? [0, -8, 0] : [0, 0, 0],
                              }}
                              transition={{
                                duration: isMobile ? 1.2 : 1,
                                repeat: Infinity,
                                delay: dot * 0.2,
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </div>
                    <h3
                      className={`${
                        isMobile ? "text-2xl" : "text-lg"
                      } font-semibold mb-1 ${
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
                      className={`${isMobile ? "text-base" : "text-sm"} ${
                        step.status === "active"
                          ? "text-blue-600"
                          : step.status === "completed"
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      {step.description}
                    </p>
                    {isMobile && (
                      <motion.div
                        className="mt-4 text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-full inline-block">
                          <span className="font-bold text-sm">
                            Step {originalIndex + 1} of {steps.length}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>
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
