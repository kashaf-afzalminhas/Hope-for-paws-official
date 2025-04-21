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
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username isVeterinarian');

    res.status(201).json(populatedComment);
  } catch (error) {
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

module.exports = router;