// netlify/functions/payout-providers.js
//
// Pays out providers their share of everything they've earned since their
// last payout -- this is what actually makes "paid weekly, every Thursday"
// (Roadside Warriors) and Neighborhood Helper task payouts real, using
// Stripe Transfers to each provider's Connect account.
//
// This is meant to run on a schedule (see the Netlify scheduled function
// setup in README-BACKEND-SETUP.md) so it fires automatically every
// Thursday, rather than requiring anyone to click a button. It can also be
// called manually for testing.
//
// Requires each provider to have already completed Stripe Connect
// onboarding (connect-onboard.js) -- unpaid providers are simply skipped
// and left for the next run.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PROVIDER_CUT = 0.95; // providers keep 95%; adjust here if this ever changes

exports.handler = async (event) => {
  try {
    const results = [];

    // ---- Roadside Warriors: pay out completed, unpaid requests ----
    const { data: roadsideJobs } = await supabase
      .from('roadside_requests')
      .select('*')
      .eq('status', 'completed')
      .eq('service_paid', true)
      .eq('provider_paid_out', false);

    for (const job of roadsideJobs || []) {
      if (!job.provider_id) continue;
      const { data: provider } = await supabase
        .from('providers')
        .select('stripe_connect_account_id, onboarding_complete')
        .eq('id', job.provider_id)
        .single();

      if (!provider?.onboarding_complete) continue;

      const totalOwed = (job.dispatch_fee || 0) + (job.service_charge || 0);
      const providerAmount = Math.round(totalOwed * PROVIDER_CUT * 100); // in cents

      const transfer = await stripe.transfers.create({
        amount: providerAmount,
        currency: 'usd',
        destination: provider.stripe_connect_account_id,
        description: `Weekly payout -- ${job.service_name}`,
      });

      await supabase.from('roadside_requests')
        .update({ provider_paid_out: true, stripe_provider_transfer_id: transfer.id })
        .eq('id', job.id);

      results.push({ app: 'roadside-warriors', jobId: job.id, transferId: transfer.id, amount: providerAmount / 100 });
    }

    // ---- Neighborhood Helper: pay out completed, unpaid tasks ----
    const { data: helperTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'completed')
      .not('stripe_payment_intent_id', 'is', null)
      .eq('provider_paid_out', false);

    for (const task of helperTasks || []) {
      if (!task.accepted_by || !task.price) continue;
      const { data: provider } = await supabase
        .from('providers')
        .select('stripe_connect_account_id, onboarding_complete')
        .eq('id', task.accepted_by)
        .single();

      if (!provider?.onboarding_complete) continue;

      const providerAmount = Math.round(task.price * PROVIDER_CUT * 100);

      const transfer = await stripe.transfers.create({
        amount: providerAmount,
        currency: 'usd',
        destination: provider.stripe_connect_account_id,
        description: `Task payout -- ${task.title}`,
      });

      await supabase.from('tasks')
        .update({ provider_paid_out: true, stripe_provider_transfer_id: transfer.id })
        .eq('id', task.id);

      results.push({ app: 'neighborhood-helper', taskId: task.id, transferId: transfer.id, amount: providerAmount / 100 });
    }

    return { statusCode: 200, body: JSON.stringify({ payoutsProcessed: results.length, results }) };
  } catch (err) {
    console.error('payout-providers error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
