export function matchesRule(text, rule) {
  const incoming = text.trim().toLowerCase()
  const keyword = rule.keyword.toLowerCase()

  if (rule.match_type === 'exact') return incoming === keyword.trim()
  if (rule.match_type === 'startsWith') return incoming.startsWith(keyword)
  return incoming.includes(keyword)
}

export function findMatchingRule(text, rules) {
  return rules.find((rule) => matchesRule(text, rule)) || null
}
