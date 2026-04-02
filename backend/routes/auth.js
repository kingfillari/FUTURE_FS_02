const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator'); // (you need to install express-validator for >100 lines, but we can simulate validation manually)
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Manual validation helpers (to avoid extra dependency)
const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// @route   POST /api/auth/login
// @desc    Authenticate admin user and get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  try {
    // Find user with password field selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled. Contact administrator.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    await user.recordLogin();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify token and return user info
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Invalidate token (client-side removal only – JWT is stateless)
// @access  Private
router.post('/logout', auth, (req, res) => {
  // Since JWT is stateless, we just inform the client to discard the token.
  res.json({
    success: true,
    message: 'Logout successful. Please delete the token on client side.',
  });
});

// @route   POST /api/auth/register (optional – only for creating additional admins)
// @desc    Register a new admin user (should be protected in production)
// @access  Private (or public with secret key)
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ success: false, message: 'Password min 6 chars' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'viewer',
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;