import { Event, Survey, Attendee, Notification } from "@/server/db/models";
import { createNotification } from "@/lib/notification-service";
import { connectToDatabase } from "@/server/db/mongo";

// Mock models for compatibility
const RegistrationForm = {
  findById: async (formId: string) => null,
  updateMany: async (p0: { eventId: any; _id: { $ne: string; }; }, p1: { isActive: boolean; updatedAt: Date; }) => null,
  findByIdAndUpdate: async (formId: string, p0: { isActive: boolean; updatedAt: Date; }, p1: { new: boolean; }) => ({
    populate: async (p0: string) => ({
      eventId: { _id: 'mock-id', name: 'Mock Event' }
    })
  })
};

const SurveyResponse = {
  findById: async (responseId: string) => null
};

/**
 * Service to handle data synchronization between admin and attendee dashboards
 */

// Event-related functions
export const publishEvent = async (eventId: string) => {
  try {
    await connectToDatabase();

    // Update event status to published
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "published",
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!event) {
      throw new Error("Event not found");
    }

    // Notify admin users about the new published event
    const adminUsers = await getAdminUsers();

    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: "info",
        title: "Event Published",
        message: `Event "${event.name}" has been published and is now visible to attendees.`,
        eventId: event.id,
        actionUrl: `/admin/events/${event.id}`,
        actionLabel: "View Event",
      });
    }

    return { success: true, event };
  } catch (error) {
    console.error("Error publishing event:", error);
    return { success: false, error };
  }
};

export const unpublishEvent = async (eventId: string) => {
  try {
    await connectToDatabase();

    // Update event status to draft
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "draft",
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!event) {
      throw new Error("Event not found");
    }

    return { success: true, event };
  } catch (error) {
    console.error("Error unpublishing event:", error);
    return { success: false, error };
  }
};

// Survey-related functions
export const activateSurvey = async (surveyId: string) => {
  try {
    await connectToDatabase();

    // Update survey to active
    const survey = await Survey.findByIdAndUpdate(
      surveyId,
      {
        isActive: true,
        updatedAt: new Date()
      },
      { new: true }
) as unknown as {
  populate(arg0: string): unknown;
  id: any; eventId: { _id: string; name: string };
};
await survey.populate('eventId');

    if (!survey) {
      throw new Error("Survey not found");
    }

    // Get attendees who attended the event
    const attendees = await Attendee.find({
      eventId: survey.eventId._id,
      status: { $in: ["attended", "checked-in"] }
    }).populate('userId');

    // Notify attendees about the new survey
    for (const attendee of attendees) {
      if (attendee.userId) {
        await createNotification({
          userId: attendee.userId.id,
          type: "survey",
          title: "New Survey Available",
          message: `Please complete the survey for "${survey.eventId.name}".`,
          eventId: survey.eventId._id,
          actionUrl: `/attendee/surveys/${survey.id}`,
          actionLabel: "Take Survey",
        });
      }
    }

    // Notify admin users about the activated survey
    const adminUsers = await getAdminUsers();

    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: "info",
        title: "Survey Activated",
        message: `Survey for "${survey.eventId.name}" has been activated and is now available to attendees.`,
        eventId: survey.eventId._id,
        actionUrl: `/admin/surveys/${survey.id}`,
        actionLabel: "View Survey",
      });
    }

    return { success: true, survey };
  } catch (error) {
    console.error("Error activating survey:", error);
    return { success: false, error };
  }
};

export const deactivateSurvey = async (surveyId: string) => {
  try {
    await connectToDatabase();

    // Update survey to inactive
    const survey = await Survey.findByIdAndUpdate(
      surveyId,
      {
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!survey) {
      throw new Error("Survey not found");
    }

    return { success: true, survey };
  } catch (error) {
    console.error("Error deactivating survey:", error);
    return { success: false, error };
  }
};

// Registration form-related functions
export const activateRegistrationForm = async (formId: string) => {
  try {
    await connectToDatabase();

    // Get the form
    const form = await RegistrationForm.findById(formId);

    if (!form) {
      throw new Error("Registration form not found");
    }

    // Deactivate all other forms for this event
    await RegistrationForm.updateMany(
      {
        eventId: form.eventId,
        _id: { $ne: formId }
      },
      {
        isActive: false,
        updatedAt: new Date()
      }
    );

    // Activate this form
    const updatedForm = await (await RegistrationForm.findByIdAndUpdate(
      formId,
      {
        isActive: true,
        updatedAt: new Date()
      },
      { new: true }
    )).populate('eventId');

    // Notify admin users about the activated form
    const adminUsers = await getAdminUsers();

    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: "info",
        title: "Registration Form Activated",
        message: `Registration form for "${updatedForm.eventId.name}" has been activated.`,
        eventId: updatedForm.eventId._id,
        actionUrl: `/admin/events/${updatedForm.eventId._id}/registration`,
        actionLabel: "View Form",
      });
    }

    return { success: true, form: updatedForm };
  } catch (error) {
    console.error("Error activating registration form:", error);
    return { success: false, error };
  }
};

// Attendee registration-related functions
export const processRegistration = async (registrationId: string) => {
  try {
    await connectToDatabase();

    // Get the registration
    const registration = await Attendee.findById(registrationId)
      .populate('eventId')
      .populate('userId');

    if (!registration) {
      throw new Error("Registration not found");
    }

    // Update registration status to confirmed
    const updatedRegistration = await Attendee.findByIdAndUpdate(
      registrationId,
      {
        status: "confirmed",
        updatedAt: new Date()
      },
      { new: true }
    );

    // Notify the attendee
    if (registration.userId) {
      await createNotification({
        userId: registration.userId.id,
        type: "event",
        title: "Registration Confirmed",
        message: `Your registration for "${registration.eventId.name}" has been confirmed.`,
        eventId: registration.eventId._id,
        actionUrl: `/attendee/events/${registration.eventId._id}`,
        actionLabel: "View Event",
      });
    }

    // Notify admin users
    const adminUsers = await getAdminUsers();

    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: "info",
        title: "Registration Confirmed",
        message: `Registration for "${registration.eventId.name}" by ${registration.name} has been confirmed.`,
        eventId: registration.eventId._id,
        actionUrl: `/admin/events/${registration.eventId._id}/attendees`,
        actionLabel: "View Attendees",
      });
    }

    return { success: true, registration: updatedRegistration };
  } catch (error) {
    console.error("Error processing registration:", error);
    return { success: false, error };
  }
};

// Survey response-related functions
export const processSurveyResponse = async (responseId: string) => {
  try {
    await connectToDatabase();

    // Get the survey response
    const response = await SurveyResponse.findById(responseId)
      .then(res => res?.populate({
        path: 'surveyId',
        populate: {
          path: 'eventId'
        }
      }))
      .then(res => res?.populate('userId'));

    if (!response) {
      throw new Error("Survey response not found");
    }

    // Notify admin users about the new survey response
    const adminUsers = await getAdminUsers();

    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: "survey",
        title: "New Survey Response",
        message: `${response.userId.name} has submitted a response to the survey for "${response.surveyId.eventId.name}".`,
        eventId: response.surveyId.eventId._id,
        actionUrl: `/admin/surveys/${response.surveyId._id}/responses`,
        actionLabel: "View Responses",
      });
    }

    return { success: true, response };
  } catch (error) {
    console.error("Error processing survey response:", error);
    return { success: false, error };
  }
};

// Helper functions
const getAdminUsers = async () => {
  // This would be replaced with your actual admin user retrieval logic
  // For now, we'll return a mock admin user
  return [{ id: "admin-user-id", email: "admin@example.com" }];
};
