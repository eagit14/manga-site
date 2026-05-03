// ── Generator: buildAndShowResult, handleGenerate, regenerate, resetForm, copySynopsis ──

function buildAndShowResult(data, aiContent) {
  const profile    = genreProfiles[data.genre] || genreProfiles.shonen;
  const synopsis   = aiContent?.synopsis   || buildSynopsis(data, profile);
  const tagline    = aiContent?.tagline    || pick(profile.taglines);
  const heroDesc   = aiContent?.hero_description || buildHeroDesc(data, profile);
  const chapters   = aiContent?.chapter_titles || [];
  const volumes    = rnd(1, 3);
  const chapterCnt = rnd(12, 60);
  const rating     = (rnd(42, 50) / 10).toFixed(1);
  const grad       = coverGrads[data.genre] || coverGrads.shonen;
  const heroName   = data.heros || 'Protagonist';
  const styleLabel = styleLabels[data.style] || data.style;
  const isAI       = !!aiContent;

  const chapterHTML = chapters.length ? `
    <div>
      <p class="result-section-label">📖 Chapter preview</p>
      <div class="chapter-list">
        ${chapters.map((t, i) => `
          <div class="chapter-item">
            <span class="chapter-num">CH. ${String(i + 1).padStart(2, '0')}</span>
            <span class="chapter-title-text">${t}</span>
          </div>`).join('')}
      </div>
    </div>` : '';

  const synopsisSafe = synopsis.replace(/'/g, "\\'").replace(/`/g, "'");

  const imagePanel = isAI ? `
    <div class="img-panel">
      <p class="img-panel-label">🎨 DALL-E Illustrations — B&amp;W Manga Style</p>
      <div class="img-carousel" id="result-carousel">
        <div class="img-carousel-slide active" id="carousel-slide-0">
          <div class="img-skeleton" id="carousel-skeleton-0">
            <span>⏳</span><span>Generating…</span>
          </div>
          <img class="carousel-img" id="carousel-img-0" alt="Pitch" style="display:none" />
        </div>
        <div class="img-carousel-slide" id="carousel-slide-1">
          <div class="img-skeleton" id="carousel-skeleton-1">
            <span>⏳</span><span>Generating…</span>
          </div>
          <img class="carousel-img" id="carousel-img-1" alt="Chapter 1" style="display:none" />
        </div>
        <div class="img-carousel-slide" id="carousel-slide-2">
          <div class="img-skeleton" id="carousel-skeleton-2">
            <span>⏳</span><span>Generating…</span>
          </div>
          <img class="carousel-img" id="carousel-img-2" alt="Ending" style="display:none" />
        </div>
        <button class="img-arrow img-arrow-left"  onclick="imgNav(-1)">&#8249;</button>
        <button class="img-arrow img-arrow-right" onclick="imgNav(1)">&#8250;</button>
        <div class="img-carousel-dots">
          <button class="img-dot active" onclick="imgGoTo(0)"></button>
          <button class="img-dot"        onclick="imgGoTo(1)"></button>
          <button class="img-dot"        onclick="imgGoTo(2)"></button>
        </div>
        <div class="img-caption-badge" id="img-caption">Pitch</div>
      </div>
    </div>` : '';

  const html = `
    <div class="result-card">
      <div class="result-cover" style="background:${grad}">
        <span class="result-cover-vol">VOLUME 1</span>
        <div class="result-cover-title">${data.titre}</div>
        <div class="result-cover-author">by You ✦ ${new Date().getFullYear()}</div>
      </div>
      <div class="result-content">
        <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
          <div class="result-title">${data.titre}</div>
          ${isAI ? '<span class="ai-badge">✦ ChatGPT</span>' : ''}
        </div>
        <div class="result-badges">
          <span class="result-badge" style="background:${profile.badgeColor}">${profile.label}</span>
          <span class="result-badge" style="background:#888">${styleLabel}</span>
          <span class="result-badge" style="background:#f4c430;color:#111">⭐ ${rating}</span>
          <span class="result-badge" style="background:#22c55e">● Ongoing</span>
        </div>
        <div>
          <p class="result-tagline">${tagline}</p>
        </div>
        <div>
          <p class="result-section-label">Story</p>
          <p class="result-synopsis">${synopsis}</p>
        </div>
        <div class="result-hero">
          <div class="result-hero-name">🦸 ${heroName}</div>
          <div class="result-hero-desc">${heroDesc}</div>
        </div>
        ${chapterHTML}
        ${imagePanel}
        <div class="result-actions">
          <button class="action-btn order-btn" onclick="openPayment('${data.titre.replace(/'/g, "\\'")}', '${grad}')">🛒 Order your Manga!</button>
        </div>
      </div>
    </div>`;

  document.getElementById('creator-loading').style.display = 'none';
  const resultEl = document.getElementById('creator-result');
  resultEl.innerHTML = html;
  resultEl.style.display = 'block';
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window._lastMangaData = data;

  // Persist to manga_story table (skip on regenerate replays)
  if (!data._isReplay) saveStory(data, aiContent, grad);
}

async function handleGenerate() {
  const apiKey = OPENAI_API_KEY;
  const genBtn = document.getElementById('gen-btn');
  if (genBtn) genBtn.style.display = 'none';

  // ── Clear previous errors ──
  const errEl = document.getElementById('api-error-msg');
  errEl.classList.remove('show');
  ['f-premise', 'f-fin'].forEach(id =>
    document.getElementById(id).classList.remove('field-error'));
  document.getElementById('chapters-list').classList.remove('field-error');
  ['err-premise', 'err-chapters', 'err-fin'].forEach(id =>
    document.getElementById(id).classList.remove('show'));

  // ── Validation ──
  const premiseVal  = document.getElementById('f-premise').value.trim();
  const finVal      = document.getElementById('f-fin').value.trim();
  const chaptersVal = getChaptersData();
  let firstInvalid  = null;

  if (!premiseVal) {
    document.getElementById('f-premise').classList.add('field-error');
    document.getElementById('err-premise').classList.add('show');
    firstInvalid = firstInvalid || document.getElementById('f-premise');
  }
  if (chaptersVal.length === 0) {
    document.getElementById('chapters-list').classList.add('field-error');
    document.getElementById('err-chapters').classList.add('show');
    firstInvalid = firstInvalid || document.getElementById('add-chapter-btn');
  }
  if (!finVal) {
    document.getElementById('f-fin').classList.add('field-error');
    document.getElementById('err-fin').classList.add('show');
    firstInvalid = firstInvalid || document.getElementById('f-fin');
  }
  if (firstInvalid) {
    if (genBtn) genBtn.style.display = '';
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (apiKey) localStorage.setItem('openai_key', apiKey);

  const data = {
    titre:    document.getElementById('f-titre').value.trim()     || 'Untitled',
    genre:    document.getElementById('f-genre').value,
    style:    document.getElementById('f-style').value,
    heros:    document.getElementById('f-heros').value.trim(),
    heroDesc: document.getElementById('f-hero-desc').value.trim(),
    univers:  document.getElementById('f-univers').value.trim(),
    premise:  premiseVal,
    fin:      finVal,
    chapters: chaptersVal,
  };

  document.getElementById('creator-form-card').style.display = 'none';
  document.getElementById('creator-result').style.display = 'none';
  document.getElementById('creator-loading').style.display = 'block';
  document.getElementById('loading-msg').textContent = apiKey
    ? '🤖 ChatGPT is writing your manga…'
    : '✍️ Your inner mangaka is awakening…';

  let aiContent = null;

  if (apiKey) {
    try {
      aiContent = await callOpenAI(apiKey, data);
    } catch (err) {
      document.getElementById('creator-loading').style.display = 'none';
      document.getElementById('creator-form-card').style.display = 'block';
      if (genBtn) genBtn.style.display = '';
      errEl.textContent = `❌ ${err.message}`;
      errEl.classList.add('show');
      errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  } else {
    await new Promise(r => setTimeout(r, 2000));
  }

  buildAndShowResult(data, aiContent);

  // Save story + chapters to Supabase, then kick off image generation with the story ID
  const grad = coverGrads[data.genre] || coverGrads.shonen;
  const storyId = await saveStoryToSupabase(data, aiContent, grad);
  window._lastStoryId = storyId || null;
  loadMyMangas();

  // Kick off DALL-E image generation asynchronously (non-blocking)
  if (apiKey && aiContent) {
    const _styleLabel = styleLabels[data.style] || data.style;
    const _genreLabel = genreProfiles[data.genre]?.label || data.genre;
    const prompts = buildImagePrompts(data, aiContent, _styleLabel, _genreLabel);
    generateImages(apiKey, prompts.pitch, prompts.chapter1, prompts.ending, storyId);
  }
}

function regenerate() {
  if (!window._lastMangaData) return;
  const saved = window._lastMangaData;
  document.getElementById('f-titre').value     = saved.titre;
  document.getElementById('f-genre').value     = saved.genre;
  document.getElementById('f-style').value     = saved.style;
  document.getElementById('f-heros').value     = saved.heros;
  document.getElementById('f-hero-desc').value = saved.heroDesc;
  document.getElementById('f-univers').value   = saved.univers;
  document.getElementById('f-premise').value   = saved.premise;
  handleGenerate();
}

function resetForm() {
  clearHeroImage({ preventDefault: () => {}, stopPropagation: () => {} });
  document.getElementById('creator-result').style.display = 'none';
  document.getElementById('creator-form-card').style.display = 'block';
  document.getElementById('creator-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copySynopsis(text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}
