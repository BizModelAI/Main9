import { storage } from "./server/storage.js";
import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function testAIContentMigration() {
  try {
    console.log("🧪 Testing AI content table and migration...");

    // Step 1: Create the table if it doesn't exist
    console.log("📝 Creating ai_content table if it doesn't exist...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_content (
        id SERIAL PRIMARY KEY,
        quiz_attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        content_type VARCHAR(100) NOT NULL,
        content JSONB NOT NULL,
        content_hash VARCHAR(64),
        generated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(quiz_attempt_id, content_type)
      );
    `);

    // Step 2: Create indexes
    console.log("🏗️ Creating indexes...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_ai_content_quiz_attempt 
      ON ai_content(quiz_attempt_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_ai_content_type 
      ON ai_content(quiz_attempt_id, content_type);
    `);

    console.log("✅ AI content table created successfully");

    // Step 3: Test the new AI content methods
    console.log("🧪 Testing new AI content storage methods...");

    // Get an existing quiz attempt to test with
    const attempts = await db.execute(
      sql`SELECT id FROM quiz_attempts LIMIT 1`,
    );

    if (attempts.length === 0) {
      console.log("⚠️ No quiz attempts found in database to test with");
      return;
    }

    const testQuizAttemptId = attempts[0].id;
    console.log(`📋 Using quiz attempt ${testQuizAttemptId} for testing`);

    // Test saving AI content
    const testContent = {
      insights: ["Test insight 1", "Test insight 2"],
      recommendations: ["Test recommendation 1"],
      timestamp: new Date().toISOString(),
    };

    await storage.saveAIContent(testQuizAttemptId, "test_preview", testContent);
    console.log("✅ AI content saved successfully");

    // Test retrieving AI content
    const retrieved = await storage.getAIContent(
      testQuizAttemptId,
      "test_preview",
    );
    if (retrieved && retrieved.content) {
      console.log(
        "✅ AI content retrieved successfully:",
        retrieved.contentType,
      );
    } else {
      throw new Error("Failed to retrieve AI content");
    }

    // Step 4: Run the migration to move existing JSONB data
    console.log("🔄 Running migration to move existing AI content...");
    const migrationResult = await storage.migrateAIContentToNewTable();

    console.log("📊 Migration Results:");
    console.log(
      `  - Total attempts processed: ${migrationResult.totalAttempts}`,
    );
    console.log(
      `  - Successfully migrated: ${migrationResult.migratedAttempts}`,
    );
    console.log(`  - Errors: ${migrationResult.errors.length}`);

    if (migrationResult.errors.length > 0) {
      console.log("❌ Migration errors:");
      migrationResult.errors.forEach((error) => console.log(`  - ${error}`));
    }

    // Step 5: Clean up test data
    console.log("🧹 Cleaning up test data...");
    await db.execute(sql`
      DELETE FROM ai_content 
      WHERE quiz_attempt_id = ${testQuizAttemptId} 
      AND content_type = 'test_preview'
    `);

    console.log("🎉 AI content migration test completed successfully!");
  } catch (error) {
    console.error("❌ AI content migration test failed:", error);
    process.exit(1);
  }
}

testAIContentMigration();
