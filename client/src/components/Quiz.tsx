import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  DollarSign,
  Clock,
  Heart,
  Users,
  Award,
  Briefcase,
  Calendar,
  BookOpen,
  TrendingUp,
  Compass,
  MessageCircle,
  Zap,
  Star,
  Wallet,
  GraduationCap,
  Package,
  Monitor,
  ArrowRight,
  Target,
  Lightbulb,
  ArrowLeft,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { QuizData } from "../types";
import { quizSteps } from "../data/quizSteps";
import { useToast } from "../hooks/use-toast";
import { AICacheManager } from "../utils/aiCacheManager";
import { businessModelService } from "../utils/businessModelService";
import { useBusinessModelScores } from '../contexts/BusinessModelScoresContext';

// Mobile-specific content for scale questions
const mobileScaleContent: Record<
  string,
  {
    title: string;
    options: Array<{ label: string; description: string }>;
  }
> = {
  passionIdentityAlignment: {
    title:
      "How important is it that your business reflects your personal identity or passion?",
    options: [
      { label: "Not important", description: "Business is just business" },
      {
        label: "Slightly important",
        description: "Some alignment would be nice",
      },
      {
        label: "Moderately important",
        description: "Personal fit adds value",
      },
      { label: "Very important", description: "Must reflect who I am" },
      {
        label: "Extremely important",
        description: "Deep personal alignment required",
      },
    ],
  },
  passiveIncomeImportance: {
    title: "How important is long-term passive income to you?",
    options: [
      { label: "Not important", description: "Fine trading time for money" },
      {
        label: "Slightly important",
        description: "Passive income is optional",
      },
      {
        label: "Moderately important",
        description: "Want some passive income",
      },
      {
        label: "Very important",
        description: "Seeking long-term income freedom",
      },
      {
        label: "Extremely important",
        description: "Passive income is the goal",
      },
    ],
  },
  longTermConsistency: {
    title: "How consistent are you with long-term goals?",
    options: [
      {
        label: "I give up quickly",
        description: "Lose motivation easily",
      },
      {
        label: "Somewhat consistent",
        description: "Need accountability to follow through",
      },
      {
        label: "Moderately consistent",
        description: "Usually finish what I start",
      },
      {
        label: "Mostly consistent",
        description: "Stay focused with little support",
      },
      {
        label: "Always follow through",
        description: "Very disciplined and committed",
      },
    ],
  },
  trialErrorComfort: {
    title: "How do you feel about trial and error?",
    options: [
      { label: "Avoid it", description: "Need clear instructions" },
      { label: "Hesitant", description: "Prefer step-by-step guidance" },
      { label: "Tolerate it", description: "Open to trying things" },
      { label: "Open to it", description: "Comfortable learning by doing" },
      { label: "Embrace it", description: "Thrive through experimentation" },
    ],
  },
  systemsRoutinesEnjoyment: {
    title: "How much do you enjoy building routines or systems?",
    options: [
      { label: "Not at all", description: "Prefer unstructured work" },
      { label: "Slightly", description: "Use systems when necessary" },
      { label: "Moderately", description: "Appreciate simple routines" },
      { label: "Very much", description: "Enjoy structured systems" },
      {
        label: "I thrive on routines",
        description: "Routines drive my productivity",
      },
    ],
  },
  discouragementResilience: {
    title: "How discouraged do you get if something doesn't work right away?",
    options: [
      { label: "Very easily", description: "Get discouraged quickly" },
      { label: "Somewhat", description: "Struggle with slow progress" },
      { label: "Occasionally", description: "Stay calm but uncertain" },
      { label: "Rarely", description: "Bounce back quickly" },
      {
        label: "Never",
        description: "Persist no matter what",
      },
    ],
  },
  organizationLevel: {
    title: "How organized are you?",
    options: [
      { label: "Very disorganized", description: "Often feel scattered" },
      { label: "Slightly organized", description: "Try to stay on track" },
      {
        label: "Moderately organized",
        description: "Fair structure in place",
      },
      { label: "Very organized", description: "Work is well structured" },
      {
        label: "Extremely organized",
        description: "Highly systematic and neat",
      },
    ],
  },
  selfMotivationLevel: {
    title: "How self-motivated are you without external pressure?",
    options: [
      {
        label: "Need deadlines to act",
        description: "Rely on external pressure",
      },
      {
        label: "Occasionally motivated",
        description: "Push myself sometimes",
      },
      {
        label: "Moderately motivated",
        description: "Self-driven with reminders",
      },
      {
        label: "Very motivated",
        description: "Rarely need outside motivation",
      },
      {
        label: "Highly self-driven",
        description: "Always take initiative",
      },
    ],
  },
  uncertaintyHandling: {
    title: "How well do you handle uncertainty and unclear steps?",
    options: [
      { label: "Need things clear", description: "Struggle with ambiguity" },
      {
        label: "Occasionally adaptable",
        description: "Prefer structure but adjust",
      },
      {
        label: "Somewhat adaptable",
        description: "Adapt with some discomfort",
      },
      {
        label: "Very adaptable",
        description: "Manage well without clarity",
      },
      {
        label: "Extremely adaptable",
        description: "Thrive in uncertain situations",
      },
    ],
  },
  brandFaceComfort: {
    title: "How comfortable are you being the face of a brand?",
    options: [
      {
        label: "Extremely uncomfortable",
        description: "Avoid being seen",
      },
      {
        label: "Somewhat uncomfortable",
        description: "Prefer staying private",
      },
      { label: "Neutral", description: "Open to showing up" },
      { label: "Fairly comfortable", description: "Confident when visible" },
      { label: "Very comfortable", description: "Enjoy public presence" },
    ],
  },
  competitivenessLevel: {
    title: "How competitive are you?",
    options: [
      {
        label: "Not competitive",
        description: "Prefer collaboration over winning",
      },
      {
        label: "Slightly competitive",
        description: "Like success, not competition",
      },
      {
        label: "Moderately competitive",
        description: "Competitive when needed",
      },
      { label: "Very competitive", description: "Push to be the best" },
      {
        label: "Extremely competitive",
        description: "Thrive in high-stakes environments",
      },
    ],
  },
  creativeWorkEnjoyment: {
    title: "How much do you enjoy creative work (design, writing, ideation)?",
    options: [
      { label: "Not at all", description: "Avoid creative tasks" },
      { label: "Slightly", description: "Occasionally enjoy creativity" },
      { label: "Moderately", description: "Enjoy creative projects sometimes" },
      { label: "Very much", description: "Regularly pursue creative work" },
      { label: "I love it", description: "Creativity is my passion" },
    ],
  },
  directCommunicationEnjoyment: {
    title:
      "How much do you enjoy direct communication with others (support, coaching, service)?",
    options: [
      { label: "Avoid it", description: "Dislike direct interaction" },
      {
        label: "Occasionally enjoy it",
        description: "Can manage some interaction",
      },
      {
        label: "Moderately enjoy it",
        description: "Comfortable with communication",
      },
      { label: "Very much enjoy it", description: "Like helping others" },
      {
        label: "I enjoy it a lot",
        description: "Thrive in communication roles",
      },
    ],
  },
  techSkillsRating: {
    title: "How would you rate your tech skills overall?",
    options: [
      { label: "Very low", description: "Struggle with most tools" },
      { label: "Basic", description: "Know a few platforms" },
      { label: "Moderate", description: "Can learn quickly" },
      { label: "High", description: "Confident with new tools" },
      { label: "Very tech-savvy", description: "Excel with digital platforms" },
    ],
  },
  internetDeviceReliability: {
    title: "How reliable is your access to internet and devices?",
    options: [
      { label: "Not reliable", description: "Frequent connection issues" },
      {
        label: "Occasionally reliable",
        description: "Some tech problems occur",
      },
      { label: "Mostly reliable", description: "Reliable most of the time" },
      { label: "Very reliable", description: "Few access limitations" },
      {
        label: "Extremely reliable",
        description: "Always connected and ready",
      },
    ],
  },
  riskComfortLevel: {
    title: "How comfortable are you taking risks?",
    options: [
      { label: "Avoid risks", description: "Prefer low-stakes options" },
      {
        label: "Slightly comfortable",
        description: "Cautiously take small risks",
      },
      {
        label: "Moderately comfortable",
        description: "Balance risk and reward",
      },
      { label: "Very comfortable", description: "Comfortable with bold moves" },
      {
        label: "Totally comfortable",
        description: "Thrive in uncertain situations",
      },
    ],
  },
  feedbackRejectionResponse: {
    title: "How do you usually respond to negative feedback or rejection?",
    options: [
      {
        label: "Take it personally",
        description: "Feel discouraged quickly",
      },
      { label: "Feel discouraged", description: "Confidence takes a hit" },
      { label: "Reflect on it", description: "Think it through objectively" },
      { label: "Learn from it", description: "Improve and move forward" },
      {
        label: "Use it as motivation",
        description: "Turn feedback into fuel",
      },
    ],
  },
  controlImportance: {
    title:
      "How important is it for you to stay in full control of your business decisions?",
    options: [
      { label: "Not important", description: "Open to collaboration" },
      { label: "Slightly important", description: "Okay with shared input" },
      {
        label: "Moderately important",
        description: "Prefer some independence",
      },
      { label: "Very important", description: "Want clear decision authority" },
      {
        label: "Extremely important",
        description: "Need full decision control",
      },
    ],
  },
  socialMediaInterest: {
    title: "How interested are you in using social media to grow a business?",
    options: [
      { label: "Not at all", description: "Avoid using social media" },
      { label: "Slightly interested", description: "Rarely post or engage" },
      { label: "Moderately interested", description: "Use it when helpful" },
      { label: "Very interested", description: "See value in growth" },
      {
        label: "Extremely interested",
        description: "Social media is key",
      },
    ],
  },
  meaningfulContributionImportance: {
    title:
      "How important is it to you that your business contributes to something meaningful?",
    options: [
      { label: "Not important", description: "Profit over purpose" },
      { label: "Slightly important", description: "Purpose is secondary" },
      {
        label: "Moderately important",
        description: "Meaning adds value",
      },
      { label: "Very important", description: "Want to create impact" },
      {
        label: "Extremely important",
        description: "Mission comes first",
      },
    ],
  },
};

interface QuizProps {
  onComplete: (data: QuizData) => void;
  onBack: () => void;
  userId?: number;
}

interface ExitWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

const iconMap = {
  Heart,
  DollarSign,
  Clock,
  Wallet,
  Calendar,
  BookOpen,
  TrendingUp,
  Award,
  Users,
  Compass,
  MessageCircle,
  Zap,
  Star,
  Brain,
  Briefcase,
  GraduationCap,
  Package,
  Monitor,
  Target,
  Lightbulb,
};

// Define the rounds with their question ranges - ALL BLUE/PURPLE THEME
const rounds = [
  {
    id: 1,
    title: "Motivation & Vision",
    subtitle:
      "These questions focus on your goals, desired outcomes, and long-term vision.",
    icon: Heart,
    color: "from-blue-600 via-purple-600 to-indigo-600",
    bgColor: "from-blue-50 to-purple-50",
    questionRange: [0, 7], // Q1-Q8 (0-indexed)
    totalQuestions: 8,
    timeEstimate: "3–4 minutes",
  },
  {
    id: 2,
    title: "Time, Effort & Learning Style",
    subtitle:
      "These questions explore your availability, consistency, and how you like to learn.",
    icon: Clock,
    color: "from-blue-600 via-purple-600 to-indigo-600",
    bgColor: "from-blue-50 to-purple-50",
    questionRange: [8, 14], // Q9-Q15 (0-indexed)
    totalQuestions: 7,
    timeEstimate: "2.5–3 minutes",
  },
  {
    id: 3,
    title: "Personality & Preferences",
    subtitle:
      "This section will help uncover your style, strengths, and working preferences.",
    icon: Users,
    color: "from-blue-600 via-purple-600 to-indigo-600",
    bgColor: "from-blue-50 to-purple-50",
    questionRange: [15, 24], // Q16-Q25 (0-indexed)
    totalQuestions: 10,
    timeEstimate: "4–5 minutes",
  },
  {
    id: 4,
    title: "Tools & Work Environment",
    subtitle: "Now we'll look at your environment and access to key tools.",
    icon: Monitor,
    color: "from-blue-600 via-purple-600 to-indigo-600",
    bgColor: "from-blue-50 to-purple-50",
    questionRange: [25, 29], // Q26-Q30 (0-indexed)
    totalQuestions: 5,
    timeEstimate: "1.5–2 minutes",
  },
  {
    id: 5,
    title: "Strategy & Decision-Making",
    subtitle:
      "These questions dig into your strategic preferences and mindset.",
    icon: Brain,
    color: "from-blue-600 via-purple-600 to-indigo-600",
    bgColor: "from-blue-50 to-purple-50",
    questionRange: [30, 34], // Q31-Q35 (0-indexed)
    totalQuestions: 5,
    timeEstimate: "2–3 minutes",
  },
  {
    id: 6,
    title: "Business Model Fit Filters",
    subtitle:
      "Final stretch. These questions will help filter your best-fit business paths.",
    icon: Target,
    color: "from-blue-600 via-purple-600 to-indigo-600",
    bgColor: "from-blue-50 to-purple-50",
    questionRange: [35, 44], // Q36-Q45 (0-indexed)
    totalQuestions: 10,
    timeEstimate: "3–4 minutes",
  },
];

// Exit Warning Modal Component - FIXED to show immediately
const ExitWarningModal: React.FC<ExitWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
}) => {
  // Add escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <motion.div
        // REMOVED initial={{ opacity: 0, scale: 0.9, y: 20 }} to show immediately
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden opacity-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50"></div>

        <div className="relative p-4 py-8 md:p-8 md:py-12">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Warning Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          {/* Warning Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mb-10"
          >
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
              Are you sure you want to exit?
            </h2>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-6 mb-6 md:mb-8">
              <p className="text-base md:text-lg font-semibold text-red-800 mb-2">
                ⚠️ You will lose all progress!
              </p>
              <p className="text-red-700">
                You'll need to restart the entire quiz from the beginning to get
                your personalized business recommendations.
              </p>
            </div>

            <p className="text-gray-600 leading-relaxed">
              The quiz takes 10-15 minutes to complete and provides valuable
              insights about your perfect business match. Are you sure you want
              to lose your progress?
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-4"
          >
            {/* Continue Quiz Button (Primary) */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              Continue Quiz
            </button>

            {/* Exit Quiz Button (Secondary) */}
            <button
              onClick={onConfirmExit}
              className="w-full border-2 border-red-300 text-red-600 py-4 rounded-xl font-bold text-lg hover:bg-red-50 hover:border-red-400 transition-all duration-300"
            >
              Exit Quiz (Lose Progress)
            </button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-gray-500">
               Tip: Your results will be personalized based on all your
              answers
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// Helper to generate mock quiz data for dev skip
function generateMockQuizData(): QuizData {
  return {
    mainMotivation: "financial-freedom",
    firstIncomeTimeline: "Under 1 month",
    successIncomeGoal: 5000,
    upfrontInvestment: 500,
    passionIdentityAlignment: 4,
    businessExitPlan: "No",
    businessGrowthSize: "Full-time income",
    passiveIncomeImportance: 4,
    weeklyTimeCommitment: 20,
    longTermConsistency: 4,
    trialErrorComfort: 4,
    learningPreference: "hands-on",
    systemsRoutinesEnjoyment: 3,
    discouragementResilience: 3,
    toolLearningWillingness: "yes",
    organizationLevel: 3,
    selfMotivationLevel: 4,
    uncertaintyHandling: 3,
    repetitiveTasksFeeling: "I don't mind them",
    workCollaborationPreference: "independent",
    brandFaceComfort: 3,
    competitivenessLevel: 3,
    creativeWorkEnjoyment: 4,
    directCommunicationEnjoyment: 3,
    workStructurePreference: "some-structure",
    techSkillsRating: 4,
    workspaceAvailability: "yes",
    supportSystemStrength: "small-helpful-group",
    internetDeviceReliability: 4,
    familiarTools: ["google-docs-sheets", "canva"],
    decisionMakingStyle: "after-some-research",
    riskComfortLevel: 4,
    feedbackRejectionResponse: 3,
    pathPreference: "mix",
    controlImportance: 3,
    onlinePresenceComfort: "yes",
    clientCallsComfort: "yes",
    physicalShippingOpenness: "no",
    workStylePreference: "mix-both",
    socialMediaInterest: 3,
    ecosystemParticipation: "some",
    existingAudience: "none",
    promotingOthersOpenness: "yes",
    teachVsSolvePreference: "teach",
    meaningfulContributionImportance: 4,
    // Optionally add adaptive fields if needed
  };
}

const Quiz: React.FC<QuizProps> = ({ onComplete, onBack, userId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<QuizData>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRoundIntro, setShowRoundIntro] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [showExitModal, setShowExitModal] = useState(false);

  const { toast } = useToast();
  const { clearScores } = useBusinessModelScores();

  // Everyone can take unlimited quizzes in the new pay-per-report system

  // Clear previous quiz cache when starting a new quiz (idempotent for React StrictMode)
  useEffect(() => {
    // Use sessionStorage to ensure this runs only once per session, even in StrictMode
    const cacheCleared = sessionStorage.getItem("quiz-cache-cleared");
    const currentSession = Date.now().toString();

    if (cacheCleared && Date.now() - parseInt(cacheCleared) < 5000) {
      // Already cleared cache for this session, skip (prevents duplicate logs and clearing)
      return;
    }

    // SINGLE SOURCE OF TRUTH: All quiz/AI cache clearing happens here only
    sessionStorage.setItem("quiz-cache-cleared", currentSession);

    try {
      // Clear quiz data from previous sessions
      localStorage.removeItem("quizData");
      localStorage.removeItem("hasCompletedQuiz");
      localStorage.removeItem("currentQuizAttemptId");
      localStorage.removeItem("loadedReportData");
      localStorage.removeItem("quiz-completion-ai-insights");
      localStorage.removeItem("ai-generation-in-progress");
      localStorage.removeItem("ai-generation-timestamp");
      localStorage.removeItem("congratulationsShown");

      // Clear AI service caches (with error handling)
      const aiCacheManager = AICacheManager.getInstance();
      // aiCacheManager.forceResetCache();
      // Instead, manually clear all ai-content-* keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("ai-content-")) {
          localStorage.removeItem(key);
        }
      }

      // Clear business model scores for fresh calculation
      clearScores();

      // Clear in-memory business model cache
      businessModelService.clearCache();

      // Clear any remaining localStorage AI cache keys from previous sessions
      // Note: AI content is now stored in database, not localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("ai_insights_") ||
            key.startsWith("preview_") ||
            key.startsWith("fullreport_") ||
            key.startsWith("ai-analysis-") ||
            key.startsWith("skills-analysis-") ||
            key.startsWith("ai-cache-"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      // Only log once per session
      // console.log(`✅ Cleared AI caches and ${keysToRemove.length + 8} legacy cache entries for new quiz (AI content now stored in database)`);
    } catch (error) {
      // Only log errors
      console.error("Error cleaning up AI content:", error);
    }
  }, []); // Run only once when component mounts

  // Debug logging for exit modal state (reduced verbosity for StrictMode)
  useEffect(() => {
    if (showExitModal) {
      console.log(" Exit modal opened");
    }
  }, [showExitModal]);

  // Get current round info
  const getCurrentRound = () => {
    return (
      rounds.find(
        (round) =>
          currentStep >= round.questionRange[0] &&
          currentStep <= round.questionRange[1],
      ) || rounds[0]
    );
  };

  // Global keyboard event handler for escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        // If we're on the first round intro page, go directly home without exit modal
        if (showRoundIntro && currentRound === 1 && currentStep === 0) {
          onBack();
          return;
        }

        setShowExitModal(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showRoundIntro, currentRound, currentStep, onBack]);

  // Combined keyboard event handler for both round intro and quiz questions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showRoundIntro && event.key === "Enter") {
        event.preventDefault();
        handleRoundContinue();
      } else if (!showRoundIntro && event.key === "Enter") {
        event.preventDefault();

        // Check if user can proceed (has answered the question)
        const currentStepData = quizSteps[currentStep];
        const canProceed =
          formData[currentStepData?.field] !== undefined &&
          (currentStepData?.type !== "multiselect" ||
            (Array.isArray(formData[currentStepData?.field]) &&
              (formData[currentStepData?.field] as any[]).length > 0));

        if (canProceed && !isAnimating) {
          handleNext();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showRoundIntro, formData, currentStep, isAnimating]);

  const handleNext = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    if (currentStep < quizSteps.length - 1) {
      const nextStep = currentStep + 1;
      const currentRoundInfo = getCurrentRound();
      const nextRoundInfo = rounds.find(
        (round) =>
          nextStep >= round.questionRange[0] &&
          nextStep <= round.questionRange[1],
      );

      // Check if we're moving to a new round
      if (nextRoundInfo && nextRoundInfo.id !== currentRoundInfo.id) {
        setCurrentRound(nextRoundInfo.id);
        setShowRoundIntro(true);
        setCurrentStep(nextStep);
        setIsAnimating(false);
      } else {
        setTimeout(() => {
          setCurrentStep(nextStep);
          setIsAnimating(false);
        }, 300);
      }
    } else {
      setTimeout(async () => {
        console.log("Quiz completed with data:", formData);

        // Record the quiz attempt if userId is provided
        // Quiz attempts are now free and saved automatically via Results component
        if (userId) {
          toast({
            title: "Quiz Completed!",
            description: "Your responses will be saved when you view results.",
          });
        }

        onComplete(formData as QuizData);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handlePrevious = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      const currentRoundInfo = getCurrentRound();
      const prevRoundInfo = rounds.find(
        (round) =>
          prevStep >= round.questionRange[0] &&
          prevStep <= round.questionRange[1],
      );

      // Check if we're moving to a previous round
      if (prevRoundInfo && prevRoundInfo.id !== currentRoundInfo.id) {
        setCurrentRound(prevRoundInfo.id);
        setShowRoundIntro(true);
        setCurrentStep(prevStep);
        setIsAnimating(false);
      } else {
        setTimeout(() => {
          setCurrentStep(prevStep);
          setIsAnimating(false);
        }, 300);
      }
    } else {
      // If we're on the first question (step 0), go back to the round intro page
      setShowRoundIntro(true);
      setIsAnimating(false);
    }
  };

  const handleExitQuiz = () => {
    // Clear all quiz progress
    setFormData({});
    setCurrentStep(0);
    setCurrentRound(1);
    setShowRoundIntro(true);
    setShowExitModal(false);

    // Navigate back to home page
    onBack();
  };

  // FIXED: Simplified exit button handler with immediate state update
  const handleBackButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Back button clicked - checking if first round intro page");

    // If we're on the first round intro page, go directly home without exit modal
    if (showRoundIntro && currentRound === 1 && currentStep === 0) {
      console.log("On first round intro page - going directly home");
      onBack();
      return;
    }

    console.log("Showing exit modal");
    // Force immediate state update using callback form
    setShowExitModal((prevState) => {
      console.log("Setting exit modal to true, previous state was:", prevState);
      return true;
    });
  };

  const handleRoundContinue = () => {
    setShowRoundIntro(false);
  };

  // Handle back button on round intro pages - goes to previous question
  const handleRoundBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      // Find the round for the previous step
      const prevRoundInfo = rounds.find(
        (round) =>
          prevStep >= round.questionRange[0] &&
          prevStep <= round.questionRange[1],
      );

      if (prevRoundInfo) {
        setCurrentRound(prevRoundInfo.id);
      }

      setShowRoundIntro(false);
    } else {
      // If we're on the first round intro page, go directly home without exit modal
      if (currentRound === 1 && currentStep === 0) {
        onBack();
      } else {
        // For all other cases, show exit modal
        setShowExitModal(true);
      }
    }
  };

  const handleOptionSelect = (value: any) => {
    const field = quizSteps[currentStep].field;
    const stepType = quizSteps[currentStep].type;

    if (stepType === "multiselect") {
      const currentValues = (formData[field] as any[]) || [];
      let newValues;

      if (value === "none") {
        newValues = ["none"];
      } else if (currentValues.includes("none")) {
        newValues = [value];
      } else if (currentValues.includes(value)) {
        newValues = currentValues.filter((v) => v !== value);
      } else {
        newValues = [...currentValues, value];
      }

      setFormData((prev) => ({ ...prev, [field]: newValues }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const currentRoundInfo = getCurrentRound();
  const currentStepData = quizSteps[currentStep];
  const IconComponent =
    iconMap[currentStepData?.icon as keyof typeof iconMap] || Brain;
  const isLastStep = currentStep === quizSteps.length - 1;
  const canProceed =
    formData[currentStepData?.field] !== undefined &&
    (currentStepData?.type !== "multiselect" ||
      (Array.isArray(formData[currentStepData?.field]) &&
        (formData[currentStepData?.field] as any[]).length > 0));

  // Calculate progress percentage - 0% on question 1, 100% on completion
  const progressPercentage =
    currentStep === 0 ? 0 : (currentStep / quizSteps.length) * 100;

  // Move isDev and handleDevSkip to the top of the Quiz component so they are always in scope for JSX.
  const isDev = process.env.NODE_ENV === "development";
  const handleDevSkip = () => {
    onComplete(generateMockQuizData());
  };

  // Round Introduction Page
  if (showRoundIntro) {
    const RoundIcon = currentRoundInfo.icon;

    return (
      <div
        className={`min-h-screen flex items-center justify-center px-2 py-4 md:p-4 bg-gradient-to-br ${currentRoundInfo.bgColor} relative`}
      >
        {isDev && (
          <button
            onClick={handleDevSkip}
            style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
            className="bg-yellow-400 text-black px-4 py-2 rounded shadow hover:bg-yellow-300 font-bold"
          >
            DEV: Skip to Results
          </button>
        )}
        {/* Back Arrow Button - Shows Exit Modal */}
        <motion.button
          onClick={handleBackButtonClick}
          className="fixed top-6 left-6 z-20 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-all duration-300 transform hover:scale-110 group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="h-6 w-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
        </motion.button>

        <div className="max-w-4xl w-full">
          {/* Progress Bar */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span className="font-medium">
                Round {currentRoundInfo.id} - Question {currentStep + 1} of 45
              </span>
              <span className="font-medium">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-3 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Round Introduction Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl px-4 py-8 md:p-12 border border-gray-100 text-center relative"
          >
            {/* Round Icon */}
            <motion.div
              className={`w-24 h-24 bg-gradient-to-br ${currentRoundInfo.color} rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <RoundIcon className="h-12 w-12 text-white" />
            </motion.div>

            {/* Round Title */}
            <motion.h1
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Round {currentRoundInfo.id}: {currentRoundInfo.title}
            </motion.h1>

            {/* Round Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {currentRoundInfo.subtitle}
            </motion.p>

            {/* Round Stats */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center text-gray-500">
                <MessageCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  {currentRoundInfo.totalQuestions} Questions
                </span>
              </div>
              <div className="flex items-center text-gray-500">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  {currentRoundInfo.timeEstimate}
                </span>
              </div>
            </motion.div>

            {/* Continue Button - Centered */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <button
                onClick={handleRoundContinue}
                className={`group bg-gradient-to-r ${currentRoundInfo.color} text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center`}
              >
                Start Round {currentRoundInfo.id}
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>

            {/* Navigation Hint */}
            <motion.p
              className="text-sm text-gray-400 mb-6 hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Or press Enter to continue
            </motion.p>

            {/* Back Button - Bottom Left Corner */}
            {currentStep > 0 && (
              <motion.div
                className="absolute bottom-2 left-4 md:bottom-8 md:left-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <button
                  onClick={handleRoundBack}
                  className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Back
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Exit Warning Modal */}
        <ExitWarningModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          onConfirmExit={handleExitQuiz}
        />
      </div>
    );
  }

  // Regular Quiz Question
  return (
    <div className="min-h-screen flex items-center justify-center px-2 py-4 md:p-4 bg-gradient-to-br from-slate-50 to-blue-50 relative">
      {isDev && (
        <button
          onClick={handleDevSkip}
          style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
          className="bg-yellow-400 text-black px-4 py-2 rounded shadow hover:bg-yellow-300 font-bold"
        >
          DEV: Skip to Results
        </button>
      )}
      {/* Back Arrow Button - Shows Exit Modal */}
      <motion.button
        onClick={handleBackButtonClick}
        className="fixed top-6 left-6 z-20 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-all duration-300 transform hover:scale-110 group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="h-6 w-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
      </motion.button>

      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between text-sm text-gray-600 mb-3">
            <span className="font-medium">
              Round {currentRoundInfo.id} - Question {currentStep + 1} of 45
            </span>
            <span className="font-medium">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-3 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="bg-white rounded-3xl shadow-2xl px-4 py-6 md:p-8 border border-gray-100"
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="text-center mb-8">
              <motion.div
                className={`w-20 h-20 bg-gradient-to-br ${currentRoundInfo.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <IconComponent className="h-10 w-10 text-white" />
              </motion.div>

              {/* Desktop Title */}
              <motion.h2
                className="hidden md:block text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {currentStepData.title}
              </motion.h2>

              {/* Mobile Title - Use custom mobile content for scale questions */}
              <motion.h2
                className="md:hidden text-2xl font-bold text-gray-900 mb-3 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {currentStepData.type === "scale" &&
                mobileScaleContent[currentStepData.field]
                  ? mobileScaleContent[currentStepData.field].title
                  : currentStepData.title}
              </motion.h2>

              <motion.p
                className="text-lg text-gray-600 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {currentStepData.subtitle}
              </motion.p>
            </div>

            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {currentStepData.type === "scale" ? (
                <div className="space-y-6">
                  {/* Desktop Layout - hidden on mobile */}
                  <div className="hidden md:block">
                    <div className="flex justify-between items-center px-4">
                      <span className="text-sm font-medium text-gray-500">
                        Low
                      </span>
                      <span className="text-sm font-medium text-gray-500">
                        High
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-3 mt-6">
                      {currentStepData.options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleOptionSelect(option.value)}
                          className={`p-3 py-4 rounded-2xl border-2 text-center transition-all duration-300 hover:scale-105 min-h-[90px] flex flex-col items-center justify-center ${
                            formData[currentStepData.field] === option.value
                              ? "border-blue-500 bg-blue-50 shadow-xl transform scale-110"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <div className="text-2xl font-bold text-gray-900 mb-2 flex-1 flex items-center justify-center">{option.value}</div>
                          <div className="text-xs text-gray-600 font-medium leading-tight flex-1 flex items-center justify-center">{option.label}</div>
                        </button>
                      ))}
                    </div>
                    {formData[currentStepData.field] && (
                      <motion.div
                        className="text-center p-4 bg-blue-50 rounded-xl mt-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-blue-800 font-medium">
                          {
                            currentStepData.options?.find(
                              (opt) =>
                                opt.value === formData[currentStepData.field],
                            )?.description
                          }
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Mobile Layout - visible only on mobile */}
                  <div className="md:hidden space-y-3">
                    {(
                      mobileScaleContent[currentStepData.field]?.options ||
                      currentStepData.options
                    )?.map((option, index) => {
                      const mobileOption =
                        mobileScaleContent[currentStepData.field]?.options[
                          index
                        ];
                      const displayOption = mobileOption || option;
                      const value =
                        currentStepData.options?.[index]?.value || index + 1;

                      return (
                        <button
                          key={index}
                          onClick={() => handleOptionSelect(value)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                            formData[currentStepData.field] === value
                              ? "border-blue-500 bg-blue-50 shadow-lg"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <div className="font-bold text-gray-900 text-base mb-1">
                            {displayOption.label}
                          </div>
                          {displayOption.description && (
                            <div className="text-gray-600 text-sm">
                              {displayOption.description}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                  {currentStepData.options?.map((option, index) => {
                    const isSelected =
                      currentStepData.type === "multiselect"
                        ? Array.isArray(formData[currentStepData.field]) &&
                          (formData[currentStepData.field] as any[]).includes(
                            option.value,
                          )
                        : formData[currentStepData.field] === option.value;

                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleOptionSelect(option.value)}
                        className={`p-4 md:p-5 rounded-xl border-2 text-left transition-all duration-300 hover:scale-[1.02] relative ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-xl transform scale-[1.03]"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 mb-1 text-base">
                              {option.label}
                            </div>
                            {option.description && (
                              <div className="text-gray-600 text-sm">
                                {option.description}
                              </div>
                            )}
                          </div>

                          {/* Checkmark for selected options */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.3 }}
                              className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-3 flex-shrink-0"
                            >
                              <Check className="h-4 w-4 text-white" />
                            </motion.div>
                          )}

                          {/* Multiselect indicator */}
                          {currentStepData.type === "multiselect" &&
                            !isSelected && (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-300 ml-3 flex-shrink-0"></div>
                            )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Navigation */}
            <motion.div
              className="flex justify-between items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <button
                onClick={handlePrevious}
                disabled={isAnimating}
                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back
              </button>

              <div className="flex flex-col items-center">
                <button
                  onClick={handleNext}
                  disabled={!canProceed || isAnimating}
                  className={`flex items-center px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 ${
                    canProceed && !isAnimating
                      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white hover:shadow-xl transform hover:scale-105"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isLastStep ? "Get My Results" : "Next"}
                  {!isLastStep && <ChevronRight className="h-5 w-5 ml-2" />}
                </button>

                {/* Enter key hint */}
                {canProceed && (
                  <p className="text-xs text-gray-400 mt-2 hidden md:block">
                    Or press enter to continue
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Exit Warning Modal */}
      <ExitWarningModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={handleExitQuiz}
      />

      {/* Quiz retake modal removed - everyone can take unlimited quizzes */}
    </div>
  );
};

export default Quiz;
