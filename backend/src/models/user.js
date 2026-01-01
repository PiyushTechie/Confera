import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: false,
        default: "",
        trim: true
    },
    username: {
        type: String,
        required: false,        // ← Make optional until final registration
        unique: true,
        sparse: true,           // Allows null/undefined without unique conflict
        trim: true
    },
    password: {
        type: String,
        required: false,        // ← Set only after OTP verification
        select: false           // Don't return in queries by default (security)
    },
    token: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: {
        type: Boolean,
        default: false
    },
    history: [
        {
            meetingCode: { type: String, required: true },
            date: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true }); // Optional: adds createdAt/updatedAt

const User = mongoose.model("User", userSchema);

export { User };