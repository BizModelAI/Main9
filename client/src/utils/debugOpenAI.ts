export const debugOpenAI = {
  // Check if OpenAI is configured
  async checkStatus() {
    try {
      const response = await fetch("/api/openai-status");
      const data = await response.json();
      console.log("🔍 OpenAI Status:", data);
      return data;
    } catch (error) {
      console.error("❌ Error checking OpenAI status:", error);
      return null;
    }
  },

  // Test a simple OpenAI request
  async testRequest() {
    try {
      console.log("🧪 Testing OpenAI request...");
      const response = await fetch("/api/openai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: 'Generate a simple JSON response: {"test": "success"}',
          maxTokens: 50,
          temperature: 0.7,
          responseFormat: { type: "json_object" },
        }),
      });

      console.log("📊 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        return { success: false, error: errorText };
      }

      const data = await response.json();
      console.log("✅ Success response:", data);
      return { success: true, data };
    } catch (error) {
      console.error("❌ Test request failed:", error);
      return { success: false, error: error.message };
    }
  },
};

// Make it globally available for debugging
(window as any).debugOpenAI = debugOpenAI;
