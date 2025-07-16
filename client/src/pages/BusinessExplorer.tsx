import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { businessModels, BusinessModel } from "../data/businessModels";
import { PaywallModal } from "../components/PaywallModals";
import { PaymentAccountModal } from "../components/PaymentAccountModal";
import { usePaywall } from "../contexts/PaywallContext";
import { useAuth } from "../contexts/AuthContext";
import { QuizData } from "../types";
import {
  generatePersonalizedPaths,
  generateAIPersonalizedPaths,
} from "../utils/quizLogic";
import { businessModelService } from "../utils/businessModelService";

interface BusinessExplorerProps {
  quizData?: QuizData | null;
}

const BusinessExplorer: React.FC<BusinessExplorerProps> = ({
  quizData: propQuizData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedFitCategory, setSelectedFitCategory] = useState<string>("All");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paywallType, setPaywallType] = useState<
    "quiz-required" | "learn-more"
  >("quiz-required");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [personalizedPaths, setPersonalizedPaths] = useState<any[]>([]);
  const [quizData, setQuizData] = useState<QuizData | null>(
    propQuizData || null,
  );
  const [isLoadingQuizData, setIsLoadingQuizData] = useState(false);

  const navigate = useNavigate();
  const {
    hasCompletedQuiz,
    canAccessBusinessModel,
    setHasUnlockedAnalysis,
    hasUnlockedAnalysis,
  } = usePaywall();
  const { user, getLatestQuizData } = useAuth();

  const categories = [
    "All",
    ...Array.from(new Set(businessModels.map((model) => model.category))),
  ];
  const fitCategories = ["All", "Best", "Strong", "Possible", "Poor"];

  // Function to determine fit category based on score
  const getFitCategory = (score: number): string => {
    if (score >= 70) return "Best";
    if (score >= 50) return "Strong";
    if (score >= 30) return "Possible";
    return "Poor";
  };

  // Function to get fit category colors
  const getFitCategoryColor = (category: string): string => {
    switch (category) {
      case "Best":
        return "bg-green-100 text-green-800";
      case "Strong":
        return "bg-blue-100 text-blue-800";
      case "Possible":
        return "bg-yellow-100 text-yellow-800";
      case "Poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fetch quiz data for authenticated users
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!user || propQuizData) return; // If no user or already have quiz data, skip

      console.log("BusinessExplorer: Fetching quiz data for user:", user.email);
      setIsLoadingQuizData(true);

      // First test session health
      try {
        const sessionCheck = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        console.log(
          "BusinessExplorer: Session check status:",
          sessionCheck.status,
        );

        if (sessionCheck.ok) {
          const sessionUser = await sessionCheck.json();
          console.log("BusinessExplorer: Session user:", {
            id: sessionUser.id,
            email: sessionUser.email,
          });
        } else {
          console.log(
            "BusinessExplorer: Session check failed with status:",
            sessionCheck.status,
          );
          if (sessionCheck.status === 401) {
            console.log("BusinessExplorer: User not authenticated - 401 error");
          }
        }
      } catch (error) {
        console.error("BusinessExplorer: Session check failed:", error);
      }

      try {
        const latestQuizData = await getLatestQuizData();
        if (latestQuizData) {
          console.log("BusinessExplorer: Successfully loaded quiz data");
          setQuizData(latestQuizData);
        } else {
          console.log("BusinessExplorer: No quiz data found");
        }
      } catch (error) {
        console.error("BusinessExplorer: Error fetching quiz data:", error);
      } finally {
        setIsLoadingQuizData(false);
      }
    };

    fetchQuizData();
  }, [user, propQuizData, getLatestQuizData]);

  // Load consistent scoring algorithm paths
  useEffect(() => {
    if (!quizData || !hasUnlockedAnalysis) return;

    const loadPersonalizedPaths = async () => {
      try {
        // Use the same scoring algorithm as Results and Full Report for consistency
        const advancedScores = calculateAdvancedBusinessModelMatches(quizData);
        const consistentPaths = advancedScores.map((score) => ({
          id: score.id,
          name: score.name,
          fitScore: score.score,
          category: score.category,
        }));
        setPersonalizedPaths(consistentPaths);
      } catch (error) {
        console.error(
          "Failed to load consistent paths in BusinessExplorer:",
          error,
        );
        setPersonalizedPaths([]);
      }
    };

    loadPersonalizedPaths();
  }, [quizData, hasUnlockedAnalysis]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Calculate fit scores for business models if quiz data exists
  const businessModelsWithFitScores = useMemo(() => {
    if (!quizData || !hasUnlockedAnalysis) {
      // Development mode fallback disabled
      if (false && user && hasUnlockedAnalysis) {
        return businessModels.map((model, index) => {
          const mockScore = 85 - index * 3; // Descending scores for demo
          const fitCategory = getFitCategory(mockScore);
          return {
            ...model,
            fitScore: mockScore,
            fitCategory,
          };
        });
      }

      return businessModels.map((model) => ({
        ...model,
        fitScore: 0,
        fitCategory: undefined,
      }));
    }

    const modelsWithScores = businessModels.map((model) => {
      // Find matching business path by name or similar logic
      const matchingPath = personalizedPaths.find(
        (path) =>
          path.name.toLowerCase().includes(model.title.toLowerCase()) ||
          model.title.toLowerCase().includes(path.name.toLowerCase()),
      );

      const fitScore = matchingPath?.fitScore || 0;
      const fitCategory = getFitCategory(fitScore);

      return {
        ...model,
        fitScore,
        fitCategory,
      };
    });

    // Sort by fit score when quiz data is available (highest to lowest)
    if (quizData && hasUnlockedAnalysis) {
      modelsWithScores.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
    }

    return modelsWithScores;
  }, [quizData, hasUnlockedAnalysis, personalizedPaths]);

  const filteredModels = businessModelsWithFitScores.filter((model) => {
    const categoryMatch =
      selectedCategory === "All" || model.category === selectedCategory;
    const fitCategoryMatch =
      selectedFitCategory === "All" ||
      model.fitCategory === selectedFitCategory;
    return categoryMatch && fitCategoryMatch;
  });

  const handleCardExpand = (modelId: string) => {
    setExpandedCard((current) => (current === modelId ? null : modelId));
  };

  const handleLearnMore = (businessId: string) => {
    // For logged-in users, allow direct access to basic features
    if (user) {
      console.log(
        "BusinessExplorer: Logged user, navigating directly to business model",
      );
      navigate(`/business/${businessId}`);
      return;
    }

    // For logged-in users with quiz data, allow access regardless of hasCompletedQuiz flag
    const userHasQuizData = user && quizData;

    // Check if user has completed quiz (either flag is true OR user has quiz data OR can access business model)
    if (
      !hasCompletedQuiz &&
      !userHasQuizData &&
      !canAccessBusinessModel(businessId)
    ) {
      console.log("BusinessExplorer: User needs to complete quiz first");
      setPaywallType("quiz-required");
      setShowPaywallModal(true);
      return;
    }

    // Check if user can access business model details (has paid)
    if (canAccessBusinessModel(businessId)) {
      // User has paid, navigate directly
      console.log(
        "BusinessExplorer: User can access business model, navigating",
      );
      navigate(`/business/${businessId}`);
    } else {
      // User has completed quiz but hasn't paid
      console.log(
        "BusinessExplorer: User needs to pay for business model access",
      );
      setSelectedBusinessId(businessId);
      setPaywallType("learn-more");

      // Force account creation for new users
      if (!user) {
        setShowPaymentModal(true);
      } else {
        setShowPaywallModal(true);
      }
    }
  };

  const handlePaywallUnlock = () => {
    if (paywallType === "quiz-required") {
      // Navigate to quiz
      navigate("/quiz");
    } else if (paywallType === "learn-more") {
      // Development bypass disabled to ensure paywall always works
      // Always redirect to proper payment flow
      setShowPaywallModal(false);
      setShowPaymentModal(true);

      // Development bypass disabled:
      // if (import.meta.env.MODE === "development") {
      //   // DEV: Simulate payment and unlock access
      //   setHasUnlockedAnalysis(true);
      //   localStorage.setItem("hasAnyPayment", "true");
      //   setShowPaywallModal(false);
      //   navigate(`/business/${selectedBusinessId}`);
      // } else {
      //   // In production, redirect to proper payment flow
      //   setShowPaywallModal(false);
      //   setShowPaymentModal(true);
      // }
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    // Navigate to the business model page
    navigate(`/business/${selectedBusinessId}`);
  };

  const handlePaywallClose = () => {
    setShowPaywallModal(false);
    setSelectedBusinessId("");
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setSelectedBusinessId("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Business Model Explorer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the perfect business model for your goals, skills, and
            lifestyle. Each model includes detailed insights to help you make an
            informed decision.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {/* Fit Category Filter - Only show if user has paid */}
            {hasUnlockedAnalysis && quizData && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Fit Level:
                </label>
                <select
                  value={selectedFitCategory}
                  onChange={(e) => setSelectedFitCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {fitCategories.map((fitCategory) => (
                    <option key={fitCategory} value={fitCategory}>
                      {fitCategory}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredModels.length} of{" "}
              {businessModelsWithFitScores.length} business models
            </div>
          </div>
        </div>

        {/* Business Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredModels.map((model) => (
            <BusinessModelCard
              key={model.id}
              model={model}
              onLearnMore={handleLearnMore}
              isExpanded={expandedCard === model.id}
              onToggleExpand={() => handleCardExpand(model.id)}
              showFitBadge={
                !!(
                  hasUnlockedAnalysis &&
                  (quizData || (import.meta.env.MODE === "development" && user))
                )
              }
              fitCategory={model.fitCategory}
              fitScore={model.fitScore}
              getFitCategoryColor={getFitCategoryColor}
            />
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No business models match your current filters.
            </p>
          </div>
        )}
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={handlePaywallClose}
        onUnlock={handlePaywallUnlock}
        type={paywallType}
        title={
          selectedBusinessId
            ? businessModels.find((m) => m.id === selectedBusinessId)?.title
            : undefined
        }
      />

      {/* Payment Account Modal */}
      <PaymentAccountModal
        isOpen={showPaymentModal}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
        type={paywallType as "business-model" | "learn-more" | "full-report"}
        title={
          selectedBusinessId
            ? businessModels.find((m) => m.id === selectedBusinessId)?.title
            : undefined
        }
      />
    </div>
  );
};

const BusinessModelCard = ({
  model,
  onLearnMore,
  isExpanded,
  onToggleExpand,
  showFitBadge,
  fitCategory,
  fitScore,
  getFitCategoryColor,
}: {
  model: BusinessModel & { fitScore?: number; fitCategory?: string };
  onLearnMore: (businessId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  showFitBadge?: boolean;
  fitCategory?: string | null;
  fitScore?: number;
  getFitCategoryColor?: (category: string) => string;
}) => {
  const [showAllSkills, setShowAllSkills] = useState(false);

  const getScalabilityColor = (scalability: string) => {
    switch (scalability) {
      case "Low":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "High":
        return "bg-green-100 text-green-800";
      case "Very High":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleLearnMore = () => {
    onLearnMore(model.id);
  };

  const getSkillsToShow = () => {
    const maxSkillsToShow = 4;
    if (showAllSkills || model.requiredSkills.length <= maxSkillsToShow) {
      return model.requiredSkills;
    }
    return model.requiredSkills.slice(0, maxSkillsToShow);
  };

  const remainingSkillsCount = Math.max(0, model.requiredSkills.length - 4);

  const handleSkillsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllSkills(!showAllSkills);
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col ${
        isExpanded ? "md:col-span-2 lg:col-span-3" : ""
      }`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isExpanded ? 1.02 : 1,
      }}
      transition={{
        duration: 0.5,
        layout: { duration: 0.4, ease: "easeInOut" },
      }}
      whileHover={{ y: -5 }}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 relative">
          <h3 className="text-xl font-bold text-gray-900 flex-1 mr-2 line-clamp-2">
            {model.title}
          </h3>
          <div className="flex flex-col gap-1 items-end">
            {/* Show fit percentage if user has paid and quiz data exists */}
            {showFitBadge && fitScore !== undefined && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(fitScore)}%
                </div>
                <div className="text-xs text-gray-500">
                  {fitCategory ? `${fitCategory} Fit` : "Fit"}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-3">{model.description}</p>

        {/* Key Metrics */}
        <div className="space-y-2 mb-4 flex-shrink-0">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time to Start:</span>
            <span className="font-medium">{model.timeToStart}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Initial Investment:</span>
            <span className="font-medium">{model.initialInvestment}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Potential Income:</span>
            <span className="font-medium text-green-600">
              {model.potentialIncome}
            </span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500">Scalability:</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getScalabilityColor(model.scalability)}`}
            >
              {model.scalability}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Best Fit:</span>
            <span className="font-medium text-blue-600 text-right text-xs">
              {model.fit}
            </span>
          </div>
        </div>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden flex-grow"
            >
              {/* Detailed Description */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  About This Model
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {model.detailedDescription}
                </p>
              </div>

              {/* Required Skills */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-1">
                  {getSkillsToShow().map((skill, index) => (
                    <motion.span
                      key={`${skill}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {skill}
                    </motion.span>
                  ))}

                  {/* Show More/Less Skills Button */}
                  {model.requiredSkills.length > 4 && (
                    <button
                      onClick={handleSkillsToggle}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
                    >
                      {showAllSkills
                        ? "Show less"
                        : `+${remainingSkillsCount} more`}
                    </button>
                  )}
                </div>
              </div>

              {/* Tools */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Common Tools
                </h4>
                <div className="flex flex-wrap gap-1">
                  {model.tools.map((tool, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pros */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  Pros
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {model.pros.slice(0, 4).map((pro, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                  Cons
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {model.cons.slice(0, 4).map((con, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">×</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-sm text-gray-600">
                <strong>Time Commitment:</strong> {model.timeCommitment}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="mt-auto pt-4 space-y-3">
          {/* Expand/Collapse Button */}
          <button
            onClick={onToggleExpand}
            className="w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-colors duration-200 text-sm font-medium"
          >
            {isExpanded ? "Show Less" : "Show Details"}
          </button>

          {/* Learn More Link - Center Aligned */}
          <div className="text-center w-full">
            <button
              onClick={handleLearnMore}
              className="text-black hover:text-gray-700 font-medium text-sm transition-all duration-300 inline-flex items-center justify-center group"
            >
              <span>Learn More About {model.title}</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BusinessExplorer;
