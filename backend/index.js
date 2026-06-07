require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Routes
const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const leagueRoutes = require('./routes/leagues');
const userRoutes = require('./routes/user');
const commentaryRoutes = require('./routes/commentary');

// Services
const SocketService = require('./services/socketService');
const LiveMatchService = require('./services/liveMatchService');
const HealthService = require('./services/healthService');

// Passport config
require('./middleware/passport')(passport);

const app = express();
const httpServer = createServer(app);

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'mocha.log' })
  ]
});

global.logger = logger;

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'mocha-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'كتير أوي في وقت قصير، استنى شوية!' }
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/user', userRoutes);
app.use('/api/commentary', commentaryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'موكا شغال تمام! 🟢',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Socket service
const socketService = new SocketService(io);
socketService.init();

// Live match polling service
const liveMatchService = new LiveMatchService(io);
liveMatchService.start();

// Health monitor
const healthService = new HealthService();
healthService.start();

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'حصل حاجة غلط، بنصلحها!' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`🚀 موكا Backend شغال على port ${PORT}`);
});

module.exports = { app, io };
