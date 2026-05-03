// ── My Mangas: load and render user's mangas from Supabase ──

async function loadMyMangas() {
  const grid = document.getElementById('my-mangas-grid');
  if (!grid || !_supabase) return;

  grid.innerHTML = '<div class="my-mangas-loading">Loading your mangas…</div>';

  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) {
    grid.innerHTML = '<div class="my-mangas-empty"><div class="my-mangas-empty-icon">🔒</div><p>Sign in to see your mangas.</p></div>';
    return;
  }

  // Fetch stories belonging to this user OR with no user_id (legacy rows)
  const { data: stories, error } = await _supabase
    .from('manga_stories')
    .select('id, title, genre, cover_gradient, created_at, tagline, purchased_at')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MyMangas] fetch error:', error.message);
    grid.innerHTML = '<div class="my-mangas-empty"><p>Could not load your mangas.</p></div>';
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

  // Fetch all images for these stories (pitch, chapter, ending)
  const ids = stories.map(s => s.id);
  const { data: images } = ids.length ? await _supabase
    .from('manga_images')
    .select('story_id, image_url, image_type, chapter_num')
    .in('story_id', ids)
    .order('chapter_num', { ascending: true }) : { data: [] };

  // Map: storyId → { pitch, chapter, ending }
  const imgMap = {};
  (images || []).forEach(img => {
    if (!imgMap[img.story_id]) imgMap[img.story_id] = {};
    imgMap[img.story_id][img.image_type] = img.image_url;
  });

  grid.innerHTML = stories.map(story => {
    const grad       = story.cover_gradient || 'linear-gradient(155deg,#1a0505,#7a0f0f,#c0392b)';
    const genreColor = genreProfiles[story.genre]?.badgeColor || '#888';
    const genreLabel = genreProfiles[story.genre]?.label      || story.genre;
    const date       = new Date(story.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const storyImgs  = imgMap[story.id] || {};
    const pitchUrl   = storyImgs.pitch   || '';
    const chapterUrl = storyImgs.chapter || '';
    const endingUrl  = storyImgs.ending  || '';
    const imgUrlsEncoded = encodeURIComponent([pitchUrl, chapterUrl, endingUrl].join('|'));
    const titleSafe   = (story.title || 'Untitled').replace(/'/g, "\\'");
    const storyIdSafe = story.id;
    const isPurchased = !!story.purchased_at;

    const visual = pitchUrl
      ? `<img class="manga-tile-img" src="${pitchUrl}" alt="${story.title}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="manga-tile-cover" style="background:${grad};display:none">${story.title}</div>`
      : `<div class="manga-tile-cover" style="background:${grad}">${story.title}</div>`;

    const actionBtn = isPurchased
      ? `<div class="manga-tile-purchased-actions">
           <button class="manga-tile-view-btn" onclick="openMangaViewer('${titleSafe}', decodeURIComponent('${imgUrlsEncoded}'), true)">👁 View</button>
           <button class="manga-tile-export-btn" onclick="exportMangaPDF('${storyIdSafe}', '${titleSafe}')">📄 Export PDF</button>
         </div>`
      : `<div class="manga-tile-purchased-actions">
           <button class="manga-tile-view-btn" onclick="openMangaViewer('${titleSafe}', decodeURIComponent('${imgUrlsEncoded}'), false)">👁 View</button>
           <button class="manga-tile-order-btn" style="flex:1" onclick="openPaymentFromTile('${titleSafe}', '${grad}', decodeURIComponent('${imgUrlsEncoded}'), '${storyIdSafe}')">🛒 Order</button>
         </div>`;

    return `
      <div class="manga-tile" id="manga-tile-${storyIdSafe}">
        ${visual}
        <button class="manga-tile-delete-btn" onclick="confirmDeleteManga('${storyIdSafe}', '${titleSafe}')" title="Delete manga">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
        <div class="manga-tile-body">
          <div class="manga-tile-title">${story.title || 'Untitled'}</div>
          <div class="manga-tile-meta">
            <span class="manga-tile-genre" style="background:${genreColor}">${genreLabel}</span>
            <span class="manga-tile-date">${date}</span>
          </div>
          ${story.tagline ? `<p style="font-size:.78rem;color:var(--muted);line-height:1.5;margin-top:.25rem">${story.tagline}</p>` : ''}
          <div class="manga-tile-order">${actionBtn}</div>
        </div>
      </div>`;
  }).join('');
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

  if (ok) {
    loadMyMangas();
  } else {
    if (tile) { tile.style.opacity = ''; tile.style.pointerEvents = ''; }
  }
}

let _viewerIdx = 0;
let _viewerImgs = [];

function openMangaViewer(title, imgUrlsStr, purchased) {
  _viewerImgs = imgUrlsStr.split('|').map(u => u.trim()).filter(Boolean);
  _viewerIdx  = 0;
  document.getElementById('viewer-title').textContent = title;

  const labels    = ['Pitch', 'Chapter 1', 'Ending'];
  const draft     = purchased ? '' : '<div class="draft-watermark">DRAFT</div>';
  const track     = document.getElementById('viewer-track');
  const dots      = document.getElementById('viewer-dots');

  track.innerHTML = _viewerImgs.map((src, i) => `
    <div class="viewer-slide${i === 0 ? ' active' : ''}">
      <img src="${src}" alt="${labels[i] || 'Page ' + (i+1)}" />
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
