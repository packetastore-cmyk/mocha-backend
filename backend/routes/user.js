const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'غير مسجل' });
  res.json({ user: req.user });
});

router.put('/preferences', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'غير مسجل' });
  const { leagues, teams } = req.body;
  req.user.preferences = { leagues: leagues || [], teams: teams || [], notifications: true };
  res.json({ success: true, preferences: req.user.preferences });
});

module.exports = router;
