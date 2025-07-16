export const debugOpenAI = {
  // Check if OpenAI is configured
  async checkStatus() {
    try {
      const response = await fetch("/api/openai-status");
      const data = await response.json();
      console.log("� OpenAI Status:", data);
      return data;
    } catch (error) {
      console.error("❌ Error checking OpenAI status:", error);
      return null;
    }
  },

  // Test a simple OpenAI request
  async testRequest() {
    try {
      console.log("� Testing OpenAI request...");
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

      console.log("� Response status:", response.status);

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
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  // Test the characteristics generation specifically
  async testCharacteristics() {
    try {
      console.log("� Testing characteristics generation...");
      const response = await fetch("/api/openai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Based on this quiz data, generate exactly 6 short positive characteristics that reflect the user's entrepreneurial strengths. Each should be 3-5 words maximum and highlight unique aspects of their entrepreneurial potential.

Quiz Data:
- Self-motivation level: 4/5
- Risk comfort level: 3/5
- Tech skills rating: 3/5
- Direct communication enjoyment: 4/5
- Learning preference: hands-on
- Organization level: 3/5
- Creative work enjoyment: 4/5
- Work collaboration preference: mostly-solo
- Decision making style: after-some-research
- Work structure preference: some-structure
- Long-term consistency: 4/5
- Uncertainty handling: 3/5
- Tools familiar with: google-docs-sheets, canva
- Main motivation: financial-freedom
- Weekly time commitment: 20
- Income goal: 5000

Return a JSON object with this exact structure:
{
  "characteristics": ["characteristic 1", "characteristic 2", "characteristic 3", "characteristic 4", "characteristic 5", "characteristic 6"]
}

Examples: {"characteristics": ["Highly self-motivated", "Strategic risk-taker", "Tech-savvy innovator", "Clear communicator", "Organized planner", "Creative problem solver"]}`,
          maxTokens: 200,
          temperature: 0.7,
          responseFormat: { type: "json_object" },
        }),
      });

      console.log("� Characteristics response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Characteristics error response:", errorText);
        return { success: false, error: errorText };
      }

      const data = await response.json();
      console.log("✅ Characteristics response:", data);

      if (data.content) {
        try {
          const parsed = JSON.parse(data.content);
          console.log("✅ Parsed characteristics:", parsed.characteristics);
          return { success: true, characteristics: parsed.characteristics };
        } catch (parseError) {
          console.error(
            "❌ Failed to parse characteristics JSON:",
            data.content,
          );
          return {
            success: false,
            error: "Failed to parse JSON",
            rawContent: data.content,
          };
        }
      }

      return { success: false, error: "No content in response" };
    } catch (error) {
      console.error("❌ Characteristics test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

// Make it globally available for debugging
(window as any).debugOpenAI = debugOpenAI;
