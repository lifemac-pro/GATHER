import { format } from "date-fns";

// Base HTML template with styling
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GatherEase</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #072446;
    }
    .highlight {
      color: #E1A913;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      color: #888;
      font-size: 12px;
      border-top: 1px solid #eaeaea;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #E1A913;
      color: #072446;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-box {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 15px;
      margin: 15px 0;
    }
    .event-details {
      margin: 20px 0;
    }
    .event-details div {
      margin-bottom: 10px;
    }
    .event-details strong {
      display: inline-block;
      width: 100px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Gather<span class="highlight">Ease</span></div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} GatherEase. All rights reserved.</p>
      <p>If you have any questions, please contact us at support@gatherease.com</p>
    </div>
  </div>
</body>
</html>
`;

// Event registration confirmation template
export const eventRegistrationTemplate = (data: {
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  attendeeName: string;
  ticketCode: string;
  eventUrl: string;
}) => {
  const content = `
    <h2>Registration Confirmed!</h2>
    <p>Hello ${data.attendeeName},</p>
    <p>Your registration for <strong>${data.eventName}</strong> has been confirmed.</p>
    
    <div class="event-details">
      <div><strong>Date:</strong> ${format(new Date(data.eventDate), "PPP 'at' p")}</div>
      <div><strong>Location:</strong> ${data.eventLocation}</div>
      <div><strong>Ticket Code:</strong> ${data.ticketCode}</div>
    </div>
    
    <div class="info-box">
      <p>Please keep your ticket code handy for check-in at the event.</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.eventUrl}" class="button">View Event Details</a>
    </div>
    
    <p>We look forward to seeing you at the event!</p>
  `;

  return baseTemplate(content);
};

// Event reminder template
export const eventReminderTemplate = (data: {
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  attendeeName: string;
  ticketCode: string;
  eventUrl: string;
  hoursUntilEvent: number;
}) => {
  const content = `
    <h2>Event Reminder</h2>
    <p>Hello ${data.attendeeName},</p>
    <p>This is a reminder that <strong>${data.eventName}</strong> is coming up ${data.hoursUntilEvent <= 24 ? "tomorrow" : `in ${Math.ceil(data.hoursUntilEvent / 24)} days`}.</p>
    
    <div class="event-details">
      <div><strong>Date:</strong> ${format(new Date(data.eventDate), "PPP 'at' p")}</div>
      <div><strong>Location:</strong> ${data.eventLocation}</div>
      <div><strong>Ticket Code:</strong> ${data.ticketCode}</div>
    </div>
    
    <div class="info-box">
      <p>Please keep your ticket code handy for check-in at the event.</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.eventUrl}" class="button">View Event Details</a>
    </div>
    
    <p>We look forward to seeing you at the event!</p>
  `;

  return baseTemplate(content);
};

// Event update notification template
export const eventUpdateTemplate = (data: {
  eventName: string;
  attendeeName: string;
  updateMessage: string;
  eventUrl: string;
}) => {
  const content = `
    <h2>Event Update</h2>
    <p>Hello ${data.attendeeName},</p>
    <p>There has been an update to <strong>${data.eventName}</strong>:</p>
    
    <div class="info-box">
      <p>${data.updateMessage}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.eventUrl}" class="button">View Event Details</a>
    </div>
    
    <p>Thank you for your understanding.</p>
  `;

  return baseTemplate(content);
};

// Event cancellation notification template
export const eventCancellationTemplate = (data: {
  eventName: string;
  eventDate: Date;
  attendeeName: string;
  cancellationReason: string;
}) => {
  const content = `
    <h2>Event Cancellation Notice</h2>
    <p>Hello ${data.attendeeName},</p>
    <p>We regret to inform you that <strong>${data.eventName}</strong> scheduled for ${format(new Date(data.eventDate), "PPP 'at' p")} has been cancelled.</p>
    
    <div class="info-box">
      <p><strong>Reason:</strong> ${data.cancellationReason || "The event organizer has cancelled this event."}</p>
    </div>
    
    <p>We apologize for any inconvenience this may cause. If you have any questions, please contact the event organizer.</p>
  `;

  return baseTemplate(content);
};

// Welcome email template
export const welcomeTemplate = (data: {
  userName: string;
  verificationUrl?: string;
}) => {
  const content = `
    <h2>Welcome to GatherEase!</h2>
    <p>Hello ${data.userName},</p>
    <p>Thank you for joining GatherEase, your all-in-one platform for event management.</p>
    
    <p>With GatherEase, you can:</p>
    <ul>
      <li>Create and manage events</li>
      <li>Track registrations and attendees</li>
      <li>Send notifications to attendees</li>
      <li>Generate QR codes for check-in</li>
    </ul>
    
    ${
      data.verificationUrl
        ? `
    <div style="text-align: center;">
      <a href="${data.verificationUrl}" class="button">Verify Your Email</a>
    </div>
    `
        : ""
    }
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
  `;

  return baseTemplate(content);
};

// Check-in confirmation template
export const checkInConfirmationTemplate = (data: {
  eventName: string;
  attendeeName: string;
  checkInTime: Date;
}) => {
  const content = `
    <h2>Check-In Confirmation</h2>
    <p>Hello ${data.attendeeName},</p>
    <p>This email confirms that you have checked in to <strong>${data.eventName}</strong>.</p>
    
    <div class="info-box">
      <p><strong>Check-in time:</strong> ${format(new Date(data.checkInTime), "PPP 'at' p")}</p>
    </div>
    
    <p>Enjoy the event!</p>
  `;

  return baseTemplate(content);
};

// Post-event thank you template
export const postEventTemplate = (data: {
  eventName: string;
  attendeeName: string;
  feedbackUrl?: string;
}) => {
  const content = `
    <h2>Thank You for Attending!</h2>
    <p>Hello ${data.attendeeName},</p>
    <p>Thank you for attending <strong>${data.eventName}</strong>. We hope you enjoyed the event!</p>
    
    ${
      data.feedbackUrl
        ? `
    <div class="info-box">
      <p>We value your feedback. Please take a moment to share your thoughts about the event.</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.feedbackUrl}" class="button">Share Your Feedback</a>
    </div>
    `
        : ""
    }
    
    <p>We look forward to seeing you at future events!</p>
  `;

  return baseTemplate(content);
};
