// auth.js
//
// Real account system for LifeAdmin, backed by Supabase Auth.
// Replaces the old fake "demo build" sign-in/sign-out flow.
//
// Responsibilities:
//  - Show a login/signup gate until a real session exists
//  - Create/read the matching row in `profiles` (created automatically by
//    a DB trigger on signup, per the existing supabase-schema.sql)
//  - Expose window.currentUser / window.currentProfile so interactions.js
//    (Subscribe button, sign out, etc.) can use the real signed-in user
//  - Handle the ?checkout=success / ?checkout=cancelled return from Stripe

const SUPABASE_URL = 'https://pbsxqddgdkxrhzifztpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3hxZGRnZGt4cmh6aWZ6dHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTk0NzcsImV4cCI6MjA5OTM5NTQ3N30.9ax-68EbpxpWYAd9CLovY5DhGG88QPL7Qydm4sLGsrM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.currentUser = null;
window.currentProfile = null;

let authMode = 'signin'; // 'signin' | 'signup'

function el(id) { return document.getElementById(id); }

function showAuthError(msg) {
  const e = el('authError');
  e.textContent = msg;
  e.style.display = 'block';
  el('authInfo').style.display = 'none';
}
function showAuthInfo(msg) {
  const i = el('authInfo');
  i.textContent = msg;
  i.style.display = 'block';
  el('authError').style.display = 'none';
}
function clearAuthMessages() {
  el('authError').style.display = 'none';
  el('authInfo').style.display = 'none';
}

function toggleAuthMode() {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  clearAuthMessages();
  applyAuthModeToUI();
}

function applyAuthModeToUI() {
  if (authMode === 'signup') {
    el('authTitle').textContent = 'Create your account';
    el('authSubtitle').textContent = 'Start your 14-day free trial — no credit card needed.';
    el('authSubmitBtn').textContent = 'Create account';
    el('authToggleBtn').textContent = 'Already have an account? Sign in';
  } else {
    el('authTitle').textContent = 'Welcome back';
    el('authSubtitle').textContent = 'Sign in to your LifeAdmin account.';
    el('authSubmitBtn').textContent = 'Sign in';
    el('authToggleBtn').textContent = "New here? Create an account";
  }
}

// Opens the auth gate on top of the preview. mode: 'signup' | 'signin'
function openAuthGate(mode) {
  clearAuthMessages();
  authMode = mode === 'signin' ? 'signin' : 'signup';
  applyAuthModeToUI();
  el('authGate').classList.add('show');
}
function closeAuthGate() {
  el('authGate').classList.remove('show');
}
window.openAuthGate = openAuthGate;
window.closeAuthGate = closeAuthGate;

async function handleAuthSubmit() {
  clearAuthMessages();
  const email = el('authEmail').value.trim();
  const password = el('authPassword').value;

  if (!email || !password) {
    showAuthError('Please enter both an email and a password.');
    return;
  }
  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters.');
    return;
  }

  el('authSubmitBtn').disabled = true;
  el('authSubmitBtn').textContent = authMode === 'signup' ? 'Creating account…' : 'Signing in…';

  try {
    if (authMode === 'signup') {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) { showAuthError(error.message); return; }

      if (data.session) {
        await onSignedIn(data.session);
      } else {
        // Email confirmation is required by the Supabase project settings.
        showAuthInfo('Account created! Check your email to confirm it, then sign in below.');
        authMode = 'signin';
        applyAuthModeToUI();
      }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) { showAuthError(error.message); return; }
      await onSignedIn(data.session);
    }
  } catch (err) {
    console.error(err);
    showAuthError('Something went wrong. Please try again.');
  } finally {
    el('authSubmitBtn').disabled = false;
    el('authSubmitBtn').textContent = authMode === 'signup' ? 'Create account' : 'Sign in';
  }
}

async function fetchProfile(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('Failed to load profile:', error.message);
    return null;
  }
  return data;
}

function applyProfileToUI(user, profile) {
  const email = user.email || '';
  const fullName = (profile && profile.full_name) || email.split('@')[0] || 'Member';
  const parts = fullName.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'ME';

  document.querySelectorAll('.avatar').forEach(a => a.textContent = initials);
  if (el('profile-avatar')) el('profile-avatar').textContent = initials;
  if (el('profile-name')) el('profile-name').textContent = fullName;
  if (el('profile-email')) el('profile-email').textContent = email;

  const isPremium = profile && profile.plan === 'premium';
  if (el('profile-plan-text')) el('profile-plan-text').textContent = isPremium ? 'Premium plan' : 'Free plan';
  if (el('sub-plan-label')) el('sub-plan-label').textContent = isPremium ? 'Premium plan' : 'Free plan';
  if (el('sub-plan-sub')) {
    if (isPremium) {
      const interval = profile.billing_interval === 'year' ? 'year' : 'month';
      el('sub-plan-sub').textContent = interval === 'year' ? '$35.99/year' : '$3.99/month';
    } else {
      el('sub-plan-sub').textContent = 'Upgrade for unlimited documents';
    }
  }
}

async function onSignedIn(session) {
  window.currentUser = session.user;
  const profile = await fetchProfile(session.user.id);
  window.currentProfile = profile;
  applyProfileToUI(session.user, profile);

  el('authGate').classList.remove('show');
  el('previewBanner').classList.remove('show');
}

function resetToPreviewUI() {
  document.querySelectorAll('.avatar').forEach(a => a.textContent = 'GU');
  if (el('profile-avatar')) el('profile-avatar').textContent = 'GU';
  if (el('profile-name')) el('profile-name').textContent = 'Guest Preview';
  if (el('profile-email')) el('profile-email').textContent = 'Sign up to save your data';
  if (el('profile-plan-text')) el('profile-plan-text').textContent = 'Preview mode';
  if (el('sub-plan-label')) el('sub-plan-label').textContent = 'Preview mode';
  if (el('sub-plan-sub')) el('sub-plan-sub').textContent = 'Create a free account to subscribe';
}

// Shows the guest preview state: demo screens are visible, but no real
// account is signed in yet. Used on first load (no session) and after sign-out.
function showPreview() {
  window.currentUser = null;
  window.currentProfile = null;
  resetToPreviewUI();
  el('authGate').classList.remove('show');
  el('previewBanner').classList.add('show');
}

// Real sign-out, replacing the old fake demo overlay logic.
async function realSignOut() {
  await supabaseClient.auth.signOut();
  showPreview();
}
window.realSignOut = realSignOut;

// After returning from Stripe checkout, the webhook may take a couple of
// seconds to mark the account premium. Poll the profile briefly so the UI
// updates without the user needing to manually refresh.
async function refreshProfileWithRetry(userId, attempts = 5, delayMs = 1500) {
  for (let i = 0; i < attempts; i++) {
    const profile = await fetchProfile(userId);
    if (profile && profile.plan === 'premium') {
      window.currentProfile = profile;
      applyProfileToUI(window.currentUser, profile);
      return;
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
}

function handleCheckoutReturnParams() {
  const params = new URLSearchParams(window.location.search);
  const checkout = params.get('checkout');
  if (!checkout) return;

  // Clean the URL so refreshing doesn't re-trigger this.
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);

  if (checkout === 'success') {
    if (typeof showToast === 'function') showToast('Payment successful! Updating your account…');
    if (window.currentUser) refreshProfileWithRetry(window.currentUser.id);
  } else if (checkout === 'cancelled') {
    if (typeof showToast === 'function') showToast('Checkout cancelled — no charge was made.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    await onSignedIn(session);
    handleCheckoutReturnParams();
  } else {
    showPreview();
  }

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') showPreview();
  });
});
