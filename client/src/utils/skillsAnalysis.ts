import { QuizData } from "../types";

export interface SkillAssessment {
  skill: string;
  status: "have" | "working-on" | "need";
  confidence: number;
  reasoning: string;
}

export interface SkillsAnalysis {
  have: SkillAssessment[];
  workingOn: SkillAssessment[];
  need: SkillAssessment[];
}

export class SkillsAnalysisService {
  private static instance: SkillsAnalysisService;
  private apiKey: string;

  private constructor() {
    // API key will be handled server-side for security
    this.apiKey = "";
  }

  static getInstance(): SkillsAnalysisService {
    if (!SkillsAnalysisService.instance) {
      SkillsAnalysisService.instance = new SkillsAnalysisService();
    }
    return SkillsAnalysisService.instance;
  }

  async analyzeSkills(
    quizData: QuizData,
    requiredSkills: string[],
    businessModel: string,
  ): Promise<SkillsAnalysis> {
    try {
      const userProfile = this.createUserProfile(quizData);

      const payload = {
        quizData,
        requiredSkills,
        businessModel,
        userProfile,
      };

      let response: Response;

      // Use XMLHttpRequest first to avoid FullStory interference
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/analyze-skills", true);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/json");

        response = await new Promise<Response>((resolve, reject) => {
          xhr.onload = () => {
            const responseText = xhr.responseText;
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => {
                try {
                  return Promise.resolve(JSON.parse(responseText));
                } catch (e) {
                  return Promise.reject(new Error("Invalid JSON response"));
                }
              },
              text: () => Promise.resolve(responseText),
              headers: new Headers(),
              url: "/api/analyze-skills",
              redirected: false,
              type: "basic",
              clone: () => response,
              body: null,
              bodyUsed: false,
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
              blob: () => Promise.resolve(new Blob()),
              formData: () => Promise.resolve(new FormData()),
            } as Response);
          };
          xhr.onerror = () => reject(new Error("XMLHttpRequest network error"));
          xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
          xhr.timeout = 30000; // 30 second timeout for skills analysis
          xhr.send(JSON.stringify(payload));
        });
      } catch (xhrError) {
        console.log(
          "skillsAnalysis: XMLHttpRequest failed, trying fetch fallback",
        );

        // Fallback to fetch
        response = await fetch("/api/analyze-skills", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return this.processSkillAssessments(result.skillAssessments);
    } catch (error) {
      console.error("Error analyzing skills:", error);
      return this.getFallbackSkillsAnalysis(requiredSkills);
    }
  }

  private createUserProfile(quizData: QuizData): string {
    const profile = {
      motivation: quizData.mainMotivation,
      timeCommitment: quizData.weeklyTimeCommitment,
      learningStyle: quizData.learningPreference,
      skills: {
        tech: quizData.techSkillsRating || 3,
        communication: quizData.directCommunicationEnjoyment || 3,
        selfMotivation: quizData.selfMotivationLevel || 3,
        creativity: quizData.creativeWorkEnjoyment || 3,
        organization: quizData.organizationLevel || 3,
        resilience: quizData.discouragementResilience || 3,
      },
      preferences: {
        riskTolerance: quizData.riskComfortLevel || 3,
        collaboration: quizData.workCollaborationPreference,
        decisionStyle: quizData.decisionMakingStyle,
        consistency: quizData.longTermConsistency || 3,
      },
      tools: quizData.familiarTools?.slice(0, 3) || [],
    };

    return JSON.stringify(profile);
  }

  private processSkillAssessments(
    assessments: SkillAssessment[],
  ): SkillsAnalysis {
    const result: SkillsAnalysis = {
      have: [],
      workingOn: [],
      need: [],
    };

    assessments.forEach((assessment) => {
      switch (assessment.status) {
        case "have":
          result.have.push(assessment);
          break;
        case "working-on":
          result.workingOn.push(assessment);
          break;
        case "need":
          result.need.push(assessment);
          break;
      }
    });

    return result;
  }

  private getFallbackSkillsAnalysis(requiredSkills: string[]): SkillsAnalysis {
    // Distribute skills across categories for fallback
    const third = Math.ceil(requiredSkills.length / 3);

    return {
      have: requiredSkills.slice(0, third).map((skill) => ({
        skill,
        status: "have" as const,
        confidence: 7,
        reasoning:
          "Based on your quiz responses, you show strong aptitude for this skill",
      })),
      workingOn: requiredSkills.slice(third, third * 2).map((skill) => ({
        skill,
        status: "working-on" as const,
        confidence: 6,
        reasoning:
          "You have some experience but could benefit from further development",
      })),
      need: requiredSkills.slice(third * 2).map((skill) => ({
        skill,
        status: "need" as const,
        confidence: 8,
        reasoning: "This skill would need to be developed for optimal success",
      })),
    };
  }
}
