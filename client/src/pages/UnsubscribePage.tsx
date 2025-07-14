import { useState } from "react";
import BizModelAILogo from "../components/BizModelAILogo";
import { CheckCircle, Mail } from "lucide-react";

export default function UnsubscribePage() {
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check URL params for email (from unsubscribe links)
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  });

  const handleUnsubscribe = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setIsUnsubscribed(true);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to unsubscribe. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <BizModelAILogo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isUnsubscribed
              ? "Successfully Unsubscribed"
              : "Unsubscribe from Emails"}
          </h1>
          <p className="text-gray-600">
            {isUnsubscribed
              ? "You have been successfully unsubscribed from all BizModelAI emails."
              : "We're sorry to see you go. You can unsubscribe from all BizModelAI emails below."}
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!isUnsubscribed ? (
            <>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>This will stop all emails from BizModelAI</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  onClick={handleUnsubscribe}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Unsubscribing...
                    </>
                  ) : (
                    "Unsubscribe from All Emails"
                  )}
                </button>
                <button
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
                  onClick={() => (window.location.href = "/")}
                >
                  Return to BizModelAI
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center space-x-3 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-medium">All done!</span>
              </div>
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  You won't receive any more emails from us. If you change your
                  mind, you can always take our quiz again to re-subscribe.
                </p>
                <button
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
                  onClick={() => (window.location.href = "/")}
                >
                  Return to BizModelAI
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
