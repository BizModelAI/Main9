import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";

async function testEndpoint(url, options = {}) {
  try {
    console.log(`\n Testing: ${url}`);
    const response = await fetch(url, options);
    const text = await response.text();

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}`);

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log("Response:", JSON.stringify(json, null, 2));
    } catch {
      console.log("Response (text):", text.substring(0, 200));
    }
  } catch (error) {
    console.error(`❌ Error testing ${url}:`, error.message);
  }
}

async function runTests() {
  console.log(" Testing server endpoints...\n");

  // Test health endpoints
  await testEndpoint(`${BASE_URL}/api/health`);
  await testEndpoint(`${BASE_URL}/api/health/detailed`);
  await testEndpoint(`${BASE_URL}/api/test/database`);

  // Test auth endpoints
  await testEndpoint(`${BASE_URL}/api/auth/me`);

  // Test signup with sample data
  await testEndpoint(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "test@example.com",
      password: "TestPassword123",
      name: "Test User",
    }),
  });
}

runTests().catch(console.error);
