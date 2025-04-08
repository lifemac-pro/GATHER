import nodemailer from "nodemailer";
import { env } from "@/env.js";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: `"GatherEase" <${env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export function getSurveyEmailTemplate(eventName: string, surveyLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #072446; padding: 20px; text-align: center;">
        <h1 style="color: #E1A913; margin: 0;">GatherEase</h1>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #072446; margin-top: 0;">Event Feedback Request</h2>
        
        <p>Thank you for attending ${eventName}! We'd love to hear your thoughts about the event.</p>
        
        <p>Your feedback helps us improve future events and create better experiences for everyone.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${surveyLink}" 
             style="background-color: #E1A913; 
                    color: #072446; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    font-weight: bold;">
            Share Your Feedback
          </a>
        </div>
        
        <p style="color: #666666; font-size: 14px;">
          If you have any questions, simply reply to this email.
        </p>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
        <p>© ${new Date().getFullYear()} GatherEase. All rights reserved.</p>
      </div>
    </div>
  `;
}
