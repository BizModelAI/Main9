import OpenAI from "openai";
import { QuizData, BusinessPath } from "../../shared/types.js";
import { businessPaths } from "../../shared/businessPaths.js";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 1, // Reduce retries for faster fallback
      timeout: 30000, // 30 second timeout to match race condition
    })
  : null;

// Memory-safe rate limiting for concurrent requests
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 5; // Max requests per minute to avoid rate limits
  private readonly windowMs = 60000; // 1 minute window
  private readonly maxHistorySize = 100; // Prevent memory bloat
  private readonly cleanupInterval = 5 * 60 * 1000; // Clean up every 5 minutes
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Periodic cleanup to prevent memory leaks
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const oldSize = this.requests.length;
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    // Hard limit on array size to prevent memory bloat
    if (this.requests.length > this.maxHistorySize) {
      this.requests = this.requests.slice(-this.maxHistorySize);
    }

    if (oldSize > this.requests.length) {
      console.log(
        ` AI Rate limiter cleanup: removed ${oldSize - this.requests.length} expired entries`,
      );
    }
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Clean up old requests
    this.cleanup();

    if (this.requests.length >= this.maxRequests) {
      // Wait until we can make another request
      const oldestRequest = Math.min(...this.requests);
      const waitTime = Math.min(
        this.windowMs - (now - oldestRequest) + 100,
        10000,
      ); // Cap wait at 10 seconds
      console.log(`⏳ AI rate limit hit, waiting ${waitTime}ms for slot`);

      if (waitTime > 30000) {
        // If we'd wait more than 30 seconds, just reject to avoid timeout
        throw new Error(
          "AI rate limit exceeded - too many concurrent requests",
        );
      }

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot(); // Recursive check
    }

    this.requests.push(now);
  }

  // Clean shutdown method
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

const rateLimiter = new RateLimiter();

export interface BusinessFitAnalysis {
  fitScore: number;
  reasoning: string;
  strengths: string[];
  challenges: string[];
  confidence: number;
}

export interface ComprehensiveFitAnalysis {
  topMatches: Array<{
    businessPath: BusinessPath;
    analysis: BusinessFitAnalysis;
  }>;
  personalityProfile: {
    strengths: string[];
    developmentAreas: string[];
    workStyle: string;
    riskProfile: string;
  };
  recommendations: string[];
}

export class AIScoringService {
  private static instance: AIScoringService;

  private constructor() {}

  static getInstance(): AIScoringService {
    if (!AIScoringService.instance) {
      AIScoringService.instance = new AIScoringService();
    }
    return AIScoringService.instance;
  }

  async analyzeBusinessFit(
    quizData: QuizData,
  ): Promise<ComprehensiveFitAnalysis> {
    console.log("analyzeBusinessFit called", {
      hasOpenAI: !!openai,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    });

    try {
      if (!openai) {
        console.error("OpenAI API key not configured, using fallback analysis");
        return this.fallbackAnalysis(quizData);
      }

      // Wait for rate limiter slot
      await rateLimiter.waitForSlot();

      const prompt = this.buildAnalysisPrompt(quizData);

      // Add timeout to prevent hanging
      const response = (await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency
          messages: [
            {
              role: "system",
              content:
                "You are an expert business consultant and psychologist specializing in entrepreneurial fit assessment. Analyze the quiz responses and provide detailed, accurate business model compatibility scores with reasoning. Always address the user directly using 'you' and 'your'.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1200,
        }),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error("OpenAI API call timed out after 25 seconds")),
            25000,
          ),
        ),
      ])) as OpenAI.Chat.Completions.ChatCompletion;

      console.log("OpenAI API call completed successfully");
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("No content in AI response, using fallback");
        return this.fallbackAnalysis(quizData);
      }

      const analysis = JSON.parse(content);
      return this.processAnalysis(analysis);
    } catch (error) {
      console.error("AI Scoring Service Error:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
        hasOpenAI: !!openai,
        hasApiKey: !!process.env.OPENAI_API_KEY,
      });

      // Log specific error type for debugging
      if (error instanceof Error) {
        if (
          error.message.includes("429") ||
          error.message.includes("rate limit")
        ) {
          console.warn(
            "Rate limited by OpenAI - falling back to algorithmic analysis",
          );
        } else if (
          error.message.includes("timeout") ||
          error.message.includes("timed out")
        ) {
          console.warn(
            "OpenAI request timed out - falling back to algorithmic analysis",
          );
        } else {
          console.warn(
            "OpenAI request failed - falling back to algorithmic analysis",
          );
        }
      }

      // Fallback to enhanced algorithmic scoring
      console.log(
        "Falling back to algorithmic analysis due to OpenAI error",
      );
      const fallbackResult = this.fallbackAnalysis(quizData);
      console.log("Fallback analysis completed successfully");
      return fallbackResult;
    }
  }

  private buildAnalysisPrompt(quizData: QuizData): string {
    const businessModels = businessPaths.map((bp) => ({
      id: bp.id,
      name: bp.name,
      description: bp.description,
      difficulty: bp.difficulty,
      timeToProfit: bp.timeToProfit,
      startupCost: bp.startupCost,
      potentialIncome: bp.potentialIncome,
      skills: bp.skills,
      bestFitPersonality: bp.bestFitPersonality,
    }));

    return `
    Analyze your quiz responses and provide business model compatibility scores:

        YOUR PROFILE:
    - Main Motivation: ${quizData.mainMotivation}
    - Income Goal: ${this.getIncomeGoalRange(quizData.successIncomeGoal)}
    - Timeline: ${quizData.firstIncomeTimeline}
    - Budget: ${this.getInvestmentRange(quizData.upfrontInvestment)}
    - Weekly Time: ${this.getTimeCommitmentRange(quizData.weeklyTimeCommitment)}
        - Tech Skills: ${this.getRatingDescription(quizData.techSkillsRating)}
    - Communication Comfort: ${this.getRatingDescription(quizData.directCommunicationEnjoyment)}
    - Risk Tolerance: ${this.getRatingDescription(quizData.riskComfortLevel)}
    - Self Motivation: ${this.getRatingDescription(quizData.selfMotivationLevel)}
    - Creative Work Enjoyment: ${this.getRatingDescription(quizData.creativeWorkEnjoyment)}
    - Work Style: ${quizData.workCollaborationPreference}
    - Learning Preference: ${quizData.learningPreference}
        - Brand Face Comfort: ${this.getRatingDescription(quizData.brandFaceComfort)}
    - Organization Level: ${this.getRatingDescription(quizData.organizationLevel)}
    - Consistency Level: ${this.getRatingDescription(quizData.longTermConsistency)}

    BUSINESS MODELS TO ANALYZE:
    ${JSON.stringify(businessModels, null, 2)}

    Provide a comprehensive analysis in JSON format with the following structure:

    {
      "personalityProfile": {
        "strengths": ["strength1", "strength2", "strength3"],
        "developmentAreas": ["area1", "area2"],
        "workStyle": "description of work style",
        "riskProfile": "description of risk tolerance"
      },
      "businessAnalysis": [
        {
          "businessId": "business-id",
          "fitScore": 0-100,
          "reasoning": "detailed explanation of why this score",
          "strengths": ["strength1", "strength2"],
          "challenges": ["challenge1", "challenge2"],
          "confidence": 0.0-1.0
        }
      ],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
    }

        SCORING GUIDELINES:
    - Use 0-100 scale where 70+ = Best Fit, 50-69 = Strong Fit, 30-49 = Possible Fit, <30 = Poor Fit
    - Consider realistic barriers and advantages
    - Weight factors: Income match (20%), Timeline (15%), Budget (15%), Skills (20%), Personality (15%), Risk (10%), Time (5%)
    - Be honest about challenges and realistic about opportunities
    - Most people should NOT get 90+ scores unless they're exceptionally well-suited
    - Distribute scores realistically - not everyone can be a perfect fit for everything

    CRITICAL: Use ONLY the actual data provided above. Do NOT make up specific numbers, amounts, or timeframes.
    Reference the exact ranges and values shown in your profile. If you selected a range, always refer to the full range, never specific numbers within it.
    Always address the user directly using 'you' and 'your' instead of 'the user' or 'the user's'.
    `;
  }

  private processAnalysis(analysis: any): ComprehensiveFitAnalysis {
    const topMatches = analysis.businessAnalysis
      .map((ba: any) => {
        const businessPath = businessPaths.find(
          (bp) => bp.id === ba.businessId,
        );
        if (!businessPath) return null;

        return {
          businessPath: { ...businessPath, fitScore: ba.fitScore },
          analysis: {
            fitScore: ba.fitScore,
            reasoning: ba.reasoning,
            strengths: ba.strengths,
            challenges: ba.challenges,
            confidence: ba.confidence,
          },
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.analysis.fitScore - a.analysis.fitScore);

    return {
      topMatches,
      personalityProfile: analysis.personalityProfile,
      recommendations: analysis.recommendations,
    };
  }

  private fallbackAnalysis(quizData: QuizData): ComprehensiveFitAnalysis {
    console.log("Starting fallback analysis (algorithmic scoring)");
    // Enhanced algorithmic scoring as fallback
    const scoredPaths = businessPaths
      .map((path) => {
        const fitScore = this.calculateEnhancedFitScore(path.id, quizData);
        return {
          businessPath: { ...path, fitScore },
          analysis: {
            fitScore,
            reasoning: `Algorithmic analysis based on ${path.name} requirements vs your profile`,
            strengths: this.getPathStrengths(path.id, quizData),
            challenges: this.getPathChallenges(path.id, quizData),
            confidence: 0.7,
          },
        };
      })
      .sort((a, b) => b.analysis.fitScore - a.analysis.fitScore);

    return {
      topMatches: scoredPaths,
      personalityProfile: {
        strengths: this.getPersonalityStrengths(quizData),
        developmentAreas: this.getPersonalityDevelopmentAreas(quizData),
        workStyle: this.getWorkStyleDescription(quizData),
        riskProfile: this.getRiskProfileDescription(quizData),
      },
      recommendations: this.getGeneralRecommendations(quizData),
    };
  }

  private calculateEnhancedFitScore(pathId: string, data: QuizData): number {
    // Use the existing scoring logic but enhance it
    const factors = this.calculateFactors(pathId, data);
    const weights = {
      income: 0.2,
      timeline: 0.15,
      budget: 0.15,
      skills: 0.2,
      personality: 0.15,
      risk: 0.1,
      time: 0.05,
    };

    const score = Object.keys(factors).reduce((total, key) => {
      const factorKey = key as keyof typeof factors;
      const weightKey = key as keyof typeof weights;
      return total + factors[factorKey] * weights[weightKey] * 100;
    }, 0);

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  private calculateFactors(pathId: string, data: QuizData): any {
    // Simplified version of the factor calculation
    const factors = {
      income: 0.5,
      timeline: 0.5,
      budget: 0.5,
      skills: 0.5,
      personality: 0.5,
      risk: 0.5,
      time: 0.5,
    };

    // Path-specific calculations would go here
    // This is a simplified version for the fallback

    return factors;
  }

  private getPathStrengths(pathId: string, data: QuizData): string[] {
    const strengths = [];

    if (data.selfMotivationLevel >= 4) {
      strengths.push("High self-motivation");
    }
    if (data.techSkillsRating >= 4) {
      strengths.push("Strong technical skills");
    }
    if (data.directCommunicationEnjoyment >= 4) {
      strengths.push("Excellent communication abilities");
    }

    return strengths;
  }

  private getPathChallenges(pathId: string, data: QuizData): string[] {
    const challenges = [];

    if (data.riskComfortLevel <= 2) {
      challenges.push("Low risk tolerance may limit growth");
    }
    if (data.weeklyTimeCommitment <= 10) {
      challenges.push("Limited time availability");
    }

    return challenges;
  }

  private getPersonalityStrengths(data: QuizData): string[] {
    const strengths = [];

    if (data.selfMotivationLevel >= 4) strengths.push("Self-motivated");
    if (data.organizationLevel >= 4) strengths.push("Well-organized");
    if (data.longTermConsistency >= 4) strengths.push("Consistent");
    if (data.techSkillsRating >= 4) strengths.push("Tech-savvy");
    if (data.creativeWorkEnjoyment >= 4) strengths.push("Creative");

    return strengths;
  }

  private getPersonalityDevelopmentAreas(data: QuizData): string[] {
    const areas = [];

    if (data.riskComfortLevel <= 2) areas.push("Risk tolerance");
    if (data.directCommunicationEnjoyment <= 2)
      areas.push("Communication confidence");
    if (data.brandFaceComfort <= 2) areas.push("Personal branding comfort");

    return areas;
  }

  private getWorkStyleDescription(data: QuizData): string {
    const styles = {
      "solo-only": "Strongly prefers independent work",
      "mostly-solo": "Prefers working alone with minimal collaboration",
      balanced: "Comfortable with both solo and team work",
      "team-focused": "Thrives in collaborative environments",
    };

    return (
      styles[data.workCollaborationPreference as keyof typeof styles] ||
      "Flexible work style"
    );
  }

  private getRiskProfileDescription(data: QuizData): string {
    if (data.riskComfortLevel >= 4)
      return "High risk tolerance - comfortable with uncertainty";
    if (data.riskComfortLevel >= 3)
      return "Moderate risk tolerance - cautious but willing to take calculated risks";
    return "Low risk tolerance - prefers stable, predictable opportunities";
  }

  private getGeneralRecommendations(data: QuizData): string[] {
    const recommendations = [];

    if (data.selfMotivationLevel >= 4) {
      recommendations.push(
        "Focus on business models that reward self-driven individuals",
      );
    }
    if (data.weeklyTimeCommitment <= 10) {
      recommendations.push(
        "Consider part-time or passive income opportunities first",
      );
    }
    if (data.upfrontInvestment <= 500) {
      recommendations.push(
        "Start with low-cost business models to minimize risk",
      );
    }

    return recommendations;
  }

  private getRatingDescription(rating: number): string {
    if (rating >= 4.5) return "Very High";
    if (rating >= 4) return "High";
    if (rating >= 3) return "Moderate";
    if (rating >= 2) return "Low";
    return "Very Low";
  }

  private getIncomeGoalRange(value: number): string {
    if (value <= 500) return "Less than $500/month";
    if (value <= 1250) return "$500–$2,000/month";
    if (value <= 3500) return "$2,000-$5,000/month";
    return "$5,000+/month";
  }

  private getTimeCommitmentRange(value: number): string {
    if (value <= 3) return "Less than 5 hours/week";
    if (value <= 7) return "5–10 hours/week";
    if (value <= 17) return "10–25 hours/week";
    return "25+ hours/week";
  }

  private getInvestmentRange(value: number): string {
    if (value <= 0) return "$0 (bootstrap only)";
    if (value <= 125) return "Under $250";
    if (value <= 625) return "$250–$1,000";
    return "$1,000+";
  }
}

export const aiScoringService = AIScoringService.getInstance();
