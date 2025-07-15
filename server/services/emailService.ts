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

const getInvestmentRangeLabel = (value: number): string => {
  if (value === 0) return "$0";
  if (value === 125) return "Under $250";
  if (value === 625) return "$250–$1,000";
  if (value === 1500) return "$1,000+";
  return `$${value}`;
};

const getTimeCommitmentRangeLabel = (value: number): string => {
  if (value === 3) return "Less than 5 hours";
  if (value === 7) return "5–10 hours";
  if (value === 17) return "10–25 hours";
  if (value === 35) return "25+ hours";
  return `${value} hours`;
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

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return false;
    }

    try {
      // Check if user is unsubscribed before sending
      const isUnsubscribed = await this.checkUnsubscribeStatus(options.to);
      if (isUnsubscribed) {
        console.log(`User ${options.to} is unsubscribed, skipping email`);
        return false;
      }

      console.log(`Attempting to send email to: ${options.to}`);
      console.log(`Subject: ${options.subject}`);

      if (!resend) {
        throw new Error("Resend API key not configured");
      }

      const { data, error } = await resend.emails.send({
        from: "BizModelAI <onboarding@resend.dev>", // Use Resend default for development
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error("Resend API error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return false;
      }

      console.log("Email sent successfully to:", options.to);
      console.log("Email ID:", data?.id);
      console.log("Email data:", data);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      return false;
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

  async sendQuizResults(email: string, quizData: QuizData): Promise<boolean> {
    const subject = "Your BizModelAI Business Path Results";
    const html = this.generateQuizResultsHTML(quizData);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(email: string): Promise<boolean> {
    const subject = "Welcome to BizModelAI!";
    const html = this.generateWelcomeHTML();

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendFullReport(email: string, quizData: QuizData): Promise<boolean> {
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
  ): Promise<boolean> {
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
  }): Promise<boolean> {
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
  ): Promise<boolean> {
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
          <div class="email-container" style="max-width: 600px; margin: 0 auto; background: #FFFFFF !important; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); border: 1px solid #E5E7EB;">
            <div class="header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
                            <div class="logo" style="width: 70px; height: 70px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: white; padding: 8px; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);">
              </div>
              <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; color: white !important;">Your Business Path Results</h1>
              <p style="font-size: 18px; opacity: 0.95; position: relative; z-index: 1; color: white !important;">AI-Powered Recommendations Just for You</p>
            </div>
            
            <div class="content" style="padding: 50px 40px; background: #FFFFFF !important; color: #000000 !important;">
              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 22px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">🎯 Your Best Fit Business Model</h2>
                <div class="top-match-card" style="background: #FFFFFF !important; border: 2px solid #E5E7EB; border-radius: 16px; padding: 30px; margin-bottom: 30px; position: relative; text-align: center; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);">
                  <div class="match-badge" style="background: linear-gradient(135deg, #10B981, #059669); color: white !important; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin-bottom: 16px;">Perfect Match</div>
                  <h3 class="match-name" style="font-size: 24px; font-weight: 700; color: #000000 !important; margin-bottom: 12px;">${topBusinessModel.name}</h3>
                  <p class="match-description" style="font-size: 16px; color: #333333 !important; margin-bottom: 20px; line-height: 1.5;">${topBusinessModel.description}</p>
                  <div class="match-score" style="display: inline-flex; align-items: center; background: linear-gradient(135deg, #2563EB, #7C3AED); color: white !important; padding: 12px 24px; border-radius: 25px; font-weight: 600;">
                    <span class="score-label" style="margin-right: 8px; font-size: 14px; color: white !important;">Fit Score:</span>
                    <span class="score-value" style="font-size: 18px; font-weight: 700; color: white !important;">${topBusinessModel.fitScore}%</span>
                  </div>
                </div>
              </div>

              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 22px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">Your Business Profile</h2>
                <div class="profile-card" style="background: #FFFFFF !important; border: 1px solid #E5E7EB; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
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
                  <div class="profile-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0;">
                    <span class="profile-label" style="font-weight: 500; color: #6B7280 !important; font-size: 15px;">Investment Budget</span>
                    <span class="profile-value" style="font-weight: 600; color: #000000 !important; font-size: 15px;">${getInvestmentRangeLabel(quizData.upfrontInvestment)}</span>
                  </div>
                </div>
              </div>

              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 22px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">What's Waiting for You</h2>
                <ul class="steps-list" style="list-style: none; padding: 0; background: #FFFFFF !important;">
                  <li style="padding: 16px 0; padding-left: 50px; position: relative; color: #000000 !important; font-size: 16px; line-height: 1.5;">View your top-matched business models with personalized fit scores</li>
                  <li style="padding: 16px 0; padding-left: 50px; position: relative; color: #000000 !important; font-size: 16px; line-height: 1.5;">Get detailed step-by-step implementation guides</li>
                  <li style="padding: 16px 0; padding-left: 50px; position: relative; color: #000000 !important; font-size: 16px; line-height: 1.5;">Access curated resources, tools, and templates</li>
                  <li style="padding: 16px 0; padding-left: 50px; position: relative; color: #000000 !important; font-size: 16px; line-height: 1.5;">Download your comprehensive PDF business report</li>
                  <li style="padding: 16px 0; padding-left: 50px; position: relative; color: #000000 !important; font-size: 16px; line-height: 1.5;">Explore income projections and timeline expectations</li>
                </ul>
              </div>

              <div class="cta-container" style="text-align: center; padding: 30px; background: #FFFFFF !important; border-radius: 12px; border: 1px solid #F3F4F6; margin-top: 20px;">
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/results" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 20px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; text-align: center; margin: 30px 0; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);">
                  View Your Full Results →
                </a>
                <p style="margin-top: 16px; font-size: 14px; color: #6B7280 !important;">
                  Your personalized business blueprint is ready to explore
                </p>
              </div>
            </div>

                        <div class="footer" style="background: #FFFFFF !important; padding: 40px; text-align: center; border-top: 1px solid #F3F4F6;">
              <div class="footer-logo" style="font-size: 20px; font-weight: 700; color: #000000 !important; margin-bottom: 10px;">BizModelAI</div>
              <div class="footer-tagline" style="color: #6B7280 !important; font-size: 16px; margin-bottom: 20px;">Your AI-Powered Business Discovery Platform</div>

              <!-- Social Media Links -->
              <div class="social-media" style="margin-bottom: 20px;">
                <a href="https://www.instagram.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/112-instagram-512.png" alt="Instagram" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.tiktok.com/@bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/113-tiktok-512.png" alt="TikTok" style="width: 24px; height: 24px;">
                </a>
                <a href="https://x.com/bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/121-twitter-512.png" alt="X (Twitter)" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.pinterest.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/114-pinterest-512.png" alt="Pinterest" style="width: 24px; height: 24px;">
                </a>
              </div>

              <div class="footer-disclaimer" style="font-size: 14px; color: #9CA3AF !important; line-height: 1.5; margin-bottom: 16px;">
                This email was sent because you completed our business assessment quiz.<br>
                We're here to help you discover your perfect business path.
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
      "Online Tutoring / Coaching":
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
      "Online Tutoring / Coaching": {
        id: "online-tutoring",
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
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/112-instagram-512.png" alt="Instagram" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.tiktok.com/@bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/113-tiktok-512.png" alt="TikTok" style="width: 24px; height: 24px;">
                </a>
                <a href="https://x.com/bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/121-twitter-512.png" alt="X (Twitter)" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.pinterest.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/114-pinterest-512.png" alt="Pinterest" style="width: 24px; height: 24px;">
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
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/112-instagram-512.png" alt="Instagram" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.tiktok.com/@bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/113-tiktok-512.png" alt="TikTok" style="width: 24px; height: 24px;">
                </a>
                <a href="https://x.com/bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/121-twitter-512.png" alt="X (Twitter)" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.pinterest.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/114-pinterest-512.png" alt="Pinterest" style="width: 24px; height: 24px;">
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
          <div class="email-container" style="max-width: 800px; margin: 0 auto; background: #FFFFFF !important; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); border: 1px solid #E5E7EB;">
            <div class="header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
                            <div class="logo" style="width: 70px; height: 70px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: white; padding: 8px; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);">
              </div>
              <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; color: white !important;">Your Complete Business Report</h1>
              <p style="font-size: 18px; opacity: 0.95; position: relative; z-index: 1; color: white !important;">Comprehensive insights and actionable strategies</p>
            </div>
            
            <div class="content" style="padding: 50px 40px; background: #FFFFFF !important; color: #000000 !important;">
              
              <!-- AI-Generated Insights Section -->
              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 24px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">
                  ✨ Your AI-Generated Insights
                </h2>
                <div class="ai-insights-card" style="background: linear-gradient(135deg, #7C3AED 0%, #2563EB 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; color: white !important;">
                  <div class="insights-content" style="color: white !important;">
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: white !important;">
                      <strong>Personalized Analysis:</strong> Based on your comprehensive assessment, <strong>${top3Paths[0].name}</strong> achieves a <strong>${top3Paths[0].fitScore}%</strong> compatibility score with your unique profile. Your goals, personality traits, and available resources align perfectly with this business model's requirements and potential outcomes.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: white !important;">
                      With your <strong>${this.formatMotivation(quizData.mainMotivation)}</strong> motivation and <strong>${getIncomeRangeLabel(quizData.successIncomeGoal)}</strong> income goal, you're positioned for success in the ${quizData.successIncomeGoal >= 5000 ? "high-growth" : "sustainable income"} category. Your ${getTimeCommitmentRangeLabel(quizData.weeklyTimeCommitment)} weekly commitment shows ${quizData.weeklyTimeCommitment >= 20 ? "strong dedication" : "balanced approach"} to building your business.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: white !important;">
                      Your ${quizData.techSkillsRating}/5 tech skills rating and ${quizData.learningPreference} learning preference indicate you're ${quizData.techSkillsRating >= 4 ? "technically capable and ready for advanced strategies" : "perfectly positioned for user-friendly business models"}. This combination creates an ideal foundation for ${top3Paths[0].name} success.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Top 3 Business Models Section -->
              <div class="section" style="margin-bottom: 40px;">
                <h2 class="section-title" style="font-size: 24px; font-weight: 600; color: #000000 !important; margin-bottom: 20px; display: flex; align-items: center;">
                  🎯 Your Top 3 Business Matches
                </h2>
                
                ${top3Paths
                  .map(
                    (path, index) => `
                  <div class="business-card" style="background: #FFFFFF !important; border: 2px solid ${index === 0 ? "#F59E0B" : "#E5E7EB"}; border-radius: 16px; padding: 30px; margin-bottom: 24px; ${index === 0 ? "background: linear-gradient(135deg, #FEF3C7 0%, #FCD34D 5%, #FFFFFF 10%) !important;" : ""}">
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
                  💡 Key Recommendations
                </h2>
                <div class="recommendations-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                  <div class="recommendation-card" style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px; padding: 20px;">
                    <h4 style="font-weight: 600; color: #0369A1 !important; margin-bottom: 8px; display: flex; align-items: center;">
                      🎯 Best Strategy
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
                      🚀 Growth Path
                    </h4>
                    <p style="color: #78350F !important; font-size: 14px; line-height: 1.5;">
                      ${quizData.riskComfortLevel >= 4 ? "Your high risk tolerance allows for aggressive growth strategies and innovative approaches" : "Focus on steady, proven growth methods that minimize risk while building confidence"}
                    </p>
                  </div>
                  <div class="recommendation-card" style="background: #F3E8FF; border: 1px solid #D8B4FE; border-radius: 12px; padding: 20px;">
                    <h4 style="font-weight: 600; color: #7C2D12 !important; margin-bottom: 8px; display: flex; align-items: center;">
                      🎪 Timeline
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
                  📊 Your Business Profile
                </h2>
                <div class="profile-card" style="background: #FFFFFF !important; border: 1px solid #E5E7EB; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
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
                      <span class="profile-value" style="font-weight: 600; color: #000000 !important; font-size: 15px;">${quizData.techSkillsRating}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Call to Action -->
              <div class="cta-container" style="text-align: center; padding: 40px 30px; background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%); border-radius: 16px; border: 1px solid #E5E7EB; margin-top: 20px;">
                <h3 style="font-size: 24px; font-weight: 700; color: #000000 !important; margin-bottom: 12px;">Ready to Start Your Journey?</h3>
                <p style="font-size: 16px; color: #6B7280 !important; margin-bottom: 24px; max-width: 500px; margin-left: auto; margin-right: auto;">
                  Access your full interactive report with detailed business model guides, income projections, and step-by-step action plans.
                </p>
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/results" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center; margin: 10px; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);">
                  View Full Interactive Report →
                </a>
                <br>
                <a href="${process.env.FRONTEND_URL || "https://bizmodelai.com"}/business-model/${top3Paths[0].id}" style="display: inline-block; background: #FFFFFF; color: #2563EB !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; border: 2px solid #2563EB; margin: 10px;">
                  Start with ${top3Paths[0].name} →
                </a>
              </div>
            </div>

                        <div class="footer" style="background: #FFFFFF !important; padding: 40px; text-align: center; border-top: 1px solid #F3F4F6;">
              <div class="footer-logo" style="font-size: 20px; font-weight: 700; color: #000000 !important; margin-bottom: 10px;">BizModelAI</div>
              <div class="footer-tagline" style="color: #6B7280 !important; font-size: 16px; margin-bottom: 20px;">Your AI-Powered Business Discovery Platform</div>

              <!-- Social Media Links -->
              <div class="social-media" style="margin-bottom: 20px;">
                <a href="https://www.instagram.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/112-instagram-512.png" alt="Instagram" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.tiktok.com/@bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/113-tiktok-512.png" alt="TikTok" style="width: 24px; height: 24px;">
                </a>
                <a href="https://x.com/bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/121-twitter-512.png" alt="X (Twitter)" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.pinterest.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/114-pinterest-512.png" alt="Pinterest" style="width: 24px; height: 24px;">
                </a>
              </div>

              <div class="footer-disclaimer" style="font-size: 14px; color: #9CA3AF !important; line-height: 1.5; margin-bottom: 16px;">
                This comprehensive report is personalized just for you based on your quiz responses.<br>
                Start building your business with confidence using these tailored insights.
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
          <div class="email-container" style="max-width: 600px; margin: 0 auto; background: #FFFFFF !important; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); border: 1px solid #E5E7EB;">
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

            <div class="footer" style="background: #FFFFFF !important; padding: 30px; text-align: center; border-top: 1px solid #F3F4F6;">
              <div class="footer-logo" style="font-size: 18px; font-weight: 700; color: #000000 !important; margin-bottom: 8px;">BizModelAI</div>
              <div style="color: #6B7280 !important; font-size: 14px;">Contact Form Notification</div>
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
          <div class="email-container" style="max-width: 600px; margin: 0 auto; background: #FFFFFF !important; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); border: 1px solid #E5E7EB;">
            <div class="header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white !important; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
              <div class="logo" style="width: 70px; height: 70px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F8eb83e4a630e4b8d86715228efeb581b%2F8de3245c79ad43b48b9a59be9364a64e?format=webp&width=800" alt="BizModelAI Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: white; padding: 8px; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);">
              </div>
              <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; color: white !important;">Message Received!</h1>
              <p style="font-size: 18px; opacity: 0.95; position: relative; z-index: 1; color: white !important;">Thank you for reaching out to us</p>
            </div>

            <div class="content" style="padding: 50px 40px; background: #FFFFFF !important; color: #000000 !important;">
              <div class="section" style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; font-weight: 600; color: #000000 !important; margin-bottom: 20px;">Hi ${userName}! 👋</h2>
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

              <!-- Social Media Links -->
              <div class="social-media" style="margin-bottom: 20px;">
                <a href="https://www.instagram.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/112-instagram-512.png" alt="Instagram" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.tiktok.com/@bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/113-tiktok-512.png" alt="TikTok" style="width: 24px; height: 24px;">
                </a>
                <a href="https://x.com/bizmodelai" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/121-twitter-512.png" alt="X (Twitter)" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.pinterest.com/bizmodelai/" style="display: inline-block; margin: 0 8px; text-decoration: none;" target="_blank">
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/114-pinterest-512.png" alt="Pinterest" style="width: 24px; height: 24px;">
                </a>
              </div>

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
          background-color: #FFFFFF !important;
          color: #000000 !important;
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
          color: #000000 !important;
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
        max-width: 600px;
        margin: 0 auto;
        background: #FFFFFF;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid #F3F4F6;
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
        border-radius: 16px;
        padding: 30px;
        margin-bottom: 30px;
        position: relative;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
        border-radius: 12px;
        padding: 30px;
        margin-bottom: 30px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
        color: white;
        padding: 20px 40px;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 18px;
        text-align: center;
        margin: 30px 0;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
      }
      
      .cta-container {
        text-align: center;
        padding: 30px;
        background: #FFFFFF;
        border-radius: 12px;
        border: 1px solid #F3F4F6;
        margin-top: 20px;
      }
      
      .footer {
        background: #FFFFFF;
        padding: 40px;
        text-align: center;
        border-top: 1px solid #F3F4F6;
      }
      
      .footer-logo {
        font-size: 20px;
        font-weight: 700;
        color: #000000;
        margin-bottom: 10px;
      }
      
      .footer-tagline {
        color: #6B7280;
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
        border-top: 1px solid #F3F4F6;
      }
      
      .unsubscribe-link {
        color: #6B7280;
        text-decoration: none;
        font-size: 14px;
        padding: 8px 16px;
        border-radius: 6px;
        transition: all 0.3s ease;
      }
      
      .unsubscribe-link:hover {
        color: #374151;
        background: #F9FAFB;
      }
      
      @media (max-width: 480px) {
        body {
          padding: 10px;
        }
        
        .email-container {
          border-radius: 0;
          margin: 0;
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
