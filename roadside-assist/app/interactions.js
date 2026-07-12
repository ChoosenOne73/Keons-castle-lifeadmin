// ===== Modal helpers =====
const modalOverlay = document.getElementById('modalOverlay');
const modalSheet = document.getElementById('modalSheet');
function openModal(html) { modalSheet.innerHTML = html; modalOverlay.classList.add('show'); }
function closeModal() { stopCamStream(); modalOverlay.classList.remove('show'); }

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

// ===== Real camera capture (selfie — front camera) =====
let camStream = null;
function stopCamStream() {
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
}

function openSelfieCapture() {
  openModal(`
    <div class="modal-title">Verification selfie</div>
    <div class="modal-sub">We'll need access to your camera. Face the camera directly in good lighting.</div>
    <div class="modal-btns" style="flex-direction:column;gap:10px;">
      <button class="modal-btn primary" onclick="requestCam('user','selfie')"><i class="ti ti-camera" style="margin-right:6px;"></i>Use camera</button>
      <label class="modal-btn secondary" style="cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <i class="ti ti-photo" style="margin-right:6px;"></i>Upload a photo instead
        <input type="file" accept="image/*" capture="user" style="display:none;" onchange="handleFileCapture(event,'selfie')">
      </label>
    </div>
  `);
}
function openLicenseCapture() {
  openModal(`
    <div class="modal-title">Driver's license</div>
    <div class="modal-sub">We'll need access to your camera. Fit the whole card in frame.</div>
    <div class="modal-btns" style="flex-direction:column;gap:10px;">
      <button class="modal-btn primary" onclick="requestCam('environment','license')"><i class="ti ti-camera" style="margin-right:6px;"></i>Use camera</button>
      <label class="modal-btn secondary" style="cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <i class="ti ti-photo" style="margin-right:6px;"></i>Upload a photo instead
        <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="handleFileCapture(event,'license')">
      </label>
    </div>
  `);
}

async function requestCam(facing, kind) {
  modalSheet.innerHTML = `<div class="modal-title">Requesting camera access…</div><div class="modal-sub">Approve the browser permission prompt to continue.</div>`;
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
    modalSheet.innerHTML = `
      <div class="modal-title">${kind === 'selfie' ? 'Center your face' : 'Frame the card'}</div>
      <div class="modal-sub">Tap capture when ready.</div>
      <video id="camVideo" autoplay playsinline style="width:100%;border-radius:12px;background:#000;max-height:320px;object-fit:cover;${kind === 'selfie' ? 'transform:scaleX(-1);' : ''}"></video>
      <div class="modal-btns">
        <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
        <button class="modal-btn primary" onclick="captureCamFrame('${kind}')"><i class="ti ti-camera" style="margin-right:6px;"></i>Capture</button>
      </div>
    `;
    document.getElementById('camVideo').srcObject = camStream;
  } catch (err) {
    modalSheet.innerHTML = `
      <div class="modal-title">Camera access denied</div>
      <div class="modal-sub">We couldn't access your camera (${err.name === 'NotAllowedError' ? 'permission was denied' : err.message}). You can upload a photo instead.</div>
      <div class="modal-btns" style="flex-direction:column;gap:10px;">
        <label class="modal-btn primary" style="cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <i class="ti ti-photo" style="margin-right:6px;"></i>Upload a photo
          <input type="file" accept="image/*" style="display:none;" onchange="handleFileCapture(event,'${kind}')">
        </label>
        <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      </div>
    `;
  }
}
function captureCamFrame(kind) {
  const video = document.getElementById('camVideo');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (kind === 'selfie') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, 0, 0);
  stopCamStream();
  finishCapture(kind, canvas.toDataURL('image/jpeg', 0.9));
}
function handleFileCapture(event, kind) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => finishCapture(kind, reader.result);
  reader.readAsDataURL(file);
}
function finishCapture(kind, dataUrl) {
  closeModal();
  if (kind === 'selfie') {
    selfieCaptured = true;
    document.getElementById('selfiePreviewImg').src = dataUrl;
    document.getElementById('selfiePreviewWrap').style.display = 'block';
    showToast('Selfie captured');
  } else {
    licenseCaptured = true;
    document.getElementById('licensePreviewImg').src = dataUrl;
    document.getElementById('licensePreviewWrap').style.display = 'block';
    showToast('License uploaded');
  }
}

// ===== Settings modals (shared between customer & provider) =====
function openEditProfileModal() {
  const nameEl = currentRole === 'provider' ? document.getElementById('prov-profile-name') : document.getElementById('cust-profile-name');
  const name = nameEl ? nameEl.textContent : 'Marcus Rivera';
  openModal(`
    <div class="modal-title">Edit profile</div>
    <div class="modal-field"><label class="modal-label">Full name</label><input class="modal-input" id="editName" value="${name}"></div>
    <div class="modal-field"><label class="modal-label">Phone</label><input class="modal-input" id="editPhone" placeholder="(555) 555-5555"></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="saveProfile()">Save changes</button>
    </div>
  `);
}
function saveProfile() {
  const name = document.getElementById('editName').value.trim();
  if (name) {
    const parts = name.split(/\s+/);
    const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'ME';
    ['cust-profile-name', 'prov-profile-name'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = name; });
    document.querySelectorAll('.avatar').forEach(a => a.textContent = initials);
  }
  closeModal();
  showToast('Profile updated');
}

function openAddCardModal() {
  openModal(`
    <div class="modal-title">Add payment method</div>
    <div class="modal-field"><label class="modal-label">Card number</label><input class="modal-input" id="newCardNum" placeholder="1234 5678 9012 3456" maxlength="19" oninput="formatCardNumber(this)"></div>
    <div style="display:flex;gap:10px;">
      <div class="modal-field" style="flex:1;"><label class="modal-label">Expiry</label><input class="modal-input" id="newCardExp" placeholder="MM/YY" maxlength="5" oninput="formatExpiry(this)"></div>
      <div class="modal-field" style="flex:1;"><label class="modal-label">CVC</label><input class="modal-input" placeholder="123" maxlength="4"></div>
    </div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="closeModal(); showToast('Card added (demo)');">Save card</button>
    </div>
  `);
}
function openVehicleEditModal() {
  openModal(`
    <div class="modal-title">Edit vehicle</div>
    <div class="modal-field"><label class="modal-label">Vehicle type</label>
      <select class="modal-select" id="editVehType"><option>Car</option><option>Mini-Van</option><option>SUV</option><option>Truck</option></select>
    </div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="saveVehicleEdit()">Save</button>
    </div>
  `);
}
function saveVehicleEdit() {
  const v = document.getElementById('editVehType').value;
  document.getElementById('prov-vehicle-sub').textContent = v;
  closeModal();
  showToast('Vehicle updated');
}
function openPayoutModal() {
  openModal(`
    <div class="modal-title">Payout method</div>
    <div class="modal-info-row"><div class="k">You keep</div><div class="v" style="color:#237A47;">95% of every job</div></div>
    <div class="modal-info-row"><div class="k">Platform fee</div><div class="v">5%</div></div>
    <div class="modal-info-row"><div class="k">Payout schedule</div><div class="v">Weekly, every Thursday</div></div>
    <div class="modal-info-row"><div class="k">Next payout</div><div class="v">${nextThursday()}</div></div>
    <div class="modal-sub" style="margin-top:14px;margin-bottom:0;">Set up your real payout account through Stripe -- this is where your weekly earnings will actually be deposited.</div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      <button class="modal-btn primary" onclick="startPayoutOnboarding()">Set up payouts \u2192</button>
    </div>
  `);
}

function startPayoutOnboarding() {
  const email = prompt('Enter your email to set up payouts:');
  if (!email) return;

  modalSheet.innerHTML = `<div class="modal-title">Redirecting to Stripe\u2026</div><div class="scan-anim"><div class="scan-spinner"></div></div>`;

  fetch('/.netlify/functions/connect-onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'demo-provider-' + Date.now(), app: 'roadside-warriors', email })
  })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('Something went wrong -- please try again');
        closeModal();
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Could not reach Stripe -- please try again');
      closeModal();
    });
}
function openHelpModal() {
  openModal(`
    <div class="modal-title">Help & support</div>
    <div class="modal-sub">Question about a request, a job, or a payment? We usually reply within a few hours.</div>
    <div class="modal-btns">
      <a class="modal-btn secondary" href="tel:+12403151464" style="text-decoration:none;display:flex;align-items:center;justify-content:center;">Call us</a>
      <button class="modal-btn primary" onclick="closeModal()">Done</button>
    </div>
  `);
}
function confirmSignOut() {
  openModal(`
    <div class="modal-title">Sign out?</div>
    <div class="modal-sub">You'll need to sign back in to see your activity.</div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn danger" onclick="doSignOut()">Sign out</button>
    </div>
  `);
}
function doSignOut() { closeModal(); document.getElementById('signoutOverlay').classList.add('show'); }
function signBackIn() {
  document.getElementById('signoutOverlay').classList.remove('show');
  showScreen('screen-role');
  showToast('Welcome back!');
}

// ===== Customer settings: preload payment methods & vehicles =====
document.addEventListener('DOMContentLoaded', () => {
  const pm = document.getElementById('cust-payment-methods');
  if (pm) pm.innerHTML = `<div class="doc-card"><div class="doc-icon di-blue"><i class="ti ti-credit-card"></i></div><div class="doc-info"><div class="doc-name">Visa ···· 4242</div><div class="doc-sub">Default</div></div></div>`;
  const vl = document.getElementById('cust-vehicle-list');
  if (vl) vl.innerHTML = `<div class="doc-card"><div class="doc-icon di-green"><i class="ti ti-car"></i></div><div class="doc-info"><div class="doc-name">2019 Honda Civic</div><div class="doc-sub">Default vehicle</div></div></div>`;
});
