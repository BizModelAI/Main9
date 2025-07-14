import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, DollarSign, TrendingUp, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import '../styles/BusinessCard.css';

interface ResponsiveBusinessCardProps {
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
  onViewFullReport: (businessId: string) => void;
  isTopMatch?: boolean;
  className?: string;
}

const ResponsiveBusinessCard: React.FC<ResponsiveBusinessCardProps> = ({ 
  business, 
  onLearnMore, 
  onGetStarted, 
  onViewFullReport,
  isTopMatch = false,
  className = ''
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

  const remainingSkillsCount = Math.max(0, business.skills.length - 4);

  const handleSkillsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllSkills(!showAllSkills);
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      className={`business-card relative bg-white rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl border-2 group max-w-4xl mx-auto ${
        isTopMatch 
          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 transform hover:scale-[1.02]' 
          : 'border-gray-200 hover:border-blue-300 hover:scale-[1.02]'
      } ${className}`}
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
            <Star className="h-4 w-4 mr-2" />
            AI RECOMMENDED
          </div>
        </motion.div>
      )}
      
      {/* Card Content Container */}
      <div className="business-card-content p-6 md:p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center flex-1">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 ${
              isTopMatch ? 'bg-yellow-500' : 'bg-blue-600'
            }`}>
              <span className="text-white text-xl">📊</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 truncate">{business.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(business.difficulty)}`}>
                  {business.difficulty}
                </span>
                <span className="text-sm text-gray-500 font-medium">AI Match</span>
              </div>
            </div>
          </div>
          
          {/* Fit Score */}
          <div className="text-center sm:text-right flex-shrink-0">
            <div className={`text-4xl md:text-5xl font-bold ${
              isTopMatch ? 'text-yellow-600' : 'text-blue-600'
            }`}>
              {business.fitScore}%
            </div>
            <div className="text-sm text-gray-500 font-medium">Match</div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">{business.description}</p>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">Time to Profit</span>
            </div>
            <div className="font-bold text-gray-900 text-sm md:text-base">{business.timeToProfit}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <DollarSign className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">Startup Cost</span>
            </div>
            <div className="font-bold text-gray-900 text-sm md:text-base">{business.startupCost}</div>
          </div>
        </div>

        {/* Potential Income Highlight */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium text-green-800">Potential Income</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-green-700">{business.potentialIncome}</div>
        </div>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="expandable-content overflow-hidden"
            >
              {/* Benefits and Challenges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Top Benefits */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Top Benefits
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {business.pros.slice(0, 3).map((pro, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-500 mr-2 text-xs flex-shrink-0 mt-1">•</span>
                        <span className="leading-tight">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Potential Challenges */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                    Potential Challenges
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {business.cons.slice(0, 2).map((con, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-orange-500 mr-2 text-xs flex-shrink-0 mt-1">•</span>
                        <span className="leading-tight">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Required Skills Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Required Skills</h4>
                <div className="skills-container">
                  <div className="skills-grid flex flex-wrap gap-2">
                    {getSkillsToShow().map((skill, index) => (
                      <motion.span
                        key={`${skill}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="skill-bubble px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </motion.span>
                    ))}
                    
                    {/* Show More/Less Skills Button */}
                    {business.skills.length > 4 && (
                      <button
                        onClick={handleSkillsToggle}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={showAllSkills ? 'Show fewer skills' : `Show ${remainingSkillsCount} more skills`}
                      >
                        {showAllSkills ? 'Show less' : `+${remainingSkillsCount} more`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="business-card-actions mt-auto">
          <div className="button-container space-y-3">
            {/* Primary Action Buttons */}
            <button
              onClick={() => onViewFullReport(business.id)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform group-hover:scale-[1.02] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`View full report for ${business.name}`}
            >
              <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">View Full Report</span>
            </button>
            
            <button
              onClick={() => onGetStarted(business.id)}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 transform group-hover:scale-[1.02] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label={`Get started with ${business.name}`}
            >
              <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">I want to get started with {business.name}</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="secondary-actions mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={handleExpandToggle}
              className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Show less details' : 'Show more details'}
            >
              {isExpanded ? 'Show Less' : 'Show More Details'}
            </button>

            <button
              onClick={() => onLearnMore(business.id)}
              className="learn-more-link text-blue-600 hover:text-blue-700 font-medium text-sm transition-all duration-300 flex items-center group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={`Learn more about ${business.name} for you`}
            >
              <span className="truncate">Learn more about {business.name} for you</span>
              <ArrowRight className="arrow-icon h-4 w-4 ml-2 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResponsiveBusinessCard;