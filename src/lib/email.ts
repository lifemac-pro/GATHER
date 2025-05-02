import nodemailer from "nodemailer";
import { env } from "@/env";

// Create a transporter object
const transporter = nodemailer.createTransport({
  host: env.EMAIL_SERVER_HOST,
  port: parseInt(env.EMAIL_SERVER_PORT || "587"),
  secure: env.EMAIL_SERVER_PORT === "465", // true for 465, false for other ports
  auth: {
    user: env.EMAIL_SERVER_USER,
    pass: env.EMAIL_SERVER_PASSWORD,
  },
});

// Email templates
const templates = {
  eventReminder: (eventName: string, date: string, time: string, location: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #072446;">Event Reminder: ${eventName}</h2>
      <p>This is a friendly reminder about your upcoming event:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Location:</strong> ${location}</p>
      </div>
      <p>We look forward to seeing you there!</p>
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
        <p>This is an automated message from GatherEase. Please do not reply to this email.</p>
      </div>
    </div>
  `,
  
  surveyInvitation: (eventName: string, surveyLink: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #072446;">We'd Love Your Feedback!</h2>
      <p>Thank you for attending <strong>${eventName}</strong>.</p>
      <p>We'd appreciate your feedback to help us improve future events.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${surveyLink}" style="background-color: #00b0a6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Take the Survey
        </a>
      </div>
      <p>The survey will only take a few minutes to complete.</p>
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
        <p>This is an automated message from GatherEase. Please do not reply to this email.</p>
      </div>
    </div>
  `,
  
  registrationConfirmation: (eventName: string, date: string, time: string, location: string, ticketCode: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #072446;">Registration Confirmed!</h2>
      <p>Your registration for <strong>${eventName}</strong> has been confirmed.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Ticket Code:</strong> <span style="font-family: monospace; font-weight: bold;">${ticketCode}</span></p>
      </div>
      <p>Please keep this email for your records. You can also view your ticket in the app.</p>
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
        <p>This is an automated message from GatherEase. Please do not reply to this email.</p>
      </div>
    </div>
  `,
};

// Email sending functions
export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"GatherEase" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

// Specific email sending functions
export const sendEventReminder = async ({
  to,
  eventName,
  date,
  time,
  location,
}: {
  to: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
}) => {
  return sendEmail({
    to,
    subject: `Reminder: ${eventName} is Coming Up!`,
    html: templates.eventReminder(eventName, date, time, location),
  });
};

export const sendSurveyInvitation = async ({
  to,
  eventName,
  surveyLink,
}: {
  to: string;
  eventName: string;
  surveyLink: string;
}) => {
  return sendEmail({
    to,
    subject: `We'd Love Your Feedback on ${eventName}`,
    html: templates.surveyInvitation(eventName, surveyLink),
  });
};

export const sendRegistrationConfirmation = async ({
  to,
  eventName,
  date,
  time,
  location,
  ticketCode,
}: {
  to: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
  ticketCode: string;
}) => {
  return sendEmail({
    to,
    subject: `Registration Confirmed: ${eventName}`,
    html: templates.registrationConfirmation(eventName, date, time, location, ticketCode),
  });
};
