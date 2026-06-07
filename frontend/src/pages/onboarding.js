// pages/onboarding.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const ALL_LEAGUES = [
  { key: 'EPL', name: 'الإنجليزي', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#3D195B' },
  { key: 'LALIGA', name: 'الإسباني', flag: '🇪🇸', color: '#EE2737' },
  { key: 'BUNDESLIGA', name: 'الألماني', flag: '🇩🇪', color: '#D00027' },
  { key: 'SERIE_A', name: 'الإيطالي', flag: '🇮🇹', color: '#1B5E20' },
  { key: 'LIGUE_1', name: 'الفرنسي', flag: '🇫🇷', color: '#002395' },
  { key: 'UCL', name: 'أبطال أوروبا', flag: '⭐', color: '#001489' },
  { key: 'EGYPT', name: 'المصري', flag: '🇪🇬', color: '#CE1126' },
  { key: 'SAUDI', name: 'السعودي', flag: '🇸🇦', color: '#006C35' },
  { key: 'UAE', name: 'الإماراتي', flag: '🇦🇪', color: '#00732F' },
  { key: 'QATAR', name: 'القطري', flag: '🇶🇦', color: '#8D1B3D' },
  { key: 'MOROCCO', name: 'المغربي', flag: '🇲🇦', color: '#C1272D' },
  { key: 'WORLD_CUP', name: 'كأس العالم', flag: '🌍', color: '#FFD700' },
  { key: 'AFCON', name: 'كأس أمم أفريقيا', flag: '🌍', color: '#008000' },
  { key: 'EREDIVISIE', name: 'الهولندي', flag: '🇳🇱', color: '#FF6B00' },
  { key: 'MLS', name: 'الأمريكي MLS', flag: '🇺🇸', color: '#005293' },
];

export default function Onboarding() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const toggleLeague = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const saveAndContinue = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/auth/preferences`, { leagues: selected }, { withCredentials: true });
      router.push('/');
    } catch (e) {
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>اختار دوريتك - موكا</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="onboarding" dir="rtl">
        <div className="ob-card">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="ob-icon">☕</div>
            <h1 className="ob-title">أهلاً في موكا!</h1>
            <p className="ob-sub">اختار الدوريات اللي بتهتم بيها</p>
            <p className="ob-hint">هتظهرلك أولاً في الصفحة الرئيسية</p>

            <div className="leagues-grid">
              {ALL_LEAGUES.map(league => (
                <button
                  key={league.key}
                  className={`league-card ${selected.includes(league.key) ? 'selected' : ''}`}
                  onClick={() => toggleLeague(league.key)}
                  style={{ '--c': league.color }}
                >
                  <span className="lc-flag">{league.flag}</span>
                  <span className="lc-name">{league.name}</span>
                  {selected.includes(league.key) && <span className="lc-check">✓</span>}
                </button>
              ))}
            </div>

            <div className="ob-footer">
              <span className="ob-count">{selected.length} دوري محدد</span>
              <button
                className="ob-btn"
                onClick={saveAndContinue}
                disabled={saving}
              >
                {saving ? 'جاري الحفظ...' : selected.length > 0 ? 'يلا نبدأ! →' : 'تخطي'}
              </button>
            </div>
          </motion.div>
        </div>

        <style jsx global>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; background: #0a0a0f; color: #f0f0f0; direction: rtl; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          
          .onboarding { padding: 20px; width: 100%; max-width: 700px; margin: 0 auto; }
          .ob-card { background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 36px 28px; }
          .ob-icon { font-size: 40px; text-align: center; margin-bottom: 16px; }
          .ob-title { font-size: 28px; font-weight: 900; text-align: center; color: #fff; }
          .ob-sub { font-size: 16px; color: #888; text-align: center; margin-top: 8px; }
          .ob-hint { font-size: 13px; color: #444; text-align: center; margin-top: 6px; margin-bottom: 28px; }
          
          .leagues-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px; margin-bottom: 28px;
          }
          .league-card {
            display: flex; flex-direction: column; align-items: center; gap: 6px;
            padding: 16px 10px; border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            cursor: pointer; position: relative;
            font-family: 'Cairo', sans-serif;
            transition: all 0.2s;
          }
          .league-card:hover { border-color: rgba(255,255,255,0.15); }
          .league-card.selected {
            border-color: var(--c);
            background: color-mix(in srgb, var(--c) 15%, transparent);
          }
          .lc-flag { font-size: 28px; }
          .lc-name { font-size: 13px; font-weight: 700; color: #ccc; text-align: center; }
          .lc-check {
            position: absolute; top: 6px; left: 6px;
            background: var(--c); color: #fff;
            width: 18px; height: 18px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 10px; font-weight: 700;
          }
          
          .ob-footer { display: flex; align-items: center; justify-content: space-between; }
          .ob-count { font-size: 13px; color: #555; }
          .ob-btn {
            background: #f59e0b; color: #000;
            border: none; padding: 12px 28px; border-radius: 12px;
            font-size: 16px; font-weight: 700;
            cursor: pointer; font-family: 'Cairo', sans-serif;
            transition: opacity 0.2s;
          }
          .ob-btn:hover { opacity: 0.85; }
          .ob-btn:disabled { opacity: 0.5; }
        `}</style>
      </div>
    </>
  );
}
