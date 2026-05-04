// ── Chapter management ────────────────────────────────

let _chapterIdCounter = 0;

function addChapter() {
  const entries = document.querySelectorAll('.chapter-entry');
  if (entries.length >= 20) return;
  _chapterIdCounter++;
  const cid = _chapterIdCounter;
  const num = entries.length + 1;
  const list = document.getElementById('chapters-list');
  const div  = document.createElement('div');
  div.className = 'chapter-entry';
  div.id = `chapter-entry-${cid}`;
  div.innerHTML = `
    <div class="chapter-entry-hdr">
      <span class="chapter-entry-num">Sc. ${num}</span>
      <input class="form-input chapter-title-input" id="ch-title-${cid}" type="text" placeholder="Scene title…" maxlength="80" />
      <button type="button" class="chapter-remove-btn" onclick="removeChapter(${cid})" title="Remove">✕</button>
    </div>
    <textarea class="form-textarea chapter-desc-input" id="ch-desc-${cid}" rows="2" placeholder="Scene description…"></textarea>`;
  list.appendChild(div);
  updateChapterUI();
}

function removeChapter(cid) {
  const el = document.getElementById(`chapter-entry-${cid}`);
  if (el) el.remove();
  updateChapterUI();
  renumberChapters();
}

function renumberChapters() {
  document.querySelectorAll('.chapter-entry').forEach((el, i) => {
    const badge = el.querySelector('.chapter-entry-num');
    if (badge) badge.textContent = `Sc. ${i + 1}`;
  });
}

function updateChapterUI() {
  const count = document.querySelectorAll('.chapter-entry').length;
  document.getElementById('chapter-count').textContent = `(${count} / 20)`;
  const btn = document.getElementById('add-chapter-btn');
  btn.disabled = count >= 20;
}

function getChaptersData() {
  const chapters = [];
  document.querySelectorAll('.chapter-entry').forEach((el, i) => {
    const titleEl = el.querySelector('.chapter-title-input');
    const descEl  = el.querySelector('.chapter-desc-input');
    chapters.push({
      num:         i + 1,
      title:       titleEl ? titleEl.value.trim() : '',
      description: descEl  ? descEl.value.trim()  : '',
    });
  });
  return chapters;
}
