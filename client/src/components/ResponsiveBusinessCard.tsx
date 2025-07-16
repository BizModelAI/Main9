import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, DollarSign, TrendingUp } from "lucide-react";
import { useEmojiSafeguard } from "../hooks/useEmojiSafeguard";

interface ResponsiveBusinessCardProps {
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
  isTopMatch?: boolean;
}

const ResponsiveBusinessCard: React.FC<ResponsiveBusinessCardProps> = ({
  business,
  onLearnMore,
  onGetStarted,
  isTopMatch = false,
}) => {
  const { validateAndFixEmoji } = useEmojiSafeguard();
  
  // Safeguard the emoji
  const safeEmoji = validateAndFixEmoji(business.emoji || '', business.id);

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${
        isTopMatch ? "ring-2 ring-yellow-400" : ""
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center mb-3">
          <span className="text-2xl mr-3">{safeEmoji}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {business.name}
            </h3>
            {business.fitScore !== undefined && (
              <div className="text-sm text-blue-600 font-medium">
                {Math.round(business.fitScore)}% Match
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {business.description}
        </p>

        {/* Key Metrics */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Time:</span>
            <span className="font-medium">{business.timeToProfit}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Cost:</span>
            <span className="font-medium">{business.startupCost}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Income:</span>
            <span className="font-medium text-green-600">
              {business.potentialIncome}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onLearnMore(business.id)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center text-xs"
          >
            Learn
            <ArrowRight className="h-3 w-3 ml-1" />
          </button>
          <button
            onClick={() => onGetStarted(business.id)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center text-xs"
          >
            Start
            <ArrowRight className="h-3 w-3 ml-1" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResponsiveBusinessCard;