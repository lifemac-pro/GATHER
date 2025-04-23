# Dynamic Survey System with WhatsApp Integration

This document provides an overview of the dynamic survey system with WhatsApp integration for the GatherEase platform.

## Features

- **Dynamic Survey Templates**: Create custom survey templates with different question types
- **Flexible Timing**: Send surveys after events, during events, or at custom times
- **WhatsApp Integration**: Send survey invitations and reminders via WhatsApp
- **Email Notifications**: Send survey invitations and reminders via email
- **Reminder System**: Automatically send reminders to attendees who haven't completed surveys
- **Survey Analytics**: View and analyze survey responses

## Question Types

The system supports the following question types:

- **Text**: Free-form text responses
- **Rating**: 1-5 star rating
- **Multiple Choice**: Select one option from a list
- **Checkbox**: Select multiple options from a list
- **Dropdown**: Select one option from a dropdown menu

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```
# WhatsApp Business API configuration
WHATSAPP_API_URL="https://graph.facebook.com/v17.0/your_phone_number_id"
WHATSAPP_API_TOKEN="your_whatsapp_api_token"

# Application URLs
APP_URL="https://your-production-url.com"
NEXT_PUBLIC_APP_URL="https://your-production-url.com"

# Logging
LOG_LEVEL="info" # Options: debug, info, warn, error

# Cron job security
CRON_SECRET="your_cron_job_secret_key"
```

### 2. WhatsApp Business API Setup

1. Create a Meta Developer account at https://developers.facebook.com/
2. Set up a WhatsApp Business account
3. Create a WhatsApp Business API app
4. Set up message templates for:
   - `event_survey_invitation`: For sending survey invitations
   - `event_survey_reminder`: For sending survey reminders
   - `event_reminder`: For sending event reminders

### 3. Cron Job Setup

Set up a cron job to process survey schedules. This should run every hour.

#### Using a cron service (e.g., Vercel Cron):

Configure your cron service to call the following endpoint every hour:

```
GET /api/cron/surveys
```

Include the `Authorization` header with the value `Bearer your_cron_job_secret_key`.

#### Manual cron setup:

If you're hosting on a server with cron access, add the following to your crontab:

```
0 * * * * curl -X GET -H "Authorization: Bearer your_cron_job_secret_key" https://your-production-url.com/api/cron/surveys
```

## Usage

### Creating Survey Templates

1. Go to Admin Dashboard → Events → [Event Name] → Surveys
2. Click "Create Survey"
3. Fill in the survey details:
   - Name and description
   - Questions (text, rating, multiple choice, etc.)
   - Timing settings (when to send the survey)
   - Reminder settings (whether to send reminders)

### Sending Surveys

Surveys can be sent in three ways:

1. **Automatically**: Based on the timing settings (after event, during event, or custom time)
2. **Manually**: Click the "Send Now" button on the survey template
3. **Via API**: Call the survey sending API endpoint programmatically

### Viewing Survey Responses

1. Go to Admin Dashboard → Surveys
2. Select an event to view its survey responses
3. View analytics including:
   - Response rate
   - Average ratings
   - Sentiment analysis
   - Individual responses

## Technical Details

### Database Models

- **SurveyTemplate**: Stores survey templates with questions and timing settings
- **Survey**: Stores survey responses from attendees

### API Endpoints

- `POST /api/trpc/surveyTemplate.create`: Create a new survey template
- `POST /api/trpc/surveyTemplate.update`: Update an existing survey template
- `POST /api/trpc/surveyTemplate.delete`: Delete a survey template
- `POST /api/trpc/surveyTemplate.sendNow`: Send a survey immediately
- `POST /api/trpc/survey.submit`: Submit a survey response
- `GET /api/cron/surveys`: Process scheduled surveys (cron endpoint)

### WhatsApp Integration

The system uses the WhatsApp Business API to send messages. The integration is implemented in `src/lib/whatsapp-service.ts`.

### Survey Scheduler

The survey scheduler is implemented in `src/lib/survey-scheduler.ts`. It handles:

- Determining when surveys should be sent
- Sending survey invitations via email and WhatsApp
- Sending reminders to attendees who haven't completed surveys

## Troubleshooting

### WhatsApp Messages Not Sending

1. Check that your WhatsApp Business API credentials are correct
2. Verify that your message templates are approved
3. Check the logs for any error messages
4. Ensure the phone numbers are in the correct format (international format with country code)

### Surveys Not Being Sent Automatically

1. Verify that the cron job is running correctly
2. Check that the survey template is active
3. Verify the timing settings for the survey
4. Check the logs for any error messages

### Survey Form Not Loading

1. Verify that the survey template exists
2. Check that the token in the URL is valid
3. Ensure the attendee has not already completed the survey
