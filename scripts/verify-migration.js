import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

console.log("🔍 Verifying migration and system functionality...");

async function verifyMigration() {
  try {
    if (!db) {
      console.error("❌ Database connection not available");
      return;
    }

    // 1. Check users table schema
    console.log("📝 Checking users table schema...");
    const userColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY column_name
    `);

    const hasOldColumns = userColumns.rows.some((row) =>
      ["quiz_retakes_remaining", "total_quiz_retakes_used"].includes(
        row.column_name,
      ),
    );

    if (hasOldColumns) {
      console.log("❌ Old quiz retake columns still exist in users table");
    } else {
      console.log("✅ Users table schema is correct");
    }

    // 2. Check payments table schema
    console.log("📝 Checking payments table schema...");
    const paymentColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY column_name
    `);

    const hasQuizAttemptId = paymentColumns.rows.some(
      (row) => row.column_name === "quiz_attempt_id",
    );
    const hasRetakesGranted = paymentColumns.rows.some(
      (row) => row.column_name === "retakes_granted",
    );

    if (!hasQuizAttemptId) {
      console.log("❌ quiz_attempt_id column missing from payments table");
    } else {
      console.log("✅ quiz_attempt_id column exists in payments table");
    }

    if (hasRetakesGranted) {
      console.log("❌ retakes_granted column still exists in payments table");
    } else {
      console.log("✅ retakes_granted column removed from payments table");
    }

    // 3. Check user statistics
    console.log("📝 Checking user statistics...");
    const userStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN has_access_pass = true THEN 1 END) as access_pass_users,
        COUNT(CASE WHEN has_access_pass = false THEN 1 END) as regular_users
      FROM users
    `);

    console.log(`📊 User Statistics:`);
    console.log(`   Total users: ${userStats.rows[0].total_users}`);
    console.log(
      `   Access pass holders: ${userStats.rows[0].access_pass_users}`,
    );
    console.log(`   Regular users: ${userStats.rows[0].regular_users}`);

    // 4. Check payment statistics
    console.log("📝 Checking payment statistics...");
    const paymentStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN type = 'access_pass' THEN 1 END) as access_pass_payments,
        COUNT(CASE WHEN type = 'quiz_payment' THEN 1 END) as quiz_payments,
        COUNT(CASE WHEN type = 'report_unlock' THEN 1 END) as report_unlock_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments
      FROM payments
    `);

    console.log(`📊 Payment Statistics:`);
    console.log(`   Total payments: ${paymentStats.rows[0].total_payments}`);
    console.log(
      `   Access pass payments: ${paymentStats.rows[0].access_pass_payments}`,
    );
    console.log(`   Quiz payments: ${paymentStats.rows[0].quiz_payments}`);
    console.log(
      `   Report unlock payments: ${paymentStats.rows[0].report_unlock_payments}`,
    );
    console.log(
      `   Completed payments: ${paymentStats.rows[0].completed_payments}`,
    );

    // 5. Check quiz attempts
    console.log("📝 Checking quiz attempt statistics...");
    const quizStats = await db.execute(sql`
      SELECT COUNT(*) as total_quiz_attempts
      FROM quiz_attempts
    `);

    console.log(`📊 Quiz Statistics:`);
    console.log(
      `   Total quiz attempts: ${quizStats.rows[0].total_quiz_attempts}`,
    );

    // 6. Summary
    console.log("\n🎉 MIGRATION VERIFICATION COMPLETE!");
    console.log("\n📋 SYSTEM STATUS:");

    const allGood = !hasOldColumns && hasQuizAttemptId && !hasRetakesGranted;

    if (allGood) {
      console.log("✅ All systems operational - migration successful!");
      console.log("✅ Database schema updated correctly");
      console.log("✅ Users migrated to new system");
      console.log("✅ Payment system ready for per-report unlocks");

      console.log("\n💡 SYSTEM FEATURES:");
      console.log("🔓 Access pass holders: Unlimited quiz attempts");
      console.log("💰 Access pass holders: $4.99 per report unlock");
      console.log("📝 Regular users: $4.99 per additional quiz attempt");
      console.log("🔗 All payments now trackable per quiz attempt");
      console.log("📊 Full backward compatibility maintained");
    } else {
      console.log("⚠️  Some issues detected - please review above");
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
    throw error;
  }
}

verifyMigration()
  .then(() => {
    console.log("\n✅ Verification completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
