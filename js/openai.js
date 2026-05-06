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

  function _panelLayout(descLen) {
    const n = descLen <= 0  ? 4
            : descLen <= 80 ? 5
            : descLen <= 160 ? 6
            : descLen <= 240 ? 7
            : 8;
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
    results.push({
      type: 'chapter', chapterNum: num, storageKey: `chapter-${num}`,
      prompt: _cap(prompt), includeChar2, includeHero,
      hasBubbles,
      dialogueLines: sceneDialogue,
      panelCount,
    });
  });

  return results;
}

function _b64ToBlob(b64, mime) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime || 'image/jpeg' });
}

async function _generateSingleImage(prompt, quality, model, includeChar2 = false, includeHero = true, attempt = 1) {
  const _sleep = ms => new Promise(r => setTimeout(r, ms));

  const sendHero  = includeHero  && !!_heroImageBase64;
  const sendChar2 = includeChar2 && !!_char2ImageBase64;

  let res;
  if (model === 'dall-e-3') {
    res = await _openaiProxy('image-generate', {
      model: 'dall-e-3', prompt, n: 1, size: '1024x1792', quality, response_format: 'b64_json',
    });
  } else if (sendHero || sendChar2) {
    const form = new FormData();
    form.append('model',  'gpt-image-1');
    if (sendHero)  form.append('image[]', _b64ToBlob(_heroImageBase64,  _heroImageMime),  'hero.jpg');
    if (sendChar2) form.append('image[]', _b64ToBlob(_char2ImageBase64, _char2ImageMime), 'char2.jpg');
    form.append('prompt',  prompt);
    form.append('size',    '1024x1536');
    form.append('quality', quality);
    form.append('n',       '1');
    res = await _openaiProxy('image-edit', form, true);
  } else {
    res = await _openaiProxy('image-generate', {
      model: 'gpt-image-1', prompt, n: 1, size: '1024x1536', quality,
    });
  }

  if (res.status === 429 && attempt < 3) {
    const wait = attempt * 12000;
    console.warn(`[IMG] 429 — retrying in ${wait / 1000}s (attempt ${attempt})`);
    await _sleep(wait);
    return _generateSingleImage(prompt, quality, model, includeChar2, includeHero, attempt + 1);
  }
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    // errJson.error can be a string (proxy errors) or an object (OpenAI errors)
    const msg = errJson.error?.message || errJson.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const json = await res.json();
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
      let b64 = await _generateSingleImage(promptObj.prompt, quality, model, promptObj.includeChar2 || false, promptObj.includeHero !== false);
      if (promptObj.hasBubbles && promptObj.dialogueLines?.length) {
        b64 = await overlayBubbles(b64, promptObj.panelCount || 4, promptObj.dialogueLines);
      }
      const permanentUrl = await _uploadBase64ToStorage(b64, storyId, promptObj.storageKey);
      if (permanentUrl) {
        await saveImageToSupabase(storyId, promptObj.type, promptObj.chapterNum, permanentUrl, promptObj.prompt);
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
