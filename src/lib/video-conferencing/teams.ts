import { VideoConferencingService, MeetingDetails, CreateMeetingOptions } from "./index";
import { env } from "@/env";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { ClientSecretCredential } from "@azure/identity";

// Check if Microsoft Teams is configured
const isTeamsConfigured = (): boolean => {
  return !!(
    env.MICROSOFT_CLIENT_ID &&
    env.MICROSOFT_CLIENT_SECRET &&
    env.MICROSOFT_TENANT_ID
  );
};

// Get Microsoft Graph client
const getMicrosoftGraphClient = async () => {
  if (!isTeamsConfigured()) {
    throw new Error("Microsoft Teams API is not configured");
  }
  
  const credential = new ClientSecretCredential(
    env.MICROSOFT_TENANT_ID!,
    env.MICROSOFT_CLIENT_ID!,
    env.MICROSOFT_CLIENT_SECRET!
  );
  
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });
  
  return Client.initWithMiddleware({
    authProvider,
  });
};

// Create a Microsoft Teams meeting
const createTeamsMeeting = async (options: CreateMeetingOptions): Promise<MeetingDetails> => {
  try {
    const client = await getMicrosoftGraphClient();
    
    // Calculate end time
    const startTime = new Date(options.startTime);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + options.duration);
    
    // Create online meeting
    const meeting = {
      subject: options.topic,
      startDateTime: startTime.toISOString(),
      endDateTime: endTime.toISOString(),
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
    };
    
    const response = await client
      .api("/me/onlineMeetings")
      .post(meeting);
    
    if (!response || !response.joinUrl) {
      throw new Error("Failed to create Microsoft Teams meeting");
    }
    
    return {
      platform: "teams",
      meetingUrl: response.joinUrl,
      meetingId: response.id,
      joinUrl: response.joinUrl,
    };
  } catch (error) {
    console.error("Error creating Microsoft Teams meeting:", error);
    throw new Error("Failed to create Microsoft Teams meeting");
  }
};

// Get a Microsoft Teams meeting
const getTeamsMeeting = async (meetingId: string): Promise<MeetingDetails | null> => {
  try {
    const client = await getMicrosoftGraphClient();
    
    const response = await client
      .api(`/me/onlineMeetings/${meetingId}`)
      .get();
    
    if (!response || !response.joinUrl) {
      return null;
    }
    
    return {
      platform: "teams",
      meetingUrl: response.joinUrl,
      meetingId: response.id,
      joinUrl: response.joinUrl,
    };
  } catch (error) {
    console.error("Error getting Microsoft Teams meeting:", error);
    if ((error as any).statusCode === 404) {
      return null;
    }
    throw new Error("Failed to get Microsoft Teams meeting");
  }
};

// Update a Microsoft Teams meeting
const updateTeamsMeeting = async (
  meetingId: string,
  options: Partial<CreateMeetingOptions>
): Promise<MeetingDetails> => {
  try {
    const client = await getMicrosoftGraphClient();
    
    // Prepare update payload
    const updatePayload: any = {};
    
    if (options.topic) updatePayload.subject = options.topic;
    
    if (options.startTime) {
      // Calculate end time
      const startTime = new Date(options.startTime);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (options.duration || 60));
      
      updatePayload.startDateTime = startTime.toISOString();
      updatePayload.endDateTime = endTime.toISOString();
    }
    
    // Update the meeting
    const response = await client
      .api(`/me/onlineMeetings/${meetingId}`)
      .patch(updatePayload);
    
    // Get the updated meeting details
    return getTeamsMeeting(meetingId) as Promise<MeetingDetails>;
  } catch (error) {
    console.error("Error updating Microsoft Teams meeting:", error);
    throw new Error("Failed to update Microsoft Teams meeting");
  }
};

// Delete a Microsoft Teams meeting
const deleteTeamsMeeting = async (meetingId: string): Promise<boolean> => {
  try {
    const client = await getMicrosoftGraphClient();
    
    await client
      .api(`/me/onlineMeetings/${meetingId}`)
      .delete();
    
    return true;
  } catch (error) {
    console.error("Error deleting Microsoft Teams meeting:", error);
    if ((error as any).statusCode === 404) {
      return true; // Meeting doesn't exist, consider it deleted
    }
    throw new Error("Failed to delete Microsoft Teams meeting");
  }
};

// Export the Microsoft Teams service
export const teamsService: VideoConferencingService = {
  createMeeting: createTeamsMeeting,
  getMeeting: getTeamsMeeting,
  updateMeeting: updateTeamsMeeting,
  deleteMeeting: deleteTeamsMeeting,
  isConfigured: isTeamsConfigured,
};
