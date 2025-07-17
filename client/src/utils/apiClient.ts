// Centralized API client for all backend calls with type safety

/**
 * API endpoint constants
 * NOTE: All routes must match backend implementation in server/routes.ts and server/auth.ts
 */
export const API_ROUTES = {
  GENERATE_PDF: "/api/generate-pdf",
  SEND_QUIZ_RESULTS: "/api/send-quiz-results",
  GENERATE_AI_BUSINESS_FIT: "/api/ai-business-fit-analysis",
  GENERATE_PERSONALITY_ANALYSIS: "/api/ai-personality-analysis",
  GENERATE_INCOME_PROJECTIONS: "/api/generate-income-projections",
  SEND_WELCOME_EMAIL: "/api/send-welcome-email",
  // Removed: EMAIL_RESULTS, SEND_FULL_REPORT (no backend implementation)
  // Add more as needed, but ensure backend route exists
} as const;

export type ApiRoute = typeof API_ROUTES[keyof typeof API_ROUTES];

/**
 * Generic API response type
 */
export type ApiResponse<T = any> = Promise<T>;

/**
 * POST request with type safety
 */
export async function apiPost<T = any, B = any>(url: ApiRoute, data: B, options: RequestInit = {}): ApiResponse<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(data),
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * GET request with type safety
 */
export async function apiGet<T = any>(url: ApiRoute, options: RequestInit = {}): ApiResponse<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * PUT request with type safety
 */
export async function apiPut<T = any, B = any>(url: ApiRoute, data: B, options: RequestInit = {}): ApiResponse<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(data),
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * DELETE request with type safety
 */
export async function apiDelete<T = any>(url: ApiRoute, options: RequestInit = {}): ApiResponse<T> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  return response.json();
}
