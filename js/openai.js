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
    ? '\n\nA reference photo of the hero\'s face is attached. Examine it closely and fill the "hero_face_desc" field with a precise physical description suitable for an illustrator: face shape, skin tone, eye color and shape, eyebrow style, nose shape, lip shape, hair color, hair texture and style, any distinctive features (scars, freckles, jawline, cheekbones, etc.). Be as specific as possible so an artist can reproduce this exact face.'
    : '';

  const faceField = _heroImageBase64
    ? '\n  "hero_face_desc": "Precise physical description of the hero\'s face extracted from the reference photo: face shape, skin tone, eye color/shape, eyebrow style, nose, lips, hair color/texture/style, distinctive features. Enough detail for consistent illustration across all panels.",'
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
{${faceField}
  "synopsis": "Compelling 4–6 sentence synopsis in English. Present the world, the hero, the inciting incident, the stakes. Editorial style, vivid and gripping.",
  "tagline": "Hard-hitting single sentence (15 words max) — manga cover style.",
  "hero_description": "2–3 sentence description of the main character: personality, special power or strength, what makes them unique.",
  "chapter_titles": ["Chapter title 1", "Chapter title 2", "Chapter title 3"],
  "universe_desc": "One short immersive sentence describing the universe."
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

function buildImagePrompts(data, aiContent, styleLabel, genreLabel) {
  const hero     = data.heros     || 'the protagonist';
  const heroDesc = aiContent?.hero_description || data.heroDesc || '';
  const setting  = data.univers   || 'an unknown world';
  const premise  = data.premise   || '';
  const fin      = data.fin       || '';
  const title    = data.titre     || 'Untitled';
  const synopsis = aiContent?.synopsis ? aiContent.synopsis.split('.').slice(0, 2).join('.') + '.' : '';
  const faceRef  = _heroImageBase64 && aiContent?.hero_face_desc
    ? ` IMPORTANT — Hero face must be reproduced exactly in every panel: ${aiContent.hero_face_desc}`
    : _heroImageBase64
      ? ' A reference face photo was provided — reproduce the hero\'s facial features precisely in every panel.'
      : '';

  // Build chapter arc context from user-defined chapters
  const chapters = data.chapters || [];
  const ch1 = chapters[0];
  const chArc = chapters.length
    ? 'Story arc: ' + chapters.map(ch =>
        `Ch.${ch.num}${ch.title ? ' "' + ch.title + '"' : ''}${ch.description ? ' (' + ch.description + ')' : ''}`
      ).join(' → ') + '.'
    : '';

  const storyCtx = [
    synopsis && `Story: ${synopsis}`,
    premise  && `Opening: ${premise}`,
    fin      && `Ending: ${fin}`,
    chArc,
  ].filter(Boolean).join(' ');

  const base = `Full manga chapter page layout, 4 to 6 distinct black-and-white ink panels separated by white gutters. Art style: ${styleLabel}. Genre: ${genreLabel}. Title: "${title}". Hero: ${hero}${heroDesc ? ' — ' + heroDesc : ''}. Setting: ${setting}. ${storyCtx}${faceRef} Draw the hero with a consistent face across all panels. Authentic Japanese manga style — B&W ink only, no colour, screen tones, hatching, expressive characters, speed lines, bold panel borders, varied panel sizes for pacing. The page must look like a real printed manga chapter page.`;

  const pitch = `${base}
Illustrate the OPENING SCENE / Inciting Incident: ${premise || 'the hero\'s world is disrupted by an unexpected event'}.
Panels: (1) wide establishing shot of ${setting}, (2) ${hero} introduced in their normal life, (3) the inciting event unfolds dramatically, (4) close-up reaction shot of ${hero}'s face showing shock or determination.`;

  const ch1Desc = ch1
    ? `${ch1.title ? '"' + ch1.title + '"' : 'Chapter 1'}${ch1.description ? ': ' + ch1.description : ''}`
    : premise || 'the hero faces their first major challenge';

  const chapter1 = `${base}
Illustrate the FIRST CHAPTER key action scene — ${ch1Desc}.
Panels: (1) wide action shot of ${hero} in motion in ${setting}, (2) a dramatic confrontation or obstacle specific to this chapter, (3) ${hero}'s reaction and decision, (4) cliffhanger panel that pushes the story forward.`;

  const lastCh = chapters.length > 1 ? chapters[chapters.length - 1] : null;
  const endingCtx = fin
    ? fin
    : lastCh
      ? `${lastCh.title ? '"' + lastCh.title + '"' : 'final chapter'}${lastCh.description ? ': ' + lastCh.description : ''}`
      : 'the hero completes their journey';

  const ending = `${base}
Illustrate the FINAL RESOLUTION: ${endingCtx}.
Panels: (1) climax moment — ${hero} at the peak of the final confrontation, (2) emotional reaction close-up, (3) quiet aftermath in ${setting}, (4) large final symbolic panel showing the new status quo or a lingering question.`;

  return { pitch, chapter1, ending };
}

async function _uploadBase64ToStorage(b64, storyId, imageType) {
  if (!_supabase || !storyId) return null;
  try {
    // Decode base64 → Uint8Array — no fetch(), no CORS
    const binary = atob(b64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/png' });

    const path = `${storyId}/${imageType}-${Date.now()}.png`;
    const { error } = await _supabase.storage
      .from('manga-images')
      .upload(path, blob, { contentType: 'image/png', upsert: true });
    if (error) { console.error('[Storage] upload error:', error.message); return null; }

    const { data: signData, error: signError } = await _supabase.storage
      .from('manga-images')
      .createSignedUrl(path, 315360000); // ~10 years
    if (signError) { console.error('[Storage] sign error:', signError.message); return null; }
    return signData.signedUrl;
  } catch (err) {
    console.error('[Storage] upload failed:', err);
    return null;
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
        // b64_json returns image data directly — no cross-origin fetch needed
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1792', quality: 'hd', response_format: 'b64_json' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json   = await res.json();
      const b64    = json.data[0].b64_json;
      const dataUrl = `data:image/png;base64,${b64}`;

      // Show immediately from base64 while storage upload runs
      const img      = document.getElementById(`carousel-img-${idx}`);
      const skeleton = document.getElementById(`carousel-skeleton-${idx}`);
      if (img) {
        img.src = dataUrl;
        img.style.display = 'block';
        img.onload = () => { if (skeleton) skeleton.style.display = 'none'; };
      }

      // Upload base64 → Supabase Storage (no CORS, no expiry)
      const permanentUrl = await _uploadBase64ToStorage(b64, storyId, meta[idx].type);

      if (permanentUrl) {
        // Swap to the permanent signed URL and persist to DB
        if (img) img.src = permanentUrl;
        await saveImageToSupabase(storyId, meta[idx].type, meta[idx].chapterNum, permanentUrl, prompt);
      } else {
        // Storage not set up — image visible this session only, not saved to DB
        if (skeleton) {
          skeleton.innerHTML = '<span>⚠️</span><span>Storage not configured — image won\'t persist</span>';
          skeleton.style.display = 'flex';
        }
        console.error('[IMG] Storage upload failed for idx=' + idx + '. Create the manga-images bucket in Supabase Storage and add the auth upload/read policies.');
      }
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
