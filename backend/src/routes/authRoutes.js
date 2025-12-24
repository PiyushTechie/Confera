// backend/src/routes/authRoutes.js
import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
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
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`${process.env.CLIENT_URL}/home?token=${token}`);
  }
);

export default router;
