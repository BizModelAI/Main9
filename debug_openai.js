// Debug script to test OpenAI integration and clear cache
console.log('=== OpenAI Integration Debug ===');

// Force clear all AI cache
function clearAllAICache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('ai-cache-') || key.includes('ai-analysis-') || key.includes('skills-analysis-')) {
      localStorage.removeItem(key);
    }
  });
  localStorage.setItem('force-ai-refresh', 'true');
  localStorage.setItem('ai-cache-reset-timestamp', Date.now().toString());
  console.log('✓ All AI cache cleared');
}

// Test OpenAI endpoint
async function testOpenAI() {
  try {
    console.log('Testing OpenAI endpoint...');
    const response = await fetch('/api/openai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Generate a personalized business insight for an entrepreneur with high motivation and tech skills',
        maxTokens: 150,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✓ OpenAI endpoint working:', data);
    return true;
  } catch (error) {
    console.error('✗ OpenAI endpoint error:', error);
    return false;
  }
}

// Run the debug sequence
(async () => {
  clearAllAICache();
  const openaiWorking = await testOpenAI();
  
  if (openaiWorking) {
    console.log('✓ OpenAI integration is working! Cache cleared.');
    console.log('Reload the page to get fresh AI responses.');
  } else {
    console.log('✗ OpenAI integration has issues. Check server logs.');
  }
})();

// Make functions available globally
window.clearAllAICache = clearAllAICache;
window.testOpenAI = testOpenAI;