/**
 * BUDDY - couple-match-game.js
 * Game 2: "Couple Match 💑" - Ultimate Romantic Compatibility Quiz & Love Dice
 * 
 * Features:
 * - Stunning romantic rose-gold & neon-magenta aesthetic with floating hearts & sparkles
 * - Cute vector couple mascots ("Romeo & Juliet" / "Bubbly Doves")
 * - 2 Addictive Couple Modes:
 *   Mode 1: 💘 Couple Compatibility Quiz (30+ romantic questions, swap, side-by-side answers, Love Meter, Couple Dares)
 *   Mode 2: 🎲 Love Dice & Romantic Truth/Dare (Interactive dice roll, spicy/sweet/playful categories, send to chat)
 * - Real-time Buddy Chat integration (send directly to partner in 1 tap)
 * - Seamless mobile-friendly touch design, offline local storage, cloud sync
 */

const CoupleMatchGame = (() => {
  // ── 30+ Curated Romantic Couple Questions ──
  const QUESTION_BANK = [
    {
      id: 101,
      category: "Romantic Story & Firsts",
      title: "Who fell in love first in our story? 💍",
      options: ["Definitely Me! (Struck by cupid ❤️)", "My Partner! (Could not take eyes off me 😜)", "At the exact same moment ✨", "Took time, but deep love grew 🌸"]
    },
    {
      id: 102,
      category: "Firsts & Dates",
      title: "What is my absolute dream romantic date? 🕯️",
      options: ["Cozy Candle-light Dinner & Wine 🍷", "Late Night Long Drive & Roadside Chai 🚗", "Beach Sunset Stroll holding hands 🏖️", "Blanket Fort, Pizza & Netflix at home 🍕"]
    },
    {
      id: 103,
      category: "Moods & Love",
      title: "What melts my anger instantly after a fight? 🥺",
      options: ["A tight, warm, silent hug 🫂", "My favorite food / sweet chocolates 🍫", "A sincere cute apology holding ears 🙈", "A silly joke that makes me burst into laughter 😂"]
    },
    {
      id: 104,
      category: "Vacation & Dreams",
      title: "Our dream romantic holiday escape together? ✈️",
      options: ["Sunny Goa or Maldives Beach Villa 🏝️", "Snowy Himachal / Swiss Mountain Resort ❄️", "Peaceful Kerala Backwaters Houseboat 🛶", "Paris or Rome Romantic Heritage Stroll 🗼"]
    },
    {
      id: 105,
      category: "Chatting Habits",
      title: "What's my biggest cute habit when texting you? 📱",
      options: ["Sending 10 rapid messages in 1 second 💬", "Spamming cute reels & relatable couple memes 📲", "Long emotional voice notes 🎙️", "Always demanding good morning & night calls 📞"]
    },
    {
      id: 106,
      category: "Cuddle & Romance",
      title: "What is my vibe when we are cozying up? 🧸",
      options: ["Must hold hands or cuddle non-stop 🧸", "Talking for hours about our future & dreams 🌙", "Watching a movie while sharing snacks 🍿", "Stealing the entire blanket 🙈"]
    },
    {
      id: 107,
      category: "Fun & Teasing",
      title: "Who is more likely to overspend on shopping? 🛍️",
      options: ["100% Me! (Retail therapy lover 🛍️)", "My Partner! (Buys things impulsively 💳)", "Both of us together (Shopping disasters 💸)", "Neither (We are super budget-conscious 💰)"]
    },
    {
      id: 108,
      category: "Deep Connection",
      title: "What would hurt me the most in our relationship? 💔",
      options: ["Hiding things or broken trust 🚫", "Being ignored or left on read 📱", "Cold distant behavior when I need you 🥺", "Forgetting special dates & promises 🗓️"]
    },
    {
      id: 109,
      category: "Jealousy & Protection",
      title: "Who gets more possessive or jealous? 🙈",
      options: ["Secretly Me! (Cute jealousy only 😜)", "My Partner! (Protective lover vibe 🛡️)", "Equal! (We both protect our love ❤️)", "Zero (We have 100% blind mutual trust 🕊️)"]
    },
    {
      id: 110,
      category: "Midnight Vibe",
      title: "Our ideal late night date plan? 🌙",
      options: ["Long drive with romantic songs playing 🚗", "Sitting on rooftop watching the stars ✨", "Cooking Maggi / late snacks together at 2 AM 🍜", "Deep 3 AM pillow talk about life 💭"]
    },
    {
      id: 111,
      category: "Sweet Weakness",
      title: "What's my secret cute weakness? 🌸",
      options: ["Forehead kisses 💋", "When you gently play with my hair 💆", "When you call me by my cute private nickname 🌸", "Surprise visits or fresh flowers 💐"]
    },
    {
      id: 112,
      category: "Daily Life",
      title: "Who takes longer to get ready before going out? 👗",
      options: ["Definitely Me! (Every detail must be perfect 👗)", "My Partner! ('5 minutes' means 1 hour ⏳)", "We take equal time ⌛", "Both of us get ready in 10 minutes ⚡"]
    },
    {
      id: 113,
      category: "Fights & Apologies",
      title: "Who says 'Sorry' first after an argument? 🗣️",
      options: ["Me, because your smile matters more 💖", "My partner, after realizing their mistake 😇", "Whoever's fault it was ⚖️", "Neither, we just start laughing & talking normally 🤝"]
    },
    {
      id: 114,
      category: "Gifts & Surprises",
      title: "What's the best surprise gift I could receive from you? 🎁",
      options: ["A handwritten heartfelt love letter 💌", "A planned surprise weekend getaway ✈️", "That special thing I've been eyeing for months 🛍️", "A surprise date with my favorite cake 🎂"]
    },
    {
      id: 115,
      category: "Couple Dynamic",
      title: "How would you describe our couple vibe in one phrase? ✨",
      options: ["Tom & Jerry (Fight a lot, can't live without each other) 🐱🐭", "Romeo & Juliet (Pure fairytale romance) 👑", "Partners in Crime & Besties (Laugh 24/7) 👯", "Power Couple (Growing & winning together) 🚀"]
    },
    {
      id: 116,
      category: "Morning Vibe",
      title: "My go-to morning mood with you? ☕",
      options: ["'Don't let me leave the bed' cuddle 😴", "Ready to conquer the world with coffee/chai ☕", "Need 30 minutes of quiet sleepy time first 🤫", "Checking phone for sweet good morning texts 📱"]
    },
    {
      id: 117,
      category: "Movie Night",
      title: "Movie pick when we are cuddling together? 🍿",
      options: ["Emotional Romantic Drama with happy tears 🥺", "Spooky Horror where we cling together 👻", "Stomach-hurting Comedy 😂", "Action Thriller keeping us on edge 💥"]
    },
    {
      id: 118,
      category: "Food Love",
      title: "What meal would I want you to make for me? 🍲",
      options: ["Comforting Dal Rice / Khichdi with love 🍚", "Cheesy Italian Pasta or Lasagna 🍝", "Crispy hot Pakodas / Maggi during rain 🌧️", "Pancake / Waffle breakfast in bed 🥞"]
    },
    {
      id: 119,
      category: "The Spark",
      title: "When did I realize you were 'The One'? 💍",
      options: ["When you stayed with me through my lowest day 🫂", "The very first time our eyes locked & talked ✨", "Seeing how pure and caring your heart is 💖", "When making each other laugh felt so effortless 😊"]
    },
    {
      id: 120,
      category: "Love Language",
      title: "What is my primary Love Language? 💌",
      options: ["Physical Touch & Warm Hugs 🫂", "Words of Affirmation & Sweet Compliments 💬", "Quality Time without phones ⏳", "Acts of Service & Caring Gestures 🤲"]
    },
    {
      id: 121,
      category: "Goofy Fun",
      title: "Who makes silly/goofy jokes when we are alone? 🤪",
      options: ["Me! I'm the designated entertainer 🤡", "My partner is secretly crazy funny 😂", "Both of us share one brain cell together 🤪", "We are mature... until we meet 😜"]
    },
    {
      id: 122,
      category: "Comfort",
      title: "How do I act when I'm stressed or overwhelmed? 🛋️",
      options: ["Need a warm hug and comforting words 🥺", "Need quiet alone time for 1 hour 🛋️", "Vent out everything while you listen 🗣️", "Distract me with yummy food & a movie 🍕"]
    },
    {
      id: 123,
      category: "Lazy Day",
      title: "Our ideal lazy Sunday together? 🛋️",
      options: ["Stay in pajamas, binge Netflix all day 📺", "Go cafe hopping & take aesthetic photos 📸", "Sleep till 1 PM and do absolutely nothing 😴", "Cook something special together at home 🍳"]
    },
    {
      id: 124,
      category: "Decisions",
      title: "Who is more stubborn during decisions? 😤",
      options: ["Me! Once my mind is made, that's it 😤", "My partner! Very hard to convince 😅", "Depends entirely on the topic 🤔", "Neither, we always reach a sweet compromise 🤝"]
    },
    {
      id: 125,
      category: "Eternal Memory",
      title: "If we could freeze one moment forever, which one? 💖",
      options: ["Our very first confession / kiss 💋", "Late night talks where time stopped ✨", "The day we laughed till our stomachs hurt 😂", "A quiet peaceful moment holding hands in silence 🤝"]
    }
  ];

  // ── Romantic Truth or Dare Bank (Mode 2) ──
  const TRUTH_OR_DARE_BANK = [
    { type: "truth", cat: "sweet", text: "What was your very first impression when you first saw me? Be 100% honest! 🌸" },
    { type: "truth", cat: "sweet", text: "What is the single cutest thing I do that makes your heart flutter? 💖" },
    { type: "truth", cat: "spicy", text: "What is your favorite outfit or look on me that makes you blush? 🔥" },
    { type: "truth", cat: "sweet", text: "If we could escape anywhere in the world right now for 48 hours, where would you take me? ✈️" },
    { type: "truth", cat: "spicy", text: "What is a romantic secret or fantasy you haven't told me yet? 🤫" },
    { type: "truth", cat: "funny", text: "What's the funniest or most awkward thing that happened on one of our dates? 😂" },
    { type: "truth", cat: "sweet", text: "When do you miss me the most throughout your day? 💭" },
    { type: "truth", cat: "spicy", text: "Forehead kiss, tight waist hug, or holding hands: which one is your favorite? 💋" },
    { type: "dare", cat: "sweet", text: "Send a 20-second voice note singing any romantic song dedicated to me right now! 🎤" },
    { type: "dare", cat: "sweet", text: "Send me 5 reasons why you fell in love with me in our chat! 💌" },
    { type: "dare", cat: "funny", text: "Send your absolute derpiest, funniest selfie without any filter! 📸" },
    { type: "dare", cat: "spicy", text: "Call me right now and give me the cheesiest Bollywood/romantic pickup line in your best voice! 📞" },
    { type: "dare", cat: "sweet", text: "Promise to give me a 10-minute relaxing massage next time we meet! 💆" },
    { type: "dare", cat: "funny", text: "Change your nickname for me in chat to whatever I choose for the next 24 hours! 👑" },
    { type: "dare", cat: "sweet", text: "Plan our next date completely from start to finish—no asking me for ideas! 🚗" },
    { type: "dare", cat: "spicy", text: "Send me the most attractive photo you have on your phone right now! 🔥" }
  ];

  // ── Couple Dare / Reward Bank (Shown after quiz results) ──
  const COUPLE_REWARDS = [
    { title: "Romantic Massage 💆", desc: "Winner gets a 10-minute relaxing shoulder or head massage tonight!" },
    { title: "Sweet Midnight Treat 🍦", desc: "Loser treats the winner to their favorite ice cream or midnight dessert!" },
    { title: "Heartfelt Love Song 🎤", desc: "Sing a 30-second romantic song on voice note with full passion!" },
    { title: "Love Letter Delivery 💌", desc: "Write 5 sweet reasons why you adore your partner in chat right now." },
    { title: "Surprise Date Duty 🚗", desc: "Plan and host our next surprise date completely on your own!" },
    { title: "Royal Wish Pass 👑", desc: "Winner gets 1 wish granted today with zero arguments!" }
  ];

  // ── Vector Couple Mascot ──
  const COUPLE_MASCOT_SVG = `
    <svg class="cm-mascot-art" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cmGradLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
        <linearGradient id="cmGradRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff2d75"/>
          <stop offset="100%" stop-color="#fb7185"/>
        </linearGradient>
        <linearGradient id="cmHeartGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff2d75"/>
          <stop offset="100%" stop-color="#e11d48"/>
        </linearGradient>
      </defs>

      <!-- Soft Glowing Aura -->
      <circle cx="90" cy="75" r="60" fill="url(#cmGradRight)" opacity="0.15" filter="blur(16px)"/>

      <!-- Mascot A (Left - Cute Blue Character) -->
      <g class="cm-char-left">
        <circle cx="65" cy="82" r="32" fill="url(#cmGradLeft)"/>
        <!-- Eyes -->
        <circle cx="58" cy="78" r="3.5" fill="#ffffff"/>
        <circle cx="72" cy="78" r="3.5" fill="#ffffff"/>
        <!-- Smile -->
        <path d="M60 88C62 92 68 92 70 88" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Blushing cheek -->
        <circle cx="53" cy="85" r="4" fill="#fda4af" opacity="0.8"/>
      </g>

      <!-- Mascot B (Right - Cute Rose Character, leaning in) -->
      <g class="cm-char-right">
        <circle cx="108" cy="82" r="32" fill="url(#cmGradRight)"/>
        <!-- Cute Bow / Flower on top -->
        <circle cx="122" cy="56" r="6" fill="#ffd700"/>
        <circle cx="118" cy="54" r="3" fill="#ffffff"/>
        <!-- Eyes (Happy wink) -->
        <path d="M100 76C103 80 107 80 110 76" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="120" cy="78" r="3.5" fill="#ffffff"/>
        <!-- Sweet Smile -->
        <path d="M105 88C107 92 113 92 115 88" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Blushing cheek -->
        <circle cx="125" cy="85" r="4" fill="#ffffff" opacity="0.6"/>
      </g>

      <!-- Shared Floating Beating Heart Above -->
      <g class="cm-beating-heart">
        <path d="M86.5 40C86.5 33.3726 91.8726 28 98.5 28C102.101 28 105.304 29.5858 107.5 32.0825C109.696 29.5858 112.899 28 116.5 28C123.127 28 128.5 33.3726 128.5 40C128.5 50 107.5 62 107.5 62C107.5 62 86.5 50 86.5 40Z" transform="translate(-20, -5)" fill="url(#cmHeartGrad)"/>
        <!-- Sparkle -->
        <circle cx="95" cy="30" r="2" fill="#ffffff"/>
      </g>
    </svg>
  `;

  // ── Game State ──
  let state = {
    currentScreen: 'hub', // 'hub' | 'names' | 'create' | 'review' | 'share' | 'partner_welcome' | 'partner_play' | 'result' | 'scoreboard' | 'love_dice'
    creatorName: '',
    partnerName: '',
    relationshipStatus: 'Dating / In Love 💖',
    quizId: null,
    adminKey: null,
    selectedQuestions: [],
    creatorAnswers: [],
    createIndex: 0,
    partnerPlayerName: '',
    partnerAnswers: [],
    partnerIndex: 0,
    partnerScore: 0,
    activeQuiz: null,
    scoreboardData: null,
    usedQuestionIds: new Set(),
    diceResult: null
  };

  // ── Initialize Default 10 Questions ──
  function _initDefaultQuestions() {
    state.selectedQuestions = QUESTION_BANK.slice(0, 10).map(q => ({ ...q }));
    state.creatorAnswers = new Array(10).fill(null);
    state.usedQuestionIds = new Set(state.selectedQuestions.map(q => q.id));
    state.createIndex = 0;
  }

  // ── Swap current question with unused from bank ──
  function swapCurrentQuestion() {
    const currentQ = state.selectedQuestions[state.createIndex];
    const available = QUESTION_BANK.filter(q => !state.usedQuestionIds.has(q.id));

    if (available.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('ℹ️ All questions in the couple pool are in use!');
      }
      return;
    }

    const nextQ = available[Math.floor(Math.random() * available.length)];
    state.usedQuestionIds.delete(currentQ.id);
    state.usedQuestionIds.add(nextQ.id);

    state.selectedQuestions[state.createIndex] = { ...nextQ };
    state.creatorAnswers[state.createIndex] = null;

    renderScreen();
  }

  // ── UI Navigation & Render Router ──
  function renderScreen() {
    const container = document.getElementById('cm-screen-container');
    if (!container) return;

    switch (state.currentScreen) {
      case 'hub':
        container.innerHTML = _renderScreenHub();
        _bindScreenHub();
        break;
      case 'names':
        container.innerHTML = _renderScreenNames();
        _bindScreenNames();
        break;
      case 'create':
        container.innerHTML = _renderScreenCreate();
        _bindScreenCreate();
        break;
      case 'review':
        container.innerHTML = _renderScreenReview();
        _bindScreenReview();
        break;
      case 'share':
        container.innerHTML = _renderScreenShare();
        _bindScreenShare();
        break;
      case 'partner_welcome':
        container.innerHTML = _renderScreenPartnerWelcome();
        _bindScreenPartnerWelcome();
        break;
      case 'partner_play':
        container.innerHTML = _renderScreenPartnerPlay();
        _bindScreenPartnerPlay();
        break;
      case 'result':
        container.innerHTML = _renderScreenResult();
        _bindScreenResult();
        break;
      case 'scoreboard':
        container.innerHTML = _renderScreenScoreboard();
        _bindScreenScoreboard();
        break;
      case 'love_dice':
        container.innerHTML = _renderScreenLoveDice();
        _bindScreenLoveDice();
        break;
      default:
        container.innerHTML = _renderScreenHub();
        _bindScreenHub();
        break;
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 0: HUB (Main Couple Menu)
  // ─────────────────────────────────────────────────────────
  function _renderScreenHub() {
    const myQuizzes = _getMySavedQuizzes();
    return `
      <div class="cm-card cm-fade-in">
        <div class="cm-mascot-wrap">
          ${COUPLE_MASCOT_SVG}
        </div>
        <div class="cm-badge-pill">💑 Couple Match</div>
        <h2 class="cm-title">Love & Compatibility</h2>
        <p class="cm-subtitle">Discover how well your partner really knows you & ignite cute romantic moments!</p>

        <div class="cm-hub-actions">
          <button type="button" class="cm-btn-romantic cm-hub-btn" id="cm-btn-start-quiz">
            <span class="cm-btn-icon">💘</span>
            <div class="cm-btn-text">
              <strong>Couple Compatibility Quiz</strong>
              <small>Create 10 questions & test your partner's love!</small>
            </div>
            <span class="cm-btn-arrow">➔</span>
          </button>

          <button type="button" class="cm-btn-outline cm-hub-btn" id="cm-btn-start-dice">
            <span class="cm-btn-icon">🎲</span>
            <div class="cm-btn-text">
              <strong>Romantic Love Dice</strong>
              <small>Instant Truth or Dare challenges for couples!</small>
            </div>
            <span class="cm-btn-arrow">➔</span>
          </button>
        </div>

        ${myQuizzes.length > 0 ? `
          <div class="cm-history-section">
            <div class="cm-history-title">Your Active Quizzes (${myQuizzes.length})</div>
            <div class="cm-history-list">
              ${myQuizzes.slice(0, 3).map(q => `
                <div class="cm-history-item" onclick="CoupleMatchGame.openScoreboard('${q.quizId}', '${q.adminKey}')">
                  <div class="cm-hist-meta">
                    <strong>${q.creatorName} ${q.partnerName ? '& ' + q.partnerName : ''}</strong>
                    <small>${q.attempts ? q.attempts.length : 0} attempts received</small>
                  </div>
                  <span class="cm-hist-view">View ➔</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="cm-footer-note">
          🔒 100% Private, End-to-End Chat & ₹0 Free on BUDDY
        </div>
      </div>
    `;
  }

  function _bindScreenHub() {
    const startQuizBtn = document.getElementById('cm-btn-start-quiz');
    const startDiceBtn = document.getElementById('cm-btn-start-dice');

    if (startQuizBtn) {
      startQuizBtn.onclick = () => {
        state.currentScreen = 'names';
        renderScreen();
      };
    }

    if (startDiceBtn) {
      startDiceBtn.onclick = () => {
        state.currentScreen = 'love_dice';
        renderScreen();
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 1: NAMES & VIBE SETUP
  // ─────────────────────────────────────────────────────────
  function _renderScreenNames() {
    return `
      <div class="cm-card cm-fade-in">
        <button type="button" class="cm-back-icon" id="cm-btn-names-back">← Back</button>
        <div class="cm-badge-pill">Step 1 of 3</div>
        <h2 class="cm-title">Who's In Love? 💖</h2>
        <p class="cm-subtitle">Enter your name and your partner's name so we can personalize your Couple Quiz!</p>

        <div class="cm-form-group">
          <label class="cm-label">Your Name</label>
          <input type="text" id="cm-inp-creator" class="cm-input" placeholder="e.g. Keyur" maxlength="20" value="${state.creatorName || ''}" autocomplete="off" />
        </div>

        <div class="cm-form-group">
          <label class="cm-label">Your Partner / Bestie's Name</label>
          <input type="text" id="cm-inp-partner" class="cm-input" placeholder="e.g. Aarohi" maxlength="20" value="${state.partnerName || ''}" autocomplete="off" />
        </div>

        <div class="cm-form-group">
          <label class="cm-label">Your Relationship Vibe</label>
          <select id="cm-sel-vibe" class="cm-select">
            <option value="Dating / In Love 💖" ${state.relationshipStatus.includes('Dating') ? 'selected' : ''}>Dating / In Love 💖</option>
            <option value="Engaged / Married 💍" ${state.relationshipStatus.includes('Married') ? 'selected' : ''}>Engaged / Married 💍</option>
            <option value="Crush / Talking Phase 🌸" ${state.relationshipStatus.includes('Crush') ? 'selected' : ''}>Crush / Talking Phase 🌸</option>
            <option value="Besties with Spark ✨" ${state.relationshipStatus.includes('Besties') ? 'selected' : ''}>Besties with Romantic Spark ✨</option>
          </select>
        </div>

        <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-names-next">
          Start Quiz Setup ➔
        </button>
      </div>
    `;
  }

  function _bindScreenNames() {
    const backBtn = document.getElementById('cm-btn-names-back');
    const nextBtn = document.getElementById('cm-btn-names-next');
    const creatorInp = document.getElementById('cm-inp-creator');
    const partnerInp = document.getElementById('cm-inp-partner');
    const vibeSel = document.getElementById('cm-sel-vibe');

    if (backBtn) {
      backBtn.onclick = () => {
        state.currentScreen = 'hub';
        renderScreen();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        const cVal = creatorInp ? creatorInp.value.trim() : '';
        const pVal = partnerInp ? partnerInp.value.trim() : '';
        if (!cVal) {
          if (typeof window.showToast === 'function') window.showToast('⚠️ Please enter your name!');
          if (creatorInp) creatorInp.focus();
          return;
        }

        state.creatorName = cVal;
        state.partnerName = pVal;
        if (vibeSel) state.relationshipStatus = vibeSel.value;

        _initDefaultQuestions();
        state.currentScreen = 'create';
        renderScreen();
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 2: CREATE 10-QUESTION QUIZ
  // ─────────────────────────────────────────────────────────
  function _renderScreenCreate() {
    const q = state.selectedQuestions[state.createIndex];
    const total = 10;
    const currentNum = state.createIndex + 1;
    const progress = Math.round((currentNum / total) * 100);
    const chosenAnswer = state.creatorAnswers[state.createIndex];

    return `
      <div class="cm-card cm-fade-in">
        <div class="cm-quiz-header">
          <div class="cm-quiz-step">Question ${currentNum} of ${total}</div>
          <button type="button" class="cm-swap-btn" id="cm-btn-swap" title="Swap with another couple question">
            🔀 Swap
          </button>
        </div>

        <div class="cm-progress-bar">
          <div class="cm-progress-fill" style="width: ${progress}%;"></div>
        </div>

        <div class="cm-q-category">🌸 ${q.category || 'Romantic Couple Quiz'}</div>
        <h3 class="cm-q-title">${q.title}</h3>
        <p class="cm-q-hint">Select YOUR true answer below so your partner can try to guess it:</p>

        <div class="cm-options-grid">
          ${q.options.map((opt, idx) => {
            const isSelected = chosenAnswer === idx;
            return `
              <button 
                type="button" 
                class="cm-opt-btn ${isSelected ? 'selected' : ''}" 
                data-idx="${idx}"
              >
                <span class="cm-opt-radio">${isSelected ? '💖' : '⚪'}</span>
                <span class="cm-opt-text">${opt}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="cm-q-nav">
          <button type="button" class="cm-btn-secondary" id="cm-btn-prev-q" ${state.createIndex === 0 ? 'disabled' : ''}>
            ← Previous
          </button>
          <button type="button" class="cm-btn-romantic" id="cm-btn-next-q" ${chosenAnswer === null ? 'disabled' : ''}>
            ${currentNum === total ? 'Review Quiz ➔' : 'Next Question ➔'}
          </button>
        </div>
      </div>
    `;
  }

  function _bindScreenCreate() {
    const swapBtn = document.getElementById('cm-btn-swap');
    const prevBtn = document.getElementById('cm-btn-prev-q');
    const nextBtn = document.getElementById('cm-btn-next-q');

    if (swapBtn) swapBtn.onclick = () => swapCurrentQuestion();

    document.querySelectorAll('.cm-opt-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        state.creatorAnswers[state.createIndex] = idx;
        renderScreen();
      };
    });

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (state.createIndex > 0) {
          state.createIndex--;
          renderScreen();
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (state.creatorAnswers[state.createIndex] === null) {
          if (typeof window.showToast === 'function') window.showToast('⚠️ Please select an answer first!');
          return;
        }

        if (state.createIndex < 9) {
          state.createIndex++;
          renderScreen();
        } else {
          state.currentScreen = 'review';
          renderScreen();
        }
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 3: REVIEW & FINALIZE
  // ─────────────────────────────────────────────────────────
  function _renderScreenReview() {
    return `
      <div class="cm-card cm-fade-in">
        <button type="button" class="cm-back-icon" id="cm-btn-review-back">← Back to Questions</button>
        <div class="cm-badge-pill">Almost Ready!</div>
        <h2 class="cm-title">Review Your Love Quiz 💌</h2>
        <p class="cm-subtitle">Check your answers before generating your partner's challenge link.</p>

        <div class="cm-review-list">
          ${state.selectedQuestions.map((q, idx) => {
            const ansIdx = state.creatorAnswers[idx];
            const ansText = ansIdx !== null ? q.options[ansIdx] : 'Not answered';
            return `
              <div class="cm-review-item">
                <div class="cm-review-header">
                  <strong>Q${idx + 1}. ${q.title}</strong>
                  <button type="button" class="cm-review-edit" data-idx="${idx}">Edit</button>
                </div>
                <div class="cm-review-ans">✓ ${ansText}</div>
              </div>
            `;
          }).join('')}
        </div>

        <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-finalize-quiz">
          Generate Love Challenge Link 🚀
        </button>
      </div>
    `;
  }

  function _bindScreenReview() {
    const backBtn = document.getElementById('cm-btn-review-back');
    const finalizeBtn = document.getElementById('cm-btn-finalize-quiz');

    if (backBtn) {
      backBtn.onclick = () => {
        state.currentScreen = 'create';
        renderScreen();
      };
    }

    document.querySelectorAll('.cm-review-edit').forEach(btn => {
      btn.onclick = () => {
        state.createIndex = Number(btn.dataset.idx);
        state.currentScreen = 'create';
        renderScreen();
      };
    });

    if (finalizeBtn) {
      finalizeBtn.onclick = async () => {
        finalizeBtn.disabled = true;
        finalizeBtn.innerHTML = 'Creating Love Link... ⏳';
        await _saveAndPublishQuiz();
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // PUBLISH QUIZ TO BACKEND & SUPABASE
  // ─────────────────────────────────────────────────────────
  async function _saveAndPublishQuiz() {
    const quizPayload = {
      creatorName: state.creatorName,
      partnerName: state.partnerName || '',
      gameType: 'couple-match',
      questions: state.selectedQuestions,
      creatorAnswers: state.creatorAnswers
    };

    let quizId = 'cm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let adminKey = 'adm_' + Math.random().toString(36).slice(2, 10);

    try {
      const res = await fetch('/api/games/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizPayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quizId) quizId = data.quizId;
        if (data.adminKey) adminKey = data.adminKey;
      }
    } catch (err) {
      console.warn('Local server save error, fallback to offline local storage:', err);
    }

    state.quizId = quizId;
    state.adminKey = adminKey;

    const quizObj = {
      quizId,
      adminKey,
      creatorName: state.creatorName,
      partnerName: state.partnerName,
      relationshipStatus: state.relationshipStatus,
      questions: state.selectedQuestions,
      creatorAnswers: state.creatorAnswers,
      createdAt: Date.now(),
      attempts: []
    };

    _saveQuizLocally(quizObj);
    _syncQuizWithSupabase(quizId, adminKey, quizPayload);

    state.currentScreen = 'share';
    renderScreen();
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 4: SHARE WITH PARTNER
  // ─────────────────────────────────────────────────────────
  function _renderScreenShare() {
    const origin = window.location.origin + window.location.pathname;
    const playUrl = `${origin}?couple=${encodeURIComponent(state.quizId)}`;
    const adminUrl = `${origin}?couple_admin=${encodeURIComponent(state.quizId)}&key=${encodeURIComponent(state.adminKey)}`;

    return `
      <div class="cm-card cm-fade-in">
        <div class="cm-badge-pill">🎉 Quiz Ready!</div>
        <h2 class="cm-title">Send to Your Partner 💘</h2>
        <p class="cm-subtitle">Your romantic compatibility quiz is live! Send it to your partner to test your connection.</p>

        <div class="cm-ticket-card">
          <div class="cm-ticket-heart">💖</div>
          <div class="cm-ticket-title">${state.creatorName} & ${state.partnerName || 'Partner'}</div>
          <div class="cm-ticket-sub">Romantic Connection Challenge</div>
          <div class="cm-ticket-code">${state.quizId}</div>
        </div>

        <div class="cm-share-group">
          <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-send-buddy-chat">
            💬 Send Directly on BUDDY Chat
          </button>

          <button type="button" class="cm-btn-whatsapp cm-btn-full" id="cm-btn-share-whatsapp">
            📲 Share on WhatsApp
          </button>

          <div class="cm-link-copy-wrap">
            <input type="text" class="cm-share-input" id="cm-play-link-inp" value="${playUrl}" readonly />
            <button type="button" class="cm-copy-btn" id="cm-btn-copy-link">Copy</button>
          </div>
        </div>

        <div class="cm-admin-box">
          <div class="cm-admin-label">🔒 Your Secret Scoreboard Link</div>
          <div class="cm-admin-sub">Bookmark this to see what your partner answers:</div>
          <div class="cm-link-copy-wrap" style="margin-top:6px;">
            <input type="text" class="cm-share-input" id="cm-admin-link-inp" value="${adminUrl}" readonly style="font-size:11px;" />
            <button type="button" class="cm-copy-btn" id="cm-btn-copy-admin">Copy</button>
          </div>
          <button type="button" class="cm-btn-outline cm-btn-full" style="margin-top:10px;" onclick="CoupleMatchGame.openScoreboard('${state.quizId}', '${state.adminKey}')">
            🏆 Open Live Scoreboard
          </button>
        </div>
      </div>
    `;
  }

  function _bindScreenShare() {
    const origin = window.location.origin + window.location.pathname;
    const playUrl = `${origin}?couple=${encodeURIComponent(state.quizId)}`;
    const adminUrl = `${origin}?couple_admin=${encodeURIComponent(state.quizId)}&key=${encodeURIComponent(state.adminKey)}`;

    const sendBuddyBtn = document.getElementById('cm-btn-send-buddy-chat');
    const waBtn = document.getElementById('cm-btn-share-whatsapp');
    const copyPlayBtn = document.getElementById('cm-btn-copy-link');
    const copyAdminBtn = document.getElementById('cm-btn-copy-admin');

    if (sendBuddyBtn) {
      sendBuddyBtn.onclick = () => _openFriendsInviteModal();
    }

    if (waBtn) {
      waBtn.onclick = () => {
        const text = `💑 Couple Match Quiz!\nHey love, I made a 10-question romantic compatibility quiz about us! Can you score 100% or do you owe me a date? 😜💖\n👉 Play here: ${playUrl}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      };
    }

    if (copyPlayBtn) {
      copyPlayBtn.onclick = () => {
        navigator.clipboard.writeText(playUrl);
        copyPlayBtn.innerText = 'Copied! ✓';
        setTimeout(() => copyPlayBtn.innerText = 'Copy', 2000);
        if (typeof window.showToast === 'function') window.showToast('📋 Love Quiz link copied to clipboard!');
      };
    }

    if (copyAdminBtn) {
      copyAdminBtn.onclick = () => {
        navigator.clipboard.writeText(adminUrl);
        copyAdminBtn.innerText = 'Copied! ✓';
        setTimeout(() => copyAdminBtn.innerText = 'Copy', 2000);
        if (typeof window.showToast === 'function') window.showToast('🔒 Private Admin link copied!');
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 5: PARTNER WELCOME & PLAY
  // ─────────────────────────────────────────────────────────
  async function loadQuizForPlaying(quizId) {
    state.quizId = quizId;
    let quiz = _getQuizLocally(quizId);

    if (!quiz) {
      try {
        const res = await fetch(`/api/games/quiz?id=${encodeURIComponent(quizId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quiz) quiz = data.quiz;
        }
      } catch (err) {
        console.warn('Fetch quiz error:', err);
      }
    }

    if (!quiz) {
      if (typeof window.showToast === 'function') window.showToast('⚠️ Quiz not found or link expired.');
      openGame();
      return;
    }

    state.activeQuiz = quiz;
    state.creatorName = quiz.creatorName;
    state.partnerName = quiz.partnerName || '';
    state.selectedQuestions = quiz.questions || [];
    state.partnerAnswers = [];
    state.partnerIndex = 0;
    state.partnerScore = 0;
    state.currentScreen = 'partner_welcome';

    openGameModal();
    renderScreen();
  }

  function _renderScreenPartnerWelcome() {
    const creator = state.creatorName || 'Your Partner';
    return `
      <div class="cm-card cm-fade-in">
        <div class="cm-mascot-wrap">
          ${COUPLE_MASCOT_SVG}
        </div>
        <div class="cm-badge-pill">Couple Compatibility Challenge</div>
        <h2 class="cm-title">How Well Do You Know ${creator}? 💖</h2>
        <p class="cm-subtitle">${creator} has created a 10-question romantic test for you! Can you guess their exact answers?</p>

        <div class="cm-form-group" style="margin-top:16px;">
          <label class="cm-label">Your Name</label>
          <input type="text" id="cm-inp-partner-player" class="cm-input" placeholder="Enter your name..." maxlength="20" value="${state.partnerPlayerName || state.partnerName || ''}" autocomplete="off" />
        </div>

        <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-start-partner-play">
          Accept Love Challenge ➔
        </button>
      </div>
    `;
  }

  function _bindScreenPartnerWelcome() {
    const startBtn = document.getElementById('cm-btn-start-partner-play');
    const inp = document.getElementById('cm-inp-partner-player');

    if (startBtn) {
      startBtn.onclick = () => {
        const name = inp ? inp.value.trim() : '';
        if (!name) {
          if (typeof window.showToast === 'function') window.showToast('⚠️ Please enter your name!');
          if (inp) inp.focus();
          return;
        }
        state.partnerPlayerName = name;
        state.partnerIndex = 0;
        state.partnerAnswers = [];
        state.partnerScore = 0;
        state.currentScreen = 'partner_play';
        renderScreen();
      };
    }
  }

  function _renderScreenPartnerPlay() {
    const q = state.selectedQuestions[state.partnerIndex];
    const total = state.selectedQuestions.length || 10;
    const currentNum = state.partnerIndex + 1;
    const progress = Math.round((currentNum / total) * 100);

    return `
      <div class="cm-card cm-fade-in">
        <div class="cm-quiz-header">
          <div class="cm-quiz-step">Question ${currentNum} of ${total}</div>
          <div class="cm-score-badge">Score: ${state.partnerScore} 💘</div>
        </div>

        <div class="cm-progress-bar">
          <div class="cm-progress-fill" style="width: ${progress}%;"></div>
        </div>

        <div class="cm-q-category">🌸 ${state.creatorName}'s Question</div>
        <h3 class="cm-q-title">${q.title}</h3>
        <p class="cm-q-hint">What do you think ${state.creatorName} chose?</p>

        <div class="cm-options-grid" id="cm-partner-options-box">
          ${q.options.map((opt, idx) => `
            <button 
              type="button" 
              class="cm-opt-btn cm-play-opt" 
              data-idx="${idx}"
            >
              <span class="cm-opt-radio">⚪</span>
              <span class="cm-opt-text">${opt}</span>
            </button>
          `).join('')}
        </div>

        <div id="cm-partner-feedback" class="cm-feedback-box hidden"></div>
      </div>
    `;
  }

  function _bindScreenPartnerPlay() {
    const buttons = document.querySelectorAll('.cm-play-opt');
    const feedbackBox = document.getElementById('cm-partner-feedback');

    buttons.forEach(btn => {
      btn.onclick = async () => {
        buttons.forEach(b => b.disabled = true);
        const chosenIdx = Number(btn.dataset.idx);

        let isMatch = false;
        let correctIdx = null;

        // Check answer via server or local
        try {
          const res = await fetch('/api/games/quiz/check-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId: state.quizId,
              questionIndex: state.partnerIndex,
              chosenIndex: chosenIdx
            })
          });
          if (res.ok) {
            const data = await res.json();
            isMatch = !!data.isMatch;
            correctIdx = data.correctIndex;
          }
        } catch (err) {
          console.warn('Check answer error, checking local:', err);
        }

        // Local check fallback
        if (correctIdx === null && state.activeQuiz && state.activeQuiz.creatorAnswers) {
          correctIdx = state.activeQuiz.creatorAnswers[state.partnerIndex];
          isMatch = (chosenIdx === correctIdx);
        }

        if (isMatch) state.partnerScore++;
        state.partnerAnswers.push({
          qIndex: state.partnerIndex,
          chosen: chosenIdx,
          correct: correctIdx,
          isMatch
        });

        // Highlight buttons
        buttons.forEach((b, idx) => {
          if (idx === correctIdx) b.classList.add('correct-match');
          if (idx === chosenIdx && !isMatch) b.classList.add('wrong-match');
        });

        if (feedbackBox) {
          feedbackBox.classList.remove('hidden');
          if (isMatch) {
            feedbackBox.innerHTML = `
              <div class="cm-feedback-msg match">
                <span>💘</span> Exact Match! You know ${state.creatorName} so well!
              </div>
            `;
          } else {
            feedbackBox.innerHTML = `
              <div class="cm-feedback-msg miss">
                <span>🙈</span> Oops! ${state.creatorName} actually chose option ${correctIdx !== null ? (correctIdx + 1) : ''}!
              </div>
            `;
          }
        }

        setTimeout(() => {
          if (state.partnerIndex < (state.selectedQuestions.length - 1)) {
            state.partnerIndex++;
            renderScreen();
          } else {
            _submitPartnerResult();
          }
        }, 1400);
      };
    });
  }

  // ─────────────────────────────────────────────────────────
  // SUBMIT RESULT & SHOW LOVE METER
  // ─────────────────────────────────────────────────────────
  async function _submitPartnerResult() {
    const total = state.selectedQuestions.length || 10;
    const percentage = Math.round((state.partnerScore / total) * 100);

    const attemptPayload = {
      quizId: state.quizId,
      playerName: state.partnerPlayerName,
      score: state.partnerScore,
      totalQuestions: total,
      percentage,
      answers: state.partnerAnswers,
      timestamp: Date.now()
    };

    try {
      await fetch('/api/games/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptPayload)
      });
    } catch (e) {}

    _recordAttemptLocally(state.quizId, attemptPayload);

    state.currentScreen = 'result';
    renderScreen();
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 6: RESULTS & COMPATIBILITY METER
  // ─────────────────────────────────────────────────────────
  function _renderScreenResult() {
    const total = state.selectedQuestions.length || 10;
    const score = state.partnerScore;
    const percentage = Math.round((score / total) * 100);

    let tierTitle = "💍 Rab Ne Bana Di Jodi!";
    let tierSubtitle = "Pure Soulmate Status! You two understand each other without even speaking.";
    let tierColor = "#ff2d75";

    if (percentage >= 80) {
      tierTitle = "💍 Eternal Soulmates!";
      tierSubtitle = "Rab Ne Bana Di Jodi! Your romantic chemistry is out of this world!";
      tierColor = "#e11d48";
    } else if (percentage >= 60) {
      tierTitle = "💖 Deep Lovers & Best Friends!";
      tierSubtitle = "Electric chemistry! You two know each other's hearts deeply.";
      tierColor = "#f43f5e";
    } else if (percentage >= 40) {
      tierTitle = "🌹 Sweet Spark & Cute Love!";
      tierSubtitle = "Opposites attract! Lots of sweetness with cute little surprises.";
      tierColor = "#fb7185";
    } else {
      tierTitle = "😜 Playful Drama & Cute Chaos!";
      tierSubtitle = "Uh oh! Someone definitely owes their partner a long dinner date & apology hug!";
      tierColor = "#a855f7";
    }

    const randomDare = COUPLE_REWARDS[Math.floor(Math.random() * COUPLE_REWARDS.length)];

    return `
      <div class="cm-card cm-fade-in">
        <div class="cm-mascot-wrap">
          ${COUPLE_MASCOT_SVG}
        </div>
        <div class="cm-badge-pill">Love Chemistry Test</div>
        <h2 class="cm-title">${tierTitle}</h2>

        <div class="cm-love-meter-wrap">
          <div class="cm-love-meter-circle" style="border-color: ${tierColor};">
            <div class="cm-meter-score">${percentage}%</div>
            <div class="cm-meter-label">${score}/${total} Match</div>
          </div>
        </div>

        <p class="cm-result-desc">${tierSubtitle}</p>

        <!-- Dynamic Couple Dare Card -->
        <div class="cm-dare-card">
          <div class="cm-dare-badge">🎲 Couple Penalty / Reward</div>
          <div class="cm-dare-title">${randomDare.title}</div>
          <p class="cm-dare-text">${randomDare.desc}</p>
        </div>

        <!-- Answers Side-by-Side Breakdown -->
        <div class="cm-answers-breakdown">
          <div class="cm-breakdown-title">Answers Comparison 🔍</div>
          ${state.partnerAnswers.map(ans => {
            const q = state.selectedQuestions[ans.qIndex];
            if (!q) return '';
            const yourAns = q.options[ans.chosen] || 'None';
            const creatorAns = q.options[ans.correct] || 'None';
            return `
              <div class="cm-breakdown-row ${ans.isMatch ? 'match' : 'mismatch'}">
                <div class="cm-bd-q">${q.title}</div>
                <div class="cm-bd-compare">
                  <div class="cm-bd-yours"><strong>You:</strong> ${yourAns} ${ans.isMatch ? '✓' : '✗'}</div>
                  ${!ans.isMatch ? `<div class="cm-bd-theirs"><strong>${state.creatorName}:</strong> ${creatorAns}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="cm-result-actions">
          <button type="button" class="cm-btn-romantic cm-btn-full" id="cm-btn-make-own-quiz">
            Create Your Own Couple Quiz ➔
          </button>
          <button type="button" class="cm-btn-outline cm-btn-full" style="margin-top:10px;" id="cm-btn-play-dice-mode">
            Roll Romantic Love Dice 🎲
          </button>
        </div>
      </div>
    `;
  }

  function _bindScreenResult() {
    const makeBtn = document.getElementById('cm-btn-make-own-quiz');
    const diceBtn = document.getElementById('cm-btn-play-dice-mode');

    if (makeBtn) {
      makeBtn.onclick = () => {
        state.creatorName = state.partnerPlayerName || '';
        state.partnerName = state.creatorName || '';
        state.currentScreen = 'names';
        renderScreen();
      };
    }

    if (diceBtn) {
      diceBtn.onclick = () => {
        state.currentScreen = 'love_dice';
        renderScreen();
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 7: CREATOR PRIVATE SCOREBOARD
  // ─────────────────────────────────────────────────────────
  async function openScoreboard(quizId, adminKey) {
    state.quizId = quizId;
    state.adminKey = adminKey;
    openGameModal();

    const container = document.getElementById('cm-screen-container');
    if (container) {
      container.innerHTML = `
        <div class="cm-card cm-fade-in" style="text-align:center; padding: 40px 20px;">
          <div style="font-size:36px; margin-bottom:12px;">🏆💖</div>
          <h3>Loading Partner Scoreboard...</h3>
        </div>
      `;
    }

    let scoreboardData = null;
    try {
      const res = await fetch(`/api/games/quiz/scoreboard?id=${encodeURIComponent(quizId)}&key=${encodeURIComponent(adminKey)}`);
      if (res.ok) {
        const data = await res.json();
        scoreboardData = data.quiz;
      }
    } catch (e) {}

    if (!scoreboardData) {
      const local = _getQuizLocally(quizId);
      if (local) {
        scoreboardData = {
          id: quizId,
          creatorName: local.creatorName,
          partnerName: local.partnerName,
          createdAt: local.createdAt,
          attempts: local.attempts || [],
          questions: local.questions || []
        };
      }
    }

    state.scoreboardData = scoreboardData;
    state.currentScreen = 'scoreboard';
    renderScreen();
  }

  function _renderScreenScoreboard() {
    const data = state.scoreboardData;
    const attempts = data && Array.isArray(data.attempts) ? data.attempts : [];

    return `
      <div class="cm-card cm-fade-in">
        <button type="button" class="cm-back-icon" id="cm-btn-score-back">← Back to Hub</button>
        <div class="cm-badge-pill">Private Partner Scoreboard</div>
        <h2 class="cm-title">Scoreboard 🏆</h2>
        <p class="cm-subtitle">Here are the partners who attempted your Romantic Quiz:</p>

        ${attempts.length === 0 ? `
          <div class="cm-empty-box">
            <div style="font-size:36px; margin-bottom:8px;">💌</div>
            <p><strong>No attempts received yet!</strong></p>
            <small>Share your link with your partner so they can take the test.</small>
            <button type="button" class="cm-btn-romantic cm-btn-full" style="margin-top:16px;" onclick="CoupleMatchGame.openShareScreen('${state.quizId}')">
              Share Link Now ➔
            </button>
          </div>
        ` : `
          <div class="cm-attempts-list">
            ${attempts.map((att, idx) => {
              const dt = att.timestamp ? new Date(att.timestamp).toLocaleDateString() : '';
              return `
                <div class="cm-attempt-row">
                  <div class="cm-att-rank">${idx === 0 ? '🥇' : '💖'}</div>
                  <div class="cm-att-meta">
                    <strong>${att.playerName}</strong>
                    <small>${dt} • ${att.score}/${att.totalQuestions || 10} correct</small>
                  </div>
                  <div class="cm-att-percent">${att.percentage}%</div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  function _bindScreenScoreboard() {
    const backBtn = document.getElementById('cm-btn-score-back');
    if (backBtn) {
      backBtn.onclick = () => {
        state.currentScreen = 'hub';
        renderScreen();
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCREEN 8: ROMANTIC LOVE DICE & TRUTH/DARE (Mode 2)
  // ─────────────────────────────────────────────────────────
  function _renderScreenLoveDice() {
    const curr = state.diceResult;

    return `
      <div class="cm-card cm-fade-in">
        <button type="button" class="cm-back-icon" id="cm-btn-dice-back">← Back to Hub</button>
        <div class="cm-badge-pill">Mode 2: Live Couple Fun</div>
        <h2 class="cm-title">Romantic Love Dice 🎲</h2>
        <p class="cm-subtitle">Roll the dice to get sweet romantic truths, cute dares & flirty challenges!</p>

        <div class="cm-dice-display" id="cm-dice-box">
          ${curr ? `
            <div class="cm-dice-card cm-fade-in ${curr.type}">
              <div class="cm-dice-type">${curr.type === 'truth' ? '💖 ROMANTIC TRUTH' : '🔥 PLAYFUL DARE'}</div>
              <p class="cm-dice-text">${curr.text}</p>
            </div>
          ` : `
            <div class="cm-dice-empty">
              <span class="cm-dice-big">🎲</span>
              <p>Tap below to roll the Love Dice!</p>
            </div>
          `}
        </div>

        <button type="button" class="cm-btn-romantic cm-btn-full cm-roll-btn" id="cm-btn-roll-dice">
          Roll the Dice! 🎲✨
        </button>

        ${curr ? `
          <div class="cm-dice-actions">
            <button type="button" class="cm-btn-outline cm-btn-full" id="cm-btn-copy-dice">
              📋 Copy Challenge
            </button>
            <button type="button" class="cm-btn-whatsapp cm-btn-full" style="margin-top:8px;" id="cm-btn-send-dice-chat">
              💬 Drop in BUDDY Chat
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function _bindScreenLoveDice() {
    const backBtn = document.getElementById('cm-btn-dice-back');
    const rollBtn = document.getElementById('cm-btn-roll-dice');
    const copyBtn = document.getElementById('cm-btn-copy-dice');
    const chatBtn = document.getElementById('cm-btn-send-dice-chat');

    if (backBtn) {
      backBtn.onclick = () => {
        state.currentScreen = 'hub';
        renderScreen();
      };
    }

    if (rollBtn) {
      rollBtn.onclick = () => {
        rollBtn.disabled = true;
        const box = document.getElementById('cm-dice-box');
        if (box) {
          box.innerHTML = `
            <div class="cm-dice-rolling">
              <span class="cm-dice-big cm-spin">🎲</span>
              <p>Rolling with love...</p>
            </div>
          `;
        }

        setTimeout(() => {
          const item = TRUTH_OR_DARE_BANK[Math.floor(Math.random() * TRUTH_OR_DARE_BANK.length)];
          state.diceResult = item;
          renderScreen();
        }, 600);
      };
    }

    if (copyBtn && state.diceResult) {
      copyBtn.onclick = () => {
        const text = `💑 Couple Challenge (${state.diceResult.type.toUpperCase()}):\n${state.diceResult.text}`;
        navigator.clipboard.writeText(text);
        copyBtn.innerText = 'Copied! ✓';
        setTimeout(() => copyBtn.innerText = '📋 Copy Challenge', 2000);
        if (typeof window.showToast === 'function') window.showToast('📋 Challenge copied!');
      };
    }

    if (chatBtn && state.diceResult) {
      chatBtn.onclick = () => {
        _openFriendsInviteModal(state.diceResult.text);
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // FRIENDS INVITE MODAL (Direct 1-tap send in chat)
  // ─────────────────────────────────────────────────────────
  let _cachedFriendsList = [];

  async function _openFriendsInviteModal(customMessage) {
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

    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add('hidden');
    }

    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    };

    if (container) {
      container.innerHTML = `
        <div style="padding: 36px 12px; text-align: center; color: #64748b;">
          <div style="font-size: 32px; margin-bottom: 8px;">💑✨</div>
          <p style="font-weight: 700; color: #fff; margin-bottom: 4px;">Loading BUDDY Contacts...</p>
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
    } catch (err) {
      console.warn('Error loading contacts:', err);
      _cachedFriendsList = [];
    }

    _filterAndRenderFriends('', customMessage);

    if (searchInp) {
      searchInp.oninput = () => {
        const q = searchInp.value.trim();
        if (clearBtn) clearBtn.classList.toggle('hidden', !q);
        _filterAndRenderFriends(q, customMessage);
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (searchInp) {
          searchInp.value = '';
          searchInp.focus();
        }
        clearBtn.classList.add('hidden');
        _filterAndRenderFriends('', customMessage);
      };
    }
  }

  function _filterAndRenderFriends(query, customMessage) {
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

        const origin = window.location.origin + window.location.pathname;
        const playUrl = `${origin}?couple=${encodeURIComponent(state.quizId)}`;
        const messageText = customMessage 
          ? `🎲 Couple Love Challenge:\n${customMessage}\n👉 Play Couple Match on BUDDY!`
          : `💑 Couple Match Quiz!\nHey! I made a romantic compatibility quiz for us on BUDDY! Can you score 100% or do you owe me a date? 😜💖\n👉 Play here: ${playUrl}`;

        let sent = false;
        if (window.ChatManager && typeof window.ChatManager.sendDirectTextMessageToUser === 'function') {
          sent = await window.ChatManager.sendDirectTextMessageToUser(targetFriend, messageText);
        } else if (window.ChatManager && typeof window.ChatManager.sendQuizInviteToUser === 'function') {
          sent = await window.ChatManager.sendQuizInviteToUser(targetFriend, state.quizId, state.creatorName);
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

  // ─────────────────────────────────────────────────────────
  // LOCAL STORAGE & PERSISTENCE
  // ─────────────────────────────────────────────────────────
  function _getMySavedQuizzes() {
    try {
      const str = localStorage.getItem('cm_my_quizzes');
      return str ? JSON.parse(str) : [];
    } catch(e) {
      return [];
    }
  }

  function _saveQuizLocally(quizObj) {
    const list = _getMySavedQuizzes().filter(q => q.quizId !== quizObj.quizId);
    list.unshift(quizObj);
    try {
      localStorage.setItem('cm_my_quizzes', JSON.stringify(list));
    } catch(e) {}
  }

  function _getQuizLocally(quizId) {
    const list = _getMySavedQuizzes();
    return list.find(q => q.quizId === quizId) || null;
  }

  function _recordAttemptLocally(quizId, attempt) {
    const list = _getMySavedQuizzes();
    const q = list.find(item => item.quizId === quizId);
    if (q) {
      if (!Array.isArray(q.attempts)) q.attempts = [];
      q.attempts.unshift(attempt);
      try {
        localStorage.setItem('cm_my_quizzes', JSON.stringify(list));
      } catch(e) {}
    }
  }

  async function _syncQuizWithSupabase(quizId, adminKey, payload) {
    try {
      if (window.BuddySupabase) {
        const client = window.BuddySupabase.getClient();
        if (client) {
          await client.from('buddy_quizzes').insert([{
            id: quizId,
            creator_name: payload.creatorName,
            admin_key: adminKey,
            questions: payload.questions,
            creator_answers: payload.creatorAnswers
          }]);
        }
      }
    } catch(e) {}
  }

  // ─────────────────────────────────────────────────────────
  // MODAL CONTROLS & URL ROUTING
  // ─────────────────────────────────────────────────────────
  function openGame() {
    state.currentScreen = 'hub';
    openGameModal();
    renderScreen();
  }

  function openShareScreen(quizId) {
    state.quizId = quizId;
    const local = _getQuizLocally(quizId);
    if (local) {
      state.adminKey = local.adminKey;
      state.creatorName = local.creatorName;
      state.partnerName = local.partnerName;
    }
    state.currentScreen = 'share';
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
    const coupleId = params.get('couple');
    const adminId = params.get('couple_admin');
    const adminKey = params.get('key');
    const game = params.get('game');

    if (adminId && adminKey) {
      openScoreboard(adminId, adminKey);
    } else if (coupleId) {
      loadQuizForPlaying(coupleId);
    } else if (game === 'couple-match') {
      openGame();
    }
  }

  function init() {
    console.log('💑 [BUDDY Games] Initializing "Couple Match" game engine...');
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
    loadQuizForPlaying,
    openScoreboard,
    openShareScreen,
    checkUrlParams,
    QUESTION_BANK
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
