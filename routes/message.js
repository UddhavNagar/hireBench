const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware");
const mongoose = require("mongoose");

router.get("/", isLoggedIn, async (req, res) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user._id },
      { receiver: req.user._id }
    ]
  }).populate("sender receiver");

  const chatMap = new Map();

  for (const msg of messages) {
    let otherUser;

    if (msg.sender && msg.sender._id.equals(req.user._id)) {
      otherUser = msg.receiver;
    } else if (msg.sender) {
      otherUser = msg.sender;
    } else {
      // Guest sender
      otherUser = {
        _id: null,
        name: msg.guestName || "Guest User",
        email: msg.guestEmail || "guest@example.com",
        username: "guest"
      };
    }

    const key = otherUser._id ? otherUser._id.toString() : otherUser.email;

    if (!chatMap.has(key)) {
      chatMap.set(key, {
        _id: otherUser._id,
        name: otherUser.name,
        username: otherUser.username,
        email: otherUser.email,
        unreadCount: 0
      });
    }

    // Count unread messages for the current user
    if (
      !msg.isRead &&
      msg.receiver &&
      msg.receiver._id.equals(req.user._id)
    ) {
      chatMap.get(key).unreadCount += 1;
    }
  }

  const uniqueChats = Array.from(chatMap.values());
  res.render("messages/box", { uniqueChats });
});


// POST: Start a new chat by sending the first message via email
router.post("/send", isLoggedIn, async (req, res) => {
  const { email, content } = req.body;

  const receiver = await User.findOne({ email });
  if (!receiver) {
    req.flash("error", "User not found.");
    return res.redirect("/messages");
  }

  const message = new Message({
    sender: req.user._id,
    receiver: receiver._id,
    content
  });

  await message.save();
  res.redirect(`/messages/${receiver._id}`);
});



// GET: Chat between current user and another
router.get("/:userId", isLoggedIn, async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    req.flash("error", "Invalid user ID.");
    return res.redirect("/messages");
  }

  const otherUser = await User.findById(userId);
  if (!otherUser) {
    req.flash("error", "User not found.");
    return res.redirect("/messages");
  }

  // ✅ Mark unread messages as read
  await Message.updateMany(
    { sender: userId, receiver: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  const messages = await Message.find({
    $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
    ],
    deletedFor: { $ne: req.user._id } // Exclude deleted for current user
    })
    .sort("timestamp")
    .populate("sender receiver");
  res.render("messages/chat", { messages, otherUser });
});


// ✉️ Send a message
router.post("/:userId", isLoggedIn, async (req, res) => {
  const { userId } = req.params;
  const { content } = req.body;

  const receiver = await User.findById(userId);
  if (!receiver) {
    req.flash("error", "User not found.");
    return res.redirect("/messages");
  }

  const message = new Message({
    sender: req.user._id,
    receiver: receiver._id,
    content
  });

  await message.save();
  res.redirect(`/messages/${userId}`);
});

router.delete("/:userId", isLoggedIn, async (req, res) => {
  const { userId } = req.params;

  // Mark conversation as deleted for current user
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id }
    ]
  });

  for (const msg of messages) {
    if (!msg.deletedFor.includes(req.user._id)) {
      msg.deletedFor.push(req.user._id);
      await msg.save();
    }

    // 💥 Permanently delete if both users deleted
    if (
      msg.deletedFor.includes(msg.sender.toString()) &&
      msg.deletedFor.includes(msg.receiver.toString())
    ) {
      await msg.deleteOne();
    }
  }

  req.flash("success", "Conversation deleted from your view.");
  res.redirect("/messages");
});



router.delete("/:userId/delete/:messageId", isLoggedIn, async (req, res) => {
  const { messageId, userId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    req.flash("error", "Message not found.");
    return res.redirect(`/messages/${userId}`);
  }

  // ✅ Allow either sender or receiver to delete the message completely
  const isSender = message.sender.equals(req.user._id);
  const isReceiver = message.receiver.equals(req.user._id);

  if (!isSender && !isReceiver) {
    req.flash("error", "You are not authorized to delete this message.");
    return res.redirect(`/messages/${userId}`);
  }

  // ❌ Hard delete: remove from DB
  await message.deleteOne();

  req.flash("success", "Message permanently deleted.");
  res.redirect(`/messages/${userId}`);
});

// to refresh chat without refreshing everthing just like react 
router.get("/:userId/json", isLoggedIn, async (req, res) => {
  const { userId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id }
    ]
  }).sort("timestamp").populate("sender receiver");

  res.json({ messages });
});

// GET /messages/:otherUserId/edit/:msgId
router.get("/:otherUserId/edit/:msgId", isLoggedIn, async (req, res) => {
  const { otherUserId, msgId } = req.params;

  const message = await Message.findById(msgId);
  if (!message || !message.sender.equals(req.user._id)) {
    req.flash("error", "Unauthorized or message not found");
    return res.redirect(`/messages/${otherUserId}`);
  }

  res.render("messages/edit", { otherUserId, message });
});

// PUT /messages/:otherUserId/edit/:msgId
router.put("/:otherUserId/edit/:msgId", isLoggedIn, async (req, res) => {
  const { otherUserId, msgId } = req.params;
  const { content } = req.body;

  const message = await Message.findById(msgId);
  if (!message || !message.sender.equals(req.user._id)) {
    req.flash("error", "Unauthorized or message not found");
    return res.redirect(`/messages/${otherUserId}`);
  }

  message.content = content;
  await message.save();
  req.flash("success", "Message updated successfully.");
  res.redirect(`/messages/${otherUserId}`);
});


module.exports = router;
