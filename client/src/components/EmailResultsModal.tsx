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
      // If user is not logged in and hasn't provided an email, save quiz data and email for 3 months
      if (!hasEmail && inputEmail) {
        const saveRes = await fetch("/api/save-quiz-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizData, email: inputEmail }),
        });
        if (!saveRes.ok) {
          setStatus("error");
          setMessage("Failed to save your email. Please try again.");
          return;
        }
        setEmailUsed(inputEmail);
        emailToUse = inputEmail;
      }
      // Always send the email (do not check unsubscribe)
      const endpoint = isUnlocked ? "/api/send-full-report" : "/api/send-quiz-results";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
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
    } catch (e) {
      setStatus("error");
      if (e instanceof Error && e.name === 'AbortError') {
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
          {status === "idle" && (
            <button
              onClick={handleSendEmail}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium mt-2 hover:from-blue-700 hover:to-purple-700 transition-all"
              disabled={(!hasEmail && (!inputEmail || !!emailError))}
            >
              Send Email
            </button>
          )}
          {status === "loading" && (
            <div className="flex items-center mt-4">
              <Loader2 className="animate-spin w-5 h-5 mr-2 text-blue-600" />
              <span>Sending...</span>
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center justify-center w-full mb-4">
              <div className="flex items-center px-4 py-3 rounded-full bg-green-100/80 border border-green-300 shadow-sm text-green-700 text-base font-medium mx-auto" style={{minWidth: '0'}}>
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                <span>{message}</span>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center mt-4 text-red-600">
              <X className="w-5 h-5 mr-2" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailResultsModal;
