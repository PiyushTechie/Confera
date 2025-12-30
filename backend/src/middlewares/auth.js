import { User } from "../models/user.js";
import httpStatus from "http-status";

const authMiddleware = async (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Authentication token missing" });
    }

    try {
        // 2. Find the user associated with this token
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(httpStatus.FORBIDDEN).json({ message: "Invalid or expired token" });
        }

        req.user = user;

        next(); 

    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Auth Error: ${error}` });
    }
};

export default authMiddleware;