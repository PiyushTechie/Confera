import express from "express";
import { createSchedule, getMySchedules } from "../controllers/scheduleController.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.post("/create", authMiddleware, createSchedule);
router.get("/all", authMiddleware, getMySchedules);
router.delete("/delete/:id", authMiddleware, deleteSchedule);
router.put("/update/:id", authMiddleware, updateSchedule);
export default router;