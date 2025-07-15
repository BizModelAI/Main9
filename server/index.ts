import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { createServer } from "http";
import { registerRoutes } from "./routes.js";
import { setupAuthRoutes } from "./auth.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { storage } from "./storage.js";

const MemoryStoreSession = MemoryStore(session);

const app = express();

// Session configuration with persistent storage
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// JSON parsing for all routes except Stripe webhooks
app.use((req, res, next) => {
  if (req.path === "/api/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Raw body parsing specifically for Stripe webhooks
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

// URL encoded parsing for form data
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Setup authentication routes
    setupAuthRoutes(app);

    const server = createServer(app);
    await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);

        // Start data cleanup job - runs every hour
        setupDataCleanupJob();
      },
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

function setupDataCleanupJob() {
  // Run cleanup after a delay to allow server to start properly
  setTimeout(() => {
    cleanupExpiredData();
  }, 5000); // 5 second delay

  // Then run every hour (3600000 ms)
  setInterval(cleanupExpiredData, 60 * 60 * 1000);

  log("Data cleanup job scheduled to run every hour (starting in 5 seconds)");
}

async function cleanupExpiredData() {
  try {
    log("Running expired data cleanup...");
    await storage.cleanupExpiredData();
    log("Expired data cleanup completed successfully");
  } catch (error) {
    console.error("Error during scheduled data cleanup:", error);
    // Don't throw the error - just log it and continue
    // This prevents the cleanup job from crashing the server
  }
}
