import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

let clientPromise: Promise<typeof mongoose>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongoose = global as typeof globalThis & {
    mongoose: Promise<typeof mongoose>;
  };

  if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }
  clientPromise = globalWithMongoose.mongoose;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = mongoose.connect(uri, {
    bufferCommands: false,
  });
}

export { clientPromise };
