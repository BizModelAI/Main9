import { Pool } from "pg";

const DATABASE_URL =
  "postgresql://postgres.xxwhqepiqlehisklqbpw:BizModelAI2202@aws-0-us-east-2.pooler.supabase.com:6543/postgres";

console.log("Testing database connection...");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 5000,
});

pool
  .connect()
  .then((client) => {
    console.log("✅ Database connection successful");
    client.release();
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });
