# 💸 Paisa — Personal Expense Tracker

A private, offline-first expense tracker built for Aakash's real budget. Add expenses in
real time, tag what you spent on, and generate a monthly report that compares your **actual
spend vs your ideal budget vs your salary** — with charts, savings rate, and auto insights.

Your data never leaves your device: everything is stored in the browser's `localStorage`
(no server, no account, no cost). Export a JSON backup any time from the **Budget** tab.

## Features
- ⚡ Real-time expense/income entry with categories, payment method and notes
- 📊 Dashboard: income vs spent vs saved, savings rate, over-budget alerts
- 📈 Monthly report: budget-vs-actual-vs-salary bars, category pie & bar charts, variance table, insights
- 🖨 One-click **Save as PDF** (print) and **CSV export**
- ⚙️ Editable per-category budget (pre-filled with the recommended plan) and salary
- 💾 JSON backup / restore; works offline

## Categories & default budget (₹, monthly)
Rent 16,000 · Home/Family 15,000 · Car EMI 10,500 · Food & Groceries 8,000 · Petrol 5,000 ·
Weekend Travel 4,400 · Girlfriend 2,800 · Weekday Commute 1,700 · Parents 1,300 · Misc 3,000 ·
Barber 700 · Snacks 650 · Subscriptions 500 · Water 500 → **target savings ≈ ₹23,000/mo on ₹93,000 salary.**
(Edit any of these in the **Budget** tab.)

---

## Run locally
```bash
npm install
npm run dev        # open the printed http://localhost:5173
npm run build      # production build into dist/
npm run preview    # preview the production build
```
Requires Node 18+ (tested on Node 20/22).

---

## Deploy (pick one — all free)

### Option A — Vercel (easiest, recommended)
1. Push this folder to a GitHub repo.
2. Go to https://vercel.com → **Add New → Project** → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output dir `dist`. Click **Deploy**.
4. You get a live URL like `https://paisa-<you>.vercel.app`. Every `git push` auto-redeploys.

### Option B — GitHub Pages (100% GitHub, config already included)
1. Create a GitHub repo and push this project to the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and publishes automatically.
4. Live at `https://<username>.github.io/<repo>/`. (Relative asset paths are already configured, so it just works.)

### Option C — Netlify or Cloudflare Pages
- Netlify: drag-and-drop the `dist/` folder at https://app.netlify.com/drop, **or** connect the repo (build `npm run build`, publish `dist`).
- Cloudflare Pages: connect repo → Framework preset **Vite** → build `npm run build`, output `dist`.

---

## Push to GitHub (first time)
```bash
git init
git add .
git commit -m "Paisa expense tracker"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## Privacy note
All data stays in your browser. Clearing browser data, using a different device, or a different
browser = fresh/empty app. **Export a backup** from the Budget tab regularly to be safe.
