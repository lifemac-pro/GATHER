import { Notification } from "@/server/db/models";
import { UserPreference } from "@/server/db/models/userPreference";
import { sendEventReminder, sendSurveyInvitation, sendRegistrationConfirmation } from "@/lib/email";
import { format } from "date-fns";

interface NotificationInput {
  userId: string;
  type: "event" | "survey" | "reminder" | "info";
  title: string;
  message: string;
  eventId?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export const sendNotification = async (input: NotificationInput) => {
  try {
    const notification = await Notification.create({
      ...input,
      read: false,
      createdAt: new Date(),
    });

    return { success: true, notification };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error };
  }
};

export const createNotification = async (input: NotificationInput) => {
  try {
    const notification = await Notification.create({
      ...input,
      read: false,
      createdAt: new Date(),
    });

    return { success: true, notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
};

/**
 * Sends an event reminder (in-app and email if enabled)
 */
export const sendEventReminderNotification = async ({
  userId,
  eventId,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  email,
}: {
  userId: string;
  eventId: string;
  eventName: string;
  eventDate: Date;
  eventTime: string;
  eventLocation: string;
  email: string;
}) => {
  try {
    // Format date for display
    const formattedDate = format(new Date(eventDate), "EEEE, MMMM d, yyyy");
    
    // Create in-app notification
    const notificationResult = await sendNotification({
      userId,
      type: "event",
      title: "Event Reminder",
      message: `Your event "${eventName}" is coming up on ${formattedDate} at ${eventTime}.`,
      eventId,
      actionUrl: `/attendee/events/${eventId}`,
      actionLabel: "View Event",
    });

    // Check user preferences for email notifications
    const userPreferences = await UserPreference.findOne({ userId });
    
    // Send email if user has enabled event reminders
    if (userPreferences?.eventReminders && email) {
      await sendEventReminder({
        to: email,
        eventName,
        date: formattedDate,
        time: eventTime,
        location: eventLocation,
      });
    }

    return { success: true, notification: notificationResult.notification };
  } catch (error) {
    console.error("Error sending event reminder:", error);
    return { success: false, error };
  }
};

/**
 * Sends a survey invitation (in-app and email if enabled)
 */
export const sendSurveyInvitationNotification = async ({
  userId,
  eventId,
  eventName,
  surveyId,
  email,
}: {
  userId: string;
  eventId: string;
  eventName: string;
  surveyId: string;
  email: string;
}) => {
  try {
    // Create in-app notification
    const notificationResult = await sendNotification({
      userId,
      type: "survey",
      title: "Survey Available",
      message: `Please complete the survey for "${eventName}".`,
      eventId,
      actionUrl: `/attendee/surveys/${surveyId}`,
      actionLabel: "Take Survey",
    });

    // Check user preferences for email notifications
    const userPreferences = await UserPreference.findOne({ userId });
    
    // Send email if user has enabled survey reminders
    if (userPreferences?.surveyReminders && email) {
      const surveyLink = `${process.env.NEXT_PUBLIC_APP_URL}/attendee/surveys/${surveyId}`;
      
      await sendSurveyInvitation({
        to: email,
        eventName,
        surveyLink,
      });
    }

    return { success: true, notification: notificationResult.notification };
  } catch (error) {
    console.error("Error sending survey invitation:", error);
    return { success: false, error };
  }
};

/**
 * Sends a registration confirmation (in-app and email)
 */
export const sendRegistrationConfirmationNotification = async ({
  userId,
  eventId,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  ticketCode,
  email,
}: {
  userId: string;
  eventId: string;
  eventName: string;
  eventDate: Date;
  eventTime: string;
  eventLocation: string;
  ticketCode: string;
  email: string;
}) => {
  try {
    // Format date for display
    const formattedDate = format(new Date(eventDate), "EEEE, MMMM d, yyyy");
    
    // Create in-app notification
    const notificationResult = await sendNotification({
      userId,
      type: "info",
      title: "Registration Confirmed",
      message: `Your registration for "${eventName}" has been confirmed.`,
      eventId,
      actionUrl: `/attendee/events/${eventId}`,
      actionLabel: "View Event",
    });

    // Send email confirmation
    if (email) {
      await sendRegistrationConfirmation({
        to: email,
        eventName,
        date: formattedDate,
        time: eventTime,
        location: eventLocation,
        ticketCode,
      });
    }

    return { success: true, notification: notificationResult.notification };
  } catch (error) {
    console.error("Error sending registration confirmation:", error);
    return { success: false, error };
  }
};
