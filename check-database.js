import { db } from './server/db.ts';
import { quizAttempts, users, payments } from './shared/schema.ts';
import { eq, desc } from 'drizzle-orm';

async function checkDatabase() {
  console.log('🔍 Checking Database State...\n');

  try {
    // Check 1: Count quiz attempts
    console.log('1. Checking quiz attempts table...');
    const quizAttemptsCount = await db.select().from(quizAttempts);
    console.log(`   Total quiz attempts: ${quizAttemptsCount.length}`);
    
    if (quizAttemptsCount.length > 0) {
      console.log('   Latest quiz attempts:');
      quizAttemptsCount.slice(-5).forEach(attempt => {
        console.log(`     ID: ${attempt.id}, User ID: ${attempt.userId}, Created: ${attempt.completedAt}`);
      });
    }

    // Check 2: Count users
    console.log('\n2. Checking users table...');
    const usersCount = await db.select().from(users);
    console.log(`   Total users: ${usersCount.length}`);
    
    if (usersCount.length > 0) {
      console.log('   Latest users:');
      usersCount.slice(-5).forEach(user => {
        console.log(`     ID: ${user.id}, Email: ${user.email}, Temporary: ${user.isTemporary}`);
      });
    }

    // Check 3: Count payments
    console.log('\n3. Checking payments table...');
    const paymentsCount = await db.select().from(payments);
    console.log(`   Total payments: ${paymentsCount.length}`);
    
    if (paymentsCount.length > 0) {
      console.log('   Latest payments:');
      paymentsCount.slice(-5).forEach(payment => {
        console.log(`     ID: ${payment.id}, User ID: ${payment.userId}, Quiz Attempt ID: ${payment.quizAttemptId}, Status: ${payment.status}`);
      });
    }

    // Check 4: Look for specific quiz attempt ID 50
    console.log('\n4. Looking for quiz attempt ID 50...');
    const specificAttempt = await db.select().from(quizAttempts).where(eq(quizAttempts.id, 50));
    if (specificAttempt.length > 0) {
      console.log('   ✅ Quiz attempt 50 exists:', specificAttempt[0]);
    } else {
      console.log('   ❌ Quiz attempt 50 does not exist');
    }

    // Check 5: Look for user with email test-exists@example.com
    console.log('\n5. Looking for user with email test-exists@example.com...');
    const specificUser = await db.select().from(users).where(eq(users.email, 'test-exists@example.com'));
    if (specificUser.length > 0) {
      console.log('   ✅ User exists:', specificUser[0]);
      
      // Check their quiz attempts
      const userAttempts = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, specificUser[0].id));
      console.log(`   User has ${userAttempts.length} quiz attempts:`, userAttempts.map(a => a.id));
    } else {
      console.log('   ❌ User does not exist');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }

  console.log('\n🔍 Database Check Complete');
}

checkDatabase().catch(console.error); 