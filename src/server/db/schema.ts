import { sql } from "drizzle-orm";
import { index, int, sqliteTableCreator, text, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * This schema defines users, events, and attendee registration.
 */
export const createTable = sqliteTableCreator((name) => `GATHER_${name}`);

/** 🔹 Users Table */
export const users = createTable(
  "users",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    email: text("email", { length: 256 }).unique().notNull(),
    password: text("password", { length: 256 }).notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (user) => ({
    emailIndex: index("email_idx").on(user.email),
  })
);

/** 🔹 Events Table */
export const events = createTable(
  "events",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title", { length: 256 }).notNull(),
    description: text("description"),
    date: text("date").notNull(),
    location: text("location", { length: 256 }),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (event) => ({
    titleIndex: index("title_idx").on(event.title),
  })
);

/** 🔹 Attendees Table (Registering Users for Events) */
export const attendees = createTable(
  "attendees",
  {
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: int("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    registeredAt: int("registered_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (attendee) => ({
    userEventPK: primaryKey({ columns: [attendee.userId, attendee.eventId] }), // Composite primary key
    userEventIndex: index("user_event_idx").on(attendee.userId, attendee.eventId),
  })
);
