// This script seeds the database with initial events and notifications
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Sample user IDs (replace with actual Clerk user IDs if needed)
const userIds = [
  'user_2aKxC9XdgGdPJGy1234', // Replace with your actual user ID
  'user_2bLyD0YehHePKHz5678'  // Another sample user ID
];

// Sample events data
const events = [
  {
    title: "Tech Conference 2025",
    description: "Join us for the biggest tech conference of the year featuring keynotes from industry leaders and hands-on workshops.",
    date: "March 30, 2025",
    location: "Convention Center, New York",
    createdAt: new Date(),
    createdBy: userIds[0],
    attendees: [userIds[0]]
  },
  {
    title: "Startup Pitch Night",
    description: "Watch innovative startups pitch their ideas to investors and network with entrepreneurs.",
    date: "April 5, 2025",
    location: "Innovation Hub, San Francisco",
    createdAt: new Date(),
    createdBy: userIds[0],
    attendees: []
  },
  {
    title: "AI & Web3 Summit",
    description: "Explore the intersection of artificial intelligence and blockchain technologies in this cutting-edge summit.",
    date: "May 15, 2025",
    location: "Tech Campus, Austin",
    createdAt: new Date(),
    createdBy: userIds[0],
    attendees: []
  },
  {
    title: "Professional Skills Program",
    description: "Enhance your professional skills with workshops on leadership, communication, and career development.",
    date: "May 15, 2025",
    location: "Business Center, Chicago",
    createdAt: new Date(),
    createdBy: userIds[0],
    attendees: []
  },
  {
    title: "Youth Leadership Training",
    description: "A program designed to develop leadership skills in young professionals and students.",
    date: "June 24, 2025",
    location: "Community Center, Boston",
    createdAt: new Date(),
    createdBy: userIds[0],
    attendees: [userIds[0]]
  },
  {
    title: "Northern Universities Virtual Innovation",
    description: "A virtual gathering of innovative minds from northern universities.",
    date: "April 18, 2025",
    location: "Virtual Event",
    createdAt: new Date(),
    createdBy: userIds[0],
    attendees: []
  }
];

// Function to create notifications for a user
function createNotificationsForUser(userId, eventIds) {
  const notifications = [
    {
      userId: userId,
      title: "Welcome to GatherEase!",
      message: "Thank you for joining GatherEase. Start exploring events and connecting with others.",
      type: "EVENT_UPDATE",
      read: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: userId,
      title: "New Event Available",
      message: "A new event has been added that matches your interests.",
      type: "EVENT_UPDATE",
      read: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      eventId: eventIds[0],
      link: `/attendee/events/${eventIds[0]}`
    },
    {
      userId: userId,
      title: "Event Reminder",
      message: "Your registered event 'Tech Conference 2025' is coming up soon.",
      type: "EVENT_REMINDER",
      read: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      eventId: eventIds[0],
      link: `/attendee/events/${eventIds[0]}`
    },
    {
      userId: userId,
      title: "Survey Available",
      message: "Please complete the feedback survey for 'Youth Leadership Training'.",
      type: "SURVEY_AVAILABLE",
      read: false,
      createdAt: new Date(),
      eventId: eventIds[4],
      link: `/attendee/surveys`
    }
  ];

  return notifications;
}

async function seedDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const eventsCollection = db.collection('events');
    const notificationsCollection = db.collection('notifications');

    // Check if events already exist
    const existingEventsCount = await eventsCollection.countDocuments();

    if (existingEventsCount > 0) {
      console.log(`Database already has ${existingEventsCount} events.`);
      const deleteEvents = await askQuestion('Do you want to delete existing events and notifications? (y/n): ');

      if (deleteEvents.toLowerCase() === 'y') {
        await eventsCollection.deleteMany({});
        await notificationsCollection.deleteMany({});
        console.log('Existing events and notifications deleted.');
      } else {
        console.log('Keeping existing data. Exiting...');
        await client.close();
        return;
      }
    }

    // Insert events
    const eventResult = await eventsCollection.insertMany(events);
    console.log(`${eventResult.insertedCount} events were inserted`);

    // Get the inserted event IDs
    const eventIds = Object.values(eventResult.insertedIds).map(id => id.toString());

    // Create and insert notifications for the first user
    const notifications = createNotificationsForUser(userIds[0], eventIds);
    const notificationResult = await notificationsCollection.insertMany(notifications);
    console.log(`${notificationResult.insertedCount} notifications were inserted`);

    console.log('Database seeded successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Helper function to ask questions in the console
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Run the seed function
seedDatabase().catch(console.error);
