// ── Profile: openProfile, closeProfile, loadProfile, saveProfile ──

async function openProfile() {
  // Close the user dropdown first
  const dropdown = document.getElementById('user-dropdown');
  const userInfo  = document.getElementById('nav-user-info');
  if (dropdown) dropdown.classList.remove('open');
  if (userInfo)  userInfo.classList.remove('menu-open');

  document.getElementById('profile-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const msg = document.getElementById('profile-save-msg');
  if (msg) { msg.textContent = ''; msg.className = 'profile-save-msg'; }

  await loadProfile();
}

function closeProfile() {
  document.getElementById('profile-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function handleProfileOverlayClick(e) {
  if (e.target === document.getElementById('profile-modal')) closeProfile();
}

async function loadProfile() {
  if (!_supabase) return;
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await _supabase
    .from('users')
    .select('first_name, last_name, address_line1, address_line2, city, postal_code, country')
    .eq('id', user.id)
    .single();

  if (error) { console.warn('[Profile] load error:', error.message); return; }
  if (!data)  return;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('p-firstname', data.first_name);
  set('p-lastname',  data.last_name);
  set('p-addr1',     data.address_line1);
  set('p-addr2',     data.address_line2);
  set('p-city',      data.city);
  set('p-postal',    data.postal_code);
  set('p-country',   data.country);
}

async function saveProfile() {
  if (!_supabase) return;
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return;

  const btn = document.getElementById('profile-save-btn');
  const msg = document.getElementById('profile-save-msg');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  if (msg) { msg.textContent = ''; msg.className = 'profile-save-msg'; }

  const val = id => document.getElementById(id)?.value.trim() || null;

  const { error } = await _supabase.from('users').upsert({
    id:           user.id,
    first_name:   val('p-firstname'),
    last_name:    val('p-lastname'),
    address_line1: val('p-addr1'),
    address_line2: val('p-addr2'),
    city:         val('p-city'),
    postal_code:  val('p-postal'),
    country:      val('p-country'),
  }, { onConflict: 'id' });

  btn.disabled = false;
  btn.textContent = '💾 Save';

  if (error) {
    console.error('[Profile] save error:', error.message);
    if (msg) { msg.textContent = '❌ Could not save. Please try again.'; msg.className = 'profile-save-msg error'; }
  } else {
    if (msg) { msg.textContent = '✅ Profile saved!'; msg.className = 'profile-save-msg success'; }
    setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
  }
}
