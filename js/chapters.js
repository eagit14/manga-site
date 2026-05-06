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
      <span class="chapter-drag-handle" title="Drag to reorder">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
          <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
          <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
        </svg>
      </span>
      <span class="chapter-entry-num">Sc. ${num}</span>
      <div class="scene-medium-toggle" id="scene-medium-toggle-${cid}">
        <button type="button" class="scene-medium-btn active" id="scene-medium-manga-${cid}" onclick="_setSceneMedium(${cid},'manga')" title="Manga style">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
            <rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>
          </svg>
        </button>
        <button type="button" class="scene-medium-btn" id="scene-medium-cartoon-${cid}" onclick="_setSceneMedium(${cid},'cartoon')" title="Cartoon style">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>
      </div>
      <div class="scene-medium-toggle" id="scene-color-toggle-${cid}">
        <button type="button" class="scene-medium-btn active" id="scene-color-bw-${cid}" onclick="_setSceneColor(${cid},'bw')" title="Black &amp; White">
          <svg width="13" height="13" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/>
            <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" stroke="none"/>
          </svg>
        </button>
        <button type="button" class="scene-medium-btn" id="scene-color-color-${cid}" onclick="_setSceneColor(${cid},'color')" title="Full Color">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="15.5" cy="10" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="15.5" cy="14" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="8.5" cy="14" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </div>
      <input class="form-input chapter-title-input" id="ch-title-${cid}" type="text" placeholder="Scene title…" maxlength="80" />
      <div class="scene-thumb" id="scene-thumb-${cid}" style="display:none" title="Hover to preview">
        <img id="scene-thumb-img-${cid}" alt="" />
        <div class="scene-thumb-popup">
          <img id="scene-popup-img-${cid}" alt="Scene preview" />
          <div class="draft-watermark">DRAFT</div>
        </div>
      </div>
      <button type="button" class="scene-gen-img-btn" id="scene-gen-btn-${cid}" onclick="generateSceneImage(${cid})">🎨 Generate</button>
      <span class="scene-gen-msg" id="scene-gen-msg-${cid}"></span>
      <input type="file" id="scene-attach-input-${cid}" accept="image/*" style="display:none" onchange="_handleSceneAttach(${cid}, this)" />
      <button type="button" class="scene-attach-btn" id="scene-attach-btn-${cid}" onclick="attachSceneImage(${cid})" title="Attach image">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>
      <button type="button" class="chapter-remove-btn" onclick="removeChapter(${cid})" title="Remove">✕</button>
    </div>
    <textarea class="form-textarea chapter-desc-input" id="ch-desc-${cid}" rows="2" placeholder="Scene description…"></textarea>`;
  list.appendChild(div);
  updateChapterUI();
  _initChapterDrag();
  div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Drag-and-drop reordering ──────────────────────────

let _dragSrc        = null;
let _dragFromHandle = false;
let _preDragOrder   = []; // [{cid, oldNum}] captured at dragstart

function _initChapterDrag() {
  const list = document.getElementById('chapters-list');
  if (!list || list._dragInited) return;
  list._dragInited = true;

  list.addEventListener('mousedown', e => {
    _dragFromHandle = !!e.target.closest('.chapter-drag-handle');
    const entry = e.target.closest('.chapter-entry');
    if (entry) entry.draggable = _dragFromHandle;
  });

  list.addEventListener('dragstart', e => {
    if (!_dragFromHandle) { e.preventDefault(); return; }
    _dragSrc = e.target.closest('.chapter-entry');
    if (!_dragSrc) return;

    // Snapshot cid → current chapter_num before anything moves
    _preDragOrder = Array.from(list.querySelectorAll('.chapter-entry')).map(el => {
      const cid   = el.id.replace('chapter-entry-', '');
      const badge = el.querySelector('.chapter-entry-num');
      const num   = parseInt((badge?.textContent || '').replace('Sc. ', '')) || 1;
      return { cid, num };
    });

    _dragSrc.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    if (!_dragSrc) return;
    const target = e.target.closest('.chapter-entry');
    if (!target || target === _dragSrc) return;
    const rect = target.getBoundingClientRect();
    if (e.clientY < rect.top + rect.height / 2) {
      list.insertBefore(_dragSrc, target);
    } else {
      list.insertBefore(_dragSrc, target.nextSibling);
    }
  });

  list.addEventListener('dragend', async () => {
    if (_dragSrc) {
      _dragSrc.classList.remove('dragging');
      _dragSrc.draggable = false;
      _dragSrc = null;
    }

    // Build reorder map: cid → {oldNum, newNum}
    const cidToOld = Object.fromEntries(_preDragOrder.map(({ cid, num }) => [cid, num]));
    const reorderMap = Array.from(list.querySelectorAll('.chapter-entry')).map((el, i) => {
      const cid = el.id.replace('chapter-entry-', '');
      return { cid, oldNum: cidToOld[cid] ?? (i + 1), newNum: i + 1 };
    });

    renumberChapters();
    saveMangaDraft();

    // Sync images only if the order actually changed
    const storyId   = window._editingStoryId || window._lastStoryId || null;
    const hasChange = reorderMap.some(r => r.oldNum !== r.newNum);
    if (!storyId || !_supabase || !hasChange) return;

    // Fetch current image URLs from DB (source of truth)
    const { data: imgs } = await _supabase
      .from('manga_images')
      .select('chapter_num, image_url')
      .eq('story_id',   storyId)
      .eq('image_type', 'chapter');

    if (!imgs || !imgs.length) return;

    const oldNumToUrl = Object.fromEntries(imgs.map(img => [img.chapter_num, img.image_url]));

    // Delete chapter images then re-insert with correct chapter_nums
    await _supabase.from('manga_images')
      .delete()
      .eq('story_id',   storyId)
      .eq('image_type', 'chapter');

    const newRows = reorderMap
      .map(r => ({ chapter_num: r.newNum, url: oldNumToUrl[r.oldNum] }))
      .filter(r => r.url);

    if (newRows.length) {
      await _supabase.from('manga_images').insert(
        newRows.map(r => ({
          story_id:    storyId,
          image_type:  'chapter',
          chapter_num: r.chapter_num,
          image_url:   r.url,
          prompt_used: null,
        }))
      );
    }

    // Update viewer URL map to reflect new order
    if (window._tileImageUrls) {
      const arr = [];
      reorderMap.forEach(r => { arr[r.newNum - 1] = oldNumToUrl[r.oldNum] || ''; });
      window._tileImageUrls[storyId] = arr.filter(Boolean);
    }
  });
}

let _pendingRemoveCid = null;

function removeChapter(cid) {
  _pendingRemoveCid = cid;
  const entry = document.getElementById(`chapter-entry-${cid}`);
  const badge = entry?.querySelector('.chapter-entry-num');
  const label = badge?.textContent || 'this scene';
  const titleEl = entry?.querySelector('.chapter-title-input');
  const title = titleEl?.value?.trim();
  document.getElementById('remove-scene-label').textContent = title ? `${label} — "${title}"` : label;
  document.getElementById('remove-scene-modal').style.display = 'flex';
}

function closeRemoveSceneModal() {
  _pendingRemoveCid = null;
  document.getElementById('remove-scene-modal').style.display = 'none';
}

function _executeRemoveChapter() {
  if (_pendingRemoveCid === null) return;
  const el = document.getElementById(`chapter-entry-${_pendingRemoveCid}`);
  if (el) el.remove();
  _pendingRemoveCid = null;
  document.getElementById('remove-scene-modal').style.display = 'none';
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

function _setSceneMedium(cid, medium) {
  document.getElementById(`scene-medium-manga-${cid}`)?.classList.toggle('active', medium === 'manga');
  document.getElementById(`scene-medium-cartoon-${cid}`)?.classList.toggle('active', medium === 'cartoon');
}

function _getSceneMedium(entry) {
  const cartoonBtn = entry.querySelector('[id^="scene-medium-cartoon-"]');
  return cartoonBtn?.classList.contains('active') ? 'cartoon' : 'manga';
}

function _setSceneColor(cid, colorStyle) {
  document.getElementById(`scene-color-bw-${cid}`)?.classList.toggle('active', colorStyle === 'bw');
  document.getElementById(`scene-color-color-${cid}`)?.classList.toggle('active', colorStyle === 'color');
}

function _getSceneColor(entry) {
  const colorBtn = entry.querySelector('[id^="scene-color-color-"]');
  return colorBtn?.classList.contains('active') ? 'color' : 'bw';
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
      medium:      _getSceneMedium(el),
      colorStyle:  _getSceneColor(el),
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

  // Title required
  const titreVal = document.getElementById('f-titre')?.value.trim();
  if (!titreVal) {
    const titreErr = document.getElementById('err-titre');
    if (titreErr) titreErr.classList.add('show');
    document.getElementById('f-titre')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('f-titre')?.focus();
    return;
  }

  // Hero photo required
  if (!_heroImageBase64) {
    const heroPhotoErr = document.getElementById('err-hero-photo');
    if (heroPhotoErr) heroPhotoErr.classList.add('show');
    document.getElementById('hero-upload-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Credit check
  const currentCredits = getUserCredits();
  if (currentCredits !== null && currentCredits <= 0) {
    _showCreditMsg('No image credits remaining. Contact support to get more.');
    return;
  }

  // Build story context from current form values
  const data = {
    titre:      document.getElementById('f-titre')?.value.trim()      || '',
    genre:      document.getElementById('f-genre')?.value             || 'shonen',
    style:      document.getElementById('f-style')?.value             || 'dynamique',
    heros:      document.getElementById('f-heros')?.value.trim()      || '',
    heroDesc:   document.getElementById('f-hero-desc')?.value.trim()  || '',
    univers:    document.getElementById('f-univers')?.value.trim()    || '',
    colorStyle: _getSceneColor(entry),
    bubbles:    document.getElementById('f-bubbles')?.value           !== 'no',
    medium:     _getSceneMedium(entry),
    char2Name:  document.getElementById('f-char2-name')?.value.trim() || null,
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

  // ── Loading state ──────────────────────────────────
  const origLabel  = btn.textContent;
  const msgEl      = document.getElementById(`scene-gen-msg-${cid}`);
  btn.disabled     = true;
  btn.textContent  = '⏳';
  if (msgEl) msgEl.textContent = 'Generating…';

  // Clear old thumbnail immediately so stale image doesn't linger
  const _oldThumb    = document.getElementById(`scene-thumb-${cid}`);
  const _oldThumbImg = document.getElementById(`scene-thumb-img-${cid}`);
  const _oldPopupImg = document.getElementById(`scene-popup-img-${cid}`);
  if (_oldThumb)    _oldThumb.style.display = 'none';
  if (_oldThumbImg) _oldThumbImg.src = '';
  if (_oldPopupImg) _oldPopupImg.src = '';

  try {
    // ── Fetch dialogue lines when not cached (e.g. editing existing story) ──
    if (promptObj.hasBubbles && !promptObj.dialogueLines?.length) {
      const ch = (data.chapters || []).find(c => c.num === sceneNum) || {};
      promptObj.dialogueLines = await fetchDialogueForScene(apiKey, ch.title || `Scene ${sceneNum}`, ch.description || '');
    }

    // ── Call OpenAI image API (passes hero photo when available) ──────
    let b64 = await _generateSingleImage(apiKey, promptObj.prompt, quality, imgModel, promptObj.includeChar2 || false, promptObj.includeHero !== false);
    if (promptObj.hasBubbles && promptObj.dialogueLines?.length) {
      b64 = await overlayBubbles(b64, promptObj.panelCount || 4, promptObj.dialogueLines);
    }

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

      // Regenerate cached cover PDF in the background
      if (typeof _triggerCoverPreGeneration === 'function') {
        _triggerCoverPreGeneration(storyId).catch(err => console.error('[Cover] trigger failed:', err));
      }

      // Keep the viewer URL map in sync so View button shows fresh images
      if (window._tileImageUrls) {
        const arr = window._tileImageUrls[storyId] || [];
        arr[sceneNum - 1] = permanentUrl;
        window._tileImageUrls[storyId] = arr;
      }

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
    if (msgEl) msgEl.textContent = '';
  }
}

// ── Attach a local image to a scene ──────────────────

function attachSceneImage(cid) {
  document.getElementById(`scene-attach-input-${cid}`)?.click();
}

async function _handleSceneAttach(cid, input) {
  const file = input.files[0];
  if (!file) return;

  const btn      = document.getElementById(`scene-attach-btn-${cid}`);
  const origHTML = btn.innerHTML;
  btn.disabled   = true;
  btn.innerHTML  = '⏳';

  // Clear old thumbnail immediately
  const oldThumb    = document.getElementById(`scene-thumb-${cid}`);
  const oldThumbImg = document.getElementById(`scene-thumb-img-${cid}`);
  const oldPopupImg = document.getElementById(`scene-popup-img-${cid}`);
  if (oldThumb)    oldThumb.style.display = 'none';
  if (oldThumbImg) oldThumbImg.src = '';
  if (oldPopupImg) oldPopupImg.src = '';

  try {
    await saveMangaDraft();
    const storyId = window._editingStoryId || window._lastStoryId || null;
    if (!storyId) { alert('Could not save the manga — please fill in the title and try again.'); return; }

    const entry    = document.getElementById(`chapter-entry-${cid}`);
    const badge    = entry?.querySelector('.chapter-entry-num');
    const sceneNum = parseInt((badge?.textContent || '').replace('Sc. ', '')) || 1;

    // Read file as base64
    const b64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Preview immediately from local data
    showScenePreview(cid, `data:${file.type};base64,${b64}`);

    const permanentUrl = await _uploadBase64ToStorage(b64, storyId, `chapter-${sceneNum}`);
    if (permanentUrl) {
      showScenePreview(cid, permanentUrl);

      // Upsert DB record
      await _supabase.from('manga_images')
        .delete()
        .eq('story_id',    storyId)
        .eq('image_type',  'chapter')
        .eq('chapter_num', sceneNum);
      await saveImageToSupabase(storyId, 'chapter', sceneNum, permanentUrl, null);

      // Regenerate cached cover PDF in the background
      if (typeof _triggerCoverPreGeneration === 'function') {
        _triggerCoverPreGeneration(storyId).catch(err => console.error('[Cover] trigger failed:', err));
      }

      // Keep viewer URL map in sync
      if (window._tileImageUrls) {
        const arr = window._tileImageUrls[storyId] || [];
        arr[sceneNum - 1] = permanentUrl;
        window._tileImageUrls[storyId] = arr;
      }

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
    console.error('[Attach] error:', err);
    alert('Could not attach image: ' + (err.message || 'Unknown error'));
  } finally {
    btn.disabled  = false;
    btn.innerHTML = origHTML;
    input.value   = '';
  }
}
