import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
