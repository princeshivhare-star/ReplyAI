import { useEffect, useState } from 'react'
import AuthPage from './AuthPage'
import Dashboard from './Dashboard'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './styles.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Unable to sign out:', error.message)
  }

  useEffect(() => {
    if (!supabase) return

    let alive = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return
      if (error) console.error('Unable to restore session:', error.message)
      setSession(data?.session ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <main className="setup-screen">
        <div className="setup-card">
          <span className="brand-mark">R</span>
          <p className="eyebrow">ONE QUICK SETUP STEP</p>
          <h1>Connect your Supabase project</h1>
          <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your local environment to enable secure sign-in.</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return <main className="loading-screen"><span className="spinner" />Loading your workspace…</main>
  }

  return session
    ? <Dashboard session={session} onSignOut={signOut} />
    : <AuthPage />
}
