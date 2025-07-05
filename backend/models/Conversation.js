const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  lastMessage: {
    type: Object,
    default: { text: "Start a conversation..." },
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map(),
  }
}, { timestamps: true });

// Ensure participants are always stored in sorted order for uniqueness
ConversationSchema.pre('save', function(next) {
  if (this.participants && Array.isArray(this.participants)) {
    this.participants = this.participants
      .map(id => id.toString())
      .sort()
      .map(id => new mongoose.Types.ObjectId(id));
  }
  next();
});
ConversationSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", ConversationSchema);