import { createHash } from 'node:crypto'
import { getAdminClient } from '../_supabase.js'

const graphVersion = () => process.env.META_GRAPH_VERSION || 'v22.0'

async function graphJson(url) {
  const response = await fetch(url)
  const result = await response.json()
  if (!response.ok || result.error) {
    throw new Error(result.error?.message || `Meta API returned ${response.status}`)
  }
  return result
}

async function subscribeToWebhooks(accountId, accessToken, fields) {
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${accountId}/subscribed_apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ subscribed_fields: fields.join(','), access_token: accessToken }),
  })
  const result = await response.json()
  if (!response.ok || result.error || result.success === false) {
    throw new Error(result.error?.message || `Unable to subscribe ${accountId} to Meta webhooks`)
  }
}

async function storeAccount(supabase, userId, account) {
  const { data: existing, error: lookupError } = await supabase
    .from('social_accounts')
    .select('id, user_id')
    .eq('provider', account.provider)
    .eq('external_account_id', account.externalAccountId)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (existing && existing.user_id !== userId) {
    throw new Error('This social account is already connected to another ReplyAI user')
  }

  const values = {
    user_id: userId,
    provider: account.provider,
    external_account_id: account.externalAccountId,
    page_id: account.pageId,
    account_name: account.accountName || '',
    username: account.username || '',
    access_token: account.accessToken,
    token_expires_at: account.expiresAt,
  }
  const request = existing
    ? supabase.from('social_accounts').update(values).eq('id', existing.id)
    : supabase.from('social_accounts').insert(values)
  const { error } = await request
  if (error) throw error
}

function redirectToApp(res, result) {
  const base = process.env.APP_URL
  if (!base) return res.status(503).send('Application URL is not configured')

  const target = new URL('/', base)
  target.searchParams.set(result.ok ? 'connected' : 'meta_error', result.ok ? 'meta' : result.message)
  return res.redirect(302, target.toString())
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed')
  }

  if (req.query.error) return redirectToApp(res, { ok: false, message: 'cancelled' })
  const { code, state } = req.query
  if (typeof code !== 'string' || typeof state !== 'string' || !/^[a-f0-9]{64}$/.test(state)) {
    return redirectToApp(res, { ok: false, message: 'invalid_callback' })
  }

  try {
    const { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } = process.env
    if (!META_APP_ID || !META_APP_SECRET || !META_REDIRECT_URI) {
      return res.status(503).send('Meta connection is not configured')
    }

    const supabase = getAdminClient()
    const stateHash = createHash('sha256').update(state).digest('hex')
    const { data: consumedState, error: stateError } = await supabase
      .from('oauth_states')
      .delete()
      .eq('state_hash', stateHash)
      .gt('expires_at', new Date().toISOString())
      .select('user_id')
      .maybeSingle()
    if (stateError) throw stateError
    if (!consumedState) return redirectToApp(res, { ok: false, message: 'expired_state' })

    const graph = graphVersion()
    const shortTokenUrl = new URL(`https://graph.facebook.com/${graph}/oauth/access_token`)
    shortTokenUrl.searchParams.set('client_id', META_APP_ID)
    shortTokenUrl.searchParams.set('client_secret', META_APP_SECRET)
    shortTokenUrl.searchParams.set('redirect_uri', META_REDIRECT_URI)
    shortTokenUrl.searchParams.set('code', code)
    const shortToken = await graphJson(shortTokenUrl)

    const longTokenUrl = new URL(`https://graph.facebook.com/${graph}/oauth/access_token`)
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longTokenUrl.searchParams.set('client_id', META_APP_ID)
    longTokenUrl.searchParams.set('client_secret', META_APP_SECRET)
    longTokenUrl.searchParams.set('fb_exchange_token', shortToken.access_token)
    const longToken = await graphJson(longTokenUrl)
    const expiresAt = longToken.expires_in
      ? new Date(Date.now() + Number(longToken.expires_in) * 1000).toISOString()
      : null

    const pagesUrl = new URL(`https://graph.facebook.com/${graph}/me/accounts`)
    pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account{id,username}')
    pagesUrl.searchParams.set('limit', '100')
    pagesUrl.searchParams.set('access_token', longToken.access_token)
    const pagesResult = await graphJson(pagesUrl)
    if (!Array.isArray(pagesResult.data) || pagesResult.data.length === 0) {
      return redirectToApp(res, { ok: false, message: 'no_pages' })
    }

    for (const page of pagesResult.data) {
      if (!page.id || !page.access_token) continue
      await storeAccount(supabase, consumedState.user_id, {
        provider: 'facebook',
        externalAccountId: page.id,
        pageId: page.id,
        accountName: page.name,
        accessToken: page.access_token,
        expiresAt,
      })
      await subscribeToWebhooks(page.id, page.access_token, ['feed', 'messages', 'messaging_postbacks'])
      const instagram = page.instagram_business_account
      if (instagram?.id) {
        await storeAccount(supabase, consumedState.user_id, {
          provider: 'instagram',
          externalAccountId: instagram.id,
          pageId: page.id,
          accountName: page.name,
          username: instagram.username,
          accessToken: page.access_token,
          expiresAt,
        })
        await subscribeToWebhooks(instagram.id, page.access_token, ['comments', 'messages'])
      }
    }

    return redirectToApp(res, { ok: true })
  } catch (error) {
    console.error('Meta OAuth callback error:', error.message)
    return redirectToApp(res, { ok: false, message: 'connection_failed' })
  }
}
