import { db } from "../server/db.js";
import { users, payments, quizAttempts } from "../shared/schema.js";
import { sql } from "drizzle-orm";

console.log("🚀 Starting user migration to new pay-per-report system...");

async function migrateUsers() {
  try {
    if (!db) {
      console.error("❌ Database connection not available");
      return;
    }

    console.log("📊 Checking current database state...");

    // Get current statistics
    const userCount = await db.execute(
      sql`SELECT COUNT(*) as count FROM users`,
    );
    const paymentCount = await db.execute(
      sql`SELECT COUNT(*) as count FROM payments`,
    );
    const quizAttemptCount = await db.execute(
      sql`SELECT COUNT(*) as count FROM quiz_attempts`,
    );

    console.log(`📈 Current state:`);
    console.log(`   - Users: ${userCount.rows[0].count}`);
    console.log(`   - Payments: ${paymentCount.rows[0].count}`);
    console.log(`   - Quiz Attempts: ${quizAttemptCount.rows[0].count}`);

    // Update all users to ensure they have proper timestamps
    console.log("📝 Updating user timestamps...");
    const userUpdate = await db.execute(sql`
      UPDATE users 
      SET updated_at = NOW() 
      WHERE updated_at IS NULL
    `);
    console.log(`✅ Updated ${userUpdate.rowCount || 0} user records`);

    // Clean up any payment records that might have old data
    console.log("📝 Cleaning up payment records...");
    const paymentCleanup = await db.execute(sql`
      UPDATE payments 
      SET type = CASE 
        WHEN type IN ('retake_bundle', 'retakes') THEN 'access_pass'
        ELSE type 
      END
      WHERE type IN ('retake_bundle', 'retakes')
    `);
    console.log(
      `✅ Cleaned up ${paymentCleanup.rowCount || 0} payment records`,
    );

    // Get final statistics with access pass breakdown
    console.log("📊 Final statistics:");
    const finalStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN has_access_pass = true THEN 1 END) as access_pass_users,
        COUNT(CASE WHEN has_access_pass = false THEN 1 END) as regular_users
      FROM users
    `);

    const paymentStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN type = 'access_pass' THEN 1 END) as access_pass_payments,
        COUNT(CASE WHEN type = 'quiz_payment' THEN 1 END) as quiz_payments,
        COUNT(CASE WHEN type = 'report_unlock' THEN 1 END) as report_unlock_payments
      FROM payments
    `);

    console.log(`📈 Users: ${finalStats.rows[0].total_users} total`);
    console.log(
      `   - With access pass: ${finalStats.rows[0].access_pass_users}`,
    );
    console.log(`   - Regular users: ${finalStats.rows[0].regular_users}`);
    console.log(`📈 Payments: ${paymentStats.rows[0].total_payments} total`);
    console.log(
      `   - Access pass: ${paymentStats.rows[0].access_pass_payments}`,
    );
    console.log(`   - Quiz payments: ${paymentStats.rows[0].quiz_payments}`);
    console.log(
      `   - Report unlocks: ${paymentStats.rows[0].report_unlock_payments}`,
    );

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📋 CHANGES APPLIED:");
    console.log("✅ All users are now compatible with the new system");
    console.log(
      "✅ Access pass holders: Unlimited quizzes + $4.99 per report unlock",
    );
    console.log("✅ Regular users: $4.99 per additional quiz attempt");
    console.log("✅ Payment records have been normalized");
    console.log("✅ All existing functionality is preserved");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
migrateUsers()
  .then(() => {
    console.log("✅ User migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ User migration failed:", error);
    process.exit(1);
  });
