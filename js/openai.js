// ── OpenAI: callOpenAI, generateImages ───────────────────

async function callOpenAI(apiKey, data, _attempt = 1) {
  const genreLabel  = genreProfiles[data.genre]?.label  || data.genre;
  const styleLabel  = styleLabels[data.style]           || data.style;

  const chaptersText = (data.chapters && data.chapters.length > 0)
    ? '\n\nScenes defined by the author:\n' + data.chapters.map(ch =>
        `  Scene ${ch.num}${ch.title ? ': ' + ch.title : ''}${ch.description ? '\n    ' + ch.description : ''}`
      ).join('\n')
    : '';

  const faceNote = _heroImageBase64
    ? '\n\nA reference photo of the hero\'s face is attached. Examine it closely and fill the "hero_face_desc" field with a precise physical description suitable for an illustrator: face shape, skin tone, eye color and shape, eyebrow style, nose shape, lip shape, hair color, hair texture and style, any distinctive features (scars, freckles, jawline, cheekbones, etc.). Be as specific as possible so an artist can reproduce this exact face.'
    : '';

  const faceField = _heroImageBase64
    ? '\n  "hero_face_desc": "Precise physical description of the hero\'s face extracted from the reference photo: face shape, skin tone, eye color/shape, eyebrow style, nose, lips, hair color/texture/style, distinctive features. Enough detail for consistent illustration across all panels.",'
    : '';

  const numScenes = (data.chapters && data.chapters.length > 0) ? data.chapters.length : 1;
  const sceneDialogueFields = Array.from({ length: numScenes }, (_, i) =>
    `["punchy line 1 for scene ${i + 1} (≤8 words)", "punchy line 2 for scene ${i + 1} (≤8 words)"]`
  ).join(', ');

  const userPrompt = `Create a complete narrative sheet for this manga:

Title: "${data.titre}"
Genre: ${genreLabel}
Art style: ${styleLabel}
${data.heros    ? `Hero / Heroine: ${data.heros}`         : ''}
${data.heroDesc ? `Hero description: ${data.heroDesc}`    : ''}
${data.univers  ? `Universe / Setting: ${data.univers}`   : ''}${chaptersText}${faceNote}

Reply ONLY with a valid JSON object containing these fields:
{${faceField}
  "synopsis": "Compelling 4–6 sentence synopsis in English. Present the world, the hero, the inciting incident, the stakes. Editorial style, vivid and gripping.",
  "tagline": "Hard-hitting single sentence (15 words max) — manga cover style.",
  "hero_description": "2–3 sentence description of the main character: personality, special power or strength, what makes them unique.",
  "scene_titles": ["Scene title 1", "Scene title 2", "Scene title 3"],
  "universe_desc": "One short immersive sentence describing the universe.",
  "panel_lines": {
    "scenes": [${sceneDialogueFields}]
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Error ${res.status}`;
    if (res.status === 401) throw new Error('Invalid API key. Check your key at platform.openai.com.');
    if (res.status === 429) {
      const isQuota = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('billing');
      if (isQuota) throw new Error('OpenAI quota exceeded — please add credits at platform.openai.com/billing.');
      if (_attempt < 4) {
        const waits = [30000, 65000, 90000];
        const wait = waits[_attempt - 1] || 65000;
        const msgEl = document.getElementById('loading-msg');
        if (msgEl) msgEl.textContent = `⏳ Rate limit — retrying in ${wait / 1000}s… (attempt ${_attempt}/3)`;
        await new Promise(r => setTimeout(r, wait));
        return callOpenAI(apiKey, data, _attempt + 1);
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
  const heroDesc   = aiContent?.hero_description || data.heroDesc || '';
  const setting    = data.univers   || 'an unknown world';
  const synopsis   = aiContent?.synopsis ? aiContent.synopsis.split('.').slice(0, 2).join('.') + '.' : '';
  const isColor    = data.colorStyle === 'color';
  const hasBubbles = data.bubbles !== false;

  const faceRef = _heroImageBase64 && aiContent?.hero_face_desc
    ? ` CRITICAL — reproduce this hero's exact face in every single panel: ${aiContent.hero_face_desc}.`
    : _heroImageBase64
      ? ' A reference photo was provided — reproduce the hero\'s exact facial features consistently in every panel.'
      : '';

  const scenes = data.chapters || [];
  const sceneArc = scenes.length
    ? 'Story arc: ' + scenes.map(ch =>
        `Sc.${ch.num}${ch.title ? ' "' + ch.title + '"' : ''}${ch.description ? ' (' + ch.description + ')' : ''}`
      ).join(' → ') + '.'
    : '';

  const storyCtx = [synopsis && `Story: ${synopsis}`, sceneArc].filter(Boolean).join(' ');

  const visualStyle = isColor
    ? `Full-color professional anime/manga art. Vibrant saturated colors, smooth cel-shading with highlights and shadows, crisp clean linework, richly detailed and fully rendered backgrounds with dramatic lighting. Character designs consistent and polished like a published manga volume.`
    : `Professional black-and-white manga art. Precise clean ink linework with varied line weights, detailed screentone shading and cross-hatching for depth and texture, bold dynamic compositions. Fully rendered backgrounds in every panel. Published manga volume quality.`;

  const textStyle = hasBubbles
    ? `Include story-relevant dialogue and narration as manga text: rounded white speech bubbles with black text for dialogue, rectangular white caption boxes for narration. Text in English, max 8 words per bubble, clearly legible. Integrate text naturally into panel compositions.`
    : `No text, no speech bubbles, no captions, no lettering anywhere. Pure visual storytelling only.`;

  const characterRule = `MANDATORY: ${hero} must have the exact same face, hairstyle, body proportions, and costume in every single panel — perfect character consistency throughout.${faceRef}`;

  const base = `A professional manga/anime story page. 2-column grid layout with 8 panels, each panel numbered 1–8 in a small circle at its top-left corner, thin white gutters between panels. No title banner — use all space for story panels. ${visualStyle} Genre: ${genreLabel}. Art style: ${styleLabel}. Hero: ${hero}${heroDesc ? ' — ' + heroDesc : ''}. Setting: ${setting}. ${storyCtx} ${characterRule} Every panel must have a fully detailed background — no empty or plain backgrounds. Highly expressive anime faces conveying strong emotion. Dynamic action poses with speed lines. ${textStyle}`;

  const dialogueHint = (lines) => {
    if (!hasBubbles || !lines || !lines.length) return '';
    const clean = lines.filter(Boolean);
    return clean.length ? `\nDialogue/caption text to include across panels: ${clean.map(l => `"${l}"`).join(' | ')}` : '';
  };

  const results = [];

  // One image per scene
  const sceneList = scenes.length > 0 ? scenes : [{ num: 1, title: '', description: '' }];
  sceneList.forEach((ch, i) => {
    const num      = ch.num || i + 1;
    const sceneDesc = ch.title
      ? `"${ch.title}"${ch.description ? ': ' + ch.description : ''}`
      : `Scene ${num}${ch.description ? ': ' + ch.description : ''}`;
    results.push({
      type: 'chapter', chapterNum: num, storageKey: `chapter-${num}`,
      prompt: `${base}
Scene flow across 8 panels — SCENE ${num} ${sceneDesc}: panels 1–2 show ${hero} entering the situation; panels 3–4 depict the key conflict or dramatic moment at its peak intensity; panels 5–6 show ${hero}'s reaction, struggle, and inner resolve; panels 7–8 deliver the turning point or emotional climax, leaving a strong impression.${dialogueHint(aiContent?.panel_lines?.scenes?.[i])}`,
    });
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

async function generateImages(apiKey, prompts, storyId, quality = 'medium') {
  const _sleep = ms => new Promise(r => setTimeout(r, ms));

  const _fetchImage = async (prompt, attempt = 1) => {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1536', quality }),
    });
    if (res.status === 429 && attempt < 3) {
      const wait = attempt * 12000;
      console.warn(`[IMG] 429 rate limit — retrying in ${wait / 1000}s (attempt ${attempt})`);
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

    try {
      const json         = await _fetchImage(promptObj.prompt);
      const b64          = json.data[0].b64_json;
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
