import { QuizStep } from "../types";

export const quizSteps: QuizStep[] = [
  // Round 1: Motivation & Vision
  {
    id: "main-motivation",
    title: "What is your main motivation for starting a business?",
    subtitle: "What's driving you to build something?",
    icon: "Heart",
    field: "mainMotivation",
    type: "select",
    options: [
      {
        value: "financial-freedom",
        label: "Financial freedom",
        description: "Build wealth and achieve financial independence",
      },
      {
        value: "flexibility-autonomy",
        label: "Flexibility and autonomy",
        description: "Control your time and work on your terms",
      },
      {
        value: "purpose-impact",
        label: "Purpose and impact",
        description: "Make a meaningful difference in the world",
      },
      {
        value: "creativity-passion",
        label: "Creativity and passion",
        description: "Express yourself and pursue your interests",
      },
    ],
  },
  {
    id: "first-income-timeline",
    title: "How soon do you want to earn your first $100?",
    subtitle: "When do you want to see your first dollars?",
    icon: "Clock",
    field: "firstIncomeTimeline",
    type: "select",
    options: [
      {
        value: "under-1-month",
        label: "Under 1 month",
        description: "I need money very soon",
      },
      {
        value: "1-3-months",
        label: "1–3 months",
        description: "Reasonable short-term timeline",
      },
      {
        value: "3-6-months",
        label: "3–6 months",
        description: "Building for sustainable income",
      },
      {
        value: "no-rush",
        label: "No rush",
        description: "Long-term wealth building focus",
      },
    ],
  },
  {
    id: "success-income-goal",
    title:
      "What monthly income would make you feel successful 12 months from now?",
    subtitle: "Be realistic about what success looks like to you",
    icon: "DollarSign",
    field: "successIncomeGoal",
    type: "select",
    options: [
      {
        value: 500,
        label: "Less than $500",
        description: "Side income to supplement",
      },
      {
        value: 1250,
        label: "$500–$2,000",
        description: "Meaningful extra income",
      },
      {
        value: 3500,
        label: "$2,000–$5,000",
        description: "Significant monthly income",
      },
      {
        value: 7500,
        label: "$5,000+",
        description: "Life-changing income level",
      },
    ],
  },
  {
    id: "upfront-investment",
    title: "How much money are you willing to invest upfront?",
    subtitle: "What can you realistically invest to get started?",
    icon: "Wallet",
    field: "upfrontInvestment",
    type: "select",
    options: [
      {
        value: 0,
        label: "$0",
        description: "Bootstrap with sweat equity only",
      },
      {
        value: 125,
        label: "Under $250",
        description: "Minimal financial investment",
      },
      {
        value: 625,
        label: "$250–$1,000",
        description: "Moderate startup investment",
      },
      {
        value: 1500,
        label: "$1,000+",
        description: "Serious financial commitment",
      },
    ],
  },
  {
    id: "passion-identity-alignment",
    title:
      "How important is it that your business reflects your personal identity or passion?",
    subtitle: "Connection between business and personal values",
    icon: "Heart",
    field: "passionIdentityAlignment",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Not important",
        description: "I don't need my business to reflect who I am.",
      },
      {
        value: 2,
        label: "Slightly important",
        description:
          "I'd like some connection between my business and identity, but it's not a priority.",
      },
      {
        value: 3,
        label: "Moderately important",
        description:
          "I prefer a business that aligns with my identity but it's not essential.",
      },
      {
        value: 4,
        label: "Very important",
        description: "My business should express my values and identity.",
      },
      {
        value: 5,
        label: "Extremely important",
        description: "I want my brand to strongly reflect who I am",
      },
    ],
  },
  {
    id: "business-exit-plan",
    title: "Do you want to eventually sell or exit your business?",
    subtitle: "Your long-term vision for the business",
    icon: "TrendingUp",
    field: "businessExitPlan",
    type: "select",
    options: [
      {
        value: "yes",
        label: "Yes",
        description: "Build to sell for a big payday",
      },
      {
        value: "no",
        label: "No",
        description: "Keep it as a long-term income source",
      },
      {
        value: "not-sure",
        label: "Not sure",
        description: "Haven't thought that far ahead",
      },
    ],
  },
  {
    id: "business-growth-size",
    title: "How large do you want your business to grow?",
    subtitle: "Your vision for scale and impact",
    icon: "Award",
    field: "businessGrowthSize",
    type: "select",
    options: [
      {
        value: "side-income",
        label: "Just a side income",
        description: "Extra money alongside other work",
      },
      {
        value: "full-time-income",
        label: "Full-time income",
        description: "Replace your day job income",
      },
      {
        value: "multi-6-figure",
        label: "Multi-6-figure brand",
        description: "Build a substantial business",
      },
      {
        value: "recognized-company",
        label: "A widely recognized company",
        description: "Create a major market presence",
      },
    ],
  },
  {
    id: "passive-income-importance",
    title: "How important is long-term passive income to you?",
    subtitle: "Income that continues without active daily work",
    icon: "Zap",
    field: "passiveIncomeImportance",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Not important",
        description: "I don't care about passive income at all.",
      },
      {
        value: 2,
        label: "Somewhat helpful",
        description: "It would be nice, but I'm okay without it.",
      },
      {
        value: 3,
        label: "Neutral",
        description: "I'm on the fence—it depends on the situation.",
      },
      {
        value: 4,
        label: "Very helpful",
        description: "I really want some form of recurring income.",
      },
      {
        value: 5,
        label: "Critical goal",
        description: "My top priority is building passive income streams.",
      },
    ],
  },

  // Round 2: Time, Effort & Learning Style
  {
    id: "weekly-time-commitment",
    title:
      "How many hours per week can you realistically dedicate to your business?",
    subtitle: "Be honest about your available time",
    icon: "Calendar",
    field: "weeklyTimeCommitment",
    type: "select",
    options: [
      {
        value: 3,
        label: "Less than 5 hours",
        description: "Very limited time availability",
      },
      { value: 7, label: "5–10 hours", description: "Evenings and weekends" },
      { value: 17, label: "10–25 hours", description: "Part-time commitment" },
      {
        value: 35,
        label: "25+ hours",
        description: "Nearly full-time dedication",
      },
    ],
  },
  {
    id: "long-term-consistency",
    title: "How consistent are you with long-term goals?",
    subtitle: "Your track record with following through",
    icon: "Target",
    field: "longTermConsistency",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Give up easily",
        description: "I give up pretty easily if things get too hard.",
      },
      {
        value: 2,
        label: "Sometimes quit",
        description:
          "I'll push through some difficulty, but if challenges persist, I'm likely to give up.",
      },
      {
        value: 3,
        label: "Usually finish",
        description: "I generally finish what I start, with some slip-ups.",
      },
      {
        value: 4,
        label: "Very consistent",
        description: "I stick with long-term goals even through obstacles.",
      },
      {
        value: 5,
        label: "Always complete",
        description: "I always follow through no matter what.",
      },
    ],
  },
  {
    id: "trial-error-comfort",
    title: "How do you feel about trial and error?",
    subtitle: "Your comfort with figuring things out as you go",
    icon: "Lightbulb",
    field: "trialErrorComfort",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Avoid it",
        description:
          "I like clear directions—I get stressed if I have to figure things out alone.",
      },
      {
        value: 2,
        label: "Hesitant",
        description: "I'll try, but I prefer structure and guidance.",
      },
      {
        value: 3,
        label: "Tolerate it",
        description: "I'm okay with trying things out if needed.",
      },
      {
        value: 4,
        label: "Open to it",
        description: "I'm comfortable testing and tweaking as I go.",
      },
      {
        value: 5,
        label: "Embrace it",
        description: "I love figuring things out by experimenting.",
      },
    ],
  },
  {
    id: "learning-preference",
    title: "How do you prefer to learn new things?",
    subtitle: "Your natural learning style",
    icon: "BookOpen",
    field: "learningPreference",
    type: "select",
    options: [
      {
        value: "hands-on",
        label: "Hands-on",
        description: "Jump in and learn by doing",
      },
      {
        value: "watching-tutorials",
        label: "Watching tutorials",
        description: "Video-based learning",
      },
      {
        value: "reading-self-study",
        label: "Reading/self-study",
        description: "Books, articles, and written content",
      },
      {
        value: "one-on-one-coaching",
        label: "One-on-one coaching",
        description: "Personal guidance and mentorship",
      },
    ],
  },
  {
    id: "systems-routines-enjoyment",
    title: "How much do you enjoy building routines or systems?",
    subtitle: "Your relationship with structure and organization",
    icon: "Briefcase",
    field: "systemsRoutinesEnjoyment",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Hate it",
        description: "I prefer to just go with the flow and avoid structure.",
      },
      {
        value: 2,
        label: "Tolerate it",
        description:
          "I'll build routines if I have to, but it's not my strength.",
      },
      {
        value: 3,
        label: "Neutral",
        description: "I can go either way depending on the situation.",
      },
      {
        value: 4,
        label: "Like it",
        description: "I enjoy setting up systems that make life easier.",
      },
      {
        value: 5,
        label: "Thrive on it",
        description: "I'm obsessed with structure, planning, and routines.",
      },
    ],
  },
  {
    id: "discouragement-resilience",
    title: "How discouraged do you get if something doesn't work right away?",
    subtitle: "Your resilience when facing setbacks",
    icon: "Shield",
    field: "discouragementResilience",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Very easily",
        description: "If I don't see results fast, I lose motivation quickly.",
      },
      {
        value: 2,
        label: "Easily",
        description: "A few setbacks are enough to throw me off.",
      },
      {
        value: 3,
        label: "Sometimes",
        description: "I struggle sometimes but try to keep going.",
      },
      {
        value: 4,
        label: "Rarely",
        description: "I keep pushing even when things are hard.",
      },
      {
        value: 5,
        label: "Never",
        description: "I never quit—obstacles just fuel me.",
      },
    ],
  },
  {
    id: "tool-learning-willingness",
    title: "Are you willing to learn new tools or software platforms?",
    subtitle: "Your openness to technology and new systems",
    icon: "Monitor",
    field: "toolLearningWillingness",
    type: "select",
    options: [
      {
        value: "yes",
        label: "Yes",
        description: "I'm open to learning new tools",
      },
      {
        value: "no",
        label: "No",
        description: "I prefer to stick with what I know",
      },
    ],
  },
  {
    id: "organization-level",
    title: "How organized are you?",
    subtitle: "Your natural organizational tendencies",
    icon: "Package",
    field: "organizationLevel",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Chaotic",
        description: "My workspace and planning are usually a mess.",
      },
      {
        value: 2,
        label: "Disorganized",
        description: "I struggle to keep track of tasks or deadlines.",
      },
      {
        value: 3,
        label: "Somewhat organized",
        description: "I try to stay on top of things but could improve.",
      },
      {
        value: 4,
        label: "Very organized",
        description: "I have systems and stay on top of everything.",
      },
      {
        value: 5,
        label: "Meticulous",
        description: "I thrive in structure, lists, and detailed planning.",
      },
    ],
  },
  {
    id: "self-motivation-level",
    title: "How self-motivated are you without external pressure?",
    subtitle: "Your ability to drive yourself forward",
    icon: "Zap",
    field: "selfMotivationLevel",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Not at all",
        description: "I need deadlines or someone else to push me.",
      },
      {
        value: 2,
        label: "Slightly",
        description:
          "I'll work if I have structure, but I tend to procrastinate.",
      },
      {
        value: 3,
        label: "Moderately",
        description: "I can stay focused if I remind myself often.",
      },
      {
        value: 4,
        label: "Very",
        description: "I work hard without needing much direction.",
      },
      {
        value: 5,
        label: "Extremely",
        description: "I'm naturally driven—no external motivation needed.",
      },
    ],
  },
  {
    id: "uncertainty-handling",
    title: "How well do you handle uncertainty and unclear steps?",
    subtitle: "Your comfort with ambiguous situations",
    icon: "Compass",
    field: "uncertaintyHandling",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "I freeze",
        description: "I get overwhelmed without clear instructions.",
      },
      {
        value: 2,
        label: "Struggle",
        description: "Ambiguity makes me anxious and hesitant.",
      },
      {
        value: 3,
        label: "Tolerate it",
        description: "I can deal with it, but I prefer clarity.",
      },
      {
        value: 4,
        label: "Comfortable",
        description: "I'm fine figuring things out as I go.",
      },
      {
        value: 5,
        label: "Thrive",
        description: "I thrive in uncertain, evolving situations.",
      },
    ],
  },
  {
    id: "repetitive-tasks-feeling",
    title: "How do you feel about repetitive tasks?",
    subtitle: "Your tolerance for routine work",
    icon: "Clock",
    field: "repetitiveTasksFeeling",
    type: "select",
    options: [
      {
        value: "avoid",
        label: "I avoid them",
        description: "Repetitive work drains my energy",
      },
      {
        value: "tolerate",
        label: "I tolerate them",
        description: "I can do them but don't enjoy it",
      },
      {
        value: "dont-mind",
        label: "I don't mind them",
        description: "They're fine as part of the job",
      },
      {
        value: "enjoy",
        label: "I enjoy them",
        description: "I find routine work satisfying",
      },
    ],
  },
  {
    id: "work-collaboration-preference",
    title: "Do you prefer working solo or collaborating?",
    subtitle: "Your ideal work environment",
    icon: "Users",
    field: "workCollaborationPreference",
    type: "select",
    options: [
      {
        value: "solo-only",
        label: "Solo only",
        description: "I work best completely alone",
      },
      {
        value: "mostly-solo",
        label: "Mostly solo",
        description: "Independent with minimal collaboration",
      },
      {
        value: "team-oriented",
        label: "Team-oriented",
        description: "I enjoy working with others",
      },
      {
        value: "like-both",
        label: "I like both",
        description: "Flexible depending on the situation",
      },
    ],
  },

  // Round 3: Personality & Preferences
  {
    id: "brand-face-comfort",
    title: "How comfortable are you being the face of a brand?",
    subtitle: "Think public content, visibility, and attention",
    icon: "Star",
    field: "brandFaceComfort",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Extremely uncomfortable",
        description: "I never want my face online or public at all.",
      },
      {
        value: 2,
        label: "Uncomfortable",
        description: "I'd prefer to stay behind the scenes.",
      },
      {
        value: 3,
        label: "Neutral",
        description: "I can do it if necessary but it's not my favorite.",
      },
      {
        value: 4,
        label: "Comfortable",
        description: "I'm happy to show up on camera or online.",
      },
      {
        value: 5,
        label: "Very comfortable",
        description: "I love being the face and voice of my brand.",
      },
    ],
  },
  {
    id: "competitiveness-level",
    title: "How competitive are you?",
    subtitle: "Your relationship with competition",
    icon: "Award",
    field: "competitivenessLevel",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Not at all",
        description: "I avoid competition and just do my own thing.",
      },
      {
        value: 2,
        label: "Slightly",
        description: "I don't like comparing myself to others.",
      },
      {
        value: 3,
        label: "Moderately",
        description: "I compete sometimes, but not aggressively.",
      },
      {
        value: 4,
        label: "Very",
        description: "Competition fuels me to do better.",
      },
      {
        value: 5,
        label: "Extremely",
        description: "I live for competition—it pushes me nonstop.",
      },
    ],
  },
  {
    id: "creative-work-enjoyment",
    title: "How much do you enjoy creative work (design, writing, ideation)?",
    subtitle: "Your affinity for creative activities",
    icon: "Lightbulb",
    field: "creativeWorkEnjoyment",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Not at all",
        description: "I don't enjoy creative activities at all.",
      },
      {
        value: 2,
        label: "Slightly",
        description: "I'll do it if I have to, but it's not fun for me.",
      },
      {
        value: 3,
        label: "Moderately",
        description: "I enjoy it in small doses.",
      },
      {
        value: 4,
        label: "Very much",
        description: "I love making creative decisions in my work.",
      },
      {
        value: 5,
        label: "I love it",
        description: "Creativity is at the core of who I am.",
      },
    ],
  },
  {
    id: "direct-communication-enjoyment",
    title: "How much do you enjoy direct communication with others?",
    subtitle: "Your comfort with interpersonal interaction",
    icon: "MessageCircle",
    field: "directCommunicationEnjoyment",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "I avoid it",
        description: "I try to avoid direct communication as much as possible.",
      },
      {
        value: 2,
        label: "I tolerate it",
        description: "I'll do it if I have to, but it drains me.",
      },
      {
        value: 3,
        label: "I'm neutral",
        description: "I don't mind communicating with others.",
      },
      {
        value: 4,
        label: "I enjoy it",
        description: "I like talking with and helping people.",
      },
      {
        value: 5,
        label: "I love it",
        description: "I get energized by communicating and supporting others.",
      },
    ],
  },
  {
    id: "work-structure-preference",
    title: "How much structure do you prefer in your work?",
    subtitle: "Your ideal level of organization and planning",
    icon: "Briefcase",
    field: "workStructurePreference",
    type: "select",
    options: [
      {
        value: "clear-steps",
        label: "Clear steps and order",
        description: "Detailed plans and procedures",
      },
      {
        value: "some-structure",
        label: "Some structure",
        description: "Basic framework with flexibility",
      },
      {
        value: "mostly-flexible",
        label: "Mostly flexible",
        description: "Loose guidelines, adapt as needed",
      },
      {
        value: "total-freedom",
        label: "Total freedom",
        description: "Complete autonomy and spontaneity",
      },
    ],
  },

  // Round 4: Tools & Work Environment
  {
    id: "tech-skills-rating",
    title: "How would you rate your tech skills overall?",
    subtitle: "Consider your comfort with software and tools",
    icon: "Monitor",
    field: "techSkillsRating",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Very low",
        description: "I struggle with most software or tech tools.",
      },
      {
        value: 2,
        label: "Basic",
        description: "I can use basics like email or documents.",
      },
      {
        value: 3,
        label: "Intermediate",
        description: "I'm decent with common platforms and tools.",
      },
      {
        value: 4,
        label: "Advanced",
        description: "I'm quick to learn and use advanced tools.",
      },
      {
        value: 5,
        label: "Expert",
        description: "I'm deeply tech-savvy and love complex tools.",
      },
    ],
  },
  {
    id: "workspace-availability",
    title: "Do you have a consistent, quiet workspace?",
    subtitle: "Your physical work environment",
    icon: "Package",
    field: "workspaceAvailability",
    type: "select",
    options: [
      {
        value: "yes",
        label: "Yes",
        description: "I have a dedicated, quiet space to work",
      },
      {
        value: "no",
        label: "No",
        description: "My workspace is shared or often interrupted",
      },
    ],
  },
  {
    id: "support-system-strength",
    title: "How strong is your personal support system?",
    subtitle: "People who can help and encourage you",
    icon: "Users",
    field: "supportSystemStrength",
    type: "select",
    options: [
      { value: "none", label: "None", description: "I'm mostly on my own" },
      {
        value: "one-two-people",
        label: "One or two people",
        description: "Limited but helpful support",
      },
      {
        value: "small-helpful-group",
        label: "A small but helpful group",
        description: "Good network of supporters",
      },
      {
        value: "very-strong",
        label: "Very strong support",
        description: "Excellent support network",
      },
    ],
  },
  {
    id: "internet-device-reliability",
    title: "How reliable is your access to internet and devices?",
    subtitle: "Your technical infrastructure",
    icon: "Zap",
    field: "internetDeviceReliability",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Unreliable",
        description: "My tech setup makes consistent work difficult.",
      },
      {
        value: 2,
        label: "Sometimes unstable",
        description:
          "I have internet and a device, but they're not dependable.",
      },
      {
        value: 3,
        label: "Usually stable",
        description: "I usually have good access, with minor issues.",
      },
      {
        value: 4,
        label: "Reliable",
        description: "My setup is solid for most tasks.",
      },
      {
        value: 5,
        label: "Very reliable",
        description: "I never worry about access—I'm fully equipped.",
      },
    ],
  },
  {
    id: "familiar-tools",
    title: "Which tools are you already familiar with?",
    subtitle: "Select all that apply to your current experience",
    icon: "Package",
    field: "familiarTools",
    type: "multiselect",
    options: [
      { value: "google-docs-sheets", label: "Google Docs/Sheets" },
      { value: "canva", label: "Canva" },
      { value: "notion", label: "Notion" },
      { value: "shopify-wix-squarespace", label: "Shopify/Wix/Squarespace" },
      { value: "zoom-streamyard", label: "Zoom/StreamYard" },
      { value: "figma", label: "Figma" },
      { value: "airtable", label: "Airtable" },
      { value: "wordpress", label: "WordPress" },
      { value: "chatgpt", label: "ChatGPT" },
      { value: "capcut", label: "CapCut" },
      { value: "meta-ads-manager", label: "Meta Ads Manager" },
      { value: "zapier", label: "Zapier" },
    ],
  },

  // Round 5: Strategy & Decision-Making
  {
    id: "decision-making-style",
    title: "How do you typically make decisions?",
    subtitle: "What's your natural approach to taking action?",
    icon: "Brain",
    field: "decisionMakingStyle",
    type: "select",
    options: [
      {
        value: "quickly-instinctively",
        label: "Quickly and instinctively",
        description: "Trust your gut and move fast",
      },
      {
        value: "after-some-research",
        label: "After some research",
        description: "Gather basic information first",
      },
      {
        value: "logical-process",
        label: "With a logical process",
        description: "Systematic analysis and comparison",
      },
      {
        value: "after-talking-others",
        label: "After talking to others",
        description: "Seek input and advice from people",
      },
    ],
  },
  {
    id: "risk-comfort-level",
    title: "How comfortable are you taking risks?",
    subtitle: "Your tolerance for uncertainty and potential loss",
    icon: "TrendingUp",
    field: "riskComfortLevel",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Avoid them",
        description: "I avoid risky situations and play it safe.",
      },
      {
        value: 2,
        label: "Slightly cautious",
        description: "I'll take small risks but prefer certainty.",
      },
      {
        value: 3,
        label: "Neutral",
        description: "It depends on the situation.",
      },
      {
        value: 4,
        label: "Comfortable",
        description: "I'm open to taking chances for growth.",
      },
      {
        value: 5,
        label: "Thrive on risk",
        description: "Risk excites me—it's part of the journey.",
      },
    ],
  },
  {
    id: "feedback-rejection-response",
    title: "How do you usually respond to negative feedback or rejection?",
    subtitle: "Your resilience and learning mindset",
    icon: "Shield",
    field: "feedbackRejectionResponse",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Take it personally",
        description: "It hits me hard and lingers.",
      },
      {
        value: 2,
        label: "Feel bad",
        description: "It stings and makes me question myself.",
      },
      {
        value: 3,
        label: "Process then move on",
        description: "I feel it, then move forward.",
      },
      { value: 4, label: "Learn from it", description: "I use it to improve." },
      {
        value: 5,
        label: "Use it as fuel",
        description: "I use it as motivation to go harder.",
      },
    ],
  },
  {
    id: "path-preference",
    title: "Do you prefer following proven paths or creating your own?",
    subtitle: "Your approach to innovation vs. proven methods",
    icon: "Compass",
    field: "pathPreference",
    type: "select",
    options: [
      {
        value: "proven-paths",
        label: "Proven paths",
        description: "Follow what others have done successfully",
      },
      {
        value: "mix",
        label: "A mix",
        description: "Combine proven methods with some innovation",
      },
      {
        value: "mostly-original",
        label: "Mostly original",
        description: "Prefer to find my own way",
      },
      {
        value: "build-something-new",
        label: "I want to build something new",
        description: "Create completely original approaches",
      },
    ],
  },
  {
    id: "control-importance",
    title:
      "How important is it for you to stay in full control of your business decisions?",
    subtitle: "Your need for autonomy and decision-making power",
    icon: "Award",
    field: "controlImportance",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Not important",
        description: "I'm fine with someone else calling the shots.",
      },
      {
        value: 2,
        label: "Somewhat",
        description: "I don't mind giving up some control.",
      },
      {
        value: 3,
        label: "Neutral",
        description: "I like input but can go either way.",
      },
      {
        value: 4,
        label: "Important",
        description: "I prefer to lead most decisions.",
      },
      {
        value: 5,
        label: "Extremely important",
        description: "I must be in full control of every business decision.",
      },
    ],
  },

  // Round 6: Business Model Fit Filters
  {
    id: "online-presence-comfort",
    title: "Are you comfortable having your face and voice online?",
    subtitle: "Would you appear in video, voice, or photos?",
    icon: "Star",
    field: "onlinePresenceComfort",
    type: "select",
    options: [
      {
        value: "yes",
        label: "Yes",
        description: "I'm comfortable being visible online",
      },
      {
        value: "no",
        label: "No",
        description: "I prefer to stay behind the scenes",
      },
    ],
  },
  {
    id: "client-calls-comfort",
    title: "Would you be okay talking to clients on Zoom or by phone?",
    subtitle: "Direct client communication comfort",
    icon: "MessageCircle",
    field: "clientCallsComfort",
    type: "select",
    options: [
      {
        value: "yes",
        label: "Yes",
        description: "I'm comfortable with video/phone calls",
      },
      {
        value: "no",
        label: "No",
        description: "I prefer written communication",
      },
    ],
  },
  {
    id: "physical-shipping-openness",
    title:
      "Would you be open to shipping physical products from your location?",
    subtitle: "Handling physical inventory and fulfillment",
    icon: "Package",
    field: "physicalShippingOpenness",
    type: "select",
    options: [
      {
        value: "yes",
        label: "Yes",
        description: "I'm okay with handling physical products",
      },
      {
        value: "no",
        label: "No",
        description: "I prefer digital-only business",
      },
    ],
  },
  {
    id: "work-style-preference",
    title: "Would you rather:",
    subtitle: "Your preferred work and income style",
    icon: "Briefcase",
    field: "workStylePreference",
    type: "select",
    options: [
      {
        value: "create-once-earn-passively",
        label: "Create once, earn passively",
        description: "Build something that generates ongoing income",
      },
      {
        value: "work-consistently-people",
        label: "Work consistently with people",
        description: "Active, relationship-based income",
      },
      {
        value: "mix-both",
        label: "Mix of both",
        description: "Combination of passive and active income",
      },
    ],
  },
  {
    id: "social-media-interest",
    title: "How interested are you in using social media to grow a business?",
    subtitle: "Your enthusiasm for social media marketing",
    icon: "Star",
    field: "socialMediaInterest",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Not at all",
        description: "I don't want to use social media for business at all.",
      },
      {
        value: 2,
        label: "Slightly",
        description: "I'd prefer to avoid it, but I might use it minimally.",
      },
      {
        value: 3,
        label: "Neutral",
        description: "I don't love or hate it—depends on the strategy.",
      },
      {
        value: 4,
        label: "Interested",
        description: "I think it's a useful tool I'm open to.",
      },
      {
        value: 5,
        label: "Extremely interested",
        description:
          "I'm eager to use social media to grow and build visibility.",
      },
    ],
  },
  {
    id: "ecosystem-participation",
    title:
      "Do you want to be part of an ecosystem (e.g., platforms, marketplaces, affiliate networks)?",
    subtitle: "Working within existing platforms vs. independent",
    icon: "Users",
    field: "ecosystemParticipation",
    type: "select",
    options: [
      {
        value: "yes",
        label: "Yes",
        description: "I like the support and structure of platforms",
      },
      {
        value: "no",
        label: "No",
        description: "I prefer complete independence",
      },
      {
        value: "maybe",
        label: "Maybe",
        description: "Depends on the specific opportunity",
      },
    ],
  },
  {
    id: "existing-audience",
    title: "Do you currently have any kind of audience or following?",
    subtitle: "Your current reach and influence",
    icon: "Users",
    field: "existingAudience",
    type: "select",
    options: [
      {
        value: "highly-engaged",
        label: "Yes, highly engaged",
        description: "Strong, active following",
      },
      {
        value: "small",
        label: "Yes, but small",
        description: "Some followers but limited reach",
      },
      { value: "no", label: "No", description: "Starting from zero" },
      {
        value: "just-starting",
        label: "Just starting",
        description: "Beginning to build an audience",
      },
    ],
  },
  {
    id: "promoting-others-openness",
    title: "Would you be open to promoting someone else's product/service?",
    subtitle: "Comfort with affiliate or partnership marketing",
    icon: "TrendingUp",
    field: "promotingOthersOpenness",
    type: "select",
    options: [
      {
        value: "yes",
        label: "Yes",
        description: "I'm comfortable promoting quality products",
      },
      {
        value: "no",
        label: "No",
        description: "I only want to promote my own work",
      },
    ],
  },
  {
    id: "teach-vs-solve-preference",
    title: "Would you prefer to teach others or solve problems for them?",
    subtitle: "Your natural helping style",
    icon: "BookOpen",
    field: "teachVsSolvePreference",
    type: "select",
    options: [
      {
        value: "teach",
        label: "Teach",
        description: "Help others learn and grow",
      },
      {
        value: "solve",
        label: "Solve",
        description: "Handle problems and deliver solutions",
      },
      {
        value: "both",
        label: "Both",
        description: "Enjoy teaching and problem-solving",
      },
      {
        value: "neither",
        label: "Neither",
        description: "Prefer other types of work",
      },
    ],
  },
  {
    id: "meaningful-contribution-importance",
    title:
      "How important is it to you that your business contributes to something meaningful?",
    subtitle: "The role of purpose and impact in your work",
    icon: "Heart",
    field: "meaningfulContributionImportance",
    type: "scale",
    min: 1,
    max: 5,
    options: [
      {
        value: 1,
        label: "Not important",
        description: "I just want to make money; meaning doesn't matter.",
      },
      {
        value: 2,
        label: "Slightly",
        description: "Meaning is a bonus, but not a must.",
      },
      {
        value: 3,
        label: "Neutral",
        description: "If it happens, great. If not, that's fine too.",
      },
      {
        value: 4,
        label: "Important",
        description: "I want to create something that helps others.",
      },
      {
        value: 5,
        label: "Extremely important",
        description:
          "My work must contribute to something greater than myself.",
      },
    ],
  },
];

// Remove all adaptive quiz steps - they are no longer used
export const adaptiveQuizSteps: QuizStep[] = [];
