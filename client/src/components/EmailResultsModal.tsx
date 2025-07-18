import React, { useState } from "react";
import { X, Mail, CheckCircle, Loader2 } from "lucide-react";
import { QuizData } from "../types";
import { useReportUnlock } from "../hooks/useReportUnlock";

interface EmailResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizData: QuizData;
  quizAttemptId?: number | null;
  userEmail?: string | null;
}

const EmailResultsModal: React.FC<EmailResultsModalProps> = ({
  isOpen,
  onClose,
  quizData,
  quizAttemptId,
  userEmail,
}) => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [inputEmail, setInputEmail] = useState<string>("");
  const [emailUsed, setEmailUsed] = useState<string>(userEmail || "");
  const [emailError, setEmailError] = useState<string>("");
  const [existingAccount, setExistingAccount] = useState<any>(null);
  const { isUnlocked } = useReportUnlock(quizAttemptId);

  if (!isOpen) return null;

  const hasEmail = !!(userEmail || emailUsed);

  const validateEmail = (email: string) => {
    // RFC 5322 Official Standard (simplified for practical use)
    // Must have at least one dot after @, and TLD must be at least 2 chars
    return (
      email.length > 5 &&
      /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email.trim())
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputEmail(e.target.value);
    // Clear error when user starts typing
    if (emailError) setEmailError("");
    // Clear existing account info when email changes
    if (existingAccount) setExistingAccount(null);
  };

  const checkExistingAccount = async (email: string) => {
    try {
      const response = await fetch(`/api/check-existing-attempts/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error checking existing account:", error);
    }
    return null;
  };

  const handleSendEmail = async () => {
    setStatus("loading");
    setMessage("");
    let emailToUse = emailUsed || inputEmail;
    
    if (!hasEmail && !validateEmail(inputEmail)) {
      setStatus("idle");
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      // Check for existing account first
      const existingAccountData = await checkExistingAccount(emailToUse);
      setExistingAccount(existingAccountData);

      if (existingAccountData?.hasAccount) {
        if (existingAccountData.userType === "paid") {
          setStatus("error");
          setMessage("You already have a paid account with this email. Please log in to access your results.");
          return;
        } else if (existingAccountData.userType === "temporary") {
          // Show warning but allow sending
          setMessage("You have existing quiz results with this email. Your new results will update your previous ones.");
        }
      }

      // If user is not logged in and hasn't provided an email, save quiz data and email for 3 months
      if (!hasEmail && inputEmail) {
        const saveRes = await fetch("/api/save-quiz-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizData, email: inputEmail }),
        });
        
        if (!saveRes.ok) {
          const errorData = await saveRes.json();
          if (errorData.userType === "existing-paid") {
            setStatus("error");
            setMessage("You already have a paid account with this email. Please log in to access your results.");
            return;
          }
          setStatus("error");
          setMessage("Failed to save your email. Please try again.");
          return;
        }
        
        const saveData = await saveRes.json();
        setEmailUsed(inputEmail);
        emailToUse = inputEmail;
        
        // Update quizAttemptId if provided by the save operation
        if (saveData.attemptId) {
          localStorage.setItem("quizAttemptId", saveData.attemptId.toString());
        }
      }

      // Always send the email (do not check unsubscribe)
      const endpoint = isUnlocked ? "/api/send-full-report" : "/api/send-quiz-results";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for email sending
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailToUse, 
          quizData,
          attemptId: quizAttemptId 
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        setStatus("success");
        setMessage(isUnlocked ? "Full report sent to your email!" : "Preview sent to your email!");
      } else {
        setStatus("error");
        setMessage("Failed to send email. Please try again later.");
      }
    } catch (error) {
      setStatus("error");
      if (error instanceof Error && error.name === 'AbortError') {
        setMessage("Email sending timed out. Please try again.");
      } else {
        setMessage("Failed to send email. Please try again later.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <Mail className="w-10 h-10 text-blue-600 mb-4" />
          <h2 className="text-xl font-bold mb-2">Email My Results</h2>
          <p className="text-gray-600 mb-4 text-center">
            {isUnlocked
              ? "You have unlocked this report. You will receive the full report by email."
              : "You will receive a preview of your results by email. Unlock the full report for the complete email."}
          </p>
          
          {existingAccount && existingAccount.userType === "temporary" && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm">
                📧 You have {existingAccount.attemptsCount} previous quiz attempt{existingAccount.attemptsCount !== 1 ? 's' : ''} with this email. 
                Your new attempt will be added to your history.
              </p>
            </div>
          )}

          {!hasEmail && status === "idle" && (
            <>
              <input
                type="email"
                value={inputEmail}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none mb-2"
                required
              />
              {emailError && <div className="text-red-600 text-sm mb-2">{emailError}</div>}
            </>
          )}
          {hasEmail && status === "idle" && (
            <div className="w-full flex flex-col items-center mb-2">
              <div className="text-gray-700 text-base mb-2">Your email: <span className="font-semibold">{userEmail || emailUsed}</span></div>
            </div>
          )}
          
          {status === "loading" && (
            <div className="w-full flex flex-col items-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600 text-sm">Sending email...</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="w-full flex flex-col items-center mb-4">
              <div className="text-green-600 text-2xl mb-2">✓</div>
              <p className="text-green-700 text-sm text-center">{message}</p>
            </div>
          )}
          
          {status === "error" && (
            <div className="w-full flex flex-col items-center mb-4">
              <div className="text-red-600 text-2xl mb-2">✗</div>
              <p className="text-red-700 text-sm text-center">{message}</p>
            </div>
          )}

          <div className="w-full flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {status === "idle" && (
              <button
                onClick={handleSendEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Email
              </button>
            )}
            {status === "success" && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailResultsModal;
