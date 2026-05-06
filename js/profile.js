// ── Profile: openProfile, closeProfile, loadProfile, saveProfile ──

// ISO 3166-1 alpha-2 country list
const COUNTRIES = [
  ['AF','Afghanistan'],['AL','Albania'],['DZ','Algeria'],['AD','Andorra'],['AO','Angola'],
  ['AR','Argentina'],['AM','Armenia'],['AU','Australia'],['AT','Austria'],['AZ','Azerbaijan'],
  ['BH','Bahrain'],['BD','Bangladesh'],['BY','Belarus'],['BE','Belgium'],['BZ','Belize'],
  ['BO','Bolivia'],['BA','Bosnia & Herzegovina'],['BR','Brazil'],['BG','Bulgaria'],
  ['KH','Cambodia'],['CA','Canada'],['CL','Chile'],['CN','China'],['CO','Colombia'],
  ['CR','Costa Rica'],['HR','Croatia'],['CY','Cyprus'],['CZ','Czech Republic'],
  ['DK','Denmark'],['DO','Dominican Republic'],['EC','Ecuador'],['EG','Egypt'],
  ['SV','El Salvador'],['EE','Estonia'],['ET','Ethiopia'],['FI','Finland'],['FR','France'],
  ['GE','Georgia'],['DE','Germany'],['GH','Ghana'],['GR','Greece'],['GT','Guatemala'],
  ['HN','Honduras'],['HK','Hong Kong'],['HU','Hungary'],['IS','Iceland'],['IN','India'],
  ['ID','Indonesia'],['IE','Ireland'],['IL','Israel'],['IT','Italy'],['JM','Jamaica'],
  ['JP','Japan'],['JO','Jordan'],['KZ','Kazakhstan'],['KE','Kenya'],['KW','Kuwait'],
  ['LV','Latvia'],['LB','Lebanon'],['LI','Liechtenstein'],['LT','Lithuania'],['LU','Luxembourg'],
  ['MY','Malaysia'],['MT','Malta'],['MX','Mexico'],['MD','Moldova'],['MC','Monaco'],
  ['MA','Morocco'],['NP','Nepal'],['NL','Netherlands'],['NZ','New Zealand'],
  ['NI','Nicaragua'],['NG','Nigeria'],['MK','North Macedonia'],['NO','Norway'],
  ['OM','Oman'],['PK','Pakistan'],['PA','Panama'],['PY','Paraguay'],['PE','Peru'],
  ['PH','Philippines'],['PL','Poland'],['PT','Portugal'],['QA','Qatar'],
  ['RO','Romania'],['RU','Russia'],['SA','Saudi Arabia'],['SN','Senegal'],['RS','Serbia'],
  ['SG','Singapore'],['SK','Slovakia'],['SI','Slovenia'],['ZA','South Africa'],
  ['KR','South Korea'],['ES','Spain'],['LK','Sri Lanka'],['SE','Sweden'],
  ['CH','Switzerland'],['TW','Taiwan'],['TH','Thailand'],['TN','Tunisia'],['TR','Turkey'],
  ['UA','Ukraine'],['AE','United Arab Emirates'],['GB','United Kingdom'],['US','United States'],
  ['UY','Uruguay'],['UZ','Uzbekistan'],['VE','Venezuela'],['VN','Vietnam'],
];

const _STATE_COUNTRIES = new Set(['US', 'CA']);

function _toggleStateField(countryId, stateFieldId) {
  const code  = (document.getElementById(countryId)?.value || '').toUpperCase();
  const field = document.getElementById(stateFieldId);
  if (!field) return;
  const show = _STATE_COUNTRIES.has(code);
  field.style.display = show ? '' : 'none';
  // Clear value when hidden so it isn't sent to APIs
  if (!show) {
    const input = field.tagName === 'INPUT' ? field : field.querySelector('input');
    if (input) input.value = '';
  }
}

function _populateCountrySelect(id, selectedCode) {
  const el = document.getElementById(id);
  if (!el) return;
  let sel = (selectedCode || '').toUpperCase().trim();
  // If stored value is a full name (legacy), find matching code
  if (sel.length > 2) {
    const match = COUNTRIES.find(([, n]) => n.toUpperCase() === sel);
    sel = match ? match[0] : '';
  }
  el.innerHTML = '<option value="">— Select country —</option>' +
    COUNTRIES.map(([c, n]) =>
      `<option value="${c}"${c === sel ? ' selected' : ''}>${n}</option>`
    ).join('');
}

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

  _populateCountrySelect('p-country', '');
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
    .select('first_name, last_name, address_line1, address_line2, city, state, postal_code, country')
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
  set('p-state',     data.state);
  set('p-postal',    data.postal_code);
  _populateCountrySelect('p-country', data.country);
  _toggleStateField('p-country', 'p-state-field');
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
    state:        val('p-state') ? val('p-state').toUpperCase() : null,
    postal_code:  val('p-postal'),
    country:      val('p-country'),
  }, { onConflict: 'id' });

  btn.disabled = false;
  btn.textContent = '💾 Save';

  if (error) {
    console.error('[Profile] save error:', error.code, error.message, error.details);
    const detail = error.message || error.code || 'unknown error';
    if (msg) { msg.textContent = `❌ Could not save: ${detail}`; msg.className = 'profile-save-msg error'; }
  } else {
    if (msg) { msg.textContent = '✅ Profile saved!'; msg.className = 'profile-save-msg success'; }
    setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
  }
}
