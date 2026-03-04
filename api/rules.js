// api/rules.js
// Vercel Serverless Function — Keyword Rules CRUD API
// GET /api/rules, POST /api/rules

// In production: replace with Vercel KV, PlanetScale, or Supabase
// For now: module-level cache (persists per serverless instance)
let rules = [
  { id: 1, keyword: 'price',     matchType: 'contains', reply: 'Hi! 👋 Our prices start from $19/mo. DM us for a custom quote!',              platform: 'both', active: true, triggerCount: 0 },
  { id: 2, keyword: 'shipping',  matchType: 'contains', reply: 'We ship worldwide! 🚀 Free shipping on orders $50+!',                          platform: 'both', active: true, triggerCount: 0 },
  { id: 3, keyword: 'discount',  matchType: 'contains', reply: '🎁 Use code SAVE20 for 20% off! Valid this week only.',                        platform: 'both', active: true, triggerCount: 0 },
  { id: 4, keyword: 'available', matchType: 'contains', reply: 'Yes! Still in stock ✅ — grab yours before it sells out. Link in bio!',        platform: 'both', active: true, triggerCount: 0 },
  { id: 5, keyword: 'collab',    matchType: 'contains', reply: 'Love the interest! 💫 DM us your media kit and we\'ll reply within 48hrs.',   platform: 'both', active: true, triggerCount: 0 },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  // GET /api/rules
  if (req.method === 'GET' && !id) {
    return res.status(200).json({ rules, total: rules.length });
  }

  // GET /api/rules?id=1
  if (req.method === 'GET' && id) {
    const rule = rules.find(r => r.id === Number(id));
    return rule ? res.json(rule) : res.status(404).json({ error: 'Not found' });
  }

  // POST /api/rules — create
  if (req.method === 'POST') {
    const { keyword, reply, matchType = 'contains', platform = 'both' } = req.body;
    if (!keyword?.trim()) return res.status(400).json({ error: 'keyword required' });
    if (!reply?.trim())   return res.status(400).json({ error: 'reply required' });
    const rule = { id: Date.now(), keyword: keyword.trim(), reply: reply.trim(), matchType, platform, active: true, triggerCount: 0 };
    rules.push(rule);
    return res.status(201).json(rule);
  }

  // PUT /api/rules?id=1 — update
  if (req.method === 'PUT' && id) {
    const idx = rules.findIndex(r => r.id === Number(id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    rules[idx] = { ...rules[idx], ...req.body };
    return res.json(rules[idx]);
  }

  // DELETE /api/rules?id=1
  if (req.method === 'DELETE' && id) {
    const before = rules.length;
    rules = rules.filter(r => r.id !== Number(id));
    return rules.length < before
      ? res.json({ success: true })
      : res.status(404).json({ error: 'Not found' });
  }

  // PATCH /api/rules?id=1&action=toggle
  if (req.method === 'PATCH' && id) {
    const rule = rules.find(r => r.id === Number(id));
    if (!rule) return res.status(404).json({ error: 'Not found' });
    rule.active = !rule.active;
    return res.json(rule);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
