import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Target,
  Lightbulb,
  TrendingUp,
  Zap,
  Users,
  Award,
  Clock,
  DollarSign,
  Brain,
  Star,
  MessageCircle,
  BookOpen,
  Shield,
  Package,
  Monitor,
  Calendar,
  Heart,
  ArrowRight,
  BarChart3,
  Compass
} from 'lucide-react';
import { QuizData, AIAnalysis, BusinessPath } from '../types';
import { renderMarkdownContent } from '../utils/markdownUtils';
import { getSafeEmoji } from '../utils/contentUtils';

interface BusinessReportContentProps {
  quizData: QuizData;
  aiAnalysis: any; // Extended AIAnalysis with additional properties
  topBusinessPath: BusinessPath;
}

const BusinessReportContent: React.FC<BusinessReportContentProps> = ({
  quizData,
  aiAnalysis,
  topBusinessPath,
}) => {
  const {
    fullAnalysis,
    keyInsights,
    personalizedRecommendations,
    riskFactors,
    successPredictors,
    personalizedSummary,
    customRecommendations,
    potentialChallenges,
    successStrategies,
    personalizedActionPlan,
    motivationalMessage,
  } = aiAnalysis;

  const renderSection = (
    title: string, 
    content: string | string[], 
    icon: React.ElementType, 
    gradientFrom: string,
    gradientTo: string
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
    >
      <div className="flex items-center mb-6">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
          {React.createElement(icon, { className: "h-6 w-6 text-white" })}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      {Array.isArray(content) ? (
        <ul className="space-y-3 text-gray-700">
          {content.map((item, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed" dangerouslySetInnerHTML={renderMarkdownContent(item)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-700 leading-relaxed text-lg" dangerouslySetInnerHTML={renderMarkdownContent(content)} />
      )}
    </motion.div>
  );

  const renderActionPlanSection = (
    title: string, 
    tasks: string[], 
    icon: React.ElementType, 
    gradientFrom: string,
    gradientTo: string
  ) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-4">
        <div className={`w-10 h-10 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center mr-3 shadow-md`}>
          {React.createElement(icon, { className: "h-5 w-5 text-white" })}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <ul className="space-y-3 text-gray-700">
        {tasks.map((task, index) => (
          <li key={index} className="flex items-start">
            <ArrowRight className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0 mt-1" />
            <span className="leading-relaxed" dangerouslySetInnerHTML={renderMarkdownContent(task)} />
          </li>
        ))}
      </ul>
    </div>
  );

  const renderPersonalityTrait = (label: string, value: number, description: string) => (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{label}</span>
        <span className="text-2xl font-bold text-blue-600">{value}/5</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(value / 5) * 100}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 print:bg-white">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none rounded-xl">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-12 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-4">
                Your Personalized Business Blueprint
              </h1>
              <p className="text-2xl font-medium opacity-90 mb-4">
                A Custom Roadmap for Your Entrepreneurial Success
              </p>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                <Star className="h-5 w-5 mr-2" />
                <span className="font-semibold">Generated on {new Date().toLocaleDateString()}</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="p-12">
          {/* Top Business Match Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 mb-12 border-2 border-yellow-200"
          >
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold mr-3">
                    {topBusinessPath.fitScore}% PERFECT MATCH
                  </span>
                  <span className="text-orange-600 font-semibold">AI Recommended</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {(getSafeEmoji(topBusinessPath.id) || '💼') + ' ' + topBusinessPath.name}
                </h2>
                <p className="text-lg text-gray-700">
                  {topBusinessPath.description}
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Time to Profit</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{topBusinessPath.timeToProfit}</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Startup Cost</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{topBusinessPath.startupCost}</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Income Potential</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{topBusinessPath.potentialIncome}</div>
              </div>
            </div>
          </motion.div>

          {/* Personalized Summary */}
          {renderSection(
            "Your Entrepreneurial Profile",
            personalizedSummary || `Based on your comprehensive assessment, ${topBusinessPath.name} achieves a ${topBusinessPath.fitScore}% compatibility score with your unique profile. Your goals, personality traits, and available resources align perfectly with this business model's requirements and potential outcomes.`,
            Star,
            "from-yellow-500",
            "to-orange-500"
          )}

          {/* Personality Snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Personality Snapshot</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {renderPersonalityTrait(
                "Risk Tolerance", 
                quizData.riskComfortLevel || 3, 
                "Your comfort level with uncertainty and potential losses"
              )}
              {renderPersonalityTrait(
                "Self Motivation", 
                quizData.selfMotivationLevel || 3, 
                "Your ability to drive yourself forward without external pressure"
              )}
              {renderPersonalityTrait(
                "Tech Comfort", 
                quizData.techSkillsRating || 3, 
                "Your confidence with technology and digital tools"
              )}
              {renderPersonalityTrait(
                "Communication Style", 
                quizData.directCommunicationEnjoyment || 3, 
                "Your preference for direct interaction with others"
              )}
              {renderPersonalityTrait(
                "Creative Drive", 
                quizData.creativeWorkEnjoyment || 3, 
                "Your enjoyment of creative and innovative work"
              )}
              {renderPersonalityTrait(
                "Brand Comfort", 
                quizData.brandFaceComfort || 3, 
                "Your comfort being the public face of your business"
              )}
            </div>
          </motion.div>

          {/* AI Personalized Analysis */}
          {renderSection(
            "AI Personalized Analysis",
            fullAnalysis || `Your assessment reveals a remarkable alignment between your personal profile and ${topBusinessPath.name}. With a ${topBusinessPath.fitScore}% compatibility score, this represents more than just a good fit—it's potentially your ideal entrepreneurial path. Your unique combination of risk tolerance, time availability, and skill set creates natural advantages in this field. The way you approach decisions, handle challenges, and prefer to work all point toward success in this specific business model. Your timeline expectations are realistic given your commitment level, and your technical comfort provides the foundation needed for the tools and systems required. Most importantly, this path aligns with your core motivations and long-term vision, creating the sustainable motivation needed for entrepreneurial success.`,
            Brain,
            "from-blue-500",
            "to-indigo-600"
          )}

          {/* Key Insights */}
          {renderSection(
            "Key Insights About You",
            keyInsights || [
              `Your ${quizData.riskComfortLevel >= 4 ? "high" : "moderate"} risk tolerance aligns perfectly with ${topBusinessPath.name}`,
              `With ${quizData.weeklyTimeCommitment} hours/week, you can realistically achieve ${topBusinessPath.timeToProfit}`,
              `Your tech comfort level (${quizData.techSkillsRating}/5) is ${quizData.techSkillsRating >= 4 ? "excellent" : "adequate"} for this path`,
              `Communication style matches the ${quizData.directCommunicationEnjoyment >= 4 ? "high" : "moderate"} interaction requirements`
            ],
            Lightbulb,
            "from-orange-500",
            "to-red-500"
          )}

          {/* Personalized Recommendations */}
          {renderSection(
            "Personalized Recommendations",
            personalizedRecommendations || customRecommendations || [
              "Start with free tools and platforms to validate your concept before investing money",
              "Focus on building one core skill deeply rather than spreading yourself thin",
              "Set realistic 90-day milestones to maintain motivation and track progress",
              "Join online communities in your chosen field for support and networking",
              "Create a dedicated workspace to maintain focus and professionalism",
              "Track your time and energy to optimize your most productive hours"
            ],
            CheckCircle,
            "from-green-500",
            "to-emerald-600"
          )}

          {/* Success Strategies */}
          {renderSection(
            "Your Success Strategies",
            successPredictors || successStrategies || [
              "Leverage your analytical nature by tracking metrics and making data-driven decisions",
              "Use your natural communication skills to build strong customer relationships",
              "Focus on solving real problems for people rather than just making money",
              "Build systems and processes early to create scalable business operations",
              "Invest in continuous learning to stay ahead of market changes",
              "Network strategically with others in your industry for partnerships and opportunities"
            ],
            TrendingUp,
            "from-purple-500",
            "to-indigo-600"
          )}

          {/* Potential Challenges */}
          {renderSection(
            "Potential Challenges to Watch",
            riskFactors || potentialChallenges || [
              "Managing time effectively between learning and doing while building momentum",
              "Overcoming perfectionism that might delay launching and getting feedback",
              "Building confidence to position yourself as an expert in your chosen field",
              "Staying motivated during the initial period when results may be slow"
            ],
            Shield,
            "from-red-500",
            "to-pink-500"
          )}

          {/* Personalized Action Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Personalized Action Plan</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {personalizedActionPlan?.week1 && renderActionPlanSection(
                "Week 1: Foundation", 
                personalizedActionPlan.week1, 
                Calendar, 
                "from-blue-500",
                "to-blue-600"
              )}
              {personalizedActionPlan?.month1 && renderActionPlanSection(
                "Month 1: Launch & Learn", 
                personalizedActionPlan.month1, 
                Clock, 
                "from-green-500",
                "to-green-600"
              )}
              {personalizedActionPlan?.month3 && renderActionPlanSection(
                "Month 3: Optimize & Grow", 
                personalizedActionPlan.month3, 
                Zap, 
                "from-purple-500",
                "to-purple-600"
              )}
              {personalizedActionPlan?.month6 && renderActionPlanSection(
                "Month 6: Scale & Sustain", 
                personalizedActionPlan.month6, 
                Award, 
                "from-orange-500",
                "to-orange-600"
              )}
            </div>
          </motion.div>

          {/* Motivational Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">A Personal Message for You</h2>
              </div>
              <p className="text-xl leading-relaxed opacity-95">
                {motivationalMessage || "Your unique combination of skills and drive positions you perfectly for entrepreneurial success. Trust in your abilities and take that first step. The path ahead is clear, and you have everything you need to succeed."}
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200 rounded-t-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">BP</span>
              </div>
              <span className="font-semibold text-gray-700">Business Path</span>
            </div>
            <p>&copy; 2025 Business Path. All rights reserved.</p>
            <p className="mt-1">Your personalized business blueprint • Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessReportContent;