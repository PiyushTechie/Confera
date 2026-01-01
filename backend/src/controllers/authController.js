import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.js'; // Note the .js extension is often required in ES6 Node
import sendEmail from '../utils/emailService.js';

// Helper: Generate and Save OTP
const generateAndSaveOtp = async (user) => {
  // 1. Generate 6-digit OTP
  const otp = otpGenerator.generate(6, { 
    upperCaseAlphabets: false, 
    specialChars: false, 
    lowerCaseAlphabets: false 
  });

  // 2. Hash OTP
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  // 3. Save to DB (expires in 10 mins)
  user.otp = hashedOtp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  return otp; // Return plain OTP for email
};

// --- CONTROLLERS ---

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = await generateAndSaveOtp(user);

    const emailContent = `
      <h1>Welcome to Confera</h1>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `;
    
    await sendEmail(email, "Confera Verification Code", emailContent);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    // Success
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resendOtp = async (req, res) => {
  await sendOtp(req, res);
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = await generateAndSaveOtp(user);

    const emailContent = `
      <h1>Reset Your Password</h1>
      <p>Use the code below to reset your Confera password:</p>
      <h2>${otp}</h2>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail(email, "Reset Password OTP", emailContent);
    res.status(200).json({ message: "Password reset OTP sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};