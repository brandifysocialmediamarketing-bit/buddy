/**
 * BUDDY - truth-or-dare-game.js (v205)
 * Couple Game: "Truth or Dare" (Inspired by LoveBae)
 * 
 * Features:
 * - 4 Heat Vibes: 💕 Sweet • 😏 Flirty • 🌶️ Spicy • 🔥 Extreme
 * - 3D Tilted Card Stack Preview in Lobby
 * - Dual-Tone Interactive Physics Spin Wheel (Truth vs Dare)
 * - 600+ Romantic, Teasing, Sensual Truths & Dares
 * - Instant Card Swap, Next Turn Switcher & BUDDY Chat Sharing
 */

const TruthOrDareGame = (() => {
  const VIBES = {
    sweet: {
      id: 'sweet',
      label: 'Sweet',
      emoji: '💕',
      tagline: 'Wholesome & romantic',
      accent: '#fb7185',
      accentGrad: 'linear-gradient(135deg, #fb7185, #f43f5e)',
      glow: 'rgba(251, 113, 133, 0.45)'
    },
    flirty: {
      id: 'flirty',
      label: 'Flirty',
      emoji: '😏',
      tagline: 'Playful & teasing',
      accent: '#f59e0b',
      accentGrad: 'linear-gradient(135deg, #f59e0b, #d97706)',
      glow: 'rgba(245, 158, 11, 0.45)'
    },
    spicy: {
      id: 'spicy',
      label: 'Spicy',
      emoji: '🌶️',
      tagline: 'Bold & intimate',
      accent: '#ef4444',
      accentGrad: 'linear-gradient(135deg, #ef4444, #dc2626)',
      glow: 'rgba(239, 68, 68, 0.45)'
    },
    extreme: {
      id: 'extreme',
      label: 'Extreme',
      emoji: '🔥',
      tagline: 'For adventurous couples',
      accent: '#a855f7',
      accentGrad: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      glow: 'rgba(168, 85, 247, 0.45)'
    }
  };

  let state = {
    screen: 'lobby', // 'lobby' | 'wheel' | 'card'
    vibe: 'sweet',
    isSpinning: false,
    wheelAngle: 0,
    currentType: null, // 'truth' | 'dare'
    currentText: '',
    playerTurn: 1, // 1: Player 1, 2: Player 2
    seenIndices: {
      sweet: { truths: new Set(), dares: new Set() },
      flirty: { truths: new Set(), dares: new Set() },
      spicy: { truths: new Set(), dares: new Set() },
      extreme: { truths: new Set(), dares: new Set() }
    }
  };

  // ── Helper: Get Random Question from Pool without repeating ──
  function getRandomCard(vibeId, type) {
    const data = window.TruthOrDareData || {};
    const key = type === 'truth' ? 'truths' : 'dares';
    const pool = (data[vibeId] && data[vibeId][key]) || [];
    if (pool.length === 0) {
      return type === 'truth' 
        ? "What is the single sweetest thing your partner did for you recently?" 
        : "Give your partner a slow, loving 30-second hug and whisper why you love them.";
    }

    if (!state.seenIndices[vibeId]) {
      state.seenIndices[vibeId] = { truths: new Set(), dares: new Set() };
    }
    const seenSet = state.seenIndices[vibeId][key];
    if (seenSet.size >= pool.length) {
      seenSet.clear(); // Reset if all cards have been seen
    }

    let attempts = 0;
    let idx = Math.floor(Math.random() * pool.length);
    while (seenSet.has(idx) && attempts < 30) {
      idx = Math.floor(Math.random() * pool.length);
      attempts++;
    }
    seenSet.add(idx);
    return pool[idx];
  }

  // ── Sample Preview Cards for 3D Stack in Lobby ──
  function getPreviewSamples(vibeId) {
    const data = window.TruthOrDareData || {};
    const truths = (data[vibeId] && data[vibeId].truths) || [];
    const dares = (data[vibeId] && data[vibeId].dares) || [];

    return [
      truths[0] || "What's your favorite memory of us together?",
      dares[0] || "Give your partner a 30-second forehead kiss.",
      truths[1] || "What was the first thing you noticed about your partner?"
    ];
  }

  // ── Render Controller ──
  function renderScreen() {
    const container = document.getElementById('tod-screen-container');
    if (!container) return;

    if (state.screen === 'lobby') {
      container.innerHTML = _renderLobby();
      _bindLobby();
    } else if (state.screen === 'wheel') {
      container.innerHTML = _renderWheel();
      _bindWheel();
    } else if (state.screen === 'card') {
      container.innerHTML = _renderCard();
      _bindCard();
    }
  }

  // ── 1. LOBBY SCREEN (Pick Your Vibe & 3D Card Stack) ──
  function _renderLobby() {
    const curVibe = VIBES[state.vibe] || VIBES.sweet;
    const samples = getPreviewSamples(state.vibe);

    return `
      <div class="tod-card tod-fade-in tod-lobby-view">
        <div class="tod-header-icon">🎯</div>
        <h1 class="tod-main-title">Truth or Dare</h1>
        <p class="tod-sub-prompt">Pick your vibe</p>

        <!-- Vibe Pills -->
        <div class="tod-vibe-pill-row">
          ${Object.values(VIBES).map(v => {
            const isActive = v.id === state.vibe;
            return `
              <button 
                type="button" 
                class="tod-vibe-pill ${isActive ? 'active' : ''}" 
                data-vibe="${v.id}"
                title="${v.tagline}"
              >
                <span class="tod-vp-emoji">${v.emoji}</span>
                <span class="tod-vp-label">${v.label}</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- 3D Tilted Card Stack Preview -->
        <div class="tod-stack-wrapper">
          <div class="tod-stack-card c3" style="border-left: 4px solid ${curVibe.accent};">
            <p class="tod-sc-text">${samples[2]}</p>
          </div>
          <div class="tod-stack-card c2" style="border-left: 4px solid ${curVibe.accent};">
            <p class="tod-sc-text">${samples[1]}</p>
          </div>
          <div class="tod-stack-card c1 active-top" style="border-left: 4px solid ${curVibe.accent};">
            <span class="tod-sc-vibe-tag" style="background: ${curVibe.accentGrad}; color:#fff;">${curVibe.emoji} ${curVibe.label}</span>
            <p class="tod-sc-text">${samples[0]}</p>
          </div>
        </div>

        <p class="tod-pool-count">600+ truths & dares inside</p>

        <!-- Main Continue Button -->
        <button type="button" class="tod-btn-primary" id="tod-btn-continue">
          Continue
        </button>

        <!-- Play on Two Phones / Share Option -->
        <button type="button" class="tod-btn-secondary" id="tod-btn-share-lobby">
          <span class="tod-bs-icon">📱</span>
          <div class="tod-bs-text">
            <strong>Play with Partner in BUDDY</strong>
            <small>Send direct game challenge in 1-on-1 chat</small>
          </div>
          <span class="tod-bs-arrow">➔</span>
        </button>
      </div>
    `;
  }

  function _bindLobby() {
    // Vibe Pill Selection
    document.querySelectorAll('.tod-vibe-pill').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const v = btn.dataset.vibe;
        if (v && VIBES[v]) {
          state.vibe = v;
          if (navigator.vibrate) navigator.vibrate(10);
          renderScreen();
        }
      };
    });

    // Continue Button -> Go to Wheel
    const contBtn = document.getElementById('tod-btn-continue');
    if (contBtn) {
      contBtn.onclick = (e) => {
        e.stopPropagation();
        state.screen = 'wheel';
        state.isSpinning = false;
        renderScreen();
      };
    }

    // Card Stack Tap -> Also advances to Wheel
    const stack = document.querySelector('.tod-stack-wrapper');
    if (stack) {
      stack.style.cursor = 'pointer';
      stack.onclick = () => {
        state.screen = 'wheel';
        state.isSpinning = false;
        renderScreen();
      };
    }

    // Share Challenge Button
    const shareBtn = document.getElementById('tod-btn-share-lobby');
    if (shareBtn) {
      shareBtn.onclick = (e) => {
        e.stopPropagation();
        const v = VIBES[state.vibe] || VIBES.sweet;
        const text = `🎯 Hey! Let's play Truth or Dare (${v.emoji} ${v.label} Mode) together on BUDDY! 💖\n👉 Play now: ${window.location.origin}${window.location.pathname}?game=truth-or-dare&vibe=${v.id}`;
        _copyAndToast(text, `📋 Copied Truth or Dare ${v.label} challenge! Share it in your chat.`);
      };
    }
  }

  // ── 2. SPIN WHEEL SCREEN (Dual-Tone Disc) ──
  function _renderWheel() {
    const curVibe = VIBES[state.vibe] || VIBES.sweet;

    return `
      <div class="tod-card tod-fade-in tod-wheel-view">
        <!-- Top Compact Controls -->
        <div class="tod-wheel-topbar">
          <button type="button" class="tod-back-btn" id="tod-wheel-back" title="Change Vibe">
            ← Vibe: ${curVibe.emoji} ${curVibe.label}
          </button>
          <div class="tod-turn-badge" id="tod-btn-toggle-turn" title="Click to switch player">
            🎲 Player ${state.playerTurn}'s Turn
          </div>
        </div>

        <div class="tod-wheel-heading">
          <h2>Spin the Wheel!</h2>
          <p>Will destiny pick a deep <strong>Truth 💭</strong> or a daring <strong>Dare 🔥</strong>?</p>
        </div>

        <!-- Wheel Stage -->
        <div class="tod-wheel-stage">
          <div class="tod-wheel-ambient-glow" style="background: radial-gradient(circle, ${curVibe.glow} 0%, transparent 70%);"></div>

          <!-- Top Pointer Pin -->
          <div class="tod-wheel-pin">
            <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
              <defs>
                <linearGradient id="tod-pin-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#ffffff"/>
                  <stop offset="1" stop-color="#cbd5e1"/>
                </linearGradient>
              </defs>
              <path d="M17 41 C17 41 4 24 4 14 A13 13 0 1 1 30 14 C30 24 17 41 17 41 Z" fill="url(#tod-pin-grad)" stroke="#0a0a0a" stroke-width="2.5"/>
              <circle cx="17" cy="14" r="5" fill="#e11d48"/>
            </svg>
          </div>

          <!-- The Rotating Disc -->
          <div 
            class="tod-disc-container" 
            id="tod-wheel-disc" 
            style="transform: rotate(${state.wheelAngle}deg);"
          >
            <!-- TOP HALF: TRUTH (Light) -->
            <div class="tod-disc-half tod-half-truth">
              <span class="tod-dh-icon">💭</span>
              <span class="tod-dh-text">TRUTH</span>
            </div>

            <!-- BOTTOM HALF: DARE (Dark) -->
            <div class="tod-disc-half tod-half-dare">
              <span class="tod-dh-text">DARE</span>
              <span class="tod-dh-icon">🔥</span>
            </div>

            <!-- Center Heart Hub -->
            <div class="tod-disc-center-hub">
              <span class="tod-dch-heart">❤️</span>
            </div>
          </div>
        </div>

        <!-- Spin Action Button -->
        <button 
          type="button" 
          class="tod-btn-primary tod-spin-action-btn ${state.isSpinning ? 'spinning' : ''}" 
          id="tod-btn-spin"
          ${state.isSpinning ? 'disabled' : ''}
        >
          ${state.isSpinning ? 'SPINNING... 🎲' : 'SPIN WHEEL 🎲'}
        </button>

        <div class="tod-wheel-hint">
          💡 Tap button or tap the wheel directly to start spinning!
        </div>
      </div>
    `;
  }

  function _bindWheel() {
    const backBtn = document.getElementById('tod-wheel-back');
    if (backBtn) {
      backBtn.onclick = () => {
        if (state.isSpinning) return;
        state.screen = 'lobby';
        renderScreen();
      };
    }

    const turnToggle = document.getElementById('tod-btn-toggle-turn');
    if (turnToggle) {
      turnToggle.onclick = () => {
        if (state.isSpinning) return;
        state.playerTurn = state.playerTurn === 1 ? 2 : 1;
        turnToggle.textContent = `🎲 Player ${state.playerTurn}'s Turn`;
        if (navigator.vibrate) navigator.vibrate(15);
      };
    }

    const spinBtn = document.getElementById('tod-btn-spin');
    const disc = document.getElementById('tod-wheel-disc');

    const triggerSpin = () => {
      if (state.isSpinning) return;
      _spinWheel();
    };

    if (spinBtn) spinBtn.onclick = triggerSpin;
    if (disc) disc.onclick = triggerSpin;
  }

  function _spinWheel() {
    if (state.isSpinning) return;
    state.isSpinning = true;

    const spinBtn = document.getElementById('tod-btn-spin');
    const disc = document.getElementById('tod-wheel-disc');
    if (!disc) {
      state.isSpinning = false;
      return;
    }

    // Update button directly without rebuilding wheel DOM
    if (spinBtn) {
      spinBtn.disabled = true;
      spinBtn.classList.add('spinning');
      spinBtn.textContent = 'SPINNING... 🎲';
    }

    // Random choice: Truth or Dare (50/50)
    const resultType = Math.random() < 0.5 ? 'truth' : 'dare';

    // Top half is Truth (pointer at 0 deg). Bottom half is Dare (pointer at 180 deg).
    const baseTargetAngle = resultType === 'truth' ? 0 : 180;
    // Jitter: random angle between -35 and +35 deg so it feels organic
    const jitter = Math.floor(Math.random() * 70) - 35;
    
    // Add 5 full spins (1800 deg) + angle delta
    const currentRot = state.wheelAngle;
    const delta = ((baseTargetAngle + jitter - (currentRot % 360) + 360) % 360);
    const nextRot = currentRot + 1800 + delta;
    state.wheelAngle = nextRot;

    // Apply rotation animation directly to existing disc
    disc.style.transition = 'transform 2.2s cubic-bezier(0.16, 1, 0.3, 1)';
    disc.style.transform = `rotate(${nextRot}deg)`;

    // Haptic vibration ticks during spin
    if (navigator.vibrate) {
      let tick = 0;
      const tickInterval = setInterval(() => {
        try { navigator.vibrate(10); } catch(e) {}
        tick++;
        if (tick > 7) clearInterval(tickInterval);
      }, 250);
    }

    // Resolve after 2.2s
    setTimeout(() => {
      state.isSpinning = false;
      state.currentType = resultType;
      state.currentText = getRandomCard(state.vibe, resultType);
      state.screen = 'card';
      if (navigator.vibrate) {
        try { navigator.vibrate([40, 60, 100]); } catch(e) {}
      }
      renderScreen();
    }, 2250);
  }

  // ── 3. CARD REVEAL SCREEN (The Drawn Truth / Dare) ──
  function _renderCard() {
    const curVibe = VIBES[state.vibe] || VIBES.sweet;
    const isTruth = state.currentType === 'truth';

    return `
      <div class="tod-card tod-fade-in tod-result-view">
        <!-- Vibe & Turn Meta -->
        <div class="tod-result-meta-bar">
          <span class="tod-rm-turn">🎲 Player ${state.playerTurn}'s Turn</span>
          <span class="tod-rm-vibe" style="border-color: ${curVibe.accent}; color: ${curVibe.accent};">
            ${curVibe.emoji} ${curVibe.label} Level
          </span>
        </div>

        <!-- The Glowing Revealed Card -->
        <div class="tod-drawn-card ${isTruth ? 'card-truth' : 'card-dare'}">
          <div class="tod-dc-badge-wrap">
            <span class="tod-dc-badge ${isTruth ? 'badge-truth' : 'badge-dare'}">
              ${isTruth ? '💭 TRUTH' : '🔥 DARE'}
            </span>
          </div>

          <div class="tod-dc-content">
            <p class="tod-dc-text">${state.currentText}</p>
          </div>

          <div class="tod-dc-bottom-accent">
            <span>❤️ BUDDY Love Special</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="tod-result-actions">
          <button type="button" class="tod-btn-primary tod-btn-next-turn" id="tod-btn-done-next">
            Done! Next Turn ➔
          </button>

          <div class="tod-action-sub-grid">
            <button type="button" class="tod-btn-sub-action" id="tod-btn-swap" title="Get another card">
              🔀 Swap Card
            </button>
            <button type="button" class="tod-btn-sub-action" id="tod-btn-share-card" title="Send to Partner">
              💬 Send in Chat
            </button>
          </div>

          <button type="button" class="tod-btn-link-action" id="tod-btn-back-wheel">
            ← Back to Wheel
          </button>
        </div>
      </div>
    `;
  }

  function _bindCard() {
    const curVibe = VIBES[state.vibe] || VIBES.sweet;

    // Done / Next Turn -> Advances player turn and returns to wheel
    const nextBtn = document.getElementById('tod-btn-done-next');
    if (nextBtn) {
      nextBtn.onclick = () => {
        state.playerTurn = state.playerTurn === 1 ? 2 : 1;
        state.screen = 'wheel';
        state.isSpinning = false;
        renderScreen();
      };
    }

    // Swap Card -> Draws a different card in the same vibe & type
    const swapBtn = document.getElementById('tod-btn-swap');
    if (swapBtn) {
      swapBtn.onclick = () => {
        state.currentText = getRandomCard(state.vibe, state.currentType);
        if (navigator.vibrate) navigator.vibrate(15);
        renderScreen();
      };
    }

    // Send in Chat
    const shareBtn = document.getElementById('tod-btn-share-card');
    if (shareBtn) {
      shareBtn.onclick = () => {
        const typeLabel = state.currentType === 'truth' ? '💭 TRUTH' : '🔥 DARE';
        const msg = `🎯 *Truth or Dare (${curVibe.emoji} ${curVibe.label})*\n*${typeLabel}:*\n"${state.currentText}"\n\nYour turn now! Answer me or do the dare! 😉💖`;
        _copyAndToast(msg, `📋 Copied ${typeLabel} to clipboard! Paste it into your partner's chat.`);
      };
    }

    // Back to Wheel
    const backWheelBtn = document.getElementById('tod-btn-back-wheel');
    if (backWheelBtn) {
      backWheelBtn.onclick = () => {
        state.screen = 'wheel';
        renderScreen();
      };
    }
  }

  // ── Helper: Copy to Clipboard & Show Toast ──
  function _copyAndToast(text, toastMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showToast === 'function') {
          window.showToast(toastMsg || '📋 Copied to clipboard!');
        }
      }).catch(() => {
        _fallbackCopy(text, toastMsg);
      });
    } else {
      _fallbackCopy(text, toastMsg);
    }
  }

  function _fallbackCopy(text, toastMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (typeof window.showToast === 'function') {
        window.showToast(toastMsg || '📋 Copied to clipboard!');
      }
    } catch (e) {}
    document.body.removeChild(ta);
  }

  // ── Modal Open / Close Controllers ──
  function openGame(initialVibe) {
    if (initialVibe && VIBES[initialVibe]) {
      state.vibe = initialVibe;
    }
    state.screen = 'lobby';
    state.isSpinning = false;
    openGameModal();
    renderScreen();
  }

  function openGameModal() {
    const modal = document.getElementById('tod-game-modal-overlay');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.pointerEvents = 'auto';
    }
  }

  function closeGameModal() {
    const modal = document.getElementById('tod-game-modal-overlay');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';
    }
    state.isSpinning = false;
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const game = params.get('game');
    const vibe = params.get('vibe') || params.get('tod_vibe');

    if (game === 'truth-or-dare' || game === 'tod') {
      openGame(vibe);
    }
  }

  function init() {
    console.log('🎯 [BUDDY Games] Initializing Truth or Dare engine...');
    checkUrlParams();

    const closeBtn = document.getElementById('tod-game-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => closeGameModal();
    }
  }

  return {
    init,
    openGame,
    closeGameModal,
    checkUrlParams
  };
})();

if (typeof window !== 'undefined') {
  window.TruthOrDareGame = TruthOrDareGame;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TruthOrDareGame.init());
  } else {
    setTimeout(() => TruthOrDareGame.init(), 60);
  }
}
