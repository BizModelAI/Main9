import { QuizData } from "../types";

interface ViewedReport {
  quizAttemptId: number;
  userEmail?: string | null;
  viewedAt: number;
  quizDataHash: string;
}

export class ReportViewManager {
  private static instance: ReportViewManager;
  private static readonly STORAGE_KEY = "viewed-reports";
  private static readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  private constructor() {}

  static getInstance(): ReportViewManager {
    if (!ReportViewManager.instance) {
      ReportViewManager.instance = new ReportViewManager();
    }
    return ReportViewManager.instance;
  }

  /**
   * Generate a hash of the quiz data for comparison
   */
  private generateQuizDataHash(quizData: QuizData): string {
    const key = JSON.stringify({
      mainMotivation: quizData.mainMotivation,
      successIncomeGoal: quizData.successIncomeGoal,
      weeklyTimeCommitment: quizData.weeklyTimeCommitment,
      techSkillsRating: quizData.techSkillsRating,
      riskComfortLevel: quizData.riskComfortLevel,
      workStructurePreference: quizData.workStructurePreference,
      decisionMakingStyle: quizData.decisionMakingStyle,
      // Add other key fields that uniquely identify this quiz attempt
    });
    return btoa(key).substring(0, 16); // Simple hash
  }

  /**
   * Get all viewed reports from localStorage
   */
  private getViewedReports(): ViewedReport[] {
    try {
      const stored = localStorage.getItem(ReportViewManager.STORAGE_KEY);
      if (!stored) return [];

      const reports: ViewedReport[] = JSON.parse(stored);

      // Filter out expired reports
      const now = Date.now();
      const validReports = reports.filter(
        (report) => now - report.viewedAt < ReportViewManager.CACHE_DURATION,
      );

      // Update storage if we filtered out expired reports
      if (validReports.length !== reports.length) {
        this.storeViewedReports(validReports);
      }

      return validReports;
    } catch (error) {
      console.error("Error reading viewed reports:", error);
      return [];
    }
  }

  /**
   * Store viewed reports to localStorage
   */
  private storeViewedReports(reports: ViewedReport[]): void {
    try {
      localStorage.setItem(
        ReportViewManager.STORAGE_KEY,
        JSON.stringify(reports),
      );
    } catch (error) {
      console.error("Error storing viewed reports:", error);
    }
  }

  /**
   * Check if a specific quiz attempt's report has been viewed
   */
  hasViewedReport(
    quizAttemptId: number,
    quizData?: QuizData,
    userEmail?: string | null,
  ): boolean {
    const viewedReports = this.getViewedReports();

    // Check by quiz attempt ID first (most reliable)
    const viewedByAttemptId = viewedReports.some(
      (report) => report.quizAttemptId === quizAttemptId,
    );

    if (viewedByAttemptId) {
      return true;
    }

    // If we have quiz data, also check by quiz data hash (for cases where attemptId might change)
    if (quizData) {
      const quizDataHash = this.generateQuizDataHash(quizData);
      const viewedByHash = viewedReports.some(
        (report) =>
          report.quizDataHash === quizDataHash &&
          (!userEmail || report.userEmail === userEmail),
      );

      return viewedByHash;
    }

    return false;
  }

  /**
   * Mark a report as viewed
   */
  markReportAsViewed(
    quizAttemptId: number,
    quizData: QuizData,
    userEmail?: string | null,
  ): void {
    const viewedReports = this.getViewedReports();

    // Check if this report is already marked as viewed
    const alreadyViewed = viewedReports.some(
      (report) => report.quizAttemptId === quizAttemptId,
    );

    if (!alreadyViewed) {
      const newViewedReport: ViewedReport = {
        quizAttemptId,
        userEmail: userEmail || undefined,
        viewedAt: Date.now(),
        quizDataHash: this.generateQuizDataHash(quizData),
      };

      viewedReports.push(newViewedReport);

      // Keep only the last 50 viewed reports to prevent localStorage bloat
      const recentReports = viewedReports
        .sort((a, b) => b.viewedAt - a.viewedAt)
        .slice(0, 50);

      this.storeViewedReports(recentReports);

      console.log(`Report for quiz attempt ${quizAttemptId} marked as viewed`);
    }
  }

  /**
   * Clear all viewed report tracking (useful for testing or user preference)
   */
  clearViewedReports(): void {
    localStorage.removeItem(ReportViewManager.STORAGE_KEY);
    console.log("All viewed reports tracking cleared");
  }

  /**
   * Get count of viewed reports
   */
  getViewedReportsCount(): number {
    return this.getViewedReports().length;
  }

  /**
   * Clean up old viewed reports (called periodically)
   */
  cleanupOldReports(): void {
    const viewedReports = this.getViewedReports();
    const now = Date.now();

    const validReports = viewedReports.filter(
      (report) => now - report.viewedAt < ReportViewManager.CACHE_DURATION,
    );

    if (validReports.length !== viewedReports.length) {
      this.storeViewedReports(validReports);
      console.log(
        `Cleaned up ${viewedReports.length - validReports.length} old report views`,
      );
    }
  }
}

export const reportViewManager = ReportViewManager.getInstance();
