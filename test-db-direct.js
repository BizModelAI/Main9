import 'dotenv/config';
import { db } from './server/dist/server/db.js';
import { quizAttempts } from './server/dist/shared/schema.js';
import { eq } from 'drizzle-orm';

async function testDbDirect() {
  console.log('🔍 Direct Database Test\n');

  try {
    console.log('1️⃣ Testing direct database connection...');
    console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
    
    if (!db) {
      console.log('❌ Database not available');
      return;
    }
    
    console.log('✅ Database connection available');
    
    // Test querying quiz attempt ID 91
    console.log('\n2️⃣ Querying quiz attempt ID 91...');
    const result = await db.select().from(quizAttempts).where(eq(quizAttempts.id, 91));
    console.log('Query result:', result);
    console.log('Result length:', result.length);
    
    if (result.length > 0) {
      console.log('✅ Quiz attempt 91 found:', result[0]);
    } else {
      console.log('❌ Quiz attempt 91 not found');
      
      // Let's see what quiz attempts exist
      console.log('\n3️⃣ Checking all quiz attempts...');
      const allAttempts = await db.select().from(quizAttempts).limit(10);
      console.log('All attempts:', allAttempts);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDbDirect(); 