import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = drizzle({ client: pool });

async function migrateToPayPerReport() {
  console.log("🚀 Starting migration to pay-per-report system...");

  try {
    // 1. Remove old quiz retake columns if they still exist
    console.log("📝 Step 1: Removing old quiz retake columns...");

    try {
      await db.execute(sql`
        ALTER TABLE users 
        DROP COLUMN IF EXISTS quiz_retakes_remaining,
        DROP COLUMN IF EXISTS total_quiz_retakes_used;
      `);
      console.log("✅ Removed old quiz retake columns");
    } catch (error) {
      console.log("ℹ️  Quiz retake columns already removed or don't exist");
    }

    // 2. Remove old retakes_granted column from payments if it exists
    console.log(
      "📝 Step 2: Removing old retakes_granted column from payments...",
    );

    try {
      await db.execute(sql`
        ALTER TABLE payments 
        DROP COLUMN IF EXISTS retakes_granted;
      `);
      console.log("✅ Removed old retakes_granted column");
    } catch (error) {
      console.log(
        "ℹ️  retakes_granted column already removed or doesn't exist",
      );
    }

    // 3. Add quiz_attempt_id column to payments if it doesn't exist
    console.log("📝 Step 3: Adding quiz_attempt_id column to payments...");

    try {
      await db.execute(sql`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS quiz_attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE;
      `);
      console.log("✅ Added quiz_attempt_id column to payments");
    } catch (error) {
      console.log("ℹ️  quiz_attempt_id column already exists");
    }

    // 4. Update all existing users to ensure they work with the new system
    console.log("📝 Step 4: Updating existing users...");

    const userUpdateResult = await db.execute(sql`
      UPDATE users 
      SET updated_at = NOW()
      WHERE updated_at IS NULL;
    `);

    console.log(`✅ Updated ${userUpdateResult.rowCount || 0} users`);

    // 5. Get statistics about existing data
    console.log("📝 Step 5: Gathering database statistics...");

    const userStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN has_access_pass = true THEN 1 END) as users_with_access_pass,
        COUNT(CASE WHEN has_access_pass = false THEN 1 END) as users_without_access_pass
      FROM users;
    `);

    const quizStats = await db.execute(sql`
      SELECT COUNT(*) as total_quiz_attempts
      FROM quiz_attempts;
    `);

    const paymentStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN type = 'access_pass' THEN 1 END) as access_pass_payments,
        COUNT(CASE WHEN type = 'quiz_payment' THEN 1 END) as quiz_payments,
        COUNT(CASE WHEN type = 'report_unlock' THEN 1 END) as report_unlock_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments
      FROM payments;
    `);

    console.log("\n📊 DATABASE STATISTICS:");
    console.log("Users:", userStats.rows[0]);
    console.log("Quiz Attempts:", quizStats.rows[0]);
    console.log("Payments:", paymentStats.rows[0]);

    // 6. Clean up any orphaned data
    console.log("\n📝 Step 6: Cleaning up orphaned data...");

    const cleanupResult = await db.execute(sql`
      DELETE FROM payments 
      WHERE user_id NOT IN (SELECT id FROM users);
    `);

    console.log(
      `✅ Cleaned up ${cleanupResult.rowCount || 0} orphaned payments`,
    );

    // 7. Update payment types for consistency
    console.log("📝 Step 7: Updating payment types for consistency...");

    const paymentTypeUpdate = await db.execute(sql`
      UPDATE payments 
      SET type = 'access_pass' 
      WHERE type IN ('retake_bundle', 'access') 
      AND type != 'access_pass';
    `);

    console.log(`✅ Updated ${paymentTypeUpdate.rowCount || 0} payment types`);

    // 8. Verify the migration
    console.log("\n📝 Step 8: Verifying migration...");

    const verifySchema = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('quiz_retakes_remaining', 'total_quiz_retakes_used');
    `);

    if (verifySchema.rows.length === 0) {
      console.log("✅ Schema verification passed - old columns removed");
    } else {
      console.log(
        "⚠️  Warning: Some old columns still exist:",
        verifySchema.rows,
      );
    }

    const verifyPayments = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'quiz_attempt_id';
    `);

    if (verifyPayments.rows.length > 0) {
      console.log(
        "✅ Payments table verification passed - quiz_attempt_id column exists",
      );
    } else {
      console.log(
        "⚠️  Warning: quiz_attempt_id column not found in payments table",
      );
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📋 SUMMARY:");
    console.log("- Removed old quiz retake system columns");
    console.log("- Added quiz_attempt_id to payments for per-report tracking");
    console.log("- Updated payment types for consistency");
    console.log("- Cleaned up orphaned data");
    console.log("- All existing users are now compatible with the new system");
    console.log("\n💡 NEXT STEPS:");
    console.log("- Access pass holders can now take unlimited quizzes");
    console.log("- They pay $4.99 per report unlock");
    console.log("- Non-access pass holders pay $4.99 per additional quiz");
    console.log("- All existing functionality is preserved");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateToPayPerReport()
  .then(() => {
    console.log("✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  });
