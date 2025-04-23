// ES module script to check the database
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// MongoDB connection string
const uri = process.env.DATABASE_URL || "";

if (!uri) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

console.log("Using MongoDB connection string:", uri.substring(0, 20) + "...");

async function checkDatabase() {
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name),
    );

    // Check each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`Collection ${collection.name}: ${count} documents`);

      // If it's the events collection, show some sample documents
      if (collection.name === "events" && count > 0) {
        const events = await db
          .collection("events")
          .find({})
          .limit(5)
          .toArray();
        console.log("Sample events:");
        events.forEach((event, index) => {
          console.log(`Event ${index + 1}:`);
          console.log(JSON.stringify(event, null, 2));
          console.log("---");
        });
      }
    }
  } catch (error) {
    console.error("Error checking database:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
checkDatabase().catch(console.error);
