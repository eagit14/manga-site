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
  let storyId;
  if (window._editingStoryId) {
    storyId = await updateStoryInSupabase(window._editingStoryId, data, aiContent, grad);
    cancelEdit();
  } else {
    storyId = await saveStoryToSupabase(data, aiContent, grad);
  }
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
  cancelEdit();
  document.getElementById('creator-result').style.display = 'none';
  document.getElementById('creator-form-card').style.display = 'block';
  document.getElementById('creator-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Edit existing manga ────────────────────────────────────

window._editingStoryId = null;

async function openEditForm(storyId) {
  if (!_supabase || !storyId) return;

  const card = document.getElementById('creator-form-card');

  // Scroll to form and show loading state
  document.getElementById('creer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  card.style.opacity = '.45';
  card.style.pointerEvents = 'none';

  try {
    const [{ data: story }, { data: chapters }] = await Promise.all([
      _supabase.from('manga_stories')
        .select('title, genre, art_style, hero_name, hero_desc, universe, pitch, ending')
        .eq('id', storyId).single(),
      _supabase.from('manga_chapters')
        .select('chapter_num, title, description')
        .eq('story_id', storyId)
        .order('chapter_num', { ascending: true }),
    ]);

    if (!story) return;

    // Fill form fields
    document.getElementById('f-titre').value     = story.title     || '';
    document.getElementById('f-genre').value     = story.genre     || 'shonen';
    document.getElementById('f-style').value     = story.art_style || 'dynamique';
    document.getElementById('f-heros').value     = story.hero_name || '';
    document.getElementById('f-hero-desc').value = story.hero_desc || '';
    document.getElementById('f-univers').value   = story.universe  || '';
    document.getElementById('f-premise').value   = story.pitch     || '';
    document.getElementById('f-fin').value       = story.ending    || '';

    // Replace chapters
    document.querySelectorAll('.chapter-entry').forEach(el => el.remove());
    updateChapterUI();
    (chapters || []).forEach(() => addChapter());
    document.querySelectorAll('.chapter-entry').forEach((entry, i) => {
      const ch = (chapters || [])[i];
      if (!ch) return;
      const t = entry.querySelector('.chapter-title-input');
      const d = entry.querySelector('.chapter-desc-input');
      if (t) t.value = ch.title       || '';
      if (d) d.value = ch.description || '';
    });

    // Activate edit mode
    window._editingStoryId = storyId;
    document.getElementById('gen-btn').textContent = '🔄 Update my Manga!';
    document.getElementById('edit-mode-title').textContent = story.title || 'Untitled';
    document.getElementById('edit-mode-banner').style.display = 'flex';

    // Ensure form is visible
    document.getElementById('creator-result').style.display = 'none';
    card.style.display = 'block';

  } finally {
    card.style.opacity = '';
    card.style.pointerEvents = '';
  }
}

function cancelEdit() {
  window._editingStoryId = null;
  document.getElementById('gen-btn').textContent = '🎨 Generate my Manga!';
  const banner = document.getElementById('edit-mode-banner');
  if (banner) banner.style.display = 'none';
}

function copySynopsis(text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

// ── Surprise Me ───────────────────────────────────────────

const SURPRISE_SEEDS = [
  {
    title: "The Cartographer's Curse",
    hero: 'Sora', universe: 'Feudal Japan with hidden supernatural layers',
    genre: 'seinen', style: 'sombre',
    heroDesc: "A solitary cartographer haunted by insomnia and an obsession with borders between worlds. Methodical and cold — until the maps begin drawing themselves.",
    pitch: "Every map Sora draws of a place she has never visited materialises into reality within a week. When she accidentally draws a village full of people who should have died a century ago, they begin asking her to come find them — scrawling messages directly onto her parchment at night.",
    chapter: { title: 'The First Territory', desc: "Sora discovers the first map she drew as a child — a place she invented — has existed for decades. Residents have been waiting for their creator." },
    ending: "Sora must erase the most beautiful map she ever drew — the one containing everyone she ever lost — to seal the boundary between creation and reality forever.",
  },
  {
    title: 'Last Signal',
    hero: 'Kaito', universe: 'Deep space research station, year 2187',
    genre: 'sf', style: 'sombre',
    heroDesc: "A communications officer aboard a long-range survey vessel — rational, precise, and deeply alone. He volunteered for this mission to escape something on Earth he refuses to name.",
    pitch: "While monitoring routine frequencies, Kaito intercepts a distress signal encoded in his own voice, timestamped twenty-three years from now. The message contains coordinates, a single warning — \"don't land\" — and then silence. The ship is already descending.",
    chapter: { title: 'Frequency Zero', desc: "Kaito decrypts the full message. It's not just a warning — it's a confession. His future self describes committing a crime that hasn't happened yet, and blaming the planet below." },
    ending: "Kaito lands anyway. What he finds on the planet is not a monster — it is a version of humanity that chose to stop. He must decide whether to warn Earth or protect their silence.",
  },
  {
    title: 'The Pale Garden',
    hero: 'Ren', universe: 'Victorian-era coastal city shrouded in perpetual fog',
    genre: 'horreur', style: 'elegant',
    heroDesc: "A young botanist who inherited a sealed greenhouse from a grandmother she never met. Quiet and deeply observant, with the unsettling ability to understand what plants need before they wilt.",
    pitch: "The greenhouse grows flowers of impossible beauty — each one tied to a stolen memory. When Ren touches a bloom, she relives its donor's most precious moment. As more townsfolk begin forgetting their loved ones, Ren realises the garden is still feeding.",
    chapter: { title: 'What the Roses Remember', desc: "Ren traces the oldest flower to a woman who has been alive for two hundred years and remembers absolutely nothing. She smiles at Ren like a blank page." },
    ending: "To kill the garden Ren must sacrifice her own memories — including the only ones she has of her mother. She does it. Somewhere, a flower blooms white and dissolves to ash.",
  },
  {
    title: 'Echo of the Forgotten',
    hero: 'Mizuki', universe: 'A library existing between discarded stories',
    genre: 'isekai', style: 'elegant',
    heroDesc: "An archivist in her forties — pragmatic, ink-stained, and quietly grief-stricken since her daughter disappeared inside a book that was later declared impossible to find.",
    pitch: "Mizuki is pulled into a world built entirely from stories abandoned mid-sentence by their authors. Its inhabitants are unfinished characters — alive, aware, and desperate for someone to complete their arcs before they fade. Her daughter is here. She chose to stay.",
    chapter: { title: 'The Unwritten Chapter', desc: "Mizuki meets the antagonist of an abandoned horror story whose author died before revealing his motive. He has spent thirty years becoming kind, with no one left to notice." },
    ending: "Mizuki writes the final sentence of every story she can find — including her daughter's. The last line she writes is one her daughter left for her, hidden on page one.",
  },
  {
    title: 'Seventeen Seconds',
    hero: 'Hayate', universe: 'Modern Tokyo layered over an invisible warzone',
    genre: 'shonen', style: 'dynamique',
    heroDesc: "A teenager who has been dying — and rewinding exactly 17 seconds — for over 200 years, trapped in the same afternoon. He remembers everything. He has tried every possible escape. None of them work.",
    pitch: "Hayate has rewound over forty thousand times. Today, for the first time, a girl named Aoi does something he has never seen — she looks directly at him the moment he resets and whispers: \"Again?\" She can see the loop. She may be the only one who can break it.",
    chapter: { title: 'Loop 40,301', desc: "Hayate maps every conversation with Aoi across fifty resets. She changes her answer each time — as if she remembers too. That should be impossible." },
    ending: "The loop breaks not through strategy but because Hayate, for the first time in 200 years, chooses not to run. The 17 seconds pass. Nothing resets. He has no idea what comes next.",
  },
  {
    title: 'The Mirror Rooms',
    hero: 'Shion', universe: 'Neo-Kyoto, a city where mirrors are regulated by law',
    genre: 'seinen', style: 'sombre',
    heroDesc: "A forensic detective who can enter the last memory preserved inside any mirror at a crime scene. She solves every case. She has never once spoken about what she actually sees inside.",
    pitch: "A series of murders leaves no trace — except every victim's mirror has been turned to face the wall beforehand. When Shion enters the first mirror, she finds not a memory but a door. Someone has been living on the reflection side. And they have been watching her for years.",
    chapter: { title: 'The Inverted Room', desc: "Shion discovers the killer's mirror-space contains perfect replicas of her own apartment, updated in real time. Her most recent reflection is missing its eyes." },
    ending: "Shion must shatter every mirror in the city to destroy the mirror-world — including the one containing the only preserved memory of her dead partner. She hesitates one second. Then swings.",
  },
  {
    title: 'Salt and Ash',
    hero: 'Yuki', universe: 'A quiet seaside town where everyone seems peacefully content',
    genre: 'shojo', style: 'doux',
    heroDesc: "A teenage girl with synesthesia — she experiences emotions as flavours on her tongue. Once a comfort, the ability has become an alarm: the food in her town has started tasting like grey.",
    pitch: "Someone has been lacing the town's water supply with a compound that gradually erodes grief, anger, and longing — leaving only a gentle tasteless contentment. Most residents prefer it. Yuki is the only one who can tell what they have lost.",
    chapter: { title: 'The Grey Taste', desc: "Yuki traces the compound to the town's most beloved chef — an old man who lost his family to depression. He is not a villain. He is a father who never wants anyone to feel what he felt." },
    ending: "Yuki gives the town back its grief. Half of them hate her for it. The other half, weeks later, begin to taste things again — including joy, which requires the other half to mean anything.",
  },
  {
    title: 'The Hollow Crown',
    hero: 'Rei', universe: 'A medieval kingdom where every law and war is decided by chess',
    genre: 'isekai', style: 'elegant',
    heroDesc: "A chess prodigy expelled from every tournament on Earth for being too aggressive. In the kingdom of Echoria, aggressiveness is a royal virtue. He is terrifying here. He is also sixteen years old.",
    pitch: "Rei is summoned to Echoria as the kingdom's champion — but discovers that every piece sacrificed on the board reflects a real death somewhere in the realm. He has already played three moves before anyone tells him this.",
    chapter: { title: 'Gambit Declined', desc: "Rei is forced to play the kingdom's most brutal general. He wins in six moves. Somewhere in the southern province, six soldiers do not come home. The general applauds." },
    ending: "Rei deliberately loses the final match — sacrificing only the king, his own piece, triggering his erasure from Echoria. The kingdom must govern without a champion for the first time in history. He considers this his greatest victory.",
  },
];

function surpriseMe() {
  const seed = SURPRISE_SEEDS[Math.floor(Math.random() * SURPRISE_SEEDS.length)];

  document.getElementById('f-titre').value     = seed.title;
  document.getElementById('f-heros').value     = seed.hero;
  document.getElementById('f-univers').value   = seed.universe;
  document.getElementById('f-hero-desc').value = seed.heroDesc;
  document.getElementById('f-premise').value   = seed.pitch;
  document.getElementById('f-fin').value       = seed.ending;
  document.getElementById('f-genre').value     = seed.genre;
  document.getElementById('f-style').value     = seed.style;

  // Clear existing chapters and add the seed chapter
  document.querySelectorAll('.chapter-entry').forEach(el => el.remove());
  updateChapterUI();
  addChapter();
  const titleInput = document.querySelector('.chapter-title-input');
  const descInput  = document.querySelector('.chapter-desc-input');
  if (titleInput) titleInput.value = seed.chapter.title;
  if (descInput)  descInput.value  = seed.chapter.desc;

  // Clear error states
  ['err-premise', 'err-chapters', 'err-fin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Flash the card and scroll to it
  const card = document.getElementById('creator-form-card');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  card.classList.add('surprise-flash');
  setTimeout(() => card.classList.remove('surprise-flash'), 700);
}
