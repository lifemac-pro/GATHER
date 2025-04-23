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
import { ZodError } from "zod";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { getAuth } from "@/server/auth";
import { trpcErrorHandler, handleZodError, AppError, ErrorCode } from "@/utils/error-handling";
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
  db: typeof db;
  headers: Headers;
  session: any | null;
}

export const createTRPCContext = async (opts: { headers: Headers }): Promise<Context> => {
  let session = null;

  try {
    // Ensure MongoDB is connected
    await connectToDatabase();

    const auth = await getAuth({ headers: opts.headers });

    // If auth is available, include the full auth object as session
    if (auth) {
      session = {
        userId: auth.userId,
        sessionId: auth.sessionId,
        user: auth && 'user' in auth && auth.user ? {
          id: auth.user.id,
          firstName: auth.user.firstName || '',
          lastName: auth.user.lastName || '',
          email: auth.user.email || ''
        } : undefined
      };
    }
  } catch (error) {
    console.error('Error in TRPC context:', error);
    // Continue without authentication

    // In development, provide a mock session
    if (process.env.NODE_ENV === 'development') {
      session = {
        userId: 'dev-user-id',
        sessionId: 'dev-session',
        user: {
          id: 'dev-user-id',
          firstName: 'Dev',
          lastName: 'User',
          email: 'dev@example.com'
        }
      };
    }
  }

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Format ZodErrors in a more user-friendly way
    const zodError = error.cause instanceof ZodError ? error.cause.flatten() : null;

    // Extract additional error details from AppError
    const appError = error.cause instanceof AppError ? error.cause.toApiError() : null;

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

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
// Apply error handling middleware to all procedures
const enhancedProcedure = t.procedure.use(errorHandlerMiddleware);

export const publicProcedure = enhancedProcedure;

/**
 * Protected (authenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It guarantees
 * that the user is authenticated before running the procedure.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = enhancedProcedure.use(({ ctx, next }) => {
  // Check if we have a session with a userId
  if (!ctx || !('session' in ctx) || !ctx.session || typeof ctx.session !== 'object' || !('userId' in ctx.session)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  // If we have a session, continue with the request
  return next({
    ctx: {
      ...ctx,
      // Ensure the session is passed to the next handler
      session: ctx && 'session' in ctx ? ctx.session : null,
    },
  });
});
