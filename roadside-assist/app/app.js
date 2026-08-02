// ===== Supabase setup =====
// Public/anon key -- safe to expose in frontend code. Never put the
// service_role key here; that one stays server-side in Netlify env vars.
const SUPABASE_URL = 'https://pbsxqddgdkxrhzifztpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3hxZGRnZGt4cmh6aWZ6dHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTk0NzcsImV4cCI6MjA5OTM5NTQ3N30.9ax-68EbpxpWYAd9CLovY5DhGG88QPL7Qydm4sLGsrM';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// ===== Data =====
let services = [
  { id: 'sv1', name: 'Jump Start', emoji: '🔋', price: 55, desc: 'Dead battery? We\u2019ll get your engine running again in minutes.' },
  { id: 'sv2', name: 'Flat Tire Change', emoji: '🛞', price: 65, desc: 'Swap to your spare on the spot, roadside or in a parking lot.' },
  { id: 'sv3', name: 'Lockout Service', emoji: '🔑', price: 60, desc: 'Locked your keys inside? We\u2019ll get you back in fast.' },
  { id: 'sv4', name: 'Fuel Delivery', emoji: '⛽', price: 50, desc: 'Ran out of gas? We\u2019ll bring enough to reach the nearest station.' },
  { id: 'sv7', name: 'Minor Roadside Repair', emoji: '🔧', price: 85, desc: 'Belts, hoses, and quick fixes that can get you moving again.' },
  { id: 'sv8', name: 'Emergency Dispatch', emoji: '🚨', price: 75, desc: 'Not sure what\u2019s wrong? We\u2019ll diagnose on site.' }
];

let appointments = [];

let reviews = [
  { id: 'rv1', name: 'Dana M.', initials: 'DM', rating: 5, service: 'Lockout Service', text: 'Locked my keys in the car at 11pm and they had someone there in 25 minutes.', date: '3 days ago' },
  { id: 'rv2', name: 'Theo R.', initials: 'TR', rating: 5, service: 'Flat Tire Change', text: 'Flat tire on the highway shoulder and I was back on the road in under 20 minutes.', date: '1 week ago' },
  { id: 'rv3', name: 'Priya S.', initials: 'PS', rating: 5, service: 'Lockout Service', text: 'Locked out at a gas station late at night and they had someone there fast.', date: '2 weeks ago' },
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

// ===== Vehicle & notes data for the booking form =====
const VEHICLE_YEARS = (() => { const arr = []; for (let y = 2027; y >= 1990; y--) arr.push(y); return arr; })();

const VEHICLE_MAKES = ['Acura','Alfa Romeo','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler','Dodge','Fiat','Ford','Genesis','GMC','Honda','Hyundai','Infiniti','Jaguar','Jeep','Kia','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','MINI','Mitsubishi','Nissan','Porsche','Ram','Subaru','Suzuki','Tesla','Toyota','Volkswagen','Volvo'];

const VEHICLE_MODELS = {
  'Acura': ['ILX','TLX','RDX','MDX'],
  'Alfa Romeo': ['Giulia','Stelvio'],
  'Audi': ['A3','A4','A6','Q3','Q5','Q7'],
  'BMW': ['2 Series','3 Series','5 Series','X1','X3','X5'],
  'Buick': ['Encore','Enclave','Envision'],
  'Cadillac': ['CT4','CT5','XT4','XT5','Escalade'],
  'Chevrolet': ['Spark','Sonic','Cruze','Malibu','Impala','Camaro','Corvette','Trax','Equinox','Blazer','Traverse','Tahoe','Suburban','Silverado','Colorado'],
  'Chrysler': ['300','Pacifica','Voyager'],
  'Dodge': ['Charger','Challenger','Durango','Journey','Grand Caravan'],
  'Fiat': ['500','500X'],
  'Ford': ['Fiesta','Focus','Fusion','Mustang','EcoSport','Escape','Edge','Explorer','Expedition','Bronco','Ranger','F-150','F-250'],
  'Genesis': ['G70','G80','G90','GV70','GV80'],
  'GMC': ['Terrain','Acadia','Yukon','Sierra','Canyon'],
  'Honda': ['Fit','Civic','Accord','Insight','HR-V','CR-V','Passport','Pilot','Ridgeline','Odyssey'],
  'Hyundai': ['Accent','Elantra','Sonata','Venue','Kona','Tucson','Santa Fe','Palisade'],
  'Infiniti': ['Q50','Q60','QX50','QX60','QX80'],
  'Jaguar': ['XE','XF','F-Pace','E-Pace'],
  'Jeep': ['Renegade','Compass','Cherokee','Grand Cherokee','Wrangler','Gladiator'],
  'Kia': ['Rio','Forte','K5','Soul','Seltos','Sportage','Sorento','Telluride'],
  'Land Rover': ['Discovery','Discovery Sport','Range Rover','Range Rover Sport','Range Rover Evoque'],
  'Lexus': ['IS','ES','RX','NX','GX'],
  'Lincoln': ['Corsair','Nautilus','Aviator','Navigator'],
  'Mazda': ['Mazda3','Mazda6','CX-3','CX-5','CX-9'],
  'Mercedes-Benz': ['A-Class','C-Class','E-Class','GLA','GLC','GLE'],
  'MINI': ['Cooper','Countryman','Clubman'],
  'Mitsubishi': ['Mirage','Outlander','Eclipse Cross'],
  'Nissan': ['Versa','Sentra','Altima','Maxima','Kicks','Rogue','Murano','Pathfinder','Armada','Frontier','Titan'],
  'Porsche': ['718','911','Macan','Cayenne','Panamera'],
  'Ram': ['1500','2500','3500','ProMaster'],
  'Subaru': ['Impreza','Legacy','Crosstrek','Forester','Outback','Ascent'],
  'Suzuki': [],
  'Tesla': ['Model 3','Model S','Model X','Model Y'],
  'Toyota': ['Corolla','Camry','Avalon','Prius','C-HR','RAV4','Highlander','4Runner','Sequoia','Tacoma','Tundra','Sienna'],
  'Volkswagen': ['Jetta','Passat','Golf','Beetle','Tiguan','Atlas'],
  'Volvo': ['S60','S90','XC40','XC60','XC90']
};

// Roadside Warriors' preset situations for the Notes dropdown -- "Other"
// reveals a free-text box so customers can always add specifics.
const NOTES_PRESETS = [
  'On the highway / shoulder',
  'In a parking lot',
  'At home / driveway',
  'Blocking traffic \u2014 please hurry',
  'Not safe to wait in the vehicle',
  'Other'
];

let bookingGpsCoords = null;

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
    nextCard.innerHTML = `<div class="label">Next request</div><div class="svc">${s ? s.emoji : ''} ${s ? s.name : a.serviceName || ''}</div><div class="when">${formatDate(a.date)} at ${a.time} · ${a.address}</div>`;
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
  const name = s ? `${s.emoji} ${s.name}` : (a.serviceName || 'Service');
  return `<div class="appt-card" onclick="openApptModal('${a.id}')">
    <div class="top"><div class="svc">${name}</div><div class="badge ${a.status === 'upcoming' ? 'b-amber' : 'b-green'}">${a.status === 'upcoming' ? 'Upcoming' : 'Completed'}</div></div>
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
  bookingGpsCoords = null;
  populateVehicleDropdowns();
  populateNotesDropdown();
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

// Service worker intentionally disabled -- its offline-caching logic was
// found to intercept cross-origin requests (like the Supabase library) and
// break sign-up on Auto Care. This actively unregisters any old service
// worker still running in a visitor's browser, so everyone self-heals
// automatically without needing to manually clear site data.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}

// ===== Real auth: session check on load =====
async function initAuthAndApp() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    await onSignedIn(session.user);
  } else {
    showAuthScreen();
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session && session.user) {
      onSignedIn(session.user);
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      appointments = [];
      showAuthScreen();
    }
  });
}

async function onSignedIn(user) {
  currentUser = user;
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('app').style.display = '';
  document.getElementById('profile-email').textContent = user.email || '';
  const initials = (user.email || 'ME').slice(0, 2).toUpperCase();
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('topAvatar').textContent = initials;
  await loadUserBookings();
  renderHome();
  renderServices();
}

function showAuthScreen() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
}

async function loadUserBookings() {
  if (!currentUser) return;
  const { data, error } = await supabaseClient
    .from('bookings')
    .select('*')
    .eq('customer_id', currentUser.id)
    .eq('app', 'roadside')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading bookings:', error);
    showToast('Could not load your requests \u2014 please try refreshing');
    return;
  }

  appointments = (data || []).map(row => ({
    id: row.id,
    serviceId: null,
    serviceName: row.service_name,
    price: row.price,
    date: row.scheduled_date,
    time: row.scheduled_time,
    vehicle: row.vehicle,
    address: row.address,
    phone: row.phone,
    notes: row.notes,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthAndApp();
});

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  if (!checkoutStatus) return;
  window.history.replaceState({}, '', window.location.pathname);
  if (checkoutStatus === 'success') {
    loadUserBookings().then(() => {
      showScreen('screen-appointments');
      showToast('Payment successful \u2014 your request is confirmed!');
    });
  } else if (checkoutStatus === 'cancelled') {
    showToast('Checkout cancelled \u2014 your request was not confirmed');
  }
});
