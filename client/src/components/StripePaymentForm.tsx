import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Load Stripe outside of a component's render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_...",
);

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const PaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string>("");

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      if (!user) return;

      try {
        // Determine if this is a temporary user
        const isTemporaryUser =
          user.isTemporary || user.id.toString().startsWith("temp_");

        const requestBody: any = {};

        if (isTemporaryUser) {
          // Extract session ID from temporary user ID
          const sessionId = user.id.toString().replace("temp_", "");
          requestBody.sessionId = sessionId;
        } else {
          requestBody.userId = parseInt(user.id);
        }

        const response = await fetch("/api/create-access-pass-payment", {
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
  }, [user, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
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

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-blue-900">Total:</span>
          <span className="text-2xl font-bold text-blue-900">$9.99</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          One-time payment • Instant access
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-xl p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
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
            Pay $9.99 Securely
          </>
        )}
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Secured by Stripe • Your card details are never stored on our
          servers
        </p>
      </div>
    </form>
  );
};

interface StripePaymentWrapperProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const StripePaymentWrapper: React.FC<StripePaymentWrapperProps> = (
  props,
) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};
