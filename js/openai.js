// ── OpenAI: callOpenAI, generateImages ───────────────────

async function callOpenAI(apiKey, data) {
  const genreLabel  = genreProfiles[data.genre]?.label  || data.genre;
  const styleLabel  = styleLabels[data.style]           || data.style;

  const chaptersText = (data.chapters && data.chapters.length > 0)
    ? '\n\nChapters defined by the author:\n' + data.chapters.map(ch =>
        `  Chapter ${ch.num}${ch.title ? ': ' + ch.title : ''}${ch.description ? '\n    ' + ch.description : ''}`
      ).join('\n')
    : '';

  const faceNote = _heroImageBase64
    ? '\n\nA reference photo of the hero\'s face is attached. Analyse the facial features carefully and reproduce them precisely in ALL three image_prompt_* fields so DALL-E draws the same face consistently.'
    : '';

  const userPrompt = `Create a complete narrative sheet for this manga:

Title: "${data.titre}"
Genre: ${genreLabel}
Art style: ${styleLabel}
${data.heros    ? `Hero / Heroine: ${data.heros}`         : ''}
${data.heroDesc ? `Hero description: ${data.heroDesc}`    : ''}
${data.univers  ? `Universe / Setting: ${data.univers}`   : ''}
${data.premise  ? `Starting pitch: ${data.premise}`       : ''}
${data.fin      ? `Desired ending: ${data.fin}`           : ''}${chaptersText}${faceNote}

Reply ONLY with a valid JSON object containing these fields:
{
  "synopsis": "Compelling 4–6 sentence synopsis in English. Present the world, the hero, the inciting incident, the stakes. Editorial style, vivid and gripping.",
  "tagline": "Hard-hitting single sentence (15 words max) — manga cover style.",
  "hero_description": "2–3 sentence description of the main character: personality, special power or strength, what makes them unique.",
  "chapter_titles": ["Chapter title 1", "Chapter title 2", "Chapter title 3"],
  "universe_desc": "One short immersive sentence describing the universe.",
  "image_prompt_pitch": "A full manga page layout with 4 to 6 distinct black-and-white ink panels separated by white gutters, depicting the opening scene of this manga (the inciting incident). Each panel shows a different moment: establishing shot of the setting, introduction of the hero, a dramatic event, a reaction close-up. Authentic Japanese manga page style inspired by Akira Toriyama, Naoki Urasawa, Kentaro Miura and Hajime Isayama — black and white ink only, no colour, sharp clean linework, screen tones (hatching, crosshatching), expressive large eyes, speed lines, bold panel borders, speech-bubble placeholders. Art style: ${styleLabel}. The page must look like a real printed manga chapter page.",
  "image_prompt_chapter1": "A full manga page layout with 4 to 6 distinct black-and-white ink panels separated by white gutters, depicting the key action scene of the first chapter. Each panel advances the story: wide action shot, character reaction, dramatic confrontation, emotional close-up. Authentic Japanese manga page style inspired by Akira Toriyama, Naoki Urasawa, Kentaro Miura and Hajime Isayama — black and white ink only, no colour, sharp clean linework, screen tones, dynamic speed lines, bold panel borders, varied panel sizes for pacing. Art style: ${styleLabel}. The page must look like a real printed manga chapter page.",
  "image_prompt_ending": "A full manga page layout with 4 to 6 distinct black-and-white ink panels separated by white gutters, depicting the emotional resolution and final scene of this manga. Panels show: climax moment, emotional reaction, quiet aftermath, final symbolic image. Authentic Japanese manga page style inspired by Akira Toriyama, Naoki Urasawa, Kentaro Miura and Hajime Isayama — black and white ink only, no colour, sharp clean linework, screen tones, emotionally expressive characters, a large dramatic final panel. Art style: ${styleLabel}. The page must look like a real printed manga chapter page."
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a talented and passionate manga editor. You create narrative sheets in English for original manga. Your style is vivid, evocative and gripping. You reply ONLY with valid JSON, no surrounding text.',
        },
        {
          role: 'user',
          content: _heroImageBase64
            ? [
                { type: 'text', text: userPrompt },
                { type: 'image_url', image_url: { url: `data:${_heroImageMime};base64,${_heroImageBase64}`, detail: 'low' } },
              ]
            : userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.92,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Error ${res.status}`;
    if (res.status === 401) throw new Error('Invalid API key. Check your key at platform.openai.com.');
    if (res.status === 429) throw new Error('Quota exceeded or too many requests. Try again in a few seconds.');
    if (res.status === 400) throw new Error('Bad request: ' + msg);
    throw new Error(msg);
  }

  const json = await res.json();
  return JSON.parse(json.choices[0].message.content);
}

async function _uploadImageToStorage(dalleUrl, storyId, imageType) {
  if (!_supabase || !storyId) return dalleUrl;
  try {
    const blob = await fetch(dalleUrl).then(r => r.blob());
    const path = `${storyId}/${imageType}-${Date.now()}.png`;
    const { error } = await _supabase.storage
      .from('manga-images')
      .upload(path, blob, { contentType: 'image/png', upsert: true });
    if (error) { console.error('[Storage] upload error:', error.message); return dalleUrl; }
    const { data: signData, error: signError } = await _supabase.storage
      .from('manga-images')
      .createSignedUrl(path, 315360000); // ~10 years
    if (signError) { console.error('[Storage] sign error:', signError.message); return dalleUrl; }
    return signData.signedUrl;
  } catch (err) {
    console.error('[Storage] upload failed:', err);
    return dalleUrl;
  }
}

async function generateImages(apiKey, promptPitch, promptChapter1, promptEnding, storyId) {
  const meta = [
    { type: 'pitch',   chapterNum: null },
    { type: 'chapter', chapterNum: 1    },
    { type: 'ending',  chapterNum: null },
  ];
  const generate = async (prompt, idx) => {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', response_format: 'url' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json    = await res.json();
      const dalleUrl = json.data[0].url;

      // Upload to Supabase Storage for a permanent URL
      const permanentUrl = await _uploadImageToStorage(dalleUrl, storyId, meta[idx].type);

      const img      = document.getElementById(`carousel-img-${idx}`);
      const skeleton = document.getElementById(`carousel-skeleton-${idx}`);
      if (img) {
        img.src   = permanentUrl;
        img.style.display = 'block';
        img.onload = () => { if (skeleton) skeleton.style.display = 'none'; };
      }
      await saveImageToSupabase(storyId, meta[idx].type, meta[idx].chapterNum, permanentUrl, prompt);
    } catch (err) {
      console.error('[IMG] generate error idx=' + idx, err);
      const skeleton = document.getElementById(`carousel-skeleton-${idx}`);
      if (skeleton) skeleton.innerHTML = '<span>❌</span><span>Image unavailable</span>';
    }
  };
  await Promise.allSettled([
    generate(promptPitch,    0),
    generate(promptChapter1, 1),
    generate(promptEnding,   2),
  ]);
}
