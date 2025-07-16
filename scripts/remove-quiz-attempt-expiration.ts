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
 * Remove expiresAt column from quiz_attempts table
 * (Quiz attempts should expire via user CASCADE delete, not independently)
 */
async function removeQuizAttemptExpiration() {
  console.log(" Removing unnecessary expires_at column from quiz_attempts table...",
  );

  try {
    // Check if the column exists
    const columnExists = await client`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_attempts' 
        AND column_name = 'expires_at'
      )
    `;

    if (columnExists[0].exists) {
      // Remove the expiresAt column from quiz_attempts table
      await client`
        ALTER TABLE quiz_attempts 
        DROP COLUMN IF EXISTS expires_at
      `;

      console.log(
        "✅ Successfully removed expires_at column from quiz_attempts table",
      );
      console.log(" Quiz attempts now expire via CASCADE delete when user expires",
      );
    } else {
      console.log(
        "✅ expires_at column doesn't exist in quiz_attempts table - nothing to remove",
      );
    }

    // Show summary
    const totalAttempts =
      await client`SELECT COUNT(*) as count FROM quiz_attempts`;

    console.log(" Summary:");
    console.log(`   - Total quiz attempts: ${totalAttempts[0].count}`);
    console.log(`   - Expiration: Via user CASCADE delete only`);
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the migration
if (require.main === module) {
  removeQuizAttemptExpiration()
    .then(() => {
      console.log(" Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error(" Migration failed:", error);
      process.exit(1);
    });
}

export { removeQuizAttemptExpiration };
