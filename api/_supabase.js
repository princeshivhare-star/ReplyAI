import { createClient } from '@supabase/supabase-js'

let adminClient

export function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    const error = new Error('Supabase server configuration is missing')
    error.code = 'CONFIG_MISSING'
    throw error
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  return adminClient
}

export async function authenticateUser(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const authorization = req.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null

  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return null
  }

  const { data, error } = await getAdminClient().auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired session' })
    return null
  }

  return data.user
}

export function methodNotAllowed(res, methods) {
  res.setHeader('Allow', methods.join(', '))
  return res.status(405).json({ error: 'Method not allowed' })
}

export function respondWithServerError(res, error, message) {
  console.error('API error:', error.message)
  const missingConfig = error.code === 'CONFIG_MISSING'
  return res.status(missingConfig ? 503 : 500).json({
    error: missingConfig ? 'Service configuration is incomplete' : message,
  })
}
