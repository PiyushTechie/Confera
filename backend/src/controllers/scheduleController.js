import ScheduledMeeting from "../models/ScheduledMeeting.js";
import crypto from "crypto";

export const createSchedule = async (req, res) => {
  try {
    const { title, date, time } = req.body;

    const generateCode = () => {
        const part1 = crypto.randomInt(0, 1000).toString().padStart(3, "0");
        const part2 = crypto.randomInt(0, 1000).toString().padStart(3, "0");
        const part3 = crypto.randomInt(0, 1000).toString().padStart(3, "0");

        return `${part1}-${part2}-${part3}`;
        };

    const newSchedule = new ScheduledMeeting({
      title,
      date,
      time,
      meetingCode: generateCode(),
      hostId: req.user.id,
    });

    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong. Please try again!." });
  }
};

export const getMySchedules = async (req, res) => {
  try {
    const schedules = await ScheduledMeeting.find({ hostId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(schedules);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong. Please try again!." });
  }
};