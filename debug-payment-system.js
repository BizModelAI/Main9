import fetch from 'node-fetch';

async function debugPaymentSystem() {
  console.log('🔍 Debugging Payment System...\n');

  // Test 1: Check server health
  console.log('1. Testing server health...');
  try {
    const healthResponse = await fetch('http://localhost:5073/api/health/detailed');
    const healthData = await healthResponse.json();
    console.log('✅ Server health:', healthData.status);
    console.log('   Database:', healthData.checks.database.status);
    console.log('   OpenAI:', healthData.checks.openai.status);
    console.log('   Environment:', healthData.checks.environment.status);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return;
  }

  // Test 2: Check environment variables
  console.log('\n2. Checking environment variables...');
  try {
    const envResponse = await fetch('http://localhost:5073/api/health/detailed');
    const envData = await envResponse.json();
    if (envData.checks.environment.status === 'healthy') {
      console.log('✅ Environment variables are properly configured');
    } else {
      console.log('❌ Environment variables issue:', envData.checks.environment.details);
    }
  } catch (error) {
    console.log('❌ Environment check failed:', error.message);
  }

  // Test 3: Test Stripe payment endpoint with invalid data
  console.log('\n3. Testing Stripe payment endpoint (invalid data)...');
  try {
    const stripeResponse = await fetch('http://localhost:5073/api/create-report-unlock-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        quizAttemptId: 999
      })
    });
    
    const stripeData = await stripeResponse.json();
    console.log('Response status:', stripeResponse.status);
    console.log('Response data:', stripeData);
    
    if (stripeResponse.status === 500) {
      console.log('❌ Internal server error - likely Stripe configuration issue');
    } else if (stripeResponse.status === 400) {
      console.log('✅ Endpoint working, but data validation failed (expected)');
    } else {
      console.log('✅ Endpoint working correctly');
    }
  } catch (error) {
    console.log('❌ Stripe endpoint test failed:', error.message);
  }

  // Test 4: Test PayPal payment endpoint
  console.log('\n4. Testing PayPal payment endpoint...');
  try {
    const paypalResponse = await fetch('http://localhost:5073/api/create-paypal-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 999,
        quizAttemptId: 999
      })
    });
    
    const paypalData = await paypalResponse.json();
    console.log('Response status:', paypalResponse.status);
    console.log('Response data:', paypalData);
    
    if (paypalResponse.status === 500) {
      console.log('❌ PayPal endpoint has internal server error');
    } else {
      console.log('✅ PayPal endpoint working (data validation failed as expected)');
    }
  } catch (error) {
    console.log('❌ PayPal endpoint test failed:', error.message);
  }

  // Test 5: Check if we can create a temporary user
  console.log('\n5. Testing temporary user creation...');
  try {
    const tempUserResponse = await fetch('http://localhost:5073/api/save-quiz-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizData: { test: 'data' },
        email: 'debug-test@example.com'
      })
    });
    
    const tempUserData = await tempUserResponse.json();
    console.log('Response status:', tempUserResponse.status);
    console.log('Response data:', tempUserData);
    
    if (tempUserResponse.ok && tempUserData.quizAttemptId) {
      console.log('✅ Temporary user created successfully');
      console.log('   Quiz Attempt ID:', tempUserData.quizAttemptId);
      
      // Test 6: Test payment with the created user
      console.log('\n6. Testing payment with created user...');
      const paymentResponse = await fetch('http://localhost:5073/api/create-report-unlock-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'debug-test@example.com',
          quizAttemptId: tempUserData.quizAttemptId
        })
      });
      
      const paymentData = await paymentResponse.json();
      console.log('Payment response status:', paymentResponse.status);
      console.log('Payment response data:', paymentData);
      
      if (paymentResponse.status === 500) {
        console.log('❌ Payment creation failed with internal server error');
        console.log('   This indicates a Stripe configuration issue');
      } else if (paymentResponse.ok) {
        console.log('✅ Payment intent created successfully!');
        console.log('   Client Secret:', paymentData.clientSecret ? 'Present' : 'Missing');
        console.log('   Amount:', paymentData.amount);
        console.log('   Is First Report:', paymentData.isFirstReport);
      } else {
        console.log('⚠️ Payment creation failed:', paymentData.error);
      }
    } else {
      console.log('❌ Failed to create temporary user');
    }
  } catch (error) {
    console.log('❌ Temporary user creation failed:', error.message);
  }

  console.log('\n🔍 Payment System Debug Complete');
}

debugPaymentSystem().catch(console.error); 