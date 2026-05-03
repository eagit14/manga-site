// ── Supabase client init + DB helpers ────────────────────

const _supabase = (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL')
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;


async function saveStoryToSupabase(data, aiContent, grad) {
  if (!_supabase) {
    console.error('[DB] saveStoryToSupabase: _supabase is null — check SUPABASE_URL / SUPABASE_ANON_KEY');
    return null;
  }
  try {
    console.log('[DB] Inserting story…', data.titre);

    const { data: { user } } = await _supabase.auth.getUser();

    const { data: story, error: storyErr } = await _supabase
      .from('manga_stories')
      .insert({
        user_id:        user?.id       || null,
        title:          data.titre    || 'Untitled',
        genre:          data.genre,
        art_style:      data.style,
        hero_name:      data.heros    || null,
        hero_desc:      data.heroDesc || null,
        universe:       data.univers  || null,
        pitch:          data.premise,
        ending:         data.fin,
        synopsis:       aiContent?.synopsis         || null,
        tagline:        aiContent?.tagline          || null,
        hero_ai_desc:   aiContent?.hero_description || null,
        universe_desc:  aiContent?.universe_desc    || null,
        cover_gradient: grad || null,
      })
      .select('id')
      .single();

    if (storyErr) {
      console.error('[DB] manga_stories insert error:', storyErr.code, storyErr.message, storyErr.details);
      return null;
    }

    const storyId = story.id;
    console.log('[DB] Story inserted ✓ id:', storyId);

    if (data.chapters && data.chapters.length > 0) {
      const chapterRows = data.chapters.map(ch => ({
        story_id:    storyId,
        chapter_num: ch.num,
        title:       ch.title       || null,
        description: ch.description || null,
      }));
      const { error: chapErr } = await _supabase.from('manga_chapters').insert(chapterRows);
      if (chapErr) console.error('[DB] manga_chapters insert error:', chapErr.code, chapErr.message);
      else console.log('[DB] Chapters inserted ✓ count:', chapterRows.length);
    }

    return storyId;
  } catch (err) {
    console.error('[DB] saveStoryToSupabase unexpected error:', err);
    return null;
  }
}

async function markMangaPurchased(storyId) {
  if (!_supabase || !storyId) return;
  const { error } = await _supabase
    .from('manga_stories')
    .update({ purchased_at: new Date().toISOString() })
    .eq('id', storyId);
  if (error) console.error('[DB] markMangaPurchased error:', error.message);
  else console.log('[DB] Story marked as purchased ✓', storyId);
}

async function saveImageToSupabase(storyId, imageType, chapterNum, imageUrl, promptUsed) {
  if (!_supabase || !storyId) return;
  try {
    const { error } = await _supabase.from('manga_images').insert({
      story_id:    storyId,
      image_type:  imageType,
      chapter_num: chapterNum ?? null,
      image_url:   imageUrl,
      prompt_used: promptUsed || null,
    });
    if (error) console.error('[DB] manga_images insert error:', error.code, error.message);
    else console.log('[DB] Image inserted ✓ type:', imageType);
  } catch (err) {
    console.error('[DB] saveImageToSupabase unexpected error:', err);
  }
}
