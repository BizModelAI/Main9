import * as puppeteer from "puppeteer";
import { QuizData } from "../../shared/types.js";
import * as fs from "fs";

export interface PDFGenerationOptions {
  quizData: QuizData;
  userEmail?: string;
  aiAnalysis?: any;
  topBusinessPath?: any;
  baseUrl: string;
}

export class PDFService {
  private static instance: PDFService;
  private browser: puppeteer.Browser | null = null;

  private constructor() {}

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      try {
        // Vercel-compatible configuration
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-features=TranslateUI",
            "--disable-ipc-flooding-protection",
          ],
        });
        console.log("Browser initialized successfully");
      } catch (error) {
        console.error("Failed to initialize browser:", error);
        throw error;
      }
    }
  }

  async generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
    const { quizData, userEmail, aiAnalysis, topBusinessPath, baseUrl } =
      options;

    try {
      // Try to use Puppeteer for real PDF generation
      await this.initializeBrowser();

      if (!this.browser) {
        console.log("Browser not available, falling back to HTML");
        return this.generateHTMLFallback(options);
      }

      const page = await this.browser.newPage();

      // Create the PDF report URL with encoded data including AI analysis
      const reportData = {
        quizData,
        userEmail,
        aiAnalysis,
        topBusinessPath,
      };
      const encodedData = encodeURIComponent(JSON.stringify(reportData));
      const pdfUrl = `${baseUrl}/pdf-report?data=${encodedData}`;

      console.log("Loading PDF report page:", pdfUrl);

      // Navigate to the PDF report page
      await page.goto(pdfUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for the page to fully render
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate PDF with optimized settings
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
        displayHeaderFooter: false,
      });

      await page.close();
      console.log("PDF generated successfully");

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error("PDF generation failed, falling back to HTML:", error);
      return this.generateHTMLFallback(options);
    }
  }

  private generateHTMLFallback(options: PDFGenerationOptions): Buffer {
    const { quizData, userEmail, aiAnalysis, topBusinessPath } = options;

    // Helper function to safely escape HTML
    const escapeHtml = (text: string | undefined | null): string => {
      if (!text) return "";
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    };

    // Helper function to safely format currency
    const formatCurrency = (value: number | undefined | null): string => {
      if (typeof value !== "number" || isNaN(value)) return "0";
      return value.toLocaleString();
    };

    // Helper function to safely format timeline
    const formatTimeline = (timeline: string | undefined | null): string => {
      if (!timeline) return "Not specified";
      return escapeHtml(timeline.replace(/-/g, " "));
    };

    // Safe user display name
    const safeUserName = escapeHtml(userEmail?.split("@")[0] || "User");

    // Enhanced HTML template that closely matches the PDFReport component
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business Path Analysis Report</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
        <style>
            @media print {
                body { 
                    print-color-adjust: exact; 
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .page-break { page-break-before: always; }
                .avoid-break { page-break-inside: avoid; }
                .gradient-bg {
                    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%) !important;
                }
                .trait-bar {
                    background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%) !important;
                }
            }
            .gradient-bg {
                background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            }
            .trait-bar {
                background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
            }
        </style>
    </head>
    <body class="bg-white text-gray-900">
        <div class="pdf-report bg-white text-gray-900 min-h-screen">
            <!-- Header -->
            <div class="gradient-bg text-white p-8 mb-8">
                <div class="max-w-4xl mx-auto">
                    <div class="text-center mb-6">
                        <h1 class="text-4xl font-bold mb-2">Business Path Analysis Report</h1>
                                                <p class="text-xl opacity-90">Personalized Recommendations for ${safeUserName}</p>
                        <p class="text-sm opacity-75 mt-2">Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div class="flex items-center justify-center mb-2">
                                <span class="font-semibold">Income Goal</span>
                            </div>
                                                        <p class="text-2xl font-bold">$${formatCurrency(quizData.successIncomeGoal)}/month</p>
                        </div>
                        
                        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div class="flex items-center justify-center mb-2">
                                <span class="font-semibold">Timeline</span>
                            </div>
                                                        <p class="text-2xl font-bold">${formatTimeline(quizData.firstIncomeTimeline)}</p>
                        </div>
                        
                        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div class="flex items-center justify-center mb-2">
                                <span class="font-semibold">Investment</span>
                            </div>
                                                        <p class="text-2xl font-bold">$${formatCurrency(quizData.upfrontInvestment)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="max-w-4xl mx-auto px-8 pb-8">
                <!-- Summary Section -->
                <section class="mb-12 avoid-break">
                    <h2 class="text-2xl font-bold mb-6">Executive Summary</h2>
                    
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
                        <div class="space-y-4">
                            <div>
                                <h3 class="font-semibold text-gray-900">Your Profile</h3>
                                <div class="grid grid-cols-2 gap-4 mt-2 text-sm">
                                    <div><span class="font-medium">Income Goal:</span> $${quizData.successIncomeGoal?.toLocaleString()}/month</div>
                                    <div><span class="font-medium">Timeline:</span> ${quizData.firstIncomeTimeline?.replace("-", " ")}</div>
                                    <div><span class="font-medium">Investment:</span> $${quizData.upfrontInvestment?.toLocaleString()}</div>
                                    <div><span class="font-medium">Time Commitment:</span> ${quizData.weeklyTimeCommitment} hours/week</div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="font-semibold text-gray-900">Key Recommendations</h3>
                                <p class="text-gray-700">Based on your responses, we've identified personalized business paths that align with your goals, skills, and preferences. This report provides actionable insights to help you start your entrepreneurial journey.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Action Plan -->
                <section class="mb-12 page-break">
                    <h2 class="text-2xl font-bold mb-6">Your 90-Day Action Plan</h2>
                    
                    <div class="space-y-6">
                        <div class="avoid-break">
                            <h3 class="text-lg font-semibold mb-3 text-blue-600">Week 1: Foundation</h3>
                            <ul class="space-y-2 text-gray-700">
                                <li class="flex items-start">
                                    <span class="text-blue-500 mr-2">•</span>
                                    Set up your workspace and essential tools
                                </li>
                                <li class="flex items-start">
                                    <span class="text-blue-500 mr-2">•</span>
                                    Research your target market and competition
                                </li>
                                <li class="flex items-start">
                                    <span class="text-blue-500 mr-2">•</span>
                                    Create your business plan outline
                                </li>
                            </ul>
                        </div>

                        <div class="avoid-break">
                            <h3 class="text-lg font-semibold mb-3 text-green-600">Month 1: Launch Preparation</h3>
                            <ul class="space-y-2 text-gray-700">
                                <li class="flex items-start">
                                    <span class="text-green-500 mr-2">•</span>
                                    Build your minimum viable product/service
                                </li>
                                <li class="flex items-start">
                                    <span class="text-green-500 mr-2">•</span>
                                    Establish your online presence
                                </li>
                                <li class="flex items-start">
                                    <span class="text-green-500 mr-2">•</span>
                                    Test with initial customers
                                </li>
                            </ul>
                        </div>

                        <div class="avoid-break">
                            <h3 class="text-lg font-semibold mb-3 text-purple-600">Month 2-3: Growth & Optimization</h3>
                            <ul class="space-y-2 text-gray-700">
                                <li class="flex items-start">
                                    <span class="text-purple-500 mr-2">•</span>
                                    Scale your marketing efforts
                                </li>
                                <li class="flex items-start">
                                    <span class="text-purple-500 mr-2">•</span>
                                    Optimize based on customer feedback
                                </li>
                                <li class="flex items-start">
                                    <span class="text-purple-500 mr-2">•</span>
                                    Establish consistent revenue streams
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- Footer -->
                <footer class="text-center text-gray-500 text-sm border-t pt-6">
                    <p>This personalized report was generated based on your quiz responses.</p>
                    <p>For updates and additional resources, visit our platform.</p>
                    <div class="mt-4 space-y-1">
                        <p class="font-medium">Get Started Today:</p>
                        <p>Visit our website for additional tools, resources, and personalized guidance</p>
                        <p>Access your full business analysis and detailed recommendations online</p>
                    </div>
                </footer>
            </div>
        </div>
        
        <script>
            // Optional: Auto-print when loaded (for HTML fallback)
            // window.onload = function() { window.print(); };
        </script>
    </body>
    </html>
    `;

    return Buffer.from(htmlContent, "utf8");
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfService = PDFService.getInstance();
