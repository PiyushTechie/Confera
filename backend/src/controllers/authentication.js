import { User } from "../models/user.js";
import { Meeting } from "../models/meeting.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { UAParser } from "ua-parser-js";
import axios from "axios";
import sendEmail from "../utils/emailService.js";

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password." });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
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

            // Send sign-in alert
            try {
                const userAgent = req.headers['user-agent'];
                const parser = new UAParser(userAgent);
                const result = parser.getResult();
                const device = `${result.os.name || 'Unknown OS'} - ${result.browser.name || 'Unknown Browser'}`;

                let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                if (ip && ip.includes(',')) ip = ip.split(',')[0];
                if (ip === '::1' || ip === '127.0.0.1') ip = '';

                let location = "Unknown Location";
                try {
                    const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
                    if (geoRes.data && geoRes.data.status === 'success') {
                        location = `${geoRes.data.city}, ${geoRes.data.regionName}, ${geoRes.data.country}`;
                    }
                } catch (geoErr) {
                    console.log("Geolocation failed", geoErr.message);
                }

                const time = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
                const actualIp = ip || 'Localhost';

                const htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                        <img src="https://res.cloudinary.com/dithpp9nq/image/upload/v1780751743/BrandLogo_wbrtj4.png" alt="Confera" style="height: 60px; display: block; margin-bottom: 20px;" />
                        <h2 style="color: #202124;">New Sign-in Alert</h2>
                        <p style="color: #5f6368; font-size: 16px;">We noticed a new sign-in to your Confera account (<strong>${user.email}</strong>).</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <p style="margin: 5px 0;"><strong>Device:</strong> ${device}</p>
                            <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
                            <p style="margin: 5px 0;"><strong>IP Address:</strong> ${actualIp}</p>
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
                        </div>
                        
                        <p style="color: #5f6368; font-size: 14px; margin-top: 20px;">
                            If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately.
                        </p>
                    </div>
                `;

                sendEmail(user.email, "Security Alert: New Sign-in from a new device", htmlContent).catch(e => console.log("Alert email failed", e));
            } catch (e) {
                console.log("Failed to process signin alert", e);
            }

            return res.status(httpStatus.OK).json({
                token: token,
                user: {
                    name: user.name,
                    email: user.email
                }
            });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Credentials" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: `Something went wrong: ${error.message}` });
    }
};


const register = async (req, res) => {
    const { name, password, email } = req.body;

    try {
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User or Email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
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