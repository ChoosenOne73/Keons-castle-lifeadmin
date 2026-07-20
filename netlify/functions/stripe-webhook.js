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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Plain REST call to Supabase's PostgREST API instead of the supabase-js
// client library -- avoids a mystery 403 the SDK was triggering.
async function supabaseUpdate(table, matchColumn, matchValue, updates) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${matchColumn}=eq.${encodeURIComponent(matchValue)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    console.error(`Supabase update FAILED (${table}):`, res.status, JSON.stringify(data));
    return { data: null, error: data };
  }
  console.log(`Supabase update SUCCESS (${table}), rows affected:`, JSON.stringify(data));
  return { data, error: null };
}

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
          await supabaseUpdate('profiles', 'id', userId, {
            plan: 'premium',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
            billing_interval: session.metadata?.interval,
          });

        } else if (app === 'autocare') {
          const bookingId = session.metadata?.bookingId;
          if (bookingId) {
            await supabaseUpdate('bookings', 'id', bookingId, {
              stripe_payment_intent_id: session.payment_intent,
            });
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
            await supabaseUpdate(recordTable, 'id', recordId, updates);
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

        await supabaseUpdate('profiles', 'stripe_subscription_id', subscription.id, {
          subscription_status: status,
          plan,
        });
        break;
      }

      // ---- A provider (Neighborhood Helper or Roadside Warriors) finishes
      // Stripe's hosted onboarding -- this is what unlocks them to receive
      // real payouts through marketplace-payment.js
      case 'account.updated': {
        const account = stripeEvent.data.object;
        const isFullyOnboarded = account.details_submitted && account.charges_enabled;

        await supabaseUpdate('providers', 'stripe_connect_account_id', account.id, {
          onboarding_complete: isFullyOnboarded,
          verified: isFullyOnboarded,
        });
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
