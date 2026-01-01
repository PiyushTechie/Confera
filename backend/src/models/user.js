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
        required: false,        
        unique: true,
        sparse: true,           
        trim: true
    },
    password: {
        type: String,
        required: false,        
        select: false           
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
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export { User };