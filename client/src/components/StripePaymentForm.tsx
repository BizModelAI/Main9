// DEPRECATED: This component called non-existent /api/create-access-pass-payment route
// The payment system now uses EnhancedPaymentForm with ReportUnlockPaywall
// This component is kept for reference but should not be used

import React from "react";

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

const DeprecatedStripePaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onError,
}) => {
  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded-md">
      <p className="text-red-800 text-sm">
        This payment form is deprecated. Please use the new report unlock
        payment system.
      </p>
      <button
        onClick={() => onError("This payment method is no longer available")}
        className="mt-2 text-red-600 underline text-sm"
      >
        Report Error
      </button>
    </div>
  );
};

export default DeprecatedStripePaymentForm;
