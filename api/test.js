import supabase from './_supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'POST only' })

  const { text, user_id } = req.body
  if (!text) return res.status(400).json({ error: 'text required' })
  if (!user_id) return res.status(400).json({ error: 'user_id required' })

  try {
    // Fetch rules from database
    const { data: rules, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('user_id', user_id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const h = text.toLowerCase()

    const rule = rules.find(r =>
      h.includes(r.keyword.toLowerCase())
    )

    if (rule) {
      return res.status(200).json({
        matched: true,
        keyword: rule.keyword,
        reply: rule.reply_message
      })
    }

    return res.status(200).json({
      matched: false,
      message: 'No keyword matched'
    })

  } catch (err) {
    return res.status(500).json({
      error: 'Server error',
      details: err.message
    })
  }
}
