console.log("🔧 Starting payment race condition protection migration...");

import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

export async function up() {
  console.log("📝 Adding payment race condition protection...");

  // Add new columns for race condition protection
  await db.execute(sql`
    ALTER TABLE payments 
    ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR UNIQUE,
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
  `);

  // Make stripe_payment_intent_id unique if not already
  await db.execute(sql`
    ALTER TABLE payments 
    ADD CONSTRAINT IF NOT EXISTS payments_stripe_payment_intent_id_unique 
    UNIQUE (stripe_payment_intent_id);
  `);

  // Add indexes for better performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_payment_status ON payments(status);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_payment_user ON payments(user_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_payment_stripe ON payments(stripe_payment_intent_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_payment_paypal ON payments(paypal_order_id);
  `);

  // Update existing payments to have version 1
  await db.execute(sql`
    UPDATE payments SET version = 1 WHERE version IS NULL;
  `);

  console.log(
    "✅ Payment race condition protection migration completed successfully",
  );
}

export async function down() {
  console.log("🗑️ Rolling back payment race condition protection...");

  // Remove indexes
  await db.execute(sql`DROP INDEX IF EXISTS idx_payment_status;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_payment_user;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_payment_stripe;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_payment_paypal;`);

  // Remove constraints
  await db.execute(
    sql`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_stripe_payment_intent_id_unique;`,
  );

  // Remove columns
  await db.execute(sql`
    ALTER TABLE payments 
    DROP COLUMN IF EXISTS paypal_order_id,
    DROP COLUMN IF EXISTS version;
  `);

  console.log("✅ Payment race condition protection rollback completed");
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await up();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}
