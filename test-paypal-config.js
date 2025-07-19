import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5073';

async function testPaypalConfig() {
  console.log('🔍 Testing PayPal Configuration\n');

  try {
    // Test PayPal configuration
    console.log('1️⃣ Testing PayPal configuration...');
    const configResponse = await fetch(`${BASE_URL}/api/test-paypal-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    console.log('PayPal config response status:', configResponse.status);
    const configData = await configResponse.json();
    console.log('✅ PayPal config result:', configData);

    if (configData.success) {
      console.log('🎉 SUCCESS: PayPal configuration works!');
      console.log('   Order ID:', configData.orderID);
    } else {
      console.log('❌ FAILED: PayPal configuration failed');
      console.log('   Error:', configData.error);
      console.log('   Details:', configData.details);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPaypalConfig(); 