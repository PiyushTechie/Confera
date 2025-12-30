// backend/src/routes/users.js
import { Router } from "express";
import {
  addToHistory,
  getUserHistory,
  login,
  register,
} from "../controllers/authentication.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);

router.post("/activity", authMiddleware, addToHistory);
router.get("/activity", authMiddleware, getUserHistory);

export default router;