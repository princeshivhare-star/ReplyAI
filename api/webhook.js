// api/webhook.js
// Vercel Serverless Function — Meta Webhook Handler
// Handles both GET (verification) and POST (events)

import crypto from 'crypto';

/* ── In-memory rule store (replace with DB like Vercel KV / PlanetScale in prod) ── */
const RULES = [
  { id: 1, keyword: 'price',     matchType: 'contains', reply: 'Hi! 👋 Our prices start from $19/mo. Check the link in bio or DM us for a custom quote!',              platform: 'both', active: true },
  { id: 2, keyword: 'shipping',  matchType: 'contains', reply: 'We ship worldwide! 🚀 Standard 3–5 days, Express 1–2 days. Free shipping on orders $50+!',              platform: 'both', active: true },
  { id: 3, keyword: 'discount',  matchType: 'contains', reply: '🎁 Use code SAVE20 for 20% off your order! Valid this week only. Shop now via the link in bio!',        platform: 'both', active: true },
  { id: 4, keyword: 'available', matchType: 'contains', reply: 'Yes, still in stock! ✅ Limited quantities — grab yours before it sells out. Link in bio!',             platform: 'both', active: true },
  { id: 5, keyword: 'collab',    matchType: 'contains', reply: 'Love the interest! 💫 Please DM us your media kit and we\'ll get back to you within 48 hours.',         platform: 'both', active: true },
];

function findMatch(text, platform) {
  if (!text) return null;
  for (const rule of RULES) {
    if (!rule.active) continue;
    if (rule.platform !== 'both' && rule.platform !== platform) continue;
    const h = text.toLowerCase();
    const n = rule.keyword.toLowerCase();
    const matched =
      rule.matchType === 'exact'      ? h.trim() === n :
      rule.matchType === 'startsWith' ? h.startsWith(n) :
      h.includes(n); // contains (default)
    if (matched) return rule;
  }
  return null;
}

async function sendReply(url, body, token) {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...body, access_token: token }),
  });
  return res.json();
}

const API = 'https://graph.facebook.com/v19.0';

export default async function handler(req, res) {
  /* ── CORS preflight ── */
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    return res.status(200).end();
  }

  /* ════════════════════════════════════
     GET — Meta Webhook Verification
  ════════════════════════════════════ */
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Verification failed' });
  }

  /* ════════════════════════════════════
     POST — Incoming Meta Events
  ════════════════════════════════════ */
  if (req.method === 'POST') {
    // Verify signature
    const sig = req.headers['x-hub-signature-256'];
    if (sig && process.env.META_APP_SECRET) {
      const rawBody = JSON.stringify(req.body);
      const expected = 'sha256=' + crypto
        .createHmac('sha256', process.env.META_APP_SECRET)
        .update(rawBody).digest('hex');
      try {
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      } catch { return res.status(401).json({ error: 'Signature error' }); }
    }

    // Acknowledge immediately (Meta requires < 5s)
    res.status(200).send('EVENT_RECEIVED');

    const body = req.body;
    console.log('📨 Webhook event:', body.object);

    try {
      for (const entry of (body.entry || [])) {

        /* ── Instagram: comments ── */
        for (const change of (entry.changes || [])) {
          if (change.field === 'comments') {
            const { id: commentId, text, from } = change.value;
            if (from?.id === process.env.INSTAGRAM_ACCOUNT_ID) continue; // skip own
            const rule = findMatch(text, 'instagram');
            if (rule) {
              await sendReply(`${API}/${commentId}/replies`, { message: rule.reply }, process.env.INSTAGRAM_ACCESS_TOKEN);
              console.log(`✅ IG comment reply sent for keyword: ${rule.keyword}`);
            }
          }

          /* ── Facebook: page comments ── */
          if (change.field === 'feed' && change.value?.item === 'comment' && change.value?.verb === 'add') {
            const { comment_id, message, from } = change.value;
            if (from?.id === process.env.FACEBOOK_PAGE_ID) continue;
            const rule = findMatch(message, 'facebook');
            if (rule) {
              await sendReply(`${API}/${comment_id}/comments`, { message: rule.reply }, process.env.FACEBOOK_ACCESS_TOKEN);
              console.log(`✅ FB comment reply sent for keyword: ${rule.keyword}`);
            }
          }
        }

        /* ── Instagram / Facebook: DMs & Messenger ── */
        for (const msg of (entry.messaging || [])) {
          const text    = msg?.message?.text;
          const sender  = msg?.sender?.id;
          const isEcho  = msg?.message?.is_echo;
          if (!text || isEcho) continue;

          // Instagram DM
          if (body.object === 'instagram' && sender !== process.env.INSTAGRAM_ACCOUNT_ID) {
            const rule = findMatch(text, 'instagram');
            if (rule) {
              await sendReply(`${API}/${process.env.INSTAGRAM_ACCOUNT_ID}/messages`, {
                recipient: { id: sender }, message: { text: rule.reply }
              }, process.env.INSTAGRAM_ACCESS_TOKEN);
              console.log(`✅ IG DM reply sent for keyword: ${rule.keyword}`);
            }
          }

          // Facebook Messenger
          if (body.object === 'page' && sender !== process.env.FACEBOOK_PAGE_ID) {
            const rule = findMatch(text, 'facebook');
            if (rule) {
              await sendReply(`${API}/me/messages`, {
                recipient: { id: sender }, message: { text: rule.reply }, messaging_type: 'RESPONSE'
              }, process.env.FACEBOOK_ACCESS_TOKEN);
              console.log(`✅ FB Messenger reply sent for keyword: ${rule.keyword}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Webhook processing error:', err.message);
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
