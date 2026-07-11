// netlify/functions/marketplace-payment.js
//
// Charges the customer for a marketplace service (a Neighborhood Helper task,
// or a Roadside Warriors dispatch fee / service charge). The full amount is
// collected to the platform first -- providers are paid out afterward in a
// weekly batch (see payout-providers.js), matching the "paid every Thursday"
// model described in the app. This is simpler and more reliable than trying
// to split every single transaction in real time, and it's how most
// marketplaces (Uber, DoorDash, etc.) actually do it under the hood.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const {
      app,               // 'neighborhood-helper' | 'roadside-warriors'
      description,       // e.g. "Jumpstart -- dispatch fee"
      amountInDollars,
      customerEmail,
      customerId,
      providerId,        // who should be credited for the weekly payout, if known yet
      recordId,          // the tasks.id or roadside_requests.id this payment is for
      recordTable,       // 'tasks' | 'roadside_requests'
      paymentType,       // 'dispatch' | 'service' -- only used for roadside-warriors
    } = JSON.parse(event.body);

    if (!amountInDollars || amountInDollars <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'amountInDollars must be positive' }) };
    }

    const siteUrl = process.env.URL || 'http://localhost:8888';
    const returnPath = app === 'roadside-warriors' ? 'roadside-assist/app/index.html' : 'neighborhood-helper/index.html';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: description || 'Marketplace service' },
          unit_amount: Math.round(amountInDollars * 100),
        },
        quantity: 1,
      }],
      customer_email: customerEmail,
      success_url: `${siteUrl}/${returnPath}?checkout=success`,
      cancel_url: `${siteUrl}/${returnPath}?checkout=cancelled`,
      metadata: { app, customerId, providerId: providerId || '', recordId: recordId || '', recordTable: recordTable || '', paymentType: paymentType || '' },
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('marketplace-payment error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

