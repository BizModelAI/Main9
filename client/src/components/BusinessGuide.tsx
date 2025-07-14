import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  Target,
  Brain,
  Lightbulb,
  Calendar,
  BarChart3,
  Award,
  Zap,
  BookOpen,
  Monitor,
  MessageCircle,
  Shield,
  Briefcase,
  Heart,
  AlertTriangle,
  Play,
  Download,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Info,
  Layers,
  Rocket,
  Settings,
} from "lucide-react";
import { QuizData, BusinessPath } from "../types";
import { businessPaths } from "../data/businessPaths";
import { businessModels } from "../data/businessModels";
import { calculateFitScore } from "../utils/quizLogic";
import { usePaywall } from "../contexts/PaywallContext";
import { useQuery } from "@tanstack/react-query";

interface BusinessGuideProps {
  quizData?: QuizData | null;
}

interface ResourceLink {
  name: string;
  url: string;
  description: string;
  type: "free" | "paid";
}

interface BusinessResources {
  freeResources: ResourceLink[];
  learningResources: ResourceLink[];
  tools: ResourceLink[];
  templates: ResourceLink[];
}

const BusinessGuide: React.FC<BusinessGuideProps> = ({ quizData }) => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const businessOverviewRef = useRef<HTMLDivElement>(null);
  const [businessPath, setBusinessPath] = useState<BusinessPath | null>(null);
  const [businessModel, setBusinessModel] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const { hasCompletedQuiz, canAccessBusinessModel } = usePaywall();

  // Fetch business resources using OpenAI
  const { data: businessResources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["business-resources", businessId],
    queryFn: () =>
      fetch(`/api/business-resources/${businessId}`).then((res) => res.json()),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Sidebar navigation items
  const sidebarItems = [
    { id: "overview", label: "Getting Started Overview", icon: BarChart3 },
    { id: "prerequisites", label: "Prerequisites & Setup", icon: Shield },
    { id: "implementation", label: "Implementation Phases", icon: Layers },
    { id: "tools-setup", label: "Tools & Software Setup", icon: Monitor },
    { id: "growth-strategy", label: "Growth & Optimization", icon: TrendingUp },
    {
      id: "common-mistakes",
      label: "Common Mistakes to Avoid",
      icon: AlertTriangle,
    },
    { id: "resources", label: "Resources & Templates", icon: BookOpen },
  ];

  // Handle scroll for header visibility and back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show/hide header based on scroll direction
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const scrollToBusinessOverview = () => {
    businessOverviewRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    if (!businessId) return;

    // Find business path and model
    const path = businessPaths.find((p) => p.id === businessId);
    const model = businessModels.find((m) => m.id === businessId);

    if (path) {
      // Calculate fit score if quiz data is available
      if (quizData) {
        const fitScore = calculateFitScore(businessId, quizData);
        setBusinessPath({ ...path, fitScore });
      } else {
        setBusinessPath(path);
      }
    }

    if (model) {
      setBusinessModel(model);
    }

    // Scroll to top when business model changes or page loads
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [businessId, quizData]);

  // Handle scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarItems.map((item) => item.id);
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  if (!businessPath && !businessModel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Business Guide Not Found
          </h1>
          <button
            onClick={() => navigate("/explore")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Explorer
          </button>
        </div>
      </div>
    );
  }

  const business = businessPath || businessModel;

  // Toggle expansion functions
  const toggleSkillExpansion = (skill: string) => {
    setExpandedSkills((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(skill)) {
        newSet.delete(skill);
      } else {
        newSet.add(skill);
      }
      return newSet;
    });
  };

  const togglePhaseExpansion = (phase: string) => {
    setExpandedPhases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(phase)) {
        newSet.delete(phase);
      } else {
        newSet.add(phase);
      }
      return newSet;
    });
  };

  // Get detailed skill descriptions
  const getSkillDescriptions = () => {
    const skillDescriptions: Record<string, Record<string, string>> = {
      "affiliate-marketing": {
        "Understanding of digital marketing basics":
          "Learn how online marketing works, including concepts like SEO, social media marketing, email marketing, and paid advertising. Understand customer funnels, conversion rates, and how to track marketing performance.",
        "Ability to create content (blog, video, social)":
          "Develop skills in creating engaging content across different platforms. This includes writing compelling blog posts, creating informative videos, and designing social media content that resonates with your target audience.",
        "Patience for long-term results":
          "Affiliate marketing typically takes 3-6 months to see significant results. You need mental resilience to stay consistent with content creation and promotion even when immediate results aren't visible.",
        "Basic website or social media presence":
          "Having a platform where you can share affiliate links and build an audience. This could be a WordPress blog, YouTube channel, Instagram account, or TikTok profile where you can consistently publish content.",
      },
      freelancing: {
        "Marketable skill (writing, design, development, etc.)":
          "A specific skill that businesses need and are willing to pay for. This could be graphic design, web development, copywriting, digital marketing, or any specialized service where you can deliver measurable value.",
        "Portfolio of previous work or sample projects":
          "Examples of your work that demonstrate your capabilities. If you don't have client work yet, create sample projects that showcase your skills and the quality of work clients can expect.",
        "Professional communication skills":
          "Ability to communicate clearly and professionally with clients through emails, video calls, and project management tools. This includes setting expectations, providing updates, and handling feedback constructively.",
        "Time management and self-discipline":
          "Skills to manage multiple projects, meet deadlines, and work independently without direct supervision. This includes creating schedules, prioritizing tasks, and maintaining productivity while working from home.",
      },
      "content-creation-ugc": {
        "Smartphone with good camera quality":
          "A modern smartphone with at least 1080p video recording capability and good low-light performance. Most content today is shot on phones, so camera quality directly impacts your content's professional appearance.",
        "Basic understanding of social media platforms":
          "Knowledge of how different platforms work, their algorithms, best posting times, and what type of content performs well on each. Understanding platform-specific features like Instagram Stories, TikTok effects, or YouTube Shorts.",
        "Willingness to be on camera":
          "Comfort with appearing in videos and photos, speaking naturally on camera, and developing your on-screen personality. This includes overcoming camera shyness and developing authentic presentation skills.",
        "Creative mindset and storytelling ability":
          "Skills in crafting engaging narratives, coming up with creative concepts, and presenting information in entertaining ways. This includes understanding what makes content shareable and how to hook viewers' attention.",
      },
    };

    return skillDescriptions[businessId as string] || {};
  };

  // Get business-specific guide content
  const getGuideContent = () => {
    switch (businessId) {
      case "content-creation-ugc":
        return {
          prerequisites: [
            "Smartphone with good camera quality",
            "Basic understanding of social media platforms",
            "Willingness to be on camera",
            "Creative mindset and storytelling ability",
          ],
          tools: [
            {
              name: "CapCut",
              purpose: "Video editing",
              cost: "Free",
              priority: "Essential",
            },
            {
              name: "Canva",
              purpose: "Graphics and thumbnails",
              cost: "Free/Pro",
              priority: "Essential",
            },
            {
              name: "TikTok",
              purpose: "Primary platform",
              cost: "Free",
              priority: "Essential",
            },
            {
              name: "Instagram",
              purpose: "Secondary platform",
              cost: "Free",
              priority: "Important",
            },
            {
              name: "Ring light",
              purpose: "Better lighting",
              cost: "$20-50",
              priority: "Recommended",
            },
            {
              name: "Tripod",
              purpose: "Stable shots",
              cost: "$15-30",
              priority: "Recommended",
            },
          ],
          phases: [
            {
              title: "Foundation Phase (Week 1-2)",
              description:
                "Establish your brand identity and create initial content",
              duration: "2 weeks",
              goals: [
                "Choose niche",
                "Set up profiles",
                "Create initial content",
              ],
              steps: [
                {
                  title: "Niche Research & Selection",
                  description:
                    "Research successful creators in potential niches, analyze engagement rates, and choose a specific focus that aligns with your interests and has proven demand.",
                  tasks: [
                    "Study top 10 creators in 3 potential niches",
                    "Analyze their content patterns",
                    "Choose your primary niche",
                  ],
                  timeframe: "Days 1-2",
                },
                {
                  title: "Brand Setup & Profile Optimization",
                  description:
                    "Create consistent branding across platforms with professional profile photos, compelling bios, and clear value propositions.",
                  tasks: [
                    "Design logo/profile image",
                    "Write compelling bio",
                    "Set up Instagram and TikTok profiles",
                  ],
                  timeframe: "Days 3-4",
                },
                {
                  title: "Content Creation & Initial Posts",
                  description:
                    "Create your first batch of content following proven formats and post consistently to start building audience.",
                  tasks: [
                    "Create 5 pieces of content",
                    "Schedule posts",
                    "Engage with 20 accounts daily",
                  ],
                  timeframe: "Days 5-14",
                },
              ],
            },
            {
              title: "Growth Phase (Week 3-6)",
              description:
                "Scale content production and build engaged audience",
              duration: "4 weeks",
              goals: [
                "Consistent posting",
                "Audience growth",
                "Collaboration start",
              ],
              steps: [
                {
                  title: "Content Schedule Implementation",
                  description:
                    "Establish a sustainable posting schedule and create content batches to maintain consistency.",
                  tasks: [
                    "Create 7-day content calendar",
                    "Batch create weekly content",
                    "Set up posting schedule",
                  ],
                  timeframe: "Week 3",
                },
                {
                  title: "Audience Engagement & Community Building",
                  description:
                    "Actively engage with your audience and other creators to build meaningful connections and increase visibility.",
                  tasks: [
                    "Reply to all comments",
                    "Engage with 50+ accounts daily",
                    "Join relevant conversations",
                  ],
                  timeframe: "Week 4-5",
                },
                {
                  title: "Collaboration & Viral Content",
                  description:
                    "Partner with other creators and focus on creating content with viral potential.",
                  tasks: [
                    "Reach out to 5 creators for collaboration",
                    "Create trend-based content",
                    "Analyze top-performing posts",
                  ],
                  timeframe: "Week 6",
                },
              ],
            },
            {
              title: "Monetization Phase (Week 7-12)",
              description: "Convert audience into revenue streams",
              duration: "6 weeks",
              goals: [
                "Brand partnerships",
                "Product launches",
                "Revenue generation",
              ],
              steps: [
                {
                  title: "Brand Partnership Outreach",
                  description:
                    "Identify and reach out to brands that align with your audience and content style.",
                  tasks: [
                    "Create media kit",
                    "Research 20 potential brand partners",
                    "Send partnership proposals",
                  ],
                  timeframe: "Week 7-8",
                },
                {
                  title: "Product Development & Launch",
                  description:
                    "Create your own products or services to sell to your audience.",
                  tasks: [
                    "Survey audience needs",
                    "Create digital product",
                    "Launch with promotional campaign",
                  ],
                  timeframe: "Week 9-10",
                },
                {
                  title: "Revenue Optimization",
                  description:
                    "Optimize your monetization strategy and scale successful revenue streams.",
                  tasks: [
                    "Track revenue metrics",
                    "Optimize conversion rates",
                    "Scale successful campaigns",
                  ],
                  timeframe: "Week 11-12",
                },
              ],
            },
          ],
          commonMistakes: [
            "Posting inconsistently or without a schedule",
            "Trying to appeal to everyone instead of a specific niche",
            "Focusing only on follower count instead of engagement",
            "Not engaging with other creators and building community",
            "Giving up too early before seeing results",
          ],
        };

      case "freelancing":
        return {
          prerequisites: [
            "Marketable skill (writing, design, development, etc.)",
            "Portfolio of previous work or sample projects",
            "Professional communication skills",
            "Time management and self-discipline",
          ],
          tools: [
            {
              name: "Upwork",
              purpose: "Finding clients",
              cost: "Free (commission)",
              priority: "Essential",
            },
            {
              name: "Fiverr",
              purpose: "Service marketplace",
              cost: "Free (commission)",
              priority: "Essential",
            },
            {
              name: "LinkedIn",
              purpose: "Professional networking",
              cost: "Free/Premium",
              priority: "Important",
            },
            {
              name: "Slack",
              purpose: "Client communication",
              cost: "Free/Paid",
              priority: "Important",
            },
            {
              name: "Zoom",
              purpose: "Client meetings",
              cost: "Free/Pro",
              priority: "Important",
            },
            {
              name: "Invoice software",
              purpose: "Billing clients",
              cost: "$10-30/month",
              priority: "Essential",
            },
          ],
          phases: [
            {
              title: "Setup Phase (Week 1-2)",
              description: "Create professional presence and portfolio",
              duration: "2 weeks",
              goals: [
                "Profile optimization",
                "Portfolio creation",
                "First proposals",
              ],
              steps: [
                {
                  title: "Platform Registration & Profile Setup",
                  description:
                    "Create compelling profiles on freelance platforms with professional photos, detailed descriptions, and skill showcases.",
                  tasks: [
                    "Create Upwork and Fiverr profiles",
                    "Write compelling bio",
                    "Add professional headshot",
                  ],
                  timeframe: "Days 1-2",
                },
                {
                  title: "Portfolio Development",
                  description:
                    "Build a strong portfolio showcasing your best work or create sample projects if you're just starting.",
                  tasks: [
                    "Create 3-5 sample projects",
                    "Write case studies",
                    "Upload to portfolio",
                  ],
                  timeframe: "Days 3-5",
                },
                {
                  title: "Initial Proposal Strategy",
                  description:
                    "Research potential clients and submit high-quality proposals to relevant job postings.",
                  tasks: [
                    "Research 20 job postings",
                    "Write custom proposals",
                    "Submit 10-15 applications",
                  ],
                  timeframe: "Days 6-14",
                },
              ],
            },
            {
              title: "Client Acquisition Phase (Week 3-6)",
              description: "Land first clients and establish reputation",
              duration: "4 weeks",
              goals: ["First client", "Positive reviews", "Rate optimization"],
              steps: [
                {
                  title: "First Client Delivery",
                  description:
                    "Focus on delivering exceptional work for your first client to build a strong foundation.",
                  tasks: [
                    "Deliver high-quality work",
                    "Communicate proactively",
                    "Exceed expectations",
                  ],
                  timeframe: "Week 3",
                },
                {
                  title: "Review & Testimonial Building",
                  description:
                    "Secure positive reviews and testimonials to build credibility on platforms.",
                  tasks: [
                    "Request reviews from clients",
                    "Follow up professionally",
                    "Showcase testimonials",
                  ],
                  timeframe: "Week 4",
                },
                {
                  title: "Rate Optimization & Service Expansion",
                  description:
                    "Gradually increase rates and expand service offerings based on market feedback.",
                  tasks: [
                    "Analyze competitor rates",
                    "Increase rates by 20%",
                    "Add new service offerings",
                  ],
                  timeframe: "Week 5-6",
                },
              ],
            },
            {
              title: "Scaling Phase (Week 7-12)",
              description: "Build sustainable freelance business",
              duration: "6 weeks",
              goals: ["Multiple clients", "Higher rates", "Systems automation"],
              steps: [
                {
                  title: "Client Retention & Upselling",
                  description:
                    "Focus on retaining existing clients and expanding project scope.",
                  tasks: [
                    "Propose additional services",
                    "Create retainer agreements",
                    "Upsell existing clients",
                  ],
                  timeframe: "Week 7-8",
                },
                {
                  title: "Business Systems Development",
                  description:
                    "Create systems and processes to handle multiple clients efficiently.",
                  tasks: [
                    "Set up project management system",
                    "Create client onboarding process",
                    "Automate invoicing",
                  ],
                  timeframe: "Week 9-10",
                },
                {
                  title: "Premium Service Launch",
                  description:
                    "Launch higher-value services and target premium clients.",
                  tasks: [
                    "Develop premium service packages",
                    "Target enterprise clients",
                    "Position as expert",
                  ],
                  timeframe: "Week 11-12",
                },
              ],
            },
          ],
          commonMistakes: [
            "Underpricing services to win clients",
            "Taking on projects outside your expertise",
            "Poor communication with clients",
            "Not setting clear boundaries and scope",
            "Failing to ask for testimonials and referrals",
          ],
        };

      case "affiliate-marketing":
        return {
          prerequisites: [
            "Understanding of digital marketing basics",
            "Ability to create content (blog, video, social)",
            "Patience for long-term results",
            "Basic website or social media presence",
          ],
          tools: [
            {
              name: "WordPress",
              purpose: "Website/blog platform",
              cost: "$5-15/month",
              priority: "Essential",
            },
            {
              name: "ConvertKit",
              purpose: "Email marketing",
              cost: "$29+/month",
              priority: "Essential",
            },
            {
              name: "Canva",
              purpose: "Content creation",
              cost: "Free/Pro",
              priority: "Important",
            },
            {
              name: "Ahrefs",
              purpose: "SEO and keyword research",
              cost: "$99+/month",
              priority: "Important",
            },
            {
              name: "Google Analytics",
              purpose: "Traffic tracking",
              cost: "Free",
              priority: "Essential",
            },
            {
              name: "Amazon Associates",
              purpose: "Affiliate program",
              cost: "Free",
              priority: "Essential",
            },
          ],
          phases: [
            {
              title: "Foundation Phase (Week 1-3)",
              description: "Build platform and establish content strategy",
              duration: "3 weeks",
              goals: ["Website setup", "Content strategy", "Program selection"],
              steps: [
                {
                  title: "Platform Setup & Design",
                  description:
                    "Create a professional website or blog that serves as your primary platform for affiliate marketing.",
                  tasks: [
                    "Set up WordPress hosting",
                    "Choose and customize theme",
                    "Create essential pages",
                  ],
                  timeframe: "Days 1-3",
                },
                {
                  title: "Niche Research & Program Selection",
                  description:
                    "Research profitable niches and select affiliate programs that align with your audience and interests.",
                  tasks: [
                    "Analyze 5 potential niches",
                    "Research competitor strategies",
                    "Apply to 3-5 affiliate programs",
                  ],
                  timeframe: "Days 4-7",
                },
                {
                  title: "Content Strategy Development",
                  description:
                    "Create a content calendar and produce initial high-quality content to attract your target audience.",
                  tasks: [
                    "Create 30-day content calendar",
                    "Write 3 in-depth blog posts",
                    "Set up email capture system",
                  ],
                  timeframe: "Week 2-3",
                },
              ],
            },
            {
              title: "Content & SEO Phase (Week 4-8)",
              description:
                "Scale content production and optimize for search engines",
              duration: "5 weeks",
              goals: ["SEO optimization", "Content scaling", "Traffic growth"],
              steps: [
                {
                  title: "SEO Optimization & Keyword Research",
                  description:
                    "Optimize existing content and develop SEO strategy for long-term organic traffic growth.",
                  tasks: [
                    "Keyword research for 20 articles",
                    "Optimize existing posts",
                    "Build internal linking structure",
                  ],
                  timeframe: "Week 4-5",
                },
                {
                  title: "Content Production Scaling",
                  description:
                    "Increase content output while maintaining quality and focusing on affiliate product integration.",
                  tasks: [
                    "Publish 2-3 articles per week",
                    "Create product comparison posts",
                    "Develop review templates",
                  ],
                  timeframe: "Week 6-7",
                },
                {
                  title: "Traffic Diversification",
                  description:
                    "Expand beyond SEO to include social media, email marketing, and other traffic sources.",
                  tasks: [
                    "Launch social media strategy",
                    "Create lead magnets",
                    "Build email sequences",
                  ],
                  timeframe: "Week 8",
                },
              ],
            },
            {
              title: "Monetization Phase (Week 9-16)",
              description:
                "Optimize conversions and scale profitable campaigns",
              duration: "8 weeks",
              goals: [
                "Conversion optimization",
                "Revenue scaling",
                "Advanced strategies",
              ],
              steps: [
                {
                  title: "Conversion Rate Optimization",
                  description:
                    "Analyze performance data and optimize content and funnels for higher conversion rates.",
                  tasks: [
                    "A/B test call-to-action buttons",
                    "Optimize product placement",
                    "Improve page load speeds",
                  ],
                  timeframe: "Week 9-10",
                },
                {
                  title: "Advanced Monetization Strategies",
                  description:
                    "Implement advanced techniques like email marketing funnels and retargeting campaigns.",
                  tasks: [
                    "Create email marketing sequences",
                    "Set up retargeting pixels",
                    "Launch paid advertising",
                  ],
                  timeframe: "Week 11-13",
                },
                {
                  title: "Scaling & Automation",
                  description:
                    "Scale successful campaigns and automate processes for sustainable growth.",
                  tasks: [
                    "Outsource content creation",
                    "Set up automation tools",
                    "Expand to new programs",
                  ],
                  timeframe: "Week 14-16",
                },
              ],
            },
          ],
          commonMistakes: [
            "Promoting too many products without focus",
            "Not disclosing affiliate relationships properly",
            "Focusing on commissions over providing value",
            "Expecting quick results in a long-term game",
            "Not building an email list from day one",
          ],
        };

      case "e-commerce-dropshipping":
        return {
          prerequisites: [
            "Basic understanding of e-commerce",
            "Marketing and advertising budget ($500+ recommended)",
            "Customer service skills",
            "Ability to handle business operations",
          ],
          tools: [
            {
              name: "Shopify",
              purpose: "E-commerce platform",
              cost: "$29+/month",
              priority: "Essential",
            },
            {
              name: "Oberlo",
              purpose: "Product sourcing",
              cost: "Free/Paid",
              priority: "Essential",
            },
            {
              name: "Facebook Ads Manager",
              purpose: "Advertising",
              cost: "Ad spend",
              priority: "Essential",
            },
            {
              name: "Google Ads",
              purpose: "Search advertising",
              cost: "Ad spend",
              priority: "Important",
            },
            {
              name: "AliExpress",
              purpose: "Supplier platform",
              cost: "Free",
              priority: "Essential",
            },
            {
              name: "Klaviyo",
              purpose: "Email marketing",
              cost: "$20+/month",
              priority: "Important",
            },
          ],
          firstWeekPlan: [
            "Day 1-2: Research profitable niches and trending products",
            "Day 3-4: Set up Shopify store and find reliable suppliers",
            "Day 5-6: Create product listings and store design",
            "Day 7: Launch store and run first advertising campaigns",
          ],
          firstMonthMilestones: [
            "Week 1: Store launched, 10-20 products listed",
            "Week 2: First sales, optimize ad campaigns",
            "Week 3: Scale profitable products, improve conversion rate",
            "Week 4: $1000+ revenue, expand product line",
          ],
          commonMistakes: [
            "Choosing oversaturated or low-margin products",
            "Poor supplier relationships and quality control",
            "Inadequate customer service and support",
            "Spending too much on ads without testing",
            "Not focusing on building a brand",
          ],
        };

      case "virtual-assistant":
        return {
          prerequisites: [
            "Strong organizational and communication skills",
            "Proficiency with common business software",
            "Reliable internet and computer setup",
            "Professional demeanor and work ethic",
          ],
          tools: [
            {
              name: "Google Workspace",
              purpose: "Productivity suite",
              cost: "$6+/month",
              priority: "Essential",
            },
            {
              name: "Notion",
              purpose: "Project management",
              cost: "Free/Paid",
              priority: "Essential",
            },
            {
              name: "Trello",
              purpose: "Task management",
              cost: "Free/Paid",
              priority: "Important",
            },
            {
              name: "Slack",
              purpose: "Team communication",
              cost: "Free/Paid",
              priority: "Essential",
            },
            {
              name: "Zoom",
              purpose: "Video meetings",
              cost: "Free/Pro",
              priority: "Essential",
            },
            {
              name: "Calendly",
              purpose: "Scheduling",
              cost: "Free/Paid",
              priority: "Important",
            },
          ],
          firstWeekPlan: [
            "Day 1-2: Define your VA services and create service packages",
            "Day 3-4: Set up professional profiles on VA platforms",
            "Day 5-6: Apply to 15-20 VA positions",
            "Day 7: Follow up on applications and prepare for interviews",
          ],
          firstMonthMilestones: [
            "Week 1: Complete 20+ applications, get first interviews",
            "Week 2: Land first client, deliver excellent work",
            "Week 3: Secure 2-3 regular clients, establish routines",
            "Week 4: Earn $500+, get testimonials, plan expansion",
          ],
          commonMistakes: [
            "Taking on too many clients too quickly",
            "Not setting clear boundaries and expectations",
            "Undercharging for specialized skills",
            "Poor time management and organization",
            "Not investing in skill development",
          ],
        };

      case "online-coaching-consulting":
        return {
          prerequisites: [
            "Expertise or experience in your coaching niche",
            "Strong communication and listening skills",
            "Coaching certification (recommended)",
            "Ability to create structured programs",
          ],
          tools: [
            {
              name: "Zoom",
              purpose: "Coaching sessions",
              cost: "Free/Pro",
              priority: "Essential",
            },
            {
              name: "Calendly",
              purpose: "Appointment scheduling",
              cost: "Free/Paid",
              priority: "Essential",
            },
            {
              name: "Teachable",
              purpose: "Course platform",
              cost: "$39+/month",
              priority: "Important",
            },
            {
              name: "Stripe",
              purpose: "Payment processing",
              cost: "2.9% + 30¢",
              priority: "Essential",
            },
            {
              name: "Notion",
              purpose: "Client management",
              cost: "Free/Paid",
              priority: "Important",
            },
            {
              name: "Loom",
              purpose: "Video feedback",
              cost: "Free/Paid",
              priority: "Recommended",
            },
          ],
          firstWeekPlan: [
            "Day 1-2: Define your coaching niche and ideal client",
            "Day 3-4: Create coaching packages and pricing structure",
            "Day 5-6: Set up booking system and payment processing",
            "Day 7: Launch with free discovery sessions",
          ],
          firstMonthMilestones: [
            "Week 1: Conduct 10+ discovery sessions",
            "Week 2: Sign first 3-5 paying clients",
            "Week 3: Deliver exceptional results, get testimonials",
            "Week 4: Earn $2000+, develop group program",
          ],
          commonMistakes: [
            "Not niching down enough in target market",
            "Underpricing coaching services",
            "Lack of structure in coaching programs",
            "Not tracking client results and progress",
            "Trying to help everyone instead of ideal clients",
          ],
        };

      case "print-on-demand":
        return {
          prerequisites: [
            "Basic graphic design skills",
            "Understanding of target markets and trends",
            "Patience for gradual income growth",
            "Creative mindset for design ideas",
          ],
          tools: [
            {
              name: "Canva",
              purpose: "Design creation",
              cost: "Free/Pro",
              priority: "Essential",
            },
            {
              name: "Photoshop",
              purpose: "Advanced design",
              cost: "$20+/month",
              priority: "Important",
            },
            {
              name: "Printful",
              purpose: "POD platform",
              cost: "Free (per order)",
              priority: "Essential",
            },
            {
              name: "Etsy",
              purpose: "Marketplace",
              cost: "Listing fees",
              priority: "Essential",
            },
            {
              name: "Amazon Merch",
              purpose: "POD marketplace",
              cost: "Free (commission)",
              priority: "Important",
            },
            {
              name: "Redbubble",
              purpose: "POD platform",
              cost: "Free (commission)",
              priority: "Important",
            },
          ],
          firstWeekPlan: [
            "Day 1-2: Research profitable niches and trending designs",
            "Day 3-4: Create first 10 designs using Canva",
            "Day 5-6: Set up accounts on Printful and Etsy",
            "Day 7: Upload first products and optimize listings",
          ],
          firstMonthMilestones: [
            "Week 1: 20 designs uploaded across platforms",
            "Week 2: First sales, optimize best performers",
            "Week 3: 50+ designs live, expand to new niches",
            "Week 4: $200+ revenue, plan scaling strategy",
          ],
          commonMistakes: [
            "Creating designs without market research",
            "Poor keyword optimization for listings",
            "Not testing different design styles",
            "Focusing on quantity over quality",
            "Ignoring copyright and trademark issues",
          ],
        };

      default:
        return {
          prerequisites: [
            "Basic understanding of the business model",
            "Commitment to learning and growth",
            "Professional work ethic",
            "Access to necessary tools and resources",
          ],
          tools: [
            {
              name: "Computer/Laptop",
              purpose: "Primary work device",
              cost: "Varies",
              priority: "Essential",
            },
            {
              name: "Internet Connection",
              purpose: "Online work",
              cost: "$30-80/month",
              priority: "Essential",
            },
            {
              name: "Email",
              purpose: "Communication",
              cost: "Free",
              priority: "Essential",
            },
          ],
          firstWeekPlan: [
            "Day 1-2: Research and understand the business model",
            "Day 3-4: Set up necessary tools and accounts",
            "Day 5-6: Create initial content or offerings",
            "Day 7: Launch and start marketing efforts",
          ],
          firstMonthMilestones: [
            "Week 1: Foundation setup complete",
            "Week 2: First customer or client acquired",
            "Week 3: Optimize and improve offerings",
            "Week 4: Scale and plan for growth",
          ],
          commonMistakes: [
            "Not researching the market thoroughly",
            "Underestimating time and effort required",
            "Poor planning and organization",
            "Not tracking progress and metrics",
          ],
        };
    }
  };

  const guideContent = getGuideContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "sticky",
            top: headerVisible ? "0" : "-100px",
            zIndex: 40,
            transition: "top 0.3s ease-in-out",
            backgroundColor: "rgba(248, 250, 252, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "0 0 1rem 1rem",
            marginBottom: "2rem",
            padding: "1rem 0",
          }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-xl hover:bg-white/70 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Complete Guide to Starting {business.name || business.title}
              </h1>
              <p className="text-gray-600">
                Step-by-step roadmap to launch your business successfully
              </p>
            </div>
          </div>

          {businessPath?.fitScore && (
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {businessPath.fitScore}%
              </div>
              <div className="text-sm text-gray-600">Your Match</div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Guide Sections
                </h3>
                <nav className="space-y-2">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-xl transition-colors ${
                        activeSection === item.id
                          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700 rounded-r-lg"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm font-medium ml-2">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Getting Started Overview */}
            <section
              id="overview"
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center mb-6">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Getting Started Overview
                </h2>
              </div>

              <div className="prose max-w-none mb-8">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Welcome to your complete guide for starting{" "}
                  {business.name || business.title}! This comprehensive roadmap
                  will take you from complete beginner to earning your first
                  income.
                  {quizData &&
                    ` Based on your quiz results, this business model is a ${businessPath?.fitScore}% match for your goals and personality.`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">
                    {business.timeToProfit || business.timeToStart}
                  </div>
                  <div className="text-sm text-gray-600">
                    Time to First Income
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">
                    {business.startupCost || business.initialInvestment}
                  </div>
                  <div className="text-sm text-gray-600">
                    Startup Investment
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">
                    {business.potentialIncome}
                  </div>
                  <div className="text-sm text-gray-600">Income Potential</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What You'll Learn in This Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Complete setup process from start to finish
                    </span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Essential tools and software recommendations
                    </span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Week-by-week action plan for first month
                    </span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Common mistakes and how to avoid them
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => navigate(`/business/${businessId}`)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Learn more about {business.name || business.title} for you
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </section>

            {/* Prerequisites & Setup */}
            <section
              id="prerequisites"
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center mb-6">
                <Shield className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Prerequisites & Setup
                </h2>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Skills & Requirements
                </h3>
                <p className="text-gray-600 mb-6">
                  Click on each skill to learn more about what it involves and
                  how to develop it.
                </p>
                <div className="space-y-3">
                  {guideContent.prerequisites.map((prereq, index) => {
                    const skillDescriptions = getSkillDescriptions();
                    const isExpanded = expandedSkills.has(prereq);
                    const hasDescription = skillDescriptions[prereq];

                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        <div
                          className={`flex items-start p-4 cursor-pointer transition-colors ${
                            hasDescription ? "hover:bg-gray-50" : "bg-gray-50"
                          }`}
                          onClick={() =>
                            hasDescription && toggleSkillExpansion(prereq)
                          }
                        >
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-900 font-medium">
                                {prereq}
                              </span>
                              {hasDescription && (
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && hasDescription && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-4 pb-4 bg-blue-50 border-t border-gray-200">
                                <div className="flex items-start">
                                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {skillDescriptions[prereq]}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {quizData && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Your Readiness Assessment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Tech Skills</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-blue-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(quizData.techSkillsRating / 5) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-blue-800">
                          {quizData.techSkillsRating}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Time Available</span>
                      <span className="text-sm font-medium text-blue-800">
                        {quizData.weeklyTimeCommitment} hrs/week
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Budget</span>
                      <span className="text-sm font-medium text-blue-800">
                        ${quizData.upfrontInvestment}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Self Motivation</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-blue-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(quizData.selfMotivationLevel / 5) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-blue-800">
                          {quizData.selfMotivationLevel}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Implementation Phases */}
            <section
              id="implementation"
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center mb-6">
                <Layers className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Implementation Phases
                </h2>
              </div>

              <p className="text-gray-600 mb-8">
                Follow this structured approach to build your business step by
                step. Each phase includes detailed steps with expandable
                information.
              </p>

              <div className="space-y-6">
                {guideContent.phases?.map((phase, phaseIndex) => (
                  <div
                    key={phaseIndex}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                              phaseIndex === 0
                                ? "bg-blue-600 text-white"
                                : phaseIndex === 1
                                  ? "bg-green-600 text-white"
                                  : "bg-purple-600 text-white"
                            }`}
                          >
                            {phaseIndex + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {phase.title}
                            </h3>
                            <p className="text-gray-600">{phase.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-700">
                            {phase.duration}
                          </div>
                          <div className="text-xs text-gray-500">Duration</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {phase.goals?.map((goal, goalIndex) => (
                          <span
                            key={goalIndex}
                            className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-medium"
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      {phase.steps?.map((step, stepIndex) => {
                        const stepKey = `${phaseIndex}-${stepIndex}`;
                        const isExpanded = expandedPhases.has(stepKey);

                        return (
                          <div
                            key={stepIndex}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            <div
                              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => togglePhaseExpansion(stepKey)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm font-medium">
                                    {stepIndex + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {step.title}
                                    </h4>
                                    <p className="text-gray-600 text-sm">
                                      {step.timeframe}
                                    </p>
                                  </div>
                                </div>
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                </motion.div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                                    <p className="text-gray-700 mb-4">
                                      {step.description}
                                    </p>

                                    <div className="space-y-2">
                                      <h5 className="font-medium text-gray-900 mb-2">
                                        Action Items:
                                      </h5>
                                      {step.tasks?.map((task, taskIndex) => (
                                        <div
                                          key={taskIndex}
                                          className="flex items-start"
                                        >
                                          <button
                                            onClick={() =>
                                              toggleStepCompletion(
                                                `${stepKey}-${taskIndex}`,
                                              )
                                            }
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 transition-colors ${
                                              completedSteps.has(
                                                `${stepKey}-${taskIndex}`,
                                              )
                                                ? "bg-green-500 border-green-500"
                                                : "border-gray-300 hover:border-green-400"
                                            }`}
                                          >
                                            {completedSteps.has(
                                              `${stepKey}-${taskIndex}`,
                                            ) && (
                                              <CheckCircle className="h-3 w-3 text-white" />
                                            )}
                                          </button>
                                          <span
                                            className={`text-sm text-gray-700 ${
                                              completedSteps.has(
                                                `${stepKey}-${taskIndex}`,
                                              )
                                                ? "line-through text-gray-500"
                                                : ""
                                            }`}
                                          >
                                            {task}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    Detailed implementation phases coming soon for this business
                    model.
                  </div>
                )}
              </div>
            </section>

            {/* Tools & Software Setup */}
            <section
              id="tools-setup"
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center mb-6">
                <Monitor className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Essential Tools & Software
                </h2>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-lg">
                  These are the core tools you'll need to get started. Each tool
                  includes direct links to get you set up quickly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Display AI-generated tools first */}
                {businessResources?.tools?.map((tool: any, index: number) => (
                  <a
                    key={index}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                        {tool.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tool.type === "free"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {tool.type === "free" ? "Free" : "Paid"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {tool.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {tool.type === "free"
                          ? "Free to start"
                          : "Paid service"}
                      </span>
                      <div className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                        Visit Site
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </a>
                ))}

                {/* Display business model specific tools */}
                {business.tools?.map((toolName: string, index: number) => {
                  const toolUrls: Record<string, string> = {
                    Upwork: "https://www.upwork.com/",
                    Fiverr: "https://www.fiverr.com/",
                    LinkedIn: "https://www.linkedin.com/",
                    Slack: "https://slack.com/",
                    Zoom: "https://zoom.us/",
                    Canva: "https://www.canva.com/",
                    WordPress: "https://wordpress.com/",
                    ConvertKit: "https://convertkit.com/",
                    Mailchimp: "https://mailchimp.com/",
                    Shopify: "https://www.shopify.com/",
                    Etsy: "https://www.etsy.com/",
                    Amazon: "https://www.amazon.com/",
                    "Google Analytics": "https://analytics.google.com/",
                    "Facebook Ads": "https://www.facebook.com/business/ads",
                    Instagram: "https://www.instagram.com/",
                    YouTube: "https://www.youtube.com/",
                    TikTok: "https://www.tiktok.com/",
                    Twitch: "https://www.twitch.tv/",
                    Stripe: "https://stripe.com/",
                    PayPal: "https://www.paypal.com/",
                    Notion: "https://www.notion.so/",
                    Trello: "https://trello.com/",
                    Asana: "https://asana.com/",
                    Buffer: "https://buffer.com/",
                    Hootsuite: "https://hootsuite.com/",
                    Calendly: "https://calendly.com/",
                    Zapier: "https://zapier.com/",
                    Airtable: "https://airtable.com/",
                    "Google Workspace": "https://workspace.google.com/",
                    "Microsoft 365":
                      "https://www.microsoft.com/en-us/microsoft-365",
                    Loom: "https://www.loom.com/",
                    Figma: "https://www.figma.com/",
                    "Adobe Creative Suite":
                      "https://www.adobe.com/creativecloud.html",
                    QuickBooks: "https://quickbooks.intuit.com/",
                    FreshBooks: "https://www.freshbooks.com/",
                    Wave: "https://www.waveapps.com/",
                    HubSpot: "https://www.hubspot.com/",
                    Salesforce: "https://www.salesforce.com/",
                    Claude: "https://claude.ai/",
                    ChatGPT: "https://chat.openai.com/",
                    Grammarly: "https://www.grammarly.com/",
                    Semrush: "https://www.semrush.com/",
                    Ahrefs: "https://ahrefs.com/",
                    "Google Search Console":
                      "https://search.google.com/search-console",
                    Hotjar: "https://www.hotjar.com/",
                    Typeform: "https://www.typeform.com/",
                    SurveyMonkey: "https://www.surveymonkey.com/",
                    Intercom: "https://www.intercom.com/",
                    Zendesk: "https://www.zendesk.com/",
                    Discord: "https://discord.com/",
                    Telegram: "https://telegram.org/",
                    "WhatsApp Business": "https://business.whatsapp.com/",
                    Twilio: "https://www.twilio.com/",
                    ClickFunnels: "https://www.clickfunnels.com/",
                    Leadpages: "https://www.leadpages.net/",
                    Unbounce: "https://unbounce.com/",
                  };

                  const toolUrl =
                    toolUrls[toolName] ||
                    `https://www.google.com/search?q=${encodeURIComponent(toolName)}`;

                  return (
                    <a
                      key={`biz-tool-${index}`}
                      href={toolUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">
                          {toolName}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Recommended
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        Essential tool for {business.name || "your business"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Click to explore
                        </span>
                        <div className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center">
                          Visit Site
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>

              <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  💡 Pro Tip
                </h3>
                <p className="text-yellow-800">
                  Start with the free tools first. You can always upgrade to
                  paid versions as your business grows and generates revenue.
                </p>
              </div>
            </section>

            {/* Growth & Optimization */}
            <section
              id="growth-strategy"
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center mb-6">
                <TrendingUp className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Growth & Optimization
                </h2>
              </div>

              <p className="text-gray-600 mb-8">
                Once you've completed the implementation phases, focus on these
                growth strategies to scale your business sustainably.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 border border-blue-200 rounded-xl">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Performance Optimization
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Analyze your most successful content/campaigns</li>
                      <li>• Double down on high-performing strategies</li>
                      <li>• Eliminate or improve underperforming elements</li>
                      <li>• A/B test new approaches continuously</li>
                    </ul>
                  </div>

                  <div className="p-6 border border-green-200 rounded-xl">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Audience Expansion
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Expand to new platforms or channels</li>
                      <li>• Collaborate with other creators/businesses</li>
                      <li>• Develop referral and affiliate programs</li>
                      <li>• Create viral or shareable content</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 border border-purple-200 rounded-xl">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Settings className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Process Automation
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Automate repetitive tasks using tools</li>
                      <li>• Create templates and workflows</li>
                      <li>• Set up email sequences and funnels</li>
                      <li>• Use scheduling tools for consistency</li>
                    </ul>
                  </div>

                  <div className="p-6 border border-orange-200 rounded-xl">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <Rocket className="h-4 w-4 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Revenue Diversification
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Add multiple income streams</li>
                      <li>• Create premium offerings or services</li>
                      <li>• Develop passive income products</li>
                      <li>• Explore partnership opportunities</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
                <h3 className="font-semibold text-purple-900 mb-4">
                  Key Performance Indicators
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      30%+
                    </div>
                    <div className="text-sm text-purple-600">
                      Monthly Growth
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      80%+
                    </div>
                    <div className="text-sm text-purple-600">
                      Customer Retention
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      60%+
                    </div>
                    <div className="text-sm text-purple-600">Profit Margin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700">
                      20hrs
                    </div>
                    <div className="text-sm text-purple-600">Work/Week</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Common Mistakes */}
            <section
              id="common-mistakes"
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center mb-6">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Common Mistakes to Avoid
                </h2>
              </div>

              <div className="space-y-4">
                {guideContent.commonMistakes.map((mistake, index) => (
                  <div
                    key={index}
                    className="flex items-start p-4 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-red-800">{mistake}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 Success Tip
                </h3>
                <p className="text-blue-800">
                  Most successful entrepreneurs make mistakes early on. The key
                  is to learn quickly, adapt, and keep moving forward. Don't let
                  perfectionism prevent you from starting!
                </p>
              </div>
            </section>

            {/* Resources & Templates */}
            <section
              id="resources"
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center mb-6">
                <BookOpen className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Resources & Templates
                </h2>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-lg">
                  Get started faster with these curated resources, templates,
                  and tools specifically selected for{" "}
                  {business.name || "your business model"}. All links are
                  verified and lead to authentic, high-quality resources.
                </p>
              </div>

              {resourcesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading resources...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Free Resources */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Download className="h-5 w-5 text-green-600 mr-2" />
                      Free Resources & Templates
                    </h3>
                    <div className="space-y-3">
                      {businessResources?.freeResources?.map(
                        (resource: ResourceLink, index: number) => (
                          <a
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                          >
                            <Download className="h-4 w-4 text-green-600 mr-3 mt-1 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-green-900 group-hover:text-green-700">
                                {resource.name}
                              </div>
                              <div className="text-sm text-green-700 mt-1">
                                {resource.description}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-green-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ),
                      )}
                      {businessResources?.templates?.map(
                        (resource: ResourceLink, index: number) => (
                          <a
                            key={`template-${index}`}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                          >
                            <Download className="h-4 w-4 text-green-600 mr-3 mt-1 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-green-900 group-hover:text-green-700">
                                {resource.name}
                              </div>
                              <div className="text-sm text-green-700 mt-1">
                                {resource.description}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-green-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Learning Resources */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Brain className="h-5 w-5 text-blue-600 mr-2" />
                      Learning Resources
                    </h3>
                    <div className="space-y-3">
                      {businessResources?.learningResources?.map(
                        (resource: ResourceLink, index: number) => (
                          <a
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                          >
                            <BookOpen className="h-4 w-4 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-blue-900 group-hover:text-blue-700 flex items-center">
                                {resource.name}
                                {resource.type === "paid" && (
                                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                    Paid
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-blue-700 mt-1">
                                {resource.description}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-blue-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Tools & Software */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Monitor className="h-5 w-5 text-purple-600 mr-2" />
                      Essential Tools
                    </h3>
                    <div className="space-y-3">
                      {businessResources?.tools?.map(
                        (resource: ResourceLink, index: number) => (
                          <a
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                          >
                            <Monitor className="h-4 w-4 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-purple-900 group-hover:text-purple-700 flex items-center">
                                {resource.name}
                                {resource.type === "paid" && (
                                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                    Paid
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-purple-700 mt-1">
                                {resource.description}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-purple-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Business Model Resources */}
                  {business.resources &&
                    Array.isArray(business.resources) &&
                    business.resources.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Briefcase className="h-5 w-5 text-orange-600 mr-2" />
                          Business Model Resources
                        </h3>
                        <div className="space-y-3">
                          {business.resources.map(
                            (resource: any, index: number) => (
                              <a
                                key={index}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors group"
                              >
                                <ExternalLink className="h-4 w-4 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-orange-900 group-hover:text-orange-700 flex items-center">
                                    {resource.name}
                                    {resource.type === "Paid" && (
                                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                        Paid
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-orange-700 mt-1">
                                    {resource.description}
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-orange-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </section>

            {/* Dashboard Link */}
            <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200 p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Continue Your Journey
                </h2>
              </div>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Ready to explore more business opportunities or track your
                progress? Visit your dashboard to see all your recommendations
                and manage your business journey.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                <BarChart3 className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessGuide;
