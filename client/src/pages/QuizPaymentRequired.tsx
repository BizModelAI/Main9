// DEPRECATED: This component called non-existent /api/create-quiz-payment route
// The payment system now uses ReportUnlockPaywall component with /api/create-report-unlock-payment
// This component is kept for reference but should not be used

import React from "react";
import { useNavigate } from "react-router-dom";

const QuizPaymentRequired: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Payment System Updated
        </h2>
        <p className="text-gray-600 mb-6">
          The payment system has been updated to use the new pay-per-report
          model. Please complete the quiz to access the report unlock payment
          flow.
        </p>
        <button
          onClick={() => navigate("/quiz")}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Take Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizPaymentRequired;
