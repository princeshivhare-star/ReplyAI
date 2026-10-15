import { authenticateUser, getAdminClient, methodNotAllowed, respondWithServerError } from './_supabase.js'
import { findMatchingRule } from './_rules.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const user = await authenticateUser(req, res)
    if (!user) return
    const { text, platform = 'instagram' } = req.body ?? {}
    if (typeof text !== 'string' || !text.trim() || text.length > 2000) {
      return res.status(400).json({ error: 'Enter a message between 1 and 2,000 characters' })
    }
    if (!['instagram', 'facebook'].includes(platform)) {
      return res.status(400).json({ error: 'Choose Instagram or Facebook' })
    }

    const { data: rules, error } = await getAdminClient()
      .from('reply_rules')
      .select('keyword, match_type, reply_message')
      .eq('user_id', user.id)
      .eq('active', true)
      .in('platform', ['both', platform])
      .order('created_at', { ascending: true })
    if (error) throw error

    const rule = findMatchingRule(text, rules)
    return res.status(200).json(rule
      ? { matched: true, keyword: rule.keyword, reply: rule.reply_message }
      : { matched: false, message: 'No keyword matched' })
  } catch (error) {
    return respondWithServerError(res, error, 'Unable to test this message right now')
  }
}
