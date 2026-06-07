const AICommentaryService = require('./aiCommentary');

class SocketService {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map();
    this.matchRooms = new Map();
    this.chatHistory = new Map(); // Last 100 messages per match
    this.MAX_CHAT_HISTORY = 100;
  }

  init() {
    this.io.on('connection', (socket) => {
      logger.info(`🔌 User connected: ${socket.id}`);

      // ===== MATCH ROOM =====
      socket.on('join_match', (matchId) => {
        socket.join(`match_${matchId}`);
        
        // Track user in room
        if (!this.matchRooms.has(matchId)) {
          this.matchRooms.set(matchId, new Set());
        }
        this.matchRooms.get(matchId).add(socket.id);
        
        // Send chat history
        const history = this.chatHistory.get(matchId) || [];
        socket.emit('chat_history', history);
        
        // Send viewer count
        this.broadcastViewerCount(matchId);
        
        logger.info(`👤 ${socket.id} joined match ${matchId}`);
      });

      socket.on('leave_match', (matchId) => {
        socket.leave(`match_${matchId}`);
        this.matchRooms.get(matchId)?.delete(socket.id);
        this.broadcastViewerCount(matchId);
      });

      // ===== CHAT =====
      socket.on('send_message', async (data) => {
        const { matchId, message, user } = data;

        if (!message?.trim() || message.length > 280) return;

        // Sanitize
        const cleanMessage = message.trim().substring(0, 280);
        
        const msgObj = {
          id: `${Date.now()}_${socket.id}`,
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            verified: user.verified || false
          },
          message: cleanMessage,
          timestamp: new Date().toISOString(),
          matchId
        };

        // Save to history
        if (!this.chatHistory.has(matchId)) {
          this.chatHistory.set(matchId, []);
        }
        const history = this.chatHistory.get(matchId);
        history.push(msgObj);
        if (history.length > this.MAX_CHAT_HISTORY) {
          history.shift();
        }

        // Broadcast to match room
        this.io.to(`match_${matchId}`).emit('new_message', msgObj);
      });

      // ===== REACTIONS =====
      socket.on('send_reaction', (data) => {
        const { matchId, reaction } = data;
        const allowed = ['🔥', '😱', '👏', '😂', '💪', '🎯', '❤️', '😴'];
        
        if (allowed.includes(reaction)) {
          this.io.to(`match_${matchId}`).emit('reaction', {
            reaction,
            userId: socket.id,
            timestamp: Date.now()
          });
        }
      });

      // ===== POLLS =====
      socket.on('vote_poll', (data) => {
        const { matchId, pollId, option } = data;
        this.io.to(`match_${matchId}`).emit('poll_update', {
          pollId,
          option,
          userId: socket.id
        });
      });

      // ===== DISCONNECT =====
      socket.on('disconnect', () => {
        // Remove from all rooms
        for (const [matchId, users] of this.matchRooms) {
          if (users.has(socket.id)) {
            users.delete(socket.id);
            this.broadcastViewerCount(matchId);
          }
        }
        
        this.activeUsers.delete(socket.id);
        logger.info(`🔌 User disconnected: ${socket.id}`);
      });

      // ===== PING/PONG for keep-alive =====
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });

    logger.info('🔌 Socket service initialized');
  }

  broadcastViewerCount(matchId) {
    const count = this.matchRooms.get(matchId)?.size || 0;
    this.io.to(`match_${matchId}`).emit('viewer_count', { count, matchId });
  }

  getStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      activeRooms: this.matchRooms.size,
      totalMessages: Array.from(this.chatHistory.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

module.exports = SocketService;
