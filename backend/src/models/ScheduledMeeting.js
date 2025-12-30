import mongoose from "mongoose";

const scheduledMeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  meetingCode: { type: String, required: true, unique: true },
  date: { type: String, required: true }, // Format: "YYYY-MM-DD"
  time: { type: String, required: true }, // Format: "HH:mm"
  createdAt: { type: Date, default: Date.now },
});

const ScheduledMeeting = mongoose.model("ScheduledMeeting", scheduledMeetingSchema);
export default ScheduledMeeting;