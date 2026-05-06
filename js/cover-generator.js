// ── Book Cover Generator — jsPDF, Lulu-ready ──

function _parseGradColors(grad) {
  const matches = grad.match(/#[0-9a-f]{3,6}/gi) || [];
  return matches.map(hex => {
    const h = hex.replace('#', '');
    if (h.length === 3) {
      return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
    }
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  });
}

// Front cover: title + genre at top, hero image fills ~2/3 of page, tagline below.
function _drawFrontCover(doc, W, H, cols, { title, genre, tagline, heroName, firstImageB64 }) {
  const accent = cols[2] || [192, 57, 43];

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // Top accent bar
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 3, 'F');

  // Title
  const tfSize    = title.length > 22 ? 17 : title.length > 14 ? 21 : 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(tfSize);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), W - 14);
  doc.text(titleLines, W / 2, 13, { align: 'center' });

  // Genre badge
  const titleH = titleLines.length * tfSize * 0.3528;
  const genreY  = 13 + titleH + 3.5;
  if (genre) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...accent);
    doc.text(genre.toUpperCase(), W / 2, genreY, { align: 'center' });
  }

  // Hero image — 2/3 of page width and height, centered horizontally
  const imgTop  = genreY + 5;
  const imgW    = W * 0.66;
  const imgH    = Math.min(H * 0.66, H - imgTop - 28);
  const imgX    = (W - imgW) / 2;

  if (firstImageB64) {
    try {
      const fmt = firstImageB64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(firstImageB64, fmt, imgX, imgTop, imgW, imgH, undefined, 'NONE');
    } catch (_) {
      doc.setFillColor(210, 210, 210);
      doc.rect(imgX, imgTop, imgW, imgH, 'F');
    }
  } else {
    // Gradient-tinted placeholder
    doc.setFillColor(...(cols[0] || [40, 40, 40]));
    doc.rect(imgX, imgTop, imgW, imgH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    const pl = doc.splitTextToSize(title.toUpperCase(), imgW - 10);
    doc.text(pl, W / 2, imgTop + imgH / 2, { align: 'center' });
  }

  // Tagline below image
  const taglineY = imgTop + imgH + 7;
  if (tagline) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    const tl = doc.splitTextToSize(`"${tagline}"`, W - 18);
    doc.text(tl, W / 2, taglineY, { align: 'center', lineHeightFactor: 1.5 });
  }

  // Bottom accent bar
  doc.setFillColor(...accent);
  doc.rect(0, H - 3, W, 3, 'F');
}

// Back cover: AI-generated story blurb + QR code.
function _drawBackCover(doc, W, H, cols, { title, synopsis, backSummary }) {
  const accent   = cols[2] || [192, 57, 43];
  const siteUrl  = window.location.origin;
  const bodyText = backSummary || synopsis || '';

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // Top accent bar
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 3, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(title.toUpperCase(), W / 2, 18, { align: 'center' });

  // Divider
  doc.setFillColor(...accent);
  doc.rect(16, 23, W - 32, 0.7, 'F');

  // Story summary inside a red border rectangle
  if (bodyText) {
    const pad   = 4;
    const rectX = 14;
    const rectW = W - 28;
    const textW = rectW - pad * 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lines  = doc.splitTextToSize(bodyText, textW).slice(0, 18);
    const lineH  = 8.5 * 1.6 * 0.3528;
    const rectY  = 27;
    const rectH  = lines.length * lineH + pad * 2 + 2;

    // Red border rectangle (no fill)
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.6);
    doc.rect(rectX, rectY, rectW, rectH, 'S');

    // Justified text inside the rectangle
    doc.setTextColor(55, 55, 55);
    doc.text(lines, rectX + pad, rectY + pad + lineH * 0.82, {
      align: 'justify',
      maxWidth: textW,
      lineHeightFactor: 1.6,
    });
  }

  // QR code
  const qrSize = 32;
  const qrX    = (W - qrSize) / 2;
  const qrY    = H - 52;
  try {
    const qr = qrcode(0, 'M');
    qr.addData(siteUrl);
    qr.make();
    doc.addImage(qr.createDataURL(4, 0), 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (_) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.rect(qrX, qrY, qrSize, qrSize, 'S');
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text('Scan to read online', W / 2, qrY + qrSize + 5, { align: 'center' });

  // Bottom accent bar
  doc.setFillColor(...accent);
  doc.rect(0, H - 3, W, 3, 'F');
}

// Calls GPT-4o-mini with all chapter descriptions to produce a 4-5 sentence back cover blurb.
async function generateBackCoverSummary(chapters, title, genre) {
  if (typeof OPENAI_API_KEY === 'undefined' || !OPENAI_API_KEY || !chapters?.length) return null;

  const scenesText = chapters
    .map((ch, i) => {
      const num  = ch.chapter_num ?? ch.num ?? (i + 1);
      const name = ch.title ? ` — ${ch.title}` : '';
      const desc = ch.description ? `: ${ch.description}` : '';
      return `Scene ${num}${name}${desc}`;
    })
    .filter(s => s.trim())
    .join('\n');

  if (!scenesText.trim()) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        max_tokens:  280,
        temperature: 0.75,
        messages: [{
          role:    'user',
          content: `You are writing the back cover blurb for a manga/comic book titled "${title}" (genre: ${genre || 'manga'}).

Here are the story scenes:
${scenesText}

Write exactly 4-5 sentences that:
• Hook the reader immediately
• Introduce the hero and their world
• Hint at the central conflict
• Build intrigue — do NOT reveal the ending
• Read like a professional book blurb

Return ONLY the blurb text, no quotes, no titles, no labels.`,
        }],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch (_) {
    return null;
  }
}

// Generate a manga-style hero portrait for the cover using the hero reference photo.
async function _generateCoverHeroImage(apiKey, heroDataUrl, story) {
  if (!apiKey || !heroDataUrl) return null;
  const match = heroDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const [, mime, b64] = match;

  const heroName   = story.hero_name   || 'the protagonist';
  const heroDesc   = story.hero_ai_desc || story.hero_desc || '';
  const genreLabel = (window.genreProfiles || {})[story.genre]?.label || story.genre || 'manga';

  const prompt = `Manga book cover art. Portrait illustration of ${heroName}${heroDesc ? ', ' + heroDesc : ''}. ${genreLabel} manga style. Highly expressive face conveying intense emotion — determination, fear, or passion. Dynamic pose, strong clean linework, vivid expressive eyes, same character appearance as the reference photo. No text, no speech bubbles, no title, no borders.`;

  try {
    const binary = atob(b64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const heroBlob = new Blob([bytes], { type: mime });

    const form = new FormData();
    form.append('model',   'gpt-image-1');
    form.append('image[]', heroBlob, 'hero.jpg');
    form.append('prompt',  prompt);
    form.append('size',    '1024x1536');
    form.append('quality', 'medium');
    form.append('n',       '1');

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) return null;
    const json = await res.json();
    const resultB64 = json.data?.[0]?.b64_json;
    return resultB64 ? `data:image/png;base64,${resultB64}` : null;
  } catch (_) {
    return null;
  }
}

// Fire-and-forget: called after each scene image is saved.
// - Generates the cover photo (PNG) once → manga_images (image_type='cover').
// - Generates the cover PDF once → manga_stories.cover_pdf_url.
// - Always refreshes the back-cover blurb → manga_images.prompt_used for the cover row.
async function _triggerCoverPreGeneration(storyId) {
  if (!_supabase || !storyId || typeof jspdf === 'undefined') {
    console.warn('[Cover] pre-generation skipped — missing supabase, storyId, or jspdf');
    return;
  }
  console.log('[Cover] pre-generation started for story:', storyId);
  try {
    const [{ data: story }, { data: chapters }, { data: images }, { data: existingCover }] = await Promise.all([
      _supabase.from('manga_stories').select('title,genre,tagline,synopsis,cover_gradient,hero_name,hero_desc,hero_ai_desc').eq('id', storyId).single(),
      _supabase.from('manga_chapters').select('chapter_num,title,description').eq('story_id', storyId).order('chapter_num', { ascending: true }),
      _supabase.from('manga_images').select('image_url,image_type,chapter_num').eq('story_id', storyId),
      _supabase.from('manga_images').select('id,image_url').eq('story_id', storyId).eq('image_type', 'cover').maybeSingle(),
    ]);
    if (!story) { console.warn('[Cover] story not found'); return; }
    console.log('[Cover] fetched story, chapters:', chapters?.length, 'images:', images?.length, 'existingCover:', !!existingCover?.image_url);

    // Always refresh the blurb
    const backSummary = await generateBackCoverSummary(chapters || [], story.title || 'Manga', story.genre || '');
    console.log('[Cover] backSummary:', backSummary ? 'generated' : 'null');

    if (existingCover?.image_url) {
      // Cover photo already exists — just update the cached blurb
      await _supabase.from('manga_images')
        .update({ prompt_used: backSummary || null })
        .eq('id', existingCover.id);
      console.log('[Cover] Blurb refreshed ✓', storyId);
      return;
    }

    // ── First time: generate cover photo + PDF ──────────────────────────
    const title    = story.title    || 'Manga';
    const grad     = story.cover_gradient || 'linear-gradient(135deg,#1a0505,#c0392b)';
    const tagline  = story.tagline  || '';
    const synopsis = story.synopsis || '';
    const profile  = (window.genreProfiles || {})[story.genre];
    const genre    = profile?.label || story.genre || '';

    // 1. Generate manga-style hero portrait (cover photo)
    const apiKey  = typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : null;
    const heroRow = (images || []).find(i => i.image_type === 'hero');
    let coverImageDataUrl = null;
    console.log('[Cover] apiKey present:', !!apiKey, '| heroRow:', !!heroRow?.image_url);

    if (apiKey && heroRow?.image_url) {
      try {
        const heroDataUrl  = await _fetchImageBase64(heroRow.image_url);
        coverImageDataUrl  = await _generateCoverHeroImage(apiKey, heroDataUrl, story);
        console.log('[Cover] hero portrait generated:', !!coverImageDataUrl);
      } catch (err) { console.error('[Cover] hero portrait generation error:', err); }
    }
    // Fallback: first scene image
    if (!coverImageDataUrl) {
      const firstScene = (images || [])
        .filter(i => i.image_type === 'chapter')
        .sort((a, b) => (a.chapter_num || 0) - (b.chapter_num || 0))[0];
      console.log('[Cover] falling back to first scene image:', !!firstScene?.image_url);
      if (firstScene) {
        try { coverImageDataUrl = await _fetchImageBase64(firstScene.image_url); } catch (err) { console.error('[Cover] scene image fetch error:', err); }
      }
    }
    console.log('[Cover] coverImageDataUrl ready:', !!coverImageDataUrl);

    // 2. Upload cover photo PNG → manga_images (image_type='cover')
    if (coverImageDataUrl) {
      const b64 = coverImageDataUrl.replace(/^data:[^;]+;base64,/, '');
      const coverImageUrl = await _uploadBase64ToStorage(b64, storyId, 'cover');
      console.log('[Cover] cover image uploaded:', !!coverImageUrl);
      if (coverImageUrl) {
        const { error: imgInsertErr } = await _supabase.from('manga_images').insert({
          story_id:    storyId,
          image_type:  'cover',
          chapter_num: null,
          image_url:   coverImageUrl,
          prompt_used: backSummary || null,
        });
        if (imgInsertErr) console.error('[Cover] manga_images insert error:', imgInsertErr.message);
        else console.log('[Cover] cover photo saved to manga_images ✓');
      }
    } else {
      // No cover image — still save the blurb in a placeholder row so it's cached
      const { error: imgInsertErr } = await _supabase.from('manga_images').insert({
        story_id:    storyId,
        image_type:  'cover',
        chapter_num: null,
        image_url:   null,
        prompt_used: backSummary || null,
      });
      if (imgInsertErr) console.error('[Cover] blurb placeholder insert error:', imgInsertErr.message);
    }

    console.log('[Cover] Cover photo cached ✓', storyId);
  } catch (err) {
    console.error('[Cover] pre-generation failed:', err);
  }
}

// Public: generate a 2-page cover PDF and optionally download it.
async function generateCoverPDF({ title, tagline, genre, heroName, synopsis, backSummary, grad, firstImageB64 = null, download = false }) {
  if (typeof jspdf === 'undefined') {
    alert('PDF library not loaded — please refresh the page.');
    return null;
  }

  const W    = 152.4, H = 228.6;
  const doc  = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H], compress: true });
  const cols = _parseGradColors(grad);

  _drawFrontCover(doc, W, H, cols, { title, genre, tagline, heroName, firstImageB64 });
  doc.addPage([W, H]);
  _drawBackCover(doc, W, H, cols, { title, synopsis, backSummary });

  if (download) {
    const safe = (title || 'cover').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'cover';
    doc.save(`${safe}-cover.pdf`);
    return null;
  }
  return doc;
}
