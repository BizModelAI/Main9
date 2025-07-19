import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Star,
  CheckCircle,
  CreditCard,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { API_ROUTES, apiPost } from "../utils/apiClient";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

interface ReportPaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  quizAttemptId: number;
  onPricingUpdate: (amount: string, isFirstReport: boolean) => void;
  amount: string;
}

const ReportPaymentForm: React.FC<ReportPaymentFormProps> = ({
  onSuccess,
  onError,
  quizAttemptId,
  onPricingUpdate,
  amount,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");

  useEffect(() => {
    if (user) {
      createReportUnlockPayment();
    }
  }, [user]);

  const createReportUnlockPayment = async () => {
    if (!user) return;

    try {
      const data = await apiPost(API_ROUTES.CREATE_REPORT_UNLOCK_PAYMENT, {
        userId: user.id,
        quizAttemptId: quizAttemptId,
      });

      setClientSecret(data.clientSecret);
      onPricingUpdate(data.amount || "4.99", data.isFirstReport || false);
    } catch (error) {
      console.error("Error creating report unlock payment:", error);
      onError(
        error instanceof Error ? error.message : "Failed to create payment",
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
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
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        },
      );

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

  if (!clientSecret) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Setting up payment...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Unlock Full Report - ${amount}
          </>
        )}
      </button>
    </form>
  );
};

interface ReportUnlockPaywallProps {
  quizAttemptId: number;
  onUnlock: () => void;
  onBack?: () => void;
  preview?: boolean;
}

export const ReportUnlockPaywall: React.FC<ReportUnlockPaywallProps> = ({
  quizAttemptId,
  onUnlock,
  onBack,
  preview = false,
}) => {
  const [amount, setAmount] = useState("4.99");
  const [isFirstReport, setIsFirstReport] = useState(false);
  const [showPayment, setShowPayment] = useState(true); // Start with payment form for logged-in users
  const [error, setError] = useState<string>("");

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onUnlock();
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (showPayment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-md mx-auto"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Unlock Full Report
          </h3>
          <p className="text-gray-600">
            Get your complete detailed analysis for this quiz attempt
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Report Unlock</span>
            <span className="text-xl font-bold text-gray-900">${amount}</span>
          </div>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            appearance: {
              theme: "stripe" as const,
              variables: {
                colorPrimary: "#2563eb",
              },
            },
          }}
        >
          <ReportPaymentForm
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            quizAttemptId={quizAttemptId}
            onPricingUpdate={(newAmount, newIsFirstReport) => {
              setAmount(newAmount);
              setIsFirstReport(newIsFirstReport);
            }}
            amount={amount}
          />
        </Elements>

        <button
          onClick={() => {
            setShowPayment(false);
            if (onBack) onBack();
          }}
          className="w-full mt-4 text-gray-600 hover:text-gray-900 transition-colors text-sm"
        >
          Back to Preview
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>

      <div className="relative z-10 text-center">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-2xl font-bold mb-4">
          {preview ? "Preview Mode" : "Unlock Your Full Report"}
        </h3>

        <p className="text-blue-100 mb-6">
          {preview
            ? "You're viewing a limited preview. Unlock the full detailed analysis for this quiz attempt."
            : "Get your complete personalized business analysis with detailed insights, recommendations, and action plans."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <CheckCircle className="w-6 h-6 text-green-300 mx-auto mb-2" />
            <div className="text-sm text-blue-100">Detailed Analysis</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Star className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
            <div className="text-sm text-blue-100">Personalized Insights</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Clock className="w-6 h-6 text-purple-300 mx-auto mb-2" />
            <div className="text-sm text-blue-100">Action Plans</div>
          </div>
        </div>

        <button
          onClick={() => setShowPayment(true)}
          className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 mx-auto"
        >
          <CreditCard className="w-5 h-5" />
          Unlock for ${amount}
        </button>

        <p className="text-blue-200 text-sm mt-4">
          One-time payment • Instant access • No subscription
        </p>
      </div>
    </motion.div>
  );
};
