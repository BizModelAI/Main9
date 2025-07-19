import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5073';

async function testStorageTiming() {
  console.log('🔍 Storage Timing Test\n');

  try {
    // Step 1: Create a quiz attempt
    console.log('1️⃣ Creating quiz attempt...');
    const email = `timing-${Date.now()}@example.com`;
    const quizData = {
      test: 'storage timing test',
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

    // Step 2: Wait a moment
    console.log('\n2️⃣ Waiting 1 second...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Test storage get function immediately
    console.log('\n3️⃣ Testing storage get function...');
    const storageGetResponse = await fetch(`${BASE_URL}/api/test-storage-get?quizAttemptId=${quizAttemptId}`);
    const storageGetData = await storageGetResponse.json();
    console.log('✅ Storage get result:', storageGetData);

    // Step 4: Test payment creation immediately
    console.log('\n4️⃣ Testing payment creation...');
    const paymentResponse = await fetch(`${BASE_URL}/api/create-report-unlock-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, quizAttemptId })
    });

    const paymentData = await paymentResponse.json();
    console.log('✅ Payment creation result:', paymentData);

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

testStorageTiming(); 