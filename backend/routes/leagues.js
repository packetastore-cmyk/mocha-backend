const express = require('express');
const router = express.Router();
const { SportsAPIService, LEAGUES } = require('../services/sportsAPI');

// Get all leagues
router.get('/', (req, res) => {
  res.json({ success: true, leagues: LEAGUES });
});

// Get league standings
router.get('/:id/standings', async (req, res) => {
  try {
    const data = await SportsAPIService.getLeagueStandings(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get league matches
router.get('/:id/matches', async (req, res) => {
  try {
    const data = await SportsAPIService.getLeagueMatches(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
