import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

console.log("🔧 Finalizing database schema...");

async function finalizeSchema() {
  try {
    if (!db) {
      console.error("❌ Database connection not available");
      return;
    }

    // Check if quiz_attempt_id column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'quiz_attempt_id'
    `);

    if (columnCheck.rows.length === 0) {
      console.log("📝 Adding quiz_attempt_id column to payments table...");
      await db.execute(sql`
        ALTER TABLE payments 
        ADD COLUMN quiz_attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE
      `);
      console.log("✅ Added quiz_attempt_id column");
    } else {
      console.log("✅ quiz_attempt_id column already exists");
    }

    // Check if old retakes_granted column exists and remove it
    const retakesCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'retakes_granted'
    `);

    if (retakesCheck.rows.length > 0) {
      console.log("📝 Removing old retakes_granted column...");
      await db.execute(sql`
        ALTER TABLE payments 
        DROP COLUMN retakes_granted
      `);
      console.log("✅ Removed retakes_granted column");
    } else {
      console.log("✅ retakes_granted column already removed");
    }

    // Check if old quiz retake columns exist in users table
    const userRetakeColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('quiz_retakes_remaining', 'total_quiz_retakes_used')
    `);

    if (userRetakeColumns.rows.length > 0) {
      console.log("📝 Removing old quiz retake columns from users table...");
      await db.execute(sql`
        ALTER TABLE users 
        DROP COLUMN IF EXISTS quiz_retakes_remaining,
        DROP COLUMN IF EXISTS total_quiz_retakes_used
      `);
      console.log("✅ Removed old quiz retake columns");
    } else {
      console.log("✅ Old quiz retake columns already removed");
    }

    console.log("🎉 Schema finalization completed!");
  } catch (error) {
    console.error("❌ Schema finalization failed:", error);
    throw error;
  }
}

finalizeSchema()
  .then(() => {
    console.log("✅ Schema finalization completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Schema finalization failed:", error);
    process.exit(1);
  });
