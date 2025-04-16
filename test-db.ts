import 'dotenv/config';
import { MongoClient } from "mongodb";

console.log("MONGODB_URI:", process.env.MONGODB_URI); // Debug

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined in .env file");
}

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