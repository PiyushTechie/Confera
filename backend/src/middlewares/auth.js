import { User } from "../models/user.js";
import httpStatus from "http-status";

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Authorization header missing" });
    }

    const token = authHeader.startsWith("Bearer ") 
        ? authHeader.split(" ")[1] 
        : authHeader;

    try {
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