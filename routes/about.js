const express = require('express');
const router = express.Router();

// GET /about
router.get('/', (req, res) => {
  res.render('about', { currentUser: req.user }); // Pass user if needed
});

module.exports = router;
