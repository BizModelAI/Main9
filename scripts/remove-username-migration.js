import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

console.log("Starting username removal migration...");

try {
  // Step 1: Check if email column has all necessary data
  console.log("Checking current users...");
  const existingUsers = await db.execute(
    sql`SELECT id, username, email FROM users`,
  );
  console.log("Found users:", existingUsers.rows);

  // Step 2: For any users without email, copy username to email
  console.log("Updating users without email...");
  await db.execute(sql`
    UPDATE users 
    SET email = username 
    WHERE email IS NULL OR email = ''
  `);

  // Step 3: Make email not null and unique
  console.log("Making email not null and unique...");
  await db.execute(sql`ALTER TABLE users ALTER COLUMN email SET NOT NULL`);

  // Step 4: Add unique constraint to email if it doesn't exist
  try {
    await db.execute(
      sql`ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)`,
    );
    console.log("Added unique constraint to email");
  } catch (error) {
    console.log("Unique constraint already exists or failed:", error.message);
  }

  // Step 5: Drop username column
  console.log("Dropping username column...");
  await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS username`);

  console.log("✅ Migration completed successfully!");

  // Verify the changes
  const updatedUsers = await db.execute(sql`SELECT id, email, name FROM users`);
  console.log("Updated users:", updatedUsers.rows);
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}
