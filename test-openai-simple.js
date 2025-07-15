// Simple test to verify OpenAI is working
console.log("Testing OpenAI configuration...");

// Test the status endpoint
fetch("http://localhost:5001/api/openai-status")
  .then((res) => res.json())
  .then((data) => {
    console.log("OpenAI Status:", data);

    if (data.configured) {
      console.log("✅ OpenAI API key is configured");

      // Test a simple request
      return fetch("http://localhost:5001/api/openai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt:
            'Generate exactly 3 characteristics in JSON format: {"characteristics": ["trait1", "trait2", "trait3"]}',
          maxTokens: 100,
          temperature: 0.7,
          responseFormat: { type: "json_object" },
        }),
      });
    } else {
      console.log("❌ OpenAI API key is not configured");
      return null;
    }
  })
  .then((res) => {
    if (res) {
      console.log("Request status:", res.status);
      return res.json();
    }
    return null;
  })
  .then((data) => {
    if (data) {
      console.log("OpenAI Response:", data);
      if (data.content) {
        try {
          const parsed = JSON.parse(data.content);
          console.log("✅ Successfully parsed JSON:", parsed);
        } catch (e) {
          console.log("❌ Failed to parse JSON:", data.content);
        }
      }
    }
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
  });
