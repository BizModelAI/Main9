import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, DollarSign, Loader } from "lucide-react";
import { QuizData } from "../types";

interface IncomeProjection {
  month: string;
  income: number;
  cumulativeIncome: number;
  milestones?: string[];
}

interface IncomeProjectionData {
  monthlyProjections: IncomeProjection[];
  averageTimeToProfit: string;
  projectedYearOneIncome: number;
  keyFactors: string[];
  assumptions: string[];
}

interface IncomeProjectionChartProps {
  businessId: string;
  businessModel: string;
  quizData?: QuizData;
}

export const IncomeProjectionChart: React.FC<IncomeProjectionChartProps> = ({
  businessId,
  businessModel,
  quizData,
}) => {
  const [projectionData, setProjectionData] =
    useState<IncomeProjectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"monthly" | "cumulative">("monthly");

  const generateIncomeProjections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-income-projections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          businessModel,
          quizData,
          userProfile: createUserProfile(quizData || ({} as QuizData)),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProjectionData(data);
    } catch (error) {
      console.error("Error generating income projections:", error);
      // Set fallback data
      setProjectionData(getFallbackProjections(businessId));
    } finally {
      setIsLoading(false);
    }
  }, [businessId, businessModel, quizData]);

  useEffect(() => {
    if (businessId && quizData) {
      generateIncomeProjections();
    }
  }, [businessId, quizData, generateIncomeProjections]);

  const createUserProfile = (quizData: QuizData): string => {
    const profile = {
      timeCommitment: quizData.weeklyTimeCommitment || 20,
      investment: quizData.upfrontInvestment || 1000,
      skills: {
        tech: quizData.techSkillsRating || 3,
        motivation: quizData.selfMotivationLevel || 3,
        risk: quizData.riskComfortLevel || 3,
      },
      goals: {
        income: quizData.successIncomeGoal || 5000,
        timeline: quizData.firstIncomeTimeline || "3-6-months",
      },
      preferences: {
        learning: quizData.learningPreference || "hands-on",
        workStyle: quizData.workCollaborationPreference || "mostly-solo",
      },
    };

    return JSON.stringify(profile);
  };

  const getFallbackProjections = (businessId: string): IncomeProjectionData => {
    const baseData: Record<string, IncomeProjectionData> = {
      "affiliate-marketing": {
        monthlyProjections: [
          {
            month: "Month 1",
            income: 0,
            cumulativeIncome: 0,
            milestones: ["Setup website", "Choose niche"],
          },
          {
            month: "Month 2",
            income: 50,
            cumulativeIncome: 50,
            milestones: ["First content published"],
          },
          {
            month: "Month 3",
            income: 200,
            cumulativeIncome: 250,
            milestones: ["First affiliate sale"],
          },
          {
            month: "Month 4",
            income: 500,
            cumulativeIncome: 750,
            milestones: ["Traffic growth"],
          },
          {
            month: "Month 5",
            income: 800,
            cumulativeIncome: 1550,
            milestones: ["SEO improvement"],
          },
          {
            month: "Month 6",
            income: 1200,
            cumulativeIncome: 2750,
            milestones: ["Email list building"],
          },
          { month: "Month 7", income: 1600, cumulativeIncome: 4350 },
          { month: "Month 8", income: 2000, cumulativeIncome: 6350 },
          { month: "Month 9", income: 2500, cumulativeIncome: 8850 },
          { month: "Month 10", income: 3000, cumulativeIncome: 11850 },
          { month: "Month 11", income: 3500, cumulativeIncome: 15350 },
          { month: "Month 12", income: 4000, cumulativeIncome: 19350 },
        ],
        averageTimeToProfit: "3-4 months",
        projectedYearOneIncome: 19350,
        keyFactors: [
          "Content quality",
          "SEO optimization",
          "Audience building",
          "Product selection",
        ],
        assumptions: [
          "20 hours/week commitment",
          "Consistent content creation",
          "Learning SEO basics",
        ],
      },
      freelancing: {
        monthlyProjections: [
          {
            month: "Month 1",
            income: 500,
            cumulativeIncome: 500,
            milestones: ["Profile setup", "First client"],
          },
          {
            month: "Month 2",
            income: 1200,
            cumulativeIncome: 1700,
            milestones: ["Portfolio building"],
          },
          {
            month: "Month 3",
            income: 2000,
            cumulativeIncome: 3700,
            milestones: ["Client testimonials"],
          },
          {
            month: "Month 4",
            income: 2800,
            cumulativeIncome: 6500,
            milestones: ["Rate increase"],
          },
          {
            month: "Month 5",
            income: 3500,
            cumulativeIncome: 10000,
            milestones: ["Repeat clients"],
          },
          {
            month: "Month 6",
            income: 4200,
            cumulativeIncome: 14200,
            milestones: ["Referral network"],
          },
          { month: "Month 7", income: 4800, cumulativeIncome: 19000 },
          { month: "Month 8", income: 5200, cumulativeIncome: 24200 },
          { month: "Month 9", income: 5600, cumulativeIncome: 29800 },
          { month: "Month 10", income: 6000, cumulativeIncome: 35800 },
          { month: "Month 11", income: 6200, cumulativeIncome: 42000 },
          { month: "Month 12", income: 6500, cumulativeIncome: 48500 },
        ],
        averageTimeToProfit: "1-2 months",
        projectedYearOneIncome: 48500,
        keyFactors: [
          "Skill level",
          "Portfolio quality",
          "Client communication",
          "Pricing strategy",
        ],
        assumptions: [
          "Existing marketable skills",
          "25 hours/week availability",
          "Professional presentation",
        ],
      },
      dropshipping: {
        monthlyProjections: [
          {
            month: "Month 1",
            income: -500,
            cumulativeIncome: -500,
            milestones: ["Store setup", "Product research"],
          },
          {
            month: "Month 2",
            income: -200,
            cumulativeIncome: -700,
            milestones: ["First sales", "Ad testing"],
          },
          {
            month: "Month 3",
            income: 300,
            cumulativeIncome: -400,
            milestones: ["Profitable ads"],
          },
          {
            month: "Month 4",
            income: 800,
            cumulativeIncome: 400,
            milestones: ["Scale advertising"],
          },
          {
            month: "Month 5",
            income: 1500,
            cumulativeIncome: 1900,
            milestones: ["Product expansion"],
          },
          {
            month: "Month 6",
            income: 2200,
            cumulativeIncome: 4100,
            milestones: ["Brand building"],
          },
          { month: "Month 7", income: 2800, cumulativeIncome: 6900 },
          { month: "Month 8", income: 3200, cumulativeIncome: 10100 },
          { month: "Month 9", income: 3600, cumulativeIncome: 13700 },
          { month: "Month 10", income: 4000, cumulativeIncome: 17700 },
          { month: "Month 11", income: 4200, cumulativeIncome: 21900 },
          { month: "Month 12", income: 4500, cumulativeIncome: 26400 },
        ],
        averageTimeToProfit: "3-4 months",
        projectedYearOneIncome: 26400,
        keyFactors: [
          "Product selection",
          "Marketing skills",
          "Ad spend management",
          "Customer service",
        ],
        assumptions: [
          "$1000+ initial investment",
          "Effective ad campaigns",
          "Market research",
        ],
      },
    };

    return baseData[businessId] || baseData["affiliate-marketing"];
  };

  const formatCurrency = (value: number) => {
    if (value < 0) return `-$${Math.abs(value).toLocaleString()}`;
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600">
            Monthly Income: {formatCurrency(data.income)}
          </p>
          <p className="text-green-600">
            Cumulative: {formatCurrency(data.cumulativeIncome)}
          </p>
          {data.milestones && data.milestones.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-600">
                Key Milestones:
              </p>
              {data.milestones.map((milestone: string, idx: number) => (
                <p key={idx} className="text-xs text-gray-500">
                  • {milestone}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!quizData) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          Complete the quiz to see personalized income projections
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">
          Generating income projections...
        </span>
      </div>
    );
  }

  if (!projectionData) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Unable to generate income projections</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              viewMode === "monthly"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Monthly Income
          </button>
          <button
            onClick={() => setViewMode("cumulative")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              viewMode === "cumulative"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Cumulative Income
          </button>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Projected Year 1 Total</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(projectionData.projectedYearOneIncome)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "monthly" ? (
            <BarChart data={projectionData.monthlyProjections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={projectionData.monthlyProjections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cumulativeIncome"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Key Success Factors
          </h4>
          <ul className="space-y-2">
            {projectionData.keyFactors.map((factor, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-blue-800">{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Assumptions
          </h4>
          <ul className="space-y-2">
            {projectionData.assumptions.map((assumption, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-green-800">{assumption}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="text-sm text-green-600">Average Time to Profit</div>
            <div className="text-lg font-bold text-green-800">
              {projectionData.averageTimeToProfit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
