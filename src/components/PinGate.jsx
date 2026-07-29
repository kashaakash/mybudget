import { useState } from 'react'

export default function PinGate({ pin, onUnlock }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)
  const submit = (e) => { e.preventDefault(); if (val === pin) onUnlock(); else { setErr(true); setVal('') } }
  return (
    <div className="pingate">
      <div className="pinbox">
        <div className="pinlogo">💸</div>
        <h2>Paisa is locked</h2>
        <p className="muted">Enter your PIN to continue</p>
        <form onSubmit={submit}>
          <input type="password" inputMode="numeric" autoFocus value={val} className={err ? 'err' : ''}
            onChange={e => { setVal(e.target.value); setErr(false) }} placeholder="••••" />
          {err && <div className="bad sm">Wrong PIN, try again</div>}
          <button className="btn primary big" type="submit">Unlock</button>
        </form>
      </div>
    </div>
  )
}
