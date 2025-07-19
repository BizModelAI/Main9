import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5073';

async function testPaymentDebugEndpoint() {
  console.log('🔍 Testing Payment Debug Endpoint\n');

  try {
    // Step 1: Create a quiz attempt
    console.log('1️⃣ Creating quiz attempt...');
    const email = `debug-endpoint-${Date.now()}@example.com`;
    const quizData = {
      test: 'debug endpoint test',
      timestamp: new Date().toISOString()
    };

    const saveResponse = await fetch(`${BASE_URL}/api/save-quiz-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, quizData })
    });

    const saveData = await saveResponse.json();
    console.log('✅ Quiz data saved:', saveData);

    if (!saveData.success || !saveData.quizAttemptId) {
      throw new Error('Failed to save quiz data');
    }

    const quizAttemptId = saveData.quizAttemptId;

    // Step 2: Test the debug endpoint
    console.log('\n2️⃣ Testing payment debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/api/test-payment-debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizAttemptId, email })
    });

    const debugData = await debugResponse.json();
    console.log('✅ Debug endpoint result:', debugData);

    // Step 3: Test the actual payment endpoint
    console.log('\n3️⃣ Testing actual payment endpoint...');
    const paymentResponse = await fetch(`${BASE_URL}/api/create-report-unlock-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, quizAttemptId })
    });

    const paymentData = await paymentResponse.json();
    console.log('✅ Payment endpoint result:', paymentData);

    if (paymentData.success) {
      console.log('🎉 SUCCESS: Payment creation works!');
    } else {
      console.log('❌ FAILED: Payment creation failed');
      console.log('   Error:', paymentData.error);
      console.log('   Details:', paymentData.details);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPaymentDebugEndpoint(); 