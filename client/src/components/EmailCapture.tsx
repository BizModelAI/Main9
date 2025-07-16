import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  ArrowRight,
  X,
  CheckCircle,
  Clock,
  Star,
  Zap,
} from "lucide-react";
import type { QuizData } from "../types";
import { getSessionId } from "../../../shared/utils";

interface EmailCaptureProps {
  onEmailSubmit: (email: string) => void;
  onContinueAsGuest: () => void;
  onReturnToQuiz?: () => void;
  quizData?: QuizData;
  onStartAIGeneration: (email?: string) => void;
}

// Confetti component
const Confetti: React.FC = () => {
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      rotation: number;
      color: string;
      delay: number;
    }>
  >([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
      color: ["#3b82f6", "#8b5cf6", "#06d6a0", "#f59e0b", "#ef4444", "#ec4899"][
        Math.floor(Math.random() * 6)
      ],
      delay: Math.random() * 3,
    }));
    setConfettiPieces(pieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: piece.color,
            left: `${piece.x}%`,
          }}
          initial={{
            y: -20,
            rotate: piece.rotation,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: piece.rotation + 720,
            opacity: 0,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

const EmailCapture: React.FC<EmailCaptureProps> = ({
  onEmailSubmit,
  onContinueAsGuest,
  onReturnToQuiz,
  quizData,
  onStartAIGeneration,
}) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);

    try {
      // Use new 3-tier caching system to save quiz data and create temporary account
      if (quizData) {
        console.log(
          "EmailCapture: Saving quiz data with email to create temporary account",
        );

        const response = await fetch("/api/save-quiz-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizData: quizData,
            email: email.trim(),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("EmailCapture: Quiz data saved successfully", result);

          setEmailSent(true);

          // Store email in localStorage so AI service knows user provided email
          localStorage.setItem("userEmail", email.trim());

          // Store the quiz attempt ID for future reference
          if (result.attemptId) {
            localStorage.setItem("quizAttemptId", result.attemptId.toString());
          }

          // Also send preview email to user
          try {
            const emailResponse = await fetch("/api/email-results", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId: result.attemptId || Date.now(), // Use attempt ID or fallback
                email: email.trim(),
                quizData: quizData,
                isPaidUser: false,
              }),
            });

            if (!emailResponse.ok) {
              console.warn("Failed to send preview email, but continuing...");
            }
          } catch (emailError) {
            console.warn("Error sending preview email:", emailError);
            // Don't block the flow for email issues
          }

          // Retroactively save any existing AI content to database
          try {
            const { AIService } = await import("../utils/aiService");
            const aiService = AIService.getInstance();
            await aiService.saveExistingAIContentToDatabase();
          } catch (error) {
            console.error(
              "Error saving existing AI content to database:",
              error,
            );
          }

          // Wait a moment to show success message
          setTimeout(() => {
            onStartAIGeneration(email);
          }, 1500);
        } else {
          console.error("Failed to save quiz data with email");
          const errorData = await response.json();
          console.error("Error details:", errorData);
          // Still proceed even if save fails
          onStartAIGeneration(email);
        }
      } else {
        // No quiz data, just proceed
        localStorage.setItem("userEmail", email.trim());
        onStartAIGeneration(email);
      }
    } catch (error) {
      console.error("Error in email capture:", error);
      // Still proceed even if there's an error
      onStartAIGeneration(email);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestContinue = () => {
    onStartAIGeneration();
  };

  return (
    <>
      {/* Confetti Animation */}
      <Confetti />

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full h-auto relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50"></div>

          <div className="relative px-8 py-6 md:px-12 md:py-8">
            {/* Celebration Header */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-6"
            >
              <div className="text-5xl mb-4"></div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-2"
              >
                Congratulations!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-gray-600"
              >
                Your AI personalized report is ready.
              </motion.p>
            </motion.div>

            {/* Header */}
            <div className="text-center mb-6">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-xl md:text-2xl font-bold text-gray-900 mb-3"
              >
                Get Your Results Delivered!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="text-gray-600 leading-relaxed"
              >
                Enter your email to receive a personalized link to your results.
                You can always return to view your complete business blueprint.
              </motion.p>
            </div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="grid md:grid-cols-3 gap-3 mb-6"
            >
              {[
                {
                  icon: CheckCircle,
                  title: "3-Month Storage",
                  description: "Your results saved securely for 90 days",
                },
                {
                  icon: Clock,
                  title: "Email Delivery",
                  description: "Get results delivered to your inbox",
                },
                {
                  icon: Star,
                  title: "Upgrade Option",
                  description: "Convert to permanent storage anytime",
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="text-center p-3 bg-white/60 rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                >
                  <benefit.icon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Email Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              onSubmit={handleSubmit}
              className="mb-4"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${
                    isSubmitting || !email.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Get Results
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>

            {/* Success Message */}
            {emailSent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center justify-center"
              >
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  ✅ Email sent successfully! Redirecting to your results...
                </span>
              </motion.div>
            )}

            {/* Privacy Note & Continue as Guest */}
            {!emailSent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="text-center space-y-3"
              >
                <p className="text-xs text-gray-500">
                   We respect your privacy. Your results will be stored for 3
                  months, then automatically deleted unless you upgrade to
                  permanent storage.
                </p>

                <button
                  onClick={handleGuestContinue}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center justify-center group text-sm mx-auto"
                >
                  Continue as Guest (1-hour local storage only)
                  <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default EmailCapture;
