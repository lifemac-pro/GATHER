// ES module script to add test events to the database
import { MongoClient } from 'mongodb';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection string from environment
const uri = process.env.DATABASE_URL;

if (!uri) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Using MongoDB connection string:', uri.substring(0, 20) + '...');

// Sample test events data
const testEvents = [
  {
    id: nanoid(),
    name: 'Web Development Workshop',
    description: 'Learn the latest web development techniques and frameworks in this hands-on workshop.',
    location: 'Tech Hub, 123 Innovation Street',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
    category: 'tech',
    status: 'published',
    featured: true,
    price: 0,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    maxAttendees: ['50']
  },
  {
    id: nanoid(),
    name: 'Business Networking Mixer',
    description: 'Connect with local entrepreneurs and business professionals in a relaxed setting.',
    location: 'Downtown Business Center, 456 Commerce Ave',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
    category: 'business',
    status: 'published',
    featured: true,
    price: 15,
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72',
    createdById: 'user-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    maxAttendees: ['100']
  },
  {
    id: nanoid(),
    name: 'Community Cleanup Day',
    description: 'Join us for a day of giving back to the community by cleaning up local parks and streets.',
    location: 'Central Park, Main Entrance',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
    category: 'social',
    status: 'published',
    featured: false,
    price: 0,
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc',
    createdById: 'user-3',
    createdAt: new Date(),
    updatedAt: new Date(),
    maxAttendees: ['200']
  },
  {
    id: nanoid(),
    name: 'Introduction to Machine Learning',
    description: 'A beginner-friendly workshop on machine learning concepts and applications.',
    location: 'Online (Zoom)',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
    category: 'education',
    status: 'published',
    featured: true,
    price: 25,
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    maxAttendees: ['75']
  },
  {
    id: nanoid(),
    name: 'Local Music Festival',
    description: 'Enjoy performances from local bands and musicians across multiple genres.',
    location: 'Riverside Amphitheater',
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours duration
    category: 'entertainment',
    status: 'published',
    featured: true,
    price: 35,
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
    createdById: 'user-4',
    createdAt: new Date(),
    updatedAt: new Date(),
    maxAttendees: ['500']
  }
];

async function addTestEvents() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const eventsCollection = db.collection('events');
    
    // Check if events already exist
    const existingCount = await eventsCollection.countDocuments();
    console.log(`Found ${existingCount} existing events`);
    
    // Insert test events
    const result = await eventsCollection.insertMany(testEvents);
    console.log(`Added ${result.insertedCount} test events to the database`);
    
    // List all events
    const allEvents = await eventsCollection.find({}).toArray();
    console.log(`Total events in database: ${allEvents.length}`);
    console.log('Event names:');
    allEvents.forEach(event => {
      console.log(`- ${event.name} (${event.category})`);
    });
    
  } catch (error) {
    console.error('Error adding test events:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
addTestEvents().catch(console.error);
