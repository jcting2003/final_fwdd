const express = require('express');
const router  = express.Router();
const {
  signup,
  login,
  getCurrentUser,
  logout
} = require('../controllers/authController');
const authenticate = require('../middleware/authenticateMiddleware');



router.post('/signup', signup);
router.post('/login',  login);
router.get('/currentuser', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

module.exports = router;