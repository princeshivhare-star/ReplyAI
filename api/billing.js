import Stripe from 'stripe'
import { authenticateUser, getAdminClient, methodNotAllowed, respondWithServerError } from './_supabase.js'
import { getUserPlan } from './_plans.js'

let stripe
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured')
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  return stripe
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return methodNotAllowed(res, ['GET', 'POST'])

  try {
    const user = await authenticateUser(req, res)
    if (!user) return
    const supabase = getAdminClient()
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_price_id, status, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw error

    if (req.method === 'GET') {
      const plan = await getUserPlan(supabase, user.id)
      const monthStart = `${new Date().toISOString().slice(0, 7)}-01`
      const { data: usage, error: usageError } = await supabase
        .from('ai_usage_monthly')
        .select('generations')
        .eq('user_id', user.id)
        .eq('usage_month', monthStart)
        .maybeSingle()
      if (usageError) throw usageError
      return res.status(200).json({
        plan: plan.name,
        aiUsed: usage?.generations || 0,
        aiLimit: plan.monthlyAiLimit,
        status: subscription?.status || 'inactive',
        currentPeriodEnd: subscription?.current_period_end || null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      })
    }

    if (!process.env.APP_URL) return res.status(503).json({ error: 'Application URL is not configured' })
    const { action, plan } = req.body ?? {}
    const stripeClient = getStripe()

    if (action === 'portal') {
      if (!subscription?.stripe_customer_id) return res.status(400).json({ error: 'No billing account was found' })
      const portal = await stripeClient.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: new URL('/', process.env.APP_URL).toString(),
      })
      return res.status(200).json({ url: portal.url })
    }

    if (action !== 'checkout' || !['starter', 'growth'].includes(plan)) {
      return res.status(400).json({ error: 'Choose a supported plan' })
    }
    if (subscription?.stripe_subscription_id && !['canceled', 'incomplete_expired'].includes(subscription.status)) {
      return res.status(409).json({ error: 'Use the billing portal to change your existing subscription.' })
    }

    const priceId = plan === 'starter' ? process.env.STRIPE_PRICE_STARTER : process.env.STRIPE_PRICE_GROWTH
    if (!priceId) return res.status(503).json({ error: 'That subscription plan is not configured yet' })

    const expectedAmount = plan === 'starter' ? 1900 : 4900
    const price = await stripeClient.prices.retrieve(priceId)
    if (
      !price.active
      || price.currency !== 'usd'
      || price.unit_amount !== expectedAmount
      || price.recurring?.interval !== 'month'
    ) {
      console.error(`Stripe Price configuration does not match the ${plan} plan`)
      return res.status(503).json({ error: 'The selected plan is not configured correctly. Please contact support.' })
    }

    const checkout = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: new URL('/?billing=success', process.env.APP_URL).toString(),
      cancel_url: new URL('/?billing=cancelled', process.env.APP_URL).toString(),
      client_reference_id: user.id,
      ...(subscription?.stripe_customer_id
        ? { customer: subscription.stripe_customer_id }
        : { customer_email: user.email }),
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
    })
    return res.status(200).json({ url: checkout.url })
  } catch (error) {
    return respondWithServerError(res, error, 'Unable to process billing right now')
  }
}
