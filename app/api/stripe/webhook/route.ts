import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook error: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 400 }
    )
  }

  const service = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id

      const updatePayload = {
        plan: 'pro',
        stripe_subscription_id: session.subscription as string,
        updated_at: new Date().toISOString(),
      }

      if (userId) {
        await service
          .from('user_subscriptions')
          .update(updatePayload)
          .eq('user_id', userId)
      } else if (session.customer) {
        // Fallback: look up by Stripe customer ID stored at checkout-session creation
        await service
          .from('user_subscriptions')
          .update(updatePayload)
          .eq('stripe_customer_id', session.customer as string)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await service
        .from('user_subscriptions')
        .update({ plan: 'free', stripe_subscription_id: null, updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      if (sub.status === 'active' || sub.status === 'trialing') break
      if (['past_due', 'canceled', 'unpaid'].includes(sub.status)) {
        await service
          .from('user_subscriptions')
          .update({ plan: 'free', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
