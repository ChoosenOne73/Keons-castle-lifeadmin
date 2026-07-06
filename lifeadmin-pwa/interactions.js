// ===== Modal helpers =====
const modalOverlay = document.getElementById('modalOverlay');
const modalSheet = document.getElementById('modalSheet');

function openModal(html) {
  modalSheet.innerHTML = html;
  modalOverlay.classList.add('show');
}
function closeModal() {
  stopScanStream();
  modalOverlay.classList.remove('show');
}

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
function openAppMenu() {
  document.getElementById('appMenuOverlay').classList.add('show');
}
function closeAppMenu() {
  document.getElementById('appMenuOverlay').classList.remove('show');
}

// ===== Scan a document — real camera + OCR =====
let scanStream = null;

function openScanModal() {
  openModal(`
    <div class="modal-title">Scan a document</div>
    <div class="modal-sub">LifeAdmin needs access to your camera to scan the document and read its expiration date.</div>
    <div class="modal-btns" style="flex-direction:column;gap:10px;">
      <button class="modal-btn primary" onclick="requestCamera()"><i class="ti ti-camera" style="margin-right:6px;"></i>Use camera</button>
      <label class="modal-btn secondary" style="cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <i class="ti ti-photo" style="margin-right:6px;"></i>Upload a photo instead
        <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="handleFileCapture(event)">
      </label>
    </div>
  `);
}

async function requestCamera() {
  modalSheet.innerHTML = `
    <div class="modal-title">Requesting camera access…</div>
    <div class="modal-sub">Approve the browser permission prompt to continue.</div>
  `;
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    modalSheet.innerHTML = `
      <div class="modal-title">Position the document in frame</div>
      <div class="modal-sub">Hold steady, then tap capture.</div>
      <video id="scanVideo" autoplay playsinline style="width:100%;border-radius:12px;background:#000;max-height:320px;object-fit:cover;"></video>
      <div class="modal-btns">
        <button class="modal-btn secondary" onclick="cancelScan()">Cancel</button>
        <button class="modal-btn primary" onclick="captureFrame()"><i class="ti ti-camera" style="margin-right:6px;"></i>Capture</button>
      </div>
    `;
    const video = document.getElementById('scanVideo');
    video.srcObject = scanStream;
  } catch (err) {
    modalSheet.innerHTML = `
      <div class="modal-title">Camera access denied</div>
      <div class="modal-sub">We couldn't access your camera (${err.name === 'NotAllowedError' ? 'permission was denied' : err.message}). You can upload a photo instead.</div>
      <div class="modal-btns" style="flex-direction:column;gap:10px;">
        <label class="modal-btn primary" style="cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <i class="ti ti-photo" style="margin-right:6px;"></i>Upload a photo
          <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="handleFileCapture(event)">
        </label>
        <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      </div>
    `;
  }
}

function stopScanStream() {
  if (scanStream) {
    scanStream.getTracks().forEach(t => t.stop());
    scanStream = null;
  }
}
function cancelScan() {
  stopScanStream();
  closeModal();
}

function captureFrame() {
  const video = document.getElementById('scanVideo');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  stopScanStream();
  runOCR(canvas.toDataURL('image/png'));
}

function handleFileCapture(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => runOCR(reader.result);
  reader.readAsDataURL(file);
}

async function runOCR(imageDataUrl) {
  modalSheet.innerHTML = `
    <div class="modal-title">Reading document…</div>
    <div class="modal-sub">Running on-device text recognition. This can take a few seconds.</div>
    <div class="scan-anim">
      <img src="${imageDataUrl}" style="max-width:100%;max-height:140px;border-radius:10px;margin-bottom:14px;object-fit:cover;">
      <div class="scan-spinner"></div>
      <div style="color:rgba(255,255,255,0.5);font-size:13px;" id="ocrStatus">Starting…</div>
    </div>
  `;
  try {
    const { data } = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: m => {
        const el = document.getElementById('ocrStatus');
        if (el && m.status) el.textContent = m.status + (m.progress ? ` — ${Math.round(m.progress * 100)}%` : '');
      }
    });
    const text = (data && data.text) ? data.text.trim() : '';
    showScanResult(text, imageDataUrl);
  } catch (err) {
    modalSheet.innerHTML = `
      <div class="modal-title">Couldn't read the document</div>
      <div class="modal-sub">Text recognition failed (${err.message || 'unknown error'}). You can enter the details manually below.</div>
    `;
    setTimeout(() => showScanResult('', imageDataUrl), 800);
  }
}

// Find a date-like string in OCR'd text: matches 01/12/2027, 2027-01-12, Jan 12 2027, etc.
function extractDateGuess(text) {
  const patterns = [
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/,
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  const oneYearOut = new Date();
  oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
  return oneYearOut.toISOString().slice(0, 10);
}

function showScanResult(rawText, imageDataUrl) {
  const dateGuess = extractDateGuess(rawText);
  const firstLine = rawText.split('\n').map(l => l.trim()).find(l => l.length > 3) || 'Scanned Document';
  modalSheet.innerHTML = `
    <div class="modal-title">Document read</div>
    <div class="modal-sub">${rawText ? 'Here\u2019s what we could read. Review and adjust before saving.' : 'We couldn\u2019t confidently read text from this image — enter the details manually.'}</div>
    <div class="modal-field">
      <label class="modal-label">Document name</label>
      <input class="modal-input" id="scanName" value="${firstLine.replace(/"/g, '')}">
    </div>
    <div class="modal-field">
      <label class="modal-label">Category</label>
      <select class="modal-select" id="scanCat">
        <option>Vehicle</option><option>Travel</option><option>Health</option>
        <option>Insurance</option><option>Pets</option><option>HOA</option><option>Other</option>
      </select>
    </div>
    <div class="modal-field">
      <label class="modal-label">Expiration date</label>
      <input class="modal-input" id="scanDate" type="date" value="${dateGuess}">
    </div>
    ${rawText ? `<div class="modal-field"><label class="modal-label">Raw text detected</label><div style="background:#0D0D0D;border-radius:10px;padding:10px;font-size:11.5px;color:rgba(255,255,255,0.4);max-height:80px;overflow-y:auto;white-space:pre-wrap;">${rawText.slice(0, 400)}</div></div>` : ''}
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Discard</button>
      <button class="modal-btn primary" onclick="saveScannedDoc()">Save document</button>
    </div>
  `;
}

function saveScannedDoc() {
  const name = document.getElementById('scanName').value || 'New Document';
  closeModal();
  showToast(`"${name}" saved to Documents`);
  const list = document.getElementById('dashboard-doc-list');
  if (list) {
    const card = document.createElement('div');
    card.className = 'doc-card';
    card.innerHTML = `<div class="doc-icon di-green">📄</div><div class="doc-info"><div class="doc-name">${name}</div><div class="doc-sub">Added just now</div></div><div class="badge b-green">New</div>`;
    list.prepend(card);
  }
}

// ===== Start renewal (Document detail) =====
function startRenewal() {
  if (!currentDetailKey) return;
  const d = details[currentDetailKey];
  openModal(`
    <div class="modal-title">Start renewal?</div>
    <div class="modal-sub">We'll walk you through renewing "${d.name}" and remind you at each step.</div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Not yet</button>
      <button class="modal-btn primary" onclick="confirmRenewal()">Start renewal</button>
    </div>
  `);
}
function confirmRenewal() {
  renewalStarted[currentDetailKey] = true;
  closeModal();
  showToast('Renewal started — we\u2019ll email you next steps');
  const renewBtn = document.getElementById('renew-btn');
  renewBtn.textContent = 'Renewal in progress ✓';
  renewBtn.style.opacity = '0.7';
  renewBtn.style.pointerEvents = 'none';
}

// ===== Family: view member / add member =====
function openMemberModal(name, role, docs) {
  openModal(`
    <div class="modal-title">${name}</div>
    <div class="modal-sub">${role}</div>
    <div class="modal-info-row"><div class="k">Documents tracked</div><div class="v">${docs}</div></div>
    <div class="modal-info-row"><div class="k">Notifications</div><div class="v">Enabled</div></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      <button class="modal-btn primary" onclick="showScreen('screen-documents'); closeModal();">View documents</button>
    </div>
  `);
}

function openAddMemberModal() {
  openModal(`
    <div class="modal-title">Add family member</div>
    <div class="modal-sub">They'll be added to your family dashboard so you can track their documents too.</div>
    <div class="modal-field">
      <label class="modal-label">Name</label>
      <input class="modal-input" id="newMemberName" placeholder="e.g. Sam">
    </div>
    <div class="modal-field">
      <label class="modal-label">Relationship</label>
      <input class="modal-input" id="newMemberRole" placeholder="e.g. Sibling">
    </div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="addFamilyMember()">Add member</button>
    </div>
  `);
}

function addFamilyMember() {
  const name = document.getElementById('newMemberName').value.trim();
  const role = document.getElementById('newMemberRole').value.trim() || 'Family member';
  if (!name) { showToast('Please enter a name'); return; }
  const initials = name.slice(0, 2).toUpperCase();
  const colors = ['fa-green', 'fa-blue', 'fa-purple', 'fa-amber'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const grid = document.getElementById('family-grid');
  const card = document.createElement('div');
  card.className = 'family-card';
  card.onclick = () => openMemberModal(name, role, '0 documents');
  card.innerHTML = `<div class="fam-avatar ${color}">${initials}</div><div class="fam-name">${name}</div><div class="fam-role">${role}</div><div class="fam-docs">0 documents</div>`;
  grid.insertBefore(card, grid.querySelector('.add-member'));
  closeModal();
  showToast(`${name} added to your family`);
}

// ===== Settings: profile, plan, billing, privacy, help, sign out =====
function openEditProfileModal() {
  const name = document.getElementById('profile-name').textContent;
  const email = document.getElementById('profile-email').textContent;
  openModal(`
    <div class="modal-title">Edit profile</div>
    <div class="modal-field">
      <label class="modal-label">Full name</label>
      <input class="modal-input" id="editName" value="${name}">
    </div>
    <div class="modal-field">
      <label class="modal-label">Email</label>
      <input class="modal-input" id="editEmail" value="${email}">
    </div>
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

function openPlanModal() {
  openModal(`
    <div class="modal-title">LifeAdmin Premium</div>
    <div class="modal-sub">Track unlimited documents, add family members, and get renewal reminders before it's too late.</div>
    <div class="modal-btns" style="flex-direction:column;gap:10px;">
      <button class="modal-btn primary" onclick="startCheckout('month')">Subscribe monthly — $6/mo</button>
      <button class="modal-btn secondary" onclick="startCheckout('year')">Subscribe annually — $50/yr <span style="opacity:0.6;">(save ~30%)</span></button>
    </div>
    <div class="modal-sub" style="margin-top:14px;margin-bottom:0;text-align:center;">You'll be asked for your email, then redirected to Stripe's secure checkout.</div>
  `);
}

async function startCheckout(interval) {
  const email = prompt('Enter your email to continue to checkout:');
  if (!email) return;

  modalSheet.innerHTML = `
    <div class="modal-title">Redirecting to checkout…</div>
    <div class="scan-anim"><div class="scan-spinner"></div></div>
  `;

  try {
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval, userEmail: email, userId: null })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('Something went wrong starting checkout — please try again');
      closeModal();
    }
  } catch (err) {
    console.error(err);
    showToast('Could not reach checkout — please try again');
    closeModal();
  }
}

function openBillingModal() {
  openModal(`
    <div class="modal-title">Billing</div>
    <div class="modal-info-row"><div class="k">Payment method</div><div class="v">Visa ···· 4242</div></div>
    <div class="modal-info-row"><div class="k">Next charge</div><div class="v">$6.00 on Aug 1</div></div>
    <div class="modal-info-row"><div class="k">Billing email</div><div class="v" id="billingEmailDisplay">${document.getElementById('profile-email')?.textContent || 'marcus@email.com'}</div></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      <button class="modal-btn primary" onclick="closeModal(); showToast('Redirecting to secure payment update…');">Update card</button>
    </div>
  `);
}

function openPrivacyModal() {
  openModal(`
    <div class="modal-title">Privacy & security</div>
    <div class="modal-info-row"><div class="k">Data encryption</div><div class="v">256-bit, at rest</div></div>
    <div class="modal-info-row"><div class="k">Two-factor auth</div><div class="v">Off</div></div>
    <div class="modal-info-row"><div class="k">Document sharing</div><div class="v">Family only</div></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      <button class="modal-btn primary" onclick="closeModal(); showToast('Two-factor setup coming soon');">Enable 2FA</button>
    </div>
  `);
}

function openHelpModal() {
  openModal(`
    <div class="modal-title">Help & support</div>
    <div class="modal-sub">Have a question or ran into an issue? We usually reply within a few hours.</div>
    <div class="modal-btns">
      <a class="modal-btn secondary" href="mailto:hello@keonscastlellc.com" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">Email support</a>
      <button class="modal-btn primary" onclick="closeModal()">Done</button>
    </div>
  `);
}

function confirmSignOut() {
  openModal(`
    <div class="modal-title">Sign out?</div>
    <div class="modal-sub">You'll need to sign back in to see your documents and reminders.</div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn danger" onclick="doSignOut()">Sign out</button>
    </div>
  `);
}
function doSignOut() {
  closeModal();
  document.getElementById('signoutOverlay').classList.add('show');
}
function signBackIn() {
  document.getElementById('signoutOverlay').classList.remove('show');
  showScreen('screen-dashboard');
  showToast('Welcome back!');
}
