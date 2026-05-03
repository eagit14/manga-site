// ── DOMContentLoaded init + keydown Escape listener ──────

// Stash the pending story ID early, before auth resolves
const _params = new URLSearchParams(window.location.search);
if (_params.get('payment') === 'success') {
  history.replaceState(null, '', window.location.pathname);
  window._pendingPaymentStoryId = localStorage.getItem('_pendingPurchaseStoryId') || null;
  if (window._pendingPaymentStoryId) localStorage.removeItem('_pendingPurchaseStoryId');
}

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  refreshDataSection();
  initAuth();
});

// Close payment modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePayment();
});
