export const PLAN_LIMITS = {
  free: { name: 'Free', ruleLimit: 3, monthlyAiLimit: 20 },
  starter: { name: 'Starter', ruleLimit: 5, monthlyAiLimit: 50 },
  growth: { name: 'Growth', ruleLimit: null, monthlyAiLimit: 1000 },
}

export async function getUserPlan(supabase, userId) {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('status, stripe_price_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error

  if (['active', 'trialing'].includes(subscription?.status)) {
    if (!process.env.STRIPE_PRICE_STARTER || !process.env.STRIPE_PRICE_GROWTH) {
      const configurationError = new Error('Stripe Price IDs are not configured')
      configurationError.code = 'CONFIG_MISSING'
      throw configurationError
    }
    if (subscription.stripe_price_id === process.env.STRIPE_PRICE_STARTER) return PLAN_LIMITS.starter
    if (subscription.stripe_price_id === process.env.STRIPE_PRICE_GROWTH) return PLAN_LIMITS.growth
    const configurationError = new Error('Active Stripe subscription uses an unsupported Price ID')
    configurationError.code = 'CONFIG_MISSING'
    throw configurationError
  }
  return PLAN_LIMITS.free
}
