// googlestrategy.js

var GoogleStrategy = require('passport-google-oauth20').Strategy;
var passport=require("passport");
var User=require('../models/User');
require('dotenv').config();
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // Use environment variable
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Use environment variable
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile._json.email });
        if (!user) {
            user = await User.create({
                username: profile._json.name,
                email: profile._json.email,
                id: profile._json.id // Adjust according to your user model
            });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});