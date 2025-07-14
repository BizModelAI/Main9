import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting simple server...");

const app = express();
const port = 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running!" });
});

// Serve static files from client directory
app.use(express.static(path.resolve(__dirname, "..", "client")));

// Catch-all handler for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "client", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
