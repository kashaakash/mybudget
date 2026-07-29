import { useState, useEffect } from 'react'

export const DEFAULT_SALARY = 0

export const CATEGORIES = [
  { key: 'Rent',            icon: '🏠', group: 'Fixed',  budget: 16000 },
  { key: 'Home / Family',   icon: '👨‍👩‍👦', group: 'Fixed',  budget: 15000 },
  { key: 'Car EMI',         icon: '🚗', group: 'Fixed',  budget: 20000 },
  { key: 'Food & Groceries',icon: '🍽️', group: 'Living', budget: 8000 },
  { key: 'Petrol',          icon: '⛽', group: 'Living', budget: 5000 },
  { key: 'Weekend Travel',  icon: '🚌', group: 'Living', budget: 4400 },
  { key: 'Girlfriend',      icon: '❤️', group: 'Living', budget: 2800 },
  { key: 'Weekday Commute', icon: '🛺', group: 'Living', budget: 1700 },
  { key: 'Parents',         icon: '👪', group: 'Living', budget: 1300 },
  { key: 'Snacks / Chips',  icon: '🍟', group: 'Living', budget: 650 },
  { key: 'Barber',          icon: '💈', group: 'Living', budget: 700 },
  { key: 'Subscriptions',   icon: '📺', group: 'Living', budget: 500 },
  { key: 'Water',           icon: '💧', group: 'Living', budget: 500 },
  { key: 'Miscellaneous',   icon: '🧾', group: 'Living', budget: 3000 },
]
export const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.key, c.icon]))
export const CAT_KEYS = CATEGORIES.map(c => c.key)
export const DEFAULT_BUDGETS = Object.fromEntries(CATEGORIES.map(c => [c.key, c.budget]))
export const METHODS = ['UPI', 'Cash', 'Card', 'AutoPay']
export const TAX_SECTIONS = ['', '80C', '80CCD(1B) NPS', '80D Health', 'HRA / Rent', 'Donations 80G']
export const TAX_LIMITS = { '80C': 150000, '80CCD(1B) NPS': 50000, '80D Health': 25000 }

export const DEFAULT_PRESETS = [
  { id: 'p1', label: 'Auto to office', category: 'Weekday Commute', amount: 120, method: 'UPI' },
  { id: 'p2', label: 'Chips', category: 'Snacks / Chips', amount: 300, method: 'UPI' },
  { id: 'p3', label: 'Dinner w/ GF', category: 'Girlfriend', amount: 400, method: 'UPI' },
  { id: 'p4', label: 'Weekend bus', category: 'Weekend Travel', amount: 500, method: 'Cash' },
  { id: 'p5', label: 'Petrol', category: 'Petrol', amount: 500, method: 'Card' },
  { id: 'p6', label: 'Metro', category: 'Weekend Travel', amount: 50, method: 'UPI' },
]

export const DEFAULT_SETTINGS = {
  salary: DEFAULT_SALARY,
  budgets: { ...DEFAULT_BUDGETS },
  recurring: [],
  presets: DEFAULT_PRESETS,
  goals: [{ id: 'g1', name: 'Emergency Fund', target: 150000 }],
  bills: [],                         // {id,label,category,amount,day}
  subscriptions: [],                 // {id,name,amount,cycle,renewDay,active}
  loan: { name: 'Car Loan', principal: 0, rate: 9.1, emi: 20000, extra: 0 },
  netWorth: [],                      // [{date, assets, liabilities, net}]
  rollover: false,
  theme: 'light',
  pin: '',
  cloud: { url: '', key: '', table: 'paisa', syncId: '', enabled: false },
  lastCategory: 'Food & Groceries',
  lastMethod: 'UPI',
  dismissedRecurring: [],
}

export function mergeSettings(stored) {
  if (!stored || typeof stored !== 'object') return structuredClone(DEFAULT_SETTINGS)
  const goals = Array.isArray(stored.goals) ? stored.goals
    : stored.goal ? [{ id: 'g1', ...stored.goal }] : DEFAULT_SETTINGS.goals
  return {
    ...DEFAULT_SETTINGS, ...stored,
    budgets: { ...DEFAULT_BUDGETS, ...(stored.budgets || {}) },
    goals,
    bills: Array.isArray(stored.bills) ? stored.bills : [],
    subscriptions: Array.isArray(stored.subscriptions) ? stored.subscriptions : [],
    loan: { ...DEFAULT_SETTINGS.loan, ...(stored.loan || {}) },
    netWorth: Array.isArray(stored.netWorth) ? stored.netWorth : [],
    cloud: { ...DEFAULT_SETTINGS.cloud, ...(stored.cloud || {}) },
    presets: stored.presets?.length ? stored.presets : DEFAULT_PRESETS,
    recurring: Array.isArray(stored.recurring) ? stored.recurring : [],
  }
}

export const COLORS = ['#2563EB','#0EA5A4','#F59E0B','#7C3AED','#16A34A','#EC4899','#F97316','#64748B','#0891B2','#65A30D','#9333EA','#DC2626','#14B8A6','#A16207']
export const METHOD_COLOR = { UPI: '#2563EB', Cash: '#16A34A', Card: '#F59E0B', AutoPay: '#7C3AED' }

export const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')
export const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
export const monthOf = (iso) => (iso || '').slice(0, 7)
export const curMonth = () => todayISO().slice(0, 7)
const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const monthLabel = (ym) => { if (!ym) return ''; const [y, m] = ym.split('-'); return `${MN[+m - 1]} ${y}` }
export const monthShort = (ym) => { if (!ym) return ''; const [y, m] = ym.split('-'); return `${MN[+m - 1]} '${y.slice(2)}` }
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
export function addMonths(ym, d) { let [y, m] = ym.split('-').map(Number); m += d; while (m < 1) { m += 12; y-- } while (m > 12) { m -= 12; y++ } return `${y}-${String(m).padStart(2, '0')}` }
export const daysInMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate() }
export function fyOf(iso) { const [y, m] = iso.split('-').map(Number); return m >= 4 ? `${y}-${y + 1}` : `${y - 1}-${y}` }
export const curFY = () => fyOf(todayISO())

export function buildReport(entries, settings, ym) {
  const rows = entries.filter(e => monthOf(e.date) === ym)
  const allExp = rows.filter(e => e.type === 'expense' || !e.type)
  const personal = allExp.filter(e => !e.reimbursable)
  const lent = allExp.filter(e => e.reimbursable)
  const incomes = rows.filter(e => e.type === 'income')
  const savings = rows.filter(e => e.type === 'saving')
  const extraIncome = incomes.reduce((s, e) => s + +e.amount || 0, 0)
  const income = (+settings.salary || 0) + extraIncome
  const totalSpent = personal.reduce((s, e) => s + (+e.amount || 0), 0)
  const lentTotal = lent.reduce((s, e) => s + (+e.amount || 0), 0)
  const lentOutstanding = lent.filter(e => !e.settled).reduce((s, e) => s + (+e.amount || 0), 0)
  const savedToGoal = savings.reduce((s, e) => s + (+e.amount || 0), 0)
  const byCat = {}, byMethod = {}
  for (const e of personal) { byCat[e.category] = (byCat[e.category] || 0) + (+e.amount || 0); byMethod[e.method || 'Other'] = (byMethod[e.method || 'Other'] || 0) + (+e.amount || 0) }
  const totalBudget = CAT_KEYS.reduce((s, k) => s + (+settings.budgets[k] || 0), 0)
  const catRows = CAT_KEYS.map(k => { const budget = +settings.budgets[k] || 0, actual = byCat[k] || 0; return { key: k, icon: CAT_ICON[k], budget, actual, variance: budget - actual, left: budget - actual } }).filter(r => r.budget > 0 || r.actual > 0)
  const saved = income - totalSpent
  return { ym, income, extraIncome, totalSpent, totalBudget, saved, savingsRate: income > 0 ? saved / income * 100 : 0, lentTotal, lentOutstanding, savedToGoal, catRows, byMethod, personal, lent, incomes, savings }
}

export function buildTrend(entries, settings, months = 6) {
  const end = curMonth(); const out = []
  for (let i = months - 1; i >= 0; i--) { const ym = addMonths(end, -i); const r = buildReport(entries, settings, ym); out.push({ ym, label: monthShort(ym), Income: Math.round(r.income), Spent: Math.round(r.totalSpent), Saved: Math.round(r.saved) }) }
  return out
}

export function goalSaved(entries, goalId) {
  return entries.filter(e => e.type === 'saving' && (e.goalId === goalId || (!e.goalId && goalId === 'g1'))).reduce((s, e) => s + (+e.amount || 0), 0)
}

// frozen summary stored when a period is archived ("close month & start fresh")
export function archiveSummary(entries, settings) {
  const exp = entries.filter(e => (e.type === 'expense' || !e.type) && !e.reimbursable)
  const spent = exp.reduce((s, e) => s + (+e.amount || 0), 0)
  const incomeEntries = entries.filter(e => e.type === 'income').reduce((s, e) => s + (+e.amount || 0), 0)
  const savings = entries.filter(e => e.type === 'saving').reduce((s, e) => s + (+e.amount || 0), 0)
  const lent = entries.filter(e => e.reimbursable).reduce((s, e) => s + (+e.amount || 0), 0)
  const dates = entries.map(e => e.date).filter(Boolean).sort()
  const months = new Set(entries.map(e => monthOf(e.date))).size || 1
  const income = incomeEntries + (+settings.salary || 0) * months
  const byCat = {}
  for (const e of exp) byCat[e.category] = (byCat[e.category] || 0) + (+e.amount || 0)
  const byMethod = {}
  for (const e of exp) byMethod[e.method || 'Other'] = (byMethod[e.method || 'Other'] || 0) + (+e.amount || 0)
  const catRows = Object.entries(byCat).map(([key, actual]) => ({ key, icon: CAT_ICON[key] || '🧾', actual })).sort((a, b) => b.actual - a.actual)
  return { from: dates[0] || '', to: dates[dates.length - 1] || '', months, count: entries.length, income, spent, saved: income - spent, savingsRate: income > 0 ? (income - spent) / income * 100 : 0, savings, lent, catRows, byMethod }
}

// receivables: who owes you (from reimbursable + split 'owed')
export function receivables(entries) {
  const map = {}
  for (const e of entries) {
    if (e.settled) continue
    const owed = e.reimbursable ? +e.amount || 0 : (+e.owed || 0)
    if (owed > 0) { const who = e.owedBy || (e.reimbursable ? (e.note || 'someone') : 'someone'); (map[who] ||= { total: 0, since: e.date, items: 0 }); map[who].total += owed; map[who].items++; if (e.date < map[who].since) map[who].since = e.date }
  }
  return Object.entries(map).map(([who, v]) => ({ who, ...v })).sort((a, b) => b.total - a.total)
}

export function loanSchedule(loan) {
  if (!loan?.principal || !loan?.emi) return null
  const r = (+loan.rate || 0) / 100 / 12
  const sim = (extra) => { let bal = +loan.principal, m = 0, int = 0; const pay = +loan.emi + (extra || 0); if (pay <= bal * r) return { impossible: true }; while (bal > 0 && m < 1200) { const i = bal * r; int += i; bal = bal + i - pay; m++ } return { m, int } }
  const a = sim(+loan.extra || 0), b = sim(0)
  if (a.impossible || b.impossible) return { impossible: true }
  return { months: a.m, interest: a.int, monthsNoExtra: b.m, interestNoExtra: b.int, monthsSaved: b.m - a.m, interestSaved: b.int - a.int, payoff: addMonths(curMonth(), a.m) }
}

export function taxSummary(entries, settings, fy = curFY()) {
  const rows = entries.filter(e => (e.type === 'expense' || !e.type) && fyOf(e.date) === fy)
  const bySec = {}
  for (const e of rows) if (e.taxSection) bySec[e.taxSection] = (bySec[e.taxSection] || 0) + (+e.amount || 0)
  const rent = rows.filter(e => e.category === 'Rent').reduce((s, e) => s + (+e.amount || 0), 0)
  if (rent > 0) bySec['HRA / Rent'] = (bySec['HRA / Rent'] || 0) + rent
  return { fy, bySec }
}

export function dayHeat(entries, ym) {
  const n = daysInMonth(ym); const arr = Array.from({ length: n }, (_, i) => ({ day: i + 1, amt: 0 }))
  for (const e of entries) if (monthOf(e.date) === ym && (e.type === 'expense' || !e.type) && !e.reimbursable) { const d = +e.date.slice(8) - 1; if (arr[d]) arr[d].amt += +e.amount || 0 }
  return arr
}

export function weekendSplit(entries, ym) {
  let we = 0, wd = 0
  for (const e of entries) if (monthOf(e.date) === ym && (e.type === 'expense' || !e.type) && !e.reimbursable) { const dt = new Date(e.date); const day = dt.getDay(); (day === 0 || day === 5 || day === 6 ? (we += +e.amount || 0) : (wd += +e.amount || 0)) }
  return { weekend: we, weekday: wd }
}

export function monthOverMonth(entries, settings, ym) {
  const cur = buildReport(entries, settings, ym), prev = buildReport(entries, settings, addMonths(ym, -1))
  const cats = CAT_KEYS.map(k => { const c = cur.catRows.find(x => x.key === k)?.actual || 0; const p = prev.catRows.find(x => x.key === k)?.actual || 0; return { key: k, icon: CAT_ICON[k], cur: c, prev: p, delta: c - p } }).filter(x => x.cur || x.prev).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  return { spentDelta: cur.totalSpent - prev.totalSpent, cats, prevLabel: monthShort(addMonths(ym, -1)) }
}

export function parseSMS(text) {
  if (!text) return null
  const t = text.replace(/\s+/g, ' ')
  const amtM = t.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) || t.match(/([\d,]+(?:\.\d{2}))\s*(?:debited|spent|paid)/i)
  const amount = amtM ? Number(amtM[1].replace(/,/g, '')) : ''
  const toM = t.match(/(?:to|at|towards|vpa)\s+([A-Za-z0-9 &._-]{3,30})/i)
  const dateM = t.match(/(\d{2})[-/](\d{2})[-/](\d{2,4})/)
  let date = todayISO()
  if (dateM) { let [, d, m, y] = dateM; if (y.length === 2) y = '20' + y; date = `${y}-${m}-${d}` }
  const credit = /credited|received|refund/i.test(t)
  return { amount, note: (toM ? toM[1].trim() : '').slice(0, 30), date, type: credit ? 'income' : 'expense' }
}

export function suggestCategory(note, entries) {
  if (!note || note.length < 3) return null
  const w = note.toLowerCase()
  const hits = entries.filter(e => (e.type === 'expense' || !e.type) && e.note && w.split(' ').some(t => t.length > 2 && e.note.toLowerCase().includes(t)))
  if (!hits.length) return null
  const c = {}; hits.forEach(e => c[e.category] = (c[e.category] || 0) + 1)
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]
}

// ================= v4: detection, voice, forecasting, behavioral =================
const med = (arr) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 1 }
const shiftISO = (iso, d) => { const t = new Date(iso + 'T00:00:00'); t.setDate(t.getDate() + d); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}` }

export function detectRecurring(entries, settings) {
  const dismissed = new Set(settings.dismissedRecurring || [])
  const existing = settings.recurring || []
  const exp = entries.filter(e => (e.type === 'expense' || !e.type) && !e.reimbursable)
  const g = {}
  for (const e of exp) { const amt = Math.round(+e.amount || 0); if (amt < 300) continue; const key = `${e.category}|${amt}`; (g[key] ||= { category: e.category, amount: amt, months: new Set(), count: 0, days: [] }); g[key].months.add(monthOf(e.date)); g[key].count++; g[key].days.push(+e.date.slice(8) || 1) }
  const out = []
  for (const [key, v] of Object.entries(g)) {
    if (dismissed.has(key)) continue
    const m = v.months.size
    if (m < 2 || v.count > m * 2) continue
    if (existing.some(r => r.category === v.category && Math.abs((+r.amount) - v.amount) < Math.max(50, v.amount * 0.1))) continue
    out.push({ key, category: v.category, icon: CAT_ICON[v.category] || '🧾', amount: v.amount, months: m, day: med(v.days) })
  }
  return out.sort((a, b) => b.months - a.months || b.amount - a.amount).slice(0, 6)
}

const VOICE_MAP = [
  [/auto|rickshaw|\bcab\b|uber|\bola\b|commute|office/, 'Weekday Commute'],
  [/\bbus\b|train|metro|rapido|weekend|home trip/, 'Weekend Travel'],
  [/petrol|fuel|diesel/, 'Petrol'],
  [/chips|snack|namkeen|biscuit|cola|coke/, 'Snacks / Chips'],
  [/food|lunch|dinner|breakfast|swiggy|zomato|grocery|groceries|restaurant|cafe|coffee|\btea\b|meal/, 'Food & Groceries'],
  [/girlfriend|\bgf\b|\bdate\b/, 'Girlfriend'],
  [/parent|\bmom\b|mother|\bdad\b|father/, 'Parents'],
  [/family|home/, 'Home / Family'],
  [/\brent\b|landlord/, 'Rent'],
  [/barber|haircut|salon/, 'Barber'],
  [/water|\bjar\b|\bcan\b/, 'Water'],
  [/netflix|spotify|subscription|prime|hotstar|youtube/, 'Subscriptions'],
  [/emi|loan/, 'Car EMI'],
]
export function parseVoice(text) {
  if (!text) return null
  const t = text.toLowerCase()
  const m = t.match(/(\d+(?:\.\d+)?)/)
  const amount = m ? Number(m[1]) : ''
  let category = null; for (const [re, cat] of VOICE_MAP) if (re.test(t)) { category = cat; break }
  const income = /received|got|salary|credited|refund|income|bonus/.test(t)
  const onM = t.match(/(?:on|for|to)\s+(.{2,30})/)
  return { amount, category, note: onM ? onM[1].trim() : text, type: income ? 'income' : 'expense' }
}

export function avgMonthlySpend(allEntries) {
  const exp = allEntries.filter(e => (e.type === 'expense' || !e.type) && !e.reimbursable)
  if (!exp.length) return 0
  const months = new Set(exp.map(e => monthOf(e.date)))
  return exp.reduce((s, e) => s + (+e.amount || 0), 0) / Math.max(months.size, 1)
}
export const totalSaved = (allSaving) => allSaving.filter(e => e.type === 'saving').reduce((s, e) => s + (+e.amount || 0), 0)

export function monthEndForecast(entries, settings, ym) {
  const r = buildReport(entries, settings, ym)
  const today = +todayISO().slice(8), dim = daysInMonth(ym), left = dim - today
  const dailyRate = r.totalSpent / Math.max(today, 1)
  const posted = new Set(entries.filter(e => e.recurringId && monthOf(e.date) === ym).map(e => e.recurringId))
  const unpostedRec = (settings.recurring || []).filter(x => !posted.has(x.id)).reduce((s, x) => s + (+x.amount || 0), 0)
  const projSpend = r.totalSpent + dailyRate * left + unpostedRec
  return { projSpend, projSaved: r.income - projSpend, dailyRate, left, unpostedRec, income: r.income }
}

export function streaks(entries) {
  const days = new Set(entries.filter(e => e.type !== 'income' && e.date).map(e => e.date))
  let s = 0, cur = todayISO()
  while (days.has(cur)) { s++; cur = shiftISO(cur, -1) }
  const ym = curMonth(), today = +todayISO().slice(8)
  const spendDays = new Set(entries.filter(e => monthOf(e.date) === ym && (e.type === 'expense' || !e.type) && !e.reimbursable && +e.amount > 0).map(e => e.date))
  let noSpend = 0; for (let i = 1; i <= today; i++) if (!spendDays.has(`${ym}-${String(i).padStart(2, '0')}`)) noSpend++
  return { logStreak: s, noSpend }
}

export function weeklyDigest(entries) {
  const today = todayISO(), from = shiftISO(today, -6), pFrom = shiftISO(today, -13), pTo = shiftISO(today, -7)
  const ok = e => (e.type === 'expense' || !e.type) && !e.reimbursable
  const inR = (a, b) => entries.filter(e => ok(e) && e.date >= a && e.date <= b)
  const cur = inR(from, today), prev = inR(pFrom, pTo)
  const sum = a => a.reduce((s, e) => s + (+e.amount || 0), 0)
  const byCat = {}; cur.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + (+e.amount || 0))
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
  return { spent: sum(cur), count: cur.length, top: top ? { cat: top[0], amt: top[1] } : null, delta: sum(cur) - sum(prev) }
}

export function yearReview(allEntries, settings, fy = curFY()) {
  const rows = allEntries.filter(e => fyOf(e.date) === fy)
  const exp = rows.filter(e => (e.type === 'expense' || !e.type) && !e.reimbursable)
  const spent = exp.reduce((s, e) => s + (+e.amount || 0), 0)
  const incE = rows.filter(e => e.type === 'income').reduce((s, e) => s + (+e.amount || 0), 0)
  const saved = rows.filter(e => e.type === 'saving').reduce((s, e) => s + (+e.amount || 0), 0)
  const months = new Set(rows.map(e => monthOf(e.date)))
  const byM = {}; exp.forEach(e => byM[monthOf(e.date)] = (byM[monthOf(e.date)] || 0) + (+e.amount || 0))
  const big = Object.entries(byM).sort((a, b) => b[1] - a[1])[0]
  const byCat = {}; exp.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + (+e.amount || 0))
  const topCats = Object.entries(byCat).map(([k, v]) => ({ key: k, icon: CAT_ICON[k] || '🧾', amt: v })).sort((a, b) => b.amt - a.amt).slice(0, 5)
  return { fy, income: incE + (+settings.salary || 0) * months.size, spent, saved, months: months.size, biggestMonth: big ? { ym: big[0], amt: big[1] } : null, topCats }
}

export function goalETA(saved, target, monthlyRate) {
  if (saved >= target) return { done: true, months: 0 }
  if (!monthlyRate || monthlyRate <= 0) return { months: null }
  const months = Math.ceil((target - saved) / monthlyRate)
  return { months, date: months < 600 ? addMonths(curMonth(), months) : null }
}

// ---- cloud sync (Supabase REST; activates only when configured) ----
export async function cloudPush(cloud, payload) {
  if (!cloud?.enabled || !cloud.url || !cloud.key || !cloud.syncId) throw new Error('Cloud not configured')
  const res = await fetch(`${cloud.url}/rest/v1/${cloud.table}`, {
    method: 'POST',
    headers: { apikey: cloud.key, Authorization: `Bearer ${cloud.key}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ id: cloud.syncId, data: payload, updated_at: new Date().toISOString() }]),
  })
  if (!res.ok) throw new Error('Push failed: ' + res.status + ' ' + (await res.text()).slice(0, 120))
  return true
}
export async function cloudPull(cloud) {
  if (!cloud?.url || !cloud.key || !cloud.syncId) throw new Error('Cloud not configured')
  const res = await fetch(`${cloud.url}/rest/v1/${cloud.table}?id=eq.${encodeURIComponent(cloud.syncId)}&select=data`, { headers: { apikey: cloud.key, Authorization: `Bearer ${cloud.key}` } })
  if (!res.ok) throw new Error('Pull failed: ' + res.status)
  const j = await res.json(); return j?.[0]?.data || null
}

export function useLocalStorage(key, initial, transform) {
  const [val, setVal] = useState(() => { try { const s = localStorage.getItem(key); const p = s ? JSON.parse(s) : initial; return transform ? transform(p) : p } catch { return initial } })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }, [key, val])
  return [val, setVal]
}
