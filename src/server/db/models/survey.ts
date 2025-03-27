import mongoose from "mongoose";

const SurveySchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  questions: { type: Object, required: true },
  yesNo: { type: Object, required: true },
});

export default mongoose.models.Survey || mongoose.model("Survey", SurveySchema);
