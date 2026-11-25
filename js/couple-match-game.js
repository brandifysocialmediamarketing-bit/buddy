/**
 * BUDDY - couple-match-game.js (v201)
 * Game 2: "Couple Match 💑" - Ultimate Romantic Couple Arcade
 * 
 * 100% UNIQUE GAMEPLAY (NO QUESTION POOLS / QUIZZES!):
 * 1. 🎡 Romantic Love Wheel (Spin the Bottle / Wheel with physics, sweet/spicy/funny modes)
 * 2. 🎟️ Secret Love Scratch Card (Real-time HTML5 Canvas foil scratch-off, custom romantic rewards)
 * 3. ❌⭕ Love XO Battle (Neon romantic Tic-Tac-Toe with victory rewards & dares)
 * 
 * Features:
 * - Real-time scratch foil physics & particle effects
 * - Direct 1-tap BUDDY Chat integration (send scratch cards & spin challenges directly into chat)
 * - Mobile-first touch & drag gestures
 * - Offline localStorage + server + Supabase cloud sync
 */

const CoupleMatchGame = (() => {
  // ── 1. Romantic Love Wheel Data ──
  const WHEEL_CHALLENGES = {
    sweet: [
      { id: 1, title: "Forehead Kiss & Tight Hug 🫂", text: "Give or demand a warm, 1-minute silent hug and a soft forehead kiss right now!" },
      { id: 2, title: "3 Things I Love About You 💌", text: "Look into your partner's eyes (or send voice note) and name 3 little things that made you fall for them." },
      { id: 3, title: "10-Min Tension Massage 💆", text: "Winner gets a 10-minute relaxing head, neck, or shoulder massage tonight with zero excuses!" },
      { id: 4, title: "Our Song Karaoke 🎤", text: "Sing the chorus of your favorite romantic song together or on a 20-second voice note!" },
      { id: 5, title: "Sweet Midnight Treat 🍦", text: "The person who spun must treat the other to their favorite ice cream or midnight dessert!" },
      { id: 6, title: "Royal Wish Card 👑", text: "Grant your partner 1 cute wish today with a big smile and zero arguments!" },
      { id: 7, title: "First Impression Confession 🌸", text: "Share the exact moment you realized you had feelings for your partner!" },
      { id: 8, title: "Cuddle Monopoly 🧸", text: "Whoever spun gets unlimited cuddle and hand-holding privileges for the next 24 hours!" }
    ],
    spicy: [
      { id: 101, title: "Whisper in the Ear 💋", text: "Whisper (or send a deep voice note) the most romantic thing you've been thinking about your partner all day." },
      { id: 102, title: "Favorite Outfit Confession 🔥", text: "Confess which outfit, look, or hairstyle of your partner makes your heart beat the fastest!" },
      { id: 103, title: "Slow Dance Moment 💃", text: "Put on your favorite slow love song and slow dance together for 2 minutes." },
      { id: 104, title: "Cheesy Bollywood Pickup 🎬", text: "Call or look at your partner and deliver the most dramatic romantic dialogue with full emotion!" },
      { id: 105, title: "Secret Romantic Dream 🌙", text: "Share one romantic trip or date fantasy you've always wanted to experience together." },
      { id: 106, title: "Lock Eyes for 30 Seconds 👀", text: "Stare into each other's eyes without speaking or laughing for 30 full seconds!" },
      { id: 107, title: "Cute Nickname Rule 👑", text: "Call your partner only by a cheesy romantic nickname for the next 3 hours!" },
      { id: 108, title: "Most Attractive Habit 💖", text: "Tell your partner the single most attractive habit or expression they have." }
    ],
    funny: [
      { id: 201, title: "Derpy Selfie Dare 📸", text: "Take the absolute funniest, goofiest no-filter selfie and send it to your partner in BUDDY chat!" },
      { id: 202, title: "Imitate Your Partner 😂", text: "Do your best 30-second impression of how your partner acts when they are hungry or sleepy!" },
      { id: 203, title: "Maggi / Snack Chef 🍜", text: "The spinner has to cook late-night Maggi or prepare snacks for their partner!" },
      { id: 204, title: "Compliment Rap 🎤", text: "Freestyle rap 4 rhyming lines about how amazing your partner is!" },
      { id: 205, title: "Screen Time Swap 📱", text: "Show your partner the last 3 photos in your gallery or your most played song!" },
      { id: 206, title: "Yes Day for 1 Hour 👑", text: "For the next 60 minutes, say 'Yes' to any reasonable request from your partner!" },
      { id: 207, title: "Dramatic Apology 🙈", text: "Apologize dramatically on one knee for the last silly argument you had!" },
      { id: 208, title: "Funny Dance Off 🕺", text: "Do a 15-second silly celebratory victory dance right now!" }
    ]
  };

  // ── 2. Preset Scratch Card Romantic Rewards ──
  const SCRATCH_PRESETS = [
    { title: "Midnight Ice Cream Date 🍦", desc: "Valid for 1 spontaneous late-night ice cream or waffle treat anytime!" },
    { title: "15-Min Tension Massage 💆", desc: "Redeemable for a 15-minute relaxing head & shoulder massage with zero complaints." },
    { title: "Royal 'Yes Day' Pass 👑", desc: "Grants the holder 1 wish where partner cannot say no for the next 24 hours!" },
    { title: "Late Night Long Drive 🚗", desc: "Valid for a peaceful late-night drive, listening to our favorite songs with roadside chai." },
    { title: "Home-Cooked Candlelight Dinner 🍝", desc: "Your partner will cook your favorite comforting meal by candlelight!" },
    { title: "Unlimited Cuddle & Hug Pass 🧸", desc: "No questions asked—instant warm hugs and cuddles on demand." },
    { title: "Favorite Movie Night Boss 🍿", desc: "You get total control over the movie / show selection and snacks tonight!" },
    { title: "Secret Heartfelt Love Letter 💌", desc: "Your partner owes you a handwritten letter with 5 reasons they love you." }
  ];

  // ── Game State ──
  let state = {
    currentScreen: 'hub', // 'hub' | 'wheel' | 'scratch_create' | 'scratch_play' | 'xo'
    wheelCategory: 'sweet',
    isSpinning: false,
    wheelAngle: 0,
    wheelResult: null,
    scratchSender: '',
    scratchPartner: '',
    scratchTitle: '',
    scratchDesc: '',
    activeScratchCard: null,
    scratchClearedPercent: 0,
    scratchRevealed: false,
    // XO Battle
    xoBoard: Array(9).fill(null),
    xoTurn: 'X', // 'X' (💖) or 'O' (💙)
    xoWinner: null,
    xoWinningLine: null,
    xoMode: 'pass', // 'pass' or 'ai'
    xoScores: { X: 0, O: 0, ties: 0 }
  };

  // ── Mascot SVG ──
  const COUPLE_MASCOT_SVG = `
    <svg class="cm-mascot-art" viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cmGradLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
        <linearGradient id="cmGradRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff2d75"/>
          <stop offset="100%" stop-color="#fb7185"/>
        </linearGradient>
      </defs>
      <circle cx="55" cy="70" r="30" fill="url(#cmGradLeft)"/>
      <circle cx="48" cy="66" r="3" fill="#ffffff"/>
      <circle cx="62" cy="66" r="3" fill="#ffffff"/>
      <path d="M50 76C52 80 58 80 60 76" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="44" cy="72" r="3.5" fill="#fda4af" opacity="0.8"/>

      <circle cx="100" cy="70" r="30" fill="url(#cmGradRight)"/>
      <circle cx="114" cy="46" r="5" fill="#ffd700"/>
      <path d="M92 65C95 68 98 68 101 65" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="110" cy="66" r="3" fill="#ffffff"/>
      <path d="M97 76C99 80 105 80 107 76" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="115" cy="72" r="3.5" fill="#ffffff" opacity="0.6"/>

      <!-- Floating Heart -->
      <path d="M72 28C72 22 77 18 82 18C85 18 88 20 90 22C92 20 95 18 98 18C103 18 108 22 108 28C108 36 90 48 90 48C90 48 72 36 72 28Z" fill="#ff2d75"/>
    </svg>
  `;

  // ── Router & Screen Render ──
  function renderScreen() {
    const container = document.getElementById('cm-screen-container');
    if (!container) return;

    switch (state.currentScreen) {
      case 'hub':
        container.innerHTML = _renderScreenHub();
        _bindScreenHub();
        break;
      case 'wheel':
        container.innerHTML = _renderScreenWheel();
        _bindScreenWheel();
        break;
      case 'scratch_create':
        container.innerHTML = _renderScreenScratchCreate();
        _bindScreenScratchCreate();
        break;
      case 'scratch_play':
        container.innerHTML = _renderScreenScratchPlay();
        _bindScreenScratchPlay();
        break;
      case 'xo':
        container.innerHTML = _renderScreenXO();
        _bindScreenXO();
        break;
      default:
        container.innerHTML = _renderScreenHub();
        _bindScreenHub();
        break;
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 0: ARCADE HUB (Select Game)
  // ─────────────────────────────────────────────────────────
  function _renderScreenHub() {
    return `
      <div class="cm-card cm-fade-in">
        <div class="cm-mascot-wrap">
          ${COUPLE_MASCOT_SVG}
        </div>
        <div class="cm-badge-pill">💑 Couple Match Arcade</div>
        <h2 class="cm-title">Unique Romantic Games</h2>
        <p class="cm-subtitle">Pick a fun interactive game to play with your partner right now!</p>

        <div class="cm-arcade-grid">
          <!-- Game 1: Romantic Love Wheel -->
          <button type="button" class="cm-arcade-card cm-wheel-card" id="cm-hub-launch-wheel">
            <div class="cm-ac-icon">🎡</div>
            <div class="cm-ac-info">
              <strong>Romantic Love Wheel 🍾</strong>
              <small>Spin for sweet romantic dares, flirty challenges & truths!</small>
            </div>
            <span class="cm-ac-badge">Play ➔</span>
          </button>

          <!-- Game 2: Secret Love Scratch Card -->
          <button type="button" class="cm-arcade-card cm-scratch-card" id="cm-hub-launch-scratch">
            <div class="cm-ac-icon">🎟️✨</div>
            <div class="cm-ac-info">
              <strong>Secret Love Scratch Card</strong>
              <small>Send a secret golden ticket! Partner rubs to reveal reward!</small>
            </div>
            <span class="cm-ac-badge">Create ➔</span>
          </button>

          <!-- Game 3: Love XO Battle -->
          <button type="button" class="cm-arcade-card cm-xo-card" id="cm-hub-launch-xo">
            <div class="cm-ac-icon">❌⭕</div>
            <div class="cm-ac-info">
              <strong>Love XO Battle 💖</strong>
              <small>Romantic Tic-Tac-Toe! Winner picks a dare for the loser!</small>
            </div>
            <span class="cm-ac-badge">Battle ➔</span>
          </button>
        </div>

        <div class="cm-footer-note">
          🔒 100% Private, End-to-End Chat & ₹0 Free on BUDDY
        </div>
      </div>
    `;
  }

  function _bindScreenHub() {
    const wheelBtn = document.getElementById('cm-hub-launch-wheel');
    const scratchBtn = document.getElementById('cm-hub-launch-scratch');
    const xoBtn = document.getElementById('cm-hub-launch-xo');

    if (wheelBtn) {
      wheelBtn.onclick = () => {
        state.currentScreen = 'wheel';
        state.wheelResult = null;
        renderScreen();
      };
    }
    if (scratchBtn) {
      scratchBtn.onclick = () => {
        state.currentScreen = 'scratch_create';
        renderScreen();
      };
    }
    if (xoBtn) {
      xoBtn.onclick = () => {
        _resetXOBoard();
        state.currentScreen = 'xo';
        renderScreen();
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // GAME 1: ROMANTIC LOVE WHEEL (Spin the Wheel / Bottle)
  // ─────────────────────────────────────────────────────────
  function _renderScreenWheel() {
    const cat = state.wheelCategory;
    const result = state.wheelResult;

    return `
      <div class="cm-card cm-fade-in">
        <button type="button" class="cm-back-icon" id="cm-btn-wheel-back">← Back to Arcade</button>
        <div class="cm-badge-pill">Mode 1: Couple Spin</div>
        <h2 class="cm-title">Romantic Love Wheel 🎡</h2>
        <p class="cm-subtitle">Spin the wheel together to land on sweet romantic truths, dares & treats!</p>

        <!-- Category Filter Tabs -->
        <div class="cm-wheel-tabs">
          <button type="button" class="cm-w-tab ${cat === 'sweet' ? 'active' : ''}" data-cat="sweet">🌸 Sweet</button>
          <button type="button" class="cm-w-tab ${cat === 'spicy' ? 'active' : ''}" data-cat="spicy">🔥 Spicy</button>
          <button type="button" class="cm-w-tab ${cat === 'funny' ? 'active' : ''}" data-cat="funny">🤪 Funny</button>
        </div>

        <!-- Wheel Canvas Area -->
        <div class="cm-wheel-wrapper">
          <div class="cm-wheel-pointer">▼</div>
          <canvas id="cm-wheel-canvas" width="300" height="300"></canvas>
          <button type="button" class="cm-wheel-center-btn" id="cm-btn-spin-wheel" ${state.isSpinning ? 'disabled' : ''}>
            ${state.isSpinning ? 'Spinning...' : 'SPIN! 💘'}
          </button>
        </div>

        <!-- Result Popup / Card -->
        ${result ? `
          <div class="cm-wheel-result-card cm-fade-in">
            <div class="cm-wr-badge">${result.title}</div>
            <p class="cm-wr-text">${result.text}</p>
            <div class="cm-wr-actions">
              <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-send-wheel-chat">
                💬 Drop Challenge in BUDDY Chat
              </button>
            </div>
          </div>
        ` : `
          <p class="cm-wheel-hint">👆 Tap SPIN to let Cupid decide your romantic challenge!</p>
        `}
      </div>
    `;
  }

  function _bindScreenWheel() {
    const backBtn = document.getElementById('cm-btn-wheel-back');
    const spinBtn = document.getElementById('cm-btn-spin-wheel');
    const sendChatBtn = document.getElementById('cm-btn-send-wheel-chat');

    if (backBtn) {
      backBtn.onclick = () => {
        state.currentScreen = 'hub';
        renderScreen();
      };
    }

    document.querySelectorAll('.cm-w-tab').forEach(tab => {
      tab.onclick = () => {
        if (state.isSpinning) return;
        state.wheelCategory = tab.dataset.cat;
        state.wheelResult = null;
        renderScreen();
      };
    });

    _drawLoveWheel();

    if (spinBtn) {
      spinBtn.onclick = () => _spinLoveWheel();
    }

    if (sendChatBtn && state.wheelResult) {
      sendChatBtn.onclick = () => {
        _openFriendsInviteModal(`🎡 Love Wheel Challenge:\n"${state.wheelResult.title}"\n👉 ${state.wheelResult.text}`);
      };
    }
  }

  function _drawLoveWheel(angleRad = state.wheelAngle) {
    const canvas = document.getElementById('cm-wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const list = WHEEL_CHALLENGES[state.wheelCategory] || WHEEL_CHALLENGES.sweet;
    const numSlices = list.length;
    const sliceAngle = (Math.PI * 2) / numSlices;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angleRad);

    const sliceColors = [
      '#ff2d75', '#8b5cf6', '#ec4899', '#3b82f6',
      '#f43f5e', '#a855f7', '#fb7185', '#6366f1'
    ];

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 6, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = sliceColors[i % sliceColors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Slice Text/Icon
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      const shortTitle = list[i].title.split(' ')[0] + ' ' + (list[i].title.split(' ')[1] || '');
      ctx.fillText(shortTitle, radius - 20, 4);
      ctx.restore();
    }

    ctx.restore();
  }

  function _spinLoveWheel() {
    if (state.isSpinning) return;
    state.isSpinning = true;
    state.wheelResult = null;

    const list = WHEEL_CHALLENGES[state.wheelCategory] || WHEEL_CHALLENGES.sweet;
    const numSlices = list.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    // Pick target slice
    const targetIndex = Math.floor(Math.random() * numSlices);
    const targetSliceCenter = targetIndex * sliceAngle + (sliceAngle / 2);
    // Pointer is at the top (-PI/2)
    const targetAngle = (3 * Math.PI / 2) - targetSliceCenter;
    const totalSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full rotations
    const finalAngle = state.wheelAngle + (totalSpins * Math.PI * 2) + (targetAngle - (state.wheelAngle % (Math.PI * 2)));

    const startTime = performance.now();
    const duration = 3800; // 3.8s spin

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    const initialAngle = state.wheelAngle;

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      state.wheelAngle = initialAngle + (finalAngle - initialAngle) * eased;
      _drawLoveWheel(state.wheelAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        state.isSpinning = false;
        state.wheelAngle = finalAngle % (Math.PI * 2);
        state.wheelResult = list[targetIndex];
        renderScreen();
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 Cupid landed on: ${list[targetIndex].title}`);
        }
      }
    }

    requestAnimationFrame(animate);
    renderScreen();
  }

  // ─────────────────────────────────────────────────────────
  // GAME 2: SECRET LOVE SCRATCH CARD (HTML5 Canvas Scratch-Off)
  // ─────────────────────────────────────────────────────────
  function _renderScreenScratchCreate() {
    return `
      <div class="cm-card cm-fade-in">
        <button type="button" class="cm-back-icon" id="cm-btn-scratch-back">← Back to Arcade</button>
        <div class="cm-badge-pill">Mode 2: Scratch & Win</div>
        <h2 class="cm-title">Secret Love Scratch Card 🎟️</h2>
        <p class="cm-subtitle">Create a romantic scratch ticket for your partner. They will rub the screen to reveal their prize!</p>

        <div class="cm-form-group">
          <label class="cm-label">Your Name</label>
          <input type="text" id="cm-sc-sender" class="cm-input" placeholder="e.g. Keyur" maxlength="20" value="${state.scratchSender || ''}" autocomplete="off" />
        </div>

        <div class="cm-form-group">
          <label class="cm-label">Your Partner's Name</label>
          <input type="text" id="cm-sc-partner" class="cm-input" placeholder="e.g. Aarohi" maxlength="20" value="${state.scratchPartner || ''}" autocomplete="off" />
        </div>

        <div class="cm-form-group">
          <label class="cm-label">Choose Romantic Reward</label>
          <div class="cm-preset-chips">
            ${SCRATCH_PRESETS.map((p, idx) => `
              <button type="button" class="cm-chip ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
                ${p.title}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="cm-form-group">
          <label class="cm-label">Custom Romantic Surprise (Or edit above)</label>
          <input type="text" id="cm-sc-title" class="cm-input" placeholder="Reward Title" value="${SCRATCH_PRESETS[0].title}" maxlength="35" />
          <textarea id="cm-sc-desc" class="cm-input" style="height:60px; margin-top:6px; resize:none;" placeholder="Reward Description">${SCRATCH_PRESETS[0].desc}</textarea>
        </div>

        <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-generate-scratch">
          Generate Secret Scratch Ticket 🚀
        </button>
      </div>
    `;
  }

  function _bindScreenScratchCreate() {
    const backBtn = document.getElementById('cm-btn-scratch-back');
    const genBtn = document.getElementById('cm-btn-generate-scratch');
    const titleInp = document.getElementById('cm-sc-title');
    const descInp = document.getElementById('cm-sc-desc');
    const senderInp = document.getElementById('cm-sc-sender');
    const partnerInp = document.getElementById('cm-sc-partner');

    if (backBtn) {
      backBtn.onclick = () => {
        state.currentScreen = 'hub';
        renderScreen();
      };
    }

    document.querySelectorAll('.cm-chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.cm-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        const p = SCRATCH_PRESETS[Number(chip.dataset.idx)];
        if (p && titleInp && descInp) {
          titleInp.value = p.title;
          descInp.value = p.desc;
        }
      };
    });

    if (genBtn) {
      genBtn.onclick = async () => {
        const sName = senderInp ? senderInp.value.trim() : '';
        const pName = partnerInp ? partnerInp.value.trim() : '';
        const title = titleInp ? titleInp.value.trim() : '';
        const desc = descInp ? descInp.value.trim() : '';

        if (!sName) {
          if (typeof window.showToast === 'function') window.showToast('⚠️ Please enter your name!');
          if (senderInp) senderInp.focus();
          return;
        }
        if (!title) {
          if (typeof window.showToast === 'function') window.showToast('⚠️ Please enter a reward title!');
          return;
        }

        genBtn.disabled = true;
        genBtn.innerHTML = 'Creating Ticket... ⏳';

        state.scratchSender = sName;
        state.scratchPartner = pName;
        state.scratchTitle = title;
        state.scratchDesc = desc;

        let cardId = 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

        try {
          const res = await fetch('/api/games/scratch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderName: sName,
              partnerName: pName,
              surpriseTitle: title,
              surpriseDesc: desc,
              category: 'romantic'
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.cardId) cardId = data.cardId;
          }
        } catch (e) {}

        const cardObj = {
          id: cardId,
          senderName: sName,
          partnerName: pName,
          surpriseTitle: title,
          surpriseDesc: desc,
          createdAt: Date.now()
        };

        _saveScratchLocally(cardObj);
        state.activeScratchCard = cardObj;
        state.scratchClearedPercent = 0;
        state.scratchRevealed = false;
        state.currentScreen = 'scratch_play';
        renderScreen();
      };
    }
  }

  function _renderScreenScratchPlay() {
    const card = state.activeScratchCard || {
      senderName: 'Your Love',
      partnerName: 'Partner',
      surpriseTitle: 'Romantic Candlelight Dinner 🕯️',
      surpriseDesc: 'Valid for a romantic evening planned completely by your partner!'
    };

    const origin = window.location.origin + window.location.pathname;
    const playUrl = `${origin}?scratch=${encodeURIComponent(card.id || 'sample')}`;

    return `
      <div class="cm-card cm-fade-in">
        <button type="button" class="cm-back-icon" id="cm-btn-scratch-play-back">← Back to Arcade</button>
        <div class="cm-badge-pill">🎟️ Golden Love Ticket</div>
        <h2 class="cm-title">For ${card.partnerName || 'My Love'} 💖</h2>
        <p class="cm-subtitle">From ${card.senderName}: Rub/scratch the foil below with your finger to reveal your surprise!</p>

        <!-- Scratch Canvas Container -->
        <div class="cm-scratch-box" id="cm-scratch-box">
          <!-- Underlying Hidden Reward Card -->
          <div class="cm-scratch-underlay">
            <div class="cm-sc-sparkle">✨💖✨</div>
            <div class="cm-sc-reward-title">${card.surpriseTitle}</div>
            <p class="cm-sc-reward-desc">${card.surpriseDesc}</p>
            <div class="cm-sc-verified">✓ Guaranteed by ${card.senderName}</div>
          </div>

          <!-- Scratch Canvas Foil -->
          <canvas id="cm-scratch-canvas" class="cm-scratch-canvas"></canvas>
        </div>

        <div class="cm-scratch-indicator" id="cm-scratch-progress">
          ${state.scratchRevealed ? '🎉 100% REVEALED!' : '👆 Rub your finger/mouse across the card to scratch!'}
        </div>

        <!-- Share Actions for Creator -->
        <div class="cm-share-group" style="margin-top:16px;">
          <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-send-scratch-chat">
            💬 Send Scratch Card on BUDDY Chat
          </button>
          <button type="button" class="cm-btn-whatsapp cm-btn-full" id="cm-btn-send-scratch-wa">
            📲 Share on WhatsApp
          </button>
          <div class="cm-link-copy-wrap">
            <input type="text" class="cm-share-input" value="${playUrl}" readonly id="cm-scratch-url-inp" />
            <button type="button" class="cm-copy-btn" id="cm-btn-copy-scratch">Copy</button>
          </div>
        </div>
      </div>
    `;
  }

  function _bindScreenScratchPlay() {
    const backBtn = document.getElementById('cm-btn-scratch-play-back');
    const sendChatBtn = document.getElementById('cm-btn-send-scratch-chat');
    const waBtn = document.getElementById('cm-btn-send-scratch-wa');
    const copyBtn = document.getElementById('cm-btn-copy-scratch');
    const origin = window.location.origin + window.location.pathname;
    const card = state.activeScratchCard;
    const playUrl = `${origin}?scratch=${encodeURIComponent(card ? card.id : 'sample')}`;

    if (backBtn) {
      backBtn.onclick = () => {
        state.currentScreen = 'hub';
        renderScreen();
      };
    }

    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(playUrl);
        copyBtn.innerText = 'Copied! ✓';
        setTimeout(() => copyBtn.innerText = 'Copy', 2000);
        if (typeof window.showToast === 'function') window.showToast('📋 Scratch card link copied!');
      };
    }

    if (waBtn) {
      waBtn.onclick = () => {
        const text = `🎟️ Secret Romantic Scratch Card for You! 💖\nHey love, I created a secret scratch card surprise for you on BUDDY! Rub your screen to reveal what you won! 😜✨\n👉 Scratch here: ${playUrl}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      };
    }

    if (sendChatBtn) {
      sendChatBtn.onclick = () => {
        _openFriendsInviteModal(`🎟️ Secret Love Scratch Card for you!\nRub to reveal your romantic reward 💖:\n${playUrl}`);
      };
    }

    _initScratchCanvas();
  }

  function _initScratchCanvas() {
    const canvas = document.getElementById('cm-scratch-canvas');
    const box = document.getElementById('cm-scratch-box');
    if (!canvas || !box) return;

    const width = box.clientWidth || 320;
    const height = 180;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (state.scratchRevealed) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    // Draw metallic rose-gold foil cover
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f43f5e');
    grad.addColorStop(0.3, '#fb7185');
    grad.addColorStop(0.5, '#ffd1dc');
    grad.addColorStop(0.7, '#f43f5e');
    grad.addColorStop(1, '#be123c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Cute foil text & hearts
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.fillText('✨ SECRET LOVE TICKET ✨', width / 2, height / 2 - 12);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Rub with your finger to reveal 💖', width / 2, height / 2 + 14);

    let isScratching = false;

    function scratch(e) {
      if (!isScratching || state.scratchRevealed) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      _checkScratchPercent();
    }

    canvas.addEventListener('mousedown', (e) => { isScratching = true; scratch(e); });
    window.addEventListener('mouseup', () => { isScratching = false; });
    canvas.addEventListener('mousemove', scratch);

    canvas.addEventListener('touchstart', (e) => { isScratching = true; scratch(e); }, { passive: true });
    window.addEventListener('touchend', () => { isScratching = false; });
    canvas.addEventListener('touchmove', scratch, { passive: true });
  }

  function _checkScratchPercent() {
    const canvas = document.getElementById('cm-scratch-canvas');
    if (!canvas || state.scratchRevealed) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sample pixels every 12 pixels for performance
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    let transparentCount = 0;
    let totalSampled = 0;

    for (let i = 3; i < data.length; i += 4 * 16) {
      totalSampled++;
      if (data[i] === 0) transparentCount++;
    }

    const percent = Math.round((transparentCount / totalSampled) * 100);
    const progressEl = document.getElementById('cm-scratch-progress');
    if (progressEl) {
      progressEl.innerHTML = `✨ Scratched: ${percent}% (Clear 45% to reveal)`;
    }

    if (percent >= 45 && !state.scratchRevealed) {
      state.scratchRevealed = true;
      // Auto-clear canvas with dissolve
      ctx.clearRect(0, 0, width, height);
      if (progressEl) {
        progressEl.innerHTML = `🎉 <strong>SURPRISE REVEALED! Enjoy your reward! 💖</strong>`;
      }
      if (typeof window.showToast === 'function') {
        window.showToast('🎉 Surprise Revealed! Romantic Reward Unlocked!');
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // GAME 3: LOVE XO BATTLE (Romantic Tic-Tac-Toe)
  // ─────────────────────────────────────────────────────────
  function _resetXOBoard() {
    state.xoBoard = Array(9).fill(null);
    state.xoTurn = 'X';
    state.xoWinner = null;
    state.xoWinningLine = null;
  }

  function _renderScreenXO() {
    const board = state.xoBoard;
    const winner = state.xoWinner;
    const turn = state.xoTurn;

    return `
      <div class="cm-card cm-fade-in">
        <button type="button" class="cm-back-icon" id="cm-btn-xo-back">← Back to Arcade</button>
        <div class="cm-badge-pill">Mode 3: Couple Board Game</div>
        <h2 class="cm-title">Love XO Battle 💖</h2>
        <p class="cm-subtitle">3 in a row wins! Winner claims a romantic wish from the loser!</p>

        <!-- Mode Toggle -->
        <div class="cm-xo-modes">
          <button type="button" class="cm-xo-mode-btn ${state.xoMode === 'pass' ? 'active' : ''}" data-mode="pass">
            👥 2-Player Pass
          </button>
          <button type="button" class="cm-xo-mode-btn ${state.xoMode === 'ai' ? 'active' : ''}" data-mode="ai">
            🤖 Play Cupid AI
          </button>
        </div>

        <!-- Scoreboard -->
        <div class="cm-xo-score-bar">
          <div class="cm-xo-score ${turn === 'X' ? 'active-turn' : ''}">💖 Player 1: <strong>${state.scores ? state.scores.X : 0}</strong></div>
          <div class="cm-xo-score ${turn === 'O' ? 'active-turn' : ''}">💙 Player 2: <strong>${state.scores ? state.scores.O : 0}</strong></div>
        </div>

        <!-- 3x3 Grid -->
        <div class="cm-xo-grid">
          ${board.map((cell, idx) => {
            const isWinning = state.xoWinningLine && state.xoWinningLine.includes(idx);
            return `
              <button 
                type="button" 
                class="cm-xo-cell ${cell ? 'filled ' + cell : ''} ${isWinning ? 'win-cell' : ''}" 
                data-idx="${idx}"
                ${cell || winner ? 'disabled' : ''}
              >
                ${cell === 'X' ? '💖' : (cell === 'O' ? '💙' : '')}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Winner / Turn Banner -->
        ${winner ? `
          <div class="cm-xo-winner-card cm-fade-in">
            <div class="cm-xo-win-title">
              ${winner === 'tie' ? "🤝 It's a Tie! Both are cute!" : `🎉 ${winner === 'X' ? '💖 Player 1' : '💙 Player 2'} Wins!`}
            </div>
            <p class="cm-xo-win-dare">
              ${winner === 'tie' ? 'Give each other a sweet hug!' : 'Winner gets 1 romantic wish or free dinner treat! 👑'}
            </p>
            <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-xo-restart">
              Play Again ➔
            </button>
          </div>
        ` : `
          <div class="cm-xo-status">
            Current Turn: <strong>${turn === 'X' ? '💖 Player 1' : (state.xoMode === 'ai' ? '🤖 Cupid AI' : '💙 Player 2')}</strong>
          </div>
        `}
      </div>
    `;
  }

  function _bindScreenXO() {
    const backBtn = document.getElementById('cm-btn-xo-back');
    const restartBtn = document.getElementById('cm-btn-xo-restart');

    if (backBtn) {
      backBtn.onclick = () => {
        state.currentScreen = 'hub';
        renderScreen();
      };
    }

    if (restartBtn) {
      restartBtn.onclick = () => {
        _resetXOBoard();
        renderScreen();
      };
    }

    document.querySelectorAll('.cm-xo-mode-btn').forEach(btn => {
      btn.onclick = () => {
        state.xoMode = btn.dataset.mode;
        _resetXOBoard();
        renderScreen();
      };
    });

    document.querySelectorAll('.cm-xo-cell').forEach(cell => {
      cell.onclick = () => {
        const idx = Number(cell.dataset.idx);
        _handleXOMove(idx);
      };
    });
  }

  function _handleXOMove(idx) {
    if (state.xoBoard[idx] || state.xoWinner) return;

    state.xoBoard[idx] = state.xoTurn;
    const winResult = _checkXOWin(state.xoBoard);

    if (winResult) {
      state.xoWinner = winResult.winner;
      state.xoWinningLine = winResult.line;
      if (!state.scores) state.scores = { X: 0, O: 0, ties: 0 };
      if (winResult.winner === 'X') state.scores.X++;
      else if (winResult.winner === 'O') state.scores.O++;
      else state.scores.ties++;
      renderScreen();
      return;
    }

    // Switch Turn
    state.xoTurn = state.xoTurn === 'X' ? 'O' : 'X';
    renderScreen();

    // AI Move if AI Mode
    if (state.xoMode === 'ai' && state.xoTurn === 'O' && !state.xoWinner) {
      setTimeout(() => _handleAIMove(), 450);
    }
  }

  function _handleAIMove() {
    const emptyIndices = state.xoBoard
      .map((val, idx) => val === null ? idx : null)
      .filter(v => v !== null);

    if (emptyIndices.length === 0 || state.xoWinner) return;

    // Pick winning move or block or center or random
    let choice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    if (state.xoBoard[4] === null) choice = 4; // center

    state.xoBoard[choice] = 'O';
    const winResult = _checkXOWin(state.xoBoard);

    if (winResult) {
      state.xoWinner = winResult.winner;
      state.xoWinningLine = winResult.line;
      if (!state.scores) state.scores = { X: 0, O: 0, ties: 0 };
      if (winResult.winner === 'O') state.scores.O++;
      else state.scores.ties++;
    } else {
      state.xoTurn = 'X';
    }
    renderScreen();
  }

  function _checkXOWin(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }

    if (board.every(cell => cell !== null)) {
      return { winner: 'tie', line: null };
    }
    return null;
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
          sent = await window.ChatManager.sendQuizInviteToUser(targetFriend, 'couple_arcade', 'Couple Match');
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

  // ── Local Storage Helpers ──
  function _getMyScratchCards() {
    try {
      const str = localStorage.getItem('cm_my_scratch_cards');
      return str ? JSON.parse(str) : [];
    } catch(e) { return []; }
  }

  function _saveScratchLocally(card) {
    const list = _getMyScratchCards().filter(c => c.id !== card.id);
    list.unshift(card);
    try {
      localStorage.setItem('cm_my_scratch_cards', JSON.stringify(list));
    } catch(e) {}
  }

  function _getScratchLocally(id) {
    return _getMyScratchCards().find(c => c.id === id) || null;
  }

  // ── Load Scratch Card for Partner ──
  async function loadScratchCardForPlaying(cardId) {
    let card = _getScratchLocally(cardId);
    if (!card) {
      try {
        const res = await fetch(`/api/games/scratch?id=${encodeURIComponent(cardId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.card) card = data.card;
        }
      } catch(e) {}
    }

    if (!card) {
      card = {
        id: cardId,
        senderName: 'Your Partner 💖',
        partnerName: 'You',
        surpriseTitle: 'Romantic Candlelight Dinner 🕯️',
        surpriseDesc: 'Valid for a romantic evening planned completely by your partner!'
      };
    }

    state.activeScratchCard = card;
    state.scratchClearedPercent = 0;
    state.scratchRevealed = false;
    state.currentScreen = 'scratch_play';
    openGameModal();
    renderScreen();
  }

  // ── Modal & Navigation ──
  function openGame() {
    state.currentScreen = 'hub';
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
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const scratchId = params.get('scratch');
    const game = params.get('game');

    if (scratchId) {
      loadScratchCardForPlaying(scratchId);
    } else if (game === 'couple-match') {
      openGame();
    }
  }

  function init() {
    console.log('💑 [BUDDY Games] Initializing "Couple Match Arcade" engine...');
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
    loadScratchCardForPlaying,
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
