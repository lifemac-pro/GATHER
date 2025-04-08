import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { adminDashboardRouter } from "@/server/api/routers/admin/dashboard";
import { eventRouter } from "@/server/api/routers/event";
import { analyticsRouter } from "@/server/api/routers/analytics";
import { settingsRouter } from "@/server/api/routers/settings";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  adminDashboard: adminDashboardRouter,
  Gevents: eventRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
