import { QuizData, BusinessPath, AIAnalysis } from "../types";
import { AICacheManager } from "./aiCacheManager";

// Optimized AI Service with 3 clean calls structure
export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Method to clear cache and force fresh responses
  static clearCacheAndReset(): void {
    if (typeof window !== "undefined") {
      const aiCacheManager = AICacheManager.getInstance();
      aiCacheManager.forceResetCache();
      console.log(
        "AI cache cleared - next responses will be fresh from OpenAI",
      );
      // Force a page reload to ensure complete reset
      window.location.reload();
    }
  }

  // OPTIMIZED: Lean user profile compression with only essential fields
  private createUserProfile(
    quizData: QuizData,
    topMatch?: BusinessPath,
  ): string {
    return `
User Profile Summary:
${topMatch ? `- Top Business Match: ${topMatch.name} (${topMatch.fitScore}% match)` : ""}
- Motivation: ${quizData.mainMotivation}
- First Income Goal: ${quizData.firstIncomeTimeline}
- Monthly Income Goal: $${quizData.successIncomeGoal}
- Upfront Investment: $${quizData.upfrontInvestment}
- Passion Alignment: ${quizData.passionIdentityAlignment}/5

Work Preferences:
- Time Availability: ${quizData.weeklyTimeCommitment}
- Learning Style: ${quizData.learningPreference || quizData.learningStyle || "self_directed"}
- Work Structure: ${quizData.workStructurePreference || "flexible"}
- Collaboration Style: ${quizData.workCollaborationPreference || "independent"}
- Decision-Making Style: ${quizData.decisionMakingStyle}

Personality Traits (0–5 scale):
- Social Comfort: ${quizData.salesComfort || 3}
- Self-Motivation: ${quizData.selfMotivationLevel || quizData.selfMotivation || 3}
- Risk Tolerance: ${quizData.riskComfortLevel || quizData.riskComfort || 3}
- Tech Comfort: ${quizData.techSkillsRating || 3}
- Structure Preference: ${quizData.workStructurePreference || 3}
- Feedback Response: ${quizData.feedbackRejectionResponse || 3}
- Creativity: ${quizData.creativeWorkEnjoyment || 3}
- Brand Comfort: ${quizData.brandFaceComfort || 3}
- Competitiveness: ${quizData.competitivenessLevel || 3}
- Communication: ${quizData.directCommunicationEnjoyment || 3}
- Organization: ${quizData.organizationLevel || 3}
- Uncertainty Handling: ${quizData.uncertaintyHandling || 3}
`.trim();
  }

  // Call 1: Results Preview (quiz-loading page) - FREE PREVIEW
  async generateResultsPreview(
    quizData: QuizData,
    topPaths: BusinessPath[],
  ): Promise<{
    previewInsights: string;
    keyInsights: string[];
    successPredictors: string[];
  }> {
    try {
      // First check if we have existing AI content in database
      const quizAttemptId = localStorage.getItem("currentQuizAttemptId");
      if (quizAttemptId) {
        const existingContent = await this.getAIContentFromDatabase(
          quizAttemptId,
          "preview",
        );
        if (existingContent) {
          console.log("✅ Using existing preview insights from database");
          return existingContent;
        }
      }

      console.log("🔄 Generating fresh preview insights");
      const userProfile = this.createUserProfile(quizData, topPaths[0]);

      const response = await this.makeOpenAIRequest({
        messages: [
          {
            role: "system",
            content:
              "You are an AI business coach. Use JSON output. Use a professional and direct tone. Do not invent data.",
          },
          {
            role: "user",
            content: `Based on this user's quiz data and their top business model, generate the following in JSON format:

1. "previewInsights": Write 3 concise paragraphs analyzing why this user is a strong fit for ${topPaths[0].name}, based on their quiz results.
   - Paragraph 1: Explain why this business model aligns with the user's goals, constraints, and personality traits.
   - Paragraph 2: Describe the user's natural advantages in executing this model (skills, traits, or behaviors).
   - Paragraph 3: Identify one potential challenge the user may face based on their profile, and how to overcome it.
   Use specific references to user traits. Avoid generic phrases. Keep the tone analytical and professional.

2. "keyInsights": 4 bullet points summarizing the most important findings about the user's business style, risk tolerance, or strategic fit.

3. "successPredictors": 4 bullet points explaining which traits or behaviors from the quiz predict a high chance of success. These should be personal, specific, and based on actual quiz data.

Format your entire output as:
{
  "previewInsights": "...",
  "keyInsights": ["...", "...", "...", "..."],
  "successPredictors": ["...", "...", "...", "..."]
}

CRITICAL RULES:
- Use only the data from this user profile.
- Do NOT invent data or use generic filler.
- Use clear, concise language.
- Do NOT include any headers or formatting outside the JSON.
- Ban phrases like "powerful foundation", "natural strengths", "unique combination of traits".
- Every paragraph must reference specific traits.
- Max 550 characters per paragraph.

USER PROFILE:
${userProfile}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      if (response && response.content) {
        const insights = JSON.parse(response.content);

        // Save to database instead of localStorage cache
        if (quizAttemptId) {
          await this.saveAIContentToDatabase(
            quizAttemptId,
            "preview",
            insights,
          );
        }

        return insights;
      }

      throw new Error("No valid response from AI service");
    } catch (error) {
      console.error("Error generating results preview:", error);
      throw error;
    }
  }

  // Call 2: Full Report Generation (full-report-loading page) - AFTER PAYWALL
  async generatePersonalizedInsights(
    quizData: QuizData,
    topPaths: BusinessPath[],
  ): Promise<{
    personalizedRecommendations: string[];
    potentialChallenges: string[];
    keyInsights: string[];
    bestFitCharacteristics: string[];
    top3Fits: { model: string; reason: string }[];
    bottom3Avoid: {
      model: string;
      reason: string;
      futureConsideration?: string;
    }[];
  }> {
    try {
      // First check if we have existing AI content in database
      const quizAttemptId = localStorage.getItem("currentQuizAttemptId");
      if (quizAttemptId) {
        const existingContent = await this.getAIContentFromDatabase(
          quizAttemptId,
          "fullReport",
        );
        if (existingContent) {
          console.log("✅ Using existing full report insights from database");
          return existingContent;
        }
      }

      console.log("🔄 Generating fresh full report insights");
      const userProfile = this.createUserProfile(quizData);

      const response = await this.makeOpenAIRequest({
        messages: [
          {
            role: "system",
            content:
              "You are an AI business coach. Use JSON output. Use a professional and direct tone. Do not invent data.",
          },
          {
            role: "user",
            content: `Based only on the quiz data and top 3 business matches, generate the following JSON output. This is for a full business analysis report. Do NOT include formatting or markdown. Be specific and use only known data.

Return exactly this structure:

{
  "personalizedRecommendations": ["...", "...", "...", "...", "...", "..."],
  "potentialChallenges": ["...", "...", "...", "..."],
  "keyInsights": ["...", "...", "...", "..."],
  "bestFitCharacteristics": ["...", "...", "...", "...", "...", "..."],
  "top3Fits": [
    {
      "model": "${topPaths[0]?.name || "Business Model"}",
      "reason": "One short paragraph explaining why this is a strong match"
    },
    {
      "model": "${topPaths[1]?.name || "Business Model"}",
      "reason": "One short paragraph explaining why this is a strong match"
    },
    {
      "model": "${topPaths[2]?.name || "Business Model"}",
      "reason": "One short paragraph explaining why this is a strong match"
    }
  ],
  "bottom3Avoid": [
    {
      "model": "App or SaaS Development",
      "reason": "Why this model doesn't align with current profile",
      "futureConsideration": "How it could become viable in the future (optional)"
    },
    {
      "model": "E-commerce",
      "reason": "Why this model doesn't align with current profile",
      "futureConsideration": "How it could become viable in the future (optional)"
    },
    {
      "model": "Franchise Ownership",
      "reason": "Why this model doesn't align with current profile",
      "futureConsideration": "How it could become viable in the future (optional)"
    }
  ]
}

CRITICAL RULES:
- Use ONLY the following data:
  ${userProfile}
  - Top matches:
    1. ${topPaths[0]?.name || "N/A"} (${topPaths[0]?.fitScore || "N/A"}%)
    2. ${topPaths[1]?.name || "N/A"} (${topPaths[1]?.fitScore || "N/A"}%)
    3. ${topPaths[2]?.name || "N/A"} (${topPaths[2]?.fitScore || "N/A"}%)
- DO NOT generate previewInsights or keySuccessIndicators (already created).
- Use clean, specific, professional language only.
- Do NOT invent numbers, ratings, or filler traits.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      });

      if (response && response.content) {
        const insights = JSON.parse(response.content);

        // Save to database instead of localStorage cache
        if (quizAttemptId) {
          await this.saveAIContentToDatabase(
            quizAttemptId,
            "fullReport",
            insights,
          );
        }

        return insights;
      }

      throw new Error("No valid response from AI service");
    } catch (error) {
      console.error("Error generating full report insights:", error);
      throw error;
    }
  }

  // Call 3: Business Model Insights (/business/:modelSlug pages) - ON DEMAND
  async generateModelInsights(
    quizData: QuizData,
    modelName: string,
    fitType: "best" | "strong" | "possible" | "poor",
  ): Promise<{
    modelFitReason: string;
    keyInsights: string[];
    successPredictors: string[];
  }> {
    try {
      // First check if we have existing AI content in database
      const quizAttemptId = localStorage.getItem("currentQuizAttemptId");
      if (quizAttemptId) {
        const existingContent = await this.getAIContentFromDatabase(
          quizAttemptId,
          `model_${modelName}`,
        );
        if (existingContent) {
          console.log(
            `✅ Using existing model insights for ${modelName} from database`,
          );
          return existingContent;
        }
      }

      console.log(
        `🔄 Generating fresh model insights for ${modelName} (${fitType})`,
      );
      const userProfile = this.createUserProfile(quizData);

      // Fit-type specific prompt logic
      let fitPrompt = "";
      switch (fitType) {
        case "best":
          fitPrompt =
            "Explain why this is the user's ideal match. Use clear, confident tone. keyInsights all positive. successPredictors: traits that increase odds of success.";
          break;
        case "strong":
          fitPrompt =
            "Explain why it's a great fit, but briefly note why it's not their #1. keyInsights: mostly strengths, 1 light drawback. successPredictors: mostly positive, minor caveat if needed.";
          break;
        case "possible":
          fitPrompt =
            "Explain why it might work, but emphasize 2–3 quiz-based reasons why it likely won't right now. keyInsights: highlight gaps or blockers. successPredictors: traits that reduce odds of success.";
          break;
        case "poor":
          fitPrompt =
            "Clearly explain why this model is misaligned with their profile. End with future-oriented line (what would need to change). keyInsights: clear mismatches. successPredictors: traits that would make success unlikely.";
          break;
      }

      const response = await this.makeOpenAIRequest({
        messages: [
          {
            role: "system",
            content:
              "You are an AI business coach. Use JSON output. Use a professional and direct tone. Do not invent data.",
          },
          {
            role: "user",
            content: `Generate personalized AI content for the business model "${modelName}" based on the user's quiz data and fit type "${fitType}".

${fitPrompt}

Return exactly this JSON structure:
{
  "modelFitReason": "Single paragraph explaining fit",
  "keyInsights": ["...", "...", "...", "..."],
  "successPredictors": ["...", "...", "...", "..."]
}

CRITICAL RULES:
- Use existing user profile data only
- Do not generate markdown or formatted code blocks
- Keep modelFitReason a single paragraph
- Return clean, JSON-parsed output
- Max 700 tokens total

USER PROFILE:
${userProfile}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 700,
      });

      if (response && response.content) {
        const insights = JSON.parse(response.content);

        // Save to database instead of localStorage cache
        if (quizAttemptId) {
          await this.saveAIContentToDatabase(
            quizAttemptId,
            `model_${modelName}`,
            insights,
          );
        }

        return insights;
      }

      throw new Error("No valid response from AI service");
    } catch (error) {
      console.error(`Error generating model insights for ${modelName}:`, error);
      throw error;
    }
  }

  // Optimized OpenAI request with system message structure
  private async makeOpenAIRequest(params: {
    messages: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
  }): Promise<{ content: string } | null> {
    try {
      const response = await fetch("/api/openai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ OpenAI request successful");

      return { content: data.content || data.message || data.response };
    } catch (error) {
      console.error("Error in OpenAI request:", error);
      throw error;
    }
  }

  // Method to retroactively save AI content when unpaid user provides email
  async saveExistingAIContentToDatabase(): Promise<void> {
    try {
      const quizAttemptId = localStorage.getItem("currentQuizAttemptId");
      if (!quizAttemptId) {
        console.log(
          "No currentQuizAttemptId found - nothing to save retroactively",
        );
        return;
      }

      console.log(
        "🔄 Retroactively saving existing AI content to database after email provided",
      );

      // Check for existing AI content in localStorage that needs to be saved
      const quizCompletionInsights = localStorage.getItem(
        "quiz-completion-ai-insights",
      );

      if (quizCompletionInsights) {
        try {
          const aiData = JSON.parse(quizCompletionInsights);
          if (aiData && aiData.insights) {
            console.log("💾 Saving quiz completion insights to database");
            await this.saveAIContentToDatabase(
              quizAttemptId,
              "preview",
              aiData.insights,
            );
          }
        } catch (error) {
          console.error("Error parsing quiz completion insights:", error);
        }
      }

      // Check for any other AI content that might be in localStorage
      const loadedReportData = localStorage.getItem("loadedReportData");
      if (loadedReportData) {
        try {
          const reportData = JSON.parse(loadedReportData);
          if (reportData && reportData.aiInsights) {
            console.log("💾 Saving loaded report data to database");
            await this.saveAIContentToDatabase(
              quizAttemptId,
              "fullReport",
              reportData.aiInsights,
            );
          }
        } catch (error) {
          console.error("Error parsing loaded report data:", error);
        }
      }

      console.log("✅ Finished retroactively saving AI content to database");
    } catch (error) {
      console.error("Error retroactively saving AI content:", error);
    }
  }

  // Database helper methods for AI content storage
  private async saveAIContentToDatabase(
    quizAttemptId: string,
    contentType: string,
    content: any,
  ): Promise<void> {
    try {
      // Check if we should save to database (only for paid users or unpaid users who provided email)
      const shouldSaveToDatabase = await this.shouldSaveToDatabase();

      if (!shouldSaveToDatabase) {
        console.log(
          `⏭️ Skipping ${contentType} database save - unpaid user hasn't provided email yet`,
        );
        return;
      }

      console.log(
        `�� Saving ${contentType} AI content to database for quiz attempt ${quizAttemptId}`,
      );

      const response = await fetch(
        `/api/quiz-attempts/${quizAttemptId}/ai-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            contentType,
            content,
          }),
        },
      );

      if (response.ok) {
        console.log(`✅ ${contentType} AI content saved to database`);
      } else {
        console.error(
          `❌ Failed to save ${contentType} AI content to database:`,
          response.status,
        );
      }
    } catch (error) {
      console.error(
        `❌ Error saving ${contentType} AI content to database:`,
        error,
      );
    }
  }

  private async shouldSaveToDatabase(): Promise<boolean> {
    try {
      // Check if user is authenticated (paid users always save)
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          console.log(`✅ User authenticated - will save to database`);
          return true;
        }
      }

      // For unpaid users, check if they've provided an email
      const userEmail = localStorage.getItem("userEmail");
      const hasProvidedEmail =
        userEmail && userEmail !== "null" && userEmail.length > 0;

      if (hasProvidedEmail) {
        console.log(
          `✅ Unpaid user provided email (${userEmail}) - will save to database`,
        );
        return true;
      }

      console.log(
        `⏭️ Unpaid user hasn't provided email - will not save to database`,
      );
      return false;
    } catch (error) {
      console.error("Error checking if should save to database:", error);
      return false;
    }
  }

  private async getAIContentFromDatabase(
    quizAttemptId: string,
    contentType: string,
  ): Promise<any | null> {
    try {
      // Check if we should retrieve from database (same logic as saving)
      const shouldUseDatabase = await this.shouldSaveToDatabase();

      if (!shouldUseDatabase) {
        console.log(
          `⏭️ Skipping ${contentType} database retrieval - unpaid user hasn't provided email yet`,
        );
        return null;
      }

      const response = await fetch(
        `/api/quiz-attempts/${quizAttemptId}/ai-content?type=${contentType}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.content) {
          console.log(`📖 Retrieved ${contentType} AI content from database`);
          return data.content;
        }
      } else if (response.status !== 404) {
        console.error(
          `❌ Failed to get ${contentType} AI content from database:`,
          response.status,
        );
      }
    } catch (error) {
      console.error(
        `❌ Error getting ${contentType} AI content from database:`,
        error,
      );
    }

    return null;
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
