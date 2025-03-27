import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String, required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attendee" }],
});

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
