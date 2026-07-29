import { useMemo, useState } from 'react'
import { monthOf, monthLabel, curMonth, inr, CAT_ICON, METHODS } from '../data.js'

export default function ExpenseList({ entries, onDelete, onEdit, onPatch }) {
  const months = useMemo(() => {
    const s = new Set(entries.map(e => monthOf(e.date))); s.add(curMonth())
    return [...s].sort().reverse()
  }, [entries])
  const [ym, setYm] = useState(curMonth())
  const [q, setQ] = useState('')
  const [method, setMethod] = useState('All')

  const rows = entries
    .filter(e => monthOf(e.date) === ym)
    .filter(e => method === 'All' || e.method === method)
    .filter(e => !q || (e.note || '').toLowerCase().includes(q.toLowerCase()) || (e.category || '').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const spent = rows.filter(e => (e.type === 'expense' || !e.type) && !e.reimbursable).reduce((s, e) => s + Number(e.amount), 0)
  const income = rows.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="stack">
      <div className="hdrow">
        <h2>History</h2>
        <select value={ym} onChange={e => setYm(e.target.value)} className="msel">
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      <div className="filters">
        <input className="search" placeholder="Search note or category…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="msel" value={method} onChange={e => setMethod(e.target.value)}>
          <option>All</option>{METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div className="mini2">
        <div className="minicard"><span>Spent</span><b>{inr(spent)}</b></div>
        <div className="minicard"><span>Income logged</span><b className="good">{inr(income)}</b></div>
      </div>

      <div className="card">
        {rows.length === 0 && <p className="muted pad">No entries for {monthLabel(ym)}.</p>}
        <ul className="list">
          {rows.map(e => (
            <li key={e.id}>
              <span className="li-ic">{e.type === 'income' ? '💰' : e.type === 'saving' ? '🏦' : (CAT_ICON[e.category] || '🧾')}</span>
              <span className="li-mid">
                <b>{e.type === 'income' ? 'Income' : e.type === 'saving' ? 'Savings' : e.category}
                  {e.reimbursable && <span className={'tag ' + (e.settled ? 'ok' : 'warn')}>{e.settled ? 'collected' : 'to collect'}</span>}</b>
                <small>{e.date} · {e.method}{e.note ? ` · ${e.note}` : ''}</small>
              </span>
              <span className={'li-amt' + (e.type === 'income' || e.type === 'saving' ? ' good' : '')}>
                {e.type === 'income' ? '+' : e.type === 'saving' ? '→' : '−'}{inr(e.amount)}</span>
              <div className="li-act">
                {e.reimbursable && <button className="ico" title={e.settled ? 'Mark not collected' : 'Mark collected'} onClick={() => onPatch(e.id, { settled: !e.settled })}>{e.settled ? '↩' : '✓'}</button>}
                <button className="ico" title="Edit" onClick={() => onEdit(e)}>✎</button>
                <button className="ico del" title="Delete" onClick={() => onDelete(e.id)}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
