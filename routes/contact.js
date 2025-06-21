const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');

// GET /contact
router.get('/', (req, res) => {
  res.render('contact', {
    currentUser: req.user,
    successMessage: null,
    showSendAnother: false
  });
});

// POST /contact
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const admin = await User.findOne({ email: 'student@gmail.com' });
    if (!admin) throw new Error("Admin not found");

    const formattedMessage = `Contact Form Submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`;

    const newMessage = new Message({
      receiver: admin._id,
      content: formattedMessage,
      sender: undefined, // no sender for guest
      isGuest: true,
      guestName: name,
      guestEmail: email
    });

    await newMessage.save();
    res.render('contact', {
      successMessage: 'Message sent!',
      showSendAnother: true,
      errorMessage: null
    });

  } catch (err) {
    console.error("Error:", err);
    res.render('contact', {
      successMessage: null,
      errorMessage: 'Something went wrong. Please try again.',
      showSendAnother: false
    });
  }
});

module.exports = router;
