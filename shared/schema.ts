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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"), // User's full name
  email: text("email"), // Optional email for paid users
  isUnsubscribed: boolean("is_unsubscribed").default(false).notNull(),
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
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Payments table to track individual quiz payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("usd").notNull(),
  type: varchar("type").notNull(), // "access_pass" or "quiz_payment"
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  status: varchar("status").default("pending").notNull(), // "pending", "completed", "failed"
  quizAttemptId: integer("quiz_attempt_id").references(() => quizAttempts.id, {
    onDelete: "cascade",
  }), // Links payment to specific quiz
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Temporary email tracking for unpaid users (expires after 24 hours)
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
  username: true,
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
