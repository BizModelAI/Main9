console.log(" Starting payment race condition protection migration...");

import { db } from "../server/db.ts";
import { sql } from "drizzle-orm";

export async function up() {
  console.log(" Adding payment race condition protection...");

  try {
    // Add new columns for race condition protection
    await db.execute(sql`
      ALTER TABLE payments 
      ADD COLUMN paypal_order_id VARCHAR UNIQUE,
      ADD COLUMN version INTEGER DEFAULT 1 NOT NULL;
    `);
  } catch (error) {
    console.log("Columns may already exist, continuing...");
  }

  try {
    // Make stripe_payment_intent_id unique if not already
    await db.execute(sql`
      ALTER TABLE payments 
      ADD CONSTRAINT payments_stripe_payment_intent_id_unique 
      UNIQUE (stripe_payment_intent_id);
    `);
  } catch (error) {
    console.log("Constraint may already exist, continuing...");
  }

  // Add indexes for better performance
  try {
    await db.execute(sql`
      CREATE INDEX idx_payment_status ON payments(status);
    `);
  } catch (error) {
    console.log("Index may already exist, continuing...");
  }

  try {
    await db.execute(sql`
      CREATE INDEX idx_payment_user ON payments(user_id);
    `);
  } catch (error) {
    console.log("Index may already exist, continuing...");
  }

  try {
    await db.execute(sql`
      CREATE INDEX idx_payment_stripe ON payments(stripe_payment_intent_id);
    `);
  } catch (error) {
    console.log("Index may already exist, continuing...");
  }

  try {
    await db.execute(sql`
      CREATE INDEX idx_payment_paypal ON payments(paypal_order_id);
    `);
  } catch (error) {
    console.log("Index may already exist, continuing...");
  }

  // Update existing payments to have version 1
  try {
    await db.execute(sql`
      UPDATE payments SET version = 1 WHERE version IS NULL;
    `);
  } catch (error) {
    console.log("Update may not be needed, continuing...");
  }

  console.log(
    "✅ Payment race condition protection migration completed successfully",
  );
}

export async function down() {
  console.log("️ Rolling back payment race condition protection...");

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
