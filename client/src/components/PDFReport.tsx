import React from "react";
import { QuizData } from "../types";
import { businessModelService } from "../utils/businessModelService";
import { businessPaths } from "../data/businessPaths";
import {
  TrendingUp,
  Target,
  Brain,
  Award,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  Zap,
  Calendar,
  BarChart3,
  Lightbulb,
  Clock,
  DollarSign,
  Shield,
} from "lucide-react";

interface PDFReportProps {
  quizData: QuizData;
  userEmail?: string | null;
}

// PDF-optimized version of the Full Report
export const PDFReport: React.FC<PDFReportProps> = ({
  quizData,
  userEmail,
}) => {
  const matches = businessModelService.getBusinessModelMatches(quizData);
  const topThreePaths = matches.slice(0, 3).map((match) => {
    const businessPath = businessPaths.find((path) => path.id === match.id);
    return { ...businessPath!, fitScore: match.score };
  });
  const userName = userEmail?.split("@")[0] || "User";

  // Calculate trait scores (same as FullReport)
  const traitScores = {
    socialComfort: calculateSocialComfort(quizData),
    consistency: calculateConsistency(quizData),
    riskTolerance: calculateRiskTolerance(quizData),
    techComfort: calculateTechComfort(quizData),
    motivation: calculateMotivation(quizData),
    feedbackResilience: calculateFeedbackResilience(quizData),
    structurePreference: calculateStructurePreference(quizData),
    creativity: calculateCreativity(quizData),
    communicationConfidence: calculateCommunicationConfidence(quizData),
  };

  const traits = [
    {
      label: "Social Comfort",
      value: traitScores.socialComfort,
      leftLabel: "Prefers Solo Work",
      rightLabel: "Thrives in Groups",
    },
    {
      label: "Consistency",
      value: traitScores.consistency,
      leftLabel: "Flexible Schedule",
      rightLabel: "Routine Focused",
    },
    {
      label: "Risk Tolerance",
      value: traitScores.riskTolerance,
      leftLabel: "Risk Averse",
      rightLabel: "Risk Embracer",
    },
    {
      label: "Tech Comfort",
      value: traitScores.techComfort,
      leftLabel: "Basic Tech Use",
      rightLabel: "Tech Enthusiast",
    },
    {
      label: "Motivation",
      value: traitScores.motivation,
      leftLabel: "External Motivation",
      rightLabel: "Self-Driven",
    },
    {
      label: "Feedback Resilience",
      value: traitScores.feedbackResilience,
      leftLabel: "Sensitive to Criticism",
      rightLabel: "Thrives on Feedback",
    },
    {
      label: "Structure Preference",
      value: traitScores.structurePreference,
      leftLabel: "Flexible Approach",
      rightLabel: "Structured Systems",
    },
    {
      label: "Creativity",
      value: traitScores.creativity,
      leftLabel: "Analytical Focus",
      rightLabel: "Creative Expression",
    },
    {
      label: "Communication Confidence",
      value: traitScores.communicationConfidence,
      leftLabel: "Behind-the-Scenes",
      rightLabel: "Front-and-Center",
    },
  ];

  return (
    <div className="pdf-report bg-white text-gray-900 min-h-screen">
      <style>{`
        @media print {
          .pdf-report {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
          
          .gradient-bg {
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%) !important;
          }
          
          .trait-bar {
            background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%) !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="gradient-bg text-white p-8 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">
              Business Path Analysis Report
            </h1>
            <p className="text-xl opacity-90">
              Personalized Recommendations for {userName}
            </p>
            <p className="text-sm opacity-75 mt-2">
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 mr-2" />
                <span className="font-semibold">Income Goal</span>
              </div>
              <p className="text-2xl font-bold">
                ${quizData.successIncomeGoal?.toLocaleString()}/month
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 mr-2" />
                <span className="font-semibold">Timeline</span>
              </div>
              <p className="text-2xl font-bold">
                {quizData.firstIncomeTimeline?.replace("-", " ")}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-6 w-6 mr-2" />
                <span className="font-semibold">Investment</span>
              </div>
              <p className="text-2xl font-bold">
                ${quizData.upfrontInvestment?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-8">
        {/* Personality Analysis */}
        <section className="mb-12 avoid-break">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-blue-600" />
            Your Entrepreneurial Personality
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {traits.map((trait, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">
                    {trait.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="trait-bar h-2 rounded-full transition-all duration-500"
                    style={{ width: `${trait.value * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{trait.leftLabel}</span>
                  <span>{trait.rightLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Recommendations */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Star className="h-6 w-6 mr-2 text-yellow-500" />
            Your Top Business Recommendations
          </h2>

          <div className="space-y-6">
            {topThreePaths.map((path, index) => (
              <div key={path.id} className="avoid-break">
                <div className="border-2 border-gray-200 rounded-2xl p-6 bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mr-4">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {path.name}
                        </h3>
                        <p className="text-gray-600">{path.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <span className="font-bold">{path.fitScore}% MATCH</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm font-medium">
                          Time to Profit
                        </span>
                      </div>
                      <p className="font-semibold">{path.timeToProfit}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm font-medium">
                          Startup Cost
                        </span>
                      </div>
                      <p className="font-semibold">{path.startupCost}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <TrendingUp className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm font-medium">
                          Income Potential
                        </span>
                      </div>
                      <p className="font-semibold">{path.potentialIncome}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Advantages
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {path.pros.slice(0, 3).map((pro, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-700 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Considerations
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {path.cons.slice(0, 3).map((con, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Plan */}
        <section className="mb-12 page-break">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-purple-600" />
            Your 90-Day Action Plan
          </h2>

          <div className="space-y-6">
            <div className="avoid-break">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">
                Week 1: Foundation
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Set up your workspace and essential tools
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Research your target market and competition
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Create your business plan outline
                </li>
              </ul>
            </div>

            <div className="avoid-break">
              <h3 className="text-lg font-semibold mb-3 text-green-600">
                Month 1: Launch Preparation
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Build your minimum viable product/service
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Establish your online presence
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Test with initial customers
                </li>
              </ul>
            </div>

            <div className="avoid-break">
              <h3 className="text-lg font-semibold mb-3 text-purple-600">
                Month 2-3: Growth & Optimization
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Scale your marketing efforts
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Optimize based on customer feedback
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Establish consistent revenue streams
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-8 avoid-break">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Award className="h-6 w-6 mr-2 text-gold-500" />
            Key Takeaways
          </h2>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
            <div className="space-y-4">
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Your Strongest Fit
                  </h3>
                  <p className="text-gray-700">
                    {topThreePaths[0]?.name} with {topThreePaths[0]?.fitScore}%
                    match based on your preferences and goals.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Target className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Focus Areas</h3>
                  <p className="text-gray-700">
                    Prioritize building consistent habits and leveraging your
                    strengths in {quizData.mainMotivation?.replace("-", " ")}.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Shield className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Success Strategy
                  </h3>
                  <p className="text-gray-700">
                    Start with low-risk validation, build systematically, and
                    scale based on proven results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm border-t pt-6">
          <p>
            This personalized report was generated based on your quiz responses.
          </p>
          <p>For updates and additional resources, visit our platform.</p>
        </footer>
      </div>
    </div>
  );
};

// Helper functions (same as FullReport)
function calculateSocialComfort(data: QuizData): number {
  let score = 0.5;

  if (data.workCollaborationPreference === "team-focused") score += 0.3;
  else if (data.workCollaborationPreference === "mostly-solo") score -= 0.2;

  if (data.brandFaceComfort && data.brandFaceComfort >= 4) score += 0.2;
  else if (data.brandFaceComfort && data.brandFaceComfort <= 2) score -= 0.2;

  if (
    data.directCommunicationEnjoyment &&
    data.directCommunicationEnjoyment >= 4
  )
    score += 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateConsistency(data: QuizData): number {
  let score = 0.5;

  if (data.longTermConsistency && data.longTermConsistency >= 4) score += 0.3;
  else if (data.longTermConsistency && data.longTermConsistency <= 2)
    score -= 0.2;

  if (data.systemsRoutinesEnjoyment && data.systemsRoutinesEnjoyment >= 4)
    score += 0.2;
  else if (data.systemsRoutinesEnjoyment && data.systemsRoutinesEnjoyment <= 2)
    score -= 0.2;

  if (data.workStructurePreference === "very-structured") score += 0.2;
  else if (data.workStructurePreference === "very-flexible") score -= 0.2;

  return Math.max(0, Math.min(1, score));
}

function calculateRiskTolerance(data: QuizData): number {
  let score = 0.5;

  if (data.riskComfortLevel && data.riskComfortLevel >= 4) score += 0.3;
  else if (data.riskComfortLevel && data.riskComfortLevel <= 2) score -= 0.3;

  if (data.trialErrorComfort && data.trialErrorComfort >= 4) score += 0.2;
  else if (data.trialErrorComfort && data.trialErrorComfort <= 2) score -= 0.2;

  if (data.upfrontInvestment && data.upfrontInvestment >= 5000) score += 0.1;
  else if (data.upfrontInvestment && data.upfrontInvestment <= 500)
    score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateTechComfort(data: QuizData): number {
  let score = 0.5;

  if (data.techSkillsRating && data.techSkillsRating >= 4) score += 0.3;
  else if (data.techSkillsRating && data.techSkillsRating <= 2) score -= 0.3;

  if (data.toolLearningWillingness === "yes") score += 0.2;
  else if (data.toolLearningWillingness === "no") score -= 0.3;

  if (data.familiarTools && data.familiarTools.length >= 3) score += 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateMotivation(data: QuizData): number {
  let score = 0.5;

  if (data.selfMotivationLevel && data.selfMotivationLevel >= 4) score += 0.3;
  else if (data.selfMotivationLevel && data.selfMotivationLevel <= 2)
    score -= 0.3;

  if (data.discouragementResilience && data.discouragementResilience >= 4)
    score += 0.2;
  else if (data.discouragementResilience && data.discouragementResilience <= 2)
    score -= 0.2;

  if (data.mainMotivation === "passion-purpose") score += 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateFeedbackResilience(data: QuizData): number {
  let score = 0.5;

  if (data.feedbackRejectionResponse && data.feedbackRejectionResponse >= 4)
    score += 0.3;
  else if (
    data.feedbackRejectionResponse &&
    data.feedbackRejectionResponse <= 2
  )
    score -= 0.3;

  if (data.discouragementResilience && data.discouragementResilience >= 4)
    score += 0.2;
  else if (data.discouragementResilience && data.discouragementResilience <= 2)
    score -= 0.2;

  if (data.competitivenessLevel && data.competitivenessLevel >= 4) score += 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateStructurePreference(data: QuizData): number {
  let score = 0.5;

  if (data.workStructurePreference === "very-structured") score += 0.3;
  else if (data.workStructurePreference === "very-flexible") score -= 0.3;

  if (data.systemsRoutinesEnjoyment && data.systemsRoutinesEnjoyment >= 4)
    score += 0.2;
  else if (data.systemsRoutinesEnjoyment && data.systemsRoutinesEnjoyment <= 2)
    score -= 0.2;

  if (data.organizationLevel && data.organizationLevel >= 4) score += 0.2;
  else if (data.organizationLevel && data.organizationLevel <= 2) score -= 0.2;

  return Math.max(0, Math.min(1, score));
}

function calculateCreativity(data: QuizData): number {
  let score = 0.5;

  if (data.creativeWorkEnjoyment && data.creativeWorkEnjoyment >= 4)
    score += 0.3;
  else if (data.creativeWorkEnjoyment && data.creativeWorkEnjoyment <= 2)
    score -= 0.3;

  if (data.passionIdentityAlignment && data.passionIdentityAlignment >= 4)
    score += 0.2;
  else if (data.passionIdentityAlignment && data.passionIdentityAlignment <= 2)
    score -= 0.2;

  if (data.mainMotivation === "passion-purpose") score += 0.1;

  return Math.max(0, Math.min(1, score));
}

function calculateCommunicationConfidence(data: QuizData): number {
  let score = 0.5;

  if (
    data.directCommunicationEnjoyment &&
    data.directCommunicationEnjoyment >= 4
  )
    score += 0.3;
  else if (
    data.directCommunicationEnjoyment &&
    data.directCommunicationEnjoyment <= 2
  )
    score -= 0.3;

  if (data.brandFaceComfort && data.brandFaceComfort >= 4) score += 0.2;
  else if (data.brandFaceComfort && data.brandFaceComfort <= 2) score -= 0.2;

  if (data.workCollaborationPreference === "team-focused") score += 0.1;

  return Math.max(0, Math.min(1, score));
}
