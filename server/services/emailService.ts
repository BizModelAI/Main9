import { Resend } from "resend";
import type { QuizData } from "../../shared/types.js";
import { calculateAllBusinessModelMatches } from "../../shared/scoring.js";
import {
  calculatePersonalityScores,
  getPersonalityDescription,
} from "../../shared/personalityScoring.js";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Helper functions to convert stored numbers back to original quiz ranges
const getIncomeRangeLabel = (value: number): string => {
  if (value === 500) return "Less than $500";
  if (value === 1250) return "$500–$2,000";
  if (value === 3500) return "$2,000–$5,000";
  if (value === 7500) return "$5,000+";
  return `$${value}`;
};

// Import centralized utility functions
import { getInvestmentRange, getTimeCommitmentRange } from "../utils/quizUtils.js";

const getInvestmentRangeLabel = (value: number): string => {
  return getInvestmentRange(value);
};

const getTimeCommitmentRangeLabel = (value: number): string => {
  return getTimeCommitmentRange(value);
};

const getTimelineLabel = (value: string): string => {
  const labels: Record<string, string> = {
    "under-1-month": "Under 1 month",
    "1-3-months": "1–3 months",
    "3-6-months": "3–6 months",
    "no-rush": "No rush",
  };
  return labels[value] || value.replace("-", " ");
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static instance: EmailService;
  private emailCache = new Map<string, { lastSent: number; count: number; firstEmailTime: number }>();
  private readonly INITIAL_COOLDOWN = 60 * 1000; // 1 minute for first 5 emails
  private readonly EXTENDED_COOLDOWN = 5 * 60 * 1000; // 5 minutes after first 5 emails
  private readonly INITIAL_EMAIL_LIMIT = 5; // First 5 emails get 1-minute cooldown

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async checkEmailRateLimit(email: string): Promise<boolean> {
    const result = await this.checkEmailRateLimitWithInfo(email);
    return result.allowed;
  }

  private async checkEmailRateLimitWithInfo(email: string): Promise<{ allowed: boolean; info?: { remainingTime: number; type: 'cooldown' | 'extended' } }> {
    const now = Date.now();
    const emailKey = email.toLowerCase();
    const cached = this.emailCache.get(emailKey);

    if (!cached) {
      this.emailCache.set(emailKey, { lastSent: now, count: 1, firstEmailTime: now });
      return { allowed: true };
    }

    // Determine which cooldown period to use
    const isWithinInitialPeriod = cached.count <= this.INITIAL_EMAIL_LIMIT;
    const currentCooldown = isWithinInitialPeriod ? this.INITIAL_COOLDOWN : this.EXTENDED_COOLDOWN;
    const type = isWithinInitialPeriod ? 'cooldown' : 'extended';

    // Check if within cooldown period
    if (now - cached.lastSent < currentCooldown) {
      const remainingTime = currentCooldown - (now - cached.lastSent);
      console.log(`Email rate limit hit for ${email}: too soon since last email (${type} period)`);
      return { 
        allowed: false, 
        info: { 
          remainingTime: Math.ceil(remainingTime / 1000), // Convert to seconds
          type 
        } 
      };
    }

    // Update the cache with new email
    const newCount = cached.count + 1;
    this.emailCache.set(emailKey, { 
      lastSent: now, 
      count: newCount, 
      firstEmailTime: cached.firstEmailTime 
    });
    
    return { allowed: true };
  }

  private cleanupEmailCache(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [email, data] of this.emailCache.entries()) {
      if (data.lastSent < oneHourAgo) {
        this.emailCache.delete(email);
      }
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; rateLimitInfo?: { remainingTime: number; type: 'cooldown' | 'extended' } }> {
    // Clean up old cache entries
    this.cleanupEmailCache();

    // Check rate limit
    const rateLimitCheck = await this.checkEmailRateLimitWithInfo(options.to);
    if (!rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for email: ${options.to}`);
      return { success: false, rateLimitInfo: rateLimitCheck.info };
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      
      // In development mode, log the email instead of failing
      if (process.env.NODE_ENV === "development") {
        console.log("=== EMAIL WOULD BE SENT (Development Mode) ===");
        console.log("To:", options.to);
        console.log("Subject:", options.subject);
        console.log("HTML Preview:", options.html.substring(0, 200) + "...");
        console.log("=== END EMAIL LOG ===");
        return { success: true }; // Return success in development mode
      }
      
      return { success: false };
    }

    try {
      console.log(`Attempting to send email to: ${options.to}`);
      console.log(`Subject: ${options.subject}`);

      if (!resend) {
        throw new Error("Resend API key not configured");
      }

      const { data, error } = await resend.emails.send({
        from: "BizModelAI <team@bizmodelai.com>",
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error("Resend API error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return { success: false };
      }

      console.log("Email sent successfully to:", options.to);
      console.log("Email ID:", data?.id);
      console.log("Email data:", data);
      return { success: true };
    } catch (error) {
      console.error("Error sending email:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      return { success: false };
    }
  }

  private async checkUnsubscribeStatus(email: string): Promise<boolean> {
    try {
      const { storage } = await import("../storage.js");
      const user = await storage.getUserByEmail(email);
      return user?.isUnsubscribed || false;
    } catch (error) {
      console.error("Error checking unsubscribe status:", error);
      return false; // Default to allowing emails if check fails
    }
  }

  async sendQuizResults(email: string, quizData: QuizData): Promise<{ success: boolean; rateLimitInfo?: { remainingTime: number; type: 'cooldown' | 'extended' } }> {
    const subject = "Your BizModelAI Business Path Results";
    const html = this.generateQuizResultsHTML(quizData);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(email: string): Promise<{ success: boolean; rateLimitInfo?: { remainingTime: number; type: 'cooldown' | 'extended' } }> {
    const subject = "Welcome to BizModelAI!";
    const html = this.generateWelcomeHTML();

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendFullReport(email: string, quizData: QuizData): Promise<{ success: boolean; rateLimitInfo?: { remainingTime: number; type: 'cooldown' | 'extended' } }> {
    const subject = "Your Complete BizModelAI Business Report";
    const html = this.generateFullReportHTML(quizData);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
  ): Promise<{ success: boolean; rateLimitInfo?: { remainingTime: number; type: 'cooldown' | 'extended' } }> {
    const subject = "Reset Your BizModelAI Password";
    const html = this.generatePasswordResetHTML(resetUrl);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendContactFormNotification(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category: string;
  }): Promise<{ success: boolean; rateLimitInfo?: { remainingTime: number; type: 'cooldown' | 'extended' } }> {
    const subject = `New Contact Form: ${formData.subject}`;
    const html = this.generateContactFormNotificationHTML(formData);

    return await this.sendEmail({
      to: "team@bizmodelai.com",
      subject,
      html,
    });
  }

  async sendContactFormConfirmation(
    userEmail: string,
    userName: string,
  ): Promise<{ success: boolean; rateLimitInfo?: { remainingTime: number; type: 'cooldown' | 'extended' } }> {
    const subject = "We received your message - BizModelAI";
    const html = this.generateContactFormConfirmationHTML(userName);

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  private generateQuizResultsHTML(quizData: QuizData): string {
    const topBusinessModel = this.getTopBusinessModel(quizData);
    const personalizedPaths = this.getPersonalizedPaths(quizData);
    const top3Paths = personalizedPaths.slice(0, 3);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light only">
          <meta name="supported-color-schemes" content="light">
          <title>Your BizModelAI Results</title>
          <style>
            ${this.getBrighterStyles()}
          </style>
        </head>
        <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC !important; color: #000000 !important;">
          <div class="email-container" style="max-width: 800px; margin: 0 auto; background: #FFFFFF !important; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #E5E7EB;">
            <div class="header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 60px 40px; text-align: center; position: relative; overflow: hidden;">
              <div class="logo" style="width: 80px; height: 80px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 70px; height: 70px; object-fit: contain; border-radius: 12px; background: white; padding: 10px; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);">
              </div>
              <h1 style="font-size: 36px; font-weight: 800; margin-bottom: 16px; position: relative; z-index: 1; color: white !important; letter-spacing: -0.025em;">Your AI-Powered Business Blueprint</h1>
              <p style="font-size: 20px; opacity: 0.95; position: relative; z-index: 1; color: white !important; font-weight: 500;">Personalized recommendations based on your unique goals, skills, and preferences</p>
            </div>
            
            <div class="content" style="padding: 60px 40px; background: #FFFFFF !important; color: #000000 !important;">
              <div class="section" style="margin-bottom: 50px;">
                <h2 class="section-title" style="font-size: 28px; font-weight: 700; color: #111827 !important; margin-bottom: 32px; display: flex; align-items: center; letter-spacing: -0.025em;">Your Best Fit Business Model</h2>
                
                <!-- Top Match Card -->
                <div class="top-match-card" style="background: linear-gradient(135deg, #FEF3C7 0%, #FCD34D 5%, #FFFFFF 10%) !important; border: 3px solid #F59E0B; border-radius: 24px; padding: 40px; margin-bottom: 40px; position: relative; text-align: center; box-shadow: 0 20px 60px rgba(245, 158, 11, 0.15);">
                  <div class="match-badge" style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white !important; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: 700; display: inline-block; margin-bottom: 24px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);">
                    ⭐ AI RECOMMENDED
                  </div>
                  <h3 class="match-name" style="font-size: 32px; font-weight: 800; color: #111827 !important; margin-bottom: 16px; letter-spacing: -0.025em;">${topBusinessModel.name}</h3>
                  <p class="match-description" style="font-size: 18px; color: #4B5563 !important; margin-bottom: 32px; line-height: 1.6; max-width: 600px; margin-left: auto; margin-right: auto;">${topBusinessModel.description}</p>
                  <div class="match-score" style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white !important; padding: 16px 32px; border-radius: 30px; font-weight: 700; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);">
                    <span class="score-label" style="margin-right: 12px; font-size: 16px; color: white !important;">Fit Score:</span>
                    <span class="score-value" style="font-size: 24px; font-weight: 800; color: white !important;">${topBusinessModel.fitScore}%</span>
                  </div>
                </div>
                
                <!-- Additional Business Models (Locked) -->
                ${top3Paths.slice(1).map((path, index) => `
                <div class="business-card" style="background: #FFFFFF !important; border: 2px solid #E5E7EB; border-radius: 24px; padding: 40px; margin-bottom: 32px; position: relative; text-align: center; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08); transition: all 0.3s ease;">
                  <div class="card-header" style="display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                    <div class="rank-badge" style="background: #F3F4F6; color: #6B7280 !important; padding: 8px 20px; border-radius: 25px; font-size: 14px; font-weight: 600; margin-right: 16px;">#${index + 2}</div>
                    <div class="score-badge" style="background: linear-gradient(135deg, #2563EB, #7C3AED); color: white !important; padding: 10px 20px; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.2);">${path.fitScore}% Match</div>
                  </div>
                  
                  <h3 style="font-size: 24px; font-weight: 700; color: #111827 !important; margin-bottom: 16px; letter-spacing: -0.025em;">${path.name}</h3>
                  <p style="font-size: 16px; color: #6B7280 !important; margin-bottom: 32px; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto;">${path.description}</p>
                  
                  <div class="path-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;">
                    <div class="detail-item" style="background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #E5E7EB;">
                      <div style="font-size: 12px; color: #6B7280 !important; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Difficulty</div>
                      <div style="font-weight: 700; color: #111827 !important; font-size: 16px;">${path.difficulty}</div>
                    </div>
                    <div class="detail-item" style="background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #E5E7EB;">
                      <div style="font-size: 12px; color: #6B7280 !important; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Time to Profit</div>
                      <div style="font-weight: 700; color: #111827 !important; font-size: 16px;">${path.timeToProfit}</div>
                    </div>
                    <div class="detail-item" style="background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #E5E7EB;">
                      <div style="font-size: 12px; color: #6B7280 !important; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Startup Cost</div>
                      <div style="font-weight: 700; color: #111827 !important; font-size: 16px;">${path.startupCost}</div>
                    </div>
                    <div class="detail-item" style="background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #E5E7EB;">
                      <div style="font-size: 12px; color: #6B7280 !important; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Income Potential</div>
                      <div style="font-weight: 700; color: #111827 !important; font-size: 16px;">${path.potentialIncome}</div>
                    </div>
                  </div>
                  
                  <div class="cta-button-container" style="text-align: center; margin-top: 24px;">
                    <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/results" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">
                      Unlock Full Results →
                    </a>
                  </div>
                </div>
                `).join("")}
              </div>

              <div class="section" style="margin-bottom: 50px;">
                <h2 class="section-title" style="font-size: 28px; font-weight: 700; color: #111827 !important; margin-bottom: 32px; display: flex; align-items: center; letter-spacing: -0.025em;">Your Business Profile</h2>
                <div class="profile-card" style="background: #FFFFFF !important; border: 1px solid #E5E7EB; border-radius: 20px; padding: 40px; margin-bottom: 40px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);">
                  <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid #F3F4F6;">
                    <span class="profile-label" style="font-weight: 600; color: #6B7280 !important; font-size: 16px;">Main Motivation</span>
                    <span class="profile-value" style="font-weight: 700; color: #111827 !important; font-size: 16px;">${this.formatMotivation(quizData.mainMotivation)}</span>
                  </div>
                  <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid #F3F4F6;">
                    <span class="profile-label" style="font-weight: 600; color: #6B7280 !important; font-size: 16px;">Income Goal</span>
                    <span class="profile-value" style="font-weight: 700; color: #111827 !important; font-size: 16px;">${getIncomeRangeLabel(quizData.successIncomeGoal)}</span>
                  </div>
                  <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid #F3F4F6;">
                    <span class="profile-label" style="font-weight: 600; color: #6B7280 !important; font-size: 16px;">Timeline</span>
                    <span class="profile-value" style="font-weight: 700; color: #111827 !important; font-size: 16px;">${this.formatTimeline(quizData.firstIncomeTimeline)}</span>
                  </div>
                  <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0;">
                    <span class="profile-label" style="font-weight: 600; color: #6B7280 !important; font-size: 16px;">Investment Budget</span>
                    <span class="profile-value" style="font-weight: 700; color: #111827 !important; font-size: 16px;">${getInvestmentRangeLabel(quizData.upfrontInvestment)}</span>
                  </div>
                </div>
              </div>

              <div class="section" style="margin-bottom: 50px;">
                <h2 class="section-title" style="font-size: 28px; font-weight: 700; color: #111827 !important; margin-bottom: 32px; display: flex; align-items: center; letter-spacing: -0.025em;">What's Waiting for You</h2>
                <ul class="steps-list" style="list-style: none; padding: 0; background: #FFFFFF !important;">
                  <li style="padding: 20px 0; padding-left: 60px; position: relative; color: #111827 !important; font-size: 18px; line-height: 1.6; font-weight: 500;">View your top-matched business models with personalized fit scores</li>
                  <li style="padding: 20px 0; padding-left: 60px; position: relative; color: #111827 !important; font-size: 18px; line-height: 1.6; font-weight: 500;">Get detailed step-by-step implementation guides</li>
                  <li style="padding: 20px 0; padding-left: 60px; position: relative; color: #111827 !important; font-size: 18px; line-height: 1.6; font-weight: 500;">Access curated resources, tools, and templates</li>
                  <li style="padding: 20px 0; padding-left: 60px; position: relative; color: #111827 !important; font-size: 18px; line-height: 1.6; font-weight: 500;">Download your comprehensive PDF business report</li>
                  <li style="padding: 20px 0; padding-left: 60px; position: relative; color: #111827 !important; font-size: 18px; line-height: 1.6; font-weight: 500;">Explore income projections and timeline expectations</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/results" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 20px 40px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 18px; text-align: center; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">
                  Unlock Full Results →
                </a>
              </div>
            </div>

                        <div class="footer" style="background: #1E293B !important; padding: 50px 40px; text-align: center; border-top: 1px solid #334155;">
              <a href="https://bizmodelai.com" style="text-decoration: none;">
                <div class="footer-logo" style="font-size: 24px; font-weight: 800; color: #FFFFFF !important; margin-bottom: 12px; letter-spacing: -0.025em;">BizModelAI</div>
              </a>
              <div class="footer-tagline" style="color: #D1D5DB !important; font-size: 18px; margin-bottom: 32px; font-weight: 500;">Your AI-Powered Business Discovery Platform</div>

                            <div class="footer-disclaimer" style="font-size: 16px; color: #9CA3AF !important; line-height: 1.6; margin-bottom: 24px; font-weight: 500;">
                This email was sent because you completed our business assessment quiz.<br>
                We're here to help you discover your perfect business path.
              </div>

              <div class="data-retention-notice" style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 12px; padding: 20px; margin: 24px 0; font-size: 14px; color: #92400E !important; line-height: 1.5;">
                <strong> Data Retention Notice:</strong><br>
                Your quiz results and data will be stored securely for <strong>3 months</strong> from today. After this period, your data will be automatically deleted from our systems unless you create a paid account.<br><br>
                <strong>Want to keep your results forever?</strong> <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/results" style="color: #92400E !important; text-decoration: underline;">Upgrade to unlock your full report</a> and your data will be saved permanently.
              </div>
              <div class="footer-unsubscribe" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #334155;">
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/unsubscribe" class="unsubscribe-link" style="color: #9CA3AF !important; text-decoration: none; font-size: 16px; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
                  Unsubscribe
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private formatMotivation(motivation: string): string {
    const motivationMap: { [key: string]: string } = {
      "financial-freedom": "Financial Freedom",
      "flexible-schedule": "Flexible Schedule",
      "passion-project": "Passion Project",
      "career-change": "Career Change",
      "side-income": "Side Income",
      "creative-expression": "Creative Expression",
    };
    return motivationMap[motivation] || motivation;
  }

  private formatTimeline(timeline: string): string {
    const timelineMap: { [key: string]: string } = {
      immediately: "Immediately",
      "1-3-months": "1-3 Months",
      "3-6-months": "3-6 Months",
      "6-12-months": "6-12 Months",
      "1-year-plus": "1+ Years",
    };
    return timelineMap[timeline] || timeline;
  }

  private getTopBusinessModel(quizData: QuizData): {
    name: string;
    description: string;
    fitScore: number;
  } {
    // Use the same scoring algorithm as the frontend
    const scoredBusinessModels = calculateAllBusinessModelMatches(quizData);

    // Get the top match (highest score)
    const topMatch = scoredBusinessModels[0];

    // Map business model descriptions
    const businessDescriptions: { [key: string]: string } = {
      "Affiliate Marketing":
        "Promote other people's products and earn commission on sales",
      "Content Creation / UGC":
        "Create valuable content and monetize through multiple channels",
      "Online Coaching":
        "Share your expertise through 1-on-1 or group coaching programs",
      "E-commerce Brand Building":
        "Sell physical or digital products through your own online store",
      Freelancing:
        "Offer your skills and services to clients on a project basis",
      "Copywriting / Ghostwriting":
        "Write compelling content for businesses and individuals",
      "Social Media Marketing Agency":
        "Help businesses grow their social media presence",
      "Virtual Assistant":
        "Provide administrative and business support remotely",
      "High-Ticket Sales / Closing":
        "Sell high-value products or services for businesses",
      "AI Marketing Agency": "Leverage AI tools to provide marketing solutions",
      "Digital Services Agency": "Offer digital marketing and web services",
      "YouTube Automation": "Create and manage monetized YouTube channels",
      "Investing / Trading": "Generate income through financial markets",
      "Online Reselling": "Buy and resell products online for profit",
      "Handmade Goods": "Create and sell handcrafted products",
    };

    return {
      name: topMatch.name,
      description:
        businessDescriptions[topMatch.name] ||
        "A business model tailored to your skills and goals",
      fitScore: Math.round(topMatch.score),
    };
  }

  private getPersonalizedPaths(quizData: QuizData): Array<{
    id: string;
    name: string;
    description: string;
    fitScore: number;
    difficulty: string;
    timeToProfit: string;
    startupCost: string;
    potentialIncome: string;
  }> {
    // Use the same scoring algorithm as the frontend
    const scoredBusinessModels = calculateAllBusinessModelMatches(quizData);

    // Map business model data with details
    const businessModelData: {
      [key: string]: {
        id: string;
        description: string;
        difficulty: string;
        timeToProfit: string;
        startupCost: string;
        potentialIncome: string;
      };
    } = {
      "Affiliate Marketing": {
        id: "affiliate-marketing",
        description:
          "Promote other people's products and earn commission on sales. Build trust with your audience and recommend products you genuinely believe in.",
        difficulty: "Easy",
        timeToProfit: "3-6 months",
        startupCost: "$0-$500",
        potentialIncome: "$500-$10,000+/month",
      },
      "Content Creation / UGC": {
        id: "content-creation",
        description:
          "Create valuable content and monetize through multiple channels. Share your expertise, entertain, or educate your audience.",
        difficulty: "Medium",
        timeToProfit: "6-12 months",
        startupCost: "$200-$1,500",
        potentialIncome: "$1,000-$50,000+/month",
      },
      "Online Coaching": {
        id: "online-coaching",
        description:
          "Share your expertise through 1-on-1 or group coaching programs. Help others achieve their goals while building a profitable business.",
        difficulty: "Medium",
        timeToProfit: "2-4 months",
        startupCost: "$100-$1,000",
        potentialIncome: "$2,000-$25,000+/month",
      },
      "E-commerce Brand Building": {
        id: "e-commerce",
        description:
          "Sell physical or digital products through your own online store. Build a brand and create products people love.",
        difficulty: "Hard",
        timeToProfit: "6-18 months",
        startupCost: "$1,000-$10,000",
        potentialIncome: "$2,000-$100,000+/month",
      },
      Freelancing: {
        id: "freelancing",
        description:
          "Offer your skills and services to clients on a project basis. Turn your expertise into immediate income.",
        difficulty: "Easy",
        timeToProfit: "1-3 months",
        startupCost: "$0-$500",
        potentialIncome: "$1,000-$15,000+/month",
      },
      "Copywriting / Ghostwriting": {
        id: "copywriting",
        description:
          "Write compelling content for businesses and individuals. Help others communicate their message effectively.",
        difficulty: "Medium",
        timeToProfit: "2-6 months",
        startupCost: "$0-$500",
        potentialIncome: "$1,500-$20,000+/month",
      },
      "Social Media Marketing Agency": {
        id: "social-media-agency",
        description:
          "Help businesses grow their social media presence. Manage accounts, create content, and drive engagement.",
        difficulty: "Medium",
        timeToProfit: "3-6 months",
        startupCost: "$500-$2,000",
        potentialIncome: "$2,000-$30,000+/month",
      },
      "Virtual Assistant": {
        id: "virtual-assistant",
        description:
          "Provide administrative and business support remotely. Help entrepreneurs and businesses stay organized and efficient.",
        difficulty: "Easy",
        timeToProfit: "1-2 months",
        startupCost: "$0-$300",
        potentialIncome: "$800-$5,000+/month",
      },
      "High-Ticket Sales / Closing": {
        id: "high-ticket-sales",
        description:
          "Sell high-value products or services for businesses. Master the art of persuasion and earn substantial commissions.",
        difficulty: "Hard",
        timeToProfit: "3-9 months",
        startupCost: "$500-$2,000",
        potentialIncome: "$5,000-$50,000+/month",
      },
      "AI Marketing Agency": {
        id: "ai-marketing-agency",
        description:
          "Leverage AI tools to provide marketing solutions. Stay ahead of the curve with cutting-edge technology.",
        difficulty: "Medium",
        timeToProfit: "3-6 months",
        startupCost: "$300-$1,500",
        potentialIncome: "$2,000-$25,000+/month",
      },
      "Digital Services Agency": {
        id: "digital-services-agency",
        description:
          "Offer digital marketing and web services. Help businesses establish and grow their online presence.",
        difficulty: "Medium",
        timeToProfit: "3-6 months",
        startupCost: "$500-$2,000",
        potentialIncome: "$2,000-$30,000+/month",
      },
      "YouTube Automation Channels": {
        id: "youtube-automation",
        description:
          "Create and manage monetized YouTube channels. Build passive income through content creation and optimization.",
        difficulty: "Hard",
        timeToProfit: "6-18 months",
        startupCost: "$1,000-$5,000",
        potentialIncome: "$1,000-$20,000+/month",
      },
      "Investing / Trading": {
        id: "investing",
        description:
          "Generate income through financial markets. Build wealth through strategic investments and trading strategies.",
        difficulty: "Hard",
        timeToProfit: "6-24 months",
        startupCost: "$1,000-$10,000",
        potentialIncome: "$500-$50,000+/month",
      },
      "Online Reselling": {
        id: "online-reselling",
        description:
          "Buy and resell products online for profit. Find profitable products and scale your reselling business.",
        difficulty: "Easy",
        timeToProfit: "1-3 months",
        startupCost: "$500-$2,000",
        potentialIncome: "$1,000-$10,000+/month",
      },
      "Handmade Goods": {
        id: "handmade-goods",
        description:
          "Create and sell handcrafted products. Turn your creative skills into a profitable business.",
        difficulty: "Medium",
        timeToProfit: "3-6 months",
        startupCost: "$200-$1,500",
        potentialIncome: "$500-$8,000+/month",
      },
    };

    // Map scored models to detailed business paths
    return scoredBusinessModels.map((model) => {
      const modelData = businessModelData[model.name];
      return {
        id: modelData?.id || model.name.toLowerCase().replace(/\s+/g, "-"),
        name: model.name,
        description:
          modelData?.description ||
          "A business model tailored to your skills and goals",
        fitScore: Math.round(model.score),
        difficulty: modelData?.difficulty || "Medium",
        timeToProfit: modelData?.timeToProfit || "3-6 months",
        startupCost: modelData?.startupCost || "$100-$1,000",
        potentialIncome: modelData?.potentialIncome || "$1,000-$10,000+/month",
      };
    });
  }

  private generateWelcomeHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light only">
          <meta name="supported-color-schemes" content="light">
          <title>Welcome to BizModelAI</title>
          <style>
            ${this.getBrighterStyles()}
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
                            <div class="logo" style="width: 70px; height: 70px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: white; padding: 8px; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);">
              </div>
              <h1>Welcome to BizModelAI!</h1>
              <p>Your journey to business success starts here</p>
            </div>
            
            <div class="content">
              <div class="section">
                <h2 class="section-title">What's Next?</h2>
                <ul class="steps-list">
                  <li>Complete our comprehensive business assessment quiz</li>
                  <li>Get personalized business model recommendations</li>
                  <li>Access detailed implementation guides and resources</li>
                  <li>Download your complete business strategy report</li>
                </ul>
              </div>

              <div class="cta-container">
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/quiz" class="cta-button">
                  Start Your Assessment →
                </a>
                <p style="margin-top: 12px; font-size: 14px; color: #6B7280;">
                  Takes just 10-15 minutes to complete
                </p>
              </div>
            </div>

                        <div class="footer">
              <div class="footer-logo">BizModelAI</div>
              <div class="footer-tagline">Your AI-Powered Business Discovery Platform</div>

              <!-- Social Media Links -->
              <div class="social-media" style="margin-bottom: 20px;">
                <a href="https://www.instagram.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" alt="Instagram" style="width: 24px; height: 24px; filter: grayscale(1) brightness(0) invert(0.4);">
                </a>
                <a href="https://www.tiktok.com/@bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/tiktok.svg" alt="TikTok" style="width: 24px; height: 24px; filter: grayscale(1) brightness(0) invert(0.4);">
                </a>
                <a href="https://x.com/bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg" alt="X (Twitter)" style="width: 24px; height: 24px; filter: grayscale(1) brightness(0) invert(0.4);">
                </a>
                <a href="https://www.pinterest.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/pinterest.svg" alt="Pinterest" style="width: 24px; height: 24px; filter: grayscale(1) brightness(0) invert(0.4);">
                </a>
              </div>

              <div class="footer-disclaimer">
                Ready to discover your perfect business path?<br>
                We're here to guide you every step of the way.
              </div>
              <div class="footer-unsubscribe">
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/unsubscribe" class="unsubscribe-link">
                  Unsubscribe
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
        `;
  }

  private generatePasswordResetHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light only">
          <meta name="supported-color-schemes" content="light">
          <title>Reset Your Password - BizModelAI</title>
          <style>
            ${this.getBrighterStyles()}
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo" style="width: 70px; height: 70px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: white; padding: 8px; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);">
              </div>
              <h1>Reset Your Password</h1>
              <p>We received a request to reset your BizModelAI password</p>
            </div>

            <div class="content">
              <div class="section">
                <p style="margin-bottom: 24px; color: #374151; line-height: 1.6;">
                  Click the button below to reset your password. This link will expire in 1 hour for security purposes.
                </p>

                <div class="cta-container">
                  <a href="${resetUrl}" class="cta-button">
                    Reset My Password
                  </a>
                </div>

                <div style="margin-top: 32px; padding: 20px; background: #F3F4F6; border-radius: 12px; border-left: 4px solid #F59E0B;">
                  <h3 style="margin: 0 0 12px; font-size: 16px; color: #92400E;">
                    Security Tips:
                  </h3>
                  <ul style="margin: 0; padding-left: 20px; color: #78350F;">
                    <li>This link expires in 1 hour</li>
                    <li>If you didn't request this reset, you can safely ignore this email</li>
                    <li>Never share your password with anyone</li>
                  </ul>
                </div>

                <p style="margin-top: 24px; font-size: 14px; color: #6B7280;">
                  If the button above doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #7C3AED; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
            </div>

                        <div class="footer">
              <div class="footer-logo">BizModelAI</div>
              <div class="footer-tagline">Your AI-Powered Business Discovery Platform</div>

              <!-- Social Media Links -->
              <div class="social-media" style="margin-bottom: 20px;">
                <a href="https://www.instagram.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" alt="Instagram" style="width: 24px; height: 24px; filter: grayscale(1) brightness(0) invert(0.4);">
                </a>
                <a href="https://www.tiktok.com/@bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/tiktok.svg" alt="TikTok" style="width: 24px; height: 24px; filter: grayscale(1) brightness(0) invert(0.4);">
                </a>
                <a href="https://x.com/bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg" alt="X (Twitter)" style="width: 24px; height: 24px; filter: grayscale(1) brightness(0) invert(0.4);">
                </a>
                <a href="https://www.pinterest.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/pinterest.svg" alt="Pinterest" style="width: 24px; height: 24px; filter: grayscale(1) brightness(0) invert(0.4);">
                </a>
              </div>

              <div class="footer-disclaimer">
                If you didn't request this password reset, please ignore this email.<br>
                Your account security is important to us.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateFullReportHTML(quizData: QuizData): string {
    const personalizedPaths = this.getPersonalizedPaths(quizData);
    const top3Paths = personalizedPaths.slice(0, 3);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light only">
          <meta name="supported-color-schemes" content="light">
          <title>Your Complete Business Report</title>
          <style>
            ${this.getBrighterStyles()}
          </style>
        </head>
        <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC !important; color: #000000 !important;">
          <div class="email-container" style="max-width: 800px; margin: 0 auto; background: #FFFFFF !important; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); border: 1px solid #E5E7EB;">
            <div class="header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
                            <div class="logo" style="width: 70px; height: 70px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: white; padding: 8px; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);">
              </div>
              <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; color: white !important;">Your AI-Powered Business Blueprint</h1>
              <p style="font-size: 18px; opacity: 0.95; position: relative; z-index: 1; color: white !important;">Complete Analysis & Implementation Guide</p>
            </div>
            
            <div class="content" style="padding: 50px 40px; background: #FFFFFF !important; color: #000000 !important;">
              
              <!-- AI-Generated Insights Section -->
              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 24px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">
                  ✨ Your AI-Generated Insights
                </h2>
                <div class="ai-insights-card" style="background: linear-gradient(135deg, #7C3AED 0%, #2563EB 100%); border-radius: 20px; padding: 30px; margin-bottom: 30px; color: white !important; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
                  <div class="insights-content" style="color: white !important;">
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: white !important;">
                      <strong>Personalized Analysis:</strong> Based on your comprehensive assessment, <strong>${top3Paths[0].name}</strong> achieves a <strong>${top3Paths[0].fitScore}%</strong> compatibility score with your unique profile. Your goals, personality traits, and available resources align perfectly with this business model's requirements and potential outcomes.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: white !important;">
                      With your <strong>${this.formatMotivation(quizData.mainMotivation)}</strong> motivation and <strong>${getIncomeRangeLabel(quizData.successIncomeGoal)}</strong> income goal, you're positioned for success in the ${quizData.successIncomeGoal >= 5000 ? "high-growth" : "sustainable income"} category. Your ${getTimeCommitmentRangeLabel(quizData.weeklyTimeCommitment)} weekly commitment shows ${quizData.weeklyTimeCommitment >= 20 ? "strong dedication" : "balanced approach"} to building your business.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: white !important;">
                      Your ${quizData.techSkillsRating >= 4 ? "strong" : "adequate"} tech skills and ${quizData.learningPreference} learning preference indicate you're ${quizData.techSkillsRating >= 4 ? "technically capable and ready for advanced strategies" : "perfectly positioned for user-friendly business models"}. This combination creates an ideal foundation for ${top3Paths[0].name} success.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Top 3 Business Models Section -->
              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 24px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">
                   Your Top 3 Business Matches
                </h2>
                
                ${top3Paths
                  .map(
                    (path, index) => `
                  <div class="business-card" style="background: #FFFFFF !important; border: 2px solid ${index === 0 ? "#F59E0B" : "#E5E7EB"}; border-radius: 20px; padding: 30px; margin-bottom: 24px; ${index === 0 ? "background: linear-gradient(135deg, #FEF3C7 0%, #FCD34D 5%, #FFFFFF 10%) !important;" : ""} box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);">
                    <div class="card-header" style="display: flex; align-items: center; margin-bottom: 20px;">
                      ${index === 0 ? '<div class="rank-badge" style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white !important; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 12px;">BEST FIT</div>' : `<div class="rank-badge" style="background: #E5E7EB; color: #6B7280 !important; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 12px;">#${index + 1}</div>`}
                      <div class="score-badge" style="background: linear-gradient(135deg, #2563EB, #7C3AED); color: white !important; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px;">${path.fitScore}% Match</div>
                    </div>
                    
                    <h3 style="font-size: 20px; font-weight: 700; color: #000000 !important; margin-bottom: 12px;">${path.name}</h3>
                    <p style="font-size: 16px; color: #4B5563 !important; margin-bottom: 20px; line-height: 1.5;">${path.description}</p>
                    
                    <div class="path-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                      <div class="detail-item" style="background: #F9FAFB; padding: 12px; border-radius: 8px; border: 1px solid #E5E7EB;">
                        <div style="font-size: 12px; color: #6B7280 !important; margin-bottom: 4px;">Difficulty</div>
                        <div style="font-weight: 600; color: #000000 !important;">${path.difficulty}</div>
                      </div>
                      <div class="detail-item" style="background: #F9FAFB; padding: 12px; border-radius: 8px; border: 1px solid #E5E7EB;">
                        <div style="font-size: 12px; color: #6B7280 !important; margin-bottom: 4px;">Time to Profit</div>
                        <div style="font-weight: 600; color: #000000 !important;">${path.timeToProfit}</div>
                      </div>
                      <div class="detail-item" style="background: #F9FAFB; padding: 12px; border-radius: 8px; border: 1px solid #E5E7EB;">
                        <div style="font-size: 12px; color: #6B7280 !important; margin-bottom: 4px;">Startup Cost</div>
                        <div style="font-weight: 600; color: #000000 !important;">${path.startupCost}</div>
                      </div>
                      <div class="detail-item" style="background: #F9FAFB; padding: 12px; border-radius: 8px; border: 1px solid #E5E7EB;">
                        <div style="font-size: 12px; color: #6B7280 !important; margin-bottom: 4px;">Income Potential</div>
                        <div style="font-weight: 600; color: #000000 !important;">${path.potentialIncome}</div>
                      </div>
                    </div>
                    
                    <div class="cta-button-container" style="text-align: center; margin-top: 20px;">
                      <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/business-model/${path.id}" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                        Learn More About ${path.name} →
                      </a>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>

              <!-- Key Recommendations Section -->
              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 24px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">
                   Key Recommendations
                </h2>
                <div class="recommendations-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                  <div class="recommendation-card" style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px; padding: 20px;">
                    <h4 style="font-weight: 600; color: #0369A1 !important; margin-bottom: 8px; display: flex; align-items: center;">
                       Best Strategy
                    </h4>
                    <p style="color: #1E40AF !important; font-size: 14px; line-height: 1.5;">
                      ${quizData.techSkillsRating >= 4 ? "Leverage your strong technical skills to build automated systems and scalable solutions" : "Focus on proven, user-friendly methods that don't require advanced technical knowledge"}
                    </p>
                  </div>
                  <div class="recommendation-card" style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px;">
                    <h4 style="font-weight: 600; color: #047857 !important; margin-bottom: 8px; display: flex; align-items: center;">
                      ⚡ Quick Win
                    </h4>
                    <p style="color: #065F46 !important; font-size: 14px; line-height: 1.5;">
                      ${quizData.learningPreference === "hands-on" ? "Start with a small pilot project to learn by doing and build momentum quickly" : "Invest time in comprehensive learning before launching to ensure solid foundation"}
                    </p>
                  </div>
                  <div class="recommendation-card" style="background: #FEF3C7; border: 1px solid #FDE047; border-radius: 12px; padding: 20px;">
                    <h4 style="font-weight: 600; color: #92400E !important; margin-bottom: 8px; display: flex; align-items: center;">
                       Growth Path
                    </h4>
                    <p style="color: #78350F !important; font-size: 14px; line-height: 1.5;">
                      ${quizData.riskComfortLevel >= 4 ? "Your high risk tolerance allows for aggressive growth strategies and innovative approaches" : "Focus on steady, proven growth methods that minimize risk while building confidence"}
                    </p>
                  </div>
                  <div class="recommendation-card" style="background: #F3E8FF; border: 1px solid #D8B4FE; border-radius: 12px; padding: 20px;">
                    <h4 style="font-weight: 600; color: #7C2D12 !important; margin-bottom: 8px; display: flex; align-items: center;">
                       Timeline
                    </h4>
                    <p style="color: #6B21A8 !important; font-size: 14px; line-height: 1.5;">
                      With ${getTimeCommitmentRangeLabel(quizData.weeklyTimeCommitment)} weekly commitment, expect ${quizData.weeklyTimeCommitment >= 20 ? "accelerated progress and faster results" : "steady progress with sustainable growth"}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Your Business Profile Section -->
              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 24px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">
                   Your Business Profile
                </h2>
                <div class="profile-card" style="background: #FFFFFF !important; border: 1px solid #E5E7EB; border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);">
                  <div class="profile-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #F3F4F6;">
                      <span class="profile-label" style="font-weight: 500; color: #6B7280 !important; font-size: 15px;">Main Motivation</span>
                      <span class="profile-value" style="font-weight: 600; color: #000000 !important; font-size: 15px;">${this.formatMotivation(quizData.mainMotivation)}</span>
                    </div>
                    <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #F3F4F6;">
                      <span class="profile-label" style="font-weight: 500; color: #6B7280 !important; font-size: 15px;">Income Goal</span>
                      <span class="profile-value" style="font-weight: 600; color: #000000 !important; font-size: 15px;">${getIncomeRangeLabel(quizData.successIncomeGoal)}</span>
                    </div>
                    <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #F3F4F6;">
                      <span class="profile-label" style="font-weight: 500; color: #6B7280 !important; font-size: 15px;">Timeline</span>
                      <span class="profile-value" style="font-weight: 600; color: #000000 !important; font-size: 15px;">${this.formatTimeline(quizData.firstIncomeTimeline)}</span>
                    </div>
                    <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #F3F4F6;">
                      <span class="profile-label" style="font-weight: 500; color: #6B7280 !important; font-size: 15px;">Investment Budget</span>
                      <span class="profile-value" style="font-weight: 600; color: #000000 !important; font-size: 15px;">${getInvestmentRangeLabel(quizData.upfrontInvestment)}</span>
                    </div>
                    <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #F3F4F6;">
                      <span class="profile-label" style="font-weight: 500; color: #6B7280 !important; font-size: 15px;">Weekly Commitment</span>
                      <span class="profile-value" style="font-weight: 600; color: #000000 !important; font-size: 15px;">${getTimeCommitmentRangeLabel(quizData.weeklyTimeCommitment)}</span>
                    </div>
                    <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0;">
                      <span class="profile-label" style="font-weight: 500; color: #6B7280 !important; font-size: 15px;">Tech Skills</span>
                      <span class="profile-value" style="font-weight: 600; color: #000000 !important; font-size: 15px;">${quizData.techSkillsRating >= 4 ? "Strong" : quizData.techSkillsRating >= 3 ? "Moderate" : "Basic"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin-top: 20px;">
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/results" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">
                  View Your Results →
                </a>
                <br>
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/dashboard" style="display: inline-block; background: #FFFFFF; color: #2563EB !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; border: 2px solid #2563EB;">
                  Go to Dashboard →
                </a>
              </div>
            </div>

                        <div class="footer" style="background: #1E293B !important; padding: 40px; text-align: center; border-top: 1px solid #334155;">
              <a href="https://bizmodelai.com" style="text-decoration: none;">
                <div class="footer-logo" style="font-size: 20px; font-weight: 700; color: #FFFFFF !important; margin-bottom: 10px;">BizModelAI</div>
              </a>
              <div class="footer-tagline" style="color: #D1D5DB !important; font-size: 16px; margin-bottom: 20px;">Your AI-Powered Business Discovery Platform</div>

                            <div class="footer-disclaimer" style="font-size: 14px; color: #9CA3AF !important; line-height: 1.5; margin-bottom: 16px;">
                This email was sent because you completed our business assessment quiz.<br>
                We're here to help you discover your perfect business path.
              </div>

              <div class="data-retention-notice" style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px; color: #92400E !important; line-height: 1.4;">
                <strong> Data Retention Notice:</strong><br>
                Your quiz results and data will be stored securely for <strong>3 months</strong> from today. After this period, your data will be automatically deleted from our systems unless you create a paid account.<br><br>
                <strong>Want to keep your results forever?</strong> <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/results" style="color: #92400E !important; text-decoration: underline;">Upgrade to unlock your full report</a> and your data will be saved permanently.
              </div>
              <div class="footer-unsubscribe" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #334155;">
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/unsubscribe" class="unsubscribe-link" style="color: #9CA3AF !important; text-decoration: none; font-size: 14px; padding: 8px 16px; border-radius: 6px;">
                  Unsubscribe
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateContactFormNotificationHTML(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
            ${this.getBrighterStyles()}
          </style>
        </head>
        <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC !important; color: #000000 !important;">
          <div class="email-container" style="max-width: 800px; margin: 0 auto; background: #FFFFFF !important; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); border: 1px solid #E5E7EB;">
            <div class="header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 40px; text-align: center;">
              <div class="logo" style="width: 70px; height: 70px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: white; padding: 8px; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);">
              </div>
              <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; color: white !important;">New Contact Form Submission</h1>
              <p style="font-size: 16px; opacity: 0.95; color: white !important;">From BizModelAI Contact Form</p>
            </div>

            <div class="content" style="padding: 40px; background: #FFFFFF !important; color: #000000 !important;">
              <div class="form-details" style="background: #F8FAFC; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #E5E7EB;">
                <h2 style="font-size: 20px; font-weight: 600; color: #000000 !important; margin-bottom: 20px;">Contact Details</h2>

                <div class="detail-row" style="display: flex; margin-bottom: 16px; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                  <span style="font-weight: 600; color: #374151 !important; width: 120px; flex-shrink: 0;">Name:</span>
                  <span style="color: #000000 !important;">${formData.name}</span>
                </div>

                <div class="detail-row" style="display: flex; margin-bottom: 16px; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                  <span style="font-weight: 600; color: #374151 !important; width: 120px; flex-shrink: 0;">Email:</span>
                  <span style="color: #000000 !important;">${formData.email}</span>
                </div>

                <div class="detail-row" style="display: flex; margin-bottom: 16px; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                  <span style="font-weight: 600; color: #374151 !important; width: 120px; flex-shrink: 0;">Category:</span>
                  <span style="color: #000000 !important;">${formData.category}</span>
                </div>

                <div class="detail-row" style="display: flex; margin-bottom: 16px; padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                  <span style="font-weight: 600; color: #374151 !important; width: 120px; flex-shrink: 0;">Subject:</span>
                  <span style="color: #000000 !important;">${formData.subject}</span>
                </div>
              </div>

              <div class="message-section" style="background: #FFFFFF; border: 2px solid #2563EB; border-radius: 12px; padding: 30px;">
                <h3 style="font-size: 18px; font-weight: 600; color: #2563EB !important; margin-bottom: 16px;">Message</h3>
                <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; border-left: 4px solid #2563EB;">
                  <p style="color: #000000 !important; line-height: 1.6; margin: 0; white-space: pre-wrap;">${formData.message}</p>
                </div>
              </div>

              <div style="margin-top: 30px; padding: 20px; background: #F0F9FF; border-radius: 12px; border: 1px solid #BAE6FD;">
                <p style="color: #1E40AF !important; font-size: 14px; margin: 0; text-align: center;">
                  <strong>Reply to:</strong> ${formData.email}
                </p>
              </div>
            </div>

            <div class="footer" style="background: #1F2937 !important; padding: 30px; text-align: center; border-top: 1px solid #374151;">
              <div class="footer-logo" style="font-size: 18px; font-weight: 700; color: #FFFFFF !important; margin-bottom: 8px;">BizModelAI</div>
              <div style="color: #D1D5DB !important; font-size: 14px;">Contact Form Notification</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateContactFormConfirmationHTML(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light only">
          <meta name="supported-color-schemes" content="light">
          <title>Message Received - BizModelAI</title>
          <style>
            ${this.getBrighterStyles()}
          </style>
        </head>
        <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC !important; color: #000000 !important;">
          <div class="email-container" style="max-width: 800px; margin: 0 auto; background: #FFFFFF !important; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); border: 1px solid #E5E7EB;">
            <div class="header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
              <div class="logo" style="width: 70px; height: 70px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: white; padding: 8px; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);">
              </div>
              <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; color: white !important;">Message Received!</h1>
              <p style="font-size: 18px; opacity: 0.95; position: relative; z-index: 1; color: white !important;">Thank you for reaching out to us</p>
            </div>

            <div class="content" style="padding: 50px 40px; background: #FFFFFF !important; color: #000000 !important;">
              <div class="section" style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; font-weight: 600; color: #000000 !important; margin-bottom: 20px;">Hi ${userName}! </h2>
                <p style="font-size: 16px; color: #374151 !important; line-height: 1.6; margin-bottom: 20px;">
                  We've successfully received your message and our team will review it shortly. We appreciate you taking the time to contact us.
                </p>
                <p style="font-size: 16px; color: #374151 !important; line-height: 1.6; margin-bottom: 30px;">
                  <strong>What happens next?</strong>
                </p>

                <div class="timeline" style="background: #F8FAFC; border-radius: 12px; padding: 30px; border: 1px solid #E5E7EB;">
                  <div class="timeline-item" style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                      <span style="color: white; font-weight: bold; font-size: 14px;">1</span>
                    </div>
                    <div>
                      <h4 style="color: #000000 !important; font-weight: 600; margin-bottom: 4px;">Review (Within 2 hours)</h4>
                      <p style="color: #6B7280 !important; font-size: 14px; margin: 0;">Our team will review your message and determine the best way to help.</p>
                    </div>
                  </div>

                  <div class="timeline-item" style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #2563EB, #7C3AED); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                      <span style="color: white; font-weight: bold; font-size: 14px;">2</span>
                    </div>
                    <div>
                      <h4 style="color: #000000 !important; font-weight: 600; margin-bottom: 4px;">Response (Within 24 hours)</h4>
                      <p style="color: #6B7280 !important; font-size: 14px; margin: 0;">We'll send you a personalized response with the information you need.</p>
                    </div>
                  </div>

                  <div class="timeline-item" style="display: flex; align-items: flex-start;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
                      <span style="color: white; font-weight: bold; font-size: 14px;">3</span>
                    </div>
                    <div>
                      <h4 style="color: #000000 !important; font-weight: 600; margin-bottom: 4px;">Follow-up (If needed)</h4>
                      <p style="color: #6B7280 !important; font-size: 14px; margin: 0;">We may reach out with additional questions or resources to better assist you.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #BAE6FD;">
                <h3 style="color: #1E40AF !important; font-size: 18px; font-weight: 600; margin-bottom: 16px;">While you wait...</h3>
                <p style="color: #1E3A8A !important; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                  Explore our business assessment quiz to discover your perfect business model match, or browse our comprehensive business guides.
                </p>
                <div style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/quiz" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 12px;">
                    Take the Quiz →
                  </a>
                  <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/explore" style="display: inline-block; background: #FFFFFF; color: #2563EB !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 2px solid #2563EB;">
                    Explore Models
                  </a>
                </div>
              </div>

              <div style="text-align: center; padding: 20px;">
                <p style="color: #6B7280 !important; font-size: 14px; margin: 0;">
                  Need immediate assistance? Check out our <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/help" style="color: #2563EB !important; text-decoration: none;">Help Center</a>
                </p>
              </div>
            </div>

            <div class="footer" style="background: #FFFFFF !important; padding: 40px; text-align: center; border-top: 1px solid #F3F4F6;">
              <div class="footer-logo" style="font-size: 20px; font-weight: 700; color: #000000 !important; margin-bottom: 10px;">BizModelAI</div>
              <div class="footer-tagline" style="color: #6B7280 !important; font-size: 16px; margin-bottom: 20px;">Your AI-Powered Business Discovery Platform</div>

              <div class="footer-disclaimer" style="font-size: 14px; color: #9CA3AF !important; line-height: 1.5; margin-bottom: 16px;">
                This confirmation email was sent because you contacted us through our website.<br>
                We're committed to helping you discover your perfect business path.
              </div>
              <div class="footer-unsubscribe" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #F3F4F6;">
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/unsubscribe" class="unsubscribe-link" style="color: #6B7280 !important; text-decoration: none; font-size: 14px; padding: 8px 16px; border-radius: 6px;">
                  Unsubscribe
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getBrighterStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      /* Force light mode - prevent email clients from applying dark mode styles */
      [data-ogsc] * {
        color: inherit !important;
        background-color: inherit !important;
      }
      
      [data-ogsb] * {
        color: inherit !important;
        background-color: inherit !important;
      }
      
      /* Outlook dark mode overrides */
      [data-outlook-cycle] * {
        color: inherit !important;
        background-color: inherit !important;
      }
      
      /* Apple Mail dark mode overrides */
      @media (prefers-color-scheme: dark) {
        .email-container {
          background-color: #FFFFFF !important;
          color: #000000 !important;
        }
        
        .content {
          background-color: #FFFFFF !important;
          color: #000000 !important;
        }
        
        .footer {
          background-color: #1F2937 !important;
          color: #FFFFFF !important;
        }
        
        .profile-card {
          background-color: #FFFFFF !important;
          color: #000000 !important;
        }
        
        .top-match-card {
          background-color: #FFFFFF !important;
          color: #000000 !important;
        }
        
        .section-title {
          color: #000000 !important;
        }
        
        .match-name {
          color: #000000 !important;
        }
        
        .match-description {
          color: #333333 !important;
        }
        
        .profile-value {
          color: #000000 !important;
        }
        
        .steps-list li {
          color: #000000 !important;
        }
        
        .footer-logo {
          color: #FFFFFF !important;
        }
        
        .footer-tagline {
          color: #D1D5DB !important;
        }
        
        .footer-disclaimer {
          color: #9CA3AF !important;
        }
        
        body {
          background-color: #FFFFFF !important;
          color: #000000 !important;
        }
      }
      
      /* Gmail dark mode overrides */
      u + .body .email-container {
        background-color: #FFFFFF !important;
        color: #000000 !important;
      }
      
      /* Additional dark mode prevention */
      .ExternalClass {
        width: 100%;
      }
      
      .ExternalClass,
      .ExternalClass p,
      .ExternalClass span,
      .ExternalClass font,
      .ExternalClass td,
      .ExternalClass div {
        line-height: 100%;
      }
      
      /* Force white background on all containers */
      table, td, div, p, span {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      
      /* Meta tags to prevent dark mode */
      meta[name="color-scheme"] {
        content: light !important;
      }
      
      meta[name="supported-color-schemes"] {
        content: light !important;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #000000;
        background-color: #FFFFFF;
        padding: 20px;
      }
      
      .email-container {
        max-width: 800px;
        margin: 0 auto;
        background: #FFFFFF;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        border: 1px solid #E5E7EB;
      }
      
      .header {
        background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
        color: white;
        padding: 50px 40px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
        animation: pulse 4s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
      
      .logo {
        width: 70px;
        height: 70px;
        margin: 0 auto 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
      }
      
      .header h1 {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 12px;
        position: relative;
        z-index: 1;
      }
      
      .header p {
        font-size: 18px;
        opacity: 0.95;
        position: relative;
        z-index: 1;
      }
      
      .content {
        padding: 50px 40px;
        background: #FFFFFF;
        color: #000000;
      }
      
      .section {
        margin-bottom: 40px;
      }
      
      .section-title {
        font-size: 22px;
        font-weight: 600;
        color: #000000;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
      }
      
      .section-title::before {
        content: '';
        width: 4px;
        height: 24px;
        background: linear-gradient(135deg, #2563EB, #7C3AED);
        border-radius: 2px;
        margin-right: 16px;
      }
      
      .top-match-card {
        background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%);
        border: 2px solid #E5E7EB;
        border-radius: 20px;
        padding: 30px;
        margin-bottom: 30px;
        position: relative;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      }
      
      .match-badge {
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        display: inline-block;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      .match-name {
        font-size: 24px;
        font-weight: 700;
        color: #000000;
        margin-bottom: 12px;
      }
      
      .match-description {
        font-size: 16px;
        color: #333333;
        margin-bottom: 20px;
        line-height: 1.5;
      }
      
      .match-score {
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, #2563EB, #7C3AED);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
      }
      
      .score-label {
        margin-right: 8px;
        font-size: 14px;
      }
      
      .score-value {
        font-size: 18px;
        font-weight: 700;
      }
      
      .profile-card {
        background: #FFFFFF;
        border: 1px solid #E5E7EB;
        border-radius: 16px;
        padding: 30px;
        margin-bottom: 30px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      }
      
      .profile-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid #F3F4F6;
      }
      
      .profile-item:last-child {
        border-bottom: none;
      }
      
      .profile-label {
        font-weight: 500;
        color: #6B7280;
        font-size: 15px;
      }
      
      .profile-value {
        font-weight: 600;
        color: #000000;
        font-size: 15px;
      }
      
      .steps-list {
        list-style: none;
        padding: 0;
        background: #FFFFFF;
      }
      
      .steps-list li {
        padding: 16px 0;
        padding-left: 50px;
        position: relative;
        color: #000000;
        font-size: 16px;
        line-height: 1.5;
      }
      
      .steps-list li::before {
        content: '✓';
        position: absolute;
        left: 0;
        top: 16px;
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
        color: white;
        padding: 20px 40px;
        text-decoration: none;
        border-radius: 16px;
        font-weight: 600;
        font-size: 18px;
        text-align: center;
        margin: 30px 0;
        transition: all 0.3s ease;
        box-shadow: 0 8px 32px rgba(37, 99, 235, 0.3);
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(37, 99, 235, 0.4);
      }
      
      .cta-container {
        text-align: center;
        padding: 30px;
        background: #FFFFFF;
        border-radius: 16px;
        border: 1px solid #F3F4F6;
        margin-top: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      }
      
      .footer {
        background: #1F2937;
        padding: 40px;
        text-align: center;
        border-top: 1px solid #374151;
      }
      
      .footer-logo {
        font-size: 20px;
        font-weight: 700;
        color: #FFFFFF;
        margin-bottom: 10px;
      }
      
      .footer-tagline {
        color: #D1D5DB;
        font-size: 16px;
        margin-bottom: 20px;
      }
      
      .footer-disclaimer {
        font-size: 14px;
        color: #9CA3AF;
        line-height: 1.5;
        margin-bottom: 16px;
      }
      
      .footer-unsubscribe {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #374151;
      }
      
      .unsubscribe-link {
        color: #9CA3AF;
        text-decoration: none;
        font-size: 14px;
        padding: 8px 16px;
        border-radius: 6px;
        transition: all 0.3s ease;
      }
      
      .unsubscribe-link:hover {
        text-decoration: underline !important;
        color: #D1D5DB !important;
      }
      
      @media (max-width: 480px) {
        body {
          padding: 10px;
        }
        
        .email-container {
          border-radius: 0;
          margin: 0;
          max-width: 100%;
        }
        
        .header {
          padding: 40px 20px;
        }
        
        .content {
          padding: 40px 20px;
        }
        
        .header h1 {
          font-size: 28px;
        }
        
        .cta-button {
          width: 100%;
          padding: 16px 20px;
        }
        
        .profile-card, .top-match-card {
          padding: 20px;
        }
        
        .footer {
          padding: 30px 20px;
        }
      }
    `;
  }

  private getBaseStyles(): string {
    return this.getBrighterStyles();
  }
}

export const emailService = EmailService.getInstance();
