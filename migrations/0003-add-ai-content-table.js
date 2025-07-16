console.log(" Starting AI content table migration...");

import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

export async function up() {
  console.log(" Creating ai_content table...");

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

  console.log("️ Creating indexes for ai_content table...");

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ai_content_quiz_attempt 
    ON ai_content(quiz_attempt_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ai_content_type 
    ON ai_content(quiz_attempt_id, content_type);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_ai_content_hash 
    ON ai_content(content_hash);
  `);

  console.log("✅ AI content table migration completed successfully");
}

export async function down() {
  console.log("️ Dropping ai_content table...");

  await db.execute(sql`DROP TABLE IF EXISTS ai_content CASCADE;`);

  console.log("✅ AI content table rollback completed");
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await up();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}
