/**
 * BUDDY - wallpaper.js
 * Unique aesthetic chat backgrounds, custom image adjustment & real-time switcher
 */

const WallpaperManager = (() => {
  const KEY_WALLPAPER = 'buddy_chat_wallpaper';
  const KEY_CUSTOM_DATA = 'buddy_custom_wallpaper_data';
  const KEY_DIM = 'buddy_wp_dim';
  const KEY_BLUR = 'buddy_wp_blur';
  const KEY_SCALE = 'buddy_wp_scale';
  const KEY_POS = 'buddy_wp_pos';

  const PRESETS = [
    {
      id: 'nebula',
      name: 'Cosmic Nebula',
      tag: 'Popular',
      desc: 'Ambient cosmic violet & rose glow',
      gradient: 'radial-gradient(circle at 20% 25%, #6366F1 0%, transparent 60%), radial-gradient(circle at 80% 75%, #EC4899 0%, transparent 60%), #0D0F18',
      fullBackground: 'radial-gradient(circle at 18% 22%, rgba(99, 102, 241, 0.28) 0%, transparent 45%), radial-gradient(circle at 82% 78%, rgba(236, 72, 153, 0.26) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.18) 0%, transparent 55%), linear-gradient(180deg, #0e111a 0%, #080910 100%)'
    },
    {
      id: 'doodles',
      name: 'Chat Doodles',
      tag: 'Classic',
      desc: 'Luxury dark WhatsApp-style doodles',
      gradient: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
      fullBackground: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\' viewBox=\'0 0 160 160\' opacity=\'0.08\' stroke=\'%23ffffff\' fill=\'none\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M20 25h20a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5h-10l-6 6v-6h-4a5 5 0 0 1-5-5V30a5 5 0 0 1 5-5z\'/%3E%3Ccircle cx=\'105\' cy=\'35\' r=\'14\'/%3E%3Cpath d=\'M100 32a1.5 1.5 0 0 1 3 0v.5M107 32a1.5 1.5 0 0 1 3 0v.5M98 40a7 7 0 0 0 14 0\'/%3E%3Cpath d=\'M140 100l-22 8 8-22 14 14z\'/%3E%3Cpath d=\'M30 115a10 10 0 0 1 14-14c4 4 10 10 10 10s6-6 10-10a10 10 0 0 1 14 14l-24 24z\'/%3E%3Cpolygon points=\'120,70 124,78 132,80 126,86 128,94 120,90 112,94 114,86 108,80 116,78\'/%3E%3Cpath d=\'M65 20l2 8 8 2-8 2-2 8-2-8-8-2 8-2z\'/%3E%3Cpath d=\'M130 135h18v14h-18z\'/%3E%3Cpath d=\'M25 70l20-10-8 22z\'/%3E%3Ccircle cx=\'75\' cy=\'130\' r=\'8\'/%3E%3Cpath d=\'M72 130h6M75 127v6\'/%3E%3C/svg%3E"), #0c0f17'
    },
    {
      id: 'aurora',
      name: 'Northern Aurora',
      tag: 'Aesthetic',
      desc: 'Glowing teal & emerald aurora wave',
      gradient: 'radial-gradient(circle at 25% 20%, #10B981 0%, transparent 60%), radial-gradient(circle at 75% 35%, #06B6D4 0%, transparent 60%), #061118',
      fullBackground: 'radial-gradient(circle at 20% 15%, rgba(16, 185, 129, 0.28) 0%, transparent 50%), radial-gradient(circle at 80% 35%, rgba(6, 182, 212, 0.26) 0%, transparent 45%), radial-gradient(circle at 50% 85%, rgba(59, 130, 246, 0.20) 0%, transparent 50%), linear-gradient(180deg, #07131b 0%, #03080d 100%)'
    },
    {
      id: 'stars',
      name: 'Starry Galaxy',
      tag: 'Space',
      desc: 'Deep obsidian night with micro stars',
      gradient: 'radial-gradient(circle at 50% 50%, #1E1B4B 0%, #06070E 100%)',
      fullBackground: 'radial-gradient(2px 2px at 25px 35px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 75px 85px, #e2e8f0, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 130px 45px, #cbd5e1, rgba(0,0,0,0)), radial-gradient(2px 2px at 190px 145px, #fbcfe8, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 260px 95px, #bfdbfe, rgba(0,0,0,0)), radial-gradient(2px 2px at 320px 210px, #ddd6fe, rgba(0,0,0,0)), radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.22) 0%, transparent 65%), #06070e'
    },
    {
      id: 'sunset',
      name: 'Velvet Sunset',
      tag: 'Warm',
      desc: 'Rose sunset & dusky amber glow',
      gradient: 'radial-gradient(circle at 75% 20%, #F43F5E 0%, transparent 60%), radial-gradient(circle at 25% 70%, #F59E0B 0%, transparent 60%), #160A20',
      fullBackground: 'radial-gradient(circle at 75% 20%, rgba(244, 63, 94, 0.30) 0%, transparent 45%), radial-gradient(circle at 25% 65%, rgba(245, 158, 11, 0.22) 0%, transparent 50%), radial-gradient(circle at 50% 90%, rgba(139, 92, 246, 0.24) 0%, transparent 55%), linear-gradient(180deg, #160a20 0%, #0a040f 100%)'
    },
    {
      id: 'cyber-grid',
      name: 'Cyber Mesh',
      tag: 'Tech',
      desc: 'Futuristic isometric cyber grid',
      gradient: 'linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, #070913 1px)',
      fullBackground: 'linear-gradient(rgba(99, 102, 241, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.16) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.20) 0%, transparent 65%), #070913'
    },
    {
      id: 'honeycomb',
      name: 'Geometric Hex',
      tag: 'Modern',
      desc: 'Dark geometric pattern with neon halo',
      gradient: 'radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, #090B12 100%)',
      fullBackground: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.22) 0%, transparent 60%), linear-gradient(135deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%), linear-gradient(225deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%), #090b12'
    },
    {
      id: 'forest',
      name: 'Emerald Forest',
      tag: 'Nature',
      desc: 'Deep obsidian jade & emerald ambiance',
      gradient: 'radial-gradient(circle at 30% 20%, #059669 0%, transparent 60%), #051410',
      fullBackground: 'radial-gradient(circle at 25% 20%, rgba(5, 150, 105, 0.30) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.22) 0%, transparent 50%), linear-gradient(180deg, #051410 0%, #020907 100%)'
    },
    {
      id: 'ocean',
      name: 'Midnight Ocean',
      tag: 'Calm',
      desc: 'Deep sapphire navy with bioluminescent blue',
      gradient: 'radial-gradient(circle at 70% 30%, #0284C7 0%, transparent 60%), #04101E',
      fullBackground: 'radial-gradient(circle at 70% 25%, rgba(2, 132, 199, 0.30) 0%, transparent 45%), radial-gradient(circle at 25% 75%, rgba(56, 189, 248, 0.20) 0%, transparent 50%), linear-gradient(180deg, #04101e 0%, #02070f 100%)'
    },
    {
      id: 'minimal-dark',
      name: 'Clean Obsidian',
      tag: 'Minimal',
      desc: 'Pure matte black minimal aesthetic',
      gradient: '#0F1118',
      fullBackground: '#0F1118'
    }
  ];

  function getActive() {
    return localStorage.getItem(KEY_WALLPAPER) || 'nebula';
  }

  function getCustomData() {
    return localStorage.getItem(KEY_CUSTOM_DATA) || '';
  }

  function getAdjustments() {
    return {
      dim: parseInt(localStorage.getItem(KEY_DIM) ?? '35', 10),
      blur: parseInt(localStorage.getItem(KEY_BLUR) ?? '0', 10),
      scale: parseInt(localStorage.getItem(KEY_SCALE) ?? '100', 10),
      pos: localStorage.getItem(KEY_POS) || 'center'
    };
  }

  function setAdjustment(key, val) {
    if (key === 'dim') localStorage.setItem(KEY_DIM, val);
    if (key === 'blur') localStorage.setItem(KEY_BLUR, val);
    if (key === 'scale') localStorage.setItem(KEY_SCALE, val);
    if (key === 'pos') localStorage.setItem(KEY_POS, val);
    applyAdjustments();
  }

  function applyAdjustments() {
    const adj = getAdjustments();
    const imgEl = document.getElementById('chat-wallpaper-img');
    const dimEl = document.getElementById('chat-wallpaper-dim');

    if (dimEl) {
      dimEl.style.background = 'rgba(0, 0, 0, ' + (adj.dim / 100) + ')';
    }

    if (imgEl) {
      imgEl.style.filter = 'blur(' + adj.blur + 'px)';
      imgEl.style.transform = 'scale(' + (adj.scale / 100) + ')';
      imgEl.style.backgroundPosition = adj.pos;
    }

    // Sync sliders and value tags
    const dimSlider = document.getElementById('wp-dim-slider');
    const dimVal = document.getElementById('wp-dim-val');
    if (dimSlider) dimSlider.value = adj.dim;
    if (dimVal) dimVal.textContent = adj.dim + '%';

    const blurSlider = document.getElementById('wp-blur-slider');
    const blurVal = document.getElementById('wp-blur-val');
    if (blurSlider) blurSlider.value = adj.blur;
    if (blurVal) blurVal.textContent = adj.blur + 'px';

    const scaleSlider = document.getElementById('wp-scale-slider');
    const scaleVal = document.getElementById('wp-scale-val');
    if (scaleSlider) scaleSlider.value = adj.scale;
    if (scaleVal) scaleVal.textContent = adj.scale + '%';

    const posVal = document.getElementById('wp-pos-val');
    if (posVal) posVal.textContent = adj.pos.charAt(0).toUpperCase() + adj.pos.slice(1);

    const posBtns = document.querySelectorAll('.pos-btn');
    posBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.pos === adj.pos);
    });
  }

  function _updateCustomPreviewUI(customData) {
    const previewBox = document.getElementById('custom-wallpaper-preview-box');
    const thumb = document.getElementById('custom-wallpaper-thumb');
    if (!previewBox || !thumb) return;

    if (customData) {
      thumb.src = customData;
      previewBox.style.display = 'flex';
    } else {
      previewBox.style.display = 'none';
    }
  }

  function apply(id, customUrl = null, notify = false) {
    const targetId = id || 'nebula';
    const imgEl = document.getElementById('chat-wallpaper-img');
    const activeChat = document.getElementById('active-chat');

    if (targetId === 'custom' && (customUrl || getCustomData())) {
      const data = customUrl || getCustomData();
      if (imgEl) {
        // Safe URL formatting
        const safeUrl = data.replace(/"/g, '\\\"');
        imgEl.style.backgroundImage = 'url("' + safeUrl + '")';
        imgEl.style.backgroundRepeat = 'no-repeat';
        imgEl.style.backgroundPosition = 'center';
        imgEl.style.backgroundSize = 'cover';
      }
      if (activeChat) activeChat.setAttribute('data-wallpaper', 'custom');
      document.body.setAttribute('data-chat-wallpaper', 'custom');
      try {
        localStorage.setItem(KEY_WALLPAPER, 'custom');
        if (customUrl) localStorage.setItem(KEY_CUSTOM_DATA, customUrl);
      } catch (err) {
        console.warn('[BUDDY Wallpaper] LocalStorage quota exceeded for custom wallpaper:', err);
      }
      _updateCustomPreviewUI(data);
    } else {
      const found = PRESETS.find(p => p.id === targetId) || PRESETS[0];
      if (imgEl) {
        imgEl.style.background = found.fullBackground;
        if (targetId === 'doodles') {
          imgEl.style.backgroundSize = '160px 160px';
          imgEl.style.backgroundRepeat = 'repeat';
        } else if (targetId === 'cyber-grid') {
          imgEl.style.backgroundSize = '36px 36px';
        } else {
          imgEl.style.backgroundSize = 'cover';
        }
      }
      if (activeChat) activeChat.setAttribute('data-wallpaper', targetId);
      document.body.setAttribute('data-chat-wallpaper', targetId);
      localStorage.setItem(KEY_WALLPAPER, targetId);
      if (targetId !== 'custom') {
        localStorage.removeItem(KEY_CUSTOM_DATA);
        _updateCustomPreviewUI(null);
      }
    }

    applyAdjustments();
    _updateSelectionUI(targetId);

    if (notify && typeof window.showToast === 'function') {
      const found = PRESETS.find(p => p.id === targetId);
      const title = found ? found.name : 'Custom Photo';
      window.showToast('🎨 Chat background: ' + title);
    }
  }

  function _updateSelectionUI(currentId) {
    const grid = document.getElementById('wallpaper-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.wallpaper-card');
    cards.forEach(card => {
      const id = card.dataset.id;
      if (id === currentId) {
        card.classList.add('active');
        if (!card.querySelector('.wallpaper-check-badge')) {
          const badge = document.createElement('div');
          badge.className = 'wallpaper-check-badge';
          badge.innerHTML = '✓';
          card.querySelector('.wallpaper-preview-thumb')?.appendChild(badge);
        }
      } else {
        card.classList.remove('active');
        card.querySelector('.wallpaper-check-badge')?.remove();
      }
    });
  }

  function renderGrid() {
    const grid = document.getElementById('wallpaper-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const currentId = getActive();

    PRESETS.forEach(p => {
      const card = document.createElement('div');
      card.className = 'wallpaper-card' + (p.id === currentId ? ' active' : '');
      card.dataset.id = p.id;

      card.innerHTML = 
        '<div class="wallpaper-preview-thumb" style="background: ' + p.gradient + ';">' +
          '<div class="mini-bubble recv"></div>' +
          '<div class="mini-bubble sent"></div>' +
          (p.id === currentId ? '<div class="wallpaper-check-badge">✓</div>' : '') +
        '</div>' +
        '<div class="wallpaper-card-info">' +
          '<div class="wallpaper-card-title">' +
            '<span>' + p.name + '</span>' +
            (p.tag ? '<span class="wallpaper-tag">' + p.tag + '</span>' : '') +
          '</div>' +
          '<div class="wallpaper-card-desc">' + p.desc + '</div>' +
        '</div>';

      card.addEventListener('click', () => {
        apply(p.id, null, true);
      });

      grid.appendChild(card);
    });
  }

  function openModal() {
    const overlay = document.getElementById('wallpaper-overlay');
    if (!overlay) return;
    renderGrid();
    applyAdjustments();

    // Check if custom wallpaper is active and show preview box
    const active = getActive();
    const customData = getCustomData();
    if (active === 'custom' && customData) {
      _updateCustomPreviewUI(customData);
    } else {
      _updateCustomPreviewUI(null);
    }

    overlay.classList.remove('hidden');
  }

  function closeModal() {
    const overlay = document.getElementById('wallpaper-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function init() {
    const saved = getActive();
    const savedCustom = getCustomData();
    apply(saved, savedCustom, false);
    applyAdjustments();

    // Bind open triggers
    document.getElementById('chat-wallpaper-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal();
    });

    document.getElementById('change-wallpaper-item')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal();
    });

    document.getElementById('modal-wallpaper-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('chat-info-overlay')?.classList.add('hidden');
      openModal();
    });

    document.getElementById('close-wallpaper-btn')?.addEventListener('click', closeModal);

    document.getElementById('wallpaper-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'wallpaper-overlay') closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Device upload (with smart canvas compression for mobile camera photos)
    function _compressPhoto(file, callback) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          try {
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            callback(compressed);
          } catch(err) {
            callback(e.target.result);
          }
        };
        img.onerror = () => callback(e.target.result);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    const fileInput = document.getElementById('wallpaper-file-input');
    const uploadBtn = document.getElementById('upload-wallpaper-btn');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
          if (typeof window.showToast === 'function') {
            window.showToast('⚠️ Image too large. Please select photo under 20MB');
          }
          return;
        }

        if (typeof window.showToast === 'function') {
          window.showToast('⏳ Optimizing photo for mobile chat...');
        }

        _compressPhoto(file, (dataUrl) => {
          apply('custom', dataUrl, true);
          _updateCustomPreviewUI(dataUrl);
          if (typeof window.showToast === 'function') {
            window.showToast('✨ Custom theme wallpaper applied! Adjust sliders below');
          }
        });
      });
    }

    // ── Robust Custom URL Handler ──
    const urlInput = document.getElementById('custom-wallpaper-url');
    const applyUrlBtn = document.getElementById('apply-wallpaper-url-btn');

    async function handleCustomUrlApply() {
      if (!urlInput || !applyUrlBtn) return;
      let rawVal = urlInput.value.trim();

      if (!rawVal) {
        if (typeof window.showToast === 'function') {
          window.showToast('⚠️ Please enter or paste an image link');
        }
        urlInput.focus();
        return;
      }

      // 1. Google Images redirect unwrap
      if (rawVal.includes('google.') && rawVal.includes('imgurl=')) {
        try {
          const match = rawVal.match(/[?&]imgurl=([^&]+)/);
          if (match && match[1]) {
            rawVal = decodeURIComponent(match[1]);
          }
        } catch (err) {
          console.warn('Could not unwrap Google image URL', err);
        }
      }

      // 2. Protocol normalize
      if (!rawVal.startsWith('http://') && !rawVal.startsWith('https://') && !rawVal.startsWith('data:image/')) {
        rawVal = 'https://' + rawVal;
      }

      // 3. UI feedback - Loading state
      const origText = 'Apply';
      applyUrlBtn.disabled = true;
      applyUrlBtn.innerHTML = 'Applying... ⏳';

      let resolvedUrl = rawVal;

      // 4. If URL is Pinterest, Instagram, Google, or not directly ending in an image extension, resolve via server
      const isDirectImage = rawVal.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i) || rawVal.startsWith('data:image/');
      
      try {
        const res = await fetch('/api/resolve-image?url=' + encodeURIComponent(rawVal));
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.imageUrl) {
            resolvedUrl = json.imageUrl;
            console.log('[BUDDY Wallpaper] Resolved link to:', resolvedUrl);
          }
        }
      } catch (err) {
        console.warn('[BUDDY Wallpaper] Resolve API error, using direct URL:', err);
      }

      // 5. Apply the resolved URL
      let finished = false;
      const timeoutId = setTimeout(() => {
        finish(true, resolvedUrl);
      }, 3500);

      function finish(success, finalUrl) {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);

        applyUrlBtn.disabled = false;
        applyUrlBtn.innerHTML = origText;

        if (success) {
          apply('custom', finalUrl, true);
          _updateCustomPreviewUI(finalUrl);
          urlInput.value = '';
          if (typeof window.showToast === 'function') {
            window.showToast('✨ Custom photo applied! Adjust with sliders below');
          }
        } else {
          if (typeof window.showToast === 'function') {
            window.showToast('⚠️ Image load nahi ho paya. Kripya direct image link paste karein');
          }
        }
      }

      const testImg = new Image();
      testImg.referrerPolicy = 'no-referrer';

      testImg.onload = () => {
        finish(true, resolvedUrl);
      };

      testImg.onerror = () => {
        // Even if browser image error (due to strict CORS), if resolvedUrl is an image URL, apply it anyway
        if (resolvedUrl.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i) || resolvedUrl.includes('pinimg.com') || resolvedUrl.startsWith('data:image/')) {
          finish(true, resolvedUrl);
        } else {
          finish(false, resolvedUrl);
        }
      };

      testImg.src = resolvedUrl;
    }

    if (applyUrlBtn && urlInput) {
      applyUrlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleCustomUrlApply();
      });

      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCustomUrlApply();
        }
      });
    }

    // Remove custom wallpaper button
    document.getElementById('remove-custom-wallpaper-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(KEY_CUSTOM_DATA);
      apply('nebula', null, true);
      _updateCustomPreviewUI(null);
      if (typeof window.showToast === 'function') {
        window.showToast('🗑️ Custom wallpaper removed');
      }
    });

    // Reset wallpaper to default
    document.getElementById('reset-wallpaper-btn')?.addEventListener('click', () => {
      localStorage.removeItem(KEY_CUSTOM_DATA);
      apply('nebula', null, true);
      _updateCustomPreviewUI(null);
    });

    // ── Adjustment Sliders ──
    const dimSlider = document.getElementById('wp-dim-slider');
    if (dimSlider) {
      dimSlider.addEventListener('input', (e) => {
        setAdjustment('dim', e.target.value);
      });
    }

    const blurSlider = document.getElementById('wp-blur-slider');
    if (blurSlider) {
      blurSlider.addEventListener('input', (e) => {
        setAdjustment('blur', e.target.value);
      });
    }

    const scaleSlider = document.getElementById('wp-scale-slider');
    if (scaleSlider) {
      scaleSlider.addEventListener('input', (e) => {
        setAdjustment('scale', e.target.value);
      });
    }

    // Position buttons
    const posBtns = document.querySelectorAll('.pos-btn');
    posBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const pos = btn.dataset.pos || 'center';
        setAdjustment('pos', pos);
      });
    });

    // Reset adjustments
    document.getElementById('reset-adjust-btn')?.addEventListener('click', () => {
      setAdjustment('dim', 35);
      setAdjustment('blur', 0);
      setAdjustment('scale', 100);
      setAdjustment('pos', 'center');
      if (typeof window.showToast === 'function') window.showToast('🔄 Adjustments reset to default');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  setTimeout(init, 50);

  return { init, openModal, closeModal, apply, getActive, getAdjustments, setAdjustment, PRESETS };
})();

if (typeof window !== 'undefined') {
  window.WallpaperManager = WallpaperManager;
}
