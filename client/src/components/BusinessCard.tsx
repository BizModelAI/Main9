import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useEmojiSafeguard } from "../hooks/useEmojiSafeguard";

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    description: string;
    timeToProfit: string;
    startupCost: string;
    potentialIncome: string;
    fitScore?: number;
    emoji?: string;
  };
  onLearnMore: (businessId: string) => void;
  onGetStarted: (businessId: string) => void;
  onViewFullReport?: (businessId: string) => void;
  isTopMatch?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  onLearnMore,
  onGetStarted,
  onViewFullReport,
  isTopMatch = false,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { validateAndFixEmoji } = useEmojiSafeguard();
  
  // Safeguard the emoji
  const safeEmoji = validateAndFixEmoji(business.emoji || '', business.id);

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col ${
        isExpanded ? "md:col-span-2 lg:col-span-3" : ""
      }`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isExpanded ? 1.02 : 1,
      }}
      transition={{
        duration: 0.5,
        layout: { duration: 0.4, ease: "easeInOut" },
      }}
      whileHover={{ y: -5 }}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 relative">
          <div className="flex items-center flex-1 mr-2">
            <span className="text-3xl mr-3">{safeEmoji}</span>
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
              {business.name}
            </h3>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {/* Show fit percentage if available */}
            {business.fitScore !== undefined && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(business.fitScore)}%
                </div>
                <div className="text-xs text-gray-500">Match</div>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-3">{business.description}</p>

        {/* Key Metrics */}
        <div className="space-y-2 mb-4 flex-shrink-0">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time to Start:</span>
            <span className="font-medium">{business.timeToProfit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Initial Investment:</span>
            <span className="font-medium">{business.startupCost}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Potential Income:</span>
            <span className="font-medium text-green-600">
              {business.potentialIncome}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-3">
          {onViewFullReport && (
            <button
              onClick={() => onViewFullReport(business.id)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Full Report
            </button>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={() => onLearnMore(business.id)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center text-sm"
            >
              Learn More
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
            <button
              onClick={() => onGetStarted(business.id)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center text-sm"
            >
              Get Started
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BusinessCard;