import { type FormEvent, useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { login } from './api'
import type { AuthSession } from './types'

type Props = {
  onAuthenticated: (session: AuthSession) => void
  onBack: () => void
}

const demoUsers = [
  { label: 'Admin', email: 'admin@droneops.demo', password: 'AdminDemo!2026' },
  { label: 'Dispatcher', email: 'dispatcher@droneops.demo', password: 'DispatchDemo!2026' },
  { label: 'Customer', email: 'customer@droneops.demo', password: 'CustomerDemo!2026' },
]

export function AuthView({ onAuthenticated, onBack }: Props) {
  const [email, setEmail] = useState(demoUsers[0].email)
  const [password, setPassword] = useState(demoUsers[0].password)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      onAuthenticated(await login(email, password))
    } catch {
      setError('Login failed. Check the selected demo credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="feature-icon"><LockKeyhole /></div>
        <p className="eyebrow">Secure Operations Console</p>
        <h1>Sign in to manage fleet operations</h1>
        <p>Public booking stays open. Fleet changes, dispatch and geofence management require an authenticated role.</p>
        <div className="demo-logins">
          {demoUsers.map((user) => (
            <button key={user.email} onClick={() => { setEmail(user.email); setPassword(user.password) }}>
              <ShieldCheck size={15} /> {user.label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="auth-form">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="primary" disabled={busy}>{busy ? 'Signing in...' : 'Enter Control Center'}</button>
          <button className="ghost" type="button" onClick={onBack}>Back to landing</button>
        </form>
        {error && <p className="api-error">{error}</p>}
      </section>
    </main>
  )
}
