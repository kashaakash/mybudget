import { useState, useRef } from 'react'
import { CATEGORIES, METHODS, TAX_SECTIONS, todayISO, uid, inr, parseSMS, parseVoice, suggestCategory, CAT_KEYS } from '../data.js'

export default function AddExpense({ settings, setSettings, entries, editing, onSave, onDone }) {
  const isEdit = !!editing
  const [type, setType] = useState(editing?.type || 'expense')
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [category, setCategory] = useState(editing?.category || settings.lastCategory || 'Food & Groceries')
  const [method, setMethod] = useState(editing?.method || settings.lastMethod || 'UPI')
  const [date, setDate] = useState(editing?.date || todayISO())
  const [note, setNote] = useState(editing?.note || '')
  const [reimbursable, setReimbursable] = useState(!!editing?.reimbursable)
  const [split, setSplit] = useState(!!editing?.owed)
  const [total, setTotal] = useState(editing?.owed ? String((+editing.amount) + (+editing.owed)) : '')
  const [owedBy, setOwedBy] = useState(editing?.owedBy || '')
  const [taxSection, setTaxSection] = useState(editing?.taxSection || '')
  const [receipt, setReceipt] = useState(editing?.receipt || '')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteTxt, setPasteTxt] = useState('')
  const [sugg, setSugg] = useState(null)
  const [toast, setToast] = useState('')
  const [listening, setListening] = useState(false)
  const [payPrompt, setPayPrompt] = useState(null)
  const fileRef = useRef(null)
  const recRef = useRef(null)

  const startVoice = () => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) { setToast('Voice input not supported in this browser'); setTimeout(() => setToast(''), 2500); return }
    const rec = new SR(); recRef.current = rec; rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1
    rec.onresult = (ev) => {
      const txt = ev.results[0][0].transcript; const p = parseVoice(txt); if (!p) return
      if (p.amount) setAmount(String(p.amount))
      if (p.type === 'income') setType('income')
      if (p.category) setCategory(p.category)
      else { const g = suggestCategory(p.note, entries); if (g) setCategory(g) }
      if (p.note) setNote(p.note)
      setToast(`Heard: “${txt}” — check & save`); setTimeout(() => setToast(''), 3000)
    }
    rec.onerror = () => { setListening(false); setToast('Didn’t catch that, try again'); setTimeout(() => setToast(''), 2000) }
    rec.onend = () => setListening(false)
    setListening(true); rec.start()
  }

  const commit = (entry) => { onSave(entry); if (type !== 'saving') setSettings(s => ({ ...s, lastCategory: entry.category, lastMethod: entry.method })) }

  const doPaste = () => {
    const p = parseSMS(pasteTxt); if (!p) return
    if (p.amount) setAmount(String(p.amount))
    if (p.note) { setNote(p.note); const g = suggestCategory(p.note, entries); if (g) setCategory(g) }
    if (p.date) setDate(p.date)
    if (p.type === 'income') setType('income')
    setPasteOpen(false); setPasteTxt('')
    setToast('Parsed from message — check & save'); setTimeout(() => setToast(''), 2500)
  }

  const onNote = (v) => { setNote(v); if (type === 'expense') { const g = suggestCategory(v, entries); setSugg(g && g !== category ? g : null) } }

  const pickReceipt = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const rd = new FileReader()
    rd.onload = () => { const img = new Image(); img.onload = () => { const s = 700 / Math.max(img.width, img.height, 700); const c = document.createElement('canvas'); c.width = img.width * Math.min(s, 1); c.height = img.height * Math.min(s, 1); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); setReceipt(c.toDataURL('image/jpeg', 0.6)) }; img.src = rd.result }
    rd.readAsDataURL(f)
  }

  const save = (e) => {
    e?.preventDefault?.()
    const amt = Number(amount); if (!amt || amt <= 0) { setToast('Enter a valid amount'); return }
    const owed = split ? Math.max(0, (Number(total) || 0) - amt) : 0
    const entry = {
      id: editing?.id || uid(), type, amount: amt,
      category: type === 'income' ? 'Income' : type === 'saving' ? 'Savings' : category,
      method, date, note: note.trim(),
      ...(type === 'expense' ? { reimbursable, settled: editing?.settled || false, owed, owedBy: (split || reimbursable) ? owedBy.trim() : '', taxSection, receipt } : {}),
      ...(type === 'saving' ? { goalId: editing?.goalId || settings.goals?.[0]?.id } : {}),
      ...(editing?.recurringId ? { recurringId: editing.recurringId } : {}),
    }
    commit(entry)
    if (isEdit) return onDone()
    // pay-yourself-first: offer to move target savings to a goal after logging income
    if (type === 'income') {
      const budgetTotal = CAT_KEYS.reduce((s, k) => s + (+settings.budgets[k] || 0), 0)
      const suggest = Math.max(0, Math.round((+settings.salary || amt) - budgetTotal) || Math.round(amt * 0.2))
      const goal = settings.goals?.[0]
      if (goal && suggest > 0) setPayPrompt({ amount: suggest, goalId: goal.id, goalName: goal.name })
    }
    setToast(`${label(type)} ${inr(amt)} saved ✓`)
    setAmount(''); setNote(''); setReimbursable(false); setSplit(false); setTotal(''); setOwedBy(''); setTaxSection(''); setReceipt(''); setSugg(null)
    setTimeout(() => setToast(''), 2000)
  }

  const usePreset = (p) => { commit({ id: uid(), type: 'expense', amount: +p.amount, category: p.category, method: p.method, date: todayISO(), note: p.label, reimbursable: false, settled: false, owed: 0 }); setToast(`${p.label} · ${inr(p.amount)} ✓`); setTimeout(() => setToast(''), 1800) }

  return (
    <div className="stack">
      {payPrompt && (
        <div className="card pad payfirst">
          <b>🏦 Pay yourself first</b>
          <p className="sm">Move your planned savings <b>{inr(payPrompt.amount)}</b> to “{payPrompt.goalName}” now — before it gets spent.</p>
          <div className="btnrow">
            <button className="btn primary sm" onClick={() => { onSave({ id: uid(), type: 'saving', amount: payPrompt.amount, category: 'Savings', method: 'UPI', date: todayISO(), note: payPrompt.goalName, goalId: payPrompt.goalId }); setPayPrompt(null); setToast('Moved to savings ✓'); setTimeout(() => setToast(''), 2000) }}>Move {inr(payPrompt.amount)}</button>
            <button className="btn sm" onClick={() => setPayPrompt(null)}>Not now</button>
          </div>
        </div>
      )}
      {!isEdit && type === 'expense' && (
        <div className="card pad">
          <div className="between"><b>⚡ Quick add</b><div className="qa-actions"><button className={'btn sm' + (listening ? ' listening' : '')} onClick={startVoice} disabled={listening}>{listening ? '🎙️ Listening…' : '🎙️ Voice'}</button><button className="btn sm" onClick={() => setPasteOpen(o => !o)}>📩 Paste SMS</button></div></div>
          {pasteOpen && (
            <div className="pastebox">
              <textarea rows={3} placeholder="Paste a bank / UPI SMS here…" value={pasteTxt} onChange={e => setPasteTxt(e.target.value)} />
              <button className="btn primary sm" onClick={doPaste}>Extract</button>
            </div>
          )}
          <div className="presets">
            {(settings.presets || []).map(p => <button key={p.id} className="preset" onClick={() => usePreset(p)}><b>{p.label}</b><span>{inr(p.amount)}</span></button>)}
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
          <label className="amt"><span>{split ? 'Your share (₹)' : 'Amount (₹)'}</span>
            <input type="number" inputMode="decimal" autoFocus placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} /></label>

          {type === 'expense' && (
            <div className="field">
              <span>Category {sugg && <button type="button" className="suggpill" onClick={() => { setCategory(sugg); setSugg(null) }}>use “{sugg}” ↵</button>}</span>
              <div className="catgrid">{CATEGORIES.map(c => <button type="button" key={c.key} className={'catchip' + (category === c.key ? ' on' : '')} onClick={() => setCategory(c.key)}><span className="ci">{c.icon}</span>{c.key}</button>)}</div>
            </div>
          )}

          <div className="row2">
            <label className="field"><span>Date</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label className="field"><span>Paid via</span><select value={method} onChange={e => setMethod(e.target.value)}>{METHODS.map(m => <option key={m}>{m}</option>)}</select></label>
          </div>

          <label className="field"><span>Note</span><input type="text" placeholder="optional note" value={note} onChange={e => onNote(e.target.value)} /></label>

          {type === 'expense' && (
            <>
              <div className="checkrow">
                <label className="check"><input type="checkbox" checked={split} onChange={e => { setSplit(e.target.checked); if (e.target.checked) setReimbursable(false) }} /><span>➗ Split — I paid, others owe me a part</span></label>
                <label className="check"><input type="checkbox" checked={reimbursable} onChange={e => { setReimbursable(e.target.checked); if (e.target.checked) setSplit(false) }} /><span>💳 Fully someone else's (card-lending)</span></label>
              </div>
              {split && <div className="row2"><label className="field"><span>Total bill (₹)</span><input type="number" value={total} onChange={e => setTotal(e.target.value)} /></label><label className="field"><span>Who owes you</span><input type="text" placeholder="name" value={owedBy} onChange={e => setOwedBy(e.target.value)} /></label></div>}
              {split && total && amount && <div className="sm muted">They owe you <b>{inr((+total || 0) - (+amount || 0))}</b> — tracked in Money → Who owes me.</div>}
              {reimbursable && <label className="field"><span>Who will repay</span><input type="text" placeholder="name" value={owedBy} onChange={e => setOwedBy(e.target.value)} /></label>}
              <div className="row2">
                <label className="field"><span>Tax section (optional)</span><select value={taxSection} onChange={e => setTaxSection(e.target.value)}>{TAX_SECTIONS.map(s => <option key={s} value={s}>{s || 'none'}</option>)}</select></label>
                <div className="field"><span>Receipt</span>
                  {receipt ? <div className="rcpt"><img src={receipt} alt="receipt" /><button type="button" className="ico del" onClick={() => setReceipt('')}>✕</button></div>
                    : <button type="button" className="btn" onClick={() => fileRef.current?.click()}>📷 Attach photo</button>}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickReceipt} />
                </div>
              </div>
            </>
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
