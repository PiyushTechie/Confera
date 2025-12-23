// backend/src/routes/authRoutes.js
import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
const clientURL = process.env.CLIENT_URL

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    (req, res) => {
        const token = jwt.sign(
            { userId: req.user._id },
            process.env.JWT_SECRET || "YOUR_SECRET_KEY",
            { expiresIn: "7d" }
        );

        res.redirect(`${clientURL}/home?token=${token}`);
    }
);

export default router;