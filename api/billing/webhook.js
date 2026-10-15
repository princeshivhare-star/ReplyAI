import Stripe from 'stripe'
import { getAdminClient } from '../_supabase.js'

export const config = { api: { bodyParser: false } }

let stripe
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe webhook is not configured')
  }
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  return stripe
}

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

async function syncSubscription(subscription, customerId, userIdHint, eventCreated) {
  const supabase = getAdminClient()
  const userId = userIdHint || subscription.metadata?.userId
  let ownerId = userId

  if (!ownerId && customerId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (error) throw error
    ownerId = data?.user_id
  }
  if (!ownerId) throw new Error('No ReplyAI user is associated with this Stripe subscription')

  const item = subscription.items?.data?.[0]
  const { error } = await supabase.rpc('sync_stripe_subscription', {
    target_user_id: ownerId,
    target_customer_id: customerId || subscription.customer,
    target_subscription_id: subscription.id,
    target_price_id: item?.price?.id || null,
    target_status: subscription.status,
    target_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    target_cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    target_event_created: eventCreated,
  })
  if (error) throw error
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook is not configured' })
  }

  let event
  try {
    const rawBody = await readRawBody(req)
    event = getStripe().webhooks.constructEvent(
      rawBody,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (error) {
    console.error('Stripe webhook signature error:', error.message)
    return res.status(error.message === 'Request body is too large' ? 413 : 400)
      .json({ error: error.message === 'Request body is too large' ? error.message : 'Invalid webhook signature' })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const checkout = event.data.object
      if (checkout.mode === 'subscription' && checkout.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(checkout.subscription)
        await syncSubscription(subscription, checkout.customer, checkout.metadata?.userId || checkout.client_reference_id, event.created)
      }
    } else if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object
      await syncSubscription(subscription, subscription.customer, subscription.metadata?.userId, event.created)
    }
    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Stripe webhook processing error:', error.message)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
