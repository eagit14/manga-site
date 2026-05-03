// ── Admin: loadAllMangas ─────────────────────────────────

async function loadAllMangas() {
  const grid = document.getElementById('all-mangas-grid');
  if (!grid || !_supabase || !window._isAdmin) return;

  grid.innerHTML = '<div class="my-mangas-loading">Loading all mangas…</div>';

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

  // Fetch cover images
  const ids = stories.map(s => s.id);
  const { data: images } = ids.length
    ? await _supabase.from('manga_images').select('story_id, image_url, image_type').in('story_id', ids)
    : { data: [] };
  const imgMap = {};
  (images || []).forEach(img => {
    if (!imgMap[img.story_id]) imgMap[img.story_id] = {};
    imgMap[img.story_id][img.image_type] = img.image_url;
  });

  grid.innerHTML = stories.map(story => {
    const grad       = story.cover_gradient || 'linear-gradient(155deg,#1a0505,#7a0f0f,#c0392b)';
    const genreColor = genreProfiles[story.genre]?.badgeColor || '#888';
    const genreLabel = genreProfiles[story.genre]?.label      || story.genre || '—';
    const date       = new Date(story.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const email      = emailMap[story.user_id] || '—';
    const storyImgs  = imgMap[story.id] || {};
    const pitchUrl   = storyImgs.pitch   || '';
    const chapterUrl = storyImgs.chapter || '';
    const endingUrl  = storyImgs.ending  || '';
    const imgUrlsEncoded = encodeURIComponent([pitchUrl, chapterUrl, endingUrl].join('|'));
    const titleSafe  = (story.title || 'Untitled').replace(/'/g, "\\'");
    const isPurchased = !!story.purchased_at;

    const visual = pitchUrl
      ? `<img class="manga-tile-img" src="${pitchUrl}" alt="${story.title}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="manga-tile-cover" style="background:${grad};display:none">${story.title}</div>`
      : `<div class="manga-tile-cover" style="background:${grad}">${story.title}</div>`;

    const viewBtn = pitchUrl
      ? `<div class="manga-tile-order">
           <button class="manga-tile-view-btn" style="width:100%"
             onclick="openMangaViewer('${titleSafe}', decodeURIComponent('${imgUrlsEncoded}'), ${isPurchased})">👁 View</button>
         </div>`
      : '';

    return `
      <div class="manga-tile">
        ${visual}
        <div class="manga-tile-body">
          <div class="manga-tile-title">${story.title || 'Untitled'}</div>
          <div class="manga-tile-meta">
            <span class="manga-tile-genre" style="background:${genreColor}">${genreLabel}</span>
            <span class="manga-tile-date">${date}</span>
          </div>
          <div class="manga-tile-email" title="${email}">👤 ${email}</div>
          ${story.tagline ? `<p style="font-size:.78rem;color:var(--muted);line-height:1.5;margin-top:.25rem">${story.tagline}</p>` : ''}
          ${viewBtn}
        </div>
      </div>`;
  }).join('');
}
