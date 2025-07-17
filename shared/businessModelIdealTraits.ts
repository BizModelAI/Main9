// Ideal personality trait scores for each business model
export interface IdealTraits {
  riskTolerance: number;
  selfMotivation: number;
  techComfort: number;
  consistency: number;
  learningAgility: number;
}

export const businessModelIdealTraits: Record<string, IdealTraits> = {
  'dropshipping': {
    riskTolerance: 70,
    selfMotivation: 85,
    techComfort: 80,
    consistency: 75,
    learningAgility: 85
  },
  'affiliate-marketing': {
    riskTolerance: 65,
    selfMotivation: 80,
    techComfort: 75,
    consistency: 70,
    learningAgility: 80
  },
  'content-creation': {
    riskTolerance: 50,
    selfMotivation: 80,
    techComfort: 70,
    consistency: 85,
    learningAgility: 90
  },
  'youtube-automation': {
    riskTolerance: 60,
    selfMotivation: 80,
    techComfort: 85,
    consistency: 80,
    learningAgility: 90
  },
  'local-service': {
    riskTolerance: 60,
    selfMotivation: 75,
    techComfort: 65,
    consistency: 70,
    learningAgility: 75
  },
  'high-ticket-sales': {
    riskTolerance: 55,
    selfMotivation: 90,
    techComfort: 60,
    consistency: 75,
    learningAgility: 80
  },
  'saas-development': {
    riskTolerance: 80,
    selfMotivation: 90,
    techComfort: 95,
    consistency: 85,
    learningAgility: 95
  },
  'social-media-agency': {
    riskTolerance: 70,
    selfMotivation: 85,
    techComfort: 85,
    consistency: 80,
    learningAgility: 90
  },
  'ai-marketing-agency': {
    riskTolerance: 75,
    selfMotivation: 90,
    techComfort: 95,
    consistency: 85,
    learningAgility: 95
  },
  'digital-services': {
    riskTolerance: 70,
    selfMotivation: 85,
    techComfort: 85,
    consistency: 80,
    learningAgility: 90
  },
  'investing-trading': {
    riskTolerance: 90,
    selfMotivation: 70,
    techComfort: 80,
    consistency: 60,
    learningAgility: 95
  },
  'online-reselling': {
    riskTolerance: 65,
    selfMotivation: 75,
    techComfort: 70,
    consistency: 70,
    learningAgility: 80
  },
  'handmade-goods': {
    riskTolerance: 40,
    selfMotivation: 70,
    techComfort: 50,
    consistency: 80,
    learningAgility: 60
  },
  'copywriting': {
    riskTolerance: 45,
    selfMotivation: 80,
    techComfort: 60,
    consistency: 85,
    learningAgility: 75
  },
  'virtual-assistant': {
    riskTolerance: 35,
    selfMotivation: 70,
    techComfort: 70,
    consistency: 90,
    learningAgility: 75
  },
  'e-commerce': {
    riskTolerance: 80,
    selfMotivation: 90,
    techComfort: 85,
    consistency: 85,
    learningAgility: 90
  },
  'online-coaching': {
    riskTolerance: 40,
    selfMotivation: 75,
    techComfort: 65,
    consistency: 70,
    learningAgility: 80
  },
  'freelancing': {
    riskTolerance: 55,
    selfMotivation: 80,
    techComfort: 70,
    consistency: 75,
    learningAgility: 85
  }
};

// Default ideal traits for business models not in the table
export const defaultIdealTraits: IdealTraits = {
  riskTolerance: 60,
  selfMotivation: 80,
  techComfort: 70,
  consistency: 75,
  learningAgility: 80
};

export function getIdealTraits(businessId: string): IdealTraits {
  return businessModelIdealTraits[businessId] || defaultIdealTraits;
}

export const traitDescriptions = {
  riskTolerance: { min: "Avoids Risks", max: "Embraces Risks" },
  selfMotivation: { min: "Passive", max: "Highly Self-Directed" },
  techComfort: { min: "Low Tech Skills", max: "Tech Savvy" },
  consistency: { min: "Inconsistent", max: "Highly Consistent" },
  learningAgility: { min: "Resists New Skills", max: "Quickly Adapts" }
};