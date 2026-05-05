// ── Book Cover Generator — jsPDF, Lulu-ready 6" × 9" ──

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

// Draw front cover — white background, first manga image centered.
function _drawFrontCover(doc, W, H, cols, { title, genre, tagline, heroName, firstImageB64 }) {
  const accent = cols[2] || [192, 57, 43];

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // Top accent bar
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 3, 'F');

  // Title
  const tfSize   = title.length > 22 ? 18 : title.length > 14 ? 22 : 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(tfSize);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), W - 20);
  doc.text(titleLines, W / 2, 16, { align: 'center' });

  // Genre label
  const genreY = 16 + titleLines.length * tfSize * 0.3528 + 4;
  if (genre) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...accent);
    doc.text(genre.toUpperCase(), W / 2, genreY, { align: 'center' });
  }

  // First manga image — centered with margin, not full page
  const imageTop = genreY + 7;
  const margin   = 12; // mm
  const imgW     = W - margin * 2;
  const imgH     = imgW; // square
  const maxH     = H - imageTop - 22; // leave room for tagline
  const drawH    = Math.min(imgH, maxH);
  const imgX     = margin;
  const imgY     = imageTop;

  if (firstImageB64) {
    try {
      const fmt = firstImageB64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(firstImageB64, fmt, imgX, imgY, imgW, drawH, undefined, 'NONE');
    } catch (_) {
      // fallback: light gray placeholder
      doc.setFillColor(230, 230, 230);
      doc.rect(imgX, imgY, imgW, drawH, 'F');
    }
  } else {
    doc.setFillColor(230, 230, 230);
    doc.rect(imgX, imgY, imgW, drawH, 'F');
  }

  // Tagline below image
  if (tagline) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    const tlLines = doc.splitTextToSize(`"${tagline}"`, W - 20);
    doc.text(tlLines, W / 2, imgY + drawH + 8, { align: 'center' });
  }

  // Bottom accent bar
  doc.setFillColor(...accent);
  doc.rect(0, H - 3, W, 3, 'F');
}

// Draw back cover — synopsis at top, QR code near bottom.
function _drawBackCover(doc, W, H, cols, { title, synopsis }) {
  const accent  = cols[2] || [192, 57, 43];
  const siteUrl = window.location.origin;

  // White background
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

  // Synopsis
  if (synopsis) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    const synLines = doc.splitTextToSize(synopsis, W - 28);
    doc.text(synLines.slice(0, 15), W / 2, 31, { align: 'center', lineHeightFactor: 1.55 });
  }

  // QR code near bottom — links to site origin
  const qrSize = 32; // mm
  const qrX    = (W - qrSize) / 2;
  const qrY    = H - 52;

  try {
    const qr = qrcode(0, 'M');
    qr.addData(siteUrl);
    qr.make();
    const qrDataUrl = qr.createDataURL(4, 0);
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.warn('[QR] generation failed:', err);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.rect(qrX, qrY, qrSize, qrSize, 'S');
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Scan to read online', W / 2, qrY + qrSize + 5, { align: 'center' });

  // Bottom accent bar
  doc.setFillColor(...accent);
  doc.rect(0, H - 3, W, 3, 'F');
}

// Public: generate a 2-page cover PDF and optionally download it.
function generateCoverPDF({ title, tagline, genre, heroName, synopsis, grad, firstImageB64 = null, download = false }) {
  if (typeof jspdf === 'undefined') {
    alert('PDF library not loaded — please refresh the page.');
    return null;
  }

  const W    = 152.4, H = 228.6;
  const doc  = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H], compress: true });
  const cols = _parseGradColors(grad);

  _drawFrontCover(doc, W, H, cols, { title, genre, tagline, heroName, firstImageB64 });
  doc.addPage([W, H]);
  _drawBackCover(doc, W, H, cols, { title, synopsis });

  if (download) {
    const safe = (title || 'cover').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'cover';
    doc.save(`${safe}-cover.pdf`);
    return null;
  }
  return doc;
}
