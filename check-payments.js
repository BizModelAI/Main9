import { db } from "./server/db.js";
import { users, payments } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function checkPayments() {
  try {
    console.log("Checking payment status for caseyedunham@gmail.com...");

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, "caseyedunham@gmail.com"));

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("User status:", {
      id: user.id,
      email: user.username,
      hasAccessPass: user.hasAccessPass,
      quizRetakesRemaining: user.quizRetakesRemaining,
    });

    // Check payments for this user
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, user.id));

    console.log(`\nFound ${userPayments.length} payments:`);
    userPayments.forEach((payment) => {
      console.log({
        id: payment.id,
        type: payment.type,
        status: payment.status,
        amount: payment.amount,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
      });
    });

    // Check if there are completed access_pass payments that should grant access
    const completedAccessPassPayments = userPayments.filter(
      (p) => p.type === "access_pass" && p.status === "completed",
    );

    if (completedAccessPassPayments.length > 0 && !user.hasAccessPass) {
      console.log(
        "\n🚨 ISSUE FOUND: User has completed access_pass payments but hasAccessPass is still false!",
      );
      console.log("This account needs to be fixed.");
    } else if (user.hasAccessPass) {
      console.log("\n✅ User access status is correct");
    } else {
      console.log(
        "\n💰 User has no completed access_pass payments - they need to complete payment to get access",
      );
    }
  } catch (error) {
    console.error("Error checking payments:", error);
  } finally {
    process.exit(0);
  }
}

checkPayments();
