import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Target,
  BarChart3,
  Clock,
  TrendingUp,
  Star,
  CheckCircle,
  Award,
  Users,
  Calendar,
  Edit,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { businessModelService } from "../utils/businessModelService";
import { QuizData } from "../types";
import { Link, useNavigate } from "react-router-dom";
import { businessPaths } from "../data/businessPaths";
import { QuizAttemptHistory } from "../components/QuizAttemptHistory";

const Dashboard: React.FC = () => {
  const { user, getLatestQuizData, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedBusinessModel, setSelectedBusinessModel] = useState<any>(null);
  const [showBusinessSelection, setShowBusinessSelection] = useState(false);
  const [hasEverSelectedModel, setHasEverSelectedModel] = useState(false);
  const [topBusinessModels, setTopBusinessModels] = useState<any[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // For triggering re-renders
  const [historicalQuizDate, setHistoricalQuizDate] = useState<string | null>(
    null,
  );
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Load real business model scores from user's quiz data
  useEffect(() => {
    const loadBusinessModelScores = async () => {
      setIsLoadingScores(true);
      try {
        // Try to get quiz data from authenticated user first
        let quizData: QuizData | null = null;

        // Wait for auth to complete loading before making API calls
        if (authLoading) {
          console.log("Dashboard: Waiting for auth to complete loading...");
          setIsLoadingScores(false);
          return;
        }

        // Only call API for non-temporary users (temporary users have IDs like "temp_sessionId")
        if (user && !String(user.id).startsWith("temp_")) {
          try {
            quizData = await getLatestQuizData();
          } catch (error) {
            console.log(
              "Failed to get quiz data from API, falling back to localStorage:",
              error,
            );
            // Silently continue to localStorage fallback
          }
        }

        // Fallback to localStorage if no authenticated quiz data
        if (!quizData) {
          const storedQuizData = localStorage.getItem("quizData");
          if (storedQuizData) {
            try {
              quizData = JSON.parse(storedQuizData);
            } catch (e) {
              console.error("Error parsing stored quiz data:", e);
            }
          }
        }

        if (quizData) {
          // Calculate real business model matches using the BusinessModelService
          const calculatedMatches =
            businessModelService.getBusinessModelMatches(quizData);

          // Map the calculated results to the format expected by the UI
          const formattedBusinessModels = calculatedMatches.map((match) => {
            // Map business model IDs to the UI format
            const businessModelMap: Record<string, any> = {
              "content-creation": {
                id: "content-creation-ugc",
                name: "Content Creation & UGC",
                description:
                  "Create engaging content and user-generated content for brands",
                timeToProfit: "2-4 weeks",
                potentialIncome: "$2K-15K/month",
                difficulty: "Beginner",
                icon: "📱",
              },
              "affiliate-marketing": {
                id: "affiliate-marketing",
                name: "Affiliate Marketing",
                description:
                  "Promote other people's products and earn commission on sales",
                timeToProfit: "3-6 months",
                potentialIncome: "$100-10K+/month",
                difficulty: "Easy",
                icon: "��",
              },
              freelancing: {
                id: "freelancing",
                name: "Freelancing",
                description:
                  "Offer your skills and services to clients on a project basis",
                timeToProfit: "1-2 weeks",
                potentialIncome: "$500-8K/month",
                difficulty: "Easy",
                icon: "💼",
              },
              "e-commerce": {
                id: "e-commerce-dropshipping",
                name: "E-commerce / Dropshipping",
                description: "Sell products online without holding inventory",
                timeToProfit: "2-6 months",
                potentialIncome: "$1K-50K/month",
                difficulty: "Medium",
                icon: "🛍️",
              },
              "virtual-assistant": {
                id: "virtual-assistant",
                name: "Virtual Assistant",
                description:
                  "Provide administrative support to businesses remotely",
                timeToProfit: "1-3 weeks",
                potentialIncome: "$300-5K/month",
                difficulty: "Easy",
                icon: "💻",
              },
              "online-tutoring": {
                id: "online-coaching-consulting",
                name: "Online Coaching & Consulting",
                description:
                  "Share your expertise through 1-on-1 coaching or consulting",
                timeToProfit: "4-8 weeks",
                potentialIncome: "$1K-20K/month",
                difficulty: "Medium",
                icon: "🎯",
              },
              "handmade-goods": {
                id: "print-on-demand",
                name: "Print on Demand",
                description:
                  "Design and sell custom products without inventory",
                timeToProfit: "6-12 weeks",
                potentialIncome: "$200-8K/month",
                difficulty: "Easy",
                icon: "🎨",
              },
              "youtube-automation": {
                id: "youtube-automation",
                name: "YouTube Automation",
                description:
                  "Create and monetize YouTube channels with outsourced content",
                timeToProfit: "3-9 months",
                potentialIncome: "$500-15K/month",
                difficulty: "Medium",
                icon: "📹",
              },
              "local-service": {
                id: "local-service-arbitrage",
                name: "Local Service Arbitrage",
                description: "Connect local customers with service providers",
                timeToProfit: "2-8 weeks",
                potentialIncome: "$1K-12K/month",
                difficulty: "Medium",
                icon: "🏠",
              },
              "saas-development": {
                id: "app-saas-development",
                name: "App / SaaS Development",
                description:
                  "Build and launch software applications or SaaS products",
                timeToProfit: "6-18 months",
                potentialIncome: "$5K-100K+/month",
                difficulty: "Hard",
                icon: "💻",
              },
              "social-media-agency": {
                id: "social-media-agency",
                name: "Social Media Agency",
                description:
                  "Manage social media accounts and marketing for businesses",
                timeToProfit: "2-6 months",
                potentialIncome: "$2K-25K/month",
                difficulty: "Medium",
                icon: "��",
              },
              copywriting: {
                id: "copywriting",
                name: "Copywriting",
                description: "Write persuasive marketing copy for businesses",
                timeToProfit: "2-8 weeks",
                potentialIncome: "$1K-15K/month",
                difficulty: "Easy",
                icon: "✍️",
              },
            };

            const baseModel = businessModelMap[match.id] || {
              id: match.id,
              name: match.name,
              description: `Build a successful ${match.name.toLowerCase()} business`,
              timeToProfit: "2-6 months",
              potentialIncome: "$1K-10K/month",
              difficulty: "Medium",
              icon: "🚀",
            };

            return {
              ...baseModel,
              fitScore: match.score, // Use the real calculated score
            };
          });

          setTopBusinessModels(formattedBusinessModels);
        } else {
          // Fallback to default models if no quiz data found
          setTopBusinessModels(getDefaultBusinessModels());
        }
      } catch (error) {
        console.error("Error loading business model scores:", error);
        // Fallback to default models on error
        setTopBusinessModels(getDefaultBusinessModels());
      } finally {
        setIsLoadingScores(false);
      }
    };

    loadBusinessModelScores();
  }, [user, getLatestQuizData, authLoading, refreshKey]);

  // Check if user has ever selected a business model on component mount
  React.useEffect(() => {
    const savedModel = localStorage.getItem("selectedBusinessModel");
    const hasSelected = localStorage.getItem("hasEverSelectedModel");

    if (savedModel) {
      setSelectedBusinessModel(JSON.parse(savedModel));
    }

    if (hasSelected === "true") {
      setHasEverSelectedModel(true);
    } else {
      // Show business selection if user has never selected a model
      setShowBusinessSelection(true);
    }
  }, []);

  // Get fit category based on score
  const getFitCategory = (score: number) => {
    if (score >= 70)
      return {
        label: "Best Fit",
        color: "bg-green-500",
        textColor: "text-green-700",
      };
    if (score >= 50)
      return {
        label: "Strong Fit",
        color: "bg-blue-500",
        textColor: "text-blue-700",
      };
    if (score >= 30)
      return {
        label: "Possible Fit",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
      };
    return {
      label: "Poor Fit",
      color: "bg-red-500",
      textColor: "text-red-700",
    };
  };

  // Function to get default business models as fallback
  const getDefaultBusinessModels = () => [
    {
      id: "content-creation-ugc",
      name: "Content Creation & UGC",
      description:
        "Create engaging content and user-generated content for brands",
      fitScore: 75,
      timeToProfit: "2-4 weeks",
      potentialIncome: "$2K-15K/month",
      difficulty: "Beginner",
      icon: "📱",
    },
    {
      id: "affiliate-marketing",
      name: "Affiliate Marketing",
      description:
        "Promote other people's products and earn commission on sales",
      fitScore: 70,
      timeToProfit: "3-6 months",
      potentialIncome: "$100-10K+/month",
      difficulty: "Easy",
      icon: "🔗",
    },
    {
      id: "freelancing",
      name: "Freelancing",
      description:
        "Offer your skills and services to clients on a project basis",
      fitScore: 68,
      timeToProfit: "1-2 weeks",
      potentialIncome: "$500-8K/month",
      difficulty: "Easy",
      icon: "💼",
    },
    {
      id: "e-commerce-dropshipping",
      name: "E-commerce / Dropshipping",
      description: "Sell products online without holding inventory",
      fitScore: 65,
      timeToProfit: "2-6 months",
      potentialIncome: "$1K-50K/month",
      difficulty: "Medium",
      icon: "🛒",
    },
    {
      id: "virtual-assistant",
      name: "Virtual Assistant",
      description: "Provide administrative support to businesses remotely",
      fitScore: 60,
      timeToProfit: "1-3 weeks",
      potentialIncome: "$300-5K/month",
      difficulty: "Easy",
      icon: "💻",
    },
    {
      id: "online-coaching-consulting",
      name: "Online Coaching & Consulting",
      description: "Share your expertise through 1-on-1 coaching or consulting",
      fitScore: 58,
      timeToProfit: "4-8 weeks",
      potentialIncome: "$1K-20K/month",
      difficulty: "Medium",
      icon: "🎯",
    },
    {
      id: "print-on-demand",
      name: "Print on Demand",
      description: "Design and sell custom products without inventory",
      fitScore: 55,
      timeToProfit: "6-12 weeks",
      potentialIncome: "$200-8K/month",
      difficulty: "Easy",
      icon: "🎨",
    },
    {
      id: "youtube-automation",
      name: "YouTube Automation",
      description:
        "Create and monetize YouTube channels with outsourced content",
      fitScore: 52,
      timeToProfit: "3-9 months",
      potentialIncome: "$500-15K/month",
      difficulty: "Medium",
      icon: "��",
    },
    {
      id: "local-service-arbitrage",
      name: "Local Service Arbitrage",
      description: "Connect local customers with service providers",
      fitScore: 50,
      timeToProfit: "2-8 weeks",
      potentialIncome: "$1K-12K/month",
      difficulty: "Medium",
      icon: "🏠",
    },
  ];

  const handleBusinessModelSelect = (businessModel: any) => {
    setSelectedBusinessModel(businessModel);
    setShowBusinessSelection(false);
    setHasEverSelectedModel(true);

    // Save to localStorage
    localStorage.setItem(
      "selectedBusinessModel",
      JSON.stringify(businessModel),
    );
    localStorage.setItem("hasEverSelectedModel", "true");
  };

  const handleChangeBusinessModel = () => {
    setShowBusinessSelection(true);
  };

  const handleStartCompleteGuide = () => {
    if (selectedBusinessModel) {
      navigate(`/guide/${selectedBusinessModel.id}`);
      // Scroll to top after navigation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 0);
    }
  };

  const handleNavigateWithScrollToTop = (path: string) => {
    navigate(path);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 0);
  };

  const handleQuizSelected = (
    quizData: QuizData,
    aiContent?: any,
    completedAt?: string,
  ) => {
    console.log("Quiz selected in Dashboard:", {
      quizData,
      aiContent,
      completedAt,
    });

    // Set historical quiz date if provided
    if (completedAt) {
      const formattedDate = new Date(completedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      setHistoricalQuizDate(formattedDate);
    }

    // Show success notification
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);

    // Trigger a re-render of components that depend on localStorage data
    setRefreshKey((prev) => prev + 1);
    // Re-calculate business models with new quiz data
    setIsLoadingScores(true);

    // The business model calculation will be triggered by the useEffect
    // that watches for authLoading, user, and getLatestQuizData changes
    setTimeout(() => {
      setIsLoadingScores(false);
    }, 500);
  };

  const quickActions = [
    {
      title: "Retake Quiz",
      description: "Update your preferences and get new recommendations",
      href: "/quiz",
      icon: BookOpen,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      useLink: true,
    },
    {
      title: "View Full Results",
      description: "See your complete personalized business analysis",
      href: "/results",
      icon: Target,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      useLink: false,
    },
    {
      title: "Explore All Models",
      description: "Browse our complete business model database",
      href: "/explore",
      icon: BarChart3,
      color: "green",
      gradient: "from-green-500 to-green-600",
      useLink: false,
    },
  ];

  // Dynamic Recent Activity based on real user data
  const [recentActivity, setRecentActivity] = useState<
    Array<{
      action: string;
      time: string;
      icon: any;
      color: string;
    }>
  >([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Generate recent activity from user data
  useEffect(() => {
    const generateRecentActivity = async () => {
      if (!user || authLoading) {
        setActivityLoading(false);
        return;
      }

      setActivityLoading(true);
      const activities = [];

      try {
        // Get quiz attempts to track quiz activity
        const quizAttemptsResponse = await fetch(
          `/api/quiz-attempts/${user.id}`,
        );
        if (quizAttemptsResponse.ok) {
          const attempts = await quizAttemptsResponse.json();

          // Add quiz completion activities
          attempts.slice(0, 2).forEach((attempt: any, index: number) => {
            const completedAt = new Date(attempt.completedAt);
            const timeAgo = getTimeAgo(completedAt);

            activities.push({
              action:
                index === 0
                  ? "Completed Business Path Quiz"
                  : "Retook Business Path Quiz",
              time: timeAgo,
              icon: BookOpen,
              color: "blue",
            });
          });

          // Add business model analysis activity if user has quiz data
          if (attempts.length > 0) {
            const latestAttempt = attempts[0];
            const analysisTime = getTimeAgo(
              new Date(latestAttempt.completedAt),
            );
            activities.push({
              action: "Generated business model analysis",
              time: analysisTime,
              icon: BarChart3,
              color: "purple",
            });
          }
        }

        // Add business model selection activity
        if (selectedBusinessModel) {
          activities.push({
            action: `Exploring ${selectedBusinessModel.name}`,
            time: "Current session",
            icon: Target,
            color: "green",
          });
        }

        // Add dashboard access activity
        activities.push({
          action: "Accessed Dashboard",
          time: "Just now",
          icon: Calendar,
          color: "blue",
        });

        // Sort by most recent and limit to 3
        const sortedActivities = activities
          .sort((a, b) => {
            // Prioritize "just now" and recent activities
            if (a.time === "Just now") return -1;
            if (b.time === "Just now") return 1;
            if (a.time === "Current session") return -1;
            if (b.time === "Current session") return 1;
            return 0;
          })
          .slice(0, 3);

        setRecentActivity(sortedActivities);
      } catch (error) {
        console.error("Error generating recent activity:", error);
        // Fallback to basic activity
        setRecentActivity([
          {
            action: "Accessed Dashboard",
            time: "Just now",
            icon: Calendar,
            color: "blue",
          },
          {
            action: "Account authenticated",
            time: "Today",
            icon: Users,
            color: "green",
          },
        ]);
      } finally {
        setActivityLoading(false);
      }
    };

    generateRecentActivity();
  }, [user, authLoading, selectedBusinessModel, refreshKey]);

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  const learningModules = [
    {
      title: "Getting Started Fundamentals",
      description: "Essential foundations for your business journey",
      progress: 0,
      duration: "45 min",
      lessons: 8,
    },
    {
      title: "Content Strategy Mastery",
      description: "Create content that converts and builds audience",
      progress: 0,
      duration: "2.5 hours",
      lessons: 12,
    },
    {
      title: "Monetization Strategies",
      description: "Turn your content into consistent income streams",
      progress: 0,
      duration: "1.8 hours",
      lessons: 10,
    },
  ];

  // Business Model Selection Screen
  const BusinessModelSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Business Model
            </h1>
            <p className="text-xl text-gray-600">
              Select the business model you'd like to get a complete guide for
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 max-w-7xl mx-auto px-4 sm:px-8">
            {isLoadingScores
              ? // Loading state
                Array.from({ length: 18 }).map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-200 w-full aspect-[4/3] flex items-center justify-center"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </motion.div>
                ))
              : topBusinessModels.map((model, index) => {
                  const fitCategory = getFitCategory(model.fitScore);
                  return (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="relative bg-white rounded-3xl p-6 md:p-8 lg:p-6 shadow-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border-gray-200 hover:border-gray-300 w-full aspect-[4/3] sm:min-h-[320px] sm:aspect-auto md:min-h-[380px] md:aspect-auto lg:min-h-[380px] lg:aspect-auto flex flex-col"
                      onClick={() => handleBusinessModelSelect(model)}
                    >
                      <div className="absolute -top-3 left-6">
                        <div
                          className={`${fitCategory.color} text-white px-4 py-1 rounded-full text-sm font-semibold`}
                        >
                          {fitCategory.label} • {model.fitScore}%
                        </div>
                      </div>

                      <div className="flex items-start mb-3 sm:mb-4 md:mb-4 lg:mb-3">
                        <div className="text-3xl sm:text-4xl md:text-4xl lg:text-3xl mr-3 sm:mr-4 md:mr-4 lg:mr-3 flex-shrink-0">
                          {model.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl md:text-xl lg:text-lg font-bold text-gray-900 mb-2 sm:mb-3 md:mb-3 lg:mb-2 leading-tight">
                            {model.name}
                          </h3>
                          <p className="text-gray-600 text-sm sm:text-base md:text-base lg:text-sm mb-3 sm:mb-4 md:mb-4 lg:mb-3 leading-tight sm:leading-relaxed md:leading-relaxed lg:leading-normal">
                            {model.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-6 md:mb-6 lg:gap-3 lg:mb-6">
                        <div className="text-center sm:bg-gray-50 sm:rounded-xl sm:p-3 md:bg-gray-50 md:rounded-xl md:p-4 lg:bg-gray-50 lg:rounded-xl lg:p-3">
                          <div className="text-xs text-gray-500 sm:font-medium sm:mb-1 md:font-medium md:mb-2 lg:text-xs lg:font-medium lg:mb-1">
                            Time to Profit
                          </div>
                          <div className="font-semibold sm:font-bold md:font-bold lg:font-bold text-gray-900 text-sm md:text-base lg:text-sm">
                            {model.timeToProfit}
                          </div>
                        </div>
                        <div className="text-center sm:bg-gray-50 sm:rounded-xl sm:p-3 md:bg-gray-50 md:rounded-xl md:p-4 lg:bg-gray-50 lg:rounded-xl lg:p-3">
                          <div className="text-xs text-gray-500 sm:font-medium sm:mb-1 md:font-medium md:mb-2 lg:text-xs lg:font-medium lg:mb-1">
                            Income
                          </div>
                          <div className="font-semibold sm:font-bold md:font-bold lg:font-bold text-gray-900 text-sm md:text-base lg:text-sm">
                            {model.potentialIncome}
                          </div>
                        </div>
                      </div>

                      {/* Spacer to push button to bottom */}
                      <div className="flex-grow"></div>

                      <div className="flex items-center mt-auto">
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 sm:py-4 md:py-4 lg:py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all text-sm sm:text-base md:text-base lg:text-sm sm:shadow-lg md:shadow-lg hover:shadow-xl">
                          Select This Model
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
          </div>

          {/* Quick Actions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action, index) => {
                  if (action.useLink) {
                    return (
                      <Link
                        key={index}
                        to={action.href}
                        className="group flex flex-col items-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 border border-gray-100 hover:border-gray-200 text-center"
                      >
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mb-4`}
                        >
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                          {action.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {action.description}
                        </p>
                      </Link>
                    );
                  } else {
                    return (
                      <button
                        key={index}
                        onClick={() =>
                          handleNavigateWithScrollToTop(action.href)
                        }
                        className="group flex flex-col items-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 border border-gray-100 hover:border-gray-200 text-center w-full"
                      >
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mb-4`}
                        >
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                          {action.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {action.description}
                        </p>
                      </button>
                    );
                  }
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );

  // Show business model selection if user wants to see it or has never selected a model
  if (showBusinessSelection) {
    return <BusinessModelSelection />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Welcome back, {user?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-xl text-gray-600">
                Ready to take the next step in your entrepreneurial journey?
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Star className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Historical Quiz Banner */}
        {historicalQuizDate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-amber-800 font-medium">
                Viewing Quiz from {historicalQuizDate}
              </span>
            </div>
            <button
              onClick={() => {
                setHistoricalQuizDate(null);
                localStorage.removeItem("currentQuizAttemptId");
                setRefreshKey((prev) => prev + 1);
              }}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              Return to Current Quiz
            </button>
          </motion.div>
        )}

        {/* Success Notification */}
        {showSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Quiz data loaded successfully!
            </span>
          </motion.div>
        )}

        {/* Start Your Journey - Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          {selectedBusinessModel ? (
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 md:p-12 overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center flex-1 min-w-0">
                    {/* Hide emoji on mobile, show on desktop */}
                    <div className="hidden md:flex w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl items-center justify-center mr-4">
                      <span className="text-3xl">
                        {selectedBusinessModel.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                        <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold inline-block w-fit whitespace-nowrap">
                          {selectedBusinessModel.fitScore}% Match
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 pr-4">
                        {selectedBusinessModel.name}
                      </h2>
                      <p className="text-blue-100 text-base sm:text-lg">
                        Start your journey to financial freedom today.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleChangeBusinessModel}
                    className="flex flex-col sm:flex-row items-center text-blue-100 hover:text-white transition-colors text-xs sm:text-sm font-medium ml-2 whitespace-nowrap"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-1" />
                    <span className="text-center">
                      Change<span className="hidden sm:inline"> </span>
                      <br className="sm:hidden" />
                      Model
                    </span>
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-blue-200 mr-2" />
                      <span className="text-blue-100 text-sm font-medium">
                        Time to Profit
                      </span>
                    </div>
                    <div className="text-white font-bold text-lg">
                      {selectedBusinessModel.timeToProfit}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-300 mr-2" />
                      <span className="text-blue-100 text-sm font-medium">
                        Income Potential
                      </span>
                    </div>
                    <div className="text-white font-bold text-lg">
                      {selectedBusinessModel.potentialIncome}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-yellow-300 mr-2" />
                      <span className="text-blue-100 text-sm font-medium">
                        Difficulty
                      </span>
                    </div>
                    <div className="text-white font-bold text-lg">
                      {selectedBusinessModel.difficulty}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleStartCompleteGuide}
                    className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                  >
                    View Complete Guide
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to results page with query parameter to show full report
                      navigate("/results?showFullReport=true");
                    }}
                    className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                  >
                    View Full Analysis
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-3xl p-8 md:p-12 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-gray-200 text-lg mb-8">
                  Choose a business model to begin your entrepreneurial journey
                </p>
                <button
                  onClick={handleChangeBusinessModel}
                  className="bg-white text-gray-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center mx-auto"
                >
                  Choose Business Model
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  if (action.useLink) {
                    return (
                      <Link
                        key={index}
                        to={action.href}
                        className="group flex items-center p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 border border-gray-100 hover:border-gray-200"
                      >
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mr-4`}
                        >
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </Link>
                    );
                  } else {
                    return (
                      <button
                        key={index}
                        onClick={() =>
                          handleNavigateWithScrollToTop(action.href)
                        }
                        className="group flex items-center p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 border border-gray-100 hover:border-gray-200 w-full text-left"
                      >
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mr-4`}
                        >
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  }
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {activityLoading ? (
                  // Loading state
                  <>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-start space-x-3 animate-pulse"
                      >
                        <div className="w-8 h-8 bg-gray-200 rounded-xl flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : recentActivity.length > 0 ? (
                  // Show actual activities
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 bg-${activity.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <activity.icon
                          className={`h-4 w-4 text-${activity.color}-600`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Empty state
                  <div className="text-center py-4">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quiz History Section */}
        {user && !authLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 mb-8"
          >
            <QuizAttemptHistory
              key={refreshKey}
              userId={parseInt(String(user.id))}
              onQuizSelected={handleQuizSelected}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
