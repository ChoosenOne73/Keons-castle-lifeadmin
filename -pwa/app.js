// ===== Screen / detail data =====
const details = {
  vehicle: {
    title: 'Registration', emoji: '🚗', name: 'Vehicle Registration', sub: 'DMV · California',
    badge: 'Expires in 5 days — Jul 4, 2026', badgeClass: 'b-red', iconClass: 'di-red',
    cat: 'Vehicle', issued: 'Jul 4, 2025', owner: 'Marcus R.',
    checks: [
      { label: 'Smog check completed', done: true },
      { label: 'Insurance proof ready', done: true },
      { label: 'DMV fees paid online', done: false },
      { label: 'New sticker applied', done: false }
    ]
  },
  passport: {
    title: 'Passport', emoji: '🛂', name: 'US Passport', sub: 'US Department of State',
    badge: 'Expires in 18 days — Jul 17, 2026', badgeClass: 'b-red', iconClass: 'di-red',
    cat: 'Travel', issued: 'Jul 17, 2016', owner: 'Marcus R.',
    checks: [
      { label: 'DS-82 renewal form filled', done: false },
      { label: 'New passport photo taken', done: false },
      { label: 'Expedited fee paid ($60)', done: false },
      { label: 'Application mailed', done: false }
    ]
  },
  rx: {
    title: 'Prescription', emoji: '💊', name: 'Prescription Refill', sub: 'CVS Pharmacy',
    badge: 'Refill due in 29 days', badgeClass: 'b-amber', iconClass: 'di-amber',
    cat: 'Health', issued: 'May 29, 2026', owner: 'Marcus R.',
    checks: [
      { label: 'Contact doctor for renewal', done: true },
      { label: 'Request 90-day supply', done: false },
      { label: 'Check insurance coverage', done: false }
    ]
  },
  insurance: {
    title: 'Home Insurance', emoji: '🛡️', name: 'Home Insurance', sub: 'State Farm',
    badge: 'Renews in 47 days — Aug 19, 2026', badgeClass: 'b-amber', iconClass: 'di-amber',
    cat: 'Insurance', issued: 'Aug 19, 2025', owner: 'Marcus R.',
    checks: [
      { label: 'Review current coverage limits', done: true },
      { label: 'Compare renewal quote', done: false },
      { label: 'Confirm payment method on file', done: false }
    ]
  },
  license: {
    title: "Driver's License", emoji: '🪪', name: "Driver's License", sub: 'DMV · California',
    badge: 'Expires in 8 months — Mar 14, 2027', badgeClass: 'b-green', iconClass: 'di-green',
    cat: 'Vehicle', issued: 'Mar 14, 2023', owner: 'Marcus R.',
    checks: [
      { label: 'Vision test scheduled', done: true },
      { label: 'DMV appointment booked', done: true },
      { label: 'Renewal fee paid', done: true }
    ]
  },
  pet: {
    title: 'Pet Vaccinations', emoji: '🐕', name: "Max's Rabies Vaccination", sub: 'Riverside Vet Clinic',
    badge: 'Due in 11 months — May 2027', badgeClass: 'b-green', iconClass: 'di-purple',
    cat: 'Pets', issued: 'May 2026', owner: 'Max (dog)',
    checks: [
      { label: 'Annual checkup completed', done: true },
      { label: 'Vaccination record on file', done: true }
    ]
  },
  hoa: {
    title: 'HOA Dues', emoji: '💳', name: 'HOA Dues — Q3', sub: 'Riverside HOA',
    badge: 'Due in 22 days — Jul 25, 2026', badgeClass: 'b-red', iconClass: 'di-red',
    cat: 'HOA', issued: 'Apr 1, 2026', owner: 'Marcus R.',
    checks: [
      { label: 'Confirm quarterly amount', done: true },
      { label: 'Submit payment online', done: false }
    ]
  },
  warranty: {
    title: 'Appliance Warranty', emoji: '🔧', name: 'Appliance Warranty', sub: 'Samsung Fridge',
    badge: 'Expires in 52 days — Aug 24, 2026', badgeClass: 'b-amber', iconClass: 'di-amber',
    cat: 'Other', issued: 'Aug 24, 2023', owner: 'Marcus R.',
    checks: [
      { label: 'Locate original receipt', done: false },
      { label: 'Decide on extended coverage', done: false }
    ]
  },
  mortgage: {
    title: 'Mortgage Review', emoji: '🏠', name: 'Mortgage Rate Review', sub: 'First National Bank',
    badge: 'Review window in 61 days — Sep 2, 2026', badgeClass: 'b-amber', iconClass: 'di-blue',
    cat: 'Other', issued: 'Sep 2, 2021', owner: 'Marcus R.',
    checks: [
      { label: 'Request current rate summary', done: false },
      { label: 'Compare refinance options', done: false }
    ]
  },
  dental: {
    title: 'Dental Insurance', emoji: '🦷', name: 'Dental Insurance', sub: 'Aetna · Annual plan',
    badge: 'Renews in 14 months — Sep 2027', badgeClass: 'b-green', iconClass: 'di-green',
    cat: 'Insurance', issued: 'Sep 2025', owner: 'Marcus R.',
    checks: [
      { label: 'Annual cleaning used', done: true },
      { label: 'Plan renewal automatic', done: true }
    ]
  },
  lily_passport: {
    title: "Lily's Passport", emoji: '🛂', name: "Lily's Passport", sub: 'US State Dept · Child',
    badge: 'Expires in 12 days — Jul 15, 2026', badgeClass: 'b-red', iconClass: 'di-red',
    cat: 'Travel', issued: 'Jul 15, 2016', owner: 'Lily R.',
    checks: [
      { label: 'DS-11 minor renewal form filled', done: false },
      { label: 'Both parents present for signing', done: false },
      { label: 'New passport photo taken', done: false }
    ]
  },
  jordan_insurance: {
    title: "Jordan's Health Insurance", emoji: '🏥', name: "Jordan's Health Insurance", sub: 'Open enrollment',
    badge: 'Enrollment closes in 44 days — Aug 16, 2026', badgeClass: 'b-amber', iconClass: 'di-amber',
    cat: 'Insurance', issued: 'Jan 1, 2026', owner: 'Jordan R.',
    checks: [
      { label: 'Review plan options', done: false },
      { label: 'Compare premiums', done: false }
    ]
  },
  dad_rx: {
    title: "Dad's Prescription", emoji: '💊', name: "Dad's Prescription — Metformin", sub: 'Refill',
    badge: 'Refill due in 60 days — Sep 1, 2026', badgeClass: 'b-amber', iconClass: 'di-amber',
    cat: 'Health', issued: 'Jun 1, 2026', owner: 'Dad',
    checks: [
      { label: 'Contact doctor for renewal', done: false },
      { label: 'Confirm pharmacy pickup', done: false }
    ]
  }
};

let prevScreen = 'screen-dashboard';
const navMap = {
  'screen-dashboard': 'nav-dashboard',
  'screen-documents': 'nav-documents',
  'screen-family': 'nav-family',
  'screen-alerts': 'nav-alerts',
  'screen-settings': 'nav-settings'
};

function showScreen(id) {
  if (id === 'screen-detail') return;
  prevScreen = id;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navMap[id]) document.getElementById(navMap[id]).classList.add('active');
  document.querySelector('.scroll-area.active-scroll')?.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
}

let currentDetailKey = null;
const renewalStarted = {};

function showDetail(key) {
  const d = details[key];
  if (!d) return;
  currentDetailKey = key;
  const renewBtn = document.getElementById('renew-btn');
  if (renewBtn) {
    if (renewalStarted[key]) {
      renewBtn.textContent = 'Renewal in progress ✓';
      renewBtn.style.opacity = '0.7';
      renewBtn.style.pointerEvents = 'none';
    } else {
      renewBtn.textContent = 'Start renewal →';
      renewBtn.style.opacity = '1';
      renewBtn.style.pointerEvents = 'auto';
    }
  }
  document.getElementById('detail-title').textContent = d.title;
  const icon = document.getElementById('detail-icon');
  icon.className = 'detail-big-icon ' + d.iconClass;
  document.getElementById('detail-emoji').textContent = d.emoji;
  document.getElementById('detail-name').textContent = d.name;
  document.getElementById('detail-sub').textContent = d.sub;
  const badge = document.getElementById('detail-badge');
  badge.textContent = d.badge;
  badge.className = 'detail-days-inner ' + d.badgeClass;
  document.getElementById('di-cat').textContent = d.cat;
  document.getElementById('di-issued').textContent = d.issued;
  document.getElementById('di-owner').textContent = d.owner;
  const cl = document.getElementById('checklist');
  cl.innerHTML = d.checks.map(c => `
    <div class="check-item" onclick="toggleCheck(this)">
      <div class="check-box ${c.done ? 'done' : ''}">${c.done ? '✓' : ''}</div>
      <div class="check-label ${c.done ? 'done' : ''}">${c.label}</div>
    </div>`).join('');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-detail').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
}

function toggleCheck(el) {
  const box = el.querySelector('.check-box');
  const label = el.querySelector('.check-label');
  const done = box.classList.toggle('done');
  box.textContent = done ? '✓' : '';
  label.classList.toggle('done', done);
}

function goBack() {
  showScreen(prevScreen);
}

function setFilter(el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const cat = el.dataset.cat || 'All';

  document.querySelectorAll('#screen-documents .doc-list[data-group]').forEach(list => {
    let anyVisible = false;
    list.querySelectorAll('.doc-card').forEach(card => {
      const match = cat === 'All' || card.dataset.cat === cat;
      card.style.display = match ? 'flex' : 'none';
      if (match) anyVisible = true;
    });
    const group = list.dataset.group;
    const heading = document.querySelector(`#screen-documents .sec-title[data-group="${group}"]`);
    if (heading) heading.style.display = anyVisible ? 'block' : 'none';
    list.style.display = anyVisible ? 'flex' : 'none';
  });
}

// ===== Live clock in fake status bar =====
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  el.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 30000);

// ===== PWA: Service worker registration =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// ===== PWA: Install prompt handling =====
let deferredPrompt = null;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const installDismiss = document.getElementById('installDismiss');

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!isStandalone() && !localStorage.getItem('la_install_dismissed')) {
    setTimeout(() => installBanner.classList.add('show'), 1500);
  }
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) {
    installBanner.classList.remove('show');
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBanner.classList.remove('show');
});

installDismiss?.addEventListener('click', () => {
  installBanner.classList.remove('show');
  localStorage.setItem('la_install_dismissed', '1');
});

window.addEventListener('appinstalled', () => {
  installBanner.classList.remove('show');
  deferredPrompt = null;
});
