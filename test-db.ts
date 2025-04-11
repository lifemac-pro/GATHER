import "dotenv/config"; // 👈 This loads your .env file automatically

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

async function testMongoConnection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas!");
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await client.close();
  }
}

testMongoConnection();
