// netlify/functions/create-checkout.js
//
// Creates a Stripe Checkout session for a subscription plan.
// Shared by LifeAdmin and Leftovers -- both are simple monthly/annual
// subscriptions, so they use the exact same logic and just point at
// different Stripe Price IDs and return URLs.
//
// Called from the frontend when the user clicks "Subscribe monthly" or "Subscribe annually".

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Maps the "app" the request came from to its env var names and return path.
// To add a new subscription app later, add one line here -- no other code changes needed.
const APP_CONFIG = {
  lifeadmin: {
    monthlyPriceEnv: 'STRIPE_PRICE_LIFEADMIN_MONTHLY',
    annualPriceEnv: 'STRIPE_PRICE_LIFEADMIN_ANNUAL',
    returnPath: 'lifeadmin-pwa/index.html',
  },
  leftovers: {
    monthlyPriceEnv: 'STRIPE_PRICE_LEFTOVERS_MONTHLY',
    annualPriceEnv: 'STRIPE_PRICE_LEFTOVERS_ANNUAL',
    returnPath: 'leftovers/index.html',
  },
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { app, interval, userEmail, userId } = JSON.parse(event.body);

    const config = APP_CONFIG[app];
    if (!config) {
      return { statusCode: 400, body: JSON.stringify({ error: `Unknown app: ${app}. Must be one of: ${Object.keys(APP_CONFIG).join(', ')}` }) };
    }
    if (!['month', 'year'].includes(interval)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'interval must be "month" or "year"' }) };
    }

    const priceId = interval === 'month'
      ? process.env[config.monthlyPriceEnv]
      : process.env[config.annualPriceEnv];

    if (!priceId) {
      return { statusCode: 500, body: JSON.stringify({ error: `Missing price ID env var: ${interval === 'month' ? config.monthlyPriceEnv : config.annualPriceEnv}` }) };
    }

    const siteUrl = process.env.URL || 'http://localhost:8888';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      client_reference_id: userId, // links the Stripe session back to the Supabase user
      success_url: `${siteUrl}/${config.returnPath}?checkout=success`,
      cancel_url: `${siteUrl}/${config.returnPath}?checkout=cancelled`,
      metadata: { app, userId, interval }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error('create-checkout error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
