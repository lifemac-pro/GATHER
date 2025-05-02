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
import { surveyTemplateRouter } from "@/server/api/routers/survey-template";
import { attendeeRouter } from "@/server/api/routers/attendee";
import { waitlistRouter } from "@/server/api/routers/waitlist";
import { eventTemplateRouter } from "@/server/api/routers/event-template";
import { registrationFormRouter } from "@/server/api/routers/registration-form";
import { registrationSubmissionRouter } from "@/server/api/routers/registration-submission";

// New routers for enhanced admin functionality
import { adminEventRouter } from "@/server/api/routers/admin-event";
import { adminSurveyRouter } from "@/server/api/routers/admin-survey";
import { adminRegistrationFormRouter } from "@/server/api/routers/admin-registration-form";
import { adminDashboardRouter as newAdminDashboardRouter } from "@/server/api/routers/admin-dashboard";

// User router for role management
import { userRouter } from "@/server/api/routers/user";

// Recurring events router
import { recurringEventRouter } from "@/server/api/routers/recurring-event";

// Event taxonomy router
import { eventTaxonomyRouter } from "@/server/api/routers/event-taxonomy";

// Video conferencing router
import { videoConferencingRouter } from "@/server/api/routers/video-conferencing";

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
  surveyTemplate: surveyTemplateRouter,
  attendee: attendeeRouter,
  waitlist: waitlistRouter,
  eventTemplate: eventTemplateRouter,
  registrationForm: registrationFormRouter,
  registrationSubmission: registrationSubmissionRouter,
  user: userRouter, // Ensure user router is added here

  // New enhanced admin routers
  admin: createTRPCRouter({
    event: adminEventRouter,
    survey: adminSurveyRouter,
    registrationForm: adminRegistrationFormRouter,
    dashboard: newAdminDashboardRouter,
  }),

  // Recurring events router
  recurringEvent: recurringEventRouter,

  // Event taxonomy router
  eventTaxonomy: eventTaxonomyRouter,

  // Video conferencing router
  videoConferencing: videoConferencingRouter,
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
