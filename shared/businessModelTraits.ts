import { QuizData } from './types';

export interface BusinessModelTraits {
  riskTolerance: number;
  selfMotivation: number;
  techComfort: number;
  consistency: number;
  learningAgility: number;
}

export function calculateBusinessModelTraits(data: QuizData): BusinessModelTraits {
  // Initialize raw scores to 0
  let riskToleranceRawScore = 0;
  let selfMotivationRawScore = 0;
  let techComfortRawScore = 0;
  let consistencyRawScore = 0;
  let learningAgilityRawScore = 0;

  // A. Risk Tolerance Calculation
  // Q11: How do you feel about trial and error? (trialErrorComfort)
  riskToleranceRawScore += data.trialErrorComfort;
  
  // Q18: How well do you handle uncertainty and unclear steps? (uncertaintyHandling)
  riskToleranceRawScore += data.uncertaintyHandling;
  
  // Q32: How comfortable are you taking risks? (riskComfortLevel)
  riskToleranceRawScore += data.riskComfortLevel;

  // B. Self-Motivation Calculation
  // Q10: How consistent are you with long-term goals? (longTermConsistency)
  selfMotivationRawScore += data.longTermConsistency;
  
  // Q14: How discouraged do you get if something doesn't work right away? (discouragementResilience)
  selfMotivationRawScore += data.discouragementResilience;
  
  // Q17: How self-motivated are you without external pressure? (selfMotivationLevel)
  selfMotivationRawScore += data.selfMotivationLevel;

  // C. Tech Comfort Calculation
  // Q15: Are you willing to learn new tools or software platforms? (toolLearningWillingness)
  if (data.toolLearningWillingness === 'yes') {
    techComfortRawScore += 5;
  } else {
    techComfortRawScore += 1;
  }
  
  // Q26: How would you rate your tech skills overall? (techSkillsRating)
  techComfortRawScore += data.techSkillsRating;
  
  // Q30: Which tools are you already familiar with? (familiarTools)
  const toolPoints = {
    'google-docs-sheets': 1,
    'canva': 1,
    'notion': 1,
    'shopify-wix-squarespace': 1,
    'zoom-streamyard': 1
  };
  
  data.familiarTools.forEach(tool => {
    if (toolPoints[tool as keyof typeof toolPoints]) {
      techComfortRawScore += toolPoints[tool as keyof typeof toolPoints];
    }
  });

  // D. Consistency Calculation
  // Q10: How consistent are you with long-term goals? (longTermConsistency)
  consistencyRawScore += data.longTermConsistency;
  
  // Q13: How much do you enjoy building routines or systems? (systemsRoutinesEnjoyment)
  consistencyRawScore += data.systemsRoutinesEnjoyment;
  
  // Q16: How organized are you? (organizationLevel)
  consistencyRawScore += data.organizationLevel;

  // E. Learning Agility Calculation
  // Q11: How do you feel about trial and error? (trialErrorComfort)
  learningAgilityRawScore += data.trialErrorComfort;
  
  // Q12: How do you prefer to learn new things? (learningPreference)
  const learningPreferencePoints = {
    'hands-on': 5,
    'watching-tutorials': 3,
    'reading-self-study': 4,
    'one-on-one-coaching': 2
  };
  learningAgilityRawScore += learningPreferencePoints[data.learningPreference as keyof typeof learningPreferencePoints] || 3;
  
  // Q15: Are you willing to learn new tools or software platforms? (toolLearningWillingness)
  if (data.toolLearningWillingness === 'yes') {
    learningAgilityRawScore += 5;
  } else {
    learningAgilityRawScore += 1;
  }

  // Convert raw scores to percentages using the specified formula
  // Formula: ((RawScore - MinScore) / (MaxScore - MinScore)) * 100
  
  const riskTolerancePercentage = Math.round(((riskToleranceRawScore - 3) / (15 - 3)) * 100);
  const selfMotivationPercentage = Math.round(((selfMotivationRawScore - 3) / (15 - 3)) * 100);
  const techComfortPercentage = Math.round(((techComfortRawScore - 2) / (15 - 2)) * 100);
  const consistencyPercentage = Math.round(((consistencyRawScore - 3) / (15 - 3)) * 100);
  const learningAgilityPercentage = Math.round(((learningAgilityRawScore - 4) / (15 - 4)) * 100);

  return {
    riskTolerance: Math.max(0, Math.min(100, riskTolerancePercentage)),
    selfMotivation: Math.max(0, Math.min(100, selfMotivationPercentage)),
    techComfort: Math.max(0, Math.min(100, techComfortPercentage)),
    consistency: Math.max(0, Math.min(100, consistencyPercentage)),
    learningAgility: Math.max(0, Math.min(100, learningAgilityPercentage))
  };
}