// netlify/functions/connect-onboard.js
//
// Creates (or resumes) a Stripe Connect "Express" account for a provider,
// and returns a hosted onboarding link. Shared by Neighborhood Helper and
// Roadside Warriors -- both need a way to actually pay real providers,
// not just the platform owner.
//
// How this works, in plain terms:
// 1. A provider taps "Set up payouts" in the app
// 2. This function creates them a Stripe Connect account (or reuses one
//    they already started) and returns a link to Stripe's own hosted
//    onboarding form (ID verification, bank account, etc.)
// 3. The provider fills that out on Stripe's site, then gets redirected back
// 4. Once Stripe confirms their account is fully verified, the webhook
//    (stripe-webhook.js) marks them as onboarding_complete in Supabase

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId, app, email } = JSON.parse(event.body);

    if (!userId || !['neighborhood-helper', 'roadside-warriors'].includes(app)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId and a valid app are required' }) };
    }

    // Check if this provider already has a Connect account on file
    const { data: existing } = await supabase
      .from('providers')
      .select('stripe_connect_account_id')
      .eq('id', userId)
      .single();

    let accountId = existing?.stripe_connect_account_id;

    if (!accountId) {
      // First time -- create a new Express account for them
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });
      accountId = account.id;

      await supabase.from('providers').upsert({
        id: userId,
        app,
        stripe_connect_account_id: accountId,
        onboarding_complete: false,
      });
    }

    const siteUrl = process.env.URL || 'http://localhost:8888';
    const returnPath = app === 'roadside-warriors' ? 'roadside-assist/app/index.html' : 'neighborhood-helper/index.html';

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/${returnPath}?onboarding=refresh`,
      return_url: `${siteUrl}/${returnPath}?onboarding=complete`,
      type: 'account_onboarding',
    });

    return { statusCode: 200, body: JSON.stringify({ url: accountLink.url }) };
  } catch (err) {
    console.error('connect-onboard error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
