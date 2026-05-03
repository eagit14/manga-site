// ── Stripe payment modal ──────────────────────────────────

function openPayment(title, grad) {
  // Update modal content
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-product-name').textContent = `${title} — Volume 1`;
  document.getElementById('modal-cover').style.background = grad;

  // Inject Stripe widget or setup guide
  const container = document.getElementById('stripe-container');
  const isConfigured = !STRIPE_BUY_BUTTON_ID.includes('XXX') && !STRIPE_PUBLISHABLE_KEY.includes('XXX');

  if (isConfigured) {
    // Load Stripe Buy Button script once
    if (!document.querySelector('script[src*="buy-button.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/buy-button.js';
      s.async = true;
      document.head.appendChild(s);
    }
    container.innerHTML = `
      <stripe-buy-button
        buy-button-id="${STRIPE_BUY_BUTTON_ID}"
        publishable-key="${STRIPE_PUBLISHABLE_KEY}"
      ></stripe-buy-button>`;
  } else {
    // Show configuration guide
    container.innerHTML = `
      <div class="stripe-setup-msg">
        <div class="stripe-logo">stripe</div>
        <p>Pour activer le paiement, remplacez ces 2 variables dans le code&nbsp;:</p>
        <code>STRIPE_BUY_BUTTON_ID = 'buy_btn_...'</code>
        <code>STRIPE_PUBLISHABLE_KEY = 'pk_live_...'</code>
        <p style="margin-top:.5rem">Créez votre bouton sur le Dashboard Stripe en 2 minutes ✨</p>
        <a class="stripe-setup-link" href="https://dashboard.stripe.com/payment-links" target="_blank" rel="noopener">
          → Ouvrir le Dashboard Stripe
        </a>
      </div>`;
  }

  document.getElementById('payment-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closePayment() {
  document.getElementById('payment-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('payment-modal')) closePayment();
}
