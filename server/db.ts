import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
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

// Auto-apply migration for ai_content column
async function ensureAIContentColumn() {
  if (!db) return;

  try {
    console.log("🔍 Checking for ai_content column migration...");

    // Check if column exists
    const checkResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'quiz_attempts'
      AND table_schema = 'public'
      AND column_name = 'ai_content'
    `);

    if (checkResult.length === 0) {
      console.log("➕ Applying ai_content column migration...");
      await db.execute(
        sql`ALTER TABLE "quiz_attempts" ADD COLUMN "ai_content" jsonb`,
      );
      console.log("✅ AI content migration applied successfully!");
    } else {
      console.log("✅ AI content column already exists");
    }
  } catch (error) {
    console.error("⚠️ AI content migration check failed:", error.message);
    if (error.message.includes("already exists")) {
      console.log("💡 Column already exists - migration not needed");
    }
  }
}

// Apply migration after database connection is established
if (pool) {
  setImmediate(() => {
    // Wait a bit for connection to be ready, then apply migration
    setTimeout(() => {
      ensureAIContentColumn().catch((err) => {
        console.error("Migration application failed:", err.message);
      });
    }, 2000);

    // Run verification test after migration (for testing purposes)
    setTimeout(async () => {
      try {
        const { verifySupabaseIntegration } = await import(
          "../verify-supabase-ai-system.js"
        );
        await verifySupabaseIntegration();
      } catch (error) {
        console.log("Verification test skipped:", error.message);
      }
    }, 4000);
  });
}

console.log("Database module loaded successfully");
