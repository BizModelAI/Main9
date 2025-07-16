import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  varchar,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Email is now the primary identifier
  password: text("password").notNull(),
  name: text("name"), // User's full name
  isUnsubscribed: boolean("is_unsubscribed").default(false).notNull(),
  // New fields to consolidate paid/unpaid users
  sessionId: text("session_id"), // Session ID for temporary/unpaid users
  isPaid: boolean("is_paid").default(false).notNull(), // Whether user has made payment
  isTemporary: boolean("is_temporary").default(false).notNull(), // Whether user is temporary (unpaid)
  tempQuizData: jsonb("temp_quiz_data"), // Temporary quiz data for unpaid users
  expiresAt: timestamp("expires_at"), // Expiration for temporary users (3 months for email-provided, 24 hours for session-only)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz attempts table to track when users take the quiz
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  quizData: jsonb("quiz_data").notNull(),
  aiContent: jsonb("ai_content"), // DEPRECATED: Use ai_content table instead
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  // Note: No expiresAt needed - quiz attempts expire when user expires via CASCADE delete
});

// AI Content table - stores all AI-generated content separately for better performance and deduplication
export const aiContent = pgTable(
  "ai_content",
  {
    id: serial("id").primaryKey(),
    quizAttemptId: integer("quiz_attempt_id")
      .references(() => quizAttempts.id, { onDelete: "cascade" })
      .notNull(),
    contentType: varchar("content_type", { length: 100 }).notNull(), // "preview", "fullReport", "model_BusinessName", "characteristics", etc.
    content: jsonb("content").notNull(), // No artificial size limits - let PostgreSQL handle it
    contentHash: varchar("content_hash", { length: 64 }), // SHA-256 hash for deduplication
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // One content type per quiz attempt (allows updates)
    uniqueContentPerAttempt: unique().on(
      table.quizAttemptId,
      table.contentType,
    ),
  }),
);

// Payments table to track individual quiz payments
export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency").default("usd").notNull(),
    type: varchar("type").notNull(), // "access_pass" or "quiz_payment"
    stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(), // Prevent duplicate Stripe payments
    paypalOrderId: varchar("paypal_order_id").unique(), // Prevent duplicate PayPal payments
    status: varchar("status").default("pending").notNull(), // "pending", "completed", "failed"
    quizAttemptId: integer("quiz_attempt_id").references(
      () => quizAttempts.id,
      {
        onDelete: "cascade",
      },
    ), // Links payment to specific quiz
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    // Version field for optimistic locking to prevent race conditions
    version: integer("version").default(1).notNull(),
  },
  (table) => ({
    // Ensure only one payment per quiz attempt can be completed
    uniqueCompletedPaymentPerQuiz: unique()
      .on(table.quizAttemptId, table.status)
      .where(sql`${table.status} = 'completed'`),
    // Index for faster payment lookups
    paymentStatusIndex: index("idx_payment_status").on(table.status),
    paymentUserIndex: index("idx_payment_user").on(table.userId),
  }),
);

// DEPRECATED: Temporary email tracking for unpaid users (expires after 24 hours)
// This table is now consolidated into the users table - keeping for migration purposes only
export const unpaidUserEmails = pgTable("unpaid_user_emails", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(), // Browser session ID
  email: text("email").notNull(),
  quizData: jsonb("quiz_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Report views tracking for optimizing user experience
export const reportViews = pgTable("report_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  sessionId: text("session_id"), // For anonymous users
  quizAttemptId: integer("quiz_attempt_id")
    .references(() => quizAttempts.id, { onDelete: "cascade" })
    .notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Refunds table for tracking refund history
export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id")
    .references(() => payments.id, { onDelete: "cascade" })
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("usd").notNull(),
  reason: varchar("reason").notNull(), // "requested_by_customer", "duplicate", "fraudulent", etc.
  status: varchar("status").default("pending").notNull(), // "pending", "succeeded", "failed", "cancelled"
  stripeRefundId: varchar("stripe_refund_id"),
  paypalRefundId: varchar("paypal_refund_id"),
  adminUserId: integer("admin_user_id"), // Track which admin processed the refund
  adminNote: text("admin_note"), // Optional note from admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertUnpaidUserEmailSchema = createInsertSchema(unpaidUserEmails);
export const insertPasswordResetTokenSchema =
  createInsertSchema(passwordResetTokens);
export const insertRefundSchema = createInsertSchema(refunds);
export const insertReportViewSchema = createInsertSchema(reportViews);
export const insertAiContentSchema = createInsertSchema(aiContent);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type UnpaidUserEmail = typeof unpaidUserEmails.$inferSelect;
export type InsertUnpaidUserEmail = z.infer<typeof insertUnpaidUserEmailSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<
  typeof insertPasswordResetTokenSchema
>;
export type ReportView = typeof reportViews.$inferSelect;
export type InsertReportView = z.infer<typeof insertReportViewSchema>;
export type AiContent = typeof aiContent.$inferSelect;
export type InsertAiContent = z.infer<typeof insertAiContentSchema>;
