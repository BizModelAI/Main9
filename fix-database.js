// Simple script to fix the database schema by calling the admin endpoint
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://bizmodelai.com"
    : "http://localhost:3000";

async function fixDatabase() {
  try {
    console.log("Attempting to fix database schema...");

    const response = await fetch(`${BASE_URL}/api/admin/fix-database-schema`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Database schema fixed successfully:", result);
    } else {
      const error = await response.text();
      console.error("❌ Failed to fix database schema:", error);
    }
  } catch (error) {
    console.error("❌ Error calling fix endpoint:", error);
  }
}

// Run if called directly
if (require.main === module) {
  fixDatabase();
}

module.exports = { fixDatabase };
