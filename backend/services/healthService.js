const cron = require('node-cron');
const { SportsAPIService } = require('./sportsAPI');

class HealthService {
  constructor() {
    this.startTime = Date.now();
    this.checks = [];
  }

  start() {
    // Health check every 5 minutes
    cron.schedule('*/5 * * * *', () => this.runHealthCheck());
    
    // Self-ping to stay alive (for Railway/Render free tiers)
    if (process.env.SERVER_URL) {
      cron.schedule('*/4 * * * *', () => this.selfPing());
    }

    logger.info('🏥 Health service started');
  }

  async runHealthCheck() {
    const check = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: process.memoryUsage(),
      apis: SportsAPIService.getAPIStatus(),
      status: 'healthy'
    };

    // Check memory - restart if too high
    if (check.memory.heapUsed > 450 * 1024 * 1024) {
      logger.warn('⚠️ High memory usage, clearing caches...');
      // Clear caches
      global.gc && global.gc();
    }

    this.checks.push(check);
    if (this.checks.length > 100) this.checks.shift();

    logger.info(`💚 Health check: uptime ${check.uptime}s`);
    return check;
  }

  async selfPing() {
    try {
      const axios = require('axios');
      await axios.get(`${process.env.SERVER_URL}/health`, { timeout: 5000 });
    } catch (err) {
      logger.warn('Self-ping failed:', err.message);
    }
  }

  getStatus() {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      lastChecks: this.checks.slice(-5),
      apis: SportsAPIService.getAPIStatus()
    };
  }
}

module.exports = HealthService;
