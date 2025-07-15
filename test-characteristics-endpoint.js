const fetch = require("node-fetch");

async function testCharacteristicsGeneration() {
  try {
    console.log("Testing characteristics generation endpoint...");

    const response = await fetch("http://localhost:5001/api/openai-chat", {
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

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers.raw());

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return;
    }

    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (data.content) {
      try {
        const parsed = JSON.parse(data.content);
        console.log("Parsed characteristics:", parsed.characteristics);
      } catch (parseError) {
        console.error("Error parsing content:", parseError);
        console.log("Raw content:", data.content);
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testCharacteristicsGeneration();
