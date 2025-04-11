import { MongoClient } from "mongodb";
import { env } from "@/env";

if (!env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = env.MONGODB_URI;

// Using the same approach as the working test-db.ts file
// No options to avoid SSL/TLS issues
let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log("Connecting to MongoDB...");
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client
      .connect()
      .then((client) => {
        console.log("✅ Connected to MongoDB Atlas!");
        return client;
      })
      .catch((err) => {
        console.error("❌ Connection failed:", err);
        throw err;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  console.log("Connecting to MongoDB (production)...");
  client = new MongoClient(uri);
  clientPromise = client
    .connect()
    .then((client) => {
      console.log("✅ Connected to MongoDB Atlas!");
      return client;
    })
    .catch((err) => {
      console.error("❌ Connection failed:", err);
      throw err;
    });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
