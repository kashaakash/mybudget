import { useState } from 'react'
import {
  loanSchedule, receivables, taxSummary, TAX_LIMITS, goalSaved,
  monthLabel, monthShort, inr, uid, todayISO, curFY
} from '../data.js'

export default function Money({ entries, archives = [], settings, setSettings, addEntry, onRestore, onDelete }) {
  const allSaving = [...entries, ...archives.flatMap(a => a.entries || [])]
  const loan = loanSchedule(settings.loan)
  const owed = receivables(entries)
  const tax = taxSummary(entries, settings)
  const nw = settings.netWorth || []
  const latestNW = nw[nw.length - 1]
  const [assets, setAssets] = useState(latestNW ? String(latestNW.assets) : '')
  const [liab, setLiab] = useState(latestNW ? String(latestNW.liabilities) : '')

  const snapNW = () => {
    const a = +assets || 0, l = +liab || 0
    setSettings(s => ({ ...s, netWorth: [...(s.netWorth || []).filter(x => x.date !== todayISO()), { date: todayISO(), assets: a, liabilities: l, net: a - l }] }))
  }
  const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000)

  return (
    <div className="stack">
      <h2>Money</h2>

      {/* Goals */}
      <div className="card pad">
        <b>🎯 Goals</b>
        {(settings.goals || []).map(g => {
          const saved = goalSaved(allSaving, g.id); const pct = g.target ? Math.min(100, saved / g.target * 100) : 0
          return (
            <div key={g.id} className="goalline">
              <div className="between"><span>{g.name}</span><span className="muted">{inr(saved)} / {inr(g.target)}</span></div>
              <div className="bar"><div className="fill" style={{ width: pct + '%', background: 'linear-gradient(90deg,#0EA5A4,#16A34A)' }} /></div>
              <div className="between sm"><span className="muted">{pct.toFixed(0)}% funded</span>
                <button className="btn sm" onClick={() => { const v = prompt(`Add to “${g.name}” (₹)`); const n = Number(v); if (n > 0) addEntry({ id: uid(), type: 'saving', amount: n, category: 'Savings', method: 'UPI', date: todayISO(), note: g.name, goalId: g.id }) }}>+ Contribute</button></div>
            </div>
          )
        })}
      </div>

      {/* Loan payoff */}
      <div className="card pad">
        <b>🚗 {settings.loan?.name || 'Loan'} payoff</b>
        {!loan ? <p className="muted sm">Set your loan outstanding, rate & EMI in Setup to see payoff projection.</p>
          : loan.impossible ? <p className="bad sm">EMI is too low to ever clear this balance at that rate — increase the EMI.</p>
          : (
            <>
              <div className="mini2">
                <div className="minicard"><span>Outstanding</span><b>{inr(settings.loan.principal)}</b></div>
                <div className="minicard"><span>Payoff by</span><b>{monthLabel(loan.payoff)}</b></div>
              </div>
              {(+settings.loan.extra || 0) > 0 ? (
                <div className="callout good">Prepaying <b>{inr(settings.loan.extra)}/mo</b> extra → finishes <b>{loan.monthsSaved} months</b> early and saves <b>{inr(loan.interestSaved)}</b> interest.</div>
              ) : (
                <div className="callout">At ₹{Number(settings.loan.emi).toLocaleString('en-IN')}/mo you finish in <b>{loan.months} months</b>. Set an “extra prepay” in Setup to see savings.</div>
              )}
              <div className="sm muted">Total interest remaining: {inr(loan.interest)}</div>
            </>
          )}
      </div>

      {/* Who owes me */}
      <div className="card pad">
        <b>💳 Who owes me</b>
        {owed.length === 0 ? <p className="muted sm">Nobody owes you right now. Mark split / card-lending expenses and they show here.</p> : (
          <ul className="list">
            {owed.map(o => (
              <li key={o.who}>
                <span className="li-ic">🧑</span>
                <span className="li-mid"><b>{o.who || 'Someone'}</b><small>{o.items} item{o.items > 1 ? 's' : ''} · oldest {daysSince(o.since)} days ago</small></span>
                <span className="li-amt bad">{inr(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
        {owed.length > 0 && <div className="sm muted" style={{ marginTop: 6 }}>Mark items “collected” in History once repaid.</div>}
      </div>

      {/* Net worth */}
      <div className="card pad">
        <b>📈 Net worth</b>
        {latestNW && <div className="nwbig">{inr(latestNW.net)}<span className="sm muted"> as of {latestNW.date}</span></div>}
        <div className="row2" style={{ marginTop: 8 }}>
          <label className="field"><span>Assets (bank + investments) ₹</span><input type="number" value={assets} onChange={e => setAssets(e.target.value)} /></label>
          <label className="field"><span>Liabilities (loans + card) ₹</span><input type="number" value={liab} onChange={e => setLiab(e.target.value)} /></label>
        </div>
        <button className="btn primary sm" onClick={snapNW}>Save snapshot</button>
        {nw.length > 1 && (
          <div className="nwtrend">{nw.slice(-6).map(s => (
            <div key={s.date} className="nwbar"><div className="nwfill" style={{ height: Math.max(4, Math.min(100, s.net / Math.max(...nw.map(x => Math.abs(x.net)), 1) * 100)) + '%' }} /><span>{monthShort(s.date.slice(0, 7))}</span></div>
          ))}</div>
        )}
      </div>

      {/* Subscriptions */}
      <div className="card pad">
        <b>📺 Subscriptions</b>
        {(settings.subscriptions || []).length === 0 ? <p className="muted sm">Add your subscriptions in Setup (Netflix, Spotify, Jio…) to track renewals & spot duplicates.</p> : (
          <>
            <ul className="list">
              {settings.subscriptions.map(s => (
                <li key={s.id}>
                  <span className="li-ic">{s.active === false ? '⏸️' : '▶️'}</span>
                  <span className="li-mid"><b>{s.name}</b><small>{s.cycle || 'monthly'} · renews day {s.renewDay || '—'}</small></span>
                  <span className="li-amt">{inr(s.amount)}{s.cycle === 'yearly' ? '/yr' : '/mo'}</span>
                </li>
              ))}
            </ul>
            <div className="sm muted">Monthly total ≈ <b>{inr((settings.subscriptions || []).filter(s => s.active !== false).reduce((t, s) => t + (s.cycle === 'yearly' ? (+s.amount || 0) / 12 : +s.amount || 0), 0))}</b></div>
            {dupWarn(settings.subscriptions)}
          </>
        )}
      </div>

      {/* Archived periods */}
      <div className="card pad">
        <b>📦 Archived periods</b>
        {archives.length === 0 ? <p className="muted sm">Close a month in Setup → it's archived here (kept forever, fully viewable) and the active view resets to a fresh start.</p> : (
          archives.map(a => { const s = a.summary || {}; return (
            <details className="arch" key={a.id}>
              <summary><b>{a.label}</b><span className="muted sm"> · {s.count || 0} txns · spent {inr(s.spent || 0)} · saved {inr(s.saved || 0)}</span></summary>
              <div className="archbody">
                <div className="mini2">
                  <div className="minicard"><span>Income</span><b>{inr(s.income || 0)}</b></div>
                  <div className="minicard"><span>Saved</span><b className={(s.saved || 0) >= 0 ? 'good' : 'bad'}>{inr(s.saved || 0)} · {(s.savingsRate || 0).toFixed(0)}%</b></div>
                </div>
                {(s.from || s.to) && <div className="sm muted">{s.from} → {s.to} · {s.months} month(s) · closed {a.closedAt}</div>}
                <table className="tbl"><tbody>{(s.catRows || []).slice(0, 12).map(c => <tr key={c.key}><td>{c.icon} {c.key}</td><td className="n">{inr(c.actual)}</td></tr>)}</tbody></table>
                <div className="btnrow">
                  <button className="btn sm" onClick={() => exportArchive(a)}>⬇ CSV</button>
                  <button className="btn sm" onClick={() => { if (confirm(`Restore “${a.label}” back into the active view?`)) onRestore(a.id) }}>↩ Restore</button>
                  <button className="btn sm danger" onClick={() => { if (confirm(`Permanently delete archive “${a.label}”? (Export a backup first if unsure.)`)) onDelete(a.id) }}>🗑 Delete</button>
                </div>
              </div>
            </details>
          ) })
        )}
      </div>

      {/* Tax helper */}
      <div className="card pad">
        <b>🧾 Tax helper — FY {tax.fy}</b>
        <p className="muted sm">Tag expenses with a tax section (in Add) and they total here for ITR.</p>
        <table className="tbl"><thead><tr><th>Section</th><th className="n">Claimed</th><th className="n">Limit</th></tr></thead><tbody>
          {Object.keys({ ...TAX_LIMITS, 'HRA / Rent': 1, 'Donations 80G': 1 }).map(sec => (
            <tr key={sec}><td>{sec}</td><td className="n">{inr(tax.bySec[sec] || 0)}</td><td className="n">{TAX_LIMITS[sec] ? inr(TAX_LIMITS[sec]) : '—'}</td></tr>
          ))}
        </tbody></table>
      </div>
    </div>
  )
}

function exportArchive(a) {
  const L = [['Date', 'Type', 'Category', 'Method', 'Amount', 'Reimbursable', 'Owed', 'Note']]
  ;(a.entries || []).slice().sort((x, y) => (x.date < y.date ? 1 : -1)).forEach(e => L.push([e.date, e.type || 'expense', e.category, e.method, e.amount, e.reimbursable ? 'yes' : '', e.owed || '', (e.note || '').replace(/,/g, ';')]))
  const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([L.map(l => l.join(',')).join('\n')], { type: 'text/csv' })); el.download = `paisa-archive-${a.label}.csv`; el.click()
}

function dupWarn(subs) {
  const names = {}; subs.forEach(s => { const k = (s.name || '').toLowerCase().trim(); if (k) names[k] = (names[k] || 0) + 1 })
  const dups = Object.entries(names).filter(([, n]) => n > 1).map(([k]) => k)
  if (!dups.length) return null
  return <div className="callout warn" style={{ marginTop: 8 }}>⚠️ Possible duplicate subscriptions: {dups.join(', ')} — you may be paying twice.</div>
}
