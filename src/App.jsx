import { useState } from 'react'
import { useLocalStorage, DEFAULT_SETTINGS } from './data.js'
import Dashboard from './components/Dashboard.jsx'
import AddExpense from './components/AddExpense.jsx'
import ExpenseList from './components/ExpenseList.jsx'
import Report from './components/Report.jsx'
import Settings from './components/Settings.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'add', label: 'Add', icon: '➕' },
  { id: 'expenses', label: 'History', icon: '📜' },
  { id: 'report', label: 'Report', icon: '📈' },
  { id: 'settings', label: 'Budget', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [entries, setEntries] = useLocalStorage('paisa_entries', [])
  const [settings, setSettings] = useLocalStorage('paisa_settings', DEFAULT_SETTINGS)

  const addEntry = (e) => setEntries(prev => [e, ...prev])
  const deleteEntry = (id) => setEntries(prev => prev.filter(x => x.id !== id))

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">💸 <span>Paisa</span><small>expense tracker</small></div>
        <nav className="tabs">
          {TABS.map(t => (
            <button key={t.id}
              className={'tab' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}>
              <span className="ti">{t.icon}</span><span className="tl">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'dashboard' && <Dashboard entries={entries} settings={settings} onQuickAdd={() => setTab('add')} />}
        {tab === 'add' && <AddExpense onAdd={(e) => { addEntry(e); }} />}
        {tab === 'expenses' && <ExpenseList entries={entries} onDelete={deleteEntry} />}
        {tab === 'report' && <Report entries={entries} settings={settings} />}
        {tab === 'settings' && <Settings settings={settings} setSettings={setSettings} entries={entries} setEntries={setEntries} />}
      </main>

      <footer className="foot">
        Data is stored privately in <b>this browser only</b> (localStorage). Back it up from the Budget tab · Built for Aakash
      </footer>
    </div>
  )
}
