import { SurveyTemplate, Event, Attendee } from "@/server/db/models";
import {
  sendSurveyInvitation,
  sendSurveyReminder,
} from "@/lib/whatsapp-service";
import { sendPostEventEmail } from "@/lib/email-service";
import { logger } from "@/lib/logger";
import { addHours, isAfter, isBefore } from "date-fns";
import { nanoid } from "nanoid";

/**
 * Process surveys that need to be sent
 * This function should be called by a cron job every hour
 */
export async function processSurveySchedules() {
  const now = new Date();
  logger.info("Processing survey schedules", { timestamp: now });

  try {
    // Find all active survey templates
    const templates = await SurveyTemplate.find({ isActive: true });
    logger.info(`Found ${templates.length} active survey templates`);

    for (const template of templates) {
      // Get the event details
      const event = await Event.findOne({ id: template.eventId });
      if (!event) {
        logger.warn(`Event not found for survey template: ${template.id}`);
        continue;
      }

      // Determine if this survey should be sent now
      let shouldSend = false;
      let sendTime: Date | null = null;

      switch (template.sendTiming) {
        case "after_event":
          if (event.endDate && template.sendDelay) {
            sendTime = addHours(new Date(event.endDate), template.sendDelay);
            shouldSend =
              isAfter(now, sendTime) && isBefore(now, addHours(sendTime, 1));
          }
          break;

        case "during_event":
          if (event.startDate && event.endDate) {
            const eventDuration =
              new Date(event.endDate).getTime() -
              new Date(event.startDate).getTime();
            const halfwayPoint = new Date(
              new Date(event.startDate).getTime() + eventDuration / 2,
            );
            shouldSend =
              isAfter(now, halfwayPoint) &&
              isBefore(now, addHours(halfwayPoint, 1));
          }
          break;

        case "custom":
          if (template.sendTime) {
            sendTime = new Date(template.sendTime);
            shouldSend =
              isAfter(now, sendTime) && isBefore(now, addHours(sendTime, 1));
          }
          break;
      }

      if (shouldSend) {
        await sendSurveysForTemplate(template, event);
      }
    }

    // Process reminders
    await processSurveyReminders();

    logger.info("Completed processing survey schedules");
  } catch (error) {
    logger.error("Error processing survey schedules:", error);
  }
}

/**
 * Send surveys for a specific template
 */
export async function sendSurveysForTemplate(template: any, event: any) {
  logger.info(
    `Sending surveys for template: ${template.id}, event: ${event.name}`,
  );

  // Get all attendees for this event
  const attendees = await Attendee.find({
    eventId: event.id,
    status: { $in: ["attended", "checked-in"] }, // Only send to attendees who actually attended
  });

  logger.info(`Found ${attendees.length} attendees for event: ${event.name}`);

  // Generate survey URL with unique token for each attendee
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const attendee of attendees) {
    try {
      // Generate a unique survey token
      const surveyToken = generateSurveyToken(attendee.id, template.id);
      const surveyUrl = `${baseUrl}/surveys/${template.id}?token=${surveyToken}`;

      // Send email notification
      await sendPostEventEmail({
        email: attendee.email,
        eventName: event.name,
        attendeeName: attendee.name,
        feedbackUrl: surveyUrl,
      });

      // If phone number is available, send WhatsApp notification
      if (attendee.phone) {
        await sendSurveyInvitation({
          phone: attendee.phone,
          recipientName: attendee.name,
          eventName: event.name,
          surveyUrl,
        });
      }

      logger.info(
        `Survey invitation sent to ${attendee.email} for event: ${event.name}`,
      );
    } catch (error) {
      logger.error(`Error sending survey to attendee ${attendee.id}:`, error);
    }
  }
}

/**
 * Process survey reminders
 */
async function processSurveyReminders() {
  const now = new Date();
  logger.info("Processing survey reminders", { timestamp: now });

  try {
    // Find all active survey templates with reminders enabled
    const templates = await SurveyTemplate.find({
      isActive: true,
      reminderEnabled: true,
      reminderDelay: { $exists: true, $ne: null },
    });

    for (const template of templates) {
      // Get the event details
      const event = await Event.findOne({ id: template.eventId });
      if (!event) continue;

      // Calculate when the initial survey was sent
      let initialSendTime: Date | null = null;

      switch (template.sendTiming) {
        case "after_event":
          if (event.endDate && template.sendDelay) {
            initialSendTime = addHours(
              new Date(event.endDate),
              template.sendDelay,
            );
          }
          break;

        case "during_event":
          if (event.startDate && event.endDate) {
            const eventDuration =
              new Date(event.endDate).getTime() -
              new Date(event.startDate).getTime();
            initialSendTime = new Date(
              new Date(event.startDate).getTime() + eventDuration / 2,
            );
          }
          break;

        case "custom":
          if (template.sendTime) {
            initialSendTime = new Date(template.sendTime);
          }
          break;
      }

      if (!initialSendTime || !template.reminderDelay) continue;

      // Calculate when the reminder should be sent
      const reminderTime = addHours(initialSendTime, template.reminderDelay);

      // Check if it's time to send the reminder
      const shouldSendReminder =
        isAfter(now, reminderTime) && isBefore(now, addHours(reminderTime, 1));

      if (shouldSendReminder) {
        await sendReminderForTemplate(template, event);
      }
    }

    logger.info("Completed processing survey reminders");
  } catch (error) {
    logger.error("Error processing survey reminders:", error);
  }
}

/**
 * Send reminders for a specific template
 */
async function sendReminderForTemplate(template: any, event: any) {
  logger.info(
    `Sending reminders for template: ${template.id}, event: ${event.name}`,
  );

  // Get all attendees for this event
  const attendees = await Attendee.find({
    eventId: event.id,
    status: { $in: ["attended", "checked-in"] },
  });

  // Generate survey URL with unique token for each attendee
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const attendee of attendees) {
    try {
      // Check if the attendee has already completed the survey
      const surveyExists = await checkSurveyExists(template.id, attendee.id);
      if (surveyExists) {
        logger.info(
          `Attendee ${attendee.id} already completed the survey, skipping reminder`,
        );
        continue;
      }

      // Generate a unique survey token
      const surveyToken = generateSurveyToken(attendee.id, template.id);
      const surveyUrl = `${baseUrl}/surveys/${template.id}?token=${surveyToken}`;

      // If phone number is available, send WhatsApp reminder
      if (attendee.phone) {
        await sendSurveyReminder({
          phone: attendee.phone,
          recipientName: attendee.name,
          eventName: event.name,
          surveyUrl,
        });

        logger.info(
          `Survey reminder sent to ${attendee.phone} for event: ${event.name}`,
        );
      }
    } catch (error) {
      logger.error(`Error sending reminder to attendee ${attendee.id}:`, error);
    }
  }
}

/**
 * Check if a survey has already been completed
 */
async function checkSurveyExists(templateId: string, userId: string) {
  const Survey = (await import("@/server/db/models")).Survey;
  const count = await Survey.countDocuments({ templateId, userId });
  return count > 0;
}

/**
 * Generate a secure token for survey access
 */
function generateSurveyToken(attendeeId: string, templateId: string): string {
  // In a real implementation, use a secure method to generate and verify tokens
  // This is a simplified example
  const payload = {
    attendeeId,
    templateId,
    timestamp: Date.now(),
    nonce: nanoid(8),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}
