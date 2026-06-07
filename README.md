# ☕ موكا - دليل الرفع الكامل

## الملفات الموجودة
```
mocha/
├── backend/          ← رفعه على Railway
└── frontend/         ← رفعه على Vercel
```

---

## الخطوة 1: رفع الـ Backend على Railway

### 1.1 احضر API Keys المجانية الأساسية

| API | رابط التسجيل | مجاني؟ |
|-----|-----|-----|
| API-Football | https://dashboard.api-football.com/register | ✅ 100 طلب/يوم |
| Football-Data | https://www.football-data.org/client/register | ✅ 10 طلبات/دقيقة |
| Anthropic (Claude AI) | https://console.anthropic.com | 💰 مدفوع لكن رخيص |

### 1.2 ارفع الكود على GitHub
```bash
# في مجلد backend
git init
git add .
git commit -m "موكا backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mocha-backend.git
git push -u origin main
```

### 1.3 اعمل مشروع جديد على Railway
1. روح على https://railway.app
2. اضغط "New Project"
3. اختار "Deploy from GitHub repo"
4. اختار الـ repo اللي رفعته

### 1.4 حط متغيرات البيئة في Railway
في Settings → Variables، حط:
```
NODE_ENV=production
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ANTHROPIC_API_KEY=...
API_FOOTBALL_KEY=...
FOOTBALL_DATA_KEY=...
SESSION_SECRET=any-random-string-here
FRONTEND_URL=https://your-vercel-url.vercel.app  (هتعدله بعدين)
SERVER_URL=https://your-railway-url.railway.app   (هتلاقيه في Railway)
```

---

## الخطوة 2: Google OAuth Setup

1. روح على https://console.cloud.google.com
2. اعمل مشروع جديد
3. روح على "APIs & Services" → "Credentials"
4. اضغط "Create Credentials" → "OAuth 2.0 Client IDs"
5. Application type: "Web application"
6. حط في Authorized redirect URIs:
   ```
   https://YOUR-RAILWAY-URL.railway.app/api/auth/google/callback
   ```
7. احفظ الـ Client ID و Client Secret وحطهم في Railway

---

## الخطوة 3: رفع الـ Frontend على Vercel

### 3.1 ارفع الكود
```bash
# في مجلد frontend
git init
git add .
git commit -m "موكا frontend"
git remote add origin https://github.com/YOUR_USERNAME/mocha-frontend.git
git push -u origin main
```

### 3.2 اعمل مشروع في Vercel
1. روح على https://vercel.com
2. "New Project" → اختار frontend repo
3. Framework: Next.js (بيتعرف تلقائي)
4. في Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
   ```
5. اضغط Deploy

### 3.3 عدّل FRONTEND_URL في Railway
بعد ما Vercel يديك الرابط، روح Railway وعدّل:
```
FRONTEND_URL=https://your-vercel-url.vercel.app
```

---

## الخطوة 4: تأكد إن كل حاجة شغالة

### Test Backend:
```
https://your-railway-url.railway.app/health
```
المفروض يرجع: `{ "status": "موكا شغال تمام! 🟢" }`

### Test Frontend:
افتح رابط Vercel - المفروض تشوف الصفحة الرئيسية

### Test Auth:
اضغط "دخول بـ Google" - المفروض يشغل Google OAuth

---

## ملاحظات مهمة

- **Railway free tier**: 500 ساعة/شهر - كافية للتجربة
- **Vercel free tier**: ∞ للمواقع الستاتيك + Next.js
- **API-Football free**: 100 طلب/يوم - كافية للمباريات المباشرة فقط
- **لو عايز أكتر**: upgrade لـ API-Football Pro (~25$/شهر)

---

## لو في مشكلة

1. Check Railway logs في dashboard
2. Check Vercel logs في dashboard  
3. تأكد إن FRONTEND_URL في Railway = رابط Vercel بالظبط
4. تأكد إن NEXT_PUBLIC_API_URL في Vercel = رابط Railway بالظبط

---

صنعه موكا! ☕🔥
