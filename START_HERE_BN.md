# FloodGuard AI — প্রথমবার চালানোর বাংলা নির্দেশিকা

এই ফাইলটি ZIP extract করার পর আগে পড়ুন। অ্যাপটি React/Vite UI এবং Express/SQLite backend একসঙ্গে চালায়; তাই শুধু static hosting যথেষ্ট নয়।

## ১. যা লাগবে

- Node.js **22.13 বা নতুন** (সম্ভব হলে Node.js 24 LTS ব্যবহার করুন)
- npm
- প্রথমবার dependency নামানোর জন্য internet connection
- Gemini chat/prediction explanation ব্যবহার করতে চাইলে একটি Gemini API key (ঐচ্ছিক)

Node ও npm ঠিক আছে কি না দেখুন:

```bash
node -v
npm -v
```

Node version `v22.13.0` বা তার বেশি হতে হবে। Node 22-এ built-in `node:sqlite` experimental warning দেখাতে পারে; এটি এই Node version-এর পরিচিত warning।

## ২. ZIP extract করে dependency install

টার্মিনাল/PowerShell-এ project folder-এ ঢুকে চালান:

```bash
npm ci
```

`npm ci` lockfile অনুযায়ী একই dependency install করে। npm registry/DNS error এলে internet/DNS ঠিক করে আবার চালান।

## ৩. `.env` তৈরি করুন

macOS / Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

`.env` ফাইল খুলে দরকার অনুযায়ী মান দিন:

```env
GEMINI_API_KEY="আপনার_GEMINI_API_KEY"
ADMIN_PIN=""
PORT="3000"
NODE_ENV="development"
```

- Gemini key ঐচ্ছিক; key না থাকলেও fallback-সহ অ্যাপের বাকি ফিচার চলার কথা।
- Local development-এ `ADMIN_PIN` ফাঁকা রাখলে সার্ভার startup-এ random 6-digit PIN terminal-এ দেখাবে। সেটি লিখে রাখুন।
- Production-এ অবশ্যই নিজের private 6–128 character `ADMIN_PIN` দিন। `.env` কাউকে পাঠাবেন না বা GitHub-এ commit করবেন না।

## ৪. অ্যাপ চালু করুন

```bash
npm run dev
```

টার্মিনালে server URL দেখাবে। সাধারণত browser-এ খুলুন:

```text
http://localhost:3000
```

টার্মিনাল বন্ধ করবেন না—সার্ভার চালু রাখতে হবে। Admin PIN terminal থেকে নিন।

## ৫. প্রথমবার ফিচার পরীক্ষা

1. Dashboard খুলে live weather পাওয়া যাচ্ছে কি না এবং data status label দেখুন। Network/API না থাকলে fallback বা simulated label থাকা স্বাভাবিক।
2. Operations Center-এ যান। Citizen mode-এ আপনার এলাকা দেখুন, `I'm safe` এবং `I need help` check-in পরীক্ষা করুন।
3. Alert subscription যোগ করে unsubscribe/delete করে দেখুন। ফোন নম্বর দিলে কেবল নিজের পরীক্ষার নম্বর ব্যবহার করুন।
4. Responder Desk খুলে startup-এ পাওয়া Admin PIN দিন। Check-in queue ও responder action পরীক্ষা করুন।
5. Admin Portal-এ PIN দিয়ে report moderation, bilingual alert publish, warning mark এবং danger mark update করে page refresh দিন—পরিবর্তন টিকে আছে কি না দেখুন।
6. Forecast/Operations Center-এ `demo_seed` বা demo-history label থাকলে বুঝবেন SQLite history-তে demo readings আছে।
7. Community report submit করলে consent checkbox দিন; report admin review না করা পর্যন্ত unverified থাকবে।

## ৬. Test, type-check ও production build

```bash
npm run test:all
npm run lint
npm run build
```

সব command সফল না হওয়া পর্যন্ত “fully tested/build verified” বলে submission দেবেন না। কোনো command fail করলে পুরো terminal error copy করে developer-কে পাঠান। Browser-এ ফাঁকা page বা interaction সমস্যা হলে `F12` → Console-এর লাল error এবং terminal log দিন।

## ৭. Demo বনাম production setting

- Demo video-র জন্য demo seed history দরকার হলে default setting রাখা যায়।
- Production-এ `.env`-এ `OPS_SEED_DEMO=false` দিন; এতে fake seed history যোগ হবে না।
- Production-এ unique `ADMIN_PIN`, `NODE_ENV=production`, এবং দরকার হলে `GEMINI_API_KEY` দিন।
- `data/floodguard.db`, `data/reports.json` এবং `data/alerts.json` persistent disk-এ রাখতে হবে। Server restart/deploy হলে এগুলো হারিয়ে না যায়—hosting provider-এ persistent volume configure করুন।
- Express API দরকার, তাই Render/Railway/অন্য Node.js host ব্যবহার করুন। GitHub Pages বা static-only Netlify hosting-এ backend চলবে না।
- SMS provider সংযুক্ত না থাকলে SMS কেবল outbox-এ queued হবে; অ্যাপ নিজে SMS পাঠায় না।

## ৮. ডেমোতে যে সীমাবদ্ধতাগুলো সৎভাবে বলবেন

- Open-Meteo rainfall live API থেকে আসতে পারে; river discharge হলো GloFAS-এর grid-cell model estimate, local gauge reading নয়।
- এই release-এ BWDB live river-stage sensor adapter নেই; station water level, shelter stock, কিছু route/coverage, satellite ও evidence-fusion content demo/reference data।
- Health risk score hand-weighted planning indicator; clinically validated outbreak prediction নয়।
- Forecast trend extrapolation; official flood warning বা hydrodynamic prediction নয়।
- SMS outbox-এ queued; gateway adapter configure না করলে delivery হয় না।
- FloodGuard AI decision-support prototype; জরুরি অবস্থায় সরকারি FFWC/BWDB bulletins, local authority ও licensed clinician-এর নির্দেশনা অনুসরণ করবেন।

## ৯. জরুরি সমস্যা

- `npm ci` fail: internet/DNS/npm registry access যাচাই করুন।
- `node:sqlite` error: `node -v` দেখুন; Node 22.13+ দরকার।
- `ADMIN_PIN` rejected: `.env`-এর PIN এবং startup terminal-এর PIN মেলান; server restart করলে ephemeral PIN বদলে যেতে পারে।
- Database permission error: `data/` folder write permission এবং persistent volume পরীক্ষা করুন।
- Blank page: browser console-এর error এবং terminal stack trace সংগ্রহ করুন।
