// Proper Admin Authentication Middleware
import { Request, Response, NextFunction } from "express";
import { createErrorResponse } from "../utils/errorHandler.js";

interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    authenticated: boolean;
    timestamp: number;
  };
}

// Admin session cache to prevent repeated authentication
const adminSessions = new Map<string, { timestamp: number; id: string }>();
const ADMIN_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// Cleanup expired admin sessions
setInterval(
  () => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionKey, session] of adminSessions.entries()) {
      if (now - session.timestamp > ADMIN_SESSION_DURATION) {
        adminSessions.delete(sessionKey);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `🧹 Admin session cleanup: removed ${cleanedCount} expired sessions`,
      );
    }
  },
  15 * 60 * 1000,
); // Clean every 15 minutes

/**
 * Admin authentication middleware with proper security
 */
export function requireAdminAuth(
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    // Get admin credentials from headers
    const adminKey = req.headers["x-admin-key"] as string;
    const adminId = (req.headers["x-admin-id"] as string) || "admin";

    // Validate admin key
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      console.warn(`🚫 Unauthorized admin access attempt from ${req.ip}:`, {
        headers: {
          userAgent: req.headers["user-agent"],
          origin: req.headers.origin,
          referer: req.headers.referer,
        },
        timestamp: new Date().toISOString(),
      });

      return res
        .status(401)
        .json(
          createErrorResponse(
            "Admin authentication required",
            "Unauthorized access",
            "ADMIN_AUTH_REQUIRED",
          ),
        );
    }

    // Check for valid admin API key configuration
    if (!process.env.ADMIN_API_KEY) {
      console.error("❌ ADMIN_API_KEY not configured in environment");
      return res
        .status(500)
        .json(
          createErrorResponse(
            "Admin authentication not configured",
            "Server configuration error",
            "ADMIN_AUTH_NOT_CONFIGURED",
          ),
        );
    }

    // Create session key for this admin
    const sessionKey = `${req.ip}-${adminId}-${req.headers["user-agent"]}`;
    const now = Date.now();

    // Check existing session
    const existingSession = adminSessions.get(sessionKey);
    if (
      existingSession &&
      now - existingSession.timestamp < ADMIN_SESSION_DURATION
    ) {
      // Valid existing session - refresh timestamp
      existingSession.timestamp = now;
    } else {
      // Create new session
      adminSessions.set(sessionKey, {
        timestamp: now,
        id: adminId,
      });

      console.log(`✅ Admin authenticated: ${adminId} from ${req.ip}`);
    }

    // Add admin info to request
    req.admin = {
      id: adminId,
      authenticated: true,
      timestamp: now,
    };

    // Log admin action for audit trail
    console.log(
      `🔐 Admin action: ${req.method} ${req.path} by ${adminId} from ${req.ip}`,
    );

    next();
  } catch (error) {
    console.error("❌ Admin authentication error:", error);
    res
      .status(500)
      .json(
        createErrorResponse(
          "Authentication system error",
          "Internal server error",
          "ADMIN_AUTH_ERROR",
        ),
      );
  }
}

/**
 * Admin action logging middleware
 */
export function logAdminAction(action: string) {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    console.log(`📋 Admin Action Log: ${action}`, {
      adminId: req.admin?.id || "unknown",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
      body:
        req.method === "POST"
          ? JSON.stringify(req.body).substring(0, 200)
          : "N/A",
    });

    next();
  };
}

/**
 * Rate limiting for admin endpoints
 */
const adminRateLimit = new Map<string, number[]>();

export function adminRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000,
) {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    const adminId = req.admin?.id || req.ip;
    const now = Date.now();

    const requests = adminRateLimit.get(adminId) || [];
    const recentRequests = requests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      console.warn(`🚫 Admin rate limit exceeded for ${adminId}`);
      return res
        .status(429)
        .json(
          createErrorResponse(
            "Too many admin requests",
            "Rate limit exceeded",
            "ADMIN_RATE_LIMIT",
          ),
        );
    }

    recentRequests.push(now);
    adminRateLimit.set(adminId, recentRequests);

    next();
  };
}
