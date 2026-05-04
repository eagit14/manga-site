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
      _supabase.from('manga_stories').select('title, genre, tagline').eq('id', storyId).single(),
      _supabase.from('manga_images').select('image_url, image_type, chapter_num').eq('story_id', storyId),
    ]);

    if (imgErr) throw imgErr;
    if (!images || images.length === 0) throw new Error('No images found for this manga.');

    const finalTitle = story?.title  || title;
    const genre      = genreProfiles[story?.genre]?.label || story?.genre || '';
    const tagline    = story?.tagline || '';

    const ordered = images
      .filter(i => i.image_type === 'chapter')
      .sort((a, b) => (a.chapter_num || 0) - (b.chapter_num || 0));

    // 6" × 9" — Lulu standard trade paperback
    const W = 152.4, H = 228.6;
    const doc = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H], compress: true });

    // ── Title page ──────────────────────────────────────
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, W, H, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const titleFontSize = finalTitle.length > 22 ? 20 : finalTitle.length > 14 ? 26 : 32;
    doc.setFontSize(titleFontSize);
    const titleLines = doc.splitTextToSize(finalTitle.toUpperCase(), W - 20);
    doc.text(titleLines, W / 2, H * 0.38, { align: 'center' });

    // Red accent line
    doc.setFillColor(192, 57, 43);
    doc.rect(12, H * 0.47, W - 24, 1.2, 'F');

    // Genre
    if (genre) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(192, 57, 43);
      doc.text(genre.toUpperCase(), W / 2, H * 0.47 + 8, { align: 'center' });
    }

    // Tagline
    if (tagline) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      const tagLines = doc.splitTextToSize(`"${tagline}"`, W - 32);
      doc.text(tagLines, W / 2, H * 0.47 + (genre ? 20 : 9), { align: 'center' });
    }

    // Branding
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text('MANGA 世界', W / 2, H - 10, { align: 'center' });

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

      // Page label
      const img = ordered[i];
      const pageLabel = `Scene ${img.chapter_num || i + 1}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 80);
      doc.text(pageLabel, W / 2, H - 4, { align: 'center' });
    }

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
