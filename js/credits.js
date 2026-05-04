// ── Credit system ──────────────────────────────────────────

let _credits = null;

async function loadUserCredits() {
  if (!_supabase) return;
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) { _credits = null; _updateCreditDisplay(); return; }

  const { data, error } = await _supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[Credits] load error (table may not exist yet):', error.message);
    _credits = 50;
  } else {
    _credits = data !== null ? data.credits : 50;
  }
  _updateCreditDisplay();
}

async function spendCredit() {
  if (!_supabase) { _credits = Math.max(0, (_credits ?? 50) - 1); _updateCreditDisplay(); return _credits; }
  const { data, error } = await _supabase.rpc('spend_credit');
  if (error) { console.error('[Credits] spend error:', error.message); return _credits ?? 0; }
  _credits = data;
  _updateCreditDisplay();
  return data;
}

function getUserCredits() { return _credits; }

function _updateCreditDisplay() {
  const badge = document.getElementById('credits-badge');
  const count = document.getElementById('credits-count');
  if (!badge || !count) return;

  if (_credits === null) { badge.style.display = 'none'; return; }

  badge.style.display = 'flex';
  count.textContent   = _credits;
  badge.className = _credits === 0 ? 'credits-badge credits-empty'
                  : _credits <= 5  ? 'credits-badge credits-low'
                  : 'credits-badge';

  // Gray out all scene generate buttons when depleted
  document.querySelectorAll('.scene-gen-img-btn').forEach(btn => {
    btn.classList.toggle('credits-depleted', _credits <= 0);
  });

  // Show/hide the persistent refill prompt
  if (_credits === 0) {
    _showRefillPrompt();
  } else {
    const prompt = document.getElementById('credit-refill-prompt');
    if (prompt) prompt.style.display = 'none';
  }
}

function _showRefillPrompt() {
  const el = document.getElementById('credit-refill-prompt');
  if (!el) return;
  el.style.display = 'flex';
}

let _creditMsgTimer = null;
function _showCreditMsg(text) {
  const el = document.getElementById('credit-msg');
  if (!el) return;
  el.textContent = text;
  el.className   = 'credit-msg' + (_credits === 0 ? ' empty' : _credits <= 5 ? ' low' : '');
  el.style.display = 'block';
  clearTimeout(_creditMsgTimer);
  if (_credits > 0) _creditMsgTimer = setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ── Credits refill modal ───────────────────────────────

function openCreditsModal() {
  _injectCreditsStripe();
  document.getElementById('credits-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeCreditsModal() {
  document.getElementById('credits-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function handleCreditsOverlayClick(e) {
  if (e.target === document.getElementById('credits-modal')) closeCreditsModal();
}

function _injectCreditsStripe() {
  const container = document.getElementById('credits-stripe-container');
  if (!container) return;
  const isConfigured = typeof STRIPE_CREDITS_BUY_BUTTON_ID !== 'undefined'
    && !STRIPE_CREDITS_BUY_BUTTON_ID.includes('XXX');
  if (isConfigured) {
    if (!document.querySelector('script[src*="buy-button.js"]')) {
      const s = document.createElement('script');
      s.src   = 'https://js.stripe.com/v3/buy-button.js';
      s.async = true;
      document.head.appendChild(s);
    }
    container.innerHTML = `
      <stripe-buy-button
        buy-button-id="${STRIPE_CREDITS_BUY_BUTTON_ID}"
        publishable-key="${STRIPE_PUBLISHABLE_KEY}"
      ></stripe-buy-button>`;
  } else {
    container.innerHTML = `<p class="credits-modal-soon">Credit refill coming soon — contact support to top up.</p>`;
  }
}
