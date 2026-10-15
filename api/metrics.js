import { authenticateUser, getAdminClient, methodNotAllowed, respondWithServerError } from './_supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  try {
    const user = await authenticateUser(req, res)
    if (!user) return
    const monthStart = `${new Date().toISOString().slice(0, 7)}-01T00:00:00.000Z`
    const { count, error } = await getAdminClient()
      .from('reply_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'sent')
      .gte('created_at', monthStart)
    if (error) throw error
    return res.status(200).json({ repliesSentThisMonth: count || 0 })
  } catch (error) {
    return respondWithServerError(res, error, 'Unable to load workspace metrics')
  }
}
