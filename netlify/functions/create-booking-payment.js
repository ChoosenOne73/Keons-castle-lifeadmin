// netlify/functions/create-booking-payment.js
//
// Creates a Stripe Checkout session for a single service booking.
// Unlike LifeAdmin/Leftovers, this is a one-time payment, not a subscription --
// the amount is set dynamically based on which service the customer picked.
//
// Shared across apps: pass `app` as 'autocare' or 'roadside' to control which
// app the customer gets redirected back to and how the booking is tagged in
// Stripe metadata (and eventually in the webhook / Supabase bookings table).
// Defaults to 'autocare' if not provided, so existing Auto Care calls that
// don't send `app` yet keep working with no change on their end.
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const APPS = {
  autocare: {
    label: "Keon's Castle Auto Care",
    path: 'mobile-auto-care/app/index.html'
  },
  roadside: {
    label: "Keon's Castle Roadside Warriors",
    path: 'roadside-assist/app/index.html'
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { serviceName, amountInDollars, customerEmail, userId, bookingId, app } = JSON.parse(event.body);

    if (!serviceName || !amountInDollars || amountInDollars <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'serviceName and a positive amountInDollars are required' }) };
    }

    const appKey = APPS[app] ? app : 'autocare';
    const appConfig = APPS[appKey];

    const siteUrl = process.env.URL || 'http://localhost:8888';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${appConfig.label} -- ${serviceName}` },
          unit_amount: Math.round(amountInDollars * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      customer_email: customerEmail,
      client_reference_id: userId,
      success_url: `${siteUrl}/${appConfig.path}?checkout=success`,
      cancel_url: `${siteUrl}/${appConfig.path}?checkout=cancelled`,
      metadata: { app: appKey, userId, bookingId: bookingId || '' }
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('create-booking-payment error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
