const express = require('express');
const router = express.Router();
const { getAllUsersForAdmin, getUserStats, deleteUser, getAllAdoptionsForAdmin, getUserAdoptionsForAdmin, deleteAdoptionForAdmin } = require('../controllers/adminController');

router.get('/users', getAllUsersForAdmin);
router.get('/user-stats/:userId', getUserStats);
router.delete('/user/:userId', deleteUser);

// Admin adoptions management
router.get('/adoptions', getAllAdoptionsForAdmin);
router.get('/adoptions/user/:userId', getUserAdoptionsForAdmin);
router.delete('/adoptions/:adoptionId', deleteAdoptionForAdmin);

module.exports = router; 