// Utility functions for quiz data processing
// Centralized to avoid duplication across routes.ts and aiScoringService.ts

export function getRatingDescription(rating: number): string {
  if (rating >= 4.5) return "Very High";
  if (rating >= 4) return "High";
  if (rating >= 3) return "Moderate";
  if (rating >= 2) return "Low";
  return "Very Low";
}

export function getIncomeGoalRange(value: number): string {
  if (value <= 500) return "Less than $500/month";
  if (value <= 1250) return "$500–$2,000/month";
  if (value <= 3500) return "$2,000–$5,000/month";
  return "$5,000+/month";
}

export function getTimeCommitmentRange(value: number): string {
  if (value <= 3) return "Less than 5 hours/week";
  if (value <= 7) return "5–10 hours/week";
  if (value <= 17) return "10-25 hours/week";
  return "25+ hours/week";
}

export function getInvestmentRange(value: number): string {
  if (value <= 0) return "$0 (bootstrap only)";
  if (value <= 125) return "Under $250";
  if (value <= 625) return "$250–$1,000";
  return "$1,000+";
} 