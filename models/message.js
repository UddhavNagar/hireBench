const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  deletedFor: [
    { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }
    ],
    guestName: String,
    guestEmail: String,
});

module.exports = mongoose.model("Message", messageSchema);
