// UTILITY & HELPER FUNCTIONS
export const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
export const saveCart = (cart) => localStorage.setItem('cart_v2', JSON.stringify(cart));
export const calculateTotals = (cart) => {
  const subtotal = cart.reduce((s, it) => s + (it.price * it.quantity), 0);
  const total = subtotal;
  return { subtotal, total };
};
export const $ = id => document.getElementById(id);