const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { redirectIfLoggedIn } = require('../middleware/auth');

// GET /auth/login
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// POST /auth/login
router.post('/login', redirectIfLoggedIn, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash('error', 'Email and password are required.');
      return res.redirect('/auth/login');
    }
    const user = await User.findByEmail(email);
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    if (!user.is_active) {
      req.flash('error', 'Your account has been deactivated.');
      return res.redirect('/auth/login');
    }
    const isMatch = await User.verifyPassword(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/user/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/auth/login');
  }
});

// GET /auth/register
router.get('/register', redirectIfLoggedIn, (req, res) => {
  res.render('auth/register', {
    title: 'Register',
    error: req.flash('error'),
    success: req.flash('success'),
    formData: {}
  });
});

// POST /auth/register
router.post('/register', redirectIfLoggedIn, async (req, res) => {
  const { name, email, password, confirm_password } = req.body;
  if (!name || !email || !password || !confirm_password) {
    return res.render('auth/register', {
      title: 'Register',
      error: ['All fields are required.'],
      success: '',
      formData: { name, email }
    });
  }
  if (password !== confirm_password) {
    return res.render('auth/register', {
      title: 'Register',
      error: ['Passwords do not match.'],
      success: '',
      formData: { name, email }
    });
  }
  if (password.length < 6) {
    return res.render('auth/register', {
      title: 'Register',
      error: ['Password must be at least 6 characters.'],
      success: '',
      formData: { name, email }
    });
  }
  try {
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.render('auth/register', {
        title: 'Register',
        error: ['An account with this email already exists.'],
        success: '',
        formData: { name, email }
      });
    }
    await User.create(name, email, password, 'user');
    req.flash('success', 'Account created successfully! Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Register error:', err);
    return res.render('auth/register', {
      title: 'Register',
      error: ['Something went wrong. Please try again.'],
      success: '',
      formData: { name, email }
    });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;