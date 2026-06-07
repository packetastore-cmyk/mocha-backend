const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=true` }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/onboarding`);
  }
);

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

// Update preferences
router.put('/preferences', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'غير مسجل دخول' });
  }
  
  const { leagues, teams } = req.body;
  req.user.preferences.leagues = leagues || [];
  req.user.preferences.teams = teams || [];
  
  res.json({ success: true, preferences: req.user.preferences });
});

module.exports = router;
