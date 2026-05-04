// ── Credit system ──────────────────────────────────────────

let _credits = null;

async function loadUserCredits() {
  if (!_supabase) return;
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) { _credits = null; _updateCreditDisplay(); return; }

  const { data, error } = await _supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[Credits] load error (table may not exist yet):', error.message);
    // Show 50 as optimistic default so the badge is always visible
    _credits = 50;
  } else {
    // No row yet — defaults to 50 (row is created on first spend via RPC)
    _credits = data !== null ? data.credits : 50;
  }
  _updateCreditDisplay();
}

// Atomically decrement one credit server-side. Returns the new credit count.
async function spendCredit() {
  if (!_supabase) { _credits = Math.max(0, (_credits ?? 50) - 1); _updateCreditDisplay(); return _credits; }
  const { data, error } = await _supabase.rpc('spend_credit');
  if (error) { console.error('[Credits] spend error:', error.message); return _credits ?? 0; }
  _credits = data;
  _updateCreditDisplay();
  return data;
}

function getUserCredits() { return _credits; }

let _creditMsgTimer = null;
function _showCreditMsg(text) {
  const el = document.getElementById('credit-msg');
  if (!el) return;
  el.textContent = text;
  el.className   = 'credit-msg' + (_credits === 0 ? ' empty' : _credits <= 5 ? ' low' : '');
  el.style.display = 'block';
  clearTimeout(_creditMsgTimer);
  if (_credits > 0) _creditMsgTimer = setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function _updateCreditDisplay() {
  const badge = document.getElementById('credits-badge');
  const count = document.getElementById('credits-count');
  if (!badge || !count) return;

  if (_credits === null) { badge.style.display = 'none'; return; }

  badge.style.display = 'flex';
  count.textContent   = _credits;
  badge.className = _credits === 0 ? 'credits-badge credits-empty'
                  : _credits <= 5  ? 'credits-badge credits-low'
                  : 'credits-badge';
}
