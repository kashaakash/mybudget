import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, LineChart, Line
} from 'recharts'
import {
  monthOf, monthLabel, curMonth, buildReport, buildTrend, inr, COLORS, METHOD_COLOR
} from '../data.js'

export default function Report({ entries, settings }) {
  const months = useMemo(() => {
    const s = new Set(entries.map(e => monthOf(e.date))); s.add(curMonth())
    return [...s].sort().reverse()
  }, [entries])
  const [ym, setYm] = useState(curMonth())
  const [drill, setDrill] = useState(null)
  const r = buildReport(entries, settings, ym)
  const trend = useMemo(() => buildTrend(entries, settings, 6), [entries, settings])

  const pieData = r.catRows.filter(c => c.actual > 0).map(c => ({ name: c.key, value: c.actual }))
  const barData = r.catRows.filter(c => c.budget > 0 || c.actual > 0).map(c => ({ name: c.key, Budget: c.budget, Actual: c.actual }))
  const methodData = Object.entries(r.byMethod).map(([name, value]) => ({ name, value }))
  const insights = buildInsights(r, settings)
  const drillRows = drill ? r.personal.filter(e => e.category === drill).sort((a, b) => (a.date < b.date ? 1 : -1)) : []

  const exportCSV = () => {
    const lines = [['Date', 'Type', 'Category', 'Method', 'Amount', 'Reimbursable', 'Note']]
    entries.filter(e => monthOf(e.date) === ym).sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach(e => lines.push([e.date, e.type || 'expense', e.category, e.method, e.amount, e.reimbursable ? 'yes' : '', (e.note || '').replace(/,/g, ';')]))
    const blob = new Blob([lines.map(l => l.join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `paisa-${ym}.csv`; a.click()
  }

  return (
    <div className="stack report">
      <div className="hdrow no-print">
        <h2>Report</h2>
        <div className="actions">
          <select value={ym} onChange={e => setYm(e.target.value)} className="msel">
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button className="btn" onClick={exportCSV}>⬇ CSV</button>
          <button className="btn primary" onClick={() => window.print()}>🖨 PDF</button>
        </div>
      </div>
      <div className="print-title only-print"><b>Paisa — {monthLabel(ym)}</b></div>

      <div className="kpis">
        <K label="Income" v={inr(r.income)} tone="ink" sub={r.extraIncome ? `+${inr(r.extraIncome)} extra` : 'salary'} />
        <K label="Spent" v={inr(r.totalSpent)} tone="blue" sub={`budget ${inr(r.totalBudget)}`} />
        <K label={r.saved >= 0 ? 'Saved' : 'Overspent'} v={inr(Math.abs(r.saved))} tone={r.saved >= 0 ? 'good' : 'bad'} sub="income − spent" />
        <K label="Savings rate" v={`${r.savingsRate.toFixed(0)}%`} tone={r.savingsRate >= 15 ? 'good' : r.savingsRate >= 0 ? 'warn' : 'bad'} sub="target 20%+" />
      </div>

      {/* Trend */}
      <div className="card pad">
        <b>6-month trend</b>
        <div className="chartbox">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend} margin={{ left: 4, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis tickFormatter={v => (v / 1000) + 'k'} fontSize={11} />
              <Tooltip formatter={v => inr(v)} />
              <Legend />
              <Line type="monotone" dataKey="Income" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Spent" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Saved" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card pad">
        <b>Budget vs Actual vs Salary</b>
        <div className="threebar">
          <TriRow label="Salary" val={settings.salary} max={mx(settings, r)} color="#16A34A" />
          <TriRow label="Ideal budget" val={r.totalBudget} max={mx(settings, r)} color="#2563EB" />
          <TriRow label="Actual spend" val={r.totalSpent} max={mx(settings, r)} color={r.totalSpent > settings.salary ? '#DC2626' : '#F59E0B'} />
        </div>
      </div>

      {insights.length > 0 && (
        <div className="card pad insights"><b>Insights</b>
          <ul>{insights.map((t, i) => <li key={i} className={t.tone}>{t.text}</li>)}</ul>
        </div>
      )}

      <div className="grid2">
        <div className="card pad">
          <b>Where it went</b>
          {pieData.length === 0 ? <p className="muted">No expenses this month.</p> :
            <div className="chartbox"><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => inr(v)} />
              </PieChart></ResponsiveContainer></div>}
        </div>
        <div className="card pad">
          <b>By payment method</b>
          {methodData.length === 0 ? <p className="muted">—</p> :
            <div className="chartbox"><ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={2}>
                  {methodData.map((m, i) => <Cell key={i} fill={METHOD_COLOR[m.name] || COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={v => inr(v)} /><Legend />
              </PieChart></ResponsiveContainer></div>}
        </div>
      </div>

      <div className="card pad">
        <b>Budget vs Actual by category</b>
        <div className="chartbox"><ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
            <XAxis type="number" tickFormatter={v => (v / 1000) + 'k'} fontSize={11} />
            <YAxis type="category" dataKey="name" width={92} fontSize={10} />
            <Tooltip formatter={v => inr(v)} /><Legend />
            <Bar dataKey="Budget" fill="#94A3B8" radius={[0, 3, 3, 0]} />
            <Bar dataKey="Actual" fill="#2563EB" radius={[0, 3, 3, 0]} />
          </BarChart></ResponsiveContainer></div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr><th>Category</th><th className="n">Budget</th><th className="n">Actual</th><th className="n">Left</th><th>Status</th></tr></thead>
          <tbody>
            {r.catRows.map(c => (
              <tr key={c.key} className="clickrow" onClick={() => setDrill(drill === c.key ? null : c.key)}>
                <td>{c.icon} {c.key} {c.actual > 0 && <span className="muted sm">›</span>}</td>
                <td className="n">{inr(c.budget)}</td>
                <td className="n">{inr(c.actual)}</td>
                <td className={'n ' + (c.left < 0 ? 'bad' : 'good')}>{c.left < 0 ? '−' : ''}{inr(Math.abs(c.left))}</td>
                <td>{c.budget === 0 ? '—' : c.actual <= c.budget ? <span className="pill good">on track</span> : <span className="pill bad">over</span>}</td>
              </tr>
            ))}
            <tr className="tot"><td>Total</td><td className="n">{inr(r.totalBudget)}</td><td className="n">{inr(r.totalSpent)}</td>
              <td className={'n ' + (r.totalBudget - r.totalSpent < 0 ? 'bad' : 'good')}>{inr(Math.abs(r.totalBudget - r.totalSpent))}</td><td></td></tr>
          </tbody>
        </table>
      </div>

      {r.lentTotal > 0 && (
        <div className="card pad">
          <b>💳 Card-lending (excluded from your budget)</b>
          <div className="sm muted">Total lent {inr(r.lentTotal)} · outstanding to collect <b>{inr(r.lentOutstanding)}</b></div>
        </div>
      )}

      {drill && (
        <div className="modal no-print" onClick={() => setDrill(null)}>
          <div className="modalcard" onClick={e => e.stopPropagation()}>
            <div className="between"><b>{drill} — {monthLabel(ym)}</b><button className="ico" onClick={() => setDrill(null)}>✕</button></div>
            <ul className="list">
              {drillRows.length === 0 && <li className="muted">No transactions.</li>}
              {drillRows.map(e => (
                <li key={e.id}><span className="li-mid"><b>{inr(e.amount)}</b><small>{e.date} · {e.method}{e.note ? ` · ${e.note}` : ''}</small></span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

const mx = (s, r) => Math.max(Number(s.salary) || 0, r.totalSpent, r.totalBudget, 1)

function buildInsights(r, settings) {
  const out = []
  if (r.income > 0) {
    if (r.savingsRate >= 20) out.push({ tone: 'good', text: `Excellent — saved ${r.savingsRate.toFixed(0)}% (${inr(r.saved)}), above the 20% target.` })
    else if (r.savingsRate >= 0) out.push({ tone: 'warn', text: `Saved ${r.savingsRate.toFixed(0)}% (${inr(r.saved)}). Aim for 20% (${inr(settings.salary * 0.2)}/mo).` })
    else out.push({ tone: 'bad', text: `Overspent by ${inr(-r.saved)} — expenses exceeded income.` })
  }
  r.catRows.filter(c => c.budget > 0 && c.actual > c.budget).sort((a, b) => (b.actual - b.budget) - (a.actual - a.budget)).slice(0, 3)
    .forEach(c => out.push({ tone: 'bad', text: `${c.icon} ${c.key}: ${inr(c.actual)} vs ${inr(c.budget)} — ${inr(c.actual - c.budget)} over.` }))
  const commute = r.catRows.find(c => c.key === 'Weekday Commute')
  if (commute && commute.actual > 2500) out.push({ tone: 'warn', text: `Commute ${inr(commute.actual)} — the ₹30 local auto / your car beats the ₹120 pickup.` })
  const chips = r.catRows.find(c => c.key === 'Snacks / Chips')
  if (chips && chips.actual > 900) out.push({ tone: 'warn', text: `Snacks ${inr(chips.actual)} — ~₹15k/year at this rate.` })
  if (r.lentOutstanding > 0) out.push({ tone: 'warn', text: `${inr(r.lentOutstanding)} of card-lending still to collect from friends.` })
  return out
}

function K({ label, v, tone, sub }) { return <div className={'kpi ' + tone}><div className="kv">{v}</div><div className="kl">{label}</div>{sub && <div className="ks">{sub}</div>}</div> }
function TriRow({ label, val, max, color }) {
  const pct = max ? (val / max) * 100 : 0
  return <div className="trirow"><span className="trl">{label}</span><div className="trbar"><div style={{ width: pct + '%', background: color }} /></div><span className="trv">{inr(val)}</span></div>
}
