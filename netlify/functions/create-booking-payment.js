// netlify/functions/create-booking-payment.js
//
// Creates a Stripe Checkout session for a single Auto Care service booking.
// Unlike LifeAdmin/Leftovers, this is a one-time payment, not a subscription --
// the amount is set dynamically based on which service the customer picked.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { serviceName, amountInDollars, customerEmail, userId, bookingId } = JSON.parse(event.body);

    if (!serviceName || !amountInDollars || amountInDollars <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'serviceName and a positive amountInDollars are required' }) };
    }

    const siteUrl = process.env.URL || 'http://localhost:8888';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Keon's Castle Auto Care -- ${serviceName}` },
          unit_amount: Math.round(amountInDollars * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      customer_email: customerEmail,
      client_reference_id: userId,
      success_url: `${siteUrl}/mobile-auto-care/app/index.html?checkout=success`,
      cancel_url: `${siteUrl}/mobile-auto-care/app/index.html?checkout=cancelled`,
      metadata: { app: 'autocare', userId, bookingId: bookingId || '' }
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('create-booking-payment error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
