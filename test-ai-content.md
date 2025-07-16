# AI Content Database Fix

## Problem

The error "Failed to save AI content to database: 500" occurs because the `ai_content` table doesn't exist in the database.

## Solution Applied

1. **Added auto-migration**: The `saveAIContent` method now automatically creates the `ai_content` table if it doesn't exist
2. **Enhanced error handling**: Better error messages to identify the specific issue
3. **Updated admin endpoint**: The `/api/admin/fix-database-schema` endpoint now includes `ai_content` table creation

## How it Works

When AI content is saved, the system will:

1. Check if the `ai_content` table exists
2. If not, automatically create it with the correct schema
3. Proceed to save the AI content

## Manual Fix (if needed)

If the auto-migration doesn't work, you can manually create the table by calling:

```bash
POST /api/admin/fix-database-schema
```

This will create the missing table:

```sql
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
```

## Testing

Try generating AI content again - the error should be resolved and the table should be created automatically.
