import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, DollarSign, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    description: string;
    fitScore: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    timeToProfit: string;
    startupCost: string;
    potentialIncome: string;
    pros: string[];
    cons: string[];
    skills: string[];
    icon: string;
  };
  onLearnMore: (businessId: string) => void;
  onGetStarted: (businessId: string) => void;
  isTopMatch?: boolean;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ 
  business, 
  onLearnMore, 
  onGetStarted, 
  isTopMatch = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSkillsToShow = () => {
    const maxSkillsToShow = 4;
    if (showAllSkills || business.skills.length <= maxSkillsToShow) {
      return business.skills;
    }
    return business.skills.slice(0, maxSkillsToShow);
  };

  const remainingSkillsCount = business.skills.length - 4;

  return (
    <motion.div
      className={`relative bg-white rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl border-2 group max-w-4xl mx-auto ${
        isTopMatch 
          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 transform hover:scale-[1.02]' 
          : 'border-gray-200 hover:border-blue-300 hover:scale-[1.02]'
      }`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top Badge for Best Match */}
      {isTopMatch && (
        <motion.div 
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            AI RECOMMENDED
          </div>
        </motion.div>
      )}
      
      {/* Card Content Container with Flexbox Layout */}
      <div className="h-full p-8 flex flex-col">
        {/* Header Section */}
        <div className="flex items-center mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${
            isTopMatch ? 'bg-yellow-500' : 'bg-blue-600'
          }`}>
            <span className="text-white text-xl">�</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{business.name}</h3>
              <div className={`text-5xl font-bold ${
                isTopMatch ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {business.fitScore}%
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(business.difficulty)}`}>
                {business.difficulty}
              </span>
              <span className="text-sm text-gray-500 font-medium">AI Match</span>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed flex-shrink-0">{business.description}</p>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Time to Profit</span>
            </div>
            <div className="font-bold text-gray-900">{business.timeToProfit}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Startup Cost</span>
            </div>
            <div className="font-bold text-gray-900">{business.startupCost}</div>
          </div>
        </div>

        {/* Potential Income Highlight */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 flex-shrink-0">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Potential Income</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{business.potentialIncome}</div>
        </div>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden flex-grow"
            >
              {/* Top Benefits */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Top Benefits
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  {business.pros.slice(0, 3).map((pro, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2 text-xs">•</span>
                      <span className="leading-tight">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potential Challenges */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                  Potential Challenges
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  {business.cons.slice(0, 2).map((con, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-orange-500 mr-2 text-xs">•</span>
                      <span className="leading-tight">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Skills Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {getSkillsToShow().map((skill, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </motion.span>
                  ))}
                  
                  {/* Show More Skills Button */}
                  {!showAllSkills && remainingSkillsCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllSkills(true);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      +{remainingSkillsCount} more
                    </button>
                  )}
                  
                  {/* Show Less Skills Button */}
                  {showAllSkills && business.skills.length > 4 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllSkills(false);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer to push buttons to bottom */}
        {!isExpanded && <div className="flex-grow"></div>}

        {/* Action Buttons - Fixed at Bottom */}
        <div className="mt-auto pt-6 space-y-3 flex-shrink-0" style={{ position: 'sticky', bottom: 0 }}>
          {/* Primary Action Buttons */}
          <div className="space-y-3">
            {/* View Full Report Button */}
            <button
              onClick={() => {/* Handle view full report */}}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform group-hover:scale-[1.02] flex items-center justify-center"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Full Report
            </button>
            
            {/* Get Started Button */}
            <button
              onClick={() => onGetStarted(business.id)}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 transform group-hover:scale-[1.02] flex items-center justify-center"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              I want to get started with {business.name}
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* Show More/Less Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
            >
              {isExpanded ? 'Show Less' : 'Show More Details'}
            </button>

            {/* Learn More Link */}
            <button
              onClick={() => onLearnMore(business.id)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-all duration-300 flex items-center group"
            >
              Learn more about {business.name} for you
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BusinessCard;