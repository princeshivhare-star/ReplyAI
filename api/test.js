// api/test.js — Test a message against keyword rules without sending anything
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text, platform = 'instagram' } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const rules = [
    { id:1, keyword:'price',     matchType:'contains', reply:'Hi! 👋 Our prices start from $19/mo. DM us for a custom quote!' },
    { id:2, keyword:'shipping',  matchType:'contains', reply:'We ship worldwide! 🚀 Free shipping on orders $50+!' },
    { id:3, keyword:'discount',  matchType:'contains', reply:'🎁 Use code SAVE20 for 20% off! Valid this week only.' },
    { id:4, keyword:'available', matchType:'contains', reply:'Yes! Still in stock ✅ — grab yours before it sells out!' },
    { id:5, keyword:'collab',    matchType:'contains', reply:'Love the interest! 💫 DM us your media kit.' },
  ];

  const h = text.toLowerCase();
  const rule = rules.find(r => {
    const n = r.keyword.toLowerCase();
    return r.matchType === 'exact' ? h.trim() === n : h.includes(n);
  });

  return res.json(rule
    ? { matched: true,  keyword: rule.keyword, ruleId: rule.id, reply: rule.reply, text, platform }
    : { matched: false, message: 'No rule matched', text, platform }
  );
}
