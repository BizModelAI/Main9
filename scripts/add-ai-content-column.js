import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function addAiContentColumn() {
  try {
    console.log("Adding ai_content column to quiz_attempts table...");

    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quiz_attempts' AND column_name = 'ai_content'
    `);

    if (result.length > 0) {
      console.log("ai_content column already exists");
      return;
    }

    // Add the column
    await db.execute(
      sql`ALTER TABLE "quiz_attempts" ADD COLUMN "ai_content" jsonb`,
    );

    console.log("ai_content column added successfully!");
  } catch (error) {
    console.error("Error adding ai_content column:", error);
  }
}

addAiContentColumn();
