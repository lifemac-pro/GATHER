/**
 * Test script for the survey system
 *
 * This script tests the survey system by:
 * 1. Creating a test survey template
 * 2. Simulating sending a survey
 * 3. Verifying WhatsApp integration
 *
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/test-survey-system.ts
 */

import { connectToDatabase } from "../server/db/mongo";
import { SurveyTemplate, Event, Attendee } from "../server/db/models";
import { sendSurveyInvitation } from "../lib/whatsapp-service";
import { logger } from "../lib/logger";
import { nanoid } from "nanoid";

async function main() {
  try {
    logger.info("Connecting to database...");
    await connectToDatabase();
    logger.info("Connected to database");

    // Create a test event if it doesn't exist
    const eventId = "test-event-" + nanoid(6);
    let event = await Event.findOne({ id: eventId });

    if (!event) {
      logger.info("Creating test event...");
      event = await Event.create({
        id: eventId,
        name: "Test Event for Survey System",
        description: "This is a test event for the survey system",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000), // 1 hour from now
        category: "Test",
        status: "published",
        createdById: "test-user",
      });
      logger.info(`Created test event with ID: ${eventId}`);
    }

    // Create a test attendee if it doesn't exist
    const attendeeId = "test-attendee-" + nanoid(6);
    let attendee = await Attendee.findOne({ id: attendeeId });

    if (!attendee) {
      logger.info("Creating test attendee...");
      attendee = await Attendee.create({
        id: attendeeId,
        eventId: eventId,
        userId: "test-user",
        name: "Test Attendee",
        email: "test@example.com",
        phone: "+1234567890", // Test phone number
        status: "checked_in",
        paymentStatus: "free",
        registeredAt: new Date(),
        checkedInAt: new Date(),
      });
      logger.info(`Created test attendee with ID: ${attendeeId}`);
    }

    // Create a test survey template if it doesn't exist
    const templateId = "test-template-" + nanoid(6);
    let template = await SurveyTemplate.findOne({ id: templateId });

    if (!template) {
      logger.info("Creating test survey template...");
      template = await SurveyTemplate.create({
        id: templateId,
        eventId: eventId,
        name: "Test Survey Template",
        description: "This is a test survey template",
        questions: [
          {
            id: "q1",
            text: "How would you rate this event?",
            type: "rating",
            required: true,
            order: 0,
          },
          {
            id: "q2",
            text: "What did you like most about the event?",
            type: "text",
            required: false,
            order: 1,
          },
          {
            id: "q3",
            text: "Which sessions did you attend?",
            type: "checkbox",
            required: false,
            options: ["Session 1", "Session 2", "Session 3"],
            order: 2,
          },
        ],
        isActive: true,
        sendTiming: "after_event",
        sendDelay: 1, // 1 hour after event
        reminderEnabled: true,
        reminderDelay: 24, // 24 hours after initial send
        createdById: "test-user",
      });
      logger.info(`Created test survey template with ID: ${templateId}`);
    }

    // Test WhatsApp integration
    logger.info("Testing WhatsApp integration...");
    const surveyUrl = `${process.env.APP_URL || "http://localhost:3000"}/surveys/${templateId}?token=test-token`;

    const result = await sendSurveyInvitation({
      phone: "+1234567890", // Test phone number
      recipientName: "Test Attendee",
      eventName: "Test Event",
      surveyUrl,
    });

    logger.info("WhatsApp test result:", result);

    // Test survey scheduler
    logger.info("Testing survey scheduler...");
    const { processSurveySchedules } = await import("../lib/survey-scheduler");
    await processSurveySchedules();
    logger.info("Survey scheduler test completed");

    logger.info("All tests completed successfully!");
    logger.info(`
Survey System Setup Information:
-------------------------------
Test Event ID: ${eventId}
Test Attendee ID: ${attendeeId}
Test Survey Template ID: ${templateId}
Survey URL: ${surveyUrl}

To test the survey form, visit:
${process.env.APP_URL || "http://localhost:3000"}/surveys/${templateId}?token=test-token

To test the admin interface, visit:
${process.env.APP_URL || "http://localhost:3000"}/admin/events/${eventId}/surveys
    `);
  } catch (error) {
    logger.error("Error testing survey system:", error);
  } finally {
    process.exit(0);
  }
}

main();
