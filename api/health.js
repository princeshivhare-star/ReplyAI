export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({
    status: 'ok',
    service: 'ReplyAI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
}
