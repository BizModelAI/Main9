import express from "express";

type Express = express.Express;
type Request = express.Request;
type Response = express.Response;
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { getUserIdFromRequest, getSessionKey } from "./auth.js";
import { generateBusinessResources } from "./services/resourceService.js";
import { pdfService } from "./services/pdfService.js";
import { emailService } from "./services/emailService.js";
import { aiScoringService } from "./services/aiScoringService.js";
import { personalityAnalysisService } from "./services/personalityAnalysisService.js";
import { db } from "./db.js";
import { users, unpaidUserEmails, quizAttempts, payments, type User, type QuizAttempt, type Payment } from "../shared/schema.js";
import { sql, eq } from "drizzle-orm";
import Stripe from "stripe";
import {
  Client,
  Environment,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { DatabaseStorage } from "./storage.js";
import { 
  getRatingDescription, 
  getIncomeGoalRange, 
  getTimeCommitmentRange, 
  getInvestmentRange 
} from "./utils/quizUtils.js";

// Secure session/user-based rate limiter for OpenAI requests
class OpenAIRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequestsPerUser = 50; // Max requests per user/session per hour
  private readonly windowMs = 60 * 60 * 1000; // 1 hour window
  private readonly maxAnonymousRequests = 10; // Lower limit for anonymous users
  private readonly cleanupInterval = 5 * 60 * 1000; // Clean up every 5 minutes

  constructor() {
    // Periodic cleanup to prevent memory leaks
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let totalCleaned = 0;

    for (const [key, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(
        (time) => now - time < this.windowMs,
      );
      if (validRequests.length === 0) {
        this.requests.delete(key);
        totalCleaned++;
      } else if (validRequests.length < timestamps.length) {
        this.requests.set(key, validRequests);
      }
    }

    if (totalCleaned > 0) {
      console.log(
        ` Rate limiter cleanup: removed ${totalCleaned} expired entries`,
      );
    }
  }

  canMakeRequest(userId?: number, sessionId?: string): boolean {
    // Use userId if authenticated, otherwise use sessionId
    const identifier = userId
      ? `user_${userId}`
      : `session_${sessionId || "anonymous"}`;
    const isAuthenticated = !!userId;
    const maxRequests = isAuthenticated
      ? this.maxRequestsPerUser
      : this.maxAnonymousRequests;

    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(
      (time) => now - time < this.windowMs,
    );

    if (recentRequests.length >= maxRequests) {
      console.warn(
        ` Rate limit exceeded for ${identifier}: ${recentRequests.length}/${maxRequests} requests`,
      );
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    console.log(
      `✅ Rate limit check passed for ${identifier}: ${recentRequests.length}/${maxRequests} requests`,
    );
    return true;
  }

  getRemainingRequests(userId?: number, sessionId?: string): number {
    const identifier = userId
      ? `user_${userId}`
      : `session_${sessionId || "anonymous"}`;
    const isAuthenticated = !!userId;
    const maxRequests = isAuthenticated
      ? this.maxRequestsPerUser
      : this.maxAnonymousRequests;

    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(
      (time) => now - time < this.windowMs,
    );

    return Math.max(0, maxRequests - recentRequests.length);
  }
}

const openaiRateLimiter = new OpenAIRateLimiter();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-06-30.basil",
    })
  : null;

// PayPal SDK configuration
const paypalClient =
  process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
    ? new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: process.env.PAYPAL_CLIENT_ID,
          oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
        },
        environment:
          process.env.NODE_ENV === "production"
            ? Environment.Production
            : Environment.Sandbox,
      })
    : null;

const ordersController = paypalClient
  ? new OrdersController(paypalClient)
  : null;

// Utility functions moved to aiScoringService.ts to avoid duplication

export async function registerRoutes(app: Express): Promise<void> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // CORS preflight handler for OpenAI chat endpoint
  app.options("/api/openai-chat", (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3001");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(200);
  });

  // OpenAI configuration status (secure - no sensitive info exposed)
  app.get("/api/openai-status", (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3001");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    const hasApiKey = !!process.env.OPENAI_API_KEY;

    res.json({
      configured: hasApiKey,
      status: hasApiKey ? "ready" : "not_configured",
    });
  });

  // Stripe configuration endpoint (secure - only exposes publishable key)
  app.get("/api/stripe-config", (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3001");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;

    res.json({
      publishableKey: publishableKey || null,
      configured: hasSecretKey,
      status: hasSecretKey ? "ready" : "not_configured",
    });
  });

  // General OpenAI chat endpoint
  app.post("/api/openai-chat", async (req: Request, res: Response) => {
    // Add CORS headers
    res.header("Access-Control-Allow-Origin", "http://localhost:3001");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    try {
      console.log(" OpenAI API request received:", {
        hasBody: !!req.body,
        promptLength: req.body?.prompt?.length || 0,
        maxTokens: req.body?.maxTokens,
        responseFormat: req.body?.responseFormat,
      });

      // Secure rate limiting based on user/session instead of IP
      const userId = await getUserIdFromRequest(req);
      const sessionId = req.sessionID || getSessionKey(req);

      if (!openaiRateLimiter.canMakeRequest(userId, sessionId)) {
        console.log("Rate limit exceeded for user/session:", userId || sessionId);
        return res.status(429).json({
          error: "Too many requests. Please wait a moment before trying again.",
        });
      }

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API key not configured");
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const {
        prompt,
        messages: directMessages,
        maxTokens = 1200,
        max_tokens,
        temperature = 0.7,
        responseFormat = null,
        systemMessage,
      } = req.body;

      let messages = [];

      // Support both old format (prompt + systemMessage) and new format (messages array)
      if (directMessages && Array.isArray(directMessages)) {
        // New format: messages array passed directly
        messages = directMessages;
      } else if (prompt) {
        // Old format: prompt + optional systemMessage
        if (systemMessage) {
          messages.push({
            role: "system",
            content: systemMessage,
          });
        }
        messages.push({
          role: "user",
          content: prompt,
        });
      } else {
        return res
          .status(400)
          .json({ error: "Either 'messages' array or 'prompt' is required" });
      }

      const requestBody: any = {
        model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency
        messages,
        max_tokens: max_tokens || maxTokens,
        temperature: temperature,
      };

      // Add response format if specified (for JSON responses)
      if (responseFormat) {
        requestBody.response_format = responseFormat;
      }

      // Add timeout to OpenAI request
      const openaiResponse = (await Promise.race([
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("OpenAI API request timed out after 30 seconds"),
              ),
            30000,
          ),
        ),
      ])) as Response;

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error(
          `OpenAI API error: ${openaiResponse.status}`,
          errorText,
        );
        throw new Error(
          `OpenAI API error: ${openaiResponse.status} - ${errorText}`,
        );
      }

      const data = await openaiResponse.json();
      console.log(
        "OpenAI API response received, content length:",
        data.choices?.[0]?.message?.content?.length || 0,
      );

      const content = data.choices[0].message.content;

      res.json({ content });
    } catch (error) {
      console.error("Error in OpenAI chat:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Handle rate limit errors specifically
      if (error instanceof Error && error.message.includes("429")) {
        console.warn(" Rate limited by OpenAI");
        res.status(429).json({
          error: "Rate limited by OpenAI",
          details: "Please try again in a few seconds",
          retry: true,
        });
      } else {
        res.status(500).json({
          error: "OpenAI API request failed",
          details: errorMessage,
        });
      }
    }
  });

  // Skills analysis endpoint using OpenAI
  app.post("/api/analyze-skills", async (req: Request, res: Response) => {
    try {
      const { quizData, requiredSkills, businessModel, userProfile } = req.body;

      const prompt = `
        Based on your quiz responses, analyze your current skill level for each required skill for ${businessModel}:

        YOUR PROFILE:
        ${userProfile}

        REQUIRED SKILLS:
        ${requiredSkills.map((skill: string) => `- ${skill}`).join("\n")}

        For each skill, determine:
        1. Status: "have" (you already have this skill), "working-on" (you have some experience but need development), or "need" (you don't have this skill)
        2. Confidence: 1-10 score of how confident you are in this assessment
        3. Reasoning: Brief explanation of why you categorized it this way

        Return a JSON object with this structure:
        {
          "skillAssessments": [
            {
              "skill": "skill name",
              "status": "have" | "working-on" | "need",
              "confidence": 1-10,
              "reasoning": "brief explanation"
            }
          ]
        }

        Base your assessment on:
        - Your experience level and existing skills
        - Your learning preferences and willingness to learn
        - Your time commitment and motivation
        - Your tech comfort level
        - Your communication and work preferences
        - Your past tools and experience indicators
      `;

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency
            messages: [
              {
                role: "system",
                content:
                  "You are an expert career coach and skills assessor. Analyze profiles and provide accurate skill assessments for business models. Always address the user directly using 'you' and 'your'.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        },
      );

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0].message.content;
      const result = JSON.parse(content);

      // Store skills analysis in database if user is authenticated
      try {
        const userId = await getUserIdFromRequest(req);
        if (userId) {
          const attempts = await storage.getQuizAttempts(userId);
          const quizAttemptId = attempts.length > 0 ? attempts[0].id : undefined;
          if (quizAttemptId) {
            await storage.saveAIContentToQuizAttempt(
              quizAttemptId,
              `skills_${businessModel}`,
              result,
            );
            console.log(
              `✅ Skills analysis for ${businessModel} stored in database`,
            );
          }
        }
      } catch (dbError) {
        // Import error handler dynamically to avoid circular dependencies
        const { ErrorHandler } = await import("./utils/errorHandler.js");
        await ErrorHandler.handleStorageError(dbError as Error, {
          operation: "store_skills_analysis",
          context: {},
          isCritical: false, // Non-critical as the main result is still returned
          shouldThrow: false,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error in skills analysis:", error);

      // Return fallback analysis
      const { requiredSkills } = req.body;
      const third = Math.ceil(requiredSkills.length / 3);

      const fallbackResult = {
        skillAssessments: [
          ...requiredSkills.slice(0, third).map((skill: string) => ({
            skill,
            status: "have",
            confidence: 7,
            reasoning:
              "Based on your quiz responses, you show strong aptitude for this skill",
          })),
          ...requiredSkills.slice(third, third * 2).map((skill: string) => ({
            skill,
            status: "working-on",
            confidence: 6,
            reasoning:
              "You have some experience but could benefit from further development",
          })),
          ...requiredSkills.slice(third * 2).map((skill: string) => ({
            skill,
            status: "need",
            confidence: 8,
            reasoning:
              "This skill would need to be developed for optimal success",
          })),
        ],
      };

      // Store fallback skills analysis in database if user is authenticated
      try {
        const userId = await getUserIdFromRequest(req);
        if (userId) {
          const attempts = await storage.getQuizAttempts(userId);
          const quizAttemptId = attempts.length > 0 ? attempts[0].id : undefined;
          if (quizAttemptId) {
            const { businessModel } = req.body;
            await storage.saveAIContentToQuizAttempt(
              quizAttemptId,
              `skills_${businessModel}`,
              fallbackResult,
            );
            console.log(
              `✅ Fallback skills analysis for ${businessModel} stored in database`,
            );
          }
        }
      } catch (dbError) {
        const { ErrorHandler } = await import("./utils/errorHandler.js");
        await ErrorHandler.handleStorageError(dbError as Error, {
          operation: "store_fallback_skills_analysis",
          context: {},
          isCritical: false,
          shouldThrow: false,
        });
      }

      res.json(fallbackResult);
    }
  });

  // AI-powered business fit scoring endpoint
  app.post(
    "/api/ai-business-fit-analysis",
    async (req: Request, res: Response) => {
      console.log(" AI business fit analysis request received");

      try {
        // Rate limiting for concurrent quiz takers
        const clientIP = req.ip || req.connection.remoteAddress || "unknown";
        if (!openaiRateLimiter.canMakeRequest(clientIP)) {
          console.log("❌ Rate limit exceeded for IP:", clientIP);
          return res.status(429).json({
            error:
              "Too many requests. Please wait a moment before trying again.",
          });
        }

        const { quizData } = req.body;

        if (!quizData) {
          console.log("❌ No quiz data provided");
          return res.status(400).json({ error: "Quiz data is required" });
        }

        // Add timeout to prevent hanging requests
        const analysisPromise = aiScoringService.analyzeBusinessFit(quizData);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Analysis timed out after 35 seconds")),
            35000,
          ),
        );

        const analysis = await Promise.race([analysisPromise, timeoutPromise]);
        console.log("AI business fit analysis completed successfully");
        res.json(analysis);
      } catch (error) {
        console.error("Error in AI business fit analysis:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : "No stack trace",
        });
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          error: "Failed to analyze business fit",
          details: errorMessage,
        });
      }
    },
  );

  // AI-powered personality analysis endpoint
  app.post(
    "/api/ai-personality-analysis",
    async (req: Request, res: Response) => {
      try {
        const { quizData } = req.body;

        if (!quizData) {
          return res.status(400).json({ error: "Quiz data is required" });
        }

        const analysis =
          await personalityAnalysisService.analyzePersonality(quizData);
        res.json(analysis);
      } catch (error) {
        console.error("Error in AI personality analysis:", error);
        res.status(500).json({ error: "Failed to analyze personality" });
      }
    },
  );

  // Income projections endpoint using hardcoded data
  app.post(
    "/api/generate-income-projections",
    async (req: Request, res: Response) => {
      try {
        const { businessId } = req.body;

        if (!businessId) {
          return res.status(400).json({ error: "Business ID is required" });
        }

        // Use hardcoded projections based on business model
        const projections = getFallbackProjections(businessId);
        res.json(projections);
      } catch (error) {
        console.error("Error generating income projections:", error);
        res
          .status(500)
          .json({ error: "Failed to generate income projections" });
      }
    },
  );

  function getFallbackProjections(businessId: string) {
    const baseData: any = {
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
    };

    return baseData[businessId] || baseData["affiliate-marketing"];
  }

  // Quiz retake system endpoints
  app.get(
    "/api/quiz-retake-status/:userId",
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        let user = await storage.getUser(userId);

        // Create user if doesn't exist (for testing)
        if (!user) {
          user = await storage.createUser({
            email: `user${userId}@example.com`,
            password: "test123",
          });
        }

        const attemptsCount = await storage.getQuizAttemptsCount(userId);

        // Pure pay-per-report system logic:
        // - Everyone can take unlimited quiz attempts for free
        // - They pay per report unlock

        const isFirstQuiz = attemptsCount === 0;

        res.json({
          canRetake: true, // Everyone can always retake
          attemptsCount,

          quizRetakesRemaining: 999, // Unlimited for everyone
          totalQuizRetakesUsed: 0, // Not used in new system, always 0
          isFirstQuiz,
          isFreeQuizUsed: attemptsCount > 0,
          isGuestUser: false, // No longer relevant since everyone can take quizzes
        });
      } catch (error) {
        console.error("Error getting quiz retake status:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  app.post("/api/quiz-attempt", async (req: Request, res: Response) => {
    try {
      const { userId, quizData } = req.body;

      if (!userId || !quizData) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.createUser({
          email: `user${userId}@example.com`,
          password: "test123",
        });
      }

      const attemptsCount = await storage.getQuizAttemptsCount(userId);
      const isPaid = await storage.isPaidUser(userId);

      // Pure pay-per-report system logic:
      // - Everyone can take unlimited quiz attempts for free
      // - They pay per report unlock when they want full reports

      // Record the quiz attempt - stored permanently for all users now
      const attempt = await storage.recordQuizAttempt({
        userId,
        quizData,
      });

      // No retake decrements in the new system
      console.log("Pay-per-quiz model - no retakes to decrement");

      res.json({
        success: true,
        attemptId: attempt.id,
        message: isPaid
          ? "Quiz attempt recorded permanently"
          : "Quiz attempt recorded (unpaid users: data retained for 24 hours)",
        isPaidUser: isPaid,
        dataRetentionPolicy: isPaid ? "permanent" : "24_hours",
      });
    } catch (error) {
      console.error("Error recording quiz attempt:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get quiz attempts history for a user
  app.get("/api/quiz-attempts/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = getUserIdFromRequest(req);

      // Check if user is authenticated
      if (!currentUserId) {
        console.log("Quiz attempts: Not authenticated", {
          sessionUserId: req.session?.userId,
          cacheUserId: currentUserId,
          sessionKey: getSessionKey(req),
        });
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if user is requesting their own data
      if (currentUserId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      let user = await storage.getUser(userId);

      if (!user) {
        user = await storage.createUser({
          email: `user${userId}@example.com`,
          password: "test123",
        });
      }

      const attempts = await storage.getQuizAttempts(userId);
      console.log(
        `Quiz attempts for user ${userId}: Found ${attempts.length} attempts`,
      );
      if (attempts.length > 0) {
        console.log(
          `Latest attempt: ID ${attempts[0].id}, completed at ${attempts[0].completedAt}`,
        );
      }
      res.json(attempts);
    } catch (error) {
      console.error("Error getting quiz attempts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Save AI content for a specific quiz attempt
  app.post(
    "/api/quiz-attempts/:quizAttemptId/ai-content",
    async (req: Request, res: Response) => {
      try {
        const quizAttemptId = parseInt(req.params.quizAttemptId);
        const { contentType, content, aiContent } = req.body;
        const currentUserId = getUserIdFromRequest(req);

        if (!currentUserId) {
          return res.status(401).json({ error: "Not authenticated" });
        }

        // Support both new format (contentType + content) and old format (aiContent)
        const contentToSave = aiContent || content;
        if (!contentToSave) {
          return res.status(400).json({ error: "AI content is required" });
        }

        // Verify the quiz attempt belongs to the current user
        const attempts = await storage.getQuizAttempts(currentUserId);
        const attempt = attempts.find((a) => a.id === quizAttemptId);

        if (!attempt) {
          return res
            .status(404)
            .json({ error: "Quiz attempt not found or unauthorized" });
        }

        // If using new format with contentType, save content by type using new table
        if (contentType) {
          await storage.saveAIContentToQuizAttempt(
            quizAttemptId,
            contentType,
            contentToSave,
          );
        } else {
          // Old format - save as generic content type
          await storage.saveAIContentToQuizAttempt(
            quizAttemptId,
            "legacy",
            contentToSave,
          );
        }

        console.log(
          `AI content (${contentType || "full"}) saved for quiz attempt ${quizAttemptId}`,
        );
        res.json({ success: true, message: "AI content saved successfully" });
      } catch (error) {
        console.error("Error saving AI content:", error);

        // Provide more specific error messages
        if (
          error instanceof Error &&
          error.message.includes("ai_content table is missing")
        ) {
          res.status(500).json({
            error: "Database migration required",
            details:
              "The ai_content table is missing. Please run database migration.",
            migration_endpoint: "/api/admin/fix-database-schema",
          });
        } else {
          res.status(500).json({
            error: "Failed to save AI content",
            details: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    },
  );

  // Get AI content for a specific quiz attempt
  app.get(
    "/api/quiz-attempts/:quizAttemptId/ai-content",
    async (req: Request, res: Response) => {
      try {
        const quizAttemptId = parseInt(req.params.quizAttemptId);
        const currentUserId = getUserIdFromRequest(req);

        if (!currentUserId) {
          return res.status(401).json({ error: "Not authenticated" });
        }

        // Verify the quiz attempt belongs to the current user
        const attempts = await storage.getQuizAttempts(currentUserId);
        const attempt = attempts.find((a) => a.id === quizAttemptId);

        if (!attempt) {
          return res
            .status(404)
            .json({ error: "Quiz attempt not found or unauthorized" });
        }

        const aiContent =
          await storage.getAIContentForQuizAttempt(quizAttemptId);
        const contentType = req.query.type as string;

        console.log(
          `AI content retrieved for quiz attempt ${quizAttemptId}:`,
          !!aiContent,
        );

        // If specific content type requested, return just that part
        if (contentType && aiContent && typeof aiContent === "object") {
          const specificContent = aiContent[contentType];
          if (specificContent) {
            res.json({ content: specificContent });
          } else {
            res
              .status(404)
              .json({ error: `Content type '${contentType}' not found` });
          }
        } else {
          // Return full content for backward compatibility
          res.json({ aiContent });
        }
      } catch (error) {
        console.error("Error getting AI content:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Get latest quiz data for authenticated user (for business model pages)
  app.get("/api/auth/latest-quiz-data", async (req: Request, res: Response) => {
    console.log("LATEST QUIZ DATA: Endpoint called!");
    console.log("API: GET /api/auth/latest-quiz-data", {
      sessionId: req.sessionID,
      userId: req.session?.userId,
      hasCookie: !!req.headers.cookie,
    });

    try {
      // Debug session information before calling getUserIdFromRequest
      const sessionKey = getSessionKey(req);
      console.log("Latest quiz data: Session debug", {
        sessionUserId: req.session?.userId,
        sessionKey: sessionKey,
        userAgent: req.headers["user-agent"]?.substring(0, 50) + "...",
        ip: req.ip || req.connection.remoteAddress,
      });

      const userId = getUserIdFromRequest(req);
      console.log("Latest quiz data: getUserIdFromRequest returned", userId);

      if (!userId) {
        console.log(
          "Latest quiz data: No userId found via getUserIdFromRequest",
        );

        // Debug: Check user 5 specifically to see if quiz data exists
        const attemptForUser5 = await storage.getQuizAttempts(5);
        console.log(
          `Latest quiz data: User 5 has ${attemptForUser5.length} quiz attempts`,
        );
        if (attemptForUser5.length > 0) {
          console.log(
            `Latest quiz data: User 5 latest attempt: ID ${attemptForUser5[0].id}, completed at ${attemptForUser5[0].completedAt}`,
          );

          // For development: if user 5 has quiz data and we know this is probably them, return it
          if (process.env.NODE_ENV === "development") {
            console.log(
              "Latest quiz data: Development mode - returning user 5 data",
            );
            return res.json(attemptForUser5[0].quizData);
          }
        }

        console.log("Latest quiz data: Not authenticated - returning 401", {
          sessionUserId: req.session?.userId,
          cacheUserId: userId,
          sessionKey: getSessionKey(req),
        });
        return res.status(401).json({ error: "Not authenticated" });
      }

      console.log(
        `Latest quiz data: Authenticated user ${userId}, fetching attempts`,
      );

      console.log(`Latest quiz data: Fetching attempts for user ${userId}`);
      const attempts = await storage.getQuizAttempts(userId);
      console.log(
        `Latest quiz data: Found ${attempts.length} attempts for user ${userId}`,
      );

      if (attempts.length > 0) {
        console.log(
          `Latest quiz data: Returning quiz data for user ${userId}, attempt ${attempts[0].id}`,
        );
        res.json(attempts[0].quizData); // Most recent attempt
      } else {
        console.log(
          `Latest quiz data: No attempts found for user ${userId}, returning null`,
        );
        res.json(null);
      }
    } catch (error) {
      console.error("Error getting latest quiz data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get latest PAID quiz data for authenticated user (for navigation guard)
  app.get(
    "/api/auth/latest-paid-quiz-data",
    async (req: Request, res: Response) => {
      console.log("API: GET /api/auth/latest-paid-quiz-data", {
        sessionId: req.sessionID,
        userId: req.session?.userId,
        hasCookie: !!req.headers.cookie,
      });

      try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
          return res.status(401).json({ error: "Not authenticated" });
        }

        console.log(`Latest paid quiz data: Fetching for user ${userId}`);

        // Get user info
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const attempts = await storage.getQuizAttempts(userId);
        console.log(`Latest paid quiz data: Found ${attempts.length} attempts`);

        if (attempts.length === 0) {
          console.log("Latest paid quiz data: No attempts found");
          return res.json(null);
        }

        // In pure pay-per-report model: all logged-in users have access to their latest quiz data
        // They just need to pay per report unlock if they want full reports
        const latestAttempt = attempts[0]; // attempts are sorted by most recent
        console.log(
          `Latest paid quiz data: Returning latest attempt ${latestAttempt.id}`,
        );
        return res.json({
          quizData: latestAttempt.quizData,
          quizAttemptId: latestAttempt.id,
          isUnlocked: true,
        });
      } catch (error) {
        console.error("Error getting latest paid quiz data:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Save quiz data with 3-tier caching system
  app.post("/api/save-quiz-data", async (req: Request, res: Response) => {
    console.log("API: POST /api/save-quiz-data", {
      sessionId: req.sessionID,
      userId: req.session?.userId,
      hasCookie: !!req.headers.cookie,
    });

    try {
      const { quizData, email, paymentId } = req.body;
      if (!quizData) {
        console.log("Save quiz data: No quiz data provided");
        return res.status(400).json({ error: "Quiz data is required" });
      }

      const sessionKey = getSessionKey(req);
      const userId = getUserIdFromRequest(req);

      console.log("Save quiz data: Processing with", {
        sessionKey,
        userId,
        hasEmail: !!email,
        userType: userId
          ? "authenticated"
          : email
            ? "email-provided"
            : "anonymous",
      });

      // TIER 1: Authenticated users - permanent database storage
      if (userId) {
        const user = await storage.getUser(userId);
        const isPaid = await storage.isPaidUser(userId);

        console.log(
          `Save quiz data: Authenticated user ${userId}, isPaid: ${isPaid}`,
        );

        // Check if user already has a recent quiz attempt (within last 10 minutes)
        const recentAttempts = await storage.getQuizAttempts(userId);
        const recentAttempt = recentAttempts.find(attempt => {
          const attemptTime = new Date(attempt.completedAt).getTime();
          const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
          return attemptTime > tenMinutesAgo;
        });

        if (recentAttempt) {
          console.log(
            `Save quiz data: Found recent quiz attempt ${recentAttempt.id} for user ${userId}, reusing existing attempt`,
          );
          return res.json({
            success: true,
            attemptId: recentAttempt.id,
            message: "Using existing quiz attempt",
            quizAttemptId: recentAttempt.id,
            storageType: "permanent",
            userType: isPaid ? "paid" : "authenticated",
            isExisting: true,
          });
        }

        // Save quiz data to user's account (permanent storage)
        const attempt = await storage.recordQuizAttempt({
          userId: userId,
          quizData,
        });

        console.log(
          `Save quiz data: Quiz attempt recorded with ID ${attempt.id} for authenticated user ${userId}`,
        );

        return res.json({
          success: true,
          attemptId: attempt.id,
          message: "Quiz data saved permanently",
          quizAttemptId: attempt.id,
          storageType: "permanent",
          userType: isPaid ? "paid" : "authenticated",
        });
      }

      // TIER 2: Users with email (unpaid) - 3-month database storage with expiration
      if (email) {
        let tempUser: User;
        let attempt: QuizAttempt;
        console.log(
          `Save quiz data: Processing email user: ${email}`,
        );

        // Check if ANY user (paid or temporary) already exists for this email
        const existingUser = await storage.getUserByEmail(email);
        
        if (existingUser && !existingUser.isTemporary) {
          // Found a paid user with this email
          console.log(`Save quiz data: Found existing paid user for email: ${email}`);
          return res.json({
            success: true,
            message: "You already have a paid account. Please log in to save your results permanently.",
            userType: "existing-paid",
            existingUserId: existingUser.id,
            suggestion: "login",
          });
        }
        
        if (existingUser && existingUser.isTemporary) {
          // Found a temporary user with this email - use it
          tempUser = existingUser;
          await storage.updateUser(tempUser.id, {
            sessionId: sessionKey,
            updatedAt: new Date(),
          });
          console.log(`Save quiz data: Updated session for existing temporary user for email: ${email}`);
          
          // Check if user already has a recent quiz attempt (within last 10 minutes)
          const recentAttempts = await storage.getQuizAttempts(tempUser.id);
          const recentAttempt = recentAttempts.find(attempt => {
            const attemptTime = new Date(attempt.completedAt).getTime();
            const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
            return attemptTime > tenMinutesAgo;
          });

          if (recentAttempt) {
            console.log(
              `Save quiz data: Found recent quiz attempt ${recentAttempt.id} for temporary user ${tempUser.id}, reusing existing attempt`,
            );
            return res.json({
              success: true,
              attemptId: recentAttempt.id,
              message: "Using existing quiz attempt",
              quizAttemptId: recentAttempt.id,
              storageType: "temporary",
              userType: "email-provided",
              isExisting: true,
              expiresAt: tempUser.expiresAt,
            });
          }
        } else {
          // No user exists with this email - create new temporary user
          tempUser = await storage.storeTemporaryUser(sessionKey, email, {
            quizData,
            password: "",
          });
          console.log(`Save quiz data: Created new temporary user for email: ${email}`);
        }
        
        // Create quiz attempt for the user
        attempt = await storage.recordQuizAttempt({
          userId: tempUser.id,
          quizData,
        });

        console.log(
          `Save quiz data: New quiz attempt recorded with ID ${attempt.id} for temporary user ${tempUser.id} (${email})`,
        );

        return res.json({
          success: true,
          attemptId: attempt.id,
          message: "New quiz attempt saved for 3 months",
          quizAttemptId: attempt.id,
          storageType: "temporary",
          userType: "email-provided",
          expiresAt: tempUser.expiresAt,
          warning:
            "Your data will be automatically deleted after 3 months unless you upgrade to a paid account.",
        });
      }

      // TIER 3: Anonymous users (no email) - localStorage only, no database storage
      console.log(
        "Save quiz data: Anonymous user - returning localStorage instruction",
      );
      return res.json({
        success: true,
        message: "Quiz data saved locally",
        storageType: "local",
        userType: "anonymous",
        warning: "Your data is only saved in this browser. Clear your browser data to lose it.",
      });
    } catch (error) {
      console.error("Error saving quiz data:", error);
      res.status(500).json({
        error: "Failed to save quiz data",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Test endpoint removed for production

  // Test endpoint removed for production

  // Test endpoint removed for production

  // Test endpoint removed for production

  // Test endpoint removed for production

  // Check for existing quiz attempts by email
  app.get("/api/check-existing-attempts/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      console.log(`Checking existing attempts for email: ${email}`);

      // Check for ANY user (paid or temporary) with this email
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser && !existingUser.isTemporary) {
        // Paid user
        const attempts = await storage.getQuizAttemptsByUserId(existingUser.id);
        return res.json({
          hasAccount: true,
          userType: "paid",
          userId: existingUser.id,
          attemptsCount: attempts.length,
          latestAttempt: attempts.length > 0 ? attempts[0] : null,
          message: "You have a paid account. Please log in to access your results.",
        });
      }
      
      if (existingUser && existingUser.isTemporary) {
        // Temporary user - treat as no real account
        return res.json({
          hasAccount: false,
          userType: "temporary",
          message: "Temporary user exists, but no real account. You can proceed to payment.",
        });
      }

      // No existing account
      return res.json({
        hasAccount: false,
        userType: "new",
        message: "No existing account found for this email.",
      });

    } catch (error) {
      console.error("Error checking existing attempts:", error);
      res.status(500).json({
        error: "Failed to check existing attempts",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Legacy endpoint for backward compatibility
  app.post("/api/auth/save-quiz-data", async (req: Request, res: Response) => {
    console.log(
      "API: Legacy /api/auth/save-quiz-data redirecting to new endpoint",
    );

    // Ensure user is authenticated for legacy endpoint
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Add userId to body and forward to new endpoint
    req.body.userId = userId;

    // Call new endpoint logic
    const { quizData, paymentId } = req.body;
    if (!quizData) {
      return res.status(400).json({ error: "Quiz data is required" });
    }

    try {
      const user = await storage.getUser(userId);
      const isPaid = await storage.isPaidUser(userId);

      // Check if user already has a recent quiz attempt (within last 5 minutes)
      const recentAttempts = await storage.getQuizAttempts(userId);
      const recentAttempt = recentAttempts.find(attempt => {
        const attemptTime = new Date(attempt.completedAt).getTime();
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return attemptTime > fiveMinutesAgo;
      });

      if (recentAttempt) {
        console.log(
          `Legacy save quiz data: Found recent quiz attempt ${recentAttempt.id} for user ${userId}, skipping duplicate creation`,
        );
        return res.json({
          success: true,
          attemptId: recentAttempt.id,
          message: "Using existing quiz attempt",
          isFirstQuiz: false,
          requiresPayment: false,
          quizAttemptId: recentAttempt.id,
          isExisting: true,
        });
      }

      const attempt = await storage.recordQuizAttempt({
        userId: userId,
        quizData,
      });

      console.log(
        `Legacy save quiz data: Quiz attempt recorded with ID ${attempt.id} for user ${userId}`,
      );

      res.json({
        success: true,
        attemptId: attempt.id,
        message: "Quiz data saved successfully",
        isFirstQuiz: (await storage.getQuizAttempts(userId)).length === 1,
        requiresPayment: false,
        quizAttemptId: attempt.id,
      });
    } catch (error) {
      console.error("Error in legacy save quiz data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Access pass concept removed - use report unlock payments instead

  // Get pricing for user without creating payment intent
  app.get("/api/user-pricing/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Determine pricing: $9.99 for first report, $4.99 for subsequent reports
      const payments = await storage.getPaymentsByUser(parseInt(userId));
      const completedReportPayments = payments.filter(
        (p) => p.status === "completed" && p.type === "report_unlock",
      );
      const isFirstReport = completedReportPayments.length === 0;
      const amountDollar = isFirstReport ? "9.99" : "4.99";

      res.json({
        success: true,
        amount: amountDollar,
        isFirstReport,
      });
    } catch (error) {
      console.error("Error getting user pricing:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create payment for unlocking full report ($9.99 first, $4.99 subsequent for logged users)
  app.post(
    "/api/create-report-unlock-payment",
    async (req: Request, res: Response) => {
      try {
        let { userId, quizAttemptId, email } = req.body;

        console.log("Payment endpoint called with:", { userId, quizAttemptId, email });

        // First, verify that the quiz attempt exists
        if (!quizAttemptId) {
          return res.status(400).json({ error: "Missing quizAttemptId" });
        }

        const parsedQuizAttemptId = parseInt(quizAttemptId.toString());
        console.log(`Parsed quiz attempt ID:`, parsedQuizAttemptId);
        
        // Direct database query to find the quiz attempt
        if (!db) {
          return res.status(500).json({ error: "Database not available" });
        }
        
        console.log(`Looking for quiz attempt ${parsedQuizAttemptId} in database...`);
        const quizAttemptResult = await db.select().from(quizAttempts).where(eq(quizAttempts.id, parsedQuizAttemptId));
        console.log(`Direct database query result:`, quizAttemptResult);
        
        if (!quizAttemptResult || quizAttemptResult.length === 0) {
          console.error(`Quiz attempt ${quizAttemptId} not found in database`);
          return res.status(404).json({ 
            error: "Quiz attempt not found",
            details: `Quiz attempt ID ${quizAttemptId} does not exist`
          });
        }
        
        const quizAttempt = quizAttemptResult[0];
        console.log(`Found quiz attempt:`, quizAttempt);
        
        // Now find the user who created this quiz attempt
        console.log(`Looking for user ${quizAttempt.userId} who created the quiz attempt...`);
        const userResult = await db.select().from(users).where(eq(users.id, quizAttempt.userId));
        console.log(`User query result:`, userResult);
        
        if (!userResult || userResult.length === 0) {
          console.error(`User ${quizAttempt.userId} not found for quiz attempt ${quizAttemptId}`);
          return res.status(404).json({ 
            error: "User not found",
            details: `User ID ${quizAttempt.userId} does not exist`
          });
        }
        
        const user = userResult[0];
        console.log(`Found user:`, { id: user.id, email: user.email });
        
        // Use the user ID from the quiz attempt, not from the request
        userId = user.id;

        // Check if report is already unlocked
        const paymentsResult = await db.select().from(payments).where(eq(payments.userId, userId));
        const existingPayment = paymentsResult.find(
          (p) =>
            p.quizAttemptId === quizAttemptId &&
            p.type === "report_unlock" &&
            p.status === "completed",
        );

        if (existingPayment) {
          return res.status(400).json({
            error: "Report is already unlocked for this quiz attempt",
          });
        }

        // Determine pricing: $9.99 for first report, $4.99 for subsequent reports
        const completedReportPayments = paymentsResult.filter(
          (p) => p.status === "completed" && p.type === "report_unlock",
        );
        const isFirstReport = completedReportPayments.length === 0;
        const amount = isFirstReport ? 999 : 499; // $9.99 or $4.99 in cents
        const amountDollar = isFirstReport ? "9.99" : "4.99";

        // Create Stripe Payment Intent
        if (!stripe) {
          return res
            .status(500)
            .json({ error: "Payment processing not configured" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          metadata: {
            userId: userId.toString(),
            type: "report_unlock",
            quizAttemptId: quizAttemptId.toString(),
            isFirstReport: isFirstReport.toString(),
            isTemporaryUser: user.isTemporary ? "true" : "false",
            email: user.email,
          },
          description: `BizModelAI Report Unlock - ${isFirstReport ? "First report" : "Additional report"}`,
        });

        console.log(`Creating payment record with:`, {
          userId,
          amount: amountDollar,
          currency: "usd",
          type: "report_unlock",
          status: "pending",
          quizAttemptId: quizAttemptId,
          stripePaymentIntentId: paymentIntent.id,
        });

        try {
          // Create payment record directly in database
          const [payment] = await db.insert(payments).values({
            userId,
            amount: amountDollar,
            currency: "usd",
            type: "report_unlock",
            status: "pending",
            quizAttemptId: quizAttemptId,
            stripePaymentIntentId: paymentIntent.id,
            version: 1,
          }).returning();

          console.log(`Payment record created successfully:`, payment);

          res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentId: payment.id,
            amount: amountDollar,
            isFirstReport,
          });
        } catch (paymentError: any) {
          console.error("Error creating payment record:", paymentError);
          
          // If it's a foreign key constraint error, provide a more helpful message
          if (paymentError.message && paymentError.message.includes('foreign key constraint')) {
            console.error("Foreign key constraint error - quiz attempt may not exist");
            return res.status(400).json({
              error: "Quiz attempt not found",
              details: `The quiz attempt (ID: ${quizAttemptId}) could not be found. Please try again or contact support.`
            });
          }
          
          throw paymentError; // Re-throw other errors
        }
      } catch (error: any) {
        console.error("Error creating report unlock payment:", error);
        console.error("Error details:", {
          type: error?.type,
          message: error?.message,
          code: error?.code,
          stack: error?.stack
        });
        res.status(500).json({ 
          error: "Internal server error",
          details: error?.message || "Unknown error"
        });
      }
    },
  );

  // Quiz attempts are now free for everyone - no payment needed

  // Check if report is unlocked for a specific quiz attempt
  app.get(
    "/api/report-unlock-status/:userId/:quizAttemptId",
    async (req: Request, res: Response) => {
      try {
        const { userId, quizAttemptId } = req.params;

        const payments = await storage.getPaymentsByUser(parseInt(userId));
        const unlockPayment = payments.find(
          (p) =>
            p.quizAttemptId === parseInt(quizAttemptId) &&
            p.type === "report_unlock" &&
            p.status === "completed",
        );

        res.json({
          isUnlocked: !!unlockPayment,
          paymentId: unlockPayment?.id || null,
        });
      } catch (error) {
        console.error("Error checking report unlock status:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // PayPal payment creation endpoint for report unlock
  app.post(
    "/api/create-paypal-payment",
    async (req: Request, res: Response) => {
      try {
        if (!ordersController) {
          return res.status(500).json({ error: "PayPal not configured" });
        }

        let { userId, quizAttemptId, email } = req.body;

        console.log("PayPal endpoint called with:", { userId, quizAttemptId, email });

        // First, verify that the quiz attempt exists
        if (!quizAttemptId) {
          return res.status(400).json({ error: "Missing quizAttemptId" });
        }

        const parsedQuizAttemptId = parseInt(quizAttemptId.toString());
        console.log(`Parsed quiz attempt ID:`, parsedQuizAttemptId);
        
        // Direct database query to find the quiz attempt
        if (!db) {
          return res.status(500).json({ error: "Database not available" });
        }
        
        console.log(`Looking for quiz attempt ${parsedQuizAttemptId} in database...`);
        const quizAttemptResult = await db.select().from(quizAttempts).where(eq(quizAttempts.id, parsedQuizAttemptId));
        console.log(`Direct database query result:`, quizAttemptResult);
        
        if (!quizAttemptResult || quizAttemptResult.length === 0) {
          console.error(`Quiz attempt ${quizAttemptId} not found in database`);
          return res.status(404).json({ 
            error: "Quiz attempt not found",
            details: `Quiz attempt ID ${quizAttemptId} does not exist`
          });
        }
        
        const quizAttempt = quizAttemptResult[0];
        console.log(`Found quiz attempt:`, quizAttempt);
        
        // Now find the user who created this quiz attempt
        console.log(`Looking for user ${quizAttempt.userId} who created the quiz attempt...`);
        const userResult = await db.select().from(users).where(eq(users.id, quizAttempt.userId));
        console.log(`User query result:`, userResult);
        
        if (!userResult || userResult.length === 0) {
          console.error(`User ${quizAttempt.userId} not found for quiz attempt ${quizAttemptId}`);
          return res.status(404).json({ 
            error: "User not found",
            details: `User ID ${quizAttempt.userId} does not exist`
          });
        }
        
        const user = userResult[0];
        console.log(`Found user:`, { id: user.id, email: user.email });
        
        userId = user.id;

        // Check if report is already unlocked
        const paymentsResult = await db.select().from(payments).where(eq(payments.userId, userId));
        const existingPayment = paymentsResult.find(
          (p) =>
            p.quizAttemptId === quizAttemptId &&
            p.type === "report_unlock" &&
            p.status === "completed",
        );

        if (existingPayment) {
          return res.status(400).json({
            error: "Report is already unlocked for this quiz attempt",
          });
        }

        // Determine pricing: $9.99 for first report, $4.99 for subsequent reports
        const completedPayments = paymentsResult.filter(
          (p) => p.status === "completed",
        );
        const isFirstReport = completedPayments.length === 0;
        const amount = isFirstReport ? "9.99" : "4.99";
        const paymentType = "report_unlock";
        const description = `BizModelAI Report Unlock - ${isFirstReport ? "First report" : "Additional report"}`;

        // Create PayPal order
        const request = {
          body: {
            intent: "CAPTURE" as any,
            purchaseUnits: [
              {
                amount: {
                  currencyCode: "USD",
                  value: amount,
                },
                description: description,
                customId: JSON.stringify({
                  userId: userId.toString(),
                  type: paymentType,
                  quizAttemptId: quizAttemptId.toString(),
                  isFirstReport: isFirstReport.toString(),
                }),
              },
            ],
            applicationContext: {
              returnUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success`,
              cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-cancelled`,
            },
          },
        };

        const order = await ordersController.createOrder(request);

        if (!order.result?.id) {
          throw new Error("Failed to create PayPal order");
        }

        // Create payment record directly in database
        const [payment] = await db.insert(payments).values({
          userId,
          amount: amount,
          currency: "usd",
          type: paymentType,
          status: "pending",
          quizAttemptId: quizAttemptId,
          paypalOrderId: order.result.id,
          version: 1,
        }).returning();

        res.json({
          success: true,
          orderID: order.result.id,
          paymentId: payment.id,
        });
      } catch (error: any) {
        console.error("Error creating PayPal payment:", error);
        console.error("Error details:", {
          message: error?.message,
          code: error?.code,
          stack: error?.stack
        });
        
        // Provide more specific error messages
        if (error?.message?.includes('authentication')) {
          return res.status(500).json({ 
            error: "PayPal authentication failed",
            details: "Please check PayPal credentials"
          });
        }
        
        if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
          return res.status(500).json({ 
            error: "PayPal service temporarily unavailable",
            details: "Please try again later"
          });
        }
        
        res.status(500).json({ 
          error: "PayPal payment creation failed",
          details: error?.message || "Unknown error"
        });
      }
    },
  );

  // PayPal payment capture endpoint
  app.post(
    "/api/capture-paypal-payment",
    async (req: Request, res: Response) => {
      try {
        if (!ordersController) {
          return res.status(500).json({ error: "PayPal not configured" });
        }

        const { orderID } = req.body;

        if (!orderID) {
          return res.status(400).json({ error: "Missing orderID" });
        }

        // Capture the PayPal order
        const request = {
          id: orderID,
          body: {},
        };

        const capture = await ordersController.captureOrder(request);

        if (capture.result?.status !== "COMPLETED") {
          throw new Error("PayPal payment capture failed");
        }

        // Extract custom data from the purchase unit
        const purchaseUnit = capture.result.purchaseUnits?.[0];
        if (!purchaseUnit?.customId) {
          throw new Error("Missing payment metadata");
        }

        const metadata = JSON.parse(purchaseUnit.customId);
        const {
          userId,
          type: paymentType,
          quizAttemptId,
          isFirstReport,
        } = metadata;

        // Find the payment record in our database using PayPal order ID
        const userIdInt = parseInt(userId);
        const payments = await storage.getPaymentsByUser(userIdInt);
        const payment = payments.find((p) => p.paypalOrderId === orderID);

        if (!payment) {
          console.error("Payment record not found for PayPal order:", orderID);
          throw new Error("Payment record not found");
        }

        // Complete the payment in our system
        await storage.completePayment(payment.id);

        console.log(
          `PayPal payment completed: ${paymentType} for user ${userIdInt}, quiz attempt ${quizAttemptId}`,
        );

        res.json({
          success: true,
          captureID: capture.result.id,
        });
      } catch (error) {
        console.error("Error capturing PayPal payment:", error);
        
        // Provide more specific error messages for different failure types
        if (error instanceof Error) {
          if (error.message.includes("invalid_client") || error.message.includes("Client Authentication failed")) {
            return res.status(500).json({ 
              error: "PayPal service temporarily unavailable",
              message: "Please try again later or use an alternative payment method"
            });
          }
          if (error.message.includes("orderID") || error.message.includes("order not found")) {
            return res.status(400).json({ 
              error: "Invalid payment order",
              message: "Please try the payment again"
            });
          }
        }
        
        res.status(500).json({ 
          error: "Payment processing error",
          message: "Please try again or contact support if the problem persists"
        });
      }
    },
  );

  app.get(
    "/api/payment-history/:userId",
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const payments = await storage.getPaymentsByUser(userId);

        res.json(payments);
      } catch (error) {
        console.error("Error getting payment history:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Stripe webhook endpoint
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return res.status(400).send("Webhook secret not configured");
    }

    let event: Stripe.Event;

    try {
      if (!stripe) {
        return res.status(400).send("Payment processing not configured");
      }

      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${err}`);
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          console.log("Payment succeeded:", paymentIntent.id);

          // Get metadata from payment intent
          const {
            userIdentifier,
            type,
            retakesGranted,
            isTemporaryUser,
            sessionId,
          } = paymentIntent.metadata;

          if (!userIdentifier || !type) {
            console.error(
              "Missing metadata in payment intent:",
              paymentIntent.id,
            );
            break;
          }

          if (isTemporaryUser === "true" && sessionId) {
            // Handle temporary user - convert to permanent account
            try {
              // Get temporary account data
              const tempData = await storage.getTemporaryUser(sessionId);
              if (!tempData) {
                console.error(
                  "Temporary account data not found for session:",
                  sessionId,
                );
                break;
              }

              // Get signup data from tempData.tempQuizData
              const signupData = tempData.tempQuizData as any;
              const email = signupData?.email || tempData.email;
              const password = signupData?.password || tempData.password;
              const name = (signupData?.firstName || "") + (signupData?.lastName ? " " + signupData.lastName : "");

              if (!password) {
                console.error(
                  "Missing password in temporary user data for email:",
                  email,
                );
                console.error("Available fields:", Object.keys(signupData));
                break;
              }

              // Check if payment has already been processed for this payment intent
              const existingPayments = await storage.getPaymentsByStripeId(
                paymentIntent.id,
              );
              if (existingPayments.length > 0) {
                console.log(
                  `Payment ${paymentIntent.id} already processed, skipping.`,
                );
                break;
              }

              // Check if user already exists (safety check)
              let user = await storage.getUserByEmail(email);
              if (!user) {
                try {
                  // Create permanent user account
                  user = await storage.createUser({
                    email: email,
                    password: password, // Already hashed
                    firstName: '',
                    lastName: '',
                  });
                } catch (createUserError) {
                  // If user creation fails due to duplicate email, try to get the user again
                  // This can happen in rare race conditions
                  user = await storage.getUserByEmail(email);
                  if (!user) {
                    throw createUserError; // Re-throw if it's not a duplicate error
                  }
                  console.log(
                    `User ${email} already existed, using existing user.`,
                  );
                }
              }

              // Create payment record
              const payment = await storage.createPayment({
                userId: user.id,
                amount: (paymentIntent.amount / 100).toFixed(2), // Convert cents to dollars
                currency: "usd",
                type: type || "access_pass",
                status: "pending",
                stripePaymentIntentId: paymentIntent.id,
              });

              // Complete the payment
              await storage.completePayment(payment.id);

              // Clean up temporary data
              await storage.cleanupExpiredUnpaidEmails();

              console.log(
                `Payment completed: ${type} for temporary user converted to user ${user.id}`,
              );
            } catch (error) {
              console.error("Error converting temporary user:", error);
            }
          } else {
            // Handle permanent user payment
            const userId = parseInt(userIdentifier);

            // Find the payment record in our database
            const payments = await storage.getPaymentsByUser(userId);
            const payment = payments.find(
              (p) => p.stripePaymentIntentId === paymentIntent.id,
            );

            if (!payment) {
              console.error(
                "Payment record not found for Stripe payment:",
                paymentIntent.id,
              );
              break;
            }

            // Complete the payment in our system
            await storage.completePayment(payment.id);

            console.log(`Payment completed: ${type} for user ${userId}`);
          }
          break;

        case "payment_intent.payment_failed":
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          console.log("Payment failed:", failedPayment.id);

          // Could update payment status to failed in database here
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Business resources endpoint
  app.get(
    "/api/business-resources/:businessModel",
    async (req: Request, res: Response) => {
      try {
        const businessModel = req.params.businessModel;
        const resources = await generateBusinessResources(businessModel);

        res.json(resources);
      } catch (error) {
        console.error("Error generating business resources:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Admin refund endpoints
  // Get all payments with optional pagination (admin only)
  app.get("/api/admin/payments", async (req: Request, res: Response) => {
    try {
      // TODO: Add admin authentication check here
      // For now, we'll add a simple API key check
      const adminKey = req.headers["x-admin-key"];
      if (adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get query parameters for pagination and filtering
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000); // Max 1000 records
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;

      // Use optimized query that JOINs payments with users (fixes N+1 problem)
      const paymentsWithUsers = await storage.getPaymentsWithUsers({
        limit,
        offset,
        status,
      });

      res.json({
        payments: paymentsWithUsers,
        pagination: {
          limit,
          offset,
          total:
            paymentsWithUsers.length === limit
              ? "more_available"
              : paymentsWithUsers.length + offset,
        },
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Convert temporary user to permanent (admin only - for development/testing)
  app.post("/api/admin/convert-temp-user", async (req: Request, res: Response) => {
    try {
      // Simple admin key check for development
      const adminKey = req.headers["x-admin-key"];
      if (adminKey !== "dev-key") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: "User ID is required",
        });
      }

      // Get the user record
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.isTemporary) {
        return res.status(400).json({ error: "User is already permanent" });
      }

      // Convert to permanent user by updating the database
      await storage.updateUser(userId, { isTemporary: false });

      console.log(`Admin converted temporary user ${userId} to permanent`);

      res.json({
        success: true,
        message: "User converted to permanent successfully",
        userId: userId,
      });
    } catch (error) {
      console.error("Error converting temporary user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Complete a payment (admin only - for development/testing)
  app.post("/api/admin/complete-payment", async (req: Request, res: Response) => {
    try {
      // Simple admin key check for development
      const adminKey = req.headers["x-admin-key"];
      if (adminKey !== "dev-key") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          error: "Payment ID is required",
        });
      }

      // Get the payment record
      const payment = await storage.getPaymentById(paymentId);

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (payment.status === "completed") {
        return res.status(400).json({ error: "Payment is already completed" });
      }

      // Complete the payment
      await storage.completePayment(paymentId);

      console.log(`Admin completed payment ${paymentId} for user ${payment.userId}`);

      res.json({
        success: true,
        message: `Payment ${paymentId} completed successfully`,
        payment: {
          id: payment.id,
          userId: payment.userId,
          amount: payment.amount,
          type: payment.type,
          status: "completed",
        },
      });
    } catch (error) {
      console.error("Error completing payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Process a refund (admin only)
  app.post("/api/admin/refund", async (req: Request, res: Response) => {
    try {
      // TODO: Add admin authentication check here
      const adminKey = req.headers["x-admin-key"];
      if (adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { paymentId, amount, reason, adminNote } = req.body;

      if (!paymentId || !amount || !reason) {
        return res.status(400).json({
          error: "Payment ID, amount, and reason are required",
        });
      }

      // Get the payment record
      const payment = await storage.getPaymentById(paymentId);

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Check if payment is already fully refunded
      const existingRefunds = await storage.getRefundsByPayment(paymentId);
      const totalRefunded = existingRefunds
        .filter((r) => r.status === "succeeded")
        .reduce((sum, r) => sum + parseFloat(r.amount), 0);

      const paymentAmount = parseFloat(payment.amount);
      const requestedAmount = parseFloat(amount);

      if (totalRefunded + requestedAmount > paymentAmount) {
        return res.status(400).json({
          error: `Cannot refund $${requestedAmount}. Payment amount: $${paymentAmount}, already refunded: $${totalRefunded}`,
        });
      }

      // Create refund record
      const refund = await storage.createRefund({
        paymentId,
        amount: amount.toString(),
        currency: payment.currency || "usd",
        reason,
        status: "pending",
        adminNote: adminNote || null,
        adminUserId: null, // TODO: Get admin user ID from session
      });

      // Process refund with payment provider
      let refundResult: any = null;
      let providerRefundId: string = "";

      try {
        if (
          payment.stripePaymentIntentId &&
          payment.stripePaymentIntentId.startsWith("pi_")
        ) {
          // Stripe refund
          if (!stripe) {
            throw new Error("Stripe not configured");
          }

          refundResult = await stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: Math.round(requestedAmount * 100), // Convert to cents
            reason:
              reason === "requested_by_customer"
                ? "requested_by_customer"
                : "requested_by_customer",
          });

          providerRefundId = refundResult.id;

          // Update refund status
          await storage.updateRefundStatus(
            refund.id,
            "succeeded",
            new Date(),
            providerRefundId,
          );
        } else if (payment.stripePaymentIntentId) {
          // PayPal refund (stored in stripePaymentIntentId field)
          if (!ordersController) {
            throw new Error("PayPal not configured");
          }

          // For PayPal, we need the capture ID, not the order ID
          // This is a limitation - we should store capture IDs separately
          throw new Error(
            "PayPal refunds require capture ID - please process manually through PayPal dashboard",
          );
        } else {
          throw new Error("No payment provider ID found");
        }

        res.json({
          success: true,
          refund,
          providerRefundId,
          message: `Refund of $${requestedAmount} processed successfully`,
        });
      } catch (providerError) {
        console.error("Provider refund error:", providerError);

        // Update refund status to failed
        await storage.updateRefundStatus(refund.id, "failed", new Date());

        res.status(500).json({
          error: "Refund failed",
          details:
            providerError instanceof Error
              ? providerError.message
              : String(providerError),
          refundId: refund.id,
        });
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all refunds (admin only)
  app.get("/api/admin/refunds", async (req: Request, res: Response) => {
    try {
      const adminKey = req.headers["x-admin-key"];
      if (adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get query parameters for pagination
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000); // Max 1000 records
      const offset = parseInt(req.query.offset as string) || 0;

      const refunds = await storage.getAllRefunds(limit + offset);
      const paginatedRefunds = refunds.slice(offset, offset + limit);

      res.json({
        refunds: paginatedRefunds,
        pagination: {
          limit,
          offset,
          total:
            refunds.length === limit + offset
              ? "more_available"
              : refunds.length,
        },
      });
    } catch (error) {
      console.error("Error fetching refunds:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PDF generation endpoint
  app.post("/api/generate-pdf", async (req: Request, res: Response) => {
    try {
      const { quizData, userEmail, aiAnalysis, topBusinessPath } = req.body;

      console.log("PDF generation request received", {
        hasQuizData: !!quizData,
        hasAIAnalysis: !!aiAnalysis,
        hasTopBusinessPath: !!topBusinessPath,
        userEmail,
      });

      if (!quizData) {
        return res.status(400).json({ error: "Quiz data is required" });
      }

      // Get the base URL from the request, fallback to current domain
      const baseUrl = req.get("host")?.includes("localhost")
        ? `${req.protocol}://${req.get("host")}`
        : "https://bizmodelai.com";
      console.log("Base URL:", baseUrl);

      // Generate PDF with AI data included
      const pdfBuffer = await pdfService.generatePDF({
        quizData,
        userEmail,
        aiAnalysis,
        topBusinessPath,
        baseUrl,
      });

      console.log("PDF generated successfully, size:", pdfBuffer.length);

      // Generate filename with user info
      const userName = userEmail?.split("@")[0] || "user";
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `business-report-${userName}-${timestamp}`;

      // Check if this is actually a PDF (binary) or HTML fallback
      const isPDF = pdfBuffer[0] === 0x25 && pdfBuffer[1] === 0x50; // PDF magic number "%P"

      if (isPDF) {
        // Set headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.pdf"`,
        );
      } else {
        // Set headers for HTML fallback
        res.setHeader("Content-Type", "text/html");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.html"`,
        );
      }

      res.setHeader("Content-Length", pdfBuffer.length);

      // Send the file
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation failed:", error);
      res.status(500).json({
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Email endpoints
  app.post("/api/send-quiz-results", async (req: Request, res: Response) => {
    console.log("API: POST /api/send-quiz-results - Starting email send process");
    const startTime = Date.now();
    
    try {
      const { email, quizData, attemptId } = req.body;

      if (!email || !quizData) {
        console.log("API: POST /api/send-quiz-results - Missing email or quiz data");
        return res.status(400).json({ error: "Missing email or quiz data" });
      }

      console.log(`API: POST /api/send-quiz-results - Sending email to: ${email}`);

      // Add email and attempt ID to quiz data for the email link
      const quizDataWithEmail = {
        ...quizData,
        email: email,
        attemptId: attemptId || null
      };

      const result = await emailService.sendQuizResults(email, quizDataWithEmail);
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`API: POST /api/send-quiz-results - Email sent successfully in ${duration}ms`);
        res.json({ success: true, message: "Quiz results sent successfully" });
      } else {
        console.log(`API: POST /api/send-quiz-results - Email failed to send after ${duration}ms`);
        if (result.rateLimitInfo) {
          res.status(429).json({ 
            error: "Rate limit exceeded", 
            rateLimitInfo: result.rateLimitInfo 
          });
        } else {
          res.status(500).json({ error: "Failed to send email" });
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`API: POST /api/send-quiz-results - Error after ${duration}ms:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/send-welcome-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }

      const result = await emailService.sendWelcomeEmail(email);

      if (result.success) {
        res.json({ success: true, message: "Welcome email sent successfully" });
      } else {
        if (result.rateLimitInfo) {
          res.status(429).json({ 
            error: "Rate limit exceeded", 
            rateLimitInfo: result.rateLimitInfo 
          });
        } else {
          res.status(500).json({ error: "Failed to send email" });
        }
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/send-full-report", async (req: Request, res: Response) => {
    try {
      const { email, quizData, attemptId } = req.body;

      if (!email || !quizData) {
        return res.status(400).json({ error: "Missing email or quiz data" });
      }

      // Add email and attempt ID to quiz data for the email link
      const quizDataWithEmail = {
        ...quizData,
        email: email,
        attemptId: attemptId || null
      };

      const result = await emailService.sendFullReport(email, quizDataWithEmail);

      if (result.success) {
        res.json({ success: true, message: "Full report sent successfully" });
      } else {
        if (result.rateLimitInfo) {
          res.status(429).json({ 
            error: "Rate limit exceeded", 
            rateLimitInfo: result.rateLimitInfo 
          });
        } else {
          res.status(500).json({ error: "Failed to send email" });
        }
      }
    } catch (error) {
      console.error("Error sending full report email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate detailed "Why This Fits You" descriptions for top 3 business matches
  app.post(
    "/api/generate-business-fit-descriptions",
    async (req: Request, res: Response) => {
      try {
        const { quizData, businessMatches } = req.body;

        if (!quizData || !businessMatches || !Array.isArray(businessMatches)) {
          return res.status(400).json({
            error: "Missing or invalid quiz data or business matches",
          });
        }

        const descriptions = [];

        for (let i = 0; i < businessMatches.length; i++) {
          const match = businessMatches[i];
          const rank = i + 1;

          const prompt = `Based on your quiz responses, generate a detailed "Why This Fits You" description for your ${rank === 1 ? "top" : rank === 2 ? "second" : "third"} business match.

Your Quiz Data:
- Main Motivation: ${quizData.mainMotivation}
- Weekly Time Commitment: ${getTimeCommitmentRange(quizData.weeklyTimeCommitment)}
- Income Goal: ${getIncomeGoalRange(quizData.successIncomeGoal)}
- Tech Skills Rating: ${getRatingDescription(quizData.techSkillsRating)}
- Risk Comfort Level: ${getRatingDescription(quizData.riskComfortLevel)}
- Self-Motivation Level: ${getRatingDescription(quizData.selfMotivationLevel)}
- Direct Communication Enjoyment: ${getRatingDescription(quizData.directCommunicationEnjoyment)}
- Creative Work Enjoyment: ${getRatingDescription(quizData.creativeWorkEnjoyment)}
- Work Structure Preference: ${quizData.workStructurePreference}
- Learning Preference: ${quizData.learningPreference}
- First Income Timeline: ${quizData.firstIncomeTimeline}
- Upfront Investment: ${getInvestmentRange(quizData.upfrontInvestment)}
- Brand Face Comfort: ${getRatingDescription(quizData.brandFaceComfort)}
- Long-term Consistency: ${getRatingDescription(quizData.longTermConsistency)}
- Trial & Error Comfort: ${getRatingDescription(quizData.trialErrorComfort)}
- Organization Level: ${getRatingDescription(quizData.organizationLevel)}
- Uncertainty Handling: ${getRatingDescription(quizData.uncertaintyHandling)}
- Work Collaboration Preference: ${quizData.workCollaborationPreference}
- Decision Making Style: ${quizData.decisionMakingStyle}
- Familiar Tools: ${quizData.familiarTools?.join(", ") || "None specified"}

Business Match:
- Name: ${match.name}
- Fit Score: ${match.fitScore}%
- Description: ${match.description}
- Time to Profit: ${match.timeToProfit}
- Startup Cost: ${match.startupCost}
- Potential Income: ${match.potentialIncome}

Generate a detailed personalized analysis of at least 6 sentences explaining why this business model specifically fits you. Write it as a cohesive paragraph, not bullet points. Be extremely specific about:
1. How your exact personality traits, goals, and preferences align with this business model
2. What specific aspects of your quiz responses make you well-suited for this path
3. How your skills, time availability, and risk tolerance perfectly match the requirements
4. What unique advantages you bring to this business model based on your specific answers
5. How your learning style and work preferences complement this business approach
6. Why this particular combination of traits makes you likely to succeed in this field

Reference specific quiz data points and explain the connections. Make it personal and specific to your responses, not generic advice. Write in a supportive, consultative tone that demonstrates deep understanding of your profile.

CRITICAL: Use ONLY the actual data provided above. Do NOT make up specific numbers, amounts, or timeframes. Reference the exact ranges and values shown in your profile. If you selected a range, always refer to the full range, never specific numbers within it. Always address the user directly using 'you' and 'your'.`;

          const openaiResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency
                messages: [
                  {
                    role: "system",
                    content:
                      "You are an expert business consultant specializing in entrepreneurial personality matching. Generate personalized, specific explanations for why certain business models fit individual users based on their quiz responses.",
                  },
                  {
                    role: "user",
                    content: prompt,
                  },
                ],
                temperature: 0.7,
                max_tokens: 500,
              }),
            },
          );

          if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${openaiResponse.status}`);
          }

          const data = await openaiResponse.json();
          const content = data.choices[0].message.content;

          descriptions.push({
            businessId: match.id,
            description:
              content ||
              `This business model aligns well with your ${quizData.selfMotivationLevel >= 4 ? "high self-motivation" : "self-driven nature"} and ${quizData.weeklyTimeCommitment} hours/week availability. Your ${quizData.techSkillsRating >= 4 ? "strong" : "adequate"} technical skills and ${quizData.riskComfortLevel >= 4 ? "high" : "moderate"} risk tolerance make this a suitable match for your entrepreneurial journey.`,
          });
        }

        // Store business fit descriptions in database if user is authenticated
        try {
          const userId = await getUserIdFromRequest(req);
          if (userId) {
            const attempts = await storage.getQuizAttempts(userId);
            const quizAttemptId = attempts.length > 0 ? attempts[0].id : undefined;
            if (quizAttemptId) {
              const descriptionsMap: { [key: string]: string } = {};
              descriptions.forEach((desc: any) => {
                descriptionsMap[desc.businessId] = desc.description;
              });
              await storage.saveAIContentToQuizAttempt(
                quizAttemptId,
                "businessFitDescriptions",
                descriptionsMap,
              );
              console.log("Business fit descriptions stored in database");
            }
          }
        } catch (dbError) {
          const { ErrorHandler } = await import("./utils/errorHandler.js");
          await ErrorHandler.handleStorageError(dbError as Error, {
            operation: "store_business_fit_descriptions",
            context: {},
            isCritical: false,
            shouldThrow: false,
          });
        }

        res.json({ descriptions });
      } catch (error) {
        console.error("Error generating business fit descriptions:", error);

        // Return fallback descriptions
        const fallbackDescriptions = req.body.businessMatches.map(
          (match: any, index: number) => ({
            businessId: match.id,
            description: `This business model aligns well with your ${req.body.quizData.selfMotivationLevel >= 4 ? "high self-motivation" : "self-driven nature"} and ${req.body.quizData.weeklyTimeCommitment} hours/week availability. Your ${req.body.quizData.techSkillsRating >= 4 ? "strong" : "adequate"} technical skills and ${req.body.quizData.riskComfortLevel >= 4 ? "high" : "moderate"} risk tolerance make this a ${index === 0 ? "perfect" : index === 1 ? "excellent" : "good"} match for your entrepreneurial journey.

${index === 0 ? "As your top match, this path offers the best alignment with your goals and preferences." : index === 1 ? "This represents a strong secondary option that complements your primary strengths." : "This provides a solid alternative path that matches your core capabilities."} Your ${req.body.quizData.learningPreference?.replace("-", " ")} learning style and ${req.body.quizData.workStructurePreference?.replace("-", " ")} work preference make this business model particularly suitable for your success.`,
          }),
        );

        // Store fallback business fit descriptions in database if user is authenticated
        try {
          const userId = await getUserIdFromRequest(req);
          if (userId) {
            const attempts = await storage.getQuizAttempts(userId);
            const quizAttemptId = attempts.length > 0 ? attempts[0].id : undefined;
            if (quizAttemptId) {
              const descriptionsMap: { [key: string]: string } = {};
              fallbackDescriptions.forEach((desc: any) => {
                descriptionsMap[desc.businessId] = desc.description;
              });
              await storage.saveAIContentToQuizAttempt(
                quizAttemptId,
                "businessFitDescriptions",
                descriptionsMap,
              );
              console.log(
                "✅ Fallback business fit descriptions stored in database",
              );
            }
          }
        } catch (dbError) {
          const { ErrorHandler } = await import("./utils/errorHandler.js");
          await ErrorHandler.handleStorageError(dbError as Error, {
            operation: "store_fallback_business_fit_descriptions",
            context: {},
            isCritical: false,
            shouldThrow: false,
          });
        }

        res.json({ descriptions: fallbackDescriptions });
      }
    },
  );

  // Generate detailed "Why This Doesn't Fit Your Current Profile" descriptions for bottom 3 business matches
  app.post(
    "/api/generate-business-avoid-descriptions",
    async (req: Request, res: Response) => {
      try {
        const { quizData, businessMatches } = req.body;

        if (!quizData || !businessMatches || !Array.isArray(businessMatches)) {
          return res.status(400).json({
            error: "Missing or invalid quiz data or business matches",
          });
        }

        const descriptions = [];

        for (let i = 0; i < businessMatches.length; i++) {
          const match = businessMatches[i];
          const rank = i + 1;

          const prompt = `Based on your quiz responses, generate a detailed "Why This Doesn't Fit Your Current Profile" description for your ${rank === 1 ? "lowest scoring" : rank === 2 ? "second lowest scoring" : "third lowest scoring"} business match.

Your Quiz Data:
- Main Motivation: ${quizData.mainMotivation}
- Weekly Time Commitment: ${getTimeCommitmentRange(quizData.weeklyTimeCommitment)}
- Income Goal: ${getIncomeGoalRange(quizData.successIncomeGoal)}
- Tech Skills Rating: ${getRatingDescription(quizData.techSkillsRating)}
- Risk Comfort Level: ${getRatingDescription(quizData.riskComfortLevel)}
- Self-Motivation Level: ${getRatingDescription(quizData.selfMotivationLevel)}
- Direct Communication Enjoyment: ${getRatingDescription(quizData.directCommunicationEnjoyment)}
- Creative Work Enjoyment: ${getRatingDescription(quizData.creativeWorkEnjoyment)}
- Work Structure Preference: ${quizData.workStructurePreference}
- Learning Preference: ${quizData.learningPreference}
- First Income Timeline: ${quizData.firstIncomeTimeline}
- Upfront Investment: ${getInvestmentRange(quizData.upfrontInvestment)}
- Brand Face Comfort: ${getRatingDescription(quizData.brandFaceComfort)}
- Long-term Consistency: ${getRatingDescription(quizData.longTermConsistency)}
- Trial & Error Comfort: ${getRatingDescription(quizData.trialErrorComfort)}
- Organization Level: ${getRatingDescription(quizData.organizationLevel)}
- Uncertainty Handling: ${getRatingDescription(quizData.uncertaintyHandling)}
- Work Collaboration Preference: ${quizData.workCollaborationPreference}
- Decision Making Style: ${quizData.decisionMakingStyle}
- Familiar Tools: ${quizData.familiarTools?.join(", ") || "None specified"}

Business Match:
- Name: ${match.name}
- Fit Score: ${match.fitScore}%
- Description: ${match.description}
- Time to Profit: ${match.timeToProfit}
- Startup Cost: ${match.startupCost}
- Potential Income: ${match.potentialIncome}

Generate a detailed personalized analysis of at least 6 sentences explaining why this business model doesn't fit your current profile. Write it as a cohesive paragraph, not bullet points. Be specific about:
1. What specific personality traits, goals, or preferences conflict with this business model
2. Which exact quiz responses indicate poor alignment with this path
3. How your skills, time availability, or risk tolerance don't match the requirements
4. What challenges you would likely face based on your specific profile
5. Why your learning style and work preferences would struggle with this business approach
6. What would need to change in your profile before this could become viable

Reference specific quiz data points and explain the misalignments. Be honest but constructive. Write in a supportive tone that helps you understand why focusing on better-matched opportunities would be wiser.

CRITICAL: Use ONLY the actual data provided above. Do NOT make up specific numbers, amounts, or timeframes. Reference the exact ranges and values shown in your profile. If you selected a range, always refer to the full range, never specific numbers within it. Always address the user directly using 'you' and 'your'.`;

          const openaiResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency
                messages: [
                  {
                    role: "system",
                    content:
                      "You are an expert business consultant specializing in entrepreneurial personality matching. Generate personalized, specific explanations for why certain business models don't fit individual users based on their quiz responses. Be honest but constructive, helping users understand misalignments.",
                  },
                  {
                    role: "user",
                    content: prompt,
                  },
                ],
                temperature: 0.7,
                max_tokens: 500,
              }),
            },
          );

          if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${openaiResponse.status}`);
          }

          const data = await openaiResponse.json();
          const content = data.choices[0].message.content;

          descriptions.push({
            businessId: match.id,
            description:
              content ||
              `This business model doesn't align well with your current profile. Your ${quizData.riskComfortLevel <= 2 ? "lower risk tolerance" : "risk preferences"} and ${quizData.weeklyTimeCommitment} hours/week availability suggest other business models would be more suitable. Your ${quizData.techSkillsRating >= 4 ? "strong" : "adequate"} technical skills and ${quizData.selfMotivationLevel >= 4 ? "high" : "moderate"} self-motivation level indicate potential challenges with this path. Consider focusing on business models that better match your strengths and current situation.`,
          });
        }

        // Store business avoid descriptions in database if user is authenticated
        try {
          const userId = await getUserIdFromRequest(req);
          if (userId) {
            const attempts = await storage.getQuizAttempts(userId);
            const quizAttemptId = attempts.length > 0 ? attempts[0].id : undefined;
            if (quizAttemptId) {
              const descriptionsMap: { [key: string]: string } = {};
              descriptions.forEach((desc: any) => {
                descriptionsMap[desc.businessId] = desc.description;
              });
              await storage.saveAIContentToQuizAttempt(
                quizAttemptId,
                "businessAvoidDescriptions",
                descriptionsMap,
              );
              console.log("Business avoid descriptions stored in database");
            }
          }
        } catch (dbError) {
          const { ErrorHandler } = await import("./utils/errorHandler.js");
          await ErrorHandler.handleStorageError(dbError as Error, {
            operation: "store_business_avoid_descriptions",
            context: {},
            isCritical: false,
            shouldThrow: false,
          });
        }

        res.json({ descriptions });
      } catch (error) {
        console.error("Error generating business avoid descriptions:", error);

        // Return fallback descriptions
        const fallbackDescriptions = req.body.businessMatches.map(
          (match: any, index: number) => ({
            businessId: match.id,
            description: `This business model scored ${match.fitScore}% for your profile, indicating significant misalignment with your current goals, skills, and preferences. Based on your quiz responses, you would likely face substantial challenges in this field that could impact your success. Consider focusing on higher-scoring business models that better match your natural strengths and current situation.`,
          }),
        );

        // Store fallback business avoid descriptions in database if user is authenticated
        try {
          const userId = await getUserIdFromRequest(req);
          if (userId) {
            const attempts = await storage.getQuizAttempts(userId);
            const quizAttemptId = attempts.length > 0 ? attempts[0].id : undefined;
            if (quizAttemptId) {
              const descriptionsMap: { [key: string]: string } = {};
              fallbackDescriptions.forEach((desc: any) => {
                descriptionsMap[desc.businessId] = desc.description;
              });
              await storage.saveAIContentToQuizAttempt(
                quizAttemptId,
                "businessAvoidDescriptions",
                descriptionsMap,
              );
              console.log(
                "✅ Fallback business avoid descriptions stored in database",
              );
            }
          }
        } catch (dbError) {
          const { ErrorHandler } = await import("./utils/errorHandler.js");
          await ErrorHandler.handleStorageError(dbError as Error, {
            operation: "store_fallback_business_avoid_descriptions",
            context: {},
            isCritical: false,
            shouldThrow: false,
          });
        }

        res.json({ descriptions: fallbackDescriptions });
      }
    },
  );

  // AI Content Migration Endpoint
  app.post(
    "/api/admin/migrate-ai-content",
    async (req: Request, res: Response) => {
      try {
        console.log(" Starting AI content migration...");

        let result = null;
        if (storage instanceof DatabaseStorage) {
          result = await storage.migrateAIContentToNewTable();
        }

        console.log("AI content migration completed successfully");
        res.json({
          success: true,
          message: "AI content migration completed",
          ...result,
        });
      } catch (error) {
        console.error("❌ AI content migration failed:", error);
        res.status(500).json({
          success: false,
          error: "Migration failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Enhanced email functionality for unpaid users
  app.post("/api/email-results", async (req: Request, res: Response) => {
    try {
      const { sessionId, email, quizData, isPaidUser } = req.body;

      if (!sessionId || !quizData) {
        return res
          .status(400)
          .json({ error: "Missing session ID or quiz data" });
      }

      // Check if user is paid (has account)
      if (isPaidUser) {
        // For paid users, send full report
        const success = await emailService.sendFullReport(email, quizData);
        if (success) {
          res.json({ success: true, message: "Full report sent successfully" });
        } else {
          res.status(500).json({ error: "Failed to send full report" });
        }
        return;
      }

      // For unpaid users, check if email already exists for this session
      const existingUser = await storage.getTemporaryUser(sessionId);

      if (existingUser) {
        // Email already stored, just send again
        const success = await emailService.sendQuizResults(
          existingUser.email,
          quizData,
        );
        if (success) {
          res.json({
            success: true,
            message: "Results sent to your email again",
          });
        } else {
          res.status(500).json({ error: "Failed to send email" });
        }
        return;
      }

      // New email for unpaid user
      if (!email) {
        return res
          .status(400)
          .json({ error: "Email is required for new users" });
      }

      // Store the email and send results
      // Check if there's existing signup data to preserve
      const existingData = await storage.getTemporaryUser(sessionId);
      let dataToStore;

      if (
        existingData &&
        existingData.tempQuizData &&
        typeof existingData.tempQuizData === "object"
      ) {
        // Preserve existing signup data (email, password, name) and update quiz data
        const existingQuizData = existingData.tempQuizData as any;
        dataToStore = {
          email: existingQuizData.email || email,
          password: existingQuizData.password || existingData.password,
          name: (existingQuizData.firstName || "") + (existingQuizData.lastName ? " " + existingQuizData.lastName : "") || (existingData.firstName || "") + (existingData.lastName ? " " + existingData.lastName : ""),
          quizData,
        };
      } else {
        // No existing data, just store email and quiz data
        dataToStore = {
          email,
          quizData,
        };
      }

      await storage.storeTemporaryUser(sessionId, email, dataToStore);
      const success = await emailService.sendQuizResults(email, quizData);

      if (success) {
        res.json({ success: true, message: "Results sent to your email" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error in email-results endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get stored email for unpaid users
  app.get(
    "/api/get-stored-email/:sessionId",
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const storedUser = await storage.getTemporaryUser(sessionId);

        if (storedUser) {
          res.json({ email: storedUser.email });
        } else {
          res.json({ email: null });
        }
      } catch (error) {
        console.error("Error getting stored email:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Handle email links with quiz attempt ID and email
  app.get("/api/email-link/:attemptId/:email", async (req: Request, res: Response) => {
    try {
      const { attemptId, email } = req.params;
      const decodedEmail = decodeURIComponent(email);
      
      console.log(`Email link accessed: attemptId=${attemptId}, email=${decodedEmail}`);

      // Get the quiz attempt
      const attempt = await storage.getQuizAttempt(parseInt(attemptId));
      
      if (!attempt) {
        console.log(`Quiz attempt ${attemptId} not found`);
        return res.status(404).json({ error: "Quiz attempt not found" });
      }

      // Check if data has expired (3 months for unpaid users)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (attempt.completedAt < threeMonthsAgo) {
        console.log(`Quiz attempt ${attemptId} has expired (completed: ${attempt.completedAt})`);
        return res.json({
          status: "expired",
          message: "Your data has expired",
          completedAt: attempt.completedAt
        });
      }

      // Check if user has paid for this attempt
      const isPaid = await storage.isPaidUser(attempt.userId);
      
      if (isPaid) {
        console.log(`Quiz attempt ${attemptId} is paid - returning full access`);
        return res.json({
          status: "paid",
          quizData: attempt.quizData,
          attemptId: attempt.id,
          email: decodedEmail,
          isUnlocked: true
        });
      } else {
        console.log(`Quiz attempt ${attemptId} is unpaid - returning preview access`);
        return res.json({
          status: "unpaid",
          quizData: attempt.quizData,
          attemptId: attempt.id,
          email: decodedEmail,
          isUnlocked: false
        });
      }
    } catch (error) {
      console.error("Error handling email link:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all collected emails endpoint for marketing/advertising
  app.get("/api/admin/all-emails", async (req: Request, res: Response) => {
    try {
      console.log("Fetching all collected emails...");

      // Get emails from paid users (permanent storage)
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      const paidUsers = await db
        .select({
          email: users.email,
          source: sql<string>`'paid_user'`,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(sql`${users.email} IS NOT NULL`);

      // Get emails from unpaid/temporary users (including expired ones for marketing)
      const unpaidUsers = await db
        .select({
          email: users.email,
          source: sql<string>`'unpaid_user'`,
          createdAt: users.createdAt,
          expiresAt: users.expiresAt,
        })
        .from(users)
        .where(sql`${users.isTemporary} = true`);

      // Combine and deduplicate emails
      const allEmails = [...paidUsers, ...unpaidUsers];
      const uniqueEmails = new Map();

      allEmails.forEach((emailRecord) => {
        if (!emailRecord.email) return;
        const email = emailRecord.email.toLowerCase();
        if (!uniqueEmails.has(email) || emailRecord.source === "paid_user") {
          // Prefer paid user records over unpaid user records
          uniqueEmails.set(email, emailRecord);
        }
      });

      const emailList = Array.from(uniqueEmails.values()).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      res.json({
        success: true,
        totalEmails: emailList.length,
        emails: emailList,
        summary: {
          paidUsers: paidUsers.length,
          unpaidUsers: unpaidUsers.length,
          uniqueEmails: emailList.length,
        },
      });
    } catch (error) {
      console.error("Error fetching all emails:", error);
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  // Export email list as CSV for marketing tools
  app.get("/api/admin/emails-csv", async (req: Request, res: Response) => {
    try {
      // Get emails from paid users
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      const paidUsers = await db
        .select({
          email: users.email,
          source: sql<string>`'paid_user'`,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(sql`${users.email} IS NOT NULL`);

      // Get emails from unpaid/temporary users
      const unpaidUsers = await db
        .select({
          email: users.email,
          source: sql<string>`'unpaid_user'`,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(sql`${users.isTemporary} = true`);

      // Combine and deduplicate
      const allEmails = [...paidUsers, ...unpaidUsers];
      const uniqueEmails = new Map();

      allEmails.forEach((emailRecord) => {
        if (!emailRecord.email) return;
        const email = emailRecord.email.toLowerCase();
        if (!uniqueEmails.has(email) || emailRecord.source === "paid_user") {
          uniqueEmails.set(email, emailRecord);
        }
      });

      // Create CSV content
      const csvHeader = "email,source,created_at\n";
      const csvRows = Array.from(uniqueEmails.values())
        .map((record) => `${record.email},${record.source},${record.createdAt}`)
        .join("\n");

      const csvContent = csvHeader + csvRows;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=bizmodelai-emails.csv",
      );
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting emails to CSV:", error);
      res.status(500).json({ error: "Failed to export emails" });
    }
  });

  // Test endpoint removed for production

  // Data cleanup endpoint (for manual triggering or cron jobs)
  app.post(
    "/api/admin/cleanup-expired-data",
    async (req: Request, res: Response) => {
      try {
        await storage.cleanupExpiredData();
        res.json({ success: true, message: "Expired data cleanup completed" });
      } catch (error) {
        console.error("Error during data cleanup:", error);
        res.status(500).json({ error: "Data cleanup failed" });
      }
    },
  );

  // Get user data retention status
  app.get(
    "/api/auth/data-retention-status",
    async (req: Request, res: Response) => {
      try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
          console.log("Data retention status: Not authenticated", {
            sessionUserId: req.session?.userId,
            cacheUserId: userId,
            sessionKey: getSessionKey(req),
          });
          return res.status(401).json({ error: "Not authenticated" });
        }

        const isPaid = await storage.isPaidUser(userId);
        const user = await storage.getUser(userId);

        res.json({
          isPaidUser: isPaid,
          dataRetentionPolicy: isPaid
            ? "permanent"
            : "24_hours_from_quiz_completion",

          accountCreatedAt: user?.createdAt,
          dataWillBeDeletedIfUnpaid: !isPaid,
        });
      } catch (error) {
        console.error("Error getting data retention status:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Test endpoint removed for production

  // Emergency database schema fix endpoint
  app.post(
    "/api/admin/fix-database-schema",
    async (req: Request, res: Response) => {
      try {
        console.log(" Emergency database schema fix requested...");

        // Add missing columns to users table
        if (storage instanceof DatabaseStorage) {
          await storage.fixSchema();
        }

        console.log("Database schema fixed!");
        res.json({ success: true, message: "Database schema fixed" });
      } catch (error) {
        console.error("❌ Database schema fix failed:", error);
        res
          .status(500)
          .json({ error: "Schema fix failed", details: error instanceof Error ? error.message : String(error) });
      }
    },
  );

  // PayPal configuration test endpoint
  app.get("/api/paypal-config", (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3001");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    
    const hasClientId = !!process.env.PAYPAL_CLIENT_ID;
    const hasClientSecret = !!process.env.PAYPAL_CLIENT_SECRET;
    const environment = process.env.NODE_ENV === "production" ? "production" : "sandbox";

    res.json({
      configured: hasClientId && hasClientSecret,
      hasClientId,
      hasClientSecret,
      environment,
      paypalClient: !!paypalClient,
      ordersController: !!ordersController,
      status: (hasClientId && hasClientSecret) ? "ready" : "not_configured",
    });
  });

  // Test endpoint removed for production

  // Test endpoint removed for production

  // Missing routes that are called from frontend but not implemented
  // AI insights endpoint
  app.post("/api/ai-insights", async (req: Request, res: Response) => {
    try {
      const { quizData } = req.body;
      
      if (!quizData) {
        return res.status(400).json({ error: "Quiz data is required" });
      }

      // Generate AI insights using the existing AI service
      const analysis = await aiScoringService.analyzeBusinessFit(quizData);
      
      res.json({
        insights: analysis,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ error: "Failed to generate AI insights" });
    }
  });

  // Generate full report endpoint
  app.post("/api/generate-full-report", async (req: Request, res: Response) => {
    try {
      const { quizData, userEmail } = req.body;
      
      if (!quizData) {
        return res.status(400).json({ error: "Quiz data is required" });
      }

      // Generate comprehensive report using AI service
      const analysis = await aiScoringService.analyzeBusinessFit(quizData);
      
      // Create full report structure
      const fullReport = {
        insights: {
          personalizedSummary: "Based on your quiz responses, you have strong entrepreneurial potential.",
          customRecommendations: analysis.recommendations || [],
          potentialChallenges: analysis.topMatches?.[0]?.analysis?.challenges || [],
          successStrategies: [
            "Focus on your top-scoring business model",
            "Leverage your strong skills",
            "Start small and scale gradually",
            "Build consistent daily habits"
          ],
          personalizedActionPlan: {
            week1: ["Research your target market", "Set up basic business structure"],
            month1: ["Launch minimum viable product", "Establish online presence"],
            month3: ["Refine offerings based on feedback", "Build customer base"],
            month6: ["Scale successful strategies", "Plan for growth"]
          },
          motivationalMessage: "Starting a business is hard, but it's one of the best ways to take control of your future. Every successful entrepreneur began with an idea and the courage to try."
        },
        paths: analysis.topMatches?.map(match => match.businessPath) || [],
        businessFitDescriptions: {},
        businessAvoidDescriptions: {}
      };
      
      res.json(fullReport);
    } catch (error) {
      console.error("Error generating full report:", error);
      res.status(500).json({ error: "Failed to generate full report" });
    }
  });

  // Routes registered successfully
}
