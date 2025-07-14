const fetch = require("node:fetch");

async function testRetakeStatus() {
  try {
    console.log("Testing retake status endpoint...");
    const response = await fetch(
      "http://localhost:5000/api/quiz-retake-status/5",
    );
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error testing retake status:", error);
  }
}

testRetakeStatus();
