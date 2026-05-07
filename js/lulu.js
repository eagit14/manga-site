// ── Lulu Direct API Client ────────────────────────────
// Docs: https://developers.lulu.com/print-api/docs/getting-started
//
// ⚠  Lulu's token endpoint may block cross-origin browser requests.
//    If it does, cost is estimated using Lulu's published pricing formula.
//    For production order creation, route calls through a server proxy.

const LULU_API = 'https://api.lulu.com';

// Lulu Direct API: only Perfect Bound (PB) is available via their POD API.
// Valid confirmed format: 0600X0900.{BW|FC}.STD.PB.060UW444.GXX (6"×9", min 32 pages, even).

function _isColorStyle(colorStyle) {
  return colorStyle === 'color' || colorStyle === 'fc';
}

function _luluPodPackage(_numScenes, colorStyle) {
  const ink = _isColorStyle(colorStyle) ? 'FC' : 'BW';
  return `0600X0900.${ink}.STD.PB.060UW444.GXX`; // 6"×9" perfect bound
}

// Trim dimensions in mm for jsPDF
function _luluTrimMM(_numScenes) {
  return { W: 152.4, H: 228.6 }; // 6" × 9"
}

// Lulu published wholesale pricing (approximate fallback estimates)
const LULU_PRICING = {
  pb_fc: { base: 3.47, perPage: 0.15 }, // perfect bound full color
  pb_bw: { base: 2.29, perPage: 0.013 },// perfect bound B&W
};

function _luluEstimateForStyle(pageCount, _numScenes, colorStyle) {
  const key = 'pb_' + (_isColorStyle(colorStyle) ? 'fc' : 'bw');
  const p = LULU_PRICING[key];
  return p.base + pageCount * p.perPage;
}

let _luluToken       = null;
let _luluTokenExpiry = 0;

async function luluGetToken() {
  if (_luluToken && Date.now() < _luluTokenExpiry) return _luluToken;

  // Lulu credentials are stored as Supabase Edge Function secrets — never in client JS.
  // Direct browser calls to Lulu are also blocked by CORS; use the lulu-price edge function instead.
  throw new Error('Direct Lulu auth is not supported from the browser. Use the lulu-price edge function.');

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     '',
    client_secret: '',
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
  // Perfect bound 6"×9": min 32 pages, must be even
  const raw   = numScenes + 2; // +2 for front and back cover
  const pages = Math.max(32, raw);
  return pages % 2 === 0 ? pages : pages + 1;
}

function _luluEstimate(pageCount, numScenes, colorStyle) {
  return _luluEstimateForStyle(pageCount, numScenes, colorStyle);
}

// Calls the lulu-price Supabase Edge Function (avoids browser CORS block on Lulu's auth endpoint).
// Falls back to the published pricing formula if the Edge Function is unavailable.
async function luluFetchPrice(numScenes, shippingAddress, colorStyle) {
  const pageCount = _luluPageCount(numScenes);
  const addr = shippingAddress?.street1 ? shippingAddress : {
    name: 'Preview', street1: '123 Main St',
    city: 'New York', state_code: 'NY',
    postcode: '10001', country_code: 'US',
    phone_number: '5555550100',
  };

  try {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const podPackage = _luluPodPackage(numScenes, colorStyle);
    console.log('[Lulu] requesting price for package:', podPackage, 'pages:', pageCount);

    const res = await fetch(`${SUPABASE_URL}/functions/v1/lulu-price`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        pageCount,
        shippingAddress: addr,
        podPackage,
        shippingOption:  'MAIL',
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

    // Response shape: { line_item_costs, shipping_cost, total_cost_excl_tax, ... }
    const lineItem  = data.line_item_costs?.[0];
    const printCost = parseFloat(lineItem?.total_cost_excl_tax || lineItem?.cost_excl_discounts || 0);
    const shipping  = parseFloat(data.shipping_cost?.total_cost_excl_tax || 0);
    if (printCost > 0) return { printCost, shipping, pageCount, source: 'api' };
    throw new Error('Zero print cost returned');
  } catch (err) {
    console.warn('[Lulu] price fetch failed:', err.message);
  }

  // Formula fallback
  const printCost = _luluEstimate(pageCount, numScenes, colorStyle);
  return { printCost, shipping: null, pageCount, source: 'estimate' };
}

// ── Full cost calculation (for order creation) ─────────

async function luluCalculateCost(pageCount, shippingAddress) {
  const token = await luluGetToken();
  const res = await fetch(`${LULU_API}/print-jobs/v1/costs/`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line_items: [{ page_count: pageCount, pod_package_id: _luluPodPackage(_physicalOpts._numScenes || 4, _physicalOpts._colorStyle), quantity: 1 }],
      shipping_address: shippingAddress,
      shipping_level:  'MAIL',
    }),
  });
  if (!res.ok) throw new Error(`Lulu cost calc failed (${res.status})`);
  return res.json();
}

async function luluCreatePrintJob({ title, coverUrl, interiorUrl, pageCount, shippingAddress, contactEmail, storyId }) {
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
        pod_package_id: _luluPodPackage(_physicalOpts._numScenes || 4, _physicalOpts._colorStyle),
        quantity: 1,
      }],
      shipping_address: shippingAddress,
      shipping_level:  'MAIL',
    }),
  });
  if (!res.ok) throw new Error(`Lulu print job failed (${res.status}): ${await res.text()}`);
  const job = await res.json();

  // Record the physical order
  const _ns = _physicalOpts._numScenes || 4;
  const printCost = _luluEstimate(pageCount || _luluPageCount(_ns), _ns, _physicalOpts._colorStyle);
  await saveOrder({
    orderType:       'physical',
    storyId:         storyId || _physicalOpts._storyId || null,
    storyTitle:      title,
    amount:          printCost,
    paymentProvider: 'lulu',
    pageCount:       pageCount || null,
    luluPrintJobId:  job.id ? String(job.id) : null,
    shippingAddress,
  });

  return job;
}

// ── Physical order modal controller ───────────────────
// Can be called with no args (uses window._lastMangaData from fresh generation)
// or with an opts object from a tile: { storyId, title, grad, numScenes, thumbUrl }

let _physicalOpts = {};

async function _getShippingProfile() {
  if (!_supabase) return null;
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return null;
  const { data } = await _supabase
    .from('users')
    .select('first_name, last_name, address_line1, address_line2, city, state, postal_code, country')
    .eq('id', user.id)
    .single();
  return data || null;
}

function _isShippingComplete(p) {
  return !!(p && p.first_name && p.last_name && p.address_line1 && p.city && p.postal_code && p.country);
}

function _populateShippingForm(p) {
  const s = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  s('ps-firstname', p.first_name);
  s('ps-lastname',  p.last_name);
  s('ps-addr1',     p.address_line1);
  s('ps-addr2',     p.address_line2 || '');
  s('ps-city',      p.city);
  s('ps-state',     p.state || '');
  s('ps-postal',    p.postal_code);
  _populateCountrySelect('ps-country', p.country);
  _toggleStateField('ps-country', 'ps-state');
}

function _saveShippingToStorage() {
  const v = id => document.getElementById(id)?.value.trim() || '';
  const parts = [
    `${v('ps-firstname')} ${v('ps-lastname')}`.trim(),
    v('ps-addr1'),
    v('ps-addr2'),
    `${v('ps-city')}${v('ps-state') ? ' ' + v('ps-state').toUpperCase() : ''}`,
    v('ps-postal'),
    v('ps-country'),
  ].filter(Boolean);
  if (parts.length) localStorage.setItem('_pendingShippingAddress', parts.join(', '));
}

function _getShippingFromForm() {
  const v = id => document.getElementById(id)?.value.trim() || '';
  const state      = v('ps-state').toUpperCase().slice(0, 3) || undefined;
  const countryCode = v('ps-country').toUpperCase().slice(0, 2);
  return {
    name:         `${v('ps-firstname')} ${v('ps-lastname')}`.trim(),
    street1:      v('ps-addr1'),
    street2:      v('ps-addr2') || undefined,
    city:         v('ps-city'),
    state_code:   state,
    postcode:     v('ps-postal'),
    country_code: countryCode,
    phone_number: '0000000000',
  };
}

async function openPhysicalOrder(opts = {}) {
  const data      = window._lastMangaData;
  const grad      = opts.grad      || window._lastGrad || 'linear-gradient(135deg,#1a0505,#c0392b)';
  const title     = opts.title     || data?.titre || 'Your Manga';
  const numScenes = opts.numScenes != null ? opts.numScenes : (data?.chapters?.length || 4);
  const thumbUrl  = opts.thumbUrl  || null;

  // Determine color style: fetch chapters from DB so any color chapter marks the whole book FC.
  // Fall back to opts / _lastMangaData if no storyId or DB unavailable.
  let colorStyle = opts.colorStyle || data?.colorStyle || 'bw';
  const storyIdForColor = opts.storyId || window._currentStoryId || window._lastStoryId;
  if (storyIdForColor && _supabase) {
    try {
      const [{ data: story }, { data: chapters }] = await Promise.all([
        _supabase.from('manga_stories').select('color_style').eq('id', storyIdForColor).single(),
        _supabase.from('manga_chapters').select('color_style').eq('story_id', storyIdForColor),
      ]);
      const styles = [story?.color_style, ...(chapters || []).map(c => c.color_style)];
      colorStyle = styles.some(s => s === 'color') ? 'color' : 'bw';
    } catch (_) {}
  }

  if (!opts.title && !data) { alert('Please generate a manga first.'); return; }

  // Require a complete shipping address before proceeding
  const profile = await _getShippingProfile();
  if (!_isShippingComplete(profile)) {
    await openProfile();
    const msg = document.getElementById('profile-save-msg');
    if (msg) {
      msg.textContent = '⚠ Please fill in your shipping address (first name, last name, address, city, postal code and country) then try ordering again.';
      msg.className = 'profile-save-msg error';
    }
    return;
  }

  // Pre-fill shipping form and persist address to localStorage (survives Stripe redirect)
  _populateCountrySelect('ps-country', profile.country);
  _populateShippingForm(profile);
  _saveShippingToStorage();
  ['ps-firstname','ps-lastname','ps-addr1','ps-addr2','ps-city','ps-state','ps-postal','ps-country']
    .forEach(id => { const el = document.getElementById(id); if (el) el.oninput = _saveShippingToStorage; });

  _physicalOpts = {
    ...opts,
    _storyId:    opts.storyId || window._currentStoryId || window._lastStoryId || null,
    _title:      title,
    _grad:       grad,
    _numScenes:  numScenes,
    _colorStyle: colorStyle,
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

  // Spec rows
  const pageCount  = _luluPageCount(numScenes);
  const isColor    = _isColorStyle(colorStyle);
  const rawPages   = numScenes + 2;
  const pagesLabel = rawPages < 32
    ? `${pageCount} pages (padded to 32-page min)`
    : `${pageCount} pages`;
  document.getElementById('physical-spec-format').textContent   = '6″ × 9″ Paperback';
  document.getElementById('physical-spec-binding').textContent  = 'Perfect bound, glossy';
  document.getElementById('physical-spec-interior').textContent = isColor ? 'Full color' : 'Black & white';
  document.getElementById('physical-spec-pages').textContent    = pagesLabel;

  // Store storyId + order type so markMangaPurchased fires correctly after Stripe redirect
  if (_physicalOpts._storyId) localStorage.setItem('_pendingPurchaseStoryId', _physicalOpts._storyId);
  localStorage.setItem('_pendingOrderType', 'physical');

  // Show modal with loading price
  _showPriceLoading(true);
  _injectPhysicalStripe();
  document.getElementById('physical-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Fetch Lulu price using the pre-filled shipping address
  try {
    const result = await luluFetchPrice(numScenes, _getShippingFromForm(), colorStyle);
    _renderPrice(result);
  } catch (err) {
    console.warn('[Lulu] price fetch failed:', err);
    _renderPrice({ printCost: _luluEstimate(pageCount, colorStyle), shipping: null, pageCount, source: 'estimate' });
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
    const country = document.getElementById('ps-country')?.value || '';
    shippingEl.textContent = shipping != null
      ? `+ $${shipping.toFixed(2)} shipping${country ? ' (' + country + ')' : ''}`
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

// Load cached cover data (image + blurb) from manga_images, then build the PDF.
async function _buildCoverPdfFromCache(storyId) {
  const [{ data: story }, { data: coverRow }] = await Promise.all([
    _supabase.from('manga_stories').select('title,genre,tagline,synopsis,cover_gradient').eq('id', storyId).single(),
    _supabase.from('manga_images').select('image_url,prompt_used').eq('story_id', storyId).eq('image_type', 'cover').maybeSingle(),
  ]);
  if (!story) return null;

  const title      = story.title    || 'Manga';
  const grad       = story.cover_gradient || 'linear-gradient(135deg,#1a0505,#c0392b)';
  const tagline    = story.tagline  || '';
  const synopsis   = story.synopsis || '';
  const profile    = genreProfiles[story.genre] || genreProfiles.shonen;
  const genre      = profile.label  || story.genre || '';
  const backSummary = coverRow?.prompt_used || null;

  let firstImageB64 = null;
  if (coverRow?.image_url) {
    try { firstImageB64 = await _fetchImageBase64(coverRow.image_url); } catch (_) {}
  }

  return generateCoverPDF({ title, tagline, genre, heroName: '', synopsis, backSummary, grad, firstImageB64, download: false });
}

function _toGreyscale(b64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const g = Math.round(0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2]);
        data.data[i] = data.data[i + 1] = data.data[i + 2] = g;
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = b64;
  });
}

function _addBlankPage(doc, W, H) {
  doc.addPage([W, H]);
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');
}

function _addDraftWatermark(doc, W, H) {
  try {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.22 }));
  } catch (_) {}
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(56);
  doc.setTextColor(255, 255, 255);
  doc.text('DRAFT', W / 2, H / 2, { align: 'center', angle: 45 });
  try { doc.restoreGraphicsState(); } catch (_) {}
}

async function viewCover(storyId, callerBtn, purchased) {
  if (!_supabase || !storyId) { alert('No manga selected.'); return; }
  if (typeof jspdf === 'undefined') { alert('PDF library not loaded — please refresh.'); return; }

  const btn      = callerBtn || null;
  const origText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Building PDF…'; }

  try {
    const [{ data: story }, { data: images, error: imgErr }, { data: chapters }, { data: coverRow }] = await Promise.all([
      _supabase.from('manga_stories').select('title,genre,tagline,synopsis,cover_gradient').eq('id', storyId).single(),
      _supabase.from('manga_images').select('image_url,image_type,chapter_num').eq('story_id', storyId),
      _supabase.from('manga_chapters').select('chapter_num,title').eq('story_id', storyId).order('chapter_num', { ascending: true }),
      _supabase.from('manga_images').select('prompt_used').eq('story_id', storyId).eq('image_type', 'cover').maybeSingle(),
    ]);
    if (imgErr) throw imgErr;

    const finalTitle = story?.title    || 'Manga';
    const tagline    = story?.tagline  || '';
    const synopsis   = story?.synopsis || '';
    const genre      = genreProfiles[story?.genre]?.label || story?.genre || '';
    const grad       = story?.cover_gradient || 'linear-gradient(135deg,#1a0505,#c0392b)';
    const cols       = _parseGradColors(grad);

    const sceneImages = (images || [])
      .filter(i => i.image_type === 'chapter')
      .sort((a, b) => (a.chapter_num || 0) - (b.chapter_num || 0));

    if (sceneImages.length === 0) {
      alert('No scene images found — generate scene images first.');
      return;
    }

    const W = 152.4, H = 228.6; // 6"×9" Lulu standard
    const doc = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H], compress: true });

    // ── Page 1 — Front cover ─────────────────────────────
    if (btn) btn.textContent = '⏳ Loading cover…';
    let heroB64 = null;
    const coverImgRow = (images || []).find(i => i.image_type === 'cover');
    if (coverImgRow?.image_url) {
      try { heroB64 = await _fetchImageBase64(coverImgRow.image_url); } catch (_) {}
    }
    if (!heroB64 && sceneImages.length > 0) {
      try { heroB64 = await _fetchImageBase64(sceneImages[0].image_url); } catch (_) {}
    }
    _drawFrontCover(doc, W, H, cols, { title: finalTitle, genre, tagline, heroName: '', firstImageB64: heroB64 });

    // ── Page 2 — Title page ──────────────────────────────
    _addBlankPage(doc, W, H);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(20, 20, 20);
    doc.text(finalTitle, W / 2, H / 2 - 12, { align: 'center' });
    if (tagline) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(tagline, W - 40);
      doc.text(lines, W / 2, H / 2 + 8, { align: 'center' });
    }

    // ── Page 3 — Blank ───────────────────────────────────
    _addBlankPage(doc, W, H);

    // ── Page 4 — Hero photo (black & white) ─────────────
    if (btn) btn.textContent = '⏳ Loading hero image…';
    _addBlankPage(doc, W, H);
    if (heroB64) {
      try {
        const bwB64 = await _toGreyscale(heroB64);
        const margin = 12;
        doc.addImage(bwB64, 'JPEG', margin, margin, W - margin * 2, H - margin * 2, undefined, 'NONE');
      } catch (_) {}
    }

    // ── Page 5 — Blank ───────────────────────────────────
    _addBlankPage(doc, W, H);

    // ── Page 6 — Contents ────────────────────────────────
    _addBlankPage(doc, W, H);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text('Contents', W / 2, 28, { align: 'center' });
    doc.setDrawColor(180, 30, 30);
    doc.setLineWidth(0.6);
    doc.line(20, 34, W - 20, 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    let yPos = 48;
    (chapters || []).forEach((ch, idx) => {
      doc.setTextColor(30, 30, 30);
      doc.text(`${idx + 1}.  ${ch.title || `Scene ${ch.chapter_num || idx + 1}`}`, 24, yPos);
      yPos += 9;
    });

    // ── Page 7 — Blank ───────────────────────────────────
    _addBlankPage(doc, W, H);

    // ── Pages 8+ — Scene images ──────────────────────────
    for (let i = 0; i < sceneImages.length; i++) {
      if (btn) btn.textContent = `⏳ Scene ${i + 1} / ${sceneImages.length}…`;
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
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Scene ${sceneImages[i].chapter_num || i + 1}`, W / 2, H - 4, { align: 'center' });
      if (!purchased) _addDraftWatermark(doc, W, H);
    }

    // ── Blank padding to reach Lulu minimum ─────────────
    // Fixed pages: cover(1) + title(2) + blank(3) + hero(4) + blank(5) + contents(6) + blank(7) + back cover(last) = 8
    const fixedPages  = 8;
    const totalWithBack = fixedPages + sceneImages.length;
    const minPages    = 32;
    const targetTotal = Math.max(minPages, totalWithBack);
    const paddedTotal = targetTotal % 2 === 0 ? targetTotal : targetTotal + 1;
    const blankCount  = paddedTotal - totalWithBack;
    for (let p = 0; p < blankCount; p++) _addBlankPage(doc, W, H);

    // ── Last page — Back cover ───────────────────────────
    if (btn) btn.textContent = '⏳ Building back cover…';
    const cachedBlurb = coverRow?.prompt_used || null;
    let backSummary = cachedBlurb;
    if (!backSummary) {
      try { backSummary = await generateBackCoverSummary(chapters || [], finalTitle, story?.genre || ''); } catch (_) {}
    }
    doc.addPage([W, H]);
    _drawBackCover(doc, W, H, cols, { title: finalTitle, synopsis, backSummary });

    window.open(doc.output('bloburl'), '_blank');

  } catch (err) {
    console.error('[ViewManga] error:', err);
    alert('Could not build PDF: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText || '📖 View Manga'; }
  }
}

async function downloadCover() {
  const data    = window._lastMangaData;
  const storyId = _physicalOpts._storyId;
  const title   = data?.titre || _physicalOpts._title || 'Manga';
  const safe    = title.replace(/[^a-z0-9_\- ]/gi, '').trim() || 'cover';

  if (storyId && _supabase) {
    try {
      const doc = await _buildCoverPdfFromCache(storyId);
      if (doc) { doc.save(`${safe}-cover.pdf`); return; }
    } catch (_) {}
  }

  // Fallback: generate fully on the fly (no cache)
  const aiContent = window._lastAIContent;
  const grad      = window._lastGrad || _physicalOpts._grad || 'linear-gradient(135deg,#1a0505,#c0392b)';
  const profile   = genreProfiles[data?.genre] || genreProfiles.shonen;
  const genre     = profile.label || data?.genre || '';
  let firstImageB64 = null;
  let backSummary   = null;
  const thumbUrl = _physicalOpts.thumbUrl || null;
  if (thumbUrl) { try { firstImageB64 = await _fetchImageBase64(thumbUrl); } catch (_) {} }
  if (storyId && _supabase) {
    try {
      const { data: chapters } = await _supabase
        .from('manga_chapters').select('chapter_num,title,description')
        .eq('story_id', storyId).order('chapter_num', { ascending: true });
      if (chapters?.length) backSummary = await generateBackCoverSummary(chapters, title, genre);
    } catch (_) {}
  }
  await generateCoverPDF({
    title, tagline: aiContent?.tagline || '', genre,
    heroName: data?.heros || '', synopsis: aiContent?.synopsis || '',
    backSummary, grad, firstImageB64, download: true,
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
    // Fetch story metadata + images + cached cover row (for pre-generated blurb)
    const [{ data: story }, { data: images, error: imgErr }, { data: chapters }, { data: coverRow }] = await Promise.all([
      _supabase.from('manga_stories').select('title,genre,tagline,synopsis').eq('id', storyId).single(),
      _supabase.from('manga_images').select('image_url,image_type,chapter_num').eq('story_id', storyId),
      _supabase.from('manga_chapters').select('chapter_num,title,description').eq('story_id', storyId).order('chapter_num', { ascending: true }),
      _supabase.from('manga_images').select('prompt_used').eq('story_id', storyId).eq('image_type', 'cover').maybeSingle(),
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

    const { W, H } = _luluTrimMM(_physicalOpts._numScenes || sceneImages.length || 4);
    const doc = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H], compress: true });

    // Use pre-generated cover photo (manga_images type='cover'), fallback to first scene
    let firstImageB64 = null;
    const coverImgRow = (images || []).find(i => i.image_type === 'cover');
    btn.textContent = '⏳ Loading cover image…';
    if (coverImgRow?.image_url) {
      try { firstImageB64 = await _fetchImageBase64(coverImgRow.image_url); } catch (_) {}
    }
    if (!firstImageB64 && sceneImages.length > 0) {
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

    // Last page — back cover (use cached blurb if available, else generate)
    const cachedBlurb = coverRow?.prompt_used || null;
    let backSummary = cachedBlurb;
    if (!backSummary) {
      btn.textContent = '⏳ Generating back cover summary…';
      backSummary = await generateBackCoverSummary(chapters || [], finalTitle, story?.genre || '');
    }
    doc.addPage([W, H]);
    _drawBackCover(doc, W, H, cols, { title: finalTitle, synopsis, backSummary });

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

// ── Debug helper ──────────────────────────────────────
// Run in browser console: _luluListPackages('SS')  or  _luluListPackages()
window._luluListPackages = async function(filter = '') {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session?.access_token) { console.error('Not authenticated'); return; }
  const url = `${SUPABASE_URL}/functions/v1/lulu-price${filter ? '?filter=' + encodeURIComponent(filter) : ''}`;
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } });
  const data = await res.json();
  console.table(Array.isArray(data) ? data.map(p => ({ id: p.id, title: p.title || p.name })) : data);
  return data;
};
