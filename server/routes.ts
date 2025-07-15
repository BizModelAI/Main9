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
import { users, unpaidUserEmails } from "../shared/schema.js";
import { sql } from "drizzle-orm";
import Stripe from "stripe";
import {
  Client,
  Environment,
  OrdersController,
} from "@paypal/paypal-server-sdk";

// Simple rate limiter for OpenAI requests
class OpenAIRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequestsPerIP = 20; // Max requests per IP per minute
  private readonly windowMs = 60000; // 1 minute window

  canMakeRequest(ip: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(ip) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(
      (time) => now - time < this.windowMs,
    );
    this.requests.set(ip, recentRequests);

    if (recentRequests.length >= this.maxRequestsPerIP) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    return true;
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

function getRatingDescription(rating: number): string {
  if (rating >= 4.5) return "Very High";
  if (rating >= 4) return "High";
  if (rating >= 3) return "Moderate";
  if (rating >= 2) return "Low";
  return "Very Low";
}

function getIncomeGoalRange(value: number): string {
  if (value <= 500) return "Less than $500/month";
  if (value <= 1250) return "$500–$2,000/month";
  if (value <= 3500) return "$2,000–$5,000/month";
  return "$5,000+/month";
}

function getTimeCommitmentRange(value: number): string {
  if (value <= 3) return "Less than 5 hours/week";
  if (value <= 7) return "5–10 hours/week";
  if (value <= 17) return "10–25 hours/week";
  return "25+ hours/week";
}

function getInvestmentRange(value: number): string {
  if (value <= 0) return "$0 (bootstrap only)";
  if (value <= 125) return "Under $250";
  if (value <= 625) return "$250–$1,000";
  return "$1,000+";
}

export async function registerRoutes(app: Express): Promise<void> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // CORS preflight handler for OpenAI chat endpoint
  app.options("/api/openai-chat", (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(200);
  });

  // Debug endpoint to check OpenAI configuration
  app.get("/api/openai-status", (req: Request, res: Response) => {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const keyLength = hasApiKey ? process.env.OPENAI_API_KEY!.length : 0;

    res.json({
      configured: hasApiKey,
      keyLength: keyLength,
      keyPrefix: hasApiKey
        ? process.env.OPENAI_API_KEY!.substring(0, 7) + "..."
        : "none",
    });
  });

  // General OpenAI chat endpoint
  app.post("/api/openai-chat", async (req: Request, res: Response) => {
    // Add CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    try {
      console.log("🔍 OpenAI API request received:", {
        hasBody: !!req.body,
        promptLength: req.body?.prompt?.length || 0,
        maxTokens: req.body?.maxTokens,
        responseFormat: req.body?.responseFormat,
      });

      // Rate limiting for concurrent users
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      if (!openaiRateLimiter.canMakeRequest(clientIP)) {
        console.log("�� Rate limit exceeded for IP:", clientIP);
        return res.status(429).json({
          error: "Too many requests. Please wait a moment before trying again.",
        });
      }

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.error("❌ OpenAI API key not configured");
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const {
        prompt,
        maxTokens = 1200,
        temperature = 0.7,
        responseFormat = null,
        systemMessage,
      } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const messages = [];

      // Add system message if provided
      if (systemMessage) {
        messages.push({
          role: "system",
          content: systemMessage,
        });
      }

      // Add user prompt
      messages.push({
        role: "user",
        content: prompt,
      });

      const requestBody: any = {
        model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency
        messages,
        max_tokens: maxTokens,
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
          `❌ OpenAI API error: ${openaiResponse.status}`,
          errorText,
        );
        throw new Error(
          `OpenAI API error: ${openaiResponse.status} - ${errorText}`,
        );
      }

      const data = await openaiResponse.json();
      console.log(
        "✅ OpenAI API response received, content length:",
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
        console.warn("🚫 Rate limited by OpenAI");
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
        Based on this user's quiz responses, analyze their current skill level for each required skill for ${businessModel}:

        USER PROFILE:
        ${userProfile}

        REQUIRED SKILLS:
        ${requiredSkills.map((skill: string) => `- ${skill}`).join("\n")}

        For each skill, determine:
        1. Status: "have" (user already has this skill), "working-on" (user has some experience but needs development), or "need" (user doesn't have this skill)
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
        - Their experience level and existing skills
        - Their learning preferences and willingness to learn
        - Their time commitment and motivation
        - Their tech comfort level
        - Their communication and work preferences
        - Their past tools and experience indicators
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
                  "You are an expert career coach and skills assessor. Analyze user profiles and provide accurate skill assessments for business models.",
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

      res.json(fallbackResult);
    }
  });

  // AI-powered business fit scoring endpoint
  app.post(
    "/api/ai-business-fit-analysis",
    async (req: Request, res: Response) => {
      console.log("📥 AI business fit analysis request received");

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
        console.log("✅ AI business fit analysis completed successfully");
        res.json(analysis);
      } catch (error) {
        console.error("❌ Error in AI business fit analysis:", {
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
            username: `user${userId}`,
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
          hasAccessPass: false, // No longer used
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
          username: `user${userId}`,
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
          username: `user${userId}`,
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
        const { aiContent } = req.body;
        const currentUserId = getUserIdFromRequest(req);

        if (!currentUserId) {
          return res.status(401).json({ error: "Not authenticated" });
        }

        if (!aiContent) {
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

        await storage.saveAIContentToQuizAttempt(quizAttemptId, aiContent);

        console.log(`AI content saved for quiz attempt ${quizAttemptId}`);
        res.json({ success: true, message: "AI content saved successfully" });
      } catch (error) {
        console.error("Error saving AI content:", error);
        res.status(500).json({ error: "Internal server error" });
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

        console.log(
          `AI content retrieved for quiz attempt ${quizAttemptId}:`,
          !!aiContent,
        );
        res.json({ aiContent });
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

  // Save quiz data for authenticated user (pay-per-quiz model)
  app.post("/api/auth/save-quiz-data", async (req: Request, res: Response) => {
    console.log("API: POST /api/auth/save-quiz-data", {
      sessionId: req.sessionID,
      userId: req.session?.userId,
      hasCookie: !!req.headers.cookie,
    });

    try {
      const sessionKey = getSessionKey(req);
      console.log("Save quiz data: Session debug", {
        sessionUserId: req.session?.userId,
        sessionKey: sessionKey,
      });

      const userId = getUserIdFromRequest(req);
      console.log("Save quiz data: getUserIdFromRequest returned", userId);

      if (!userId) {
        console.log("Save quiz data: Not authenticated - returning 401", {
          sessionUserId: req.session?.userId,
          cacheUserId: userId,
          sessionKey: getSessionKey(req),
        });
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { quizData, paymentId } = req.body;
      if (!quizData) {
        console.log("Save quiz data: No quiz data provided");
        return res.status(400).json({ error: "Quiz data is required" });
      }

      // Check if this is the user's first quiz attempt
      const existingAttempts = await storage.getQuizAttempts(userId);
      const isFirstQuiz = existingAttempts.length === 0;
      const user = await storage.getUser(userId);

      console.log(`Save quiz data: User ${userId}, first quiz: ${isFirstQuiz}`);

      // In pure pay-per-report model, quiz attempts are always free
      // Payment is only required for report unlocks
      // Quiz payment verification removed - all quizzes are now free

      console.log(`Save quiz data: Saving quiz data for user ${userId}`);

      // Save quiz data to user's account
      const attempt = await storage.recordQuizAttempt({
        userId: userId,
        quizData,
      });

      console.log(
        `Save quiz data: Quiz attempt recorded with ID ${attempt.id} for user ${userId}`,
      );

      // Payment linking disabled in pure pay-per-report model
      if (false && paymentId) {
        // This logic is disabled
        await storage.linkPaymentToQuizAttempt(paymentId, attempt.id);
        console.log(
          `Save quiz data: Linked payment ${paymentId} to quiz attempt ${attempt.id}`,
        );
      }

      console.log(
        `Save quiz data: Successfully saved quiz data for user ${userId}`,
      );

      res.json({
        success: true,
        attemptId: attempt.id,
        message: "Quiz data saved successfully",
        isFirstQuiz,
        requiresPayment: false, // Always false in pay-per-report model
        quizAttemptId: attempt.id,
      });
    } catch (error) {
      console.error("Error saving quiz data:", error);
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
      const completedPayments = payments.filter(
        (p) => p.status === "completed",
      );
      const isFirstReport = completedPayments.length === 0;
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
        const { userId, quizAttemptId } = req.body;

        if (!userId || !quizAttemptId) {
          return res
            .status(400)
            .json({ error: "Missing userId or quizAttemptId" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Check if report is already unlocked
        const payments = await storage.getPaymentsByUser(userId);
        const existingPayment = payments.find(
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
        const completedPayments = payments.filter(
          (p) => p.status === "completed",
        );
        const isFirstReport = completedPayments.length === 0;
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
          },
          description: `BizModelAI Report Unlock - ${isFirstReport ? "First report" : "Additional report"}`,
        });

        // Create payment record in our database
        const payment = await storage.createPayment({
          userId,
          amount: amountDollar,
          currency: "usd",
          type: "report_unlock",
          status: "pending",
          quizAttemptId: quizAttemptId,
          stripePaymentIntentId: paymentIntent.id,
        });

        res.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentId: payment.id,
          amount: amountDollar,
          isFirstReport,
        });
      } catch (error) {
        console.error("Error creating report unlock payment:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Create payment for anonymous users unlocking full report (always $9.99)
  app.post(
    "/api/create-anonymous-report-unlock-payment",
    async (req: Request, res: Response) => {
      try {
        const { sessionId, email } = req.body;

        if (!sessionId) {
          return res
            .status(400)
            .json({ error: "Missing sessionId for anonymous user" });
        }

        // Verify temporary user data exists
        const tempData = await storage.getTemporaryUser(sessionId);
        if (!tempData) {
          return res
            .status(404)
            .json({ error: "Temporary account data not found or expired" });
        }

        // Anonymous users always pay $9.99 (first-time pricing)
        const amount = 999; // $9.99 in cents
        const amountDollar = "9.99";

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
            sessionId,
            type: "anonymous_report_unlock",
            email: email || tempData.email,
          },
          description: "BizModelAI Anonymous Report Unlock - First time $9.99",
        });

        res.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          amount: amountDollar,
          isFirstReport: true, // Always true for anonymous users
        });
      } catch (error) {
        console.error("Error creating anonymous report unlock payment:", error);
        res.status(500).json({ error: "Internal server error" });
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

  // PayPal payment creation endpoint
  app.post(
    "/api/create-paypal-payment",
    async (req: Request, res: Response) => {
      try {
        if (!ordersController) {
          return res.status(500).json({ error: "PayPal not configured" });
        }

        const { userId, sessionId } = req.body;

        // Handle temporary users (sessionId provided) vs permanent users (userId provided)
        let userIdentifier;
        let isTemporaryUser = false;

        if (sessionId) {
          // This is a temporary user
          isTemporaryUser = true;
          userIdentifier = sessionId;

          // Verify temporary user data exists
          const tempData = await storage.getTemporaryUser(sessionId);
          if (!tempData) {
            return res
              .status(404)
              .json({ error: "Temporary account data not found or expired" });
          }
        } else if (userId) {
          // This is a permanent user
          const user = await storage.getUser(parseInt(userId));
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }

          // Access pass concept removed - users pay per report instead

          userIdentifier = userId.toString();
        } else {
          return res.status(400).json({ error: "Missing userId or sessionId" });
        }

        // Determine payment amount and type
        let amount, retakesGranted, paymentType, description;

        if (!isTemporaryUser && userId) {
          const user = await storage.getUser(parseInt(userId));
          if (false) {
            // Access pass logic removed
            // Old logic removed
            amount = "4.99";
            retakesGranted = "2";
            paymentType = "retakes";
            description = "BizModelAI Quiz Retakes - 2 additional attempts";
          } else {
            // New user needs full access - $9.99
            amount = "9.99";
            retakesGranted = "3";
            paymentType = "access_pass";
            description = "BizModelAI Access Pass - Unlock all features";
          }
        } else {
          // Temporary user always gets full access - $9.99
          amount = "9.99";
          retakesGranted = "3";
          paymentType = "access_pass";
          description = "BizModelAI Access Pass - Unlock all features";
        }

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
                  userIdentifier,
                  type: paymentType,
                  retakesGranted,
                  isTemporaryUser: isTemporaryUser.toString(),
                  sessionId: sessionId || "",
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

        // For temporary users, we don't create a payment record yet
        // For permanent users, create payment record
        let paymentId = null;
        if (!isTemporaryUser) {
          const payment = await storage.createPayment({
            userId: parseInt(userId),
            amount: amount,
            currency: "usd",
            type: paymentType,
            status: "pending",
            stripePaymentIntentId: order.result.id, // Using this field for PayPal order ID
          });
          paymentId = payment.id;
        }

        res.json({
          success: true,
          orderID: order.result.id,
          paymentId,
        });
      } catch (error) {
        console.error("Error creating PayPal payment:", error);
        res.status(500).json({ error: "Internal server error" });
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
          userIdentifier,
          type: paymentType,
          retakesGranted,
          isTemporaryUser,
          sessionId,
        } = metadata;

        // Process the payment similar to Stripe webhook
        if (isTemporaryUser === "true") {
          // Handle temporary user payment
          if (!sessionId) {
            throw new Error("Missing session ID for temporary user");
          }

          // Get the temporary user data
          const tempData = await storage.getTemporaryUser(sessionId);
          if (!tempData) {
            throw new Error("Temporary user data not found");
          }

          // Extract signup data from tempData.tempQuizData (which contains signup info)
          const signupData = tempData.tempQuizData as any;

          // Create the actual user account
          const user = await storage.createUser({
            username: tempData.email, // Use email as username
            password: signupData.passwordHash || "temp_password",
          });

          // Update the user with additional fields
          await storage.updateUser(user.id, {
            email: tempData.email,
          });

          // Create payment record
          const payment = await storage.createPayment({
            userId: user.id,
            amount: purchaseUnit.amount?.value || "9.99",
            currency: "usd",
            type: paymentType,
            stripePaymentIntentId: orderID, // Using this field for PayPal order ID
          });

          // Complete the payment
          await storage.completePayment(payment.id);

          // Temporary data cleanup happens automatically via expiration

          console.log(
            `PayPal payment completed: ${paymentType} for temporary user converted to user ${user.id}`,
          );
        } else {
          // Handle permanent user payment
          const userId = parseInt(userIdentifier);

          // Find the payment record in our database
          const payments = await storage.getPaymentsByUser(userId);
          const payment = payments.find(
            (p) => p.stripePaymentIntentId === orderID,
          );

          if (!payment) {
            console.error(
              "Payment record not found for PayPal order:",
              orderID,
            );
            throw new Error("Payment record not found");
          }

          // Complete the payment in our system
          await storage.completePayment(payment.id);

          console.log(
            `PayPal payment completed: ${paymentType} for user ${userId}`,
          );
        }

        res.json({
          success: true,
          captureID: capture.result.id,
        });
      } catch (error) {
        console.error("Error capturing PayPal payment:", error);
        res.status(500).json({ error: "Internal server error" });
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
              const name = signupData?.name || tempData.name;

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
              let user = await storage.getUserByUsername(email);
              if (!user) {
                try {
                  // Create permanent user account
                  user = await storage.createUser({
                    username: email,
                    password: password, // Already hashed
                  });
                } catch (createUserError) {
                  // If user creation fails due to duplicate email, try to get the user again
                  // This can happen in rare race conditions
                  user = await storage.getUserByUsername(email);
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
            if (
              payment.type === "quiz_payment" ||
              payment.type === "report_unlock"
            ) {
              await storage.completePayment(payment.id);
            } else {
              await storage.completePayment(payment.id);
            }

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

      const payments = await storage.getAllPayments();

      // Join with user data for better admin experience
      const paymentsWithUsers = await Promise.all(
        payments.map(async (payment) => {
          const user = await storage.getUser(payment.userId);
          return {
            ...payment,
            user: user
              ? { id: user.id, email: user.email, username: user.username }
              : null,
          };
        }),
      );

      res.json(paymentsWithUsers);
    } catch (error) {
      console.error("Error fetching payments:", error);
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

      const refunds = await storage.getAllRefunds();
      res.json(refunds);
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
    try {
      const { email, quizData } = req.body;

      if (!email || !quizData) {
        return res.status(400).json({ error: "Missing email or quiz data" });
      }

      const success = await emailService.sendQuizResults(email, quizData);

      if (success) {
        res.json({ success: true, message: "Quiz results sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending quiz results email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/send-welcome-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }

      const success = await emailService.sendWelcomeEmail(email);

      if (success) {
        res.json({ success: true, message: "Welcome email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/send-full-report", async (req: Request, res: Response) => {
    try {
      const { email, quizData } = req.body;

      if (!email || !quizData) {
        return res.status(400).json({ error: "Missing email or quiz data" });
      }

      const success = await emailService.sendFullReport(email, quizData);

      if (success) {
        res.json({ success: true, message: "Full report sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
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

          const prompt = `Based on this user's quiz responses, generate a detailed "Why This Fits You" description for their ${rank === 1 ? "top" : rank === 2 ? "second" : "third"} business match.

User Quiz Data:
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

Generate a detailed personalized analysis of at least 6 sentences explaining why this business model specifically fits this user. Write it as a cohesive paragraph, not bullet points. Be extremely specific about:
1. How their exact personality traits, goals, and preferences align with this business model
2. What specific aspects of their quiz responses make them well-suited for this path
3. How their skills, time availability, and risk tolerance perfectly match the requirements
4. What unique advantages they bring to this business model based on their specific answers
5. How their learning style and work preferences complement this business approach
6. Why this particular combination of traits makes them likely to succeed in this field

Reference specific quiz data points and explain the connections. Make it personal and specific to their responses, not generic advice. Write in a supportive, consultative tone that demonstrates deep understanding of their profile.

CRITICAL: Use ONLY the actual data provided above. Do NOT make up specific numbers, amounts, or timeframes. Reference the exact ranges and values shown in the user profile. If the user selected a range, always refer to the full range, never specific numbers within it.`;

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

          const prompt = `Based on this user's quiz responses, generate a detailed "Why This Doesn't Fit Your Current Profile" description for their ${rank === 1 ? "lowest scoring" : rank === 2 ? "second lowest scoring" : "third lowest scoring"} business match.

User Quiz Data:
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

Generate a detailed personalized analysis of at least 6 sentences explaining why this business model doesn't fit this user's current profile. Write it as a cohesive paragraph, not bullet points. Be specific about:
1. What specific personality traits, goals, or preferences conflict with this business model
2. Which exact quiz responses indicate poor alignment with this path
3. How their skills, time availability, or risk tolerance don't match the requirements
4. What challenges they would likely face based on their specific profile
5. Why their learning style and work preferences would struggle with this business approach
6. What would need to change in their profile before this could become viable

Reference specific quiz data points and explain the misalignments. Be honest but constructive. Write in a supportive tone that helps them understand why focusing on better-matched opportunities would be wiser.

CRITICAL: Use ONLY the actual data provided above. Do NOT make up specific numbers, amounts, or timeframes. Reference the exact ranges and values shown in the user profile. If the user selected a range, always refer to the full range, never specific numbers within it.`;

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
              `This business model doesn't align well with your current profile. Your ${quizData.riskComfortLevel <= 2 ? "lower risk tolerance" : "risk preferences"} and ${quizData.weeklyTimeCommitment} hours/week availability suggest other business models would be more suitable. Your ${quizData.techSkillsRating}/5 technical skills and ${quizData.selfMotivationLevel}/5 self-motivation level indicate potential challenges with this path. Consider focusing on business models that better match your strengths and current situation.`,
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

        res.json({ descriptions: fallbackDescriptions });
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
          name: existingQuizData.name || existingData.name,
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

  // Test email endpoint for debugging
  app.post("/api/test-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      console.log(`Testing email delivery to: ${email}`);

      const success = await emailService.sendEmail({
        to: email,
        subject: "BizModelAI Email Test",
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Email Test Successful!</h2>
              <p>This is a test email from BizModelAI to verify email delivery is working.</p>
              <p>If you received this email, the email system is functioning correctly.</p>
              <p>Time sent: ${new Date().toISOString()}</p>
            </body>
          </html>
        `,
      });

      if (success) {
        res.json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
          hasAccessPass: false, // Access pass concept removed
          accountCreatedAt: user?.createdAt,
          dataWillBeDeletedIfUnpaid: !isPaid,
        });
      } catch (error) {
        console.error("Error getting data retention status:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Test endpoint for debugging retake issue
  app.post("/api/test-retake-flow", async (req: Request, res: Response) => {
    try {
      console.log("=== Testing retake flow ===");

      // Create a test user with access pass
      const testUser = await storage.createUser({
        username: "test-retake-user@example.com",
        password: "test123",
      });
      console.log("Created test user:", testUser.id);

      // Give them access pass
      // Access pass concept removed - users pay per report instead
      console.log("Updated user with access pass and 3 retakes");

      // Simulate first quiz attempt by calling our internal endpoint
      const quizData = { mockQuizData: true };

      // Manually check isPaidUser and user data before attempt
      const isPaid = await storage.isPaidUser(testUser.id);
      const user = await storage.getUser(testUser.id);
      const attemptsCount = await storage.getQuizAttemptsCount(testUser.id);

      console.log("Before quiz attempt:", {
        userId: testUser.id,
        isPaid,
        hasAccessPass: false, // Access pass concept removed
        attemptsCount,
      });

      // Record the quiz attempt
      const attempt = await storage.recordQuizAttempt({
        userId: testUser.id,
        quizData,
      });

      // Check the decrement logic manually
      // Quiz retakes system removed - now using pay-per-quiz model
      console.log("Pay-per-quiz model - no retakes to decrement");

      // Check final status
      const finalUser = await storage.getUser(testUser.id);
      const finalAttemptsCount = await storage.getQuizAttemptsCount(
        testUser.id,
      );

      console.log("After quiz attempt:", {
        userId: testUser.id,
        hasAccessPass: false, // Access pass concept removed
        attemptsCount: finalAttemptsCount,
      });

      res.json({
        success: true,
        testUserId: testUser.id,
        before: {
          isPaid,
          hasAccessPass: false, // Access pass concept removed
          attemptsCount,
        },
        after: {
          hasAccessPass: false, // Access pass concept removed
          attemptsCount: finalAttemptsCount,
        },
      });
    } catch (error) {
      console.error("Error in test retake flow:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Routes registered successfully
}
