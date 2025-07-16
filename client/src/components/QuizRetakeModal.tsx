// DEPRECATED: This component was part of the old retake bundle system
// The new pay-per-report model doesn't use retakes - users can take unlimited quizzes for free
// and pay per report unlock ($9.99 first, $4.99 subsequent)
// This component is kept for reference but should not be used

import React from "react";

interface QuizRetakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
  hasAccessPass: boolean;
  quizRetakesRemaining: number;
  onPaymentSuccess: () => void;
}

export const DeprecatedQuizRetakeModal: React.FC<QuizRetakeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Retake System Deprecated
        </h2>
        <p className="text-gray-600 mb-6">
          The quiz retake system has been replaced with a pay-per-report model.
          You can now take unlimited quizzes for free and pay only when you want
          to unlock reports.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Export with original name for compatibility
export const QuizRetakeModal = DeprecatedQuizRetakeModal;
