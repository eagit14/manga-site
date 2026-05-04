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

// Draw front cover onto the current page of an existing jsPDF doc.
function _drawFrontCover(doc, W, H, cols, { title, genre, tagline, heroName }) {
  const dark   = cols[0] || [10, 5, 5];
  const mid    = cols[1] || [80, 20, 20];
  const accent = cols[2] || [192, 57, 43];

  doc.setFillColor(...dark);
  doc.rect(0, 0, W, H, 'F');

  doc.setFillColor(...mid);
  doc.rect(W * 0.6, 0, W * 0.4, H, 'F');

  doc.setFillColor(...accent);
  doc.rect(W * 0.6 - 2, 0, 3, H, 'F');

  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 3, 'F');

  // Volume badge
  doc.setFillColor(...dark);
  doc.roundedRect(9, 10, 34, 8, 2, 2, 'F');
  doc.setFillColor(...accent);
  doc.roundedRect(8, 9, 34, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('VOLUME 1', 25, 14.5, { align: 'center' });

  if (genre) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(genre.toUpperCase(), W - 8, 14.5, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const tfSize = title.length > 22 ? 22 : title.length > 14 ? 28 : 34;
  doc.setFontSize(tfSize);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), W * 0.55 - 12);
  doc.text(titleLines, 10, H * 0.38, { align: 'left', baseline: 'middle' });

  const divY = H * 0.38 + (titleLines.length * tfSize * 0.3528) + 4;
  doc.setFillColor(...accent);
  doc.rect(10, divY, W * 0.5 - 10, 1.5, 'F');

  if (tagline) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    const tlLines = doc.splitTextToSize(`"${tagline}"`, W * 0.55 - 14);
    doc.text(tlLines, 10, divY + 7, { align: 'left' });
  }

  if (heroName && heroName !== 'Protagonist') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...accent);
    doc.text(`★ ${heroName}`, 10, H - 22);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('MANGA', 10, H - 10);
  doc.setTextColor(...accent);
  doc.text(' 世界', 10 + doc.getTextWidth('MANGA'), H - 10);
}

// Draw back cover onto the current page of an existing jsPDF doc.
function _drawBackCover(doc, W, H, cols, { title, synopsis }) {
  const mid    = cols[1] || [80, 20, 20];
  const accent = cols[2] || [192, 57, 43];

  doc.setFillColor(8, 8, 8);
  doc.rect(0, 0, W, H, 'F');

  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...accent);
  doc.text('MANGA ', W / 2, 20, { align: 'right' });
  doc.setTextColor(255, 255, 255);
  doc.text('世界', W / 2, 20, { align: 'left' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), W / 2, 32, { align: 'center' });

  doc.setFillColor(...mid);
  doc.rect(16, 37, W - 32, 0.7, 'F');

  if (synopsis) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(160, 160, 160);
    const synLines = doc.splitTextToSize(synopsis, W - 28);
    doc.text(synLines.slice(0, 13), W / 2, 46, { align: 'center', lineHeightFactor: 1.55 });
  }

  const bx = W / 2 - 19, by = H - 40;
  doc.setFillColor(18, 18, 18);
  doc.roundedRect(bx, by, 38, 24, 1, 1, 'F');
  doc.setDrawColor(...mid);
  doc.setLineWidth(0.3);
  doc.roundedRect(bx, by, 38, 24, 1, 1, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(60, 60, 60);
  doc.text('ISBN / BARCODE', W / 2, by + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(70, 70, 70);
  doc.text('manga-world.com', W / 2, H - 6, { align: 'center' });
}

// Public: generate a 2-page cover PDF and optionally download it.
function generateCoverPDF({ title, tagline, genre, heroName, synopsis, grad, download = false }) {
  if (typeof jspdf === 'undefined') {
    alert('PDF library not loaded — please refresh the page.');
    return null;
  }

  const W    = 152.4, H = 228.6;
  const doc  = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H], compress: true });
  const cols = _parseGradColors(grad);

  _drawFrontCover(doc, W, H, cols, { title, genre, tagline, heroName });
  doc.addPage([W, H]);
  _drawBackCover(doc, W, H, cols, { title, synopsis });

  if (download) {
    const safe = (title || 'cover').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'cover';
    doc.save(`${safe}-cover.pdf`);
    return null;
  }
  return doc;
}
