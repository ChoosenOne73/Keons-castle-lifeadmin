// ===== Modal helpers =====
const modalOverlay = document.getElementById('modalOverlay');
const modalSheet = document.getElementById('modalSheet');
function openModal(html) { modalSheet.innerHTML = html; modalOverlay.classList.add('show'); }
function closeModal() { stopScanStream(); modalOverlay.classList.remove('show'); }

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

// ===== Scan a pantry item — real camera + OCR =====
let scanStream = null;

function openScanModal() {
  openModal(`
    <div class="modal-title">Scan a pantry item</div>
    <div class="modal-sub">Leftovers needs access to your camera to read the label and track its expiration date.</div>
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
      <div class="modal-title">Frame the label</div>
      <div class="modal-sub">Hold steady, then tap capture.</div>
      <video id="scanVideo" autoplay playsinline style="width:100%;border-radius:12px;background:#000;max-height:320px;object-fit:cover;"></video>
      <div class="modal-btns">
        <button class="modal-btn secondary" onclick="cancelScan()">Cancel</button>
        <button class="modal-btn primary" onclick="captureFrame()"><i class="ti ti-camera" style="margin-right:6px;"></i>Capture</button>
      </div>
    `;
    document.getElementById('scanVideo').srcObject = scanStream;
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
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
}
function cancelScan() { stopScanStream(); closeModal(); }

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
    <div class="modal-title">Reading label…</div>
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
    showScanResult((data && data.text) ? data.text.trim() : '');
  } catch (err) {
    showScanResult('');
  }
}
function extractDateGuess(text) {
  const patterns = [
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/,
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const d = new Date(m[1]); if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10); }
  }
  const weekOut = new Date(); weekOut.setDate(weekOut.getDate() + 7);
  return weekOut.toISOString().slice(0, 10);
}
function showScanResult(rawText) {
  const dateGuess = extractDateGuess(rawText);
  const firstLine = rawText.split('\n').map(l => l.trim()).find(l => l.length > 2) || 'Pantry Item';
  modalSheet.innerHTML = `
    <div class="modal-title">Label read</div>
    <div class="modal-sub">${rawText ? 'Here\u2019s what we could read. Review and adjust before saving.' : 'We couldn\u2019t confidently read text from this image — enter the details manually.'}</div>
    <div class="modal-field"><label class="modal-label">Item name</label><input class="modal-input" id="scanName" value="${firstLine.replace(/"/g, '')}"></div>
    <div class="modal-field">
      <label class="modal-label">Category</label>
      <select class="modal-select" id="scanCat"><option>Produce</option><option>Dairy</option><option>Meat</option><option>Pantry</option><option>Frozen</option></select>
    </div>
    <div class="modal-field"><label class="modal-label">Quantity</label><input class="modal-input" id="scanQty" value="1"></div>
    <div class="modal-field"><label class="modal-label">Use-by date</label><input class="modal-input" id="scanDate" type="date" value="${dateGuess}"></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Discard</button>
      <button class="modal-btn primary" onclick="saveScannedItem()">Save to pantry</button>
    </div>
  `;
}
function saveScannedItem() {
  const name = document.getElementById('scanName').value.trim() || 'Pantry Item';
  const category = document.getElementById('scanCat').value;
  const qty = document.getElementById('scanQty').value.trim() || '1';
  const dateVal = document.getElementById('scanDate').value;
  const daysLeft = dateVal ? Math.max(0, Math.round((new Date(dateVal) - new Date()) / 86400000)) : 7;
  const emojis = { Produce: '🥬', Dairy: '🧀', Meat: '🥩', Pantry: '🥫', Frozen: '🧊' };
  pantry.unshift({ id: 'p' + Date.now(), name, category, emoji: emojis[category] || '📦', qty, daysLeft, status: 'fresh' });
  closeModal();
  showToast(`"${name}" added to your pantry`);
  renderDashboard(); renderPantry();
}

// ===== Item detail actions =====
function markItemUsed() {
  const item = pantry.find(p => p.id === currentItemId);
  if (!item) return;
  item.status = 'used';
  showToast(`Marked "${item.name}" as used`);
  showScreen(prevScreen);
  renderDashboard(); renderPantry();
}
function addItemToShoppingList() {
  const item = pantry.find(p => p.id === currentItemId);
  if (!item) return;
  shoppingList.unshift({ id: 's' + Date.now(), name: item.name, qty: item.qty, done: false });
  showToast(`Added "${item.name}" to your shopping list`);
}

// ===== Recipes =====
function openRecipeModal(id) {
  const r = recipes.find(x => x.id === id);
  if (!r) return;
  openModal(`
    <div class="modal-title">${r.emoji} ${r.name}</div>
    <div class="modal-sub">${r.desc}</div>
    <div class="modal-info-row"><div class="k">Time</div><div class="v">${r.time}</div></div>
    <div class="modal-info-row"><div class="k">Uses from your pantry</div><div class="v">${r.uses.length} item${r.uses.length === 1 ? '' : 's'}</div></div>
    <div class="modal-field">
      <label class="modal-label">Ingredients</label>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${r.ingredients.map(i => `<div style="color:#fff;font-size:13px;">• ${i}</div>`).join('')}
      </div>
    </div>
    <div class="modal-field">
      <label class="modal-label">Steps</label>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${r.steps.map((s, i) => `<div style="color:rgba(255,255,255,0.7);font-size:13px;line-height:1.5;"><b style="color:#4AB471;">${i + 1}.</b> ${s}</div>`).join('')}
      </div>
    </div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Close</button>
      <button class="modal-btn primary" onclick="closeModal(); showToast('Added to your cook queue');">Cook this</button>
    </div>
  `);
}

// ===== Shopping list: add item =====
function openAddShoppingItemModal() {
  openModal(`
    <div class="modal-title">Add to shopping list</div>
    <div class="modal-field"><label class="modal-label">Item</label><input class="modal-input" id="newShopName" placeholder="e.g. Fresh basil"></div>
    <div class="modal-field"><label class="modal-label">Quantity</label><input class="modal-input" id="newShopQty" placeholder="e.g. 1 bunch" value="1"></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="addShoppingItem()">Add item</button>
    </div>
  `);
}
function addShoppingItem() {
  const name = document.getElementById('newShopName').value.trim();
  const qty = document.getElementById('newShopQty').value.trim() || '1';
  if (!name) { showToast('Please enter an item name'); return; }
  shoppingList.unshift({ id: 's' + Date.now(), name, qty, done: false });
  closeModal();
  showToast(`"${name}" added to your list`);
  renderShoppingList();
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

function openDietModal() {
  openModal(`
    <div class="modal-title">Dietary preferences</div>
    <div class="modal-sub">Recipes will avoid these ingredients where possible.</div>
    ${['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut-free'].map(d => `
      <div class="settings-row" style="padding:10px 0;">
        <div class="sr-info"><div class="sr-label">${d}</div></div>
        <div class="toggle" onclick="this.classList.toggle('on')"></div>
      </div>`).join('')}
    <div class="modal-btns">
      <button class="modal-btn primary" onclick="closeModal(); showToast('Preferences saved');">Save</button>
    </div>
  `);
}
function openHouseholdModal() {
  openModal(`
    <div class="modal-title">Household size</div>
    <div class="modal-sub">Recipe portions will scale to match.</div>
    <div class="modal-field"><label class="modal-label">Number of people</label><input class="modal-input" id="householdSize" type="number" min="1" max="10" value="2"></div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn primary" onclick="closeModal(); showToast('Household size updated');">Save</button>
    </div>
  `);
}
function openPlanModal() {
  openModal(`
    <div class="modal-title">Leftovers Premium</div>
    <div class="modal-sub">Unlimited pantry items, recipe suggestions, and shopping list sync.</div>
    <div class="modal-btns" style="flex-direction:column;gap:10px;">
      <button class="modal-btn primary" onclick="startCheckout('month')">Subscribe monthly \u2014 $3.99/mo</button>
      <button class="modal-btn secondary" onclick="startCheckout('year')">Subscribe annually \u2014 $34.99/yr <span style="opacity:0.6;">(save ~27%)</span></button>
    </div>
    <div class="modal-sub" style="margin-top:14px;margin-bottom:0;text-align:center;">You'll be asked for your email, then redirected to Stripe's secure checkout.</div>
  `);
}

async function startCheckout(interval) {
  const email = prompt('Enter your email to continue to checkout:');
  if (!email) return;

  modalSheet.innerHTML = `
    <div class="modal-title">Redirecting to checkout\u2026</div>
    <div class="scan-anim"><div class="scan-spinner"></div></div>
  `;

  try {
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'leftovers', interval, userEmail: email, userId: null })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast('Something went wrong starting checkout \u2014 please try again');
      closeModal();
    }
  } catch (err) {
    console.error(err);
    showToast('Could not reach checkout \u2014 please try again');
    closeModal();
  }
}
function openBillingModal() {
  openModal(`
    <div class="modal-title">Billing</div>
    <div class="modal-info-row"><div class="k">Payment method</div><div class="v">Visa ···· 4242</div></div>
    <div class="modal-info-row"><div class="k">Next charge</div><div class="v">$3.99 on Aug 1</div></div>
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
    <div class="modal-info-row"><div class="k">Photo storage</div><div class="v">Deleted after scanning</div></div>
    <div class="modal-btns"><button class="modal-btn secondary" onclick="closeModal()">Close</button></div>
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
    <div class="modal-sub">You'll need to sign back in to see your pantry and recipes.</div>
    <div class="modal-btns">
      <button class="modal-btn secondary" onclick="closeModal()">Cancel</button>
      <button class="modal-btn danger" onclick="doSignOut()">Sign out</button>
    </div>
  `);
}
function doSignOut() { closeModal(); document.getElementById('signoutOverlay').classList.add('show'); }
function signBackIn() {
  document.getElementById('signoutOverlay').classList.remove('show');
  showScreen('screen-dashboard');
  showToast('Welcome back!');
}
