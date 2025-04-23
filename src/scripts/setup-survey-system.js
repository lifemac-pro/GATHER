/**
 * Setup script for the survey system
 *
 * This script:
 * 1. Creates a test event
 * 2. Creates a test survey template
 * 3. Creates a test attendee
 * 4. Tests the WhatsApp integration
 *
 * Run with: node src/scripts/setup-survey-system.js
 */

// Import required modules
const { nanoid } = require("nanoid");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.DATABASE_URL || "";

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    return mongoose;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Define schemas
const eventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  location: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  category: { type: String, required: true },
  status: { type: String, default: "published" },
  featured: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  maxAttendees: [String],
  createdById: { type: String, required: true },
  image: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const attendeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  status: { type: String, default: "registered" },
  paymentStatus: { type: String, default: "pending" },
  registeredAt: { type: Date, default: Date.now },
  checkedInAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const questionSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "rating", "multiple_choice", "checkbox", "dropdown"],
    required: true,
  },
  required: { type: Boolean, default: false },
  options: [String],
  order: { type: Number, required: true },
});

const surveyTemplateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  questions: [questionSchema],
  isActive: { type: Boolean, default: true },
  sendTiming: {
    type: String,
    enum: ["after_event", "during_event", "custom"],
    default: "after_event",
  },
  sendDelay: Number,
  sendTime: Date,
  reminderEnabled: { type: Boolean, default: false },
  reminderDelay: Number,
  createdById: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create models
const Event = mongoose.model("Event", eventSchema);
const Attendee = mongoose.model("Attendee", attendeeSchema);
const SurveyTemplate = mongoose.model("SurveyTemplate", surveyTemplateSchema);

// Main function
async function main() {
  try {
    // Connect to database
    await connectToDatabase();

    // Create a test event
    const eventId = "test-event-" + nanoid(6);
    let event = await Event.findOne({ id: eventId });

    if (!event) {
      console.log("Creating test event...");
      event = await Event.create({
        id: eventId,
        name: "Test Event for Survey System",
        description: "This is a test event for the survey system",
        location: "Test Location",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000), // 1 hour from now
        category: "Test",
        status: "published",
        featured: true,
        price: 0,
        maxAttendees: ["100"],
        createdById: "test-user",
        image: "",
      });
      console.log(`Created test event with ID: ${eventId}`);
    } else {
      console.log(`Using existing test event with ID: ${eventId}`);
    }

    // Create a test attendee
    const attendeeId = "test-attendee-" + nanoid(6);
    let attendee = await Attendee.findOne({ id: attendeeId });

    if (!attendee) {
      console.log("Creating test attendee...");
      attendee = await Attendee.create({
        id: attendeeId,
        eventId: eventId,
        userId: "test-user",
        name: "Test Attendee",
        email: "test@example.com",
        phone: "+1234567890", // Test phone number
        status: "checked_in",
        paymentStatus: "free",
        registeredAt: new Date(),
        checkedInAt: new Date(),
      });
      console.log(`Created test attendee with ID: ${attendeeId}`);
    } else {
      console.log(`Using existing test attendee with ID: ${attendeeId}`);
    }

    // Create a test survey template
    const templateId = "test-template-" + nanoid(6);
    let template = await SurveyTemplate.findOne({ id: templateId });

    if (!template) {
      console.log("Creating test survey template...");
      template = await SurveyTemplate.create({
        id: templateId,
        eventId: eventId,
        name: "Test Survey Template",
        description: "This is a test survey template",
        questions: [
          {
            id: "q1",
            text: "How would you rate this event?",
            type: "rating",
            required: true,
            order: 0,
          },
          {
            id: "q2",
            text: "What did you like most about the event?",
            type: "text",
            required: false,
            order: 1,
          },
          {
            id: "q3",
            text: "Which sessions did you attend?",
            type: "checkbox",
            required: false,
            options: ["Session 1", "Session 2", "Session 3"],
            order: 2,
          },
        ],
        isActive: true,
        sendTiming: "after_event",
        sendDelay: 1, // 1 hour after event
        reminderEnabled: true,
        reminderDelay: 24, // 24 hours after initial send
        createdById: "test-user",
      });
      console.log(`Created test survey template with ID: ${templateId}`);
    } else {
      console.log(`Using existing test survey template with ID: ${templateId}`);
    }

    // Generate a test survey URL
    const surveyToken = Buffer.from(
      JSON.stringify({
        attendeeId: attendeeId,
        templateId: templateId,
        timestamp: Date.now(),
      }),
    ).toString("base64");

    const surveyUrl = `${process.env.APP_URL || "http://localhost:3000"}/surveys/${templateId}?token=${surveyToken}`;

    console.log(`
Survey System Setup Information:
-------------------------------
Test Event ID: ${eventId}
Test Attendee ID: ${attendeeId}
Test Survey Template ID: ${templateId}
Survey URL: ${surveyUrl}

To test the survey form, visit:
${surveyUrl}

To test the admin interface, visit:
${process.env.APP_URL || "http://localhost:3000"}/admin/events/${eventId}/surveys
    `);

    // Test WhatsApp integration (mock)
    console.log("Testing WhatsApp integration (mock)...");
    console.log(`Would send WhatsApp message to: ${attendee.phone}`);
    console.log(`Message content: Survey invitation for ${event.name}`);
    console.log(`Survey URL: ${surveyUrl}`);

    console.log("\nSetup completed successfully!");
  } catch (error) {
    console.error("Error during setup:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the main function
main();
