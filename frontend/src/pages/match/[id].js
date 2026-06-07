// pages/match/[id].js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function MatchPage() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('live');
  const [chatInput, setChatInput] = useState('');
  const [user, setUser] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [preMatchAnalysis, setPreMatchAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const chatEndRef = useRef(null);
  const commentaryEndRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    // Check auth
    axios.get(`${API}/api/auth/me`, { withCredentials: true })
      .then(r => setUser(r.data.user)).catch(() => {});

    // Fetch match data
    fetchMatchData();

    // Connect socket
    const sock = io(API, { withCredentials: true });
    setSocket(sock);
    sock.emit('join_match', id);

    sock.on('match_update', (data) => setMatch(data));
    sock.on('live_event', (data) => {
      setCommentary(prev => [data, ...prev].slice(0, 50));
    });
    sock.on('new_message', (msg) => {
      setChatMessages(prev => [...prev, msg].slice(-100));
    });
    sock.on('chat_history', (history) => setChatMessages(history));
    sock.on('viewer_count', ({ count }) => setViewerCount(count));

    return () => { sock.disconnect(); };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchMatchData = async () => {
    try {
      const [matchRes, eventsRes] = await Promise.allSettled([
        axios.get(`${API}/api/matches/${id}`),
        axios.get(`${API}/api/matches/${id}/events`),
      ]);

      if (matchRes.status === 'fulfilled') {
        setMatch(matchRes.value.data.details?.response?.[0]);
        setStats(matchRes.value.data.stats?.response);
      }
      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.data.data?.response || []);
      }
    } catch (e) {
      setMatch(DEMO_MATCH_DATA);
      setEvents(DEMO_EVENTS);
      setStats(DEMO_STATS);
    }
  };

  const fetchPreMatchAnalysis = async () => {
    if (preMatchAnalysis || loadingAnalysis || !match) return;
    setLoadingAnalysis(true);
    try {
      const home = match.teams?.home;
      const away = match.teams?.away;
      const res = await axios.get(
        `${API}/api/matches/h2h/${home?.id || 1}/${away?.id || 2}?team1Name=${home?.name}&team2Name=${away?.name}`
      );
      setPreMatchAnalysis(res.data.analysis);
    } catch (e) {
      setPreMatchAnalysis('موكا بيجهز التحليل، استنى لحظة! ☕');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !socket) return;
    if (!user) { alert('سجل دخول عشان تتكلم!'); return; }

    socket.emit('send_message', {
      matchId: id,
      message: chatInput,
      user: { id: user.id, name: user.name, avatar: user.avatar }
    });
    setChatInput('');
  };

  const sendReaction = (emoji) => {
    socket?.emit('send_reaction', { matchId: id, reaction: emoji });
  };

  const home = match?.teams?.home || {};
  const away = match?.teams?.away || {};
  const homeScore = match?.goals?.home ?? 0;
  const awayScore = match?.goals?.away ?? 0;
  const minute = match?.fixture?.status?.elapsed || 0;
  const isLive = ['1H', '2H', 'ET', 'HT'].includes(match?.fixture?.status?.short);

  return (
    <>
      <Head>
        <title>{home.name} vs {away.name} - موكا</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="page" dir="rtl">
        {/* HEADER */}
        <header className="match-header">
          <button className="back-btn" onClick={() => router.push('/')}>← العودة</button>
          <div className="header-badge">
            {isLive ? (
              <span className="live-pill">🔴 LIVE</span>
            ) : (
              <span className="league-pill">{match?.league?.name || 'كرة القدم'}</span>
            )}
          </div>
          <div className="viewer-count">
            👁 {viewerCount} مشاهد
          </div>
        </header>

        {/* SCOREBOARD */}
        <div className="scoreboard">
          <div className="score-team">
            {home.logo && <img src={home.logo} alt={home.name} className="score-logo" />}
            <span className="score-team-name">{home.name}</span>
          </div>

          <div className="score-center">
            <div className="score-nums">{homeScore} - {awayScore}</div>
            {isLive ? (
              <div className="score-minute">{minute}'</div>
            ) : (
              <div className="score-ht">قبل المباراة</div>
            )}
          </div>

          <div className="score-team score-team-away">
            <span className="score-team-name">{away.name}</span>
            {away.logo && <img src={away.logo} alt={away.name} className="score-logo" />}
          </div>
        </div>

        {/* REACTIONS */}
        <div className="reactions-bar">
          {['🔥', '😱', '👏', '😂', '💪', '🎯'].map(r => (
            <button key={r} className="reaction-btn" onClick={() => sendReaction(r)}>{r}</button>
          ))}
        </div>

        {/* TABS */}
        <div className="tabs">
          {[
            { id: 'live', label: '⚡ تعليق موكا' },
            { id: 'stats', label: '📊 إحصائيات' },
            { id: 'events', label: '⚽ الأحداث' },
            { id: 'prematch', label: '📋 ما قبل المباراة' },
            { id: 'chat', label: `💬 شات (${chatMessages.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'prematch') fetchPreMatchAnalysis();
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="tab-content">

          {/* LIVE COMMENTARY */}
          {activeTab === 'live' && (
            <div className="commentary-feed">
              {commentary.length === 0 && (
                <div className="empty-state">
                  <div className="coffee-icon">☕</div>
                  <p>موكا بيتابع المباراة...</p>
                  <p className="empty-sub">التعليقات هتظهر هنا لحظة بلحظة</p>
                </div>
              )}
              <AnimatePresence>
                {commentary.map((item, i) => (
                  <motion.div
                    key={item.timestamp || i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="commentary-item"
                  >
                    <div className="commentary-meta">
                      <span className="commentary-minute">{item.event?.minute}'</span>
                      <span className={`commentary-type event-${item.event?.type?.toLowerCase()}`}>
                        {getEventIcon(item.event?.type)} {item.event?.type}
                      </span>
                    </div>
                    <p className="commentary-text">{item.commentary}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* STATS */}
          {activeTab === 'stats' && (
            <div className="stats-panel">
              {stats ? (
                <StatsBars stats={stats} homeName={home.name} awayName={away.name} />
              ) : (
                <div className="empty-state">📊 الإحصائيات ستظهر بعد بداية المباراة</div>
              )}
            </div>
          )}

          {/* EVENTS */}
          {activeTab === 'events' && (
            <div className="events-feed">
              {events.length === 0 ? (
                <div className="empty-state">⚽ لا توجد أحداث بعد</div>
              ) : (
                events.map((event, i) => (
                  <div key={i} className={`event-item ${event.team?.id === home.id ? 'event-home' : 'event-away'}`}>
                    <span className="event-minute">{event.time?.elapsed}'</span>
                    <span className="event-icon">{getEventIcon(event.type)}</span>
                    <div className="event-details">
                      <span className="event-player">{event.player?.name}</span>
                      {event.assist?.name && <span className="event-assist">صنعها: {event.assist.name}</span>}
                    </div>
                    <span className="event-team-name">{event.team?.name}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PRE-MATCH */}
          {activeTab === 'prematch' && (
            <div className="prematch-panel">
              {loadingAnalysis ? (
                <div className="loading-analysis">
                  <div className="coffee-spin">☕</div>
                  <p>موكا بيحضر التحليل...</p>
                </div>
              ) : (
                <div className="analysis-text">
                  {preMatchAnalysis || 'اضغط على "ما قبل المباراة" عشان موكا يحلل!'}
                </div>
              )}
            </div>
          )}

          {/* CHAT */}
          {activeTab === 'chat' && (
            <div className="chat-panel">
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={msg.id || i} className={`chat-msg ${msg.user?.id === user?.id ? 'chat-msg-mine' : ''}`}>
                    <img src={msg.user?.avatar || '/default-avatar.png'} alt="" className="chat-avatar" />
                    <div className="chat-bubble">
                      <span className="chat-username">{msg.user?.name}</span>
                      <p className="chat-text">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-wrap">
                {user ? (
                  <>
                    <input
                      className="chat-input"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && sendMessage()}
                      placeholder="اكتب تعليقك..."
                      maxLength={280}
                    />
                    <button className="chat-send" onClick={sendMessage}>إرسال</button>
                  </>
                ) : (
                  <a href={`${API}/api/auth/google`} className="chat-login">سجل دخول عشان تشارك في الشات 🔐</a>
                )}
              </div>
            </div>
          )}
        </div>

        <style jsx global>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; background: #0a0a0f; color: #f0f0f0; direction: rtl; }
          
          .page { min-height: 100vh; max-width: 800px; margin: 0 auto; }
          
          .match-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .back-btn { background: none; border: none; color: #888; font-size: 14px; cursor: pointer; font-family: 'Cairo', sans-serif; }
          .live-pill {
            background: rgba(239,68,68,0.15); color: #ef4444;
            padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;
          }
          .league-pill { font-size: 12px; color: #888; }
          .viewer-count { font-size: 12px; color: #555; }

          .scoreboard {
            display: flex; align-items: center; justify-content: space-between;
            padding: 30px 24px 20px;
            background: linear-gradient(to bottom, rgba(245,158,11,0.05), transparent);
          }
          .score-team {
            display: flex; flex-direction: column; align-items: center;
            gap: 10px; flex: 1;
          }
          .score-team-away { align-items: center; }
          .score-logo { width: 56px; height: 56px; object-fit: contain; }
          .score-team-name { font-size: 15px; font-weight: 700; text-align: center; color: #ddd; }
          .score-center { text-align: center; }
          .score-nums { font-size: 44px; font-weight: 900; color: #fff; letter-spacing: -2px; }
          .score-minute { font-size: 14px; color: #22c55e; font-weight: 700; margin-top: 4px; }
          .score-ht { font-size: 12px; color: #555; margin-top: 4px; }

          .reactions-bar {
            display: flex; justify-content: center; gap: 12px;
            padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .reaction-btn {
            background: rgba(255,255,255,0.05); border: none;
            padding: 8px 12px; border-radius: 12px; font-size: 20px;
            cursor: pointer; transition: all 0.15s;
          }
          .reaction-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.2); }

          .tabs {
            display: flex; overflow-x: auto; gap: 0;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            scrollbar-width: none;
          }
          .tabs::-webkit-scrollbar { display: none; }
          .tab {
            padding: 14px 16px; font-size: 13px; font-weight: 600;
            color: #555; background: none; border: none;
            cursor: pointer; white-space: nowrap;
            font-family: 'Cairo', sans-serif;
            border-bottom: 2px solid transparent; transition: all 0.2s;
          }
          .tab:hover { color: #aaa; }
          .tab-active { color: #f59e0b; border-bottom-color: #f59e0b; }

          .tab-content { padding: 16px; min-height: 400px; }

          .empty-state {
            text-align: center; padding: 60px 20px; color: #444;
          }
          .coffee-icon { font-size: 40px; margin-bottom: 12px; }
          .empty-sub { font-size: 13px; color: #333; margin-top: 8px; }

          .commentary-feed { display: flex; flex-direction: column; gap: 12px; }
          .commentary-item {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-right: 3px solid #f59e0b;
            border-radius: 10px; padding: 14px;
          }
          .commentary-meta {
            display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
          }
          .commentary-minute {
            font-size: 12px; font-weight: 700; color: #f59e0b;
            background: rgba(245,158,11,0.1); padding: 2px 8px; border-radius: 6px;
          }
          .commentary-type { font-size: 11px; color: #555; font-weight: 600; }
          .commentary-text { font-size: 15px; color: #ddd; line-height: 1.6; }

          .events-feed { display: flex; flex-direction: column; gap: 8px; }
          .event-item {
            display: flex; align-items: center; gap: 12px;
            padding: 12px; border-radius: 10px;
            background: rgba(255,255,255,0.03);
          }
          .event-minute { font-size: 12px; color: #f59e0b; font-weight: 700; min-width: 30px; }
          .event-icon { font-size: 18px; }
          .event-details { flex: 1; }
          .event-player { font-size: 14px; font-weight: 600; color: #ddd; display: block; }
          .event-assist { font-size: 11px; color: #555; }
          .event-team-name { font-size: 11px; color: #555; }

          .prematch-panel { }
          .loading-analysis { text-align: center; padding: 40px; color: #555; }
          .coffee-spin { font-size: 32px; animation: spin 2s linear infinite; display: inline-block; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .analysis-text {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px; padding: 20px;
            font-size: 15px; line-height: 1.8; color: #ccc;
            white-space: pre-wrap;
          }

          .stats-panel { }

          .chat-panel { display: flex; flex-direction: column; height: 500px; }
          .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 12px; }
          .chat-msg { display: flex; gap: 8px; align-items: flex-start; }
          .chat-msg-mine { flex-direction: row-reverse; }
          .chat-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
          .chat-bubble { max-width: 75%; }
          .chat-username { font-size: 11px; color: #555; display: block; margin-bottom: 4px; }
          .chat-text {
            background: rgba(255,255,255,0.06); border-radius: 12px;
            padding: 10px 14px; font-size: 14px; color: #ddd;
          }
          .chat-msg-mine .chat-text { background: rgba(245,158,11,0.15); }
          .chat-input-wrap {
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 12px; display: flex; gap: 8px;
          }
          .chat-input {
            flex: 1; background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
            padding: 10px 16px; font-size: 14px; color: #fff;
            font-family: 'Cairo', sans-serif; outline: none;
          }
          .chat-send {
            background: #f59e0b; color: #000;
            border: none; padding: 10px 20px; border-radius: 20px;
            font-weight: 700; cursor: pointer; font-family: 'Cairo', sans-serif;
          }
          .chat-login {
            text-align: center; color: #f59e0b; text-decoration: none;
            font-size: 14px; padding: 12px;
          }
        `}</style>
      </div>
    </>
  );
}

function StatsBars({ stats, homeName, awayName }) {
  const statItems = [
    { label: 'الاستحواذ', home: '55%', away: '45%' },
    { label: 'التسديدات', home: '8', away: '5' },
    { label: 'التمريرات', home: '320', away: '280' },
    { label: 'الهجمات', home: '45', away: '32' },
  ];

  return (
    <div className="stats-list">
      <div className="stats-header">
        <span className="stat-team-name">{homeName}</span>
        <span className="stat-team-name">{awayName}</span>
      </div>
      {statItems.map((stat, i) => (
        <div key={i} className="stat-row">
          <span className="stat-val">{stat.home}</span>
          <div className="stat-bar-wrap">
            <div className="stat-bar-home" style={{ width: stat.home.replace('%', '') + '%' }} />
            <span className="stat-label">{stat.label}</span>
            <div className="stat-bar-away" style={{ width: stat.away.replace('%', '') + '%' }} />
          </div>
          <span className="stat-val">{stat.away}</span>
        </div>
      ))}
      <style jsx>{`
        .stats-list { display: flex; flex-direction: column; gap: 14px; }
        .stats-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .stat-team-name { font-size: 13px; font-weight: 700; color: #888; }
        .stat-row { display: flex; align-items: center; gap: 10px; }
        .stat-val { font-size: 14px; font-weight: 700; color: #fff; min-width: 40px; text-align: center; }
        .stat-bar-wrap { flex: 1; display: flex; align-items: center; gap: 6px; flex-direction: column; }
        .stat-label { font-size: 11px; color: #555; }
        .stat-bar-home { height: 4px; background: #f59e0b; border-radius: 2px; }
        .stat-bar-away { height: 4px; background: #3b82f6; border-radius: 2px; }
      `}</style>
    </div>
  );
}

function getEventIcon(type) {
  const icons = {
    'Goal': '⚽', 'Yellow Card': '🟡', 'Red Card': '🔴',
    'Substitution': '🔄', 'Penalty': '🎯', 'MissedPenalty': '❌',
    'Var': '📺', 'Normal Goal': '⚽'
  };
  return icons[type] || '📌';
}

const DEMO_MATCH_DATA = {
  fixture: { id: 1, status: { short: '1H', elapsed: 34 } },
  league: { id: 39, name: 'الدوري الإنجليزي الممتاز' },
  teams: {
    home: { id: 40, name: 'ليفربول', logo: 'https://media.api-sports.io/football/teams/40.png' },
    away: { id: 50, name: 'مانشستر سيتي', logo: 'https://media.api-sports.io/football/teams/50.png' }
  },
  goals: { home: 2, away: 1 }
};

const DEMO_EVENTS = [
  { time: { elapsed: 12 }, type: 'Goal', player: { name: 'صلاح' }, team: { id: 40, name: 'ليفربول' }, assist: { name: 'نونيز' } },
  { time: { elapsed: 28 }, type: 'Yellow Card', player: { name: 'روكو' }, team: { id: 50, name: 'مانشستر سيتي' } },
  { time: { elapsed: 33 }, type: 'Goal', player: { name: 'دياز' }, team: { id: 40, name: 'ليفربول' }, assist: null },
];

const DEMO_STATS = [
  { team: { id: 40 }, statistics: [{ type: 'Ball Possession', value: '56%' }] },
  { team: { id: 50 }, statistics: [{ type: 'Ball Possession', value: '44%' }] },
];
