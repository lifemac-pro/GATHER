import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a function to get the Post model
const getPostModel = () => {
  // Check if we're in a middleware/edge context
  if (typeof mongoose.models === 'undefined') {
    // Return a mock model for middleware/edge context
    return {
      findOne: async () => null,
      findById: async () => null,
      find: async () => [],
      create: async () => ({}),
      updateOne: async () => ({}),
      deleteOne: async () => ({}),
    };
  }

  // Return the actual model
  return mongoose.models.Post || mongoose.model("Post", postSchema);
};

// Export the Post model
export const Post = getPostModel();
