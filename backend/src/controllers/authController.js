import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.js';
import sendEmail from '../utils/emailService.js';

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
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  return otp;
};

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

    if (!user) {
      user = new User({
        email,
        isVerified: false
      });
      await user.save();
      console.log(`Temporary user created for signup: ${email}`);
    }

    if (user.isVerified && !user.otp) {
      return res.status(400).json({ message: "Email already verified. Please log in." });
    }

    const otp = await generateAndSaveOtp(user);

    const emailContent = `
  <div style="background-color: #f6f8fa; padding: 40px 20px; font-family: 'Tahoma', 'Georgia', sans-serif;">
    <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e1e4e8; overflow: hidden; box-shadow: 0 1px 3px rgba(27,31,35,0.04);">
      
      <!-- Header -->
      <div style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #eaecef;">
        <img src="https://res.cloudinary.com/dithpp9nq/image/upload/v1780751743/BrandLogo_wbrtj4.png" alt="Confera" style="height: 80px; display: block; margin: 0 auto; object-fit: contain;" />
      </div>

      <!-- Body -->
      <div style="padding: 40px;">
        <h2 style="margin-top: 0; color: #24292e; font-size: 20px; font-weight: 600; margin-bottom: 16px;">
          Verify your email address
        </h2>
        <p style="color: #586069; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Welcome to Confera. To complete your registration and secure your account, please enter the following verification code:
        </p>

        <div style="background-color: #f6f8fa; border-radius: 6px; padding: 24px; text-align: center; margin: 32px 0; border: 1px solid #eaecef; overflow-x: auto;">
          <span style="font-family: 'Tahoma', 'Georgia', monospace; font-size: 30px; font-weight: 600; color: #24292e; letter-spacing: 4px; white-space: nowrap;">
            ${otp}
          </span>
        </div>

        <p style="color: #586069; font-size: 14px; text-align: center; margin-top: 0;">
          This code will expire in <strong style="color: #24292e;">10 minutes</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #fafbfc; padding: 24px 40px; text-align: center; border-top: 1px solid #eaecef;">
        <p style="color: #6a737d; font-size: 12px; line-height: 1.5; margin: 0;">
          If you didn't attempt to register for Confera, please safely ignore this email or contact support.
          <br><br>
          &copy; ${new Date().getFullYear()} Confera. All rights reserved.
        </p>
      </div>
      
    </div>
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

    if (!user) {
      return res.status(404).json({ message: "This email does not exist." });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "This email is not registered/verified yet." });
    }

    const otp = await generateAndSaveOtp(user);

    const emailContent = `
  <div style="background-color: #f6f8fa; padding: 40px 20px; font-family: 'Tahoma', 'Georgia', sans-serif;">
    <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e1e4e8; overflow: hidden; box-shadow: 0 1px 3px rgba(27,31,35,0.04);">
      
      <!-- Header -->
      <div style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #eaecef;">
        <img src="https://res.cloudinary.com/dithpp9nq/image/upload/v1780751743/BrandLogo_wbrtj4.png" alt="Confera" style="height: 80px; display: block; margin: 0 auto; object-fit: contain;" />
      </div>

      <!-- Body -->
      <div style="padding: 40px;">
        <h2 style="margin-top: 0; color: #24292e; font-size: 20px; font-weight: 600; margin-bottom: 16px;">
          Reset your password
        </h2>
        <p style="color: #586069; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset the password for your Confera account. Please use the verification code below to set up a new password:
        </p>

        <div style="background-color: #f6f8fa; border-radius: 6px; padding: 24px; text-align: center; margin: 32px 0; border: 1px solid #eaecef; overflow-x: auto;">
          <span style="font-family: 'Tahoma', 'Georgia', monospace; font-size: 30px; font-weight: 600; color: #24292e; letter-spacing: 4px; white-space: nowrap;">
            ${otp}
          </span>
        </div>

        <p style="color: #586069; font-size: 14px; text-align: center; margin-top: 0;">
          This code will expire in <strong style="color: #24292e;">10 minutes</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #fafbfc; padding: 24px 40px; text-align: center; border-top: 1px solid #eaecef;">
        <p style="color: #6a737d; font-size: 12px; line-height: 1.5; margin: 0;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not change and your account remains secure.
          <br><br>
          &copy; ${new Date().getFullYear()} Confera. All rights reserved.
        </p>
      </div>
      
    </div>
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