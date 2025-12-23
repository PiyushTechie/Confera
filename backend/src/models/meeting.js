import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema({
    user_id: {type: String},
    meetingCode : {type: String, required: true},
    date: {type: Date, default: Date.now, required: true}
})
// FIX: Add "User" as the first argument
const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };
