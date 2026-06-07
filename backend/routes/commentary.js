const express = require('express');
const router = express.Router();
const AICommentaryService = require('../services/aiCommentary');

router.post('/generate', async (req, res) => {
  try {
    const { type, data } = req.body;
    let result;

    switch (type) {
      case 'prematch':
        result = await AICommentaryService.generatePreMatchAnalysis(
          data.team1, data.team2, data.h2h, data.stats
        );
        break;
      case 'postmatch':
        result = await AICommentaryService.generatePostMatchAnalysis(
          data.match, data.events, data.stats
        );
        break;
      case 'goal':
        result = await AICommentaryService.generateGoalCelebration(
          data.scorer, data.assistor, data.minute, data.team, data.score
        );
        break;
      case 'substitution':
        result = await AICommentaryService.generateSubstitutionTake(
          data.playerOut, data.playerIn, data.situation
        );
        break;
      default:
        return res.status(400).json({ error: 'نوع غير معروف' });
    }

    res.json({ success: true, commentary: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
