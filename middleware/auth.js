// Middleware: Require user to be logged in
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to continue.');
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware: Require admin role
const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to continue.');
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    req.flash('error', 'Access denied. Admin only.');
    return res.redirect('/user/dashboard');
  }
  next();
};

// Middleware: Redirect if already logged in
const redirectIfLoggedIn = (req, res, next) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/user/dashboard');
  }
  next();
};

module.exports = { requireLogin, requireAdmin, redirectIfLoggedIn };
