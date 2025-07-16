// Centralized Error Handling Utility
// Replaces dangerous silent failures with proper error handling

export interface ErrorHandlingOptions {
  operation: string;
  context: Record<string, any>;
  isCritical?: boolean;
  shouldThrow?: boolean;
  fallbackValue?: any;
}

export class ErrorHandler {
  private static alertingEnabled = process.env.NODE_ENV === "production";

  /**
   * Handle database storage errors safely
   */
  static async handleStorageError(
    error: Error,
    options: ErrorHandlingOptions,
  ): Promise<any> {
    const {
      operation,
      context,
      isCritical = false,
      shouldThrow = false,
      fallbackValue,
    } = options;

    // Log the error with context
    console.error(`❌ Storage Error in ${operation}:`, {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Send alerts for critical errors in production
    if (this.alertingEnabled && isCritical) {
      await this.sendAlert({
        type: "CRITICAL_STORAGE_ERROR",
        operation,
        error: error.message,
        context,
      });
    }

    // Throw if it's a critical operation that shouldn't continue
    if (shouldThrow || isCritical) {
      throw new Error(`Critical ${operation} failed: ${error.message}`);
    }

    // Return fallback value for non-critical operations
    return fallbackValue;
  }

  /**
   * Handle API errors with proper user feedback
   */
  static handleAPIError(
    error: Error,
    operation: string,
    res: any,
    statusCode: number = 500,
  ): void {
    console.error(`❌ API Error in ${operation}:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    res.status(statusCode).json({
      success: false,
      error: "Internal server error",
      message: `${operation} failed`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle non-critical failures with warnings
   */
  static handleNonCriticalError(
    error: Error,
    operation: string,
    context: Record<string, any> = {},
  ): void {
    console.warn(`⚠️ Non-critical error in ${operation}:`, {
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
    });

    // Still track these for monitoring
    if (this.alertingEnabled) {
      this.sendAlert({
        type: "NON_CRITICAL_ERROR",
        operation,
        error: error.message,
        context,
      }).catch((alertError) => {
        console.error("Failed to send alert:", alertError);
      });
    }
  }

  /**
   * Send alerts to monitoring system (implement based on your alerting setup)
   */
  private static async sendAlert(alertData: {
    type: string;
    operation: string;
    error: string;
    context: Record<string, any>;
  }): Promise<void> {
    try {
      // TODO: Implement actual alerting (e.g., Slack, email, monitoring service)
      // For now, just enhanced logging
      console.error(" ALERT:", {
        ...alertData,
        timestamp: new Date().toISOString(),
      });

      // Example webhook call (uncomment and configure as needed):
      // await fetch(process.env.ALERT_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(alertData),
      // });
    } catch (error) {
      console.error("Failed to send alert:", error);
    }
  }

  /**
   * Wrap async operations with error handling
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    options: ErrorHandlingOptions,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      return await this.handleStorageError(error as Error, options);
    }
  }
}

// Standard error response format
export interface StandardErrorResponse {
  success: false;
  error: string;
  message: string;
  timestamp: string;
  code?: string;
}

// Helper function to create standard error responses
export function createErrorResponse(
  message: string,
  error: string = "Internal server error",
  code?: string,
): StandardErrorResponse {
  return {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
    code,
  };
}
