// ── My Mangas: load and render user's mangas from Supabase ──

async function loadMyMangas() {
  const grid = document.getElementById('my-mangas-grid');
  if (!grid || !_supabase) return;

  grid.innerHTML = `<div class="my-mangas-loading">${t('tile_loading')}</div>`;

  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) {
    grid.innerHTML = '<div class="my-mangas-empty"><div class="my-mangas-empty-icon">🔒</div><p>Sign in to see your mangas.</p></div>';
    return;
  }

  const { data: stories, error } = await _supabase
    .from('manga_stories')
    .select('id, title, genre, cover_gradient, created_at, tagline, purchased_at, color_style')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MyMangas] fetch error:', error.code, error.message, error.details, error.hint);
    grid.innerHTML = `<div class="my-mangas-empty"><p>Could not load your mangas.</p><small style="color:#888">${error.message}</small></div>`;
    return;
  }

  if (!stories || stories.length === 0) {
    grid.innerHTML = `
      <div class="my-mangas-empty" id="my-mangas-empty">
        <div class="my-mangas-empty-icon">🎌</div>
        <p>No mangas yet — <a href="#creer">create your first one!</a></p>
      </div>`;
    return;
  }

  const ids = stories.map(s => s.id);

  // Fetch images and chapter counts in parallel
  const [{ data: images }, { data: chapters }] = await Promise.all([
    _supabase.from('manga_images')
      .select('story_id, image_url, image_type, chapter_num')
      .in('story_id', ids)
      .order('chapter_num', { ascending: true }),
    _supabase.from('manga_chapters')
      .select('story_id')
      .in('story_id', ids),
  ]);

  // Map: storyId → { chapters: { chapterNum: url } }
  const imgMap = {};
  (images || []).forEach(img => {
    if (!imgMap[img.story_id]) imgMap[img.story_id] = { chapters: {} };
    if (img.image_type === 'chapter' && img.chapter_num > 0) {
      imgMap[img.story_id].chapters[img.chapter_num] = img.image_url;
    } else {
      imgMap[img.story_id][img.image_type] = img.image_url;
    }
  });

  // Map: storyId → expected scene count
  const chapterCountMap = {};
  (chapters || []).forEach(ch => {
    chapterCountMap[ch.story_id] = (chapterCountMap[ch.story_id] || 0) + 1;
  });

  window._tileImageUrls = window._tileImageUrls || {};

  grid.innerHTML = stories.map(story => {
    const grad       = story.cover_gradient || 'linear-gradient(155deg,#1a0505,#7a0f0f,#c0392b)';
    const genreColor = genreProfiles[story.genre]?.badgeColor || '#888';
    const genreLabel = genreProfiles[story.genre]?.label      || story.genre;
    const date       = new Date(story.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const storyImgs  = imgMap[story.id] || { chapters: {} };
    const sceneUrls  = Object.keys(storyImgs.chapters || {})
      .sort((a, b) => Number(a) - Number(b))
      .map(k => storyImgs.chapters[k]);
    const allUrls        = sceneUrls.filter(Boolean);
    const imgUrlsEncoded = encodeURIComponent(allUrls.join('|'));
    const titleSafe      = (story.title || 'Untitled').replace(/'/g, "\\'");
    const storyIdSafe    = story.id;
    const isPurchased    = !!story.purchased_at;

    window._tileImageUrls[story.id] = allUrls.slice();

    const expectedScenes = chapterCountMap[story.id] || 0;
    const allImagesReady = expectedScenes > 0 && allUrls.length >= expectedScenes;

    const thumbUrl = sceneUrls[0] || '';
    const visual = thumbUrl
      ? `<img class="manga-tile-img" src="${thumbUrl}" alt="${story.title}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="manga-tile-cover" style="background:${grad};display:none">${story.title}</div>`
      : `<div class="manga-tile-cover" style="background:${grad}">${story.title}</div>`;

    const gradSafe     = grad.replace(/'/g, "\\'");
    const thumbSafe    = (sceneUrls[0] || '').replace(/'/g, "\\'");
    const colorStyleSafe = (story.color_style || 'bw').replace(/'/g, "\\'");
    const physicalCall = `openPhysicalOrder({storyId:'${storyIdSafe}',title:'${titleSafe}',grad:'${gradSafe}',numScenes:${allUrls.length},thumbUrl:'${thumbSafe}',colorStyle:'${colorStyleSafe}'})`;

    let actionBtn;
    if (!allImagesReady) {
      actionBtn = `<div class="manga-tile-no-images">${t('tile_generate_unlock')}</div>`;
    } else if (isPurchased) {
      actionBtn = `
        <div class="manga-tile-purchased-actions">
          <button class="manga-tile-view-btn" onclick="openMangaViewerFromTile('${storyIdSafe}', '${titleSafe}', true)">${t('tile_view')}</button>
          <button class="manga-tile-export-btn" onclick="exportMangaPDF('${storyIdSafe}', '${titleSafe}', this)">${t('tile_export_pdf')}</button>
          <button class="manga-tile-view-btn" style="grid-column:1/-1" onclick="viewCover('${storyIdSafe}', this)">${t('tile_view_cover')}</button>
        </div>`;
    } else {
      const physBtn = window._appSettings?.physical_order_enabled !== false
        ? `<button class="manga-tile-physical-btn" onclick="${physicalCall}">${t('tile_order_physical')}</button>`
        : '';
      actionBtn = `
        <div class="manga-tile-purchased-actions">
          <button class="manga-tile-view-btn" onclick="openMangaViewerFromTile('${storyIdSafe}', '${titleSafe}', false)">${t('tile_view')}</button>
          <button class="manga-tile-view-btn" onclick="viewCover('${storyIdSafe}', this)">${t('tile_view_cover')}</button>
          <button class="manga-tile-order-btn" onclick="openPaymentFromTile('${titleSafe}', '${grad}', decodeURIComponent('${imgUrlsEncoded}'), '${storyIdSafe}')">${t('tile_order_digital')}</button>
          ${physBtn}
        </div>`;
    }

    return `
      <div class="manga-tile" id="manga-tile-${storyIdSafe}">
        ${visual}
        <div class="manga-tile-actions">
          <button class="manga-tile-duplicate-btn" onclick="confirmDuplicateManga('${storyIdSafe}', '${titleSafe}')" title="Duplicate manga">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button class="manga-tile-edit-btn" ${isPurchased ? `disabled title="${t('tile_cannot_edit')}"` : `onclick="openEditForm('${storyIdSafe}')" title="Edit manga"`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="manga-tile-delete-btn" onclick="confirmDeleteManga('${storyIdSafe}', '${titleSafe}')" title="Delete manga">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
        <div class="manga-tile-body">
          <div class="manga-tile-title">${story.title || 'Untitled'}</div>
          <div class="manga-tile-meta">
            <span class="manga-tile-genre" style="background:${genreColor}">${genreLabel}</span>
            <span class="manga-tile-pages">${expectedScenes} pages</span>
            <span class="manga-tile-date">${date}</span>
          </div>
          ${story.tagline ? `<p style="font-size:.78rem;color:var(--muted);line-height:1.5;margin-top:.25rem">${story.tagline}</p>` : ''}
          <div class="manga-tile-order">${actionBtn}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Duplicate confirmation modal ──────────────────────

let _pendingDupId    = null;
let _pendingDupTitle = null;

function _ensureDuplicateModal() {
  if (document.getElementById('duplicate-confirm-name')) return;
  const existing = document.getElementById('duplicate-modal');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'duplicate-modal';
  div.className = 'payment-overlay';
  div.style.display = 'none';
  div.innerHTML = `
    <div class="delete-confirm-card">
      <div class="delete-confirm-icon">📋</div>
      <h3 class="delete-confirm-title">Duplicate Manga?</h3>
      <p class="delete-confirm-msg">Create a copy of <strong id="duplicate-confirm-name"></strong>?</p>
      <div class="delete-confirm-actions">
        <button class="action-btn" onclick="closeDuplicateModal()">Cancel</button>
        <button class="action-btn" style="background:#1a1a2e;color:#fff" onclick="_executeDuplicate()">Duplicate</button>
      </div>
    </div>`;
  document.body.appendChild(div);
}

function confirmDuplicateManga(storyId, title) {
  _ensureDuplicateModal();
  _pendingDupId    = storyId;
  _pendingDupTitle = title;
  document.getElementById('duplicate-confirm-name').textContent = title;
  document.getElementById('duplicate-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeDuplicateModal() {
  document.getElementById('duplicate-modal').style.display = 'none';
  document.body.style.overflow = '';
  _pendingDupId    = null;
  _pendingDupTitle = null;
}

function _executeDuplicate() {
  const id    = _pendingDupId;
  const title = _pendingDupTitle;
  closeDuplicateModal();
  if (!id) return;
  duplicateManga(id, title, { disabled: false, innerHTML: '' });
}

// ── Duplicate manga ───────────────────────────────────

async function duplicateManga(storyId, title, btn) {
  if (!_supabase) return;

  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳';

  try {
    const { data: { user } } = await _supabase.auth.getUser();

    const [{ data: story }, { data: chaps }, { data: imgs }] = await Promise.all([
      _supabase.from('manga_stories').select('*').eq('id', storyId).single(),
      _supabase.from('manga_chapters').select('*').eq('story_id', storyId).order('chapter_num'),
      _supabase.from('manga_images').select('*').eq('story_id', storyId),
    ]);

    if (!story) throw new Error('Source manga not found');

    // Insert new story
    const { id: _oldId, created_at: _ca, updated_at: _ua, purchased_at: _pa, ...storyFields } = story;
    const { data: newStory, error: storyErr } = await _supabase
      .from('manga_stories')
      .insert({ ...storyFields, title: story.title + ' [COPY]', user_id: user?.id || story.user_id })
      .select('id')
      .single();
    if (storyErr) throw storyErr;

    const newId = newStory.id;

    // Copy chapters
    if (chaps?.length) {
      await _supabase.from('manga_chapters').insert(
        chaps.map(({ id: _id, ...ch }) => ({ ...ch, story_id: newId }))
      );
    }

    // Copy image records (same URLs — no re-upload needed)
    if (imgs?.length) {
      await _supabase.from('manga_images').insert(
        imgs.map(({ id: _id, ...img }) => ({ ...img, story_id: newId }))
      );
    }

    await loadMyMangas();

  } catch (err) {
    console.error('[Duplicate] error:', err);
    alert('Could not duplicate: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

function confirmDeleteManga(storyId, title) {
  document.getElementById('delete-confirm-name').textContent = title;
  document.getElementById('delete-confirm-btn').onclick = () => _doDeleteManga(storyId, title);
  document.getElementById('delete-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
  document.body.style.overflow = '';
}

async function _doDeleteManga(storyId, title) {
  closeDeleteModal();
  const tile = document.getElementById(`manga-tile-${storyId}`);
  if (tile) { tile.style.opacity = '.4'; tile.style.pointerEvents = 'none'; }

  let ok = false;
  try {
    const { data: files } = await _supabase.storage.from('manga-images').list(storyId);
    if (files && files.length > 0) {
      await _supabase.storage.from('manga-images').remove(files.map(f => `${storyId}/${f.name}`));
    }
    await _supabase.from('manga_images').delete().eq('story_id', storyId);
    await _supabase.from('manga_chapters').delete().eq('story_id', storyId);
    const { error } = await _supabase.from('manga_stories').delete().eq('id', storyId);
    if (!error) ok = true;
    else console.error('[Delete]', error.message);
  } catch (err) {
    console.error('[Delete] unexpected error:', err);
  }

  if (ok) loadMyMangas();
  else if (tile) { tile.style.opacity = ''; tile.style.pointerEvents = ''; }
}

function openMangaViewerFromTile(storyId, title, purchased) {
  const urls = (window._tileImageUrls || {})[storyId] || [];
  openMangaViewer(title, urls.join('|'), purchased);
}

let _viewerIdx = 0;
let _viewerImgs = [];

function openMangaViewer(title, imgUrlsStr, purchased) {
  _viewerImgs = imgUrlsStr.split('|').map(u => u.trim()).filter(Boolean);
  _viewerIdx  = 0;
  document.getElementById('viewer-title').textContent = title;

  const draft = purchased ? '' : '<div class="draft-watermark">DRAFT</div>';
  const track = document.getElementById('viewer-track');
  const dots  = document.getElementById('viewer-dots');

  track.innerHTML = _viewerImgs.map((src, i) => `
    <div class="viewer-slide${i === 0 ? ' active' : ''}">
      <img src="${src}" alt="Scene ${i + 1}" />
      ${draft}
    </div>`).join('');

  dots.innerHTML = _viewerImgs.map((_, i) =>
    `<button class="viewer-dot${i === 0 ? ' active' : ''}" onclick="viewerGoTo(${i})"></button>`
  ).join('');

  document.getElementById('viewer-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeMangaViewer() {
  document.getElementById('viewer-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function handleViewerOverlayClick(e) {
  if (e.target === document.getElementById('viewer-modal')) closeMangaViewer();
}

function viewerNav(dir) {
  viewerGoTo((_viewerIdx + dir + _viewerImgs.length) % _viewerImgs.length);
}

function viewerGoTo(idx) {
  const slides = document.querySelectorAll('.viewer-slide');
  const dots   = document.querySelectorAll('.viewer-dot');
  slides.forEach((s, i) => s.classList.toggle('active', i === idx));
  dots.forEach((d, i)   => d.classList.toggle('active', i === idx));
  _viewerIdx = idx;
}

// openPaymentFromTile is defined in stripe.js — do not redefine here
