const axios = require('axios');

// ===== 10+ SPORTS API SOURCES =====
class SportsAPIService {
  constructor() {
    this.sources = [
      {
        name: 'API-Football',
        baseURL: 'https://v3.football.api-sports.io',
        headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY },
        priority: 1,
        healthy: true,
        callCount: 0,
        maxDaily: 100
      },
      {
        name: 'Football-Data',
        baseURL: 'https://api.football-data.org/v4',
        headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY },
        priority: 2,
        healthy: true,
        callCount: 0,
        maxDaily: 10
      },
      {
        name: 'TheSportsDB',
        baseURL: 'https://www.thesportsdb.com/api/v1/json',
        key: process.env.SPORTSDB_KEY || '3',
        priority: 3,
        healthy: true,
        callCount: 0,
        maxDaily: 500
      },
      {
        name: 'LiveScore-API',
        baseURL: 'https://livescore-api.com/api-client',
        headers: {},
        key: process.env.LIVESCORE_KEY,
        secret: process.env.LIVESCORE_SECRET,
        priority: 4,
        healthy: true,
        callCount: 0,
        maxDaily: 500
      },
      {
        name: 'SportRadar',
        baseURL: 'https://api.sportradar.us/soccer/trial/v4/en',
        key: process.env.SPORTRADAR_KEY,
        priority: 5,
        healthy: true,
        callCount: 0,
        maxDaily: 1000
      },
      {
        name: 'OpenLigaDB',
        baseURL: 'https://api.openligadb.de',
        priority: 6,
        healthy: true,
        callCount: 0,
        maxDaily: 9999
      },
      {
        name: 'ESPN-API',
        baseURL: 'https://site.api.espn.com/apis/site/v2/sports/soccer',
        priority: 7,
        healthy: true,
        callCount: 0,
        maxDaily: 9999
      },
      {
        name: 'SofaScore',
        baseURL: 'https://api.sofascore.com/api/v1',
        priority: 8,
        healthy: true,
        callCount: 0,
        maxDaily: 9999
      },
      {
        name: 'WhoScored',
        baseURL: 'https://1xbet.whoscored.com',
        priority: 9,
        healthy: true,
        callCount: 0,
        maxDaily: 9999
      },
      {
        name: 'FlashScore',
        baseURL: 'https://flashlive-sports.p.rapidapi.com/v1',
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'flashlive-sports.p.rapidapi.com'
        },
        priority: 10,
        healthy: true,
        callCount: 0,
        maxDaily: 100
      }
    ];

    this.cache = new Map();
    this.cacheTimeout = 30 * 1000; // 30 seconds for live data
    this.resetDailyCounters();
  }

  resetDailyCounters() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
      this.sources.forEach(s => s.callCount = 0);
      this.sources.forEach(s => s.healthy = true);
      logger.info('Daily API counters reset');
      this.resetDailyCounters();
    }, msUntilMidnight);
  }

  getHealthySources() {
    return this.sources
      .filter(s => s.healthy && s.callCount < s.maxDaily)
      .sort((a, b) => a.priority - b.priority);
  }

  async fetchWithFallback(endpoints) {
    const cacheKey = JSON.stringify(endpoints);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTimeout) {
      return cached.data;
    }

    const sources = this.getHealthySources();
    
    for (const source of sources) {
      const endpoint = endpoints[source.name];
      if (!endpoint) continue;

      try {
        const result = await this.callSource(source, endpoint);
        this.cache.set(cacheKey, { data: result, time: Date.now() });
        return result;
      } catch (err) {
        logger.warn(`❌ ${source.name} فشل: ${err.message}`);
        source.healthy = false;
        setTimeout(() => { source.healthy = true; }, 5 * 60 * 1000);
      }
    }

    throw new Error('كل المصادر فشلت مؤقتاً');
  }

  async callSource(source, endpoint) {
    source.callCount++;
    const config = {
      timeout: 8000,
      headers: source.headers || {}
    };

    let url = `${source.baseURL}${endpoint}`;
    if (source.key && !source.headers?.['X-RapidAPI-Key']) {
      url += `${endpoint.includes('?') ? '&' : '?'}api_key=${source.key}`;
    }

    const response = await axios.get(url, config);
    return response.data;
  }

  // ===== PUBLIC METHODS =====

  async getLiveMatches() {
    const endpoints = {
      'API-Football': '/fixtures?live=all',
      'ESPN-API': '/leagues/eng.1/scoreboard',
      'SofaScore': '/sport/football/events/live',
      'Football-Data': '/matches?status=LIVE',
    };
    return this.fetchWithFallback(endpoints);
  }

  async getMatchDetails(matchId, source = 'API-Football') {
    const endpoints = {
      'API-Football': `/fixtures?id=${matchId}&statistics=true`,
      'SofaScore': `/event/${matchId}`,
    };
    return this.fetchWithFallback(endpoints);
  }

  async getMatchStatistics(matchId) {
    const endpoints = {
      'API-Football': `/fixtures/statistics?fixture=${matchId}`,
      'SofaScore': `/event/${matchId}/statistics`,
    };
    return this.fetchWithFallback(endpoints);
  }

  async getMatchLineups(matchId) {
    const endpoints = {
      'API-Football': `/fixtures/lineups?fixture=${matchId}`,
      'SofaScore': `/event/${matchId}/lineups`,
    };
    return this.fetchWithFallback(endpoints);
  }

  async getMatchEvents(matchId) {
    const endpoints = {
      'API-Football': `/fixtures/events?fixture=${matchId}`,
      'SofaScore': `/event/${matchId}/incidents`,
    };
    return this.fetchWithFallback(endpoints);
  }

  async getH2H(team1Id, team2Id) {
    const endpoints = {
      'API-Football': `/fixtures/headtohead?h2h=${team1Id}-${team2Id}`,
    };
    return this.fetchWithFallback(endpoints);
  }

  async getLeagueMatches(leagueId) {
    const endpoints = {
      'API-Football': `/fixtures?league=${leagueId}&season=2024`,
      'Football-Data': `/competitions/${leagueId}/matches`,
    };
    return this.fetchWithFallback(endpoints);
  }

  async getLeagueStandings(leagueId) {
    const endpoints = {
      'API-Football': `/standings?league=${leagueId}&season=2024`,
      'Football-Data': `/competitions/${leagueId}/standings`,
    };
    return this.fetchWithFallback(endpoints);
  }

  async getTeamInfo(teamId) {
    const endpoints = {
      'API-Football': `/teams?id=${teamId}`,
      'TheSportsDB': `/3/lookupteam.php?id=${teamId}`,
    };
    return this.fetchWithFallback(endpoints);
  }

  async getPlayerStats(playerId) {
    const endpoints = {
      'API-Football': `/players?id=${playerId}&season=2024`,
    };
    return this.fetchWithFallback(endpoints);
  }

  getAPIStatus() {
    return this.sources.map(s => ({
      name: s.name,
      healthy: s.healthy,
      callCount: s.callCount,
      maxDaily: s.maxDaily,
      remainingCalls: s.maxDaily - s.callCount
    }));
  }
}

// Leagues configuration
const LEAGUES = {
  // Europe Top 5
  EPL: { id: 39, name: 'الدوري الإنجليزي', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', fdCode: 'PL' },
  LALIGA: { id: 140, name: 'الدوري الإسباني', country: '🇪🇸', fdCode: 'PD' },
  BUNDESLIGA: { id: 78, name: 'الدوري الألماني', country: '🇩🇪', fdCode: 'BL1' },
  SERIE_A: { id: 135, name: 'الدوري الإيطالي', country: '🇮🇹', fdCode: 'SA' },
  LIGUE_1: { id: 61, name: 'الدوري الفرنسي', country: '🇫🇷', fdCode: 'FL1' },
  // Europe Competitions
  UCL: { id: 2, name: 'دوري أبطال أوروبا', country: '🇪🇺', fdCode: 'CL' },
  UEL: { id: 3, name: 'الدوري الأوروبي', country: '🇪🇺' },
  UECL: { id: 848, name: 'دوري المؤتمر الأوروبي', country: '🇪🇺' },
  // Arab
  EGYPT: { id: 233, name: 'الدوري المصري', country: '🇪🇬' },
  SAUDI: { id: 307, name: 'الدوري السعودي', country: '🇸🇦' },
  UAE: { id: 435, name: 'الدوري الإماراتي', country: '🇦🇪' },
  QATAR: { id: 327, name: 'الدوري القطري', country: '🇶🇦' },
  MOROCCO: { id: 200, name: 'الدوري المغربي', country: '🇲🇦' },
  ALGERIA: { id: 197, name: 'الدوري الجزائري', country: '🇩🇿' },
  TUNISIA: { id: 202, name: 'الدوري التونسي', country: '🇹🇳' },
  JORDAN: { id: 310, name: 'الدوري الأردني', country: '🇯🇴' },
  IRAQ: { id: 311, name: 'الدوري العراقي', country: '🇮🇶' },
  KUWAIT: { id: 315, name: 'الدوري الكويتي', country: '🇰🇼' },
  // International
  WORLD_CUP: { id: 1, name: 'كأس العالم', country: '🌍' },
  AFCON: { id: 6, name: 'كأس أمم أفريقيا', country: '🌍' },
  EURO: { id: 4, name: 'بطولة أوروبا', country: '🇪🇺' },
  COPA_AMERICA: { id: 9, name: 'كوبا أمريكا', country: '🌎' },
  // Other big leagues
  MLS: { id: 253, name: 'دوري MLS الأمريكي', country: '🇺🇸' },
  EREDIVISIE: { id: 88, name: 'الدوري الهولندي', country: '🇳🇱' },
  PRIMEIRA: { id: 94, name: 'الدوري البرتغالي', country: '🇵🇹' },
  SUPER_LIG: { id: 203, name: 'الدوري التركي', country: '🇹🇷' },
  PREMIERSHIP: { id: 179, name: 'الدوري الاسكتلندي', country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  JUPILER: { id: 144, name: 'الدوري البلجيكي', country: '🇧🇪' },
  SUPERLIGA: { id: 119, name: 'الدوري الدنماركي', country: '🇩🇰' },
  ARGENTINA: { id: 128, name: 'الدوري الأرجنتيني', country: '🇦🇷' },
  BRAZIL: { id: 71, name: 'الدوري البرازيلي', country: '🇧🇷' },
  CHINESE: { id: 169, name: 'الدوري الصيني', country: '🇨🇳' },
  JAPANESE: { id: 98, name: 'الدوري الياباني', country: '🇯🇵' },
};

module.exports = { SportsAPIService: new SportsAPIService(), LEAGUES };
