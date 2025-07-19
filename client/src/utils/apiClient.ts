// Centralized API client for all backend calls with type safety

/**
 * API endpoint constants
 * NOTE: All routes must match backend implementation in server/routes.ts and server/auth.ts
 */
export const API_ROUTES = {
  // Auth routes
  AUTH_ME: "/api/auth/me",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_SIGNUP: "/api/auth/signup",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_PROFILE: "/api/auth/profile",
  AUTH_ACCOUNT: "/api/auth/account",
  AUTH_FORGOT_PASSWORD: "/api/auth/forgot-password",
  AUTH_RESET_PASSWORD: "/api/auth/reset-password",
  AUTH_CHANGE_PASSWORD: "/api/auth/change-password",
  AUTH_UNSUBSCRIBE: "/api/auth/unsubscribe",
  AUTH_VERIFY_RESET_TOKEN: "/api/auth/verify-reset-token",
  AUTH_LATEST_QUIZ_DATA: "/api/auth/latest-quiz-data",
  AUTH_SAVE_QUIZ_DATA: "/api/auth/save-quiz-data",
  
  // Quiz and data routes
  SAVE_QUIZ_DATA: "/api/save-quiz-data",
  QUIZ_ATTEMPT: "/api/quiz-attempt",
  QUIZ_ATTEMPTS: "/api/quiz-attempts",
  CHECK_EXISTING_ATTEMPTS: "/api/check-existing-attempts",
  
  // AI and analysis routes
  OPENAI_CHAT: "/api/openai-chat",
  OPENAI_STATUS: "/api/openai-status",
  AI_BUSINESS_FIT_ANALYSIS: "/api/ai-business-fit-analysis",
  AI_PERSONALITY_ANALYSIS: "/api/ai-personality-analysis",
  AI_INSIGHTS: "/api/ai-insights",
  ANALYZE_SKILLS: "/api/analyze-skills",
  GENERATE_INCOME_PROJECTIONS: "/api/generate-income-projections",
  GENERATE_FULL_REPORT: "/api/generate-full-report",
  
  // Payment routes
  CREATE_REPORT_UNLOCK_PAYMENT: "/api/create-report-unlock-payment",
  CAPTURE_PAYPAL_PAYMENT: "/api/capture-paypal-payment",
  STRIPE_CONFIG: "/api/stripe-config",
  PAYPAL_CONFIG: "/api/paypal-config",
  USER_PRICING: "/api/user-pricing",
  STRIPE_WEBHOOK: "/api/stripe/webhook",
  
  // Business and resources
  BUSINESS_RESOURCES: "/api/business-resources",
  
  // PDF and email routes
  GENERATE_PDF: "/api/generate-pdf",
  SEND_QUIZ_RESULTS: "/api/send-quiz-results",
  SEND_WELCOME_EMAIL: "/api/send-welcome-email",
  SEND_FULL_REPORT: "/api/send-full-report",
  EMAIL_RESULTS: "/api/email-results",
  EMAIL_LINK: "/api/email-link",
  
  // Admin routes
  ADMIN_PAYMENTS: "/api/admin/payments",
  ADMIN_REFUNDS: "/api/admin/refunds",
  ADMIN_REFUND: "/api/admin/refund",
  ADMIN_ALL_EMAILS: "/api/admin/all-emails",
  ADMIN_EMAILS_CSV: "/api/admin/emails-csv",
  
  // Contact and other
  CONTACT: "/api/contact",
  HEALTH: "/api/health",
} as const;

export type ApiRoute = typeof API_ROUTES[keyof typeof API_ROUTES];

/**
 * Generic API response type
 */
export type ApiResponse<T = any> = Promise<T>;

/**
 * Enhanced error handling for API requests
 */
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base request configuration
 */
const baseRequestConfig: RequestInit = {
  credentials: 'include', // Include cookies for session management
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Enhanced error handler
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // If JSON parsing fails, use status text
      errorData = { error: response.statusText };
    }
    
    throw new ApiError(
      errorData.error || `Request failed: ${response.status}`,
      response.status,
      errorData
    );
  }
  
  return response.json();
}

/**
 * POST request with type safety and enhanced error handling
 */
export async function apiPost<T = any, B = any>(
  url: ApiRoute, 
  data: B, 
  options: RequestInit = {}
): ApiResponse<T> {
  const response = await fetch(url, {
    ...baseRequestConfig,
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
  
  return handleResponse<T>(response);
}

/**
 * GET request with type safety and enhanced error handling
 */
export async function apiGet<T = any>(
  url: ApiRoute, 
  options: RequestInit = {}
): ApiResponse<T> {
  const response = await fetch(url, {
    ...baseRequestConfig,
    method: 'GET',
    ...options,
  });
  
  return handleResponse<T>(response);
}

/**
 * PUT request with type safety and enhanced error handling
 */
export async function apiPut<T = any, B = any>(
  url: ApiRoute, 
  data: B, 
  options: RequestInit = {}
): ApiResponse<T> {
  const response = await fetch(url, {
    ...baseRequestConfig,
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
  
  return handleResponse<T>(response);
}

/**
 * DELETE request with type safety and enhanced error handling
 */
export async function apiDelete<T = any>(
  url: ApiRoute, 
  options: RequestInit = {}
): ApiResponse<T> {
  const response = await fetch(url, {
    ...baseRequestConfig,
    method: 'DELETE',
    ...options,
  });
  
  return handleResponse<T>(response);
}

/**
 * PATCH request with type safety and enhanced error handling
 */
export async function apiPatch<T = any, B = any>(
  url: ApiRoute, 
  data: B, 
  options: RequestInit = {}
): ApiResponse<T> {
  const response = await fetch(url, {
    ...baseRequestConfig,
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  });
  
  return handleResponse<T>(response);
}

// Export the error class for use in components
export { ApiError };
