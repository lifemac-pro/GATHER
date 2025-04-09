import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getAuth } from "@clerk/nextjs/server";
import clientPromise from "@/server/db/mongodb";
import { NextRequest } from "next/server";

/**
 * 1. CONTEXT
 * Defines the context available in the backend API.
 */
export const createTRPCContext = async (opts: { req: NextRequest }) => {
  const { userId } = getAuth(opts.req);
  
  const client = await clientPromise;
  const db = client.db();

  return {
    db,
    userId,
    req: opts.req,
  };
};

/**
 * 2. INITIALIZATION
 * Initializes tRPC API with context and error handling.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE
 * Creates routers and procedures for tRPC API.
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for logging execution time.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  const result = await next();
  console.log(`[tRPC] ${path} took ${Date.now() - start}ms`);
  return result;
});

/**
 * Public (unauthenticated) procedure.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure.
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.userId) {
      throw new Error("You must be logged in to access this resource");
    }
    return next({
      ctx: {
        ...ctx,
        userId: ctx.userId,
      },
    });
  });
