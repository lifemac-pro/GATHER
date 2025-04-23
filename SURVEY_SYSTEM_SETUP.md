# Dynamic Survey System with WhatsApp Integration - Setup Guide

This guide will help you set up and test the dynamic survey system with WhatsApp integration for your GATHER application.

## Prerequisites

- Node.js and npm/pnpm installed
- MongoDB database set up and running
- GATHER application codebase cloned and dependencies installed

## Setup Steps

### 1. Environment Variables

Make sure your `.env` file includes the following variables:

```
# WhatsApp Business API configuration
# For testing, you can use mock values
WHATSAPP_API_URL=https://mock-whatsapp-api.example.com
WHATSAPP_API_TOKEN=mock_whatsapp_token

# Application URLs
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug

# Cron job security
CRON_SECRET=your_cron_secret_key
```

### 2. Run the Setup Script

The setup script will create test data to verify that the survey system is working correctly:

```bash
# Install required dependencies if not already installed
pnpm add nanoid dotenv

# Run the setup script
node src/scripts/setup-survey-system.js
```

The script will:
- Create a test event
- Create a test attendee
- Create a test survey template
- Generate a test survey URL
- Test the WhatsApp integration (mock)

### 3. Test the Survey Form

After running the setup script, you'll receive a URL to test the survey form. Open this URL in your browser to see the dynamic survey form in action.

### 4. Test the Admin Interface

The setup script will also provide a URL to test the admin interface. Open this URL in your browser to see the survey management interface.

## Production Setup

For production deployment, follow these additional steps:

### 1. WhatsApp Business API Setup

1. Create a Meta Developer account at https://developers.facebook.com/
2. Set up a WhatsApp Business account
3. Create a WhatsApp Business API app
4. Set up message templates for:
   - `event_survey_invitation`: For sending survey invitations
   - `event_survey_reminder`: For sending survey reminders

Update your `.env` file with the real WhatsApp API credentials:

```
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/your_phone_number_id
WHATSAPP_API_TOKEN=your_whatsapp_api_token
```

### 2. Cron Job Setup

Set up a cron job to process survey schedules. This should run every hour.

#### Using Vercel Cron:

If you're deploying on Vercel, add the following to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/surveys",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### Using a traditional server:

Add the following to your crontab:

```
0 * * * * curl -X GET -H "Authorization: Bearer your_cron_secret_key" https://your-domain.com/api/cron/surveys
```

## Usage Guide

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

## Troubleshooting

### Survey Form Not Loading

- Check that the survey template exists in the database
- Verify that the token in the URL is valid
- Ensure MongoDB is running and accessible

### WhatsApp Messages Not Sending

- Check that your WhatsApp API credentials are correct
- Verify that your message templates are approved
- Check the logs for any error messages

### Surveys Not Being Sent Automatically

- Verify that the cron job is running correctly
- Check that the survey template is active
- Verify the timing settings for the survey
- Check the logs for any error messages
