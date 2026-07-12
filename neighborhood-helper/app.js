// ===== Pantry data =====
let pantry = [
  { id: 'p1', name: 'Baby spinach', category: 'Produce', emoji: '🥬', qty: '1 bag', daysLeft: 2, status: 'fresh' },
  { id: 'p2', name: 'Chicken thighs', category: 'Meat', emoji: '🍗', qty: '1.2 lb', daysLeft: 1, status: 'fresh' },
  { id: 'p3', name: 'Greek yogurt', category: 'Dairy', emoji: '🥣', qty: '32 oz', daysLeft: 3, status: 'fresh' },
  { id: 'p4', name: 'Cherry tomatoes', category: 'Produce', emoji: '🍅', qty: '1 pint', daysLeft: 3, status: 'fresh' },
  { id: 'p5', name: 'Cheddar cheese', category: 'Dairy', emoji: '🧀', qty: '8 oz', daysLeft: 14, status: 'fresh' },
  { id: 'p6', name: 'Brown rice', category: 'Pantry', emoji: '🍚', qty: '2 lb bag', daysLeft: 180, status: 'fresh' },
  { id: 'p7', name: 'Canned black beans', category: 'Pantry', emoji: '🥫', qty: '2 cans', daysLeft: 300, status: 'fresh' },
  { id: 'p8', name: 'Frozen peas', category: 'Frozen', emoji: '🟢', qty: '1 bag', daysLeft: 120, status: 'fresh' },
  { id: 'p9', name: 'Eggs', category: 'Dairy', emoji: '🥚', qty: '8 left', daysLeft: 10, status: 'fresh' },
  { id: 'p10', name: 'Bell peppers', category: 'Produce', emoji: '🫑', qty: '3', daysLeft: 5, status: 'fresh' },
  { id: 'p11', name: 'Garlic', category: 'Produce', emoji: '🧄', qty: '1 bulb', daysLeft: 20, status: 'fresh' },
  { id: 'p12', name: 'Olive oil', category: 'Pantry', emoji: '🫒', qty: '1 bottle', daysLeft: 200, status: 'fresh' },
  { id: 'p13', name: 'Ground beef', category: 'Meat', emoji: '🥩', qty: '1 lb', daysLeft: 2, status: 'fresh' },
  { id: 'p14', name: 'Milk', category: 'Dairy', emoji: '🥛', qty: 'Half gallon', daysLeft: 4, status: 'fresh' },
  { id: 'p15', name: 'Leftover pasta', category: 'Pantry', emoji: '🍝', qty: '2 servings', daysLeft: 2, status: 'fresh' }
];

let recipes = [
  { id: 'r1', name: 'Chicken & Spinach Skillet', emoji: '🍳', uses: ['p2', 'p1', 'p11'], time: '25 min', desc: 'Sear chicken thighs, wilt in spinach and garlic, finish with a squeeze of lemon.', ingredients: ['Chicken thighs', 'Baby spinach', 'Garlic', 'Olive oil', 'Salt & pepper'], steps: ['Season and sear chicken thighs until golden, about 6 min per side.', 'Remove chicken, sauté garlic in the same pan.', 'Add spinach and wilt down, about 2 minutes.', 'Return chicken to pan, simmer 5 minutes, serve.'] },
  { id: 'r2', name: 'Black Bean & Rice Bowl', emoji: '🍛', uses: ['p6', 'p7', 'p10'], time: '20 min', desc: 'Simple vegetarian bowl with brown rice, black beans, and roasted bell peppers.', ingredients: ['Brown rice', 'Canned black beans', 'Bell peppers', 'Olive oil', 'Cumin'], steps: ['Cook rice according to package.', 'Sauté peppers until soft.', 'Warm black beans with cumin.', 'Combine all in a bowl, top with your favorite sauce.'] },
  { id: 'r3', name: 'Tomato & Cheddar Frittata', emoji: '🍳', uses: ['p9', 'p4', 'p5'], time: '30 min', desc: 'Baked egg dish loaded with cherry tomatoes and melty cheddar — great for using up eggs.', ingredients: ['Eggs', 'Cherry tomatoes', 'Cheddar cheese', 'Milk', 'Salt & pepper'], steps: ['Whisk eggs with a splash of milk.', 'Halve cherry tomatoes, scatter in a greased pan.', 'Pour eggs over, top with cheddar.', 'Bake at 375°F for 18–20 minutes until set.'] },
  { id: 'r4', name: 'Beef & Pea Stir-fry', emoji: '🥘', uses: ['p13', 'p8', 'p11'], time: '20 min', desc: 'Quick weeknight stir-fry using ground beef, frozen peas, and garlic.', ingredients: ['Ground beef', 'Frozen peas', 'Garlic', 'Soy sauce', 'Rice'], steps: ['Brown the ground beef with garlic.', 'Add frozen peas, cook 3–4 minutes.', 'Season with soy sauce, serve over rice.'] },
  { id: 'r5', name: 'Yogurt Parfait', emoji: '🍨', uses: ['p3'], time: '5 min', desc: 'A fast, no-cook breakfast — Greek yogurt layered with whatever fruit or granola you have.', ingredients: ['Greek yogurt', 'Honey', 'Granola (optional)'], steps: ['Layer yogurt in a glass.', 'Drizzle with honey.', 'Top with granola if you have it.'] },
  { id: 'r6', name: 'Leftover Pasta Bake', emoji: '🧀', uses: ['p15', 'p5'], time: '15 min', desc: 'Turn last night\u2019s pasta into a crispy baked dish with extra cheddar on top.', ingredients: ['Leftover pasta', 'Cheddar cheese', 'A splash of milk'], steps: ['Toss pasta with a splash of milk to loosen the sauce.', 'Transfer to a baking dish, top with cheddar.', 'Broil 4–5 minutes until bubbly and golden.'] }
];

let shoppingList = [
  { id: 's1', name: 'Lemons', qty: '3', done: false },
  { id: 's2', name: 'Parmesan cheese', qty: '1 wedge', done: false },
  { id: 's3', name: 'Baby carrots', qty: '1 bag', done: true },
  { id: 's4', name: 'Soy sauce', qty: '1 bottle', done: false }
];

let currentItemId = null;
let prevScreen = 'screen-dashboard';
const navMap = {
  'screen-dashboard': 'nav-dashboard',
  'screen-pantry': 'nav-pantry',
  'screen-recipes': 'nav-recipes',
  'screen-shopping': 'nav-shopping',
  'screen-settings': 'nav-settings'
};

function showScreen(id) {
  if (id === 'screen-detail') return;
  prevScreen = id;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navMap[id]) document.getElementById(navMap[id]).classList.add('active');
  if (id === 'screen-dashboard') renderDashboard();
  if (id === 'screen-pantry') renderPantry();
  if (id === 'screen-recipes') renderAllRecipes();
  if (id === 'screen-shopping') renderShoppingList();
  window.scrollTo(0, 0);
}
function goBack() { showScreen(prevScreen); }

// ===== Helpers =====
function daysLabel(d) {
  if (d <= 0) return 'Use today';
  if (d === 1) return '1 day left';
  if (d < 30) return `${d} days left`;
  if (d < 365) return `${Math.round(d / 30)} mo`;
  return `${Math.round(d / 365)} yr`;
}
function daysBadgeClass(d) {
  if (d <= 2) return 'b-red';
  if (d <= 6) return 'b-amber';
  return 'b-green';
}
function recipesFor(itemId) {
  return recipes.filter(r => r.uses.includes(itemId));
}
function itemCardHTML(item) {
  return `<div class="doc-card" data-cat="${item.category}" onclick="showItemDetail('${item.id}')">
    <div class="doc-icon di-green">${item.emoji}</div>
    <div class="doc-info"><div class="doc-name">${item.name}</div><div class="doc-sub">${item.category} · ${item.qty}</div></div>
    <div class="badge ${daysBadgeClass(item.daysLeft)}">${daysLabel(item.daysLeft)}</div>
  </div>`;
}
function recipeCardHTML(r) {
  return `<div class="recipe-card" onclick="openRecipeModal('${r.id}')">
    <div class="recipe-emoji">${r.emoji}</div>
    <div style="flex:1;">
      <div class="recipe-name">${r.name}</div>
      <div class="recipe-meta"><i class="ti ti-clock" style="font-size:11px;"></i> ${r.time} · uses ${r.uses.length} item${r.uses.length === 1 ? '' : 's'} you have</div>
    </div>
    <div class="recipe-match">Ready</div>
  </div>`;
}

// ===== Rendering =====
function renderDashboard() {
  const expiring = pantry.filter(p => p.daysLeft <= 3 && p.status === 'fresh').sort((a, b) => a.daysLeft - b.daysLeft);
  document.getElementById('stat-expiring').textContent = expiring.length;
  document.getElementById('stat-fresh').textContent = pantry.filter(p => p.status === 'fresh').length;
  document.getElementById('stat-recipes').textContent = recipes.length;
  document.getElementById('header-note').textContent = `${expiring.length} item${expiring.length === 1 ? '' : 's'} expiring soon`;
  document.getElementById('dashboard-item-list').innerHTML = expiring.map(itemCardHTML).join('') || `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:14px 0;">Nothing expiring soon — nice work!</div>`;
  document.getElementById('dashboard-recipe-list').innerHTML = recipes.slice(0, 3).map(recipeCardHTML).join('');
}

let activePantryCat = 'All';
function renderPantry() {
  const items = pantry.filter(p => p.status === 'fresh');
  const filtered = activePantryCat === 'All' ? items : items.filter(p => p.category === activePantryCat);
  document.getElementById('pantry-count').textContent = `${items.length} items tracked`;
  document.getElementById('pantry-item-list').innerHTML = filtered.map(itemCardHTML).join('') || `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:20px;text-align:center;">No items in this category.</div>`;
}
function setPantryFilter(el) {
  document.querySelectorAll('#screen-pantry .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activePantryCat = el.dataset.cat;
  renderPantry();
}

function renderAllRecipes() {
  document.getElementById('all-recipe-list').innerHTML = recipes.map(recipeCardHTML).join('');
}

function renderShoppingList() {
  const remaining = shoppingList.filter(s => !s.done).length;
  document.getElementById('shopping-count').textContent = `${remaining} item${remaining === 1 ? '' : 's'} left to buy`;
  document.getElementById('shopping-list').innerHTML = shoppingList.map(s => `
    <div class="shop-item" onclick="toggleShoppingItem('${s.id}')">
      <div class="shop-check ${s.done ? 'done' : ''}">${s.done ? '✓' : ''}</div>
      <div class="shop-name ${s.done ? 'done' : ''}">${s.name}</div>
      <div class="shop-qty">${s.qty}</div>
    </div>`).join('') || `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:0 20px;">Your shopping list is empty.</div>`;
}
function toggleShoppingItem(id) {
  const s = shoppingList.find(x => x.id === id);
  if (!s) return;
  s.done = !s.done;
  renderShoppingList();
}

function showItemDetail(id) {
  const item = pantry.find(p => p.id === id);
  if (!item) return;
  currentItemId = id;
  document.getElementById('detail-title').textContent = item.category;
  document.getElementById('detail-emoji').textContent = item.emoji;
  document.getElementById('detail-name').textContent = item.name;
  document.getElementById('detail-sub').textContent = `${item.category} · ${item.qty}`;
  const badge = document.getElementById('detail-badge');
  badge.textContent = item.daysLeft <= 0 ? 'Use today' : `Expires in ${daysLabel(item.daysLeft)}`;
  badge.className = 'detail-days-inner ' + daysBadgeClass(item.daysLeft);
  const related = recipesFor(id);
  document.getElementById('item-recipe-list').innerHTML = related.length
    ? related.map(recipeCardHTML).join('')
    : `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:0 20px 6px;">No matching recipes yet.</div>`;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-detail').classList.add('active');
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
  renderDashboard();
  renderPantry();
});

// ===== PWA: Service worker registration =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// Runs once on page load -- shows a confirmation if returning from a real
// Stripe Checkout redirect (the webhook is what actually grants Premium
// server-side; this is just a friendly confirmation for the customer).
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  if (!checkoutStatus) return;
  window.history.replaceState({}, '', window.location.pathname);
  if (checkoutStatus === 'success') {
    showToast('Payment successful \u2014 welcome to Leftovers Premium!');
  } else if (checkoutStatus === 'cancelled') {
    showToast('Checkout cancelled \u2014 no charge was made');
  }
});
