import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sqlClient = neon(dbUrl);
const db = drizzle(sqlClient);

async function fixDatabaseSchema() {
  console.log(" Fixing missing database columns for login...");

  try {
    // Add the missing columns to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS session_id TEXT,
      ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE NOT NULL,
      ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE NOT NULL,
      ADD COLUMN IF NOT EXISTS temp_quiz_data JSONB,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP
    `);

    // Mark all existing users as paid (since they're already in the system)
    await db.execute(sql`
      UPDATE users 
      SET is_paid = TRUE, is_temporary = FALSE 
      WHERE is_paid IS NULL OR is_temporary IS NULL
    `);

    console.log("✅ Database schema fixed! Login should now work.");

    // Check if the caseyedunham@gmail.com user exists
    const user = await db.execute(sql`
      SELECT id, email, name, is_paid, is_temporary 
      FROM users 
      WHERE email = 'caseyedunham@gmail.com'
    `);

    if (user.length > 0) {
      console.log("✅ Found user caseyedunham@gmail.com:", user[0]);
    } else {
      console.log("❌ User caseyedunham@gmail.com not found in database");
      console.log(" Checking all users in database...");
      const allUsers = await db.execute(
        sql`SELECT id, email, name FROM users LIMIT 10`,
      );
      console.log("Users found:", allUsers);
    }
  } catch (error) {
    console.error("❌ Error fixing database schema:", error);
    throw error;
  }
}

// Run the fix
fixDatabaseSchema()
  .then(() => {
    console.log("Database fix completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(" Database fix failed:", error);
    process.exit(1);
  });
