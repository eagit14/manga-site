// ── Auth: updateAuthUI, initAuth, signInWithGoogle, signOutUser, upsertUser, trackConnection, closeConnection ──

window._isAdmin = false;

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

async function checkAdminStatus(userId) {
  if (!_supabase || !userId) return;
  const { data } = await _supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();
  window._isAdmin = data?.is_admin === true;
  const adminLink    = document.getElementById('nav-admin-link');
  const adminSection = document.getElementById('all-mangas');
  const surpriseBar  = document.getElementById('surprise-bar');
  if (adminLink)    adminLink.style.display    = window._isAdmin ? '' : 'none';
  if (adminSection) adminSection.style.display = window._isAdmin ? '' : 'none';
  if (surpriseBar)  surpriseBar.style.display  = window._isAdmin ? '' : 'none';
  if (window._isAdmin && typeof loadAllMangas === 'function') loadAllMangas();
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
      checkAdminStatus(session.user.id);
      _processPendingPayment();
      loadUserCredits();
    }
    if (event === 'INITIAL_SESSION' && session?.user) {
      checkAdminStatus(session.user.id);
      _processPendingPayment();
      loadUserCredits();
    }
    if (event === 'SIGNED_OUT') {
      window._isAdmin = false;
      const adminLink    = document.getElementById('nav-admin-link');
      const adminSection = document.getElementById('all-mangas');
      const surpriseBar  = document.getElementById('surprise-bar');
      if (adminLink)    adminLink.style.display    = 'none';
      if (adminSection) adminSection.style.display = 'none';
      if (surpriseBar)  surpriseBar.style.display  = 'none';
      closeConnection();
      loadMyMangas();
    }
  });
}

function lwShowTab(tab) {
  const signin = tab === 'signin';
  document.getElementById('lw-signin-form').style.display = signin ? 'flex' : 'none';
  document.getElementById('lw-signup-form').style.display = signin ? 'none' : 'flex';
  document.getElementById('lw-tab-signin').classList.toggle('active', signin);
  document.getElementById('lw-tab-signup').classList.toggle('active', !signin);
}

async function signInWithEmail() {
  const email    = (document.getElementById('lw-email').value    || '').trim();
  const password =  document.getElementById('lw-password').value || '';
  const msgEl    =  document.getElementById('lw-signin-msg');
  const btn      =  document.getElementById('lw-signin-btn');
  msgEl.className = 'lw-form-msg';
  msgEl.textContent = '';
  if (!email || !password) { msgEl.textContent = 'Please enter your email and password.'; return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  const { error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) {
    msgEl.textContent = error.message;
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

async function signUpWithEmail() {
  const email    = (document.getElementById('lw-reg-email').value    || '').trim();
  const password =  document.getElementById('lw-reg-password').value || '';
  const confirm  =  document.getElementById('lw-reg-confirm').value  || '';
  const msgEl    =  document.getElementById('lw-signup-msg');
  const btn      =  document.getElementById('lw-signup-btn');
  msgEl.className = 'lw-form-msg';
  msgEl.textContent = '';
  if (!email || !password) { msgEl.textContent = 'Please fill in all fields.'; return; }
  if (password.length < 6) { msgEl.textContent = 'Password must be at least 6 characters.'; return; }
  if (password !== confirm) { msgEl.textContent = 'Passwords do not match.'; return; }
  btn.disabled = true; btn.textContent = 'Creating account…';
  const { data, error } = await _supabase.auth.signUp({ email, password });
  if (error) {
    msgEl.textContent = error.message;
    btn.disabled = false; btn.textContent = 'Create Account';
  } else if (!data.session) {
    msgEl.className = 'lw-form-msg success';
    msgEl.textContent = '✅ Check your email to confirm your account!';
    btn.disabled = false; btn.textContent = 'Create Account';
  }
  // if data.session exists, onAuthStateChange handles the sign-in automatically
}

async function signInWithGoogle() {
  if (!_supabase) { alert('Supabase is not configured.'); return; }
  await _supabase.auth.signInWithOAuth({
    provider: 'google',
    options:  { redirectTo: window.location.origin },
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
