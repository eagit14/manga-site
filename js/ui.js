// ── UI effects: wiki loader, scroll observers, nav shadow, carousel, hero upload ──

// ── Wikipedia image loader ─────────────────────────────
async function loadWikiImage(imgEl) {
  const title = imgEl.dataset.wiki;
  if (!title) return;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return;
    const data = await res.json();
    if (!data.thumbnail?.source) return;
    const src = data.thumbnail.source.replace(/\/\d+px-/, '/500px-');
    imgEl.onload = () => imgEl.classList.add('loaded');
    imgEl.src = src;
  } catch (_) { /* gradient fallback shows */ }
}

// ── Card scroll reveal ─────────────────────────────────
function initCardObserver() {
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      cardObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.card').forEach(c => cardObserver.observe(c));
}

// ── Story panel reveal ─────────────────────────────────
function initPanelObserver() {
  const panelObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('visible'), i * 100);
      panelObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.story-panel').forEach(p => panelObserver.observe(p));
}

// ── Nav scroll shadow ──────────────────────────────────
function initNavShadow() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── Hero face upload ──────────────────────────────────
let _heroImageBase64 = null;
let _heroImageMime   = 'image/jpeg';

function triggerHeroUpload() {
  document.getElementById('f-hero-img').click();
}

function handleHeroImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  _heroImageMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    _heroImageBase64 = dataUrl.split(',')[1];
    document.getElementById('hero-upload-thumb').src = dataUrl;
    document.getElementById('hero-upload-name').textContent = file.name;
    document.getElementById('hero-upload-preview').style.display = 'flex';
    document.getElementById('hero-upload-label').style.display  = 'none';
  };
  reader.readAsDataURL(file);
}

function clearHeroImage(event) {
  event.preventDefault();
  event.stopPropagation();
  _heroImageBase64 = null;
  document.getElementById('f-hero-img').value = '';
  document.getElementById('hero-upload-preview').style.display = 'none';
  document.getElementById('hero-upload-label').style.display  = '';
}

// ── Image model selector ──────────────────────────────

function getImgModel() {
  return document.querySelector('input[name="img-model"]:checked')?.value || 'gpt-image-1';
}

function onImgModelChange(model) {
  const sel = document.getElementById('f-img-quality');
  if (!sel) return;
  if (model === 'dall-e-3') {
    sel.innerHTML = `
      <option value="standard" selected>Standard</option>
      <option value="hd">HD — highest quality</option>`;
  } else {
    sel.innerHTML = `
      <option value="low">Draft — fastest &amp; cheapest (~€0.01/image)</option>
      <option value="medium" selected>Standard — good quality (~€0.04/image)</option>
      <option value="high">Premium — best quality (~€0.17/image)</option>`;
  }
}

// ── Init all UI observers on load ─────────────────────
function initUI() {
  document.querySelectorAll('.card-img img[data-wiki]').forEach(loadWikiImage);
  initCardObserver();
  initPanelObserver();
  initNavShadow();
}
