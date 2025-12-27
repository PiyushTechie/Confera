import { Router } from "express";
import passport from "passport";
import crypto from "crypto"; // Import crypto instead of jwt
import { login, register } from "../controllers/authentication.js";

const router = Router();

/* ======================
   EMAIL / PASSWORD AUTH
====================== */

router.post("/login", login);
router.post("/register", register);

/* ======================
   GOOGLE OAUTH
====================== */

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
        // 1. Generate the same type of token as your Manual Login
        const token = crypto.randomBytes(20).toString("hex");

        // 2. Save it to the user in the database
        // Passport attaches the user object to req.user
        req.user.token = token;
        await req.user.save();

        // 3. Redirect to frontend with the Hex Token
        res.redirect(`${process.env.CLIENT_URL}/home?token=${token}`);
        
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.redirect(`${process.env.CLIENT_URL}/auth`);
    }
  }
);

export default router;