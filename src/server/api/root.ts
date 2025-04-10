import { postRouter } from "@/server/api/routers/post";
import { eventRouter } from "@/server/api/routers/event";
import { notificationRouter } from "@/server/api/routers/notification";
import { registrationRouter } from "@/server/api/routers/registration";
import { surveyRouter } from "@/server/api/routers/survey";
import { userRouter } from "@/server/api/routers/user";
import { createTRPCRouter, createTRPCContext } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  event: eventRouter,
  notification: notificationRouter,
  registration: registrationRouter,
  survey: surveyRouter,
  user: userRouter,
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
export const createCaller = (context: Awaited<ReturnType<typeof createTRPCContext>>) => {
  return appRouter.createCaller(context);
};
