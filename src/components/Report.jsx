import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import { monthOf, monthLabel, curMonth, buildReport, inr, COLORS } from '../data.js'

export default function Report({ entries, settings }) {
  const months = useMemo(() => {
    const s = new Set(entries.map(e => monthOf(e.date)))
    s.add(curMonth())
    return [...s].sort().reverse()
  }, [entries])
  const [ym, setYm] = useState(curMonth())
  const r = buildReport(entries, settings, ym)

  const pieData = r.catRows.filter(c => c.actual > 0).map(c => ({ name: c.key, value: c.actual }))
  const barData = r.catRows.filter(c => c.budget > 0 || c.actual > 0)
    .map(c => ({ name: c.key, Budget: c.budget, Actual: c.actual }))

  const insights = buildInsights(r, settings)

  const exportCSV = () => {
    const lines = [['Date', 'Type', 'Category', 'Method', 'Amount', 'Note']]
    r.expenses.concat(r.incomes).sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach(e => lines.push([e.date, e.type || 'expense', e.category, e.method, e.amount, (e.note || '').replace(/,/g, ';')]))
    const csv = lines.map(l => l.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `paisa-report-${ym}.csv`
    a.click()
  }

  return (
    <div className="stack report">
      <div className="hdrow no-print">
        <h2>Monthly Report</h2>
        <div className="actions">
          <select value={ym} onChange={e => setYm(e.target.value)} className="msel">
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button className="btn" onClick={exportCSV}>⬇ CSV</button>
          <button className="btn primary" onClick={() => window.print()}>🖨 Save as PDF</button>
        </div>
      </div>

      <div className="print-title only-print"><b>Paisa — Monthly Report · {monthLabel(ym)}</b></div>

      <div className="kpis">
        <K label="Income" v={inr(r.income)} tone="ink" sub={r.extraIncome ? `salary + ${inr(r.extraIncome)} extra` : 'salary'} />
        <K label="Total spent" v={inr(r.totalSpent)} tone="blue" sub={`ideal ${inr(r.totalBudget)}`} />
        <K label={r.saved >= 0 ? 'Saved' : 'Overspent'} v={inr(Math.abs(r.saved))} tone={r.saved >= 0 ? 'good' : 'bad'} sub="income − spent" />
        <K label="Savings rate" v={`${r.savingsRate.toFixed(0)}%`} tone={r.savingsRate >= 15 ? 'good' : r.savingsRate >= 0 ? 'warn' : 'bad'} sub="target 20%+" />
      </div>

      <div className="card pad">
        <b>Budget vs Actual vs Salary</b>
        <div className="threebar">
          <TriRow label="Your salary" val={settings.salary} max={Math.max(settings.salary, r.totalSpent, r.totalBudget)} color="#16A34A" />
          <TriRow label="Ideal budget" val={r.totalBudget} max={Math.max(settings.salary, r.totalSpent, r.totalBudget)} color="#2563EB" />
          <TriRow label="Actual spend" val={r.totalSpent} max={Math.max(settings.salary, r.totalSpent, r.totalBudget)} color={r.totalSpent > settings.salary ? '#DC2626' : '#F59E0B'} />
        </div>
      </div>

      {insights.length > 0 && (
        <div className="card pad insights">
          <b>Insights</b>
          <ul>{insights.map((t, i) => <li key={i} className={t.tone}>{t.text}</li>)}</ul>
        </div>
      )}

      <div className="grid2">
        <div className="card pad">
          <b>Where it went</b>
          {pieData.length === 0 ? <p className="muted">No expenses this month.</p> :
            <div className="chartbox">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => inr(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>}
        </div>

        <div className="card pad">
          <b>Budget vs Actual by category</b>
          <div className="chartbox">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => (v / 1000) + 'k'} fontSize={11} />
                <YAxis type="category" dataKey="name" width={92} fontSize={10.5} />
                <Tooltip formatter={(v) => inr(v)} />
                <Legend />
                <Bar dataKey="Budget" fill="#94A3B8" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Actual" fill="#2563EB" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr><th>Category</th><th className="n">Budget</th><th className="n">Actual</th><th className="n">Variance</th><th>Status</th></tr></thead>
          <tbody>
            {r.catRows.map(c => (
              <tr key={c.key}>
                <td>{c.icon} {c.key}</td>
                <td className="n">{inr(c.budget)}</td>
                <td className="n">{inr(c.actual)}</td>
                <td className={'n ' + (c.variance < 0 ? 'bad' : 'good')}>{c.variance < 0 ? '−' : '+'}{inr(Math.abs(c.variance))}</td>
                <td>{c.budget === 0 ? '—' : c.actual <= c.budget ? <span className="pill good">on track</span> : <span className="pill bad">over</span>}</td>
              </tr>
            ))}
            <tr className="tot">
              <td>Total</td>
              <td className="n">{inr(r.totalBudget)}</td>
              <td className="n">{inr(r.totalSpent)}</td>
              <td className={'n ' + (r.totalBudget - r.totalSpent < 0 ? 'bad' : 'good')}>{r.totalBudget - r.totalSpent < 0 ? '−' : '+'}{inr(Math.abs(r.totalBudget - r.totalSpent))}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function buildInsights(r, settings) {
  const out = []
  if (r.income > 0) {
    if (r.savingsRate >= 20) out.push({ tone: 'good', text: `Excellent — you saved ${r.savingsRate.toFixed(0)}% (${inr(r.saved)}) this month, above the 20% target.` })
    else if (r.savingsRate >= 0) out.push({ tone: 'warn', text: `You saved ${r.savingsRate.toFixed(0)}% (${inr(r.saved)}). Aim for 20% (${inr(settings.salary * 0.2)}/mo) by trimming the over-budget categories below.` })
    else out.push({ tone: 'bad', text: `You overspent by ${inr(-r.saved)} this month — expenses exceeded income.` })
  }
  const over = r.catRows.filter(c => c.budget > 0 && c.actual > c.budget)
    .sort((a, b) => (b.actual - b.budget) - (a.actual - a.budget))
  over.slice(0, 3).forEach(c =>
    out.push({ tone: 'bad', text: `${c.icon} ${c.key}: ${inr(c.actual)} vs ${inr(c.budget)} budget — ${inr(c.actual - c.budget)} over.` }))
  const commute = r.catRows.find(c => c.key === 'Weekday Commute')
  if (commute && commute.actual > 2500) out.push({ tone: 'warn', text: `Commute is ${inr(commute.actual)} — remember the ₹30 local auto / your own car beats the ₹120 door pickup.` })
  const chips = r.catRows.find(c => c.key === 'Snacks / Chips')
  if (chips && chips.actual > 900) out.push({ tone: 'warn', text: `Snacks hit ${inr(chips.actual)} — the ₹300/week chips habit adds up to ~₹15k/year.` })
  return out
}

function K({ label, v, tone, sub }) {
  return <div className={'kpi ' + tone}><div className="kv">{v}</div><div className="kl">{label}</div>{sub && <div className="ks">{sub}</div>}</div>
}
function TriRow({ label, val, max, color }) {
  const pct = max ? (val / max) * 100 : 0
  return (
    <div className="trirow">
      <span className="trl">{label}</span>
      <div className="trbar"><div style={{ width: pct + '%', background: color }} /></div>
      <span className="trv">{inr(val)}</span>
    </div>
  )
}
