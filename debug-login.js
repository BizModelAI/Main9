import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function debugLogin() {
  try {
    const email = "caseyedunham@gmail.com";
    console.log(`Testing login for: ${email}`);

    // Find user by email (stored in username field)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, email));

    if (!user) {
      console.log("❌ User not found in database");
      return;
    }

    console.log("✅ User found:", {
      id: user.id,
      username: user.username,
      email: user.email,
      hasAccessPass: user.hasAccessPass,
      quizRetakesRemaining: user.quizRetakesRemaining,
      createdAt: user.createdAt,
      passwordLength: user.password?.length || 0,
    });

    // Test a few common passwords to see if any work
    const testPasswords = [
      "password123",
      "Password123",
      "testpass123",
      "Test123!",
      "12345678",
      "password",
    ];

    console.log("\n Testing common passwords...");
    for (const testPassword of testPasswords) {
      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        if (isValid) {
          console.log(`✅ PASSWORD FOUND: "${testPassword}"`);
          return;
        }
      } catch (err) {
        console.log(
          `❌ Error testing password "${testPassword}":`,
          err.message,
        );
      }
    }

    console.log("❌ None of the test passwords worked");
    console.log(
      "\n Try to remember the password you used, or use the forgot password feature",
    );
  } catch (error) {
    console.error("Error testing login:", error);
  } finally {
    process.exit(0);
  }
}

debugLogin();
