// api/health.js
export default function handler(req, res) {
  res.json({
    status: 'ok',
    service: 'ReplyAI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: {
      webhookToken:      !!process.env.WEBHOOK_VERIFY_TOKEN,
      metaAppSecret:     !!process.env.META_APP_SECRET,
      igToken:           !!process.env.INSTAGRAM_ACCESS_TOKEN,
      igAccountId:       !!process.env.INSTAGRAM_ACCOUNT_ID,
      fbToken:           !!process.env.FACEBOOK_ACCESS_TOKEN,
    }
  });
}
