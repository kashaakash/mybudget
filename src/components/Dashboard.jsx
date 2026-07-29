import { curMonth, monthLabel, buildReport, goalProgress, inr, COLORS, CAT_ICON } from '../data.js'

export default function Dashboard({ entries, settings, onQuickAdd, onGoto }) {
  const ym = curMonth()
  const r = buildReport(entries, settings, ym)
  const g = goalProgress(entries, settings)
  const spentPct = r.income > 0 ? Math.min(100, (r.totalSpent / r.income) * 100) : 0
  const overBudget = r.catRows.filter(c => c.actual > c.budget && c.budget > 0)
  const topCats = [...r.catRows].filter(c => c.actual > 0).sort((a, b) => b.actual - a.actual).slice(0, 6)
  const recent = entries.slice(0, 6)
  const daysLeft = daysLeftInMonth()
  const safe = r.income > 0 ? Math.max(0, (settings.salary - r.totalSpent)) : 0

  return (
    <div className="stack">
      <div className="hdrow">
        <h2>{monthLabel(ym)}</h2>
        <button className="btn primary" onClick={onQuickAdd}>+ Add</button>
      </div>

      <div className="kpis">
        <Kpi label="Income" value={inr(r.income)} tone="ink" />
        <Kpi label="Spent" value={inr(r.totalSpent)} tone="blue" />
        <Kpi label={r.saved >= 0 ? 'Saved' : 'Overspent'} value={inr(Math.abs(r.saved))} tone={r.saved >= 0 ? 'good' : 'bad'} />
        <Kpi label="Savings rate" value={`${r.savingsRate.toFixed(0)}%`} tone={r.savingsRate >= 15 ? 'good' : r.savingsRate >= 0 ? 'warn' : 'bad'} />
      </div>

      <div className="card pad">
        <div className="between"><b>Spent vs Income</b><span className="muted">{inr(r.totalSpent)} of {inr(r.income)}</span></div>
        <div className="bar"><div className="fill" style={{ width: spentPct + '%', background: spentPct > 85 ? '#DC2626' : spentPct > 70 ? '#F59E0B' : '#16A34A' }} /></div>
        <div className="between sm muted">
          <span>Ideal budget {inr(r.totalBudget)}</span>
          <span>💡 Safe to spend rest of month: <b style={{ color: 'var(--good)' }}>{inr(safe)}</b> ({daysLeft}d left)</span>
        </div>
      </div>

      {/* Goal tracker */}
      <div className="card pad goalcard" onClick={() => onGoto('settings')} role="button">
        <div className="between"><b>🏦 {settings.goal?.name || 'Savings goal'}</b><span className="muted">{inr(g.saved)} / {inr(g.target)}</span></div>
        <div className="bar"><div className="fill" style={{ width: g.pct + '%', background: 'linear-gradient(90deg,#0EA5A4,#16A34A)' }} /></div>
        <div className="sm muted">{g.pct.toFixed(0)}% funded · log a contribution from Add → Saving</div>
      </div>

      {r.lentOutstanding > 0 && (
        <div className="card pad warnbox">
          <b>💳 To collect: {inr(r.lentOutstanding)}</b>
          <div className="sm muted">Card-lending spends this month awaiting reimbursement (not counted in your budget).</div>
        </div>
      )}

      {overBudget.length > 0 && (
        <div className="card pad warnbox">
          <b>⚠️ Over budget</b>
          <div className="chips">
            {overBudget.map(c => <span className="chip bad" key={c.key}>{c.icon} {c.key}: {inr(c.actual)}/{inr(c.budget)}</span>)}
          </div>
        </div>
      )}

      <div className="grid2">
        <div className="card pad">
          <b>Top categories</b>
          {topCats.length === 0 && <p className="muted">No expenses yet this month. Tap “Add”.</p>}
          {topCats.map((c, i) => {
            const pct = topCats[0].actual ? (c.actual / topCats[0].actual) * 100 : 0
            const over = c.budget > 0 && c.actual > c.budget
            return (
              <div className="catline" key={c.key}>
                <span className="cn">{c.icon} {c.key}</span>
                <div className="minibar"><div style={{ width: pct + '%', background: over ? '#DC2626' : COLORS[i % COLORS.length] }} /></div>
                <span className="cv">{inr(c.actual)}</span>
              </div>
            )
          })}
        </div>

        <div className="card pad">
          <b>Recent activity</b>
          {recent.length === 0 && <p className="muted">Nothing logged yet.</p>}
          <ul className="recent">
            {recent.map(e => (
              <li key={e.id}>
                <span>{icon(e)} {title(e)}{e.note ? ` · ${e.note}` : ''}{e.reimbursable ? ' 💳' : ''}</span>
                <b className={e.type === 'income' || e.type === 'saving' ? 'good' : ''}>{e.type === 'income' ? '+' : e.type === 'saving' ? '→' : '−'}{inr(e.amount)}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function icon(e) { return e.type === 'income' ? '💰' : e.type === 'saving' ? '🏦' : (CAT_ICON[e.category] || '🧾') }
function title(e) { return e.type === 'income' ? 'Income' : e.type === 'saving' ? 'Savings' : e.category }
function daysLeftInMonth() { const d = new Date(); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); return last - d.getDate() }
function Kpi({ label, value, tone }) { return <div className={'kpi ' + tone}><div className="kv">{value}</div><div className="kl">{label}</div></div> }
