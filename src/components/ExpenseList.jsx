import { useMemo, useState } from 'react'
import { monthOf, monthLabel, curMonth, inr, CAT_ICON } from '../data.js'

export default function ExpenseList({ entries, onDelete }) {
  const months = useMemo(() => {
    const s = new Set(entries.map(e => monthOf(e.date)))
    s.add(curMonth())
    return [...s].sort().reverse()
  }, [entries])
  const [ym, setYm] = useState(curMonth())
  const [q, setQ] = useState('')

  const rows = entries
    .filter(e => monthOf(e.date) === ym)
    .filter(e => !q || (e.note || '').toLowerCase().includes(q.toLowerCase()) || (e.category || '').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const spent = rows.filter(e => e.type !== 'income').reduce((s, e) => s + Number(e.amount), 0)
  const income = rows.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="stack">
      <div className="hdrow">
        <h2>History</h2>
        <select value={ym} onChange={e => setYm(e.target.value)} className="msel">
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      <input className="search" placeholder="Search note or category…" value={q} onChange={e => setQ(e.target.value)} />

      <div className="mini2">
        <div className="minicard"><span>Spent</span><b>{inr(spent)}</b></div>
        <div className="minicard"><span>Income logged</span><b className="good">{inr(income)}</b></div>
      </div>

      <div className="card">
        {rows.length === 0 && <p className="muted pad">No entries for {monthLabel(ym)}.</p>}
        <ul className="list">
          {rows.map(e => (
            <li key={e.id}>
              <span className="li-ic">{e.type === 'income' ? '💰' : (CAT_ICON[e.category] || '🧾')}</span>
              <span className="li-mid">
                <b>{e.type === 'income' ? 'Income' : e.category}</b>
                <small>{e.date} · {e.method}{e.note ? ` · ${e.note}` : ''}</small>
              </span>
              <span className={'li-amt' + (e.type === 'income' ? ' good' : '')}>{e.type === 'income' ? '+' : '−'}{inr(e.amount)}</span>
              <button className="del" title="Delete" onClick={() => onDelete(e.id)}>✕</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
