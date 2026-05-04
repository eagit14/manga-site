// ── OpenAI: callOpenAI, generateImages ───────────────────

async function callOpenAI(apiKey, data, _attempt = 1) {
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

  const numChapters = (data.chapters && data.chapters.length > 0) ? data.chapters.length : 1;
  const chapterDialogueFields = Array.from({ length: numChapters }, (_, i) =>
    `["punchy line 1 for chapter ${i + 1} (≤8 words)", "punchy line 2 for chapter ${i + 1} (≤8 words)"]`
  ).join(', ');

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
  "universe_desc": "One short immersive sentence describing the universe.",
  "panel_lines": {
    "pitch": ["punchy narration/dialogue line 1 for opening scene (≤8 words)", "punchy line 2 (≤8 words)"],
    "chapters": [${chapterDialogueFields}],
    "ending": ["punchy line 1 for final scene (≤8 words)", "punchy emotional closing line (≤8 words)"]
  }
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

  if (res.status === 429 && _attempt < 4) {
    const waits = [30000, 65000, 90000]; // 30s, 65s, 90s — ensure we cross the 60s rate-limit window
    const wait = waits[_attempt - 1] || 65000;
    const msgEl = document.getElementById('loading-msg');
    if (msgEl) msgEl.textContent = `⏳ Rate limit — retrying in ${wait / 1000}s… (attempt ${_attempt}/3)`;
    await new Promise(r => setTimeout(r, wait));
    return callOpenAI(apiKey, data, _attempt + 1);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Error ${res.status}`;
    if (res.status === 401) throw new Error('Invalid API key. Check your key at platform.openai.com.');
    if (res.status === 429) throw new Error('Rate limit reached after 3 retries. Please wait a minute then try again.');
    if (res.status === 400) throw new Error('Bad request: ' + msg);
    throw new Error(msg);
  }

  const json = await res.json();
  return JSON.parse(json.choices[0].message.content);
}

function buildImagePrompts(data, aiContent, styleLabel, genreLabel) {
  const hero       = data.heros     || 'the protagonist';
  const heroDesc   = aiContent?.hero_description || data.heroDesc || '';
  const setting    = data.univers   || 'an unknown world';
  const premise    = data.premise   || '';
  const fin        = data.fin       || '';
  const title      = data.titre     || 'Untitled';
  const synopsis   = aiContent?.synopsis ? aiContent.synopsis.split('.').slice(0, 2).join('.') + '.' : '';
  const isColor    = data.colorStyle === 'color';
  const hasBubbles = data.bubbles !== false;

  const faceRef = _heroImageBase64 && aiContent?.hero_face_desc
    ? ` CRITICAL — reproduce this hero's exact face in every single panel: ${aiContent.hero_face_desc}.`
    : _heroImageBase64
      ? ' A reference photo was provided — reproduce the hero\'s exact facial features consistently in every panel.'
      : '';

  const chapters = data.chapters || [];
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

  const visualStyle = isColor
    ? `Full-color manga/anime art style. Vibrant colors, cel shading, clean anime linework, richly colored backgrounds, dynamic lighting. Consistent color palette across all panels.`
    : `Authentic black-and-white manga ink art. Bold ink outlines, screen tones for shading, hatching, pure B&W — absolutely no color.`;

  const textStyle = hasBubbles
    ? `Include manga-style text directly in the panels: white speech bubbles with black text and thick outlines for dialogue, rectangular caption boxes for narration. All text in English, clearly legible, maximum 8 words per bubble or caption.`
    : `No text, no speech bubbles, no captions, no lettering anywhere. Pure visual storytelling only.`;

  const base = `Manga chapter page with 4–6 panels in a grid layout, white gutters between panels. Art style: ${styleLabel}. Genre: ${genreLabel}. Title: "${title}". Hero: ${hero}${heroDesc ? ' — ' + heroDesc : ''}. Setting: ${setting}. ${storyCtx}${faceRef} ${visualStyle} Hero must have a consistent, recognizable face and costume in every panel. Expressive characters, dynamic poses, speed lines, varied panel sizes for pacing. This must look like a real printed manga chapter page. ${textStyle}`;

  const dialogueHint = (lines) => {
    if (!hasBubbles || !lines || !lines.length) return '';
    const clean = lines.filter(Boolean);
    return clean.length ? `\nPanel text to include: ${clean.map(l => `"${l}"`).join(' | ')}` : '';
  };

  const results = [];

  // Pitch image
  results.push({
    type: 'pitch', chapterNum: null, storageKey: 'pitch',
    prompt: `${base}
Scene: OPENING / INCITING INCIDENT — ${premise || 'the hero\'s world is disrupted by an unexpected event'}.
Panel sequence: (1) wide establishing shot of ${setting}; (2) ${hero} in their everyday life; (3) the inciting event erupts dramatically; (4) close-up of ${hero}'s face — shock or fierce determination.${dialogueHint(aiContent?.panel_lines?.pitch)}`,
  });

  // One image per chapter
  const chapterList = chapters.length > 0 ? chapters : [{ num: 1, title: '', description: '' }];
  chapterList.forEach((ch, i) => {
    const num    = ch.num || i + 1;
    const chDesc = ch.title
      ? `"${ch.title}"${ch.description ? ': ' + ch.description : ''}`
      : `Chapter ${num}${ch.description ? ': ' + ch.description : ''}`;
    results.push({
      type: 'chapter', chapterNum: num, storageKey: `chapter-${num}`,
      prompt: `${base}
Scene: CHAPTER ${num} KEY ACTION — ${chDesc}.
Panel sequence: (1) wide action shot of ${hero} in motion; (2) dramatic confrontation or major obstacle; (3) ${hero}'s reaction and decision moment; (4) cliffhanger panel that drives the story forward.${dialogueHint(aiContent?.panel_lines?.chapters?.[i])}`,
    });
  });

  // Ending image
  const lastCh    = chapters.length > 1 ? chapters[chapters.length - 1] : null;
  const endingCtx = fin
    ? fin
    : lastCh
      ? `${lastCh.title ? '"' + lastCh.title + '"' : 'final chapter'}${lastCh.description ? ': ' + lastCh.description : ''}`
      : 'the hero completes their journey';
  results.push({
    type: 'ending', chapterNum: null, storageKey: 'ending',
    prompt: `${base}
Scene: FINAL RESOLUTION — ${endingCtx}.
Panel sequence: (1) climax — ${hero} at peak confrontation; (2) emotional close-up reaction; (3) quiet aftermath in ${setting}; (4) large symbolic final panel — new status quo or haunting unresolved question.${dialogueHint(aiContent?.panel_lines?.ending)}`,
  });

  return results;
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

async function generateImages(apiKey, prompts, storyId) {
  const _sleep = ms => new Promise(r => setTimeout(r, ms));

  const _fetchImage = async (prompt, attempt = 1) => {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1536', quality: 'high' }),
    });
    if (res.status === 429 && attempt < 3) {
      // Rate limited — wait and retry (12s, then 24s)
      const wait = attempt * 12000;
      console.warn(`[IMG] 429 rate limit — retrying in ${wait / 1000}s (attempt ${attempt})`);
      const skeleton = document.getElementById(`carousel-skeleton-current`);
      if (skeleton) skeleton.querySelector('span:last-child').textContent = `Rate limited — retrying in ${wait / 1000}s…`;
      await _sleep(wait);
      return _fetchImage(prompt, attempt + 1);
    }
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${res.status}`);
    }
    return res.json();
  };

  // Generate sequentially to stay within gpt-image-1 rate limits
  for (let idx = 0; idx < prompts.length; idx++) {
    const promptObj = prompts[idx];
    const skeleton  = document.getElementById(`carousel-skeleton-${idx}`);
    const img       = document.getElementById(`carousel-img-${idx}`);

    // Mark this one as in-progress, queue the rest
    if (skeleton) skeleton.innerHTML = '<span>⏳</span><span>Generating…</span>';
    for (let j = idx + 1; j < prompts.length; j++) {
      const s = document.getElementById(`carousel-skeleton-${j}`);
      if (s) s.innerHTML = '<span>🕐</span><span>In queue…</span>';
    }

    try {
      const json    = await _fetchImage(promptObj.prompt);
      const b64     = json.data[0].b64_json;
      const dataUrl = `data:image/png;base64,${b64}`;

      if (img) {
        img.src = dataUrl;
        img.style.display = 'block';
        img.onload = () => { if (skeleton) skeleton.style.display = 'none'; };
      }

      const permanentUrl = await _uploadBase64ToStorage(b64, storyId, promptObj.storageKey);
      if (permanentUrl) {
        if (img) img.src = permanentUrl;
        await saveImageToSupabase(storyId, promptObj.type, promptObj.chapterNum, permanentUrl, promptObj.prompt);
      } else {
        if (skeleton) {
          skeleton.innerHTML = '<span>⚠️</span><span>Storage not configured — image won\'t persist</span>';
          skeleton.style.display = 'flex';
        }
      }
    } catch (err) {
      console.error('[IMG] generate error idx=' + idx, err);
      if (skeleton) skeleton.innerHTML = `<span>❌</span><span>${err.message || 'Image unavailable'}</span>`;
    }

    // Small pause between requests to respect rate limits
    if (idx < prompts.length - 1) await _sleep(1500);
  }
}
