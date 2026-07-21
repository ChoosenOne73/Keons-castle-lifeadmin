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
// Grabs the customer's precise coordinates via the browser's geolocation API.
// The typed location stays the primary/required field -- GPS is a backup pin
// for dispatched providers, so failure here never blocks the request, it just
// falls back to asking them to double check their typed location.
function useCurrentLocation() {
  const statusText = document.getElementById('gpsStatusText');
  if (!navigator.geolocation) {
    showToast("Location isn't available on this device \u2014 please double check your typed location");
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
      showToast("Couldn't get your location \u2014 please make sure your typed location is correct");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ===== Booking =====
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
  if (!selectedSlot) { showToast('Please choose a time'); return; }
  if (!make) { showToast('Please select your vehicle make'); return; }
  if (!model) { showToast('Please select or enter your vehicle model'); return; }
  if (!address) { showToast('Please add your location'); return; }
  if (!phone) { showToast('Please add a contact phone number'); return; }

  const vehicle = `${year} ${make} ${model}`.trim();
  const s = serviceById(serviceId);
  const newAppt = {
    id: 'a' + Date.now(), serviceId, date, time: selectedSlot,
    vehicle, address, phone, notes, status: 'upcoming',
    latitude: bookingGpsCoords ? bookingGpsCoords.latitude : null,
    longitude: bookingGpsCoords ? bookingGpsCoords.longitude : null
  };
  appointments.unshift(newAppt);

  openModal(`
    <div class="modal-title">Confirm & pay</div>
    <div class="modal-sub">${s.emoji} ${s.name} on ${formatDate(date)} at ${selectedSlot}</div>
    <div class="modal-info-row"><div class="k">Service</div><div class="v">$${s.price}+</div></div>
    <div class="modal-btns" style="flex-direction:column;gap:10px;">
      <button class="modal-btn primary" onclick="payForBooking('${newAppt.id}', '${serviceId}')">Pay & confirm request \u2192</button>
      <button class="modal-btn secondary" onclick="closeModal(); showScreen('screen-appointments');">Pay later</button>
      <button class="modal-btn danger" onclick="cancelUnpaidBooking('${newAppt.id}')">Cancel</button>
    </div>
  `);
}

// Discards a request the customer decided not to go through with (used from
// the Confirm & pay popup's Cancel button) and returns them to Home, rather
// than leaving an unpaid pending request sitting in their Requests tab.
function cancelUnpaidBooking(apptId) {
  appointments = appointments.filter(a => a.id !== apptId);
  closeModal();
  showScreen('screen-home');
  showToast('Request canceled');
}

async function payForBooking(apptId, serviceId) {
  const appt = appointments.find(a => a.id === apptId);
  const s = serviceById(serviceId);
  const email = prompt('Enter your email for the payment receipt:');
  if (!email) return;

  modalSheet.innerHTML = `<div class="modal-title">Redirecting to checkout\u2026</div><div class="scan-anim"><div class="scan-spinner"></div></div>`;

  try {
    const res = await fetch('/.netlify/functions/create-booking-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app: 'roadside',
        serviceName: s.name,
        amountInDollars: s.price,
        customerEmail: email,
        userId: null,
        bookingId: apptId,
        vehicle: appt ? appt.vehicle : undefined,
        address: appt ? appt.address : undefined,
        phone: appt ? appt.phone : undefined,
        notes: appt ? appt.notes : undefined,
        latitude: appt ? appt.latitude : undefined,
        longitude: appt ? appt.longitude : undefined
      })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('Something went wrong starting checkout \u2014 please try again');
      closeModal();
      showScreen('screen-appointments');
    }
  } catch (err) {
    console.error(err);
    showToast('Could not reach checkout \u2014 please try again');
    closeModal();
    showScreen('screen-appointments');
  }
}


// ===== Appointment detail / cancel =====
function openApptModal(id) {
  const a = appointments.find(x => x.id === id);
  if (!a) return;
  const s = serviceById(a.serviceId);
  openModal(`
    <div class="modal-title">${s.emoji} ${s.name}</div>
    <div class="modal-sub">${formatDate(a.date)} at ${a.time}</div>
    <div class="modal-info-row"><div class="k">Vehicle</div><div class="v">${a.vehicle}</div></div>
    <div class="modal-info-row"><div class="k">Location</div><div class="v">${a.address}</div></div>
    ${a.latitude && a.longitude ? `<div class="modal-info-row"><div class="k">GPS pin</div><div class="v"><a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" style="color:#F59E0B;">Open in Maps \u2192</a></div></div>` : ''}
    <div class="modal-info-row"><div class="k">Phone</div><div class="v">${a.phone}</div></div>
    <div class="modal-info-row"><div class="k">Status</div><div class="v" style="text-transform:capitalize;">${a.status}</div></div>
    ${a.notes ? `<div class="modal-info-row"><div class="k">Notes</div><div class="v">${a.notes}</div></div>` : ''}
    <div class="modal-btns">
      ${a.status === 'upcoming' ? `<button class="modal-btn danger" onclick="cancelAppt('${a.id}')">Cancel request</button>` : `<button class="modal-btn primary" onclick="closeModal(); openLeaveReviewModal('${a.serviceId}');">Leave a review</button>`}
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}
function cancelAppt(id) {
  appointments = appointments.filter(a => a.id !== id);
  closeModal();
  showToast('Request canceled');
  renderAppointments(); renderHome();
}

// ===== Reviews =====
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
function openEditProfileModal() {
  const name = document.getElementById('profile-name').textContent;
  const email = document.getElementById('profile-email').textContent;
  openModal(`
    <div class="modal-title">Edit profile</div>
    <div class="modal-field"><label class="modal-label">Full name</label><input class="modal-input" id="editName" value="${name}"></div>
    <div class="modal-field"><label class="modal-label">Email</label><input class="modal-input" id="editEmail" value="${email}"></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="saveProfile()">Save changes</button>
    </div>
  `);
}
function saveProfile() {
  const name = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  if (name) {
    document.getElementById('profile-name').textContent = name;
    const parts = name.trim().split(/\s+/);
    const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    document.getElementById('profile-avatar').textContent = initials || 'ME';
    document.querySelectorAll('.avatar').forEach(a => a.textContent = initials || 'ME');
  }
  if (email) document.getElementById('profile-email').textContent = email;
  closeModal();
  showToast('Profile updated');
}

function openVehicleModal() {
  const current = document.getElementById('vehicle-sub').textContent;
  openModal(`
    <div class="modal-title">My vehicle</div>
    <div class="modal-field"><label class="modal-label">Year, make & model</label><input class="modal-input" id="vehicleInput" value="${current}"></div>
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
    document.querySelector('.profile-plan').innerHTML = `<i class="ti ti-car" style="font-size:11px;"></i> ${v}`;
  }
  closeModal();
  showToast('Vehicle updated');
}

function openBillingModal() {
  openModal(`
    <div class="modal-title">Payment method</div>
    <div class="modal-info-row"><div class="k">Card on file</div><div class="v">Visa ···· 4242</div></div>
    <div class="modal-info-row"><div class="k">Billed</div><div class="v">Per completed service</div></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      <button class="modal-btn primary" onclick="closeModal(); showToast('Redirecting to secure payment update…');">Update card</button>
    </div>
  `);
}

function openHoursModal() {
  openModal(`
    <div class="modal-title">Hours & service area</div>
    <div class="modal-info-row"><div class="k">Days</div><div class="v">7 days a week</div></div>
    <div class="modal-info-row"><div class="k">Hours</div><div class="v">24/7</div></div>
    <div class="modal-info-row"><div class="k">Service radius</div><div class="v">25 miles</div></div>
    <div class="modal-btns"><button class="modal-btn secondary" onclick="closeModal()">Close</button></div>
  `);
}

function openHelpModal() {
  openModal(`
    <div class="modal-title">Help & support</div>
    <div class="modal-sub">Question about a request or a past service? Call, text, or send a message and we'll get back to you shortly.</div>
    <div class="modal-btns">
      <a class="modal-btn secondary" href="tel:+12403151464" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">Call (240) 315-1464</a>
      <a class="modal-btn primary" href="../index.html#contact" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">Send a message</a>
    </div>
  `);
}

function confirmSignOut() {
  openModal(`
    <div class="modal-title">Sign out?</div>
    <div class="modal-sub">You'll need to sign back in to see your requests and reviews.</div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn danger" onclick="doSignOut()">Sign out</button>
    </div>
  `);
}
function doSignOut() { closeModal(); document.getElementById('signoutOverlay').classList.add('show'); }
function signBackIn() {
  document.getElementById('signoutOverlay').classList.remove('show');
  showScreen('screen-home');
  showToast('Welcome back!');
}
