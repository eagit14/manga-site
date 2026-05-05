// ── PDF Export — jsPDF, Lulu-ready 6" × 9" ──────────────

async function exportMangaPDF(storyId, title, callerBtn) {
  storyId = storyId || window._currentStoryId;
  title   = title   || document.getElementById('modal-title')?.textContent || 'manga';

  if (!storyId || !_supabase) { alert('No manga selected for export.'); return; }
  if (typeof jspdf === 'undefined') { alert('PDF library not loaded — please refresh the page.'); return; }

  const btn      = document.getElementById('modal-export-btn') || callerBtn || null;
  const origText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Building PDF…'; }

  try {
    const [{ data: story }, { data: images, error: imgErr }] = await Promise.all([
      _supabase.from('manga_stories').select('title, genre, tagline, synopsis, cover_gradient').eq('id', storyId).single(),
      _supabase.from('manga_images').select('image_url, image_type, chapter_num').eq('story_id', storyId),
    ]);

    if (imgErr) throw imgErr;
    if (!images || images.length === 0) throw new Error('No images found for this manga.');

    const finalTitle = story?.title    || title;
    const genre      = genreProfiles[story?.genre]?.label || story?.genre || '';
    const tagline    = story?.tagline  || '';
    const synopsis   = story?.synopsis || '';
    const grad       = story?.cover_gradient || 'linear-gradient(155deg,#1a0505,#7a0f0f,#c0392b)';
    const cols       = _parseGradColors(grad);

    const ordered = images
      .filter(i => i.image_type === 'chapter')
      .sort((a, b) => (a.chapter_num || 0) - (b.chapter_num || 0));

    // 6" × 9" — Lulu standard trade paperback
    const W = 152.4, H = 228.6;
    const doc = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H], compress: true });

    // ── Front cover ─────────────────────────────────────
    if (btn) btn.textContent = '⏳ Loading cover image…';
    let firstImageB64 = null;
    if (ordered.length > 0) {
      try { firstImageB64 = await _fetchImageBase64(ordered[0].image_url); } catch (_) {}
    }
    _drawFrontCover(doc, W, H, cols, { title: finalTitle, genre, tagline, heroName: '', firstImageB64 });

    // ── Image pages ─────────────────────────────────────
    for (let i = 0; i < ordered.length; i++) {
      if (btn) btn.textContent = `⏳ Page ${i + 1} / ${ordered.length}…`;

      doc.addPage([W, H]);

      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, W, H, 'F');

      try {
        const b64 = await _fetchImageBase64(ordered[i].image_url);
        const fmt = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(b64, fmt, 0, 0, W, H, undefined, 'NONE');
      } catch (e) {
        console.warn('[Export] image load failed:', e);
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.text('Image unavailable', W / 2, H / 2, { align: 'center' });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Scene ${ordered[i].chapter_num || i + 1}`, W / 2, H - 4, { align: 'center' });
    }

    // ── Back cover ───────────────────────────────────────
    if (btn) btn.textContent = '⏳ Generating QR code…';
    doc.addPage([W, H]);
    await _drawBackCover(doc, W, H, cols, { title: finalTitle, synopsis });

    const safeName = finalTitle.replace(/[^a-z0-9_\- ]/gi, '').trim() || 'manga';
    doc.save(`${safeName}.pdf`);

  } catch (err) {
    console.error('[Export] error:', err);
    alert('Could not export PDF: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText || '📄 Export PDF'; }
  }
}

async function _fetchImageBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror   = reject;
    reader.readAsDataURL(blob);
  });
}
