import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CreditCard, ArrowLeft, Check, Clock, Star } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

interface SimplePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  paymentId: number;
}

const SimplePaymentForm: React.FC<SimplePaymentFormProps> = ({
  onSuccess,
  onError,
  paymentId,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError("Card element not found");
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment("", {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess();
      }
    } catch (err) {
      onError("Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-gray-200 rounded-xl">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : "Pay $4.99"}
      </button>
    </form>
  );
};

const QuizPaymentRequired: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Check if payment is actually required
    const requiresPayment = localStorage.getItem("requiresQuizPayment");
    const pendingQuizData = localStorage.getItem("pendingQuizData");

    if (!requiresPayment || !pendingQuizData || !user) {
      navigate("/dashboard");
      return;
    }

    // Create payment intent
    createQuizPayment();
  }, [user, navigate]);

  const createQuizPayment = async () => {
    if (!user) return;

    setIsCreatingPayment(true);
    setError("");

    try {
      const response = await fetch("/api/create-quiz-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentId(data.paymentId);
    } catch (error) {
      console.error("Error creating quiz payment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create payment",
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    const pendingQuizData = localStorage.getItem("pendingQuizData");
    if (!pendingQuizData || !paymentId) return;

    try {
      // Save quiz data with payment ID
      const response = await fetch("/api/auth/save-quiz-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          quizData: JSON.parse(pendingQuizData),
          paymentId: paymentId,
        }),
      });

      if (response.ok) {
        // Clear temporary data
        localStorage.removeItem("pendingQuizData");
        localStorage.removeItem("requiresQuizPayment");

        // Update main quiz data
        localStorage.setItem("quizData", pendingQuizData);

        // Navigate to results
        navigate("/quiz-loading");
      } else {
        throw new Error("Failed to save quiz data after payment");
      }
    } catch (error) {
      console.error("Error saving quiz data after payment:", error);
      setError(
        "Payment successful but failed to save quiz data. Please contact support.",
      );
    }
  };

  const handleBack = () => {
    // Clear payment requirement and go back to dashboard
    localStorage.removeItem("pendingQuizData");
    localStorage.removeItem("requiresQuizPayment");
    navigate("/dashboard");
  };

  if (isCreatingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up payment...</p>
        </div>
      </div>
    );
  }

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
            Back to Dashboard
          </button>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Additional Quiz Payment
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Each additional quiz requires a $4.99 payment to generate new
            personalized recommendations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Payment Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                What You Get
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Fresh Analysis
                    </h3>
                    <p className="text-gray-600">
                      Updated business model recommendations based on your
                      current situation
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Check className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Detailed Report
                    </h3>
                    <p className="text-gray-600">
                      Comprehensive analysis with personalized insights and
                      action steps
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Check className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      AI-Powered Insights
                    </h3>
                    <p className="text-gray-600">
                      Advanced scoring algorithm analyzes your responses for the
                      best matches
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Check className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Business Guides
                    </h3>
                    <p className="text-gray-600">
                      Access to detailed guides for your top-matched business
                      models
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-yellow-400 mr-2" />
                <h3 className="text-xl font-bold">One-Time Payment</h3>
              </div>
              <p className="text-blue-100 mb-4">
                Pay $4.99 for each additional quiz attempt. No subscriptions or
                hidden fees.
              </p>
              <div className="flex items-center text-blue-100">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">Instant access after payment</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-gray-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Complete Payment
                </h2>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">
                    Quiz Payment
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    $4.99
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  One-time payment for additional quiz attempt
                </p>
              </div>

              {clientSecret && paymentId && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe" as const,
                      variables: {
                        colorPrimary: "#2563eb",
                      },
                    },
                  }}
                >
                  <SimplePaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={(error) => setError(error)}
                    paymentId={paymentId}
                  />
                </Elements>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QuizPaymentRequired;
