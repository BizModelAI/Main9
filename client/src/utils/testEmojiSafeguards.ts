import { 
  isValidEmoji, 
  fixCorruptedEmoji, 
  safeguardBusinessModelEmoji,
  safeguardBusinessDataArray,
  BUSINESS_MODEL_EMOJIS,
  initializeEmojiSafeguards,
  cleanCorruptedEmojisFromStorage
} from './emojiHelper';

/**
 * Test suite for emoji safeguarding system
 */
export function testEmojiSafeguards() {
  console.log('🧪 Testing Emoji Safeguard System...');
  
  // Test 1: Valid emoji detection
  console.log('\n📋 Test 1: Valid Emoji Detection');
  const validEmojis = ['📱', '💰', '💼', '🎯', '🧠', '📊'];
  const invalidEmojis = ['\\u1F4F1', '\\x1F4B0', '\\077', 'corrupted', ''];
  
  validEmojis.forEach(emoji => {
    const isValid = isValidEmoji(emoji);
    console.log(`${emoji} is valid: ${isValid} ${isValid ? '✅' : '❌'}`);
  });
  
  invalidEmojis.forEach(emoji => {
    const isValid = isValidEmoji(emoji);
    console.log(`"${emoji}" is valid: ${isValid} ${!isValid ? '✅' : '❌'}`);
  });
  
  // Test 2: Corrupted emoji fixing
  console.log('\n🔧 Test 2: Corrupted Emoji Fixing');
  const corruptedEmojis = [
    { emoji: '\\u1F4F1', businessId: 'content-creation', expected: '📱' },
    { emoji: '\\x1F4B0', businessId: 'affiliate-marketing', expected: '💰' },
    { emoji: 'corrupted', businessId: 'freelancing', expected: '💼' },
    { emoji: '', businessId: 'youtube-automation', expected: '📺' }
  ];
  
  corruptedEmojis.forEach(({ emoji, businessId, expected }) => {
    const fixed = fixCorruptedEmoji(emoji, businessId);
    const success = fixed === expected;
    console.log(`"${emoji}" → "${fixed}" (expected: "${expected}") ${success ? '✅' : '❌'}`);
  });
  
  // Test 3: Business model safeguarding
  console.log('\n🛡️ Test 3: Business Model Safeguarding');
  const testBusinessModel = {
    id: 'content-creation',
    name: 'Content Creation',
    emoji: '\\u1F4F1', // Corrupted
    description: 'Test description'
  };
  
  const safeguarded = safeguardBusinessModelEmoji(testBusinessModel);
  const success = safeguarded.emoji === '📱';
  console.log(`Business model emoji fixed: "${testBusinessModel.emoji}" → "${safeguarded.emoji}" ${success ? '✅' : '❌'}`);
  
  // Test 4: Array safeguarding
  console.log('\n📦 Test 4: Array Safeguarding');
  const testArray = [
    { id: 'content-creation', name: 'Content Creation', emoji: '\\u1F4F1' },
    { id: 'affiliate-marketing', name: 'Affiliate Marketing', emoji: '\\x1F4B0' },
    { id: 'freelancing', name: 'Freelancing', emoji: 'corrupted' }
  ];
  
  const safeguardedArray = safeguardBusinessDataArray(testArray);
  const expectedEmojis = ['📱', '💰', '💼'];
  const arraySuccess = safeguardedArray.every((item, index) => item.emoji === expectedEmojis[index]);
  
  safeguardedArray.forEach((item, index) => {
    console.log(`${item.name}: "${testArray[index].emoji}" → "${item.emoji}" ${item.emoji === expectedEmojis[index] ? '✅' : '❌'}`);
  });
  
  // Test 5: Business model emoji mappings
  console.log('\n🗺️ Test 5: Business Model Emoji Mappings');
  const testMappings = [
    'content-creation',
    'affiliate-marketing', 
    'freelancing',
    'youtube-automation',
    'local-service-arbitrage',
    'ai-marketing-agency'
  ];
  
  testMappings.forEach(businessId => {
    const emoji = BUSINESS_MODEL_EMOJIS[businessId];
    const isValid = isValidEmoji(emoji);
    console.log(`${businessId}: ${emoji} ${isValid ? '✅' : '❌'}`);
  });
  
  // Test 6: localStorage corruption detection
  console.log('\n💾 Test 6: localStorage Corruption Detection');
  
  // Add some test data with corrupted emojis
  const testData = {
    businessModels: [
      { id: 'test-1', name: 'Test 1', emoji: '\\u1F4F1' },
      { id: 'test-2', name: 'Test 2', emoji: '\\x1F4B0' }
    ],
    timestamp: Date.now()
  };
  
  localStorage.setItem('testEmojiData', JSON.stringify(testData));
  
  // Clean corrupted emojis
  cleanCorruptedEmojisFromStorage();
  
  // Check if data was cleaned
  const cleanedData = localStorage.getItem('testEmojiData');
  if (cleanedData) {
    const parsed = JSON.parse(cleanedData);
    const wasCleaned = parsed.businessModels.every((model: any) => isValidEmoji(model.emoji));
    console.log(`localStorage corruption cleaned: ${wasCleaned ? '✅' : '❌'}`);
  }
  
  // Clean up test data
  localStorage.removeItem('testEmojiData');
  
  console.log('\n🎉 Emoji Safeguard System Tests Complete!');
  
  // Return test results summary
  return {
    validEmojiDetection: validEmojis.every(emoji => isValidEmoji(emoji)),
    corruptedEmojiFixing: corruptedEmojis.every(({ emoji, businessId, expected }) => 
      fixCorruptedEmoji(emoji, businessId) === expected
    ),
    businessModelSafeguarding: success,
    arraySafeguarding: arraySuccess,
    emojiMappings: testMappings.every(businessId => isValidEmoji(BUSINESS_MODEL_EMOJIS[businessId]))
  };
}

/**
 * Initialize and test the emoji safeguard system
 */
export function initializeAndTestEmojiSafeguards() {
  console.log('🚀 Initializing and testing emoji safeguard system...');
  
  // Initialize the system
  initializeEmojiSafeguards();
  
  // Run tests
  const results = testEmojiSafeguards();
  
  // Log summary
  console.log('\n📊 Test Results Summary:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed!'}`);
  
  return results;
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testEmojiSafeguards = testEmojiSafeguards;
  (window as any).initializeAndTestEmojiSafeguards = initializeAndTestEmojiSafeguards;
} 