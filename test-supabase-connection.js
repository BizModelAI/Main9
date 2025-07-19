import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, quizAttempts } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Testing Supabase database connection...\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const db = drizzle(pool);

async function testSupabaseConnection() {
  try {
    console.log('1️⃣ Testing connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();

    console.log('\n2️⃣ Testing users table...');
    const allUsers = await db.select().from(users).limit(5);
    console.log(`Found ${allUsers.length} users`);

    console.log('\n3️⃣ Testing quiz attempts table...');
    const allAttempts = await db.select().from(quizAttempts).limit(5);
    console.log(`Found ${allAttempts.length} quiz attempts`);

    console.log('\n4️⃣ Testing quiz attempt insertion...');
    if (allUsers.length > 0) {
      const testUser = allUsers[0];
      console.log(`Using user ID: ${testUser.id}`);
      
      const newAttempt = await db.insert(quizAttempts).values({
        userId: testUser.id,
        quizData: { test: 'supabase connection test' },
        completedAt: new Date()
      }).returning();
      
      console.log('✅ Quiz attempt inserted successfully:', newAttempt[0]);
      
      // Verify it exists
      const verification = await db.select().from(quizAttempts).where(eq(quizAttempts.id, newAttempt[0].id));
      console.log('✅ Verification query result:', verification.length > 0 ? 'Found' : 'Not found');
      
      // Clean up
      await db.delete(quizAttempts).where(eq(quizAttempts.id, newAttempt[0].id));
      console.log('🧹 Test attempt cleaned up');
    }

    console.log('\n✅ Supabase database connection test completed successfully');

  } catch (error) {
    console.error('❌ Supabase database connection test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await pool.end();
  }
}

testSupabaseConnection(); 