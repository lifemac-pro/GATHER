// Script to create a test notification
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function createTestNotification() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const notificationsCollection = db.collection('notifications');

    // Create a global notification
    const globalNotification = {
      title: 'Test Global Notification',
      message: 'This is a test global notification created by the script.',
      type: 'EVENT_UPDATE',
      isGlobal: true,
      readBy: [],
      createdAt: new Date(),
      link: '/attendee/events',
      createdBy: 'system',
    };

    const result = await notificationsCollection.insertOne(globalNotification);
    console.log(`Created global notification with ID: ${result.insertedId}`);

    // Create a user-specific notification
    const userNotification = {
      userId: 'user_2UBUOvJ0dIXX3zB0Wpe2elnxAC6', // Replace with an actual user ID
      title: 'Test User Notification',
      message: 'This is a test user-specific notification created by the script.',
      type: 'EVENT_REMINDER',
      read: false,
      createdAt: new Date(),
      link: '/attendee/events',
      createdBy: 'system',
    };

    const userResult = await notificationsCollection.insertOne(userNotification);
    console.log(`Created user notification with ID: ${userResult.insertedId}`);

  } catch (error) {
    console.error('Error creating test notifications:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

createTestNotification().catch(console.error);
