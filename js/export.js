// ── PDF Export — uses browser print-to-PDF (avoids canvas/CORS issues) ──

async function exportMangaPDF(storyId, title) {
  storyId = storyId || window._currentStoryId;
  title   = title   || document.getElementById('modal-title')?.textContent || 'manga';

  if (!storyId || !_supabase) { alert('No manga selected for export.'); return; }

  // Open the window BEFORE any await — preserves the user-gesture context
  // so popup blockers don't intervene.
  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-ups are blocked. Please allow pop-ups for this site and try again.');
    return;
  }

  const btn = document.getElementById('modal-export-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Loading…'; }

  // Placeholder while we fetch image URLs
  win.document.write('<html><body style="font-family:sans-serif;padding:2rem;background:#fff">Loading manga pages…</body></html>');

  try {
    const { data: images, error } = await _supabase
      .from('manga_images')
      .select('image_url, image_type, chapter_num')
      .eq('story_id', storyId);

    if (error) throw error;
    if (!images || images.length === 0) {
      win.close();
      throw new Error('No images found for this manga.');
    }

    const ordered = [
      ...images.filter(i => i.image_type === 'pitch'),
      ...images.filter(i => i.image_type === 'chapter')
               .sort((a, b) => (a.chapter_num || 0) - (b.chapter_num || 0)),
      ...images.filter(i => i.image_type === 'ending'),
    ];

    const safeName = (title || 'manga').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'manga';

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${safeName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #fff; }
    .page {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      break-after: page;
      page-break-after: always;
    }
    .page:last-child { break-after: avoid; page-break-after: avoid; }
    img { max-width: 100%; max-height: 100vh; object-fit: contain; display: block; }
    @page { margin: 0; size: auto; }
    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
${ordered.map(img => `  <div class="page"><img src="${img.image_url}" /></div>`).join('\n')}
<script>
  var images = document.querySelectorAll('img');
  var loaded = 0;
  var fallback = setTimeout(function() { window.print(); }, 5000);
  function onLoad() {
    loaded++;
    if (loaded >= images.length) {
      clearTimeout(fallback);
      setTimeout(function() { window.print(); }, 300);
    }
  }
  images.forEach(function(img) {
    if (img.complete) { onLoad(); }
    else { img.onload = onLoad; img.onerror = onLoad; }
  });
<\/script>
</body>
</html>`);
    win.document.close();

  } catch (err) {
    console.error('[Export] error:', err);
    if (!win.closed) win.close();
    alert('Could not export: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📄 Export PDF'; }
  }
}
