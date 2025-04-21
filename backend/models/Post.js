const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  caption: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });


const Post = mongoose.model('Post', postSchema);

module.exports = Post;