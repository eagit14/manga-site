// ── Support tickets ────────────────────────────────────────

async function openContactSupport() {
  document.getElementById('support-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('support-form').style.display  = 'block';
  document.getElementById('support-success').style.display = 'none';
  await _loadMyTickets();
}

function closeContactSupport() {
  document.getElementById('support-modal').style.display = 'none';
  document.body.style.overflow = '';
  document.getElementById('support-title-input').value = '';
  document.getElementById('support-desc-input').value  = '';
}

function handleSupportOverlayClick(e) {
  if (e.target === document.getElementById('support-modal')) closeContactSupport();
}

async function submitSupportTicket() {
  if (!_supabase) return;
  const title = document.getElementById('support-title-input').value.trim();
  const desc  = document.getElementById('support-desc-input').value.trim();
  if (!title || !desc) { alert('Please fill in both fields.'); return; }

  const btn = document.getElementById('support-submit-btn');
  btn.disabled = true; btn.textContent = 'Sending…';

  const { data: { user } } = await _supabase.auth.getUser();
  const { error } = await _supabase.from('support_tickets').insert({
    user_id:    user?.id    || null,
    user_email: user?.email || null,
    title,
    description: desc,
  });

  btn.disabled = false; btn.textContent = 'Send to Support';

  if (error) { console.error('[Support] submit error:', error.message); alert('Could not send: ' + error.message); return; }

  document.getElementById('support-form').style.display    = 'none';
  document.getElementById('support-success').style.display = 'flex';
  await _loadMyTickets();
}

async function _loadMyTickets() {
  if (!_supabase) return;
  const list = document.getElementById('my-tickets-list');
  if (!list) return;

  const { data: tickets, error } = await _supabase
    .from('support_tickets')
    .select('id, title, description, admin_reply, status, created_at')
    .order('created_at', { ascending: false });

  const section = document.getElementById('my-tickets-section');
  if (error || !tickets?.length) { if (section) section.style.display = 'none'; return; }
  if (section) section.style.display = 'block';

  list.innerHTML = tickets.map(t => {
    const date   = new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const badge  = t.status === 'replied'
      ? '<span class="ticket-status replied">Replied</span>'
      : '<span class="ticket-status open">Open</span>';
    const reply  = t.admin_reply
      ? `<div class="ticket-reply"><strong>Support:</strong> ${t.admin_reply}</div>`
      : '';
    return `
      <div class="ticket-item">
        <div class="ticket-item-header">
          <span class="ticket-item-title">${t.title}</span>
          <span class="ticket-item-date">${date}</span>
          ${badge}
        </div>
        <p class="ticket-item-desc">${t.description}</p>
        ${reply}
      </div>`;
  }).join('');
}

// ── Admin Tickets ──────────────────────────────────────────

async function openAdminTickets() {
  document.getElementById('admin-tickets-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('ticket-detail-panel').style.display = 'none';
  await _loadAllTickets();
}

function closeAdminTickets() {
  document.getElementById('admin-tickets-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function handleAdminTicketsOverlayClick(e) {
  if (e.target === document.getElementById('admin-tickets-modal')) closeAdminTickets();
}

async function _loadAllTickets() {
  if (!_supabase || !window._isAdmin) return;
  const list = document.getElementById('admin-tickets-list');
  list.innerHTML = '<div class="tickets-loading">Loading…</div>';

  const { data: tickets, error } = await _supabase
    .from('support_tickets')
    .select('id, user_email, title, description, admin_reply, status, created_at')
    .order('created_at', { ascending: false });

  if (error) { list.innerHTML = `<p style="color:red;padding:1rem">${error.message}</p>`; return; }
  if (!tickets?.length) { list.innerHTML = '<div class="tickets-empty">No tickets yet.</div>'; return; }

  window._adminTickets = tickets;

  list.innerHTML = tickets.map(t => {
    const date  = new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const badge = t.status === 'replied'
      ? '<span class="ticket-status replied">Replied</span>'
      : '<span class="ticket-status open">Open</span>';
    return `
      <div class="admin-ticket-row" onclick="openTicketDetail('${t.id}')">
        <div class="admin-ticket-row-main">
          <span class="ticket-item-title">${t.title}</span>
          <span class="admin-ticket-email">${t.user_email || '—'}</span>
        </div>
        <div class="admin-ticket-row-meta">${date} ${badge}</div>
      </div>`;
  }).join('');
}

function openTicketDetail(ticketId) {
  const t = (window._adminTickets || []).find(x => x.id === ticketId);
  if (!t) return;
  document.getElementById('ticket-detail-title').textContent = t.title;
  document.getElementById('ticket-detail-desc').textContent  = t.description;
  document.getElementById('ticket-detail-email').textContent = t.user_email || '—';
  document.getElementById('ticket-reply-input').value        = t.admin_reply || '';
  document.getElementById('ticket-detail-panel').dataset.ticketId = ticketId;
  document.getElementById('ticket-detail-panel').style.display    = 'flex';
  document.getElementById('admin-tickets-list').style.display     = 'none';
}

function closeTicketDetail() {
  document.getElementById('ticket-detail-panel').style.display = 'none';
  document.getElementById('admin-tickets-list').style.display  = '';
}

async function submitAdminReply() {
  if (!_supabase || !window._isAdmin) return;
  const panel    = document.getElementById('ticket-detail-panel');
  const ticketId = panel.dataset.ticketId;
  const reply    = document.getElementById('ticket-reply-input').value.trim();
  if (!reply) { alert('Please enter a reply.'); return; }

  const btn = document.getElementById('ticket-reply-btn');
  btn.disabled = true; btn.textContent = 'Sending…';

  const { error } = await _supabase
    .from('support_tickets')
    .update({ admin_reply: reply, status: 'replied', updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  btn.disabled = false; btn.textContent = 'Send Reply';

  if (error) { alert('Error: ' + error.message); return; }

  const t = (window._adminTickets || []).find(x => x.id === ticketId);
  if (t) { t.admin_reply = reply; t.status = 'replied'; }

  closeTicketDetail();
  await _loadAllTickets();
}
