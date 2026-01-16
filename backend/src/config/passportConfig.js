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
                        username: email, 
                        email: email,    
                        password: "",    
                        isVerified: true 
                    });
                    await user.save();
                } else {
                    if (!user.isVerified) {
                        user.isVerified = true;
                        if (!user.email) user.email = email;
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
