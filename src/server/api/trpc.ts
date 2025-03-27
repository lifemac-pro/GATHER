import { initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.context<{ userId?: string }>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new Error("Unauthorized");
  return next();
});
