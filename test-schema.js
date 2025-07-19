import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function testSchema() {
  console.log('🔍 Testing Database Schema...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking if tables exist...');
    
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'quiz_attempts', 'payments')
      ORDER BY table_name;
    `);
    
    console.log('Tables found:', tablesResult.rows.map(row => row.table_name));
    
    // Test 2: Check quiz_attempts table structure
    console.log('\n2. Checking quiz_attempts table structure...');
    const quizStructure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'quiz_attempts' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Quiz attempts columns:');
    quizStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Test 3: Check payments table structure
    console.log('\n3. Checking payments table structure...');
    const paymentsStructure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Payments columns:');
    paymentsStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Test 4: Check foreign key constraints
    console.log('\n4. Checking foreign key constraints...');
    const constraints = await db.execute(sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'payments';
    `);
    
    console.log('Payments foreign keys:');
    constraints.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    // Test 5: Check if quiz attempt 51 actually exists
    console.log('\n5. Checking if quiz attempt 51 exists...');
    const quizExists = await db.execute(sql`
      SELECT id, user_id, completed_at 
      FROM quiz_attempts 
      WHERE id = 51;
    `);
    
    if (quizExists.rows.length > 0) {
      console.log('✅ Quiz attempt 51 exists:', quizExists.rows[0]);
    } else {
      console.log('❌ Quiz attempt 51 does not exist');
      
      // Check what quiz attempts do exist
      const allQuizAttempts = await db.execute(sql`
        SELECT id, user_id, completed_at 
        FROM quiz_attempts 
        ORDER BY id DESC 
        LIMIT 5;
      `);
      
      console.log('Recent quiz attempts:');
      allQuizAttempts.rows.forEach(row => {
        console.log(`  ID: ${row.id}, User ID: ${row.user_id}, Created: ${row.completed_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Schema test failed:', error);
  }

  console.log('\n🔍 Schema Test Complete');
}

testSchema().catch(console.error); 