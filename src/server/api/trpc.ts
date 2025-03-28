// import { initTRPC } from "@trpc/server";
// import superjson from "superjson";

// const t = initTRPC.context<{ userId?: string }>().create({
//   transformer: superjson,
// });

// export const router = t.router;
// export const publicProcedure = t.procedure;
// export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
//   if (!ctx.userId) throw new Error("Unauthorized");
//   return next();
// });



import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@/server/db";

/**
 * 1. CONTEXT
 * Defines the context available in the backend API.
 */
export const createTRPCContext = (opts: { req: Request }) => {
  return {
    db,
    req: opts.req, // ✅ Keep only `req`, don't extract headers separately
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