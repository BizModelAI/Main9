import type { QuizData } from "./types";

// 23 Core Trait Dimensions with weights - REFINED WEIGHTS and ALIGNED WITH QUIZ QUESTIONS
// These weights indicate the importance of each trait in the overall business model fit.
export const TRAIT_WEIGHTS = {
  // Core Business Traits
  incomeAmbition: 1.5, // From Q3 (monthly income) & Q7 (growth ambition)
  speedToIncome: 1.3, // From Q2 (earn first $100)
  upfrontInvestmentTolerance: 1.0, // From Q4 (money willing to invest)
  passiveIncomePreference: 1.4, // From Q8 (importance of long-term passive income)
  businessExitStrategy: 0.5, // From Q6 (sell or exit) - Lower weight as it's a long-term vision
  meaningfulContributionImportance: 1.0, // From Q45

  // Personal Work Style & Resilience
  passionAlignment: 1.3, // From Q5 (identity/passion reflection)
  timeCommitment: 1.2, // From Q9 (hours per week)
  consistencyAndFollowThrough: 1.1, // From Q10 (consistency)
  riskTolerance: 1.4, // From Q11 (trial and error) & Q32 (taking risks) & Q14 (discouragement)
  systemsThinking: 1.0, // From Q13 (enjoy building routines/systems) & Q16 (organized)
  toolLearning: 0.9, // From Q15 (willingness to learn tools)
  autonomyControl: 1.1, // From Q17 (self-motivated) & Q35 (control of decisions)
  structurePreference: 0.8, // From Q18 (uncertainty) & Q25 (structure preference)
  repetitionTolerance: 0.7, // From Q19 (repetitive tasks)
  adaptabilityToFeedback: 0.8, // From Q33 (negative feedback)
  originalityPreference: 0.9, // From Q34 (proven paths vs creating own)

  // Interaction & Marketing Style
  salesConfidence: 1.1, // From Q24 (direct communication enjoyment)
  creativeInterest: 1.0, // From Q23 (creative work enjoyment)
  socialMediaComfort: 1.0, // From Q21 (face of brand) & Q36 (face/voice online) & Q40 (social media interest)
  productVsService: 0.9, // From Q39 (create once/passive vs work with people) & Q38 (physical products)
  teachingVsSolving: 0.8, // From Q44 (teach vs solve)
  platformEcosystemComfort: 0.7, // From Q41 (ecosystem interest)
  collaborationPreference: 0.8, // From Q20 (solo vs collaborating)
  promoteOthersWillingness: 0.5, // From Q43 (promote others products) - Lower weight as it's specific
  technicalComfort: 1.0, // From Q26 (tech skills)
};

// Business Model Ideal Profiles (0-1 scale) - **YOU MUST COMPLETE ALL 18 MODELS HERE**
// Ensure all 23 traits from TRAIT_WEIGHTS are represented for each model.
export const BUSINESS_MODEL_PROFILES = {
  freelancing: {
    incomeAmbition: 0.4,
    speedToIncome: 0.9,
    upfrontInvestmentTolerance: 0.8,
    passiveIncomePreference: 0.1,
    businessExitStrategy: 0.2,
    meaningfulContributionImportance: 0.7,

    passionAlignment: 0.7,
    timeCommitment: 0.7,
    consistencyAndFollowThrough: 0.8,
    riskTolerance: 0.6,
    systemsThinking: 0.5,
    toolLearning: 0.7,
    autonomyControl: 1.0,
    structurePreference: 0.6,
    repetitionTolerance: 0.5,
    adaptabilityToFeedback: 0.7,
    originalityPreference: 0.7,

    salesConfidence: 0.8,
    creativeInterest: 0.7,
    socialMediaComfort: 0.4,
    productVsService: 0.1,
    teachingVsSolving: 0.6,
    platformEcosystemComfort: 0.4,
    collaborationPreference: 0.8,
    promoteOthersWillingness: 0.3,
    technicalComfort: 0.6,
  },
  "online-coaching": {
    incomeAmbition: 0.5,
    speedToIncome: 0.7,
    upfrontInvestmentTolerance: 0.9,
    passiveIncomePreference: 0.2,
    businessExitStrategy: 0.1,
    meaningfulContributionImportance: 0.9,

    passionAlignment: 0.8,
    timeCommitment: 0.6,
    consistencyAndFollowThrough: 0.7,
    riskTolerance: 0.5,
    systemsThinking: 0.6,
    toolLearning: 0.6,
    autonomyControl: 0.8,
    structurePreference: 0.7,
    repetitionTolerance: 0.7,
    adaptabilityToFeedback: 0.8,
    originalityPreference: 0.4,

    salesConfidence: 0.9,
    creativeInterest: 0.4,
    socialMediaComfort: 0.9,
    productVsService: 0.0,
    teachingVsSolving: 1.0,
    platformEcosystemComfort: 0.8,
    collaborationPreference: 0.6,
    promoteOthersWillingness: 0.1,
    technicalComfort: 0.5,
  },
  "e-commerce": {
    incomeAmbition: 0.9,
    speedToIncome: 0.4,
    upfrontInvestmentTolerance: 0.6,
    passiveIncomePreference: 0.6,
    businessExitStrategy: 0.9,
    meaningfulContributionImportance: 0.5,

    passionAlignment: 0.8,
    timeCommitment: 0.8,
    consistencyAndFollowThrough: 0.9,
    riskTolerance: 0.8,
    systemsThinking: 0.8,
    toolLearning: 0.8,
    autonomyControl: 0.9,
    structurePreference: 0.6,
    repetitionTolerance: 0.7,
    adaptabilityToFeedback: 0.7,
    originalityPreference: 0.8,

    salesConfidence: 0.6,
    creativeInterest: 0.9,
    socialMediaComfort: 0.7,
    productVsService: 0.9,
    teachingVsSolving: 0.2,
    platformEcosystemComfort: 0.8,
    collaborationPreference: 0.7,
    promoteOthersWillingness: 0.4,
    technicalComfort: 0.7,
  },
  "content-creation": {
    incomeAmbition: 0.8,
    speedToIncome: 0.6,
    upfrontInvestmentTolerance: 0.8,
    passiveIncomePreference: 0.5,
    businessExitStrategy: 0.7,
    meaningfulContributionImportance: 0.9,

    passionAlignment: 0.9,
    timeCommitment: 0.8,
    consistencyAndFollowThrough: 0.9,
    riskTolerance: 0.7,
    systemsThinking: 0.6,
    toolLearning: 0.7,
    autonomyControl: 0.9,
    structurePreference: 0.4,
    repetitionTolerance: 0.6,
    adaptabilityToFeedback: 0.8,
    originalityPreference: 0.9,

    salesConfidence: 0.7,
    creativeInterest: 1.0,
    socialMediaComfort: 1.0,
    productVsService: 0.7,
    teachingVsSolving: 0.4,
    platformEcosystemComfort: 0.5,
    collaborationPreference: 0.8,
    promoteOthersWillingness: 0.7,
    technicalComfort: 0.7,
  },
  "youtube-automation": {
    incomeAmbition: 0.8,
    speedToIncome: 0.5,
    upfrontInvestmentTolerance: 0.7,
    passiveIncomePreference: 0.7,
    businessExitStrategy: 0.8,
    meaningfulContributionImportance: 0.3,

    passionAlignment: 0.7,
    timeCommitment: 0.8,
    consistencyAndFollowThrough: 0.8,
    riskTolerance: 0.6,
    systemsThinking: 0.7,
    toolLearning: 0.8,
    autonomyControl: 0.8,
    structurePreference: 0.5,
    repetitionTolerance: 0.7,
    adaptabilityToFeedback: 0.6,
    originalityPreference: 0.7,

    salesConfidence: 0.4,
    creativeInterest: 0.9,
    socialMediaComfort: 0.4,
    productVsService: 0.8,
    teachingVsSolving: 0.3,
    platformEcosystemComfort: 0.7,
    collaborationPreference: 0.9,
    promoteOthersWillingness: 0.6,
    technicalComfort: 0.8,
  },
  "local-service": {
    incomeAmbition: 0.6,
    speedToIncome: 0.6,
    upfrontInvestmentTolerance: 0.5,
    passiveIncomePreference: 0.4,
    businessExitStrategy: 0.6,
    meaningfulContributionImportance: 0.5,

    passionAlignment: 0.5,
    timeCommitment: 0.7,
    consistencyAndFollowThrough: 0.7,
    riskTolerance: 0.5,
    systemsThinking: 0.6,
    toolLearning: 0.4,
    autonomyControl: 0.8,
    structurePreference: 0.7,
    repetitionTolerance: 0.6,
    adaptabilityToFeedback: 0.7,
    originalityPreference: 0.3,

    salesConfidence: 0.8,
    creativeInterest: 0.4,
    socialMediaComfort: 0.8,
    productVsService: 0.3,
    teachingVsSolving: 0.2,
    platformEcosystemComfort: 0.3,
    collaborationPreference: 0.7,
    promoteOthersWillingness: 0.2,
    technicalComfort: 0.3,
  },
  "high-ticket-sales": {
    incomeAmbition: 0.7,
    speedToIncome: 0.8,
    upfrontInvestmentTolerance: 0.8,
    passiveIncomePreference: 0.3,
    businessExitStrategy: 0.4,
    meaningfulContributionImportance: 0.6,

    passionAlignment: 0.6,
    timeCommitment: 0.8,
    consistencyAndFollowThrough: 0.9,
    riskTolerance: 0.7,
    systemsThinking: 0.7,
    toolLearning: 0.5,
    autonomyControl: 0.9,
    structurePreference: 0.8,
    repetitionTolerance: 0.8,
    adaptabilityToFeedback: 0.9,
    originalityPreference: 0.5,

    salesConfidence: 1.0,
    creativeInterest: 0.6,
    socialMediaComfort: 1.0,
    productVsService: 0.1,
    teachingVsSolving: 0.3,
    platformEcosystemComfort: 0.5,
    collaborationPreference: 0.8,
    promoteOthersWillingness: 0.4,
    technicalComfort: 0.4,
  },
  "saas-development": {
    incomeAmbition: 1.0,
    speedToIncome: 0.2,
    upfrontInvestmentTolerance: 0.4,
    passiveIncomePreference: 0.8,
    businessExitStrategy: 1.0,
    meaningfulContributionImportance: 0.9,

    passionAlignment: 0.9,
    timeCommitment: 0.9,
    consistencyAndFollowThrough: 1.0,
    riskTolerance: 0.9,
    systemsThinking: 1.0,
    toolLearning: 0.9,
    autonomyControl: 1.0,
    structurePreference: 0.7,
    repetitionTolerance: 0.7,
    adaptabilityToFeedback: 0.9,
    originalityPreference: 1.0,

    salesConfidence: 0.3,
    creativeInterest: 0.8,
    socialMediaComfort: 0.3,
    productVsService: 1.0,
    teachingVsSolving: 0.1,
    platformEcosystemComfort: 0.9,
    collaborationPreference: 0.8,
    promoteOthersWillingness: 0.2,
    technicalComfort: 1.0,
  },
  "social-media-agency": {
    incomeAmbition: 0.8,
    speedToIncome: 0.6,
    upfrontInvestmentTolerance: 0.7,
    passiveIncomePreference: 0.4,
    businessExitStrategy: 0.7,
    meaningfulContributionImportance: 0.7,

    passionAlignment: 0.7,
    timeCommitment: 0.7,
    consistencyAndFollowThrough: 0.8,
    riskTolerance: 0.6,
    systemsThinking: 0.7,
    toolLearning: 0.8,
    autonomyControl: 0.9,
    structurePreference: 0.6,
    repetitionTolerance: 0.6,
    adaptabilityToFeedback: 0.8,
    originalityPreference: 0.7,

    salesConfidence: 0.9,
    creativeInterest: 0.8,
    socialMediaComfort: 0.9,
    productVsService: 0.2,
    teachingVsSolving: 0.3,
    platformEcosystemComfort: 0.6,
    collaborationPreference: 0.6,
    promoteOthersWillingness: 0.5,
    technicalComfort: 0.8,
  },
  "ai-marketing-agency": {
    incomeAmbition: 0.9,
    speedToIncome: 0.5,
    upfrontInvestmentTolerance: 0.7,
    passiveIncomePreference: 0.6,
    businessExitStrategy: 0.8,
    meaningfulContributionImportance: 0.7,

    passionAlignment: 0.7,
    timeCommitment: 0.8,
    consistencyAndFollowThrough: 0.9,
    riskTolerance: 0.7,
    systemsThinking: 0.8,
    toolLearning: 0.9,
    autonomyControl: 1.0,
    structurePreference: 0.7,
    repetitionTolerance: 0.6,
    adaptabilityToFeedback: 0.8,
    originalityPreference: 0.7,

    salesConfidence: 0.7,
    creativeInterest: 0.7,
    socialMediaComfort: 0.7,
    productVsService: 0.3,
    teachingVsSolving: 0.3,
    platformEcosystemComfort: 0.7,
    collaborationPreference: 0.7,
    promoteOthersWillingness: 0.6,
    technicalComfort: 1.0,
  },
  "digital-services": {
    incomeAmbition: 0.8,
    speedToIncome: 0.7,
    upfrontInvestmentTolerance: 0.8,
    passiveIncomePreference: 0.3,
    businessExitStrategy: 0.7,
    meaningfulContributionImportance: 0.6,

    passionAlignment: 0.6,
    timeCommitment: 0.7,
    consistencyAndFollowThrough: 0.8,
    riskTolerance: 0.6,
    systemsThinking: 0.8,
    toolLearning: 0.7,
    autonomyControl: 1.0,
    structurePreference: 0.7,
    repetitionTolerance: 0.6,
    adaptabilityToFeedback: 0.8,
    originalityPreference: 0.6,

    salesConfidence: 0.6,
    creativeInterest: 0.6,
    socialMediaComfort: 0.6,
    productVsService: 0.2,
    teachingVsSolving: 0.2,
    platformEcosystemComfort: 0.5,
    collaborationPreference: 0.6,
    promoteOthersWillingness: 0.4,
    technicalComfort: 0.7,
  },
  "investing-trading": {
    incomeAmbition: 0.7,
    speedToIncome: 0.9,
    upfrontInvestmentTolerance: 0.1,
    passiveIncomePreference: 0.8,
    businessExitStrategy: 0.2,
    meaningfulContributionImportance: 0.4,

    passionAlignment: 0.4,
    timeCommitment: 0.9,
    consistencyAndFollowThrough: 0.6,
    riskTolerance: 1.0,
    systemsThinking: 0.6,
    toolLearning: 0.8,
    autonomyControl: 1.0,
    structurePreference: 0.4,
    repetitionTolerance: 0.8,
    adaptabilityToFeedback: 0.7,
    originalityPreference: 0.2,

    salesConfidence: 0.2,
    creativeInterest: 0.2,
    socialMediaComfort: 0.2,
    productVsService: 1.0,
    teachingVsSolving: 0.0,
    platformEcosystemComfort: 0.6,
    collaborationPreference: 0.1,
    promoteOthersWillingness: 0.0,
    technicalComfort: 0.7,
  },
  "online-reselling": {
    incomeAmbition: 0.4,
    speedToIncome: 0.8,
    upfrontInvestmentTolerance: 0.3,
    passiveIncomePreference: 0.3,
    businessExitStrategy: 0.5,
    meaningfulContributionImportance: 0.5,

    passionAlignment: 0.5,
    timeCommitment: 0.7,
    consistencyAndFollowThrough: 0.7,
    riskTolerance: 0.4,
    systemsThinking: 0.5,
    toolLearning: 0.4,
    autonomyControl: 0.9,
    structurePreference: 0.6,
    repetitionTolerance: 0.8,
    adaptabilityToFeedback: 0.6,
    originalityPreference: 0.5,

    salesConfidence: 0.3,
    creativeInterest: 0.5,
    socialMediaComfort: 0.3,
    productVsService: 0.9,
    teachingVsSolving: 0.1,
    platformEcosystemComfort: 0.5,
    collaborationPreference: 0.9,
    promoteOthersWillingness: 0.2,
    technicalComfort: 0.4,
  },
  "handmade-goods": {
    incomeAmbition: 0.3,
    speedToIncome: 0.4,
    upfrontInvestmentTolerance: 0.3,
    passiveIncomePreference: 0.2,
    businessExitStrategy: 0.3,
    meaningfulContributionImportance: 1.0,

    passionAlignment: 1.0,
    timeCommitment: 0.6,
    consistencyAndFollowThrough: 0.8,
    riskTolerance: 0.3,
    systemsThinking: 0.3,
    toolLearning: 0.3,
    autonomyControl: 1.0,
    structurePreference: 0.5,
    repetitionTolerance: 0.6,
    adaptabilityToFeedback: 0.5,
    originalityPreference: 0.9,

    salesConfidence: 0.2,
    creativeInterest: 1.0,
    socialMediaComfort: 0.2,
    productVsService: 0.9,
    teachingVsSolving: 0.1,
    platformEcosystemComfort: 0.3,
    collaborationPreference: 0.9,
    promoteOthersWillingness: 0.1,
    technicalComfort: 0.3,
  },
  copywriting: {
    incomeAmbition: 0.5,
    speedToIncome: 0.6,
    upfrontInvestmentTolerance: 0.8,
    passiveIncomePreference: 0.3,
    businessExitStrategy: 0.4,
    meaningfulContributionImportance: 0.8,

    passionAlignment: 0.8,
    timeCommitment: 0.6,
    consistencyAndFollowThrough: 0.7,
    riskTolerance: 0.5,
    systemsThinking: 0.6,
    toolLearning: 0.6,
    autonomyControl: 1.0,
    structurePreference: 0.7,
    repetitionTolerance: 0.7,
    adaptabilityToFeedback: 0.8,
    originalityPreference: 0.9,

    salesConfidence: 0.4,
    creativeInterest: 0.9,
    socialMediaComfort: 0.3,
    productVsService: 0.1,
    teachingVsSolving: 0.2,
    platformEcosystemComfort: 0.6,
    collaborationPreference: 1.0,
    promoteOthersWillingness: 0.3,
    technicalComfort: 0.5,
  },
  "affiliate-marketing": {
    incomeAmbition: 0.8,
    speedToIncome: 0.7,
    upfrontInvestmentTolerance: 0.7,
    passiveIncomePreference: 0.7,
    businessExitStrategy: 0.8,
    meaningfulContributionImportance: 0.6,

    passionAlignment: 0.6,
    timeCommitment: 0.7,
    consistencyAndFollowThrough: 0.8,
    riskTolerance: 0.7,
    systemsThinking: 0.7,
    toolLearning: 0.8,
    autonomyControl: 0.8,
    structurePreference: 0.6,
    repetitionTolerance: 0.6,
    adaptabilityToFeedback: 0.7,
    originalityPreference: 0.8,

    salesConfidence: 0.7,
    creativeInterest: 0.8,
    socialMediaComfort: 0.7,
    productVsService: 0.8,
    teachingVsSolving: 0.2,
    platformEcosystemComfort: 0.7,
    collaborationPreference: 0.9,
    promoteOthersWillingness: 1.0,
    technicalComfort: 0.7,
  },
  "virtual-assistant": {
    incomeAmbition: 0.4,
    speedToIncome: 0.8,
    upfrontInvestmentTolerance: 0.9,
    passiveIncomePreference: 0.2,
    businessExitStrategy: 0.1,
    meaningfulContributionImportance: 0.5,

    passionAlignment: 0.5,
    timeCommitment: 0.7,
    consistencyAndFollowThrough: 0.8,
    riskTolerance: 0.5,
    systemsThinking: 0.7,
    toolLearning: 0.6,
    autonomyControl: 0.7,
    structurePreference: 0.8,
    repetitionTolerance: 0.8,
    adaptabilityToFeedback: 0.7,
    originalityPreference: 0.4,

    salesConfidence: 0.7,
    creativeInterest: 0.4,
    socialMediaComfort: 0.7,
    productVsService: 0.0,
    teachingVsSolving: 0.1,
    platformEcosystemComfort: 0.4,
    collaborationPreference: 0.7,
    promoteOthersWillingness: 0.3,
    technicalComfort: 0.5,
  },
  "e-commerce-dropshipping": {
    incomeAmbition: 0.8,
    speedToIncome: 0.6,
    upfrontInvestmentTolerance: 0.8,
    passiveIncomePreference: 0.5,
    businessExitStrategy: 0.7,
    meaningfulContributionImportance: 0.6,

    passionAlignment: 0.9,
    timeCommitment: 0.8,
    consistencyAndFollowThrough: 0.9,
    riskTolerance: 0.7,
    systemsThinking: 0.8,
    toolLearning: 0.7,
    autonomyControl: 0.9,
    structurePreference: 0.6,
    repetitionTolerance: 0.7,
    adaptabilityToFeedback: 0.7,
    originalityPreference: 0.8,

    salesConfidence: 0.6,
    creativeInterest: 0.9,
    socialMediaComfort: 0.7,
    productVsService: 0.9,
    teachingVsSolving: 0.2,
    platformEcosystemComfort: 0.8,
    collaborationPreference: 0.7,
    promoteOthersWillingness: 0.4,
    technicalComfort: 0.7,
  },
  "print-on-demand": {
    incomeAmbition: 0.7,
    speedToIncome: 0.6,
    upfrontInvestmentTolerance: 0.7,
    passiveIncomePreference: 0.4,
    businessExitStrategy: 0.6,
    meaningfulContributionImportance: 0.5,

    passionAlignment: 0.8,
    timeCommitment: 0.7,
    consistencyAndFollowThrough: 0.8,
    riskTolerance: 0.6,
    systemsThinking: 0.7,
    toolLearning: 0.6,
    autonomyControl: 0.8,
    structurePreference: 0.7,
    repetitionTolerance: 0.7,
    adaptabilityToFeedback: 0.8,
    originalityPreference: 0.7,

    salesConfidence: 0.6,
    creativeInterest: 0.6,
    socialMediaComfort: 0.6,
    productVsService: 0.2,
    teachingVsSolving: 0.2,
    platformEcosystemComfort: 0.5,
    collaborationPreference: 0.6,
    promoteOthersWillingness: 0.4,
    technicalComfort: 0.7,
  },
};

// STEP 2: Normalize User Answers (Convert to 0-1 scale)
export function normalizeUserResponses(data: any): Record<string, number> {
  const normalized: Record<string, number> = {};

  const normalizeFivePointScale = (value: number) => (value - 1) / 4; // Converts 1-5 to 0-1

  // === Core Business Traits ===

  // incomeAmbition (Q3, Q7)
  const numericalIncomeGoal = data.successIncomeGoal || data.incomeGoal || 5000;
  // Cap at a reasonable high for normalization, e.g., $15,000 (monthly for $5000+ category)
  const scaledIncome =
    Math.min(Math.max(numericalIncomeGoal, 0), 15000) / 15000;

  // Handle both old and new field names for growth ambition
  const businessGrowth =
    data.businessGrowthAmbition ||
    data.businessGrowthSize ||
    "Full-time income";
  const growthAmbitionMapping: Record<string, number> = {
    "Just a side income": 0.2,
    "Full-time income": 0.5,
    "Multi-6-figure brand": 0.8,
    "A widely recognized company": 1.0,
    // Legacy mappings
    "side-income": 0.2,
    "full-time": 0.5,
    scaling: 0.8,
    empire: 1.0,
  };
  normalized.incomeAmbition =
    (scaledIncome + (growthAmbitionMapping[businessGrowth] || 0.5)) / 2;

  // speedToIncome (Q2)
  const firstIncomeMapping: Record<string, number> = {
    "Under 1 month": 1.0,
    "1–3 months": 0.7,
    "3–6 months": 0.4,
    "No rush": 0.1,
    // Legacy mappings
    "1-2-weeks": 1.0,
    "1-month": 0.8,
    "3-6-months": 0.6,
    "6-12-months": 0.4,
    "1-2-years": 0.2,
    "2-plus-years": 0.0,
  };
  normalized.speedToIncome =
    firstIncomeMapping[
      data.firstIncomeTimeline || data.timeToFirstIncome || "3–6 months"
    ] || 0.5;

  // upfrontInvestmentTolerance (Q4)
  const investment = data.upfrontInvestment || data.startupBudget || 0;
  let investmentScore = 0.5;

  if (typeof investment === "string") {
    const investmentMapping: Record<string, number> = {
      $0: 0.0,
      "Under $250": 0.25,
      "$250–$1,000": 0.6,
      "$1,000+": 1.0,
    };
    investmentScore = investmentMapping[investment] || 0.5;
  } else if (typeof investment === "number") {
    investmentScore = Math.min(investment / 1000, 1.0);
  }
  normalized.upfrontInvestmentTolerance = investmentScore;

  // passiveIncomePreference (Q8)
  normalized.passiveIncomePreference = normalizeFivePointScale(
    data.passiveIncomeImportance || 3,
  );

  // businessExitStrategy (Q6)
  const exitPlan =
    data.sellOrExitBusiness || data.businessExitPlan || "Not sure";
  const exitMapping: Record<string, number> = {
    Yes: 1.0,
    No: 0.0,
    "Not sure": 0.5,
    // Legacy mappings
    "build-and-sell": 1.0,
    "long-term": 0.0,
    undecided: 0.5,
  };
  normalized.businessExitStrategy = exitMapping[exitPlan] || 0.5;

  // meaningfulContributionImportance (Q45)
  normalized.meaningfulContributionImportance = normalizeFivePointScale(
    data.meaningfulContributionImportance || 3,
  );

  // === Personal Work Style & Resilience ===

  // passionAlignment (Q5)
  normalized.passionAlignment = normalizeFivePointScale(
    data.passionIdentityAlignment || 3,
  );

  // timeCommitment (Q9)
  const hours =
    data.hoursPerWeek || data.weeklyTimeCommitment || data.timeCommitment || 20;
  let timeScore = 0.5;

  if (typeof hours === "string") {
    const hoursMapping: Record<string, number> = {
      "Less than 5 hours": 0.1,
      "5–10 hours": 0.4,
      "10–25 hours": 0.7,
      "25+ hours": 1.0,
    };
    timeScore = hoursMapping[hours] || 0.5;
  } else if (typeof hours === "number") {
    timeScore = Math.min(hours / 25, 1.0);
  }
  normalized.timeCommitment = timeScore;

  // consistencyAndFollowThrough (Q10)
  normalized.consistencyAndFollowThrough = normalizeFivePointScale(
    data.consistencyWithGoals || data.longTermConsistency || 3,
  );

  // riskTolerance (Q11, Q14, Q32) - Combine these three for a holistic view
  const trialErrorScale = normalizeFivePointScale(
    data.trialAndErrorComfort || data.trialErrorComfort || 3,
  );
  const discouragementScale = normalizeFivePointScale(
    data.discouragementResilience || 3,
  );
  const riskComfortScale = normalizeFivePointScale(
    data.riskComfort || data.riskComfortLevel || data.riskTolerance || 3,
  );
  normalized.riskTolerance =
    (trialErrorScale + discouragementScale + riskComfortScale) / 3;

  // systemsThinking (Q13, Q16)
  normalized.systemsThinking =
    (normalizeFivePointScale(data.systemsRoutinesEnjoyment || 3) +
      normalizeFivePointScale(data.organizationLevel || 3)) /
    2;

  // toolLearning (Q15)
  const toolWillingness = data.toolLearningWillingness || "Yes";
  const toolWillingnessMapping: Record<string, number> = {
    Yes: 1.0,
    No: 0.0,
    yes: 1.0,
    no: 0.0,
    maybe: 0.5,
  };
  normalized.toolLearning = toolWillingnessMapping[toolWillingness] || 1.0;

  // autonomyControl (Q17, Q35)
  const selfMotivationScore = normalizeFivePointScale(
    data.selfMotivation || data.selfMotivationLevel || 4,
  );
  const controlScore = normalizeFivePointScale(data.controlImportance || 4);
  normalized.autonomyControl = (selfMotivationScore + controlScore) / 2;

  // structurePreference (Q18, Q25)
  const uncertaintyHandlingNormalized =
    1 - normalizeFivePointScale(data.uncertaintyHandling || 3);
  const structurePrefMapping: Record<string, number> = {
    "Clear steps and order": 1.0,
    "Some structure": 0.7,
    "Mostly flexible": 0.4,
    "Total freedom": 0.1,
    // Legacy mappings
    "clear-steps": 1.0,
    "some-structure": 0.7,
    "mostly-flexible": 0.4,
    "total-freedom": 0.1,
  };
  normalized.structurePreference =
    (uncertaintyHandlingNormalized +
      (structurePrefMapping[data.workStructurePreference] || 0.5)) /
    2;

  // repetitionTolerance (Q19)
  const repetitiveTask = data.repetitiveTasksFeeling || "I don't mind them";
  const repetitiveMapping: Record<string, number> = {
    "I avoid them": 0.0,
    "I tolerate them": 0.3,
    "I don't mind them": 0.7,
    "I enjoy them": 1.0,
    // Legacy mappings
    avoid: 0.0,
    tolerate: 0.3,
    neutral: 0.7,
    enjoy: 1.0,
  };
  normalized.repetitionTolerance = repetitiveMapping[repetitiveTask] || 0.7;

  // adaptabilityToFeedback (Q33)
  normalized.adaptabilityToFeedback = normalizeFivePointScale(
    data.negativeFeedbackResponse || data.feedbackRejectionResponse || 3,
  );

  // originalityPreference (Q34)
  const pathPref =
    data.pathCreationPreference || data.pathPreference || "A mix";
  const originalityMapping: Record<string, number> = {
    "Proven paths": 0.0,
    "A mix": 0.5,
    "Mostly original": 0.8,
    "I want to build something new": 1.0,
    // Legacy mappings
    "teaching-focused": 1.0,
    "both-equally": 0.5,
    "problem-solving": 0.0,
  };
  normalized.originalityPreference = originalityMapping[pathPref] || 0.5;

  // === Interaction & Marketing Style ===

  // salesConfidence (Q24)
  normalized.salesConfidence = normalizeFivePointScale(
    data.directCommunicationEnjoyment || 3,
  );

  // creativeInterest (Q23)
  normalized.creativeInterest = normalizeFivePointScale(
    data.creativeWorkEnjoyment || 3,
  );

  // socialMediaComfort (Q21, Q36, Q40)
  const brandFaceComfortScaled = normalizeFivePointScale(
    data.brandFaceComfort || 3,
  );
  const faceVoiceOnlineComfort =
    data.faceAndVoiceOnlineComfort || data.onlinePresenceComfort || "Yes";
  const faceVoiceOnlineComfortScaled =
    faceVoiceOnlineComfort === "Yes" || faceVoiceOnlineComfort === "yes"
      ? 1.0
      : 0.0;
  const socialMediaInterestScaled = normalizeFivePointScale(
    data.socialMediaInterest || 3,
  );
  normalized.socialMediaComfort =
    (brandFaceComfortScaled +
      faceVoiceOnlineComfortScaled +
      socialMediaInterestScaled) /
    3;

  // productVsService (Q38, Q39)
  const physicalShipping =
    data.physicalProductShipping || data.physicalShippingOpenness || "No";
  const physicalProductPreference =
    physicalShipping === "Yes" || physicalShipping === "yes" ? 1.0 : 0.0;
  const workStyle =
    data.createEarnWorkConsistently ||
    data.workStylePreference ||
    "Mix of both";
  const createEarnWorkConsistentlyMapping: Record<string, number> = {
    "Create once, earn passively": 1.0,
    "Work consistently with people": 0.0,
    "Mix of both": 0.5,
    // Legacy mappings
    passive: 1.0,
    active: 0.0,
    hybrid: 0.5,
  };
  normalized.productVsService =
    (physicalProductPreference +
      (createEarnWorkConsistentlyMapping[workStyle] || 0.5)) /
    2;

  // teachingVsSolving (Q44)
  const teachSolve = data.teachOrSolve || data.teachVsSolvePreference || "Both";
  const teachSolveMapping: Record<string, number> = {
    Teach: 1.0,
    Solve: 0.0,
    Both: 0.5,
    Neither: 0.25,
    // Legacy mappings
    teaching: 1.0,
    solving: 0.0,
    both: 0.5,
  };
  normalized.teachingVsSolving = teachSolveMapping[teachSolve] || 0.5;

  // platformEcosystemComfort (Q41)
  const platformInterest =
    data.platformEcosystemInterest || data.ecosystemParticipation || "Maybe";
  const platformInterestMapping: Record<string, number> = {
    Yes: 1.0,
    No: 0.0,
    Maybe: 0.5,
    yes: 1.0,
    no: 0.0,
    maybe: 0.5,
  };
  normalized.platformEcosystemComfort =
    platformInterestMapping[platformInterest] || 0.5;

  // collaborationPreference (Q20)
  const collab = data.workCollaborationPreference || "I like both";
  const collabMapping: Record<string, number> = {
    "Solo only": 1.0,
    "Mostly solo": 0.8,
    "I like both": 0.5,
    "Team-oriented": 0.2,
    // Legacy mappings
    solo: 1.0,
    "mostly-solo": 0.8,
    balanced: 0.5,
    "mostly-team": 0.2,
    "team-focused": 0.0,
  };
  normalized.collaborationPreference = collabMapping[collab] || 0.5;

  // promoteOthersWillingness (Q43)
  const promoteOthers =
    data.promoteOthersProducts || data.promotingOthersOpenness || "No";
  normalized.promoteOthersWillingness =
    promoteOthers === "Yes" || promoteOthers === "yes" ? 1.0 : 0.0;

  // technicalComfort (Q26)
  normalized.technicalComfort = normalizeFivePointScale(
    data.techSkillsRating || data.technologyComfort || 3,
  );

  return normalized;
}

// STEP 4: Calculate Match Score
export function calculateBusinessModelMatch(
  userProfile: Record<string, number>,
  businessProfile: Record<string, number>,
): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Iterate over the TRAIT_WEIGHTS to ensure all weighted traits are considered
  for (const trait in TRAIT_WEIGHTS) {
    if (TRAIT_WEIGHTS.hasOwnProperty(trait)) {
      const userScore = userProfile[trait] || 0; // Default to 0 if trait missing in user profile
      const modelIdeal =
        businessProfile[
          trait as keyof typeof BUSINESS_MODEL_PROFILES.freelancing
        ] || 0; // Ensure modelIdeal is accessed correctly
      const weight = TRAIT_WEIGHTS[trait as keyof typeof TRAIT_WEIGHTS]; // Get weight from TRAIT_WEIGHTS

      // AGGRESSIVE DIFFERENTIATION: Calculate similarity with much better spread
      // Use a steeper curve that creates more dramatic differences between matches
      const difference = Math.abs(userScore - modelIdeal);
      let similarity: number;
      
      if (difference <= 0.05) {
        // Perfect match (difference ≤ 0.05): 98-100% similarity
        similarity = 0.98 + (0.02 * (1 - difference / 0.05));
      } else if (difference <= 0.15) {
        // Excellent match (difference ≤ 0.15): 90-98% similarity
        similarity = 0.90 + (0.08 * (1 - (difference - 0.05) / 0.1));
      } else if (difference <= 0.25) {
        // Good match (difference ≤ 0.25): 75-90% similarity
        similarity = 0.75 + (0.15 * (1 - (difference - 0.15) / 0.1));
      } else if (difference <= 0.35) {
        // Moderate match (difference ≤ 0.35): 55-75% similarity
        similarity = 0.55 + (0.20 * (1 - (difference - 0.25) / 0.1));
      } else if (difference <= 0.45) {
        // Poor match (difference ≤ 0.45): 30-55% similarity
        similarity = 0.30 + (0.25 * (1 - (difference - 0.35) / 0.1));
      } else if (difference <= 0.55) {
        // Very poor match (difference ≤ 0.55): 10-30% similarity
        similarity = 0.10 + (0.20 * (1 - (difference - 0.45) / 0.1));
      } else {
        // Extremely poor match (difference > 0.55): 0-10% similarity
        similarity = Math.max(0, 0.10 * (1 - (difference - 0.55) / 0.45));
      }

      totalWeightedScore += similarity * weight;
      totalWeight += weight;
    }
  }

  // Raw score is 0-100
  const rawScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

  // Rescale to 40-96 range for more dynamic and realistic spread
  // scaled = 40 + (raw / 100) * (96 - 40)
  const scaledScore = 40 + (rawScore / 100) * 56;
  return Math.round(scaledScore);
}

// Helper for static thresholds (after top 3 are Best Fit)
// Category thresholds:
// - Top 3: 'Best Fit'
// - Strong Fit: 75–94
// - Possible Fit: 55–74
// - Poor Fit: 30–54
const staticCategoryThresholds = {
  // After top 3, these are the cutoffs:
  // Strong Fit: 75% and above
  // Possible Fit: 55% to 74%
  // Poor Fit: below 55%
  "Strong Fit": 75,
  "Possible Fit": 55,
  "Poor Fit": 0,
};

// STEP 3: Categorize scores - Top 3 are always Best Fit, then static thresholds
export function getCategoryFromScore(score: number, index: number): string {
  if (index < 3) return "Best Fit";
  if (score >= staticCategoryThresholds["Strong Fit"]) return "Strong Fit";
  if (score >= staticCategoryThresholds["Possible Fit"]) return "Possible Fit";
  return "Poor Fit";
}

// Assignment function to ensure a good distribution of categories
export function assignCategories(
  results: Array<{
    id: string;
    name: string;
    score: number;
    category: string; // This will be initially empty and then set
  }>,
): Array<{
  id: string;
  name: string;
  score: number;
  category: string;
}> {
  // Sort by score (highest first)
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  const finalCategorizedResults: Array<{
    id: string;
    name: string;
    score: number;
    category: string;
  }> = [];

  for (let i = 0; i < sortedResults.length; i++) {
    const result = sortedResults[i];
    const assignedCategory = getCategoryFromScore(result.score, i);
    finalCategorizedResults.push({
      ...result,
      category: assignedCategory,
    });
  }

  return finalCategorizedResults;
}

/**
 * Enforce a minimum gap and non-uniform spacing between all consecutive scores.
 * Applies globally, not just to the top N. Ensures no two consecutive gaps are the same and all gaps are at least minGap.
 * minGap: minimum allowed gap between consecutive scores (e.g., 3)
 * maxGap: maximum allowed gap between consecutive scores (e.g., 7)
 */
export function enforceGlobalMinimumScoreGap(
  results: Array<{ id: string; name: string; score: number; category: string }>,
  minGap: number = 3,
  maxGap: number = 7
): Array<{ id: string; name: string; score: number; category: string }> {
  if (results.length < 2) return results;
  const adjusted = [...results];
  let lastGap = null;
  for (let i = 1; i < adjusted.length; i++) {
    let prev = adjusted[i - 1].score;
    let curr = adjusted[i].score;
    let gap = prev - curr;
    // Pick a random gap between minGap and maxGap, not equal to lastGap
    let possibleGaps = [];
    for (let g = minGap; g <= maxGap; g++) {
      if (g !== lastGap) possibleGaps.push(g);
    }
    let newGap = possibleGaps[Math.floor(Math.random() * possibleGaps.length)];
    // If the current gap is less than newGap or same as lastGap, adjust
    if (gap < newGap || (lastGap !== null && gap === lastGap)) {
      adjusted[i].score = Math.max(0, prev - newGap);
      gap = prev - adjusted[i].score;
    }
    lastGap = gap;
  }
  return adjusted;
}

// STEP 5: Calculate all business model matches
export function calculateAllBusinessModelMatches(data: any): Array<{
  id: string;
  name: string;
  score: number;
  category: string;
}> {
  const userProfile = normalizeUserResponses(data);
  const results: Array<{
    id: string;
    name: string;
    score: number;
    category: string;
  }> = [];

  // Business model names mapping
  const businessNames: Record<string, string> = {
    freelancing: "Freelancing",
    "online-coaching": "Online Coaching",
    "e-commerce": "E-commerce Brand Building",
    "content-creation": "Content Creation / UGC",
    "youtube-automation": "YouTube Automation Channels",
    "local-service": "Local Service Arbitrage",
    "high-ticket-sales": "High-Ticket Sales / Closing",
    "saas-development": "App or SaaS Development",
    "social-media-agency": "Social Media Marketing Agency",
    "ai-marketing-agency": "AI Marketing Agency",
    "digital-services": "Digital Services Agency",
    "investing-trading": "Investing / Trading",
    "online-reselling": "Online Reselling",
    "handmade-goods": "Handmade Goods",
    copywriting: "Copywriting / Ghostwriting",
    "affiliate-marketing": "Affiliate Marketing",
    "virtual-assistant": "Virtual Assistant",
    "e-commerce-dropshipping": "E-commerce / Dropshipping",
    "print-on-demand": "Print on Demand",
  };

  // Calculate scores for each business model
  for (const [modelId, profile] of Object.entries(BUSINESS_MODEL_PROFILES)) {
    const score = calculateBusinessModelMatch(userProfile, profile);
    results.push({
      id: modelId,
      name: businessNames[modelId] || modelId,
      score: Math.round(score),
      category: "", // Will be set by assignCategories
    });
  }

  // Sort by score (highest first) before assigning categories based on max score
  results.sort((a, b) => b.score - a.score);

  // Enforce global minimum gap and non-uniformity for all results
  const adjustedResults = enforceGlobalMinimumScoreGap(results, 2, 7);

  // Assign categories based on algorithm rules (now using max score for dynamic thresholds)
  const categorizedResults = assignCategories(adjustedResults);

  return categorizedResults;
}

// Legacy function name for backward compatibility
export const calculateAdvancedBusinessModelMatches =
  calculateAllBusinessModelMatches;
