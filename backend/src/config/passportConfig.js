import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.js"; // Ensure capitalization matches your file (User.js)
import dotenv from "dotenv";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.CALLBACK_URL, 
            proxy: true, 
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value; 
                
                if (!email) {
                    return done(new Error("No email found in Google profile"), null);
                }

                // Check if user exists by username (email) OR email field
                let user = await User.findOne({ 
                    $or: [{ username: email }, { email: email }]
                });

                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        username: email, // Using email as username for Google users
                        email: email,    // <--- CRITICAL: Save the actual email field
                        password: "",    // No password for Google users
                        isVerified: true // <--- CRITICAL: Auto-verify Google users
                    });
                    await user.save();
                } else {
                    // Optional: If user exists but isVerified is false (and emails match), 
                    // verify them now since they proved ownership via Google.
                    if (!user.isVerified) {
                        user.isVerified = true;
                        if (!user.email) user.email = email; // Backfill email if missing
                        await user.save();
                    }
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);