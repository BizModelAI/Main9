import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CreditCard, X, Trash2, DollarSign } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface SaveQuizResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayNow: () => void;
  onLoseResults: () => void;
}

export const SaveQuizResultsModal: React.FC<SaveQuizResultsModalProps> = ({
  isOpen,
  onClose,
  onPayNow,
  onLoseResults,
}) => {
  const [isConfirmingLoss, setIsConfirmingLoss] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleLoseResults = () => {
    if (!isConfirmingLoss) {
      setIsConfirmingLoss(true);
      return;
    }
    onLoseResults();
    setIsConfirmingLoss(false);
  };

  const handlePayNow = () => {
    onPayNow();
    setIsConfirmingLoss(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 p-8">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Save Your Quiz Results?
              </h2>
              <p className="text-gray-600 leading-relaxed">
                You're about to navigate away from your quiz results. Would you
                like to save them to your account?
              </p>
            </div>

            {/* Benefits box */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                What You Get for $4.99
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                {user ? (
                  // For logged users - they're paying to unlock this specific report
                  <>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Save this quiz attempt to your account
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Unlock full detailed report for this attempt
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Download PDF report and share results
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Access detailed insights and recommendations
                    </li>
                  </>
                ) : (
                  // For non-access pass users - they're paying for their first quiz access
                  <>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Complete detailed business analysis
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Personalized recommendations and insights
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Download PDF report and share results
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      Access to business guides and resources
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              <button
                onClick={handlePayNow}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Pay Now - $4.99
              </button>

              <button
                onClick={handleLoseResults}
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  isConfirmingLoss
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isConfirmingLoss ? (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Confirm - Lose Results
                  </span>
                ) : (
                  "Lose Results (Use Previous Quiz)"
                )}
              </button>

              {isConfirmingLoss && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <p className="text-red-800 text-sm text-center">
                    <strong>Warning:</strong> Your current quiz results will be
                    lost permanently.
                    {user
                      ? " You'll see your most recent quiz attempt from your dashboard."
                      : " You'll see basic results only."}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Footer note */}
            <p className="text-xs text-gray-500 text-center mt-6">
              One-time payment • Secure checkout • No subscription
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
