import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { adminDashboardRouter } from "@/server/api/routers/admin/dashboard";
// Use the event router that works with direct MongoDB operations
import { eventRouter } from "@/server/api/routers/event-router";
import { analyticsRouter } from "@/server/api/routers/analytics";
import { settingsRouter } from "@/server/api/routers/settings";
import { qrRouter } from "@/server/api/routers/qr";
import { chatRouter } from "@/server/api/routers/chat";
import { notificationRouter } from "@/server/api/routers/notification";
import { surveyRouter } from "@/server/api/routers/survey";
import { attendeeRouter } from "@/server/api/routers/attendee";
import { waitlistRouter } from "@/server/api/routers/waitlist";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  adminDashboard: adminDashboardRouter,
  event: eventRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
  qr: qrRouter,
  chat: chatRouter,
  notification: notificationRouter,
  survey: surveyRouter,
  attendee: attendeeRouter,
  waitlist: waitlistRouter,
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
