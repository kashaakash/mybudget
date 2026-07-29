import { curMonth, monthLabel, buildReport, goalSaved, receivables, inr, COLORS, CAT_ICON, daysInMonth, todayISO } from '../data.js'

export default function Dashboard({ entries, archives = [], settings, onQuickAdd, onGoto }) {
  const allSaving = [...entries, ...archives.flatMap(a => a.entries || [])]
  const ym = curMonth()
  const r = buildReport(entries, settings, ym)
  const spentPct = r.income > 0 ? Math.min(100, (r.totalSpent / r.income) * 100) : 0
  const overBudget = r.catRows.filter(c => c.actual > c.budget && c.budget > 0)
  const topCats = [...r.catRows].filter(c => c.actual > 0).sort((a, b) => b.actual - a.actual).slice(0, 6)
  const recent = entries.slice(0, 6)
  const owed = receivables(entries)
  const owedTotal = owed.reduce((s, o) => s + o.total, 0)

  const today = +todayISO().slice(8), dim = daysInMonth(ym), daysLeft = dim - today + 1
  const budgetBase = settings.salary > 0 ? Math.min(settings.salary, r.totalBudget || settings.salary) : r.totalBudget
  const allowance = Math.max(0, (budgetBase - r.totalSpent) / Math.max(daysLeft, 1))

  const dueSoon = (settings.bills || []).map(b => {
    let dd = b.day - today; if (dd < 0) dd += dim
    return { ...b, inDays: dd }
  }).filter(b => b.inDays <= 5).sort((a, b) => a.inDays - b.inDays)

  return (
    <div className="stack">
      <div className="hdrow"><h2>{monthLabel(ym)}</h2><button className="btn primary" onClick={onQuickAdd}>+ Add</button></div>

      <div className="kpis">
        <Kpi label="Income" value={inr(r.income)} tone="ink" />
        <Kpi label="Spent" value={inr(r.totalSpent)} tone="blue" />
        <Kpi label={r.saved >= 0 ? 'Saved' : 'Overspent'} value={inr(Math.abs(r.saved))} tone={r.saved >= 0 ? 'good' : 'bad'} />
        <Kpi label="Savings rate" value={`${r.savingsRate.toFixed(0)}%`} tone={r.savingsRate >= 15 ? 'good' : r.savingsRate >= 0 ? 'warn' : 'bad'} />
      </div>

      <div className="card pad allowcard">
        <div className="between"><b>💡 Safe to spend today</b><span className="allowbig">{inr(allowance)}</span></div>
        <div className="sm muted">{daysLeft} days left · keeps you within {inr(budgetBase)} this month</div>
      </div>

      {dueSoon.length > 0 && (
        <div className="card pad warnbox">
          <b>📅 Bills due soon</b>
          <div className="chips">{dueSoon.map(b => <span className={'chip' + (b.inDays <= 1 ? ' bad' : '')} key={b.id}>{b.label} {inr(b.amount)} · {b.inDays === 0 ? 'today' : b.inDays === 1 ? 'tomorrow' : `in ${b.inDays}d`}</span>)}</div>
        </div>
      )}

      <div className="card pad">
        <div className="between"><b>Spent vs Income</b><span className="muted">{inr(r.totalSpent)} of {inr(r.income)}</span></div>
        <div className="bar"><div className="fill" style={{ width: spentPct + '%', background: spentPct > 85 ? '#DC2626' : spentPct > 70 ? '#F59E0B' : '#16A34A' }} /></div>
        <div className="sm muted">Ideal budget {inr(r.totalBudget)}</div>
      </div>

      {/* Goals */}
      <div className="card pad goalcard" onClick={() => onGoto('money')} role="button">
        {(settings.goals || []).slice(0, 2).map(g => { const saved = goalSaved(allSaving, g.id); const pct = g.target ? Math.min(100, saved / g.target * 100) : 0; return (
          <div key={g.id} style={{ marginBottom: 8 }}>
            <div className="between"><b>🎯 {g.name}</b><span className="muted">{inr(saved)} / {inr(g.target)}</span></div>
            <div className="bar"><div className="fill" style={{ width: pct + '%', background: 'linear-gradient(90deg,#0EA5A4,#16A34A)' }} /></div>
          </div>) })}
        <div className="sm muted">Tap to manage goals →</div>
      </div>

      {owedTotal > 0 && (
        <div className="card pad warnbox" onClick={() => onGoto('money')} role="button" style={{ cursor: 'pointer' }}>
          <b>💳 To collect: {inr(owedTotal)}</b>
          <div className="sm muted">{owed.slice(0, 3).map(o => `${o.who} ${inr(o.total)}`).join(' · ')}{owed.length > 3 ? ' …' : ''} — tap for details</div>
        </div>
      )}

      {overBudget.length > 0 && (
        <div className="card pad warnbox"><b>⚠️ Over budget</b>
          <div className="chips">{overBudget.map(c => <span className="chip bad" key={c.key}>{c.icon} {c.key}: {inr(c.actual)}/{inr(c.budget)}</span>)}</div>
        </div>
      )}

      <div className="grid2">
        <div className="card pad"><b>Top categories</b>
          {topCats.length === 0 && <p className="muted">No expenses yet. Tap “Add”.</p>}
          {topCats.map((c, i) => { const pct = topCats[0].actual ? c.actual / topCats[0].actual * 100 : 0; const over = c.budget > 0 && c.actual > c.budget; return (
            <div className="catline" key={c.key}><span className="cn">{c.icon} {c.key}</span><div className="minibar"><div style={{ width: pct + '%', background: over ? '#DC2626' : COLORS[i % COLORS.length] }} /></div><span className="cv">{inr(c.actual)}</span></div>) })}
        </div>
        <div className="card pad"><b>Recent activity</b>
          {recent.length === 0 && <p className="muted">Nothing logged yet.</p>}
          <ul className="recent">{recent.map(e => (
            <li key={e.id}><span>{icon(e)} {title(e)}{e.note ? ` · ${e.note}` : ''}{e.reimbursable ? ' 💳' : e.owed ? ' ➗' : ''}</span><b className={e.type === 'income' || e.type === 'saving' ? 'good' : ''}>{e.type === 'income' ? '+' : e.type === 'saving' ? '→' : '−'}{inr(e.amount)}</b></li>))}
          </ul>
        </div>
      </div>
    </div>
  )
}
const icon = (e) => e.type === 'income' ? '💰' : e.type === 'saving' ? '🏦' : (CAT_ICON[e.category] || '🧾')
const title = (e) => e.type === 'income' ? 'Income' : e.type === 'saving' ? 'Savings' : e.category
function Kpi({ label, value, tone }) { return <div className={'kpi ' + tone}><div className="kv">{value}</div><div className="kl">{label}</div></div> }
