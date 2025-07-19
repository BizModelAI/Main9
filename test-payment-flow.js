import fetch from 'node-fetch';

async function testPaymentFlow() {
  console.log('🔍 Testing Complete Payment Flow...\n');

  try {
    // Step 1: Create a quiz attempt
    console.log('1. Creating quiz attempt...');
    const quizResponse = await fetch('http://localhost:5073/api/save-quiz-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizData: { 
          questions: { q1: 'test answer' },
          results: { score: 85 }
        },
        email: 'payment-flow-test@example.com'
      })
    });
    
    const quizData = await quizResponse.json();
    console.log('Quiz response status:', quizResponse.status);
    console.log('Quiz response data:', quizData);
    
    if (!quizResponse.ok || !quizData.quizAttemptId) {
      console.log('❌ Failed to create quiz attempt:', quizData.error);
      return;
    }
    
    console.log('✅ Quiz attempt created successfully');
    console.log('   Quiz Attempt ID:', quizData.quizAttemptId);
    console.log('   User ID (if available):', quizData.userId || 'Not returned');
    
    // Step 2: Create a payment for this quiz attempt
    console.log('\n2. Creating payment for quiz attempt...');
    const paymentResponse = await fetch('http://localhost:5073/api/create-report-unlock-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'payment-flow-test@example.com',
        quizAttemptId: quizData.quizAttemptId
      })
    });
    
    const paymentData = await paymentResponse.json();
    console.log('Payment response status:', paymentResponse.status);
    console.log('Payment response data:', paymentData);
    
    if (paymentResponse.ok) {
      console.log('✅ Payment created successfully!');
      console.log('   Client Secret:', paymentData.clientSecret ? 'Present' : 'Missing');
      console.log('   Amount:', paymentData.amount);
      console.log('   Is First Report:', paymentData.isFirstReport);
      console.log('   Payment ID:', paymentData.paymentId);
      
      // Step 3: Test that we can retrieve the payment
      console.log('\n3. Testing payment retrieval...');
      const retrieveResponse = await fetch(`http://localhost:5073/api/payment-status/${paymentData.paymentId}`);
      const retrieveData = await retrieveResponse.json();
      console.log('Retrieve response status:', retrieveResponse.status);
      console.log('Retrieve response data:', retrieveData);
      
      if (retrieveResponse.ok) {
        console.log('✅ Payment retrieval successful');
      } else {
        console.log('⚠️ Payment retrieval failed:', retrieveData.error);
      }
      
    } else {
      console.log('❌ Payment creation failed:', paymentData.error);
      console.log('   Details:', paymentData.details);
      
      // Step 3: Try to understand what went wrong
      console.log('\n3. Debugging payment failure...');
      
      // Check if the quiz attempt exists
      console.log('   Checking if quiz attempt exists...');
      const checkResponse = await fetch(`http://localhost:5073/api/quiz-attempt/${quizData.quizAttemptId}`);
      const checkData = await checkResponse.json();
      console.log('   Check response status:', checkResponse.status);
      console.log('   Check response data:', checkData);
      
      if (checkResponse.ok) {
        console.log('   ✅ Quiz attempt exists in database');
      } else {
        console.log('   ❌ Quiz attempt not found in database');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🔍 Payment Flow Test Complete');
}

testPaymentFlow().catch(console.error); 