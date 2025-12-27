// backend/src/routes/users.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  addToHistory,
  getUserHistory,
  login,
  register,
} from "../controllers/authentication.js";

const router = Router();

/* ======================
   JWT MIDDLEWARE
====================== */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ======================
   USER ACTIVITY
====================== */
router.post("/login", login); 
router.post("/register", register); // Optional: if your frontend calls this too

router.post("/activity", verifyToken, addToHistory);
router.get("/activity", verifyToken, getUserHistory);

export default router;
