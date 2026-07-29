import { useState } from 'react'
import { CATEGORIES, METHODS, todayISO, uid, inr } from '../data.js'

export default function AddExpense({ settings, setSettings, editing, onSave, onDone }) {
  const isEdit = !!editing
  const [type, setType] = useState(editing?.type || 'expense')
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [category, setCategory] = useState(editing?.category || settings.lastCategory || 'Food & Groceries')
  const [method, setMethod] = useState(editing?.method || settings.lastMethod || 'UPI')
  const [date, setDate] = useState(editing?.date || todayISO())
  const [note, setNote] = useState(editing?.note || '')
  const [reimbursable, setReimbursable] = useState(!!editing?.reimbursable)
  const [toast, setToast] = useState('')

  const commit = (entry) => {
    onSave(entry)
    if (type !== 'saving') setSettings(s => ({ ...s, lastCategory: entry.category, lastMethod: entry.method }))
  }

  const save = (e) => {
    e?.preventDefault?.()
    const amt = Number(amount)
    if (!amt || amt <= 0) { setToast('Enter a valid amount'); return }
    const entry = {
      id: editing?.id || uid(), type, amount: amt,
      category: type === 'income' ? 'Income' : type === 'saving' ? 'Savings' : category,
      method, date, note: note.trim(),
      ...(type === 'expense' ? { reimbursable, settled: editing?.settled || false } : {}),
      ...(editing?.recurringId ? { recurringId: editing.recurringId } : {}),
    }
    commit(entry)
    if (isEdit) { onDone(); return }
    setToast(`${label(type)} of ${inr(amt)} saved ✓`)
    setAmount(''); setNote(''); setReimbursable(false)
    setTimeout(() => setToast(''), 2200)
  }

  const usePreset = (p) => {
    commit({ id: uid(), type: 'expense', amount: Number(p.amount), category: p.category, method: p.method, date: todayISO(), note: p.label, reimbursable: false, settled: false })
    setToast(`${p.label} · ${inr(p.amount)} added ✓`)
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="stack">
      {!isEdit && type === 'expense' && (settings.presets || []).length > 0 && (
        <div className="card pad">
          <b>⚡ Quick add</b>
          <div className="presets">
            {settings.presets.map(p => (
              <button key={p.id} className="preset" onClick={() => usePreset(p)}>
                <b>{p.label}</b><span>{inr(p.amount)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card pad">
        <h2>{isEdit ? 'Edit' : 'Add'} {label(type)}</h2>

        {!isEdit && (
          <div className="seg tri">
            <button className={type === 'expense' ? 'on' : ''} onClick={() => setType('expense')}>➖ Expense</button>
            <button className={type === 'income' ? 'on' : ''} onClick={() => setType('income')}>💰 Income</button>
            <button className={type === 'saving' ? 'on' : ''} onClick={() => setType('saving')}>🏦 Saving</button>
          </div>
        )}

        <form onSubmit={save} className="form">
          <label className="amt">
            <span>Amount (₹)</span>
            <input type="number" inputMode="decimal" autoFocus placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
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
            <label className="field"><span>Date</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label className="field"><span>Paid via</span>
              <select value={method} onChange={e => setMethod(e.target.value)}>{METHODS.map(m => <option key={m}>{m}</option>)}</select></label>
          </div>

          <label className="field"><span>Note</span>
            <input type="text" placeholder="optional note" value={note} onChange={e => setNote(e.target.value)} /></label>

          {type === 'expense' && (
            <label className="check">
              <input type="checkbox" checked={reimbursable} onChange={e => setReimbursable(e.target.checked)} />
              <span>💳 Someone else's spend on my card (reimbursable) — excluded from my budget</span>
            </label>
          )}

          <button className="btn primary big" type="submit">{isEdit ? 'Update' : 'Save'} {label(type)}</button>
          {isEdit && <button type="button" className="btn big" onClick={onDone}>Cancel</button>}
          {toast && <div className="toast">{toast}</div>}
        </form>
      </div>
    </div>
  )
}

const label = (t) => t === 'income' ? 'Income' : t === 'saving' ? 'Saving' : 'Expense'
