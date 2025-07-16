// Hardcoded content to replace AI-generated action plans and motivational messages

export const MOTIVATIONAL_MESSAGE =
  "Starting a business is hard, but it's one of the best ways to take control of your future. Every successful entrepreneur began with an idea and the courage to try. Stay focused, learn fast, and keep going—progress comes from consistent action. You don't need to be perfect. You just need to start.";

// Action plans based on business models - no AI needed
export const getActionPlanForModel = (modelName: string) => {
  const baseActionPlan = {
    week1: [
      "Research your target market and competitors",
      "Set up basic business structure and accounts",
      "Create a simple business plan outline",
      "Identify your initial service offerings",
    ],
    month1: [
      "Launch your minimum viable product/service",
      "Establish your online presence (website, social media)",
      "Network with potential customers and partners",
      "Set up basic systems for operations and tracking",
    ],
    month3: [
      "Refine your offerings based on customer feedback",
      "Develop consistent marketing and sales processes",
      "Build a small customer base and gather testimonials",
      "Optimize your pricing and service delivery",
    ],
    month6: [
      "Scale successful strategies and eliminate what doesn't work",
      "Consider hiring help or automating processes",
      "Explore additional revenue streams",
      "Plan for sustainable growth and expansion",
    ],
  };

  // Model-specific customizations
  const modelSpecificPlans: { [key: string]: typeof baseActionPlan } = {
    "AI Marketing Agency": {
      week1: [
        "Learn AI marketing tools (ChatGPT, Jasper, Copy.ai)",
        "Research local businesses needing marketing help",
        "Create sample AI-generated content portfolios",
        "Set up basic business structure and pricing",
      ],
      month1: [
        "Launch with 2-3 pilot clients at discounted rates",
        "Master AI tools for content, ads, and strategy",
        "Build case studies from early client results",
        "Establish social media presence showcasing AI capabilities",
      ],
      month3: [
        "Scale to 10+ regular clients with proven results",
        "Develop signature AI-powered service packages",
        "Build referral network and client testimonials",
        "Streamline workflows with AI automation",
      ],
      month6: [
        "Consider hiring junior marketers or VAs",
        "Develop premium AI strategy consulting services",
        "Create courses or content around AI marketing",
        "Explore partnerships with other agencies or tools",
      ],
    },
    "Social Media Marketing Agency": {
      week1: [
        "Master major social platforms and scheduling tools",
        "Research target industries and their social needs",
        "Create content templates and style guides",
        "Set up business accounts and portfolio examples",
      ],
      month1: [
        "Sign 3-5 clients with content creation packages",
        "Develop efficient content creation workflows",
        "Build library of high-performing content formats",
        "Establish consistent posting and engagement routines",
      ],
      month3: [
        "Expand to 15+ clients with proven growth results",
        "Add paid advertising management services",
        "Create case studies showing follower/engagement growth",
        "Build team of content creators or freelancers",
      ],
      month6: [
        "Develop full-service social media management",
        "Add video content and emerging platform services",
        "Create scalable processes and team structure",
        "Consider white-label partnerships or courses",
      ],
    },
    "YouTube Automation Channels": {
      week1: [
        "Research profitable niches and competitor analysis",
        "Learn video editing and thumbnail creation tools",
        "Set up YouTube channels with proper branding",
        "Create content calendar and production workflow",
      ],
      month1: [
        "Launch 1-2 channels with consistent upload schedule",
        "Master YouTube SEO and algorithm optimization",
        "Build team of writers, editors, and thumbnail designers",
        "Develop efficient content production systems",
      ],
      month3: [
        "Scale to 5+ channels across different niches",
        "Optimize monetization through ads and affiliates",
        "Build subscriber base and engagement metrics",
        "Automate production and publishing processes",
      ],
      month6: [
        "Expand successful channels and pause underperforming ones",
        "Develop additional revenue streams (courses, products)",
        "Build larger content creation team",
        "Explore other platforms and content formats",
      ],
    },
    "E-commerce Brand Building": {
      week1: [
        "Research profitable product niches and suppliers",
        "Set up e-commerce platform and basic store design",
        "Create initial product listings and descriptions",
        "Plan marketing and customer acquisition strategy",
      ],
      month1: [
        "Launch store with 10-20 core products",
        "Set up advertising on Google, Facebook, and Instagram",
        "Establish customer service and fulfillment processes",
        "Begin building email list and social following",
      ],
      month3: [
        "Optimize top-selling products and eliminate poor performers",
        "Develop customer retention and referral programs",
        "Expand product line based on customer feedback",
        "Build brand recognition through consistent marketing",
      ],
      month6: [
        "Scale advertising and explore new marketing channels",
        "Consider private labeling or exclusive products",
        "Develop partnerships with influencers or other brands",
        "Plan international expansion or new product categories",
      ],
    },
  };

  return modelSpecificPlans[modelName] || baseActionPlan;
};
