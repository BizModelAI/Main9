# BizModelAI - Business Model Discovery Platform

## Overview

BizModelAI is a comprehensive full-stack web application that helps entrepreneurs discover their ideal business model through AI-powered analysis and personalized recommendations. The platform features an intelligent assessment system that analyzes user skills, goals, and preferences to provide tailored business model suggestions with detailed implementation guidance.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared components:

- **Frontend**: React with TypeScript, using Vite for build tooling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **AI Integration**: OpenAI API for personalized insights

## Key Components

### Frontend Architecture
- **React SPA**: Built with TypeScript and modern React patterns
- **State Management**: Context API for authentication and paywall state
- **Routing**: React Router for client-side navigation
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Animations**: Framer Motion for smooth transitions and interactions
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **Storage Layer**: Abstract storage interface with both memory and database implementations
- **Development Tools**: Vite integration for hot reloading in development
- **Session Management**: Express sessions with PostgreSQL store

### Database Schema
- **Users Table**: Basic user authentication with username/password
- **Quiz Attempts Table**: Track user quiz completion history
- **Payments Table**: Handle purchases and access pass management
- **Unpaid User Emails Table**: Temporary storage for non-registered users
- **Drizzle ORM**: Type-safe database operations with automatic migrations
- **PostgreSQL**: Production database with Supabase integration

### AI-Powered Analysis
- **OpenAI Integration**: GPT-based personalized business insights
- **Fallback System**: Mock data when API is unavailable
- **Analysis Types**: Summary, recommendations, challenges, strategies, and action plans

## Data Flow

1. **Quiz Flow**: Users complete a multi-step quiz collecting preferences and personality traits
2. **Scoring Algorithm**: Custom logic calculates fit scores for different business models
3. **AI Enhancement**: OpenAI API generates personalized insights and recommendations
4. **Results Display**: Interactive cards show top business matches with detailed analysis
5. **Paywall Integration**: Premium content locked behind email capture and payment

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling (compatible with Supabase)
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **framer-motion**: Animation library
- **react-router-dom**: Client-side routing

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast JavaScript bundler for production

### AI Services
- **OpenAI API**: Personalized business analysis (optional)
- **Fallback system**: Works without API key using mock data

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with hot reloading
- **Database**: Supabase PostgreSQL database with connection pooling
- **Environment Variables**: `.env` file for API keys and database URLs

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles Node.js server
- **Database**: Drizzle migrations applied automatically
- **Deployment**: Single command deployment with build artifacts

### Environment Configuration
- **NODE_ENV**: Development/production mode switching
- **DATABASE_URL**: PostgreSQL connection string
- **VITE_OPENAI_API_KEY**: Optional OpenAI API integration

## Changelog

- July 07, 2025. Initial setup
- July 08, 2025. Added quiz attempt history feature with API endpoint and dashboard component
- July 08, 2025. Fixed dashboard flow to show "Welcome back" page after business model selection instead of business selection page, added localStorage persistence for business model selection state
- July 08, 2025. Complete rebranding to "BizModelAI" with new logo design, updated all components, meta tags, and content to reflect business model discovery focus
- July 08, 2025. Updated email templates to light mode with bright white backgrounds, black text, and prominent "Best Fit Business Model" section. Added unsubscribe functionality with dedicated page at /unsubscribe
- July 09, 2025. Completely rewrote quiz scoring algorithm to fix unrealistic 100% compatibility scores. New system starts from 0 with weighted factors for realistic score distribution. Updated fit category thresholds: Best (70+), Strong (50-69), Possible (30-49), Poor (<30)
- July 09, 2025. Optimized AI API usage to reduce costs while maintaining all functionality. Results page still generates both basic insights and full report preview using OpenAI API, but removed unnecessary background AI calls. All 6 AI-generated characteristics for "Best Fit Characteristics" section are preserved exactly as before.
- July 09, 2025. Implemented comprehensive AI content caching system with 24-hour expiration to prevent regeneration on page navigation. All OpenAI API generated content is now cached and persists across page visits for better user experience and cost efficiency.
- July 09, 2025. Removed "Skill Match Bubbles + Trait Sliders" feature from paywall modal as requested.
- July 09, 2025. Fixed confetti animation to only show once per user session - confetti now appears only on first visit to results page, not on subsequent navigations back to results.
- July 09, 2025. Removed loading page between Full Report and Results page - loading screen now only appears between quiz completion and results page as intended.
- July 09, 2025. Implemented new comprehensive scoring algorithm for business model detail page personality traits (Risk Tolerance, Self-Motivation, Tech Comfort, Consistency, Learning Agility). New algorithm uses weighted multi-question scoring instead of simple single-question multiplication for more accurate personality assessment.
- July 09, 2025. Updated ideal personality traits for each business model on detail pages with specific data-driven scores. Each business model now shows its unique ideal trait profile instead of generic hardcoded values. Added proper trait descriptions with min/max labels (e.g., "Avoids Risks" to "Embraces Risks").
- July 09, 2025. Fixed OpenAI API integration issues - resolved environment variable problems, added proper server-side endpoints, fixed request format errors in FullReport and AIReportLoading components that were causing "Error generating all characteristics" and "Prompt is required" errors. All OpenAI responses now work correctly with proper JSON parsing.
- July 11, 2025. Completed major business model page cleanup - removed unnecessary sections (Success Strategies, Platform Help, Recommended Tools, First Week Action Items), moved Getting Started section before Action Plan, updated section titles with dynamic business names. Fixed Full Report navigation to business model pages. Removed duplicate purple gradient loading page while keeping white background version. Successfully pushed complete codebase to GitHub repository.
- July 11, 2025. Fixed critical AI insights mismatch issue where quiz results showed one business model but AI insights discussed a different one. Implemented cache clearing on every new quiz submission to ensure fresh AI content generation. Enhanced AI prompts to explicitly focus on the correct top business model. Added debug logging to verify correct business model is passed to AI service.
- July 11, 2025. Replaced generic "Business model - Best Fit" text on business cards with engaging 2-sentence descriptions for each business model. Each description explains what the business model involves and why it's appealing, making the results page more informative and engaging for users.
- July 11, 2025. Implemented comprehensive fit category system for business model detail pages. Updated titles and content to reflect four categories: "Why [Business] Is the Best Fit For You" (70%+), "Why [Business] Is a Strong Fit For You" (50-69%), "Why [Business] Isn't the Best Fit For You" (30-49%), and "Why You Should Avoid [Business]" (<30%). AI generates category-specific content with appropriate tone and messaging. Success predictors section changes colors to red for poor/possible fit categories and shows "Why You Might Struggle" instead of positive predictors.
- July 11, 2025. Redesigned psychological fit section on business model detail pages. Replaced percentage-based "Your Overall Psychological Fit" with descriptive categories: "Excellent!" (Best Fit), "Strong" (Strong Fit), "Okay" (Possible Fit), "Poor" (Poor Fit). Removed all percentage displays from personality trait bars. Added intelligent AI-generated descriptions that compare user personality profiles with successful entrepreneurs, highlighting specific strengths for Best/Strong fits and gaps for Possible/Poor fits.
- July 11, 2025. Updated all AI prompts throughout the application to use direct second-person perspective ("you", "your") instead of third-person ("this user", "their") to create more personal, engaging AI-generated content. Changed prompts in aiService.ts for insights, recommendations, challenges, strategies, action plans, and motivational messages. Updated AI scoring service prompts to maintain consistent direct addressing of users.
- July 11, 2025. Configured Supabase database connection setup. Updated database configuration to be compatible with Supabase PostgreSQL while maintaining existing Drizzle ORM integration. System now supports seamless connection to Supabase with proper connection pooling.
- July 11, 2025. Enhanced paid user email functionality to work universally across all payment methods. Added comprehensive hasMadeAnyPayment() function that checks multiple payment flags (hasUnlockedAnalysis, hasBusinessAccess, hasPaidDownload, hasAnyPayment) to determine if user should receive full report emails. Updated all payment handlers to set hasAnyPayment flag. System now correctly delivers comprehensive AI-generated full reports to any user who has made any payment, while maintaining existing unpaid user email format.

## User Preferences

Preferred communication style: Simple, everyday language.
- Quiz status and history sections should be at the bottom of dashboard with smaller sizing
- Include descriptive placeholder text for quiz history when no attempts exist
- Remove signup functionality - accounts are automatically created when users purchase reports
- Login page should include disclaimer about quiz-to-purchase flow for account creation