/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";

// Remove references to 'enhancedProcedure' if unused
import { ZodError } from "zod";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { getAuth } from "@/server/auth";
import {
  trpcErrorHandler,
  handleZodError,
  AppError,
  ErrorCode,
} from "@/utils/error-handling";
import { connectToDatabase } from "@/server/db/mongo";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */
/**
 * Context type for TRPC
 */
export interface Context {
  session: {
    userId: string;
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role?: "admin" | "super_admin" | "user";
    };
  } | null;
}

// Context creator
export const createTRPCContext = async (opts: { headers: Headers }): Promise<Context> => {
  const auth = await getAuth(opts);
  
  // Handle auth response types properly
  if (!auth) return { session: null };

  // For development environment fallback
  if ('user' in auth) {
    return {
      session: {
        userId: auth.userId,
        user: {
          id: auth.userId,
          email: auth.user.email,
          firstName: auth.user.firstName || '',
          lastName: auth.user.lastName || '',
          role: 'user'
        }
      }
    };
  }

  // For production Clerk auth
  return {
    session: {
      userId: auth.userId,
      user: {
        id: auth.userId,
        // Use type assertion since we know the shape of auth in production
        email: (auth as any).emailAddresses?.[0]?.emailAddress || '',
        firstName: (auth as any).firstName || '',
        lastName: (auth as any).lastName || '',
        role: ((auth as any).publicMetadata?.role as "admin" | "super_admin" | "user") || "user"
      }
    }
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Format ZodErrors in a more user-friendly way
    const zodError =
      error.cause instanceof ZodError ? error.cause.flatten() : null;

    // Extract additional error details from AppError
    const appError =
      error.cause instanceof AppError ? error.cause.toApiError() : null;

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError,
        appError,
      },
    };
  },
});

// Add error handling middleware
const middleware = t.middleware;
const errorHandlerMiddleware = middleware(trpcErrorHandler());

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

// Base procedure
const procedure = t.procedure;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = procedure;

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = procedure.use(({ ctx, next }) => {
  if (!ctx?.session?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Admin procedure - requires authentication and admin role
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const user = ctx.session?.user;
  if (!user?.role || (user.role !== "admin" && user.role !== "super_admin")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource"
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Super Admin procedure - requires authentication and super admin role
 */
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const user = ctx.session?.user;
  if (!user?.role || user.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be a super admin to access this resource"
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
