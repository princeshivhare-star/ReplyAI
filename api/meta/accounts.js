import { authenticateUser, getAdminClient, methodNotAllowed, respondWithServerError } from '../_supabase.js'

export default async function handler(req, res) {
  if (!['GET', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['GET', 'DELETE'])

  try {
    const user = await authenticateUser(req, res)
    if (!user) return
    const supabase = getAdminClient()

    if (req.method === 'DELETE') {
      const id = typeof req.query.id === 'string' ? req.query.id : ''
      if (!id) return res.status(400).json({ error: 'Account id is required' })

      const { data: account, error: findError } = await supabase
        .from('social_accounts')
        .select('id, external_account_id, access_token')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (findError) throw findError
      if (!account) return res.status(404).json({ error: 'Connected account not found' })

      const version = process.env.META_GRAPH_VERSION || 'v22.0'
      const unsubscribeUrl = new URL(`https://graph.facebook.com/${version}/${account.external_account_id}/subscribed_apps`)
      unsubscribeUrl.searchParams.set('access_token', account.access_token)
      try {
        const response = await fetch(unsubscribeUrl, { method: 'DELETE' })
        if (!response.ok) console.error('Unable to unsubscribe Meta account:', response.status)
      } catch (error) {
        console.error('Unable to unsubscribe Meta account:', error.message)
      }

      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .select('id, provider, external_account_id, account_name, username, connected_at, token_expires_at')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: true })
    if (error) throw error

    return res.status(200).json({
      accounts: data.map((account) => ({
        id: account.id,
        provider: account.provider,
        externalAccountId: account.external_account_id,
        accountName: account.account_name,
        username: account.username,
        connectedAt: account.connected_at,
        tokenExpiresAt: account.token_expires_at,
      })),
    })
  } catch (error) {
    return respondWithServerError(res, error, 'Unable to load connected accounts')
  }
}
