import React, { useState, useEffect } from "react";
import { X, Mail, CheckCircle, Loader2, Clock } from "lucide-react";
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
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "rate-limited">("idle");
  const [message, setMessage] = useState<string>("");
  const [inputEmail, setInputEmail] = useState<string>("");
  const [emailUsed, setEmailUsed] = useState<string>(userEmail || "");
  const [emailError, setEmailError] = useState<string>("");
  const [existingAccount, setExistingAccount] = useState<any>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remainingTime: number; type: 'cooldown' | 'extended' } | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const { isUnlocked } = useReportUnlock(typeof quizAttemptId === 'number' && !isNaN(quizAttemptId) ? quizAttemptId : null);

  // Handle countdown timer for rate limits
  useEffect(() => {
    if (rateLimitInfo && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setStatus("idle");
            setRateLimitInfo(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [rateLimitInfo, countdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setMessage("");
      setRateLimitInfo(null);
      setCountdown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
  const hasEmail = !!(userEmail || emailUsed || storedEmail);

  const validateEmail = (email: string) => {
    // More robust email validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail || trimmedEmail.length < 5) return false;
    
    // RFC 5322 compliant email regex (simplified but robust)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(trimmedEmail);
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
      // Validate email before making the request
      if (!validateEmail(email)) {
        console.error("Invalid email format:", email);
        return null;
      }
      
      // Properly encode the email for URL
      const encodedEmail = encodeURIComponent(email.trim());
      const response = await fetch(`/api/check-existing-attempts/${encodedEmail}`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error("Failed to check existing account:", response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Error checking existing account:", error);
      return null;
    }
  };

  const handleSendEmail = async () => {
    setStatus("loading");
    setMessage("");
    setRateLimitInfo(null);
    setCountdown(0);
    
    // Determine which email to use
    let emailToUse = userEmail || emailUsed || storedEmail || inputEmail;
    
    // Validate email if user needs to input one
    if (!hasEmail && !validateEmail(inputEmail)) {
      setStatus("idle");
      setEmailError("Please enter a valid email address.");
      return;
    }
    
    // Ensure we have a valid email
    if (!emailToUse || !validateEmail(emailToUse)) {
      setStatus("error");
      setMessage("Please provide a valid email address.");
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
          email: emailToUse.trim(), 
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
        const errorData = await res.json().catch(() => ({}));
        
        if (res.status === 429 && errorData.rateLimitInfo) {
          // Handle rate limit error
          setStatus("rate-limited");
          setRateLimitInfo(errorData.rateLimitInfo);
          setCountdown(errorData.rateLimitInfo.remainingTime);
          setMessage(`You can resend email in ${errorData.rateLimitInfo.remainingTime} seconds`);
        } else {
          setStatus("error");
          setMessage(errorData.error || "Failed to send email. Please try again later.");
        }
      }
    } catch (error) {
      setStatus("error");
      if (error instanceof Error && error.name === 'AbortError') {
        setMessage("Email sending timed out. Please try again.");
      } else {
        console.error("Email sending error:", error);
        setMessage("Failed to send email. Please try again later.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden max-h-[90vh] overflow-y-auto my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="relative flex flex-col items-center p-8">
          <Mail className="w-12 h-12 text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Email My Results</h2>
          <p className="text-gray-600 mb-4 text-center">
            {isUnlocked
              ? "You have unlocked this report. You will receive the full report by email."
              : "You will receive a preview of your results by email. Unlock the full report for the complete email."}
          </p>

          {status === "success" && (
            <div className="w-full bg-green-50 border border-green-200 rounded-3xl p-4 mb-4 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                {message}
              </span>
            </div>
          )}

          {existingAccount && existingAccount.userType === "temporary" && existingAccount.attemptsCount > 1 && (
            <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-4 text-center">
              <p className="text-blue-800 text-sm">
                You have {existingAccount.attemptsCount} previous quiz attempt{existingAccount.attemptsCount !== 1 ? 's' : ''} with this email. 
                Your new attempt will be added to your history.
              </p>
            </div>
          )}

          {/* If user is logged in or has already provided email, show only their email and send button */}
          {hasEmail && status === "idle" && (
            <div className="w-full flex flex-col items-center mb-4">
              <div className="text-gray-700 text-base mt-0 mb-6">Your email: <span className="font-semibold">{userEmail || emailUsed || storedEmail}</span></div>
              <button
                onClick={handleSendEmail}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5 mr-1" />
                Send Results
              </button>
            </div>
          )}

          {/* If user has not provided email, show input and send button only */}
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
              <div className="w-full flex mt-2">
                <button
                  onClick={handleSendEmail}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5 mr-1" />
                  Send Results
                </button>
              </div>
            </>
          )}

          {status === "loading" && (
            <div className="w-full flex flex-col items-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600 text-sm">Sending email...</p>
            </div>
          )}

          {status === "error" && (
            <div className="w-full flex flex-col items-center mb-4">
              <div className="text-red-600 text-2xl mb-2">✗</div>
              <p className="text-red-700 text-sm text-center">{message}</p>
            </div>
          )}

          {status === "rate-limited" && (
            <div className="w-full flex flex-col items-center mb-4">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-700 font-medium">Rate Limited</span>
              </div>
              <p className="text-gray-600 text-sm text-center mb-3">
                {rateLimitInfo?.type === 'cooldown' 
                  ? "Please wait before sending another email" 
                  : "Extended cooldown period - please wait longer"}
              </p>
              <button
                onClick={handleSendEmail}
                disabled={countdown > 0}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  countdown > 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] shadow-lg"
                }`}
              >
                <Mail className="w-5 h-5 mr-1" />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Email"}
              </button>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default EmailResultsModal;
