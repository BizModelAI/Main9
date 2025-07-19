import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5073';

async function testPaymentSimple() {
  console.log('🔍 Simple Payment Test\n');

  try {
    // Test payment endpoint directly with a known quiz attempt ID
    console.log('1️⃣ Testing payment endpoint with quiz attempt ID 91...');
    
    const paymentResponse = await fetch(`${BASE_URL}/api/create-report-unlock-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com',
        quizAttemptId: 91
      })
    });

    console.log('Response status:', paymentResponse.status);
    console.log('Response headers:', Object.fromEntries(paymentResponse.headers.entries()));
    
    const paymentData = await paymentResponse.text();
    console.log('Response body:', paymentData);

    try {
      const jsonData = JSON.parse(paymentData);
      console.log('Parsed JSON:', jsonData);
    } catch (e) {
      console.log('Response is not valid JSON');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPaymentSimple(); 