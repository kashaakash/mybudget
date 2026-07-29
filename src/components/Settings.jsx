import { useRef, useState } from 'react'
import { CATEGORIES, DEFAULT_SETTINGS, DEFAULT_BUDGETS, DEFAULT_PRESETS, METHODS, CAT_KEYS, inr, uid } from '../data.js'

export default function Settings({ settings, setSettings, entries, setEntries }) {
  const fileRef = useRef(null)
  const totalBudget = CAT_KEYS.reduce((s, k) => s + Number(settings.budgets[k] || 0), 0)
  const targetSavings = Number(settings.salary || 0) - totalBudget

  const patch = (p) => setSettings(s => ({ ...s, ...p }))
  const setBudget = (k, v) => setSettings(s => ({ ...s, budgets: { ...s.budgets, [k]: Number(v) || 0 } }))
  const resetBudget = () => setSettings(s => ({ ...s, budgets: { ...DEFAULT_BUDGETS } }))

  // recurring
  const addRecurring = () => setSettings(s => ({ ...s, recurring: [...(s.recurring || []), { id: uid(), category: 'Rent', amount: 0, method: 'AutoPay', note: '', day: 1 }] }))
  const setRec = (id, p) => setSettings(s => ({ ...s, recurring: s.recurring.map(r => r.id === id ? { ...r, ...p } : r) }))
  const delRec = (id) => setSettings(s => ({ ...s, recurring: s.recurring.filter(r => r.id !== id) }))

  // presets
  const addPreset = () => setSettings(s => ({ ...s, presets: [...(s.presets || []), { id: uid(), label: 'New', category: 'Miscellaneous', amount: 0, method: 'UPI' }] }))
  const setPre = (id, p) => setSettings(s => ({ ...s, presets: s.presets.map(x => x.id === id ? { ...x, ...p } : x) }))
  const delPre = (id) => setSettings(s => ({ ...s, presets: s.presets.filter(x => x.id !== id) }))

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ settings, entries }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `paisa-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  const importData = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const rd = new FileReader()
    rd.onload = () => { try { const d = JSON.parse(rd.result); if (d.settings) setSettings(d.settings); if (Array.isArray(d.entries)) setEntries(d.entries); alert('Backup restored ✓') } catch { alert('Invalid backup file') } }
    rd.readAsText(f)
  }
  const clearAll = () => { if (confirm('Delete ALL entries? This cannot be undone.')) setEntries([]) }

  return (
    <div className="stack">
      <h2>Setup</h2>

      <div className="card pad">
        <b>Income & savings goal</b>
        <div className="row2" style={{ marginTop: 8 }}>
          <label className="field"><span>Monthly salary (₹)</span>
            <input type="number" value={settings.salary} onChange={e => patch({ salary: Number(e.target.value) || 0 })} /></label>
          <label className="field"><span>Goal target (₹)</span>
            <input type="number" value={settings.goal?.target || 0} onChange={e => patch({ goal: { ...settings.goal, target: Number(e.target.value) || 0 } })} /></label>
        </div>
        <label className="field"><span>Goal name</span>
          <input type="text" value={settings.goal?.name || ''} onChange={e => patch({ goal: { ...settings.goal, name: e.target.value } })} /></label>
        <div className="mini2">
          <div className="minicard"><span>Total ideal budget</span><b>{inr(totalBudget)}</b></div>
          <div className="minicard"><span>Target savings/mo</span><b className={targetSavings >= 0 ? 'good' : 'bad'}>{inr(targetSavings)}</b></div>
        </div>
      </div>

      <div className="card pad">
        <div className="between"><b>Monthly budget per category</b><button className="btn sm" onClick={resetBudget}>Reset</button></div>
        <div className="budgetgrid">
          {CATEGORIES.map(c => (
            <label className="bgt" key={c.key}><span>{c.icon} {c.key} <em>{c.group}</em></span>
              <input type="number" value={settings.budgets[c.key] ?? c.budget} onChange={e => setBudget(c.key, e.target.value)} /></label>
          ))}
        </div>
      </div>

      <div className="card pad">
        <div className="between"><b>🔁 Recurring (auto-fill each month)</b><button className="btn sm" onClick={addRecurring}>+ Add</button></div>
        <p className="muted sm">Fixed costs like rent, EMIs, subscriptions. A banner lets you post them in one tap each month.</p>
        {(settings.recurring || []).length === 0 && <p className="muted sm">None yet. Add your rent, car EMI, subscriptions…</p>}
        {(settings.recurring || []).map(r => (
          <div className="editrow" key={r.id}>
            <select value={r.category} onChange={e => setRec(r.id, { category: e.target.value })}>{CAT_KEYS.map(k => <option key={k}>{k}</option>)}</select>
            <input type="number" placeholder="₹" value={r.amount} onChange={e => setRec(r.id, { amount: Number(e.target.value) || 0 })} />
            <input type="number" placeholder="day" min="1" max="28" title="day of month" value={r.day} onChange={e => setRec(r.id, { day: Number(e.target.value) || 1 })} />
            <button className="ico del" onClick={() => delRec(r.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="card pad">
        <div className="between"><b>⚡ Quick-add presets</b><button className="btn sm" onClick={addPreset}>+ Add</button></div>
        {(settings.presets || []).map(p => (
          <div className="editrow" key={p.id}>
            <input type="text" placeholder="label" value={p.label} onChange={e => setPre(p.id, { label: e.target.value })} />
            <select value={p.category} onChange={e => setPre(p.id, { category: e.target.value })}>{CAT_KEYS.map(k => <option key={k}>{k}</option>)}</select>
            <input type="number" placeholder="₹" value={p.amount} onChange={e => setPre(p.id, { amount: Number(e.target.value) || 0 })} />
            <button className="ico del" onClick={() => delPre(p.id)}>✕</button>
          </div>
        ))}
      </div>

      <div className="card pad">
        <b>Backup & data</b>
        <p className="muted sm">Data lives only in this browser. Export regularly (and before clearing browser data / switching device).</p>
        <div className="btnrow">
          <button className="btn" onClick={exportData}>⬇ Export backup</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆ Restore</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
          <button className="btn danger" onClick={clearAll}>🗑 Clear all</button>
        </div>
      </div>
    </div>
  )
}
