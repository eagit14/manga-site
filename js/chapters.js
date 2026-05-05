// ── Chapter management ────────────────────────────────

let _chapterIdCounter = 0;

function addChapter() {
  const entries = document.querySelectorAll('.chapter-entry');
  if (entries.length >= 20) return;
  _chapterIdCounter++;
  const cid = _chapterIdCounter;
  const num = entries.length + 1;
  const list = document.getElementById('chapters-list');
  const div  = document.createElement('div');
  div.className = 'chapter-entry';
  div.id = `chapter-entry-${cid}`;
  div.innerHTML = `
    <div class="chapter-entry-hdr">
      <span class="chapter-entry-num">Sc. ${num}</span>
      <input class="form-input chapter-title-input" id="ch-title-${cid}" type="text" placeholder="Scene title…" maxlength="80" />
      <div class="scene-thumb" id="scene-thumb-${cid}" style="display:none" title="Hover to preview">
        <img id="scene-thumb-img-${cid}" alt="" />
        <div class="scene-thumb-popup">
          <img id="scene-popup-img-${cid}" alt="Scene preview" />
          <div class="draft-watermark">DRAFT</div>
        </div>
      </div>
      <button type="button" class="scene-gen-img-btn" id="scene-gen-btn-${cid}" onclick="generateSceneImage(${cid})">🎨 Generate</button>
      <button type="button" class="chapter-remove-btn" onclick="removeChapter(${cid})" title="Remove">✕</button>
    </div>
    <textarea class="form-textarea chapter-desc-input" id="ch-desc-${cid}" rows="2" placeholder="Scene description…"></textarea>`;
  list.appendChild(div);
  updateChapterUI();
}

function removeChapter(cid) {
  const el = document.getElementById(`chapter-entry-${cid}`);
  if (el) el.remove();
  updateChapterUI();
  renumberChapters();
}

function renumberChapters() {
  document.querySelectorAll('.chapter-entry').forEach((el, i) => {
    const badge = el.querySelector('.chapter-entry-num');
    if (badge) badge.textContent = `Sc. ${i + 1}`;
  });
}

function updateChapterUI() {
  const count = document.querySelectorAll('.chapter-entry').length;
  document.getElementById('chapter-count').textContent = `(${count} / 20)`;
  const btn = document.getElementById('add-chapter-btn');
  btn.disabled = count >= 20;
}

function getChaptersData() {
  const chapters = [];
  document.querySelectorAll('.chapter-entry').forEach((el, i) => {
    const titleEl = el.querySelector('.chapter-title-input');
    const descEl  = el.querySelector('.chapter-desc-input');
    chapters.push({
      num:         i + 1,
      title:       titleEl ? titleEl.value.trim() : '',
      description: descEl  ? descEl.value.trim()  : '',
    });
  });
  return chapters;
}

// ── Show / update the thumbnail icon in the entry header ──

function showScenePreview(cid, url) {
  const thumb    = document.getElementById(`scene-thumb-${cid}`);
  const thumbImg = document.getElementById(`scene-thumb-img-${cid}`);
  const popupImg = document.getElementById(`scene-popup-img-${cid}`);
  if (!thumb) return;
  if (thumbImg) thumbImg.src = url;
  if (popupImg) popupImg.src = url;
  thumb.style.display = 'flex';
}

// ── Per-scene image generation ────────────────────────

async function generateSceneImage(cid) {
  const entry  = document.getElementById(`chapter-entry-${cid}`);
  const btn    = document.getElementById(`scene-gen-btn-${cid}`);
  if (!entry || !btn) return;

  // Resolve scene number from badge
  const badge    = entry.querySelector('.chapter-entry-num');
  const sceneNum = parseInt((badge?.textContent || '').replace('Sc. ', '')) || 1;

  // Save the form first so no text is lost and storyId is guaranteed
  await saveMangaDraft();

  const storyId = window._editingStoryId || window._lastStoryId || null;
  if (!storyId) {
    alert('Could not save the manga — please fill in the title and try again.');
    return;
  }

  const apiKey = OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('YOUR_')) { alert('OpenAI API key not configured.'); return; }

  // Credit check
  const currentCredits = getUserCredits();
  if (currentCredits !== null && currentCredits <= 0) {
    _showCreditMsg('No image credits remaining. Contact support to get more.');
    return;
  }

  // Build story context from current form values
  const data = {
    titre:      document.getElementById('f-titre')?.value.trim()     || '',
    genre:      document.getElementById('f-genre')?.value            || 'shonen',
    style:      document.getElementById('f-style')?.value            || 'dynamique',
    heros:      document.getElementById('f-heros')?.value.trim()     || '',
    heroDesc:   document.getElementById('f-hero-desc')?.value.trim() || '',
    univers:    document.getElementById('f-univers')?.value.trim()   || '',
    colorStyle: document.getElementById('f-color-style')?.value      || 'bw',
    bubbles:    document.getElementById('f-bubbles')?.value          !== 'no',
    chapters:   getChaptersData(),
  };
  const imgModel    = getImgModel();
  const quality     = document.getElementById('f-img-quality')?.value || 'medium';
  const profile     = genreProfiles[data.genre]  || genreProfiles.shonen;
  const styleLabels = window.styleLabels || {};
  const styleLabel  = styleLabels[data.style] || data.style;
  const genreLabel  = profile.label || data.genre;

  // Build all prompts and pick the one for this scene
  const allPrompts  = buildImagePrompts(data, window._lastAIContent || null, styleLabel, genreLabel);
  const promptObj   = allPrompts.find(p => p.chapterNum === sceneNum) || allPrompts[0];
  if (!promptObj) { alert('Could not build prompt for this scene.'); return; }

  // ── Build request body ─────────────────────────
  let reqBody;
  if (imgModel === 'dall-e-3') {
    reqBody = { model: 'dall-e-3', prompt: promptObj.prompt, n: 1, size: '1024x1792', quality, response_format: 'b64_json' };
  } else {
    reqBody = { model: 'gpt-image-1', prompt: promptObj.prompt, n: 1, size: '1024x1536', quality };
    if (_heroImageBase64) {
      reqBody.image = `data:${_heroImageMime || 'image/png'};base64,${_heroImageBase64}`;
    }
  }

  // ── Loading state ──────────────────────────────────
  const origLabel = btn.textContent;
  btn.disabled    = true;
  btn.textContent = '⏳';

  try {
    // ── Call OpenAI image API ──────────────────────
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    const b64  = json.data[0].b64_json;

    // Show thumbnail immediately from local base64
    showScenePreview(cid, `data:image/png;base64,${b64}`);

    // ── Upload to storage ──────────────────────────
    const permanentUrl = await _uploadBase64ToStorage(b64, storyId, `chapter-${sceneNum}`);

    if (permanentUrl) {
      showScenePreview(cid, permanentUrl);

      // Upsert: delete old record for this scene then insert new
      await _supabase.from('manga_images')
        .delete()
        .eq('story_id',   storyId)
        .eq('image_type', 'chapter')
        .eq('chapter_num', sceneNum);

      await saveImageToSupabase(storyId, 'chapter', sceneNum, permanentUrl, promptObj.prompt);

      // Spend one credit and show remaining
      const remaining = await spendCredit();
      _showCreditMsg(remaining > 0
        ? `${remaining} image credit${remaining === 1 ? '' : 's'} remaining`
        : 'No credits remaining');

      // Update tile thumbnail for scene 1
      if (sceneNum === 1) {
        const tile = document.getElementById(`manga-tile-${storyId}`);
        if (tile) {
          let tileImg = tile.querySelector('.manga-tile-img');
          if (!tileImg) {
            tileImg = document.createElement('img');
            tileImg.className = 'manga-tile-img';
            tileImg.alt = '';
            tileImg.setAttribute('onerror', "this.style.display='none';this.nextElementSibling.style.display='flex'");
            tile.insertBefore(tileImg, tile.firstChild);
          }
          tileImg.src = permanentUrl;
          const cover = tile.querySelector('.manga-tile-cover');
          if (cover) cover.style.display = 'none';
        }
      }
    }

  } catch (err) {
    console.error('[SceneGen] error:', err);
    btn.title = '❌ ' + (err.message || 'Generation failed');
    alert('Image generation failed: ' + (err.message || 'Unknown error'));
  } finally {
    btn.disabled    = false;
    btn.textContent = origLabel;
  }
}
