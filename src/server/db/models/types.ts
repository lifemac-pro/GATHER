import { Document, Model, Types } from 'mongoose';

/**
 * Base interface for all documents
 */
export interface BaseDocument extends Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base model interface with common methods
 * Using a custom interface to avoid TypeScript errors with Mongoose
 */
export interface BaseModel<T extends Document> {
  findById(id: string | Types.ObjectId): Promise<T | null>;
  findOne(conditions: any): Promise<T | null>;
  find(conditions?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  updateOne(conditions: any, update: any): Promise<any>;
  findOneAndUpdate(conditions: any, update: any, options?: any): Promise<T | null>;
  findOneAndDelete(conditions: any): Promise<T | null>;
  deleteOne(conditions: any): Promise<any>;
  deleteMany(conditions: any): Promise<any>;
  countDocuments(conditions?: any): Promise<number>;
  aggregate(pipeline: any[]): Promise<any[]>;
}

/**
 * User model interfaces
 */
export interface UserInput {
  email: string;
  password?: string;
  role?: 'admin' | 'super_admin' | 'user';
  firstName?: string | null;
  lastName?: string | null;
  profileImage?: string | null;
}

export interface UserDocument extends BaseDocument, UserInput {}

export interface UserModel extends BaseModel<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
  validatePassword(password: string, hashedPassword: string): Promise<boolean>;
}

/**
 * Event model interfaces
 */
export interface EventInput {
  name: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  category: string;
  maxAttendees?: string[];
  price?: number;
  createdById?: string;
  image?: string;
  featured?: boolean;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
}

export interface EventDocument extends BaseDocument, EventInput {}

export interface EventModel extends BaseModel<EventDocument> {
  findByIdWithAttendees(id: string): Promise<EventDocument | null>;
  findFeatured(): Promise<EventDocument[]>;
  findUpcoming(limit?: number): Promise<EventDocument[]>;
  findByCategory(category: string): Promise<EventDocument[]>;
  findByCreator(userId: string): Promise<EventDocument[]>;
  countAttendees(eventId: string): Promise<number>;
}

/**
 * Attendee model interfaces
 */
export interface AttendeeInput {
  eventId: string;
  userId: string;
  status: 'registered' | 'attended' | 'cancelled' | 'waitlisted';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'free';
  registeredAt: Date;
  checkedInAt?: Date;
  paymentIntentId?: string;
}

export interface AttendeeDocument extends BaseDocument, AttendeeInput {}

export interface AttendeeModel extends BaseModel<AttendeeDocument> {
  findByEventAndUser(eventId: string, userId: string): Promise<AttendeeDocument | null>;
  findByEvent(eventId: string, options?: any): Promise<AttendeeDocument[]>;
  findByUser(userId: string): Promise<AttendeeDocument[]>;
  checkIn(id: string): Promise<AttendeeDocument | null>;
  cancel(id: string): Promise<AttendeeDocument | null>;
  getEventStats(eventId: string): Promise<{ total: number, checkedIn: number }>;
}

/**
 * Chat model interfaces
 */
export interface ChatInput {
  eventId: string;
  userId: string;
  message: string;
  userName?: string;
  userImage?: string;
  type?: 'text' | 'announcement' | 'system';
}

export interface ChatDocument extends BaseDocument, ChatInput {}

export interface ChatModel extends BaseModel<ChatDocument> {
  findByEvent(eventId: string, limit?: number, cursor?: string): Promise<ChatDocument[]>;
}

/**
 * Notification model interfaces
 */
export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type: 'event' | 'system' | 'chat' | 'reminder';
  read: boolean;
  eventId?: string | null;
  actionUrl?: string | null;
}

export interface NotificationDocument extends BaseDocument, NotificationInput {}

export interface NotificationModel extends BaseModel<NotificationDocument> {
  findByUser(userId: string, limit?: number, cursor?: string): Promise<NotificationDocument[]>;
  markAsRead(id: string): Promise<NotificationDocument | null>;
  markAllAsRead(userId: string): Promise<void>;
  countUnread(userId: string): Promise<number>;
}

/**
 * Survey model interfaces
 */
export interface SurveyResponse {
  question: string;
  answer: string;
}

export interface SurveyInput {
  eventId: string;
  userId: string;
  responses: SurveyResponse[];
  rating: number;
  feedback?: string;
  submittedAt?: Date;
}

export interface SurveyDocument extends BaseDocument, SurveyInput {}

export interface SurveyModel extends BaseModel<SurveyDocument> {
  findByEvent(eventId: string): Promise<SurveyDocument[]>;
  findByUser(userId: string): Promise<SurveyDocument[]>;
  getEventRating(eventId: string): Promise<number>;
}

/**
 * Waitlist model interfaces
 */
export interface WaitlistInput {
  eventId: string;
  userId: string;
  position: number;
  status: 'waiting' | 'invited' | 'expired';
  invitationSentAt?: Date;
  invitationExpiresAt?: Date;
}

export interface WaitlistDocument extends BaseDocument, WaitlistInput {}

export interface WaitlistModel extends BaseModel<WaitlistDocument> {
  findByEventAndUser(eventId: string, userId: string): Promise<WaitlistDocument | null>;
  findByEvent(eventId: string): Promise<WaitlistDocument[]>;
  findByUser(userId: string): Promise<WaitlistDocument[]>;
  getPosition(id: string): Promise<number>;
  processInvitations(eventId: string, count: number): Promise<WaitlistDocument[]>;
}

/**
 * Setting model interfaces
 */
export interface SettingInput {
  type: string;
  value: any;
}

export interface SettingDocument extends BaseDocument, SettingInput {}

export interface SettingModel extends BaseModel<SettingDocument> {
  findByType(type: string): Promise<SettingDocument | null>;
  updateValue(type: string, value: any): Promise<SettingDocument | null>;
}

/**
 * Post model interface (for testing)
 */
export interface PostInput {
  name: string;
}

export interface PostDocument extends BaseDocument, PostInput {}

export interface PostModel extends BaseModel<PostDocument> {}
