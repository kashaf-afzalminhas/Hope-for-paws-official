const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Import User model
const crypto = require('crypto'); // For generating a random password
require('dotenv').config(); // Load .env variables

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ["profile", "email"]
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ id: profile.id });

                if (!user) {
                    const randomPassword = crypto.randomBytes(16).toString('hex');
                    user = new User({
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        id: profile.id,
                        password: randomPassword,
                        phone: null,
                        city: null,
                        about: null,
                        verificationCode: null,
                        verificationCodeExpires: null
                    });
                    await user.save();
                }
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Serialize user into the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});