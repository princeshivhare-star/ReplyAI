import { useCallback, useEffect, useMemo, useState } from 'react'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', glyph: '⌂' },
  { id: 'automations', label: 'Automations', glyph: '✳' },
  { id: 'accounts', label: 'Connected accounts', glyph: '◎' },
  { id: 'ai', label: 'AI assistant', glyph: '✦' },
  { id: 'billing', label: 'Plan & billing', glyph: '◇' },
]

async function apiRequest(session, path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`)
  return data
}

function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-glyph">✳</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export default function Dashboard({ session, onSignOut }) {
  const [tab, setTab] = useState('overview')
  const [rules, setRules] = useState([])
  const [accounts, setAccounts] = useState([])
  const [settings, setSettings] = useState({ brandName: '', brandVoice: 'Friendly, concise, and helpful', productContext: '', aiEnabled: false })
  const [billing, setBilling] = useState({ plan: 'Free', status: 'inactive' })
  const [metrics, setMetrics] = useState({ repliesSentThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [ruleForm, setRuleForm] = useState({ keyword: '', reply: '', matchType: 'contains', platform: 'both' })
  const [editingRuleId, setEditingRuleId] = useState(null)
  const [testText, setTestText] = useState('')
  const [generatedReply, setGeneratedReply] = useState('')
  const [generating, setGenerating] = useState(false)

  const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'there'
  const shortName = userName.split(/[ ._-]/)[0]
  const activeRules = useMemo(() => rules.filter((rule) => rule.active).length, [rules])
  const hasSubscription = !['inactive', 'canceled', 'incomplete_expired'].includes(billing.status)

  const loadWorkspace = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [rulesResult, settingsResult, accountsResult, billingResult, metricsResult] = await Promise.all([
        apiRequest(session, '/api/rules'),
        apiRequest(session, '/api/settings'),
        apiRequest(session, '/api/meta/accounts'),
        apiRequest(session, '/api/billing'),
        apiRequest(session, '/api/metrics'),
      ])
      setRules(rulesResult.rules || [])
      setSettings((current) => ({ ...current, ...(settingsResult.settings || {}) }))
      setAccounts(accountsResult.accounts || [])
      setBilling(billingResult)
      setMetrics(metricsResult)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { loadWorkspace() }, [loadWorkspace])

  async function runAction(action) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function createRule(event) {
    event.preventDefault()
    await runAction(async () => {
      await apiRequest(session, '/api/rules', { method: 'POST', body: JSON.stringify(ruleForm) })
      setRuleForm({ keyword: '', reply: '', matchType: 'contains', platform: 'both' })
      setNotice('Your rule is live.')
    })
  }

  function startEdit(rule) {
    setRuleForm({ keyword: rule.keyword, reply: rule.reply, matchType: rule.matchType, platform: rule.platform })
    setEditingRuleId(rule.id)
    setTab('automations')
    setError('')
    setNotice('')
  }

  async function saveRule(event) {
    event.preventDefault()
    await runAction(async () => {
      await apiRequest(session, `/api/rules?id=${encodeURIComponent(editingRuleId)}`, {
        method: 'PUT',
        body: JSON.stringify(ruleForm),
      })
      setEditingRuleId(null)
      setRuleForm({ keyword: '', reply: '', matchType: 'contains', platform: 'both' })
      setNotice('Automation updated.')
    })
  }

  function cancelEdit() {
    setEditingRuleId(null)
    setRuleForm({ keyword: '', reply: '', matchType: 'contains', platform: 'both' })
  }

  async function toggleRule(rule) {
    await runAction(async () => {
      await apiRequest(session, `/api/rules?id=${encodeURIComponent(rule.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'toggle' }),
      })
      setNotice(rule.active ? 'Automation paused.' : 'Automation enabled.')
    })
  }

  async function deleteRule(rule) {
    if (!window.confirm(`Delete the “${rule.keyword}” automation?`)) return
    await runAction(async () => {
      await apiRequest(session, `/api/rules?id=${encodeURIComponent(rule.id)}`, { method: 'DELETE' })
      if (editingRuleId === rule.id) cancelEdit()
      setNotice('Automation deleted.')
    })
  }

  async function saveSettings(event) {
    event.preventDefault()
    await runAction(async () => {
      const result = await apiRequest(session, '/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      setSettings(result.settings)
      setNotice('AI assistant settings saved.')
    })
  }

  async function connectMeta() {
    setBusy(true)
    setError('')
    try {
      const result = await apiRequest(session, '/api/meta/connect', { method: 'POST' })
      window.location.assign(result.authUrl)
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  async function disconnectAccount(account) {
    if (!window.confirm(`Disconnect ${account.accountName || account.provider}?`)) return
    await runAction(async () => {
      await apiRequest(session, `/api/meta/accounts?id=${encodeURIComponent(account.id)}`, { method: 'DELETE' })
      setNotice('Social account disconnected.')
    })
  }

  async function generateReply(event) {
    event.preventDefault()
    setGenerating(true)
    setError('')
    setGeneratedReply('')
    try {
      const result = await apiRequest(session, '/api/generate', {
        method: 'POST',
        body: JSON.stringify({ text: testText }),
      })
      setGeneratedReply(result.reply)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setGenerating(false)
    }
  }

  async function startBilling(action, plan) {
    setBusy(true)
    setError('')
    try {
      const result = await apiRequest(session, '/api/billing', {
        method: 'POST',
        body: JSON.stringify({ action, plan }),
      })
      window.location.assign(result.url)
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const result = query.get('connected')
    const billingResult = query.get('billing')
    const metaError = query.get('meta_error')
    if (result === 'meta') {
      setNotice('Your Meta account was connected successfully.')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (metaError) {
      setError(metaError === 'no_pages'
        ? 'No Facebook Pages were available for this account. Check your Meta permissions and try again.'
        : 'Meta could not connect your account. Check the Meta setup and try again.')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (billingResult) {
      setNotice(billingResult === 'success'
        ? 'Checkout completed. Your plan will update as soon as Stripe confirms the subscription.'
        : 'Checkout was cancelled; your plan has not changed.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const pageTitle = NAV_ITEMS.find((item) => item.id === tab)?.label ?? 'Overview'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="wordmark" href="/" aria-label="ReplyAI home"><span className="brand-mark">R</span> replyai</a>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={`nav-item ${tab === item.id ? 'selected' : ''}`} onClick={() => { setTab(item.id); setError(''); setNotice('') }}>
              <span className="nav-glyph" aria-hidden="true">{item.glyph}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection-pill"><span className="status-dot" />{accounts.length ? `${accounts.length} account${accounts.length > 1 ? 's' : ''} connected` : 'No accounts connected'}</div>
          <div className="user-row">
            <div className="avatar">{shortName.charAt(0).toUpperCase()}</div>
            <div className="user-info"><strong>{userName}</strong><span>{session.user.email}</span></div>
            <button className="signout-button" type="button" onClick={onSignOut} aria-label="Sign out" title="Sign out">↗</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> {pageTitle}</div>
          <div className="topbar-right"><span className="live-status"><i /> All systems operational</span><span className="topbar-divider" />{session.user.email}<button className="mobile-signout" type="button" onClick={onSignOut}>Sign out</button></div>
        </header>
        <div className="page-container">
          {(error || notice) && (
            <div className={`toast ${error ? 'toast-error' : 'toast-success'}`} role={error ? 'alert' : 'status'}>
              <span>{error || notice}</span>
              <button type="button" onClick={() => { setError(''); setNotice('') }} aria-label="Dismiss message">×</button>
            </div>
          )}
          {loading ? <div className="loading-panel"><span className="spinner" />Getting your workspace ready…</div> : (
            <>
              {tab === 'overview' && (
                <section>
                  <div className="page-heading">
                    <div><p className="eyebrow">YOUR WORKSPACE</p><h1>Good morning, {shortName}.</h1><p className="page-subtitle">Here’s what’s happening with your conversations.</p></div>
                    <button className="button button-dark" onClick={() => setTab('automations')}>Create automation <span>＋</span></button>
                  </div>
                  <div className="stat-grid">
                    <article className="stat-card"><span className="stat-label">ACTIVE AUTOMATIONS</span><strong>{activeRules}</strong><span className="stat-foot">{rules.length} total rules</span></article>
                    <article className="stat-card"><span className="stat-label">CONNECTED CHANNELS</span><strong>{accounts.length}</strong><span className="stat-foot">Instagram &amp; Facebook</span></article>
                    <article className="stat-card"><span className="stat-label">REPLIES THIS MONTH</span><strong>{metrics.repliesSentThisMonth}</strong><span className="stat-foot">Across all channels</span></article>
                    <article className="stat-card plan-stat"><span className="stat-label">CURRENT PLAN</span><strong>{billing.plan || 'Free'}</strong><button onClick={() => setTab('billing')}>Manage plan <span>→</span></button></article>
                  </div>
                  <div className="content-grid">
                    <section className="surface-card overview-rules">
                      <div className="section-header"><div><h2>Recent automations</h2><p>Your keyword-triggered replies</p></div><button className="text-button" onClick={() => setTab('automations')}>View all <span>→</span></button></div>
                      {rules.length ? rules.slice(0, 4).map((rule) => <RuleRow key={rule.id} rule={rule} onEdit={startEdit} onToggle={toggleRule} onDelete={deleteRule} busy={busy} />) : <EmptyState title="A little quiet in here." description="Create your first keyword automation to start replying in seconds." action={<button className="button button-light" onClick={() => setTab('automations')}>Create an automation</button>} />}
                    </section>
                    <section className="surface-card setup-card-small">
                      <div className="section-header"><div><h2>Get started</h2><p>Three steps to effortless replies</p></div></div>
                      <SetupStep done={accounts.length > 0} number="01" title="Connect your channels" onClick={() => setTab('accounts')} />
                      <SetupStep done={rules.length > 0} number="02" title="Create your first automation" onClick={() => setTab('automations')} />
                      <SetupStep done={settings.aiEnabled} number="03" title="Teach your AI your voice" onClick={() => setTab('ai')} />
                    </section>
                  </div>
                </section>
              )}

              {tab === 'automations' && (
                <section>
                  <div className="page-heading"><div><p className="eyebrow">RULE-BASED REPLIES</p><h1>Automations</h1><p className="page-subtitle">Turn the questions you hear every day into instant, helpful replies.</p></div></div>
                  <div className="content-grid automation-grid">
                    <section className="surface-card">
                      <div className="section-header"><div><h2>Your rules</h2><p>{rules.length} automation{rules.length === 1 ? '' : 's'} configured</p></div></div>
                      {rules.length ? rules.map((rule) => <RuleRow key={rule.id} rule={rule} onEdit={startEdit} onToggle={toggleRule} onDelete={deleteRule} busy={busy} />) : <EmptyState title="No automations yet" description="Add your first keyword and let ReplyAI take it from there." />}
                    </section>
                    <section className="surface-card form-card">
                      <div className="section-header"><div><h2>{editingRuleId ? 'Edit automation' : 'New automation'}</h2><p>Choose what ReplyAI should listen for.</p></div></div>
                      <form className="stacked-form" onSubmit={editingRuleId ? saveRule : createRule}>
                        <label htmlFor="rule-keyword">When a message contains</label>
                        <input id="rule-keyword" value={ruleForm.keyword} maxLength={120} onChange={(event) => setRuleForm({ ...ruleForm, keyword: event.target.value })} placeholder="e.g. shipping" required />
                        <div className="form-row">
                          <div><label htmlFor="rule-match">Match type</label><select id="rule-match" value={ruleForm.matchType} onChange={(event) => setRuleForm({ ...ruleForm, matchType: event.target.value })}><option value="contains">Contains</option><option value="exact">Exact match</option><option value="startsWith">Starts with</option></select></div>
                          <div><label htmlFor="rule-platform">Channel</label><select id="rule-platform" value={ruleForm.platform} onChange={(event) => setRuleForm({ ...ruleForm, platform: event.target.value })}><option value="both">Both channels</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></div>
                        </div>
                        <label htmlFor="rule-reply">Reply with</label>
                        <textarea id="rule-reply" value={ruleForm.reply} maxLength={2000} onChange={(event) => setRuleForm({ ...ruleForm, reply: event.target.value })} placeholder="Write a reply that sounds like you…" rows={4} required />
                        <button className="button button-dark full-width" disabled={busy} type="submit">{busy ? 'Saving…' : editingRuleId ? 'Save changes' : 'Save automation'} <span>→</span></button>
                        {editingRuleId && <button className="button button-light full-width" disabled={busy} onClick={cancelEdit} type="button">Cancel</button>}
                      </form>
                    </section>
                  </div>
                </section>
              )}

              {tab === 'accounts' && (
                <section>
                  <div className="page-heading"><div><p className="eyebrow">YOUR SOCIAL CHANNELS</p><h1>Connected accounts</h1><p className="page-subtitle">Connect Meta to let ReplyAI respond to your Instagram and Facebook conversations.</p></div><button className="button button-dark" disabled={busy} onClick={connectMeta}>Connect Meta <span>＋</span></button></div>
                  <div className="surface-card account-list">
                    {accounts.length ? accounts.map((account) => <article className="account-row" key={account.id}><div className={`platform-mark ${account.provider}`}>{account.provider === 'instagram' ? 'ig' : 'f'}</div><div className="account-detail"><strong>{account.accountName || account.username || account.provider}</strong><span>{account.provider === 'instagram' ? 'Instagram business account' : 'Facebook page'}{account.username ? ` · @${account.username}` : ''}</span></div><span className="connected-tag"><i /> Connected</span><button className="disconnect-button" disabled={busy} onClick={() => disconnectAccount(account)}>Disconnect</button></article>) : <EmptyState title="Bring your conversations together" description="Connect your Facebook account to link your eligible Pages and their Instagram business accounts." action={<button className="button button-dark" onClick={connectMeta}>Connect with Meta</button>} />}
                  </div>
                  <p className="fine-print">ReplyAI only requests permissions needed to manage comments and messages. Your access token is stored securely and never shown in the dashboard.</p>
                </section>
              )}

              {tab === 'ai' && (
                <section>
                  <div className="page-heading"><div><p className="eyebrow">YOUR BRAND, IN EVERY REPLY</p><h1>AI assistant</h1><p className="page-subtitle">Give your AI a little context, and it’ll help you answer the messages rules don’t cover.</p></div></div>
                  <div className="content-grid automation-grid">
                    <section className="surface-card form-card">
                      <div className="section-header"><div><h2>Teach ReplyAI your voice</h2><p>Your brand context helps keep generated replies on point.</p></div></div>
                      <form className="stacked-form" onSubmit={saveSettings}>
                        <label htmlFor="brand-name">Brand or business name</label><input id="brand-name" maxLength={100} value={settings.brandName} onChange={(event) => setSettings({ ...settings, brandName: event.target.value })} placeholder="e.g. Sunday Supply Co." />
                        <label htmlFor="brand-voice">Voice and tone</label><input id="brand-voice" maxLength={500} value={settings.brandVoice} onChange={(event) => setSettings({ ...settings, brandVoice: event.target.value })} placeholder="Friendly, concise, and helpful" />
                        <label htmlFor="brand-context">Products, policies, and important context</label><textarea id="brand-context" maxLength={5000} rows={6} value={settings.productContext} onChange={(event) => setSettings({ ...settings, productContext: event.target.value })} placeholder="Share your products, shipping and return policies, and what the assistant should know…" />
                        <label className="toggle-setting"><input type="checkbox" checked={settings.aiEnabled} onChange={(event) => setSettings({ ...settings, aiEnabled: event.target.checked })} /><span><strong>Enable AI fallback</strong><small>Use AI for messages that do not match an active keyword rule.</small></span></label>
                        <button className="button button-dark full-width" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save AI settings'} <span>→</span></button>
                      </form>
                    </section>
                    <section className="surface-card form-card">
                      <div className="section-header"><div><h2>Try a sample reply</h2><p>Preview a response before enabling AI fallback.</p></div></div>
                      <form className="stacked-form" onSubmit={generateReply}>
                        <label htmlFor="test-message">A customer says…</label><textarea id="test-message" rows={4} maxLength={2000} value={testText} onChange={(event) => setTestText(event.target.value)} placeholder="Do you ship to Canada?" required />
                        <button className="button button-light full-width" disabled={generating} type="submit">{generating ? 'Writing a thoughtful reply…' : 'Generate sample'} <span>✦</span></button>
                      </form>
                      {generatedReply && <div className="generated-reply"><span className="eyebrow">SUGGESTED REPLY</span><p>{generatedReply}</p></div>}
                      {!settings.aiEnabled && <p className="fine-print">Sample generation uses your AI allowance. AI fallback stays off until you enable it.</p>}
                    </section>
                  </div>
                </section>
              )}

              {tab === 'billing' && (
                <section>
                  <div className="page-heading"><div><p className="eyebrow">SIMPLE, TRANSPARENT PRICING</p><h1>Plan &amp; billing</h1><p className="page-subtitle">Choose the right room to grow your conversations.</p></div>{billing.status !== 'inactive' && <button className="button button-light" disabled={busy} onClick={() => startBilling('portal')}>Manage subscription <span>→</span></button>}</div>
                  <p className="billing-usage">Your {billing.plan || 'Free'} plan has used <strong>{billing.aiUsed || 0}</strong> of <strong>{billing.aiLimit || 20}</strong> AI replies this month.</p>
                  <div className="pricing-grid">
                    <PlanCard name="Starter" price="$19" features={['Instagram + Facebook', 'Up to 5 automations', '50 AI replies / month']} current={billing.plan === 'Starter'} onSelect={() => startBilling(hasSubscription ? 'portal' : 'checkout', 'starter')} busy={busy} />
                    <PlanCard name="Growth" price="$49" features={['Instagram + Facebook', 'Unlimited automations', '1,000 AI replies / month']} featured current={billing.plan === 'Growth'} onSelect={() => startBilling(hasSubscription ? 'portal' : 'checkout', 'growth')} busy={busy} />
                  </div>
                  <p className="fine-print centered">Secure payments and subscription management are powered by Stripe. Cancel any time.</p>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function RuleRow({ rule, onEdit, onToggle, onDelete, busy }) {
  return (
    <article className="rule-row">
      <div className="rule-indicator"><span className={rule.active ? 'rule-dot active' : 'rule-dot'} /></div>
      <div className="rule-main"><div className="rule-title"><strong>{rule.keyword}</strong><span className="rule-type">{rule.matchType}</span></div><p>{rule.reply}</p><span className="rule-meta">{rule.platform === 'both' ? 'Instagram + Facebook' : rule.platform} · {rule.triggerCount || 0} replies</span></div>
      <div className="rule-actions"><button type="button" className="edit-button" onClick={() => onEdit(rule)} disabled={busy} aria-label={`Edit ${rule.keyword}`}>Edit</button><button type="button" className={`mini-toggle ${rule.active ? 'on' : ''}`} onClick={() => onToggle(rule)} disabled={busy} aria-label={rule.active ? `Pause ${rule.keyword}` : `Enable ${rule.keyword}`} aria-pressed={rule.active}><span /></button><button type="button" className="delete-button" onClick={() => onDelete(rule)} disabled={busy} aria-label={`Delete ${rule.keyword}`}>×</button></div>
    </article>
  )
}

function SetupStep({ done, number, title, onClick }) {
  return <button className="setup-step" onClick={onClick}><span className={`step-number ${done ? 'done' : ''}`}>{done ? '✓' : number}</span><span>{title}</span><span className="step-arrow">{done ? 'Done' : '→'}</span></button>
}

function PlanCard({ name, price, features, current, featured, onSelect, busy }) {
  return (
    <article className={`plan-card ${featured ? 'featured' : ''}`}>
      {featured && <span className="plan-badge">MOST POPULAR</span>}
      <p className="eyebrow">{name.toUpperCase()}</p><h2>{price}<small> / month</small></h2>
      <p className="plan-copy">{name === 'Growth' ? 'For brands ready to grow.' : 'Everything you need to get going.'}</p>
      <ul>{features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
      <button className={`button ${featured ? 'button-primary' : 'button-light'} full-width`} disabled={busy || current} onClick={onSelect}>{current ? 'Current plan' : 'Choose plan'} {!current && <span>→</span>}</button>
    </article>
  )
}
