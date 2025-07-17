import React from "react";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DataExpiredMessage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartNewQuiz = () => {
    navigate("/quiz");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Data Has Expired
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your quiz results and data have been automatically deleted after 3 months as part of our data retention policy.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-amber-800 mb-2">
                  Data Retention Policy
                </h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  For users who don't create a paid account, quiz data is stored for 3 months and then automatically deleted. 
                  Paid users have their data stored permanently.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleStartNewQuiz}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center group"
            >
              <span>Take the Quiz Again</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-sm text-gray-500">
              Get fresh insights and recommendations based on your current situation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExpiredMessage; 