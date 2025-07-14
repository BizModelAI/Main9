import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface ResourceLink {
  name: string;
  url: string;
  description: string;
  type: "free" | "paid";
}

export interface BusinessResources {
  freeResources: ResourceLink[];
  learningResources: ResourceLink[];
  tools: ResourceLink[];
  templates: ResourceLink[];
}

export async function generateBusinessResources(
  businessModel: string,
): Promise<BusinessResources> {
  // Use only verified fallback resources to ensure all links work
  // OpenAI generation disabled to prevent broken links
  console.log(`Generating verified resources for: ${businessModel}`);
  return getFallbackResources(businessModel);
}

function getFallbackResources(businessModel: string): BusinessResources {
  // Base resources that work for all business models
  const baseResources = {
    freeResources: [
      {
        name: "SBA Business Plan Guide",
        url: "https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan",
        description:
          "Comprehensive business plan guide from the Small Business Administration",
        type: "free" as const,
      },
      {
        name: "SCORE Business Mentoring",
        url: "https://www.score.org/",
        description:
          "Free business mentoring and resources from experienced entrepreneurs",
        type: "free" as const,
      },
      {
        name: "Google Analytics",
        url: "https://analytics.google.com/",
        description: "Free web analytics to track your business performance",
        type: "free" as const,
      },
      {
        name: "Lean Canvas Template",
        url: "https://leanstack.com/lean-canvas",
        description: "One-page business model canvas template",
        type: "free" as const,
      },
    ],
    learningResources: [
      {
        name: "Google Digital Marketing Courses",
        url: "https://skillshop.withgoogle.com/",
        description:
          "Free courses on Google Ads, Analytics, and digital marketing",
        type: "free" as const,
      },
      {
        name: "Coursera Business Fundamentals",
        url: "https://www.coursera.org/browse/business",
        description: "University-level business courses from top institutions",
        type: "paid" as const,
      },
      {
        name: "Khan Academy Entrepreneurship",
        url: "https://www.khanacademy.org/economics-finance-domain/entrepreneurship2",
        description: "Free entrepreneurship and business fundamentals",
        type: "free" as const,
      },
      {
        name: "edX Business Courses",
        url: "https://www.edx.org/learn/business",
        description:
          "Business courses from Harvard, MIT, and other top universities",
        type: "free" as const,
      },
    ],
    tools: [
      {
        name: "Canva",
        url: "https://www.canva.com/",
        description:
          "Design tool for creating marketing materials and graphics",
        type: "free" as const,
      },
      {
        name: "Google Workspace",
        url: "https://workspace.google.com/",
        description:
          "Business productivity suite with email, docs, and collaboration tools",
        type: "paid" as const,
      },
      {
        name: "Mailchimp",
        url: "https://mailchimp.com/",
        description: "Email marketing platform with automation features",
        type: "free" as const,
      },
      {
        name: "Trello",
        url: "https://trello.com/",
        description:
          "Project management tool for organizing tasks and workflows",
        type: "free" as const,
      },
    ],
    templates: [
      {
        name: "Invoice Simple",
        url: "https://invoicesimple.com/",
        description: "Free invoice templates and generator",
        type: "free" as const,
      },
      {
        name: "Microsoft Business Templates",
        url: "https://templates.office.com/en-us/business",
        description: "Free business templates from Microsoft Office",
        type: "free" as const,
      },
      {
        name: "HubSpot Marketing Templates",
        url: "https://www.hubspot.com/marketing-templates",
        description: "Free marketing templates and resources",
        type: "free" as const,
      },
    ],
  };

  // Add business model specific resources
  const specificResources = getBusinessModelSpecificResources(businessModel);

  return {
    freeResources: [
      ...baseResources.freeResources,
      ...specificResources.freeResources,
    ],
    learningResources: [
      ...baseResources.learningResources,
      ...specificResources.learningResources,
    ],
    tools: [...baseResources.tools, ...specificResources.tools],
    templates: [...baseResources.templates, ...specificResources.templates],
  };
}

function getBusinessModelSpecificResources(
  businessModel: string,
): BusinessResources {
  const modelLower = businessModel.toLowerCase();

  if (modelLower.includes("affiliate") || modelLower.includes("marketing")) {
    return {
      freeResources: [
        {
          name: "Amazon Associates",
          url: "https://affiliate-program.amazon.com/",
          description: "Amazon's affiliate program for promoting products",
          type: "free" as const,
        },
        {
          name: "ShareASale",
          url: "https://www.shareasale.com/",
          description: "Affiliate network with thousands of merchants",
          type: "free" as const,
        },
      ],
      learningResources: [
        {
          name: "Authority Hacker",
          url: "https://www.authorityhacker.com/",
          description: "Free and paid affiliate marketing training",
          type: "free" as const,
        },
      ],
      tools: [
        {
          name: "ThirstyAffiliates",
          url: "https://thirstyaffiliates.com/",
          description: "WordPress plugin for managing affiliate links",
          type: "paid" as const,
        },
      ],
      templates: [
        {
          name: "Affiliate Disclosure Generator",
          url: "https://www.privacypolicygenerator.info/affiliate-disclosure-generator/",
          description: "Generate required affiliate disclosures",
          type: "free" as const,
        },
      ],
    };
  }

  if (modelLower.includes("ecommerce") || modelLower.includes("dropshipping")) {
    return {
      freeResources: [
        {
          name: "Shopify Business Encyclopedia",
          url: "https://www.shopify.com/encyclopedia",
          description:
            "Complete guide to ecommerce business terms and concepts",
          type: "free" as const,
        },
      ],
      learningResources: [
        {
          name: "Shopify Academy",
          url: "https://www.shopify.com/academy",
          description: "Free ecommerce courses and tutorials",
          type: "free" as const,
        },
      ],
      tools: [
        {
          name: "Shopify",
          url: "https://www.shopify.com/",
          description: "Complete ecommerce platform for online stores",
          type: "paid" as const,
        },
      ],
      templates: [
        {
          name: "Shopify Themes",
          url: "https://themes.shopify.com/",
          description: "Professional ecommerce website themes",
          type: "free" as const,
        },
      ],
    };
  }

  if (
    modelLower.includes("content") ||
    modelLower.includes("creator") ||
    modelLower.includes("youtube")
  ) {
    return {
      freeResources: [
        {
          name: "YouTube Creator Academy",
          url: "https://creatoracademy.youtube.com/",
          description: "Free courses on growing a YouTube channel",
          type: "free" as const,
        },
      ],
      learningResources: [
        {
          name: "Creator Economy Report",
          url: "https://creatoreconomy.report/",
          description: "Industry insights and trends for content creators",
          type: "free" as const,
        },
      ],
      tools: [
        {
          name: "TubeBuddy",
          url: "https://www.tubebuddy.com/",
          description: "YouTube channel optimization and analytics tool",
          type: "free" as const,
        },
      ],
      templates: [
        {
          name: "Content Calendar Templates",
          url: "https://buffer.com/library/content-calendar-templates",
          description: "Free content planning templates",
          type: "free" as const,
        },
      ],
    };
  }

  if (modelLower.includes("consulting") || modelLower.includes("coaching")) {
    return {
      freeResources: [
        {
          name: "Consulting Success",
          url: "https://www.consultingsuccess.com/",
          description: "Free resources for starting a consulting business",
          type: "free" as const,
        },
      ],
      learningResources: [
        {
          name: "International Coach Federation",
          url: "https://coachfederation.org/",
          description: "Professional coaching certification and resources",
          type: "paid" as const,
        },
      ],
      tools: [
        {
          name: "Calendly",
          url: "https://calendly.com/",
          description: "Meeting scheduling tool for consultants",
          type: "free" as const,
        },
      ],
      templates: [
        {
          name: "Consulting Proposal Templates",
          url: "https://www.proposify.com/proposal-templates/consulting",
          description: "Professional consulting proposal templates",
          type: "free" as const,
        },
      ],
    };
  }

  if (modelLower.includes("freelance") || modelLower.includes("service")) {
    return {
      freeResources: [
        {
          name: "Upwork",
          url: "https://www.upwork.com/",
          description: "Global freelancing platform",
          type: "free" as const,
        },
        {
          name: "Fiverr",
          url: "https://www.fiverr.com/",
          description: "Marketplace for freelance services",
          type: "free" as const,
        },
      ],
      learningResources: [
        {
          name: "Freelancers Union",
          url: "https://www.freelancersunion.org/",
          description: "Resources and advocacy for freelancers",
          type: "free" as const,
        },
      ],
      tools: [
        {
          name: "FreshBooks",
          url: "https://www.freshbooks.com/",
          description: "Accounting and invoicing software for freelancers",
          type: "paid" as const,
        },
      ],
      templates: [
        {
          name: "Freelance Contract Templates",
          url: "https://www.freelancersunion.org/contracts",
          description: "Legal contract templates for freelancers",
          type: "free" as const,
        },
      ],
    };
  }

  // Default empty resources for unrecognized business models
  return {
    freeResources: [],
    learningResources: [],
    tools: [],
    templates: [],
  };
}
