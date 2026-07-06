// ---------- Utilitaires ----------
function fmt(n){ return Number(n).toLocaleString('fr-FR') + ' DA'; }

// Retourne l'URL d'affichage d'une image produit :
// - si c'est une vraie image uploadée (/uploads/...) ou un lien http, on l'utilise telle quelle
// - sinon on considère que c'est un "seed" de démo et on génère une photo via picsum.photos
function imageUrl(value, w = 500, h = 620){
  if(!value) return `https://picsum.photos/seed/souqdz-default/${w}/${h}`;
  if(value.startsWith('http') || value.startsWith('/')) return value;
  return `https://picsum.photos/seed/${value}/${w}/${h}`;
}

async function api(path, opts = {}){
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(data.error || 'Une erreur est survenue.');
  return data;
}

// ---------- Toast ----------
let toastTimer;
function showToast(msg){
  let t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2400);
}

// ---------- Panier (stocké côté client jusqu'au passage de commande) ----------
const Cart = {
  key: 'souqdz_cart',
  get(){
    try{ return JSON.parse(localStorage.getItem(this.key)) || []; }catch(e){ return []; }
  },
  save(items){ localStorage.setItem(this.key, JSON.stringify(items)); this.updateBadge(); },
  add(product, qty = 1){
    const items = this.get();
    const existing = items.find(i => i.id === product.id);
    if(existing){ existing.qty += qty; }
    else{ items.push({ id: product.id, title: product.title, price: product.price, image_seed: product.image_seed, qty }); }
    this.save(items);
  },
  setQty(id, qty){
    let items = this.get();
    if(qty <= 0){ items = items.filter(i => i.id !== id); }
    else{ const it = items.find(i => i.id === id); if(it) it.qty = qty; }
    this.save(items);
    renderDrawer();
  },
  remove(id){
    const items = this.get().filter(i => i.id !== id);
    this.save(items);
    renderDrawer();
  },
  clear(){ this.save([]); },
  total(){ return this.get().reduce((s,i)=> s + i.price * i.qty, 0); },
  count(){ return this.get().reduce((s,i)=> s + i.qty, 0); },
  updateBadge(){
    const el = document.getElementById('cartCount');
    if(el) el.textContent = this.count();
  }
};

function renderDrawer(){
  const body = document.getElementById('drawerBody');
  if(!body) return;
  const items = Cart.get();
  if(items.length === 0){
    body.innerHTML = '<p class="drawer-empty">Votre panier est vide pour l\'instant.<br>Ajoutez un article pour commencer.</p>';
  } else {
    body.innerHTML = items.map(i => `
      <div class="cart-line">
        <img src="${imageUrl(i.image_seed, 120, 120)}" alt="${i.title}">
        <div class="info">
          <div class="t">${i.title}</div>
          <div class="p">${fmt(i.price)}</div>
          <div class="qty-ctrl">
            <button onclick="Cart.setQty(${i.id}, ${i.qty - 1})" aria-label="Diminuer">−</button>
            <span>${i.qty}</span>
            <button onclick="Cart.setQty(${i.id}, ${i.qty + 1})" aria-label="Augmenter">+</button>
          </div>
          <button class="remove" onclick="Cart.remove(${i.id})">Retirer</button>
        </div>
      </div>`).join('');
  }
  const totalEl = document.getElementById('cartTotal');
  if(totalEl) totalEl.textContent = fmt(Cart.total());
  Cart.updateBadge();
}

function toggleCart(open){
  document.getElementById('drawer').classList.toggle('open', open);
  document.getElementById('overlay').classList.toggle('open', open);
  if(open) renderDrawer();
}

// ---------- Auth / header state ----------
async function refreshAuthUI(){
  try{
    const { user } = await api('/auth/me');
    const accountLink = document.getElementById('accountLink');
    if(!accountLink) return;
    if(user){
      accountLink.href = '/account.html';
      accountLink.querySelector('.action-label').textContent = user.name.split(' ')[0];
    } else {
      accountLink.href = '/login.html';
      accountLink.querySelector('.action-label').textContent = 'Compte';
    }
  }catch(e){ /* silencieux */ }
}

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  refreshAuthUI();
  const overlay = document.getElementById('overlay');
  if(overlay) overlay.addEventListener('click', () => toggleCart(false));
});
