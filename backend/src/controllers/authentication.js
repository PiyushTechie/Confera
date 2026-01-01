import { User } from "../models/user.js";
import { Meeting } from "../models/meeting.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please provide username and password." });
    }

    try {
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        if (!user.password) {
            return res.status(400).json({ 
                message: "This account uses Google Login. Please sign in with Google." 
            });
        }
        
        if (user.isVerified === false) {
             return res.status(403).json({ message: "Email not verified. Please verify your OTP." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            let token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Credentials" });
        }
    } catch (error) {
        console.error("Login Error:", error); 
        return res.status(500).json({ message: `Something went wrong: ${error.message}` });
    }
};


const register = async (req, res) => {
    const { name, username, password, email } = req.body;

    try {
        const existingUser = await User.findOne({ 
            $or: [{ username: username }, { email: email }] 
        });

        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User or Email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword,
            email: email,       
            isVerified: false   
        });

        await newUser.save();

        res.status(httpStatus.CREATED).json({ message: "User Registered Successfully." });

    } catch (e) {
        res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

const getUserHistory = async (req, res) => {
    try {
        res.status(200).json(req.user.history);
    } catch (error) {
        res.status(500).json({ message: `Something went wrong: ${error}` });
    }
};

const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    try {
        const newHistoryItem = {
            meetingCode: meeting_code,
            date: new Date()
        };
        
        req.user.history.push(newHistoryItem);
        await req.user.save();

        const newMeeting = new Meeting({
            user_id: req.user.username,
            meetingCode: meeting_code,
            date: new Date()
        });
        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history." });

    } catch (e) {
        res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

export { login, register, getUserHistory, addToHistory };