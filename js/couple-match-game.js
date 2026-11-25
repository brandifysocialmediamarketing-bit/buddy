/**
 * BUDDY - couple-match-game.js (v202)
 * Game: "Love Clash 💖⚡" - The Ultimate Couple Tap War
 * 
 * ONE SINGLE DEDICATED, HIGHLY ADDICTIVE GAME:
 * - 2-Player Split Screen Tap Battle (Play head-to-head on 1 phone!)
 * - Solo 10s Speed Rush (Set record & challenge partner in chat!)
 * - Practice vs Cupid AI
 * - Random Spawning Power-Ups (⚡ 2X Boost, ❄️ Freeze Opponent, 💣 Heart Bomb)
 * - Screen-shake, touch ripple rings, neon particle bursts, haptic vibration
 * - Romantic victory forfeits / dares for the loser
 */

const CoupleMatchGame = (() => {
  // ── Random Romantic Forfeits for the Loser ──
  const ROMANTIC_FORFEITS = [
    { title: "10-Min Tension Massage 💆", desc: "Loser must give the winner a relaxing 10-minute shoulder or head massage tonight!" },
    { title: "Midnight Sweet Treat 🍦", desc: "Loser treats the winner to their favorite ice cream or midnight snack with no complaints!" },
    { title: "Royal 'Yes Day' Wish 👑", desc: "Winner gets 1 wish granted today with zero arguments!" },
    { title: "Heartfelt Song Dedication 🎤", desc: "Loser must record a 20-second romantic song on voice note in chat!" },
    { title: "5 Forehead Kisses 💋", desc: "Loser must give 5 sweet forehead kisses right now with a smile!" },
    { title: "Surprise Date Duty 🚗", desc: "Loser has to plan, organize, and pay for the next date night!" },
    { title: "Silly Derpy Selfie 📸", desc: "Loser must send the most goofy, funny no-filter selfie in chat right now!" },
    { title: "Cook Late-Night Maggi 🍜", desc: "Loser is the designated chef tonight for midnight cravings!" }
  ];

  // ── Game State ──
  let state = {
    mode: '2p', // '2p' (split screen) | 'solo' (10s rush) | 'ai' (vs Cupid AI)
    isPlaying: false,
    countdown: null, // 3, 2, 1, 'GO!'
    // 2-Player Battle Position: 50 = Center, 10 = P2 Win, 90 = P1 Win
    heartPosition: 50, 
    p1Taps: 0,
    p2Taps: 0,
    startTime: 0,
    matchDuration: 0,
    winner: null, // 'p1' | 'p2' | 'tie'
    winningForfeit: null,
    // Power-ups
    p1Multiplier: 1,
    p2Multiplier: 1,
    p1FrozenUntil: 0,
    p2FrozenUntil: 0,
    activePowerUp: null, // { type: 'boost'|'freeze'|'bomb', player: 'p1'|'p2', x, y }
    // Solo Mode
    soloTimeLeft: 10,
    soloTaps: 0,
    targetScore: null,
    challengerName: '',
    soloTimerInterval: null,
    aiInterval: null,
    powerUpTimeout: null
  };

  // ── Mascot SVG ──
  const MASCOT_SVG = `
    <svg class="cm-mascot-art" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lcGradPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff2d75"/>
          <stop offset="100%" stop-color="#fb7185"/>
        </linearGradient>
        <linearGradient id="lcGradBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00f0ff"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="65" r="28" fill="url(#lcGradPink)"/>
      <circle cx="43" cy="61" r="3" fill="#ffffff"/>
      <circle cx="57" cy="61" r="3" fill="#ffffff"/>
      <path d="M45 71C47 75 53 75 55 71" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>

      <circle cx="110" cy="65" r="28" fill="url(#lcGradBlue)"/>
      <circle cx="103" cy="61" r="3" fill="#ffffff"/>
      <circle cx="117" cy="61" r="3" fill="#ffffff"/>
      <path d="M105 71C107 75 113 75 115 71" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Lightning Zap in Center -->
      <path d="M80 30L73 55H84L77 85L93 50H81L87 30H80Z" fill="#ffd700" filter="drop-shadow(0 0 8px #ffd700)"/>
    </svg>
  `;

  // ── Render Router ──
  function renderScreen() {
    const container = document.getElementById('cm-screen-container');
    if (!container) return;

    if (!state.isPlaying && !state.winner && !state.countdown) {
      container.innerHTML = _renderLobby();
      _bindLobby();
    } else if (state.countdown) {
      container.innerHTML = _renderCountdown();
    } else if (state.isPlaying) {
      if (state.mode === 'solo') {
        container.innerHTML = _renderSoloBattle();
        _bindSoloBattle();
      } else {
        container.innerHTML = _renderSplitBattle();
        _bindSplitBattle();
      }
    } else if (state.winner) {
      container.innerHTML = _renderVictory();
      _bindVictory();
    }
  }

  // ─────────────────────────────────────────────────────────
  // 1. LOBBY (Start Battle Screen)
  // ─────────────────────────────────────────────────────────
  function _renderLobby() {
    const hasChallenge = state.targetScore !== null;

    return `
      <div class="cm-card cm-fade-in cm-lobby-card">
        <div class="cm-mascot-wrap">
          ${MASCOT_SVG}
        </div>
        <div class="cm-badge-pill">🔥 Couple Battle</div>
        <h2 class="cm-title">Love Clash 💖⚡</h2>
        <p class="cm-subtitle">
          Smash your screen as fast as your fingers can tap! Pull the giant heart into your zone & make your partner do a dare!
        </p>

        ${hasChallenge ? `
          <div class="cm-challenge-banner cm-fade-in">
            <span class="cm-cb-icon">⚡</span>
            <div>
              <strong>Challenge from ${state.challengerName || 'Partner'}!</strong>
              <small>Score to beat: <strong>${state.targetScore} Taps</strong> in 10 seconds!</small>
            </div>
          </div>
        ` : ''}

        <!-- Mode Select Cards -->
        <div class="cm-battle-modes">
          <button type="button" class="cm-mode-card ${state.mode === '2p' ? 'active' : ''}" data-mode="2p">
            <span class="cm-mc-icon">👥</span>
            <div class="cm-mc-info">
              <strong>2-Player Battle (1 Phone)</strong>
              <small>Split screen! Face each other & tap together!</small>
            </div>
            <span class="cm-mc-badge">Couples Favorite</span>
          </button>

          <button type="button" class="cm-mode-card ${state.mode === 'solo' ? 'active' : ''}" data-mode="solo">
            <span class="cm-mc-icon">⏱️</span>
            <div class="cm-mc-info">
              <strong>10s Speed Rush (Chat Challenge)</strong>
              <small>Tap solo for 10s & send challenge to partner in chat!</small>
            </div>
            <span class="cm-mc-badge">Remote Fun</span>
          </button>

          <button type="button" class="cm-mode-card ${state.mode === 'ai' ? 'active' : ''}" data-mode="ai">
            <span class="cm-mc-icon">🤖</span>
            <div class="cm-mc-info">
              <strong>Play vs Cupid AI</strong>
              <small>Practice your speed against our smart bot!</small>
            </div>
            <span class="cm-mc-badge">Practice</span>
          </button>
        </div>

        <button type="button" class="cm-btn-romantic cm-btn-full cm-start-battle-btn" id="cm-btn-start-battle">
          START BATTLE! 🚀⚡
        </button>

        <div class="cm-footer-note">
          💡 Tip: Use two fingers (index & middle) to tap ultra-fast!
        </div>
      </div>
    `;
  }

  function _bindLobby() {
    document.querySelectorAll('.cm-mode-card').forEach(card => {
      card.onclick = () => {
        document.querySelectorAll('.cm-mode-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.mode = card.dataset.mode;
      };
    });

    const startBtn = document.getElementById('cm-btn-start-battle');
    if (startBtn) {
      startBtn.onclick = () => _startCountdown();
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2. COUNTDOWN (3.. 2.. 1.. GO!)
  // ─────────────────────────────────────────────────────────
  function _startCountdown() {
    state.heartPosition = 50;
    state.p1Taps = 0;
    state.p2Taps = 0;
    state.soloTaps = 0;
    state.p1Multiplier = 1;
    state.p2Multiplier = 1;
    state.p1FrozenUntil = 0;
    state.p2FrozenUntil = 0;
    state.activePowerUp = null;
    state.winner = null;
    state.countdown = 3;

    renderScreen();

    const cdInterval = setInterval(() => {
      state.countdown--;
      if (state.countdown === 0) {
        state.countdown = 'TAP! 💥';
        renderScreen();
        if (navigator.vibrate) navigator.vibrate(50);
      } else if (state.countdown < 0) {
        clearInterval(cdInterval);
        state.countdown = null;
        state.isPlaying = true;
        state.startTime = performance.now();
        renderScreen();

        if (state.mode === 'solo') {
          _runSoloTimer();
        } else {
          _startPowerUpLoop();
          if (state.mode === 'ai') _startCupidAI();
        }
      } else {
        renderScreen();
        if (navigator.vibrate) navigator.vibrate(30);
      }
    }, 700);
  }

  function _renderCountdown() {
    return `
      <div class="cm-card cm-countdown-card cm-fade-in">
        <div class="cm-cd-number ${state.countdown === 'TAP! 💥' ? 'go' : ''}">
          ${state.countdown}
        </div>
        <p class="cm-cd-hint">Get your fingers ready! 🖐️⚡</p>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────
  // 3. SPLIT SCREEN 2-PLAYER BATTLE (The Heart Tug-of-War)
  // ─────────────────────────────────────────────────────────
  function _renderSplitBattle() {
    const isP1Frozen = Date.now() < state.p1FrozenUntil;
    const isP2Frozen = Date.now() < state.p2FrozenUntil;
    const now = Date.now();

    return `
      <div class="cm-split-arena" id="cm-battle-arena">
        <!-- PLAYER 2 HALF (TOP - BLUE 💙) -->
        <div class="cm-player-half p2-half ${isP2Frozen ? 'frozen' : ''}" id="cm-p2-tap-zone">
          <div class="cm-half-header mirrored">
            <span class="cm-half-tag">💙 PLAYER 2</span>
            <span class="cm-half-counter">${state.p2Taps} Taps</span>
          </div>
          <div class="cm-tap-hint mirrored">
            ${isP2Frozen ? '❄️ FROZEN! ❄️' : (state.mode === 'ai' ? '🤖 Cupid AI Tapping...' : 'TAP HERE AS FAST AS YOU CAN! 👆')}
          </div>
          <div class="cm-half-goal-line mirrored">P2 GOAL (WIN HERE)</div>
        </div>

        <!-- DIVIDING LINE & TUG-OF-WAR HEART -->
        <div class="cm-battle-center-divider">
          <!-- The Glowing Heart: top % based on heartPosition (10% to 90%) -->
          <div 
            class="cm-clash-heart" 
            id="cm-heart-actor" 
            style="top: ${state.heartPosition}%;"
          >
            <div class="cm-ch-glow"></div>
            <div class="cm-ch-body">💖</div>
            <div class="cm-ch-pos-label">${Math.round(state.heartPosition)}%</div>
          </div>
        </div>

        <!-- PLAYER 1 HALF (BOTTOM - PINK 💖) -->
        <div class="cm-player-half p1-half ${isP1Frozen ? 'frozen' : ''}" id="cm-p1-tap-zone">
          <div class="cm-half-goal-line">P1 GOAL (WIN HERE)</div>
          <div class="cm-tap-hint">
            ${isP1Frozen ? '❄️ FROZEN! ❄️' : 'TAP HERE AS FAST AS YOU CAN! 👆'}
          </div>
          <div class="cm-half-header">
            <span class="cm-half-tag">💖 PLAYER 1</span>
            <span class="cm-half-counter">${state.p1Taps} Taps</span>
          </div>
        </div>

        <!-- Floating Power-Up Item if active -->
        ${state.activePowerUp ? `
          <button 
            type="button" 
            class="cm-powerup-bubble ${state.activePowerUp.type}" 
            style="top:${state.activePowerUp.y}%; left:${state.activePowerUp.x}%;"
            id="cm-powerup-btn"
          >
            ${state.activePowerUp.type === 'boost' ? '⚡ 2X' : (state.activePowerUp.type === 'freeze' ? '❄️ FREEZE' : '💣 BOMB')}
          </button>
        ` : ''}
      </div>
    `;
  }

  function _bindSplitBattle() {
    const p1Zone = document.getElementById('cm-p1-tap-zone');
    const p2Zone = document.getElementById('cm-p2-tap-zone');
    const arena = document.getElementById('cm-battle-arena');
    const powerBtn = document.getElementById('cm-powerup-btn');

    if (p1Zone) {
      let isTouchingP1 = false;
      p1Zone.addEventListener('touchstart', (e) => {
        isTouchingP1 = true;
        if (e.cancelable) e.preventDefault();
        const touches = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches : e.touches;
        const count = touches ? touches.length : 1;
        for (let i = 0; i < count; i++) {
          _onPlayerTap('p1', {
            clientX: touches ? touches[i].clientX : 0,
            clientY: touches ? touches[i].clientY : 0
          });
        }
      }, { passive: false });

      p1Zone.addEventListener('mousedown', (e) => {
        if (isTouchingP1) return;
        _onPlayerTap('p1', e);
      });
    }

    if (p2Zone && state.mode !== 'ai') {
      let isTouchingP2 = false;
      p2Zone.addEventListener('touchstart', (e) => {
        isTouchingP2 = true;
        if (e.cancelable) e.preventDefault();
        const touches = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches : e.touches;
        const count = touches ? touches.length : 1;
        for (let i = 0; i < count; i++) {
          _onPlayerTap('p2', {
            clientX: touches ? touches[i].clientX : 0,
            clientY: touches ? touches[i].clientY : 0
          });
        }
      }, { passive: false });

      p2Zone.addEventListener('mousedown', (e) => {
        if (isTouchingP2) return;
        _onPlayerTap('p2', e);
      });
    }

    if (powerBtn && state.activePowerUp) {
      powerBtn.onclick = (e) => {
        e.stopPropagation();
        _activatePowerUp(state.activePowerUp);
      };
    }
  }

  function _onPlayerTap(player, e) {
    if (!state.isPlaying) return;

    const now = Date.now();
    if (player === 'p1' && now < state.p1FrozenUntil) return;
    if (player === 'p2' && now < state.p2FrozenUntil) return;

    if (navigator.vibrate) navigator.vibrate(12);

    // Calculate move delta
    const multiplier = player === 'p1' ? state.p1Multiplier : state.p2Multiplier;
    const step = 2.4 * multiplier;

    if (player === 'p1') {
      state.p1Taps++;
      state.heartPosition = Math.min(state.heartPosition + step, 92);
    } else {
      state.p2Taps++;
      state.heartPosition = Math.max(state.heartPosition - step, 8);
    }

    // Touch ripple effect
    _createTouchRipple(e, player);

    // Update DOM directly for 60fps buttery smoothness
    const heartEl = document.getElementById('cm-heart-actor');
    if (heartEl) {
      heartEl.style.top = state.heartPosition + '%';
      const label = heartEl.querySelector('.cm-ch-pos-label');
      if (label) label.textContent = Math.round(state.heartPosition) + '%';
      heartEl.classList.remove('pulse-left', 'pulse-right');
      void heartEl.offsetWidth;
      heartEl.classList.add(player === 'p1' ? 'pulse-down' : 'pulse-up');
    }

    const p1Counter = document.querySelector('.p1-half .cm-half-counter');
    if (p1Counter) p1Counter.textContent = `${state.p1Taps} Taps`;
    const p2Counter = document.querySelector('.p2-half .cm-half-counter');
    if (p2Counter) p2Counter.textContent = `${state.p2Taps} Taps`;

    // Check Victory Condition
    if (state.heartPosition >= 90) {
      _finishBattle('p1');
    } else if (state.heartPosition <= 10) {
      _finishBattle('p2');
    }
  }

  function _createTouchRipple(e, player) {
    const arena = document.getElementById('cm-battle-arena');
    if (!arena) return;

    const rect = arena.getBoundingClientRect();
    let clientX = e ? e.clientX : 0;
    let clientY = e ? e.clientY : 0;
    if (!clientX && !clientY && e && e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    if (!clientX || !clientY) return;

    const ripple = document.createElement('div');
    ripple.className = `cm-tap-ripple ${player}`;
    ripple.style.left = (clientX - rect.left) + 'px';
    ripple.style.top = (clientY - rect.top) + 'px';
    arena.appendChild(ripple);

    setTimeout(() => ripple.remove(), 400);
  }

  // ── Power-Ups System ──
  function _startPowerUpLoop() {
    clearTimeout(state.powerUpTimeout);
    state.powerUpTimeout = setTimeout(() => {
      if (!state.isPlaying) return;
      const types = ['boost', 'freeze', 'bomb'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      state.activePowerUp = {
        type: chosenType,
        x: 20 + Math.floor(Math.random() * 60),
        y: 25 + Math.floor(Math.random() * 50)
      };
      renderScreen();

      // Disappear after 4.5 seconds if not tapped
      setTimeout(() => {
        if (state.activePowerUp && state.isPlaying) {
          state.activePowerUp = null;
          renderScreen();
          _startPowerUpLoop();
        }
      }, 4500);
    }, 4000 + Math.floor(Math.random() * 4000));
  }

  function _activatePowerUp(p) {
    if (!state.isPlaying || !p) return;
    const beneficiary = p.y > 50 ? 'p1' : 'p2'; // Claimed in p1 or p2 half

    if (p.type === 'boost') {
      if (beneficiary === 'p1') {
        state.p1Multiplier = 2;
        setTimeout(() => { state.p1Multiplier = 1; }, 3500);
      } else {
        state.p2Multiplier = 2;
        setTimeout(() => { state.p2Multiplier = 1; }, 3500);
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`⚡ ${beneficiary === 'p1' ? 'P1' : 'P2'} got 2X MEGA TAP BOOST!`);
      }
    } else if (p.type === 'freeze') {
      if (beneficiary === 'p1') {
        state.p2FrozenUntil = Date.now() + 1400;
      } else {
        state.p1FrozenUntil = Date.now() + 1400;
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`❄️ Opponent FROZEN for 1.4 seconds!`);
      }
    } else if (p.type === 'bomb') {
      if (beneficiary === 'p1') {
        state.heartPosition = Math.min(state.heartPosition + 14, 92);
      } else {
        state.heartPosition = Math.max(state.heartPosition - 14, 8);
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`💣 HEART BOMB BLAST!`);
      }
    }

    state.activePowerUp = null;
    renderScreen();
    _startPowerUpLoop();
  }

  // ── Cupid AI ──
  function _startCupidAI() {
    clearInterval(state.aiInterval);
    state.aiInterval = setInterval(() => {
      if (!state.isPlaying) return;
      if (Date.now() < state.p2FrozenUntil) return;

      // Realistic tap simulation (between 5 to 9 taps/sec)
      if (Math.random() > 0.15) {
        state.p2Taps++;
        state.heartPosition = Math.max(state.heartPosition - (2.1 * state.p2Multiplier), 8);

        const heartEl = document.getElementById('cm-heart-actor');
        if (heartEl) {
          heartEl.style.top = state.heartPosition + '%';
          const label = heartEl.querySelector('.cm-ch-pos-label');
          if (label) label.textContent = Math.round(state.heartPosition) + '%';
        }
        const p2Counter = document.querySelector('.p2-half .cm-half-counter');
        if (p2Counter) p2Counter.textContent = `${state.p2Taps} Taps`;

        if (state.heartPosition <= 10) _finishBattle('p2');
      }
    }, 130);
  }

  // ─────────────────────────────────────────────────────────
  // 4. SOLO 10-SECOND SPEED RUSH (For Remote Play & Chat)
  // ─────────────────────────────────────────────────────────
  function _runSoloTimer() {
    state.soloTimeLeft = 10;
    clearInterval(state.soloTimerInterval);

    state.soloTimerInterval = setInterval(() => {
      state.soloTimeLeft--;
      const timerEl = document.getElementById('cm-solo-timer-num');
      if (timerEl) timerEl.textContent = state.soloTimeLeft + 's';

      if (state.soloTimeLeft <= 0) {
        clearInterval(state.soloTimerInterval);
        state.isPlaying = false;
        state.matchDuration = 10;

        let won = true;
        if (state.targetScore !== null) {
          won = state.soloTaps >= state.targetScore;
        }
        state.winner = won ? 'solo_win' : 'solo_lose';
        state.winningForfeit = ROMANTIC_FORFEITS[Math.floor(Math.random() * ROMANTIC_FORFEITS.length)];
        renderScreen();
      }
    }, 1000);
  }

  function _renderSoloBattle() {
    return `
      <div class="cm-card cm-solo-arena cm-fade-in">
        <div class="cm-solo-top">
          <div class="cm-solo-timer">⏱️ <span id="cm-solo-timer-num">10s</span></div>
          <div class="cm-solo-target">
            ${state.targetScore ? `Target: <strong>${state.targetScore} Taps</strong>` : 'Frenzy Mode 🔥'}
          </div>
        </div>

        <div class="cm-solo-tap-surface" id="cm-solo-tap-pad">
          <div class="cm-solo-big-score" id="cm-solo-score-display">${state.soloTaps}</div>
          <div class="cm-solo-heart-glow">💖</div>
          <p class="cm-solo-smash-hint">SMASH SCREEN WITH BOTH FINGERS! ⚡</p>
        </div>
      </div>
    `;
  }

  function _bindSoloBattle() {
    const pad = document.getElementById('cm-solo-tap-pad');
    if (!pad) return;

    const handleTap = (e) => {
      e.preventDefault();
      if (!state.isPlaying || state.soloTimeLeft <= 0) return;
      state.soloTaps++;
      if (navigator.vibrate) navigator.vibrate(10);

      const display = document.getElementById('cm-solo-score-display');
      if (display) display.textContent = state.soloTaps;

      // Ripple
      _createTouchRipple(e, 'p1');
    };

    pad.addEventListener('touchstart', handleTap, { passive: false });
    pad.addEventListener('mousedown', handleTap);
  }

  // ─────────────────────────────────────────────────────────
  // 5. VICTORY & ROMANTIC DARE SCREEN
  // ─────────────────────────────────────────────────────────
  function _finishBattle(winner) {
    state.isPlaying = false;
    state.winner = winner;
    state.matchDuration = Math.round((performance.now() - state.startTime) / 100) / 10;
    state.winningForfeit = ROMANTIC_FORFEITS[Math.floor(Math.random() * ROMANTIC_FORFEITS.length)];

    clearInterval(state.aiInterval);
    clearInterval(state.soloTimerInterval);
    clearTimeout(state.powerUpTimeout);

    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
    renderScreen();
  }

  function _renderVictory() {
    const forfeit = state.winningForfeit || ROMANTIC_FORFEITS[0];
    let winTitle = '';
    let winSubtitle = '';

    if (state.winner === 'p1') {
      winTitle = '👑 PLAYER 1 (💖 PINK) WINS!';
      winSubtitle = `Crushed it in ${state.matchDuration}s with ${state.p1Taps} taps!`;
    } else if (state.winner === 'p2') {
      winTitle = state.mode === 'ai' ? '🤖 Cupid AI Won!' : '👑 PLAYER 2 (💙 BLUE) WINS!';
      winSubtitle = `Dominated in ${state.matchDuration}s with ${state.p2Taps} taps!`;
    } else if (state.winner === 'solo_win') {
      winTitle = '🏆 RECORD SMASHED!';
      winSubtitle = `You tapped ${state.soloTaps} times in 10 seconds! Amazing speed!`;
    } else {
      winTitle = '😅 CHALLENGE MISSED!';
      winSubtitle = `You scored ${state.soloTaps} taps (Target was ${state.targetScore}).`;
    }

    const shareText = state.mode === 'solo'
      ? `⚡ Love Clash Challenge!\nI scored ${state.soloTaps} taps in 10 seconds! Can you beat me or do you owe me dinner tonight? 😜💖\n👉 Accept Challenge: ${window.location.origin}${window.location.pathname}?battle=${state.soloTaps}&name=Partner`
      : `🎉 Love Clash Battle Winner!\n${winTitle}\nDuration: ${state.matchDuration}s | Dares for Loser: ${forfeit.title}! 💆🍕`;

    return `
      <div class="cm-card cm-victory-card cm-fade-in">
        <div class="cm-mascot-wrap">
          ${MASCOT_SVG}
        </div>
        <div class="cm-badge-pill">🏆 Match Complete</div>
        <h2 class="cm-title cm-win-neon">${winTitle}</h2>
        <p class="cm-subtitle">${winSubtitle}</p>

        <!-- Dynamic Winner's Dare Card -->
        <div class="cm-victory-dare-box">
          <div class="cm-v-dare-tag">👑 WINNER'S REWARD (LOSER MUST DO THIS)</div>
          <div class="cm-v-dare-title">${forfeit.title}</div>
          <p class="cm-v-dare-desc">${forfeit.desc}</p>
        </div>

        <!-- Action Buttons -->
        <div class="cm-victory-actions">
          <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-rematch">
            🔄 Rematch Now!
          </button>
          <button type="button" class="cm-btn-outline cm-btn-full" style="margin-top:10px;" id="cm-btn-share-win">
            💬 Share in BUDDY Chat
          </button>
        </div>
      </div>
    `;
  }

  function _bindVictory() {
    const rematchBtn = document.getElementById('cm-btn-rematch');
    const shareBtn = document.getElementById('cm-btn-share-win');

    if (rematchBtn) {
      rematchBtn.onclick = () => _startCountdown();
    }

    if (shareBtn) {
      shareBtn.onclick = () => {
        const text = state.mode === 'solo'
          ? `⚡ Love Clash Challenge!\nI scored ${state.soloTaps} taps in 10s! Can you beat my record or do you owe me a date? 😜💖\n👉 Play: ${window.location.origin}${window.location.pathname}?battle=${state.soloTaps}&name=Me`
          : `🎉 Love Clash Winner!\n${state.winner === 'p1' ? '💖 Player 1' : '💙 Player 2'} WON in ${state.matchDuration}s!\nPenalty: ${state.winningForfeit.title} 💆🍕`;
        _openFriendsInviteModal(text);
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // FRIENDS INVITE MODAL (Direct 1-tap send in chat)
  // ─────────────────────────────────────────────────────────
  let _cachedFriendsList = [];

  async function _openFriendsInviteModal(messageText) {
    const modal = document.getElementById('cm-friends-modal');
    const searchInp = document.getElementById('cm-friends-search-input');
    const clearBtn = document.getElementById('cm-btn-clear-search');
    const closeBtn = document.getElementById('cm-btn-close-friends-modal');
    const container = document.getElementById('cm-friends-list-container');

    if (!modal) return;
    modal.classList.remove('hidden');

    if (searchInp) {
      searchInp.value = '';
      if (clearBtn) clearBtn.classList.add('hidden');
      setTimeout(() => searchInp.focus(), 100);
    }

    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

    if (container) {
      container.innerHTML = `
        <div style="padding: 30px 10px; text-align: center; color: #cbd5e1;">
          Loading BUDDY contacts... ⏳
        </div>
      `;
    }

    try {
      if (window.ChatManager && typeof window.ChatManager.getAllFriendsAndProfiles === 'function') {
        _cachedFriendsList = await window.ChatManager.getAllFriendsAndProfiles();
      } else if (window.ChatManager && typeof window.ChatManager.getFriendConversations === 'function') {
        _cachedFriendsList = window.ChatManager.getFriendConversations();
      } else {
        _cachedFriendsList = [];
      }
    } catch(err) {
      _cachedFriendsList = [];
    }

    _filterAndRenderFriends('', messageText);

    if (searchInp) {
      searchInp.oninput = () => {
        const q = searchInp.value.trim();
        if (clearBtn) clearBtn.classList.toggle('hidden', !q);
        _filterAndRenderFriends(q, messageText);
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (searchInp) { searchInp.value = ''; searchInp.focus(); }
        clearBtn.classList.add('hidden');
        _filterAndRenderFriends('', messageText);
      };
    }
  }

  function _filterAndRenderFriends(query, messageText) {
    const container = document.getElementById('cm-friends-list-container');
    if (!container) return;

    const q = (query || '').toLowerCase().trim();
    let matches = _cachedFriendsList;

    if (q) {
      matches = _cachedFriendsList.filter(f => {
        const name = (f.name || f.full_name || '').toLowerCase();
        const uname = (f.username || '').toLowerCase();
        return name.includes(q) || uname.includes(q);
      });
    }

    if (!matches || matches.length === 0) {
      container.innerHTML = `
        <div style="padding: 32px 14px; text-align: center; color: #94a3b8;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <p style="font-weight: 700; color: #fff;">${q ? `No contacts found for "${query}"` : 'No contacts in BUDDY yet!'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map(f => {
      const avatarContent = f.avatar 
        ? `<img src="${f.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
        : (f.isAI ? '✨' : (f.name ? f.name.charAt(0).toUpperCase() : '👤'));
      const bg = f.color || 'linear-gradient(135deg, #ff2d75, #e11d48)';
      const isOnline = f.isAI || f.status === 'Online' || f.status === 'Active now';

      return `
        <div class="cm-friend-row">
          <div class="cm-friend-avatar-wrap" style="background: ${bg};">
            ${avatarContent}
            ${isOnline ? '<span class="cm-friend-online-dot"></span>' : ''}
          </div>
          <div class="cm-friend-meta">
            <div class="cm-friend-fullname">${f.name}</div>
            <div class="cm-friend-username">@${f.username || ''}</div>
          </div>
          <button 
            type="button" 
            class="cm-btn-send-invite" 
            data-friend-id="${f.id}"
            data-friend-name="${f.name}"
          >
            Send ✉️
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.cm-btn-send-invite').forEach(btn => {
      btn.addEventListener('click', async () => {
        const friendId = btn.dataset.friendId;
        const friendName = btn.dataset.friendName;
        const targetFriend = _cachedFriendsList.find(f => f.id === friendId);
        if (!targetFriend) return;

        btn.disabled = true;
        btn.innerHTML = 'Sending... ⏳';

        let sent = false;
        if (window.ChatManager && typeof window.ChatManager.sendDirectTextMessageToUser === 'function') {
          sent = await window.ChatManager.sendDirectTextMessageToUser(targetFriend, messageText);
        } else if (window.ChatManager && typeof window.ChatManager.sendQuizInviteToUser === 'function') {
          sent = await window.ChatManager.sendQuizInviteToUser(targetFriend, 'love_clash', 'Love Clash');
        }

        if (sent) {
          btn.classList.add('sent');
          btn.innerHTML = 'Sent ✓';
          if (typeof window.showToast === 'function') {
            window.showToast(`🎉 Sent to ${friendName}!`);
          }
        } else {
          btn.disabled = false;
          btn.innerHTML = 'Send ✉️';
        }
      });
    });
  }

  // ── Modal & Navigation ──
  function openGame() {
    state.isPlaying = false;
    state.winner = null;
    state.countdown = null;
    openGameModal();
    renderScreen();
  }

  function openGameModal() {
    const modal = document.getElementById('cm-game-modal-overlay');
    if (modal) modal.classList.remove('hidden');
  }

  function closeGameModal() {
    const modal = document.getElementById('cm-game-modal-overlay');
    if (modal) modal.classList.add('hidden');
    clearInterval(state.aiInterval);
    clearInterval(state.soloTimerInterval);
    clearTimeout(state.powerUpTimeout);
    state.isPlaying = false;
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const battleScore = params.get('battle');
    const challenger = params.get('name') || params.get('by');
    const game = params.get('game');

    if (battleScore) {
      state.targetScore = parseInt(battleScore, 10) || 50;
      state.challengerName = challenger || 'Partner';
      state.mode = 'solo';
      openGameModal();
      renderScreen();
    } else if (game === 'couple-match' || game === 'love-clash') {
      openGame();
    }
  }

  function init() {
    console.log('⚡ [BUDDY Games] Initializing "Love Clash" finger battle engine...');
    checkUrlParams();

    const closeBtn = document.getElementById('cm-game-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeGameModal());
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
  window.CoupleMatchGame = CoupleMatchGame;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CoupleMatchGame.init());
  } else {
    setTimeout(() => CoupleMatchGame.init(), 60);
  }
}
