import express from "express";

type Express = express.Express;
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.log("� Starting in PRODUCTION mode - serving static assets...");

    // In production, serve static assets from dist/public
    const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

    if (!fs.existsSync(distPath)) {
      console.error(`❌ Production build not found at: ${distPath}`);
      console.log("Please run 'npm run build' first");
      throw new Error("Production build required");
    }

    // Serve static assets
    app.use(express.static(distPath));

    // Serve index.html for all non-API routes
    app.use("*", async (req: Request, res: Response, next: NextFunction) => {
      // Skip API routes
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }

      try {
        const indexPath = path.resolve(distPath, "index.html");
        const template = await fs.promises.readFile(indexPath, "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        console.error("Error serving production HTML:", e);
        next(e);
      }
    });

    console.log("✅ Production server started successfully!");
  } else {
    console.log("Starting Vite development server...");

    try {
      const serverOptions = {
        middlewareMode: true,
        hmr: { server },
        allowedHosts: true as const,
      };

      const vite = await createViteServer({
        configFile: path.resolve(import.meta.dirname, "..", "vite.config.ts"),
        customLogger: {
          ...viteLogger,
          error: (msg, options) => {
            console.error("Vite error:", msg);
            // Don't exit process on vite errors
          },
        },
        server: serverOptions,
        appType: "custom",
      });

      app.use(vite.middlewares);
      app.use("*", async (req: Request, res: Response, next: NextFunction) => {
        const url = req.originalUrl;

        try {
          const clientTemplate = path.resolve(
            import.meta.dirname,
            "..",
            "client",
            "index.html",
          );

          // always reload the index.html file from disk incase it changes
          let template = await fs.promises.readFile(clientTemplate, "utf-8");
          template = template.replace(
            `src="/src/main.tsx"`,
            `src="/src/main.tsx?v=${nanoid()}"`,
          );
          const page = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(page);
        } catch (e) {
          console.error("Error transforming HTML:", e);
          next(e);
        }
      });

      console.log("✅ Vite development server started successfully!");
    } catch (error) {
      console.error("❌ Failed to start Vite:", error);
      // Fallback to static serving
      console.log("Falling back to static HTML serving...");
      app.use("*", async (req: Request, res: Response, next: NextFunction) => {
        try {
          const clientTemplate = path.resolve(
            import.meta.dirname,
            "..",
            "client",
            "index.html",
          );
          let template = await fs.promises.readFile(clientTemplate, "utf-8");
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          console.error("Error serving HTML:", e);
          next(e);
        }
      });
    }
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
