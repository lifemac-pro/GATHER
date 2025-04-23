import nodemailer from "nodemailer";
import { env } from "@/env";
import * as emailTemplates from "./email-templates";

// Configure email transporter
const createTransporter = () => {
  // Check if we have email server configuration
  if (!env.EMAIL_SERVER) {
    console.warn(
      "Email server not configured. Emails will be logged but not sent.",
    );
    return null;
  }

  // Parse email server string (format: smtp://username:password@smtp.example.com:587)
  try {
    const emailServerUrl = new URL(env.EMAIL_SERVER);
    const auth = emailServerUrl.username
      ? {
          user: decodeURIComponent(emailServerUrl.username),
          pass: decodeURIComponent(emailServerUrl.password || ""),
        }
      : undefined;

    return nodemailer.createTransport({
      host: emailServerUrl.hostname,
      port: parseInt(emailServerUrl.port || "587"),
      secure: emailServerUrl.port === "465",
      auth: auth,
    });
  } catch (error) {
    console.error("Failed to parse EMAIL_SERVER:", error);
    return null;
  }
};

// Get email transporter
const transporter = createTransporter();

// Email sending function
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  // If no transporter, just log the email
  if (!transporter) {
    console.log("Email would be sent:");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html.substring(0, 100)}...`);
    return { success: true, info: "Email logged (no transporter configured)" };
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || "noreply@gatherease.com",
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    });

    console.log("Email sent:", info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
};

// Send event registration confirmation email
export const sendRegistrationConfirmation = async ({
  email,
  eventName,
  eventDate,
  eventLocation,
  attendeeName,
  ticketCode,
  eventUrl,
}: {
  email: string;
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  attendeeName: string;
  ticketCode: string;
  eventUrl: string;
}) => {
  const html = emailTemplates.eventRegistrationTemplate({
    eventName,
    eventDate,
    eventLocation,
    attendeeName,
    ticketCode,
    eventUrl,
  });

  return sendEmail({
    to: email,
    subject: `Registration Confirmed: ${eventName}`,
    html,
  });
};

// Send event reminder email
export const sendEventReminder = async ({
  email,
  eventName,
  eventDate,
  eventLocation,
  attendeeName,
  ticketCode,
  eventUrl,
  hoursUntilEvent,
}: {
  email: string;
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  attendeeName: string;
  ticketCode: string;
  eventUrl: string;
  hoursUntilEvent: number;
}) => {
  const html = emailTemplates.eventReminderTemplate({
    eventName,
    eventDate,
    eventLocation,
    attendeeName,
    ticketCode,
    eventUrl,
    hoursUntilEvent,
  });

  return sendEmail({
    to: email,
    subject: `Reminder: ${eventName} is Coming Up`,
    html,
  });
};

// Send event update notification email
export const sendEventUpdate = async ({
  email,
  eventName,
  attendeeName,
  updateMessage,
  eventUrl,
}: {
  email: string;
  eventName: string;
  attendeeName: string;
  updateMessage: string;
  eventUrl: string;
}) => {
  const html = emailTemplates.eventUpdateTemplate({
    eventName,
    attendeeName,
    updateMessage,
    eventUrl,
  });

  return sendEmail({
    to: email,
    subject: `Update for ${eventName}`,
    html,
  });
};

// Send event cancellation notification email
export const sendEventCancellation = async ({
  email,
  eventName,
  eventDate,
  attendeeName,
  cancellationReason,
}: {
  email: string;
  eventName: string;
  eventDate: Date;
  attendeeName: string;
  cancellationReason?: string;
}) => {
  const html = emailTemplates.eventCancellationTemplate({
    eventName,
    eventDate,
    attendeeName,
    cancellationReason: cancellationReason || "",
  });

  return sendEmail({
    to: email,
    subject: `Event Cancelled: ${eventName}`,
    html,
  });
};

// Send welcome email
export const sendWelcomeEmail = async ({
  email,
  userName,
  verificationUrl,
}: {
  email: string;
  userName: string;
  verificationUrl?: string;
}) => {
  const html = emailTemplates.welcomeTemplate({
    userName,
    verificationUrl,
  });

  return sendEmail({
    to: email,
    subject: "Welcome to GatherEase",
    html,
  });
};

// Send check-in confirmation email
export const sendCheckInConfirmation = async ({
  email,
  eventName,
  attendeeName,
  checkInTime,
}: {
  email: string;
  eventName: string;
  attendeeName: string;
  checkInTime: Date;
}) => {
  const html = emailTemplates.checkInConfirmationTemplate({
    eventName,
    attendeeName,
    checkInTime,
  });

  return sendEmail({
    to: email,
    subject: `Check-In Confirmation: ${eventName}`,
    html,
  });
};

// Send post-event thank you email
export const sendPostEventEmail = async ({
  email,
  eventName,
  attendeeName,
  feedbackUrl,
}: {
  email: string;
  eventName: string;
  attendeeName: string;
  feedbackUrl?: string;
}) => {
  const html = emailTemplates.postEventTemplate({
    eventName,
    attendeeName,
    feedbackUrl,
  });

  return sendEmail({
    to: email,
    subject: `Thank You for Attending ${eventName}`,
    html,
  });
};
