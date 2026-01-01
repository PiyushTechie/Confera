import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.js';
import sendEmail from '../utils/emailService.js';

// Helper: Generate and Save OTP
const generateAndSaveOtp = async (user) => {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true
  });

  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  user.otp = hashedOtp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  return otp;
};

// --- CONTROLLERS ---

export const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    let user = await User.findOne({ email });

    // Create temporary user if doesn't exist
    if (!user) {
      user = new User({
        email,
        isVerified: false
      });
      await user.save();
      console.log(`Temporary user created for signup: ${email}`);
    }

    // Prevent spam if already verified and no active OTP
    if (user.isVerified && !user.otp) {
      return res.status(400).json({ message: "Email already verified. Please log in." });
    }

    const otp = await generateAndSaveOtp(user);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h1 style="color: #333;">Welcome to Confera</h1>
        <p>Your verification code is:</p>
        <h2 style="font-size: 28px; color: #007bff; text-align: center; letter-spacing: 8px;">${otp}</h2>
        <p style="color: #666;">This code expires in 10 minutes.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">If you didn't request this, ignore this email.</p>
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
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    // Clear OTP and mark verified
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully",
      nextStep: "complete-registration"
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

export const resendOtp = async (req, res) => {
  await sendOtp(req, res);
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      // Security: don't reveal existence
      return res.status(200).json({ message: "If account exists, reset OTP has been sent." });
    }

    const otp = await generateAndSaveOtp(user);

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h1 style="color: #dc3545;">Reset Your Confera Password</h1>
        <p>Use this code to reset your password:</p>
        <h2 style="font-size: 28px; color: #dc3545; text-align: center;">${otp}</h2>
        <p style="color: #666;">Valid for 10 minutes.</p>
      </div>
    `;

    await sendEmail(email, "Confera Password Reset", emailContent);

    res.status(200).json({ message: "If account exists, reset OTP has been sent." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) return res.status(404).json({ message: "Invalid request" });

    if (!user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};