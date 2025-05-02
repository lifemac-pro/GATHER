import { type NextRequest, NextResponse } from "next/server";
import { type ZodSchema, ZodError } from "zod";
import { AppError, ErrorCode, apiErrorHandler } from "./error-handling";

/**
 * Type for API route handler options
 */
export interface ApiRouteHandlerOptions<T> {
  /**
   * Validation schema for request body
   */
  bodySchema?: ZodSchema<T>;

  /**
   * Validation schema for query parameters
   */
  querySchema?: ZodSchema<any>;

  /**
   * Validation schema for path parameters
   */
  paramsSchema?: ZodSchema<any>;

  /**
   * Required roles for authorization
   */
  requiredRoles?: ("admin" | "super_admin")[];

  /**
   * Whether to require authentication
   */
  requireAuth?: boolean;
}

/**
 * Type for API route handler function
 */
export type ApiRouteHandlerFn<T = any> = (options: {
  req: NextRequest;
  body?: T;
  query: Record<string, string>;
  params: Record<string, string>;
  session?: any;
}) => Promise<Response>;

/**
 * Create an API route handler with error handling and validation
 */
export function createApiRouteHandler<T = any>(
  handler: ApiRouteHandlerFn<T>,
  options: ApiRouteHandlerOptions<T> = {},
) {
  return async (
    req: NextRequest,
    { params = {} }: { params?: Record<string, string> } = {},
  ) => {
    return apiErrorHandler(async () => {
      // Parse query parameters
      const url = new URL(req.url);
      const query: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        query[key] = value;
      });

      // Validate query parameters
      if (options.querySchema) {
        try {
          options.querySchema.parse(query);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new AppError(
              ErrorCode.INVALID_INPUT,
              "Invalid query parameters",
              400,
              { validationErrors: error.errors },
            );
          }
          throw error;
        }
      }

      // Validate path parameters
      if (options.paramsSchema) {
        try {
          options.paramsSchema.parse(params);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new AppError(
              ErrorCode.INVALID_INPUT,
              "Invalid path parameters",
              400,
              { validationErrors: error.errors },
            );
          }
          throw error;
        }
      }

      // Parse and validate request body
      let body: T | undefined = undefined;

      if (req.method !== "GET" && req.method !== "HEAD") {
        try {
          const contentType = req.headers.get("content-type") || "";

          if (contentType.includes("application/json")) {
            body = await req.json();
          } else if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            body = Object.fromEntries(formData) as unknown as T;
          }

          // Validate body if schema is provided
          if (options.bodySchema && body) {
            body = options.bodySchema.parse(body);
          }
        } catch (error) {
          if (error instanceof ZodError) {
            throw new AppError(
              ErrorCode.INVALID_INPUT,
              "Invalid request body",
              400,
              { validationErrors: error.errors },
            );
          }

          if (error instanceof SyntaxError) {
            throw new AppError(
              ErrorCode.INVALID_INPUT,
              "Invalid JSON in request body",
              400,
            );
          }

          throw error;
        }
      }

      // Check authentication if required
      let session = null;

      if (options.requireAuth) {
        // This would typically use your auth system to get the session
        // For now, we'll just check for an authorization header
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
          throw new AppError(
            ErrorCode.UNAUTHORIZED,
            "Authentication required",
            401,
          );
        }

        // In a real app, you would validate the token and get the user session
        session = { userId: "user-id" };

        // Check roles if required
        if (options.requiredRoles && options.requiredRoles.length > 0) {
          const userRole = "admin"; // This would come from the session

          if (!options.requiredRoles.includes(userRole as any)) {
            throw new AppError(
              ErrorCode.FORBIDDEN,
              "Insufficient permissions",
              403,
            );
          }
        }
      }

      // Call the handler
      const response = await handler({
        req,
        body,
        query,
        params,
        session,
      });

      return response;
    });
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error response
 */
export function createErrorResponse(error: AppError) {
  return NextResponse.json(
    {
      success: false,
      error: error.toApiError(),
    },
    { status: error.statusCode },
  );
}
