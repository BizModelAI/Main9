import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PaymentAccountModal } from "../components/PaymentAccountModal";

const SaveResultsPayment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Check if user has quiz data to save
    const quizData = localStorage.getItem("quizData");
    const hasCompletedQuiz =
      localStorage.getItem("hasCompletedQuiz") === "true";

    if (!quizData || !hasCompletedQuiz) {
      // No quiz data to save, redirect back
      navigate("/dashboard");
      return;
    }

    // If user is not logged in, they need to create account first
    if (!user) {
      setShowPaymentModal(true);
    } else {
      // User is logged in, proceed to payment
      setShowPaymentModal(true);
    }
  }, [user, navigate]);

  const handlePaymentSuccess = async () => {
    try {
      // Payment successful, save quiz data and unlock features
      const quizData = localStorage.getItem("quizData");
      if (quizData && user) {
        // Save quiz data to user account
        const response = await fetch("/api/auth/save-quiz-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ quizData: JSON.parse(quizData) }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.quizAttemptId) {
            localStorage.setItem(
              "currentQuizAttemptId",
              data.quizAttemptId.toString(),
            );
          }

          // Set flags for unlocked access
          localStorage.setItem("hasUnlockedAnalysis", "true");
          localStorage.setItem("hasCompletedQuiz", "true");
          localStorage.setItem("hasAnyPayment", "true");

          // Navigate to results page and force a reload to ensure latest quiz is displayed with full access
          navigate("/results");
          // Small delay to ensure navigation completes, then reload to show latest quiz with full access
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          throw new Error("Failed to save quiz data");
        }
      }
    } catch (error) {
      console.error("Error saving quiz results:", error);
      setError("Failed to save quiz results. Please try again.");
    }
  };

  const handleClose = () => {
    // User cancelled payment, go back to results preview
    navigate("/results");
  };

  const handleBack = () => {
    navigate("/results");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </button>

          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Save className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Save Your Quiz Results
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock your complete business analysis and save your results to your
            account for just $4.99.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What You Get
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Complete Business Analysis
                  </h3>
                  <p className="text-gray-600">
                    Detailed insights into your top business matches with
                    personalized recommendations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Saved to Your Account
                  </h3>
                  <p className="text-gray-600">
                    Access your results anytime from your dashboard and track
                    your progress
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Download & Share
                  </h3>
                  <p className="text-gray-600">
                    Get PDF reports and share your results with mentors,
                    friends, and family
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Business Guides & Resources
                  </h3>
                  <p className="text-gray-600">
                    Access detailed guides and resources for your top business
                    matches
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Modal */}
        <PaymentAccountModal
          isOpen={showPaymentModal}
          onClose={handleClose}
          onSuccess={handlePaymentSuccess}
          type="full-report"
          title="Save Quiz Results"
        />
      </div>
    </div>
  );
};

export default SaveResultsPayment;
