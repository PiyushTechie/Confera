import { Router } from "express";
import passport from "passport";
import crypto from "crypto";
import { login, register } from "../controllers/authentication.js";
import { 
  sendOtp, 
  verifyOtp, 
  resendOtp, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController.js';

const router = Router();

router.post("/login", login);
router.post("/register", register);


router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth`,
  }),
  async (req, res) => {
    try {
        const token = crypto.randomBytes(20).toString("hex");
        req.user.token = token;
        await req.user.save();
        res.redirect(`${process.env.CLIENT_URL}/home?token=${token}`);
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.redirect(`${process.env.CLIENT_URL}/auth`);
    }
  }
);

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;