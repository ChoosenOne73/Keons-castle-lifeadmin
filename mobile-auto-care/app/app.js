// ===== Data =====
let services = [
  { id: 'sv1', name: 'Oil Change', category: 'Mechanic', emoji: '🛢️', price: 65, desc: 'Full synthetic or conventional, filter included.' },
  { id: 'sv2', name: 'Battery Replacement', category: 'Mechanic', emoji: '🔋', price: 120, desc: 'Testing, removal, and installation of a new battery.' },
  { id: 'sv3', name: 'Brake Service', category: 'Mechanic', emoji: '🛑', price: 150, desc: 'Pad and rotor inspection or replacement.' },
  { id: 'sv4', name: 'General Diagnostics', category: 'Mechanic', emoji: '🔧', price: 85, desc: 'Check-engine light, noises, or performance issues.' },
  { id: 'sv5', name: 'Emergency Roadside', category: 'Mechanic', emoji: '🚨', price: 75, desc: 'Stranded with a dead battery or flat? We\u2019ll come to you.' },
  { id: 'sv6', name: 'Exterior Detail', category: 'Detailing', emoji: '🚿', price: 90, desc: 'Hand wash, clay bar, wax, tire shine, window cleaning.' },
  { id: 'sv7', name: 'Interior Detail', category: 'Detailing', emoji: '🪑', price: 110, desc: 'Deep vacuum, upholstery/leather clean, dash detailing.' },
  { id: 'sv8', name: 'Full Detail Package', category: 'Detailing', emoji: '✨', price: 180, desc: 'Complete interior + exterior detail — our most popular.' }
];

let appointments = [
  { id: 'a1', serviceId: 'sv6', date: addDays(2), time: '10:00 AM', vehicle: '2019 Honda Civic', address: '142 Oak Street', phone: '(240) 315-1464', notes: '', status: 'upcoming' },
  { id: 'a2', serviceId: 'sv1', date: addDays(-14), time: '2:00 PM', vehicle: '2019 Honda Civic', address: '142 Oak Street', phone: '(240) 315-1464', notes: '', status: 'completed' },
  { id: 'a3', serviceId: 'sv3', date: addDays(-40), time: '9:00 AM', vehicle: '2019 Honda Civic', address: '142 Oak Street', phone: '(240) 315-1464', notes: '', status: 'completed' }
];

let reviews = [
  { id: 'rv1', name: 'Dana M.', initials: 'DM', rating: 5, service: 'Battery Replacement', text: 'Showed up on time, replaced my battery in the office parking lot in 20 minutes.', date: '3 days ago' },
  { id: 'rv2', name: 'Theo R.', initials: 'TR', rating: 5, service: 'Full Detail Package', text: 'Made my car look brand new. Booking through the app was easier than any shop I\u2019ve used.', date: '1 week ago' },
  { id: 'rv3', name: 'Priya S.', initials: 'PS', rating: 5, service: 'General Diagnostics', text: 'Diagnosed my check engine light and fixed it same day, right in my driveway.', date: '2 weeks ago' },
  { id: 'rv4', name: 'Ben T.', initials: 'BT', rating: 4, service: 'Oil Change', text: 'Quick and easy, though I wish there were more early morning slots.', date: '3 weeks ago' }
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
  return `<div class="doc-card" data-cat="${s.category}" onclick="startBooking('${s.id}')">
    <div class="doc-icon di-amber">${s.emoji}</div>
    <div class="doc-info"><div class="doc-name">${s.name}</div><div class="doc-sub">${s.category} · ${s.desc}</div></div>
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
    nextCard.innerHTML = `<div class="label">Next appointment</div><div class="svc">${s.emoji} ${s.name}</div><div class="when">${formatDate(a.date)} at ${a.time} · ${a.address}</div>`;
  } else {
    nextCard.style.display = 'none';
  }

  document.getElementById('home-service-list').innerHTML = services.slice(0, 4).map(serviceCardHTML).join('');
  document.getElementById('home-review-list').innerHTML = reviews.slice(0, 2).map(reviewCardHTML).join('');
}

let activeServiceCat = 'All';
function renderServices() {
  const filtered = activeServiceCat === 'All' ? services : services.filter(s => s.category === activeServiceCat);
  document.getElementById('services-list').innerHTML = filtered.map(serviceCardHTML).join('');
}
function setServiceFilter(el) {
  document.querySelectorAll('#screen-services .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeServiceCat = el.dataset.cat;
  renderServices();
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
  document.getElementById('appt-upcoming').innerHTML = upcoming.map(apptCardHTML).join('') || `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:0 20px;">No upcoming appointments.</div>`;
  document.getElementById('appt-past').innerHTML = past.map(apptCardHTML).join('') || `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:0 20px;">No past appointments yet.</div>`;
}

function reviewCardHTML(r) {
  return `<div class="review-card-app" style="margin:0 20px 10px;background:#161616;border:0.5px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px;">
    <div style="color:#FDBA74;font-size:13px;margin-bottom:6px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
    <div style="color:rgba(255,255,255,0.75);font-size:13px;line-height:1.5;margin-bottom:10px;">${r.text}</div>
    <div style="display:flex;align-items:center;gap:9px;">
      <div style="width:28px;height:28px;border-radius:50%;background:rgba(251,146,60,0.16);color:#FB923C;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;">${r.initials}</div>
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
  document.getElementById('bookDate').value = addDays(1);
  document.getElementById('bookDate').min = addDays(0);
  selectedSlot = null;
  renderTimeSlots();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-book').classList.add('active');
}

const ALL_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
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
    showToast('Payment successful \u2014 your appointment is confirmed!');
  } else if (checkoutStatus === 'cancelled') {
    showToast('Checkout cancelled \u2014 your appointment was not confirmed');
  }
});
