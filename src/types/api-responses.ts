import { AttendeeDocument, EventDocument, SurveyDocument, NotificationDocument, ChatDocument, WaitlistDocument } from '@/server/db/models/types';

/**
 * Base API response interface
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * API error interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Cursor-based pagination metadata
 */
export interface CursorPaginationMeta {
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

/**
 * Cursor-based paginated response
 */
export interface CursorPaginatedResponse<T> {
  items: T[];
  meta: CursorPaginationMeta;
}

/**
 * Event response interfaces
 */
export interface EventResponse {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  category: string;
  price?: number;
  maxAttendees?: string[];
  createdById?: string;
  image?: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
  attendeeCount?: number;
  isRegistered?: boolean;
}

export interface EventListResponse extends CursorPaginatedResponse<EventResponse> {}

export interface EventDetailResponse extends ApiResponse<EventResponse> {}

/**
 * Attendee response interfaces
 */
export interface AttendeeResponse extends Omit<AttendeeDocument, '_id'> {
  id: string;
  event?: EventResponse;
  user?: UserResponse;
}

export interface AttendeeListResponse extends PaginatedResponse<AttendeeResponse> {}

export interface AttendeeDetailResponse extends ApiResponse<AttendeeResponse> {}

export interface AttendeeStatsResponse {
  totalAttendees: number;
  checkedInCount: number;
  checkedInRate: number;
  registrationsByStatus: {
    status: string;
    count: number;
  }[];
}

/**
 * User response interfaces
 */
export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role?: string;
}

export interface UserListResponse extends PaginatedResponse<UserResponse> {}

/**
 * Survey response interfaces
 */
export interface SurveyResponse extends Omit<SurveyDocument, '_id'> {
  id: string;
  event?: EventResponse;
  user?: UserResponse;
}

export interface SurveyListResponse extends PaginatedResponse<SurveyResponse> {}

export interface SurveyDetailResponse extends ApiResponse<SurveyResponse> {}

export interface SurveyStatsResponse {
  averageRating: number;
  responseCount: number;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
  commonFeedback: string[];
}

/**
 * Notification response interfaces
 */
export interface NotificationResponse extends Omit<NotificationDocument, '_id'> {
  id: string;
}

export interface NotificationListResponse extends CursorPaginatedResponse<NotificationResponse> {}

/**
 * Chat response interfaces
 */
export interface ChatMessageResponse extends Omit<ChatDocument, '_id'> {
  id: string;
  user?: UserResponse;
}

export interface ChatListResponse extends CursorPaginatedResponse<ChatMessageResponse> {}

/**
 * Waitlist response interfaces
 */
export interface WaitlistResponse extends Omit<WaitlistDocument, '_id'> {
  id: string;
  event?: EventResponse;
  user?: UserResponse;
}

export interface WaitlistListResponse extends PaginatedResponse<WaitlistResponse> {}

/**
 * Analytics response interfaces
 */
export interface AnalyticsResponse {
  totalAttendees: number;
  checkedInRate: number;
  totalEvents: number;
  attendanceData: {
    status: string;
    count: number;
  }[];
  demographicsData: {
    category: string;
    count: number;
  }[];
  dailyTrends: {
    date: string;
    attendees: number;
    events: number;
  }[];
  monthlyStats: {
    month: string;
    events: number;
    attendees: number;
    surveys: number;
  }[];
}

/**
 * Dashboard response interfaces
 */
export interface DashboardStatsResponse {
  totalAttendees: number;
  checkedInRate: number;
  totalEvents: number;
  upcomingEvents: number;
  recentActivity: {
    type: string;
    message: string;
    timestamp: Date;
  }[];
}

/**
 * Export response interfaces
 */
export interface ExportResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
}

/**
 * Operation response interfaces
 */
export interface OperationResponse {
  success: boolean;
  message?: string;
  affectedItems?: number;
}

/**
 * Auth response interfaces
 */
export interface AuthResponse {
  user: UserResponse;
  token?: string;
  expiresAt?: Date;
}
