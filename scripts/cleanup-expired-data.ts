#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, quizAttempts } from "../shared/schema.js";
import { lt, and, eq } from "drizzle-orm";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

/**
 * Cleanup expired data for unpaid users
 * - Deletes expired temporary users (those who provided email but didn't upgrade after 3 months)
 * - Deletes expired quiz attempts for unpaid users
 */
async function cleanupExpiredData() {
  console.log("� Starting cleanup of expired unpaid user data...");

  const now = new Date();
  console.log(`Current time: ${now.toISOString()}`);

  try {
    // 1. Find expired temporary users
    const expiredUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isTemporary, true),
          eq(users.isPaid, false),
          lt(users.expiresAt, now),
        ),
      );

    console.log("� Found ${expiredUsers.length} expired temporary users");

    if (expiredUsers.length > 0) {
      // Log details of users being deleted (for audit purposes)
      expiredUsers.forEach((user) => {
        console.log("�️  Deleting expired user: ${user.email} (ID: ${user.id}, expired: ${user.expiresAt})",
        );
      });

      // 2. Delete expired temporary users (cascade will delete their quiz attempts)
      const deletedUsers = await db
        .delete(users)
        .where(
          and(
            eq(users.isTemporary, true),
            eq(users.isPaid, false),
            lt(users.expiresAt, now),
          ),
        )
        .returning();

      console.log(`✅ Deleted ${deletedUsers.length} expired temporary users`);
    }

    // 3. Summary
    const totalDeleted = expiredUsers.length;
    if (totalDeleted > 0) {
      console.log("� Cleanup complete! Deleted ${totalDeleted} expired users (quiz attempts deleted via CASCADE)",
      );
    } else {
      console.log(`✨ No expired data found - database is clean!`);
    }

    // 4. Show current database statistics
    const activeTemporaryUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.isTemporary, true), eq(users.isPaid, false)));

    const activeQuizAttempts = await db.select().from(quizAttempts);

    console.log("� Current database state:");
    console.log(`   - Active temporary users: ${activeTemporaryUsers.length}`);
    console.log(`   - Total quiz attempts: ${activeQuizAttempts.length}`);

    // Show upcoming expirations
    const soonToExpire = activeTemporaryUsers.filter(
      (user) =>
        user.expiresAt &&
        new Date(user.expiresAt).getTime() - now.getTime() <
          7 * 24 * 60 * 60 * 1000, // 7 days
    );

    if (soonToExpire.length > 0) {
      console.log("️  ${soonToExpire.length} users will expire within 7 days:",
      );
      soonToExpire.forEach((user) => {
        const daysLeft = Math.ceil(
          (new Date(user.expiresAt!).getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000),
        );
        console.log(`   - ${user.email}: ${daysLeft} days left`);
      });
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupExpiredData()
    .then(() => {
      console.log("� Cleanup script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("� Cleanup script failed:", error);
      process.exit(1);
    });
}

export { cleanupExpiredData };
