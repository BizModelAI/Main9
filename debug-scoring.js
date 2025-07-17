// Debug script to test the scoring algorithm
const mockQuizData = {
  mainMotivation: "financial-freedom",
  firstIncomeTimeline: "3-6-months",
  successIncomeGoal: 5000,
  upfrontInvestment: 1000,
  passionIdentityAlignment: 4,
  businessExitPlan: "not-sure",
  businessGrowthSize: "full-time-income",
  passiveIncomeImportance: 3,
  weeklyTimeCommitment: 20,
  longTermConsistency: 4,
  trialErrorComfort: 3,
  learningPreference: "hands-on",
  systemsRoutinesEnjoyment: 3,
  discouragementResilience: 4,
  toolLearningWillingness: "yes",
  organizationLevel: 3,
  selfMotivationLevel: 4,
  uncertaintyHandling: 3,
  repetitiveTasksFeeling: "tolerate",
  workCollaborationPreference: "mostly-solo",
  brandFaceComfort: 3,
  competitivenessLevel: 3,
  creativeWorkEnjoyment: 4,
  directCommunicationEnjoyment: 4,
  workStructurePreference: "some-structure",
  techSkillsRating: 3,
  workspaceAvailability: "yes",
  supportSystemStrength: "small-helpful-group",
  internetDeviceReliability: 4,
  familiarTools: ["google-docs-sheets", "canva"],
  decisionMakingStyle: "after-some-research",
  riskComfortLevel: 3,
  feedbackRejectionResponse: 3,
  pathPreference: "mix",
  controlImportance: 4,
  onlinePresenceComfort: "yes",
  clientCallsComfort: "yes",
  physicalShippingOpenness: "no",
  workStylePreference: "create-once-passive",
  socialMediaInterest: 3,
  ecosystemParticipation: "participate-somewhat",
  existingAudience: "none",
  promotingOthersOpenness: "somewhat-open",
  teachVsSolvePreference: "solve-problems",
  meaningfulContributionImportance: 4,
};

// Simulate the normalizeUserResponses function
function normalizeUserResponses(data) {
  const normalized = {};
  
  const normalizeFivePointScale = (value) => (value - 1) / 4;
  
  // incomeAmbition
  const scaledIncome = Math.min(Math.max(data.successIncomeGoal, 0), 15000) / 15000;
  const growthAmbitionMapping = {
    "Just a side income": 0.2,
    "Full-time income": 0.5,
    "Multi-6-figure brand": 0.8,
    "A widely recognized company": 1.0,
    "side-income": 0.2,
    "full-time": 0.5,
    scaling: 0.8,
    empire: 1.0,
  };
  normalized.incomeAmbition = (scaledIncome + (growthAmbitionMapping[data.businessGrowthSize] || 0.5)) / 2;
  
  // speedToIncome
  const firstIncomeMapping = {
    "Under 1 month": 1.0,
    "1–3 months": 0.7,
    "3–6 months": 0.4,
    "No rush": 0.1,
    "1-2-weeks": 1.0,
    "1-month": 0.8,
    "3-6-months": 0.6,
    "6-12-months": 0.4,
    "1-2-years": 0.2,
    "2-plus-years": 0.0,
  };
  normalized.speedToIncome = firstIncomeMapping[data.firstIncomeTimeline] || 0.5;
  
  // upfrontInvestmentTolerance
  const investment = data.upfrontInvestment || 0;
  let investmentScore = 0.5;
  if (typeof investment === "string") {
    const investmentMapping = {
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
  
  // passiveIncomePreference
  normalized.passiveIncomePreference = normalizeFivePointScale(data.passiveIncomeImportance || 3);
  
  // businessExitStrategy
  const exitMapping = {
    Yes: 1.0,
    No: 0.0,
    "Not sure": 0.5,
    "build-and-sell": 1.0,
    "long-term": 0.0,
    undecided: 0.5,
  };
  normalized.businessExitStrategy = exitMapping[data.businessExitPlan] || 0.5;
  
  // meaningfulContributionImportance
  normalized.meaningfulContributionImportance = normalizeFivePointScale(data.meaningfulContributionImportance || 3);
  
  // passionAlignment
  normalized.passionAlignment = normalizeFivePointScale(data.passionIdentityAlignment || 3);
  
  // timeCommitment
  const hours = data.weeklyTimeCommitment || 20;
  let timeScore = 0.5;
  if (typeof hours === "string") {
    const hoursMapping = {
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
  
  // consistencyAndFollowThrough
  normalized.consistencyAndFollowThrough = normalizeFivePointScale(data.longTermConsistency || 3);
  
  // riskTolerance
  normalized.riskTolerance = normalizeFivePointScale(data.riskComfortLevel || 3);
  
  // systemsThinking
  normalized.systemsThinking = normalizeFivePointScale(data.systemsRoutinesEnjoyment || 3);
  
  // toolLearning
  normalized.toolLearning = data.toolLearningWillingness === "yes" ? 1.0 : 0.0;
  
  // autonomyControl
  normalized.autonomyControl = normalizeFivePointScale(data.selfMotivationLevel || 3);
  
  // structurePreference
  normalized.structurePreference = normalizeFivePointScale(data.workStructurePreference === "structured" ? 5 : data.workStructurePreference === "some-structure" ? 3 : 1);
  
  // repetitionTolerance
  const repetitionMapping = {
    "enjoy": 1.0,
    "tolerate": 0.5,
    "avoid": 0.0,
  };
  normalized.repetitionTolerance = repetitionMapping[data.repetitiveTasksFeeling] || 0.5;
  
  // adaptabilityToFeedback
  normalized.adaptabilityToFeedback = normalizeFivePointScale(data.feedbackRejectionResponse || 3);
  
  // originalityPreference
  const pathMapping = {
    "proven-path": 0.0,
    "mix": 0.5,
    "create-own": 1.0,
  };
  normalized.originalityPreference = pathMapping[data.pathPreference] || 0.5;
  
  // salesConfidence
  normalized.salesConfidence = normalizeFivePointScale(data.directCommunicationEnjoyment || 3);
  
  // creativeInterest
  normalized.creativeInterest = normalizeFivePointScale(data.creativeWorkEnjoyment || 3);
  
  // socialMediaComfort
  normalized.socialMediaComfort = normalizeFivePointScale(data.socialMediaInterest || 3);
  
  // productVsService
  const workStyleMapping = {
    "create-once-passive": 1.0,
    "work-with-people": 0.0,
    "mix-both": 0.5,
  };
  normalized.productVsService = workStyleMapping[data.workStylePreference] || 0.5;
  
  // teachingVsSolving
  const teachSolveMapping = {
    "teach-others": 1.0,
    "solve-problems": 0.0,
    "mix-both": 0.5,
  };
  normalized.teachingVsSolving = teachSolveMapping[data.teachVsSolvePreference] || 0.5;
  
  // platformEcosystemComfort
  const ecosystemMapping = {
    "participate-heavily": 1.0,
    "participate-somewhat": 0.5,
    "minimal-participation": 0.0,
  };
  normalized.platformEcosystemComfort = ecosystemMapping[data.ecosystemParticipation] || 0.5;
  
  // collaborationPreference
  const collaborationMapping = {
    "mostly-solo": 0.0,
    "mix-both": 0.5,
    "mostly-team": 1.0,
  };
  normalized.collaborationPreference = collaborationMapping[data.workCollaborationPreference] || 0.5;
  
  // promoteOthersWillingness
  normalized.promoteOthersWillingness = data.promotingOthersOpenness === "Yes" || data.promotingOthersOpenness === "yes" ? 1.0 : 0.0;
  
  // technicalComfort
  normalized.technicalComfort = normalizeFivePointScale(data.techSkillsRating || 3);
  
  return normalized;
}

// Simulate the TRAIT_WEIGHTS
const TRAIT_WEIGHTS = {
  incomeAmbition: 1.5,
  speedToIncome: 1.3,
  upfrontInvestmentTolerance: 1.0,
  passiveIncomePreference: 1.4,
  businessExitStrategy: 0.5,
  meaningfulContributionImportance: 1.0,
  passionAlignment: 1.3,
  timeCommitment: 1.2,
  consistencyAndFollowThrough: 1.1,
  riskTolerance: 1.4,
  systemsThinking: 1.0,
  toolLearning: 0.9,
  autonomyControl: 1.1,
  structurePreference: 0.8,
  repetitionTolerance: 0.7,
  adaptabilityToFeedback: 0.8,
  originalityPreference: 0.9,
  salesConfidence: 1.1,
  creativeInterest: 1.0,
  socialMediaComfort: 1.0,
  productVsService: 0.9,
  teachingVsSolving: 0.8,
  platformEcosystemComfort: 0.7,
  collaborationPreference: 0.8,
  promoteOthersWillingness: 0.6,
  technicalComfort: 0.8,
};

// Simulate a business profile (using freelancing as example)
const freelancingProfile = {
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
};

// Test the scoring function
function calculateBusinessModelMatch(userProfile, businessProfile) {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const trait in TRAIT_WEIGHTS) {
    if (TRAIT_WEIGHTS.hasOwnProperty(trait)) {
      const userScore = userProfile[trait] || 0;
      const modelIdeal = businessProfile[trait] || 0;
      const weight = TRAIT_WEIGHTS[trait];

      // AGGRESSIVE DIFFERENTIATION: Calculate similarity with much better spread
      const difference = Math.abs(userScore - modelIdeal);
      let similarity;
      
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
  // Rescale to 40-95
  const scaledScore = 40 + (rawScore / 100) * 55;
  return Math.round(scaledScore);
}

// Category thresholds for 40-95 range
const categoryThresholds = {
  "Best Fit": (max) => Math.max(85, max - 5),
  "Strong Fit": () => 70,
  "Possible Fit": () => 55,
  "Poor Fit": () => 0,
};

function getCategoryFromScore(score, maxScore) {
  if (score >= categoryThresholds["Best Fit"](maxScore)) return "Best Fit";
  if (score >= categoryThresholds["Strong Fit"](maxScore)) return "Strong Fit";
  if (score >= categoryThresholds["Possible Fit"](maxScore)) return "Possible Fit";
  return "Poor Fit";
}

// Run the test
console.log("Testing scoring algorithm...");
const userProfile = normalizeUserResponses(mockQuizData);
console.log("User profile (first 5 traits):", Object.entries(userProfile).slice(0, 5));
console.log("Freelancing profile (first 5 traits):", Object.entries(freelancingProfile).slice(0, 5));

const score = calculateBusinessModelMatch(userProfile, freelancingProfile);
console.log(`Calculated score: ${score.toFixed(2)}%`);

// Test with a few more business models
const ecommerceProfile = {
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
};

const saasProfile = {
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
};

console.log("\nTesting multiple business models:");
const freelancingScore = calculateBusinessModelMatch(userProfile, freelancingProfile);
const ecommerceScore = calculateBusinessModelMatch(userProfile, ecommerceProfile);
const saasScore = calculateBusinessModelMatch(userProfile, saasProfile);

const scores = [
  { name: "Freelancing", score: freelancingScore },
  { name: "E-commerce", score: ecommerceScore },
  { name: "SaaS", score: saasScore },
];

const maxScore = Math.max(...scores.map(s => s.score));

scores.forEach(s => {
  const category = getCategoryFromScore(s.score, maxScore);
  console.log(`${s.name}: ${s.score}% (${category})`);
});

const averageScore = scores.reduce((a, b) => a + b.score, 0) / scores.length;
console.log(`\nAverage score: ${averageScore.toFixed(2)}%`);
console.log(`Score range: ${Math.min(...scores.map(s => s.score)).toFixed(2)}% - ${Math.max(...scores.map(s => s.score)).toFixed(2)}%`);

if (Math.abs(averageScore - 80) < 5) {
  console.log("\n🚨 ISSUE DETECTED: All scores are clustering around 80%!");
  console.log("This suggests the similarity calculation may be biased toward the middle.");
} 