import axios from "axios";
import { logger } from "@/lib/logger";

interface SendSMSOptions {
  to: string; // Phone number in international format (e.g., +1234567890)
  message: string;
}

/**
 * Send an SMS message using a third-party SMS API
 * This is a placeholder implementation that can be replaced with your preferred SMS provider
 */
export async function sendSMS({ to, message }: SendSMSOptions) {
  // Check if SMS API is configured
  if (!process.env.SMS_API_URL || !process.env.SMS_API_KEY) {
    logger.warn("SMS API not configured. Message will be logged but not sent.");
    logger.info(`Would send SMS to ${to}: ${message}`);
    return {
      success: true,
      info: "SMS message logged (API not configured)",
    };
  }

  try {
    // Format phone number (remove any non-digit characters except the + sign)
    const formattedPhone = to.replace(/[^\d+]/g, "");

    // Send message via SMS API
    // This is a placeholder implementation - replace with your SMS provider's API
    const response = await axios.post(
      process.env.SMS_API_URL,
      {
        to: formattedPhone,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info(`SMS sent to ${to}`);
    return { success: true, messageId: response.data?.messageId };
  } catch (error) {
    logger.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a survey invitation via SMS
 */
export async function sendSurveyInvitationSMS({
  phone,
  recipientName,
  eventName,
  surveyUrl,
}: {
  phone: string;
  recipientName: string;
  eventName: string;
  surveyUrl: string;
}) {
  const message = `Hi ${recipientName}, we'd love to hear your feedback about ${eventName}. Please complete our survey at: ${surveyUrl}`;
  
  return sendSMS({
    to: phone,
    message,
  });
}

/**
 * Send a survey reminder via SMS
 */
export async function sendSurveyReminderSMS({
  phone,
  recipientName,
  eventName,
  surveyUrl,
}: {
  phone: string;
  recipientName: string;
  eventName: string;
  surveyUrl: string;
}) {
  const message = `Hi ${recipientName}, just a reminder to share your feedback about ${eventName}. Please complete our survey at: ${surveyUrl}`;
  
  return sendSMS({
    to: phone,
    message,
  });
}
