// netlify/functions/stripe-webhook.js
//
// ONE webhook endpoint, shared by every app. Stripe calls this URL
// automatically whenever something happens (a payment succeeds, a
// subscription renews or cancels, a provider finishes Connect onboarding).
// This is the ONLY place that ever grants "premium," marks a booking paid,
// or marks a provider ready to receive payouts -- never the frontend,
// since that would let anyone fake having paid.
//
// Routing is based on event type, and for checkout.session.completed,
// on the "app" value stored in the session's metadata when it was created.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    switch (stripeEvent.type) {

      // ---- Subscriptions (LifeAdmin, Leftovers) and one-time payments
      // (Auto Care, Neighborhood Helper, Roadside Warriors) all fire this
      // same event when checkout finishes -- we branch on metadata.app.
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const app = session.metadata?.app;

        if (app === 'lifeadmin' || app === 'leftovers') {
          const userId = session.client_reference_id;
          console.log('Attempting profile update for userId:', userId);
          const { data, error } = await supabase.from('profiles').update({
            plan: 'premium',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
            billing_interval: session.metadata?.interval,
          }).eq('id', userId).select();
          if (error) {
            console.error('Supabase update FAILED:', JSON.stringify(error));
          } else {
            console.log('Supabase update SUCCESS, rows affected:', JSON.stringify(data));
          }

        } else if (app === 'autocare') {
          const bookingId = session.metadata?.bookingId;
          if (bookingId) {
            await supabase.from('bookings').update({
              stripe_payment_intent_id: session.payment_intent,
            }).eq('id', bookingId);
          }

        } else if (app === 'neighborhood-helper' || app === 'roadside-warriors') {
          const { recordId, recordTable, paymentType, providerId } = session.metadata || {};
          if (recordId && recordTable) {
            let updates = {};
            if (recordTable === 'roadside_requests') {
              updates = paymentType === 'dispatch'
                ? { dispatch_paid: true, stripe_dispatch_payment_intent_id: session.payment_intent, status: 'matched' }
                : { service_paid: true, provider_id: providerId || null, status: 'completed' };
            } else {
              updates = { status: 'accepted', stripe_payment_intent_id: session.payment_intent };
            }
            await supabase.from(recordTable).update(updates).eq('id', recordId);
          }
        }
        break;
      }

      // ---- Subscription renewals / cancellations (LifeAdmin, Leftovers)
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const status = subscription.status;
        const plan = (status === 'active' || status === 'trialing') ? 'premium' : 'free';

        await supabase.from('profiles')
          .update({ subscription_status: status, plan })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      // ---- A provider (Neighborhood Helper or Roadside Warriors) finishes
      // Stripe's hosted onboarding -- this is what unlocks them to receive
      // real payouts through marketplace-payment.js
      case 'account.updated': {
        const account = stripeEvent.data.object;
        const isFullyOnboarded = account.details_submitted && account.charges_enabled;

        await supabase.from('providers')
          .update({ onboarding_complete: isFullyOnboarded, verified: isFullyOnboarded })
          .eq('stripe_connect_account_id', account.id);
        break;
      }

      default:
        // Other event types are ignored, but Stripe still needs a 200 response
        break;
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('stripe-webhook handler error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
