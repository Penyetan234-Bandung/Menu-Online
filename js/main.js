import { WHATSAPP_NUMBER } from './config.js';
import { menuData } from './data.js';
import { $, formatRupiah, calculateTotals } from './utils.js';
import {
  renderAllMenus,
  updateCartUI,
  renderCategoryFilters,
  openModal,
  closeModal,
  showInfoModal,
  showConfirmModal,
  handleModalConfirm
} from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // STATE & SELECTORS
  let shoppingCart = JSON.parse(localStorage.getItem('cart_v2') || '[]');
  let activeCategory = 'All';
  
  const elements = {
    menuContainer: $('menu-container'),
    categoryFiltersContainer: $('category-filters'),
    searchInput: $('search-input'),
    cartItemsContainer: $('cart-items'),
    subtotalDisplay: $('subtotal-display'),
    totalPriceDisplay: $('total-price-display'),
    sendOrderBtn: $('send-order-btn'),
    customerNameInput: $('customer-name'),
    customerAddressInput: $('customer-address'),
    customerPhoneInput: $('customer-phone'),
    deliveryDateInput: $('delivery-date'),
    deliveryTimeInput: $('delivery-time'),
    clearSearchBtn: $('clear-search'),
    modalRoot: $('modal-root'),
    modalInner: $('modal-inner'),
    mobileCheckoutBtn: $('mobile-checkout-btn'),
    mobileCheckoutContainer: document.querySelector('.mobile-checkout'),
    mobileTotal: $('mobile-total'),
    notes: $('notes'),
    cartItemCount: $('cart-item-count'),
  };
  
  // EVENT HANDLERS
function handleSendOrder() {
  // Validasi input
  [elements.customerNameInput, elements.customerAddressInput, elements.customerPhoneInput].forEach(i => i.classList.remove('border-red-400'));
  if (!elements.customerNameInput.value.trim() || !elements.customerAddressInput.value.trim() || !elements.customerPhoneInput.value.trim()) {
    showInfoModal(elements, 'Data Kurang Lengkap', 'Mohon isi Nama, No. Telepon, dan Alamat Anda terlebih dahulu.');
    if (!elements.customerNameInput.value.trim()) elements.customerNameInput.classList.add('border-red-400');
    if (!elements.customerAddressInput.value.trim()) elements.customerAddressInput.classList.add('border-red-400');
    if (!elements.customerPhoneInput.value.trim()) elements.customerPhoneInput.classList.add('border-red-400');
    elements.customerNameInput.focus();
    return;
  }
  
  const deliveryDate = elements.deliveryDateInput.value;
  const deliveryTime = elements.deliveryTimeInput.value;
  const customerPhone = elements.customerPhoneInput.value.trim(); // Ambil data telepon
  
  const totals = calculateTotals(shoppingCart);
  let message = `Halo, saya mau pesan atas nama:%0A%0A`;
  message += `*Nama:* ${encodeURIComponent(elements.customerNameInput.value.trim())}%0A`;
  message += `*No. Telepon:* ${encodeURIComponent(customerPhone)}%0A`; // ✅ Sertakan No. Telepon di pesan
  message += `*Alamat:* ${encodeURIComponent(elements.customerAddressInput.value.trim())}%0A`;
  
  if (deliveryDate && deliveryTime) {
    const [year, month, day] = deliveryDate.split('-');
    const formattedDate = `${day}-${month}-${year}`;
    message += `*Waktu Pengiriman:* ${encodeURIComponent(formattedDate)} jam ${encodeURIComponent(deliveryTime)}%0A`;
  }
  
  message += `%0A*Pesanan:*%0A`;
  shoppingCart.forEach(it => {
    message += `• ${encodeURIComponent(it.name)} (x${it.quantity}) - ${encodeURIComponent(formatRupiah(it.price * it.quantity))}%0A`;
  });
  if (elements.notes.value.trim()) message += `%0A*Catatan:* ${encodeURIComponent(elements.notes.value.trim())}%0A`;
  
  message += `%0A*TOTAL BAYAR:* ${encodeURIComponent(formatRupiah(totals.total))}%0A%0AMohon konfirmasi. Terima kasih.`;
  
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}
  
  function addToCart(id, fromModal = false) {
    let cartItemData = null;
    
    // Cari data item dari menuData
    for (const item of menuData) {
      // Cek apakah item ini adalah item tunggal (punya 'id' di level atas)
      if (item.id === id) {
        cartItemData = {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
        };
        break;
      }
      // Jika bukan, cek di dalam 'variants'
      if (item.variants) {
        const variant = item.variants.find(v => v.id === id);
        if (variant) {
          cartItemData = {
            id: variant.id,
            // Gabungkan nama item utama dengan nama varian
            name: `${item.name} (${variant.name})`,
            price: variant.price,
            image: item.image, // Ambil gambar dari item utama
          };
          break;
        }
      }
    }
    
    if (!cartItemData) return; // Jika data tidak ditemukan, hentikan
    
    const existing = shoppingCart.find(it => it.id === id);
    if (existing) {
      existing.quantity++;
    } else {
      shoppingCart.push({ ...cartItemData, quantity: 1 });
    }
    
    updateCartUI(elements, shoppingCart);
    if (fromModal) closeModal(elements);
  }
  const infoTabsContainer = document.querySelector('.cart-card'); // Ambil container kartu
infoTabsContainer.addEventListener('click', (e) => {
  const clickedTab = e.target.closest('.tab-btn');
  if (!clickedTab) return; // Jika yang diklik bukan tombol tab, abaikan
  
  // Nonaktifkan semua tab
  infoTabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  infoTabsContainer.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
  
  // Aktifkan tab yang diklik
  clickedTab.classList.add('active');
  const tabId = clickedTab.dataset.tab;
  document.getElementById(`${tabId}-panel`).classList.remove('hidden');
});
  
  // Main event delegation
  document.body.addEventListener('click', (e) => {
    const target = e.target;
    const addToCartBtn = target.closest('.add-to-cart-btn');
    if (addToCartBtn) {
      const id = addToCartBtn.dataset.id;
      const fromModal = !!target.closest('#modal-inner');
      
      // --- MULAI LOGIKA ANIMASI ---
      if (!fromModal && addToCartBtn.closest('.menu-card')) {
        const menuCard = addToCartBtn.closest('.menu-card');
        const sourceImg = menuCard.querySelector('img');
        const sourceRect = sourceImg.getBoundingClientRect();
        
        const cartEl = $('cart-section');
        const cartRect = cartEl.getBoundingClientRect();
        
        // 1. duplikat gambar
        const clone = sourceImg.cloneNode(true);
        clone.classList.add('fly-to-cart-clone');
        document.body.appendChild(clone);
        
        // 2. posisi awal duplikat (persis di atas gambar asli)
        clone.style.left = `${sourceRect.left}px`;
        clone.style.top = `${sourceRect.top}px`;
        clone.style.width = `60px`; // Ukuran awal yang lebih kecil dan konsisten
        clone.style.height = `60px`;
        
        // 3. animasi dengan memindahkan duplikat ke posisi keranjang
        requestAnimationFrame(() => {
          clone.style.left = `${cartRect.right - 30}px`; // Target X
          clone.style.top = `${cartRect.top}px`; // Target Y
          clone.style.transform = 'scale(0.1)';
          clone.style.opacity = '0';
        });
        
        // 4. Bersihkan elemen duplikat setelah animasi selesai
        clone.addEventListener('transitionend', () => {
          clone.remove();
        }, { once: true });
        
        // 5. Buat keranjang bergetar
        cartEl.classList.add('shake');
        setTimeout(() => {
          cartEl.classList.remove('shake');
        }, 400);
      }
      // --- AKHIR LOGIKA ANIMASI ---
      
      addToCart(id, fromModal); // Fungsi utama untuk menambah ke keranjang tetap dipanggil
      
      if (!fromModal) {
        addToCartBtn.classList.add('bg-emerald-600');
        addToCartBtn.textContent = 'Ditambahkan!';
        setTimeout(() => {
          addToCartBtn.classList.remove('bg-red-600');
          addToCartBtn.textContent = 'Tambah';
        }, 1000);
      }
    }
        // ✅ --- TAMBAHKAN BLOK IF BARU UNTUK MEMBUKA MODAL RESERVASI ---
    const reservationBtn = target.closest('#open-reservation-modal-btn');
    if (reservationBtn) {
      const reservationFormHTML = `
        <div class="space-y-4">
          <h3 class="text-xl font-bold">Formulir Reservasi Tempat</h3>
          <div>
            <label for="reservation-name" class="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label>
            <input type="text" id="reservation-name" placeholder="Nama Anda" class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-300">
          </div>
          <div>
            <label for="reservation-phone" class="block text-sm font-medium text-gray-600 mb-1">No. WhatsApp</label>
            <input type="tel" id="reservation-phone" placeholder="08123456789" class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-300">
          </div>
          <div>
            <label for="reservation-pax" class="block text-sm font-medium text-gray-600 mb-1">Jumlah Orang</label>
            <input type="number" id="reservation-pax" placeholder="Contoh: 4" class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-300">
          </div>
          <div>
            <label for="reservation-date" class="block text-sm font-medium text-gray-600 mb-1">Tanggal Reservasi</label>
            <input type="date" id="reservation-date" class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-300">
          </div>
          <div>
            <label for="reservation-time" class="block text-sm font-medium text-gray-600 mb-1">Jam</label>
            <input type="time" id="reservation-time" class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-300">
          </div>
          <div class="flex justify-end gap-3 mt-4"> 
            <button class="px-4 py-2 rounded-lg border modal-close-btn">Batal</button>
            <button id="submit-reservation-btn" class="px-4 py-2 rounded-lg text-white font-semibold bg-red-600 hover:bg-red-700">Kirim Reservasi</button>
          </div>
        </div>
      `;
      openModal(elements, reservationFormHTML);
    }
    
    // ✅ --- TAMBAHKAN BLOK IF BARU UNTUK MENGIRIM RESERVASI ---
    const submitReservationBtn = target.closest('#submit-reservation-btn');
    if (submitReservationBtn) {
      const name = $('reservation-name').value.trim();
      const phone = $('reservation-phone').value.trim();
      const pax = $('reservation-pax').value.trim();
      const date = $('reservation-date').value;
      const time = $('reservation-time').value;
      
      if (!name || !phone || !pax || !date || !time) {
        alert('Mohon lengkapi semua kolom reservasi.');
        return;
      }
      
      let message = `Halo, saya mau reservasi tempat atas nama:%0A%0A`;
      message += `*Nama:* ${encodeURIComponent(name)}%0A`;
      message += `*No. WhatsApp:* ${encodeURIComponent(phone)}%0A`;
      message += `*Jumlah Orang:* ${encodeURIComponent(pax)} orang%0A`;
      message += `*Tanggal:* ${encodeURIComponent(date)}%0A`;
      message += `*Jam:* ${encodeURIComponent(time)}%0A%0A`;
      message += `Mohon konfirmasi ketersediaan tempat. Terima kasih.`;
      
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
      closeModal(elements);
    }
    const viewDetailBtn = target.closest('.view-detail-btn');
    if (viewDetailBtn) {
      const id = viewDetailBtn.dataset.id;
      let it = menuData.find(m => m.id === id);
      if (!it) {
        it = menuData.find(m => m.variants && m.variants.find(v => v.id === id));
      }
      
      if (!it) return;
      
      openModal(elements, `
        <div class="flex flex-col gap-4"> 
          <img src="${it.image}" onerror="this.src='https://placehold.co/800x600/eeeeee/000000?text=Gambar+Rusak'" class="w-full rounded-lg h-64 object-cover" />
          <h4 class="text-xl font-bold">${it.name}</h4>
          <p class="muted">${it.description || ''}</p>
          <div class="flex items-center justify-end gap-3 mt-4"> 
            <button class="px-4 py-2 rounded-lg border modal-close-btn">Tutup</button>
            <button class="px-4 py-2 rounded-lg text-white font-semibold bg-red-500 add-to-cart-btn" data-id="${id}">Tambah ke Keranjang</button>
          </div>
        </div>
      `);
    }
    
    if (target.closest('.increase-qty')) {
      const id = target.closest('.increase-qty').dataset.id;
      const it = shoppingCart.find(i => i.id === id);
      if (it) { it.quantity++;
        updateCartUI(elements, shoppingCart); }
    }
    if (target.closest('.decrease-qty')) {
      const id = target.closest('.decrease-qty').dataset.id;
      const it = shoppingCart.find(i => i.id === id);
      if (it) { it.quantity--; if (it.quantity <= 0) shoppingCart = shoppingCart.filter(i => i.id !== id);
        updateCartUI(elements, shoppingCart); }
    }
    if (target.closest('.remove-item')) {
      const btn = target.closest('.remove-item');
      const id = btn.dataset.id;
      if (id) {
        shoppingCart = shoppingCart.filter(i => i.id !== id);
        updateCartUI(elements, shoppingCart);
      }
    }
    
    if (target.closest('#clear-cart-btn')) {
      if (shoppingCart.length === 0) return;
      showConfirmModal(elements, 'Konfirmasi', 'Anda yakin ingin mengosongkan seluruh isi keranjang?', () => {
        shoppingCart = [];
        updateCartUI(elements, shoppingCart);
        closeModal(elements);
      });
    }
    
    const categoryBtn = target.closest('.category-btn');
    if (categoryBtn) {
      activeCategory = categoryBtn.dataset.category;
      renderCategoryFilters(elements, activeCategory);
      renderAllMenus(elements, activeCategory);
      const sectionId = `category-${activeCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const sectionToScroll = $(sectionId);
      if (sectionToScroll) {
        setTimeout(() => sectionToScroll.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      } else {
        elements.menuContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    
    if (target.id === 'modal-root' || target.closest('.modal-close-btn')) closeModal(elements);
    if (target.closest('.modal-confirm-btn')) {
      handleModalConfirm();
      closeModal(elements);
    }
    
    if (target.closest('#send-order-btn')) handleSendOrder();
    if (target.closest('#quick-contact')) window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
    if (target.closest('#mobile-checkout-btn')) $('cart-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  
  // Search functionality
  elements.searchInput.addEventListener('input', () => {
    renderAllMenus(elements, activeCategory);
    elements.clearSearchBtn.classList.toggle('hidden', !elements.searchInput.value);
  });
  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    renderAllMenus(elements, activeCategory);
    elements.clearSearchBtn.classList.add('hidden');
  });
  
  // INITIALIZATION
  function initialize() {
    const savedName = localStorage.getItem('customer_name_v1');
    const savedAddr = localStorage.getItem('customer_addr_v1');
    const savedPhone = localStorage.getItem('customer_phone_v1');
    
    if (savedName) elements.customerNameInput.value = savedName;
    if (savedAddr) elements.customerAddressInput.value = savedAddr;
    if (savedPhone) elements.customerPhoneInput.value = savedPhone;
    const savedDate = localStorage.getItem('delivery_date_v1');
    const savedTime = localStorage.getItem('delivery_time_v1');
    if (savedDate) elements.deliveryDateInput.value = savedDate;
    if (savedTime) elements.deliveryTimeInput.value = savedTime;
    
    [elements.customerNameInput, elements.customerAddressInput].forEach(inp => inp.addEventListener('blur', () => {
      localStorage.setItem(inp.id === 'customer-name' ? 'customer_name_v1' : 'customer_addr_v1', inp.value);
    }));
    [elements.deliveryDateInput, elements.deliveryTimeInput].forEach(inp => inp.addEventListener('change', () => {
      localStorage.setItem('delivery_date_v1', elements.deliveryDateInput.value);
      localStorage.setItem('delivery_time_v1', elements.deliveryTimeInput.value);
    }));
    
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(elements); });
    
    renderCategoryFilters(elements, activeCategory);
    renderAllMenus(elements, activeCategory);
    updateCartUI(elements, shoppingCart);
  }
  
  initialize();
});