import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        message: "Too many login attempts from this IP, please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: {
        message: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});