import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  Target,
  Brain,
  Award,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  Zap,
  Calendar,
  BarChart3,
  Lightbulb,
  Clock,
  DollarSign,
  Shield,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { QuizData, BusinessPath } from "../types";
import { generateAIPersonalizedPaths } from "../utils/quizLogic";
import { businessModelService } from "../utils/businessModelService";
import { AIService } from "../utils/aiService";
import { AICacheManager } from "../utils/aiCacheManager";
import { useNavigate } from "react-router-dom";
import {
  calculatePersonalityScores,
  getPersonalityDescription,
} from "../../../shared/personalityScoring";
import { renderMarkdownContent } from "../utils/markdownUtils";
import { reportViewManager } from "../utils/reportViewManager";

// Helper functions to convert stored numbers back to original quiz ranges
const getIncomeRangeLabel = (value: number): string => {
  if (value === 500) return "Less than $500";
  if (value === 1250) return "$500–$2,000";
  if (value === 3500) return "$2,000–$5,000";
  if (value === 7500) return "$5,000+";
  return `$${value}`;
};

const getInvestmentRangeLabel = (value: number): string => {
  if (value === 0) return "$0";
  if (value === 125) return "Under $250";
  if (value === 625) return "$250–$1,000";
  if (value === 1500) return "$1,000+";
  return `$${value}`;
};

const getTimeCommitmentRangeLabel = (value: number): string => {
  if (value === 3) return "Less than 5 hours";
  if (value === 7) return "5–10 hours";
  if (value === 17) return "10–25 hours";
  if (value === 35) return "25+ hours";
  return `${value} hours`;
};

const getTimelineLabel = (value: string): string => {
  const labels: Record<string, string> = {
    "under-1-month": "Under 1 month",
    "1-3-months": "1–3 months",
    "3-6-months": "3–6 months",
    "no-rush": "No rush",
  };
  return labels[value] || value.replace("-", " ");
};

// Helper functions for immediate business model data
const getBusinessModelDescription = (businessId: string): string => {
  const descriptions: Record<string, string> = {
    "affiliate-marketing":
      "Promote other people's products and earn commission on sales. Build an audience and recommend products you trust.",
    freelancing:
      "Offer specialized services to clients on a project or contract basis. Leverage your existing skills for immediate income.",
    "content-creation":
      "Create valuable content and monetize through multiple channels including sponsorships, ads, and product sales.",
    "social-media-agency":
      "Help businesses grow their social media presence and engagement through strategic content and campaigns.",
    "online-tutoring":
      "Share your expertise through 1-on-1 or group coaching programs. Teach skills you've already mastered.",
    "e-commerce":
      "Sell physical or digital products through your own online store. Build a brand around products you're passionate about.",
    "local-service":
      "Provide services to local businesses and consumers. Bridge the gap between demand and supply in your area.",
    "ai-marketing-agency":
      "Leverage AI tools to provide marketing solutions to businesses. Combine technology with marketing expertise.",
    copywriting:
      "Write compelling content for businesses and individuals. Help brands communicate their message effectively.",
    "youtube-automation":
      "Create and manage monetized YouTube channels with streamlined content production systems.",
    "virtual-assistant":
      "Provide administrative and business support remotely. Help busy entrepreneurs focus on high-value activities.",
    "high-ticket-sales":
      "Sell high-value products or services for businesses. Focus on quality relationships and premium offerings.",
    "saas-development":
      "Build software applications that solve problems for businesses or consumers. Create recurring revenue streams.",
    "digital-services":
      "Offer digital marketing and web services to businesses. Help companies establish their online presence.",
    "investing-trading":
      "Generate returns through strategic investment and trading activities. Build wealth through financial markets.",
    "online-reselling":
      "Buy and resell products online for profit. Find undervalued items and sell them at market value.",
    "handmade-goods":
      "Create and sell handmade products online. Turn your creative skills into a profitable business.",
  };
  return (
    descriptions[businessId] ||
    "A promising business opportunity that matches your skills and goals."
  );
};

const getBusinessModelTimeToProfit = (businessId: string): string => {
  const timeframes: Record<string, string> = {
    "affiliate-marketing": "2-6 months",
    freelancing: "1-2 weeks",
    "content-creation": "3-8 months",
    "social-media-agency": "1-3 months",
    "online-tutoring": "2-4 weeks",
    "e-commerce": "2-6 months",
    "local-service": "1-4 weeks",
    "ai-marketing-agency": "2-4 months",
    copywriting: "1-3 weeks",
    "youtube-automation": "6-12 months",
    "virtual-assistant": "1-2 weeks",
    "high-ticket-sales": "2-6 months",
    "saas-development": "6-18 months",
    "digital-services": "1-3 months",
    "investing-trading": "Ongoing",
    "online-reselling": "1-4 weeks",
    "handmade-goods": "2-8 weeks",
  };
  return timeframes[businessId] || "2-6 months";
};

const getBusinessModelStartupCost = (businessId: string): string => {
  const costs: Record<string, string> = {
    "affiliate-marketing": "$0-$500",
    freelancing: "$0-$200",
    "content-creation": "$100-$1,000",
    "social-media-agency": "$200-$800",
    "online-tutoring": "$0-$300",
    "e-commerce": "$500-$5,000",
    "local-service": "$100-$1,000",
    "ai-marketing-agency": "$300-$1,500",
    copywriting: "$0-$200",
    "youtube-automation": "$500-$3,000",
    "virtual-assistant": "$0-$500",
    "high-ticket-sales": "$200-$1,000",
    "saas-development": "$1,000-$10,000",
    "digital-services": "$500-$2,000",
    "investing-trading": "$1,000+",
    "online-reselling": "$200-$2,000",
    "handmade-goods": "$100-$1,000",
  };
  return costs[businessId] || "$200-$1,000";
};

const getBusinessModelPotentialIncome = (businessId: string): string => {
  const incomes: Record<string, string> = {
    "affiliate-marketing": "$500-$10K+/month",
    freelancing: "$1K-$15K+/month",
    "content-creation": "$500-$20K+/month",
    "social-media-agency": "$2K-$25K+/month",
    "online-tutoring": "$500-$8K+/month",
    "e-commerce": "$1K-$50K+/month",
    "local-service": "$1K-$20K+/month",
    "ai-marketing-agency": "$3K-$30K+/month",
    copywriting: "$1K-$12K+/month",
    "youtube-automation": "$500-$15K+/month",
    "virtual-assistant": "$800-$6K+/month",
    "high-ticket-sales": "$5K-$50K+/month",
    "saas-development": "$1K-$100K+/month",
    "digital-services": "$2K-$20K+/month",
    "investing-trading": "Variable",
    "online-reselling": "$500-$10K+/month",
    "handmade-goods": "$500-$8K+/month",
  };
  return incomes[businessId] || "$1K-$10K+/month";
};

interface FullReportProps {
  quizData: QuizData;
  onBack: () => void;
  userEmail?: string | null;
  topPath?: BusinessPath;
  allPaths?: BusinessPath[];
  preloadedData?: {
    personalizedPaths: BusinessPath[];
    aiInsights: any;
    allCharacteristics: string[];
    businessFitDescriptions: { [key: string]: string };
    businessAvoidDescriptions: { [key: string]: string };
  };
}

interface TraitSliderProps {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
}

const TraitSlider: React.FC<TraitSliderProps> = ({
  label,
  value,
  leftLabel,
  rightLabel,
}) => {
  const percentage = Math.round(value * 100);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="relative">
        <div className="w-full h-3 bg-gray-200 rounded-full">
          <div
            className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
          <div
            className="absolute top-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md transform -translate-y-0.5 transition-all duration-500"
            style={{ left: `calc(${percentage}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">{leftLabel}</span>
          <span className="text-xs text-gray-500">{rightLabel}</span>
        </div>
      </div>
    </div>
  );
};

const FullReport: React.FC<FullReportProps> = ({
  quizData,
  onBack,
  userEmail,
  topPath,
  allPaths,
  preloadedData,
}) => {
  const [personalizedPaths, setPersonalizedPaths] = useState<BusinessPath[]>(
    [],
  );
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [allCharacteristics, setAllCharacteristics] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [businessFitDescriptions, setBusinessFitDescriptions] = useState<{
    [key: string]: string;
  }>({});
  const [businessAvoidDescriptions, setBusinessAvoidDescriptions] = useState<{
    [key: string]: string;
  }>({});
  const [isLoadingDescriptions, setIsLoadingDescriptions] = useState(true);

  const navigate = useNavigate();

  // Calculate trait scores using centralized business model service
  const advancedScores = businessModelService.getBusinessModelMatches(quizData);
  const topThreeAdvanced = businessModelService.getTopMatches(quizData, 3);

  // Calculate trait scores using new comprehensive personality algorithm
  const personalityScores = calculatePersonalityScores(quizData);
  const personalityDescriptions = getPersonalityDescription(personalityScores);

  // Convert to display format (0-1 scale for UI)
  const traitScores = {
    socialComfort: personalityScores.socialComfort / 5,
    consistency: personalityScores.discipline / 5,
    riskTolerance: personalityScores.riskTolerance / 5,
    techComfort: personalityScores.techComfort / 5,
    motivation: personalityScores.motivation / 5,
    feedbackResilience: personalityScores.feedbackResilience / 5,
    structurePreference: personalityScores.structurePreference / 5,
    creativity: personalityScores.creativity / 5,
    communicationConfidence: personalityScores.confidence / 5,
    adaptability: personalityScores.adaptability / 5,
    focusPreference: personalityScores.focusPreference / 5,
    resilience: personalityScores.resilience / 5,
  };

  const traitSliders = [
    {
      label: "Social Comfort",
      trait: "socialComfort" as keyof typeof traitScores,
      leftLabel: "Introvert",
      rightLabel: "Extrovert",
    },
    {
      label: "Discipline",
      trait: "consistency" as keyof typeof traitScores,
      leftLabel: "Low Discipline",
      rightLabel: "High Discipline",
    },
    {
      label: "Risk Tolerance",
      trait: "riskTolerance" as keyof typeof traitScores,
      leftLabel: "Avoids Risks",
      rightLabel: "Embraces Risks",
    },
    {
      label: "Tech Comfort",
      trait: "techComfort" as keyof typeof traitScores,
      leftLabel: "Low Tech Skills",
      rightLabel: "Tech Savvy",
    },
    {
      label: "Structure Preference",
      trait: "structurePreference" as keyof typeof traitScores,
      leftLabel: "Needs Structure",
      rightLabel: "Works Freely",
    },
    {
      label: "Motivation",
      trait: "motivation" as keyof typeof traitScores,
      leftLabel: "Passive",
      rightLabel: "Self-Driven",
    },
    {
      label: "Feedback Resilience",
      trait: "feedbackResilience" as keyof typeof traitScores,
      leftLabel: "Takes Feedback Personally",
      rightLabel: "Uses Feedback to Grow",
    },
    {
      label: "Creativity",
      trait: "creativity" as keyof typeof traitScores,
      leftLabel: "Analytical",
      rightLabel: "Creative",
    },
    {
      label: "Confidence",
      trait: "communicationConfidence" as keyof typeof traitScores,
      leftLabel: "Low Confidence",
      rightLabel: "High Confidence",
    },
    {
      label: "Adaptability",
      trait: "adaptability" as keyof typeof traitScores,
      leftLabel: "Prefers Stability",
      rightLabel: "Embraces Change",
    },
    {
      label: "Focus Preference",
      trait: "focusPreference" as keyof typeof traitScores,
      leftLabel: "Creative & Varied",
      rightLabel: "Deep & Concentrated",
    },
    {
      label: "Resilience",
      trait: "resilience" as keyof typeof traitScores,
      leftLabel: "Needs Support",
      rightLabel: "Bounces Back Quick",
    },
  ];

  // Sidebar navigation items
  const sidebarItems = [
    { id: "overview", label: "Executive Summary", icon: BarChart3 },
    { id: "ai-analysis", label: "AI Personalized Analysis", icon: Brain },
    { id: "personality-snapshot", label: "Personality Snapshot", icon: Users },
    { id: "top-matches", label: "Your Top 3 Matches", icon: Target },
    {
      id: "business-to-avoid",
      label: "Business Models to Avoid",
      icon: Shield,
    },
    { id: "work-preferences", label: "Work Preferences", icon: Brain },
    {
      id: "market-trends",
      label: "Market Trends & Opportunities",
      icon: TrendingUp,
    },
    { id: "next-steps", label: "Next Steps", icon: Zap },
  ];

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: "instant" });

    // Mark this report as viewed when the full report is accessed
    const quizAttemptId = parseInt(
      localStorage.getItem("currentQuizAttemptId") || "0",
    );
    if (quizAttemptId && quizData) {
      reportViewManager.markReportAsViewed(quizAttemptId, quizData, userEmail);
      console.log(
        `Report for quiz attempt ${quizAttemptId} marked as viewed via FullReport access`,
      );
    }

    // Trigger confetti animation only once per session
    const confettiKey = `confetti_shown_fullreport_${Date.now()}`;
    const sessionKey = `confetti_session_${userEmail || "anonymous"}`;
    const hasShownConfetti = sessionStorage.getItem(sessionKey);

    if (!hasShownConfetti) {
      const triggerConfetti = () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.2 },
        });

        // Second burst for more effect
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.3 },
          });
        }, 250);
      };

      // Trigger confetti after a short delay
      setTimeout(triggerConfetti, 500);

      // Mark confetti as shown for this session
      sessionStorage.setItem(sessionKey, "true");
    }

    // Generate all 6 characteristics with OpenAI
    const generateAllCharacteristics = async () => {
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
        });

        if (!response.ok) {
          throw new Error("Failed to generate characteristics");
        }

        const data = await response.json();

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
          setAllCharacteristics(parsed.characteristics);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error generating all characteristics:", error);
        // Fallback characteristics based on quiz data
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

        setAllCharacteristics(fallbackCharacteristics);
      }
    };

    // Generate AI insights function
    const generateInsights = async (paths: BusinessPath[]) => {
      try {
        const aiService = AIService.getInstance();
        const insights = await aiService.generatePersonalizedInsights(
          quizData,
          paths.slice(0, 3),
        );
        setAiInsights(insights);
      } catch (error) {
        console.error("Error generating AI insights:", error);
        // Set fallback insights that use actual quiz data
        const fallbackInsights = `Based on your quiz responses, you show strong alignment with ${paths[0]?.name || "online business"} with a ${paths[0]?.fitScore || 75}% compatibility score. Your income goal of ${getIncomeRangeLabel(quizData.successIncomeGoal)} and ${getTimeCommitmentRangeLabel(quizData.weeklyTimeCommitment)} per week commitment indicate ${quizData.successIncomeGoal >= 5000 ? "ambitious" : "realistic"} expectations.

Your ${quizData.techSkillsRating}/5 tech skills rating combined with your ${quizData.learningPreference} learning preference suggests you're well-suited for ${quizData.techSkillsRating >= 4 ? "advanced" : "foundational"} business approaches. With ${quizData.riskComfortLevel}/5 risk tolerance, you're positioned to ${quizData.riskComfortLevel >= 4 ? "explore innovative strategies" : "build systematically"}.

This business path aligns with your ${quizData.workCollaborationPreference} work style and ${quizData.decisionMakingStyle} decision-making approach, creating strong potential for sustainable growth.`;

        const fallbackKeyIndicators = [
          `Strong alignment with ${quizData.workStructurePreference} work structure preferences`,
          `${quizData.selfMotivationLevel >= 4 ? "High self-motivation" : "Good self-direction"} supports independent business building`,
          `Your ${quizData.riskComfortLevel >= 4 ? "high" : "moderate"} risk tolerance matches entrepreneurial requirements`,
          `Time commitment of ${getTimeCommitmentRangeLabel(quizData.weeklyTimeCommitment)} allows for realistic progress`,
        ];

        setAiInsights({
          // New structure (priority)
          insights: fallbackInsights,
          keySuccessIndicators: fallbackKeyIndicators,
          personalizedRecommendations: [
            `Given your ${quizData.techSkillsRating}/5 tech skills rating, ${quizData.techSkillsRating >= 4 ? "leverage your technical abilities" : "focus on user-friendly tools initially"}`,
            `Your ${quizData.learningPreference} learning preference suggests ${quizData.learningPreference === "hands_on" ? "jumping into projects quickly" : "studying comprehensive guides first"}`,
            `With ${quizData.riskComfortLevel}/5 risk tolerance, ${quizData.riskComfortLevel >= 4 ? "explore innovative approaches" : "stick to proven methods initially"}`,
            `Focus on ${quizData.workCollaborationPreference === "solo-only" ? "independent execution" : "collaborative opportunities"} that match your work style`,
            `Your ${quizData.organizationLevel}/5 organization level suggests ${quizData.organizationLevel >= 4 ? "creating detailed systems" : "using simple tracking methods"}`,
            `Your motivation toward ${quizData.mainMotivation} provides clear direction for business focus`,
          ],
          potentialChallenges: [
            `Your ${quizData.firstIncomeTimeline} timeline expectation may need adjustment based on typical ${paths[0]?.name || "business"} growth patterns`,
            `Budget of ${getInvestmentRangeLabel(quizData.upfrontInvestment)} ${quizData.upfrontInvestment < 1000 ? "may require creative bootstrapping strategies" : "provides good foundation for getting started"}`,
            `${quizData.selfMotivationLevel <= 3 ? "Building consistent daily habits" : "Maintaining momentum during slow periods"} will be important`,
            `Balancing ${getTimeCommitmentRangeLabel(quizData.weeklyTimeCommitment)} availability with business building requirements`,
          ],
          keyInsights: [
            `Your ${quizData.riskComfortLevel >= 4 ? "high" : "moderate"} risk tolerance aligns well with entrepreneurial requirements`,
            `Time commitment of ${getTimeCommitmentRangeLabel(quizData.weeklyTimeCommitment)} matches realistic business building pace`,
            `Technical skills level provides ${quizData.techSkillsRating >= 4 ? "strong" : "adequate"} foundation for business tools`,
            `Communication comfort supports ${quizData.directCommunicationEnjoyment >= 4 ? "strong" : "developing"} customer relationships`,
          ],
          bestFitCharacteristics: [
            quizData.selfMotivationLevel >= 4
              ? "Highly self-motivated"
              : "Self-directed",
            quizData.riskComfortLevel >= 4
              ? "High risk tolerance"
              : "Calculated risk-taker",
            quizData.techSkillsRating >= 4
              ? "Strong tech skills"
              : "Tech-capable",
            quizData.directCommunicationEnjoyment >= 4
              ? "Excellent communicator"
              : "Good communicator",
            quizData.organizationLevel >= 4
              ? "Highly organized"
              : "Structured approach",
            quizData.creativeWorkEnjoyment >= 4
              ? "Creative problem solver"
              : "Analytical thinker",
          ],
          top3Fits: paths.slice(0, 3).map((path, index) => ({
            model: path.name,
            reason: `This business model aligns well with your ${index === 0 ? "top" : index === 1 ? "secondary" : "alternative"} strengths and offers a ${path.fitScore}% compatibility match with your profile.`,
          })),
          bottom3Avoid: [
            {
              model: "High-risk speculation",
              reason: "Requires risk tolerance beyond your comfort level",
              futureConsideration:
                "Could be viable after building experience and capital",
            },
            {
              model: "Complex technical development",
              reason:
                "May require more technical expertise than currently available",
              futureConsideration:
                "Consider after developing stronger technical skills",
            },
            {
              model: "High-investment businesses",
              reason: "Investment requirements exceed your current budget",
              futureConsideration:
                "Revisit when you have more capital available",
            },
          ],

          // Backward compatibility fields
          personalizedSummary: fallbackInsights,
          customRecommendations: [
            `Given your ${quizData.techSkillsRating}/5 tech skills rating, ${quizData.techSkillsRating >= 4 ? "leverage your technical abilities" : "focus on user-friendly tools initially"}`,
            `Your ${quizData.learningPreference} learning preference suggests ${quizData.learningPreference === "hands_on" ? "jumping into projects quickly" : "studying comprehensive guides first"}`,
            `With ${quizData.riskComfortLevel}/5 risk tolerance, ${quizData.riskComfortLevel >= 4 ? "explore innovative approaches" : "stick to proven methods initially"}`,
          ],
          successStrategies: fallbackKeyIndicators,
          personalizedActionPlan: {
            week1: [
              `Research ${paths[0]?.name || "your chosen business model"} thoroughly`,
              `Set up ${quizData.techSkillsRating >= 4 ? "advanced" : "basic"} tools and systems`,
              `Define target market aligned with your ${quizData.mainMotivation} motivation`,
            ],
            month1: [
              `Launch MVP with ${getInvestmentRangeLabel(quizData.upfrontInvestment)} budget allocation`,
              `Create content that matches your ${quizData.creativeWorkEnjoyment >= 4 ? "high" : "moderate"} creativity level`,
              `Gather feedback and iterate based on responses`,
              `Establish basic business processes and tracking systems`,
            ],
            month3: [
              `Scale based on ${quizData.weeklyTimeCommitment >= 25 ? "full-time" : "part-time"} growth expectations`,
              `Optimize for sustainable income generation`,
              `Build partnerships that align with ${quizData.workCollaborationPreference} preference`,
              `Develop systems for consistent delivery and customer service`,
            ],
            month6: [
              `Evaluate progress toward ${getIncomeRangeLabel(quizData.successIncomeGoal)} goal`,
              `Consider expansion opportunities based on success`,
              `Adjust strategy based on market feedback and results`,
              `Plan next phase of growth and development`,
            ],
          },
          motivationalMessage:
            "Your unique combination of skills and drive positions you perfectly for entrepreneurial success.",
        });
      } finally {
        setIsLoadingInsights(false);
      }
    };

    // Generate detailed business fit descriptions
    const generateBusinessFitDescriptions = async () => {
      try {
        const top3Paths = topThreeAdvanced.slice(0, 3);
        const response = await fetch(
          "/api/generate-business-fit-descriptions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quizData,
              businessMatches: top3Paths,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to generate business fit descriptions");
        }

        const data = await response.json();
        const descriptionsMap: { [key: string]: string } = {};

        data.descriptions.forEach(
          (desc: { businessId: string; description: string }) => {
            descriptionsMap[desc.businessId] = desc.description;
          },
        );

        setBusinessFitDescriptions(descriptionsMap);
      } catch (error) {
        console.error("Error generating business fit descriptions:", error);
        // Set fallback descriptions
        const fallbackDescriptions: { [key: string]: string } = {};
        topThreeAdvanced.slice(0, 3).forEach((match, index) => {
          // Get the actual business data to access startupCost and potentialIncome
          const businessData = personalizedPaths.find(
            (path) => path.id === match.id,
          );
          fallbackDescriptions[match.id] =
            `This business model aligns exceptionally well with your ${quizData.selfMotivationLevel >= 4 ? "high self-motivation" : "self-driven nature"} and ${quizData.weeklyTimeCommitment} hours/week availability. Your ${quizData.techSkillsRating >= 4 ? "strong" : "adequate"} technical skills and ${quizData.riskComfortLevel >= 4 ? "high" : "moderate"} risk tolerance make this a ${index === 0 ? "perfect" : index === 1 ? "excellent" : "good"} match for your entrepreneurial journey.${businessData ? ` The startup cost of ${businessData.startupCost} and potential for ${businessData.potentialIncome} income directly align with your upfront investment budget of $${quizData.upfrontInvestment} and income goal of $${quizData.successIncomeGoal}/month.` : ""}

${index === 0 ? "As your top match, this path offers the best alignment with your goals and preferences." : index === 1 ? "This represents a strong secondary option that complements your primary strengths." : "This provides a solid alternative path that matches your core capabilities."} Your ${quizData.learningPreference?.replace("-", " ")} learning style means you'll excel in the learning curve required for this business model. With your ${quizData.workStructurePreference?.replace("-", " ")} work preference and ${quizData.workCollaborationPreference} collaboration style, this business structure will feel natural and sustainable for long-term success.`;
        });
        setBusinessFitDescriptions(fallbackDescriptions);
      } finally {
        setIsLoadingDescriptions(false);
      }
    };

    // Generate detailed business avoid descriptions
    const generateBusinessAvoidDescriptions = async () => {
      try {
        setIsLoadingDescriptions(true);

        const { businessModelService } = await import(
          "../utils/businessModelService"
        );
        const { businessPaths } = await import("../../../shared/businessPaths");

        const allMatches =
          businessModelService.getBusinessModelMatches(quizData);

        // Get the bottom 3 business models (worst matches)
        const bottomThree = businessModelService.getBottomMatches(quizData, 3);

        const businessMatches = bottomThree.map((match) => {
          const pathData = businessPaths.find((path) => path.id === match.id);
          return {
            id: match.id,
            name: match.name,
            fitScore: match.score,
            description:
              pathData?.description ||
              "Business model description not available",
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

        setBusinessAvoidDescriptions(descriptionsMap);
      } catch (error) {
        console.error("Error generating business avoid descriptions:", error);
        // Set fallback descriptions
        const fallbackDescriptions: { [key: string]: string } = {};
        const { businessModelService } = await import(
          "../utils/businessModelService"
        );
        const allMatches =
          businessModelService.getBusinessModelMatches(quizData);
        const bottomThree = businessModelService.getBottomMatches(quizData, 3);

        bottomThree.forEach((match) => {
          fallbackDescriptions[match.id] =
            `This business model scored ${match.score}% for your profile, indicating significant misalignment with your current goals, skills, and preferences. Based on your quiz responses, you would likely face substantial challenges in this field that could impact your success. Consider focusing on higher-scoring business models that better match your natural strengths and current situation. Your ${quizData.riskComfortLevel <= 2 ? "lower risk tolerance" : "risk preferences"} and ${quizData.weeklyTimeCommitment} hours/week availability suggest other business models would be more suitable for your entrepreneurial journey.`;
        });
        setBusinessAvoidDescriptions(fallbackDescriptions);
      }
    };

    // Use preloaded data if available, otherwise generate from scratch
    if (preloadedData) {
      setPersonalizedPaths(preloadedData.personalizedPaths);
      setAiInsights(preloadedData.aiInsights);
      setAllCharacteristics(preloadedData.allCharacteristics);
      setBusinessFitDescriptions(preloadedData.businessFitDescriptions);
      setBusinessAvoidDescriptions(
        preloadedData.businessAvoidDescriptions || {},
      );
      setIsLoadingInsights(false);
      setIsLoadingDescriptions(false);
    } else {
      // Generate AI-powered personalized paths
      const loadPersonalizedPaths = async () => {
        try {
          const paths = await generateAIPersonalizedPaths(quizData);
          setPersonalizedPaths(paths);

          // Generate AI insights after paths are loaded
          generateInsights(paths);

          // Generate business fit descriptions
          generateBusinessFitDescriptions();

          // Generate business avoid descriptions
          generateBusinessAvoidDescriptions();
        } catch (error) {
          console.error(
            "Failed to load AI paths in Full Report, using fallback:",
            error,
          );
          const fallbackMatches =
            businessModelService.getBusinessModelMatches(quizData);
          const fallbackPaths = fallbackMatches.map((match) => {
            const businessPath = businessPaths.find(
              (path) => path.id === match.id,
            );
            return { ...businessPath!, fitScore: match.score };
          });
          setPersonalizedPaths(fallbackPaths);

          // Generate AI insights with fallback paths
          generateInsights(fallbackPaths);

          // Generate business fit descriptions
          generateBusinessFitDescriptions();

          // Generate business avoid descriptions
          generateBusinessAvoidDescriptions();
        }
      };

      loadPersonalizedPaths();

      // Generate all 6 characteristics with OpenAI only if no preloaded data
      generateAllCharacteristics();
    }
  }, [quizData]);

  // Scroll to Executive Summary section
  const scrollToExecutiveSummary = () => {
    const overviewSection = document.getElementById("overview");
    if (overviewSection) {
      overviewSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarItems.map((item) => item.id);
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Use advanced scores for accurate fit percentages matching home page - make this immediate
  const topThreePaths = topThreeAdvanced
    .map((advanced) => {
      // Always use the advanced scoring data as the source of truth for consistency
      return {
        id: advanced.id,
        name: advanced.name,
        fitScore: advanced.score, // Use the advanced scoring fit score for consistency
        description: getBusinessModelDescription(advanced.id),
        timeToProfit: getBusinessModelTimeToProfit(advanced.id),
        startupCost: getBusinessModelStartupCost(advanced.id),
        potentialIncome: getBusinessModelPotentialIncome(advanced.id),
        category: advanced.category,
        difficulty:
          advanced.score >= 75
            ? "Easy"
            : advanced.score >= 50
              ? "Medium"
              : "Hard",
        pros: [
          `${advanced.score}% compatibility match`,
          `${advanced.category} for your profile`,
        ],
        cons:
          advanced.score < 70
            ? ["Lower compatibility score", "May require skill development"]
            : ["Minor adjustments needed"],
        tools: [
          "Standard business tools",
          "Communication platforms",
          "Analytics tools",
        ],
        skills: ["Basic business skills", "Communication", "Organization"],
        icon: "💼",
        marketSize: "Large",
        averageIncome: {
          beginner: "$1K-3K",
          intermediate: "$3K-8K",
          advanced: "$8K-20K+",
        },
        userStruggles: ["Getting started", "Finding clients", "Scaling up"],
        solutions: [
          "Step-by-step guidance",
          "Proven frameworks",
          "Community support",
        ],
        bestFitPersonality: ["Motivated", "Organized", "Goal-oriented"],
        resources: {
          platforms: ["LinkedIn", "Website", "Social Media"],
          learning: ["Online courses", "Books", "Mentorship"],
          tools: ["CRM", "Analytics", "Communication"],
        },
        actionPlan: {
          phase1: [
            "Setup basic infrastructure",
            "Define target market",
            "Create initial offerings",
          ],
          phase2: [
            "Launch marketing campaigns",
            "Build client base",
            "Optimize processes",
          ],
          phase3: ["Scale operations", "Expand services", "Build team"],
        },
      };
    })
    .slice(0, 3);

  // Get the worst 3 business models based on actual scoring
  const allBusinessMatches =
    businessModelService.getBusinessModelMatches(quizData);
  const worstThreePaths = businessModelService
    .getBottomMatches(quizData, 3)
    .slice(-3) // Get bottom 3 (lowest scores)
    .reverse() // Reverse to show worst-first order
    .map((match) => ({
      id: match.id,
      name: match.name,
      fitScore: match.score,
      description: getBusinessModelDescription(match.id),
      timeToProfit: getBusinessModelTimeToProfit(match.id),
      startupCost: getBusinessModelStartupCost(match.id),
      potentialIncome: getBusinessModelPotentialIncome(match.id),
      category: match.category,
    }));

  // Map scoring algorithm IDs to actual businessPath IDs
  const mapScoringIdToBusinessPathId = (scoringId: string): string => {
    const idMapping: Record<string, string> = {
      "content-creation": "content-creation-ugc",
      freelancing: "freelancing",
      "affiliate-marketing": "affiliate-marketing",
      // Add more mappings as needed when more business paths are added
      "e-commerce": "content-creation-ugc", // Fallback to available path
      "online-tutoring": "freelancing", // Fallback to available path
      "youtube-automation": "content-creation-ugc", // Fallback to available path
      "local-service": "freelancing", // Fallback to available path
      "high-ticket-sales": "freelancing", // Fallback to available path
      "saas-development": "freelancing", // Fallback to available path
      "social-media-agency": "content-creation-ugc", // Fallback to available path
      "ai-marketing-agency": "freelancing", // Fallback to available path
      "digital-services": "freelancing", // Fallback to available path
      "investing-trading": "affiliate-marketing", // Fallback to available path
      "online-reselling": "affiliate-marketing", // Fallback to available path
      "handmade-goods": "content-creation-ugc", // Fallback to available path
      copywriting: "freelancing", // Fallback to available path
      "virtual-assistant": "freelancing", // Fallback to available path
    };

    return idMapping[scoringId] || "freelancing"; // Default fallback
  };

  const handleGetStarted = (businessId: string) => {
    const mappedId = mapScoringIdToBusinessPathId(businessId);
    navigate(`/business/${mappedId}`);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 0);
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizData,
          userEmail,
          aiAnalysis: aiInsights,
          topBusinessPath: personalizedPaths[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "business-report.html";
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      // You could add a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 text-white relative">
        {/* Exit Arrow - Upper Left Corner */}
        <button
          onClick={onBack}
          className="absolute top-8 left-8 p-2 hover:opacity-80 transition-opacity duration-300"
          title="Back to Results"
        >
          <ArrowLeft className="h-6 w-6 text-white" />
        </button>

        <div className="text-center max-w-4xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mx-auto mb-8">
              <span className="text-6xl">🎉</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to Your Full Report!
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-16 leading-relaxed">
              Your personalized business blueprint is ready. Discover your
              AI-powered analysis, personality insights, and complete roadmap to
              success.
            </p>

            {/* Chevron to scroll to Executive Summary */}
            <motion.button
              onClick={scrollToExecutiveSummary}
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto hover:bg-white/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronDown className="h-6 w-6 text-white" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Report Sections
                  </h3>
                  <nav className="space-y-2">
                    {sidebarItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full flex items-center px-3 py-2 text-left rounded-xl transition-colors ${
                          activeSection === item.id
                            ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700 rounded-r-lg"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Executive Summary */}
              <section
                id="overview"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <div className="flex items-center mb-6">
                  <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Executive Summary
                  </h2>
                </div>

                {userEmail && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">
                        Report saved to {userEmail}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    Download Report
                  </button>
                </div>

                {/* Key Insights Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {topThreeAdvanced[0]?.score}%
                    </div>
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      Best Match
                    </div>
                    <div className="text-xs text-blue-700">
                      {topThreeAdvanced[0]?.name}
                    </div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {getTimeCommitmentRangeLabel(
                        quizData.weeklyTimeCommitment,
                      )}
                    </div>
                    <div className="text-sm font-medium text-green-900 mb-1">
                      Hours/Week
                    </div>
                    <div className="text-xs text-green-700">Available Time</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {getIncomeRangeLabel(quizData.successIncomeGoal)}
                    </div>
                    <div className="text-sm font-medium text-purple-900 mb-1">
                      Income Goal
                    </div>
                    <div className="text-xs text-purple-700">
                      Monthly Target
                    </div>
                  </div>
                </div>

                {/* Best Fit Characteristics - Updated to use AI-generated characteristics */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Best Fit Characteristics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(
                      aiInsights?.bestFitCharacteristics || allCharacteristics
                    ).map((characteristic: string, index: number) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-gray-700">{characteristic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* AI Personalized Analysis */}
              <section
                id="ai-analysis"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <div className="flex items-center mb-6">
                  <Brain className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    AI Personalized Analysis
                  </h2>
                </div>

                {!isLoadingInsights && aiInsights && (
                  <div className="space-y-6">
                    {/* Three-paragraph detailed analysis */}
                    <div className="prose max-w-none">
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
                        <div className="space-y-4 text-gray-700 leading-relaxed">
                          {(() => {
                            // Get the cached AI analysis that was generated on the Results page
                            const aiCacheManager = AICacheManager.getInstance();
                            const cachedData =
                              aiCacheManager.getCachedAIContent(quizData);

                            // Use the fullAnalysis from the cached data, or fall back to the summary
                            const analysisText =
                              cachedData.analysis?.fullAnalysis ||
                              aiInsights?.personalizedSummary ||
                              "";

                            if (!analysisText) {
                              return (
                                <div className="space-y-4">
                                  <div className="animate-pulse bg-gray-200 h-4 rounded w-full"></div>
                                  <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                                  <div className="animate-pulse bg-gray-200 h-4 rounded w-5/6"></div>
                                  <div className="animate-pulse bg-gray-200 h-4 rounded w-full"></div>
                                  <div className="animate-pulse bg-gray-200 h-4 rounded w-4/5"></div>
                                  <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                                </div>
                              );
                            }

                            // Split the analysis into paragraphs for better formatting
                            const paragraphs = analysisText
                              .split("\n\n")
                              .filter((p: string) => p.trim().length > 0);

                            return (
                              <div className="space-y-4">
                                {paragraphs.map(
                                  (paragraph: string, index: number) => (
                                    <p
                                      key={index}
                                      className="text-gray-700 leading-relaxed"
                                    >
                                      {paragraph.trim()}
                                    </p>
                                  ),
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Key Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Key Success Indicators
                        </h3>
                        <ul className="space-y-2">
                          {aiInsights.successStrategies
                            ?.slice(0, 4)
                            .map((strategy: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <Star className="h-4 w-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                                <span
                                  className="text-gray-700"
                                  dangerouslySetInnerHTML={renderMarkdownContent(
                                    strategy,
                                  )}
                                />
                              </li>
                            ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Personalized Recommendations
                        </h3>
                        <ul className="space-y-2">
                          {aiInsights.customRecommendations
                            ?.slice(0, 4)
                            .map((rec: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                <span
                                  className="text-gray-700"
                                  dangerouslySetInnerHTML={renderMarkdownContent(
                                    rec,
                                  )}
                                />
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>

                    {/* Potential Challenges - Nested Section */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                        Potential Challenges
                      </h3>
                      <ul className="space-y-3">
                        {aiInsights.potentialChallenges?.map(
                          (challenge: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                              <span
                                className="text-gray-700"
                                dangerouslySetInnerHTML={renderMarkdownContent(
                                  challenge,
                                )}
                              />
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </section>

              {/* Personality Snapshot */}
              <section
                id="personality-snapshot"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <div className="flex items-center mb-6">
                  <Users className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Comprehensive Personality Snapshot
                  </h2>
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-800 text-sm">
                    Our advanced 12-metric personality algorithm analyzes your
                    responses across all quiz dimensions to create a
                    comprehensive entrepreneurial profile. Each assessment
                    reflects your natural tendencies and optimal business
                    environments.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {traitSliders.map((slider, index) => {
                    const metricKey =
                      slider.trait === "consistency"
                        ? "discipline"
                        : slider.trait === "communicationConfidence"
                          ? "confidence"
                          : slider.trait;
                    const description =
                      personalityDescriptions[
                        metricKey as keyof typeof personalityDescriptions
                      ];
                    const score =
                      personalityScores[
                        metricKey as keyof typeof personalityScores
                      ];

                    return (
                      <div key={index} className="bg-gray-50 rounded-xl p-4">
                        <TraitSlider
                          label={slider.label}
                          value={traitScores[slider.trait]}
                          leftLabel={slider.leftLabel}
                          rightLabel={slider.rightLabel}
                        />
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 italic">
                            {description ||
                              "Analysis based on your quiz responses"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Top 3 Matches */}
              <section
                id="top-matches"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <div className="flex items-center mb-6">
                  <Target className="h-6 w-6 text-green-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Top 3 Business Matches
                  </h2>
                </div>

                <div className="space-y-6">
                  {topThreePaths.map((path, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-600"
                                : index === 1
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {path.name}
                          </h3>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {path.fitScore}%
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{path.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            {path.timeToProfit}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            {path.startupCost}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            {path.potentialIncome}
                          </span>
                        </div>
                      </div>

                      {/* Why This Fits You */}
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Why This Fits You
                        </h4>
                        {isLoadingDescriptions ? (
                          <div className="text-blue-800 text-sm">
                            <div className="animate-pulse">
                              <div className="h-4 bg-blue-200 rounded w-full mb-2"></div>
                              <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                              <div className="h-4 bg-blue-200 rounded w-5/6"></div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-blue-800 text-sm whitespace-pre-line"
                            dangerouslySetInnerHTML={renderMarkdownContent(
                              businessFitDescriptions[path.id] ||
                                `This business model aligns exceptionally well with your ${quizData.selfMotivationLevel >= 4 ? "high self-motivation" : "self-driven nature"} and ${quizData.weeklyTimeCommitment} hours/week availability. Your ${quizData.techSkillsRating >= 4 ? "strong" : "adequate"} technical skills and ${quizData.riskComfortLevel >= 4 ? "high" : "moderate"} risk tolerance make this a ${index === 0 ? "perfect" : index === 1 ? "excellent" : "good"} match for your entrepreneurial journey. The startup cost of ${path.startupCost} and potential for ${path.potentialIncome} income directly align with your upfront investment budget of $${quizData.upfrontInvestment} and income goal of $${quizData.successIncomeGoal}/month.

${index === 0 ? "As your top match, this path offers the best alignment with your goals and preferences." : index === 1 ? "This represents a strong secondary option that complements your primary strengths." : "This provides a solid alternative path that matches your core capabilities."} Your ${quizData.learningPreference?.replace("-", " ")} learning style means you'll excel in the learning curve required for this business model. With your ${quizData.workStructurePreference?.replace("-", " ")} work preference and ${quizData.workCollaborationPreference} collaboration style, this business structure will feel natural and sustainable for long-term success.`,
                            )}
                          />
                        )}
                      </div>

                      <button
                        onClick={() => handleGetStarted(path.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                      >
                        Learn More About {path.name}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Business Models to Avoid */}
              <section
                id="business-to-avoid"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <div className="flex items-center mb-6">
                  <Shield className="h-6 w-6 text-red-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Business Models to Avoid
                  </h2>
                </div>

                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm">
                    <strong>Important Note:</strong> These business models
                    scored lowest for your current profile. This doesn't mean
                    they\'re bad businesses—they just don't align well with your
                    current goals, skills, or preferences. As you grow and
                    develop, some of these might become viable options in the
                    future.
                  </p>
                </div>

                <div className="space-y-6">
                  {worstThreePaths.map((path, index) => (
                    <div
                      key={index}
                      className="border border-red-200 rounded-xl p-6 bg-red-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-red-100 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {path.name}
                          </h3>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {path.fitScore}%
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{path.description}</p>

                      <div className="bg-white border border-red-200 rounded-2xl p-4">
                        <h4 className="font-semibold text-red-900 mb-2">
                          Why This Doesn't Fit Your Current Profile
                        </h4>
                        {isLoadingDescriptions ? (
                          <div className="text-red-800 text-sm">
                            <div className="animate-pulse">
                              <div className="h-4 bg-red-200 rounded w-full mb-2"></div>
                              <div className="h-4 bg-red-200 rounded w-3/4 mb-2"></div>
                              <div className="h-4 bg-red-200 rounded w-5/6 mb-2"></div>
                              <div className="h-4 bg-red-200 rounded w-4/5"></div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-red-800 text-sm whitespace-pre-line"
                            dangerouslySetInnerHTML={renderMarkdownContent(
                              businessAvoidDescriptions[path.id] ||
                                `This business model scored ${path.fitScore}% for your profile, indicating significant misalignment with your current goals, skills, and preferences. Based on your quiz responses, you would likely face substantial challenges in this field that could impact your success. Consider focusing on higher-scoring business models that better match your natural strengths and current situation. Your ${quizData.riskComfortLevel <= 2 ? "lower risk tolerance" : "risk preferences"} and ${quizData.weeklyTimeCommitment} hours/week availability suggest other business models would be more suitable for your entrepreneurial journey. Focus on the business models that scored higher in your assessment for the best chance of success.`,
                            )}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    💡 Future Consideration
                  </h3>
                  <p className="text-blue-800 text-sm">
                    As you develop your skills and gain experience, some of
                    these business models may become more suitable. Consider
                    revisiting this analysis in 6-12 months as your profile
                    evolves.
                  </p>
                </div>
              </section>

              {/* Market Trends & Opportunities */}
              <section
                id="market-trends"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <div className="flex items-center mb-6">
                  <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Market Trends & Opportunities
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Growing Markets
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <h4 className="font-semibold text-green-900 mb-2">
                          AI & Automation Services
                        </h4>
                        <p className="text-green-800 text-sm mb-2">
                          Market growing 25% annually
                        </p>
                        <p className="text-green-700 text-xs">
                          Businesses need help implementing AI tools and
                          automating processes
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <h4 className="font-semibold text-green-900 mb-2">
                          Content Creation
                        </h4>
                        <p className="text-green-800 text-sm mb-2">
                          Creator economy worth $104B+
                        </p>
                        <p className="text-green-700 text-xs">
                          Brands increasingly rely on authentic, user-generated
                          content
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <h4 className="font-semibold text-green-900 mb-2">
                          Online Education
                        </h4>
                        <p className="text-green-800 text-sm mb-2">
                          $350B market by 2025
                        </p>
                        <p className="text-green-700 text-xs">
                          High demand for specialized skills training and
                          coaching
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <h4 className="font-semibold text-green-900 mb-2">
                          E-commerce & Digital Products
                        </h4>
                        <p className="text-green-800 text-sm mb-2">
                          Growing 15% year-over-year
                        </p>
                        <p className="text-green-700 text-xs">
                          Shift to online shopping continues accelerating
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Emerging Opportunities
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <h4 className="font-semibold text-purple-900 mb-2">
                          Sustainability Consulting
                        </h4>
                        <p className="text-purple-800 text-sm mb-2">
                          ESG compliance demand rising
                        </p>
                        <p className="text-purple-700 text-xs">
                          Companies need help with environmental and social
                          responsibility
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <h4 className="font-semibold text-purple-900 mb-2">
                          Remote Work Solutions
                        </h4>
                        <p className="text-purple-800 text-sm mb-2">
                          Permanent shift to hybrid work
                        </p>
                        <p className="text-purple-700 text-xs">
                          Tools and services for distributed teams in high
                          demand
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <h4 className="font-semibold text-purple-900 mb-2">
                          Health & Wellness Tech
                        </h4>
                        <p className="text-purple-800 text-sm mb-2">
                          $659B market opportunity
                        </p>
                        <p className="text-purple-700 text-xs">
                          Digital health solutions and wellness coaching growing
                          rapidly
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <h4 className="font-semibold text-purple-900 mb-2">
                          Micro-SaaS
                        </h4>
                        <p className="text-purple-800 text-sm mb-2">
                          Niche software solutions
                        </p>
                        <p className="text-purple-700 text-xs">
                          Small, focused tools solving specific problems for
                          targeted audiences
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Market Timing Advantage
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Based on your profile and current market conditions, you're
                    entering at an optimal time. The convergence of digital
                    transformation, remote work adoption, and AI accessibility
                    creates unprecedented opportunities for new entrepreneurs.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        $2.3T
                      </div>
                      <div className="text-sm text-blue-700">
                        Digital economy size
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        73%
                      </div>
                      <div className="text-sm text-purple-700">
                        Businesses going digital
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        42%
                      </div>
                      <div className="text-sm text-green-700">
                        Remote work adoption
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Work Preferences */}
              <section
                id="work-preferences"
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <div className="flex items-center mb-6">
                  <Brain className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Work Preferences
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">
                          Time Commitment
                        </span>
                        <span className="text-purple-600 font-semibold">
                          {getTimeCommitmentRangeLabel(
                            quizData.weeklyTimeCommitment,
                          )}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Weekly hours available for business activities
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">
                          Learning Style
                        </span>
                        <span className="text-purple-600 font-semibold capitalize">
                          {quizData.learningPreference?.replace("-", " ")}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        How you best absorb new information and skills
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">
                          Work Structure
                        </span>
                        <span className="text-purple-600 font-semibold capitalize">
                          {quizData.workStructurePreference?.replace("-", " ")}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Your preferred level of routine and organization
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">
                          Collaboration
                        </span>
                        <span className="text-purple-600 font-semibold capitalize">
                          {quizData.workCollaborationPreference?.replace(
                            "-",
                            " ",
                          )}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        How you prefer to work with others
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">
                          Decision Making
                        </span>
                        <span className="text-purple-600 font-semibold capitalize">
                          {quizData.decisionMakingStyle?.replace("-", " ")}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Your approach to making important choices
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">
                          Income Goal
                        </span>
                        <span className="text-purple-600 font-semibold">
                          {getIncomeRangeLabel(quizData.successIncomeGoal)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Your target monthly income objective
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Next Steps */}
              <section
                id="next-steps"
                className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white"
              >
                <div className="flex items-center mb-6">
                  <Zap className="h-6 w-6 text-white mr-3" />
                  <h2 className="text-2xl font-bold text-white">
                    Ready to Get Started?
                  </h2>
                </div>

                <div className="mb-6">
                  <p className="text-blue-100 text-lg leading-relaxed">
                    You've got the mindset and traits to make this work—now it's
                    about execution. Start small, stay consistent, and lean into
                    your strengths. Every step you take builds momentum. Trust
                    your process, adapt as you go, and remember: clarity comes
                    through action.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleGetStarted(topThreeAdvanced[0]?.id)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Learn More About {topThreeAdvanced[0]?.name}
                  </button>
                  <button
                    onClick={() => {
                      navigate("/explore");
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }, 100);
                    }}
                    className="border border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                  >
                    Explore All Options
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Comprehensive personality scoring system now integrated via shared/personalityScoring.ts

export default FullReport;
