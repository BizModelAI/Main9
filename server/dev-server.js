import "dotenv/config";
import express from "express";
import { createServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting development server with Vite...");

const app = express();
const port = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function createDevServer() {
  try {
    // Create Vite server in middleware mode
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(__dirname, "..", "client"),
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // Health check endpoint
    app.get("/api/health", (req, res) => {
      res.json({ status: "Development server is running with Vite!" });
    });

    app.listen(port, () => {
      console.log(`Development server running on port ${port}`);
      console.log(`Vite dev server integrated successfully`);
    });
  } catch (error) {
    console.error("Failed to start Vite dev server:", error);

    // Fallback to static file serving
    console.log("Falling back to static file serving...");
    app.use(express.static(path.resolve(__dirname, "..", "client")));

    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "..", "client", "index.html"));
    });

    app.listen(port, () => {
      console.log(`Fallback server running on port ${port}`);
    });
  }
}

createDevServer();
