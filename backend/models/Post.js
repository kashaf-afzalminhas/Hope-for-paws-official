const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  caption: {
    type: String,
    required: [true, 'Caption is required'],
    trim: true,
    minlength: [1, 'Caption cannot be empty'],
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'Caption cannot be empty or whitespace only',
    },
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