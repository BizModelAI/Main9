import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function applyMigration() {
  try {
    console.log("🚀 Applying AI content migration...");

    // Check if the column already exists
    console.log("📋 Checking if ai_content column exists...");
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quiz_attempts' 
      AND table_schema = 'public'
      AND column_name = 'ai_content'
    `);

    if (checkResult.length > 0) {
      console.log("✅ ai_content column already exists, migration not needed");
      return;
    }

    console.log("➕ Adding ai_content column to quiz_attempts table...");

    // Apply the migration
    await db.execute(
      sql`ALTER TABLE "quiz_attempts" ADD COLUMN "ai_content" jsonb`,
    );

    console.log("✅ Migration applied successfully!");
    console.log("🎉 AI content functionality is now fully enabled");

    // Verify the migration worked
    console.log("🔍 Verifying migration...");
    const verifyResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'quiz_attempts' 
      AND table_schema = 'public'
      AND column_name = 'ai_content'
    `);

    if (verifyResult.length > 0) {
      console.log("✅ Verification successful:", verifyResult[0]);
    } else {
      console.log("❌ Verification failed - column not found");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("Error details:", error.message);

    if (error.message.includes("already exists")) {
      console.log("💡 Column might already exist - this is not an error");
    }
  }
}

export { applyMigration };

// Run the migration
applyMigration();
