// Vercel API route wrapper for /api/auth/signup
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Set CORS headers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Vercel signup wrapper called");

    // Validate environment
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL not configured in Vercel");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Database not configured",
      });
    }

    // Import and call the main signup logic
    const { setupAuthRoutes } = await import("../../server/auth.js");
    const express = await import("express");

    // Create a mini express app just for this route
    const app = express.default();
    app.use(express.json());

    // Set up the auth routes
    setupAuthRoutes(app);

    // Create mock request/response objects
    const mockReq: any = {
      method: "POST",
      body: req.body,
      sessionID: `vercel_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      session: {},
    };

    const mockRes: any = {
      headersSent: false,
      statusCode: 200,
      headers: {},
      header: (name: string, value: string) => {
        mockRes.headers[name] = value;
      },
      status: (code: number) => {
        mockRes.statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        res.status(mockRes.statusCode).json(data);
      },
    };

    // Find and call the signup handler directly
    const bcrypt = await import("bcrypt");
    const { storage } = await import("../../server/storage.js");

    // Direct signup logic (simplified version of auth.ts)
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    // Parse name into firstName and lastName
    const [firstName, ...lastNameParts] = name.trim().split(" ");
    const lastName = lastNameParts.length > 0 ? lastNameParts.join(" ") : "";

    // Basic email validation
    if (!email.includes("@") || email.length < 5) {
      return res
        .status(400)
        .json({ error: "Please enter a valid email address" });
    }

    // Password validation
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        error:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(email);
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Create session ID
    const sessionId = `vercel_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data
    await storage.storeUnpaidUserEmail(sessionId, email, {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      quizData: req.body.quizData || {},
    });

    // Return success response
    return res.status(200).json({
      id: `temp_${sessionId}`,
      username: email,
      email: email,
      firstName: firstName,
      lastName: lastName,
      hasAccessPass: false,
      quizRetakesRemaining: 0,
      isTemporary: true,
    });
  } catch (error) {
    console.error("Vercel signup error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: "Signup failed. Please try again.",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}
