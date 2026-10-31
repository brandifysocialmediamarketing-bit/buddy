/**
 * BUDDY - theme.js
 * Universal dynamic contrast & theme manager.
 * Ensures text & icons ALWAYS stay 100% visible and high-contrast in Light, Dark, or Any Custom Color!
 */

const ThemeManager = (() => {
  const KEY_THEME = 'buddy-theme';
  const KEY_ACCENT = 'buddy-accent';
  const KEY_CUSTOM_COLOR = 'buddy-custom-color';

  const ACCENT_PRESETS = {
    rose:    { hex: '#FF2E7E', p2: '#FF6584' },
    velvet:  { hex: '#E11D48', p2: '#F43F5E' },
    violet:  { hex: '#8B5CF6', p2: '#C084FC' },
    indigo:  { hex: '#6366F1', p2: '#818CF8' },
    sunset:  { hex: '#F97316', p2: '#FB923C' },
    ocean:   { hex: '#0284C7', p2: '#38BDF8' },
    emerald: { hex: '#10B981', p2: '#34D399' }
  };

  function _getLuminance(hex) {
    try {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      let num = parseInt(c, 16);
      let r = (num >> 16) & 255;
      let g = (num >> 8) & 255;
      let b = num & 255;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    } catch(e) {
      return 0.5;
    }
  }

  function _adjustBrightness(hex, percent) {
    try {
      let clean = hex.replace('#', '');
      if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
      let num = parseInt(clean, 16);
      let r = Math.min(255, Math.max(0, ((num >> 16) & 255) + percent));
      let g = Math.min(255, Math.max(0, ((num >> 8) & 255) + percent));
      let b = Math.min(255, Math.max(0, (num & 255) + percent));
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    } catch(e) {
      return hex;
    }
  }

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(KEY_THEME, t);
    _updateLabels(t);

    try {
      const metaThemes = document.querySelectorAll('meta[name="theme-color"]');
      const hex = t === 'light' ? '#F8F9FE' : '#090A11';
      metaThemes.forEach(m => m.setAttribute('content', hex));
    } catch(e) {}

    // Refresh contrast calculation
    const custom = localStorage.getItem(KEY_CUSTOM_COLOR);
    if (custom) {
      setCustomColor(custom);
    } else {
      const acc = localStorage.getItem(KEY_ACCENT) || 'rose';
      setAccent(acc);
    }
  }

  function toggle() {
    const curr = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = curr === 'dark' ? 'light' : 'dark';
    apply(next);
    return next;
  }

  function current() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function setAccent(accent) {
    const preset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.rose;
    const hex = preset.hex;
    const p2 = preset.p2;
    const lum = _getLuminance(hex);
    const isLight = lum > 0.55;
    const textOnPrimary = isLight ? '#0B0D18' : '#FFFFFF';

    document.documentElement.style.setProperty('--primary', hex);
    document.documentElement.style.setProperty('--primary-2', p2);
    document.documentElement.style.setProperty('--primary-grad', `linear-gradient(135deg, ${hex} 0%, ${p2} 100%)`);
    document.documentElement.style.setProperty('--primary-glow', hex + '44');
    document.documentElement.style.setProperty('--text-on-primary', textOnPrimary);

    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem(KEY_ACCENT, accent);
    localStorage.removeItem(KEY_CUSTOM_COLOR);

    _syncColorPickers(null);
  }

  function setCustomColor(hex) {
    if (!hex) return;
    const p2 = _adjustBrightness(hex, 30);
    const lum = _getLuminance(hex);
    const isLight = lum > 0.55;
    const textOnPrimary = isLight ? '#0B0D18' : '#FFFFFF';

    document.documentElement.style.setProperty('--primary', hex);
    document.documentElement.style.setProperty('--primary-2', p2);
    document.documentElement.style.setProperty('--primary-grad', `linear-gradient(135deg, ${hex} 0%, ${p2} 100%)`);
    document.documentElement.style.setProperty('--primary-glow', hex + '44');
    document.documentElement.style.setProperty('--text-on-primary', textOnPrimary);

    document.documentElement.setAttribute('data-accent', 'custom');
    localStorage.setItem(KEY_CUSTOM_COLOR, hex);
    localStorage.setItem(KEY_ACCENT, 'custom');

    _syncColorPickers(hex);
  }

  function _updateLabels(t) {
    const el = document.getElementById('profile-theme-label');
    if (el) el.textContent = t === 'dark' ? 'Dark' : 'Light';
  }

  function _syncColorPickers(hex) {
    const pPicker = document.getElementById('profile-custom-color');
    const cPicker = document.getElementById('chat-custom-color');
    if (hex) {
      if (pPicker) pPicker.value = hex;
      if (cPicker) cPicker.value = hex;
    }
  }

  // Initial boot: default to 'dark' & 'rose'
  const savedTheme = localStorage.getItem(KEY_THEME) || 'dark';
  apply(savedTheme);

  const savedCustom = localStorage.getItem(KEY_CUSTOM_COLOR);
  if (savedCustom) {
    setCustomColor(savedCustom);
  } else {
    const savedAccent = localStorage.getItem(KEY_ACCENT) || 'rose';
    setAccent(savedAccent);
  }

  return { toggle, apply, current, setAccent, setCustomColor };
})();

window.ThemeManager = ThemeManager;
