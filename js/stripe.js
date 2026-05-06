// ── Stripe payment modal ──────────────────────────────────

let _modalCarouselIdx = 0;

function modalCarouselNav(dir) {
  const slides = document.querySelectorAll('.modal-carousel-slide');
  const dots   = document.querySelectorAll('.modal-dot');
  if (!slides.length) return;
  _modalCarouselIdx = ((_modalCarouselIdx + dir + slides.length) % slides.length);
  slides.forEach((s, i) => s.classList.toggle('active', i === _modalCarouselIdx));
  dots.forEach((d, i)   => d.classList.toggle('active', i === _modalCarouselIdx));
}

function _buildModalCarousel(images, grad, title, purchased) {
  const track = document.getElementById('modal-carousel-track');
  const dotsEl = document.getElementById('modal-carousel-dots');
  if (!track || !dotsEl) return;

  _modalCarouselIdx = 0;

  const labels = images.map((_, i) => `Scene ${i + 1}`);
  const draft  = purchased ? '' : '<div class="draft-watermark">DRAFT</div>';

  track.innerHTML = images.map((src, i) => {
    const active = i === 0 ? 'active' : '';
    if (src) {
      return `
        <div class="modal-carousel-slide ${active}">
          <img src="${src}" alt="${labels[i]}" />
          ${draft}
        </div>`;
    } else {
      return `
        <div class="modal-carousel-slide ${active}">
          <div class="modal-slide-placeholder" style="background:${grad}">${title}</div>
          ${draft}
        </div>`;
    }
  }).join('');

  dotsEl.innerHTML = images.map((_, i) =>
    `<button class="modal-dot${i === 0 ? ' active' : ''}" onclick="modalCarouselNav(${i} - _modalCarouselIdx)"></button>`
  ).join('');
}

async function _openModal(title, grad, imgs, storyId) {
  document.getElementById('modal-title').textContent = title;

  window._currentStoryId = storyId || null;
  if (storyId) {
    localStorage.setItem('_pendingPurchaseStoryId', storyId);
    localStorage.setItem('_pendingOrderType', 'digital');
  }

  // Check if already purchased
  let purchased = false;
  if (storyId && _supabase) {
    const { data } = await _supabase
      .from('manga_stories')
      .select('purchased_at')
      .eq('id', storyId)
      .single();
    purchased = !!data?.purchased_at;
  }

  _buildModalCarousel(imgs, grad, title, purchased);
  _updateModalPurchaseState(purchased);
  _injectStripe();

  document.getElementById('payment-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function _updateModalPurchaseState(purchased) {
  const exportBtn   = document.getElementById('modal-export-btn');
  const stripeWrap  = document.getElementById('stripe-container');
  const promoSec    = document.getElementById('promo-section');
  const stripeLabel = document.querySelector('.payment-header-label');
  const stripeBadge = document.querySelector('.payment-security-badges');
  const stripeFooter= document.querySelector('.payment-stripe-footer');
  if (exportBtn)    exportBtn.style.display    = purchased ? 'flex' : 'none';
  if (stripeWrap)   stripeWrap.style.display   = purchased ? 'none' : '';
  if (promoSec)     promoSec.style.display     = purchased ? 'none' : '';
  if (stripeLabel)  stripeLabel.style.display  = purchased ? 'none' : '';
  if (stripeBadge)  stripeBadge.style.display  = purchased ? 'none' : '';
  if (stripeFooter) stripeFooter.style.display = purchased ? 'none' : '';
}

function togglePromoInput() {
  const area   = document.getElementById('promo-input-area');
  const toggle = document.getElementById('promo-toggle');
  if (!area) return;
  const open = area.classList.toggle('open');
  if (toggle) toggle.classList.toggle('active', open);
  if (open) document.getElementById('promo-code-input')?.focus();
}

async function applyPromoCode() {
  const input   = document.getElementById('promo-code-input');
  const msg     = document.getElementById('promo-message');
  const applyBtn= document.getElementById('promo-apply-btn');
  if (!input || !msg) return;

  const code    = input.value.trim().toUpperCase();
  const storyId = window._currentStoryId;

  if (!code)    { _promoMsg(msg, 'Please enter a code.', 'error'); return; }
  if (!storyId) { _promoMsg(msg, 'No manga selected.',   'error'); return; }

  applyBtn.disabled = true;
  applyBtn.textContent = '…';
  msg.textContent = '';
  msg.className = 'promo-message';

  try {
    const { data, error } = await _supabase.rpc('redeem_promo_code', {
      code_input:     code,
      story_id_input: storyId,
    });
    if (error) throw error;

    if (data?.success) {
      _promoMsg(msg, '🎉 Code applied! Your manga is unlocked.', 'success');
      saveOrder({
        orderType:       'promo',
        storyId,
        amountUsd:       0,
        paymentProvider: 'promo',
        promoCode:       code,
      });
      setTimeout(() => {
        _updateModalPurchaseState(true);
        loadMyMangas();
      }, 900);
    } else {
      _promoMsg(msg, data?.error || 'Invalid code.', 'error');
    }
  } catch (err) {
    console.error('[Promo] error:', err);
    _promoMsg(msg, 'Error checking code — please try again.', 'error');
  } finally {
    applyBtn.disabled = false;
    applyBtn.textContent = 'Apply';
  }
}

function _promoMsg(el, text, type) {
  el.textContent = text;
  el.className = `promo-message ${type}`;
}

function openPaymentFromTile(title, grad, imgUrls, storyId) {
  const imgs = imgUrls
    ? imgUrls.split('|').map(u => u.trim() || null)
    : [null];
  _openModal(title, grad, imgs, storyId || null);
}

function _injectStripe() {
  const container = document.getElementById('stripe-container');
  const isConfigured = !STRIPE_BUY_BUTTON_ID.includes('XXX') && !STRIPE_PUBLISHABLE_KEY.includes('XXX');
  if (isConfigured) {
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
  }
}

function closePayment() {
  document.getElementById('payment-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('payment-modal')) closePayment();
}
