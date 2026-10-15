import { createHash } from 'node:crypto'
import { getAdminClient, respondWithServerError } from './_supabase.js'
import { constantTimeStringEqual, verifyMetaSignature } from './_signatures.js'

export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 1024 * 1024) throw new Error('Request body is too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] ?? req.query.mode
    const token = req.query['hub.verify_token'] ?? req.query.token
    const challenge = req.query['hub.challenge'] ?? req.query.challenge
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN
    if (!verifyToken) return res.status(503).json({ error: 'Webhook verification is not configured' })
    if (mode === 'subscribe' && typeof token === 'string' && constantTimeStringEqual(token, verifyToken) && typeof challenge === 'string') {
      return res.status(200).send(challenge)
    }
    return res.status(403).json({ error: 'Webhook verification failed' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let rawBody
  try {
    rawBody = await readRawBody(req)
  } catch (error) {
    return res.status(413).json({ error: error.message })
  }

  const signature = req.headers['x-hub-signature-256']
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret || typeof signature !== 'string') {
    return res.status(401).json({ error: 'Webhook signature is required' })
  }

  if (!verifyMetaSignature(rawBody, signature, appSecret)) {
    return res.status(401).json({ error: 'Invalid webhook signature' })
  }

  let payload
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }
  if (!['instagram', 'page'].includes(payload.object) || !Array.isArray(payload.entry)) {
    return res.status(400).json({ error: 'Unsupported webhook payload' })
  }

  try {
    const eventHash = createHash('sha256').update(rawBody).digest('hex')
    const { error } = await getAdminClient().from('webhook_events').insert({
      event_hash: eventHash,
      provider: 'meta',
      payload,
    })
    if (error?.code === '23505') return res.status(200).send('EVENT_RECEIVED')
    if (error) throw error
    return res.status(200).send('EVENT_RECEIVED')
  } catch (error) {
    return respondWithServerError(res, error, 'Unable to queue webhook event')
  }
}
