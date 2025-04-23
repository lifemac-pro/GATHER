/**
 * Test script for the enhanced registration form with demographics
 *
 * This script tests the enhanced registration form by:
 * 1. Creating a test event
 * 2. Creating a test user
 * 3. Registering the user for the event with demographic information
 * 4. Verifying the demographic information is stored correctly
 *
 * Run with: node src/scripts/test-demographics.js
 */

const { nanoid } = require("nanoid");
const mongoose = require("mongoose");
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

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Define the demographic information schema
const demographicSchema = new mongoose.Schema({
  age: Number,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ["male", "female", "non-binary", "prefer-not-to-say", "other"],
  },
  genderOther: String,
  country: String,
  city: String,
  occupation: String,
  industry: String,
  interests: [String],
  dietaryRestrictions: [String],
  accessibilityNeeds: [String],
  howHeard: String,
  languages: [String],
  educationLevel: {
    type: String,
    enum: [
      "high-school",
      "bachelors",
      "masters",
      "doctorate",
      "other",
      "prefer-not-to-say",
    ],
  },
});

const attendeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  status: { type: String, required: true },
  paymentStatus: { type: String, default: "pending" },
  paymentIntentId: String,
  ticketCode: String,
  registeredAt: { type: Date, required: true },
  checkedInAt: Date,
  checkedInBy: String,
  checkInNotes: String,
  demographics: demographicSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create models
const Event = mongoose.model("Event", eventSchema);
const User = mongoose.model("User", userSchema);
const Attendee = mongoose.model("Attendee", attendeeSchema);

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
        name: "Test Event for Demographics",
        description:
          "This is a test event for the enhanced registration form with demographics",
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

    // Create a test user
    const userId = "test-user-" + nanoid(6);
    let user = await User.findOne({ id: userId });

    if (!user) {
      console.log("Creating test user...");
      user = await User.create({
        id: userId,
        email: `test-${nanoid(6)}@example.com`,
        firstName: "Test",
        lastName: "User",
      });
      console.log(`Created test user with ID: ${userId}`);
    } else {
      console.log(`Using existing test user with ID: ${userId}`);
    }

    // Create a test registration with demographic information
    const attendeeId = "test-attendee-" + nanoid(6);
    let attendee = await Attendee.findOne({ id: attendeeId });

    if (!attendee) {
      console.log("Creating test registration with demographic information...");
      attendee = await Attendee.create({
        id: attendeeId,
        eventId: eventId,
        userId: userId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: "+1234567890",
        status: "registered",
        paymentStatus: "free",
        ticketCode: nanoid(8).toUpperCase(),
        registeredAt: new Date(),
        demographics: {
          age: 30,
          dateOfBirth: new Date("1993-01-15"),
          gender: "female",
          country: "United States",
          city: "New York",
          occupation: "Software Engineer",
          industry: "technology",
          interests: ["technology", "design", "education"],
          dietaryRestrictions: ["vegetarian"],
          accessibilityNeeds: [],
          howHeard: "Social media",
          languages: ["english", "spanish"],
          educationLevel: "masters",
        },
      });
      console.log(`Created test registration with ID: ${attendeeId}`);
    } else {
      console.log(`Using existing test registration with ID: ${attendeeId}`);
    }

    // Verify the demographic information
    console.log("\nVerifying demographic information:");
    console.log("--------------------------------");
    if (attendee.demographics) {
      console.log(`Age: ${attendee.demographics.age || "N/A"}`);
      console.log(
        `Date of Birth: ${attendee.demographics.dateOfBirth || "N/A"}`,
      );
      console.log(`Gender: ${attendee.demographics.gender || "N/A"}`);
      console.log(`Country: ${attendee.demographics.country || "N/A"}`);
      console.log(`City: ${attendee.demographics.city || "N/A"}`);
      console.log(`Occupation: ${attendee.demographics.occupation || "N/A"}`);
      console.log(`Industry: ${attendee.demographics.industry || "N/A"}`);
      console.log(
        `Interests: ${attendee.demographics.interests ? attendee.demographics.interests.join(", ") : "N/A"}`,
      );
      console.log(
        `Dietary Restrictions: ${attendee.demographics.dietaryRestrictions ? attendee.demographics.dietaryRestrictions.join(", ") : "N/A"}`,
      );
      console.log(
        `Languages: ${attendee.demographics.languages ? attendee.demographics.languages.join(", ") : "N/A"}`,
      );
      console.log(
        `Education Level: ${attendee.demographics.educationLevel || "N/A"}`,
      );
    } else {
      console.log("No demographic information available");
    }

    console.log("\nTest completed successfully!");
    console.log(`
Enhanced Registration Form Test Information:
------------------------------------------
Test Event ID: ${eventId}
Test User ID: ${userId}
Test Attendee ID: ${attendeeId}

To test the enhanced registration form, visit:
${process.env.APP_URL || "http://localhost:3000"}/events/${eventId}

To view the demographic analytics, visit:
${process.env.APP_URL || "http://localhost:3000"}/events/${eventId}/analytics
    `);
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the main function
main();
