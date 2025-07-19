import { db } from './server/db.ts';
import { users } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function testDbWrite() {
  console.log('🔍 Testing Database Write Operations...\n');

  try {
    // Test 1: Try to insert a simple user record
    console.log('1. Testing user insertion...');
    
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'test-password',
      isUnsubscribed: false,
      isPaid: false,
      isTemporary: true
    };
    
    console.log('Inserting test user:', testUser.email);
    
    const [insertedUser] = await db
      .insert(users)
      .values(testUser)
      .returning();
    
    console.log('✅ User inserted successfully:', insertedUser.id);
    
    // Test 2: Try to read the user back
    console.log('\n2. Testing user retrieval...');
    
    const retrievedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, insertedUser.id));
    
    if (retrievedUser.length > 0) {
      console.log('✅ User retrieved successfully:', retrievedUser[0].email);
    } else {
      console.log('❌ User not found after insertion');
    }
    
    // Test 3: Clean up - delete the test user
    console.log('\n3. Cleaning up test user...');
    
    await db
      .delete(users)
      .where(eq(users.id, insertedUser.id));
    
    console.log('✅ Test user deleted successfully');
    
  } catch (error) {
    console.error('❌ Database write test failed:', error);
  }

  console.log('\n🔍 Database Write Test Complete');
}

testDbWrite().catch(console.error); 