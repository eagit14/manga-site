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
      ? `<img class="manga-tile-img" src="${pitchUrl}" alt="${story.title}" loading="lazy" />`
      : `<div class="manga-tile-cover" style="background:${grad}">${story.title}</div>`;

    const actionBtn = isPurchased
      ? `<button class="manga-tile-export-btn" onclick="exportMangaPDF('${storyIdSafe}', '${titleSafe}')">📄 Export PDF</button>`
      : `<button class="manga-tile-order-btn" onclick="openPaymentFromTile('${titleSafe}', '${grad}', decodeURIComponent('${imgUrlsEncoded}'), '${storyIdSafe}')">🛒 Order this Manga</button>`;

    return `
      <div class="manga-tile">
        ${visual}
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

// openPaymentFromTile is defined in stripe.js — do not redefine here
