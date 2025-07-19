import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  fitCategory?: string;
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  onLearnMore,
  onGetStarted,
  onViewFullReport,
  isTopMatch = false,
  isExpanded = false,
  onToggleExpand,
  fitCategory,
}) => {
  const navigate = useNavigate();
  const { validateAndFixEmoji, getSafeEmojiForBusiness } = useEmojiSafeguard();
  
  // Use getSafeEmojiForBusiness directly for the emoji
  const safeEmoji = getSafeEmojiForBusiness(business.id);

  const handleLearnMore = () => {
    navigate(`/business-model/${business.id}`);
  };

  return (
    <motion.div
      className="w-full h-full bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-0 overflow-hidden border border-gray-100 relative flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      {/* Fit Category Badge - Always Visible */}
      {fitCategory && (
        <div className="absolute top-4 right-4 z-20">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            fitCategory === 'Best Fit' ? 'bg-green-100 text-green-800' :
            fitCategory === 'Strong Fit' ? 'bg-blue-100 text-blue-800' :
            fitCategory === 'Possible Fit' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {fitCategory}
          </span>
        </div>
      )}

      {/* Header with Emoji and Title */}
      <div className="p-6 pb-4 pt-12 flex-1 flex flex-col">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3 emoji">{safeEmoji}</span>
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
            {business.name}
          </h3>
        </div>
        <p className="text-gray-600 text-sm text-center leading-relaxed line-clamp-2" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.25rem'
        }}>
          {business.description.length > 80 ? business.description.substring(0, 80) + '...' : business.description}
        </p>
      </div>

      {/* Business Details */}
      <div className="px-6 pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm" style={{ fontWeight: 'bold' }}>Time to Profit:</span>
            <span style={{ fontWeight: 'normal' }}>{business.timeToProfit}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm" style={{ fontWeight: 'bold' }}>Startup Cost:</span>
            <span style={{ fontWeight: 'normal' }}>{business.startupCost}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 text-sm" style={{ fontWeight: 'bold' }}>Income Potential:</span>
            <span style={{ fontWeight: 'normal' }}>{business.potentialIncome}</span>
          </div>
          {(business.fitScore !== undefined && business.fitScore !== null) && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm" style={{ fontWeight: 'bold' }}>Your Fit Score:</span>
              <span style={{ fontWeight: 'normal' }}>{business.fitScore}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 pt-4 pb-8 space-y-3 mt-auto">
        {onViewFullReport ? (
          <button
            onClick={() => onViewFullReport(business.id)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            View Full Report
          </button>
        ) : (
          <>
            <button
              onClick={() => onGetStarted(business.id)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Select This Model
            </button>
            <button
              onClick={handleLearnMore}
              className="w-full border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 text-sm"
            >
              Learn More
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default BusinessCard;