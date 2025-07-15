import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { users, unpaidUserEmails } from "../shared/schema.js";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sqlClient = neon(dbUrl);
const db = drizzle(sqlClient);

async function consolidateUsersTables() {
  console.log("🔄 Starting user tables consolidation migration...");

  try {
    // Step 1: Add new columns to users table if they don't exist
    console.log("📝 Adding new columns to users table...");

    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS session_id TEXT,
      ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE NOT NULL,
      ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE NOT NULL,
      ADD COLUMN IF NOT EXISTS temp_quiz_data JSONB,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP
    `);

    // Step 2: Migrate data from unpaidUserEmails to users table
    console.log("📦 Migrating unpaid user data to users table...");

    // Get all unpaid user emails that haven't expired
    const unpaidUsers = await db
      .select()
      .from(unpaidUserEmails)
      .where(sql`${unpaidUserEmails.expiresAt} > NOW()`);

    console.log(`Found ${unpaidUsers.length} active unpaid users to migrate`);

    // Migrate each unpaid user to the users table
    for (const unpaidUser of unpaidUsers) {
      try {
        // Check if a user with this email already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(sql`${users.email} = ${unpaidUser.email}`)
          .limit(1);

        if (existingUser.length > 0) {
          // User already exists, update their temporary data
          console.log(`Updating existing user: ${unpaidUser.email}`);
          await db
            .update(users)
            .set({
              sessionId: unpaidUser.sessionId,
              isTemporary: true,
              tempQuizData: unpaidUser.quizData,
              expiresAt: unpaidUser.expiresAt,
            })
            .where(sql`${users.email} = ${unpaidUser.email}`);
        } else {
          // Create new user record
          console.log(`Creating new temporary user: ${unpaidUser.email}`);
          await db.insert(users).values({
            email: unpaidUser.email,
            password: "", // Temporary users don't need passwords initially
            name: null,
            sessionId: unpaidUser.sessionId,
            isPaid: false,
            isTemporary: true,
            tempQuizData: unpaidUser.quizData,
            expiresAt: unpaidUser.expiresAt,
            createdAt: unpaidUser.createdAt,
          });
        }
      } catch (error) {
        console.error(`Error migrating user ${unpaidUser.email}:`, error);
        // Continue with other users
      }
    }

    // Step 3: Mark all existing non-temporary users as paid
    console.log("✅ Marking existing users as paid...");
    await db
      .update(users)
      .set({ isPaid: true, isTemporary: false })
      .where(sql`${users.isTemporary} = FALSE OR ${users.isTemporary} IS NULL`);

    console.log("🎉 User tables consolidation completed successfully!");
    console.log("📋 Summary:");
    console.log(`  - Migrated ${unpaidUsers.length} unpaid users`);
    console.log("  - Marked existing users as paid");
    console.log("  - Added new columns to users table");
    console.log("");
    console.log("⚠️  Next steps:");
    console.log("  1. Update application code to use consolidated users table");
    console.log("  2. Test the application thoroughly");
    console.log("  3. Drop the unpaid_user_emails table when ready:");
    console.log("     DROP TABLE unpaid_user_emails;");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
consolidateUsersTables()
  .then(() => {
    console.log("✅ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
