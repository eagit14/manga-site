// ── Admin: loadAllMangas, settings ───────────────────────

function openAdminSettings() {
  loadSettingsForm();
  document.getElementById('admin-settings-modal').style.display = 'flex';
}

function closeAdminSettings() {
  document.getElementById('admin-settings-modal').style.display = 'none';
}

function handleAdminSettingsOverlayClick(e) {
  if (e.target === document.getElementById('admin-settings-modal')) closeAdminSettings();
}

function loadSettingsForm() {
  if (!window._isAdmin) return;
  const physToggle  = document.getElementById('setting-physical-enabled');
  const credInput   = document.getElementById('setting-default-credits');
  const scenesInput = document.getElementById('setting-max-scenes');
  const styleArea   = document.getElementById('setting-art-style');
  if (physToggle)  physToggle.checked = window._appSettings?.physical_order_enabled !== false;
  if (credInput)   credInput.value    = window._appSettings?.default_credits ?? 50;
  if (scenesInput) scenesInput.value  = window._appSettings?.max_scenes ?? 24;
  if (styleArea)   styleArea.value    = window._appSettings?.default_art_style ?? '';
}

async function saveAppSettings() {
  if (!_supabase || !window._isAdmin) return;
  const btn = document.getElementById('admin-settings-save-btn');
  const msg = document.getElementById('admin-settings-msg');
  if (btn) btn.disabled = true;
  if (msg) { msg.textContent = ''; msg.className = 'admin-settings-msg'; }

  const updates = {
    physical_order_enabled: document.getElementById('setting-physical-enabled')?.checked ?? true,
    default_credits:        parseInt(document.getElementById('setting-default-credits')?.value) || 50,
    max_scenes:             parseInt(document.getElementById('setting-max-scenes')?.value) || 24,
    default_art_style:      document.getElementById('setting-art-style')?.value ?? '',
  };

  const { error } = await _supabase
    .from('settings')
    .update(updates)
    .eq('id', 'global');

  if (btn) btn.disabled = false;
  if (error) {
    console.error('[Settings] save error:', error.message);
    if (msg) { msg.textContent = '✗ ' + error.message; msg.className = 'admin-settings-msg error'; }
    return;
  }
  Object.assign(window._appSettings, updates);
  _applySettings();
  if (msg) { msg.textContent = '✓ Saved'; msg.className = 'admin-settings-msg success'; }
  setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
}



// Cached admin data — populated by loadAllMangas, consumed by _renderAdminGrid
let _adminStories      = [];
let _adminEmailMap     = {};
let _adminImgMap       = {};
let _adminChapterCount = {};

async function loadAllMangas() {
  const grid = document.getElementById('all-mangas-grid');
  if (!grid || !_supabase || !window._isAdmin) return;

  grid.innerHTML = `<div class="my-mangas-loading">${t('tile_loading')}</div>`;

  const { data: stories, error } = await _supabase
    .from('manga_stories')
    .select('id, title, genre, cover_gradient, created_at, tagline, purchased_at, user_id')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Admin] fetch error:', error.message);
    grid.innerHTML = '<div class="my-mangas-empty"><p>Could not load mangas. Check admin RLS policies.</p></div>';
    return;
  }

  if (!stories || stories.length === 0) {
    grid.innerHTML = '<div class="my-mangas-empty"><div class="my-mangas-empty-icon">🎌</div><p>No mangas generated yet.</p></div>';
    return;
  }

  // Fetch emails for all user_ids
  const userIds = [...new Set(stories.map(s => s.user_id).filter(Boolean))];
  const { data: users } = userIds.length
    ? await _supabase.from('users').select('id, email').in('id', userIds)
    : { data: [] };
  const emailMap = {};
  (users || []).forEach(u => { emailMap[u.id] = u.email; });

  // Fetch images and chapter counts in parallel
  const ids = stories.map(s => s.id);
  const [{ data: images }, { data: chapters }] = await Promise.all([
    ids.length
      ? _supabase.from('manga_images').select('story_id, image_url, image_type, chapter_num').in('story_id', ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? _supabase.from('manga_chapters').select('story_id').in('story_id', ids)
      : Promise.resolve({ data: [] }),
  ]);

  const imgMap = {};
  (images || []).forEach(img => {
    if (!imgMap[img.story_id]) imgMap[img.story_id] = { chapters: {} };
    if (img.image_type === 'chapter') {
      imgMap[img.story_id].chapters[img.chapter_num ?? 0] = img.image_url;
    } else {
      imgMap[img.story_id][img.image_type] = img.image_url;
    }
  });

  const chapterCount = {};
  (chapters || []).forEach(ch => {
    chapterCount[ch.story_id] = (chapterCount[ch.story_id] || 0) + 1;
  });

  _adminStories      = stories;
  _adminEmailMap     = emailMap;
  _adminImgMap       = imgMap;
  _adminChapterCount = chapterCount;

  _renderAdminGrid('');
}

function _renderAdminGrid(query) {
  const grid = document.getElementById('all-mangas-grid');
  if (!grid) return;

  const q = (query || '').toLowerCase().trim();
  const filtered = q
    ? _adminStories.filter(s => {
        const title = (s.title || '').toLowerCase();
        const email = (_adminEmailMap[s.user_id] || '').toLowerCase();
        return title.includes(q) || email.includes(q);
      })
    : _adminStories;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="my-mangas-empty"><p>No results for "' + query + '".</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(story => {
    const grad       = story.cover_gradient || 'linear-gradient(155deg,#1a0505,#7a0f0f,#c0392b)';
    const genreColor = genreProfiles[story.genre]?.badgeColor || '#888';
    const genreLabel = genreProfiles[story.genre]?.label      || story.genre || '—';
    const date       = new Date(story.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const email      = _adminEmailMap[story.user_id] || '—';
    const storyImgs  = _adminImgMap[story.id] || { chapters: {} };
    const sceneUrls  = Object.keys(storyImgs.chapters || {})
      .sort((a, b) => Number(a) - Number(b))
      .map(k => storyImgs.chapters[k]);
    const allUrls        = sceneUrls.filter(Boolean);
    const imgUrlsEncoded = encodeURIComponent(allUrls.join('|'));
    const titleSafe      = (story.title || 'Untitled').replace(/'/g, "\\'");
    const isPurchased    = !!story.purchased_at;
    const thumbUrl       = sceneUrls[0] || '';
    const pageCount      = _adminChapterCount[story.id] || 0;

    const visual = thumbUrl
      ? `<img class="manga-tile-img" src="${thumbUrl}" alt="${story.title}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="manga-tile-cover" style="background:${grad};display:none">${story.title}</div>`
      : `<div class="manga-tile-cover" style="background:${grad}">${story.title}</div>`;

    const statusBadge = isPurchased
      ? `<span class="manga-tile-status status-ordered">${t('tile_status_ordered')}</span>`
      : `<span class="manga-tile-status status-generated">${t('tile_status_generated')}</span>`;

    const viewBtn = allUrls.length
      ? `<div class="manga-tile-order">
           <button class="manga-tile-view-btn" style="width:100%"
             onclick="openMangaViewer('${titleSafe}', decodeURIComponent('${imgUrlsEncoded}'), true)">${t('tile_view')}</button>
         </div>`
      : '';

    return `
      <div class="manga-tile">
        ${visual}
        <div class="manga-tile-body">
          <div class="manga-tile-title">${story.title || 'Untitled'}</div>
          <div class="manga-tile-meta">
            <span class="manga-tile-genre" style="background:${genreColor}">${genreLabel}</span>
            ${pageCount ? `<span class="manga-tile-pages">${pageCount} pages</span>` : ''}
            <span class="manga-tile-date">${date}</span>
          </div>
          <div class="manga-tile-email" title="${email}">👤 ${email}</div>
          ${statusBadge}
          ${story.tagline ? `<p style="font-size:.78rem;color:var(--muted);line-height:1.5;margin-top:.25rem">${story.tagline}</p>` : ''}
          ${viewBtn}
        </div>
      </div>`;
  }).join('');
}
