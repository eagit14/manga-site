// ── Lulu Direct API Client ────────────────────────────
// Docs: https://developers.lulu.com/print-api/docs/getting-started
//
// ⚠  Lulu's token endpoint may block cross-origin browser requests.
//    If it does, cost is estimated using Lulu's published pricing formula.
//    For production order creation, route calls through a server proxy.

const LULU_API = 'https://api.lulu.com';

// 6"×9" full-color standard perfect-bound matte cover
const LULU_POD_PACKAGE = '0600X0900FCSTDPBK060UW444MXX';

// Lulu published wholesale pricing for 6"×9" full color (as of 2024)
const LULU_BASE_COST    = 3.47;   // USD, binding + setup
const LULU_PER_PAGE     = 0.15;   // USD per interior page, full color
const LULU_MIN_PAGES    = 24;     // minimum for perfect bound

let _luluToken       = null;
let _luluTokenExpiry = 0;

async function luluGetToken() {
  if (_luluToken && Date.now() < _luluTokenExpiry) return _luluToken;

  if (typeof LULU_CLIENT_ID === 'undefined' || LULU_CLIENT_ID.includes('XXX')) {
    throw new Error('Lulu credentials not configured — set LULU_CLIENT_ID and LULU_CLIENT_SECRET in js/config.js');
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     LULU_CLIENT_ID,
    client_secret: LULU_CLIENT_SECRET,
  });

  const res = await fetch(
    `${LULU_API}/auth/realms/glasstree/protocol/openid-connect/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
  );

  if (!res.ok) throw new Error(`Lulu auth failed (${res.status}): ${await res.text()}`);

  const data       = await res.json();
  _luluToken       = data.access_token;
  _luluTokenExpiry = Date.now() + (data.expires_in - 30) * 1000;
  return _luluToken;
}

// ── Price helpers ──────────────────────────────────────

function _luluPageCount(numScenes) {
  const pages = Math.max(LULU_MIN_PAGES, numScenes);
  return pages % 2 === 0 ? pages : pages + 1; // must be even
}

function _luluEstimate(pageCount) {
  return LULU_BASE_COST + pageCount * LULU_PER_PAGE;
}

// Try Lulu API; fall back to published formula on CORS / network error.
async function luluFetchPrice(numScenes) {
  const pageCount = _luluPageCount(numScenes);

  try {
    const token = await luluGetToken();
    const res = await fetch(`${LULU_API}/print-jobs/v1/costs/`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line_items: [{ page_count: pageCount, pod_package_id: LULU_POD_PACKAGE, quantity: 1 }],
        // US address used as a reference for the estimate
        shipping_address: {
          name: 'Preview',
          street1: '123 Main St',
          city: 'New York',
          state_code: 'NY',
          postcode: '10001',
          country_code: 'US',
          phone_number: '5555550100',
        },
        shipping_level: 'GROUND',
      }),
    });

    if (res.ok) {
      const data     = await res.json();
      const line     = data.line_items?.[0];
      const printCost  = parseFloat(line?.cost_excl_discounts || line?.unit_tier_price || 0);
      const shipping   = parseFloat(data.shipping_cost?.total_cost_excl_tax || 0);
      return { printCost, shipping, pageCount, source: 'api' };
    }
  } catch (_) { /* fall through to estimate */ }

  // Formula fallback
  const printCost = _luluEstimate(pageCount);
  return { printCost, shipping: null, pageCount, source: 'estimate' };
}

// ── Full cost calculation (for order creation) ─────────

async function luluCalculateCost(pageCount, shippingAddress) {
  const token = await luluGetToken();
  const res = await fetch(`${LULU_API}/print-jobs/v1/costs/`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line_items: [{ page_count: pageCount, pod_package_id: LULU_POD_PACKAGE, quantity: 1 }],
      shipping_address: shippingAddress,
      shipping_level:  'GROUND',
    }),
  });
  if (!res.ok) throw new Error(`Lulu cost calc failed (${res.status})`);
  return res.json();
}

async function luluCreatePrintJob({ title, coverUrl, interiorUrl, pageCount, shippingAddress, contactEmail }) {
  const token = await luluGetToken();
  const res = await fetch(`${LULU_API}/print-jobs/v1/`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact_email: contactEmail,
      line_items: [{
        title,
        cover:          { source_file: coverUrl    },
        interior:       { source_file: interiorUrl },
        pod_package_id: LULU_POD_PACKAGE,
        quantity: 1,
      }],
      shipping_address: shippingAddress,
      shipping_level:  'GROUND',
    }),
  });
  if (!res.ok) throw new Error(`Lulu print job failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// ── Physical order modal controller ───────────────────
// Can be called with no args (uses window._lastMangaData from fresh generation)
// or with an opts object from a tile: { storyId, title, grad, numScenes, thumbUrl }

let _physicalOpts = {};

async function openPhysicalOrder(opts = {}) {
  const data      = window._lastMangaData;
  const grad      = opts.grad     || window._lastGrad || 'linear-gradient(135deg,#1a0505,#c0392b)';
  const title     = opts.title    || data?.titre || 'Your Manga';
  const numScenes = opts.numScenes != null ? opts.numScenes : (data?.chapters?.length || 4);
  const thumbUrl  = opts.thumbUrl || null;

  if (!opts.title && !data) { alert('Please generate a manga first.'); return; }

  _physicalOpts = {
    ...opts,
    _storyId:   opts.storyId || window._currentStoryId || window._lastStoryId || null,
    _title:     title,
    _grad:      grad,
    _numScenes: numScenes,
  };

  document.getElementById('physical-modal-title').textContent = title;

  // Cover preview — tile thumb or gradient fallback
  const previewImg  = document.getElementById('physical-cover-preview-img');
  const previewGrad = document.getElementById('physical-cover-preview-grad');
  const imgSrc      = thumbUrl || null;

  if (imgSrc) {
    previewImg.src            = imgSrc;
    previewImg.style.display  = 'block';
    previewGrad.style.display = 'none';
  } else {
    previewGrad.style.background = grad;
    previewGrad.textContent      = title;
    previewImg.style.display     = 'none';
    previewGrad.style.display    = 'flex';
  }

  // Page count spec
  const pageCount = _luluPageCount(numScenes);
  document.getElementById('physical-spec-pages').textContent = `${pageCount} pages`;

  // Show modal with loading price
  _showPriceLoading(true);
  _injectPhysicalStripe();
  document.getElementById('physical-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Fetch Lulu price in background
  try {
    const result = await luluFetchPrice(numScenes);
    _renderPrice(result);
  } catch (err) {
    console.warn('[Lulu] price fetch failed:', err);
    _renderPrice({ printCost: _luluEstimate(pageCount), shipping: null, pageCount, source: 'estimate' });
  }
}

function _showPriceLoading(on) {
  const loading = document.getElementById('physical-price-loading');
  const result  = document.getElementById('physical-price-result');
  if (loading) loading.style.display = on ? 'flex' : 'none';
  if (result)  result.style.display  = on ? 'none' : 'block';
}

function _renderPrice({ printCost, shipping, pageCount, source }) {
  const valueEl    = document.getElementById('physical-price-value');
  const shippingEl = document.getElementById('physical-price-shipping');
  const noteEl     = document.getElementById('physical-price-note');

  if (valueEl) valueEl.textContent = `$${printCost.toFixed(2)}`;

  if (shippingEl) {
    shippingEl.textContent = shipping != null
      ? `+ $${shipping.toFixed(2)} shipping (US)`
      : '+ shipping (calculated at checkout)';
  }

  if (noteEl) {
    noteEl.textContent = source === 'estimate'
      ? `Estimated — ${pageCount}-page book at Lulu's published rates`
      : `Live quote from Lulu — ${pageCount}-page book`;
  }

  _showPriceLoading(false);
}

function closePhysicalModal() {
  document.getElementById('physical-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function handlePhysicalOverlayClick(e) {
  if (e.target === document.getElementById('physical-modal')) closePhysicalModal();
}

async function downloadCover() {
  const data      = window._lastMangaData;
  const aiContent = window._lastAIContent;

  const title    = data?.titre        || _physicalOpts._title || 'Manga';
  const grad     = window._lastGrad   || _physicalOpts._grad  || 'linear-gradient(135deg,#1a0505,#c0392b)';
  const profile  = genreProfiles[data?.genre] || genreProfiles.shonen;

  // Try to get first scene image for the front cover
  let firstImageB64 = null;
  const thumbUrl = _physicalOpts.thumbUrl || null;
  if (thumbUrl) {
    try { firstImageB64 = await _fetchImageBase64(thumbUrl); } catch (_) {}
  }

  generateCoverPDF({
    title,
    tagline:  aiContent?.tagline  || '',
    genre:    profile.label       || data?.genre || '',
    heroName: data?.heros         || '',
    synopsis: aiContent?.synopsis || '',
    grad,
    firstImageB64,
    download: true,
  });
}

async function previewFullPDF(btn) {
  if (typeof jspdf === 'undefined') { alert('PDF library not loaded — please refresh.'); return; }
  if (!_supabase) { alert('Database not connected.'); return; }

  const storyId   = _physicalOpts._storyId;
  const title     = _physicalOpts._title     || 'Your Manga';
  const grad      = _physicalOpts._grad      || 'linear-gradient(135deg,#1a0505,#c0392b)';
  const data      = window._lastMangaData;
  const aiContent = window._lastAIContent;

  if (!storyId) { alert('No manga selected — please open from a manga tile.'); return; }

  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Building preview…';

  try {
    // Fetch story metadata + images
    const [{ data: story }, { data: images, error: imgErr }] = await Promise.all([
      _supabase.from('manga_stories').select('title,genre,tagline,synopsis').eq('id', storyId).single(),
      _supabase.from('manga_images').select('image_url,image_type,chapter_num').eq('story_id', storyId),
    ]);
    if (imgErr) throw imgErr;

    const finalTitle = story?.title   || title;
    const tagline    = story?.tagline || aiContent?.tagline  || '';
    const synopsis   = story?.synopsis|| aiContent?.synopsis || '';
    const genre      = genreProfiles[story?.genre]?.label    || story?.genre || '';
    const heroName   = data?.heros    || '';
    const cols       = _parseGradColors(grad);

    const sceneImages = (images || [])
      .filter(i => i.image_type === 'chapter')
      .sort((a, b) => (a.chapter_num || 0) - (b.chapter_num || 0));

    const W = 152.4, H = 228.6;
    const doc = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H], compress: true });

    // Fetch first scene image for the front cover
    let firstImageB64 = null;
    if (sceneImages.length > 0) {
      btn.textContent = '⏳ Loading cover image…';
      try { firstImageB64 = await _fetchImageBase64(sceneImages[0].image_url); } catch (_) {}
    }

    // Page 1 — front cover
    _drawFrontCover(doc, W, H, cols, { title: finalTitle, genre, tagline, heroName, firstImageB64 });

    // Interior — one page per scene image
    for (let i = 0; i < sceneImages.length; i++) {
      btn.textContent = `⏳ Loading scene ${i + 1} / ${sceneImages.length}…`;
      doc.addPage([W, H]);
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, W, H, 'F');
      try {
        const b64 = await _fetchImageBase64(sceneImages[i].image_url);
        const fmt = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(b64, fmt, 0, 0, W, H, undefined, 'NONE');
      } catch (_) {
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.text(`Scene ${sceneImages[i].chapter_num || i + 1}`, W / 2, H / 2, { align: 'center' });
      }
      // Scene label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Scene ${sceneImages[i].chapter_num || i + 1}`, W / 2, H - 4, { align: 'center' });
    }

    // Last page — back cover
    btn.textContent = '⏳ Building back cover…';
    doc.addPage([W, H]);
    _drawBackCover(doc, W, H, cols, { title: finalTitle, synopsis });

    // Open in new tab
    const url = doc.output('bloburl');
    window.open(url, '_blank');

  } catch (err) {
    console.error('[Preview] error:', err);
    alert('Could not build preview: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

function _injectPhysicalStripe() {
  const container = document.getElementById('physical-stripe-container');
  if (!container) return;

  const btnId  = typeof STRIPE_PHYSICAL_BUY_BUTTON_ID !== 'undefined' ? STRIPE_PHYSICAL_BUY_BUTTON_ID : '';
  const pubKey = typeof STRIPE_PUBLISHABLE_KEY !== 'undefined' ? STRIPE_PUBLISHABLE_KEY : '';

  if (!btnId || btnId.includes('XXX')) {
    container.innerHTML = `
      <div class="physical-stripe-placeholder">
        <p>💳 Payment coming soon</p>
        <small>Stripe physical copy product not yet configured.</small>
      </div>`;
    return;
  }

  if (!document.querySelector('script[src*="buy-button.js"]')) {
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/buy-button.js';
    s.async = true;
    document.head.appendChild(s);
  }

  container.innerHTML = `
    <stripe-buy-button
      buy-button-id="${btnId}"
      publishable-key="${pubKey}"
    ></stripe-buy-button>`;
}
