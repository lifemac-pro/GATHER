# Enhanced Registration Form with Demographics

This document provides an overview of the enhanced registration form with demographic information for the GATHER application.

## Features

- **Enhanced Registration Form**: Collect comprehensive information from attendees during registration
- **Demographic Information**: Collect optional demographic information for better event planning and analytics
- **Demographics Analytics**: Visualize demographic data with charts and graphs
- **Privacy-Focused**: All demographic information is optional and clearly marked as such

## Demographic Information Collected

The enhanced registration form collects the following demographic information:

- **Age/Date of Birth**: Collect age or date of birth for age-based analytics
- **Gender**: Collect gender information with inclusive options
- **Location**: Collect country and city information
- **Occupation/Industry**: Collect professional information
- **Interests**: Collect interest areas to better understand attendee preferences
- **Dietary Restrictions**: Collect dietary preferences for event catering
- **Accessibility Needs**: Collect accessibility requirements for better event planning
- **Languages**: Collect language preferences for multilingual events
- **Education Level**: Collect education information for academic events

## Setup Instructions

The enhanced registration form is already integrated into the GATHER application. No additional setup is required.

## Usage Guide

### Registering for an Event with Demographic Information

1. Go to an event page
2. Click "Register for Event"
3. Fill in the required information (name, email)
4. Expand the "Demographic Information (Optional)" section
5. Fill in any demographic information you wish to provide
6. Click "Register" to complete the registration

### Viewing Demographic Analytics

1. Go to Admin Dashboard → Events → [Event Name] → Analytics
2. Click the "Demographics" tab
3. View demographic breakdowns by:
   - Gender
   - Age
   - Location
   - Industry
   - Languages
   - Dietary Restrictions
   - Accessibility Needs

## Implementation Details

### Database Schema

The demographic information is stored in the `demographics` field of the `Attendee` model:

```typescript
const demographicSchema = new mongoose.Schema({
  age: Number,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other']
  },
  genderOther: String,
  country: String,
  city: String,
  occupation: String,
  industry: String,
  interests: [String],
  dietaryRestrictions: [String],
  accessibilityNeeds: [String],
  howHeard: String,
  languages: [String],
  educationLevel: {
    type: String,
    enum: ['high-school', 'bachelors', 'masters', 'doctorate', 'other', 'prefer-not-to-say']
  }
});
```

### Components

- `EnhancedRegistrationForm`: The main component for the enhanced registration form
- `DemographicsAnalytics`: The component for displaying demographic analytics

### API Endpoints

- `POST /api/trpc/attendee.register`: Register for an event with demographic information
- `GET /api/trpc/attendee.getByEvent`: Get attendees for an event, optionally including demographic information

## Testing

You can test the enhanced registration form and demographic analytics using the provided test script:

```bash
node src/scripts/test-demographics.js
```

This script will:
1. Create a test event
2. Create a test user
3. Register the user for the event with demographic information
4. Verify the demographic information is stored correctly

## Privacy Considerations

- All demographic information is optional
- The purpose of collecting demographic information is clearly stated
- Demographic information is only used for event planning and analytics
- Demographic information is not shared with third parties
- Users can choose "Prefer not to say" for sensitive information

## Future Enhancements

- **Export Demographic Data**: Add the ability to export demographic data in CSV format
- **Custom Demographic Fields**: Allow event organizers to create custom demographic fields
- **Demographic Trends**: Show demographic trends across multiple events
- **Demographic Targeting**: Use demographic information to target specific audiences for future events
- **Demographic Surveys**: Send post-event surveys based on demographic information
