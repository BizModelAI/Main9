import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not set. Database features will be disabled.");
}

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      // Optimized configuration for concurrent users
      max: 20, // Increased pool size for concurrent requests
      min: 2, // Minimum connections to keep alive
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // acquireTimeoutMillis: 15000, // Time to wait for connection from pool (not a valid Pool option)
      // Enable statement timeout for long-running queries
      statement_timeout: 30000, // 30 second query timeout
      query_timeout: 30000, // 30 second query timeout
    })
  : null;

// Add connection error handling
if (pool) {
  pool.on("error", (err) => {
    console.error("Database pool error:", err);
  });

  pool.on("connect", () => {
    console.log("Database connection established");
  });
}

// Test database connection asynchronously (non-blocking)
if (pool) {
  setImmediate(() => {
    Promise.race([
      pool.connect(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          5000,
        ),
      ),
    ])
      .then((client: any) => {
        console.log("✅ Database connection test successful");
        if (client && typeof client.release === "function") {
          client.release();
        }
      })
      .catch((err) => {
        console.error("❌ Database connection test failed:", err.message);
        console.log("Continuing server startup without database...");
      });
  });
} else {
  console.log("⚠️ Database pool not created - DATABASE_URL not available");
}

export const db = pool ? drizzle({ client: pool, schema }) : null;

console.log("Database module loaded successfully");
