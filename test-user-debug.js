const { DrizzleStorage } = require("./server/storage.js");

async function debugUserData() {
  try {
    const storage = new DrizzleStorage();

    console.log("Checking users with access pass...");
    const users = await storage.db.select().from(storage.schema.users);

    users.forEach((user) => {
      console.log(`User ${user.id} (${user.email}):`, {
        hasAccessPass: user.hasAccessPass,
        quizRetakesRemaining: user.quizRetakesRemaining,
        totalQuizRetakesUsed: user.totalQuizRetakesUsed,
      });
    });

    console.log("\nChecking quiz attempts...");
    for (const user of users) {
      const attempts = await storage.getQuizAttempts(user.id);
      console.log(`User ${user.id} has ${attempts.length} quiz attempts`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

debugUserData();
