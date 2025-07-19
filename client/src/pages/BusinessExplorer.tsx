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
import { generateAIPersonalizedPaths } from "../utils/quizLogic";
import { businessModelService } from "../utils/businessModelService";
import { getSafeEmoji } from '../utils/contentUtils';
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../components/ui/card";
import '../styles/BusinessCard.css';

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedModelForModal, setSelectedModelForModal] = useState<BusinessModel | null>(null);

  const navigate = useNavigate();
  const {
    hasCompletedQuiz,
    canAccessBusinessModel,
    setHasUnlockedAnalysis,
    hasUnlockedAnalysis,
  } = usePaywall();
  const { user, isRealUser, getLatestQuizData } = useAuth();

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
      if (!isRealUser || propQuizData) return; // Only fetch for real users

      setIsLoadingQuizData(true);

      // First test session health
      try {
        const sessionCheck = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (sessionCheck.ok) {
          const sessionUser = await sessionCheck.json();
        } else {
          if (sessionCheck.status === 401) {
          }
        }
      } catch (error) {
      }
    };

    fetchQuizData();
  }, [isRealUser, propQuizData, getLatestQuizData]);

  // Load consistent scoring algorithm paths
  useEffect(() => {
    if (!quizData || !hasUnlockedAnalysis) return;

    const loadPersonalizedPaths = async () => {
      try {
        // Use the same scoring algorithm as Results and Full Report for consistency
        const advancedScores =
          businessModelService.getBusinessModelMatches(quizData);
        const consistentPaths = advancedScores.map((score) => ({
          id: score.id,
          name: score.name,
          fitScore: score.score,
          category: score.category,
        }));
        setPersonalizedPaths(consistentPaths);
      } catch (error) {
      }
    };

    loadPersonalizedPaths();
  }, [quizData, user?.isPaid]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Calculate fit scores for business models if quiz data exists
  const businessModelsWithFitScores = useMemo(() => {
    let models: (BusinessModel & { fitScore?: number; fitCategory?: string })[];
    if (!quizData || !user?.isPaid) {
      // For unpaid users or no quiz data, show models without fit scores
      models = businessModels.map((model) => ({
        ...model,
        fitScore: 0,
        fitCategory: undefined,
      }));
      // Alphabetical sort for unpaid users
      models.sort((a, b) => a.title.localeCompare(b.title));
      return models;
    }

    models = businessModels.map((model) => {
      // Find matching business path by ID for exact matching
      const matchingPath = personalizedPaths.find(
        (path) => path.id === model.id
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
    if (quizData && user?.isPaid) {
      models.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
    }

    return models;
  }, [quizData, user?.isPaid, personalizedPaths]);

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

  const handleShowDetails = (model: BusinessModel) => {
    setSelectedModelForModal(model);
    setShowDetailsModal(true);
  };

  const handleLearnMore = (businessId: string) => {
    // Simplified logic: authenticated users get access, others need quiz completion
    if (user) {
      navigate(`/business-model/${businessId}`);
      return;
    }

    if (!hasCompletedQuiz) {
      setPaywallType("quiz-required");
      setShowPaywallModal(true);
      return;
    }

    // User has completed quiz but needs to pay
      setSelectedBusinessId(businessId);
      setPaywallType("learn-more");
        setShowPaymentModal(true);
  };

  const handlePaywallUnlock = () => {
    if (paywallType === "quiz-required") {
      navigate("/quiz");
    } else {
      setShowPaywallModal(false);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    // Navigate to the business model page
    navigate(`/business-model/${selectedBusinessId}`);
  };

  const handlePaywallClose = () => {
    setShowPaywallModal(false);
    setSelectedBusinessId("");
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setSelectedBusinessId("");
  };

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedModelForModal(null);
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
            {user?.isPaid && quizData && (
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
        <div className="flex flex-wrap gap-6">
          {filteredModels.map((model) => (
            <div key={model.id} className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] min-h-[420px] flex">
            <BusinessModelCard
              model={model}
              onLearnMore={handleLearnMore}
                onShowDetails={() => handleShowDetails(model)}
              showFitBadge={
                !!(
                  user?.isPaid &&
                  quizData
                )
              }
              fitCategory={model.fitCategory}
              fitScore={model.fitScore}
              getFitCategoryColor={getFitCategoryColor}
            />
            </div>
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

      {/* Business Model Details Modal */}
      {showDetailsModal && selectedModelForModal && (
        <BusinessModelDetailsModal
          model={selectedModelForModal}
          onClose={handleDetailsModalClose}
          onLearnMore={handleLearnMore}
          showFitBadge={
            !!(
              hasUnlockedAnalysis &&
              (quizData || (import.meta.env.MODE === "development" && user))
            )
          }
          fitCategory={businessModelsWithFitScores.find(m => m.id === selectedModelForModal.id)?.fitCategory}
          fitScore={businessModelsWithFitScores.find(m => m.id === selectedModelForModal.id)?.fitScore}
          getFitCategoryColor={getFitCategoryColor}
        />
      )}
    </div>
  );
};

const BusinessModelCard = ({
  model,
  onLearnMore,
  onShowDetails,
  showFitBadge,
  fitCategory,
  fitScore,
  getFitCategoryColor,
}: {
  model: BusinessModel & { fitScore?: number; fitCategory?: string };
  onLearnMore: (businessId: string) => void;
  onShowDetails: () => void;
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

  // Function to get abbreviated business model name
  const getAbbreviatedName = (title: string): string => {
    const abbreviations: { [key: string]: string } = {
      "Freelancing": "Freelancing",
      "Content Creation / UGC": "UGC",
      "YouTube Automation Channels": "YouTube Automation",
      "Local Service Arbitrage": "LSA",
      "Social Media Marketing Agency (SMMA)": "SMMA",
      "E-commerce Dropshipping": "Dropshipping",
      "Digital Product Creation": "Digital Products",
      "Affiliate Marketing": "Affiliate Marketing",
      "Online Coaching": "Coaching",
      "SaaS (Software as a Service)": "SaaS",
      "Real Estate Investing": "Real Estate",
      "Print on Demand": "POD",
      "Amazon FBA": "FBA",
      "Virtual Assistant Services": "Virtual Assistance",
      "Web Design Agency": "Web Design",
      "Podcasting": "Podcasting",
      "Online Course Creation": "Course Creation",
      "Consulting": "Consulting",
      "App or SaaS Development": "App Development"
    };
    
    return abbreviations[title] || title;
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        layout: { duration: 0.4, ease: "easeInOut" },
      }}
      whileHover={{ y: -5 }}
    >
      <div className="px-6 py-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 relative">
          <div className="flex items-center flex-1 mr-2">
            <span className="text-3xl mr-3 emoji">{getSafeEmoji(model.id)}</span>
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
            {model.title}
          </h3>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {/* Show fit percentage if user has paid and quiz data exists */}
            {showFitBadge && fitScore !== undefined && fitScore > 0 && (
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
            <span className="text-gray-500" style={{ fontWeight: 'bold' }}>Time to Start:</span>
            <span style={{ fontWeight: 'normal' }}>{model.timeToStart}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500" style={{ fontWeight: 'bold' }}>Initial Investment:</span>
            <span style={{ fontWeight: 'normal' }}>{model.initialInvestment}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500" style={{ fontWeight: 'bold' }}>Potential Income:</span>
            <span style={{ fontWeight: 'normal' }}>{model.potentialIncome}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500" style={{ fontWeight: 'bold' }}>Scalability:</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getScalabilityColor(model.scalability)}`}
            >
              {model.scalability}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500" style={{ fontWeight: 'bold' }}>Best Fit:</span>
            <span className="font-medium text-blue-600 text-right text-xs">
              {model.fit}
            </span>
          </div>
        </div>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="mt-auto pt-4 space-y-3">
          {/* Show Details Button */}
          <button
            onClick={onShowDetails}
            className="w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-colors duration-200 text-sm font-medium"
          >
            Show Details
          </button>

          {/* Learn More Link - Center Aligned */}
          <div className="text-center w-full">
            <button
              onClick={handleLearnMore}
              className="text-black hover:text-gray-700 font-medium text-sm transition-all duration-300 inline-flex items-center justify-center group"
            >
              <span className="font-semibold">Learn More About {getAbbreviatedName(model.title)}</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Business Model Details Modal Component
const BusinessModelDetailsModal = ({
  model,
  onClose,
  onLearnMore,
  showFitBadge,
  fitCategory,
  fitScore,
  getFitCategoryColor,
}: {
  model: BusinessModel;
  onClose: () => void;
  onLearnMore: (businessId: string) => void;
  showFitBadge?: boolean;
  fitCategory?: string | null;
  fitScore?: number;
  getFitCategoryColor?: (category: string) => string;
}) => {
  // Function to get abbreviated business model name
  const getAbbreviatedName = (title: string): string => {
    const abbreviations: { [key: string]: string } = {
      "Freelancing": "Freelancing",
      "Content Creation / UGC": "UGC",
      "YouTube Automation Channels": "YouTube Automation",
      "Local Service Arbitrage": "LSA",
      "Social Media Marketing Agency (SMMA)": "SMMA",
      "E-commerce Dropshipping": "Dropshipping",
      "Digital Product Creation": "Digital Products",
      "Affiliate Marketing": "Affiliate Marketing",
      "Online Coaching": "Coaching",
      "SaaS (Software as a Service)": "SaaS",
      "Real Estate Investing": "Real Estate",
      "Print on Demand": "POD",
      "Amazon FBA": "FBA",
      "Virtual Assistant Services": "Virtual Assistance",
      "Web Design Agency": "Web Design",
      "Podcasting": "Podcasting",
      "Online Course Creation": "Course Creation",
      "Consulting": "Consulting",
      "App or SaaS Development": "App Development"
    };
    
    return abbreviations[title] || title;
  };

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

  const getSkillsToShow = () => {
    return model.requiredSkills;
  };

  const handleLearnMore = () => {
    onLearnMore(model.id);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-6 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 relative">
          {/* Close Button */}
                    <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 text-xl"
                    >
            ×
                    </button>

          {/* Header */}
          <Card className="mb-6 bg-white rounded-2xl shadow-lg mt-4">
            <CardHeader className="flex-row items-center gap-4">
              <span className="text-4xl mr-2 hover:scale-110 transition-transform duration-300 flex-shrink-0">{getSafeEmoji(model.id)}</span>
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-gray-900 leading-tight mb-1">{model.title}</CardTitle>
                <CardDescription className="text-lg text-gray-600 leading-relaxed">{model.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>

          {/* Fit Badge */}
          {showFitBadge && fitScore !== undefined && fitScore > 0 && (
            <Card className="mb-6 bg-white rounded-2xl shadow-lg">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(fitScore)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {fitCategory ? `${fitCategory} Fit` : "Fit"}
                  </div>
                </div>
                {fitCategory && getFitCategoryColor && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFitCategoryColor(fitCategory)}`}>
                    {fitCategory}
                  </span>
                )}
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-6 gap-6">
            {/* Left Column - 70% */}
            <div className="md:col-span-4 space-y-6">
              {/* About This Model */}
              <Card className="bg-white rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle>About This Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-w-prose">
                    <p className="text-gray-600 leading-relaxed text-base mb-4">{model.detailedDescription}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2 emoji">✅</span>
                        Project-based work with flexible scheduling
                </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2 emoji">✅</span>
                        Choose your own rates and clients
              </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2 emoji">✅</span>
                        Build a portfolio and reputation
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Required Skills */}
              <Card className="bg-white rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getSkillsToShow().map((skill, index) => (
                    <span
                      key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        {skill}
                    </span>
                  ))}
                </div>
                </CardContent>
              </Card>

              {/* Pros and Cons */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200">
                  <CardHeader>
                    <CardTitle>Pros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {model.pros.map((pro, index) => (
                        <li key={index} className="flex items-center text-gray-700 text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg border border-orange-200">
                  <CardHeader>
                    <CardTitle>Cons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {model.cons.map((con, index) => (
                        <li key={index} className="flex items-center text-gray-700 text-sm">
                      <span className="text-red-500 mr-2">×</span>
                      {con}
                    </li>
                  ))}
                </ul>
                  </CardContent>
                </Card>
              </div>
              </div>

            {/* Right Column - 30% */}
            <div className="md:col-span-2 space-y-4">
              {/* Info Cards */}
              <Card className="bg-white rounded-2xl shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Clock className="h-5 w-5 text-blue-600" />
              </div>
                    <div>
                      <div className="text-sm text-gray-600">Time to Start</div>
                      <div className="font-semibold text-gray-900">{model.timeToStart}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-2xl shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Initial Investment</div>
                      <div className="font-semibold text-gray-900">{model.initialInvestment}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-2xl shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Potential Income</div>
                      <div className="font-semibold text-green-700">{model.potentialIncome}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-2xl shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Scalability</div>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getFitCategoryColor ? getFitCategoryColor(model.scalability) : ''}`}>{model.scalability}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-2xl shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Time Commitment</div>
                      <div className="font-semibold text-gray-900">{model.timeCommitment}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Type Fit and Percentage - Only show for logged-in users */}
              {showFitBadge && fitScore !== undefined && fitScore > 0 && (
                <Card className="bg-white rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle>Your Fit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Match Score:</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(fitScore)}%
                          </div>
                        </div>
                      </div>
                      {fitCategory && getFitCategoryColor && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Fit Level:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFitCategoryColor(fitCategory)}`}>
                            {fitCategory}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Common Tools */}
              <Card className="bg-white rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle>Common Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {model.tools.map((tool, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm hover:shadow-md transition-shadow"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Learn More Link */}
          <div className="mt-8 pl-4">
            <button
              onClick={handleLearnMore}
              className="text-black hover:text-gray-700 font-medium text-base transition-all duration-300 inline-flex items-center justify-center group"
            >
              <span className="font-semibold">Learn More About {model.title}</span>
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

      </div>
      </motion.div>
    </motion.div>
  );
};

export default BusinessExplorer;
