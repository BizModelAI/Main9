-- Add aiContent column to quiz_attempts table
ALTER TABLE "quiz_attempts" ADD COLUMN "ai_content" jsonb;
