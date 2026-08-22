const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  participants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    validate: {
      validator: function(arr) {
        return arr.length === 2 && new Set(arr.map(id => id.toString())).size === 2;
      },
      message: "Conversation must have exactly 2 unique participants"
    }
  },
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
  },
  deletedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true,
  optimisticConcurrency: true // Prevent concurrent saves
});

ConversationSchema.pre('save', function(next) {
  if (this.isModified('participants') && this.participants.length === 2) {
    this.participants = this.participants
      .map(id => id.toString())
      .sort((a, b) => a.localeCompare(b))
      .map(id => new mongoose.Types.ObjectId(id));
  }
  next();
});

ConversationSchema.index(
  { 'participants.0': 1, 'participants.1': 1 },
  { unique: true }
);

ConversationSchema.statics.findByParticipants = function(id1, id2) {
  const sorted = [id1, id2]
    .map(id => new mongoose.Types.ObjectId(id))
    .sort((a, b) => a.toString().localeCompare(b.toString()));
  return this.findOne({
    participants: { $all: sorted, $size: 2 }
  });
};

module.exports = mongoose.model("Conversation", ConversationSchema);