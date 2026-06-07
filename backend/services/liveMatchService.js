const cron = require('node-cron');
const { SportsAPIService } = require('./sportsAPI');
const AICommentaryService = require('./aiCommentary');

class LiveMatchService {
  constructor(io) {
    this.io = io;
    this.activeMatches = new Map();
    this.pollingInterval = null;
    this.commentaryQueue = new Map();
  }

  start() {
    // Poll every 30 seconds for live matches
    this.pollingInterval = setInterval(() => {
      this.pollLiveMatches();
    }, 30 * 1000);

    // Initial poll
    this.pollLiveMatches();
    
    logger.info('⚽ Live Match Service started');
  }

  async pollLiveMatches() {
    try {
      const data = await SportsAPIService.getLiveMatches();
      const matches = this.normalizeLiveMatches(data);
      
      for (const match of matches) {
        const prevMatch = this.activeMatches.get(match.id);
        
        if (prevMatch) {
          await this.detectAndBroadcastChanges(prevMatch, match);
        }
        
        this.activeMatches.set(match.id, match);
        
        // Broadcast live update to all subscribers
        this.io.to(`match_${match.id}`).emit('match_update', match);
      }

      // Clean up finished matches
      for (const [id, match] of this.activeMatches) {
        if (match.status === 'FT' || match.status === 'AET') {
          await this.handleMatchFinished(match);
          setTimeout(() => this.activeMatches.delete(id), 60 * 60 * 1000);
        }
      }

    } catch (err) {
      logger.error('Live poll error:', err.message);
    }
  }

  async detectAndBroadcastChanges(prev, curr) {
    const events = [];

    // New goal?
    if (curr.home.score !== prev.home.score) {
      events.push({
        type: 'Goal',
        team: curr.home.name,
        score: `${curr.home.score}-${curr.away.score}`,
        minute: curr.minute
      });
    }

    if (curr.away.score !== prev.away.score) {
      events.push({
        type: 'Goal',
        team: curr.away.name,
        score: `${curr.home.score}-${curr.away.score}`,
        minute: curr.minute
      });
    }

    // Process each event
    for (const event of events) {
      try {
        const commentary = await AICommentaryService.generateLiveCommentary(curr, event);
        
        this.io.to(`match_${curr.id}`).emit('live_event', {
          matchId: curr.id,
          event,
          commentary,
          timestamp: new Date().toISOString()
        });

        logger.info(`📢 Commentary sent for match ${curr.id}: ${event.type}`);
      } catch (err) {
        logger.error('Commentary error:', err);
      }
    }
  }

  async handleMatchFinished(match) {
    try {
      // Get full match stats for post-match analysis
      const stats = await SportsAPIService.getMatchStatistics(match.id);
      const events = await SportsAPIService.getMatchEvents(match.id);
      
      const analysis = await AICommentaryService.generatePostMatchAnalysis(match, events, stats);
      
      this.io.to(`match_${match.id}`).emit('match_finished', {
        matchId: match.id,
        finalScore: `${match.home.score}-${match.away.score}`,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Post-match analysis error:', err);
    }
  }

  normalizeLiveMatches(data) {
    // Normalize data from different API sources
    if (!data) return [];
    
    const matches = data.response || data.matches || data.events || [];
    
    return matches.map(m => ({
      id: m.fixture?.id || m.id,
      status: m.fixture?.status?.short || m.status?.type || m.statusType?.code || 'NS',
      minute: m.fixture?.status?.elapsed || m.minute || 0,
      league: {
        id: m.league?.id || m.tournament?.id,
        name: m.league?.name || m.tournament?.name,
        logo: m.league?.logo || m.tournament?.uniqueTournament?.logo
      },
      home: {
        id: m.teams?.home?.id || m.homeTeam?.id,
        name: m.teams?.home?.name || m.homeTeam?.name,
        logo: m.teams?.home?.logo || m.homeTeam?.logo,
        score: m.goals?.home ?? m.score?.current?.home ?? 0
      },
      away: {
        id: m.teams?.away?.id || m.awayTeam?.id,
        name: m.teams?.away?.name || m.awayTeam?.name,
        logo: m.teams?.away?.logo || m.awayTeam?.logo,
        score: m.goals?.away ?? m.score?.current?.away ?? 0
      },
      possession: m.statistics?.[0]?.statistics?.find(s => s.type === 'Ball Possession')?.value,
      timestamp: new Date().toISOString()
    }));
  }

  getLiveMatches() {
    return Array.from(this.activeMatches.values());
  }
}

module.exports = LiveMatchService;
