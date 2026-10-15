import { authenticateUser, getAdminClient, methodNotAllowed, respondWithServerError } from './_supabase.js'

const DEFAULT_SETTINGS = {
  brandName: '',
  brandVoice: 'Friendly, concise, and helpful',
  productContext: '',
  aiEnabled: false,
}

function toSettings(row) {
  return row ? {
    brandName: row.brand_name,
    brandVoice: row.brand_voice,
    productContext: row.product_context,
    aiEnabled: row.ai_enabled,
  } : DEFAULT_SETTINGS
}

export default async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) return methodNotAllowed(res, ['GET', 'PUT'])

  try {
    const user = await authenticateUser(req, res)
    if (!user) return
    const supabase = getAdminClient()

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('brand_name, brand_voice, product_context, ai_enabled')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return res.status(200).json({ settings: toSettings(data) })
    }

    const body = req.body ?? {}
    const fields = [
      ['brandName', 'brand_name', 100],
      ['brandVoice', 'brand_voice', 500],
      ['productContext', 'product_context', 5000],
    ]
    const values = { user_id: user.id }
    for (const [inputKey, column, limit] of fields) {
      if (body[inputKey] !== undefined) {
        if (typeof body[inputKey] !== 'string' || body[inputKey].length > limit) {
          return res.status(400).json({ error: `${inputKey} must be a string of at most ${limit} characters` })
        }
        values[column] = body[inputKey].trim()
      }
    }
    if (body.aiEnabled !== undefined) {
      if (typeof body.aiEnabled !== 'boolean') return res.status(400).json({ error: 'aiEnabled must be a boolean' })
      values.ai_enabled = body.aiEnabled
    }

    const { data, error } = await supabase
      .from('brand_profiles')
      .upsert(values, { onConflict: 'user_id' })
      .select('brand_name, brand_voice, product_context, ai_enabled')
      .single()
    if (error) throw error
    return res.status(200).json({ settings: toSettings(data) })
  } catch (error) {
    return respondWithServerError(res, error, 'Unable to save settings right now')
  }
}
