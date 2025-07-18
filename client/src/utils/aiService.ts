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
    // Helper function to convert numerical ratings to descriptive text
    const getRatingDescription = (rating: number): string => {
      if (rating >= 4) return "high";
      if (rating >= 3) return "moderate";
      return "low";
    };

    return `
User Profile Summary:
${topMatch ? `- Top Business Match: ${topMatch.name} (${topMatch.fitScore}% match)` : ""}
- Motivation: ${quizData.mainMotivation}
- First Income Goal: ${quizData.firstIncomeTimeline}
- Monthly Income Goal: $${quizData.successIncomeGoal}
- Upfront Investment: $${quizData.upfrontInvestment}
- Passion Alignment: ${getRatingDescription(quizData.passionIdentityAlignment)}

Work Preferences:
- Time Availability: ${quizData.weeklyTimeCommitment}
- Learning Style: ${quizData.learningPreference || quizData.learningStyle || "self_directed"}
- Work Structure: ${quizData.workStructurePreference || "flexible"}
- Collaboration Style: ${quizData.workCollaborationPreference || "independent"}
- Decision-Making Style: ${quizData.decisionMakingStyle}

Personality Traits:
- Social Comfort: ${getRatingDescription(quizData.salesComfort || 3)}
- Self-Motivation: ${getRatingDescription(quizData.selfMotivationLevel || quizData.selfMotivation || 3)}
- Risk Tolerance: ${getRatingDescription(quizData.riskComfortLevel || 3)}
- Tech Comfort: ${getRatingDescription(quizData.techSkillsRating || 3)}
- Structure Preference: ${quizData.workStructurePreference || "flexible"}
- Feedback Response: ${getRatingDescription(quizData.feedbackRejectionResponse || 3)}
- Creativity: ${getRatingDescription(quizData.creativeWorkEnjoyment || 3)}
- Brand Comfort: ${getRatingDescription(quizData.brandFaceComfort || 3)}
- Competitiveness: ${getRatingDescription(quizData.competitivenessLevel || 3)}
- Communication: ${getRatingDescription(quizData.directCommunicationEnjoyment || 3)}
- Organization: ${getRatingDescription(quizData.organizationLevel || 3)}
- Uncertainty Handling: ${getRatingDescription(quizData.uncertaintyHandling || 3)}
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
          console.log("Using existing preview insights from database");
          return existingContent;
        }
      }

      console.log("Generating fresh preview insights");
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
            content: `Based on your quiz data and your top business model, generate the following in JSON format:

1. "previewInsights": Write 3 paragraphs analyzing why you are a strong fit for ${topPaths[0].name}, based on your quiz results.
   - Paragraph 1: Explain why this business model aligns with your goals, constraints, and personality traits. Be specific about how your exact quiz responses connect to this business model's requirements.
   - Paragraph 2: Describe your natural advantages in executing this model (skills, traits, or behaviors). Reference specific traits from your quiz that give you an edge in this field.
   - Paragraph 3: Identify one potential challenge you may face based on your profile, and how to overcome it. Be honest but constructive about areas where you might need to grow.
   Each paragraph must be a minimum of 3 sentences. Longer, more detailed paragraphs are encouraged. Do not write any paragraph shorter than 3 sentences.
   Use specific references to your traits and quiz responses. Avoid generic phrases. Keep the tone personal, professional, and directly addressing you.

2. "keyInsights": 4 bullet points summarizing the most important findings about your business style, risk tolerance, or strategic fit.

3. "successPredictors": 4 bullet points explaining which traits or behaviors from your quiz predict a high chance of success. These should be personal, specific, and based on your actual quiz data.

Format your entire output as:
{
  "previewInsights": "...",
  "keyInsights": ["...", "...", "...", "..."],
  "successPredictors": ["...", "...", "...", "..."]
}

CRITICAL RULES:
- Use only the data from your profile.
- Do NOT invent data or use generic filler.
- Use clear, concise language that directly addresses you.
- Do NOT include any headers or formatting outside the JSON.
- Ban phrases like "powerful foundation", "natural strengths", "unique combination of traits".
- Every paragraph must reference specific traits from your quiz.
- Max 550 characters per paragraph.
- Always use "you" and "your" instead of "the user" or "the user's".

YOUR PROFILE:
${userProfile}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      if (response && response.content) {
        try {
          // Clean up the response content to ensure valid JSON
          let cleanContent = response.content.trim();

          // Remove any potential markdown code blocks
          cleanContent = cleanContent
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "");

          // Find the JSON object (between first { and last })
          const firstBrace = cleanContent.indexOf("{");
          const lastBrace = cleanContent.lastIndexOf("}");

          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
          }

          const insights = JSON.parse(cleanContent);

          // Save to database instead of localStorage cache
          if (quizAttemptId) {
            await this.saveAIContentToDatabase(
              quizAttemptId,
              "preview",
              insights,
            );
          }

          return insights;
        } catch (parseError) {
          console.error("JSON parse error for response:", response.content);
          console.error("Parse error details:", parseError);

          // Return a fallback structure
          return {
            previewInsights:
              "Unable to generate detailed insights at this time. Please try again.",
            keyInsights: [
              "Technical analysis temporarily unavailable",
              "Personalized recommendations being processed",
              "Business fit assessment in progress",
              "Success predictors under review",
            ],
            successPredictors: [
              "Your quiz responses indicate strong entrepreneurial potential",
              "Multiple business models show compatibility with your profile",
              "Time commitment and risk tolerance align with opportunities",
              "Skills assessment suggests good foundation for success",
            ],
          };
        }
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
    bottomPaths: BusinessPath[],
  ): Promise<{
    personalizedRecommendations: string[];
    potentialChallenges: string[];
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
          console.log("Using existing full report insights from database");
          return existingContent;
        }
      }

      console.log("Generating fresh full report insights");
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
            content: `Based only on your quiz data and the provided top 3 and bottom 3 business matches, generate the following JSON output. This is for a full business analysis report. Do NOT include formatting or markdown. Be specific and use only known data.

Return exactly this structure:

{
  "personalizedRecommendations": ["...", "...", "...", "...", "...", "..."],
  "potentialChallenges": ["...", "...", "...", "..."],
  "top3Fits": [
    {
      "model": "${topPaths[0]?.name || "Business Model"}",
      "reason": "One short paragraph explaining why this is a strong match for you"
    },
    {
      "model": "${topPaths[1]?.name || "Business Model"}",
      "reason": "One short paragraph explaining why this is a strong match for you"
    },
    {
      "model": "${topPaths[2]?.name || "Business Model"}",
      "reason": "One short paragraph explaining why this is a strong match for you"
    }
  ],
  "bottom3Avoid": [
    {
      "model": "${bottomPaths[0]?.name || "Business Model"}",
      "reason": "Why this model doesn't align with your current profile",
      "futureConsideration": "How it could become viable for you in the future (optional)"
    },
    {
      "model": "${bottomPaths[1]?.name || "Business Model"}",
      "reason": "Why this model doesn't align with your current profile",
      "futureConsideration": "How it could become viable for you in the future (optional)"
    },
    {
      "model": "${bottomPaths[2]?.name || "Business Model"}",
      "reason": "Why this model doesn't align with your current profile",
      "futureConsideration": "How it could become viable for you in the future (optional)"
    }
  ]
}

CRITICAL RULES:
- Use ONLY the following data:
  ${userProfile}
  - Top matches (already determined by algorithm):
    1. ${topPaths[0]?.name || "N/A"} (${topPaths[0]?.fitScore || "N/A"}%)
    2. ${topPaths[1]?.name || "N/A"} (${topPaths[1]?.fitScore || "N/A"}%)
    3. ${topPaths[2]?.name || "N/A"} (${topPaths[2]?.fitScore || "N/A"}%)
  - Bottom matches (already determined by algorithm):
    1. ${bottomPaths[0]?.name || "N/A"} (${bottomPaths[0]?.fitScore || "N/A"}%)
    2. ${bottomPaths[1]?.name || "N/A"} (${bottomPaths[1]?.fitScore || "N/A"}%)
    3. ${bottomPaths[2]?.name || "N/A"} (${bottomPaths[2]?.fitScore || "N/A"}%)
- DO NOT generate previewInsights or keySuccessIndicators (already created).
- Use clean, specific, professional language only.
- Do NOT invent numbers, ratings, or filler traits.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      });

      if (response && response.content) {
        try {
          // Clean up the response content to ensure valid JSON
          let cleanContent = response.content.trim();

          // Remove any potential markdown code blocks
          cleanContent = cleanContent
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "");

          // Find the JSON object (between first { and last })
          const firstBrace = cleanContent.indexOf("{");
          const lastBrace = cleanContent.lastIndexOf("}");

          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
          }

          const insights = JSON.parse(cleanContent);

          // Save to database instead of localStorage cache
          if (quizAttemptId) {
            await this.saveAIContentToDatabase(
              quizAttemptId,
              "fullReport",
              insights,
            );
          }

          return insights;
        } catch (parseError) {
          console.error(
            "JSON parse error in generatePersonalizedInsights:",
            response.content,
          );
          console.error("Parse error details:", parseError);

          // Return fallback insights structure
          return {
            personalizedRecommendations: [
              "Technical analysis temporarily unavailable",
              "Please refresh the page to retry",
              "Contact support if issue persists",
            ],
            potentialChallenges: ["System temporarily unavailable"],
            top3Fits: [
              { model: "Analysis unavailable", reason: "System error" },
            ],
            bottom3Avoid: [
              { model: "Analysis unavailable", reason: "System error" },
            ],
          };
        }
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
            `Using existing model insights for ${modelName} from database`,
          );
          return existingContent;
        }
      }

      console.log(
        ` Generating fresh model insights for ${modelName} (${fitType})`,
      );
      const userProfile = this.createUserProfile(quizData);

      // Fit-type specific prompt logic
      let fitPrompt = "";
      switch (fitType) {
        case "best":
          fitPrompt =
            "Explain why this is your ideal match. Use clear, confident tone.";
          break;
        case "strong":
          fitPrompt =
            "Explain why it's a great fit for you, but briefly note why it's not your #1.";
          break;
        case "possible":
          fitPrompt =
            "Explain why it might work for you, but emphasize 2–3 quiz-based reasons why it likely won't right now.";
          break;
        case "poor":
          fitPrompt =
            "Clearly explain why this model is misaligned with your profile. End with future-oriented line (what would need to change for you).";
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
            content: `Generate personalized AI content for the business model "${modelName}" based on your quiz data and fit type "${fitType}".

${fitPrompt}

Return exactly this JSON structure:
{
  "modelFitReason": "Single paragraph explaining fit"
}

CRITICAL RULES:
- Use existing profile data only
- Do not generate markdown or formatted code blocks
- Keep modelFitReason a single paragraph
- Return clean, JSON-parsed output
- Max 400 tokens total
- Always use "you" and "your" instead of "the user" or "the user's"

YOUR PROFILE:
${userProfile}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      if (response && response.content) {
        try {
          // Clean up the response content to ensure valid JSON
          let cleanContent = response.content.trim();

          // Remove any potential markdown code blocks
          cleanContent = cleanContent
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "");

          // Find the JSON object (between first { and last })
          const firstBrace = cleanContent.indexOf("{");
          const lastBrace = cleanContent.lastIndexOf("}");

          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
          }

          const insights = JSON.parse(cleanContent);

          // Save to database instead of localStorage cache
          if (quizAttemptId) {
            await this.saveAIContentToDatabase(
              quizAttemptId,
              `model_${modelName}`,
              insights,
            );
          }

          return insights;
        } catch (parseError) {
          console.error(
            "JSON parse error in generateModelInsights:",
            response.content,
          );
          console.error("Parse error details:", parseError);

          // Return fallback insights for model
          return {
            modelFitReason: `Unable to generate detailed analysis for ${modelName} at this time. This business model may still be a good fit based on your quiz responses.`,
            keyInsights: ["Analysis temporarily unavailable"],
            successPredictors: ["Technical analysis unavailable"],
          };
        }
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
      console.log("OpenAI request successful");

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
        " Retroactively saving existing AI content to database after email provided",
      );

      // Check for existing AI content in localStorage that needs to be saved
      const quizCompletionInsights = localStorage.getItem(
        "quiz-completion-ai-insights",
      );

      if (quizCompletionInsights) {
        try {
          const aiData = JSON.parse(quizCompletionInsights);
          if (aiData && aiData.insights) {
            console.log(" Saving quiz completion insights to database");
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
            console.log(" Saving loaded report data to database");
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

      // Check for new format AI content in localStorage (from anonymous users)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("ai_content_")) {
          try {
            const storedData = localStorage.getItem(key);
            if (storedData) {
              const parsedData = JSON.parse(storedData);

              // Extract content type from key (e.g., "ai_content_preview" -> "preview")
              const contentType = key.replace("ai_content_", "");

              console.log(
                ` Saving ${contentType} AI content from localStorage to database`,
              );
              await this.saveAIContentToDatabase(
                quizAttemptId,
                contentType,
                parsedData.content,
              );

              // Remove from localStorage since it's now in database
              localStorage.removeItem(key);
              localStorage.removeItem(`${key}_expires`);
            }
          } catch (error) {
            console.error(`Error processing AI content ${key}:`, error);
          }
        }
      }

      console.log("Finished retroactively saving AI content to database");
    } catch (error) {
      console.error("Error retroactively saving AI content:", error);
    }
  }

  // Database helper methods for AI content storage
  async saveAIContentToDatabase(
    quizAttemptId: string,
    contentType: string,
    content: any,
  ): Promise<void> {
    try {
      // Check if we should save to database (authenticated users or users who provided email)
      const shouldSaveToDatabase = await this.shouldSaveToDatabase();

      if (shouldSaveToDatabase) {
        // TIER 1 & 2: Save to database for authenticated users and email-provided users
        console.log(
          ` Saving ${contentType} AI content to database for quiz attempt ${quizAttemptId}`,
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
          console.log(`${contentType} AI content saved to database`);
        } else {
          console.error(
            `❌ Failed to save ${contentType} AI content to database:`,
            response.status,
          );
          // Fallback to localStorage if database save fails
          this.saveAIContentToLocalStorage(contentType, content);
        }
      } else {
        // TIER 3: Save to localStorage for anonymous users (no email provided)
        console.log(
          ` Saving ${contentType} AI content to localStorage (anonymous user)`,
        );
        this.saveAIContentToLocalStorage(contentType, content);
      }
    } catch (error) {
      console.error(`❌ Error saving ${contentType} AI content:`, error);
      // Fallback to localStorage on any error
      this.saveAIContentToLocalStorage(contentType, content);
    }
  }

  private saveAIContentToLocalStorage(contentType: string, content: any): void {
    try {
      const storageKey = `ai_content_${contentType}`;
      const timestamp = Date.now();
      const expiresAt = timestamp + 60 * 60 * 1000; // 1 hour expiration for anonymous users

      const storageData = {
        content,
        timestamp,
        expiresAt,
        userType: "anonymous",
      };

      localStorage.setItem(storageKey, JSON.stringify(storageData));
      localStorage.setItem(`${storageKey}_expires`, expiresAt.toString());

      console.log(
        `${contentType} AI content saved to localStorage, expires at: ${new Date(expiresAt)}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to save ${contentType} AI content to localStorage:`,
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
          console.log(`User authenticated - will save to database`);
          return true;
        }
      }

      // For unpaid users, check if they've provided an email
      const userEmail = localStorage.getItem("userEmail");
      const hasProvidedEmail =
        userEmail && userEmail !== "null" && userEmail.length > 0;

      if (hasProvidedEmail) {
        console.log(
          `Unpaid user provided email (${userEmail}) - will save to database`,
        );
        return true;
      }

      console.log(
        `Unpaid user hasn't provided email - will not save to database`,
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
      // Check if we should retrieve from database (authenticated users or users who provided email)
      const shouldUseDatabase = await this.shouldSaveToDatabase();

      if (shouldUseDatabase) {
        // TIER 1 & 2: Try to get from database
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
            console.log(` Retrieved ${contentType} AI content from database`);
            return data.content;
          }
        } else if (response.status !== 404) {
          console.error(
            `❌ Failed to get ${contentType} AI content from database:`,
            response.status,
          );
        }
      } else {
        // TIER 3: Try to get from localStorage for anonymous users
        console.log(
          ` Retrieving ${contentType} AI content from localStorage (anonymous user)`,
        );
        return this.getAIContentFromLocalStorage(contentType);
      }
    } catch (error) {
      console.error(`❌ Error getting ${contentType} AI content:`, error);
      // Fallback to localStorage
      return this.getAIContentFromLocalStorage(contentType);
    }

    return null;
  }

  private getAIContentFromLocalStorage(contentType: string): any | null {
    try {
      const storageKey = `ai_content_${contentType}`;
      const storedData = localStorage.getItem(storageKey);

      if (!storedData) {
        return null;
      }

      const parsedData = JSON.parse(storedData);
      const now = Date.now();

      // Check if content has expired (1 hour for anonymous users)
      if (parsedData.expiresAt && now > parsedData.expiresAt) {
        console.log(
          `⏰ ${contentType} AI content expired, cleaning up localStorage`,
        );
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_expires`);
        return null;
      }

      console.log(` Retrieved ${contentType} AI content from localStorage`);
      return parsedData.content;
    } catch (error) {
      console.error(
        `❌ Failed to retrieve ${contentType} AI content from localStorage:`,
        error,
      );
      return null;
    }
  }

  // BACKWARD COMPATIBILITY WRAPPER METHODS
  // Legacy methods removed - use generateModelInsights instead

  async generateDetailedAnalysis(
    quizData: QuizData,
    topPath: BusinessPath,
  ): Promise<any> {
    console.warn(
      "generateDetailedAnalysis is deprecated. Use generatePersonalizedInsights instead.",
    );
    // Create a mock bottom path for backward compatibility
    const mockBottomPath = {
      id: "mock-bottom",
      name: "Mock Business Model",
      fitScore: 25,
      description: "Mock business model for backward compatibility",
      detailedDescription: "Mock business model for backward compatibility",
      difficulty: "Hard",
      timeToProfit: "6+ months",
      startupCost: "$2000+",
      potentialIncome: "$500-2K/month",
      pros: ["Mock compatibility"],
      cons: ["Low compatibility score"],
      tools: ["Mock tools"],
      skills: ["Mock skills"],
      icon: "",
      emoji: "💼",
      marketSize: "Small",
      averageIncome: { beginner: "$1K-3K", intermediate: "$3K-8K", advanced: "$8K-20K+" },
      userStruggles: ["Mock struggles"],
      solutions: ["Mock solutions"],
      bestFitPersonality: ["Mock personality"],
      resources: { platforms: ["Mock"], learning: ["Mock"], tools: ["Mock"] },
      actionPlan: { phase1: ["Mock"], phase2: ["Mock"], phase3: ["Mock"] }
    };
    return this.generatePersonalizedInsights(quizData, [topPath], [mockBottomPath]);
  }

  // Consolidated full report generation - replaces 4 separate calls with 1 call
  async generateFullReportContent(
    quizData: QuizData,
    topBusinessModels: any[],
  ): Promise<{
    businessFitDescriptions: { [key: string]: string };
    fullReportInsights: {
      customRecommendations: string[];
      potentialChallenges: string[];
    };
  }> {
    try {
      console.log("Generating consolidated full report content (1 AI call)");

      const userProfile = this.createUserProfile(
        quizData,
        topBusinessModels[0],
      );

      const response = await this.makeOpenAIRequest({
        messages: [
          {
            role: "system",
            content:
              "You are an AI business coach. Use JSON output. Use a professional and direct tone. Do not invent data.",
          },
          {
            role: "user",
            content: `Generate comprehensive business analysis for you based on your quiz data and top 3 business models.

Generate the following content:

1. Business Fit Descriptions: For each of the top 3 business models, write a single paragraph explaining why this model fits (or doesn't fit) your profile.

2. General Business Recommendations: 4-6 actionable recommendations for your entrepreneurial journey (not model-specific).

3. Potential Challenges: 4-5 challenges you might face based on your quiz responses and profile.

Top 3 Business Models:
${topBusinessModels.map((model, index) => `${index + 1}. ${model.name} (${model.score}% match)`).join("\n")}

Return exactly this JSON structure:
{
  "businessFitDescriptions": {
    "${topBusinessModels[0]?.id}": "Paragraph for model 1",
    "${topBusinessModels[1]?.id}": "Paragraph for model 2",
    "${topBusinessModels[2]?.id}": "Paragraph for model 3"
  },
  "customRecommendations": ["...", "...", "...", "...", "...", "..."],
  "potentialChallenges": ["...", "...", "...", "...", "..."]
}

CRITICAL RULES:
- Use only the data from your profile
- Do NOT invent data or use generic filler
- Each business fit description should be 1 focused paragraph
- Recommendations should be specific and actionable for you
- Challenges should be realistic based on your profile
- Max 1200 tokens total
- Always use "you" and "your" instead of "the user" or "the user's"

YOUR PROFILE:
${userProfile}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      });

      if (response && response.content) {
        try {
          // Clean up the response content to ensure valid JSON
          let cleanContent = response.content.trim();

          // Remove any potential markdown code blocks
          cleanContent = cleanContent
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "");

          // Find the JSON object (between first { and last })
          const firstBrace = cleanContent.indexOf("{");
          const lastBrace = cleanContent.lastIndexOf("}");

          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
          }

          const result = JSON.parse(cleanContent);
          console.log(
            "Consolidated full report content generated successfully",
          );
          return {
            businessFitDescriptions: result.businessFitDescriptions || {},
            fullReportInsights: {
              customRecommendations: result.customRecommendations || [],
              potentialChallenges: result.potentialChallenges || [],
            },
          };
        } catch (parseError) {
          console.error(
            "JSON parse error in generateFullReportContent:",
            response.content,
          );
          console.error("Parse error details:", parseError);
          throw parseError;
        }
      }

      throw new Error("No response from OpenAI");
    } catch (error) {
      console.error(
        "Error generating consolidated full report content:",
        error,
      );

      // Return fallback content
      const fallbackFitDescriptions: { [key: string]: string } = {};
      topBusinessModels.forEach((model) => {
        fallbackFitDescriptions[model.id] =
          `${model.name} appears to be a good match based on your quiz responses and entrepreneurial goals.`;
      });

      return {
        businessFitDescriptions: fallbackFitDescriptions,
        fullReportInsights: {
          customRecommendations: [
            "Focus on developing your core business skills",
            "Start with a minimum viable product to test the market",
            "Build a strong online presence and network",
            "Track your progress and adjust strategies as needed",
          ],
          potentialChallenges: [
            "Time management while building your business",
            "Learning new skills and technologies",
            "Finding and retaining customers",
            "Managing finances and cash flow",
          ],
        },
      };
    }
  }

  // Cleanup expired AI content from localStorage for anonymous users
  static cleanupExpiredLocalStorageContent(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      // Find all AI content keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("ai_content_")) {
          try {
            const storedData = localStorage.getItem(key);
            if (storedData) {
              const parsedData = JSON.parse(storedData);

              // Check if expired
              if (parsedData.expiresAt && now > parsedData.expiresAt) {
                keysToRemove.push(key);
                const expiresKey = `${key}_expires`;
                if (localStorage.getItem(expiresKey)) {
                  keysToRemove.push(expiresKey);
                }
              }
            }
          } catch (parseError) {
            // If we can't parse it, remove it
            keysToRemove.push(key);
          }
        }
      }

      // Remove expired content
      if (keysToRemove.length > 0) {
        console.log(
          ` Cleaning up ${keysToRemove.length} expired AI content items from localStorage`,
        );
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error(
        "❌ Error cleaning up expired AI content from localStorage:",
        error,
      );
    }
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
