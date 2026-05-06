// ── DOMContentLoaded init + keydown Escape listener ──────

// Stash pending payment flags early, before auth resolves.
// Stripe always appends ?session_id=... to the return URL, so we accept either
// the explicit ?payment=success flag OR the presence of a Stripe session_id.
const _params = new URLSearchParams(window.location.search);
if (_params.get('payment') === 'success' || _params.get('session_id')) {
  history.replaceState(null, '', window.location.pathname);
  window._pendingPaymentStoryId = localStorage.getItem('_pendingPurchaseStoryId') || null;
  if (window._pendingPaymentStoryId) localStorage.removeItem('_pendingPurchaseStoryId');
}
if (_params.get('credits_payment') === 'success' || localStorage.getItem('_pendingCreditsRefill')) {
  history.replaceState(null, '', window.location.pathname);
  localStorage.removeItem('_pendingCreditsRefill');
  window._pendingCreditsRefill = true;
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
