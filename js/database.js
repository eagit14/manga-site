// ── Supabase client init + DB helpers ────────────────────

const _supabase = (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL')
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

async function saveStoryToSupabase(data, aiContent, grad) {
  if (!_supabase) return null;
  try {
    // Resolve the current user's id (best-effort; null if auth unavailable)
    let userId = null;
    try {
      const { data: userData } = await _supabase.auth.getUser();
      userId = userData?.user?.id ?? null;
    } catch (_) { /* ignore auth errors */ }

    const { data: story, error: storyErr } = await _supabase
      .from('manga_stories')
      .insert({
        user_id:       userId,
        title:         data.titre   || 'Untitled',
        genre:         data.genre,
        art_style:     data.style,
        hero_name:     data.heros   || null,
        hero_desc:     data.heroDesc || null,
        universe:      data.univers  || null,
        pitch:         data.premise,
        ending:        data.fin,
        synopsis:      aiContent?.synopsis        || null,
        tagline:       aiContent?.tagline         || null,
        hero_ai_desc:  aiContent?.hero_description || null,
        universe_desc: aiContent?.universe_desc   || null,
        cover_gradient: grad || null,
      })
      .select('id')
      .single();

    if (storyErr) throw storyErr;
    const storyId = story.id;

    if (data.chapters && data.chapters.length > 0) {
      const chapterRows = data.chapters.map(ch => ({
        story_id:    storyId,
        chapter_num: ch.num,
        title:       ch.title       || null,
        description: ch.description || null,
      }));
      const { error: chapErr } = await _supabase.from('manga_chapters').insert(chapterRows);
      if (chapErr) console.error('Supabase chapter insert error:', chapErr);
    }

    return storyId;
  } catch (err) {
    console.error('Supabase story insert error:', err);
    return null;
  }
}

async function saveImageToSupabase(storyId, imageType, chapterNum, imageUrl, promptUsed) {
  if (!_supabase || !storyId) return;
  try {
    // Resolve the current user's id (best-effort; null if auth unavailable)
    let userId = null;
    try {
      const { data: userData } = await _supabase.auth.getUser();
      userId = userData?.user?.id ?? null;
    } catch (_) { /* ignore auth errors */ }

    const { error } = await _supabase.from('manga_images').insert({
      story_id:     storyId,
      user_id:      userId,
      image_type:   imageType,
      chapter_num:  chapterNum ?? null,
      image_url:    imageUrl,
      prompt_used:  promptUsed || null,
    });
    if (error) console.error('Supabase image insert error:', error);
  } catch (err) {
    console.error('Supabase image insert error:', err);
  }
}
