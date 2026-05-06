// Canvas-based speech bubble overlay
// Called after image generation to render dialogue programmatically.

function _getPanelBounds(panelCount, imgW, imgH) {
  const M     = Math.round(imgW * 0.016); // ~16px margin for 1024px image
  const G     = M;
  const colW  = (imgW - 2 * M - G) / 2;
  const x0    = M;
  const x1    = M + colW + G;
  const fullW = imgW - 2 * M;

  function rowLayout(numRows) {
    const rowH = (imgH - 2 * M - (numRows - 1) * G) / numRows;
    return Array.from({ length: numRows }, (_, r) => ({
      y: M + r * (rowH + G),
      h: rowH,
    }));
  }

  const b = [];

  if (panelCount === 4) {
    const [r0, r1] = rowLayout(2);
    b.push({ x: x0, y: r0.y, w: colW, h: r0.h });
    b.push({ x: x1, y: r0.y, w: colW, h: r0.h });
    b.push({ x: x0, y: r1.y, w: colW, h: r1.h });
    b.push({ x: x1, y: r1.y, w: colW, h: r1.h });
  } else if (panelCount === 5) {
    const [r0, r1, r2] = rowLayout(3);
    b.push({ x: x0, y: r0.y, w: colW,  h: r0.h });
    b.push({ x: x1, y: r0.y, w: colW,  h: r0.h });
    b.push({ x: x0, y: r1.y, w: colW,  h: r1.h });
    b.push({ x: x1, y: r1.y, w: colW,  h: r1.h });
    b.push({ x: x0, y: r2.y, w: fullW, h: r2.h });
  } else if (panelCount === 6) {
    const [r0, r1, r2] = rowLayout(3);
    b.push({ x: x0, y: r0.y, w: colW, h: r0.h });
    b.push({ x: x1, y: r0.y, w: colW, h: r0.h });
    b.push({ x: x0, y: r1.y, w: colW, h: r1.h });
    b.push({ x: x1, y: r1.y, w: colW, h: r1.h });
    b.push({ x: x0, y: r2.y, w: colW, h: r2.h });
    b.push({ x: x1, y: r2.y, w: colW, h: r2.h });
  } else if (panelCount === 7) {
    const [r0, r1, r2, r3] = rowLayout(4);
    b.push({ x: x0, y: r0.y, w: colW,  h: r0.h });
    b.push({ x: x1, y: r0.y, w: colW,  h: r0.h });
    b.push({ x: x0, y: r1.y, w: colW,  h: r1.h });
    b.push({ x: x1, y: r1.y, w: colW,  h: r1.h });
    b.push({ x: x0, y: r2.y, w: colW,  h: r2.h });
    b.push({ x: x1, y: r2.y, w: colW,  h: r2.h });
    b.push({ x: x0, y: r3.y, w: fullW, h: r3.h });
  } else {
    // 8 panels: 2×4
    const [r0, r1, r2, r3] = rowLayout(4);
    b.push({ x: x0, y: r0.y, w: colW, h: r0.h });
    b.push({ x: x1, y: r0.y, w: colW, h: r0.h });
    b.push({ x: x0, y: r1.y, w: colW, h: r1.h });
    b.push({ x: x1, y: r1.y, w: colW, h: r1.h });
    b.push({ x: x0, y: r2.y, w: colW, h: r2.h });
    b.push({ x: x1, y: r2.y, w: colW, h: r2.h });
    b.push({ x: x0, y: r3.y, w: colW, h: r3.h });
    b.push({ x: x1, y: r3.y, w: colW, h: r3.h });
  }
  return b;
}

function _wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth || !cur) {
      cur = test;
    } else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function _drawSpeechBubble(ctx, text, px, py, pw, ph) {
  if (!text || !text.trim()) return;

  const label      = text.trim().toUpperCase();
  const fontSize   = Math.max(10, Math.round(pw * 0.052));
  const pad        = Math.round(fontSize * 0.5);
  const maxTextW   = pw * 0.75 - pad * 2;
  const tailH      = Math.round(fontSize * 0.55);
  const radius     = Math.round(fontSize * 0.5);
  const lineH      = fontSize * 1.35;

  ctx.font = `bold ${fontSize}px 'Bangers', 'Comic Sans MS', cursive`;
  const lines    = _wrapText(ctx, label, maxTextW);
  const textW    = Math.max(...lines.map(l => ctx.measureText(l).width));
  const bubbleW  = textW + pad * 2;
  const bubbleH  = lines.length * lineH + pad * 2;

  // Position: top-center of panel with a small top inset
  const bx = px + (pw - bubbleW) / 2;
  const by = py + Math.round(ph * 0.06);
  const tailCx = bx + bubbleW / 2;

  // Bubble path builder (reused for fill + stroke)
  function bubblePath() {
    ctx.beginPath();
    ctx.moveTo(bx + radius, by);
    ctx.lineTo(bx + bubbleW - radius, by);
    ctx.quadraticCurveTo(bx + bubbleW, by, bx + bubbleW, by + radius);
    ctx.lineTo(bx + bubbleW, by + bubbleH - radius);
    ctx.quadraticCurveTo(bx + bubbleW, by + bubbleH, bx + bubbleW - radius, by + bubbleH);
    ctx.lineTo(tailCx + tailH * 0.55, by + bubbleH);
    ctx.lineTo(tailCx, by + bubbleH + tailH);
    ctx.lineTo(tailCx - tailH * 0.55, by + bubbleH);
    ctx.lineTo(bx + radius, by + bubbleH);
    ctx.quadraticCurveTo(bx, by + bubbleH, bx, by + bubbleH - radius);
    ctx.lineTo(bx, by + radius);
    ctx.quadraticCurveTo(bx, by, bx + radius, by);
    ctx.closePath();
  }

  // Shadow
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur    = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  bubblePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.restore();

  // Stroke outline
  bubblePath();
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth   = Math.max(1, fontSize * 0.08);
  ctx.stroke();

  // Text
  ctx.fillStyle    = '#111';
  ctx.font         = `bold ${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';
  lines.forEach((line, li) => {
    const tx = bx + (bubbleW - ctx.measureText(line).width) / 2;
    const ty = by + pad + li * lineH;
    ctx.fillText(line, tx, ty);
  });
}

async function overlayBubbles(b64, panelCount, lines) {
  const validLines = (lines || []).filter(Boolean);
  if (!validLines.length) return b64;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas  = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx     = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const panels = _getPanelBounds(panelCount, img.width, img.height);
      validLines.forEach((text, i) => {
        if (i >= panels.length) return;
        const p = panels[i];
        _drawSpeechBubble(ctx, text, p.x, p.y, p.w, p.h);
      });

      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => resolve(b64);
    img.src = `data:image/png;base64,${b64}`;
  });
}
