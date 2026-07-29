import { useState, useEffect } from 'react'

// ---- Defaults derived from the forensic audit + budget we built ----
export const DEFAULT_SALARY = 93000

// group: 'Fixed' (committed) | 'Living' (variable) ; budget = ideal monthly ₹
export const CATEGORIES = [
  { key: 'Rent',            icon: '🏠', group: 'Fixed',  budget: 16000 },
  { key: 'Home / Family',   icon: '👨‍👩‍👦', group: 'Fixed',  budget: 15000 },
  { key: 'Car EMI',         icon: '🚗', group: 'Fixed',  budget: 10500 },
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

export const DEFAULT_SETTINGS = { salary: DEFAULT_SALARY, budgets: { ...DEFAULT_BUDGETS } }

export const COLORS = ['#2563EB','#0EA5A4','#F59E0B','#7C3AED','#16A34A','#EC4899',
  '#F97316','#64748B','#0891B2','#65A30D','#9333EA','#DC2626','#14B8A6','#A16207']

// ---- formatting / date helpers ----
export const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN')
export const inr1 = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })
export const todayISO = () => {
  const d = new Date(); const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}
export const monthOf = (iso) => (iso || '').slice(0, 7)          // 'YYYY-MM'
export const curMonth = () => todayISO().slice(0, 7)
export const monthLabel = (ym) => {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[Number(m) - 1]} ${y}`
}
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

// ---- localStorage hook ----
export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? JSON.parse(s) : initial
    } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
  }, [key, val])
  return [val, setVal]
}

// ---- derived report for a given month ----
export function buildReport(entries, settings, ym) {
  const rows = entries.filter(e => monthOf(e.date) === ym)
  const expenses = rows.filter(e => e.type !== 'income')
  const incomes = rows.filter(e => e.type === 'income')
  const extraIncome = incomes.reduce((s, e) => s + Number(e.amount || 0), 0)
  const income = Number(settings.salary || 0) + extraIncome
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  const byCat = {}
  for (const k of CAT_KEYS) byCat[k] = 0
  for (const e of expenses) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0)

  const totalBudget = CAT_KEYS.reduce((s, k) => s + Number(settings.budgets[k] || 0), 0)
  const catRows = CAT_KEYS.map(k => {
    const budget = Number(settings.budgets[k] || 0)
    const actual = byCat[k] || 0
    return { key: k, icon: CAT_ICON[k], budget, actual, variance: budget - actual }
  }).filter(r => r.budget > 0 || r.actual > 0)

  const saved = income - totalSpent
  const savingsRate = income > 0 ? (saved / income) * 100 : 0
  return { ym, income, extraIncome, totalSpent, totalBudget, saved, savingsRate, catRows, expenses, incomes }
}
