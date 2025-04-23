/**
 * Logger utility for consistent logging across the application
 *
 * This can be extended to integrate with external logging services
 * like Sentry, LogRocket, or DataDog in production.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000; // Limit memory usage in development

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log("debug", message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, context?: Record<string, any>): void {
    this.log("error", message, context);

    // In production, you would send this to an error tracking service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(new Error(message), { extra: context });
    }
  }

  /**
   * Log a message with the specified level
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
  ): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = { level, message, context, timestamp };

    // Store log in memory (for development)
    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift(); // Remove oldest log if we exceed the limit
    }

    // Output to console with appropriate formatting
    const formattedContext = context ? ` ${JSON.stringify(context)}` : "";

    switch (level) {
      case "debug":
        console.debug(`[${timestamp}] DEBUG: ${message}${formattedContext}`);
        break;
      case "info":
        console.info(`[${timestamp}] INFO: ${message}${formattedContext}`);
        break;
      case "warn":
        console.warn(`[${timestamp}] WARN: ${message}${formattedContext}`);
        break;
      case "error":
        console.error(`[${timestamp}] ERROR: ${message}${formattedContext}`);
        break;
    }
  }

  /**
   * Get all logs (for debugging purposes)
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

/**
 * Error handler for API routes
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, any>,
): { message: string; status: number } {
  // Log the error
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(errorMessage, {
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Determine appropriate status code
  let status = 500;
  if (error instanceof Error) {
    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("Not Found")
    ) {
      status = 404;
    } else if (
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("Unauthorized")
    ) {
      status = 401;
    } else if (
      errorMessage.includes("forbidden") ||
      errorMessage.includes("Forbidden")
    ) {
      status = 403;
    } else if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid")
    ) {
      status = 400;
    }
  }

  return {
    message: errorMessage,
    status,
  };
}
