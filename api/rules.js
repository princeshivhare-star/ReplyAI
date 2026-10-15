import { authenticateUser, getAdminClient, methodNotAllowed, respondWithServerError } from './_supabase.js'
import { getUserPlan } from './_plans.js'

const MATCH_TYPES = new Set(['contains', 'exact', 'startsWith'])
const PLATFORMS = new Set(['both', 'instagram', 'facebook'])

function serializeRule(rule) {
  return {
    id: rule.id,
    keyword: rule.keyword,
    matchType: rule.match_type,
    reply: rule.reply_message,
    platform: rule.platform,
    active: rule.active,
    triggerCount: rule.trigger_count,
    createdAt: rule.created_at,
    updatedAt: rule.updated_at,
  }
}

function validateRule(body, { partial = false } = {}) {
  const result = {}
  const errors = {}

  if (!partial || Object.hasOwn(body, 'keyword')) {
    if (typeof body.keyword !== 'string' || !body.keyword.trim() || body.keyword.length > 120) {
      errors.keyword = 'Enter a keyword between 1 and 120 characters'
    } else {
      result.keyword = body.keyword.trim()
    }
  }

  if (!partial || Object.hasOwn(body, 'reply')) {
    if (typeof body.reply !== 'string' || !body.reply.trim() || body.reply.length > 2000) {
      errors.reply = 'Enter a reply between 1 and 2,000 characters'
    } else {
      result.reply_message = body.reply.trim()
    }
  }

  if (Object.hasOwn(body, 'matchType') || !partial) {
    if (!MATCH_TYPES.has(body.matchType ?? 'contains')) {
      errors.matchType = 'Choose a supported match type'
    } else {
      result.match_type = body.matchType ?? 'contains'
    }
  }

  if (Object.hasOwn(body, 'platform') || !partial) {
    if (!PLATFORMS.has(body.platform ?? 'both')) {
      errors.platform = 'Choose a supported platform'
    } else {
      result.platform = body.platform ?? 'both'
    }
  }

  if (Object.hasOwn(body, 'active')) {
    if (typeof body.active !== 'boolean') errors.active = 'Active must be a boolean'
    else result.active = body.active
  }

  return { result, errors }
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  }

  try {
    const user = await authenticateUser(req, res)
    if (!user) return

    const supabase = getAdminClient()
    const id = typeof req.query.id === 'string' ? req.query.id : null

    if (req.method === 'GET') {
      let query = supabase
        .from('reply_rules')
        .select('id, keyword, match_type, reply_message, platform, active, trigger_count, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (id) query = query.eq('id', id)
      const { data, error } = await query
      if (error) throw error
      if (id && data.length === 0) return res.status(404).json({ error: 'Rule not found' })

      const rules = data.map(serializeRule)
      return res.status(200).json(id ? rules[0] : { rules, total: rules.length })
    }

    if (req.method === 'POST') {
      const { result, errors } = validateRule(req.body ?? {})
      if (Object.keys(errors).length) return res.status(400).json({ error: 'Invalid rule', fields: errors })

      const plan = await getUserPlan(supabase, user.id)
      const { data, error } = await supabase.rpc('create_reply_rule', {
        target_user_id: user.id,
        rule_limit: plan.ruleLimit,
        rule_keyword: result.keyword,
        rule_match_type: result.match_type,
        rule_reply_message: result.reply_message,
        rule_platform: result.platform,
      })
      if (error?.code === 'P0001' && error.message === 'rule_limit_reached') {
        return res.status(403).json({ error: `Your ${plan.name} plan has reached its automation limit. Upgrade to add more.` })
      }
      if (error) throw error
      return res.status(201).json(serializeRule(data))
    }

    if (!id) return res.status(400).json({ error: 'Rule id is required' })

    if (req.method === 'DELETE') {
      const { data, error } = await supabase
        .from('reply_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) return res.status(404).json({ error: 'Rule not found' })
      return res.status(200).json({ success: true })
    }

    if (req.method === 'PATCH') {
      if (req.body?.action !== 'toggle') {
        return res.status(400).json({ error: 'Unsupported action' })
      }

      const { data: current, error: findError } = await supabase
        .from('reply_rules')
        .select('active')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (findError) throw findError
      if (!current) return res.status(404).json({ error: 'Rule not found' })

      const { data, error } = await supabase
        .from('reply_rules')
        .update({ active: !current.active })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, keyword, match_type, reply_message, platform, active, trigger_count, created_at, updated_at')
        .single()
      if (error) throw error
      return res.status(200).json(serializeRule(data))
    }

    const { result, errors } = validateRule(req.body ?? {}, { partial: true })
    if (Object.keys(errors).length || Object.keys(result).length === 0) {
      return res.status(400).json({ error: 'Invalid rule update', fields: errors })
    }

    const { data, error } = await supabase
      .from('reply_rules')
      .update(result)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, keyword, match_type, reply_message, platform, active, trigger_count, created_at, updated_at')
      .maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Rule not found' })
    return res.status(200).json(serializeRule(data))
  } catch (error) {
    return respondWithServerError(res, error, 'Unable to process rules right now')
  }
}
