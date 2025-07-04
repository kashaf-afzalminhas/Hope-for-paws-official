const express = require('express');
const router = express.Router();
const { getAllUsersForAdmin, getAllUsersWithStats, getUserStats, deleteUser, getAllAdoptionsForAdmin, getUserAdoptionsForAdmin, deleteAdoptionForAdmin, getAllPostsForAdmin, getUserPostsForAdmin, deletePostForAdmin, getAllCommentsForAdmin, getUserCommentsForAdmin, getPostCommentsForAdmin, deleteCommentForAdmin } = require('../controllers/adminController');

router.get('/users', getAllUsersForAdmin);
router.get('/users-with-stats', getAllUsersWithStats);
router.get('/user-stats/:userId', getUserStats);
router.delete('/user/:userId', deleteUser);

// Admin adoptions management
router.get('/adoptions', getAllAdoptionsForAdmin);
router.get('/adoptions/user/:userId', getUserAdoptionsForAdmin);
router.delete('/adoptions/:adoptionId', deleteAdoptionForAdmin);

// Admin posts management
router.get('/posts', getAllPostsForAdmin);
router.get('/posts/user/:userId', getUserPostsForAdmin);
router.delete('/posts/:postId', deletePostForAdmin);

// Admin comments management
router.get('/comments', getAllCommentsForAdmin);
router.get('/comments/user/:userId', getUserCommentsForAdmin);
router.get('/comments/post/:postId', getPostCommentsForAdmin);
router.delete('/comments/:commentId', deleteCommentForAdmin);

module.exports = router; 