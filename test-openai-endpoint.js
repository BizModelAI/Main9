// Test the OpenAI endpoint functionality
const testOpenAI = async () => {
  try {
    console.log("Testing OpenAI endpoint...");
    const response = await fetch("/api/openai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt:
          "Generate a simple business insight for a motivated entrepreneur.",
        maxTokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status}`, errorText);
      return false;
    }

    const data = await response.json();
    console.log("✓ OpenAI endpoint working successfully:", data);
    return true;
  } catch (error) {
    console.error("✗ OpenAI endpoint error:", error);
    return false;
  }
};

// Test the endpoint
testOpenAI();
