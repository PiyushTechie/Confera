import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String },
    token: { type: String },
    history: [
        {
            meetingCode: { type: String, required: true },
            date: { type: Date, default: Date.now }
        }
    ]
});

const User = mongoose.model("User", userSchema);

export { User };
