export interface QuizData {
  // Round 1: Motivation & Vision
  mainMotivation: string;
  firstIncomeTimeline: string;
  successIncomeGoal: number;
  upfrontInvestment: number;
  passionIdentityAlignment: number;
  businessExitPlan: string;
  businessGrowthSize: string;
  passiveIncomeImportance: number;
  
  // Round 2: Time, Effort & Learning Style
  weeklyTimeCommitment: number;
  longTermConsistency: number;
  trialErrorComfort: number;
  learningPreference: string;
  systemsRoutinesEnjoyment: number;
  discouragementResilience: number;
  toolLearningWillingness: string;
  organizationLevel: number;
  selfMotivationLevel: number;
  uncertaintyHandling: number;
  repetitiveTasksFeeling: string;
  workCollaborationPreference: string;
  
  // Round 3: Personality & Preferences
  brandFaceComfort: number;
  competitivenessLevel: number;
  creativeWorkEnjoyment: number;
  directCommunicationEnjoyment: number;
  workStructurePreference: string;
  
  // Round 4: Tools & Work Environment
  techSkillsRating: number;
  workspaceAvailability: string;
  supportSystemStrength: string;
  internetDeviceReliability: number;
  familiarTools: string[];
  
  // Round 5: Strategy & Decision-Making
  decisionMakingStyle: string;
  riskComfortLevel: number;
  feedbackRejectionResponse: number;
  pathPreference: string;
  controlImportance: number;
  
  // Round 6: Business Model Fit Filters
  onlinePresenceComfort: string;
  clientCallsComfort: string;
  physicalShippingOpenness: string;
  workStylePreference: string;
  socialMediaInterest: number;
  ecosystemParticipation: string;
  existingAudience: string;
  promotingOthersOpenness: string;
  teachVsSolvePreference: string;
  meaningfulContributionImportance: number;
  
  // Adaptive Questions (populated based on responses)
  inventoryComfort?: number;
  digitalContentComfort?: number;
  teachingComfort?: number;
  publicSpeakingComfort?: number;
  salesComfort?: number;

  // Legacy fields for backward compatibility
  primaryMotivation?: string;
  incomeGoal?: number;
  timeToFirstIncome?: string;
  startupBudget?: number;
  timeCommitment?: number;
  learningStyle?: string;
  workPreference?: string;
  riskTolerance?: number;
  customerInteractionComfort?: number;
  selfMotivation?: number;
  existingSkills?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  lifestyle?: 'freedom' | 'stability' | 'growth';
  stressResponse?: string;
  communicationStyle?: string;
  perfectionismLevel?: number;
  socialEnergy?: string;
  changeAdaptability?: number;
  attentionToDetail?: number;
  competitionMotivation?: string;
  failureResponse?: string;
  routinePreference?: string;
  feedbackReception?: string;
  longTermThinking?: string;
  authorityComfort?: number;
  technologyComfort?: number;
}

export interface BusinessPath {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  fitScore: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeToProfit: string;
  startupCost: string;
  potentialIncome: string;
  pros: string[];
  cons: string[];
  tools: string[];
  skills: string[];
  icon: string;
  marketSize: string;
  averageIncome: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  userStruggles: string[];
  solutions: string[];
  bestFitPersonality: string[];
  resources: {
    platforms: string[];
    learning: string[];
    tools: string[];
  };
  actionPlan: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  };
  aiAnalysis?: BusinessFitAnalysis;
}

export interface QuizStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  field: keyof QuizData;
  type: 'select' | 'multiselect' | 'scale' | 'boolean';
  options?: Array<{
    value: any;
    label: string;
    description?: string;
  }>;
  min?: number;
  max?: number;
  condition?: (data: Partial<QuizData>) => boolean;
}

export interface AIAnalysis {
  fullAnalysis: string;
  keyInsights: string[];
  personalizedRecommendations: string[];
  riskFactors: string[];
  successPredictors: string[];
}

export interface BusinessFitAnalysis {
  fitScore: number;
  reasoning: string;
  strengths: string[];
  challenges: string[];
  confidence: number;
}