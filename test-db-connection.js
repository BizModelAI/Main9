import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, quizAttempts } from './shared/schema.js';
import { eq } from 'drizzle-orm';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();

    // Test users table
    console.log('\n📋 Testing users table...');
    const allUsers = await db.select().from(users).limit(5);
    console.log(`Found ${allUsers.length} users`);

    // Test quiz attempts table
    console.log('\n📋 Testing quiz attempts table...');
    const allAttempts = await db.select().from(quizAttempts).limit(5);
    console.log(`Found ${allAttempts.length} quiz attempts`);

    // Test inserting a quiz attempt
    console.log('\n🧪 Testing quiz attempt insertion...');
    if (allUsers.length > 0) {
      const testUser = allUsers[0];
      console.log(`Using user ID: ${testUser.id}`);
      
      const newAttempt = await db.insert(quizAttempts).values({
        userId: testUser.id,
        quizData: { test: 'connection test' },
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

    console.log('\n✅ Database connection test completed successfully');

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection(); 