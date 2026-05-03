// ── DOMContentLoaded init + keydown Escape listener ──────

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  refreshDataSection();
  initAuth();
});

// Close payment modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePayment();
});
