// Comprehensive verification for Supabase integration and AI content system
import { db, pool } from "./server/db.js";
import { sql } from "drizzle-orm";

async function verifySupabaseIntegration() {
  console.log("🔍 Verifying Database Integration and AI Content System...\n");

  try {
    if (!db || !pool) {
      console.log("❌ Database not connected");
      return false;
    }

    // 1. Check database connection info
    console.log("1. 🗄️ Database Connection Analysis:");
    console.log("   Database pool exists:", !!pool);
    console.log("   Drizzle ORM connected:", !!db);

    // Check if this looks like Supabase by examining connection
    const connectionString = process.env.DATABASE_URL || "Not available";
    const isSupabase =
      connectionString.includes("supabase") ||
      connectionString.includes(".pooler.supabase");
    console.log(
      "   Database provider:",
      isSupabase ? "🟢 Supabase" : "🔵 PostgreSQL (Unknown provider)",
    );

    // 2. Test basic database connectivity
    console.log("\n2. 🔗 Database Connectivity Test:");
    const basicTest = await db.execute(
      sql`SELECT NOW() as current_time, version() as pg_version`,
    );
    console.log("   ✅ Database query successful");
    console.log("   Current time:", basicTest[0]?.current_time);
    console.log(
      "   PostgreSQL version:",
      basicTest[0]?.pg_version?.substring(0, 50) + "...",
    );

    // 3. Verify quiz_attempts table structure
    console.log("\n3. 📋 Quiz Attempts Table Verification:");
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'quiz_attempts' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log("   Table columns found:");
    tableInfo.forEach((col) => {
      const isAiContent = col.column_name === "ai_content";
      console.log(
        `   ${isAiContent ? "🟢" : "  "} ${col.column_name} (${col.data_type}) ${col.is_nullable === "YES" ? "nullable" : "not null"}`,
      );
    });

    const hasAiContentColumn = tableInfo.some(
      (col) => col.column_name === "ai_content",
    );
    console.log(
      "   AI content column exists:",
      hasAiContentColumn ? "✅ YES" : "❌ NO",
    );

    if (!hasAiContentColumn) {
      console.log("   ⚠️ AI content column missing - this needs to be added");
      return false;
    }

    // 4. Test AI content functionality with a real quiz attempt
    console.log("\n4. 🧪 AI Content Functionality Test:");

    // First, check if we have any quiz attempts
    const existingAttempts = await db.execute(sql`
      SELECT id, user_id, completed_at 
      FROM quiz_attempts 
      ORDER BY completed_at DESC 
      LIMIT 5
    `);

    console.log(`   Found ${existingAttempts.length} existing quiz attempts`);

    if (existingAttempts.length === 0) {
      console.log("   ⚠️ No quiz attempts found to test with");
      return false;
    }

    const testAttemptId = existingAttempts[0].id;
    console.log(`   Using quiz attempt ID ${testAttemptId} for testing`);

    // Test AI content save
    const testAIContent = {
      test_verification: true,
      timestamp: new Date().toISOString(),
      insights: ["Verification insight 1", "Verification insight 2"],
      recommendations: "Test recommendation for verification",
      personalizedPaths: [
        { id: "content-creation", score: 85, reason: "Test scoring" },
        { id: "freelancing", score: 75, reason: "Secondary option" },
      ],
      metadata: {
        generated_by: "verification_script",
        model_version: "test_v1.0",
      },
    };

    console.log("   Testing AI content save...");
    await db.execute(sql`
      UPDATE quiz_attempts 
      SET ai_content = ${JSON.stringify(testAIContent)}
      WHERE id = ${testAttemptId}
    `);
    console.log("   ✅ AI content saved successfully");

    // Test AI content retrieval
    console.log("   Testing AI content retrieval...");
    const retrievedData = await db.execute(sql`
      SELECT ai_content 
      FROM quiz_attempts 
      WHERE id = ${testAttemptId}
    `);

    const retrievedContent = retrievedData[0]?.ai_content;
    console.log("   ✅ AI content retrieved successfully");

    // Verify content integrity
    if (retrievedContent && retrievedContent.test_verification === true) {
      console.log("   ✅ Content integrity verified");
      console.log(
        "   Retrieved insights count:",
        retrievedContent.insights?.length || 0,
      );
      console.log(
        "   Retrieved paths count:",
        retrievedContent.personalizedPaths?.length || 0,
      );
    } else {
      console.log("   ❌ Content integrity check failed");
      return false;
    }

    // Test API endpoints through storage layer
    console.log("\n5. 🔌 API Storage Layer Test:");
    try {
      const { storage } = await import("./server/storage.js");

      // Test save through storage layer
      const apiTestContent = {
        api_test: true,
        timestamp: new Date().toISOString(),
        source: "storage_layer_test",
      };

      await storage.saveAIContentToQuizAttempt(testAttemptId, apiTestContent);
      console.log("   ✅ Storage layer save successful");

      // Test retrieval through storage layer
      const apiRetrieved =
        await storage.getAIContentForQuizAttempt(testAttemptId);
      if (apiRetrieved && apiRetrieved.api_test === true) {
        console.log("   ✅ Storage layer retrieval successful");
      } else {
        console.log("   ❌ Storage layer retrieval failed");
        return false;
      }
    } catch (error) {
      console.log("   ❌ Storage layer test failed:", error.message);
      return false;
    }

    // Clean up test data
    console.log("\n6. 🧹 Cleanup:");
    await db.execute(sql`
      UPDATE quiz_attempts 
      SET ai_content = NULL 
      WHERE id = ${testAttemptId}
    `);
    console.log("   ✅ Test data cleaned up");

    // Final summary
    console.log("\n🎉 VERIFICATION COMPLETE:");
    console.log(
      "   Database Type:",
      isSupabase ? "Supabase PostgreSQL" : "PostgreSQL",
    );
    console.log("   AI Content Column: ✅ Present");
    console.log("   Save Functionality: ✅ Working");
    console.log("   Retrieve Functionality: ✅ Working");
    console.log("   Storage Layer API: ✅ Working");
    console.log("   Data Integrity: ✅ Verified");

    console.log("\n✅ AI CONTENT SYSTEM IS FULLY FUNCTIONAL!");

    return true;
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    console.error("Error details:", error.message);
    return false;
  }
}

// Export for use in other modules
export { verifySupabaseIntegration };

// Run verification immediately
verifySupabaseIntegration().then((success) => {
  console.log("\nVerification", success ? "PASSED" : "FAILED");
});
