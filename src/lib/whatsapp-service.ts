import axios from "axios";
import { logger } from "@/lib/logger";

// WhatsApp message types
type WhatsAppMessageType = "text" | "template" | "media";

interface WhatsAppTextMessage {
  type: "text";
  text: string;
}

interface WhatsAppTemplateMessage {
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: "body" | "header" | "button";
      parameters: Array<{
        type: "text" | "currency" | "date_time";
        text?: string;
        currency?: {
          code: string;
          amount: number;
        };
        date_time?: {
          fallback_value: string;
        };
      }>;
    }>;
  };
}

interface WhatsAppMediaMessage {
  type: "media";
  media: {
    type: "image" | "document" | "video" | "audio";
    url: string;
    caption?: string;
    filename?: string;
  };
}

type WhatsAppMessage =
  | WhatsAppTextMessage
  | WhatsAppTemplateMessage
  | WhatsAppMediaMessage;

interface SendWhatsAppOptions {
  to: string; // Phone number in international format (e.g., +1234567890)
  message: WhatsAppMessage;
}

/**
 * Send a WhatsApp message using the WhatsApp Business API
 */
export async function sendWhatsAppMessage({
  to,
  message,
}: SendWhatsAppOptions) {
  // Check if WhatsApp API is configured
  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
    logger.warn(
      "WhatsApp API not configured. Message will be logged but not sent.",
    );
    logger.info(`Would send WhatsApp message to ${to}:`, message);
    return {
      success: true,
      info: "WhatsApp message logged (API not configured)",
    };
  }

  try {
    // Format phone number (remove any non-digit characters except the + sign)
    const formattedPhone = to.replace(/[^\d+]/g, "");

    // Send message via WhatsApp Business API
    const response = await axios.post(
      `${process.env.WHATSAPP_API_URL}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        ...message,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    logger.info(`WhatsApp message sent to ${to}`, {
      messageId: response.data.messages?.[0]?.id,
    });
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    logger.error("Failed to send WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a survey invitation via WhatsApp
 */
export async function sendSurveyInvitation({
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
  return sendWhatsAppMessage({
    to: phone,
    message: {
      type: "template",
      template: {
        name: "event_survey_invitation",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: recipientName },
              { type: "text", text: eventName },
              { type: "text", text: surveyUrl },
            ],
          },
        ],
      },
    },
  });
}

/**
 * Send a survey reminder via WhatsApp
 */
export async function sendSurveyReminder({
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
  return sendWhatsAppMessage({
    to: phone,
    message: {
      type: "template",
      template: {
        name: "event_survey_reminder",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: recipientName },
              { type: "text", text: eventName },
              { type: "text", text: surveyUrl },
            ],
          },
        ],
      },
    },
  });
}

/**
 * Send an event reminder via WhatsApp
 */
export async function sendEventReminder({
  phone,
  recipientName,
  eventName,
  eventDate,
  eventLocation,
}: {
  phone: string;
  recipientName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
}) {
  return sendWhatsAppMessage({
    to: phone,
    message: {
      type: "template",
      template: {
        name: "event_reminder",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: recipientName },
              { type: "text", text: eventName },
              { type: "text", text: eventDate },
              { type: "text", text: eventLocation },
            ],
          },
        ],
      },
    },
  });
}
