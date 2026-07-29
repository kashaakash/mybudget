import { useState, useEffect } from 'react'

// ---- Defaults (genericized for the public repo; you set real values in-app, saved locally) ----
export const DEFAULT_SALARY = 0

// group: 'Fixed' (committed) | 'Living' (variable) ; budget = ideal monthly ₹
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
  recurring: [],                                  // [{id,category,amount,method,note,day}]
  presets: DEFAULT_PRESETS,
  goal: { name: 'Emergency Fund', target: 150000 },
  theme: 'light',
  lastCategory: 'Food & Groceries',
  lastMethod: 'UPI',
}

// merge stored settings with defaults so older data gains new fields safely
export function mergeSettings(stored) {
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_SETTINGS }
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    budgets: { ...DEFAULT_BUDGETS, ...(stored.budgets || {}) },
    goal: { ...DEFAULT_SETTINGS.goal, ...(stored.goal || {}) },
    presets: stored.presets && stored.presets.length ? stored.presets : DEFAULT_PRESETS,
    recurring: Array.isArray(stored.recurring) ? stored.recurring : [],
  }
}

export const COLORS = ['#2563EB','#0EA5A4','#F59E0B','#7C3AED','#16A34A','#EC4899',
  '#F97316','#64748B','#0891B2','#65A30D','#9333EA','#DC2626','#14B8A6','#A16207']
export const METHOD_COLOR = { UPI: '#2563EB', Cash: '#16A34A', Card: '#F59E0B', AutoPay: '#7C3AED' }

// ---- formatting / date helpers ----
export const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')
export const todayISO = () => {
  const d = new Date(); const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}
export const monthOf = (iso) => (iso || '').slice(0, 7)
export const curMonth = () => todayISO().slice(0, 7)
const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const monthLabel = (ym) => { if (!ym) return ''; const [y, m] = ym.split('-'); return `${MN[Number(m) - 1]} ${y}` }
export const monthShort = (ym) => { if (!ym) return ''; const [y, m] = ym.split('-'); return `${MN[Number(m) - 1]} '${y.slice(2)}` }
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
export function addMonths(ym, delta) {
  let [y, m] = ym.split('-').map(Number); m += delta
  while (m < 1) { m += 12; y-- } while (m > 12) { m -= 12; y++ }
  return `${y}-${String(m).padStart(2, '0')}`
}

// ---- report for a given month (handles reimbursable card-lending) ----
export function buildReport(entries, settings, ym) {
  const rows = entries.filter(e => monthOf(e.date) === ym)
  const allExp = rows.filter(e => e.type === 'expense' || !e.type)
  const personal = allExp.filter(e => !e.reimbursable)         // your real spend
  const lent = allExp.filter(e => e.reimbursable)              // spent for others
  const incomes = rows.filter(e => e.type === 'income')
  const savings = rows.filter(e => e.type === 'saving')

  const extraIncome = incomes.reduce((s, e) => s + Number(e.amount || 0), 0)
  const income = Number(settings.salary || 0) + extraIncome
  const totalSpent = personal.reduce((s, e) => s + Number(e.amount || 0), 0)
  const lentTotal = lent.reduce((s, e) => s + Number(e.amount || 0), 0)
  const lentOutstanding = lent.filter(e => !e.settled).reduce((s, e) => s + Number(e.amount || 0), 0)
  const savedToGoal = savings.reduce((s, e) => s + Number(e.amount || 0), 0)

  const byCat = {}
  for (const e of personal) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0)
  const byMethod = {}
  for (const e of personal) byMethod[e.method || 'Other'] = (byMethod[e.method || 'Other'] || 0) + Number(e.amount || 0)

  const totalBudget = CAT_KEYS.reduce((s, k) => s + Number(settings.budgets[k] || 0), 0)
  const catRows = CAT_KEYS.map(k => {
    const budget = Number(settings.budgets[k] || 0)
    const actual = byCat[k] || 0
    return { key: k, icon: CAT_ICON[k], budget, actual, variance: budget - actual, left: budget - actual }
  }).filter(r => r.budget > 0 || r.actual > 0)

  const saved = income - totalSpent
  const savingsRate = income > 0 ? (saved / income) * 100 : 0
  return {
    ym, income, extraIncome, totalSpent, totalBudget, saved, savingsRate,
    lentTotal, lentOutstanding, savedToGoal, catRows, byMethod,
    personal, lent, incomes, savings,
  }
}

// ---- multi-month trend ----
export function buildTrend(entries, settings, months = 6) {
  const end = curMonth()
  const out = []
  for (let i = months - 1; i >= 0; i--) {
    const ym = addMonths(end, -i)
    const r = buildReport(entries, settings, ym)
    out.push({ ym, label: monthShort(ym), Income: Math.round(r.income), Spent: Math.round(r.totalSpent), Saved: Math.round(r.saved) })
  }
  return out
}

// ---- goal progress (all-time savings contributions) ----
export function goalProgress(entries, settings) {
  const saved = entries.filter(e => e.type === 'saving').reduce((s, e) => s + Number(e.amount || 0), 0)
  const target = Number(settings.goal?.target || 0)
  return { saved, target, pct: target ? Math.min(100, (saved / target) * 100) : 0 }
}

// ---- localStorage hook ----
export function useLocalStorage(key, initial, transform) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key)
      const parsed = s ? JSON.parse(s) : initial
      return transform ? transform(parsed) : parsed
    } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }, [key, val])
  return [val, setVal]
}
