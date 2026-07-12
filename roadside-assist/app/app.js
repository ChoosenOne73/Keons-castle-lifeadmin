// ===== Static dropdown data =====
const CAR_MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Jeep', 'Hyundai', 'Kia', 'Subaru', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Ram', 'GMC', 'Tesla', 'Other'];
const CAR_MODELS = {
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],
  Ford: ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang'],
  Chevrolet: ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Cruze'],
  Nissan: ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Frontier'],
  Jeep: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe'],
  Kia: ['Forte', 'Optima', 'Sportage', 'Sorento'],
  Subaru: ['Outback', 'Forester', 'Impreza', 'Crosstrek'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE'],
  Volkswagen: ['Jetta', 'Passat', 'Tiguan', 'Atlas'],
  Ram: ['1500', '2500', '3500'],
  GMC: ['Sierra', 'Terrain', 'Acadia', 'Yukon'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  Other: ['Other']
};
const SERVICE_LABELS = {
  jump: { name: 'Jumpstart', emoji: '🔋', base: 45, cls: 'di-amber' },
  tire: { name: 'Flat Tire Change', emoji: '🛞', base: 55, cls: 'di-blue' },
  plug: { name: 'Tire Plug / Repair', emoji: '🔧', base: 40, cls: 'di-green' },
  fuel: { name: 'Fuel Delivery (up to 2 gal)', emoji: '⛽', base: 40, cls: 'di-purple' }
};
const DISPATCH_FEE = 50;
const PROVIDER_CUT = 0.95; // providers keep 95% of every job total
function nextThursday() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun...4=Thu
  let diff = (4 - day + 7) % 7;
  if (diff === 0) diff = 7; // if today is Thursday, show next week's
  d.setDate(d.getDate() + diff);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
const PROVIDER_POOL = [
  { name: 'Jake Turner', initials: 'JT', rating: 4.9, vehicle: 'Flatbed Tow Truck · Silver' },
  { name: 'Renee Alvarez', initials: 'RA', rating: 4.95, vehicle: 'Service Van · White' },
  { name: 'Sam Okafor', initials: 'SO', rating: 4.8, vehicle: 'Pickup Truck · Blue' }
];

function populateSelect(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(i => `<option value="${i}">${i}</option>`).join('');
}
function populateYears(id) {
  const years = [];
  for (let y = new Date().getFullYear() + 1; y >= 1995; y--) years.push(y);
  populateSelect(id, years);
}
function populateModels() {
  const make = document.getElementById('reqMake').value;
  populateSelect('reqModel', CAR_MODELS[make] || ['Other']);
}
function toggleFuelTypeField() {
  const isFuel = document.getElementById('reqService').value === 'fuel';
  document.getElementById('fuelTypeField').style.display = isFuel ? 'block' : 'none';
}
function populateProvModels() {
  // provider model is a free text input, no-op placeholder for symmetry
}

// ===== App state =====
let currentRole = null; // 'customer' | 'provider'
let prevScreen = 'screen-role';
let activeRequest = null; // { serviceKey, year, make, model, location, phone, notes, provider, statusIndex, etaSeconds, total }
let etaTimer = null;
let statusAdvanceTimer = null;
let customerActivity = [];
let providerEarnings = [];
let providerOnline = false;
let incomingRequestTimer = null;
let simulatedIncoming = [];
let onboardStep = 1;
let selfieCaptured = false;
let licenseCaptured = false;

const STATUS_STEPS = ['Requested', 'Matched with a provider', 'Provider en route', 'Provider has arrived', 'Service complete'];

const custNavMap = { 'screen-cust-home': 'nav-cust-home', 'screen-cust-request': 'nav-cust-request', 'screen-cust-activity': 'nav-cust-activity', 'screen-cust-settings': 'nav-cust-settings' };
const provNavMap = { 'screen-prov-dashboard': 'nav-prov-dashboard', 'screen-prov-earnings': 'nav-prov-earnings', 'screen-prov-settings': 'nav-prov-settings' };

function showScreen(id) {
  prevScreen = id;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const map = currentRole === 'provider' ? provNavMap : custNavMap;
  if (map[id]) document.getElementById(map[id]).classList.add('active');

  if (id === 'screen-cust-home') renderCustHome();
  if (id === 'screen-cust-request') { populateYears('reqYear'); populateSelect('reqMake', CAR_MAKES); populateModels(); toggleFuelTypeField(); }
  if (id === 'screen-cust-activity') renderCustActivity();
  if (id === 'screen-prov-dashboard') renderProviderDashboard();
  if (id === 'screen-prov-earnings') renderProviderEarnings();
  window.scrollTo(0, 0);
}
function goBack() { showScreen(prevScreen === 'screen-cust-tracking' ? 'screen-cust-home' : (prevScreen || 'screen-cust-home')); }

function enterRole(role) {
  currentRole = role;
  document.getElementById('bottomNavCustomer').style.display = role === 'customer' ? 'flex' : 'none';
  document.getElementById('bottomNavProvider').style.display = 'none';
  if (role === 'customer') {
    showScreen('screen-cust-home');
  } else {
    showScreen('screen-prov-recruit');
  }
}
function proceedToProviderSignup() {
  showScreen('screen-prov-onboard');
  resetOnboarding();
}
function switchRole() {
  document.getElementById('bottomNavCustomer').style.display = 'none';
  document.getElementById('bottomNavProvider').style.display = 'none';
  showScreen('screen-role');
}
function goHomeForRole() { showScreen(currentRole === 'provider' ? 'screen-prov-dashboard' : 'screen-cust-home'); }
function goSettingsForRole() { showScreen(currentRole === 'provider' ? 'screen-prov-settings' : 'screen-cust-settings'); }

// ===== Customer: home rendering =====
function serviceCardHTML(key) {
  const s = SERVICE_LABELS[key];
  return `<div class="doc-card" onclick="preselectService('${key}')"><div class="doc-icon ${s.cls}">${s.emoji}</div><div class="doc-info"><div class="doc-name">${s.name}</div><div class="doc-sub">Starting at $${s.base}</div></div><i class="ti ti-chevron-right" style="color:rgba(22,35,46,0.3);"></i></div>`;
}
function preselectService(key) {
  showScreen('screen-cust-request');
  setTimeout(() => { const el = document.getElementById('reqService'); if (el) el.value = key; toggleFuelTypeField(); }, 0);
}
function renderCustHome() {
  document.getElementById('cust-service-preview').innerHTML = Object.keys(SERVICE_LABELS).map(serviceCardHTML).join('');
  const wrap = document.getElementById('cust-active-wrap');
  if (activeRequest && activeRequest.statusIndex < 4) {
    const s = SERVICE_LABELS[activeRequest.serviceKey];
    wrap.innerHTML = `<div class="scan-bar" style="background:linear-gradient(135deg, rgba(46,127,184,0.14), rgba(46,127,184,0.05));border-color:rgba(46,127,184,0.4);" onclick="showScreen('screen-cust-tracking')">
      <i class="ti ti-map-pin" style="color:#2E7FB8;"></i>
      <div class="scan-bar-text"><div class="t">${s.emoji} ${s.name} in progress</div><div class="s">${STATUS_STEPS[activeRequest.statusIndex]} — tap to track</div></div>
      <i class="ti ti-chevron-right arr" style="color:rgba(46,127,184,0.6);"></i>
    </div>`;
  } else {
    wrap.innerHTML = '';
  }
  document.getElementById('cust-recent-list').innerHTML = customerActivity.slice(0, 3).map(activityCardHTML).join('') || `<div style="color:rgba(22,35,46,0.35);font-size:13px;padding:0 20px;">No past requests yet.</div>`;
}
function activityCardHTML(r) {
  const s = SERVICE_LABELS[r.serviceKey];
  return `<div class="doc-card"><div class="doc-icon ${s.cls}">${s.emoji}</div><div class="doc-info"><div class="doc-name">${s.name}</div><div class="doc-sub">${r.date} · ${r.provider.name}</div></div><div class="badge b-green">$${r.total}</div></div>`;
}
function renderCustActivity() {
  document.getElementById('cust-activity-list').innerHTML = customerActivity.map(activityCardHTML).join('') || `<div style="color:rgba(22,35,46,0.35);font-size:13px;padding:0 4px;">No past requests yet.</div>`;
}

// ===== Customer: geolocation =====
function detectLocation() {
  const statusEl = document.getElementById('locationStatus');
  statusEl.textContent = 'Detecting your location…';
  if (!navigator.geolocation) {
    statusEl.textContent = 'Location services not available on this device — please type your address.';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(5);
      const lng = pos.coords.longitude.toFixed(5);
      document.getElementById('reqLocation').value = `${lat}, ${lng}`;
      statusEl.textContent = 'Location detected ✓';
    },
    err => { statusEl.textContent = `Couldn't get your location (${err.message}) — please type your address instead.`; },
    { timeout: 8000 }
  );
}

// ===== Customer: submit request → tracking =====
function submitRequest() {
  const serviceKey = document.getElementById('reqService').value;
  const year = document.getElementById('reqYear').value;
  const make = document.getElementById('reqMake').value;
  const model = document.getElementById('reqModel').value;
  const location = document.getElementById('reqLocation').value.trim();
  const phone = document.getElementById('reqPhone').value.trim();
  const notes = document.getElementById('reqNotes').value.trim();
  const fuelType = serviceKey === 'fuel' ? document.getElementById('reqFuelType').value : null;

  if (!location) { showToast('Please add your location'); return; }
  if (!phone) { showToast('Please add a phone number'); return; }

  const provider = PROVIDER_POOL[Math.floor(Math.random() * PROVIDER_POOL.length)];
  const s = SERVICE_LABELS[serviceKey];

  const pendingRequest = {
    serviceKey, year, make, model, location, phone, notes, fuelType, provider,
    statusIndex: 0, etaSeconds: (Math.floor(Math.random() * 6) + 8) * 60,
    dispatchFee: DISPATCH_FEE, serviceCharge: s.base
  };
  openDispatchFeeModal(pendingRequest);
}

function openDispatchFeeModal(pendingRequest) {
  openModal(`
    <div class="modal-title">Upfront dispatch fee</div>
    <div class="modal-sub">A $${DISPATCH_FEE} dispatch fee applies any time a provider comes out — this covers their trip regardless of the service performed. The remaining service charge is billed once the job's done.</div>
    <div class="modal-info-row"><div class="k">Dispatch fee (now)</div><div class="v">$${DISPATCH_FEE}</div></div>
    <div class="modal-info-row"><div class="k">Charging</div><div class="v">Visa ···· 4242</div></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel request</button>
      <button class="modal-btn primary" onclick="confirmDispatchFee()">Confirm & pay $${DISPATCH_FEE}</button>
    </div>
  `);
  window._pendingRequest = pendingRequest;
}
function confirmDispatchFee() {
  const req = window._pendingRequest;
  const email = prompt('Enter your email for the payment receipt:');
  if (!email) return;

  // Stripe Checkout takes the browser to Stripe's own site and back --
  // any in-memory JS state would be lost, so save what we need to resume
  // the tracking screen once the customer returns from a successful payment.
  sessionStorage.setItem('pendingRoadsideRequest', JSON.stringify(req));

  modalSheet.innerHTML = `<div class="modal-title">Redirecting to checkout\u2026</div><div class="scan-anim"><div class="scan-spinner"></div></div>`;

  fetch('/.netlify/functions/marketplace-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app: 'roadside-warriors',
      description: `${SERVICE_LABELS[req.serviceKey].name} -- dispatch fee`,
      amountInDollars: DISPATCH_FEE,
      customerEmail: email,
      paymentType: 'dispatch',
      recordTable: 'roadside_requests',
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url; // leaves the app -- resumes below on return
      } else {
        showToast('Something went wrong starting checkout \u2014 please try again');
        sessionStorage.removeItem('pendingRoadsideRequest');
        closeModal();
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Could not reach checkout \u2014 please try again');
      sessionStorage.removeItem('pendingRoadsideRequest');
      closeModal();
    });
}

// Runs once, on page load -- picks back up right where the customer left off
// if they're returning from a real Stripe Checkout redirect.
function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  if (!checkoutStatus) return;

  window.history.replaceState({}, '', window.location.pathname); // clean up the URL

  const pendingDispatch = sessionStorage.getItem('pendingRoadsideRequest');
  const pendingService = sessionStorage.getItem('pendingRoadsideServicePayment');

  if (checkoutStatus === 'success' && pendingDispatch) {
    activeRequest = JSON.parse(pendingDispatch);
    activeRequest.dispatchPaid = true;
    sessionStorage.removeItem('pendingRoadsideRequest');
    currentRole = 'customer';
    document.getElementById('bottomNavCustomer').style.display = 'flex';
    renderTrackingScreen();
    showScreen('screen-cust-tracking');
    startEtaCountdown();
    scheduleStatusAdvance();
    showToast(`$${DISPATCH_FEE} dispatch fee paid -- finding your provider`);

  } else if (checkoutStatus === 'success' && pendingService) {
    const info = JSON.parse(pendingService);
    const total = info.dispatchFee + info.serviceCharge;
    customerActivity.unshift({ serviceKey: info.serviceKey, provider: info.provider, total, date: 'Just now' });
    sessionStorage.removeItem('pendingRoadsideServicePayment');
    currentRole = 'customer';
    document.getElementById('bottomNavCustomer').style.display = 'flex';
    activeRequest = null;
    showScreen('screen-cust-activity');
    showToast('Payment successful -- receipt saved to Activity');

  } else if (checkoutStatus === 'cancelled') {
    sessionStorage.removeItem('pendingRoadsideRequest');
    sessionStorage.removeItem('pendingRoadsideServicePayment');
    showToast('Checkout cancelled');
  }
}
document.addEventListener('DOMContentLoaded', handleCheckoutReturn);

function renderTrackingScreen() {
  const s = SERVICE_LABELS[activeRequest.serviceKey];
  document.getElementById('tracking-service-name').textContent = `${s.name} requested`;
  document.getElementById('cust-provider-card-wrap').innerHTML = `
    <div class="provider-card">
      <div class="provider-avatar">${activeRequest.provider.initials}</div>
      <div style="flex:1;">
        <div class="provider-name">${activeRequest.provider.name}</div>
        <div class="provider-meta">★ ${activeRequest.provider.rating} · ${activeRequest.provider.vehicle}</div>
      </div>
      <a href="tel:+15555550123" style="width:38px;height:38px;border-radius:50%;background:rgba(46,127,184,0.12);display:flex;align-items:center;justify-content:center;color:#2E7FB8;text-decoration:none;"><i class="ti ti-phone"></i></a>
    </div>`;
  renderStatusTimeline();
}
function renderStatusTimeline() {
  document.getElementById('statusTimeline').innerHTML = STATUS_STEPS.map((label, i) => {
    const cls = i < activeRequest.statusIndex ? 'done' : (i === activeRequest.statusIndex ? 'current' : '');
    const icon = i < activeRequest.statusIndex ? '✓' : (i === activeRequest.statusIndex ? '●' : '');
    return `<div class="status-step ${cls}"><div class="dot">${icon}</div><div class="label">${label}</div></div>`;
  }).join('');
}
function startEtaCountdown() {
  clearInterval(etaTimer);
  updateEtaDisplay();
  etaTimer = setInterval(() => {
    if (!activeRequest || activeRequest.statusIndex >= 3) { clearInterval(etaTimer); return; }
    activeRequest.etaSeconds = Math.max(0, activeRequest.etaSeconds - 1);
    updateEtaDisplay();
  }, 1000);
}
function updateEtaDisplay() {
  if (!activeRequest) return;
  const m = Math.floor(activeRequest.etaSeconds / 60).toString().padStart(2, '0');
  const s = (activeRequest.etaSeconds % 60).toString().padStart(2, '0');
  const etaNumEl = document.getElementById('etaNum');
  const etaLabelEl = document.getElementById('etaLabel');
  if (!etaNumEl) return;
  if (activeRequest.statusIndex >= 4) {
    etaNumEl.textContent = 'Done';
    etaLabelEl.textContent = 'service complete';
  } else if (activeRequest.statusIndex >= 3) {
    etaNumEl.textContent = 'Here';
    etaLabelEl.textContent = 'provider has arrived';
  } else {
    etaNumEl.textContent = `${m}:${s}`;
    etaLabelEl.textContent = 'estimated arrival';
  }
}
function scheduleStatusAdvance() {
  clearTimeout(statusAdvanceTimer);
  const delays = [3000, 6000, 7000, 5000]; // demo-compressed timing between each status step
  function advance() {
    if (!activeRequest || activeRequest.statusIndex >= 4) return;
    activeRequest.statusIndex++;
    renderStatusTimeline();
    updateEtaDisplay();
    renderCustHome();
    if (activeRequest.statusIndex === 4) {
      showToast('Service complete — time to pay');
      setTimeout(() => openPaymentScreen(), 900);
      return;
    }
    statusAdvanceTimer = setTimeout(advance, delays[activeRequest.statusIndex] || 5000);
  }
  statusAdvanceTimer = setTimeout(advance, delays[0]);
}
function cancelRequest() {
  clearInterval(etaTimer);
  clearTimeout(statusAdvanceTimer);
  activeRequest = null;
  showToast('Request canceled');
  showScreen('screen-cust-home');
}

// ===== Customer: payment =====
function openPaymentScreen() {
  if (!activeRequest) return;
  const s = SERVICE_LABELS[activeRequest.serviceKey];
  document.getElementById('paySvcName').textContent = s.name;
  document.getElementById('payProviderName').textContent = activeRequest.provider.name;
  document.getElementById('payBase').textContent = `$${activeRequest.dispatchFee} (already charged)`;
  document.getElementById('payDist').textContent = `$${activeRequest.serviceCharge}`;
  document.getElementById('payTotal').textContent = `$${activeRequest.serviceCharge}`;
  document.getElementById('payBtnAmt').textContent = `$${activeRequest.serviceCharge}`;
  showScreen('screen-cust-payment');
}
function formatCardNumber(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 16);
  el.value = v.replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 4);
  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
  el.value = v;
}
function processPayment() {
  const email = prompt('Enter your email for the payment receipt:');
  if (!email) return;

  sessionStorage.setItem('pendingRoadsideServicePayment', JSON.stringify({
    serviceKey: activeRequest.serviceKey,
    provider: activeRequest.provider,
    dispatchFee: activeRequest.dispatchFee,
    serviceCharge: activeRequest.serviceCharge,
  }));

  const s = SERVICE_LABELS[activeRequest.serviceKey];
  fetch('/.netlify/functions/marketplace-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app: 'roadside-warriors',
      description: `${s.name} -- service charge`,
      amountInDollars: activeRequest.serviceCharge,
      customerEmail: email,
      paymentType: 'service',
      recordTable: 'roadside_requests',
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('Something went wrong starting checkout \u2014 please try again');
        sessionStorage.removeItem('pendingRoadsideServicePayment');
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Could not reach checkout \u2014 please try again');
      sessionStorage.removeItem('pendingRoadsideServicePayment');
    });
}

// ===== Provider: onboarding =====
function resetOnboarding() {
  onboardStep = 1; selfieCaptured = false; licenseCaptured = false;
  document.getElementById('selfiePreviewWrap').style.display = 'none';
  document.getElementById('licensePreviewWrap').style.display = 'none';
  document.getElementById('onboardStep1').style.display = 'block';
  document.getElementById('onboardStep2').style.display = 'none';
  document.getElementById('onboardStep3').style.display = 'none';
  document.getElementById('onboardStep4').style.display = 'none';
  document.getElementById('pendingIcon').style.display = 'block';
  document.getElementById('approvedIcon').style.display = 'none';
  document.getElementById('onboardNavBtns').style.display = 'block';
  document.getElementById('onboardStepLabel').textContent = 'Step 1 of 4 — Identity verification';
  populateYears('provYear');
  populateSelect('provMake', CAR_MAKES);
}
function onboardNext() {
  if (onboardStep === 1 && !selfieCaptured) { showToast('Please take a verification selfie first'); return; }
  if (onboardStep === 2 && !licenseCaptured) { showToast('Please upload your driver\u2019s license first'); return; }
  document.getElementById(`onboardStep${onboardStep}`).style.display = 'none';
  onboardStep++;
  if (onboardStep > 4) onboardStep = 4;
  document.getElementById(`onboardStep${onboardStep}`).style.display = 'block';
  const labels = ['', 'Step 1 of 4 — Identity verification', 'Step 2 of 4 — Driver\u2019s license', 'Step 3 of 4 — Vehicle & services', 'Step 4 of 4 — Review'];
  document.getElementById('onboardStepLabel').textContent = labels[onboardStep];
  if (onboardStep === 4) {
    document.getElementById('onboardNavBtns').style.display = 'none';
    document.getElementById('pendingIcon').style.display = 'block';
    document.getElementById('approvedIcon').style.display = 'none';
  }
}
function approveVerification() {
  document.getElementById('pendingIcon').style.display = 'none';
  document.getElementById('approvedIcon').style.display = 'block';
}
function finishOnboarding() {
  document.getElementById('bottomNavProvider').style.display = 'flex';
  showToast('Welcome aboard! You\u2019re verified and ready to go online.');
  showScreen('screen-prov-dashboard');
}

// ===== Provider: dashboard =====
function toggleOnline() {
  providerOnline = !providerOnline;
  document.getElementById('onlineKnob').style.left = providerOnline ? '23px' : '3px';
  document.getElementById('onlineToggle').style.background = providerOnline ? '#2F9D5D' : 'rgba(22,35,46,0.15)';
  document.getElementById('onlineLabel').textContent = providerOnline ? 'Online' : 'Offline';
  if (providerOnline) { showToast('You\u2019re online — nearby requests will appear here'); startIncomingSimulation(); }
  else { showToast('You\u2019re offline'); clearTimeout(incomingRequestTimer); }
  renderProviderDashboard();
}
function startIncomingSimulation() {
  clearTimeout(incomingRequestTimer);
  function spawn() {
    if (!providerOnline) return;
    if (simulatedIncoming.length < 3) {
      const keys = Object.keys(SERVICE_LABELS);
      const key = keys[Math.floor(Math.random() * keys.length)];
      simulatedIncoming.unshift({ id: 'req' + Date.now(), serviceKey: key, distance: (Math.random() * 4 + 0.5).toFixed(1), customerName: ['Dana K.', 'Theo B.', 'Priya S.', 'Ben T.'][Math.floor(Math.random() * 4)] });
      renderProviderDashboard();
    }
    incomingRequestTimer = setTimeout(spawn, 6000);
  }
  incomingRequestTimer = setTimeout(spawn, 3000);
}
function renderProviderDashboard() {
  const totalToday = providerEarnings.reduce((s, e) => s + e.amount, 0);
  document.getElementById('prov-earnings-today').textContent = `$${totalToday}`;
  document.getElementById('prov-jobs-today').textContent = providerEarnings.length;
  document.getElementById('prov-requests-list').innerHTML = providerOnline
    ? (simulatedIncoming.map(r => {
        const s = SERVICE_LABELS[r.serviceKey];
        const yourCut = Math.round((DISPATCH_FEE + s.base) * PROVIDER_CUT);
        return `<div class="doc-card" onclick="acceptJob('${r.id}')"><div class="doc-icon ${s.cls}">${s.emoji}</div><div class="doc-info"><div class="doc-name">${s.name} — ${r.customerName}</div><div class="doc-sub">${r.distance} mi away</div></div><div class="badge b-green">$${yourCut}</div></div>`;
      }).join('') || `<div style="color:rgba(22,35,46,0.35);font-size:13px;padding:0 4px;">Listening for nearby requests…</div>`)
    : `<div style="color:rgba(22,35,46,0.35);font-size:13px;padding:0 4px;">Go online to start receiving requests.</div>`;

  const wrap = document.getElementById('prov-active-job-wrap');
  if (window.activeProviderJob) {
    const s = SERVICE_LABELS[window.activeProviderJob.serviceKey];
    wrap.innerHTML = `<div class="scan-bar" onclick="showScreen('screen-prov-job')"><i class="ti ti-steering-wheel"></i><div class="scan-bar-text"><div class="t">${s.emoji} Active job — ${window.activeProviderJob.customerName}</div><div class="s">Tap to view details</div></div><i class="ti ti-chevron-right arr"></i></div>`;
  } else { wrap.innerHTML = ''; }
}
function acceptJob(id) {
  const job = simulatedIncoming.find(r => r.id === id);
  if (!job) return;
  simulatedIncoming = simulatedIncoming.filter(r => r.id !== id);
  window.activeProviderJob = { ...job, phase: 'enroute' };
  renderProviderJobScreen();
  showScreen('screen-prov-job');
  showToast(`Job accepted — head to ${job.customerName}`);
}
function renderProviderJobScreen() {
  const job = window.activeProviderJob;
  if (!job) { document.getElementById('prov-job-detail').innerHTML = ''; return; }
  const s = SERVICE_LABELS[job.serviceKey];
  const phaseBtns = {
    enroute: `<div class="renew-btn" onclick="advanceJobPhase('arrived')">Mark: Arrived on scene</div>`,
    arrived: `<div class="renew-btn" onclick="advanceJobPhase('complete')">Mark: Service complete</div>`,
    complete: `<div class="detail-info-box"><div class="dib-label">Status</div><div class="dib-val">Completed — payment collected from customer</div></div>`
  };
  document.getElementById('prov-job-detail').innerHTML = `
    <div class="detail-hero" style="padding-top:0;">
      <div class="detail-big-icon">${s.emoji}</div>
      <div class="detail-doc-name">${s.name}</div>
      <div class="detail-doc-sub">${job.customerName} · ${job.distance} mi away</div>
    </div>
    <div class="detail-info-grid">
      <div class="detail-info-box"><div class="dib-label">Your payout (95%)</div><div class="dib-val">$${Math.round((DISPATCH_FEE + s.base) * PROVIDER_CUT)} <span style="font-size:11px;color:rgba(22,35,46,0.4);">(Thursday)</span></div></div>
      <div class="detail-info-box"><div class="dib-label">Status</div><div class="dib-val" style="text-transform:capitalize;">${job.phase}</div></div>
    </div>
    <div style="padding:0 20px 14px;">
      <a href="https://www.google.com/maps/dir/?api=1&destination=customer+location" target="_blank" class="renew-btn secondary-look" style="display:block;text-decoration:none;text-align:center;"><i class="ti ti-map-2"></i> Get directions</a>
    </div>
    <div style="padding:0 20px max(16px, env(safe-area-inset-bottom));">${phaseBtns[job.phase]}</div>
  `;
}
function advanceJobPhase(phase) {
  window.activeProviderJob.phase = phase;
  if (phase === 'complete') {
    const s = SERVICE_LABELS[window.activeProviderJob.serviceKey];
    providerEarnings.unshift({ service: s.name, customer: window.activeProviderJob.customerName, amount: Math.round((DISPATCH_FEE + s.base) * PROVIDER_CUT), date: 'Just now' });
    showToast('Job complete — earnings added');
    window.activeProviderJob = null;
    renderProviderDashboard();
    setTimeout(() => showScreen('screen-prov-dashboard'), 600);
    return;
  }
  renderProviderJobScreen();
  renderProviderDashboard();
}
function renderProviderEarnings() {
  const total = providerEarnings.reduce((s, e) => s + e.amount, 0);
  document.getElementById('prov-earnings-summary').textContent = `$${total} pending · next payout ${nextThursday()}`;
  document.getElementById('prov-earnings-list').innerHTML = providerEarnings.map(e => `
    <div class="doc-card"><div class="doc-icon di-green"><i class="ti ti-currency-dollar"></i></div><div class="doc-info"><div class="doc-name">${e.service} — ${e.customer}</div><div class="doc-sub">${e.date}</div></div><div class="badge b-green">+$${e.amount}</div></div>
  `).join('') || `<div style="color:rgba(22,35,46,0.35);font-size:13px;padding:0 4px;">No completed jobs yet.</div>`;
}

// ===== Live clock =====
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  h = h % 12 || 12;
  el.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 30000);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker registration failed:', err));
  });
}
