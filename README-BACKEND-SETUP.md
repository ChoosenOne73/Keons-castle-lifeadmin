KEON'S CASTLE — GOING LIVE: THE FULL TO-DO LIST
===================================================
Everything below reflects what's ALREADY BUILT (real code, already written)
vs. what still needs YOU to click through account dashboards. Nothing in
the "already built" list needs any further coding -- it just needs to be
deployed and configured.

------------------------------------------------------------
WHAT'S ALREADY BUILT (no more code needed)
------------------------------------------------------------
- LifeAdmin: real subscription checkout (monthly/annual)
- Leftovers: real subscription checkout (monthly/annual)
- Auto Care: real one-time payment per booking
- Neighborhood Helper: real task payments + real provider payout system
- Roadside Warriors: real dispatch fee + service charge payments,
  real provider payout system
- ONE shared webhook that correctly routes events for all 5 apps
- A weekly, automatic Thursday payout job that pays providers their 95%
  cut for Neighborhood Helper and Roadside Warriors
- A full database schema covering every app (documents, pantry items,
  tasks, bookings, roadside requests, provider payout accounts)

------------------------------------------------------------
STEP 1 — Upload everything to GitHub
------------------------------------------------------------
Upload the ENTIRE contents of this package to your Keons-castle-lifeadmin
repo (not just lifeadmin-pwa this time -- everything: leftovers/,
mobile-auto-care/, neighborhood-helper/, roadside-assist/, web-studio/,
qr-codes/, plus the root index.html, terms.html, privacy.html).
Same method you already know: clear the path field completely, retype
the full path, commit.

------------------------------------------------------------
STEP 2 — Run the database schema
------------------------------------------------------------
Supabase -> SQL Editor -> New query -> paste ALL of supabase-schema.sql
(it now covers every app, not just LifeAdmin) -> Run.

------------------------------------------------------------
STEP 3 — Turn on Stripe Connect (new, one-time account setting)
------------------------------------------------------------
This is required for Neighborhood Helper and Roadside Warriors to be able
to pay real providers. It is NOT required for LifeAdmin, Leftovers, or
Auto Care.
1. In your Stripe dashboard -> Settings -> Connect
2. Click "Get started" and choose "Express accounts" as the account type
   (this is the simplest option -- Stripe handles the provider-facing
   onboarding form for you)
3. Fill in your platform's basic info when prompted (business name,
   website URL)

------------------------------------------------------------
STEP 4 — Create Stripe products & prices
------------------------------------------------------------
In Stripe (test mode), Products -> Add product, for each of these:

  "LifeAdmin Premium"     -> price $6/month AND price $50/year
  "Leftovers Premium"     -> price $3.99/month AND price $34.99/year

(Auto Care, Neighborhood Helper, and Roadside Warriors do NOT need
pre-created products -- their prices are set dynamically based on what
the customer picks, so there's nothing to create here for those three.)

Copy all 4 Price IDs (they start with "price_").

------------------------------------------------------------
STEP 5 — Add environment variables in Netlify
------------------------------------------------------------
You already have these two from before (leave them as-is):
  STRIPE_SECRET_KEY            (secret)
  SUPABASE_SERVICE_ROLE_KEY    (secret)

Add these NEW ones (all non-secret, "Same value for all deploy contexts"):
  SUPABASE_URL                      = https://qtetvcuxkulkkgnkajwz.supabase.co
  STRIPE_PRICE_LIFEADMIN_MONTHLY    = (price ID from Step 4)
  STRIPE_PRICE_LIFEADMIN_ANNUAL     = (price ID from Step 4)
  STRIPE_PRICE_LEFTOVERS_MONTHLY    = (price ID from Step 4)
  STRIPE_PRICE_LEFTOVERS_ANNUAL     = (price ID from Step 4)

------------------------------------------------------------
STEP 6 — Connect this site to GitHub (instead of drag-and-drop)
------------------------------------------------------------
1. In Netlify, go to your existing live site
2. Site configuration -> Build & deploy -> Link site to a Git repository
3. Choose GitHub -> select Keons-castle-lifeadmin
4. Publish directory: leave as "." (a single dot)
5. Deploy -- Netlify will run "npm install" automatically this time,
   which is what makes all the Functions actually work

------------------------------------------------------------
STEP 7 — Connect the Stripe webhook (ONE webhook covers everything)
------------------------------------------------------------
1. Once Step 6 is deployed, your webhook URL is:
   https://YOUR-SITE-NAME.netlify.app/.netlify/functions/stripe-webhook
2. Stripe -> Developers -> Webhooks -> "Add endpoint"
3. Paste that URL
4. Select these events:
     checkout.session.completed
     customer.subscription.updated
     customer.subscription.deleted
     account.updated
5. Copy the "Signing secret" (starts with whsec_)
6. Add ONE more Netlify environment variable:
     STRIPE_WEBHOOK_SECRET  = (the whsec_... value)   -- mark as secret

------------------------------------------------------------
STEP 8 — Test each app with a fake card
------------------------------------------------------------
Use this test card everywhere: 4242 4242 4242 4242, any future expiry,
any CVC, any ZIP.

  - LifeAdmin: Settings -> Premium plan -> subscribe -> confirm your
    Supabase "profiles" table shows plan = "premium"
  - Leftovers: same, in Leftovers' Premium screen
  - Auto Care: book any service -> pay -> confirm checkout completes
  - Neighborhood Helper / Roadside Warriors: as a PROVIDER, tap
    "Set up payouts" and complete Stripe's test onboarding form; as a
    CUSTOMER, complete a task/dispatch payment

------------------------------------------------------------
STEP 9 — Go live for real
------------------------------------------------------------
Only after everything above tests cleanly:
1. Switch Stripe to Live mode
2. Repeat Steps 3-4 in live mode (Connect + products/prices are separate
   between test and live)
3. Replace STRIPE_SECRET_KEY and all STRIPE_PRICE_* variables in Netlify
   with their live-mode equivalents
4. Set up a new webhook endpoint in live mode (Step 7, live mode this time)

------------------------------------------------------------
WHAT THIS DOES NOT YET INCLUDE
------------------------------------------------------------
- Real user login/accounts (checkout currently just asks for an email --
  no persistent "sign in" tying a returning visitor to their existing
  subscription or history yet)
- Full real-time database sync for Neighborhood Helper and Roadside
  Warriors -- payments are real and providers get paid for real, but the
  live task/tracking screens are still simulated locally rather than
  reading and writing to Supabase in real time. This is the natural next
  build phase once payments are confirmed working end to end.
