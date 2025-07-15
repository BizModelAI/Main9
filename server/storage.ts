console.log("Starting to import storage.ts...");
import {
  users,
  quizAttempts,
  payments,
  refunds,
  unpaidUserEmails,
  passwordResetTokens,
  type User,
  type InsertUser,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Payment,
  type InsertPayment,
  type Refund,
  type InsertRefund,
  type UnpaidUserEmail,
  type InsertUnpaidUserEmail,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "../shared/schema.js";
console.log("Schema imported successfully");
import { db } from "./db.js";
console.log("Database imported successfully");
import { eq, desc, count, sql, and } from "drizzle-orm";
console.log("Drizzle ORM imported successfully");

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Quiz retake operations
  recordQuizAttempt(
    attempt: Omit<InsertQuizAttempt, "id">,
  ): Promise<QuizAttempt>;
  getQuizAttemptsCount(userId: number): Promise<number>;
  getQuizAttempts(userId: number): Promise<QuizAttempt[]>;
  canUserRetakeQuiz(userId: number): Promise<boolean>;

  // AI content operations
  saveAIContentToQuizAttempt(
    quizAttemptId: number,
    aiContent: any,
  ): Promise<void>;
  getAIContentForQuizAttempt(quizAttemptId: number): Promise<any | null>;
  decrementQuizRetakes(userId: number): Promise<void>;

  // Payment operations
  createPayment(payment: Omit<InsertPayment, "id">): Promise<Payment>;
  completePayment(paymentId: number): Promise<void>;
  linkPaymentToQuizAttempt(
    paymentId: number,
    quizAttemptId: number,
  ): Promise<void>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPaymentsByStripeId(stripePaymentIntentId: string): Promise<Payment[]>;
  getPaymentById(paymentId: number): Promise<Payment | undefined>;
  getAllPayments(): Promise<Payment[]>;

  // Refund operations
  createRefund(refund: Omit<InsertRefund, "id">): Promise<Refund>;
  updateRefundStatus(
    refundId: number,
    status: string,
    processedAt?: Date,
    stripeRefundId?: string,
    paypalRefundId?: string,
  ): Promise<void>;
  getRefundsByPayment(paymentId: number): Promise<Refund[]>;
  getRefundById(refundId: number): Promise<Refund | undefined>;
  getAllRefunds(): Promise<Refund[]>;

  // Unpaid user email tracking
  storeUnpaidUserEmail(
    sessionId: string,
    email: string,
    quizData: any,
  ): Promise<UnpaidUserEmail>;
  getUnpaidUserEmail(sessionId: string): Promise<UnpaidUserEmail | undefined>;
  cleanupExpiredUnpaidEmails(): Promise<void>;

  // User status checks
  isPaidUser(userId: number): Promise<boolean>;

  // Password reset operations
  createPasswordResetToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;

  // Data cleanup utilities
  cleanupExpiredData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizAttempts: Map<number, QuizAttempt>;
  private payments: Map<number, Payment>;
  private unpaidUserEmails: Map<string, UnpaidUserEmail>;
  private passwordResetTokens: Map<string, PasswordResetToken>;
  currentId: number;
  currentQuizAttemptId: number;
  currentPaymentId: number;
  currentUnpaidEmailId: number;
  currentPasswordResetTokenId: number;

  constructor() {
    this.users = new Map();
    this.quizAttempts = new Map();
    this.payments = new Map();
    this.unpaidUserEmails = new Map();
    this.passwordResetTokens = new Map();
    this.currentId = 1;
    this.currentQuizAttemptId = 1;
    this.currentPaymentId = 1;
    this.currentUnpaidEmailId = 1;
    this.currentPasswordResetTokenId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      name: insertUser.name ?? null,
      id,
      email: null,
      isUnsubscribed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    // Delete user and all associated data
    this.users.delete(id);

    // Delete quiz attempts
    for (const [attemptId, attempt] of Array.from(
      this.quizAttempts.entries(),
    )) {
      if (attempt.userId === id) {
        this.quizAttempts.delete(attemptId);
      }
    }

    // Delete payments
    for (const [paymentId, payment] of Array.from(this.payments.entries())) {
      if (payment.userId === id) {
        this.payments.delete(paymentId);
      }
    }
  }

  async recordQuizAttempt(
    attempt: Omit<InsertQuizAttempt, "id">,
  ): Promise<QuizAttempt> {
    const id = this.currentQuizAttemptId++;
    const quizAttempt: QuizAttempt = {
      ...attempt,
      id,
      completedAt: new Date(),
      aiContent: attempt.aiContent || null,
    };
    this.quizAttempts.set(id, quizAttempt);
    return quizAttempt;
  }

  async getQuizAttemptsCount(userId: number): Promise<number> {
    return Array.from(this.quizAttempts.values()).filter(
      (attempt) => attempt.userId === userId,
    ).length;
  }

  async getQuizAttempts(userId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values())
      .filter((attempt) => attempt.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()); // Most recent first
  }

  async canUserRetakeQuiz(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const attemptCount = await this.getQuizAttemptsCount(userId);

    // First quiz is free
    if (attemptCount === 0) return true;

    // In pure pay-per-report model, everyone can take unlimited quizzes
    return true;
  }

  async saveAIContentToQuizAttempt(
    quizAttemptId: number,
    aiContent: any,
  ): Promise<void> {
    const attempt = this.quizAttempts.get(quizAttemptId);
    if (attempt) {
      attempt.aiContent = aiContent;
    }
  }

  async getAIContentForQuizAttempt(quizAttemptId: number): Promise<any | null> {
    const attempt = this.quizAttempts.get(quizAttemptId);
    return attempt?.aiContent || null;
  }

  async decrementQuizRetakes(userId: number): Promise<void> {
    // No longer needed in pay-per-report system
    // This method is kept for backward compatibility but does nothing
    console.log(
      "decrementQuizRetakes called but no longer needed in pay-per-report system",
    );
  }

  async createPayment(payment: Omit<InsertPayment, "id">): Promise<Payment> {
    const id = this.currentPaymentId++;
    const newPayment: Payment = {
      ...payment,
      id,
      status: payment.status || "pending",
      currency: payment.currency || "usd",
      stripePaymentIntentId: payment.stripePaymentIntentId || null,
      quizAttemptId: payment.quizAttemptId || null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async completePayment(paymentId: number): Promise<void> {
    const payment = this.payments.get(paymentId);
    if (!payment) return;

    // Update payment status
    const completedPayment = {
      ...payment,
      status: "completed" as const,
      completedAt: new Date(),
    };
    this.payments.set(paymentId, completedPayment);

    // Payment completed - no need to update user access in pay-per-report model
  }

  async linkPaymentToQuizAttempt(
    paymentId: number,
    quizAttemptId: number,
  ): Promise<void> {
    const payment = this.payments.get(paymentId);
    if (!payment) return;

    const updatedPayment = {
      ...payment,
      quizAttemptId,
    };
    this.payments.set(paymentId, updatedPayment);
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter((payment) => payment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPaymentsByStripeId(
    stripePaymentIntentId: string,
  ): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.stripePaymentIntentId === stripePaymentIntentId,
    );
  }

  async getPaymentById(paymentId: number): Promise<Payment | undefined> {
    return this.payments.get(paymentId);
  }

  async storeUnpaidUserEmail(
    sessionId: string,
    email: string,
    quizData: any,
  ): Promise<UnpaidUserEmail> {
    const id = this.currentUnpaidEmailId++;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const unpaidUserEmail: UnpaidUserEmail = {
      id,
      sessionId,
      email,
      quizData,
      createdAt: new Date(),
      expiresAt,
    };

    this.unpaidUserEmails.set(sessionId, unpaidUserEmail);
    return unpaidUserEmail;
  }

  async getUnpaidUserEmail(
    sessionId: string,
  ): Promise<UnpaidUserEmail | undefined> {
    const email = this.unpaidUserEmails.get(sessionId);
    if (!email) return undefined;

    // Check if expired
    if (email.expiresAt < new Date()) {
      this.unpaidUserEmails.delete(sessionId);
      return undefined;
    }

    return email;
  }

  async cleanupExpiredUnpaidEmails(): Promise<void> {
    const now = new Date();
    for (const [sessionId, email] of Array.from(
      this.unpaidUserEmails.entries(),
    )) {
      if (email.expiresAt < now) {
        this.unpaidUserEmails.delete(sessionId);
      }
    }
  }

  async isPaidUser(userId: number): Promise<boolean> {
    // In pay-per-report model, we check if user has any completed payments
    const payments = await this.getPaymentsByUser(userId);
    return payments.some((p) => p.status === "completed");
  }

  async createPasswordResetToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const id = this.currentPasswordResetTokenId++;
    const resetToken: PasswordResetToken = {
      id,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    };
    this.passwordResetTokens.set(token, resetToken);
    return resetToken;
  }

  async getPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | undefined> {
    return this.passwordResetTokens.get(token);
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    this.passwordResetTokens.delete(token);
  }

  async updateUserPassword(
    userId: number,
    hashedPassword: string,
  ): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, {
        ...user,
        password: hashedPassword,
        updatedAt: new Date(),
      });
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  // Refund operations (Note: MemStorage is for testing only)
  async createRefund(refund: Omit<InsertRefund, "id">): Promise<Refund> {
    throw new Error(
      "Refund operations not supported in MemStorage - use DatabaseStorage",
    );
  }

  async updateRefundStatus(
    refundId: number,
    status: string,
    processedAt?: Date,
    stripeRefundId?: string,
    paypalRefundId?: string,
  ): Promise<void> {
    throw new Error(
      "Refund operations not supported in MemStorage - use DatabaseStorage",
    );
  }

  async getRefundsByPayment(paymentId: number): Promise<Refund[]> {
    throw new Error(
      "Refund operations not supported in MemStorage - use DatabaseStorage",
    );
  }

  async getRefundById(refundId: number): Promise<Refund | undefined> {
    throw new Error(
      "Refund operations not supported in MemStorage - use DatabaseStorage",
    );
  }

  async getAllRefunds(): Promise<Refund[]> {
    throw new Error(
      "Refund operations not supported in MemStorage - use DatabaseStorage",
    );
  }

  async cleanupExpiredData(): Promise<void> {
    // Clean up expired unpaid email data
    await this.cleanupExpiredUnpaidEmails();

    // Note: For paid users, we never delete their data
    // For unpaid users, data is only stored in unpaidUserEmails table with 24h expiry
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private ensureDb() {
    if (!db) {
      throw new Error("Database not available");
    }
    return db;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.ensureDb()
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.ensureDb()
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.ensureDb()
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.ensureDb()
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    console.log("Storage updateUser: Updating user", id, "with:", updates);

    const [user] = await this.ensureDb()
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    console.log(
      "Storage updateUser: Result:",
      user ? { id: user.id, name: user.name, email: user.email } : "null",
    );

    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await this.ensureDb().transaction(async (tx) => {
      // Delete quiz attempts first (due to foreign key constraints)
      await tx.delete(quizAttempts).where(eq(quizAttempts.userId, id));

      // Delete payments
      await tx.delete(payments).where(eq(payments.userId, id));

      // Finally delete the user
      const [deletedUser] = await tx
        .delete(users)
        .where(eq(users.id, id))
        .returning();

      if (!deletedUser) {
        throw new Error("User not found");
      }
    });
  }

  async recordQuizAttempt(
    attempt: Omit<InsertQuizAttempt, "id">,
  ): Promise<QuizAttempt> {
    // Use transaction for concurrent safety
    return await this.ensureDb().transaction(async (tx) => {
      const [quizAttempt] = await tx
        .insert(quizAttempts)
        .values(attempt)
        .returning();
      return quizAttempt;
    });
  }

  async getQuizAttemptsCount(userId: number): Promise<number> {
    const result = await this.ensureDb()
      .select({ count: count() })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));
    return result[0].count;
  }

  async getQuizAttempts(userId: number): Promise<QuizAttempt[]> {
    return await this.ensureDb()
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async canUserRetakeQuiz(userId: number): Promise<boolean> {
    const [user] = await this.ensureDb()
      .select()
      .from(users)
      .where(eq(users.id, userId));
    // In the pure pay-per-report system: everyone can take unlimited quizzes
    return user ? true : false;
  }

  async saveAIContentToQuizAttempt(
    quizAttemptId: number,
    aiContent: any,
  ): Promise<void> {
    await this.ensureDb()
      .update(quizAttempts)
      .set({ aiContent })
      .where(eq(quizAttempts.id, quizAttemptId));
  }

  async getAIContentForQuizAttempt(quizAttemptId: number): Promise<any | null> {
    const [attempt] = await this.ensureDb()
      .select({ aiContent: quizAttempts.aiContent })
      .from(quizAttempts)
      .where(eq(quizAttempts.id, quizAttemptId));
    return attempt?.aiContent || null;
  }

  async decrementQuizRetakes(userId: number): Promise<void> {
    // No longer needed in pay-per-report system
    // This method is kept for backward compatibility but does nothing
    console.log(
      "decrementQuizRetakes called but no longer needed in pay-per-report system",
    );
  }

  async createPayment(payment: Omit<InsertPayment, "id">): Promise<Payment> {
    const [newPayment] = await this.ensureDb()
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async completePayment(paymentId: number): Promise<void> {
    await this.ensureDb().transaction(async (tx) => {
      // Update payment status
      const [payment] = await tx
        .update(payments)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))
        .returning();

      if (!payment) {
        throw new Error("Payment not found");
      }

      // Payment completed - no need to update user access in pay-per-report model
    });
  }

  async linkPaymentToQuizAttempt(
    paymentId: number,
    quizAttemptId: number,
  ): Promise<void> {
    await this.ensureDb()
      .update(payments)
      .set({
        quizAttemptId: quizAttemptId,
      })
      .where(eq(payments.id, paymentId));
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return await this.ensureDb()
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByStripeId(
    stripePaymentIntentId: string,
  ): Promise<Payment[]> {
    return await this.ensureDb()
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
  }

  async getPaymentById(paymentId: number): Promise<Payment | undefined> {
    const [payment] = await this.ensureDb()
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));
    return payment || undefined;
  }

  async getAllPayments(): Promise<Payment[]> {
    return await this.ensureDb()
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
  }

  // Refund operations
  async createRefund(refund: Omit<InsertRefund, "id">): Promise<Refund> {
    const [newRefund] = await this.ensureDb()
      .insert(refunds)
      .values(refund)
      .returning();
    return newRefund;
  }

  async updateRefundStatus(
    refundId: number,
    status: string,
    processedAt?: Date,
    stripeRefundId?: string,
    paypalRefundId?: string,
  ): Promise<void> {
    const updateData: any = { status };
    if (processedAt) updateData.processedAt = processedAt;
    if (stripeRefundId) updateData.stripeRefundId = stripeRefundId;
    if (paypalRefundId) updateData.paypalRefundId = paypalRefundId;

    await this.ensureDb()
      .update(refunds)
      .set(updateData)
      .where(eq(refunds.id, refundId));
  }

  async getRefundsByPayment(paymentId: number): Promise<Refund[]> {
    return await this.ensureDb()
      .select()
      .from(refunds)
      .where(eq(refunds.paymentId, paymentId))
      .orderBy(desc(refunds.createdAt));
  }

  async getRefundById(refundId: number): Promise<Refund | undefined> {
    const [refund] = await this.ensureDb()
      .select()
      .from(refunds)
      .where(eq(refunds.id, refundId));
    return refund || undefined;
  }

  async getAllRefunds(): Promise<Refund[]> {
    return await this.ensureDb()
      .select()
      .from(refunds)
      .orderBy(desc(refunds.createdAt));
  }

  async storeUnpaidUserEmail(
    sessionId: string,
    email: string,
    quizData: any,
  ): Promise<UnpaidUserEmail> {
    console.log("storeUnpaidUserEmail called with:", {
      sessionId,
      email,
      quizDataKeys: Object.keys(quizData),
    });

    try {
      // Use transaction for concurrent safety
      return await this.ensureDb().transaction(async (tx) => {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        console.log("Calculated expiresAt:", expiresAt);

        console.log("Deleting existing record for session:", sessionId);
        // Delete any existing record for this session
        await tx
          .delete(unpaidUserEmails)
          .where(eq(unpaidUserEmails.sessionId, sessionId));

        console.log("Inserting new unpaid user email record...");
        const [newUnpaidUserEmail] = await tx
          .insert(unpaidUserEmails)
          .values({
            sessionId,
            email,
            quizData,
            expiresAt,
          })
          .returning();

        console.log(
          "Successfully stored unpaid user email:",
          newUnpaidUserEmail?.id,
        );
        return newUnpaidUserEmail;
      });
    } catch (error) {
      console.error("Error in storeUnpaidUserEmail:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );
      throw error;
    }
  }

  async getUnpaidUserEmail(
    sessionId: string,
  ): Promise<UnpaidUserEmail | undefined> {
    const [email] = await this.ensureDb()
      .select()
      .from(unpaidUserEmails)
      .where(eq(unpaidUserEmails.sessionId, sessionId));

    if (!email) return undefined;

    // Check if expired
    if (email.expiresAt < new Date()) {
      await this.ensureDb()
        .delete(unpaidUserEmails)
        .where(eq(unpaidUserEmails.sessionId, sessionId));
      return undefined;
    }

    return email;
  }

  async cleanupExpiredUnpaidEmails(): Promise<void> {
    try {
      await this.ensureDb()
        .delete(unpaidUserEmails)
        .where(sql`${unpaidUserEmails.expiresAt} < ${new Date()}`);
    } catch (error) {
      console.error("Error cleaning up expired unpaid emails:", error);
      // Don't throw - just log the error
    }
  }

  async isPaidUser(userId: number): Promise<boolean> {
    try {
      const userPayments = await this.ensureDb()
        .select()
        .from(payments)
        .where(
          and(eq(payments.userId, userId), eq(payments.status, "completed")),
        );
      return userPayments.length > 0;
    } catch (error) {
      console.error("Error checking if user is paid:", error);
      return false; // Default to unpaid if there's an error
    }
  }

  async createPasswordResetToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    const [resetToken] = await this.ensureDb()
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await this.ensureDb()
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await this.ensureDb()
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(
    userId: number,
    hashedPassword: string,
  ): Promise<void> {
    await this.ensureDb()
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async cleanupExpiredData(): Promise<void> {
    try {
      // Clean up expired unpaid email data
      await this.cleanupExpiredUnpaidEmails();
      console.log("Successfully cleaned up expired data");
    } catch (error) {
      console.error("Error during data cleanup:", error);
      // Don't throw - just log the error to prevent server crashes
    }

    // Note: For paid users, we never delete their data
    // For unpaid users, data is only stored in unpaidUserEmails table with 24h expiry
  }
}

export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
