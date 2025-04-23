import { type Model, type Document } from "mongoose";

// Extend the global namespace to add our custom types
declare global {
  // Add proper typing for Mongoose models
  interface MongooseModel<T extends Document> extends Model<T> {
    findOne: any;
    find: any;
    create: any;
    findOneAndUpdate: any;
    findOneAndDelete: any;
    updateOne: any;
    aggregate: any;
    countDocuments: any;
    insertMany: any;
  }
}
