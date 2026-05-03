// ── localStorage: STORY_KEY, getStories, saveStory, deleteStory, clearAllStories,
//    refreshDataSection, updateDataStats, renderStoriesTable, toggleDetail, replayStory ──

const STORY_KEY = 'manga_stories';

function getStories() {
  try { return JSON.parse(localStorage.getItem(STORY_KEY) || '[]'); }
  catch (_) { return []; }
}

function saveStory(data, aiContent, grad) {
  const stories = getStories();
  const story = {
    id:               String(Date.now()),
    titre:            data.titre,
    genre:            data.genre,
    genre_label:      genreProfiles[data.genre]?.label || data.genre,
    genre_color:      genreProfiles[data.genre]?.badgeColor || '#888',
    style:            data.style,
    heros:            data.heros || '',
    univers:          data.univers || '',
    premise:          data.premise || '',
    synopsis:         aiContent?.synopsis         || '',
    tagline:          aiContent?.tagline          || '',
    hero_description: aiContent?.hero_description || '',
    chapter_titles:   aiContent?.chapter_titles   || [],
    grad:             grad,
    is_ai:            !!aiContent,
    created_at:       new Date().toISOString(),
  };
  stories.unshift(story);         // newest first
  localStorage.setItem(STORY_KEY, JSON.stringify(stories));
  refreshDataSection();
}

function deleteStory(id) {
  const updated = getStories().filter(s => s.id !== id);
  localStorage.setItem(STORY_KEY, JSON.stringify(updated));
  refreshDataSection();
}

function clearAllStories() {
  if (!confirm('Delete all stories? This action cannot be undone.')) return;
  localStorage.removeItem(STORY_KEY);
  refreshDataSection();
}

function refreshDataSection() {
  updateDataStats();
  renderStoriesTable();
}

function updateDataStats() {
  const stories = getStories();
  document.getElementById('stat-total').textContent  = stories.length;
  document.getElementById('stat-ai').textContent     = stories.filter(s => s.is_ai).length;
  const genres = new Set(stories.map(s => s.genre));
  document.getElementById('stat-genres').textContent = genres.size;
  document.getElementById('data-toolbar').style.display = stories.length ? 'flex' : 'none';
}

function renderStoriesTable() {
  const container = document.getElementById('stories-container');
  let stories     = getStories();

  const q      = (document.getElementById('data-search')?.value  || '').toLowerCase();
  const genre  = (document.getElementById('data-filter')?.value  || '');

  if (q)     stories = stories.filter(s =>
    s.titre.toLowerCase().includes(q) ||
    s.heros.toLowerCase().includes(q) ||
    s.synopsis.toLowerCase().includes(q));
  if (genre) stories = stories.filter(s => s.genre === genre);

  if (!stories.length) {
    container.innerHTML = `
      <div class="stories-empty">
        <div class="stories-empty-icon">MANGA</div>
        <p>Aucune histoire créée pour l'instant.<br/>Lance le générateur pour commencer !</p>
        <a href="#creer">✏️ Créer mon premier manga</a>
      </div>`;
    return;
  }

  const rows = stories.map(s => {
    const date = new Date(s.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit' });
    const chapHTML = s.chapter_titles?.length
      ? s.chapter_titles.map((t, i) => `<div class="detail-chapter">CH.${String(i+1).padStart(2,'0')} — ${t}</div>`).join('')
      : '<span style="color:var(--light);font-size:.78rem">—</span>';

    return `
      <tr class="story-row" onclick="toggleDetail('${s.id}')" id="row-${s.id}">
        <td>
          <div class="mini-cover" style="background:${s.grad}">
            <span class="mini-cover-title">${s.titre}</span>
          </div>
        </td>
        <td>
          <div class="story-title-cell">${s.titre}</div>
          ${s.tagline ? `<div class="story-synopsis-preview">${s.tagline}</div>` : ''}
        </td>
        <td><span class="genre-pill" style="background:${s.genre_color}">${s.genre_label}</span></td>
        <td><span class="story-hero-cell">${s.heros || '—'}</span></td>
        <td><span class="story-date-cell">${date}</span></td>
        <td class="story-ai-cell">${s.is_ai ? '<span class="ai-badge">✦ AI</span>' : '<span style="color:var(--light);font-size:.75rem">—</span>'}</td>
        <td onclick="event.stopPropagation()">
          <div class="row-actions">
            <button class="row-btn" onclick="replayStory('${s.id}')">👁 Voir</button>
            <button class="row-btn del" onclick="deleteStory('${s.id}')">🗑</button>
          </div>
        </td>
      </tr>
      <tr class="story-detail-row" id="detail-${s.id}">
        <td colspan="7">
          <div class="detail-grid">
            <div>
              <p class="detail-label">Synopsis</p>
              <p class="detail-text">${s.synopsis || s.premise || '—'}</p>
            </div>
            <div>
              <p class="detail-label">Chapitres</p>
              <div class="detail-chapters">${chapHTML}</div>
            </div>
            ${s.hero_description ? `
            <div>
              <p class="detail-label">Héros — ${s.heros}</p>
              <p class="detail-text">${s.hero_description}</p>
            </div>` : ''}
            ${s.univers ? `
            <div>
              <p class="detail-label">Univers</p>
              <p class="detail-text">${s.univers}</p>
            </div>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="stories-table">
      <thead>
        <tr>
          <th>Cover</th>
          <th>Titre</th>
          <th>Genre</th>
          <th>Héros</th>
          <th>Date</th>
          <th>IA</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function toggleDetail(id) {
  const row    = document.getElementById(`row-${id}`);
  const detail = document.getElementById(`detail-${id}`);
  const isOpen = detail.classList.contains('open');
  // close all others
  document.querySelectorAll('.story-detail-row.open').forEach(r => {
    r.classList.remove('open');
    document.getElementById('row-' + r.id.replace('detail-', '')).classList.remove('expanded');
  });
  if (!isOpen) {
    detail.classList.add('open');
    row.classList.add('expanded');
  }
}

function replayStory(id) {
  const story = getStories().find(s => s.id === id);
  if (!story) return;
  const aiContent = story.is_ai ? {
    synopsis:         story.synopsis,
    tagline:          story.tagline,
    hero_description: story.hero_description,
    chapter_titles:   story.chapter_titles,
  } : null;
  buildAndShowResult({
    titre:     story.titre,
    genre:     story.genre,
    style:     story.style,
    heros:     story.heros,
    heroDesc:  story.hero_description,
    univers:   story.univers,
    premise:   story.premise,
    _isReplay: true,
  }, aiContent);
  document.getElementById('creer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
