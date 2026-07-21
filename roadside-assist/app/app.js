// ===== Data =====
let services = [
  { id: 'sv1', name: 'Jump Start', emoji: '🔋', price: 55, desc: 'Dead battery? We\u2019ll get your engine running again in minutes.' },
  { id: 'sv2', name: 'Flat Tire Change', emoji: '🛞', price: 65, desc: 'Swap to your spare on the spot, roadside or in a parking lot.' },
  { id: 'sv3', name: 'Lockout Service', emoji: '🔑', price: 60, desc: 'Locked your keys inside? We\u2019ll get you back in fast.' },
  { id: 'sv4', name: 'Fuel Delivery', emoji: '⛽', price: 50, desc: 'Ran out of gas? We\u2019ll bring enough to reach the nearest station.' },
  { id: 'sv5', name: 'Winch-Out & Recovery', emoji: '🪢', price: 95, desc: 'Stuck in a ditch, snow, or mud \u2014 we\u2019ll pull you free safely.' },
  { id: 'sv6', name: 'Towing', emoji: '🚚', price: 110, desc: 'When it can\u2019t be fixed roadside, we\u2019ll tow you to your shop of choice.' },
  { id: 'sv7', name: 'Minor Roadside Repair', emoji: '🔧', price: 85, desc: 'Belts, hoses, and quick fixes that can get you moving again.' },
  { id: 'sv8', name: 'Emergency Dispatch', emoji: '🚨', price: 75, desc: 'Not sure what\u2019s wrong? We\u2019ll diagnose on site.' }
];

let appointments = [
  { id: 'a1', serviceId: 'sv2', date: addDays(2), time: '10:00 AM', vehicle: '2019 Honda Civic', address: '142 Oak Street', phone: '(240) 315-1464', notes: '', status: 'upcoming' },
  { id: 'a2', serviceId: 'sv1', date: addDays(-14), time: '2:00 PM', vehicle: '2019 Honda Civic', address: '142 Oak Street', phone: '(240) 315-1464', notes: '', status: 'completed' },
  { id: 'a3', serviceId: 'sv5', date: addDays(-40), time: '9:00 AM', vehicle: '2019 Honda Civic', address: '142 Oak Street', phone: '(240) 315-1464', notes: '', status: 'completed' }
];

let reviews = [
  { id: 'rv1', name: 'Dana M.', initials: 'DM', rating: 5, service: 'Lockout Service', text: 'Locked my keys in the car at 11pm and they had someone there in 25 minutes.', date: '3 days ago' },
  { id: 'rv2', name: 'Theo R.', initials: 'TR', rating: 5, service: 'Flat Tire Change', text: 'Flat tire on the highway shoulder and I was back on the road in under 20 minutes.', date: '1 week ago' },
  { id: 'rv3', name: 'Priya S.', initials: 'PS', rating: 5, service: 'Winch-Out & Recovery', text: 'Stuck in the snow off the road and they winched me out safely.', date: '2 weeks ago' },
  { id: 'rv4', name: 'Ben T.', initials: 'BT', rating: 4, service: 'Jump Start', text: 'Quick and easy, though the wait was a bit longer than the estimate.', date: '3 weeks ago' }
];

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function serviceById(id) { return services.find(s => s.id === id); }

let currentBookingService = null;
let selectedSlot = null;
let prevScreen = 'screen-home';
const navMap = {
  'screen-home': 'nav-home',
  'screen-services': 'nav-services',
  'screen-appointments': 'nav-appointments',
  'screen-reviews': 'nav-reviews',
  'screen-settings': 'nav-settings'
};

function showScreen(id) {
  if (id === 'screen-book') return;
  prevScreen = id;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navMap[id]) document.getElementById(navMap[id]).classList.add('active');
  if (id === 'screen-home') renderHome();
  if (id === 'screen-services') renderServices();
  if (id === 'screen-appointments') renderAppointments();
  if (id === 'screen-reviews') renderReviews();
  window.scrollTo(0, 0);
}
function goBack() { showScreen(prevScreen); }

function serviceCardHTML(s) {
  return `<div class="doc-card" onclick="startBooking('${s.id}')">
    <div class="doc-icon di-amber">${s.emoji}</div>
    <div class="doc-info"><div class="doc-name">${s.name}</div><div class="doc-sub">${s.desc}</div></div>
    <div class="badge b-green">$${s.price}+</div>
  </div>`;
}

function renderHome() {
  const upcoming = appointments.filter(a => a.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date));
  document.getElementById('stat-upcoming').textContent = upcoming.length;
  document.getElementById('stat-completed').textContent = appointments.filter(a => a.status === 'completed').length;
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  document.getElementById('stat-rating').textContent = avg;

  const nextCard = document.getElementById('nextApptCard');
  if (upcoming.length) {
    const a = upcoming[0];
    const s = serviceById(a.serviceId);
    nextCard.style.display = 'block';
    nextCard.innerHTML = `<div class="label">Next request</div><div class="svc">${s.emoji} ${s.name}</div><div class="when">${formatDate(a.date)} at ${a.time} · ${a.address}</div>`;
  } else {
    nextCard.style.display = 'none';
  }

  document.getElementById('home-service-list').innerHTML = services.slice(0, 4).map(serviceCardHTML).join('');
  document.getElementById('home-review-list').innerHTML = reviews.slice(0, 2).map(reviewCardHTML).join('');
}

function renderServices() {
  document.getElementById('services-list').innerHTML = services.map(serviceCardHTML).join('');
}

function apptCardHTML(a) {
  const s = serviceById(a.serviceId);
  return `<div class="appt-card" onclick="openApptModal('${a.id}')">
    <div class="top"><div class="svc">${s.emoji} ${s.name}</div><div class="badge ${a.status === 'upcoming' ? 'b-amber' : 'b-green'}">${a.status === 'upcoming' ? 'Upcoming' : 'Completed'}</div></div>
    <div class="when">${formatDate(a.date)} at ${a.time} · ${a.address}</div>
  </div>`;
}
function renderAppointments() {
  const upcoming = appointments.filter(a => a.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date));
  const past = appointments.filter(a => a.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById('appt-upcoming').innerHTML = upcoming.map(apptCardHTML).join('') || `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:0 20px;">No upcoming requests.</div>`;
  document.getElementById('appt-past').innerHTML = past.map(apptCardHTML).join('') || `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:0 20px;">No past requests yet.</div>`;
}

function reviewCardHTML(r) {
  return `<div class="review-card-app" style="margin:0 20px 10px;background:#161616;border:0.5px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px;">
    <div style="color:#FCD34D;font-size:13px;margin-bottom:6px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
    <div style="color:rgba(255,255,255,0.75);font-size:13px;line-height:1.5;margin-bottom:10px;">${r.text}</div>
    <div style="display:flex;align-items:center;gap:9px;">
      <div style="width:28px;height:28px;border-radius:50%;background:rgba(245,158,11,0.16);color:#F59E0B;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;">${r.initials}</div>
      <div><div style="font-size:12.5px;font-weight:600;color:#fff;">${r.name}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);">${r.service} · ${r.date}</div></div>
    </div>
  </div>`;
}
function renderReviews() {
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  document.getElementById('reviews-summary').textContent = `${avg}★ average · ${reviews.length} reviews`;
  document.getElementById('all-reviews-list').innerHTML = reviews.map(reviewCardHTML).join('');
}

// ===== Booking flow =====
function startBooking(serviceId) {
  currentBookingService = serviceId;
  const select = document.getElementById('bookService');
  select.innerHTML = services.map(s => `<option value="${s.id}" ${s.id === serviceId ? 'selected' : ''}>${s.emoji} ${s.name} — $${s.price}+</option>`).join('');
  document.getElementById('bookDate').value = addDays(0);
  document.getElementById('bookDate').min = addDays(0);
  selectedSlot = null;
  renderTimeSlots();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-book').classList.add('active');
}

const ALL_SLOTS = ['ASAP', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
function renderTimeSlots() {
  const date = document.getElementById('bookDate').value;
  const bookedTimes = appointments.filter(a => a.date === date && a.status === 'upcoming').map(a => a.time);
  selectedSlot = null;
  document.getElementById('slotGrid').innerHTML = ALL_SLOTS.map(t => {
    const taken = bookedTimes.includes(t);
    return `<div class="time-slot ${taken ? 'unavailable' : ''}" onclick="${taken ? '' : `selectSlot(this, '${t}')`}">${t}</div>`;
  }).join('');
}
function selectSlot(el, time) {
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  selectedSlot = time;
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

document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderServices();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker registration failed:', err));
  });
}

// Runs once on page load -- shows a confirmation if returning from a real
// Stripe Checkout redirect for a booking payment.
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  if (!checkoutStatus) return;
  window.history.replaceState({}, '', window.location.pathname);
  if (checkoutStatus === 'success') {
    showScreen('screen-appointments');
    showToast('Payment successful \u2014 your request is confirmed!');
  } else if (checkoutStatus === 'cancelled') {
    showToast('Checkout cancelled \u2014 your request was not confirmed');
  }
});
