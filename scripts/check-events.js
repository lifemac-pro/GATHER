// ES module script to check if events exist in the database
import { MongoClient } from "mongodb";

// MongoDB connection string - use the same one from your .env file
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/gather";

async function checkEvents() {
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Check if events collection exists
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);
    console.log("Available collections:", collectionNames);

    if (!collectionNames.includes("events")) {
      console.log("Events collection does not exist!");
      return;
    }

    // Count events
    const eventsCount = await db.collection("events").countDocuments();
    console.log(`Found ${eventsCount} events in the database`);

    // Get a sample of events
    if (eventsCount > 0) {
      const events = await db.collection("events").find({}).limit(5).toArray();
      console.log("Sample events:");
      events.forEach((event, index) => {
        console.log(`Event ${index + 1}:`);
        console.log(`  ID: ${event.id}`);
        console.log(`  Name: ${event.name}`);
        console.log(`  Category: ${event.category}`);
        console.log(`  Start Date: ${event.startDate}`);
        console.log(`  Created By: ${event.createdById}`);
        console.log("---");
      });
    }
  } catch (error) {
    console.error("Error checking events:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
checkEvents().catch(console.error);
