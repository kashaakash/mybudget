import { curMonth, monthLabel, buildReport, inr, COLORS } from '../data.js'

export default function Dashboard({ entries, settings, onQuickAdd }) {
  const ym = curMonth()
  const r = buildReport(entries, settings, ym)
  const spentPct = r.income > 0 ? Math.min(100, (r.totalSpent / r.income) * 100) : 0
  const overBudget = r.catRows.filter(c => c.actual > c.budget && c.budget > 0)
  const topCats = [...r.catRows].filter(c => c.actual > 0).sort((a, b) => b.actual - a.actual).slice(0, 6)
  const recent = entries.slice(0, 6)

  return (
    <div className="stack">
      <div className="hdrow">
        <h2>{monthLabel(ym)}</h2>
        <button className="btn primary" onClick={onQuickAdd}>+ Add expense</button>
      </div>

      <div className="kpis">
        <Kpi label="Income (salary + extra)" value={inr(r.income)} tone="ink" />
        <Kpi label="Spent so far" value={inr(r.totalSpent)} tone="blue" />
        <Kpi label={r.saved >= 0 ? 'Saved' : 'Overspent'} value={inr(Math.abs(r.saved))} tone={r.saved >= 0 ? 'good' : 'bad'} />
        <Kpi label="Savings rate" value={`${r.savingsRate.toFixed(0)}%`} tone={r.savingsRate >= 15 ? 'good' : r.savingsRate >= 0 ? 'warn' : 'bad'} />
      </div>

      <div className="card pad">
        <div className="between"><b>Spent vs Income</b><span className="muted">{inr(r.totalSpent)} of {inr(r.income)}</span></div>
        <div className="bar"><div className="fill" style={{ width: spentPct + '%', background: spentPct > 85 ? '#DC2626' : spentPct > 70 ? '#F59E0B' : '#16A34A' }} /></div>
        <div className="muted sm">Ideal monthly budget: {inr(r.totalBudget)} · target savings ≈ {inr(settings.salary - r.totalBudget)}</div>
      </div>

      {overBudget.length > 0 && (
        <div className="card pad warnbox">
          <b>⚠️ Over budget this month</b>
          <div className="chips">
            {overBudget.map(c => (
              <span className="chip bad" key={c.key}>{c.icon} {c.key}: {inr(c.actual)} / {inr(c.budget)}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid2">
        <div className="card pad">
          <b>Top categories</b>
          {topCats.length === 0 && <p className="muted">No expenses yet this month. Tap “Add expense”.</p>}
          {topCats.map((c, i) => {
            const pct = topCats[0].actual ? (c.actual / topCats[0].actual) * 100 : 0
            return (
              <div className="catline" key={c.key}>
                <span className="cn">{c.icon} {c.key}</span>
                <div className="minibar"><div style={{ width: pct + '%', background: COLORS[i % COLORS.length] }} /></div>
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
                <span>{e.type === 'income' ? '💰' : (e.icon || '🧾')} {e.type === 'income' ? 'Income' : e.category}{e.note ? ` · ${e.note}` : ''}</span>
                <b className={e.type === 'income' ? 'good' : ''}>{e.type === 'income' ? '+' : '−'}{inr(e.amount)}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, tone }) {
  return (
    <div className={'kpi ' + tone}>
      <div className="kv">{value}</div>
      <div className="kl">{label}</div>
    </div>
  )
}
