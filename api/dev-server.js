import { createServer } from 'node:http'

const routes = new Map([
  ['/api/health', () => import('./health.js')],
  ['/api/rules', () => import('./rules.js')],
  ['/api/test', () => import('./test.js')],
  ['/api/metrics', () => import('./metrics.js')],
  ['/api/webhook', () => import('./webhook.js')],
  ['/webhook', () => import('./webhook.js')],
  ['/api/settings', () => import('./settings.js')],
  ['/api/generate', () => import('./generate.js')],
  ['/api/process-webhooks', () => import('./process-webhooks.js')],
  ['/api/meta/accounts', () => import('./meta/accounts.js')],
  ['/api/meta/connect', () => import('./meta/connect.js')],
  ['/api/meta/callback', () => import('./meta/callback.js')],
  ['/api/billing', () => import('./billing.js')],
  ['/api/billing/webhook', () => import('./billing/webhook.js')],
])

const rawBodyRoutes = new Set(['/api/webhook', '/webhook', '/api/billing/webhook'])

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 1024 * 1024) throw new Error('Request body is too large')
    chunks.push(chunk)
  }

  if (size === 0) return undefined
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function decorateResponse(res) {
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (body) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
    return res
  }
  res.send = (body) => {
    res.end(body)
    return res
  }
  res.redirect = (status, location) => {
    res.statusCode = status
    res.setHeader('Location', location)
    res.end()
    return res
  }
}

const server = createServer(async (req, res) => {
  decorateResponse(res)
  const url = new URL(req.url, 'http://127.0.0.1')
  req.query = Object.fromEntries(url.searchParams.entries())
  const loadRoute = routes.get(url.pathname)

  if (!loadRoute) return res.status(404).json({ error: 'API route not found' })

  try {
    if (!rawBodyRoutes.has(url.pathname)) {
      try {
        req.body = await readJsonBody(req)
      } catch (error) {
        return res.status(error.message === 'Request body is too large' ? 413 : 400)
          .json({ error: error.message === 'Request body is too large' ? error.message : 'Invalid JSON body' })
      }
    }

    const { default: handler } = await loadRoute()
    await handler(req, res)
    if (!res.writableEnded) res.end()
  } catch (error) {
    console.error(`Local API error (${url.pathname}):`, error.message)
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' })
    else res.end()
  }
})

const port = Number(process.env.API_PORT || 3000)
server.listen(port, '127.0.0.1', () => {
  console.log(`ReplyAI API listening on http://127.0.0.1:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
