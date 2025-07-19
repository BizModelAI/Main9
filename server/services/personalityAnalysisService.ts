import OpenAI from "openai";
import { QuizData } from "../../shared/types.js";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface PersonalityTraits {
  socialComfort: number;
  consistency: number;
  riskTolerance: number;
  techComfort: number;
  motivation: number;
  feedbackResilience: number;
  structurePreference: number;
  creativity: number;
  communicationConfidence: number;
}

export interface PersonalityAnalysis {
  traits: PersonalityTraits;
  insights: {
    strengths: string[];
    developmentAreas: string[];
    workStyle: string;
    entrepreneurialFit: string;
  };
  recommendations: string[];
}

export class PersonalityAnalysisService {
  private static instance: PersonalityAnalysisService;

  private constructor() {}

  static getInstance(): PersonalityAnalysisService {
    if (!PersonalityAnalysisService.instance) {
      PersonalityAnalysisService.instance = new PersonalityAnalysisService();
    }
    return PersonalityAnalysisService.instance;
  }

  async analyzePersonality(quizData: QuizData): Promise<PersonalityAnalysis> {
    try {
      const prompt = await this.buildPersonalityPrompt(quizData);

      if (!openai) {
        throw new Error("OpenAI API key not configured");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency
        messages: [
                      {
              role: "system",
              content:
                "You are an expert psychologist and personality analyst specializing in entrepreneurial traits. Analyze the quiz responses to determine personality traits with precise accuracy. Focus on specific behavioral indicators rather than generalizations. Always address the user directly using 'you' and 'your'.",
            },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Lower temperature for more consistent analysis
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No content in AI response");
      const analysis = JSON.parse(content);
      return this.validateAndProcessAnalysis(analysis, quizData);
    } catch (error) {
      console.error("Personality Analysis Service Error:", error);
      // Fallback to algorithmic analysis if AI fails
      return this.fallbackPersonalityAnalysis(quizData);
    }
  }

  private async buildPersonalityPrompt(quizData: QuizData): Promise<string> {
    // Import centralized utility function
    const { getRatingDescription } = await import("../utils/quizUtils.js");

    return `
    Analyze your personality traits based on your quiz responses. Be extremely precise and avoid generic scores.

    YOUR QUIZ RESPONSES:
    - Main Motivation: ${quizData.mainMotivation}
    - Weekly Time Commitment: ${quizData.weeklyTimeCommitment} hours
    - Self Motivation Level: ${getRatingDescription(quizData.selfMotivationLevel)}
    - Long Term Consistency: ${getRatingDescription(quizData.longTermConsistency)}
    - Risk Comfort Level: ${getRatingDescription(quizData.riskComfortLevel)}
    - Tech Skills Rating: ${getRatingDescription(quizData.techSkillsRating)}
    - Direct Communication Enjoyment: ${getRatingDescription(quizData.directCommunicationEnjoyment)}
    - Brand Face Comfort: ${getRatingDescription(quizData.brandFaceComfort)}
    - Creative Work Enjoyment: ${getRatingDescription(quizData.creativeWorkEnjoyment)}
    - Feedback Rejection Response: ${getRatingDescription(quizData.feedbackRejectionResponse)}
    - Organization Level: ${getRatingDescription(quizData.organizationLevel)}
    - Systems Routines Enjoyment: ${getRatingDescription(quizData.systemsRoutinesEnjoyment)}
    - Trial Error Comfort: ${getRatingDescription(quizData.trialErrorComfort)}
    - Uncertainty Handling: ${getRatingDescription(quizData.uncertaintyHandling)}
    - Discouragement Resilience: ${getRatingDescription(quizData.discouragementResilience)}
    - Work Collaboration Preference: ${quizData.workCollaborationPreference}
    - Work Structure Preference: ${quizData.workStructurePreference}
    - Decision Making Style: ${quizData.decisionMakingStyle}
    - Learning Preference: ${quizData.learningPreference}
    - Tool Learning Willingness: ${quizData.toolLearningWillingness}
    - Repetitive Tasks Feeling: ${quizData.repetitiveTasksFeeling}
    - Familiar Tools: ${quizData.familiarTools?.join(", ")}
    - Competitiveness Level: ${getRatingDescription(quizData.competitivenessLevel)}
    - Control Importance: ${getRatingDescription(quizData.controlImportance)}
    - Support System Strength: ${quizData.supportSystemStrength}
    - Passion Identity Alignment: ${getRatingDescription(quizData.passionIdentityAlignment)}

    Calculate precise personality trait scores (0-100) based on these specific responses:

    1. Social Comfort (0-100): Based on communication enjoyment, brand face comfort, collaboration preference
    2. Consistency (0-100): Based on long-term consistency, systems enjoyment, organization level
    3. Risk Tolerance (0-100): Based on risk comfort, trial/error comfort, uncertainty handling
    4. Tech Comfort (0-100): Based on tech skills, tool learning willingness, familiar tools
    5. Motivation (0-100): Based on self motivation, discouragement resilience, work commitment
    6. Feedback Resilience (0-100): Based on feedback response, discouragement resilience
    7. Structure Preference (0-100): Based on work structure preference, systems enjoyment, organization
    8. Creativity (0-100): Based on creative work enjoyment, decision making style, learning preference
    9. Communication Confidence (0-100): Based on direct communication, brand face comfort, collaboration preference

    Provide analysis in this JSON format:
    {
      "traits": {
        "socialComfort": 0-100,
        "consistency": 0-100,
        "riskTolerance": 0-100,
        "techComfort": 0-100,
        "motivation": 0-100,
        "feedbackResilience": 0-100,
        "structurePreference": 0-100,
        "creativity": 0-100,
        "communicationConfidence": 0-100
      },
      "insights": {
        "strengths": ["strength1", "strength2", "strength3"],
        "developmentAreas": ["area1", "area2"],
        "workStyle": "detailed description of work style",
        "entrepreneurialFit": "assessment of entrepreneurial potential"
      },
      "recommendations": ["rec1", "rec2", "rec3"]
    }

    IMPORTANT: 
    - Base scores ONLY on the actual quiz responses provided
    - Avoid round numbers like 50, 75, 90 unless justified by responses
    - Use specific behavioral evidence for each score
    - Most people are not perfectly balanced - show realistic variance
    - Consider interactions between different traits
    `;
  }

  private validateAndProcessAnalysis(
    analysis: any,
    quizData: QuizData,
  ): PersonalityAnalysis {
    // Validate the analysis structure and ensure all required fields are present
    const traits: PersonalityTraits = {
      socialComfort: Math.max(
        0,
        Math.min(100, analysis.traits?.socialComfort || 50),
      ),
      consistency: Math.max(
        0,
        Math.min(100, analysis.traits?.consistency || 50),
      ),
      riskTolerance: Math.max(
        0,
        Math.min(100, analysis.traits?.riskTolerance || 50),
      ),
      techComfort: Math.max(
        0,
        Math.min(100, analysis.traits?.techComfort || 50),
      ),
      motivation: Math.max(0, Math.min(100, analysis.traits?.motivation || 50)),
      feedbackResilience: Math.max(
        0,
        Math.min(100, analysis.traits?.feedbackResilience || 50),
      ),
      structurePreference: Math.max(
        0,
        Math.min(100, analysis.traits?.structurePreference || 50),
      ),
      creativity: Math.max(0, Math.min(100, analysis.traits?.creativity || 50)),
      communicationConfidence: Math.max(
        0,
        Math.min(100, analysis.traits?.communicationConfidence || 50),
      ),
    };

    return {
      traits,
      insights: {
        strengths: analysis.insights?.strengths || [
          "Strong analytical thinking",
        ],
        developmentAreas: analysis.insights?.developmentAreas || [
          "Time management",
        ],
        workStyle: analysis.insights?.workStyle || "Balanced approach to work",
        entrepreneurialFit:
          analysis.insights?.entrepreneurialFit ||
          "Good potential for entrepreneurship",
      },
      recommendations: analysis.recommendations || [
        "Focus on systematic execution",
      ],
    };
  }

  private fallbackPersonalityAnalysis(quizData: QuizData): PersonalityAnalysis {
    // Enhanced algorithmic analysis using actual quiz data
    const traits: PersonalityTraits = {
      socialComfort: this.calculateSocialComfort(quizData),
      consistency: this.calculateConsistency(quizData),
      riskTolerance: this.calculateRiskTolerance(quizData),
      techComfort: this.calculateTechComfort(quizData),
      motivation: this.calculateMotivation(quizData),
      feedbackResilience: this.calculateFeedbackResilience(quizData),
      structurePreference: this.calculateStructurePreference(quizData),
      creativity: this.calculateCreativity(quizData),
      communicationConfidence: this.calculateCommunicationConfidence(quizData),
    };

    return {
      traits,
      insights: {
        strengths: this.identifyStrengths(traits, quizData),
        developmentAreas: this.identifyDevelopmentAreas(traits, quizData),
        workStyle: this.determineWorkStyle(traits, quizData),
        entrepreneurialFit: this.assessEntrepreneurialFit(traits, quizData),
      },
      recommendations: this.generateRecommendations(traits, quizData),
    };
  }

  // Enhanced algorithmic calculations
  private calculateSocialComfort(data: QuizData): number {
    let score = 50; // Start from middle

    // Direct communication enjoyment (strong indicator)
    if (data.directCommunicationEnjoyment) {
      score += (data.directCommunicationEnjoyment - 3) * 15;
    }

    // Brand face comfort
    if (data.brandFaceComfort) {
      score += (data.brandFaceComfort - 3) * 12;
    }

    // Work collaboration preference
    if (data.workCollaborationPreference === "team-focused") score += 20;
    else if (data.workCollaborationPreference === "solo") score -= 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateConsistency(data: QuizData): number {
    let score = 50;

    // Long term consistency (primary indicator)
    if (data.longTermConsistency) {
      score += (data.longTermConsistency - 3) * 20;
    }

    // Systems and routines enjoyment
    if (data.systemsRoutinesEnjoyment) {
      score += (data.systemsRoutinesEnjoyment - 3) * 15;
    }

    // Organization level
    if (data.organizationLevel) {
      score += (data.organizationLevel - 3) * 10;
    }

    // Work structure preference
    if (data.workStructurePreference === "very-structured") score += 15;
    else if (data.workStructurePreference === "very-flexible") score -= 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateRiskTolerance(data: QuizData): number {
    let score = 50;

    // Risk comfort level (primary indicator)
    if (data.riskComfortLevel) {
      score += (data.riskComfortLevel - 3) * 18;
    }

    // Trial error comfort
    if (data.trialErrorComfort) {
      score += (data.trialErrorComfort - 3) * 15;
    }

    // Uncertainty handling
    if (data.uncertaintyHandling) {
      score += (data.uncertaintyHandling - 3) * 12;
    }

    // Investment amount (behavioral indicator)
    if (data.upfrontInvestment) {
      if (data.upfrontInvestment >= 5000) score += 10;
      else if (data.upfrontInvestment <= 500) score -= 8;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateTechComfort(data: QuizData): number {
    let score = 50;

    // Tech skills rating (primary indicator)
    if (data.techSkillsRating) {
      score += (data.techSkillsRating - 3) * 20;
    }

    // Tool learning willingness
    if (data.toolLearningWillingness === "very_willing") score += 15;
    else if (data.toolLearningWillingness === "willing") score += 5;
    else if (data.toolLearningWillingness === "reluctant") score -= 15;

    // Familiar tools (more tools = higher comfort)
    if (data.familiarTools) {
      score += Math.min(data.familiarTools.length * 3, 15);
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateMotivation(data: QuizData): number {
    let score = 50;

    // Self motivation level (primary indicator)
    if (data.selfMotivationLevel) {
      score += (data.selfMotivationLevel - 3) * 18;
    }

    // Discouragement resilience
    if (data.discouragementResilience) {
      score += (data.discouragementResilience - 3) * 15;
    }

    // Weekly time commitment (behavioral indicator)
    if (data.weeklyTimeCommitment) {
      if (data.weeklyTimeCommitment >= 30) score += 10;
      else if (data.weeklyTimeCommitment <= 10) score -= 8;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateFeedbackResilience(data: QuizData): number {
    let score = 50;

    // Feedback rejection response (primary indicator)
    if (data.feedbackRejectionResponse) {
      score += (data.feedbackRejectionResponse - 3) * 20;
    }

    // Discouragement resilience
    if (data.discouragementResilience) {
      score += (data.discouragementResilience - 3) * 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateStructurePreference(data: QuizData): number {
    let score = 50;

    // Work structure preference (primary indicator)
    if (data.workStructurePreference === "very-structured") score += 25;
    else if (data.workStructurePreference === "structured") score += 15;
    else if (data.workStructurePreference === "flexible") score -= 10;
    else if (data.workStructurePreference === "very-flexible") score -= 20;

    // Systems routines enjoyment
    if (data.systemsRoutinesEnjoyment) {
      score += (data.systemsRoutinesEnjoyment - 3) * 12;
    }

    // Organization level
    if (data.organizationLevel) {
      score += (data.organizationLevel - 3) * 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateCreativity(data: QuizData): number {
    let score = 50;

    // Creative work enjoyment (primary indicator)
    if (data.creativeWorkEnjoyment) {
      score += (data.creativeWorkEnjoyment - 3) * 18;
    }

    // Decision making style
    if (data.decisionMakingStyle === "intuitive") score += 15;
    else if (data.decisionMakingStyle === "analytical") score -= 10;

    // Learning preference
    if (data.learningPreference === "hands_on") score += 10;
    else if (data.learningPreference === "visual") score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateCommunicationConfidence(data: QuizData): number {
    let score = 50;

    // Direct communication enjoyment (primary indicator)
    if (data.directCommunicationEnjoyment) {
      score += (data.directCommunicationEnjoyment - 3) * 15;
    }

    // Brand face comfort
    if (data.brandFaceComfort) {
      score += (data.brandFaceComfort - 3) * 15;
    }

    // Competitiveness level
    if (data.competitivenessLevel) {
      score += (data.competitivenessLevel - 3) * 8;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private identifyStrengths(
    traits: PersonalityTraits,
    data: QuizData,
  ): string[] {
    const strengths: string[] = [];

    if (traits.motivation >= 70)
      strengths.push("Highly self-motivated and driven");
    if (traits.consistency >= 70)
      strengths.push("Excellent at maintaining long-term consistency");
    if (traits.riskTolerance >= 70)
      strengths.push("Comfortable with calculated risks");
    if (traits.techComfort >= 70) strengths.push("Strong technical aptitude");
    if (traits.feedbackResilience >= 70)
      strengths.push("Resilient to criticism and setbacks");
    if (traits.creativity >= 70)
      strengths.push("Creative problem-solving abilities");
    if (traits.communicationConfidence >= 70)
      strengths.push("Confident communicator");

    return strengths.length > 0
      ? strengths.slice(0, 3)
      : ["Balanced approach to business challenges"];
  }

  private identifyDevelopmentAreas(
    traits: PersonalityTraits,
    data: QuizData,
  ): string[] {
    const areas: string[] = [];

    if (traits.motivation <= 40)
      areas.push("Building consistent motivation habits");
    if (traits.consistency <= 40)
      areas.push("Developing better organizational systems");
    if (traits.riskTolerance <= 40)
      areas.push("Gradually increasing comfort with uncertainty");
    if (traits.techComfort <= 40)
      areas.push("Improving technical skills and tool familiarity");
    if (traits.feedbackResilience <= 40)
      areas.push("Building resilience to feedback and criticism");
    if (traits.socialComfort <= 40)
      areas.push("Developing networking and social skills");

    return areas.length > 0
      ? areas.slice(0, 2)
      : ["Continuing to build entrepreneurial skills"];
  }

  private determineWorkStyle(
    traits: PersonalityTraits,
    data: QuizData,
  ): string {
    let style = "You work best with ";

    if (traits.structurePreference >= 60) {
      style += "clear systems and organized processes";
    } else {
      style += "flexible schedules and creative freedom";
    }

    if (traits.socialComfort >= 60) {
      style += ", thriving in collaborative environments";
    } else {
      style += ", preferring independent work";
    }

    if (traits.consistency >= 60) {
      style += ". You excel at maintaining steady progress over time";
    } else {
      style += ". You work well in bursts of focused activity";
    }

    return style;
  }

  private assessEntrepreneurialFit(
    traits: PersonalityTraits,
    data: QuizData,
  ): string {
    const avgScore =
      Object.values(traits).reduce((sum, val) => sum + val, 0) /
      Object.keys(traits).length;

    if (avgScore >= 70) {
      return "Strong entrepreneurial potential with well-developed business traits";
    } else if (avgScore >= 50) {
      return "Good entrepreneurial foundation with room for targeted skill development";
    } else {
      return "Emerging entrepreneurial traits that can be developed through focused practice";
    }
  }

  private generateRecommendations(
    traits: PersonalityTraits,
    data: QuizData,
  ): string[] {
    const recommendations: string[] = [];

    if (traits.motivation >= 70) {
      recommendations.push(
        "Leverage your high motivation by setting ambitious but achievable goals",
      );
    } else {
      recommendations.push(
        "Build motivation through small wins and consistent progress tracking",
      );
    }

    if (traits.riskTolerance <= 40) {
      recommendations.push(
        "Start with lower-risk business models to build confidence",
      );
    } else {
      recommendations.push(
        "Your risk tolerance allows for more innovative business approaches",
      );
    }

    if (traits.techComfort <= 40) {
      recommendations.push(
        "Focus on user-friendly tools and gradually build technical skills",
      );
    } else {
      recommendations.push(
        "Utilize your technical skills as a competitive advantage",
      );
    }

    return recommendations.length > 0
      ? recommendations.slice(0, 3)
      : ["Focus on systematic skill development"];
  }
}

export const personalityAnalysisService =
  PersonalityAnalysisService.getInstance();
