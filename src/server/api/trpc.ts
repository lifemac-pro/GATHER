/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { Context, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { getAuth } from "@/server/auth";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */
declare module "@trpc/server" {
  interface Context {
    db: any;
    headers: Headers;
    session: any | null;
  }
}

export const createTRPCContext = async (opts: { headers: Headers }): Promise<Context> => {
  let session = null;

  try {
    const auth = await getAuth({ headers: opts.headers });
    session = auth?.sessionId;
  } catch (error) {
    console.error('Auth error in TRPC context:', error);
    // Continue without authentication
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
  errorFormatter({ shape }) {
    return shape;
  },
});

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
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It guarantees
 * that the user is authenticated before running the procedure.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }: { ctx: any, next: any }) => {
  // Get the userId from the session
  const userId = ctx.session?.userId;

  // For development purposes, allow access even without authentication
  if (!userId && process.env.NODE_ENV === 'development') {
    return next({
      ctx: {
        ...ctx,
        session: { userId: 'dev-user-id' }
      }
    });
  }

  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({ ctx });
});
