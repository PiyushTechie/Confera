import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:8000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check if user exists
                let user = await User.findOne({ username: profile.emails[0].value });

                if (!user) {
                    // 2. Create new user if not found
                    user = new User({
                        name: profile.displayName,
                        username: profile.emails[0].value,
                        password: "",
                    });
                    await user.save();
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);