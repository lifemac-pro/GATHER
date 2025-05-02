import { zoomService } from "./zoom";
import { googleMeetService } from "./google-meet";
import { teamsService } from "./teams";
import { genericService } from "./generic";

export type VideoConferencingPlatform = "zoom" | "google-meet" | "teams" | "other";

export interface MeetingDetails {
  platform: VideoConferencingPlatform;
  meetingUrl: string;
  meetingId?: string;
  password?: string;
  hostUrl?: string;
  startUrl?: string;
  joinUrl?: string;
}

export interface CreateMeetingOptions {
  topic: string;
  description?: string;
  startTime: Date;
  duration: number; // in minutes
  timezone?: string;
  password?: string;
  settings?: {
    hostVideo?: boolean;
    participantVideo?: boolean;
    joinBeforeHost?: boolean;
    muteUponEntry?: boolean;
    waitingRoom?: boolean;
    recording?: boolean;
  };
}

export interface VideoConferencingService {
  createMeeting(options: CreateMeetingOptions): Promise<MeetingDetails>;
  getMeeting(meetingId: string): Promise<MeetingDetails | null>;
  updateMeeting(meetingId: string, options: Partial<CreateMeetingOptions>): Promise<MeetingDetails>;
  deleteMeeting(meetingId: string): Promise<boolean>;
  isConfigured(): boolean;
}

export const getVideoConferencingService = (platform: VideoConferencingPlatform): VideoConferencingService => {
  switch (platform) {
    case "zoom":
      return zoomService;
    case "google-meet":
      return googleMeetService;
    case "teams":
      return teamsService;
    default:
      return genericService;
  }
};

export const isVideoConferencingConfigured = (platform: VideoConferencingPlatform): boolean => {
  return getVideoConferencingService(platform).isConfigured();
};

export const createVideoConference = async (
  platform: VideoConferencingPlatform,
  options: CreateMeetingOptions
): Promise<MeetingDetails> => {
  const service = getVideoConferencingService(platform);
  return service.createMeeting(options);
};

export const getVideoConference = async (
  platform: VideoConferencingPlatform,
  meetingId: string
): Promise<MeetingDetails | null> => {
  const service = getVideoConferencingService(platform);
  return service.getMeeting(meetingId);
};

export const updateVideoConference = async (
  platform: VideoConferencingPlatform,
  meetingId: string,
  options: Partial<CreateMeetingOptions>
): Promise<MeetingDetails> => {
  const service = getVideoConferencingService(platform);
  return service.updateMeeting(meetingId, options);
};

export const deleteVideoConference = async (
  platform: VideoConferencingPlatform,
  meetingId: string
): Promise<boolean> => {
  const service = getVideoConferencingService(platform);
  return service.deleteMeeting(meetingId);
};
