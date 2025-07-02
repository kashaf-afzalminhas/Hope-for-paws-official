const express = require('express');
const router = express.Router();
const { getAllUsersForAdmin, getUserStats, deleteUser } = require('../controllers/adminController');

router.get('/users', getAllUsersForAdmin);
router.get('/user-stats/:userId', getUserStats);
router.delete('/user/:userId', deleteUser);

module.exports = router; 