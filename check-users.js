import { db } from "./server/db.js";
import { users, unpaidUserEmails } from "./shared/schema.js";

async function checkUsers() {
  try {
    console.log("Checking users in database...");

    // Check paid users
    const allUsers = await db.select().from(users);
    console.log("=== PAID USERS ===");
    console.log(`Found ${allUsers.length} paid users:`);
    allUsers.forEach((user) => {
      console.log(
        `- ID: ${user.id}, Email: ${user.username}, HasAccess: ${user.hasAccessPass}, Created: ${user.createdAt}`,
      );
    });

    console.log("\n=== UNPAID USER EMAILS ===");
    // Check unpaid user emails
    const unpaidUsers = await db.select().from(unpaidUserEmails);
    console.log(`Found ${unpaidUsers.length} unpaid user emails:`);
    unpaidUsers.forEach((user) => {
      console.log(
        `- Email: ${user.email}, SessionId: ${user.sessionId}, Expires: ${user.expiresAt}, Created: ${user.createdAt}`,
      );
    });
  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
