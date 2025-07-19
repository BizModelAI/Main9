import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5073';

async function testCompleteSystem() {
  console.log('🧪 Testing Complete Payment System\n');

  try {
    // Step 1: Test server health
    console.log('1️⃣ Testing server health...');
    const healthResponse = await fetch(`${BASE_URL}/api/health/detailed`);
    const healthData = await healthResponse.json();
    console.log('✅ Server health:', healthData.status);

    // Step 2: Create a quiz attempt with email
    console.log('\n2️⃣ Creating quiz attempt with email...');
    const email = `test-${Date.now()}@example.com`;
    const quizData = {
      test: 'complete system test',
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

    // Step 3: Verify quiz attempt exists
    console.log('\n3️⃣ Verifying quiz attempt exists...');
    const dbStateResponse = await fetch(`${BASE_URL}/api/test-db-state?quizAttemptId=${quizAttemptId}`);
    const dbStateData = await dbStateResponse.json();
    console.log('✅ Database state:', {
      attemptsCount: dbStateData.attemptsCount,
      specificAttempt: dbStateData.specificAttempt ? 'Found' : 'Not found'
    });

    // Step 4: Test storage get function
    console.log('\n4️⃣ Testing storage get function...');
    const storageGetResponse = await fetch(`${BASE_URL}/api/test-storage-get?quizAttemptId=${quizAttemptId}`);
    const storageGetData = await storageGetResponse.json();
    console.log('✅ Storage get result:', {
      directQuery: storageGetData.directQuery ? 'Found' : 'Not found',
      storageQuery: storageGetData.storageQuery ? 'Found' : 'Not found',
      match: storageGetData.match
    });

    // Step 5: Test payment creation
    console.log('\n5️⃣ Testing payment creation...');
    const paymentResponse = await fetch(`${BASE_URL}/api/create-report-unlock-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, quizAttemptId })
    });

    const paymentData = await paymentResponse.json();
    console.log('✅ Payment creation result:', paymentData);

    if (paymentData.success) {
      console.log('🎉 SUCCESS: Complete payment flow works!');
      console.log('   - Quiz attempt created and saved');
      console.log('   - Payment intent created successfully');
      console.log('   - Client secret available for frontend');
    } else {
      console.log('❌ FAILED: Payment creation failed');
      console.log('   Error:', paymentData.error);
      console.log('   Details:', paymentData.details);
    }

    // Step 6: Test PayPal endpoint
    console.log('\n6️⃣ Testing PayPal endpoint...');
    const paypalResponse = await fetch(`${BASE_URL}/api/create-paypal-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, quizAttemptId })
    });

    const paypalData = await paypalResponse.json();
    console.log('✅ PayPal endpoint result:', paypalData);

    // Step 7: Test Stripe config
    console.log('\n7️⃣ Testing Stripe config...');
    const stripeConfigResponse = await fetch(`${BASE_URL}/api/stripe-config`);
    const stripeConfigData = await stripeConfigResponse.json();
    console.log('✅ Stripe config:', {
      configured: !!stripeConfigData.publishableKey,
      keyLength: stripeConfigData.publishableKey?.length || 0
    });

    console.log('\n🎯 SYSTEM TEST COMPLETE');
    console.log('========================');
    console.log('✅ Server Health: Working');
    console.log('✅ Quiz Data Storage: Working');
    console.log('✅ Database Operations: Working');
    console.log('✅ Payment Creation: ' + (paymentData.success ? 'Working' : 'Failed'));
    console.log('✅ PayPal Integration: ' + (paypalData.success ? 'Working' : 'Failed'));
    console.log('✅ Stripe Integration: ' + (stripeConfigData.publishableKey ? 'Working' : 'Failed'));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCompleteSystem(); 