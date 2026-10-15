import { createHash, randomBytes } from 'node:crypto'
import { authenticateUser, getAdminClient, methodNotAllowed } from '../_supabase.js'

const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_engagement',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_manage_comments',
  'instagram_manage_messages',
  'pages_messaging',
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const user = await authenticateUser(req, res)
    if (!user) return

    const { META_APP_ID, META_REDIRECT_URI, META_GRAPH_VERSION = 'v22.0' } = process.env
    if (!META_APP_ID || !META_REDIRECT_URI || !/^v\d+\.\d+$/.test(META_GRAPH_VERSION)) {
      return res.status(503).json({ error: 'Meta connection is not configured yet' })
    }

    const state = randomBytes(32).toString('hex')
    const stateHash = createHash('sha256').update(state).digest('hex')
    const { error } = await getAdminClient()
      .from('oauth_states')
      .insert({
        state_hash: stateHash,
        user_id: user.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
    if (error) throw error

    const url = new URL(`https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`)
    url.searchParams.set('client_id', META_APP_ID)
    url.searchParams.set('redirect_uri', META_REDIRECT_URI)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)
    url.searchParams.set('scope', META_SCOPES.join(','))

    return res.status(200).json({ authUrl: url.toString() })
  } catch (error) {
    console.error('Meta OAuth start error:', error.message)
    return res.status(500).json({ error: 'Unable to start Meta connection' })
  }
}
