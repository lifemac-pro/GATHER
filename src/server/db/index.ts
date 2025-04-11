import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

const client = new MongoClient(process.env.MONGODB_URI, {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,
});

export const db = client.db("gather");

export const collections = {
  users: db.collection("users"),
  events: db.collection("events"),
  attendees: db.collection("attendees"),
};

// Connect to MongoDB
console.log("Connecting to MongoDB...");
client
  .connect()
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    // Don't exit the process, just log the error
    // This allows the application to continue running even if the database connection fails
  });
