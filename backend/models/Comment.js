const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    set: (val) => sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} }),
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null, // null means it's a top-level comment
  },
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;