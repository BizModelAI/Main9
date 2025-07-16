import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  Target,
  Brain,
  Lightbulb,
  Calendar,
  BarChart3,
  Award,
  Zap,
  BookOpen,
  Monitor,
  MessageCircle,
  Shield,
  Briefcase,
  Heart,
  Loader,
  Lock,
  Crown,
  X,
} from "lucide-react";
import { QuizData, BusinessPath, AIAnalysis } from "../types";
import { businessPaths } from "../data/businessPaths";
import { businessModels } from "../data/businessModels";
import { businessModelService } from "../utils/businessModelService";
import { calculateBusinessModelTraits } from "../../../shared/businessModelTraits";
import {
  getIdealTraits,
  traitDescriptions,
} from "../../../shared/businessModelIdealTraits";
import { AIService } from "../utils/aiService";
import { AICacheManager } from "../utils/aiCacheManager";
import { usePaywall } from "../contexts/PaywallContext";
import { useAuth } from "../contexts/AuthContext";
import { PaywallModal } from "./PaywallModals";
import { PaymentAccountModal } from "./PaymentAccountModal";
import { SkillsAnalysisService, SkillsAnalysis } from "../utils/skillsAnalysis";
import {
  businessTools,
  defaultBusinessTools,
  BusinessTool,
} from "../data/businessTools";
import { IncomeProjectionChart } from "./IncomeProjectionChart";
import { renderMarkdownContent } from "../utils/markdownUtils";

// Generate psychological fit description based on fit category
const getPsychologicalFitDescription = (
  category: string,
  businessName: string,
  quizData: QuizData,
  businessId: string,
): string => {
  const traits = calculateBusinessModelTraits(quizData);
  const idealTraits = getIdealTraits(businessId || "");

  switch (category) {
    case "Best Fit":
    case "Strong Fit":
      const strongAreas = [];
      if (traits.riskTolerance >= idealTraits.riskTolerance - 15)
        strongAreas.push("risk tolerance");
      if (traits.selfMotivation >= idealTraits.selfMotivation - 15)
        strongAreas.push("self-motivation");
      if (traits.techComfort >= idealTraits.techComfort - 15)
        strongAreas.push("tech comfort");
      if (traits.consistency >= idealTraits.consistency - 15)
        strongAreas.push("consistency");
      if (traits.learningAgility >= idealTraits.learningAgility - 15)
        strongAreas.push("learning agility");

      return `Your personality profile compares favorably with the average successful ${businessName} entrepreneur. You show particularly strong alignment in ${strongAreas.slice(0, 2).join(" and ")}, which are key indicators of success in this field. Your ${quizData.selfMotivationLevel >= 4 ? "high self-motivation" : "solid self-motivation"} and ${quizData.toolLearningWillingness === "yes" ? "eagerness to learn new tools" : "willingness to adapt"} position you well for this business model.`;

    case "Possible Fit":
      const gapAreas = [];
      if (traits.riskTolerance < idealTraits.riskTolerance - 20)
        gapAreas.push("risk tolerance");
      if (traits.selfMotivation < idealTraits.selfMotivation - 20)
        gapAreas.push("self-motivation");
      if (traits.techComfort < idealTraits.techComfort - 20)
        gapAreas.push("tech comfort");
      if (traits.consistency < idealTraits.consistency - 20)
        gapAreas.push("consistency");
      if (traits.learningAgility < idealTraits.learningAgility - 20)
        gapAreas.push("learning agility");

      return `Your personality profile shows some alignment with successful ${businessName} entrepreneurs, but there are gaps in key areas. You may face challenges with ${gapAreas.slice(0, 2).join(" and ")}, which could impact your success in this field. While not impossible, you would need to focus on developing these areas to increase your chances of success.`;

    case "Poor Fit":
      const majorGaps = [];
      if (traits.riskTolerance < idealTraits.riskTolerance - 30)
        majorGaps.push("risk tolerance");
      if (traits.selfMotivation < idealTraits.selfMotivation - 30)
        majorGaps.push("self-motivation");
      if (traits.techComfort < idealTraits.techComfort - 30)
        majorGaps.push("tech comfort");
      if (traits.consistency < idealTraits.consistency - 30)
        majorGaps.push("consistency");
      if (traits.learningAgility < idealTraits.learningAgility - 30)
        majorGaps.push("learning agility");

      return `Your personality profile shows significant misalignment with successful ${businessName} entrepreneurs. There are substantial gaps in ${majorGaps.slice(0, 2).join(" and ")}, which are critical for success in this field. The challenges you would face make this business model particularly difficult for your current profile, and you might want to consider other options that better match your strengths.`;

    default:
      return `Your personality profile has been analyzed against successful ${businessName} entrepreneurs.`;
  }
};

interface BusinessModelDetailProps {
  quizData?: QuizData | null;
}

const BusinessModelDetail: React.FC<BusinessModelDetailProps> = ({
  quizData: propQuizData,
}) => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [businessPath, setBusinessPath] = useState<BusinessPath | null>(null);
  const [businessModel, setBusinessModel] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [modelInsights, setModelInsights] = useState<{
    modelFitReason: string;
    keyInsights: string[];
    successPredictors: string[];
  } | null>(null);
  const [isLoadingModelInsights, setIsLoadingModelInsights] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [skillsAnalysis, setSkillsAnalysis] = useState<SkillsAnalysis | null>(
    null,
  );
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(
    propQuizData || null,
  );
  const [isLoadingQuizData, setIsLoadingQuizData] = useState(false);

  const { hasCompletedQuiz, canAccessBusinessModel, setHasUnlockedAnalysis } =
    usePaywall();
  const { user, getLatestQuizData } = useAuth();

  // Calculate fit category based on actual quiz data if available
  const fitCategory = useMemo(() => {
    if (!quizData || !businessId) return "Best Fit";

    const matchingBusiness = businessModelService.getBusinessModelMatch(
      quizData,
      businessId,
    );
    const fitScore = matchingBusiness?.score || 0;

    console.log(`Fit score for ${businessId}: ${fitScore}%`);

    if (fitScore >= 70) return "Best Fit";
    if (fitScore >= 50) return "Strong Fit";
    if (fitScore >= 30) return "Possible Fit";
    return "Poor Fit";
  }, [quizData, businessId]);

  // Generate the appropriate title based on fit category
  const getFitTitle = (category: string, businessName: string): string => {
    switch (category) {
      case "Best Fit":
        return `Why ${businessName} Is the Best Fit For You`;
      case "Strong Fit":
        return `Why ${businessName} Is a Strong Fit For You`;
      case "Possible Fit":
        return `Why ${businessName} Isn't the Best Fit For You`;
      case "Poor Fit":
        return `Why You Should Avoid ${businessName}`;
      default:
        return `Why ${businessName} Fits You`;
    }
  };

  // Generate model insights using new method
  const generateModelInsights = useCallback(
    async (data: QuizData, path: BusinessPath) => {
      if (!businessId) return;

      setIsLoadingModelInsights(true);
      try {
        const aiService = AIService.getInstance();

        // Determine fit type based on fit score
        const fitType: "best" | "strong" | "possible" | "poor" =
          fitCategory === "Best Fit"
            ? "best"
            : fitCategory === "Strong Fit"
              ? "strong"
              : fitCategory === "Possible Fit"
                ? "possible"
                : "poor";

        const insights = await aiService.generateModelInsights(
          data,
          path.name,
          fitType,
        );

        setModelInsights(insights);
      } catch (error) {
        console.error("Error generating model insights:", error);
        // Set fallback insights
        const fallbackInsights = {
          modelFitReason: `${path.name} shows ${fitCategory.toLowerCase()} alignment with your profile based on your quiz responses. Your skills, available time, and personal preferences create a ${fitCategory === "Best Fit" || fitCategory === "Strong Fit" ? "strong foundation" : "challenging situation"} for success in this business model.

Your goals and timeline expectations ${fitCategory === "Best Fit" || fitCategory === "Strong Fit" ? "align well" : "present some obstacles"} with what's typically required to build a profitable ${path.name} business. The resources you have available and your risk tolerance ${fitCategory === "Best Fit" || fitCategory === "Strong Fit" ? "support" : "may limit"} this entrepreneurial path.

${fitCategory === "Best Fit" ? "This represents an excellent match for your current situation and offers high potential for success." : fitCategory === "Strong Fit" ? "While this is a good fit, there may be other options that align even better with your specific profile." : fitCategory === "Possible Fit" ? "With some adjustments and skill development, this could become more viable for you in the future." : "Other business models would likely offer better alignment with your current strengths and situation."}`,
          keyInsights: [
            "Your profile shows specific alignment indicators with this model",
            "Time commitment and goals factor into this assessment",
            "Skills and preferences have been analyzed for compatibility",
          ],
          successPredictors: [
            "Your motivation level supports this business approach",
            "Available resources align with model requirements",
            "Personality traits match success factors for this field",
          ],
        };
        setModelInsights(fallbackInsights);
      } finally {
        setIsLoadingModelInsights(false);
      }
    },
    [businessId, fitCategory],
  );

  // Generate skills analysis for paid users
  const generateSkillsAnalysis = useCallback(
    async (data: QuizData, model: any) => {
      if (!businessId || !model) return;

      const cachedSkills = aiCacheManager.getCachedSkillsAnalysis(businessId);

      if (cachedSkills) {
        setSkillsAnalysis(cachedSkills);
        setIsLoadingSkills(false);
        return;
      }

      setIsLoadingSkills(true);
      try {
        const skillsService = SkillsAnalysisService.getInstance();
        const skills = await skillsService.analyzeSkills(
          data,
          model.requiredSkills || [],
          model.title || businessId,
        );

        aiCacheManager.cacheSkillsAnalysis(businessId, skills);
        setSkillsAnalysis(skills);
      } catch (error) {
        console.error("Error generating skills analysis:", error);
      } finally {
        setIsLoadingSkills(false);
      }
    },
    [businessId],
  );

  // Fetch quiz data for authenticated users
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!user || propQuizData) return; // If no user or already have quiz data, skip

      setIsLoadingQuizData(true);
      try {
        const latestQuizData = await getLatestQuizData();
        if (latestQuizData) {
          setQuizData(latestQuizData);
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
      } finally {
        setIsLoadingQuizData(false);
      }
    };

    fetchQuizData();
  }, [user, propQuizData, getLatestQuizData]);

  useEffect(() => {
    if (!businessId) return;

    // Scroll to top of page when component mounts or businessId changes
    window.scrollTo({ top: 0, behavior: "instant" });

    // Find business path and model
    const path = businessPaths.find((p) => p.id === businessId);
    const model = businessModels.find((m) => m.id === businessId);

    if (path) {
      // Calculate fit score if quiz data is available
      if (quizData) {
        const matchingBusiness = businessModelService.getBusinessModelMatch(
          quizData,
          businessId,
        );
        const fitScore = matchingBusiness?.score || 0;
        setBusinessPath({ ...path, fitScore });
      } else {
        setBusinessPath(path);
      }
    }

    if (model) {
      setBusinessModel(model);
    }

    // Handle access control and AI analysis generation
    // Development mode access disabled
    if (false && user) {
      console.log(
        "BusinessModelDetail: Development mode - authenticated user gets access",
      );
      // Continue to generate analysis
    }
    // For authenticated users, allow immediate access to basic features
    else if (user) {
      console.log(
        "BusinessModelDetail: Authenticated user, allowing basic access",
      );
      // Continue to generate analysis
    }
    // For authenticated users, check if they can access business models
    else if (user && canAccessBusinessModel(businessId)) {
      console.log(
        "BusinessModelDetail: User can access business model, allowing access",
      );
      // Continue to generate analysis
    }
    // For authenticated users who have completed the quiz, allow access
    else if (user && hasCompletedQuiz) {
      console.log(
        "BusinessModelDetail: User has completed quiz, allowing access",
      );
      // Continue to generate analysis
    }
    // For non-authenticated users, check if they've completed the quiz
    else if (!user && !hasCompletedQuiz) {
      console.log(
        "BusinessModelDetail: Non-authenticated user without quiz completion, showing payment modal",
      );
      setShowPaymentModal(true);
      setModelInsights(null);
      setIsLoadingModelInsights(false);
      return;
    }
    // For authenticated users who don't meet the above criteria, show paywall
    else if (user && !hasCompletedQuiz && !canAccessBusinessModel(businessId)) {
      console.log(
        "BusinessModelDetail: Authenticated user without access, showing paywall",
      );
      setShowPaywallModal(true);
      setModelInsights(null);
      setIsLoadingModelInsights(false);
      return;
    }

    console.log(
      "BusinessModelDetail: Access granted, proceeding to generate analysis",
    );

    // User has paid access - generate model insights and skills analysis if quiz data is available
    if (quizData && path) {
      generateModelInsights(quizData, path);
      generateSkillsAnalysis(quizData, model);
    } else if (user && path) {
      // Fallback for paid users when quiz data API fails: create mock quiz data
      const mockQuizData: QuizData = {
        // Round 1: Motivation & Vision
        mainMotivation: "financial",
        firstIncomeTimeline: "3-6-months",
        successIncomeGoal: 5000,
        upfrontInvestment: 1000,
        passionIdentityAlignment: 4,
        businessExitPlan: "sell",
        businessGrowthSize: "small-team",
        passiveIncomeImportance: 4,

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
        brandFaceComfort: 2,
        competitivenessLevel: 3,
        creativeWorkEnjoyment: 4,
        directCommunicationEnjoyment: 3,
        workStructurePreference: "some-structure",

        // Round 4: Tools & Work Environment
        techSkillsRating: 3,
        workspaceAvailability: "dedicated",
        supportSystemStrength: "moderate",
        internetDeviceReliability: 4,
        familiarTools: ["basic-computer"],

        // Round 5: Strategy & Decision-Making
        decisionMakingStyle: "analytical",
        riskComfortLevel: 3,
        feedbackRejectionResponse: 3,
        pathPreference: "problem-solving",
        controlImportance: 4,

        // Round 6: Business Model Fit Filters
        onlinePresenceComfort: "comfortable",
        clientCallsComfort: "somewhat-comfortable",
        physicalShippingOpenness: "open",
        workStylePreference: "flexible",
        socialMediaInterest: 3,
        ecosystemParticipation: "participate",
        existingAudience: "none",
        promotingOthersOpenness: "open",
        teachVsSolvePreference: "solve",
        meaningfulContributionImportance: 4,
      };
      generateModelInsights(mockQuizData, path);
      generateSkillsAnalysis(mockQuizData, model);
    } else {
      setIsLoadingModelInsights(false);
      setIsLoadingSkills(false);
    }
  }, [
    businessId,
    quizData,
    hasCompletedQuiz,
    canAccessBusinessModel,
    generateModelInsights,
    generateSkillsAnalysis,
  ]);

  // Handle scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGetStarted = () => {
    scrollToSection("overview");
  };

  // Update active section based on scroll position - using businessPath/businessModel state
  useEffect(() => {
    if (!businessPath && !businessModel) return;

    const business = businessPath || businessModel;
    const getSidebarItems = () => [
      {
        id: "overview",
        label: `${business?.name || business?.title || "Business"} Overview`,
        icon: BarChart3,
      },
      {
        id: "fit-analysis",
        label: `Why ${business?.name || business?.title || "This Business"} Fits You`,
        icon: Target,
      },
      { id: "psychological-fit", label: "Psychological Fit", icon: Brain },
      { id: "income-potential", label: "Income Potential", icon: TrendingUp },
      { id: "common-mistakes", label: "Common Mistakes", icon: AlertTriangle },
      { id: "required-skills", label: "Required Skills", icon: Brain },
      { id: "getting-started", label: "Getting Started", icon: Zap },
      { id: "action-plan", label: "Action Plan", icon: Calendar },
    ];

    const handleScroll = () => {
      const sections = getSidebarItems().map((item) => item.id);
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
  }, [businessPath, businessModel]);

  const handlePaywallUnlock = () => {
    // DEV bypass disabled - always redirect to proper payment flow
    // if (import.meta.env.MODE === "development") {
    //   setHasUnlockedAnalysis(true);
    //   setShowPaywallModal(false);
    //   window.location.reload(); // Refresh to show content
    // } else {
    // Redirect to proper payment flow
    setShowPaywallModal(false);
    setShowPaymentModal(true);
    // }
  };

  const handlePaywallClose = () => {
    setShowPaywallModal(false);
    navigate("/explore");
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    window.location.reload(); // Refresh to show content
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    navigate("/explore");
  };

  const handleStartCourse = () => {
    // Navigate to the business guide page which contains the detailed course
    navigate(`/guide/${businessId}`);
  };

  if (showPaywallModal) {
    return (
      <PaywallModal
        isOpen={true}
        onClose={handlePaywallClose}
        onUnlock={handlePaywallUnlock}
        type={hasCompletedQuiz ? "learn-more" : "quiz-required"}
        title={businessPath?.name || businessModel?.title}
      />
    );
  }

  if (showPaymentModal) {
    return (
      <PaymentAccountModal
        isOpen={true}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
        type={hasCompletedQuiz ? "learn-more" : "full-report"}
        title={businessPath?.name || businessModel?.title}
      />
    );
  }

  if (!businessPath && !businessModel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Business Model Not Found
          </h1>
          <button
            onClick={() => navigate("/explore")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Explorer
          </button>
        </div>
      </div>
    );
  }

  const business = businessPath || businessModel;

  // Sidebar navigation items - now defined after business is available
  const getSidebarItems = () => [
    {
      id: "overview",
      label: `${business?.name || business?.title || "Business"} Overview`,
      icon: BarChart3,
    },
    {
      id: "fit-analysis",
      label: getFitTitle(
        fitCategory,
        business?.name || business?.title || "This Business",
      ),
      icon:
        fitCategory === "Possible Fit" || fitCategory === "Poor Fit"
          ? AlertTriangle
          : Target,
    },
    { id: "psychological-fit", label: "Psychological Fit", icon: Brain },
    { id: "income-potential", label: "Income Potential", icon: TrendingUp },
    { id: "common-mistakes", label: "Common Mistakes", icon: AlertTriangle },
    { id: "required-skills", label: "Required Skills", icon: Brain },
    { id: "getting-started", label: "Getting Started", icon: Zap },
    { id: "action-plan", label: "Action Plan", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-40 right-1/4 w-28 h-28 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-3000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Back Button */}
          <motion.button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center text-blue-300 hover:text-white transition-colors group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* AI Match Badge */}
                {businessPath?.fitScore && (
                  <motion.div
                    className="inline-flex items-center bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-6 py-3 mb-6"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Crown className="h-5 w-5 text-yellow-300 mr-2" />
                    <span className="text-yellow-200 font-bold">
                      {businessPath.fitScore}% AI Match
                    </span>
                  </motion.div>
                )}

                {/* Business Title */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {business.name || business.title}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                  {business.detailedDescription || business.description}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      const overviewSection =
                        document.getElementById("overview");
                      if (overviewSection) {
                        overviewSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    Learn More
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Key Metrics Cards */}
            <div className="lg:col-span-1">
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {[
                  {
                    icon: Clock,
                    label: "Time to Profit",
                    value: business.timeToProfit || business.timeToStart,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    icon: DollarSign,
                    label: "Startup Cost",
                    value: business.startupCost || business.initialInvestment,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    icon: TrendingUp,
                    label: "Income Potential",
                    value: business.potentialIncome,
                    color: "from-purple-500 to-pink-500",
                  },
                ].map((metric, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex items-center mb-3">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center mr-4`}
                      >
                        <metric.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-300 font-medium">
                          {metric.label}
                        </div>
                        <div className="text-xl font-bold text-white">
                          {metric.value}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                  Guide Sections
                </h3>
                <nav className="space-y-1.5">
                  {getSidebarItems().map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center px-3 py-2.5 text-left rounded-xl transition-all duration-300 ${
                        activeSection === item.id
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-l-4 border-blue-700 shadow-lg transform scale-105 rounded-r-lg"
                          : "text-gray-700 hover:bg-gray-50 hover:scale-102"
                      }`}
                    >
                      <span className="font-medium text-sm ml-2">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Business Overview */}
            <section
              id="overview"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {business?.name || business?.title || "Business"} Overview
                </h2>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed text-base mb-4">
                  {business.detailedDescription || business.description}
                </p>

                <p className="text-gray-700 leading-relaxed text-base mb-4">
                  This business model has gained significant traction due to its
                  accessibility and scalability. Whether you're looking to
                  supplement your current income or build a full-time business,
                  this path offers multiple revenue streams and growth
                  opportunities. The key to success lies in understanding your
                  target market, delivering consistent value, and building
                  strong relationships with your audience or customers.
                </p>

                <p className="text-gray-700 leading-relaxed text-base mb-6">
                  What sets this business model apart is its flexibility and
                  relatively low barrier to entry. You can start small, test
                  different approaches, and scale based on what works best for
                  your situation. Many successful entrepreneurs in this field
                  started as complete beginners and built profitable businesses
                  by focusing on solving real problems for their customers and
                  continuously improving their offerings based on feedback and
                  market demands.
                </p>
              </div>
            </section>

            {/* Fit Analysis - Only show if AI analysis is available */}
            {quizData && (
              <section
                id="fit-analysis"
                className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center mb-8">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-4 ${
                      fitCategory === "Possible Fit" ||
                      fitCategory === "Poor Fit"
                        ? "bg-gradient-to-r from-red-600 to-pink-600"
                        : "bg-gradient-to-r from-green-600 to-emerald-600"
                    }`}
                  >
                    {fitCategory === "Possible Fit" ||
                    fitCategory === "Poor Fit" ? (
                      <AlertTriangle className="h-8 w-8 text-white" />
                    ) : (
                      <Target className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <h2
                    className={`text-3xl font-bold bg-clip-text text-transparent ${
                      fitCategory === "Possible Fit" ||
                      fitCategory === "Poor Fit"
                        ? "bg-gradient-to-r from-red-600 to-pink-600"
                        : "bg-gradient-to-r from-green-600 to-emerald-600"
                    }`}
                  >
                    {getFitTitle(
                      fitCategory,
                      business?.name || business?.title || "This Business",
                    )}
                  </h2>
                </div>

                {isLoadingModelInsights ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 text-blue-600 animate-spin mr-3" />
                    <span className="text-gray-600">
                      Generating personalized analysis...
                    </span>
                  </div>
                ) : modelInsights ? (
                  <>
                    <div className="prose max-w-none mb-8">
                      <div className="text-gray-700 leading-relaxed space-y-4 text-lg">
                        {modelInsights.modelFitReason
                          .split("\n\n")
                          .filter((paragraph) => paragraph.trim().length > 0)
                          .map((paragraph: string, index: number) => (
                            <p
                              key={index}
                              dangerouslySetInnerHTML={renderMarkdownContent(
                                paragraph.trim(),
                              )}
                            />
                          ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div
                        className={`rounded-2xl p-6 border ${
                          fitCategory === "Possible Fit" ||
                          fitCategory === "Poor Fit"
                            ? "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                            : "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                        }`}
                      >
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          {fitCategory === "Possible Fit" ||
                          fitCategory === "Poor Fit" ? (
                            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                          ) : (
                            <Star className="h-6 w-6 text-yellow-500 mr-2" />
                          )}
                          {fitCategory === "Possible Fit" ||
                          fitCategory === "Poor Fit"
                            ? "Why This Isn't Ideal For You"
                            : "Key Insights"}
                        </h3>
                        <ul className="space-y-3">
                          {modelInsights.keyInsights?.map(
                            (insight: string, index: number) => (
                              <li key={index} className="flex items-start">
                                {fitCategory === "Possible Fit" ||
                                fitCategory === "Poor Fit" ? (
                                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Star className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                                )}
                                <span
                                  className="text-gray-700"
                                  dangerouslySetInnerHTML={renderMarkdownContent(
                                    insight,
                                  )}
                                />
                              </li>
                            ),
                          )}
                        </ul>
                      </div>

                      <div
                        className={`rounded-2xl p-6 border ${
                          fitCategory === "Possible Fit" ||
                          fitCategory === "Poor Fit"
                            ? "bg-gradient-to-br from-red-50/70 to-red-100/70 border-red-300 backdrop-blur-sm"
                            : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                        }`}
                        style={{
                          backgroundColor:
                            fitCategory === "Possible Fit" ||
                            fitCategory === "Poor Fit"
                              ? "rgba(239, 68, 68, 0.1)" // red with low opacity for transparency
                              : undefined,
                        }}
                      >
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          {fitCategory === "Possible Fit" ||
                          fitCategory === "Poor Fit" ? (
                            <X className="h-6 w-6 text-red-500 mr-2" />
                          ) : (
                            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                          )}
                          {fitCategory === "Possible Fit" ||
                          fitCategory === "Poor Fit"
                            ? "Why You Would Struggle"
                            : "Success Predictors"}
                        </h3>
                        <ul className="space-y-3">
                          {modelInsights.successPredictors?.map(
                            (predictor: string, index: number) => (
                              <li key={index} className="flex items-start">
                                {fitCategory === "Possible Fit" ||
                                fitCategory === "Poor Fit" ? (
                                  <X className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                )}
                                <span
                                  className="text-gray-700"
                                  dangerouslySetInnerHTML={renderMarkdownContent(
                                    predictor,
                                  )}
                                />
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                    <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Personalized Analysis Available
                    </h3>
                    <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
                      Get detailed insights about why this business model fits
                      your unique profile.
                    </p>
                    <button
                      onClick={() => setShowPaywallModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Unlock Full Analysis
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Psychological Fit Breakdown */}
            <section
              id="psychological-fit"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Psychological Fit Breakdown
                </h2>
              </div>

              {hasCompletedQuiz && quizData ? (
                <>
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      How {business?.name || business?.title || "This Business"}{" "}
                      Fits Your Personality
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Based on your quiz responses, we've analyzed how your
                      personality traits align with the requirements of
                      successful {business.name || business.title}{" "}
                      entrepreneurs.
                    </p>
                  </div>

                  {/* Trait-by-trait match display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Your Personality Match
                      </h4>
                      {(() => {
                        const traits = calculateBusinessModelTraits(quizData);
                        const idealTraits = getIdealTraits(businessId || "");
                        return [
                          {
                            trait: "Risk Tolerance",
                            yourScore: traits.riskTolerance,
                            idealScore: idealTraits.riskTolerance,
                            description: `${traitDescriptions.riskTolerance.min} to ${traitDescriptions.riskTolerance.max}`,
                          },
                          {
                            trait: "Self-Motivation",
                            yourScore: traits.selfMotivation,
                            idealScore: idealTraits.selfMotivation,
                            description: `${traitDescriptions.selfMotivation.min} to ${traitDescriptions.selfMotivation.max}`,
                          },
                          {
                            trait: "Tech Comfort",
                            yourScore: traits.techComfort,
                            idealScore: idealTraits.techComfort,
                            description: `${traitDescriptions.techComfort.min} to ${traitDescriptions.techComfort.max}`,
                          },
                          {
                            trait: "Consistency",
                            yourScore: traits.consistency,
                            idealScore: idealTraits.consistency,
                            description: `${traitDescriptions.consistency.min} to ${traitDescriptions.consistency.max}`,
                          },
                          {
                            trait: "Learning Agility",
                            yourScore: traits.learningAgility,
                            idealScore: idealTraits.learningAgility,
                            description: `${traitDescriptions.learningAgility.min} to ${traitDescriptions.learningAgility.max}`,
                          },
                        ];
                      })().map((trait, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">
                              {trait.trait}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${trait.yourScore}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {trait.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Average Successful Profile
                      </h4>
                      {(() => {
                        const idealTraits = getIdealTraits(businessId || "");
                        return [
                          {
                            trait: "Risk Tolerance",
                            score: idealTraits.riskTolerance,
                            description: `${traitDescriptions.riskTolerance.min} to ${traitDescriptions.riskTolerance.max}`,
                          },
                          {
                            trait: "Self-Motivation",
                            score: idealTraits.selfMotivation,
                            description: `${traitDescriptions.selfMotivation.min} to ${traitDescriptions.selfMotivation.max}`,
                          },
                          {
                            trait: "Tech Comfort",
                            score: idealTraits.techComfort,
                            description: `${traitDescriptions.techComfort.min} to ${traitDescriptions.techComfort.max}`,
                          },
                          {
                            trait: "Consistency",
                            score: idealTraits.consistency,
                            description: `${traitDescriptions.consistency.min} to ${traitDescriptions.consistency.max}`,
                          },
                          {
                            trait: "Learning Agility",
                            score: idealTraits.learningAgility,
                            description: `${traitDescriptions.learningAgility.min} to ${traitDescriptions.learningAgility.max}`,
                          },
                        ];
                      })().map((trait, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">
                              {trait.trait}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                              style={{ width: `${trait.score}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {trait.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overall match summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">
                      Your Overall Psychological Fit:{" "}
                      {fitCategory === "Best Fit"
                        ? "Excellent!"
                        : fitCategory === "Strong Fit"
                          ? "Strong"
                          : fitCategory === "Possible Fit"
                            ? "Okay"
                            : "Poor"}
                    </h4>
                    <p className="text-blue-800 leading-relaxed">
                      {getPsychologicalFitDescription(
                        fitCategory,
                        business.name || business.title,
                        quizData,
                        businessId || "",
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border border-gray-200">
                  <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Detailed Psychological Analysis
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
                    Take the quiz to see how your personality traits align with
                    successful entrepreneurs in this field.
                  </p>
                  <button
                    onClick={() => setShowPaywallModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Take Quiz for Analysis
                  </button>
                </div>
              )}
            </section>

            {/* Pros & Cons */}
            <section
              id="pros-cons"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl flex items-center justify-center mr-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Pros & Cons of {business?.name || business?.title}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    Key Advantages
                  </h3>
                  <ul className="space-y-4">
                    {business.pros?.map((pro: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <AlertTriangle className="h-6 w-6 text-orange-500 mr-3" />
                    Potential Challenges
                  </h3>
                  <ul className="space-y-4">
                    {business.cons?.map((con: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Income Potential */}
            <section
              id="income-potential"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Income Potential & Timeline
                </h2>
              </div>

              {business.averageIncome && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {business.averageIncome.beginner}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Beginner (0-6 months)
                    </div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {business.averageIncome.intermediate}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Intermediate (6-18 months)
                    </div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {business.averageIncome.advanced}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Advanced (18+ months)
                    </div>
                  </div>
                </div>
              )}

              {/* AI-Powered Income Projections */}
              <IncomeProjectionChart
                businessId={businessId || ""}
                businessModel={business.name}
                quizData={quizData || undefined}
              />

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8 mt-8">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  Market Size & Opportunity
                </h3>
                <p className="text-blue-800 text-lg">{business.marketSize}</p>
              </div>
            </section>

            {/* Common Mistakes to Avoid */}
            <section
              id="common-mistakes"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mr-4">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Common Mistakes to Avoid
                </h2>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-red-900 mb-4">
                  Top 5 Mistakes Beginners Make in{" "}
                  {business.name || business.title}
                </h3>
                <p className="text-red-800 mb-4">
                  Learn from others' mistakes and avoid these common pitfalls
                  that can derail your success.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    mistake: "Choosing Products Without Market Research",
                    description:
                      "Many beginners promote products they like personally without researching if there's actual demand or competition.",
                    solution:
                      "Always validate demand using tools like Google Trends, keyword research, and competitor analysis before promoting any product.",
                  },
                  {
                    mistake: "Focusing Only on High-Commission Products",
                    description:
                      "Beginners often chase high-commission products that are difficult to sell instead of building trust with easier conversions.",
                    solution:
                      "Start with lower-commission products that convert well to build audience trust, then gradually introduce higher-value offers.",
                  },
                  {
                    mistake: "Not Disclosing Affiliate Relationships",
                    description:
                      "Failing to properly disclose affiliate relationships can damage credibility and violate FTC guidelines.",
                    solution:
                      "Always clearly disclose affiliate relationships in all content, emails, and social media posts to maintain transparency and legal compliance.",
                  },
                  {
                    mistake: "Expecting Overnight Success",
                    description:
                      "Many quit too early because they expect immediate results, but affiliate marketing typically takes 3-6 months to gain momentum.",
                    solution:
                      "Set realistic expectations and focus on consistent daily actions rather than immediate results. Track progress metrics weekly.",
                  },
                  {
                    mistake: "Neglecting Email List Building",
                    description:
                      "Relying solely on social media without building an owned email list leaves you vulnerable to platform changes.",
                    solution:
                      "Start building an email list from day one using lead magnets and email automation to create a stable revenue foundation.",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gradient-to-br from-gray-50 to-red-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                        <span className="text-red-600 font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {item.mistake}
                        </h4>
                        <p className="text-gray-600 mb-3">{item.description}</p>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <p className="text-sm text-green-800">
                            <strong>Solution:</strong> {item.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Required Skills */}
            <section
              id="required-skills"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Required Skills
                </h2>
              </div>

              {isLoadingSkills ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-3 text-lg text-gray-600">
                    Analyzing your skills...
                  </span>
                </div>
              ) : skillsAnalysis ? (
                <div className="space-y-8">
                  {/* Skills You Have - from quiz data */}
                  {quizData &&
                    quizData.familiarTools &&
                    quizData.familiarTools.length > 0 && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                          <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                          Skills You Have
                        </h3>
                        <div className="flex flex-wrap gap-3 mb-4">
                          {quizData.familiarTools.map((toolValue, index) => {
                            // Map tool values to display labels
                            const toolLabels: Record<string, string> = {
                              "google-docs-sheets": "Google Docs/Sheets",
                              canva: "Canva",
                              notion: "Notion",
                              "shopify-wix-squarespace":
                                "Shopify/Wix/Squarespace",
                              "zoom-streamyard": "Zoom/StreamYard",
                              figma: "Figma",
                              airtable: "Airtable",
                              wordpress: "WordPress",
                              chatgpt: "ChatGPT",
                              capcut: "CapCut",
                              "meta-ads-manager": "Meta Ads Manager",
                              zapier: "Zapier",
                            };

                            const displayLabel =
                              toolLabels[toolValue] || toolValue;

                            return (
                              <span
                                key={index}
                                className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium border border-green-200 flex items-center"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {displayLabel}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Skills You Need to Work On */}
                  {skillsAnalysis.workingOn.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <Clock className="h-6 w-6 text-orange-500 mr-3" />
                        Skills to Work On
                      </h3>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {skillsAnalysis.workingOn.map(
                          (skillAssessment, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-medium border border-orange-200 flex items-center"
                              title={skillAssessment.reasoning}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              {skillAssessment.skill}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills You Need to Learn */}
                  {skillsAnalysis.need.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <BookOpen className="h-6 w-6 text-red-500 mr-3" />
                        Skills You Need to Learn
                      </h3>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {skillsAnalysis.need.map((skillAssessment, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-medium border border-red-200 flex items-center"
                            title={skillAssessment.reasoning}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            {skillAssessment.skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Skills You Have - from quiz data (fallback when no AI analysis) */}
                  {quizData &&
                  quizData.familiarTools &&
                  quizData.familiarTools.length > 0 ? (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                        Skills You Have
                      </h3>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {quizData.familiarTools.map((toolValue, index) => {
                          // Map tool values to display labels
                          const toolLabels: Record<string, string> = {
                            "google-docs-sheets": "Google Docs/Sheets",
                            canva: "Canva",
                            notion: "Notion",
                            "shopify-wix-squarespace":
                              "Shopify/Wix/Squarespace",
                            "zoom-streamyard": "Zoom/StreamYard",
                            figma: "Figma",
                            airtable: "Airtable",
                            wordpress: "WordPress",
                            chatgpt: "ChatGPT",
                            capcut: "CapCut",
                            "meta-ads-manager": "Meta Ads Manager",
                            zapier: "Zapier",
                          };

                          const displayLabel =
                            toolLabels[toolValue] || toolValue;

                          return (
                            <span
                              key={index}
                              className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium border border-green-200 flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {displayLabel}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Complete the quiz to see your personalized skill
                        analysis
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Getting Started */}
            <section
              id="getting-started"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl flex items-center justify-center mr-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Getting Started
                </h2>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 border border-gray-200 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-xl">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Research & Plan
                    </h3>
                    <p className="text-gray-600">
                      Study the market and create your business plan
                    </p>
                  </div>
                  <div className="p-6 border border-gray-200 rounded-2xl bg-gradient-to-br from-green-50 to-green-100">
                    <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-xl">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Set Up Tools
                    </h3>
                    <p className="text-gray-600">
                      Get the essential tools and platforms ready
                    </p>
                  </div>
                  <div className="p-6 border border-gray-200 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Launch & Test
                    </h3>
                    <p className="text-gray-600">
                      Start small and iterate based on feedback
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Action Plan Overview */}
            <section
              id="action-plan"
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Step-by-Step Action Plan Overview
                </h2>
              </div>

              {business.actionPlan && (
                <div className="space-y-8">
                  {Object.entries(business.actionPlan).map(
                    ([phase, tasks], index) => (
                      <div
                        key={phase}
                        className="border border-gray-200 rounded-2xl p-8 bg-gradient-to-br from-gray-50 to-blue-50"
                      >
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 capitalize">
                          {phase
                            .replace(/(\d+)/, " $1")
                            .replace("phase", "Phase")}
                        </h3>
                        <ul className="space-y-4">
                          {(tasks as string[]).map((task, taskIndex) => (
                            <li key={taskIndex} className="flex items-start">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                                <span className="text-white font-bold text-sm">
                                  {taskIndex + 1}
                                </span>
                              </div>
                              <span className="text-gray-700 text-lg">
                                {task}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}

                  {/* Start Course Button */}
                  <div className="flex justify-center pt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStartCourse()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                    >
                      <BookOpen className="h-6 w-6" />
                      Start the Detailed Course
                      <ArrowRight className="h-6 w-6" />
                    </motion.button>
                  </div>
                </div>
              )}
            </section>

            {/* Ready to Start CTA */}
            <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-xl p-12 text-white">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-white mb-6">
                  Ready to Start Your Journey?
                </h3>
                <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
                  Take the first step towards building your{" "}
                  {businessPath?.name || "business"} with our comprehensive
                  step-by-step guide.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartCourse}
                    className="bg-white text-blue-600 px-12 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-3 justify-center"
                  >
                    <BookOpen className="h-6 w-6" />
                    Get Started Now
                    <ArrowRight className="h-6 w-6" />
                  </motion.button>
                </div>
              </div>
            </section>

            {/* Back to Results Navigation */}
            <section className="py-8 border-t border-gray-200">
              <div className="container mx-auto px-4 text-center">
                <a
                  href="/results"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  Back to Results
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessModelDetail;
