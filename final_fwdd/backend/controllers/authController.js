const { findUserByUsername, createUser } = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, password required' });
  }
  try {
    const existing = await findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ message: 'Username taken.' });
    }
    await createUser({ username, email, password });
    return res.status(201).json({ message: 'Signup successful.' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error during signup.' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required.' });
  }
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // **Key**: set the session user here
    req.session.user = { username: user.username };
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Login failed.' });
      }
      // return the user so the client can confirm
      return res.json({ message: 'Login successful.', user: req.session.user });
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// NEW: Return the current logged-in user
exports.getCurrentUser = (req, res) => {
  // authenticateMiddleware has run, so req.user exists
  return res.json({ user: req.user });
};

// NEW: Logout and clear the session cookie
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed.' });
    }
    res.clearCookie('connect.sid', { sameSite: 'none', secure: true, httpOnly: true });
    return res.json({ message: 'Logged out.' });
  });
};