import React, { useState, useEffect } from "react";
import { X, Mail, CheckCircle, Loader2 } from "lucide-react";
import { getSessionId } from "../../../shared/utils";
import { QuizData } from "../types";

interface EmailResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizData: QuizData;
  isPaidUser: boolean;
  userEmail?: string | null;
}

const EmailResultsModal: React.FC<EmailResultsModalProps> = ({
  isOpen,
  onClose,
  quizData,
  isPaidUser,
  userEmail,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hasStoredEmail, setHasStoredEmail] = useState(false);

  useEffect(() => {
    if (isOpen && !isPaidUser) {
      checkStoredEmail();
    }
    if (isOpen && isPaidUser && userEmail) {
      setEmail(userEmail);
      setHasStoredEmail(true);
    }
  }, [isOpen, isPaidUser, userEmail]);

  const checkStoredEmail = async () => {
    try {
      const sessionId = getSessionId();
      const response = await fetch(`/api/get-stored-email/${sessionId}`);
      const data = await response.json();

      if (data.email) {
        setEmail(data.email);
        setHasStoredEmail(true);
      }
    } catch (error) {
      console.error("Error checking stored email:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // First, create temporary account and save data for 3 months if user provided email
      if (quizData && !isPaidUser) {
        console.log(
          "EmailResultsModal: Creating temporary account for 3-month storage",
        );

        try {
          const saveResponse = await fetch("/api/save-quiz-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quizData: quizData,
              email: email.trim(),
            }),
          });

          if (saveResponse.ok) {
            const saveResult = await saveResponse.json();
            console.log(
              "EmailResultsModal: Quiz data saved for 3 months",
              saveResult,
            );

            // Store email in localStorage so AI service knows user provided email
            localStorage.setItem("userEmail", email.trim());

            // Store quiz attempt ID for future reference
            if (saveResult.attemptId) {
              localStorage.setItem(
                "currentQuizAttemptId",
                saveResult.attemptId.toString(),
              );
            }

            // Retroactively save any existing AI content to database
            try {
              const { AIService } = await import("../utils/aiService");
              const aiService = AIService.getInstance();
              await aiService.saveExistingAIContentToDatabase();
            } catch (aiError) {
              console.error(
                "Error saving existing AI content to database:",
                aiError,
              );
            }
          } else {
            console.warn(
              "Failed to save quiz data for 3-month storage, but continuing with email...",
            );
          }
        } catch (saveError) {
          console.warn(
            "Error saving quiz data for 3-month storage:",
            saveError,
          );
          // Continue with email sending even if save fails
        }
      }

      // Then send the preview email
      const sessionId = getSessionId();
      const response = await fetch("/api/email-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          email: email.trim(),
          quizData,
          isPaidUser,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setError("Unable to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError("");

    try {
      const sessionId = getSessionId();
      const response = await fetch("/api/email-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          email: email.trim(),
          quizData,
          isPaidUser,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error resending email:", error);
      setError("Unable to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {success ? (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Email Sent!
            </h3>
            <p className="text-gray-600">
              Your {isPaidUser ? "full report" : "results"} have been sent to
              your email.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {hasStoredEmail ? "Send Results Again" : "Email My Results"}
              </h3>
              <p className="text-gray-600">
                {isPaidUser
                  ? "Get your complete business report with full analysis and recommendations."
                  : hasStoredEmail
                    ? "Send your results preview to your email again."
                    : "Get your personalized business model recommendations sent to your email."}
              </p>
            </div>

            {hasStoredEmail ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Sending to:</p>
                  <p className="font-semibold text-gray-900">{email}</p>
                </div>

                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    `Send ${isPaidUser ? "Full Report" : "Results"}`
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email address"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    `Send ${isPaidUser ? "Full Report" : "Results"}`
                  )}
                </button>
              </form>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {!isPaidUser && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-700 text-sm">
                  <strong>Preview Only:</strong> This email contains a summary
                  of your results. Upgrade to get your complete analysis with
                  detailed recommendations.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmailResultsModal;
