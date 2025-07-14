import React, { useState } from "react";
import { X, CreditCard, Gift, CheckCircle, Home, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuizRetakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  hasAccessPass: boolean;
  quizRetakesRemaining: number;
  onPaymentSuccess: () => void;
}

export const QuizRetakeModal: React.FC<QuizRetakeModalProps> = ({
  isOpen,
  onClose,
  userId,
  hasAccessPass,
  quizRetakesRemaining,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handlePurchaseAccessPass = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/create-access-pass-payment",
        {
          userId,
        },
      );

      if (response.success) {
        toast({
          title: "Access Pass Purchased!",
          description: "You now have 3 quiz retakes available.",
        });
        onPaymentSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to process your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseRetakeBundle = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/create-retake-bundle-payment",
        {
          userId,
        },
      );

      if (response.success) {
        toast({
          title: "Retake Bundle Purchased!",
          description: "You now have 3 additional quiz retakes available.",
        });
        onPaymentSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to process your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoHome = () => {
    // Navigate to home page
    window.location.href = "/";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Quiz Retake Options
            </h2>
            {/* Always show X button - users with access passes should be able to close and continue */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {!hasAccessPass ? (
              <div className="border border-blue-200 dark:border-blue-800 rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:bg-gradient-to-br dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Access Pass
                  </h3>
                </div>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  Get full access to retake the quiz with 5 attempts included.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    $9.99
                  </span>
                  <button
                    onClick={handlePurchaseAccessPass}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all duration-200 font-medium"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isProcessing ? "Processing..." : "Purchase"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-green-200 dark:border-green-800 rounded-2xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:bg-gradient-to-br dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Access Pass Active
                  </h3>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Unlimited Quiz Access
                  </h4>
                </div>
                <p className="text-green-800 dark:text-green-200 mb-4">
                  With your Access Pass, you have unlimited quiz access. You can
                  retake the quiz as many times as you'd like!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-medium"
                  >
                    <Play className="w-4 h-4" />
                    Continue with Quiz
                  </button>
                  <button
                    onClick={handlePurchaseRetakeBundle}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 font-medium"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isProcessing ? "Processing..." : "Buy More Retakes"}
                  </button>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600 dark:text-gray-400 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <p className="mb-3 font-medium">
                <strong>How it works:</strong>
              </p>
              <ul className="space-y-2">
                <li>• Your first quiz is always free</li>
                <li>• Access Pass gives you unlimited quiz access for $9.99</li>
                <li>• Additional retake bundles are available for $4.99</li>
                <li>• Your access never expires</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
