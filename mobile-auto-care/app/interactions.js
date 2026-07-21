// ===== Modal helpers =====
const modalOverlay = document.getElementById('modalOverlay');
const modalSheet = document.getElementById('modalSheet');
function openModal(html) { modalSheet.innerHTML = html; modalOverlay.classList.add('show'); }
function closeModal() { modalOverlay.classList.remove('show'); }

// ===== Toast =====
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ===== App menu (3-dot) =====
const BACK_TO_SITE_URL = '../index.html'; // update this to match your deployed folder structure
document.addEventListener('DOMContentLoaded', () => {
  const link = document.getElementById('backToSiteLink');
  if (link) link.href = BACK_TO_SITE_URL;
});
function openAppMenu() { document.getElementById('appMenuOverlay').classList.add('show'); }
function closeAppMenu() { document.getElementById('appMenuOverlay').classList.remove('show'); }

// ===== Real auth: sign in / sign up =====
// Toggles the auth screen between "Sign in" and "Sign up" modes. Both modes
// share the same email/password inputs -- only the labels and which Supabase
// call gets made on submit change.
let authMode = 'signin';
function toggleAuthMode(e) {
  if (e) e.preventDefault();
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  document.getElementById('authError').textContent = '';
  if (authMode === 'signup') {
    document.getElementById('authTitle').textContent = 'Create your account';
    document.getElementById('authSubtitle').textContent = 'Sign up to book and manage your appointments';
    document.getElementById('authSubmitBtn').textContent = 'Sign up';
    document.getElementById('authSwitchText').textContent = 'Already have an account?';
    document.getElementById('authSwitchLink').textContent = 'Sign in';
  } else {
    document.getElementById('authTitle').textContent = 'Welcome back';
    document.getElementById('authSubtitle').textContent = 'Sign in to book and manage your appointments';
    document.getElementById('authSubmitBtn').textContent = 'Sign in';
    document.getElementById('authSwitchText').textContent = "Don't have an account?";
    document.getElementById('authSwitchLink').textContent = 'Sign up';
  }
}

async function handleAuthSubmit() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authError');
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Please enter both email and password';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters';
    return;
  }

  const submitBtn = document.getElementById('authSubmitBtn');
  submitBtn.textContent = authMode === 'signup' ? 'Signing up\u2026' : 'Signing in\u2026';

  try {
    if (authMode === 'signup') {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      // With email confirmation disabled, signUp also returns a live session --
      // onAuthStateChange picks this up and reveals the app automatically.
      if (!data.session) {
        errorEl.textContent = 'Account created \u2014 please sign in.';
        toggleAuthMode();
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (err) {
    errorEl.textContent = err.message || 'Something went wrong \u2014 please try again';
  } finally {
    submitBtn.textContent = authMode === 'signup' ? 'Sign up' : 'Sign in';
  }
}

async function realSignOut() {
  await supabaseClient.auth.signOut();
  // onAuthStateChange's SIGNED_OUT handler takes care of resetting state
  // and showing the auth screen again.
}

// ===== Vehicle dropdown population =====
function populateVehicleDropdowns() {
  document.getElementById('bookVehicleYear').innerHTML =
    VEHICLE_YEARS.map(y => `<option value="${y}">${y}</option>`).join('');

  const makeSel = document.getElementById('bookVehicleMake');
  makeSel.innerHTML = '<option value="">Select make</option>' +
    VEHICLE_MAKES.map(m => `<option value="${m}">${m}</option>`).join('');
  makeSel.value = '';

  document.getElementById('bookVehicleModel').innerHTML =
    '<option value="">Select make first</option><option value="__other__">Other / not listed</option>';
  document.getElementById('bookVehicleModelOther').style.display = 'none';
  document.getElementById('bookVehicleModelOther').value = '';
}

function populateModelDropdown() {
  const make = document.getElementById('bookVehicleMake').value;
  const modelSel = document.getElementById('bookVehicleModel');
  const models = VEHICLE_MODELS[make] || [];
  modelSel.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('') +
    '<option value="__other__">Other / not listed</option>';
  toggleModelOtherInput();
}

function toggleModelOtherInput() {
  const isOther = document.getElementById('bookVehicleModel').value === '__other__';
  document.getElementById('bookVehicleModelOther').style.display = isOther ? 'block' : 'none';
}

// ===== Notes dropdown population =====
function populateNotesDropdown() {
  const sel = document.getElementById('bookNotesPreset');
  sel.innerHTML = '<option value="">Select a situation (optional)</option>' +
    NOTES_PRESETS.map(n => `<option value="${n === 'Other' ? '__other__' : n}">${n}</option>`).join('');
  document.getElementById('bookNotesOther').style.display = 'none';
  document.getElementById('bookNotesOther').value = '';
}

function toggleNotesOtherInput() {
  const isOther = document.getElementById('bookNotesPreset').value === '__other__';
  document.getElementById('bookNotesOther').style.display = isOther ? 'block' : 'none';
}

// ===== GPS =====
function useCurrentLocation() {
  const statusText = document.getElementById('gpsStatusText');
  if (!navigator.geolocation) {
    showToast("Location isn't available on this device \u2014 please double check your typed address");
    return;
  }
  statusText.textContent = 'Getting your location\u2026';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      bookingGpsCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      const acc = Math.round(pos.coords.accuracy);
      statusText.textContent = `Location added (accurate to ~${acc}m) \u2014 tap to update`;
    },
    () => {
      bookingGpsCoords = null;
      statusText.textContent = 'Use my current location';
      showToast("Couldn't get your location \u2014 please make sure your typed address is correct");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ===== Booking =====
// Builds the booking details from the form and shows the confirm/pay modal.
// Nothing is saved to Supabase yet at this point -- that happens in
// payForBooking, right before checkout, so we never write a booking unless
// the customer actually proceeds toward paying.
let pendingBookingDraft = null;

function confirmBooking() {
  const serviceId = document.getElementById('bookService').value;
  const date = document.getElementById('bookDate').value;

  const year = document.getElementById('bookVehicleYear').value;
  const make = document.getElementById('bookVehicleMake').value;
  const modelSel = document.getElementById('bookVehicleModel').value;
  const modelOther = document.getElementById('bookVehicleModelOther').value.trim();
  const model = modelSel === '__other__' ? modelOther : modelSel;

  const address = document.getElementById('bookAddress').value.trim();
  const phone = document.getElementById('bookPhone').value.trim();

  const notesPreset = document.getElementById('bookNotesPreset').value;
  const notesOther = document.getElementById('bookNotesOther').value.trim();
  const notes = notesPreset === '__other__' ? notesOther : notesPreset;

  if (!date) { showToast('Please choose a date'); return; }
  if (!selectedSlot) { showToast('Please choose a time slot'); return; }
  if (!make) { showToast('Please select your vehicle make'); return; }
  if (!model) { showToast('Please select or enter your vehicle model'); return; }
  if (!address) { showToast('Please add a service address'); return; }
  if (!phone) { showToast('Please add a contact phone number'); return; }

  const vehicle = `${year} ${make} ${model}`.trim();
  const s = serviceById(serviceId);

  pendingBookingDraft = {
    serviceId, serviceName: s.name, price: s.price, date, time: selectedSlot,
    vehicle, address, phone, notes,
    latitude: bookingGpsCoords ? bookingGpsCoords.latitude : null,
    longitude: bookingGpsCoords ? bookingGpsCoords.longitude : null
  };

  openModal(`
    <div class="modal-title">Confirm & pay</div>
    <div class="modal-sub">${s.emoji} ${s.name} on ${formatDate(date)} at ${selectedSlot}</div>
    <div class="modal-info-row"><div class="k">Service</div><div class="v">$${s.price}+</div></div>
    <div class="modal-btns" style="flex-direction:column;gap:10px;">
      <button class="modal-btn primary" onclick="payForBooking()">Pay & confirm booking \u2192</button>
      <button class="modal-btn secondary" onclick="closeModal(); showScreen('screen-home');">Cancel</button>
    </div>
  `);
}

// Saves the booking to Supabase (tied to the real signed-in customer), then
// starts Stripe checkout using the real database row's id as bookingId.
async function payForBooking() {
  if (!currentUser || !pendingBookingDraft) {
    showToast('Something went wrong \u2014 please try booking again');
    closeModal();
    return;
  }
  const draft = pendingBookingDraft;

  modalSheet.innerHTML = `<div class="modal-title">Saving your booking\u2026</div><div class="scan-anim"><div class="scan-spinner"></div></div>`;

  const { data: inserted, error: insertError } = await supabaseClient
    .from('bookings')
    .insert({
      customer_id: currentUser.id,
      service_name: draft.serviceName,
      price: draft.price,
      scheduled_date: draft.date,
      scheduled_time: draft.time,
      address: draft.address,
      vehicle: draft.vehicle,
      phone: draft.phone,
      notes: draft.notes,
      latitude: draft.latitude,
      longitude: draft.longitude,
      status: 'upcoming'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Booking insert error:', insertError);
    showToast('Could not save your booking \u2014 please try again');
    closeModal();
    showScreen('screen-home');
    return;
  }

  await loadUserBookings();
  renderHome();

  modalSheet.innerHTML = `<div class="modal-title">Redirecting to checkout\u2026</div><div class="scan-anim"><div class="scan-spinner"></div></div>`;

  try {
    const res = await fetch('/.netlify/functions/create-booking-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceName: draft.serviceName,
        amountInDollars: draft.price,
        customerEmail: currentUser.email,
        userId: currentUser.id,
        bookingId: inserted.id,
        vehicle: draft.vehicle,
        address: draft.address,
        phone: draft.phone,
        notes: draft.notes,
        latitude: draft.latitude,
        longitude: draft.longitude
      })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('Booking saved, but checkout couldn\u2019t start \u2014 you can pay from My Appointments');
      closeModal();
      showScreen('screen-appointments');
    }
  } catch (err) {
    console.error(err);
    showToast('Booking saved, but checkout couldn\u2019t start \u2014 you can pay from My Appointments');
    closeModal();
    showScreen('screen-appointments');
  }
}

// ===== Appointment detail / cancel =====
function openApptModal(id) {
  const a = appointments.find(x => x.id === id);
  if (!a) return;
  const s = serviceById(a.serviceId);
  const name = s ? `${s.emoji} ${s.name}` : (a.serviceName || 'Service');
  openModal(`
    <div class="modal-title">${name}</div>
    <div class="modal-sub">${formatDate(a.date)} at ${a.time}</div>
    <div class="modal-info-row"><div class="k">Vehicle</div><div class="v">${a.vehicle || '\u2014'}</div></div>
    <div class="modal-info-row"><div class="k">Address</div><div class="v">${a.address || '\u2014'}</div></div>
    ${a.latitude && a.longitude ? `<div class="modal-info-row"><div class="k">GPS pin</div><div class="v"><a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" style="color:#FB923C;">Open in Maps \u2192</a></div></div>` : ''}
    <div class="modal-info-row"><div class="k">Phone</div><div class="v">${a.phone || '\u2014'}</div></div>
    <div class="modal-info-row"><div class="k">Status</div><div class="v" style="text-transform:capitalize;">${a.status}</div></div>
    ${a.notes ? `<div class="modal-info-row"><div class="k">Notes</div><div class="v">${a.notes}</div></div>` : ''}
    <div class="modal-btns">
      ${a.status === 'upcoming' ? `<button class="modal-btn danger" onclick="cancelAppt('${a.id}')">Cancel appointment</button>` : `<button class="modal-btn primary" onclick="closeModal(); openLeaveReviewModal();">Leave a review</button>`}
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}

async function cancelAppt(id) {
  const { error } = await supabaseClient
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('customer_id', currentUser.id);

  if (error) {
    console.error('Cancel error:', error);
    showToast('Could not cancel \u2014 please try again');
    return;
  }
  closeModal();
  showToast('Appointment canceled');
  await loadUserBookings();
  renderAppointments(); renderHome();
}

// ===== Reviews (still demo/in-memory -- not part of the real-accounts scope) =====
let selectedRating = 5;
function openLeaveReviewModal(prefServiceId) {
  selectedRating = 5;
  openModal(`
    <div class="modal-title">Leave a review</div>
    <div class="modal-field">
      <label class="modal-label">Service</label>
      <select class="modal-select" id="revService">${services.map(s => `<option value="${s.id}" ${s.id === prefServiceId ? 'selected' : ''}>${s.emoji} ${s.name}</option>`).join('')}</select>
    </div>
    <div class="modal-field">
      <label class="modal-label">Your rating</label>
      <div class="star-select" id="starSelect">
        ${[1,2,3,4,5].map(n => `<span data-n="${n}" onclick="setStar(${n})" class="${n <= 5 ? 'on' : ''}">★</span>`).join('')}
      </div>
    </div>
    <div class="modal-field">
      <label class="modal-label">Your name</label>
      <input class="modal-input" id="revName" placeholder="e.g. Alex P.">
    </div>
    <div class="modal-field">
      <label class="modal-label">Comment</label>
      <input class="modal-input" id="revText" placeholder="How did it go?">
    </div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="submitReview()">Post review</button>
    </div>
  `);
}
function setStar(n) {
  selectedRating = n;
  document.querySelectorAll('#starSelect span').forEach(s => {
    s.classList.toggle('on', parseInt(s.dataset.n) <= n);
  });
}
function submitReview() {
  const serviceId = document.getElementById('revService').value;
  const name = document.getElementById('revName').value.trim();
  const text = document.getElementById('revText').value.trim();
  if (!name) { showToast('Please add your name'); return; }
  if (!text) { showToast('Please add a short comment'); return; }
  const s = serviceById(serviceId);
  const initials = name.slice(0, 2).toUpperCase();
  reviews.unshift({ id: 'rv' + Date.now(), name, initials, rating: selectedRating, service: s.name, text, date: 'Just now' });
  closeModal();
  showToast('Thanks for your review!');
  renderReviews(); renderHome();
}

// ===== Settings modals =====
// "My vehicle" here is a quick-reference convenience only -- there's no
// vehicle-on-file column on the profile in the current schema, so this
// just updates what's shown on this screen for this session.
function openVehicleModal() {
  const current = document.getElementById('vehicle-sub').textContent;
  openModal(`
    <div class="modal-title">My vehicle</div>
    <div class="modal-field"><label class="modal-label">Year, make & model</label><input class="modal-input" id="vehicleInput" value="${current === 'No vehicle saved yet' ? '' : current}"></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="saveVehicle()">Save</button>
    </div>
  `);
}
function saveVehicle() {
  const v = document.getElementById('vehicleInput').value.trim();
  if (v) {
    document.getElementById('vehicle-sub').textContent = v;
    document.getElementById('vehicle-sub-settings').textContent = v;
  }
  closeModal();
  showToast('Vehicle updated for this session');
}

function openBillingModal() {
  openModal(`
    <div class="modal-title">Payment method</div>
    <div class="modal-info-row"><div class="k">Billed</div><div class="v">Per completed service, via Stripe Checkout</div></div>
    <div class="modal-btns"><button class="modal-btn secondary" onclick="closeModal()">Close</button></div>
  `);
}

function openHoursModal() {
  openModal(`
    <div class="modal-title">Hours & service area</div>
    <div class="modal-info-row"><div class="k">Days</div><div class="v">7 days a week</div></div>
    <div class="modal-info-row"><div class="k">Hours</div><div class="v">8:00 AM – 6:00 PM</div></div>
    <div class="modal-info-row"><div class="k">Service radius</div><div class="v">25 miles</div></div>
    <div class="modal-btns"><button class="modal-btn secondary" onclick="closeModal()">Close</button></div>
  `);
}

function openHelpModal() {
  openModal(`
    <div class="modal-title">Help & support</div>
    <div class="modal-sub">Question about a booking or a past service? Call, text, or send a message and we'll get back to you shortly.</div>
    <div class="modal-btns">
      <a class="modal-btn secondary" href="tel:+12403151464" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">Call (240) 315-1464</a>
      <a class="modal-btn primary" href="../index.html#contact" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">Send a message</a>
    </div>
  `);
}

function confirmSignOut() {
  openModal(`
    <div class="modal-title">Sign out?</div>
    <div class="modal-sub">You'll need to sign back in to see your appointments and reviews.</div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn danger" onclick="closeModal(); realSignOut();">Sign out</button>
    </div>
  `);
}
