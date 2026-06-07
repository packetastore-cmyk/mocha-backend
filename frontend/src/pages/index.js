// pages/index.js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const LEAGUES_DATA = {
  EPL: { id: 39, name: 'الإنجليزي', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#3D195B' },
  LALIGA: { id: 140, name: 'الإسباني', flag: '🇪🇸', color: '#EE2737' },
  BUNDESLIGA: { id: 78, name: 'الألماني', flag: '🇩🇪', color: '#D00027' },
  SERIE_A: { id: 135, name: 'الإيطالي', flag: '🇮🇹', color: '#1B5E20' },
  UCL: { id: 2, name: 'أبطال أوروبا', flag: '⭐', color: '#001489' },
  EGYPT: { id: 233, name: 'المصري', flag: '🇪🇬', color: '#CE1126' },
  SAUDI: { id: 307, name: 'السعودي', flag: '🇸🇦', color: '#006C35' },
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedLeagues, setSelectedLeagues] = useState(['EPL', 'UCL', 'EGYPT']);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    checkAuth();
    fetchLiveMatches();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      fetchLiveMatches();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`${API}/api/auth/me`, { withCredentials: true });
      setUser(data.user);
      if (data.user?.preferences?.leagues?.length > 0) {
        setSelectedLeagues(data.user.preferences.leagues);
      }
    } catch (e) {}
  };

  const fetchLiveMatches = async () => {
    try {
      const { data } = await axios.get(`${API}/api/matches/live`);
      setLiveMatches(data.data?.response || []);
    } catch (e) {
      // Show demo data if API not connected
      setLiveMatches(DEMO_MATCHES);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>موكا - المعلق الساخر</title>
        <meta name="description" content="موكا - تحليل مباريات الكرة بأسلوب مصري ساخر" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="app" dir="rtl">
        <Toaster position="top-center" />
        
        {/* NAV */}
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="logo">
              <span className="logo-icon">☕</span>
              <span className="logo-text">موكا</span>
              <span className="logo-beta">BETA</span>
            </Link>

            <div className="nav-center">
              <div className="live-dot-wrap">
                <span className="live-dot" />
                <span className="live-text">مباشر</span>
                <span className="live-count">{liveMatches.length}</span>
              </div>
            </div>

            <div className="nav-right">
              {user ? (
                <div className="user-menu">
                  <img src={user.avatar} alt={user.name} className="avatar" />
                  <span className="user-name">{user.name.split(' ')[0]}</span>
                </div>
              ) : (
                <a href={`${API}/api/auth/google`} className="btn-login">
                  <span>دخول بـ Google</span>
                </a>
              )}
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-content"
          >
            <h1 className="hero-title">
              كل مباراة<br />
              <span className="hero-accent">زي ما أنت في الملعب</span>
            </h1>
            <p className="hero-sub">
              موكا بيتابع وبيحلل وبيعلق لحظة بلحظة بأسلوب مصري خالص 🔥
            </p>
          </motion.div>
        </section>

        {/* LEAGUES FILTER */}
        <section className="leagues-filter">
          <div className="container">
            <div className="leagues-scroll">
              {Object.entries(LEAGUES_DATA).map(([key, league]) => (
                <button
                  key={key}
                  className={`league-pill ${selectedLeagues.includes(key) ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedLeagues(prev =>
                      prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key]
                    );
                  }}
                  style={{ '--league-color': league.color }}
                >
                  <span>{league.flag}</span>
                  <span>{league.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* LIVE MATCHES */}
        <main className="main">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <span className="live-badge">LIVE</span>
                المباريات الآن
              </h2>
              <span className="section-time">
                {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {loading ? (
              <div className="matches-grid">
                {[1,2,3,4].map(i => (
                  <div key={i} className="match-card skeleton" />
                ))}
              </div>
            ) : (
              <AnimatePresence>
                <div className="matches-grid">
                  {(liveMatches.length > 0 ? liveMatches : DEMO_MATCHES).map((match, i) => (
                    <motion.div
                      key={match.fixture?.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <MatchCard match={match} />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </main>

        <style jsx global>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Cairo', 'Tajawal', sans-serif;
            background: #0a0a0f;
            color: #f0f0f0;
            min-height: 100vh;
            direction: rtl;
          }

          .app { min-height: 100vh; }

          /* NAV */
          .nav {
            position: sticky; top: 0; z-index: 100;
            background: rgba(10,10,15,0.92);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding: 0 1rem;
          }
          .nav-inner {
            max-width: 1200px; margin: 0 auto;
            display: flex; align-items: center; justify-content: space-between;
            height: 60px;
          }
          .logo {
            display: flex; align-items: center; gap: 8px;
            text-decoration: none;
          }
          .logo-icon { font-size: 24px; }
          .logo-text {
            font-size: 22px; font-weight: 900; color: #fff;
            letter-spacing: -0.5px;
          }
          .logo-beta {
            font-size: 9px; background: #f59e0b; color: #000;
            padding: 2px 6px; border-radius: 4px; font-weight: 700;
            letter-spacing: 1px; margin-top: 2px;
          }
          .live-dot-wrap {
            display: flex; align-items: center; gap: 6px;
            background: rgba(255,255,255,0.04);
            padding: 6px 14px; border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.08);
          }
          .live-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: #22c55e;
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
          .live-text { font-size: 13px; color: #aaa; font-weight: 600; }
          .live-count {
            background: #22c55e; color: #000;
            font-size: 11px; font-weight: 700;
            padding: 2px 7px; border-radius: 10px;
          }
          .btn-login {
            background: #fff; color: #000;
            padding: 8px 18px; border-radius: 20px;
            font-size: 13px; font-weight: 700;
            text-decoration: none;
            transition: opacity 0.2s;
          }
          .btn-login:hover { opacity: 0.85; }
          .avatar {
            width: 34px; height: 34px; border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.15);
          }
          .user-menu { display: flex; align-items: center; gap: 8px; }
          .user-name { font-size: 13px; font-weight: 600; }

          /* HERO */
          .hero {
            text-align: center;
            padding: 60px 1rem 40px;
            background: radial-gradient(ellipse at top, rgba(245,158,11,0.08) 0%, transparent 70%);
          }
          .hero-title {
            font-size: clamp(32px, 6vw, 56px);
            font-weight: 900; line-height: 1.15;
            color: #fff;
          }
          .hero-accent {
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          }
          .hero-sub {
            font-size: 16px; color: #888; margin-top: 16px;
            font-weight: 400;
          }

          /* LEAGUES */
          .leagues-filter { padding: 0 0 24px; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
          .leagues-scroll {
            display: flex; gap: 8px; overflow-x: auto;
            padding: 8px 0; scrollbar-width: none;
          }
          .leagues-scroll::-webkit-scrollbar { display: none; }
          .league-pill {
            display: flex; align-items: center; gap: 6px;
            padding: 8px 16px; border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04);
            color: #aaa; font-size: 13px; font-weight: 600;
            cursor: pointer; white-space: nowrap;
            font-family: 'Cairo', sans-serif;
            transition: all 0.2s;
          }
          .league-pill:hover {
            border-color: rgba(255,255,255,0.2);
            color: #fff;
          }
          .league-pill.active {
            background: var(--league-color, #f59e0b);
            border-color: transparent; color: #fff;
          }

          /* SECTION HEADER */
          .section-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 20px;
          }
          .section-title {
            display: flex; align-items: center; gap: 10px;
            font-size: 20px; font-weight: 700; color: #fff;
          }
          .live-badge {
            background: #ef4444; color: #fff;
            font-size: 10px; font-weight: 800;
            padding: 3px 8px; border-radius: 4px;
            letter-spacing: 1px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .section-time { font-size: 13px; color: #555; font-weight: 500; }

          /* MATCH GRID */
          .matches-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
            padding-bottom: 60px;
          }

          /* SKELETON */
          .skeleton {
            height: 180px; border-radius: 16px;
            background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          /* MATCH CARD */
          .match-card-wrap {
            background: #111118;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px; overflow: hidden;
            cursor: pointer;
            transition: all 0.25s;
            text-decoration: none; color: inherit;
          }
          .match-card-wrap:hover {
            border-color: rgba(255,255,255,0.15);
            transform: translateY(-2px);
            background: #14141e;
          }
          .match-card-top {
            padding: 14px 16px 10px;
          }
          .match-league {
            font-size: 11px; color: #555; font-weight: 600;
            text-transform: uppercase; letter-spacing: 1px;
            margin-bottom: 14px;
          }
          .match-teams {
            display: flex; align-items: center;
            justify-content: space-between; gap: 12px;
          }
          .team {
            display: flex; flex-direction: column;
            align-items: center; gap: 6px; flex: 1;
          }
          .team-logo {
            width: 44px; height: 44px; object-fit: contain;
          }
          .team-name {
            font-size: 13px; font-weight: 700; color: #e0e0e0;
            text-align: center; line-height: 1.2;
          }
          .match-score-wrap {
            display: flex; flex-direction: column;
            align-items: center; gap: 4px;
          }
          .match-score {
            font-size: 28px; font-weight: 900; color: #fff;
            letter-spacing: -1px;
          }
          .match-minute {
            font-size: 12px; font-weight: 700; color: #22c55e;
          }
          .match-status-ns {
            font-size: 12px; color: #555; font-weight: 500;
          }
          .match-card-bottom {
            border-top: 1px solid rgba(255,255,255,0.05);
            padding: 10px 16px;
            display: flex; justify-content: space-between; align-items: center;
          }
          .mocha-tease {
            font-size: 12px; color: #f59e0b;
            font-weight: 600;
          }
          .view-btn {
            font-size: 12px; color: #555;
          }

          /* MAIN */
          .main { padding: 0 0 40px; }
        `}</style>
      </div>
    </>
  );
}

function MatchCard({ match }) {
  const home = match.teams?.home || match.home || {};
  const away = match.teams?.away || match.away || {};
  const homeScore = match.goals?.home ?? match.score?.home ?? '-';
  const awayScore = match.goals?.away ?? match.score?.away ?? '-';
  const minute = match.fixture?.status?.elapsed || match.minute;
  const status = match.fixture?.status?.short || match.status;
  const isLive = ['1H', '2H', 'ET', 'HT'].includes(status);
  const leagueName = match.league?.name || match.competition?.name || 'كرة القدم';

  return (
    <Link href={`/match/${match.fixture?.id || match.id || '1'}`} className="match-card-wrap">
      <div className="match-card-top">
        <div className="match-league">{leagueName}</div>
        <div className="match-teams">
          <div className="team">
            {home.logo && <img src={home.logo} alt={home.name} className="team-logo" />}
            <span className="team-name">{home.name || 'الفريق الأول'}</span>
          </div>
          <div className="match-score-wrap">
            <span className="match-score">
              {isLive ? `${homeScore} - ${awayScore}` : 'vs'}
            </span>
            {isLive ? (
              <span className="match-minute">{minute}'</span>
            ) : (
              <span className="match-status-ns">{match.fixture?.date ? new Date(match.fixture.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'قريباً'}</span>
            )}
          </div>
          <div className="team">
            {away.logo && <img src={away.logo} alt={away.name} className="team-logo" />}
            <span className="team-name">{away.name || 'الفريق الثاني'}</span>
          </div>
        </div>
      </div>
      <div className="match-card-bottom">
        <span className="mocha-tease">☕ موكا يراقب...</span>
        <span className="view-btn">تابع المباراة ←</span>
      </div>
    </Link>
  );
}

// Demo data when APIs aren't connected yet
const DEMO_MATCHES = [
  {
    fixture: { id: 1, status: { short: '1H', elapsed: 34 } },
    league: { name: 'الدوري الإنجليزي الممتاز' },
    teams: { home: { name: 'ليفربول', logo: 'https://media.api-sports.io/football/teams/40.png' }, away: { name: 'مانشستر سيتي', logo: 'https://media.api-sports.io/football/teams/50.png' } },
    goals: { home: 2, away: 1 }
  },
  {
    fixture: { id: 2, status: { short: '2H', elapsed: 67 } },
    league: { name: 'الدوري الإسباني' },
    teams: { home: { name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/541.png' }, away: { name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/529.png' } },
    goals: { home: 1, away: 1 }
  },
  {
    fixture: { id: 3, status: { short: 'NS' }, date: new Date(Date.now() + 3600000).toISOString() },
    league: { name: 'دوري أبطال أوروبا' },
    teams: { home: { name: 'بايرن ميونخ', logo: 'https://media.api-sports.io/football/teams/157.png' }, away: { name: 'باريس سان جيرمان', logo: 'https://media.api-sports.io/football/teams/85.png' } },
    goals: { home: null, away: null }
  },
];
