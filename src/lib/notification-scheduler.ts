import { Event, Attendee, Survey, User } from "@/server/db/models";
import {
  sendEventReminderNotification,
  sendSurveyInvitationNotification
} from "@/lib/notification-service";
import { format, addHours, isBefore, isAfter, subHours } from "date-fns";

/**
 * Sends event reminders for upcoming events
 * This should be run daily via a cron job
 */
export const sendEventReminders = async () => {
  try {
    console.log("Starting event reminder job...");

    // Get current date
    const now = new Date();

    // Get events happening in the next 24 hours
    const upcomingEvents = await Event.find({
      startDate: {
        $gte: now,
        $lte: addHours(now, 24),
      },
      status: "published",
    });

    console.log(`Found ${upcomingEvents.length} upcoming events in the next 24 hours`);

    // Process each event
    for (const event of upcomingEvents) {
      // Get attendees for this event
      const attendees = await Attendee.find({
        eventId: event.id,
        status: { $in: ["registered", "confirmed"] },
      });

      console.log(`Processing ${attendees.length} attendees for event: ${event.name}`);

      // Send reminder to each attendee
      for (const attendee of attendees) {
        // Get user details
        const user = await User.findOne({ id: attendee.userId });

        if (user && user.email) {
          // Format event time
          const eventTime = format(new Date(event.startDate), "h:mm a");

          // Send notification
          await sendEventReminderNotification({
            userId: attendee.userId,
            eventId: event.id,
            eventName: event.name,
            eventDate: new Date(event.startDate),
            eventTime,
            eventLocation: event.location || "Online",
            email: user.email,
          });

          console.log(`Sent reminder to ${user.email} for event: ${event.name}`);
        }
      }
    }

    console.log("Event reminder job completed successfully");
    return { success: true, eventsProcessed: upcomingEvents.length };
  } catch (error) {
    console.error("Error in event reminder job:", error);
    return { success: false, error };
  }
};

/**
 * Sends survey invitations for recently completed events
 * This should be run hourly via a cron job
 */
export const sendSurveyInvitations = async () => {
  try {
    console.log("Starting survey invitation job...");

    // Get current date
    const now = new Date();

    // Get events that ended in the last hour
    const recentlyEndedEvents = await Event.find({
      endDate: {
        $gte: subHours(now, 1),
        $lte: now,
      },
      status: "published",
    });

    console.log(`Found ${recentlyEndedEvents.length} recently ended events`);

    // Process each event
    for (const event of recentlyEndedEvents) {
      // Check if there's an active survey for this event
      const survey = await Survey.findOne({
        eventId: event.id,
        isActive: true,
      });

      if (!survey) {
        console.log(`No active survey found for event: ${event.name}`);
        continue;
      }

      // Get attendees who checked in
      const attendees = await Attendee.find({
        eventId: event.id,
        status: { $in: ["attended", "checked-in"] },
      });

      console.log(`Processing ${attendees.length} attendees for survey: ${survey?.name || "Unnamed Survey"}`);

      // Send invitation to each attendee
      for (const attendee of attendees) {
        // Get user details
        const user = await User.findOne({ id: attendee.userId });

        if (user && user.email) {
          // Send notification
          await sendSurveyInvitationNotification({
            userId: attendee.userId,
            eventId: event.id,
            eventName: event.name,
            surveyId: survey.id,
            email: user.email,
          });

          console.log(`Sent survey invitation to ${user.email} for event: ${event.name}`);
        }
      }
    }

    console.log("Survey invitation job completed successfully");
    return { success: true, eventsProcessed: recentlyEndedEvents.length };
  } catch (error) {
    console.error("Error in survey invitation job:", error);
    return { success: false, error };
  }
};

/**
 * Main scheduler function that runs all notification jobs
 * This can be called from a cron API route
 */
export const runScheduledNotifications = async (jobType?: "event-reminders" | "survey-invitations") => {
  try {
    if (!jobType || jobType === "event-reminders") {
      await sendEventReminders();
    }

    if (!jobType || jobType === "survey-invitations") {
      await sendSurveyInvitations();
    }

    return { success: true };
  } catch (error) {
    console.error("Error running scheduled notifications:", error);
    return { success: false, error };
  }
};
