import { useRef } from 'react'
import { CATEGORIES, DEFAULT_SETTINGS, inr, CAT_KEYS } from '../data.js'

export default function Settings({ settings, setSettings, entries, setEntries }) {
  const fileRef = useRef(null)
  const totalBudget = CAT_KEYS.reduce((s, k) => s + Number(settings.budgets[k] || 0), 0)
  const targetSavings = Number(settings.salary || 0) - totalBudget

  const setSalary = (v) => setSettings({ ...settings, salary: Number(v) || 0 })
  const setBudget = (k, v) => setSettings({ ...settings, budgets: { ...settings.budgets, [k]: Number(v) || 0 } })
  const resetBudget = () => setSettings({ ...DEFAULT_SETTINGS, budgets: { ...DEFAULT_SETTINGS.budgets } })

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ settings, entries }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `paisa-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importData = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const rd = new FileReader()
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result)
        if (d.settings) setSettings(d.settings)
        if (Array.isArray(d.entries)) setEntries(d.entries)
        alert('Backup restored ✓')
      } catch { alert('Invalid backup file') }
    }
    rd.readAsText(f)
  }
  const clearAll = () => { if (confirm('Delete ALL expenses? This cannot be undone.')) setEntries([]) }

  return (
    <div className="stack">
      <h2>Budget & Settings</h2>

      <div className="card pad">
        <label className="field">
          <span>Monthly salary (take-home ₹)</span>
          <input type="number" value={settings.salary} onChange={e => setSalary(e.target.value)} />
        </label>
        <div className="mini2">
          <div className="minicard"><span>Total ideal budget</span><b>{inr(totalBudget)}</b></div>
          <div className="minicard"><span>Target savings / mo</span><b className={targetSavings >= 0 ? 'good' : 'bad'}>{inr(targetSavings)}</b></div>
        </div>
      </div>

      <div className="card pad">
        <div className="between"><b>Ideal monthly budget per category</b><button className="btn sm" onClick={resetBudget}>Reset to recommended</button></div>
        <div className="budgetgrid">
          {CATEGORIES.map(c => (
            <label className="bgt" key={c.key}>
              <span>{c.icon} {c.key} <em>{c.group}</em></span>
              <input type="number" value={settings.budgets[c.key] ?? c.budget} onChange={e => setBudget(c.key, e.target.value)} />
            </label>
          ))}
        </div>
      </div>

      <div className="card pad">
        <b>Backup & data</b>
        <p className="muted sm">Your data lives only in this browser. Export a backup regularly (and before clearing browser data / switching device).</p>
        <div className="btnrow">
          <button className="btn" onClick={exportData}>⬇ Export backup (JSON)</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆ Restore backup</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
          <button className="btn danger" onClick={clearAll}>🗑 Clear all expenses</button>
        </div>
      </div>
    </div>
  )
}
