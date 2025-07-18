import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  Zap,
  Target,
  Star,
  CheckCircle,
  Clock,
  TrendingUp,
  Lightbulb,
  Award,
  Users,
  BarChart3,
} from "lucide-react";
import { QuizData } from "../types";

interface QuizCompletionLoadingProps {
  quizData: QuizData;
  onComplete: () => void;
}

interface ProcessingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  duration: number; // in seconds
  completed: boolean;
}

const QuizCompletionLoading: React.FC<QuizCompletionLoadingProps> = ({
  quizData,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Set all step durations to fit a total of 7 seconds
  const processingSteps: ProcessingStep[] = [
    {
      id: "analyzing",
      title: "Analyzing Your Responses",
      subtitle: "Processing your unique answers and preferences",
      icon: Brain,
      duration: 1.2, // seconds
      completed: false,
    },
    {
      id: "matching",
      title: "Finding Perfect Matches",
      subtitle: "AI is comparing you with business models",
      icon: Target,
      duration: 1.2,
      completed: false,
    },
    {
      id: "insights",
      title: "Generating Complete AI Analysis",
      subtitle: "Creating all insights and recommendations for your results",
      icon: Sparkles,
      duration: 1.2,
      completed: false,
    },
    {
      id: "profiling",
      title: "Building Your Profile",
      subtitle: "Identifying your entrepreneurial strengths",
      icon: Users,
      duration: 1.2,
      completed: false,
    },
    {
      id: "finalizing",
      title: "Preparing Results",
      subtitle: "Putting the finishing touches on your report",
      icon: Award,
      duration: 1.1,
      completed: false,
    },
    {
      id: "optimizing",
      title: "Optimizing Recommendations",
      subtitle: "Fine-tuning your personalized business strategy",
      icon: BarChart3,
      duration: 1.1,
      completed: false,
    },
  ];

  const [steps, setSteps] = useState<ProcessingStep[]>(processingSteps);

  // Remove generateAIInsights and all related calls to aiService.generatePersonalizedInsights and localStorage.setItem for quiz-completion-ai-insights.
  // Remove the useEffect that triggers generateAIInsights and any state related to isGeneratingInsights for AI insights.

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const runSteps = async () => {
      const totalDuration = 12000; // 12 seconds total
      const startTime = Date.now();
      let aiInsightsPromise: Promise<any> | null = null;
      let aiCompleted = false;

      // Start AI insights generation immediately
      // aiInsightsPromise = generateAIInsights()
      //   .then((result) => {
      //     aiCompleted = true;
      //     console.log("AI insights generated:", result ? "Success" : "Failed");
      //     return result;
      //   })
      //   .catch((error) => {
      //     aiCompleted = true;
      //     console.error("Error in AI generation:", error);
      //     return null;
      //   });

      // Process each step with smooth progress
      for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
        const stepStartTime = Date.now();
        const stepDuration = steps[stepIndex].duration * 1000;

        // Mark current step as active
        setCurrentStepIndex(stepIndex);
        setSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            completed: index < stepIndex,
          })),
        );

        // Calculate progress range for this step
        const stepStartProgress = (stepIndex / steps.length) * 100;
        const stepEndProgress = ((stepIndex + 1) / steps.length) * 100;

        // Animate progress smoothly for this step
        let animationFrame: number;
        const animateStepProgress = () => {
          const stepElapsed = Date.now() - stepStartTime;
          const stepProgressRatio = Math.min(stepElapsed / stepDuration, 1);

          // Smooth easing for natural progression
          const easedRatio =
            stepProgressRatio -
            ((Math.cos(stepProgressRatio * Math.PI) - 1) / 2) * 0.1;

          const currentProgress =
            stepStartProgress +
            (stepEndProgress - stepStartProgress) * easedRatio;
          setProgress(currentProgress);

          if (stepProgressRatio < 1) {
            animationFrame = requestAnimationFrame(animateStepProgress);
          }
        };

        animationFrame = requestAnimationFrame(animateStepProgress);

        cleanup = () => {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
          }
        };

        // Wait for step to complete with visual emphasis on mobile
        await new Promise((resolve) => setTimeout(resolve, stepDuration));

        // Add a brief pause between steps on mobile for better visibility
        if (stepIndex < steps.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Mark step as completed
        setSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            completed: index <= stepIndex,
          })),
        );

        cancelAnimationFrame(animationFrame);
      }

      // Ensure AI generation is complete
      if (!aiCompleted) {
        console.log("Waiting for AI insights to complete...");
        // await aiInsightsPromise; // This line is removed as generateAIInsights is removed
      }

      // Ensure minimum total time
      const elapsed = Date.now() - startTime;
      const minimumDuration = 7000;
      if (elapsed < minimumDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumDuration - elapsed),
        );
      }

      // Final progress animation to 100%
      let finalAnimationFrame: number;
      const animateFinalProgress = () => {
        setProgress((prev) => {
          const remaining = 100 - prev;
          const increment = remaining * 0.1; // Smooth final animation
          const newProgress = Math.min(prev + increment, 100);

          if (newProgress < 100) {
            finalAnimationFrame = requestAnimationFrame(animateFinalProgress);
          }
          return newProgress;
        });
      };

      finalAnimationFrame = requestAnimationFrame(animateFinalProgress);

      // Clean up final animation
      setTimeout(() => {
        if (finalAnimationFrame) {
          cancelAnimationFrame(finalAnimationFrame);
        }
        setProgress(100);
        setSteps((prev) => prev.map((step) => ({ ...step, completed: true })));

        // Complete loading
        setTimeout(() => {
          onComplete();
        }, 500);
      }, 1000);
    };

    runSteps();

    return () => {
      if (cleanup) cleanup();
    };
  }, [onComplete]);

  const getRandomMotivationalText = () => {
    const texts = [
      "Great entrepreneurs are made, not born...",
      "Your journey to success starts here...",
      "Every expert was once a beginner...",
      "The best time to start was yesterday, the second best time is now...",
      "Success is where preparation meets opportunity...",
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  const [motivationalText] = useState(getRandomMotivationalText());

  const [lastProgress, setLastProgress] = useState(0);
  useEffect(() => {
    setLastProgress((prev) => Math.max(prev, progress));
  }, [progress]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-20"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Pulsing Icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 25px 50px -12px rgba(139, 92, 246, 0.25)",
                "0 25px 50px -12px rgba(139, 92, 246, 0.4)",
                "0 25px 50px -12px rgba(139, 92, 246, 0.25)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Quiz Complete!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            AI is now analyzing your responses...
          </p>
          <p className="text-sm text-gray-500 italic">{motivationalText}</p>
        </motion.div>

        {/* Progress Section */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl p-8 mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Overall Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-700">
                Overall Progress
              </span>
              <span className="text-lg font-bold text-purple-600">
                {Math.round(lastProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: `${lastProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Animated shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
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
          </div>

          {/* Desktop Current Step Display */}
          <div className="hidden md:block">
            <AnimatePresence mode="wait">
              {steps.map((step, index) => {
                if (index !== currentStepIndex) return null;

                return (
                  <motion.div
                    key={step.id}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <motion.div
                        className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <step.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-gray-900">
                          {step.title}
                        </h3>
                        <p className="text-gray-600">{step.subtitle}</p>
                      </div>
                    </div>

                    {/* Animated dots for current step - desktop only */}
                    <div className="flex justify-center space-x-2">
                      {[0, 1, 2].map((dot) => (
                        <motion.div
                          key={dot}
                          className="w-2 h-2 bg-purple-500 rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: dot * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Mobile Enhanced Step Cards with Switching */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              {steps.map((step, index) =>
                index === currentStepIndex ? (
                  <motion.div
                    key={step.id}
                    className={`rounded-3xl shadow-xl p-6 border-2 transition-all duration-500 ${index < steps.length - 1 ? 'bg-blue-100 border-blue-200' : 'bg-green-200 border-green-300'}`}
                    initial={{ opacity: 0, scale: 0.8, x: 100, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -100, rotateY: -90 }}
                    transition={{ duration: 0.6, ease: 'easeInOut', type: 'spring', stiffness: 100 }}
                  >
                    <div className="text-center">
                      {/* Large Mobile Step Icon */}
                      <motion.div
                        className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transition-all duration-500 ${index < steps.length - 1 ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-green-500 to-green-400'}`}
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {React.createElement(step.icon, { className: 'w-10 h-10 text-white' })}
                      </motion.div>
                      {/* Mobile Step Info */}
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">{step.subtitle}</p>
                      </motion.div>
                      {/* Large Mobile Loading Dots - Prominent */}
                      <motion.div className="flex justify-center space-x-4 mb-6" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.4 }}>
                        {[0, 1, 2].map((dot) => (
                          <motion.div
                            key={dot}
                            className={`w-6 h-6 rounded-full shadow-2xl ${index < steps.length - 1 ? 'bg-blue-400' : 'bg-green-500'}`}
                            animate={{ scale: [1, 1.8, 1], opacity: [0.4, 1, 0.4], y: [0, -12, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.25, ease: 'easeInOut' }}
                          />
                        ))}
                      </motion.div>
                      {/* Mobile Step Counter */}
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.4 }}>
                        <div className={`py-2 px-4 rounded-full mx-auto w-fit shadow-lg text-lg font-bold transition-all duration-500 ${index < steps.length - 1 ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                          Step {index + 1} of {steps.length}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{index < steps.length - 1 ? 'Next: ' + steps[index + 1]?.title : 'Almost done!'}</p>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Steps Overview - Desktop: All steps, Mobile: Current step only */}

        {/* Desktop View - All Steps */}
        <motion.div
          className="hidden md:grid grid-cols-6 gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-3 rounded-xl text-center transition-all duration-300 ${
                index < currentStepIndex
                  ? "bg-green-100 text-green-700"
                  : index === currentStepIndex
                    ? "bg-purple-100 text-purple-700 ring-2 ring-purple-300"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              <div className="flex justify-center mb-2">
                {index < currentStepIndex ? (
                  <CheckCircle className="w-5 h-5" />
                ) : index === currentStepIndex ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <step.icon className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <p className="text-xs font-medium">{step.title}</p>
            </div>
          ))}
        </motion.div>

        {/* Fun Fact */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <Lightbulb className="w-5 h-5 mr-2" />
              <span className="font-semibold">Did you know?</span>
            </div>
            <p className="text-sm opacity-90">
              Our AI analyzes your responses against 15+ business models to find
              your perfect entrepreneurial match!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizCompletionLoading;
