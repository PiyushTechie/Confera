// backend/src/routes/authRoutes.js
import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();

// Route 1: Redirect to Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Route 2: Google Callback
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    (req, res) => {
        // Create Token
        const token = jwt.sign(
            { userId: req.user._id },
            process.env.JWT_SECRET || "YOUR_SECRET_KEY",
            { expiresIn: "7d" }
        );

        // Redirect to Frontend with Token
        res.redirect(`http://localhost:5173/home?token=${token}`);
    }
);

export default router;