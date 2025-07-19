import fetch from 'node-fetch';

async function testQuizAttempt() {
  console.log('🔍 Testing Quiz Attempt Creation...\n');

  // Test 1: Create a quiz attempt
  console.log('1. Creating quiz attempt...');
  try {
    const response = await fetch('http://localhost:5073/api/save-quiz-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizData: { test: 'quiz data' },
        email: 'test-quiz@example.com'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok && data.quizAttemptId) {
      console.log('✅ Quiz attempt created successfully');
      console.log('   Quiz Attempt ID:', data.quizAttemptId);
      console.log('   User ID:', data.userId || 'Not returned');
      
      // Test 2: Try to create a payment with this quiz attempt
      console.log('\n2. Testing payment creation with this quiz attempt...');
      const paymentResponse = await fetch('http://localhost:5073/api/create-report-unlock-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-quiz@example.com',
          quizAttemptId: data.quizAttemptId
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
      } else {
        console.log('❌ Payment creation failed:', paymentData.error);
        console.log('   Details:', paymentData.details);
      }
    } else {
      console.log('❌ Failed to create quiz attempt:', data.error);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🔍 Quiz Attempt Test Complete');
}

testQuizAttempt().catch(console.error); 