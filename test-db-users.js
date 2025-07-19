import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, quizAttempts } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and user data...\n');

    // Check all users
    console.log('📋 All users in database:');
    const allUsers = await db.select().from(users).limit(10);
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email}, Temporary: ${user.isTemporary}, Created: ${user.createdAt}`);
    });

    // Check quiz attempts
    console.log('\n📋 All quiz attempts in database:');
    const allAttempts = await db.select().from(quizAttempts).limit(10);
    console.log(`Found ${allAttempts.length} quiz attempts:`);
    allAttempts.forEach(attempt => {
      console.log(`  ID: ${attempt.id}, UserID: ${attempt.userId}, Created: ${attempt.completedAt}`);
    });

    // Check if user 143 exists
    console.log('\n🔍 Checking if user 143 exists:');
    const user143 = await db.select().from(users).where(eq(users.id, 143));
    if (user143.length > 0) {
      console.log('✅ User 143 exists:', user143[0]);
    } else {
      console.log('❌ User 143 does not exist');
    }

    // Check if user 1 exists
    console.log('\n🔍 Checking if user 1 exists:');
    const user1 = await db.select().from(users).where(eq(users.id, 1));
    if (user1.length > 0) {
      console.log('✅ User 1 exists:', user1[0]);
    } else {
      console.log('❌ User 1 does not exist');
    }

    // Try to create a quiz attempt for a user that exists
    if (allUsers.length > 0) {
      const testUser = allUsers[0];
      console.log(`\n🧪 Testing quiz attempt creation for user ${testUser.id}:`);
      
      try {
        const newAttempt = await db.insert(quizAttempts).values({
          userId: testUser.id,
          quizData: { test: 'data' },
          completedAt: new Date()
        }).returning();
        
        console.log('✅ Quiz attempt created successfully:', newAttempt[0]);
        
        // Clean up - delete the test attempt
        await db.delete(quizAttempts).where(eq(quizAttempts.id, newAttempt[0].id));
        console.log('🧹 Test attempt cleaned up');
        
      } catch (error) {
        console.error('❌ Failed to create quiz attempt:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDatabase(); 