// ── Auth: updateAuthUI, initAuth, signInWithGoogle, signOutUser, upsertUser, trackConnection, closeConnection ──

function updateAuthUI(session) {
  const loginWall   = document.getElementById('login-wall');
  const mainContent = document.getElementById('main-content');
  const btnSignin   = document.getElementById('btn-google-signin');
  const userInfo    = document.getElementById('nav-user-info');

  if (session?.user) {
    if (loginWall)   loginWall.style.display   = 'none';
    if (mainContent) mainContent.style.display = 'block';
    if (btnSignin)   btnSignin.style.display   = 'none';
    if (userInfo)    userInfo.style.display     = 'flex';
    const meta = session.user.user_metadata || {};
    const avatar = document.getElementById('nav-avatar');
    const nameEl = document.getElementById('nav-username');
    const displayName = meta.full_name || meta.name || session.user.email || '';
    if (avatar) { avatar.src = meta.avatar_url || ''; avatar.style.display = meta.avatar_url ? '' : 'none'; }
    if (nameEl) nameEl.textContent = displayName;
    const dropAvatar = document.getElementById('dropdown-avatar');
    const dropName   = document.getElementById('dropdown-name');
    const dropEmail  = document.getElementById('dropdown-email');
    if (dropAvatar) { dropAvatar.src = meta.avatar_url || ''; dropAvatar.style.display = meta.avatar_url ? '' : 'none'; }
    if (dropName)  dropName.textContent  = meta.full_name || meta.name || '';
    if (dropEmail) dropEmail.textContent = session.user.email || '';
  } else {
    if (loginWall)   loginWall.style.display   = 'flex';
    if (mainContent) mainContent.style.display = 'none';
    if (btnSignin)   btnSignin.style.display   = '';
    if (userInfo)    userInfo.style.display     = 'none';
  }
}

let _connectionId = null;

async function upsertUser(user) {
  if (!_supabase || !user) return;
  const meta = user.user_metadata || {};
  const { error } = await _supabase.from('users').upsert({
    id:           user.id,
    email:        user.email,
    full_name:    meta.full_name || meta.name || null,
    avatar_url:   meta.avatar_url || null,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.warn('upsertUser error:', error.message);
}

async function trackConnection(userId) {
  if (!_supabase || !userId) return;
  const { data, error } = await _supabase
    .from('user_connections')
    .insert({
      user_id:    userId,
      user_agent: navigator.userAgent,
    })
    .select('id')
    .single();
  if (error) { console.warn('trackConnection error:', error.message); return; }
  _connectionId = data.id;
}

async function closeConnection() {
  if (!_supabase || !_connectionId) return;
  const { error } = await _supabase
    .from('user_connections')
    .update({ signed_out_at: new Date().toISOString() })
    .eq('id', _connectionId);
  if (error) console.warn('closeConnection error:', error.message);
  _connectionId = null;
}

async function _processPendingPayment() {
  const storyId = window._pendingPaymentStoryId;
  if (storyId) {
    window._pendingPaymentStoryId = null;
    await markMangaPurchased(storyId);
  }
  loadMyMangas();
}

function initAuth() {
  const loadingEl = document.getElementById('auth-loading');
  if (!_supabase) {
    if (loadingEl) loadingEl.style.display = 'none';
    updateAuthUI(null);
    return;
  }
  // onAuthStateChange fires immediately with the current session on init,
  // so we never call getSession() separately — avoids double-render race.
  _supabase.auth.onAuthStateChange((event, session) => {
    if (loadingEl) loadingEl.style.display = 'none';
    updateAuthUI(session);
    if (event === 'SIGNED_IN') {
      upsertUser(session.user);
      trackConnection(session.user.id);
      _processPendingPayment();
    }
    if (event === 'INITIAL_SESSION' && session?.user) {
      _processPendingPayment();
    }
    if (event === 'SIGNED_OUT') {
      closeConnection();
      loadMyMangas();
    }
  });
}

async function signInWithGoogle() {
  if (!_supabase) { alert('Supabase is not configured.'); return; }
  await _supabase.auth.signInWithOAuth({
    provider: 'google',
    options:  { redirectTo: window.location.origin + '/' },
  });
}

function toggleUserMenu(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('user-dropdown');
  const userInfo = document.getElementById('nav-user-info');
  if (!dropdown) return;
  const isOpen = dropdown.classList.toggle('open');
  if (userInfo) userInfo.classList.toggle('menu-open', isOpen);
  if (isOpen) {
    const close = (ev) => {
      if (!userInfo.contains(ev.target)) {
        dropdown.classList.remove('open');
        userInfo.classList.remove('menu-open');
        document.removeEventListener('click', close);
      }
    };
    document.addEventListener('click', close);
  }
}

async function signOutUser() {
  if (!_supabase) return;
  await closeConnection();
  await _supabase.auth.signOut();
}
