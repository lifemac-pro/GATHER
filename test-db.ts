import "dotenv/config";
import { MongoClient } from "mongodb";

console.log("DATABASE_URL:", process.env.DATABASE_URL); // Debug

const uri = process.env.DATABASE_URL;

if (!uri) {
  throw new Error("❌ DATABASE_URL is not defined in .env file");
}

async function testMongoConnection() {
  const client = new MongoClient(uri || "");
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
