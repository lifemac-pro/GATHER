import { VideoConferencingService, MeetingDetails, CreateMeetingOptions } from "./index";
import { env } from "@/env";

// Zoom API endpoints
const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";
const ZOOM_MEETING_ENDPOINT = `${ZOOM_API_BASE_URL}/users/me/meetings`;

// Check if Zoom is configured
const isZoomConfigured = (): boolean => {
  return !!(env.ZOOM_API_KEY && env.ZOOM_API_SECRET);
};

// Get Zoom access token
const getZoomAccessToken = async (): Promise<string> => {
  if (!isZoomConfigured()) {
    throw new Error("Zoom API is not configured");
  }
  
  try {
    const tokenEndpoint = "https://zoom.us/oauth/token";
    const credentials = Buffer.from(`${env.ZOOM_API_KEY}:${env.ZOOM_API_SECRET}`).toString("base64");
    
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=account_credentials&account_id=" + env.ZOOM_ACCOUNT_ID,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get Zoom access token: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Zoom access token:", error);
    throw new Error("Failed to authenticate with Zoom API");
  }
};

// Create a Zoom meeting
const createZoomMeeting = async (options: CreateMeetingOptions): Promise<MeetingDetails> => {
  try {
    const accessToken = await getZoomAccessToken();
    
    const payload = {
      topic: options.topic,
      type: 2, // Scheduled meeting
      start_time: options.startTime.toISOString(),
      duration: options.duration,
      timezone: options.timezone || "UTC",
      password: options.password,
      settings: {
        host_video: options.settings?.hostVideo,
        participant_video: options.settings?.participantVideo,
        join_before_host: options.settings?.joinBeforeHost,
        mute_upon_entry: options.settings?.muteUponEntry,
        waiting_room: options.settings?.waitingRoom,
        auto_recording: options.settings?.recording ? "cloud" : "none",
      },
    };
    
    const response = await fetch(ZOOM_MEETING_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create Zoom meeting: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      platform: "zoom",
      meetingUrl: data.join_url,
      meetingId: data.id.toString(),
      password: data.password,
      hostUrl: data.start_url,
      startUrl: data.start_url,
      joinUrl: data.join_url,
    };
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    throw new Error("Failed to create Zoom meeting");
  }
};

// Get a Zoom meeting
const getZoomMeeting = async (meetingId: string): Promise<MeetingDetails | null> => {
  try {
    const accessToken = await getZoomAccessToken();
    
    const response = await fetch(`${ZOOM_API_BASE_URL}/meetings/${meetingId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to get Zoom meeting: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      platform: "zoom",
      meetingUrl: data.join_url,
      meetingId: data.id.toString(),
      password: data.password,
      hostUrl: data.start_url,
      startUrl: data.start_url,
      joinUrl: data.join_url,
    };
  } catch (error) {
    console.error("Error getting Zoom meeting:", error);
    throw new Error("Failed to get Zoom meeting");
  }
};

// Update a Zoom meeting
const updateZoomMeeting = async (
  meetingId: string,
  options: Partial<CreateMeetingOptions>
): Promise<MeetingDetails> => {
  try {
    const accessToken = await getZoomAccessToken();
    
    const payload: Record<string, any> = {};
    
    if (options.topic) payload.topic = options.topic;
    if (options.startTime) payload.start_time = options.startTime.toISOString();
    if (options.duration) payload.duration = options.duration;
    if (options.timezone) payload.timezone = options.timezone;
    if (options.password) payload.password = options.password;
    
    if (options.settings) {
      payload.settings = {};
      if (options.settings.hostVideo !== undefined) payload.settings.host_video = options.settings.hostVideo;
      if (options.settings.participantVideo !== undefined) payload.settings.participant_video = options.settings.participantVideo;
      if (options.settings.joinBeforeHost !== undefined) payload.settings.join_before_host = options.settings.joinBeforeHost;
      if (options.settings.muteUponEntry !== undefined) payload.settings.mute_upon_entry = options.settings.muteUponEntry;
      if (options.settings.waitingRoom !== undefined) payload.settings.waiting_room = options.settings.waitingRoom;
      if (options.settings.recording !== undefined) payload.settings.auto_recording = options.settings.recording ? "cloud" : "none";
    }
    
    const response = await fetch(`${ZOOM_API_BASE_URL}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update Zoom meeting: ${response.statusText}`);
    }
    
    // Get the updated meeting details
    return getZoomMeeting(meetingId) as Promise<MeetingDetails>;
  } catch (error) {
    console.error("Error updating Zoom meeting:", error);
    throw new Error("Failed to update Zoom meeting");
  }
};

// Delete a Zoom meeting
const deleteZoomMeeting = async (meetingId: string): Promise<boolean> => {
  try {
    const accessToken = await getZoomAccessToken();
    
    const response = await fetch(`${ZOOM_API_BASE_URL}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (response.status === 404) {
      return true; // Meeting doesn't exist, consider it deleted
    }
    
    if (!response.ok) {
      throw new Error(`Failed to delete Zoom meeting: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting Zoom meeting:", error);
    throw new Error("Failed to delete Zoom meeting");
  }
};

// Export the Zoom service
export const zoomService: VideoConferencingService = {
  createMeeting: createZoomMeeting,
  getMeeting: getZoomMeeting,
  updateMeeting: updateZoomMeeting,
  deleteMeeting: deleteZoomMeeting,
  isConfigured: isZoomConfigured,
};
