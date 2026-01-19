import { menuData, CATEGORIES } from './data.js';
import { formatRupiah, calculateTotals, $, saveCart } from './utils.js';
const createMenuCard = (item) => {
  const wrapper = document.createElement('div');
  
  if (item.variants && item.variants.length > 0) {
    wrapper.className = 'menu-card p-4 space-y-3';
    
    let variantsHTML = '';
    item.variants.forEach(variant => {
      variantsHTML += `
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="font-medium">(${variant.name})</div>
            <div class="text-emerald-600 font-bold text-sm">${formatRupiah(variant.price)}</div>
          </div>
          <button class="px-5 py-2 rounded-lg text-white font-semibold bg-red-600 hover:bg-red-700 transition-colors add-to-cart-btn flex-shrink-0" data-id="${variant.id}">Tambah</button>
        </div>`;
    });
    
    wrapper.innerHTML = `
      <div class="media-wrap rounded-lg overflow-hidden">
        <img loading="lazy" alt="${item.name}" src="${item.image}" onerror="this.src='https.placehold.co/500x400/eeeeee/000000?text=Gambar+Rusak'">
      </div>
      <div>
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-lg font-semibold">${item.name}</h4>
          <button class="view-detail-btn px-3 py-2 text-sm rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100" data-id="${item.variants[0].id}">
            <i class="fa-solid fa-eye mr-2"></i>Lihat
          </button>
        </div>
      </div>
      <div class="space-y-3 mt-3">${variantsHTML}</div>
    `;
    
  } else {
    // --- TAMPILAN UNTUK ITEM BIASA (TANPA VARIAN) ---
    wrapper.className = 'menu-card grid grid-cols-1 md:grid-cols-3 gap-4 p-4';
    wrapper.innerHTML = `
      <div class="media-wrap rounded-lg overflow-hidden md:col-span-1">
        <img loading="lazy" alt="${item.name}" src="${item.image}" onerror="this.src='https.placehold.co/500x400/eeeeee/000000?text=Gambar+Rusak'">
      </div>
      <div class="md:col-span-2 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2">
            <h4 class="text-lg font-semibold">${item.name}</h4>
            <div class="text-amber-600 font-bold text-right flex-shrink-0">${formatRupiah(item.price)}</div>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-4">
          <button class="px-4 py-2 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600 transition-colors add-to-cart-btn" data-id="${item.id}">Tambah</button>
          <button class="view-detail-btn px-3 py-2 text-sm rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100" data-id="${item.id}"><i class="fa-solid fa-eye mr-2"></i>Lihat</button>
        </div>
      </div>
    `;
  }
  
  return wrapper;
};

export const renderAllMenus = (elements, activeCategory) => {
  const term = elements.searchInput.value.trim().toLowerCase();
  
  // Filter berdasarkan kategori aktif dan pencarian (logika ini tetap sama)
  const catFiltered = activeCategory === 'All' ? menuData : menuData.filter(m => m.category === activeCategory);
  const searchFiltered = catFiltered.filter(m => {
    // Pencarian sekarang juga bisa mencakup nama varian
    const mainInfo = (m.name + ' ' + (m.description || '')).toLowerCase();
    const variantInfo = (m.variants || []).map(v => v.name).join(' ').toLowerCase();
    return (mainInfo + ' ' + variantInfo).includes(term);
  });
  
  elements.menuContainer.innerHTML = '';
  $('no-results').classList.toggle('hidden', searchFiltered.length > 0);
  
  // --- KEMBALI KE LOGIKA SEMULA: GROUPING HANYA BERDASARKAN KATEGORI ---
  const grouped = searchFiltered.reduce((acc, it) => {
    (acc[it.category] = acc[it.category] || []).push(it);
    return acc;
  }, {});
  
  Object.entries(grouped).forEach(([category, items]) => {
    const section = document.createElement('div');
    const sectionId = `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    section.id = sectionId;
    // Tampilan judul kategori (<h3>)
    section.innerHTML = `<h3 class="text-xl font-bold mb-4">${category}</h3>`;
    
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-1 gap-4';
    // Memanggil createMenuCard yang sudah bisa handle varian
    items.forEach(item => grid.appendChild(createMenuCard(item)));
    
    section.appendChild(grid);
    elements.menuContainer.appendChild(section);
  });
};


export const updateCartUI = (elements, shoppingCart) => {
  const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);

  if (shoppingCart.length === 0) {
    elements.cartItemsContainer.innerHTML = '<p class="text-center muted py-8">Keranjang Anda kosong.</p>';
  } else {
    elements.cartItemsContainer.innerHTML = '';
    shoppingCart.forEach(it => {
      const el = document.createElement('div');
      el.className = 'flex items-center gap-3 justify-between p-2 rounded-lg border bg-white/50';
      el.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
          <img src="${it.image}" onerror="this.src='https://placehold.co/80x80/eeeeee/000000?text=NA'" class="w-14 h-14 rounded-md object-cover flex-shrink-0" />
          <div class="overflow-hidden">
            <div class="font-semibold truncate">${it.name}</div>
            <div class="text-xs muted">${formatRupiah(it.price)} x ${it.quantity}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="px-2 py-1 rounded-md border decrease-qty" data-id="${it.id}">-</button>
          <div class="font-bold w-5 text-center">${it.quantity}</div>
          <button class="px-2 py-1 rounded-md border increase-qty" data-id="${it.id}">+</button>
          <button class="ml-2 text-sm text-red-400 hover:text-red-600 remove-item" data-id="${it.id}" title="Hapus"><i class="fa-solid fa-xmark" data-id="${it.id}"></i></button>
        </div>
      `;
      elements.cartItemsContainer.appendChild(el);
    });
  }

  const totals = calculateTotals(shoppingCart);
  elements.subtotalDisplay.innerText = formatRupiah(totals.subtotal);
  elements.totalPriceDisplay.innerText = formatRupiah(totals.total);
  elements.mobileTotal.innerText = formatRupiah(totals.total);
  elements.sendOrderBtn.disabled = shoppingCart.length === 0;
  elements.mobileCheckoutContainer.classList.toggle('hidden', shoppingCart.length === 0);
  if (elements.cartItemCount) {
    elements.cartItemCount.textContent = totalItems > 0 ? `(${totalItems} item)` : '';
  }
  saveCart(shoppingCart);
  document.title = `${formatRupiah(totals.total)} - Penyetan 234`;

};

export const renderCategoryFilters = (elements, activeCategory) => {
  elements.categoryFiltersContainer.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `category-btn px-3 py-2 rounded-full border text-sm ${cat === activeCategory ? 'active' : ''}`;
    btn.textContent = cat;
    btn.dataset.category = cat;
    elements.categoryFiltersContainer.appendChild(btn);
  });
};

// --- MODAL SYSTEM ---
let onConfirmCallback = null;

export const openModal = (elements, html) => {
  elements.modalInner.innerHTML = html;
  elements.modalRoot.classList.remove('hidden');
  elements.modalRoot.classList.add('flex');
};

export const closeModal = (elements) => {
  elements.modalRoot.classList.add('hidden');
  elements.modalRoot.classList.remove('flex');
  onConfirmCallback = null;
};

export const showInfoModal = (elements, title, message) => {
  openModal(elements, `
    <h4 class="text-xl font-bold text-gray-800">${title}</h4>
    <p class="muted mt-2">${message}</p>
    <div class="flex justify-end gap-3 mt-6">
      <button class="modal-close-btn px-6 py-2 rounded-lg bg-red-600 text-white font-semibold">OK</button>
    </div>
  `);
};

export const showConfirmModal = (elements, title, message, onConfirm) => {
  onConfirmCallback = onConfirm;
  openModal(elements, `
    <h4 class="text-xl font-bold text-gray-800">${title}</h4>
    <p class="muted mt-2">${message}</p>
    <div class="flex justify-end gap-3 mt-6">
      <button class="modal-close-btn px-5 py-2 rounded-lg border">Batal</button>
      <button class="modal-confirm-btn px-5 py-2 rounded-lg bg-red-500 text-white font-semibold">Ya, Lanjutkan</button>
    </div>
  `);
};

export const handleModalConfirm = () => {
    if (onConfirmCallback) {
        onConfirmCallback();
    }
}