import { type FormEvent, useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { login } from './api'
import { LanguageSwitcher, useI18n } from './i18n'
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
  const { t } = useI18n()
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
      setError(t('auth.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <LanguageSwitcher />
        <div className="feature-icon"><LockKeyhole /></div>
        <p className="eyebrow">{t('auth.eyebrow')}</p>
        <h1>{t('auth.title')}</h1>
        <p>{t('auth.copy')}</p>
        <div className="demo-logins">
          {demoUsers.map((user, index) => (
            <button key={user.email} onClick={() => { setEmail(user.email); setPassword(user.password) }}>
              <ShieldCheck size={15} /> {index === 0 ? t('auth.admin') : index === 1 ? t('auth.dispatcher') : t('auth.customer')}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="auth-form">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="primary" disabled={busy}>{busy ? t('auth.signing') : t('auth.enter')}</button>
          <button className="ghost" type="button" onClick={onBack}>{t('auth.back')}</button>
        </form>
        {error && <p className="api-error">{error}</p>}
      </section>
    </main>
  )
}
