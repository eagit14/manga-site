// ── OpenAI: callOpenAI, generateImages ───────────────────
// All OpenAI calls are proxied through the Supabase Edge Function 'openai-proxy'
// so the API key never reaches the browser.

async function _openaiProxy(endpoint, bodyOrFormData, isFormData = false) {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated — please log in.');

  const url     = `${SUPABASE_URL}/functions/v1/openai-proxy?endpoint=${endpoint}`;
  const headers = { Authorization: `Bearer ${session.access_token}` };
  let body;

  if (isFormData) {
    body = bodyOrFormData; // browser sets Content-Type + boundary automatically
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(bodyOrFormData);
  }

  return fetch(url, { method: 'POST', headers, body });
}

async function callOpenAI(data, _attempt = 1) {
  const medium      = data.medium || 'manga';
  const mediumLabel = medium === 'cartoon' ? 'cartoon' : 'manga';
  const genreLabel  = genreProfiles[data.genre]?.label  || data.genre;
  const styleLabel  = styleLabels[data.style]           || data.style;

  const chaptersText = (data.chapters && data.chapters.length > 0)
    ? '\n\nScenes defined by the author:\n' + data.chapters.map(ch =>
        `  Scene ${ch.num}${ch.title ? ': ' + ch.title : ''}${ch.description ? '\n    ' + ch.description : ''}`
      ).join('\n')
    : '';

  const char2Name = data.char2Name || null;

  const faceNote = _heroImageBase64
    ? '\n\nA reference photo of the hero\'s face is attached. Examine it closely and fill the "hero_face_desc" field with a precise physical description.'
    : '';

  const char2FaceNote = (_char2ImageBase64 && char2Name)
    ? `\n\nA reference photo of the supporting character "${char2Name}" is also attached (second image). Examine it and fill the "char2_face_desc" field with a precise physical description.`
    : '';

  const faceField = _heroImageBase64
    ? '\n  "hero_face_desc": "Precise physical description of the hero\'s face: face shape, skin tone, eye color/shape, eyebrow style, nose, lips, hair color/texture/style, distinctive features.",'
    : '';

  const char2FaceField = (_char2ImageBase64 && char2Name)
    ? `\n  "char2_face_desc": "Precise physical description of ${char2Name}'s face: same detail level as hero_face_desc.",`
    : '';

  const numScenes = (data.chapters && data.chapters.length > 0) ? data.chapters.length : 1;
  const sceneDialogueFields = Array.from({ length: numScenes }, (_, i) =>
    `["line 1 scene ${i + 1}: max 4 SHORT common words, correct English", "line 2 scene ${i + 1}: max 4 SHORT common words, correct English"]`
  ).join(', ');

  const userPrompt = `Create a complete narrative sheet for this manga:

Title: "${data.titre}"
Genre: ${genreLabel}
Art style: ${styleLabel}
${data.heros    ? `Hero / Heroine: ${data.heros}`         : ''}
${data.heroDesc ? `Hero description: ${data.heroDesc}`    : ''}
${char2Name     ? `Supporting character: ${char2Name}`    : ''}
${data.univers  ? `Universe / Setting: ${data.univers}`   : ''}${chaptersText}${faceNote}${char2FaceNote}

Reply ONLY with a valid JSON object containing these fields:
{${faceField}${char2FaceField}
  "synopsis": "Compelling 4–6 sentence synopsis in English. Present the world, the hero, the inciting incident, the stakes. Editorial style, vivid and gripping.",
  "tagline": "Hard-hitting single sentence (15 words max) — manga cover style.",
  "hero_description": "2–3 sentence description of the main character: personality, special power or strength, what makes them unique.",
  "scene_titles": ["Scene title 1", "Scene title 2", "Scene title 3"],
  "universe_desc": "One short immersive sentence describing the universe.",
  "panel_lines": {
    "scenes": [${sceneDialogueFields}]
  }
}`;

  const messages = [
    {
      role: 'system',
      content: `You are a talented and passionate ${mediumLabel} editor. You create narrative sheets in English for original ${mediumLabel} stories. Your style is vivid, evocative and gripping. You reply ONLY with valid JSON, no surrounding text.`,
    },
    {
      role: 'user',
      content: (_heroImageBase64 || (_char2ImageBase64 && char2Name))
        ? [
            { type: 'text', text: userPrompt },
            ...(_heroImageBase64 ? [{ type: 'image_url', image_url: { url: `data:${_heroImageMime};base64,${_heroImageBase64}`, detail: 'low' } }] : []),
            ...(_char2ImageBase64 && char2Name ? [{ type: 'image_url', image_url: { url: `data:${_char2ImageMime};base64,${_char2ImageBase64}`, detail: 'low' } }] : []),
          ]
        : userPrompt,
    },
  ];

  const res = await _openaiProxy('chat', {
    model: 'gpt-4o-mini',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.92,
    max_tokens: 2000,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Error ${res.status}`;
    if (res.status === 401) throw new Error('Invalid API key — contact support.');
    if (res.status === 429) {
      const isQuota = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('billing');
      if (isQuota) throw new Error('OpenAI quota exceeded — please contact support.');
      if (_attempt < 4) {
        const waits = [30000, 65000, 90000];
        const wait = waits[_attempt - 1] || 65000;
        const msgEl = document.getElementById('loading-msg');
        if (msgEl) msgEl.textContent = `⏳ Rate limit — retrying in ${wait / 1000}s… (attempt ${_attempt}/3)`;
        await new Promise(r => setTimeout(r, wait));
        return callOpenAI(data, _attempt + 1);
      }
      throw new Error('Rate limit reached after 3 retries. Please wait a minute then try again.');
    }
    if (res.status === 400) throw new Error('Bad request: ' + msg);
    throw new Error(msg);
  }

  const json = await res.json();
  return JSON.parse(json.choices[0].message.content);
}

function buildImagePrompts(data, aiContent, styleLabel, genreLabel) {
  const hero       = data.heros     || 'the protagonist';
  const heroDesc   = (aiContent?.hero_description || data.heroDesc || '').slice(0, 200);
  const hasBubbles = data.bubbles !== false;
  const char2Name  = data.char2Name || null;
  const char2Desc  = (aiContent?.char2_face_desc || '').slice(0, 200);

  const rawFaceDesc = (aiContent?.hero_face_desc || '').slice(0, 250);
  const faceRef = _heroImageBase64 && rawFaceDesc
    ? `Hero face reference (reproduce exactly): ${rawFaceDesc}.`
    : _heroImageBase64
      ? 'Reference photo provided — reproduce hero\'s exact face consistently.'
      : '';
  const characterRule = `CHARACTER CONSISTENCY: ${hero} must have identical face, hairstyle, body proportions, and costume in every panel.${faceRef ? ' ' + faceRef : ''}`;

  const _cap = (str, max = 3900) => str.length <= max ? str : str.slice(0, max - 1);

  function _panelLayout(_descLen) {
    const n = 4; // fixed at 4 panels — fewer panels = more pixels per face = better likeness
    const grids = {
      4: '2-column × 2-row grid = exactly 4 panels (1–2 top row, 3–4 bottom row)',
      5: '2-column × 2-row grid + 1 wide panel at bottom = exactly 5 panels (1–2 top row, 3–4 middle row, 5 full-width bottom)',
      6: '2-column × 3-row grid = exactly 6 panels (1–2 top row, 3–4 middle row, 5–6 bottom row)',
      7: '2-column × 3-row grid + 1 wide panel at bottom = exactly 7 panels (1–2 top row, 3–4 second row, 5–6 third row, 7 full-width bottom)',
      8: '2-column × 4-row grid = exactly 8 panels (1–2 top row, 3–4 second row, 5–6 third row, 7–8 bottom row)',
    };
    const flows = {
      4: `panels 1–2 establish the situation; panels 3–4 deliver the key conflict and resolution`,
      5: `panels 1–2 establish the situation; panels 3–4 show the conflict at peak intensity; panel 5 delivers the emotional climax`,
      6: `panels 1–2 establish the situation; panels 3–4 show the key conflict; panels 5–6 show the resolution and emotional impact`,
      7: `panels 1–2 establish the situation; panels 3–4 show the conflict at peak intensity; panels 5–6 show ${hero}'s reaction and resolve; panel 7 delivers the climax`,
      8: `panels 1–2 show ${hero} entering the situation; panels 3–4 show the key conflict at peak intensity; panels 5–6 show ${hero}'s reaction and inner resolve; panels 7–8 deliver the turning point and climax`,
    };
    return { n, grid: grids[n], flow: flows[n] };
  }

  const textStyle = `No text, no speech bubbles, no captions, no lettering anywhere in the image. Clean panels only.`;

  const results = [];
  const scenes = data.chapters || [];
  const sceneList = scenes.length > 0 ? scenes : [{ num: 1, title: '', description: '', medium: data.medium || 'manga' }];

  sceneList.forEach((ch, i) => {
    const num = ch.num || i + 1;
    const sceneTitle = ch.title ? `"${ch.title}"` : `Scene ${num}`;
    const sceneDetail = ch.description ? ` — ${ch.description}` : '';

    const sceneMedium = ch.medium     || data.medium     || 'manga';
    const sceneColor  = ch.colorStyle || data.colorStyle || 'bw';
    const isCartoon   = sceneMedium === 'cartoon';
    const isColor     = sceneColor === 'color';
    const artForm     = isCartoon ? 'western cartoon/comic' : 'manga/anime';
    const visualStyle = isCartoon
      ? (isColor
          ? `Art style: Vibrant full-color western cartoon. Bold outlines, flat cel-shaded bright colors, expressive exaggerated faces, animated TV-show quality.`
          : `Art style: Black-and-white cartoon/comic. Bold ink outlines, hatching for shading, expressive cartoon faces. Published comic strip quality.`)
      : (isColor
          ? `Art style: Full-color professional anime/manga. Vibrant saturated colors, smooth cel-shading, crisp linework, richly detailed backgrounds with dramatic lighting.`
          : `Art style: Black-and-white manga. Clean ink linework, screentone shading, bold dynamic compositions, fully rendered backgrounds.`);

    const { n: panelCount, grid: panelGrid, flow: panelFlow } = _panelLayout((ch.description || '').length);
    const layoutStr = `PAGE LAYOUT: PORTRAIT orientation (taller than wide). ${panelGrid}. Each panel numbered 1–${panelCount} (small circle top-left). Thin white gutters. No title banner. Every panel has a fully detailed background.`;

    const sceneText    = ((ch.title || '') + ' ' + (ch.description || '')).toLowerCase();
    const heroMentioned  = !!(hero && sceneText.includes(hero.toLowerCase()));
    const includeChar2   = !!(char2Name && sceneText.includes(char2Name.toLowerCase()));
    const includeHero  = !(includeChar2 && !heroMentioned);
    const char2Rule   = includeChar2
      ? `SECOND CHARACTER "${char2Name}" appears in this scene.${char2Desc ? ' Their appearance: ' + char2Desc : ''} Keep their face and appearance consistent.`
      : '';

    const styleNotes = (data.style || '').trim().replace(/\n+/g, ', ');

    const prompt = [
      `Professional ${artForm} story page.`,
      `SCENE ${num}: ${sceneTitle}${sceneDetail}`,
      `Panel flow: ${panelFlow}.`,
      `HERO: ${hero}${heroDesc ? ' — ' + heroDesc : ''}.`,
      characterRule,
      char2Rule,
      visualStyle,
      styleNotes ? `Visual style keywords: ${styleNotes}.` : '',
      textStyle,
      layoutStr,
      `Highly expressive ${isCartoon ? 'cartoon' : 'anime'} faces conveying strong emotion. Dynamic action poses with speed lines.`,
    ].filter(Boolean).join(' ');

    const sceneDialogue = hasBubbles
      ? (aiContent?.panel_lines?.scenes?.[i] || []).filter(Boolean)
      : [];

    const artStyle   = isCartoon
      ? (isColor ? 'full-color cartoon' : 'black-and-white cartoon')
      : (isColor ? 'full-color manga' : 'black-and-white manga');
    const noTextLine = hasBubbles ? '' : 'No speech bubbles, no text, no captions.\n';

    // Build appearance line — GPT-4o vision reads the photo directly, but the text description
    // reinforces key traits (skin tone, hair volume) that models tend to generalise.
    const faceDesc   = (aiContent?.hero_face_desc || '').slice(0, 300);
    const heroDescTx = (data.heroDesc || '').slice(0, 150);
    const appearanceParts = [faceDesc, heroDescTx].filter(Boolean);
    const appearanceLine = appearanceParts.length
      ? `The character's appearance (match precisely): ${appearanceParts.join('. ')}.\n`
      : '';

    const simplePrompt =
      `The attached photo shows the hero. Draw the character's face as close as possible to the photo in every panel.\n` +
      appearanceLine +
      `Create a ${panelCount}-panel ${artStyle} manga page.\n` +
      `Scene: ${sceneTitle}${sceneDetail}.\n` +
      noTextLine;

    results.push({
      type: 'chapter', chapterNum: num, storageKey: `chapter-${num}`,
      prompt: _cap(prompt), simplePrompt, includeChar2, includeHero,
      hasBubbles,
      dialogueLines: sceneDialogue,
      panelCount,
    });
  });

  return results;
}

// ── Character identity profile (GPT-4o high-detail face analysis, cached per hero image) ──
let _heroIdentityProfile    = null;
let _heroIdentityProfileKey = null;

async function _extractCharacterIdentity() {
  if (!_heroImageBase64) return;
  const key = _heroImageBase64.slice(0, 60);
  if (_heroIdentityProfile && _heroIdentityProfileKey === key) { console.log('[IMG] Identity profile: using cached ✓'); return; }

  console.log('[IMG] Extracting character identity profile (GPT-4o high-detail)…');
  try {
    const res = await _openaiProxy('chat', {
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${_heroImageMime};base64,${_heroImageBase64}`, detail: 'high' } },
          { type: 'text', text:
            'You are a professional manga character designer. Analyze this photo with extreme precision for identity-preserving manga generation.\n' +
            'Return STRICT JSON with exactly these fields — be highly specific, not generic:\n' +
            '{\n' +
            '  "face_shape": "precise geometry: oval/round/square/heart, jaw width, chin shape, cheekbone prominence, face length vs width ratio",\n' +
            '  "hair": "exact color with undertones, curl/wave pattern, density, volume and silhouette shape, length, how it frames the face — this is a PRIMARY identity anchor",\n' +
            '  "eyes": "exact shape (almond/round/hooded/upturned), iris color, size relative to face, lid fold, corner angle, spacing between eyes, lash density",\n' +
            '  "eyebrows": "exact thickness, arch shape and peak position, color, length, distance from eyes, any gaps or fullness",\n' +
            '  "nose": "bridge width and height, tip shape (rounded/pointed/bulbous), nostril flare, overall length and width",\n' +
            '  "mouth": "lip thickness top vs bottom, cupid\'s bow shape, mouth width, smile line shape, any dimples or creases, teeth visibility when smiling",\n' +
            '  "skin_tone": "precise tone (fair/light/medium/tan/deep) with undertone (warm/cool/neutral/olive/golden), any notable texture or markings",\n' +
            '  "age_appearance": "estimated age range and specific juvenile/adult features that indicate age",\n' +
            '  "body_type": "build (slim/athletic/stocky), shoulder width, neck length, overall silhouette",\n' +
            '  "emotional_energy": "dominant expression energy, how eyes communicate emotion, resting face impression",\n' +
            '  "silhouette_traits": "the 2-3 features instantly recognizable as a small silhouette from far away",\n' +
            '  "manga_translation_notes": "specific guidance for converting this face to manga/anime style while preserving identity — which features to exaggerate vs preserve",\n' +
            '  "consistency_anchors": "the 4-5 features that are most distinctive and MUST be identical in every single panel — be very specific",\n' +
            '  "forbidden_drift": "exhaustive list of exactly what must never change: hair shape, skin tone, face proportions, eye style — be explicit and specific"\n' +
            '}\n' +
            'Every field must be precise and specific to THIS person. Never use generic descriptions.'
          },
        ],
      }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1200,
    });

    if (!res.ok) { console.warn('[IMG] Identity extraction error:', res.status); return; }
    const json    = await res.json();
    const profile = JSON.parse(json.choices[0].message.content);
    _heroIdentityProfile    = profile;
    _heroIdentityProfileKey = key;
    console.log('[IMG] Identity profile ready ✓ anchors:', profile.consistency_anchors);
  } catch (e) {
    console.warn('[IMG] Identity extraction skipped:', e.message);
  }
}

function _formatIdentityProfile(p) {
  if (!p) return '';
  return [
    '══ CHARACTER IDENTITY PROFILE ══',
    'The attached photo is the ground truth. Every panel must match this profile exactly.',
    '',
    `FACE SHAPE: ${p.face_shape}`,
    `HAIR (primary anchor): ${p.hair}`,
    `EYES: ${p.eyes}`,
    `EYEBROWS: ${p.eyebrows}`,
    `NOSE: ${p.nose}`,
    `MOUTH/SMILE: ${p.mouth}`,
    `SKIN TONE: ${p.skin_tone}`,
    `AGE: ${p.age_appearance}`,
    `BUILD: ${p.body_type}`,
    `EMOTIONAL ENERGY: ${p.emotional_energy}`,
    `SILHOUETTE: ${p.silhouette_traits}`,
    `MANGA NOTES: ${p.manga_translation_notes}`,
    '',
    `✅ MUST BE IDENTICAL IN EVERY PANEL: ${p.consistency_anchors}`,
    `🚫 NEVER ALTER THESE: ${p.forbidden_drift}`,
    '══════════════════════════════',
  ].join('\n');
}

// ── Character portrait cache (manga-style reference sheet, generated once per hero image) ──
let _heroMangaPortrait    = null;
let _heroMangaPortraitKey = null;

async function _ensureCharacterPortrait() {
  if (!_heroImageBase64) return;
  const key = _heroImageBase64.slice(0, 60);
  if (_heroMangaPortrait && _heroMangaPortraitKey === key) { console.log('[IMG] Character sheet: using cached ✓'); return; }

  console.log('[IMG] Generating manga character reference sheet (front / 3/4 / side)…');
  try {
    const form = new FormData();
    form.append('model',   'gpt-image-1');
    form.append('image[]', _b64ToBlob(_heroImageBase64, _heroImageMime), 'hero.jpg');
    const identityHint = _heroIdentityProfile
      ? `\nKey identity to preserve — ${_heroIdentityProfile.consistency_anchors}. Never alter: ${_heroIdentityProfile.forbidden_drift}.`
      : '';
    form.append('prompt',
      'Create a manga/anime character reference sheet of the person in the attached photo.\n' +
      'Show THREE views side by side: front view, 3/4 angle, side profile — all the same character.\n' +
      'CRITICAL: Reproduce EXACT facial features — face shape, skin tone, eye shape/color, eyebrows, nose, lips, hair color/texture/volume.' +
      identityHint + '\n' +
      'Bust portrait (head and shoulders) for each view. Plain white background. No text, no labels.\n' +
      'Manga/anime art style. Face accuracy is the absolute top priority.'
    );
    form.append('size',    '1024x1024');
    form.append('quality', 'medium');
    form.append('n',       '1');

    const res = await _openaiProxy('image-edit', form, true);
    if (!res.ok) { console.warn('[IMG] Character sheet API error:', res.status); return; }
    const json = await res.json();
    const b64  = json.data?.[0]?.b64_json;
    if (b64) {
      _heroMangaPortrait    = b64;
      _heroMangaPortraitKey = key;
      console.log('[IMG] Manga character reference sheet ready ✓');
    } else {
      console.warn('[IMG] Character sheet: no image returned — scenes will use original photo only');
    }
  } catch (e) {
    console.warn('[IMG] Character sheet generation skipped:', e.message);
  }
}

function _b64ToBlob(b64, mime) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime || 'image/jpeg' });
}

async function _generateSingleImage(prompt, quality, model, includeChar2 = false, includeHero = true, attempt = 1, simplePrompt = null) {
  const _sleep = ms => new Promise(r => setTimeout(r, ms));

  const sendHero  = includeHero  && !!_heroImageBase64;
  const sendChar2 = includeChar2 && !!_char2ImageBase64;
  console.log(`[IMG] sendHero=${sendHero} sendChar2=${sendChar2} heroLoaded=${!!_heroImageBase64} char2Loaded=${!!_char2ImageBase64}`);

  let res;
  if (model === 'dall-e-3') {
    res = await _openaiProxy('image-generate', {
      model: 'dall-e-3', prompt, n: 1, size: '1024x1792', quality, response_format: 'b64_json',
    });
  } else if (sendHero || sendChar2) {
    // Step 1 — extract structured identity profile (GPT-4o high-detail vision, cached).
    if (sendHero) await _extractCharacterIdentity();
    // Step 2 — generate manga character reference sheet (cached).
    if (sendHero) await _ensureCharacterPortrait();

    // Step 3 — build prompt: identity profile + scene description.
    const identityBlock = _heroIdentityProfile ? _formatIdentityProfile(_heroIdentityProfile) + '\n\n' : '';
    const fullPrompt    = identityBlock + (simplePrompt || prompt);

    // Step 4 — Responses API: GPT-4o processes photo with full vision intelligence
    // then calls image_generation tool (same pipeline as ChatGPT internally).
    const content = [];
    if (sendHero)  content.push({ type: 'input_image', image_url: `data:${_heroImageMime};base64,${_heroImageBase64}`,   detail: 'high' });
    if (sendChar2) content.push({ type: 'input_image', image_url: `data:${_char2ImageMime};base64,${_char2ImageBase64}`, detail: 'high' });
    content.push({ type: 'input_text', text: fullPrompt });

    console.log('[IMG] Responses API + identity profile, anchors:', _heroIdentityProfile?.consistency_anchors);
    console.log('[IMG] prompt preview:', fullPrompt.slice(0, 200));
    res = await _openaiProxy('image-response', {
      model: 'gpt-4o',
      input: [{ role: 'user', content }],
      tools: [{ type: 'image_generation', size: '1024x1536', quality }],
      tool_choice: 'required',
    });
  } else {
    res = await _openaiProxy('image-generate', {
      model: 'gpt-image-1', prompt, n: 1, size: '1024x1536', quality,
    });
  }

  if (res.status === 429 && attempt < 3) {
    const wait = attempt * 12000;
    console.warn(`[IMG] 429 — retrying in ${wait / 1000}s (attempt ${attempt})`);
    await _sleep(wait);
    return _generateSingleImage(prompt, quality, model, includeChar2, includeHero, attempt + 1, simplePrompt);
  }
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    // errJson.error can be a string (proxy errors) or an object (OpenAI errors)
    const msg = errJson.error?.message || errJson.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const json = await res.json();
  // Responses API — extract image from output array
  if (json.output) {
    console.log('[IMG] Responses API output types:', json.output.map(o => o.type).join(', '));
    const imgOutput = json.output.find(o => o.type === 'image_generation_call');
    if (imgOutput) {
      const b64 = imgOutput.result ?? imgOutput.b64_json;
      if (b64) return b64;
    }
    // gpt-4o responded with text instead of calling the tool — fall back to gpt-image-1
    const textOut = json.output.find(o => o.type === 'message');
    console.warn('[IMG] Responses API returned no image, falling back to gpt-image-1. Text:', textOut?.content?.[0]?.text?.slice(0, 200));
    const fallback = await _openaiProxy('image-generate', {
      model: 'gpt-image-1', prompt, n: 1, size: '1024x1536', quality,
    });
    if (!fallback.ok) throw new Error(`Fallback failed: HTTP ${fallback.status}`);
    const fb = await fallback.json();
    return fb.data[0].b64_json;
  }
  // Standard images API (gpt-image-1 / dall-e-3)
  return json.data[0].b64_json;
}

async function _uploadBase64ToStorage(b64, storyId, imageType) {
  if (!_supabase || !storyId) return null;
  try {
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
      .createSignedUrl(path, 315360000);
    if (signError) { console.error('[Storage] sign error:', signError.message); return null; }
    return signData.signedUrl;
  } catch (err) {
    console.error('[Storage] upload failed:', err);
    return null;
  }
}

async function generateImages(prompts, storyId, quality = 'medium', model = 'gpt-image-1') {
  const _sleep = ms => new Promise(r => setTimeout(r, ms));

  for (let idx = 0; idx < prompts.length; idx++) {
    const promptObj = prompts[idx];

    try {
      let b64 = await _generateSingleImage(promptObj.prompt, quality, model, promptObj.includeChar2 || false, promptObj.includeHero !== false, 1, promptObj.simplePrompt);
      if (promptObj.hasBubbles && promptObj.dialogueLines?.length) {
        b64 = await overlayBubbles(b64, promptObj.panelCount || 4, promptObj.dialogueLines);
      }
      const permanentUrl = await _uploadBase64ToStorage(b64, storyId, promptObj.storageKey);
      if (permanentUrl) {
        await saveImageToSupabase(storyId, promptObj.type, promptObj.chapterNum, permanentUrl, promptObj.simplePrompt || promptObj.prompt);
        if (idx === 0) {
          const tile = document.getElementById(`manga-tile-${storyId}`);
          if (tile) {
            let tileImg = tile.querySelector('.manga-tile-img');
            if (!tileImg) {
              tileImg = document.createElement('img');
              tileImg.className = 'manga-tile-img';
              tileImg.alt = '';
              tileImg.setAttribute('onerror', "this.style.display='none';this.nextElementSibling.style.display='flex'");
              tile.insertBefore(tileImg, tile.firstChild);
            }
            tileImg.src = permanentUrl;
            const cover = tile.querySelector('.manga-tile-cover');
            if (cover) cover.style.display = 'none';
          }
        }
      }
    } catch (err) {
      console.error('[IMG] generate error idx=' + idx, err);
    }

    if (idx < prompts.length - 1) await _sleep(1500);
  }
}

async function fetchDialogueForScene(sceneTitle, sceneDesc) {
  try {
    const res = await _openaiProxy('chat', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Write 2 short speech bubble lines for this manga scene.\nScene: "${sceneTitle}${sceneDesc ? ' — ' + sceneDesc : ''}"\nRules: max 4 words each, correct natural English.\nReturn a JSON object: {"lines":["line1","line2"]}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 100,
    });
    if (!res.ok) return [];
    const json = await res.json();
    const parsed = JSON.parse(json.choices[0].message.content);
    return Array.isArray(parsed.lines) ? parsed.lines.filter(Boolean) : [];
  } catch { return []; }
}
