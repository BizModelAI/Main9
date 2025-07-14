#!/usr/bin/env tsx

// Force remove old columns from production database
import { db } from "../server/db.js";

console.log("🔧 Fixing production database schema...");

try {
  console.log("Database connection established");

  // Check if old columns exist
  const oldColumns = await db.execute(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('quiz_retakes_remaining', 'total_quiz_retakes_used')
  `);

  console.log(`Found ${oldColumns.rows.length} old columns to remove`);

  if (oldColumns.rows.length > 0) {
    console.log("Removing old columns...");

    // Remove old columns
    await db.execute(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS quiz_retakes_remaining,
      DROP COLUMN IF EXISTS total_quiz_retakes_used
    `);

    console.log("✅ Old columns removed successfully");
  } else {
    console.log("✅ No old columns found - schema is already correct");
  }

  // Verify the fix
  const remainingColumns = await db.execute(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('quiz_retakes_remaining', 'total_quiz_retakes_used')
  `);

  if (remainingColumns.rows.length === 0) {
    console.log("🎉 Production database schema fixed successfully!");
  } else {
    console.log("❌ Old columns still exist:", remainingColumns.rows);
  }
} catch (error) {
  console.error("❌ Error fixing production database:", error);
  process.exit(1);
}
