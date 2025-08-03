const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Add comment to post
router.post('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      postId: req.params.postId,
      userId: req.user.userId,
      content: req.body.content,
    });

    await comment.save();
    
    // Send notification for new comment
    if (global.notificationService) {
      global.notificationService.notifyPostComment(req.params.postId, req.user.userId, comment._id);
    }
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username isVeterinarian');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post (nested comments)
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    const postId = req.params.postId;

    const comment = new Comment({
      postId,
      userId: req.user.userId,
      content,
      parentCommentId: parentCommentId || null,
    });

    await comment.save();

    // Optionally populate user
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username isVeterinarian');

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ postId })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: 1 });

    // Organize comments into threads (one level deep)
    const commentMap = {};
    const topLevel = [];

    comments.forEach(comment => {
      comment = comment.toObject();
      comment.replies = [];
      commentMap[comment._id] = comment;
      if (!comment.parentCommentId) {
        topLevel.push(comment);
      }
    });

    comments.forEach(comment => {
      if (comment.parentCommentId && commentMap[comment.parentCommentId]) {
        commentMap[comment.parentCommentId].replies.push(comment);
      }
    });

    res.json(topLevel);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;