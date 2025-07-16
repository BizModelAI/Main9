#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

/**
 * Add expiresAt column to quiz_attempts table for data retention
 */
async function addQuizAttemptExpiration() {
  console.log("🔧 Adding expiresAt column to quiz_attempts table...");

  try {
    // Add the expiresAt column to quiz_attempts table
    await client`
      ALTER TABLE quiz_attempts 
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP
    `;

    console.log(
      "✅ Successfully added expires_at column to quiz_attempts table",
    );

    // Set expiration for existing quiz attempts of unpaid users (3 months from completed_at)
    console.log(
      "🔄 Setting expiration for existing quiz attempts of unpaid users...",
    );

    const result = await client`
      UPDATE quiz_attempts 
      SET expires_at = completed_at + INTERVAL '90 days'
      WHERE expires_at IS NULL 
      AND user_id IN (
        SELECT id FROM users 
        WHERE is_paid = false OR is_temporary = true
      )
    `;

    console.log(`✅ Set expiration for ${result.count} existing quiz attempts`);

    // Show summary
    const totalAttempts =
      await client`SELECT COUNT(*) as count FROM quiz_attempts`;
    const withExpiration =
      await client`SELECT COUNT(*) as count FROM quiz_attempts WHERE expires_at IS NOT NULL`;

    console.log(`📊 Summary:`);
    console.log(`   - Total quiz attempts: ${totalAttempts[0].count}`);
    console.log(`   - With expiration set: ${withExpiration[0].count}`);
    console.log(
      `   - Permanent (paid users): ${totalAttempts[0].count - withExpiration[0].count}`,
    );
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the migration
if (require.main === module) {
  addQuizAttemptExpiration()
    .then(() => {
      console.log("👋 Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { addQuizAttemptExpiration };
