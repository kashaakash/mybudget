import { useState, useEffect, lazy, Suspense } from 'react'
import { useLocalStorage, mergeSettings, monthOf, curMonth, uid, todayISO, inr } from './data.js'
import Dashboard from './components/Dashboard.jsx'
import AddExpense from './components/AddExpense.jsx'
import ExpenseList from './components/ExpenseList.jsx'
import Settings from './components/Settings.jsx'
import PinGate from './components/PinGate.jsx'

const Report = lazy(() => import('./components/Report.jsx'))
const Money = lazy(() => import('./components/Money.jsx'))

const TABS = [
  { id: 'dashboard', label: 'Home', icon: '📊' },
  { id: 'add', label: 'Add', icon: '➕' },
  { id: 'expenses', label: 'History', icon: '📜' },
  { id: 'report', label: 'Report', icon: '📈' },
  { id: 'money', label: 'Money', icon: '💰' },
  { id: 'settings', label: 'Setup', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [entries, setEntries] = useLocalStorage('paisa_entries', [])
  const [settings, setSettings] = useLocalStorage('paisa_settings', undefined, mergeSettings)
  const [editing, setEditing] = useState(null)
  const [locked, setLocked] = useState(!!settings.pin)

  useEffect(() => { document.documentElement.dataset.theme = settings.theme || 'light' }, [settings.theme])
  const toggleTheme = () => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))

  const addEntry = (e) => setEntries(prev => [e, ...prev])
  const updateEntry = (e) => setEntries(prev => prev.map(x => x.id === e.id ? e : x))
  const deleteEntry = (id) => setEntries(prev => prev.filter(x => x.id !== id))
  const patchEntry = (id, patch) => setEntries(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x))

  const go = (t) => { setTab(t); window.scrollTo(0, 0) }
  const startEdit = (entry) => { setEditing(entry); go('add') }

  const ym = curMonth()
  const unposted = (settings.recurring || []).filter(r => !entries.some(e => e.recurringId === r.id && monthOf(e.date) === ym))
  const postRecurring = () => {
    const news = unposted.map(r => ({ id: uid(), type: 'expense', amount: +r.amount || 0, category: r.category, method: r.method || 'AutoPay', date: `${ym}-${String(Math.min(+r.day || 1, +todayISO().slice(8))).padStart(2, '0')}`, note: r.note || 'recurring', recurringId: r.id }))
    setEntries(prev => [...news, ...prev])
  }

  if (locked) return <PinGate pin={settings.pin} onUnlock={() => setLocked(false)} />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brandrow">
          <div className="brand">💸 <span>Paisa</span><small>expense tracker</small></div>
          <button className="themebtn" onClick={toggleTheme} title="Toggle theme">{settings.theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
        <nav className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={'tab' + (tab === t.id ? ' active' : '')} onClick={() => { setEditing(null); go(t.id) }}>
              <span className="ti">{t.icon}</span><span className="tl">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab !== 'add' && unposted.length > 0 && (
          <div className="recurbanner">
            <span>🔁 {unposted.length} recurring not added this month ({inr(unposted.reduce((s, r) => s + (+r.amount || 0), 0))}).</span>
            <button className="btn sm primary" onClick={postRecurring}>Add them</button>
          </div>
        )}
        {tab === 'dashboard' && <Dashboard entries={entries} settings={settings} onQuickAdd={() => go('add')} onGoto={go} />}
        {tab === 'add' && <AddExpense settings={settings} setSettings={setSettings} entries={entries} editing={editing} onSave={(e) => { editing ? updateEntry(e) : addEntry(e); setEditing(null) }} onDone={() => go('dashboard')} />}
        {tab === 'expenses' && <ExpenseList entries={entries} onDelete={deleteEntry} onEdit={startEdit} onPatch={patchEntry} />}
        {tab === 'report' && <Suspense fallback={<div className="card pad muted">Loading charts…</div>}><Report entries={entries} settings={settings} /></Suspense>}
        {tab === 'money' && <Suspense fallback={<div className="card pad muted">Loading…</div>}><Money entries={entries} settings={settings} setSettings={setSettings} addEntry={addEntry} onPatch={patchEntry} /></Suspense>}
        {tab === 'settings' && <Settings settings={settings} setSettings={setSettings} entries={entries} setEntries={setEntries} onLock={() => setLocked(!!settings.pin)} />}
      </main>

      <footer className="foot">Private — data in <b>this browser</b> only (unless cloud sync is on). Back up from Setup · Built for Aakash</footer>
    </div>
  )
}
