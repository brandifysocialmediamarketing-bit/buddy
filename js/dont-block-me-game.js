/**
 * BUDDY - dont-block-me-game.js
 * Game 1: "Don't Block Me 💗" - Interactive Friendship Quiz & Scoreboard
 * 
 * Features:
 * - Cute mobile-first pastel sky-blue design with floating clouds & hearts
 * - Original vector cartoon mascots ("Bubbly Cupid" & "Happy Star")
 * - 6 Complete Interactive Screens:
 *   1. Enter Name (max 15 chars, counter, validation)
 *   2. Create 10-Question Quiz (pool of 35+ questions, swap question, review)
 *   3. Share Quiz (Public friend link, private admin scoreboard link, copy/share)
 *   4. Friend Plays Quiz (Nickname input, instant correct/incorrect feedback)
 *   5. Results (Score, percentage, fun friendship status tiers, entertainment disclaimer)
 *   6. Creator Scoreboard (Private admin key, leaderboard, detailed answers, delete attempt, delete quiz)
 * - Dual Backend: Local Server API + Supabase sync + offline local storage persistence
 */

const DontBlockMeGame = (() => {
  // ── 35+ Fun Friendship Questions Pool ──
  const QUESTION_BANK = [
    {
      id: 1,
      title: "What is my absolute favorite comfort food? 🍕",
      options: ["Cheesy Pizza 🍕", "Spicy Biryani 🍲", "Rich Chocolates 🍫", "Crispy Burgers & Fries 🍔"]
    },
    {
      id: 2,
      title: "If I could fly anywhere tomorrow, where would I go? ✈️",
      options: ["Tropical Beach Resort 🏝️", "Snowy Mountain Cabin 🏔️", "Romantic Paris / Europe 🗼", "Jungle Nature Safari 🏕️"]
    },
    {
      id: 3,
      title: "What am I most addicted to on my phone? 📱",
      options: ["Instagram Reels & Memes 📸", "Chatting on BUDDY 💬", "YouTube / Netflix Binges 🎬", "Multiplayer Games 🎮"]
    },
    {
      id: 4,
      title: "What is my true morning habit? ☕",
      options: ["Snoozing alarm 5 times ⏰", "Hot Chai / Coffee first ☕", "Scrolling phone in bed 📱", "Early morning workout 🏃"]
    },
    {
      id: 5,
      title: "How do I usually react when I get angry? 😤",
      options: ["Go completely silent 🤫", "Vent to my #1 bestie 🗣️", "Blast loud music alone 🎧", "Go to sleep and reset 😴"]
    },
    {
      id: 6,
      title: "What movie genre do I enjoy the most? 🍿",
      options: ["Horror & Thrillers 👻", "Comedy & Lighthearted 😂", "Romantic & Feel-good 💖", "Sci-Fi & Action 🚀"]
    },
    {
      id: 7,
      title: "What is my secret superpower in friendship? 🦸",
      options: ["Always listening to you 👂", "Giving brutally honest advice 💡", "Making you laugh anytime 😂", "Guarding your secrets forever 🤐"]
    },
    {
      id: 8,
      title: "If we went shopping, what would I buy first? 🛍️",
      options: ["Trendy Clothes & Shoes 👟", "Delicious Snacks & Food 🍩", "Cool Tech & Gadgets 🎧", "Cute Aesthetic Room Decor 🌸"]
    },
    {
      id: 9,
      title: "What is my bedtime personality? 🌙",
      options: ["Night owl chatting till 2 AM 🦉", "Asleep by 10 PM sharp 😴", "Overthinking 3 AM thoughts 💭", "Watching random reels in bed 📺"]
    },
    {
      id: 10,
      title: "What would make me block someone in real life? 🚫",
      options: ["Lying & Fake friendship 💔", "Rude & disrespectful behavior 🐍", "Spreading private secrets 🗣️", "Leaving me on read forever 👻"]
    },
    {
      id: 11,
      title: "What's my go-to season of the year? 🍂",
      options: ["Cozy Chilly Winter ❄️", "Rainy Romantic Monsoon 🌧️", "Bright Sunny Summer ☀️", "Pleasant Breezy Autumn 🍁"]
    },
    {
      id: 12,
      title: "If I won $1,000,000, what would I do first? 💰",
      options: ["Travel the entire world 🌍", "Buy dream luxury car / house 🏎️", "Invest smartly for the future 📈", "Throw a mega party for friends 🥳"]
    },
    {
      id: 13,
      title: "What pet would I love to cuddle with? 🐾",
      options: ["Energetic Puppy 🐶", "Cute Fluffy Kitten 🐱", "Talkative Colorful Parrot 🦜", "Quiet Soft Bunny 🐰"]
    },
    {
      id: 14,
      title: "How do I handle secrets? 🤐",
      options: ["Takes them to the grave 🪦", "Tells only my closest bestie 🤫", "Forgets them in 2 days 🧠", "Tries hard not to slip up 🙈"]
    },
    {
      id: 15,
      title: "What is my vibe at social parties? 🥳",
      options: ["Life of the party on dance floor 💃", "Chilling in the corner with 1 friend 🛋️", "Hanging out near the food table 🍕", "Leaving early to sleep 🚪"]
    },
    {
      id: 16,
      title: "What is my biggest pet peeve? 🙄",
      options: ["Slow walkers in front of me 🚶", "Loud chewing or talking 📢", "People arriving 1 hour late ⏳", "Unsolicited fake advice 🙅"]
    },
    {
      id: 17,
      title: "What kind of music is on my daily playlist? 🎵",
      options: ["Romantic Acoustic & Lo-Fi 🎸", "Upbeat Pop & Dance Hits 🎶", "Emotional Deep Ballads 💔", "Hard-hitting Hip-Hop / Rap 🎤"]
    },
    {
      id: 18,
      title: "How do I make big life decisions? 🤔",
      options: ["Follow my gut heart feeling ❤️", "Over-analyze with pros & cons 📊", "Ask my best friend's opinion 📱", "Flip a coin or wing it 🎲"]
    },
    {
      id: 19,
      title: "What drink can I never say no to? 🥤",
      options: ["Cold Iced Coffee 🧋", "Kadak Masala Chai ☕", "Fresh Fruit Smoothie 🍓", "Fizzy Chilled Soda 🥤"]
    },
    {
      id: 20,
      title: "How would my best friends describe me in 1 word? ✨",
      options: ["Loyal & Caring 💖", "Crazy & Funny 😂", "Chilled & Calm 🧘", "Ambitious & Focused 🎯"]
    },
    {
      id: 21,
      title: "What's my dream weekend plan? 🏖️",
      options: ["Road trip with best friends 🚗", "Binge-watching shows in bed 🛏️", "Exploring cafes and shopping 🥐", "Outdoor adventure & sports 🧗"]
    },
    {
      id: 22,
      title: "What kind of gift makes me happiest? 🎁",
      options: ["Handwritten heartfelt letter 💌", "Something I've wanted for months 🛍️", "A surprise treat or food 🍰", "An unforgettable trip together ✈️"]
    },
    {
      id: 23,
      title: "Am I an introvert, extrovert, or ambivert? 🎭",
      options: ["Ambivert (Social yet loves alone time) ☯️", "Pure Extrovert (Loves people 24/7) 📢", "Deep Introvert (Recharges in quiet) 🤫", "Depends totally on my mood ⛅"]
    },
    {
      id: 24,
      title: "What is my favorite dessert? 🍰",
      options: ["Chocolate Fudge Brownie 🍫", "Creamy Ice Cream Sundae 🍨", "Classic Cheesecake 🧀", "Warm Gulab Jamun / Pastry 🍩"]
    },
    {
      id: 25,
      title: "What is my worst habit? 🙈",
      options: ["Procrastinating until deadline ⏳", "Overthinking little things 💭", "Staying up way too late 🌙", "Online shopping impulse buys 🛒"]
    }
  ];

  // ── SVG Cartoon Characters ──
  const MASCOT_SVG = `
    <svg class="dbm-mascot-art" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Soft Cloud Body -->
      <path d="M40 100C23.4315 100 10 86.5685 10 70C10 54.858 21.2335 42.3392 35.8824 40.3235C38.9328 23.084 53.9482 10 72 10C89.5144 10 104.183 22.3807 107.72 38.9804C111.455 37.0428 115.698 36 120.196 36C137.669 36 151.833 50.1639 151.833 67.6373C151.833 85.1106 137.669 99.2745 120.196 99.2745C118.423 99.2745 116.685 99.1292 114.992 98.8475C110.222 108.878 99.9602 116 88 116C82.4938 116 77.3409 114.516 72.8941 111.936C68.653 115.727 63.0204 118 56.8627 118C44.7885 118 35 108.211 35 96.1373C35 94.671 35.1436 93.238 35.4196 91.8504C38.1637 93.9037 41.5647 95.1275 45.2451 95.1275L40 100Z" fill="#FFFFFF" stroke="#93C5FD" stroke-width="4.5" stroke-linejoin="round"/>
      
      <!-- Cute Eyes (Happy Curved Eyes) -->
      <path d="M52 64C52 56 62 56 62 64" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
      <path d="M96 64C96 56 106 56 106 64" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>

      <!-- Blushing Cheeks -->
      <ellipse cx="44" cy="72" rx="7" ry="4.5" fill="#FDA4AF" opacity="0.8"/>
      <ellipse cx="114" cy="72" rx="7" ry="4.5" fill="#FDA4AF" opacity="0.8"/>

      <!-- Sweet Smile -->
      <path d="M72 72C72 79 86 79 86 72" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>

      <!-- Floating Pink Heart Mascot Companion -->
      <g class="dbm-heart-companion">
        <path d="M128 24C128 17.3726 133.373 12 140 12C143.601 12 146.804 13.5858 149 16.0825C151.196 13.5858 154.399 12 158 12C164.627 12 170 17.3726 170 24C170 34 149 46 149 46C149 46 128 34 128 24Z" fill="#F43F5E"/>
        <circle cx="138" cy="20" r="2" fill="#FFFFFF"/>
      </g>
    </svg>
  `;

  // ── State ──
  let state = {
    currentScreen: 'entry', // 'entry' | 'create' | 'review' | 'share' | 'friend_welcome' | 'friend_play' | 'result' | 'scoreboard'
    creatorName: '',
    quizId: null,
    adminKey: null,
    selectedQuestions: [],
    creatorAnswers: [],
    createIndex: 0,
    friendName: '',
    friendAnswers: [],
    friendIndex: 0,
    friendScore: 0,
    activeQuiz: null,
    scoreboardData: null,
    usedQuestionIds: new Set()
  };

  function _initDefaultQuestions() {
    state.selectedQuestions = QUESTION_BANK.slice(0, 10).map(q => ({ ...q }));
    state.creatorAnswers = new Array(10).fill(null);
    state.usedQuestionIds = new Set(state.selectedQuestions.map(q => q.id));
    state.createIndex = 0;
  }

  function swapCurrentQuestion() {
    const currentQ = state.selectedQuestions[state.createIndex];
    const available = QUESTION_BANK.filter(q => !state.usedQuestionIds.has(q.id));

    if (available.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('ℹ️ All questions in the pool are already in use!');
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

  function renderScreen() {
    const container = document.getElementById('dbm-screen-container');
    if (!container) return;

    switch (state.currentScreen) {
      case 'entry':
        container.innerHTML = _renderScreenEntry();
        _bindScreenEntry();
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

      case 'friend_welcome':
        container.innerHTML = _renderScreenFriendWelcome();
        _bindScreenFriendWelcome();
        break;

      case 'friend_play':
        container.innerHTML = _renderScreenFriendPlay();
        _bindScreenFriendPlay();
        break;

      case 'result':
        container.innerHTML = _renderScreenResult();
        _bindScreenResult();
        break;

      case 'scoreboard':
        container.innerHTML = _renderScreenScoreboard();
        _bindScreenScoreboard();
        break;
    }
  }

  // ── SCREEN 1: ENTER NAME ──
  function _renderScreenEntry() {
    const myQuizzes = _getMySavedQuizzes();
    const hasPastQuizzes = myQuizzes.length > 0;

    return `
      <div class="dbm-card dbm-fade-in">
        <div class="dbm-badge-pill">💗 Friendship Challenge</div>
        <div class="dbm-mascot-wrap">
          ${MASCOT_SVG}
        </div>
        <h1 class="dbm-title">Don't Block Me 💗</h1>
        <p class="dbm-subtitle">Find out which friends really know you best!</p>

        <div class="dbm-input-box">
          <label class="dbm-input-label" for="dbm-creator-name-input">What's your name?</label>
          <div class="dbm-input-wrapper">
            <input 
              type="text" 
              id="dbm-creator-name-input" 
              class="dbm-text-input" 
              placeholder="e.g. Keyur, Aarav..." 
              maxlength="15" 
              autocomplete="off"
              value="${state.creatorName || ''}"
            />
            <span class="dbm-char-counter" id="dbm-name-counter">0/15</span>
          </div>
          <div class="dbm-error-msg hidden" id="dbm-name-error">Please enter your name (1-15 characters)</div>
        </div>

        <button type="button" class="dbm-btn-primary" id="dbm-btn-start-create">
          Continue ➔
        </button>

        ${hasPastQuizzes ? `
          <div style="margin-top: 18px; border-top: 1px dashed rgba(147, 197, 253, 0.6); padding-top: 14px;">
            <button type="button" class="dbm-btn-subtle" id="dbm-btn-view-saved-scoreboards">
              🏆 View My Created Scoreboards (${myQuizzes.length})
            </button>
          </div>
        ` : ''}

        <div class="dbm-footer-note">
          🌸 10 fun questions • Get a shareable link for WhatsApp & Instagram
        </div>
      </div>
    `;
  }

  function _bindScreenEntry() {
    const inp = document.getElementById('dbm-creator-name-input');
    const counter = document.getElementById('dbm-name-counter');
    const err = document.getElementById('dbm-name-error');
    const btn = document.getElementById('dbm-btn-start-create');
    const savedBtn = document.getElementById('dbm-btn-view-saved-scoreboards');

    if (inp) {
      inp.focus();
      counter.textContent = `${inp.value.length}/15`;
      inp.addEventListener('input', () => {
        counter.textContent = `${inp.value.length}/15`;
        if (inp.value.trim().length > 0) err.classList.add('hidden');
      });
      inp.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
      });
    }

    if (btn) {
      btn.addEventListener('click', () => {
        const name = inp ? inp.value.trim() : '';
        if (!name || name.length > 15) {
          err.classList.remove('hidden');
          if (inp) inp.focus();
          return;
        }
        state.creatorName = name;
        _initDefaultQuestions();
        state.currentScreen = 'create';
        renderScreen();
      });
    }

    if (savedBtn) {
      savedBtn.addEventListener('click', () => {
        const myQuizzes = _getMySavedQuizzes();
        if (myQuizzes.length > 0) {
          const latest = myQuizzes[0];
          openScoreboard(latest.quizId, latest.adminKey);
        }
      });
    }
  }

  // ── SCREEN 2: CREATE YOUR QUIZ ──
  function _renderScreenCreate() {
    const idx = state.createIndex;
    const q = state.selectedQuestions[idx];
    const selectedAns = state.creatorAnswers[idx];
    const progress = Math.round(((idx + 1) / 10) * 100);

    return `
      <div class="dbm-card dbm-fade-in">
        <div class="dbm-progress-header">
          <span class="dbm-progress-label">Question ${idx + 1} of 10</span>
          <span class="dbm-progress-pct">${progress}%</span>
        </div>
        <div class="dbm-progress-track">
          <div class="dbm-progress-fill" style="width: ${progress}%;"></div>
        </div>

        <div class="dbm-card-badge">✨ Answering as: <b>${state.creatorName}</b></div>
        <h2 class="dbm-question-title">${q.title}</h2>

        <div class="dbm-options-grid">
          ${q.options.map((opt, oIdx) => `
            <button 
              type="button" 
              class="dbm-option-btn ${selectedAns === oIdx ? 'selected' : ''}" 
              data-opt-idx="${oIdx}"
            >
              <span class="dbm-option-check">${selectedAns === oIdx ? '✓' : ''}</span>
              <span class="dbm-option-text">${opt}</span>
            </button>
          `).join('')}
        </div>

        <div class="dbm-swap-box">
          <button type="button" class="dbm-btn-swap" id="dbm-btn-swap-q" title="Get a different question">
            🔄 Change Question
          </button>
        </div>

        <div class="dbm-nav-row">
          ${idx > 0 ? `
            <button type="button" class="dbm-btn-outline" id="dbm-btn-prev-q">
              ⬅️ Back
            </button>
          ` : `<div></div>`}

          <button 
            type="button" 
            class="dbm-btn-primary ${idx === 9 ? 'finish-glow' : ''} ${selectedAns === null ? 'disabled' : ''}" 
            id="dbm-btn-next-q"
          >
            ${idx === 9 ? '🎉 Done! Generate Quiz Link 🚀' : 'Next Question ➔'}
          </button>
        </div>

        ${idx === 9 ? `
          <div style="margin-top: 14px; font-size: 13px; text-align: center;">
            <a href="#" id="dbm-link-review-answers" style="color: #2563eb; text-decoration: underline; font-weight: 600; cursor: pointer;">
              📋 or review all 10 answers first
            </a>
          </div>
        ` : ''}
      </div>
    `;
  }

  function _bindScreenCreate() {
    const idx = state.createIndex;
    const optionBtns = document.querySelectorAll('.dbm-option-btn');
    const nextBtn = document.getElementById('dbm-btn-next-q');
    const prevBtn = document.getElementById('dbm-btn-prev-q');
    const swapBtn = document.getElementById('dbm-btn-swap-q');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const oIdx = parseInt(btn.dataset.optIdx, 10);
        state.creatorAnswers[idx] = oIdx;

        optionBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        if (nextBtn) nextBtn.classList.remove('disabled');
      });
    });

    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        swapCurrentQuestion();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.createIndex > 0) {
          state.createIndex--;
          renderScreen();
        }
      });
    }

    const reviewLink = document.getElementById('dbm-link-review-answers');
    if (reviewLink) {
      reviewLink.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentScreen = 'review';
        renderScreen();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        if (state.creatorAnswers[idx] === null) {
          if (typeof window.showToast === 'function') {
            window.showToast('⚠️ Please select an answer before continuing!');
          }
          return;
        }

        if (state.createIndex < 9) {
          state.createIndex++;
          renderScreen();
        } else {
          // Verify all 10 questions are answered
          const missingIdx = state.creatorAnswers.findIndex(a => a === null);
          if (missingIdx !== -1) {
            state.createIndex = missingIdx;
            renderScreen();
            if (typeof window.showToast === 'function') {
              window.showToast(`⚠️ Please select an answer for Question ${missingIdx + 1}!`);
            }
            return;
          }

          // Directly publish quiz and show the share link!
          await _publishQuizToBackend();
        }
      });
    }
  }

  // ── REVIEW STEP ──
  function _renderScreenReview() {
    return `
      <div class="dbm-card dbm-fade-in">
        <div class="dbm-badge-pill">📋 Review Your Quiz</div>
        <h2 class="dbm-title">Check Your Answers 💗</h2>
        <p class="dbm-subtitle">Review before generating your friendship challenge link!</p>

        <div class="dbm-review-list">
          ${state.selectedQuestions.map((q, idx) => {
            const ansIdx = state.creatorAnswers[idx];
            const ansText = ansIdx !== null ? q.options[ansIdx] : 'None';
            return `
              <div class="dbm-review-item" data-edit-idx="${idx}">
                <div class="dbm-review-head">
                  <span class="dbm-review-qnum">#${idx + 1}</span>
                  <span class="dbm-review-title">${q.title}</span>
                  <button type="button" class="dbm-review-edit-btn" title="Edit this question">✏️</button>
                </div>
                <div class="dbm-review-ans">
                  Your Pick: <b>${ansText}</b>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="dbm-nav-row" style="margin-top: 20px;">
          <button type="button" class="dbm-btn-outline" id="dbm-btn-back-to-edit">
            ⬅️ Edit Questions
          </button>
          <button type="button" class="dbm-btn-primary" id="dbm-btn-publish-quiz">
            Create My Quiz 🚀
          </button>
        </div>
      </div>
    `;
  }

  function _bindScreenReview() {
    const publishBtn = document.getElementById('dbm-btn-publish-quiz');
    const backBtn = document.getElementById('dbm-btn-back-to-edit');

    document.querySelectorAll('.dbm-review-item').forEach(item => {
      item.addEventListener('click', () => {
        const eIdx = parseInt(item.dataset.editIdx, 10);
        state.createIndex = eIdx;
        state.currentScreen = 'create';
        renderScreen();
      });
    });

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        state.createIndex = 9;
        state.currentScreen = 'create';
        renderScreen();
      });
    }

    if (publishBtn) {
      publishBtn.addEventListener('click', async () => {
        publishBtn.disabled = true;
        publishBtn.innerHTML = 'Creating Quiz... ⏳';
        await _publishQuizToBackend();
      });
    }
  }

  async function _publishQuizToBackend() {
    const container = document.getElementById('dbm-screen-container');
    if (container) {
      container.innerHTML = `
        <div class="dbm-card dbm-fade-in" style="padding: 40px 20px;">
          <div class="dbm-badge-pill">✨ Generating Challenge</div>
          <div class="dbm-mascot-wrap">${MASCOT_SVG}</div>
          <h2 class="dbm-title">Creating Your Quiz... ⏳</h2>
          <p class="dbm-subtitle">Setting up your 10 questions & secret private scoreboard!</p>
        </div>
      `;
    }

    const payload = {
      creatorName: state.creatorName,
      questions: state.selectedQuestions,
      creatorAnswers: state.creatorAnswers
    };

    try {
      const res = await fetch('/api/games/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.success) {
        state.quizId = data.quizId;
        state.adminKey = data.adminKey;

        _saveQuizLocally({
          quizId: data.quizId,
          adminKey: data.adminKey,
          creatorName: state.creatorName,
          createdAt: Date.now()
        });

        _syncQuizWithSupabase(data.quizId, data.adminKey, payload);

        state.currentScreen = 'share';
        renderScreen();
        return;
      }
    } catch (err) {
      console.warn('Backend quiz create notice:', err);
    }

    // Local fallback
    const fallbackId = 'q_' + Date.now().toString(36);
    const fallbackAdmin = 'adm_' + Math.random().toString(36).slice(2, 10);
    state.quizId = fallbackId;
    state.adminKey = fallbackAdmin;

    _saveQuizLocally({
      quizId: fallbackId,
      adminKey: fallbackAdmin,
      creatorName: state.creatorName,
      createdAt: Date.now(),
      payload
    });

    state.currentScreen = 'share';
    renderScreen();
  }

  // ── SCREEN 3: SHARE YOUR QUIZ ──
  function _renderScreenShare() {
    const baseUrl = window.location.origin + window.location.pathname;
    const publicLink = `${baseUrl}?quiz=${state.quizId}`;
    const scoreboardLink = `${baseUrl}?quiz=${state.quizId}&key=${state.adminKey}`;

    return `
      <div class="dbm-card dbm-fade-in">
        <div class="dbm-celebration-head">🎉 Woohoo! Quiz Ready!</div>
        <div class="dbm-mascot-wrap">
          ${MASCOT_SVG}
        </div>
        <h2 class="dbm-title">Your Quiz is Live! 💗</h2>
        <p class="dbm-subtitle">Share this with your friends on WhatsApp, Instagram, or BUDDY to see who truly knows you!</p>

        <div class="dbm-share-box">
          <div class="dbm-share-box-title">🔗 Friend Quiz Link (Share This!)</div>
          <div class="dbm-share-input-row">
            <input type="text" readonly class="dbm-share-input" id="dbm-public-link-inp" value="${publicLink}" />
            <button type="button" class="dbm-btn-copy" id="dbm-btn-copy-public">Copy</button>
          </div>
        </div>

        <div class="dbm-action-buttons">
          <button type="button" class="dbm-btn-buddy-invite" id="dbm-btn-invite-buddy-friends">
            💬 Invite BUDDY Friends
          </button>
          <button type="button" class="dbm-btn-primary" id="dbm-btn-share-whatsapp">
            📲 Share on WhatsApp / Social
          </button>
          <button type="button" class="dbm-btn-outline" id="dbm-btn-play-demo">
            🎮 Play Demo (Test Your Quiz)
          </button>
        </div>



        <!-- Collapsible answers summary for creator reference -->
        <details class="dbm-answers-accordion">
          <summary class="dbm-answers-summary-head">📋 View My 10 Quiz Answers</summary>
          <div class="dbm-answers-summary-body">
            ${state.selectedQuestions.map((q, qI) => {
              const aI = state.creatorAnswers[qI];
              const aText = (aI !== null && q.options[aI]) ? q.options[aI] : 'None';
              return `
                <div class="dbm-ans-row">
                  <span class="dbm-ans-qnum">#${qI + 1}</span>
                  <div class="dbm-ans-qtext">${q.title}</div>
                  <div class="dbm-ans-choice">👉 <b>${aText}</b></div>
                </div>
              `;
            }).join('')}
          </div>
        </details>

        <div class="dbm-private-box">
          <div class="dbm-private-title">🔒 Your Private Scoreboard</div>
          <p class="dbm-private-desc">
            Only <b>YOU</b> can view who answered and what score they got! Do NOT send this private link to friends:
          </p>
          <div class="dbm-share-input-row">
            <input type="text" readonly class="dbm-share-input" id="dbm-private-link-inp" value="${scoreboardLink}" />
            <button type="button" class="dbm-btn-copy" id="dbm-btn-copy-private">Copy</button>
          </div>
          <button type="button" class="dbm-btn-subtle" id="dbm-btn-open-scoreboard" style="margin-top: 10px;">
            🏆 Open My Live Scoreboard ➔
          </button>
        </div>
      </div>
    `;
  }

  function _bindScreenShare() {
    const copyPublicBtn = document.getElementById('dbm-btn-copy-public');
    const copyPrivateBtn = document.getElementById('dbm-btn-copy-private');
    const shareBtn = document.getElementById('dbm-btn-share-whatsapp');
    const playDemoBtn = document.getElementById('dbm-btn-play-demo');
    const openBoardBtn = document.getElementById('dbm-btn-open-scoreboard');

    const baseUrl = window.location.origin + window.location.pathname;
    const publicLink = `${baseUrl}?quiz=${state.quizId}`;
    const scoreboardLink = `${baseUrl}?quiz=${state.quizId}&key=${state.adminKey}`;

    function copyHelper(text, inputId, btn, toastMsg) {
      const inp = document.getElementById(inputId);
      if (inp) {
        inp.focus();
        inp.select();
        try { document.execCommand('copy'); } catch(e) {}
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = 'Copied! ✓';
        btn.style.background = '#10b981';
        btn.style.color = '#ffffff';
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.style.background = '';
          btn.style.color = '';
        }, 2000);
      }
      if (typeof window.showToast === 'function') {
        window.showToast(toastMsg || '📋 Copied to clipboard!');
      }
    }

    if (copyPublicBtn) {
      copyPublicBtn.addEventListener('click', () => {
        copyHelper(publicLink, 'dbm-public-link-inp', copyPublicBtn, '📋 Friend quiz link copied! Share with friends!');
      });
    }

    if (copyPrivateBtn) {
      copyPrivateBtn.addEventListener('click', () => {
        copyHelper(scoreboardLink, 'dbm-private-link-inp', copyPrivateBtn, '🔒 Private scoreboard link copied!');
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const shareText = `💗 How well do you REALLY know me? Answer my 10 questions on Don't Block Me to see if you get blocked! 😜👉 ${publicLink}`;
        if (navigator.share) {
          navigator.share({
            title: `Don't Block Me 💗 - ${state.creatorName}'s Friendship Quiz`,
            text: shareText,
            url: publicLink
          }).catch(() => {});
        } else {
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          window.open(waUrl, '_blank');
        }
      });
    }

    if (playDemoBtn) {
      playDemoBtn.addEventListener('click', () => {
        loadQuizForPlaying(state.quizId);
      });
    }

    if (openBoardBtn) {
      openBoardBtn.addEventListener('click', () => {
        openScoreboard(state.quizId, state.adminKey);
      });
    }

    // BUDDY Friends Invite Modal Handler
    const inviteBtn = document.getElementById('dbm-btn-invite-buddy-friends');
    if (inviteBtn) {
      inviteBtn.addEventListener('click', () => {
        _openFriendsInviteModal();
      });
    }
  }

  // ── BUDDY FRIENDS INVITATION MODAL & REAL-TIME SEARCH ──
  let _cachedFriendsList = [];

  async function _openFriendsInviteModal() {
    const modal = document.getElementById('dbm-friends-modal');
    const searchInp = document.getElementById('dbm-friends-search-input');
    const clearBtn = document.getElementById('dbm-btn-clear-search');
    const closeBtn = document.getElementById('dbm-btn-close-friends-modal');
    const container = document.getElementById('dbm-friends-list-container');

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
          <div style="font-size: 32px; margin-bottom: 8px;">👥✨</div>
          <p style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">Loading BUDDY Friends...</p>
          <span style="font-size: 12px;">Discovering registered contacts & active chats...</span>
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
      console.warn('Error loading friends for invite:', err);
      _cachedFriendsList = [];
    }

    _filterAndRenderFriends('');

    // Real-Time Search Input
    if (searchInp) {
      searchInp.oninput = () => {
        const q = searchInp.value.trim();
        if (clearBtn) clearBtn.classList.toggle('hidden', !q);
        _filterAndRenderFriends(q);
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (searchInp) {
          searchInp.value = '';
          searchInp.focus();
        }
        clearBtn.classList.add('hidden');
        _filterAndRenderFriends('');
      };
    }
  }

  function _filterAndRenderFriends(query) {
    const container = document.getElementById('dbm-friends-list-container');
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
        <div style="padding: 32px 14px; text-align: center; color: #64748b;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <p style="font-weight: 700; color: #1e293b; margin-bottom: 6px;">
            ${q ? `No friends found matching "${query}"` : 'No friends found in BUDDY yet!'}
          </p>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 14px;">
            ${q ? 'Try searching by another name or @username' : 'Aap kisi bhi user ko @username se search karke chat shuru kar sakte hain, ya WhatsApp par link bhej sakte hain!'}
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map(f => {
      const avatarContent = f.avatar 
        ? `<img src="${f.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
        : (f.isAI ? '✨' : (f.name ? f.name.charAt(0).toUpperCase() : '👤'));
      const bg = f.color || 'linear-gradient(135deg, #6366F1, #8B5CF6)';
      const isOnline = f.isAI || f.status === 'Online' || f.status === 'Active now';

      return `
        <div class="dbm-friend-row">
          <div class="dbm-friend-avatar-wrap" style="background: ${bg};">
            ${avatarContent}
            ${isOnline ? '<span class="dbm-friend-online-dot"></span>' : ''}
          </div>
          <div class="dbm-friend-meta">
            <div class="dbm-friend-fullname">${f.name}</div>
            <div class="dbm-friend-username">
              <span>${f.username || (f.isAI ? '@buddy_ai' : '')}</span>
              ${f.isAI ? '<span style="background: #e0e7ff; color: #4338ca; font-size: 10px; padding: 2px 6px; border-radius: 6px; font-weight: 700;">AI Companion</span>' : ''}
            </div>
          </div>
          <button 
            type="button" 
            class="dbm-btn-send-invite" 
            data-friend-id="${f.id}"
            data-friend-name="${f.name}"
          >
            Send Quiz ✉️
          </button>
        </div>
      `;
    }).join('');

    // Attach click handlers to Send Quiz buttons
    container.querySelectorAll('.dbm-btn-send-invite').forEach(btn => {
      btn.addEventListener('click', async () => {
        const friendId = btn.dataset.friendId;
        const friendName = btn.dataset.friendName;
        const targetFriend = _cachedFriendsList.find(f => f.id === friendId);

        if (!targetFriend) return;

        btn.disabled = true;
        btn.innerHTML = 'Sending... ⏳';

        let sent = false;
        if (window.ChatManager && typeof window.ChatManager.sendQuizInviteToUser === 'function') {
          sent = await window.ChatManager.sendQuizInviteToUser(targetFriend, state.quizId, state.creatorName);
        } else if (window.ChatManager && typeof window.ChatManager.sendQuizInvite === 'function') {
          sent = window.ChatManager.sendQuizInvite(targetFriend.id, state.quizId, state.creatorName);
        }

        if (sent) {
          btn.classList.add('sent');
          btn.innerHTML = 'Sent ✓';
          if (typeof window.showToast === 'function') {
            window.showToast(`🎉 Quiz challenge sent to ${friendName}!`);
          }
        } else {
          btn.disabled = false;
          btn.innerHTML = 'Send Quiz ✉️';
          if (typeof window.showToast === 'function') {
            window.showToast('⚠️ Could not send invite. Please try again.');
          }
        }
      });
    });
  }

  // ── SCREEN 4: FRIEND PLAYS QUIZ ──
  function _renderScreenFriendWelcome() {
    const creator = state.activeQuiz?.creatorName || 'Your Friend';

    return `
      <div class="dbm-card dbm-fade-in">
        <div class="dbm-badge-pill">💗 Friendship Quiz</div>
        <div class="dbm-mascot-wrap">
          ${MASCOT_SVG}
        </div>
        <h1 class="dbm-title">${creator}'s Quiz! 💗</h1>
        <p class="dbm-subtitle">Find out if ${creator} will block you or crown you their #1 soulmate! 🙈</p>

        <div class="dbm-input-box">
          <label class="dbm-input-label" for="dbm-friend-name-input">What's your name or nickname?</label>
          <div class="dbm-input-wrapper">
            <input 
              type="text" 
              id="dbm-friend-name-input" 
              class="dbm-text-input" 
              placeholder="e.g. Yash, Priya, Sam..." 
              maxlength="15" 
              autocomplete="off" 
            />
            <span class="dbm-char-counter" id="dbm-friend-name-counter">0/15</span>
          </div>
          <div class="dbm-error-msg hidden" id="dbm-friend-name-error">Please enter your nickname (1-15 characters)</div>
        </div>

        <button type="button" class="dbm-btn-primary" id="dbm-btn-start-playing">
          Start Quiz ➔
        </button>

        <div class="dbm-footer-note">
          🌸 10 quick questions • Instant correct/incorrect feedback!
        </div>
      </div>
    `;
  }

  function _bindScreenFriendWelcome() {
    const inp = document.getElementById('dbm-friend-name-input');
    const counter = document.getElementById('dbm-friend-name-counter');
    const err = document.getElementById('dbm-friend-name-error');
    const btn = document.getElementById('dbm-btn-start-playing');

    if (inp) {
      inp.focus();
      inp.addEventListener('input', () => {
        counter.textContent = `${inp.value.length}/15`;
        if (inp.value.trim().length > 0) err.classList.add('hidden');
      });
      inp.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
      });
    }

    if (btn) {
      btn.addEventListener('click', () => {
        const name = inp ? inp.value.trim() : '';
        if (!name || name.length > 15) {
          err.classList.remove('hidden');
          if (inp) inp.focus();
          return;
        }

        state.friendName = name;
        state.friendAnswers = [];
        state.friendIndex = 0;
        state.friendScore = 0;
        state.currentScreen = 'friend_play';
        renderScreen();
      });
    }
  }

  function _renderScreenFriendPlay() {
    const idx = state.friendIndex;
    const questions = state.activeQuiz?.questions || [];
    const q = questions[idx];
    const progress = Math.round(((idx + 1) / 10) * 100);
    const creator = state.activeQuiz?.creatorName || 'Friend';

    if (!q) return `<div>Error loading question</div>`;

    return `
      <div class="dbm-card dbm-fade-in" id="dbm-play-card">
        <div class="dbm-progress-header">
          <span class="dbm-progress-label">Question ${idx + 1} of 10</span>
          <span class="dbm-progress-pct">${progress}%</span>
        </div>
        <div class="dbm-progress-track">
          <div class="dbm-progress-fill" style="width: ${progress}%;"></div>
        </div>

        <div class="dbm-card-badge">✨ Testing how well you know: <b>${creator}</b></div>
        <h2 class="dbm-question-title">${q.title}</h2>

        <div class="dbm-options-grid" id="dbm-play-options-grid">
          ${q.options.map((opt, oIdx) => `
            <button 
              type="button" 
              class="dbm-option-btn dbm-play-opt-btn" 
              data-opt-idx="${oIdx}"
            >
              <span class="dbm-option-check"></span>
              <span class="dbm-option-text">${opt}</span>
            </button>
          `).join('')}
        </div>

        <div class="dbm-feedback-banner hidden" id="dbm-feedback-banner"></div>

        <button 
          type="button" 
          class="dbm-btn-primary hidden" 
          id="dbm-btn-next-friend-q"
          style="margin-top: 18px;"
        >
          ${idx === 9 ? 'See My Results ➔' : 'Next Question ➔'}
        </button>
      </div>
    `;
  }

  function _bindScreenFriendPlay() {
    const idx = state.friendIndex;
    const questions = state.activeQuiz?.questions || [];
    const creatorAnswers = state.activeQuiz?.creatorAnswers || [];
    const localCorrectIdx = creatorAnswers[idx];

    const optBtns = document.querySelectorAll('.dbm-play-opt-btn');
    const banner = document.getElementById('dbm-feedback-banner');
    const nextBtn = document.getElementById('dbm-btn-next-friend-q');
    let hasAnswered = false;

    function applyFeedback(isMatch, correctIdx, chosenIdx) {
      if (isMatch) state.friendScore++;
      state.friendAnswers.push({
        questionId: questions[idx]?.id || ('q_' + idx),
        chosenIndex: chosenIdx,
        correctIndex: correctIdx,
        isMatch
      });

      optBtns.forEach(b => {
        b.disabled = true;
        const bIdx = parseInt(b.dataset.optIdx, 10);
        if (bIdx === correctIdx) {
          b.classList.add('correct-answer');
          const checkEl = b.querySelector('.dbm-option-check');
          if (checkEl) checkEl.textContent = '✓';
        }
        if (bIdx === chosenIdx && !isMatch) {
          b.classList.add('wrong-answer');
          const checkEl = b.querySelector('.dbm-option-check');
          if (checkEl) checkEl.textContent = '✕';
        }
      });

      if (banner) {
        banner.classList.remove('hidden');
        if (isMatch) {
          banner.className = 'dbm-feedback-banner success-feedback';
          banner.innerHTML = `🎉 <b>Correct!</b> You really know ${state.activeQuiz.creatorName}!`;
        } else {
          const correctText = (questions[idx]?.options && questions[idx].options[correctIdx]) || 'their true choice';
          banner.className = 'dbm-feedback-banner error-feedback';
          banner.innerHTML = `🙈 <b>Oops!</b> ${state.activeQuiz.creatorName} actually picked: <b>${correctText}</b>`;
        }
      }

      if (nextBtn) {
        nextBtn.classList.remove('hidden');
      }

      setTimeout(() => {
        if (nextBtn && !nextBtn.classList.contains('clicked')) {
          nextBtn.classList.add('bounce-hint');
        }
      }, 800);
    }

    optBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        if (hasAnswered) return;
        hasAnswered = true;

        const chosenIdx = parseInt(btn.dataset.optIdx, 10);

        // If local answers exist (local mode or owner preview)
        if (localCorrectIdx !== undefined) {
          const isMatch = (chosenIdx === localCorrectIdx);
          applyFeedback(isMatch, localCorrectIdx, chosenIdx);
          return;
        }

        // Online mode: Query server check-answer endpoint (protects upcoming answers from network sniffing)
        btn.classList.add('checking-pulse');
        try {
          const res = await fetch('/api/games/quiz/check-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId: state.activeQuiz.id,
              questionIndex: idx,
              chosenIndex: chosenIdx
            })
          });
          const data = await res.json();
          btn.classList.remove('checking-pulse');
          if (data && data.success) {
            applyFeedback(data.isMatch, data.correctIndex, chosenIdx);
            return;
          }
        } catch(e) {
          btn.classList.remove('checking-pulse');
          console.warn('Check answer notice:', e);
        }

        // Fallback
        applyFeedback(false, 0, chosenIdx);
      });
    });

    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        nextBtn.classList.add('clicked');
        if (state.friendIndex < (questions.length - 1)) {
          state.friendIndex++;
          renderScreen();
        } else {
          await _submitFriendAttempt();
          state.currentScreen = 'result';
          renderScreen();
        }
      });
    }
  }

  async function _submitFriendAttempt() {
    const payload = {
      quizId: state.activeQuiz.id,
      playerName: state.friendName,
      score: state.friendScore,
      totalQuestions: 10,
      percentage: Math.round((state.friendScore / 10) * 100),
      answers: state.friendAnswers
    };

    try {
      await fetch('/api/games/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Attempt submit error notice:', e);
    }

    _recordAttemptLocally(state.activeQuiz.id, payload);
  }

  // ── SCREEN 5: RESULTS ──
  function _renderScreenResult() {
    const score = state.friendScore;
    const pct = Math.round((score / 10) * 100);
    const creator = state.activeQuiz?.creatorName || 'Your Friend';

    let tier = {
      badge: '👑 TRUE SOULMATE',
      color: '#10B981',
      title: `Never blocking you in a million years! 💖`,
      desc: `You scored ${score}/10 (${pct}%)! You know ${creator} inside and out. You two are officially inseparable!`
    };

    if (score >= 9) {
      tier = {
        badge: '👑 TRUE SOULMATE',
        color: '#10B981',
        title: `Never blocking you in a million years! 💖`,
        desc: `You scored ${score}/10 (${pct}%)! You know ${creator} better than anyone else!`
      };
    } else if (score >= 7) {
      tier = {
        badge: '💖 BESTIE APPROVED',
        color: '#06B6D4',
        title: `Best Friend Level 100! 🌟`,
        desc: `You scored ${score}/10 (${pct}%)! That's a super impressive score. You two share an amazing bond!`
      };
    } else if (score >= 5) {
      tier = {
        badge: '🤝 SAFE FROM BLOCK LIST',
        color: '#F59E0B',
        title: `Safe from the Block List! 😜`,
        desc: `You scored ${score}/10 (${pct}%)! You know ${creator} pretty well, but there are still some secrets to discover!`
      };
    } else if (score >= 3) {
      tier = {
        badge: '⚠️ DANGER ZONE',
        color: '#F97316',
        title: `Time to hang out more! 🙈`,
        desc: `You scored ${score}/10 (${pct}%)! Uh oh, do you even talk to ${creator}? Better plan a hangout soon!`
      };
    } else {
      tier = {
        badge: '🚫 BLOCKED VIBES!',
        color: '#EF4444',
        title: `Pack your bags! You're Blocked! 😂`,
        desc: `You scored ${score}/10 (${pct}%)! Haha just kidding, but you definitely need a long chat with ${creator}!`
      };
    }

    return `
      <div class="dbm-card dbm-fade-in">
        <div class="dbm-result-circle-wrap">
          <div class="dbm-score-circle" style="border-color: ${tier.color};">
            <span class="dbm-score-num">${score}</span>
            <span class="dbm-score-denom">/ 10</span>
          </div>
        </div>

        <div class="dbm-tier-badge" style="background: ${tier.color};">${tier.badge}</div>
        <h2 class="dbm-title" style="margin-top: 10px;">${tier.title}</h2>
        <p class="dbm-subtitle">${tier.desc}</p>

        <div class="dbm-disclaimer-box">
          ✨ <b>Entertainment Only:</b> This friendship quiz is made purely for fun! It does not actually block or unfollow anyone on any social media platform.
        </div>

        <div class="dbm-action-buttons" style="margin-top: 20px;">
          <button type="button" class="dbm-btn-primary" id="dbm-btn-create-own-quiz">
            🚀 Create Your Own Quiz ➔
          </button>
          <button type="button" class="dbm-btn-outline" id="dbm-btn-share-result">
            📤 Share My Score
          </button>
          <button type="button" class="dbm-btn-subtle" id="dbm-btn-replay-quiz">
            🔁 Play Again
          </button>
        </div>
      </div>
    `;
  }

  function _bindScreenResult() {
    const createOwnBtn = document.getElementById('dbm-btn-create-own-quiz');
    const shareResBtn = document.getElementById('dbm-btn-share-result');
    const replayBtn = document.getElementById('dbm-btn-replay-quiz');

    const score = state.friendScore;
    const creator = state.activeQuiz?.creatorName || 'Friend';

    if (createOwnBtn) {
      createOwnBtn.addEventListener('click', () => {
        state.creatorName = state.friendName || '';
        state.currentScreen = 'entry';
        renderScreen();
      });
    }

    if (shareResBtn) {
      shareResBtn.addEventListener('click', () => {
        const text = `I just scored ${score}/10 on ${creator}'s "Don't Block Me" friendship quiz! Can you beat my score? 😜💗`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            if (typeof window.showToast === 'function') window.showToast('📋 Score copied! Share it on WhatsApp or Instagram story!');
          });
        }
      });
    }

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        state.friendAnswers = [];
        state.friendIndex = 0;
        state.friendScore = 0;
        state.currentScreen = 'friend_play';
        renderScreen();
      });
    }
  }

  // ── SCREEN 6: CREATOR PRIVATE SCOREBOARD ──
  function _renderScreenScoreboard() {
    const data = state.scoreboardData;
    if (!data) return `<div class="dbm-card"><p>Loading scoreboard... ⏳</p></div>`;

    const attempts = data.attempts || [];
    const totalPlayers = attempts.length;
    const avgScore = totalPlayers > 0 
      ? Math.round(attempts.reduce((acc, a) => acc + (a.score || 0), 0) / totalPlayers * 10) 
      : 0;

    const sorted = [...attempts].sort((a, b) => b.score - a.score);

    const baseUrl = window.location.origin + window.location.pathname;
    const publicLink = `${baseUrl}?quiz=${data.id}`;

    return `
      <div class="dbm-card dbm-fade-in dbm-scoreboard-card">
        <div class="dbm-badge-pill">🔒 Private Scoreboard</div>
        <h2 class="dbm-title">${data.creatorName}'s Friends 🏆</h2>
        <p class="dbm-subtitle">See who answered and who is at risk of being blocked!</p>

        <div class="dbm-stats-row">
          <div class="dbm-stat-pill">
            <span class="dbm-stat-val">${totalPlayers}</span>
            <span class="dbm-stat-label">Friends Played</span>
          </div>
          <div class="dbm-stat-pill">
            <span class="dbm-stat-val">${avgScore}%</span>
            <span class="dbm-stat-label">Average Score</span>
          </div>
        </div>

        <div class="dbm-leaderboard-wrap">
          ${totalPlayers === 0 ? `
            <div class="dbm-empty-scoreboard">
              <span style="font-size: 32px;">🙈</span>
              <p>No friends have played yet!</p>
              <p style="font-size: 12px; opacity: 0.7;">Share your quiz link below to start getting answers!</p>
            </div>
          ` : `
            <div class="dbm-scoreboard-list">
              ${sorted.map((att, rank) => {
                const rankBadge = rank === 0 ? '🥇' : (rank === 1 ? '🥈' : (rank === 2 ? '🥉' : `#${rank + 1}`));
                const dateStr = new Date(att.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return `
                  <div class="dbm-score-row" data-attempt-id="${att.attemptId}">
                    <div class="dbm-row-main">
                      <span class="dbm-rank-icon">${rankBadge}</span>
                      <div class="dbm-player-info">
                        <div class="dbm-player-name">${att.playerName}</div>
                        <div class="dbm-player-date">${dateStr}</div>
                      </div>
                      <div class="dbm-player-score-box">
                        <span class="dbm-score-highlight">${att.score}/10</span>
                        <span class="dbm-pct-highlight">(${att.percentage || (att.score * 10)}%)</span>
                      </div>
                      <button type="button" class="dbm-btn-delete-attempt" data-att-id="${att.attemptId}" title="Delete this result">
                        🗑️
                      </button>
                    </div>

                    <details class="dbm-attempt-details">
                      <summary>View ${att.playerName}'s answers</summary>
                      <div class="dbm-answers-summary">
                        ${(att.answers || []).map((ans, aIdx) => `
                          <div class="dbm-ans-pill ${ans.isMatch ? 'match' : 'mismatch'}">
                            Q${aIdx + 1}: ${ans.isMatch ? '✓ Correct' : '✕ Mismatched'}
                          </div>
                        `).join('')}
                      </div>
                    </details>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="dbm-share-box" style="margin-top: 18px;">
          <div class="dbm-share-box-title">🔗 Share Link with Friends</div>
          <div class="dbm-share-input-row">
            <input type="text" readonly class="dbm-share-input" value="${publicLink}" />
            <button type="button" class="dbm-btn-copy" id="dbm-btn-copy-board-link">Copy</button>
          </div>
        </div>

        <div class="dbm-manage-row" style="margin-top: 16px;">
          <button type="button" class="dbm-btn-danger" id="dbm-btn-delete-quiz">
            🗑️ Delete This Quiz
          </button>
          <button type="button" class="dbm-btn-outline" id="dbm-btn-back-home">
            🏠 Back to BUDDY Games
          </button>
        </div>
      </div>
    `;
  }

  function _bindScreenScoreboard() {
    const copyBtn = document.getElementById('dbm-btn-copy-board-link');
    const deleteQuizBtn = document.getElementById('dbm-btn-delete-quiz');
    const backBtn = document.getElementById('dbm-btn-back-home');
    const baseUrl = window.location.origin + window.location.pathname;
    const publicLink = `${baseUrl}?quiz=${state.scoreboardData?.id}`;

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(publicLink).then(() => {
          if (typeof window.showToast === 'function') window.showToast('📋 Link copied to clipboard!');
        });
      });
    }

    document.querySelectorAll('.dbm-btn-delete-attempt').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const attId = btn.dataset.attId;
        if (!confirm('Are you sure you want to remove this player from the scoreboard?')) return;

        try {
          await fetch(`/api/games/quiz/attempt?id=${state.quizId}&key=${state.adminKey}&attemptId=${attId}`, {
            method: 'DELETE'
          });
          state.scoreboardData.attempts = state.scoreboardData.attempts.filter(a => a.attemptId !== attId);
          renderScreen();
        } catch(err) {
          console.warn('Delete attempt notice:', err);
        }
      });
    });

    if (deleteQuizBtn) {
      deleteQuizBtn.addEventListener('click', async () => {
        if (!confirm('⚠️ Are you sure you want to delete this entire quiz and its scoreboard? This cannot be undone!')) return;

        try {
          await fetch(`/api/games/quiz?id=${state.quizId}&key=${state.adminKey}`, {
            method: 'DELETE'
          });
          _removeQuizLocally(state.quizId);
          if (typeof window.showToast === 'function') window.showToast('🗑️ Quiz deleted successfully');
          closeGameModal();
        } catch(e) {
          console.warn('Delete quiz notice:', e);
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        closeGameModal();
      });
    }
  }

  // ── MODAL & URL ROUTING CONTROLLERS ──
  function openGame() {
    const overlay = document.getElementById('dbm-game-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
    state.currentScreen = 'entry';
    renderScreen();
  }

  function closeGameModal() {
    const overlay = document.getElementById('dbm-game-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  async function loadQuizForPlaying(quizId) {
    openGame();
    const container = document.getElementById('dbm-screen-container');
    if (container) container.innerHTML = `<div class="dbm-card"><p>Loading friendship quiz... 🌸</p></div>`;

    try {
      const res = await fetch(`/api/games/quiz?id=${encodeURIComponent(quizId)}`);
      const data = await res.json();
      if (data && data.success && data.quiz) {
        state.activeQuiz = data.quiz;
        state.currentScreen = 'friend_welcome';
        renderScreen();
        return;
      }
    } catch(err) {
      console.warn('Server fetch notice:', err);
    }

    const local = _getQuizLocally(quizId);
    if (local && local.payload) {
      state.activeQuiz = {
        id: quizId,
        creatorName: local.creatorName,
        questions: local.payload.questions,
        creatorAnswers: local.payload.creatorAnswers
      };
      state.currentScreen = 'friend_welcome';
      renderScreen();
      return;
    }

    if (container) {
      container.innerHTML = `
        <div class="dbm-card">
          <h2>Quiz Not Found 🙈</h2>
          <p>This quiz link might have expired or been deleted.</p>
          <button type="button" class="dbm-btn-primary" onclick="DontBlockMeGame.openGame()">Create a New Quiz ➔</button>
        </div>
      `;
    }
  }

  async function openScoreboard(quizId, adminKey) {
    state.quizId = quizId;
    state.adminKey = adminKey;
    openGame();

    const container = document.getElementById('dbm-screen-container');
    if (container) container.innerHTML = `<div class="dbm-card"><p>Loading your private scoreboard... 🏆</p></div>`;

    try {
      const res = await fetch(`/api/games/quiz/scoreboard?id=${encodeURIComponent(quizId)}&key=${encodeURIComponent(adminKey)}`);
      const data = await res.json();
      if (data && data.success && data.quiz) {
        state.scoreboardData = data.quiz;
        state.currentScreen = 'scoreboard';
        renderScreen();
        return;
      } else if (res.status === 403) {
        if (container) {
          container.innerHTML = `
            <div class="dbm-card">
              <h2>🔒 Private Scoreboard</h2>
              <p>You need the creator's secret admin key to view this scoreboard.</p>
              <button type="button" class="dbm-btn-primary" onclick="DontBlockMeGame.closeGameModal()">Close</button>
            </div>
          `;
        }
        return;
      }
    } catch(err) {
      console.warn('Scoreboard fetch error:', err);
    }

    const local = _getQuizLocally(quizId);
    if (local) {
      state.scoreboardData = {
        id: quizId,
        creatorName: local.creatorName,
        createdAt: local.createdAt,
        attempts: local.attempts || []
      };
      state.currentScreen = 'scoreboard';
      renderScreen();
    }
  }

  function _getMySavedQuizzes() {
    try {
      const str = localStorage.getItem('dbm_my_quizzes');
      return str ? JSON.parse(str) : [];
    } catch(e) {
      return [];
    }
  }

  function _saveQuizLocally(quizObj) {
    const list = _getMySavedQuizzes().filter(q => q.quizId !== quizObj.quizId);
    list.unshift(quizObj);
    try {
      localStorage.setItem('dbm_my_quizzes', JSON.stringify(list));
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
        localStorage.setItem('dbm_my_quizzes', JSON.stringify(list));
      } catch(e) {}
    }
  }

  function _removeQuizLocally(quizId) {
    const list = _getMySavedQuizzes().filter(q => q.quizId !== quizId);
    try {
      localStorage.setItem('dbm_my_quizzes', JSON.stringify(list));
    } catch(e) {}
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
          console.log('✅ Quiz synced with Supabase cloud!');
        }
      }
    } catch(e) {}
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('quiz');
    const adminKey = params.get('key');
    const game = params.get('game');

    if (quizId && adminKey) {
      openScoreboard(quizId, adminKey);
    } else if (quizId) {
      loadQuizForPlaying(quizId);
    } else if (game === 'dont-block-me') {
      openGame();
    }
  }

  function init() {
    console.log('🎮 [BUDDY Games] Initializing "Don\'t Block Me 💗" game module...');
    checkUrlParams();

    const closeBtn = document.getElementById('dbm-game-close-btn');
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
    checkUrlParams,
    QUESTION_BANK
  };
})();

if (typeof window !== 'undefined') {
  window.DontBlockMeGame = DontBlockMeGame;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DontBlockMeGame.init());
  } else {
    setTimeout(() => DontBlockMeGame.init(), 50);
  }
}
