
// const express = require('express');
// const router = express.Router();

//const { signUp, signIn, forgotPassword, verifyCode, updateProfile, signOut, changePassword } = require('../controllers/userController');


// // Existing routes
// router.post('/signup', signUp);
// router.post('/signin', signIn);
// router.post('/forgot-password', forgotPassword);
// router.post('/verify-code', verifyCode);
// router.post('/update-profile', updateProfile);
// router.post('/signout', signOut); 
// router.post('/changePassword',changePassword);
// module.exports = router;
const passport = require('passport');
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path according to your project structure

<<<<<<< HEAD
router.get('/google', passport.authenticate('google', 
    { scope: ['profile', 'email'] }));
=======
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
>>>>>>> 37331b43ffca00de6551be2034f6bfb33eb19237


// Google callback route
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/signin' }),
    (req, res) => {
        // Successful authentication
<<<<<<< HEAD
        const user = req.user; // Get user info from req

        // Store user info in localStorage and sessionStorage
        res.redirect(`http://localhost:5173/profile?user=${encodeURIComponent(JSON.stringify(user))}`);
=======
        res.redirect('http://localhost:5173'); // Redirect to frontend homepage
>>>>>>> 37331b43ffca00de6551be2034f6bfb33eb19237
    }
);

// Logout route
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('http://localhost:5173/signin'); // Redirect to sign-in page
    });
});


module.exports = router;

