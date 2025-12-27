// backend/src/routes/users.js
import { Router } from "express";
import {
  addToHistory,
  getUserHistory,
  login,
  register,
} from "../controllers/authentication.js";

const router = Router();

/* ======================
   AUTH ROUTES
====================== */
router.post("/login", login);
router.post("/register", register);

/* ======================
   USER ACTIVITY
====================== */
// No middleware needed here. 
// The controllers already check the database for the token.
router.post("/activity", addToHistory);
router.get("/activity", getUserHistory);

export default router;