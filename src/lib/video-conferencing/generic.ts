import { VideoConferencingService, MeetingDetails, CreateMeetingOptions } from "./index";

// Generic service for platforms without direct API integration
// This simply stores the meeting details provided by the user

// Create a generic meeting
const createGenericMeeting = async (options: CreateMeetingOptions): Promise<MeetingDetails> => {
  // For generic meetings, we just return the provided details
  return {
    platform: "other",
    meetingUrl: options.settings?.joinBeforeHost ? "https://example.com/meeting" : "",
    meetingId: `generic-${Date.now()}`,
    password: options.password,
  };
};

// Get a generic meeting
const getGenericMeeting = async (meetingId: string): Promise<MeetingDetails | null> => {
  // For generic meetings, we can't retrieve details
  // In a real implementation, you would store these in a database
  return null;
};

// Update a generic meeting
const updateGenericMeeting = async (
  meetingId: string,
  options: Partial<CreateMeetingOptions>
): Promise<MeetingDetails> => {
  // For generic meetings, we just return the updated details
  return {
    platform: "other",
    meetingUrl: options.settings?.joinBeforeHost ? "https://example.com/meeting" : "",
    meetingId,
    password: options.password,
  };
};

// Delete a generic meeting
const deleteGenericMeeting = async (meetingId: string): Promise<boolean> => {
  // For generic meetings, we just return success
  return true;
};

// Generic service is always configured
const isGenericConfigured = (): boolean => {
  return true;
};

// Export the generic service
export const genericService: VideoConferencingService = {
  createMeeting: createGenericMeeting,
  getMeeting: getGenericMeeting,
  updateMeeting: updateGenericMeeting,
  deleteMeeting: deleteGenericMeeting,
  isConfigured: isGenericConfigured,
};
