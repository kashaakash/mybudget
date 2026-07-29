import { useState } from 'react'
import { CATEGORIES, METHODS, todayISO, uid, inr } from '../data.js'

export default function AddExpense({ onAdd }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food & Groceries')
  const [method, setMethod] = useState('UPI')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')

  const save = (e) => {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) { setToast('Enter a valid amount'); return }
    onAdd({
      id: uid(), type, amount: amt,
      category: type === 'income' ? 'Income' : category,
      method, date, note: note.trim(),
    })
    setToast(`${type === 'income' ? 'Income' : 'Expense'} of ${inr(amt)} saved ✓`)
    setAmount(''); setNote('')
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="card pad">
      <h2>Add {type === 'income' ? 'Income' : 'Expense'}</h2>

      <div className="seg">
        <button className={type === 'expense' ? 'on' : ''} onClick={() => setType('expense')}>➖ Expense</button>
        <button className={type === 'income' ? 'on' : ''} onClick={() => setType('income')}>➕ Income</button>
      </div>

      <form onSubmit={save} className="form">
        <label className="amt">
          <span>Amount (₹)</span>
          <input type="number" inputMode="decimal" autoFocus placeholder="0"
            value={amount} onChange={e => setAmount(e.target.value)} />
        </label>

        {type === 'expense' && (
          <div className="field">
            <span>What did you spend on?</span>
            <div className="catgrid">
              {CATEGORIES.map(c => (
                <button type="button" key={c.key}
                  className={'catchip' + (category === c.key ? ' on' : '')}
                  onClick={() => setCategory(c.key)}>
                  <span className="ci">{c.icon}</span>{c.key}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="row2">
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Paid via</span>
            <select value={method} onChange={e => setMethod(e.target.value)}>
              {METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Note {type === 'income' ? '(e.g. Salary, Bonus, Card reimbursement)' : '(e.g. auto to office, dinner with gf)'}</span>
          <input type="text" placeholder="optional note" value={note} onChange={e => setNote(e.target.value)} />
        </label>

        <button className="btn primary big" type="submit">Save {type === 'income' ? 'Income' : 'Expense'}</button>
        {toast && <div className="toast">{toast}</div>}
      </form>
    </div>
  )
}
