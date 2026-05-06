// ── App Settings: fetched on sign-in, cached in window._appSettings ──

window._appSettings = {
  physical_order_enabled: true,
  default_credits:        50,
  default_art_style: [
    'manga',
    'screen tones',
    'inked line art',
    'dynamic panel layout',
    'speed lines / radial lines',
    'high contrast lighting',
  ].join('\n'),
};

async function loadAppSettings() {
  if (!_supabase) return;
  const { data, error } = await _supabase
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .maybeSingle();
  if (error) { console.warn('[Settings] load error:', error.message); return; }
  if (data) Object.assign(window._appSettings, data);
  _applySettings();
}

function _applySettings() {
  const styleArea = document.getElementById('f-style');
  if (styleArea && window._appSettings.default_art_style) {
    styleArea.value = window._appSettings.default_art_style;
  }
}
