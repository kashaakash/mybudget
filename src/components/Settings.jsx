import { useRef, useState } from 'react'
import { CATEGORIES, DEFAULT_BUDGETS, CAT_KEYS, inr, uid, cloudPush, cloudPull, detectRecurring } from '../data.js'

export default function Settings({ settings, setSettings, entries, setEntries, archives = [], setArchives, onCloseMonth }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [closeLabel, setCloseLabel] = useState('')
  const totalBudget = CAT_KEYS.reduce((s, k) => s + (+settings.budgets[k] || 0), 0)
  const patch = (p) => setSettings(s => ({ ...s, ...p }))
  const setBudget = (k, v) => setSettings(s => ({ ...s, budgets: { ...s.budgets, [k]: +v || 0 } }))

  const listOps = (key, template) => ({
    add: () => setSettings(s => ({ ...s, [key]: [...(s[key] || []), { id: uid(), ...template }] })),
    set: (id, p) => setSettings(s => ({ ...s, [key]: s[key].map(x => x.id === id ? { ...x, ...p } : x) })),
    del: (id) => setSettings(s => ({ ...s, [key]: s[key].filter(x => x.id !== id) })),
  })
  const rec = listOps('recurring', { category: 'Rent', amount: 0, method: 'AutoPay', note: '', day: 1 })
  const pre = listOps('presets', { label: 'New', category: 'Miscellaneous', amount: 0, method: 'UPI' })
  const bill = listOps('bills', { label: 'Credit card', category: 'Miscellaneous', amount: 0, day: 5 })
  const sub = listOps('subscriptions', { name: 'Netflix', amount: 199, cycle: 'monthly', renewDay: 1, active: true })
  const goal = listOps('goals', { name: 'New goal', target: 50000 })
  const setLoan = (p) => setSettings(s => ({ ...s, loan: { ...s.loan, ...p } }))

  const allEntries = [...entries, ...archives.flatMap(a => a.entries || [])]
  const suggestions = detectRecurring(allEntries, settings)
  const addSuggestion = (s) => setSettings(st => ({ ...st, recurring: [...(st.recurring || []), { id: uid(), category: s.category, amount: s.amount, method: 'AutoPay', note: 'auto-detected', day: s.day }] }))
  const dismissSuggestion = (key) => setSettings(st => ({ ...st, dismissedRecurring: [...(st.dismissedRecurring || []), key] }))

  const exportData = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ settings, entries, archives }, null, 2)], { type: 'application/json' })); a.download = `paisa-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click() }
  const importData = (e) => { const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const d = JSON.parse(rd.result); if (d.settings) setSettings(d.settings); if (Array.isArray(d.entries)) setEntries(d.entries); if (Array.isArray(d.archives)) setArchives(d.archives); alert('Restored ✓') } catch { alert('Invalid file') } }; rd.readAsText(f) }
  const clearAll = () => { if (confirm('Delete ALL entries?')) setEntries([]) }

  const setPin = () => { const p = prompt('Set a 4-digit PIN (blank to remove):', settings.pin || ''); if (p === null) return; patch({ pin: p.trim() }); setMsg(p.trim() ? 'PIN set ✓' : 'PIN removed'); setTimeout(() => setMsg(''), 2000) }

  const cloud = settings.cloud || {}
  const setCloud = (p) => setSettings(s => ({ ...s, cloud: { ...s.cloud, ...p } }))
  const doPush = async () => { try { setMsg('Syncing…'); await cloudPush(cloud, { settings, entries, archives }); setMsg('Backed up to cloud ✓') } catch (e) { setMsg('⚠️ ' + e.message) } setTimeout(() => setMsg(''), 4000) }
  const doPull = async () => { try { setMsg('Fetching…'); const d = await cloudPull(cloud); if (d) { if (d.settings) setSettings(d.settings); if (d.entries) setEntries(d.entries); if (Array.isArray(d.archives)) setArchives(d.archives); setMsg('Restored from cloud ✓') } else setMsg('No cloud data found') } catch (e) { setMsg('⚠️ ' + e.message) } setTimeout(() => setMsg(''), 4000) }

  return (
    <div className="stack">
      <h2>Setup</h2>
      {msg && <div className="toast">{msg}</div>}

      <div className="card pad"><b>Income & security</b>
        <div className="row2" style={{ marginTop: 8 }}>
          <label className="field"><span>Monthly salary (₹)</span><input type="number" value={settings.salary} onChange={e => patch({ salary: +e.target.value || 0 })} /></label>
          <div className="field"><span>App lock</span><button className="btn" onClick={setPin}>{settings.pin ? '🔒 Change / remove PIN' : '🔓 Set a PIN'}</button></div>
        </div>
        <label className="check" style={{ marginTop: 10 }}><input type="checkbox" checked={!!settings.rollover} onChange={e => patch({ rollover: e.target.checked })} /><span>Roll unspent budget into savings view</span></label>
      </div>

      <div className="card pad">
        <b>🔄 Close month & start fresh</b>
        <p className="muted sm">Archives all current entries (kept forever & viewable in <b>Money → Archived periods</b>) and clears the active view for a clean new month. Items still <b>“to collect”</b> carry forward, and <b>goal progress is preserved</b>.</p>
        <div className="row2" style={{ marginTop: 8 }}>
          <label className="field"><span>Archive label</span><input placeholder="e.g. July 2026" value={closeLabel} onChange={e => setCloseLabel(e.target.value)} /></label>
          <div className="field"><span>&nbsp;</span>
            <button className="btn primary" onClick={() => { if (confirm('Archive all current data and start a fresh month? (Your data is kept and viewable in Money.)')) { onCloseMonth(closeLabel.trim()); setCloseLabel(''); setMsg('Archived ✓ — fresh start'); setTimeout(() => setMsg(''), 2500) } }}>Close & start new month</button>
          </div>
        </div>
        {archives.length > 0 && <div className="sm muted">{archives.length} archived period{archives.length > 1 ? 's' : ''} · view them in the Money tab.</div>}
      </div>

      <Section title="🎯 Goals" onAdd={goal.add}>
        {(settings.goals || []).map(g => (
          <div className="editrow g3" key={g.id}>
            <input value={g.name} onChange={e => goal.set(g.id, { name: e.target.value })} />
            <input type="number" placeholder="target ₹" value={g.target} onChange={e => goal.set(g.id, { target: +e.target.value || 0 })} />
            <button className="ico del" onClick={() => goal.del(g.id)}>✕</button>
          </div>
        ))}
      </Section>

      <div className="card pad"><b>🚗 Loan (for payoff tracker in Money)</b>
        <div className="row2" style={{ marginTop: 8 }}>
          <label className="field"><span>Name</span><input value={settings.loan?.name || ''} onChange={e => setLoan({ name: e.target.value })} /></label>
          <label className="field"><span>Outstanding (₹)</span><input type="number" value={settings.loan?.principal || 0} onChange={e => setLoan({ principal: +e.target.value || 0 })} /></label>
        </div>
        <div className="row3" style={{ marginTop: 8 }}>
          <label className="field"><span>Rate % p.a.</span><input type="number" step="0.1" value={settings.loan?.rate || 0} onChange={e => setLoan({ rate: +e.target.value || 0 })} /></label>
          <label className="field"><span>EMI ₹/mo</span><input type="number" value={settings.loan?.emi || 0} onChange={e => setLoan({ emi: +e.target.value || 0 })} /></label>
          <label className="field"><span>Extra prepay ₹/mo</span><input type="number" value={settings.loan?.extra || 0} onChange={e => setLoan({ extra: +e.target.value || 0 })} /></label>
        </div>
      </div>

      <div className="card pad">
        <div className="between"><b>Budget per category</b><button className="btn sm" onClick={() => setSettings(s => ({ ...s, budgets: { ...DEFAULT_BUDGETS } }))}>Reset</button></div>
        <div className="budgetgrid">{CATEGORIES.map(c => <label className="bgt" key={c.key}><span>{c.icon} {c.key} <em>{c.group}</em></span><input type="number" value={settings.budgets[c.key] ?? c.budget} onChange={e => setBudget(c.key, e.target.value)} /></label>)}</div>
        <div className="sm muted" style={{ marginTop: 8 }}>Total ideal budget: <b>{inr(totalBudget)}</b> · target savings: <b className={settings.salary - totalBudget >= 0 ? 'good' : 'bad'}>{inr(settings.salary - totalBudget)}</b></div>
      </div>

      {suggestions.length > 0 && (
        <div className="card pad">
          <b>💡 Suggested recurring (auto-detected)</b>
          <p className="muted sm">These amounts repeat across months in your history — add them as recurring so they auto-fill?</p>
          {suggestions.map(s => (
            <div className="suggrow" key={s.key}>
              <span>{s.icon} {s.category} · <b>{inr(s.amount)}</b> <span className="muted sm">seen in {s.months} months</span></span>
              <span className="suggbtns"><button className="btn sm primary" onClick={() => addSuggestion(s)}>+ Add</button><button className="ico del" title="Dismiss" onClick={() => dismissSuggestion(s.key)}>✕</button></span>
            </div>
          ))}
        </div>
      )}

      <Section title="🔁 Recurring (auto-fill each month)" onAdd={rec.add} hint="Fixed costs; a banner posts them in one tap monthly.">
        {(settings.recurring || []).map(r => (
          <div className="editrow" key={r.id}><select value={r.category} onChange={e => rec.set(r.id, { category: e.target.value })}>{CAT_KEYS.map(k => <option key={k}>{k}</option>)}</select><input type="number" placeholder="₹" value={r.amount} onChange={e => rec.set(r.id, { amount: +e.target.value || 0 })} /><input type="number" placeholder="day" min="1" max="28" value={r.day} onChange={e => rec.set(r.id, { day: +e.target.value || 1 })} /><button className="ico del" onClick={() => rec.del(r.id)}>✕</button></div>
        ))}
      </Section>

      <Section title="📅 Bill reminders" onAdd={bill.add} hint="Non-auto bills (credit card, insurance). A due-soon banner appears on Home.">
        {(settings.bills || []).map(b => (
          <div className="editrow" key={b.id}><input placeholder="label" value={b.label} onChange={e => bill.set(b.id, { label: e.target.value })} /><input type="number" placeholder="₹" value={b.amount} onChange={e => bill.set(b.id, { amount: +e.target.value || 0 })} /><input type="number" placeholder="day" min="1" max="28" value={b.day} onChange={e => bill.set(b.id, { day: +e.target.value || 1 })} /><button className="ico del" onClick={() => bill.del(b.id)}>✕</button></div>
        ))}
      </Section>

      <Section title="📺 Subscriptions" onAdd={sub.add} hint="Track renewals; duplicates get flagged in Money.">
        {(settings.subscriptions || []).map(s => (
          <div className="editrow g4" key={s.id}><input placeholder="name" value={s.name} onChange={e => sub.set(s.id, { name: e.target.value })} /><input type="number" placeholder="₹" value={s.amount} onChange={e => sub.set(s.id, { amount: +e.target.value || 0 })} /><select value={s.cycle} onChange={e => sub.set(s.id, { cycle: e.target.value })}><option value="monthly">monthly</option><option value="yearly">yearly</option></select><button className="ico del" onClick={() => sub.del(s.id)}>✕</button></div>
        ))}
      </Section>

      <Section title="⚡ Quick-add presets" onAdd={pre.add}>
        {(settings.presets || []).map(p => (
          <div className="editrow g4" key={p.id}><input placeholder="label" value={p.label} onChange={e => pre.set(p.id, { label: e.target.value })} /><select value={p.category} onChange={e => pre.set(p.id, { category: e.target.value })}>{CAT_KEYS.map(k => <option key={k}>{k}</option>)}</select><input type="number" placeholder="₹" value={p.amount} onChange={e => pre.set(p.id, { amount: +e.target.value || 0 })} /><button className="ico del" onClick={() => pre.del(p.id)}>✕</button></div>
        ))}
      </Section>

      <div className="card pad"><b>☁️ Cloud sync (optional)</b>
        <p className="muted sm">Sync across devices via a free Supabase project. Create a table <code>paisa(id text primary key, data jsonb, updated_at timestamptz)</code>, then paste your Project URL + anon key and a private Sync ID. <b>Anyone with all three can read your data</b> — keep them secret.</p>
        <label className="field"><span>Supabase URL</span><input placeholder="https://xxxx.supabase.co" value={cloud.url} onChange={e => setCloud({ url: e.target.value.trim() })} /></label>
        <label className="field"><span>anon public key</span><input value={cloud.key} onChange={e => setCloud({ key: e.target.value.trim() })} /></label>
        <div className="row2"><label className="field"><span>Sync ID (secret)</span><input value={cloud.syncId} onChange={e => setCloud({ syncId: e.target.value.trim() })} /></label><label className="field"><span>Table</span><input value={cloud.table} onChange={e => setCloud({ table: e.target.value.trim() })} /></label></div>
        <label className="check"><input type="checkbox" checked={!!cloud.enabled} onChange={e => setCloud({ enabled: e.target.checked })} /><span>Enable cloud backup</span></label>
        <div className="btnrow"><button className="btn" onClick={doPush} disabled={!cloud.enabled}>⬆ Push to cloud</button><button className="btn" onClick={doPull}>⬇ Pull from cloud</button></div>
      </div>

      <div className="card pad"><b>Backup & data</b>
        <p className="muted sm">Local data lives only in this browser. Export regularly.</p>
        <div className="btnrow"><button className="btn" onClick={exportData}>⬇ Export</button><button className="btn" onClick={() => fileRef.current?.click()}>⬆ Restore</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} /><button className="btn danger" onClick={clearAll}>🗑 Clear all</button></div>
      </div>
    </div>
  )
}

function Section({ title, hint, onAdd, children }) {
  return (
    <div className="card pad">
      <div className="between"><b>{title}</b><button className="btn sm" onClick={onAdd}>+ Add</button></div>
      {hint && <p className="muted sm">{hint}</p>}
      {children}
    </div>
  )
}
