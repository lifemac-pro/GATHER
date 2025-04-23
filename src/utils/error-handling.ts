import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { type ApiError } from "@/types/api-responses";

/**
 * Error codes for the application
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Input validation errors
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",

  // Business logic errors
  EVENT_FULL = "EVENT_FULL",
  EVENT_ENDED = "EVENT_ENDED",
  ALREADY_REGISTERED = "ALREADY_REGISTERED",
  PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
  PAYMENT_FAILED = "PAYMENT_FAILED",

  // Server errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  REQUEST_TIMEOUT = "REQUEST_TIMEOUT",
  API_ERROR = "API_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",

  // Rate limiting
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
}

/**
 * Application error class
 */
export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, any>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert to API error format
   */
  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  /**
   * Convert to TRPC error
   */
  toTRPCError(): TRPCError {
    return new TRPCError({
      code: this.mapToTRPCErrorCode(),
      message: this.message,
      cause: this,
    });
  }

  /**
   * Map application error code to TRPC error code
   */
  private mapToTRPCErrorCode(): any {
    switch (this.code) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.INVALID_CREDENTIALS:
      case ErrorCode.SESSION_EXPIRED:
        return "UNAUTHORIZED";
      case ErrorCode.FORBIDDEN:
        return "FORBIDDEN";
      case ErrorCode.NOT_FOUND:
        return "NOT_FOUND";
      case ErrorCode.ALREADY_EXISTS:
      case ErrorCode.CONFLICT:
      case ErrorCode.INVALID_INPUT:
      case ErrorCode.MISSING_REQUIRED_FIELD:
      case ErrorCode.INVALID_FORMAT:
      case ErrorCode.EVENT_FULL:
      case ErrorCode.EVENT_ENDED:
      case ErrorCode.ALREADY_REGISTERED:
      case ErrorCode.PAYMENT_REQUIRED:
      case ErrorCode.PAYMENT_FAILED:
        return "BAD_REQUEST";
      case ErrorCode.INTERNAL_SERVER_ERROR:
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
        return "INTERNAL_SERVER_ERROR";
      case ErrorCode.TOO_MANY_REQUESTS:
        return "TOO_MANY_REQUESTS";
      default:
        return "INTERNAL_SERVER_ERROR";
    }
  }
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): AppError {
  const formattedErrors = error.errors.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));

  return new AppError(ErrorCode.INVALID_INPUT, "Validation error", 400, {
    validationErrors: formattedErrors,
  });
}

/**
 * Handle Mongoose errors
 */
export function handleMongooseError(error: any): AppError {
  // Handle duplicate key error
  if (error.code === 11000 && error.keyValue) {
    const field = Object.keys(error.keyValue)[0];
    const value = field ? error.keyValue[field] : undefined;
    return new AppError(
      ErrorCode.ALREADY_EXISTS,
      `${field} already exists`,
      409,
      { field, value },
    );
  }

  // Handle validation error
  if (error.name === "ValidationError") {
    const errors = Object.keys(error.errors).map((field) => ({
      field,
      message: error.errors[field].message,
    }));

    return new AppError(ErrorCode.INVALID_INPUT, "Validation error", 400, {
      validationErrors: errors,
    });
  }

  // Handle other database errors
  return new AppError(ErrorCode.DATABASE_ERROR, "Database error", 500, {
    originalError: error.message,
  });
}

/**
 * Global error handler for API routes
 */
export async function apiErrorHandler(fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.toApiError() };
    }

    if (error instanceof ZodError) {
      const appError = handleZodError(error);
      return { success: false, error: appError.toApiError() };
    }

    if (error instanceof Error) {
      const appError = new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "An unexpected error occurred",
        500,
      );
      return { success: false, error: appError.toApiError() };
    }

    // Fallback for unknown errors
    const appError = new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      500,
    );
    return { success: false, error: appError.toApiError() };
  }
}

/**
 * TRPC error handler middleware
 */
export function trpcErrorHandler() {
  return async (opts: any) => {
    try {
      return await opts.next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error.toTRPCError();
      }

      if (error instanceof ZodError) {
        const appError = handleZodError(error);
        throw appError.toTRPCError();
      }

      if (error instanceof TRPCError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "An unexpected error occurred",
          cause: error,
        });
      }

      // Fallback for unknown errors
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  };
}
