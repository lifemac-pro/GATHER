import { type Document, Model, type Types } from "mongoose";

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
export interface BaseQueryMethods {
  lean<T = any>(): Promise<T>;
  populate(path: string, select?: string): Promise<any>;
  exec(): Promise<any>;
}

export interface BaseModel<T extends Document> {
  findById(id: string | Types.ObjectId): Promise<T | null> & BaseQueryMethods;
  findOne(conditions: any): Promise<T | null> & BaseQueryMethods;
  find(conditions?: any): Promise<T[]> & BaseQueryMethods;
  create(data: any): Promise<T>;
  updateOne(conditions: any, update: any): Promise<any>;
  findOneAndUpdate(conditions: any, update: any, options?: any): Promise<T | null> & BaseQueryMethods;
  findOneAndDelete(conditions: any): Promise<T | null> & BaseQueryMethods;
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
  role?: "admin" | "super_admin" | "user";
  firstName?: string | null;
  lastName?: string | null;
  profileImage?: string | null;
}

export interface UserDocument extends BaseDocument, UserInput {
  name: string; // Virtual getter that combines firstName and lastName
  fullName: string; // Alias for name
}

export interface UserModel extends BaseModel<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
  validatePassword(password: string, hashedPassword: string): Promise<boolean>;
}

/**
 * Event model interfaces
 */
export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0-6, where 0 is Sunday
  daysOfMonth?: number[]; // 1-31
  monthsOfYear?: number[]; // 0-11, where 0 is January
  endDate?: Date;
  count?: number; // number of occurrences
  exceptions?: Date[]; // dates to exclude
}

export interface VirtualMeetingInfo {
  provider: "zoom" | "google_meet" | "microsoft_teams" | "other";
  meetingUrl: string;
  meetingId?: string;
  password?: string;
  hostUrl?: string; // URL for the host with additional privileges
  additionalInfo?: string;
}

export interface EventInput {
  name: string;
  description?: string;
  location?: string;
  isVirtual?: boolean;
  virtualMeetingInfo?: VirtualMeetingInfo;
  startDate: Date;
  endDate: Date;
  category: string;
  maxAttendees?: string[];
  price?: number;
  createdById?: string;
  image?: string;
  featured?: boolean;
  status?: "draft" | "published" | "cancelled" | "completed";
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  parentEventId?: string; // For recurring event instances
  originalStartDate?: Date; // For modified instances of recurring events
}

export interface EventDocument extends BaseDocument, EventInput {}

export interface Event extends EventInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventModel extends BaseModel<EventDocument> {
  findByIdWithAttendees(id: string): Promise<EventDocument | null>;
  findFeatured(): Promise<EventDocument[]>;
  findUpcoming(limit?: number): Promise<EventDocument[]>;
  findByCategory(category: string): Promise<EventDocument[]>;
  findByCreator(userId: string): Promise<EventDocument[]>;
  countAttendees(eventId: string): Promise<number>;
  findRecurringInstances(parentEventId: string): Promise<EventDocument[]>;
  findInDateRange(startDate: Date, endDate: Date): Promise<EventDocument[]>;
  generateRecurringInstances(
    parentEventId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]>;
}

/**
 * Demographic information interface
 */
export interface DemographicInfo {
  age?: number;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "non-binary" | "prefer-not-to-say" | "other";
  genderOther?: string;
  country?: string;
  city?: string;
  occupation?: string;
  industry?: string;
  interests?: string[];
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  howHeard?: string;
  languages?: string[];
  educationLevel?:
    | "high-school"
    | "bachelors"
    | "masters"
    | "doctorate"
    | "other"
    | "prefer-not-to-say";
}

/**
 * Attendee model interfaces
 */
export interface AttendeeInput {
  eventId: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  status: "registered" | "attended" | "cancelled" | "waitlisted";
  paymentStatus: "pending" | "completed" | "failed" | "free";
  registeredAt: Date;
  checkedInAt?: Date;
  paymentIntentId?: string;
  ticketCode?: string;
  checkedInBy?: string;
  checkInNotes?: string;
  demographics?: DemographicInfo;
}

export interface AttendeeDocument extends BaseDocument, AttendeeInput {}

export interface AttendeeModel extends BaseModel<AttendeeDocument> {
  findByIdAndUpdate(registrationId: string, arg1: { status: string; updatedAt: Date; }, arg2: { new: boolean; }): unknown;
  findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<AttendeeDocument | null>;
  findByEvent(eventId: string, options?: any): Promise<AttendeeDocument[]>;
  findByUser(userId: string): Promise<AttendeeDocument[]>;
  checkIn(id: string): Promise<AttendeeDocument | null>;
  cancel(id: string): Promise<AttendeeDocument | null>;
  getEventStats(eventId: string): Promise<{ total: number; checkedIn: number }>;
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
  type?: "text" | "announcement" | "system";
}

export interface ChatDocument extends BaseDocument, ChatInput {}

export interface ChatModel extends BaseModel<ChatDocument> {
  findByEvent(
    eventId: string,
    limit?: number,
    cursor?: string,
  ): Promise<ChatDocument[]>;
}

/**
 * Notification model interfaces
 */
export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type: "event" | "system" | "chat" | "reminder";
  read: boolean;
  eventId?: string | null;
  actionUrl?: string | null;
}

export interface NotificationDocument extends BaseDocument, NotificationInput {}

export interface NotificationModel extends BaseModel<NotificationDocument> {
  findByUser(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<NotificationDocument[]>;
  markAsRead(id: string): Promise<NotificationDocument | null>;
  markAllAsRead(userId: string): Promise<void>;
  countUnread(userId: string): Promise<number>;
}

/**
 * Survey Question Types
 */
export interface SurveyQuestion {
  id: string;
  text: string;
  type: "text" | "rating" | "multiple_choice" | "checkbox" | "dropdown";
  required: boolean;
  options?: string[];
  order: number;
}

/**
 * Survey Template interfaces
 */
export interface SurveyTemplateInput {
  eventId: string;
  name: string;
  description?: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  sendTiming: "after_event" | "during_event" | "custom";
  sendDelay?: number;
  sendTime?: Date;
  reminderEnabled: boolean;
  reminderDelay?: number;
  createdById: string;
}

export interface SurveyTemplateDocument
  extends BaseDocument,
    SurveyTemplateInput {}

export interface SurveyTemplateModel extends BaseModel<SurveyTemplateDocument> {
  findByEvent(eventId: string): Promise<SurveyTemplateDocument[]>;
  findActive(eventId: string): Promise<SurveyTemplateDocument | null>;
}

/**
 * Survey model interfaces
 */
export interface SurveyResponse {
  questionId: string;
  questionText: string;
  answer: string | number | string[];
}

export interface SurveyInput {
  eventId: string;
  templateId: string;
  userId: string;
  responses: SurveyResponse[];
  rating?: number;
  feedback?: string;
  submittedAt?: Date;
}

export interface SurveyDocument extends BaseDocument, SurveyInput {
  name: string;
}

export interface SurveyModel extends BaseModel<SurveyDocument> {
  findByIdAndUpdate(surveyId: string, arg1: { isActive: boolean; updatedAt: Date; }, arg2: { new: boolean; }): unknown;
  findByEvent(eventId: string): Promise<SurveyDocument[]>;
  findByUser(userId: string): Promise<SurveyDocument[]>;
  findByTemplate(templateId: string): Promise<SurveyDocument[]>;
  getEventRating(eventId: string): Promise<number>;
}

/**
 * Survey Response interfaces
 */
export interface SurveyResponseInput {
  surveyId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    value: string | number | string[];
  }>;
}

export interface SurveyResponseDocument extends BaseDocument, SurveyResponseInput {}

export interface SurveyResponseModel extends BaseModel<SurveyResponseDocument> {
  findBySurvey(surveyId: string): Promise<SurveyResponseDocument[]>;
  findByUser(userId: string): Promise<SurveyResponseDocument[]>;
}

/**
 * Waitlist model interfaces
 */
export interface WaitlistInput {
  eventId: string;
  userId: string;
  position: number;
  status: "waiting" | "invited" | "expired";
  invitationSentAt?: Date;
  invitationExpiresAt?: Date;
}

export interface WaitlistDocument extends BaseDocument, WaitlistInput {}

export interface WaitlistModel extends BaseModel<WaitlistDocument> {
  findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<WaitlistDocument | null>;
  findByEvent(eventId: string): Promise<WaitlistDocument[]>;
  findByUser(userId: string): Promise<WaitlistDocument[]>;
  getPosition(id: string): Promise<number>;
  processInvitations(
    eventId: string,
    count: number,
  ): Promise<WaitlistDocument[]>;
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

export type PostModel = BaseModel<PostDocument>

/**
 * Registration Form Field Types
 */
export interface RegistrationFormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "date" | "select" | "checkbox" | "radio" | "textarea" | "file";
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  validation?: string;
  order: number;
  defaultValue?: string;
  isHidden?: boolean;
  isSystem?: boolean;
  maxLength?: number;
  minLength?: number;
  maxSize?: number;
  allowedFileTypes?: string[];
}

/**
 * Registration Form Section Types
 */
export interface RegistrationFormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: RegistrationFormField[];
  isCollapsible?: boolean;
  isCollapsed?: boolean;
}

/**
 * Registration Form Template interfaces
 */
export interface RegistrationFormInput {
  eventId: string;
  name: string;
  description?: string;
  sections: RegistrationFormSection[];
  isActive: boolean;
  isDefault?: boolean;
  requiresApproval?: boolean;
  collectPayment?: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentDescription?: string;
  maxRegistrations?: number;
  startDate?: Date;
  endDate?: Date;
  createdById: string;
}

export interface RegistrationFormDocument extends BaseDocument, RegistrationFormInput {}

export interface RegistrationFormModel extends BaseModel<RegistrationFormDocument> {
  findByEvent(eventId: string): Promise<RegistrationFormDocument[]>;
  findActiveByEvent(eventId: string): Promise<RegistrationFormDocument | null>;
}

/**
 * Registration Submission Field Response
 */
export interface FieldResponse {
  fieldId: string;
  fieldLabel: string;
  value: any;
  fileUrl?: string;
}

/**
 * Registration Submission Section Response
 */
export interface SectionResponse {
  sectionId: string;
  sectionTitle: string;
  fields: FieldResponse[];
}

/**
 * Registration Submission interfaces
 */
export interface RegistrationSubmissionInput {
  formId: string;
  eventId: string;
  userId: string;
  attendeeId?: string;
  sections: SectionResponse[];
  status: "pending" | "approved" | "rejected" | "cancelled" | "confirmed";
  paymentStatus: "not_required" | "pending" | "completed" | "failed" | "refunded";
  paymentIntentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  notes?: string;
  rejectionReason?: string;
  submittedAt: Date;
  approvedAt?: Date;
  approvedById?: string;
  rejectedAt?: Date;
  rejectedById?: string;
  confirmedAt?: Date;
}

export interface RegistrationSubmissionDocument extends BaseDocument, RegistrationSubmissionInput {}

export interface RegistrationSubmissionModel extends BaseModel<RegistrationSubmissionDocument> {
  findByEvent(eventId: string): Promise<RegistrationSubmissionDocument[]>;
  findByUser(userId: string): Promise<RegistrationSubmissionDocument[]>;
  findByForm(formId: string): Promise<RegistrationSubmissionDocument[]>;
  countByStatus(eventId: string): Promise<Array<{ _id: string; count: number }>>;
}

/**
 * User Preference model interfaces
 */
export interface UserPreferenceInput {
  userId: string;
  emailNotifications: boolean;
  eventReminders: boolean;
  surveyReminders: boolean;
  marketingEmails: boolean;
}

export interface UserPreferenceDocument extends BaseDocument, UserPreferenceInput {}

export interface UserPreferenceModel extends BaseModel<UserPreferenceDocument> {
  findByUser(userId: string): Promise<UserPreferenceDocument | null>;
  updatePreferences(userId: string, preferences: Partial<UserPreferenceInput>): Promise<UserPreferenceDocument | null>;
}
