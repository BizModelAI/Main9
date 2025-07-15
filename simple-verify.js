// Simple verification for Supabase AI content system
import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function simpleVerify() {
  console.log("🔍 Simple AI Content System Verification\n");

  try {
    // 1. Check if we're connected to Supabase
    const connectionString = process.env.DATABASE_URL || "";
    const isSupabase =
      connectionString.includes("supabase") ||
      connectionString.includes(".pooler.supabase");
    console.log("Database Type:", isSupabase ? "🟢 SUPABASE" : "🔵 PostgreSQL");

    if (!db) {
      console.log("❌ Database not connected");
      return false;
    }

    // 2. Test basic query
    console.log("\nTesting database connection...");
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection working");

    // 3. Check ai_content column exists
    console.log("\nChecking ai_content column...");
    const columnCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_attempts' 
        AND column_name = 'ai_content'
      ) as column_exists
    `);

    const hasColumn = columnCheck[0]?.column_exists;
    console.log("AI content column exists:", hasColumn ? "✅ YES" : "❌ NO");

    if (!hasColumn) {
      console.log("❌ AI content column missing");
      return false;
    }

    // 4. Test with real data
    console.log("\nTesting AI content functionality...");

    // Find a quiz attempt to test with
    const attempts = await db.execute(sql`
      SELECT id FROM quiz_attempts LIMIT 1
    `);

    if (attempts.length === 0) {
      console.log("⚠️ No quiz attempts found for testing");
      return false;
    }

    const testId = attempts[0].id;
    console.log(`Using quiz attempt ID: ${testId}`);

    // Test save
    const testData = { test: true, timestamp: new Date().toISOString() };
    await db.execute(sql`
      UPDATE quiz_attempts 
      SET ai_content = ${JSON.stringify(testData)}
      WHERE id = ${testId}
    `);
    console.log("��� AI content save successful");

    // Test retrieve
    const retrieved = await db.execute(sql`
      SELECT ai_content FROM quiz_attempts WHERE id = ${testId}
    `);

    const content = retrieved[0]?.ai_content;
    if (content && content.test === true) {
      console.log("✅ AI content retrieve successful");
      console.log("✅ Data integrity verified");
    } else {
      console.log("❌ AI content retrieve failed");
      return false;
    }

    // Clean up
    await db.execute(sql`
      UPDATE quiz_attempts SET ai_content = NULL WHERE id = ${testId}
    `);
    console.log("✅ Test data cleaned up");

    // 5. Test storage layer
    console.log("\nTesting API storage layer...");
    try {
      const { storage } = await import("./server/storage.js");

      const apiTestData = { api_test: true, source: "storage_layer" };
      await storage.saveAIContentToQuizAttempt(testId, apiTestData);

      const apiRetrieved = await storage.getAIContentForQuizAttempt(testId);
      if (apiRetrieved && apiRetrieved.api_test === true) {
        console.log("✅ Storage layer API working");
      } else {
        console.log("❌ Storage layer API failed");
        return false;
      }

      // Clean up API test
      await storage.saveAIContentToQuizAttempt(testId, null);
    } catch (error) {
      console.log("❌ Storage layer test failed:", error.message);
      return false;
    }

    console.log("\n🎉 VERIFICATION COMPLETE!");
    console.log(
      "Database: " + (isSupabase ? "Supabase PostgreSQL" : "PostgreSQL"),
    );
    console.log("AI Content System: ✅ FULLY FUNCTIONAL");

    return true;
  } catch (error) {
    console.error("\n❌ Verification failed:", error.message);
    return false;
  }
}

simpleVerify().then((success) => {
  console.log("\n" + (success ? "✅ ALL TESTS PASSED" : "❌ TESTS FAILED"));
});
