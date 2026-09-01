const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Add comment to post
router.post('/:postId', auth, async (req, res) => {
  try {
    const { content } = req.body;

    // Validate content length before processing
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      postId: req.params.postId,
      userId: req.user.userId,
      content,
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

    // Validate content length before processing
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' });
    }

    // Validate parent comment belongs to the same post (prevent cross-post threading)
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(400).json({ message: 'Parent comment not found' });
      }
      if (parentComment.postId.toString() !== postId) {
        return res.status(400).json({ message: 'Parent comment does not belong to this post' });
      }
    }

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

// Delete comment (with cascade-delete of replies)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const post = await Post.findById(comment.postId);

    const isCommentOwner = comment.userId.toString() === req.user.userId;
    const isPostOwner = post && post.userId.toString() === req.user.userId;

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    // Cascade-delete all child replies to prevent orphaned comments
    await Comment.deleteMany({ parentCommentId: comment._id });

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