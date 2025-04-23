import { sql } from "drizzle-orm";
import {
  index,
  int,
  sqliteTableCreator,
  text,
  // decimal, // Uncomment when you have the proper import
} from "drizzle-orm/sqlite-core";

export const createTable = sqliteTableCreator((name) => `GATHER_${name}`);

export const users = createTable(
  "user",
  {
    id: text("id").primaryKey(), // Clerk user ID
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    role: text("role", { enum: ["admin", "super_admin"] })
      .default("admin")
      .notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => ({
    emailIndex: index("email_idx").on(table.email),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const attendeeStatusEnum = [
  "registered",
  "attended",
  "cancelled",
  "waitlisted",
] as const;
export type AttendeeStatus = (typeof attendeeStatusEnum)[number];

export const attendees = createTable(
  "attendee",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    eventId: text("eventId")
      .notNull()
      .references(() => events.id),
    status: text("status", { enum: attendeeStatusEnum })
      .default("registered")
      .notNull(),
    paymentStatus: text("payment_status").default("pending"),
    paymentIntentId: text("payment_intent_id"),
    registeredAt: int("registered_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    checkedInAt: int("checked_in_at", { mode: "timestamp" }),
    checkInLocation: text("check_in_location"),
    checkInNotes: text("check_in_notes"),
    feedbackRequested: int("feedback_requested", { mode: "boolean" }).default(
      false,
    ),
    feedbackRequestedAt: int("feedback_requested_at", { mode: "timestamp" }),
    lastReminderSentAt: int("last_reminder_sent_at", { mode: "timestamp" }),
    reminderCount: int("reminder_count").default(0),
  },
  (table) => ({
    userEventIdx: index("user_event_idx").on(table.userId, table.eventId),
    statusIdx: index("status_idx").on(table.status),
    registeredAtIdx: index("registered_at_idx").on(table.registeredAt),
    checkedInAtIdx: index("checked_in_at_idx").on(table.checkedInAt),
  }),
);

export type Attendee = typeof attendees.$inferSelect;
export type NewAttendee = typeof attendees.$inferInsert;

export const events = createTable(
  "event",
  {
    id: text("id")
      .primaryKey()
      .default(sql`(hex(randomblob(16)))`),
    name: text("name").notNull(),
    description: text("description"),
    location: text("location"),
    startDate: int("start_date", { mode: "timestamp" }).notNull(),
    endDate: int("end_date", { mode: "timestamp" }).notNull(),
    maxAttendees: int("max_attendees"),
    category: text("category").notNull(),
    featured: int("featured", { mode: "boolean" }).default(false),
    status: text("status", {
      enum: ["draft", "published", "cancelled", "completed"],
    })
      .default("draft")
      .notNull(),
    price: text("price").default("0"), // Using text instead of decimal until we have proper import
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
    allowWaitlist: int("allow_waitlist", { mode: "boolean" })
      .default(false)
      .notNull(),
    autoConfirmWaitlist: int("auto_confirm_waitlist", {
      mode: "boolean",
    }).default(false),
    sendReminders: int("send_reminders", { mode: "boolean" })
      .default(true)
      .notNull(),
    reminderDays: int("reminder_days").default(1),
    feedbackEnabled: int("feedback_enabled", { mode: "boolean" })
      .default(true)
      .notNull(),
    autoRequestFeedback: int("auto_request_feedback", {
      mode: "boolean",
    }).default(true),
  },
  (table) => ({
    createdByIndex: index("created_by_idx").on(table.createdById),
    startDateIdx: index("start_date_idx").on(table.startDate),
  }),
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export const settings = createTable("settings", {
  type: text("type", {
    enum: ["email", "general", "notifications"],
  }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date(),
  ),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
