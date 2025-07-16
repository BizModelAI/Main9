import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Loader, CheckCircle, CreditCard, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_...",
);

interface EnhancedPaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  amount?: number;
  isFirstReport?: boolean;
  quizAttemptId?: number; // Required for report unlock payments
}

const PaymentMethodSelector: React.FC<{
  selectedMethod: "card" | "paypal";
  onMethodChange: (method: "card" | "paypal") => void;
}> = ({ selectedMethod, onMethodChange }) => {
  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment</h3>
      <p className="text-sm text-gray-600 mb-4">
        All transactions are secure and encrypted.
      </p>

      {/* Credit Card Option */}
      <div
        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
          selectedMethod === "card"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={() => onMethodChange("card")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedMethod === "card"
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300"
              }`}
            >
              {selectedMethod === "card" && (
                <div className="w-full h-full rounded-full bg-white scale-50"></div>
              )}
            </div>
            <span className="font-medium text-gray-900">Credit card</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Credit card brand icons */}
            <img
              src="https://cdn.jsdelivr.net/gh/lipis/flag-icon-css@master/flags/4x3/us.svg"
              alt="Visa"
              className="w-8 h-5 rounded"
              style={{
                background: "#1a1f71",
                color: "white",
                fontSize: "6px",
                textAlign: "center",
                lineHeight: "20px",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="w-8 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
              MC
            </div>
            <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
              AE
            </div>
            <div className="w-8 h-5 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
              DI
            </div>
            <span className="text-xs text-gray-500">+4</span>
          </div>
        </div>
      </div>

      {/* PayPal Option */}
      <div
        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
          selectedMethod === "paypal"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={() => onMethodChange("paypal")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedMethod === "paypal"
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300"
              }`}
            >
              {selectedMethod === "paypal" && (
                <div className="w-full h-full rounded-full bg-white scale-50"></div>
              )}
            </div>
            <span className="font-medium text-gray-900">PayPal</span>
          </div>
          <div className="flex items-center">
            <img
              src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
              alt="PayPal"
              className="h-6"
              onError={(e) => {
                // Fallback to text if image fails
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (
                  e.currentTarget.nextElementSibling as HTMLElement
                ).style.display = "block";
              }}
            />
            <div
              className="text-blue-600 font-bold text-lg"
              style={{ display: "none" }}
            >
              PayPal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreditCardForm: React.FC<{
  onSubmit: (event: React.FormEvent) => void;
  isProcessing: boolean;
  clientSecret: string;
  amount: number;
}> = ({ onSubmit, isProcessing, clientSecret, amount }) => {
  const [billingDetails, setBillingDetails] = useState({
    name: "Casey Dunham",
  });

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card number
        </label>
        <div className="border border-gray-300 rounded-xl p-3 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name on card
        </label>
        <div className="relative">
          <input
            type="text"
            value={billingDetails.name}
            onChange={(e) =>
              setBillingDetails({ ...billingDetails, name: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !clientSecret}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-lg"
      >
        {isProcessing ? (
          <>
            <Loader className="animate-spin h-4 w-4 mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Pay ${amount.toFixed(2)} Securely
          </>
        )}
      </button>
    </form>
  );
};

const PayPalForm: React.FC<{
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  amount: number;
  quizAttemptId: number;
}> = ({
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  amount,
  quizAttemptId,
}) => {
  const { user } = useAuth();

  const createOrder = async () => {
    setIsProcessing(true);
    try {
      if (!quizAttemptId) {
        throw new Error(
          "Quiz attempt ID is required for report unlock payment",
        );
      }

      const requestBody = {
        userId: parseInt(user?.id || "0"),
        quizAttemptId: quizAttemptId,
      };

      // Use PayPal endpoint for report unlock payments
      const endpoint = "/api/create-paypal-payment";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create PayPal payment");
      }

      const { orderID } = data;
      return orderID;
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      onError(
        (error as Error).message || "Failed to initialize PayPal payment",
      );
      setIsProcessing(false);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      const response = await fetch("/api/capture-paypal-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orderID: data.orderID,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to capture PayPal payment");
      }
      if (result.success) {
        onSuccess();
      } else {
        throw new Error("Payment capture failed");
      }
    } catch (error) {
      console.error("Error capturing PayPal payment:", error);
      onError((error as Error).message || "PayPal payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const onCancel = () => {
    setIsProcessing(false);
    onError("PayPal payment was cancelled");
  };

  const onErrorHandler = (err: any) => {
    console.error("PayPal error:", err);
    setIsProcessing(false);
    onError("PayPal payment failed");
  };

  return (
    <div className="space-y-4">
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        onError={onErrorHandler}
        disabled={isProcessing}
        style={{
          layout: "vertical",
          color: "black",
          shape: "rect",
          label: "paypal",
        }}
        fundingSource={undefined}
      />
    </div>
  );
};

const PaymentForm: React.FC<EnhancedPaymentFormProps> = ({
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  amount = 9.99,
  isFirstReport = true,
  quizAttemptId,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<"card" | "paypal">(
    "card",
  );

  useEffect(() => {
    // Create payment intent when component mounts (for credit card payments)
    const createPaymentIntent = async () => {
      if (!user || selectedMethod !== "card") return;

      try {
        // Pay-per-report model: Users must have accounts before paying
        if (!user.id || user.isTemporary) {
          throw new Error("User must create an account before making payments");
        }

        // Get quiz attempt ID from prop or localStorage
        const currentQuizAttemptId =
          quizAttemptId ||
          (() => {
            const stored = localStorage.getItem("currentQuizAttemptId");
            return stored ? parseInt(stored) : null;
          })();

        if (!currentQuizAttemptId) {
          throw new Error(
            "Quiz attempt ID is required for report unlock payment",
          );
        }

        const requestBody = {
          userId: parseInt(user.id),
          quizAttemptId: currentQuizAttemptId,
        };

        // Use report unlock payment endpoint
        const endpoint = "/api/create-report-unlock-payment";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create payment intent");
        }

        const { clientSecret } = data;
        setClientSecret(clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        onError((error as Error).message || "Failed to initialize payment");
      }
    };

    createPaymentIntent();
  }, [user, onError, selectedMethod]);

  const handleCardSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const card = elements.getElement(CardElement);

    if (!card) {
      onError("Card element not found");
      setIsProcessing(false);
      return;
    }

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: card,
          billing_details: {
            name: user?.username || user?.email || "Customer",
            email: user?.email,
          },
        },
      },
    );

    if (error) {
      console.error("Payment failed:", error);
      onError(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent.status === "succeeded") {
      console.log("Payment succeeded:", paymentIntent);
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-blue-900">Total:</span>
          <span className="text-2xl font-bold text-blue-900">
            ${amount.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          {isFirstReport ? "First report unlock" : "Report unlock"} • Instant
          access
        </p>
      </div>

      <PaymentMethodSelector
        selectedMethod={selectedMethod}
        onMethodChange={setSelectedMethod}
      />

      {selectedMethod === "card" ? (
        <CreditCardForm
          onSubmit={handleCardSubmit}
          isProcessing={isProcessing}
          clientSecret={clientSecret}
          amount={amount}
        />
      ) : (
        <PayPalForm
          onSuccess={onSuccess}
          onError={onError}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          amount={amount}
          quizAttemptId={quizAttemptId!}
        />
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500">
           Secured by Stripe & PayPal • Your payment details are never stored
          on our servers
        </p>
      </div>
    </div>
  );
};

interface EnhancedPaymentWrapperProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  amount?: number;
  isFirstReport?: boolean;
}

export const EnhancedPaymentWrapper: React.FC<EnhancedPaymentWrapperProps> = (
  props,
) => {
  const paypalOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture",
    "enable-funding": "venmo,paylater",
    "disable-funding": "credit,card",
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <Elements stripe={stripePromise}>
        <PaymentForm {...props} />
      </Elements>
    </PayPalScriptProvider>
  );
};
