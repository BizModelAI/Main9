const fetch = require('node-fetch');

async function testEmailRateLimit() {
  const testEmail = 'test@example.com';
  const quizData = {
    mainMotivation: 'financial-freedom',
    weeklyTimeCommitment: 20,
    successIncomeGoal: 5000,
    techSkillsRating: 3,
    riskComfortLevel: 4,
    selfMotivationLevel: 5,
    directCommunicationEnjoyment: 4,
    creativeWorkEnjoyment: 3,
    workStructurePreference: 'flexible',
    learningPreference: 'hands-on',
    firstIncomeTimeline: '3-6-months',
    upfrontInvestment: 1000,
    brandFaceComfort: 3,
    longTermConsistency: 4,
    trialErrorComfort: 4,
    organizationLevel: 3,
    uncertaintyHandling: 4,
    workCollaborationPreference: 'independent',
    decisionMakingStyle: 'data-driven',
    familiarTools: ['social-media', 'email']
  };

  console.log('🧪 Testing Email Rate Limiting System');
  console.log('=====================================');

  // Test 1: First email (should succeed)
  console.log('\n📧 Test 1: Sending first email...');
  try {
    const response1 = await fetch('http://localhost:5073/api/send-quiz-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, quizData })
    });
    
    console.log(`Status: ${response1.status}`);
    const data1 = await response1.json();
    console.log('Response:', data1);
    
    if (response1.status === 429) {
      console.log('✅ Rate limit working - first email blocked');
    } else if (response1.status === 200) {
      console.log('✅ First email sent successfully');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Second email immediately (should be rate limited)
  console.log('\n📧 Test 2: Sending second email immediately...');
  try {
    const response2 = await fetch('http://localhost:5073/api/send-quiz-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, quizData })
    });
    
    console.log(`Status: ${response2.status}`);
    const data2 = await response2.json();
    console.log('Response:', data2);
    
    if (response2.status === 429) {
      console.log('✅ Rate limit working - second email blocked');
      if (data2.rateLimitInfo) {
        console.log(`⏰ Rate limit info: ${data2.rateLimitInfo.type}, ${data2.rateLimitInfo.remainingTime}s remaining`);
      }
    } else {
      console.log('❌ Rate limit not working - second email should be blocked');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Wait and try again
  console.log('\n📧 Test 3: Waiting 2 seconds and trying again...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const response3 = await fetch('http://localhost:5073/api/send-quiz-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, quizData })
    });
    
    console.log(`Status: ${response3.status}`);
    const data3 = await response3.json();
    console.log('Response:', data3);
    
    if (response3.status === 429) {
      console.log('✅ Rate limit still active');
      if (data3.rateLimitInfo) {
        console.log(`⏰ Rate limit info: ${data3.rateLimitInfo.type}, ${data3.rateLimitInfo.remainingTime}s remaining`);
      }
    } else if (response3.status === 200) {
      console.log('✅ Rate limit expired - email sent successfully');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testEmailRateLimit().catch(console.error); 