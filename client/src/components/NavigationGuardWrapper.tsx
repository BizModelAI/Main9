import React from "react";
import { SaveQuizResultsModal } from "./SaveQuizResultsModal";
import { useNavigationGuard } from "../hooks/useNavigationGuard";

interface NavigationGuardWrapperProps {
  children: React.ReactNode;
}

export const NavigationGuardWrapper: React.FC<NavigationGuardWrapperProps> = ({
  children,
}) => {
  // Navigation guard for unsaved quiz results
  const {
    showSaveModal,
    hasPendingQuizResults,
    navigateWithGuard,
    handleSaveResults: guardHandleSaveResults,
    handleLoseResults,
    handleCloseModal,
  } = useNavigationGuard();

  // Custom save results handler that triggers payment
  const handleSaveResults = () => {
    guardHandleSaveResults();
    // Navigate to save results payment page
    window.location.href = "/save-results-payment";
  };

  return (
    <>
      {children}

      {/* Save Quiz Results Modal */}
      <SaveQuizResultsModal
        isOpen={showSaveModal}
        onClose={handleCloseModal}
        onPayNow={handleSaveResults}
        onLoseResults={handleLoseResults}
      />
    </>
  );
};
