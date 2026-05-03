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
  "image_prompt_pitch": "Detailed English DALL-E 3 prompt depicting the opening situation of this manga (the pitch / inciting incident). Authentic Japanese manga illustration style — black and white ink only, no colour, inspired by legendary mangaka such as Akira Toriyama, Naoki Urasawa, Kentaro Miura and Hajime Isayama. Sharp clean linework, dramatic screen tones (hatching, crosshatching), expressive large eyes, speed lines, cinematic panel composition. Include: key characters, setting, mood. Art style: ${styleLabel}. Under 180 words.",
  "image_prompt_chapter1": "Detailed English DALL-E 3 prompt for the first chapter scene of this manga. Authentic Japanese manga illustration style — black and white ink only, no colour, inspired by legendary mangaka such as Akira Toriyama, Naoki Urasawa, Kentaro Miura and Hajime Isayama. Sharp clean linework, dramatic screen tones, expressive character faces, dynamic action lines, panel-style framing. Include: action or tension from chapter 1, characters, environment. Art style: ${styleLabel}. Under 180 words.",
  "image_prompt_ending": "Detailed English DALL-E 3 prompt depicting the emotional conclusion / ending scene of this manga. Authentic Japanese manga illustration style — black and white ink only, no colour, inspired by legendary mangaka such as Akira Toriyama, Naoki Urasawa, Kentaro Miura and Hajime Isayama. Sharp clean linework, dramatic screen tones, emotionally expressive characters, impactful composition. Include: resolution moment, characters, atmosphere. Art style: ${styleLabel}. Under 180 words."
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

async function generateImages(apiKey, promptPitch, promptChapter1, promptEnding, storyId) {
  // imageType and chapterNum for each slot: pitch, chapter 1, ending
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
      const json = await res.json();
      const url  = json.data[0].url;
      const img      = document.getElementById(`carousel-img-${idx}`);
      const skeleton = document.getElementById(`carousel-skeleton-${idx}`);
      if (img) {
        img.src   = url;
        img.style.display = 'block';
        img.onload = () => { if (skeleton) skeleton.style.display = 'none'; };
      }
      saveImageToSupabase(storyId, meta[idx].type, meta[idx].chapterNum, url, prompt);
    } catch (_) {
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
