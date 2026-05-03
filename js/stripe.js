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

  const labels = ['Pitch', 'Chapter 1', 'Ending'];
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
  if (storyId) localStorage.setItem('_pendingPurchaseStoryId', storyId);

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
  const exportBtn  = document.getElementById('modal-export-btn');
  const stripeWrap = document.getElementById('stripe-container');
  if (exportBtn)  exportBtn.style.display  = purchased ? 'flex' : 'none';
  if (stripeWrap) stripeWrap.style.display = purchased ? 'none' : '';
}

function openPayment(title, grad) {
  const imgs = [0, 1, 2].map(i => {
    const el = document.getElementById(`carousel-img-${i}`);
    return (el?.src && el.src !== window.location.href) ? el.src : null;
  });
  _openModal(title, grad, imgs, window._lastStoryId || null);
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
