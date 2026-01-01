import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.js';
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

  // Validate email
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    let user = await User.findOne({ email });

    // If user doesn't exist, create a new unverified one (for signup)
    if (!user) {
      user = new User({
        email,
        name: "", // Will be set during registration completion
        password: "", // Will be set after verification
        isVerified: false,
      });
      await user.save();
      console.log(`New user created for signup: ${email}`);
    }

    // If user exists but already verified, prevent OTP spam
    if (user.isVerified && !user.otp) {
      return res.status(400).json({ message: "Email already verified. Please login." });
    }

    // Generate and save new OTP (overwrites old one if exists)
    const otp = await generateAndSaveOtp(user);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Confera</h1>
        <p>Your verification code is: <strong style="font-size: 24px; color: #007bff;">${otp}</strong></p>
        <p style="color: #666;">This code expires in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;
    
    await sendEmail(email, "Confera Verification Code", emailContent);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Server error sending OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists and is not expired
    if (!user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired or invalid. Please request a new one." });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Success: Clear OTP and mark as verified
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    // For signup flow, you might want to return a temporary token here
    // For now, just return success
    res.status(200).json({ 
      message: "Email verified successfully",
      userId: user._id // Optional: for frontend to store
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

export const resendOtp = async (req, res) => {
  // Reuse sendOtp logic - it handles existing/new users
  await sendOtp(req, res);
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not (security)
      return res.status(200).json({ message: "If an account exists, a reset link has been sent." });
    }

    // Only send OTP if user is verified (prevents reset for unverified signups)
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please complete your registration first." });
    }

    const otp = await generateAndSaveOtp(user);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Confera Password</h1>
        <p>Use the code below to reset your password:</p>
        <h2 style="font-size: 24px; color: #dc3545; text-align: center;">${otp}</h2>
        <p style="color: #666;">This code expires in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail(email, "Reset Password - Confera", emailContent);
    
    // Same security: don't reveal user existence
    res.status(200).json({ message: "If an account exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error sending reset email" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Email, OTP, and new password are required" });
  }

  // Basic password validation (add more as needed)
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Must be verified user
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please complete registration first." });
    }

    // Check OTP validity
    if (!user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. Please login with your new password." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error resetting password" });
  }
};