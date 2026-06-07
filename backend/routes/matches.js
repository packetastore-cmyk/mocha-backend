const express = require('express');
const router = express.Router();
const { SportsAPIService, LEAGUES } = require('../services/sportsAPI');
const AICommentaryService = require('../services/aiCommentary');

// Get live matches
router.get('/live', async (req, res) => {
  try {
    const data = await SportsAPIService.getLiveMatches();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get match details + AI pre-match analysis
router.get('/:id', async (req, res) => {
  try {
    const [details, stats, lineups] = await Promise.allSettled([
      SportsAPIService.getMatchDetails(req.params.id),
      SportsAPIService.getMatchStatistics(req.params.id),
      SportsAPIService.getMatchLineups(req.params.id)
    ]);

    res.json({
      success: true,
      details: details.value,
      stats: stats.value,
      lineups: lineups.value
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get match events
router.get('/:id/events', async (req, res) => {
  try {
    const data = await SportsAPIService.getMatchEvents(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get H2H + pre-match analysis
router.get('/h2h/:team1/:team2', async (req, res) => {
  try {
    const h2hData = await SportsAPIService.getH2H(req.params.team1, req.params.team2);
    
    const analysis = await AICommentaryService.generatePreMatchAnalysis(
      { id: req.params.team1, name: req.query.team1Name || 'الفريق الأول' },
      { id: req.params.team2, name: req.query.team2Name || 'الفريق الثاني' },
      h2hData,
      {}
    );

    res.json({ success: true, h2h: h2hData, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get today's matches
router.get('/today/all', async (req, res) => {
  try {
    const leagues = req.query.leagues?.split(',').map(Number) || Object.values(LEAGUES).map(l => l.id);
    
    const promises = leagues.slice(0, 10).map(leagueId => 
      SportsAPIService.getLeagueMatches(leagueId).catch(() => null)
    );
    
    const results = await Promise.allSettled(promises);
    const matches = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);

    res.json({ success: true, data: matches.flat() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
