import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')

    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password })

      if (result.error) throw result.error
      if (mode === 'signup' && !result.data.session) {
        setMessage('Check your inbox to confirm your email, then sign in.')
      }
    } catch (requestError) {
      setError(requestError.message || 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <a className="wordmark" href="/" aria-label="ReplyAI home">
          <span className="brand-mark">R</span> replyai
        </a>
        <div className="auth-story-copy">
          <p className="eyebrow">CONVERSATIONS, ON AUTOPILOT</p>
          <h1>Every message deserves a thoughtful reply.</h1>
          <p>Bring your Instagram and Facebook conversations together. Reply faster, stay on brand, and never miss an opportunity.</p>
        </div>
        <div className="auth-story-foot">Built for the people behind the brand.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">WELCOME TO REPLYAI</p>
          <h2>{mode === 'login' ? 'Good to see you.' : 'Create your account.'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Sign in to continue to your workspace.' : 'Start building better conversations today.'}</p>
          <form onSubmit={submit}>
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
            {error && <p className="form-alert error" role="alert">{error}</p>}
            {message && <p className="form-alert success" role="status">{message}</p>}
            <button className="button button-primary auth-submit" disabled={busy} type="submit">
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>
          <p className="auth-switch">
            {mode === 'login' ? 'New to ReplyAI?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}>
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          <p className="legal-note">Your workspace stays private to your account.</p>
        </div>
      </section>
    </main>
  )
}
