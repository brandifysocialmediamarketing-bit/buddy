/**
 * BUDDY - tapes-manager.js (v208)
 * Feature 2 (Inspired by WAF): Tapes 🎥 (Vertical Shorts & Reels Feed)
 * 
 * Capabilities:
 * - Full-screen vertical swipe video player with snap scrolling (TikTok / Reels / WAF style)
 * - Auto-play active video in viewport & pause offscreen videos
 * - Double-tap to like with floating heart burst animation
 * - Interactive like button with live counter & heart sound/vibe
 * - Slide-up Comments sheet (read, post new comments)
 * - Quick Share to 1-on-1 BUDDY Chat (embeds interactive tape card into private message)
 * - Create & Upload Tape (+): Upload MP4/WebM/MOV from phone/PC with caption, music sound, tags
 * - Floating Sound Mute / Unmute toggle
 * - 100% Free (₹0 cost) using Supabase and offline LocalStorage caching
 */

const TapesManager = (() => {
  const STORAGE_KEY = 'buddy_tapes_store_v2';
  const LIKES_KEY = 'buddy_tapes_likes_v1';

  // Starter curated aesthetic, couple, travel & fun tapes
  const INITIAL_TAPES = [
    {
      id: 'tape-1',
      user_id: 'creator-priya',
      user_name: 'Priya Sharma',
      user_username: '@priya_vibe',
      user_avatar: 'assets/avatar-default.svg',
      user_color: '#f43f5e',
      is_verified: true,
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      caption: 'Nature blooms when you find your true circle 🌸✨ Best moments with real friends! #FriendshipGoals #BUDDY',
      music_title: 'Chill Lo-Fi Sunset Beat 🎧',
      tags: ['Friendship', 'Vibes', 'Nature'],
      likes_count: 248,
      comments_count: 19,
      comments: [
        { id: 'c-1', user_name: 'Aarav Patel', user_username: '@aarav', text: 'This looks so peaceful! 🌸', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'c-2', user_name: 'Riya Sen', user_username: '@riyax', text: 'Love the aesthetic vibes 😍', created_at: new Date(Date.now() - 1800000).toISOString() }
      ],
      shares_count: 42,
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'tape-2',
      user_id: 'creator-kabir',
      user_name: 'Kabir & Siya',
      user_username: '@kabirsiya_duo',
      user_avatar: 'assets/avatar-default.svg',
      user_color: '#8b5cf6',
      is_verified: true,
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      caption: 'Late night chats & laughing at silly memories 🐰🍿 Who else relates? Tag your favorite person! #LateNight #BUDDY',
      music_title: 'Acoustic Melody - Late Night ✨',
      tags: ['Couple', 'Fun', 'LateNight'],
      likes_count: 412,
      comments_count: 34,
      comments: [
        { id: 'c-3', user_name: 'Zoya Khan', user_username: '@zoya', text: 'Relatable level 1000 😂❤️', created_at: new Date(Date.now() - 5400000).toISOString() }
      ],
      shares_count: 88,
      created_at: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: 'tape-3',
      user_id: 'creator-aryan',
      user_name: 'Aryan Roy',
      user_username: '@aryan_travels',
      user_avatar: 'assets/avatar-default.svg',
      user_color: '#0ea5e9',
      is_verified: true,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      caption: 'Chasing sunsets with good music and best friends 🚗🌅 Life hits differently in golden hour! #RoadTrip #SunsetVibes #BUDDY',
      music_title: 'Golden Hour Acoustic - Lo-Fi Chill 🎶',
      tags: ['Travel', 'RoadTrip', 'Sunset'],
      likes_count: 584,
      comments_count: 48,
      comments: [
        { id: 'c-4', user_name: 'Tanvi Shah', user_username: '@tanvi', text: 'Where is this road trip?! Stunning views 🌄', created_at: new Date(Date.now() - 10800000).toISOString() }
      ],
      shares_count: 92,
      created_at: new Date(Date.now() - 18000000).toISOString()
    },
    {
      id: 'tape-4',
      user_id: 'creator-ananya',
      user_name: 'Ananya & Milo 🐾',
      user_username: '@ananya_pets',
      user_avatar: 'assets/avatar-default.svg',
      user_color: '#10b981',
      is_verified: true,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      caption: 'When your pup refuses to wake up on Sunday morning 😂🐶 Who else has a lazy buddy like Milo? #DogLife #CuteMoments',
      music_title: 'Sunny Sunday - Happy Whistle 🌸',
      tags: ['Pets', 'Cute', 'Humor'],
      likes_count: 890,
      comments_count: 76,
      comments: [
        { id: 'c-5', user_name: 'Rohan Mehra', user_username: '@rohan_m', text: 'Milo is an absolute cutie pie 🐶❤️', created_at: new Date(Date.now() - 7200000).toISOString() }
      ],
      shares_count: 145,
      created_at: new Date(Date.now() - 21600000).toISOString()
    },
    {
      id: 'tape-5',
      user_id: 'creator-dev',
      user_name: 'Dev Kapoor 🎧',
      user_username: '@dev_beats',
      user_avatar: 'assets/avatar-default.svg',
      user_color: '#ec4899',
      is_verified: true,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      caption: '3 AM lo-fi beats cooking in the studio 🎧✨ Drop a ⚡ if you are a midnight music lover! #LoFiBeats #ProducerLife',
      music_title: 'Cyberpunk Phonk - Neon Nights ⚡',
      tags: ['Music', 'LoFi', 'LateNight'],
      likes_count: 672,
      comments_count: 53,
      comments: [
        { id: 'c-6', user_name: 'Karan Joshi', user_username: '@karan_j', text: 'This bassline is insane 🔥 Need the full track!', created_at: new Date(Date.now() - 4800000).toISOString() }
      ],
      shares_count: 110,
      created_at: new Date(Date.now() - 25200000).toISOString()
    },
    {
      id: 'tape-6',
      user_id: 'creator-simran',
      user_name: 'Simran Kaur ☕',
      user_username: '@simran_aesthetic',
      user_avatar: 'assets/avatar-default.svg',
      user_color: '#f59e0b',
      is_verified: true,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      caption: 'Found the coziest hidden cafe in the city ☕ Rainy day + iced latte + good conversation = therapy 🌧️✨ #CafeVibes #Cozy',
      music_title: 'Coffee & Raindrops - Soft Piano 🎹',
      tags: ['Aesthetic', 'Cafe', 'Chill'],
      likes_count: 735,
      comments_count: 61,
      comments: [
        { id: 'c-7', user_name: 'Sneha Verma', user_username: '@snehav', text: 'Adding this to my weekend cafe hopping list! ☕', created_at: new Date(Date.now() - 3600000).toISOString() }
      ],
      shares_count: 128,
      created_at: new Date(Date.now() - 28800000).toISOString()
    },
    {
      id: 'tape-7',
      user_id: 'creator-tanya',
      user_name: 'Rahul & Tanya 🥞',
      user_username: '@rahultanya_couple',
      user_avatar: 'assets/avatar-default.svg',
      user_color: '#e11d48',
      is_verified: true,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      caption: 'Tried making pancakes at 1 AM... disaster turned delicious! 🥞🍓 Rate our cooking skills 1-10! #CoupleGoals #LateNightSnack',
      music_title: 'Sweet Honey - Ukulele Rhythm 🍯',
      tags: ['Couple', 'Foodie', 'Fun'],
      likes_count: 945,
      comments_count: 82,
      comments: [
        { id: 'c-8', user_name: 'Vikram Singh', user_username: '@vikram', text: '10/10 for the midnight effort haha 😂🥞', created_at: new Date(Date.now() - 1800000).toISOString() }
      ],
      shares_count: 194,
      created_at: new Date(Date.now() - 32400000).toISOString()
    },
    {
      id: 'tape-8',
      user_id: 'creator-samar',
      user_name: 'Samar Studio 🌃',
      user_username: '@samar_films',
      user_avatar: 'assets/avatar-default.svg',
      user_color: '#3b82f6',
      is_verified: true,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      caption: 'The city never truly sleeps when you are with the right people 🏙️💫 Which city skyline do you love the most? #NightDrive #CityVibe',
      music_title: 'Midnight City Drive - Synthwave Wave 🌙',
      tags: ['CityLights', 'NightDrive', 'Vibes'],
      likes_count: 1120,
      comments_count: 94,
      comments: [
        { id: 'c-9', user_name: 'Pooja Hegde', user_username: '@pooja_h', text: 'Those drone shots are breathtaking ✨', created_at: new Date(Date.now() - 900000).toISOString() }
      ],
      shares_count: 230,
      created_at: new Date(Date.now() - 36000000).toISOString()
    }
  ];

  let state = {
    tapes: [],
    currentIndex: 0,
    isMuted: true,
    likedMap: {},
    activeCommentsTapeId: null,
    activeShareTapeId: null,
    observer: null
  };

  // ── Helper: Current User ──
  function _getCurrentUser() {
    if (window.ChatManager && typeof window.ChatManager.getCurrentUser === 'function') {
      const u = window.ChatManager.getCurrentUser();
      if (u) return u;
    }
    try {
      const sess = localStorage.getItem('buddy-session');
      if (sess) return JSON.parse(sess);
    } catch (e) {}
    return { id: 'guest', name: 'You', username: '@you', color: '#f43f5e', is_verified: false };
  }

  // ── Helper: LocalStorage ──
  function _loadLocalTapes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TAPES));
        return INITIAL_TAPES;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TAPES;
    } catch (e) {
      return INITIAL_TAPES;
    }
  }

  function _saveLocalTapes(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function _loadLikedMap() {
    try {
      const raw = localStorage.getItem(LIKES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function _saveLikedMap(map) {
    try {
      localStorage.setItem(LIKES_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  // ── Cloud Supabase Sync ──
  async function _syncCloudTapes() {
    if (!window.BuddySupabase) return;
    try {
      const { data, error } = await window.BuddySupabase
        .from('tapes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && Array.isArray(data) && data.length > 0) {
        // Merge cloud tapes with local creations
        const localList = _loadLocalTapes();
        const localMap = new Map(localList.map(t => [t.id, t]));
        data.forEach(ct => {
          localMap.set(ct.id, { ...ct, comments: Array.isArray(ct.comments) ? ct.comments : [] });
        });
        state.tapes = Array.from(localMap.values());
        _saveLocalTapes(state.tapes);
        renderFeed();
      }
    } catch (err) {
      console.warn('📸 [Tapes] Cloud sync fallback to local storage:', err);
    }
  }

  // ── Render Tapes Feed ──
  function renderFeed() {
    const feed = document.getElementById('tapes-feed-container');
    if (!feed) return;

    if (!state.tapes || state.tapes.length === 0) {
      state.tapes = _loadLocalTapes();
    }
    state.likedMap = _loadLikedMap();

    feed.innerHTML = state.tapes.map((tape, idx) => {
      const isLiked = !!state.likedMap[tape.id];
      const verifiedBadge = tape.is_verified
        ? `<span class="verified-badge-pill" title="Verified Creator">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="#38bdf8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
           </span>`
        : '';

      const avatarHtml = tape.user_avatar && tape.user_avatar.startsWith('data:')
        ? `<img src="${tape.user_avatar}" alt="${_escapeHtml(tape.user_name)}" class="tape-author-avatar-img" />`
        : `<div class="tape-author-avatar-fallback" style="background:${tape.user_color || '#f43f5e'}">${(tape.user_name || 'U').charAt(0).toUpperCase()}</div>`;

      return `
        <div class="tape-card" id="tape-card-${tape.id}" data-tape-id="${tape.id}" data-index="${idx}">
          <div class="tape-video-wrapper">
            <video
              class="tape-video-element"
              src="${tape.video_url}"
              playsinline
              loop
              preload="metadata"
              ${state.isMuted ? 'muted' : ''}
            ></video>

            <!-- Play/Pause Central Flash Ripple -->
            <div class="tape-play-indicator hidden" id="tape-play-ind-${tape.id}">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>

            <!-- Double-Tap Floating Heart Burst Zone -->
            <div class="tape-heart-burst-zone" id="tape-heart-zone-${tape.id}"></div>
          </div>

          <!-- Right Action Bar (TikTok / Reels / WAF Style) -->
          <div class="tape-actions-column">
            <!-- Author Profile Avatar -->
            <div class="tape-action-item tape-author-action" onclick="TapesManager.openAuthorProfile('${tape.user_id}')" title="${_escapeHtml(tape.user_name)}">
              <div class="tape-avatar-ring">
                ${avatarHtml}
              </div>
            </div>

            <!-- Like Button -->
            <div class="tape-action-item ${isLiked ? 'is-liked' : ''}" id="tape-btn-like-${tape.id}" onclick="TapesManager.toggleLike('${tape.id}')">
              <button type="button" class="tape-action-btn like-btn" aria-label="Like Tape">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="${isLiked ? '#f43f5e' : 'none'}" stroke="${isLiked ? '#f43f5e' : 'white'}" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              <span class="tape-action-counter" id="tape-like-count-${tape.id}">${tape.likes_count || 0}</span>
            </div>

            <!-- Comments Button -->
            <div class="tape-action-item" onclick="TapesManager.openComments('${tape.id}')">
              <button type="button" class="tape-action-btn" aria-label="Comments">
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </button>
              <span class="tape-action-counter" id="tape-comment-count-${tape.id}">${(tape.comments && tape.comments.length) || tape.comments_count || 0}</span>
            </div>

            <!-- Share to 1-on-1 BUDDY Chat -->
            <div class="tape-action-item" onclick="TapesManager.openShareModal('${tape.id}')">
              <button type="button" class="tape-action-btn" aria-label="Share to Chat">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
              <span class="tape-action-counter">Share</span>
            </div>

            <!-- Spinning Vinyl Audio Disc -->
            <div class="tape-action-item tape-vinyl-wrap">
              <div class="tape-vinyl-disc" id="tape-vinyl-${tape.id}">
                <div class="tape-vinyl-inner"></div>
              </div>
            </div>
          </div>

          <!-- Bottom Meta Info Column -->
          <div class="tape-meta-info">
            <div class="tape-meta-author-row">
              <span class="tape-meta-name">${_escapeHtml(tape.user_name)}</span>
              ${verifiedBadge}
              <span class="tape-meta-username">${_escapeHtml(tape.user_username || '')}</span>
            </div>

            <div class="tape-meta-caption">
              ${_formatCaptionWithHashtags(tape.caption)}
            </div>

            <div class="tape-meta-music-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
              <div class="tape-music-marquee">
                <span>${_escapeHtml(tape.music_title || 'Original Audio')} • BUDDY Tapes</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    _bindCardInteractions();
    _setupIntersectionObserver();
  }

  // ── Double-Tap & Single-Tap Handler ──
  function _bindCardInteractions() {
    const cards = document.querySelectorAll('.tape-card');
    cards.forEach(card => {
      const tapeId = card.getAttribute('data-tape-id');
      const wrapper = card.querySelector('.tape-video-wrapper');
      const video = card.querySelector('.tape-video-element');
      let lastTapTime = 0;

      if (!wrapper || !video) return;

      wrapper.onclick = (e) => {
        // Prevent click if targeting action buttons
        if (e.target.closest('.tape-actions-column') || e.target.closest('.tape-meta-info')) return;

        const now = Date.now();
        const diff = now - lastTapTime;

        if (diff < 300) {
          // Double Tap: Like + Burst
          const rect = wrapper.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          _triggerHeartBurst(tapeId, x, y);
          if (!state.likedMap[tapeId]) {
            toggleLike(tapeId);
          }
          lastTapTime = 0;
        } else {
          // Single Tap: Play / Pause toggle
          lastTapTime = now;
          setTimeout(() => {
            if (Date.now() - lastTapTime >= 280 && lastTapTime !== 0) {
              _toggleVideoPlayPause(video, tapeId);
            }
          }, 290);
        }
      };
    });
  }

  function _toggleVideoPlayPause(video, tapeId) {
    if (!video) return;
    const indicator = document.getElementById(`tape-play-ind-${tapeId}`);
    if (video.paused) {
      video.play().catch(() => {});
      if (indicator) {
        indicator.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        indicator.classList.remove('hidden');
        setTimeout(() => indicator.classList.add('hidden'), 500);
      }
    } else {
      video.pause();
      if (indicator) {
        indicator.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        indicator.classList.remove('hidden');
      }
    }
  }

  // ── Floating Heart Burst on Double-Tap ──
  function _triggerHeartBurst(tapeId, x, y) {
    const zone = document.getElementById(`tape-heart-zone-${tapeId}`);
    if (!zone) return;

    const heart = document.createElement('div');
    heart.className = 'floating-burst-heart';
    heart.style.left = `${x || 150}px`;
    heart.style.top = `${y || 200}px`;
    heart.innerHTML = `
      <svg width="72" height="72" viewBox="0 0 24 24" fill="#f43f5e" stroke="white" stroke-width="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    `;
    zone.appendChild(heart);
    setTimeout(() => {
      heart.remove();
    }, 900);
  }

  // ── Intersection Observer (Auto-Play Active Video, Pause Others) ──
  function _setupIntersectionObserver() {
    if (state.observer) {
      state.observer.disconnect();
    }

    const options = {
      root: document.getElementById('tapes-feed-container'),
      threshold: 0.65
    };

    state.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const card = entry.target;
        const video = card.querySelector('.tape-video-element');
        const tapeId = card.getAttribute('data-tape-id');
        const vinyl = document.getElementById(`tape-vinyl-${tapeId}`);
        const indicator = document.getElementById(`tape-play-ind-${tapeId}`);

        if (entry.isIntersecting) {
          if (video) {
            video.muted = state.isMuted;
            video.currentTime = 0;
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                if (vinyl) vinyl.classList.add('rotating');
                if (indicator) indicator.classList.add('hidden');
              }).catch(() => {
                // Autoplay blocked without user gesture
                if (indicator) indicator.classList.remove('hidden');
              });
            }
          }
        } else {
          if (video) {
            video.pause();
            if (vinyl) vinyl.classList.remove('rotating');
          }
        }
      });
    }, options);

    const cards = document.querySelectorAll('.tape-card');
    cards.forEach(c => state.observer.observe(c));
  }

  // ── Like Toggle ──
  function toggleLike(tapeId) {
    const tape = state.tapes.find(t => t.id === tapeId);
    if (!tape) return;

    state.likedMap = _loadLikedMap();
    const wasLiked = !!state.likedMap[tapeId];
    const isNowLiked = !wasLiked;

    if (isNowLiked) {
      state.likedMap[tapeId] = Date.now();
      tape.likes_count = (tape.likes_count || 0) + 1;
    } else {
      delete state.likedMap[tapeId];
      tape.likes_count = Math.max(0, (tape.likes_count || 1) - 1);
    }

    _saveLikedMap(state.likedMap);
    _saveLocalTapes(state.tapes);

    // Update UI
    const btnWrap = document.getElementById(`tape-btn-like-${tapeId}`);
    const countEl = document.getElementById(`tape-like-count-${tapeId}`);

    if (btnWrap) {
      if (isNowLiked) {
        btnWrap.classList.add('is-liked');
        btnWrap.querySelector('svg').setAttribute('fill', '#f43f5e');
        btnWrap.querySelector('svg').setAttribute('stroke', '#f43f5e');
      } else {
        btnWrap.classList.remove('is-liked');
        btnWrap.querySelector('svg').setAttribute('fill', 'none');
        btnWrap.querySelector('svg').setAttribute('stroke', 'white');
      }
    }
    if (countEl) countEl.textContent = tape.likes_count;

    // Cloud update if Supabase available
    if (window.BuddySupabase) {
      window.BuddySupabase
        .from('tapes')
        .update({ likes_count: tape.likes_count })
        .eq('id', tapeId)
        .then(() => {})
        .catch(() => {});
    }
  }

  // ── Mute / Unmute Global Toggle ──
  function toggleGlobalMute() {
    state.isMuted = !state.isMuted;
    const videos = document.querySelectorAll('.tape-video-element');
    videos.forEach(v => { v.muted = state.isMuted; });

    const btn = document.getElementById('tapes-global-mute-btn');
    if (btn) {
      btn.innerHTML = state.isMuted
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <line x1="1" y1="1" x2="23" y2="23"/>
             <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
             <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
             <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
           </svg>`;
    }
  }

  // ── Comments Bottom Sheet ──
  function openComments(tapeId) {
    state.activeCommentsTapeId = tapeId;
    const tape = state.tapes.find(t => t.id === tapeId);
    if (!tape) return;

    const overlay = document.getElementById('tapes-comments-overlay');
    const container = document.getElementById('tapes-comments-content');
    if (!overlay || !container) return;

    const comments = Array.isArray(tape.comments) ? tape.comments : [];

    container.innerHTML = `
      <div class="tape-comments-sheet">
        <div class="tape-sheet-head">
          <div class="tape-sheet-title">Comments (${comments.length})</div>
          <button type="button" class="modal-x-btn" onclick="TapesManager.closeComments()" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="tape-comments-list" id="tape-comments-list">
          ${comments.length === 0 ? `
            <div class="tape-comments-empty">
              <span>💬</span>
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ` : comments.map(c => `
            <div class="tape-comment-row">
              <div class="tape-comment-avatar">${(c.user_name || 'U').charAt(0).toUpperCase()}</div>
              <div class="tape-comment-body">
                <div class="tape-comment-user">${_escapeHtml(c.user_name)} <span class="tape-comment-time">${_formatTimeAgo(c.created_at)}</span></div>
                <div class="tape-comment-text">${_escapeHtml(c.text)}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Post Comment Form -->
        <div class="tape-comments-input-bar">
          <input type="text" id="tape-new-comment-input" placeholder="Add a lovely comment..." maxlength="280" />
          <button type="button" class="btn-primary" id="tape-btn-submit-comment" onclick="TapesManager.submitComment()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');

    const input = document.getElementById('tape-new-comment-input');
    if (input) {
      input.focus();
      input.onkeydown = (e) => {
        if (e.key === 'Enter') submitComment();
      };
    }
  }

  function closeComments() {
    state.activeCommentsTapeId = null;
    const overlay = document.getElementById('tapes-comments-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function submitComment() {
    const tapeId = state.activeCommentsTapeId;
    if (!tapeId) return;

    const input = document.getElementById('tape-new-comment-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const tape = state.tapes.find(t => t.id === tapeId);
    if (!tape) return;

    const me = _getCurrentUser();
    if (!Array.isArray(tape.comments)) tape.comments = [];

    const newComment = {
      id: 'c_' + Date.now(),
      user_name: me.name || 'You',
      user_username: me.username || '@you',
      text: text,
      created_at: new Date().toISOString()
    };

    tape.comments.push(newComment);
    tape.comments_count = tape.comments.length;
    _saveLocalTapes(state.tapes);

    // Update Comment count on card
    const countEl = document.getElementById(`tape-comment-count-${tapeId}`);
    if (countEl) countEl.textContent = tape.comments.length;

    // Refresh comments sheet list
    openComments(tapeId);

    // Cloud update if Supabase
    if (window.BuddySupabase) {
      window.BuddySupabase
        .from('tapes')
        .update({ comments: tape.comments, comments_count: tape.comments.length })
        .eq('id', tapeId)
        .then(() => {})
        .catch(() => {});
    }
  }

  // ── Share Modal (Send Tape into 1-on-1 BUDDY Chat) ──
  async function openShareModal(tapeId) {
    state.activeShareTapeId = tapeId;
    const tape = state.tapes.find(t => t.id === tapeId);
    if (!tape) return;

    const overlay = document.getElementById('tapes-share-overlay');
    const container = document.getElementById('tapes-share-content');
    if (!overlay || !container) return;

    // Get active friends / chats from ChatManager
    let contacts = [];
    if (window.ChatManager && typeof window.ChatManager.getConversations === 'function') {
      contacts = window.ChatManager.getConversations();
    } else if (window.ChatManager && typeof window.ChatManager.getFriendConversations === 'function') {
      contacts = window.ChatManager.getFriendConversations();
    }

    // Filter out current user from contacts
    const currentUser = _getCurrentUser();
    contacts = (contacts || []).filter(c => c.id !== currentUser.id && c.userId !== currentUser.id);

    // If contacts list is small or only BUDDY AI, load real registered buddies from Supabase
    if (contacts.length <= 1 && window.BuddySupabase) {
      try {
        const client = window.BuddySupabase.getClient();
        if (client) {
          const { data: profiles } = await client.from('profiles').select('*').neq('id', currentUser.id).limit(10);
          if (Array.isArray(profiles)) {
            profiles.forEach(p => {
              if (!contacts.some(c => (c.userId && c.userId === p.id) || c.id === p.id)) {
                contacts.push({
                  id: p.id,
                  userId: p.id,
                  name: p.full_name || p.username,
                  username: p.username ? (p.username.startsWith('@') ? p.username : '@' + p.username) : '',
                  avatar: p.avatar_url || null,
                  color: p.avatar_color || '#6366F1',
                  status: p.bio || 'Verified Member',
                  isAI: false,
                  isVerified: !!p.is_verified || (window.VerifiedBadgeManager && typeof window.VerifiedBadgeManager.isVerifiedUser === 'function' && window.VerifiedBadgeManager.isVerifiedUser(p.id))
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('Share modal profiles fetch error:', err);
      }
    }

    state.shareContacts = contacts;
    _renderShareModalContent(tape, contacts);
    overlay.classList.remove('hidden');

    // Bind real-time search input
    const searchInput = document.getElementById('tape-share-search-input');
    if (searchInput) {
      let searchTimer = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(async () => {
          const query = searchInput.value.trim();
          let filtered = state.shareContacts || [];
          if (query) {
            const q = query.toLowerCase();
            filtered = state.shareContacts.filter(c => 
              (c.name && c.name.toLowerCase().includes(q)) || 
              (c.username && c.username.toLowerCase().includes(q))
            );

            // If query is 2+ chars, also search registered profiles via ChatManager
            if (q.length >= 2 && window.ChatManager && typeof window.ChatManager.searchAllFriends === 'function') {
              try {
                const searchResults = await window.ChatManager.searchAllFriends(query);
                if (Array.isArray(searchResults)) {
                  searchResults.forEach(res => {
                    if (!filtered.some(f => (f.userId && f.userId === res.userId) || f.id === res.id)) {
                      filtered.push(res);
                    }
                  });
                }
              } catch(e) {}
            }
          }
          _renderShareFriendsList(tape, filtered);
        }, 180);
      });
    }
  }

  function _renderShareModalContent(tape, contacts) {
    const container = document.getElementById('tapes-share-content');
    if (!container) return;

    const quickContacts = (contacts || []).slice(0, 6);

    container.innerHTML = `
      <div class="tape-share-sheet">
        <div class="tape-sheet-head">
          <div class="tape-sheet-title">Share Tape to Friends 💌</div>
          <button type="button" class="modal-x-btn" onclick="TapesManager.closeShareModal()" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="tape-share-preview-card">
          <span style="font-size:24px;">🎬</span>
          <div class="tape-share-preview-text">
            <strong>${_escapeHtml(tape.user_name)}'s Tape</strong>
            <p>${_escapeHtml(tape.caption || 'Watch this fun tape on BUDDY!')}</p>
          </div>
        </div>

        <!-- Instagram-style Search Bar -->
        <div class="tape-share-search-wrap">
          <div class="tape-share-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="tape-share-search-input" placeholder="Search friends & buddies by name or @username..." autocomplete="off" />
          </div>
        </div>

        <!-- Instagram-style Horizontal Top Tray -->
        ${quickContacts.length > 0 ? `
          <div class="tape-share-quick-tray">
            ${quickContacts.map(c => {
              const initial = (c.name || 'F').charAt(0).toUpperCase();
              return `
                <div class="tape-share-quick-item" title="Send to ${c.name}" onclick="TapesManager.sendTapeToChat('${c.id}', '${_escapeHtml(c.name)}', this.querySelector('.tape-btn-send-pill') || this)">
                  <div class="tape-share-quick-avatar" style="background:${c.color || '#6366F1'};">
                    ${c.avatar ? `<img src="${c.avatar}" alt="${c.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` : (c.isAI ? '✨' : initial)}
                    <span class="tape-share-online-dot"></span>
                  </div>
                  <span class="tape-share-quick-name">${_escapeHtml((c.name || 'Friend').split(' ')[0])}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <div class="tape-share-contacts-label">Direct BUDDY Friends:</div>
        <div class="tape-share-contacts-list" id="tape-share-friends-list">
          ${_generateShareFriendsHtml(tape, contacts)}
        </div>

        <!-- Bottom Actions (Copy Link & Done) -->
        <div class="tape-share-bottom-actions">
          <button type="button" class="tape-share-copy-btn" id="btn-copy-tape-link" onclick="TapesManager.copyTapeLink('${tape.id}')">
            <span>🔗</span>
            <span id="copy-tape-link-text">Copy Link</span>
          </button>
          ${typeof navigator !== 'undefined' && navigator.share ? `
            <button type="button" class="tape-share-copy-btn" onclick="TapesManager.shareExternally('${tape.id}')">
              <span>📲</span>
              <span>More Options</span>
            </button>
          ` : ''}
          <button type="button" class="btn-primary" style="padding:7px 18px; border-radius:14px; font-size:12px;" onclick="TapesManager.closeShareModal()">Done</button>
        </div>
      </div>
    `;
  }

  function _generateShareFriendsHtml(tape, contacts) {
    if (!contacts || contacts.length === 0) {
      return `
        <div style="padding:28px 16px; text-align:center; color:var(--text-muted); font-size:13px; line-height:1.6;">
          <div style="font-size:28px; margin-bottom:6px;">👥</div>
          <b>No BUDDY friends found</b><br/>
          <span style="font-size:11.5px;">Type a friend's @username above to find them, or copy the link below to share anywhere!</span>
        </div>
      `;
    }

    return contacts.map(c => {
      const initial = (c.name || 'F').charAt(0).toUpperCase();
      const verifiedBadge = c.isVerified ? `
        <span class="verified-badge-pill" title="Verified Creator" style="display:inline-flex;margin-left:3px;vertical-align:middle;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 2.4 3.4-.4 1.4 3.1 3.2 1.4-.4 3.4 2.4 2.4-2.4 2.4.4 3.4-3.2 1.4-1.4 3.1-3.4-.4L12 22l-2.4-2.4-3.4.4-1.4-3.1-3.2-1.4.4-3.4L-.4 12l2.4-2.4-.4-3.4 3.2-1.4 1.4-3.1 3.4.4L12 2z" fill="#38bdf8"/><path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      ` : '';

      return `
        <div class="tape-share-contact-row" id="share-row-${c.id}">
          <div class="tape-share-contact-avatar" style="background:${c.color || '#6366F1'};">
            ${c.avatar ? `<img src="${c.avatar}" alt="${c.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` : (c.isAI ? '✨' : initial)}
            <span class="tape-share-online-dot"></span>
          </div>
          <div class="tape-share-contact-info">
            <div class="tape-share-contact-name">
              ${_escapeHtml(c.name)}
              ${verifiedBadge}
            </div>
            <div class="tape-share-contact-user">${_escapeHtml(c.username || c.status || '')}</div>
          </div>
          <button type="button" class="btn-primary tape-btn-send-pill" id="btn-send-tape-${c.id}" onclick="event.stopPropagation(); TapesManager.sendTapeToChat('${c.id}', '${_escapeHtml(c.name)}', this)">
            Send
          </button>
        </div>
      `;
    }).join('');
  }

  function _renderShareFriendsList(tape, contacts) {
    const listEl = document.getElementById('tape-share-friends-list');
    if (listEl) {
      listEl.innerHTML = _generateShareFriendsHtml(tape, contacts);
    }
  }

  function closeShareModal() {
    state.activeShareTapeId = null;
    const overlay = document.getElementById('tapes-share-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  async function sendTapeToChat(chatId, contactName, btnEl) {
    const tapeId = state.activeShareTapeId;
    const tape = state.tapes.find(t => t.id === tapeId);
    if (!tape) return;

    const shareUrl = `${window.location.origin}/?tape=${tape.id}`;
    const shareMsg = `🎬 [Shared Tape by ${tape.user_name}]: "${tape.caption || 'Watch this fun tape!'}"\n👉 Watch here: ${shareUrl}`;

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = 'Sending...';
    }

    if (window.ChatManager && typeof window.ChatManager.sendMessageToChat === 'function') {
      await window.ChatManager.sendMessageToChat(chatId, shareMsg);
    } else {
      console.log('Sending tape share to chat:', chatId, shareMsg);
    }

    if (btnEl) {
      btnEl.textContent = 'Sent ✓';
      btnEl.classList.add('sent');
      btnEl.disabled = true;
    }

    if (window.showToast) {
      window.showToast(`✨ Sent tape to ${contactName}! 🚀`);
    }
  }

  function copyTapeLink(tapeId) {
    const tape = state.tapes.find(t => t.id === tapeId);
    const url = `${window.location.origin}/?tape=${tapeId}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        const copyText = document.getElementById('copy-tape-link-text');
        if (copyText) copyText.textContent = 'Copied! ✓';
        if (window.showToast) window.showToast('📋 Tape link copied to clipboard!');
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Copy Link';
        }, 2500);
      }).catch(() => {
        if (window.showToast) window.showToast('📋 Link: ' + url);
      });
    } else {
      if (window.showToast) window.showToast('📋 Link: ' + url);
    }
  }

  function shareExternally(tapeId) {
    const tape = state.tapes.find(t => t.id === tapeId);
    if (!tape || !navigator.share) return;

    navigator.share({
      title: `${tape.user_name}'s Tape on BUDDY`,
      text: tape.caption || 'Watch this fun tape on BUDDY!',
      url: `${window.location.origin}/?tape=${tapeId}`
    }).catch(() => {});
  }

  // ── Create & Upload Tape Modal (+) ──
  function openCreateTapeModal() {
    const overlay = document.getElementById('tapes-create-overlay');
    const container = document.getElementById('tapes-create-content');
    if (!overlay || !container) return;

    container.innerHTML = `
      <div class="tape-create-sheet">
        <div class="tape-sheet-head">
          <div class="tape-sheet-title">Create New Tape 🎬</div>
          <button type="button" class="modal-x-btn" onclick="TapesManager.closeCreateTapeModal()" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="tape-create-body">
          <!-- Video File Picker or Camera -->
          <div class="tape-upload-box" id="tape-drop-zone" onclick="document.getElementById('tape-file-input').click()">
            <input type="file" id="tape-file-input" accept="video/mp4,video/webm,video/quicktime" style="display:none;" />
            <div id="tape-upload-placeholder">
              <span style="font-size:36px;">📹</span>
              <p><strong>Click to Choose Video</strong></p>
              <span class="tape-hint-text">MP4, WebM, or MOV up to 60 seconds (100% Free)</span>
            </div>
            <div id="tape-upload-preview" class="hidden">
              <video id="tape-preview-video" playsinline controls loop></video>
            </div>
          </div>

          <!-- Caption Input -->
          <div class="tape-input-group">
            <label>Caption & Hashtags</label>
            <textarea id="tape-create-caption" placeholder="What's this moment about? #Friends #Couple #Fun" rows="3" maxlength="240"></textarea>
          </div>

          <!-- Music / Audio Sound Title -->
          <div class="tape-input-group">
            <label>Sound Title</label>
            <input type="text" id="tape-create-music" placeholder="Original Audio / Song Name" value="Original Audio 🎵" maxlength="60" />
          </div>

          <!-- Tags Selection -->
          <div class="tape-tags-row">
            <span class="tape-tag-pill active" data-tag="Fun">😂 Fun</span>
            <span class="tape-tag-pill" data-tag="Couple">💑 Couple</span>
            <span class="tape-tag-pill" data-tag="Friendship">🤝 Friendship</span>
            <span class="tape-tag-pill" data-tag="Aesthetic">✨ Aesthetic</span>
            <span class="tape-tag-pill" data-tag="Music">🎧 Music</span>
          </div>

          <button type="button" class="btn-primary tape-btn-publish" id="tape-btn-publish" onclick="TapesManager.submitNewTape()">
            <span>Publish Tape 🚀</span>
          </button>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');

    // Setup file input handler
    const fileInput = document.getElementById('tape-file-input');
    if (fileInput) {
      fileInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        const placeholder = document.getElementById('tape-upload-placeholder');
        const previewWrap = document.getElementById('tape-upload-preview');
        const video = document.getElementById('tape-preview-video');

        if (placeholder) placeholder.classList.add('hidden');
        if (previewWrap) previewWrap.classList.remove('hidden');
        if (video) {
          video.src = url;
          video.play().catch(() => {});
        }
      };
    }

    // Setup tags click
    const tagPills = document.querySelectorAll('.tape-tag-pill');
    tagPills.forEach(pill => {
      pill.onclick = () => {
        pill.classList.toggle('active');
      };
    });
  }

  function closeCreateTapeModal() {
    const overlay = document.getElementById('tapes-create-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function submitNewTape() {
    const fileInput = document.getElementById('tape-file-input');
    const captionEl = document.getElementById('tape-create-caption');
    const musicEl = document.getElementById('tape-create-music');

    const file = fileInput && fileInput.files && fileInput.files[0];
    const caption = captionEl ? captionEl.value.trim() : '';
    const music = musicEl ? musicEl.value.trim() : 'Original Audio 🎵';

    if (!file) {
      alert('Please select a short video to upload!');
      return;
    }

    const me = _getCurrentUser();
    const videoUrl = URL.createObjectURL(file);

    // Selected tags
    const activeTags = [];
    document.querySelectorAll('.tape-tag-pill.active').forEach(p => {
      activeTags.push(p.getAttribute('data-tag'));
    });

    const newTape = {
      id: 'tape_' + Date.now(),
      user_id: me.id || 'me',
      user_name: me.name || 'You',
      user_username: me.username || '@you',
      user_avatar: me.avatar || 'assets/avatar-default.svg',
      user_color: me.color || '#f43f5e',
      is_verified: !!me.is_verified,
      video_url: videoUrl,
      caption: caption,
      music_title: music,
      tags: activeTags,
      likes_count: 1,
      comments_count: 0,
      comments: [],
      shares_count: 0,
      created_at: new Date().toISOString()
    };

    state.tapes.unshift(newTape);
    state.likedMap[newTape.id] = Date.now();
    _saveLikedMap(state.likedMap);
    _saveLocalTapes(state.tapes);

    closeCreateTapeModal();
    renderFeed();

    // Scroll to top of feed
    const feed = document.getElementById('tapes-feed-container');
    if (feed) feed.scrollTop = 0;

    if (window.showToast) {
      window.showToast('🚀 Tape Published Successfully!');
    } else {
      alert('🚀 Tape Published Successfully!');
    }

    // Background push to Supabase if available
    if (window.BuddySupabase) {
      window.BuddySupabase
        .from('tapes')
        .insert([{
          user_id: me.id,
          user_name: me.name || 'You',
          user_username: me.username || '@you',
          user_avatar: me.avatar || '',
          user_color: me.color || '#f43f5e',
          is_verified: !!me.is_verified,
          video_url: videoUrl,
          caption: caption,
          music_title: music,
          tags: activeTags,
          likes_count: 1,
          comments_count: 0,
          comments: []
        }])
        .then(() => {})
        .catch(() => {});
    }
  }

  // ── Helper: Format Hashtags in Caption ──
  function _formatCaptionWithHashtags(text) {
    if (!text) return '';
    const escaped = _escapeHtml(text);
    return escaped.replace(/#(\w+)/g, '<span class="tape-hashtag">#$1</span>');
  }

  function _formatTimeAgo(isoString) {
    if (!isoString) return 'Just now';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function _escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Initialization ──
  function init() {
    console.log('🎥 [BUDDY Tapes] Initializing Vertical Video Feed Engine...');
    state.tapes = _loadLocalTapes();
    state.likedMap = _loadLikedMap();
    renderFeed();
    _syncCloudTapes();
  }

  return {
    init,
    renderFeed,
    toggleLike,
    toggleGlobalMute,
    openComments,
    closeComments,
    submitComment,
    openShareModal,
    closeShareModal,
    sendTapeToChat,
    copyTapeLink,
    shareExternally,
    openCreateTapeModal,
    closeCreateTapeModal,
    submitNewTape,
    openAuthorProfile: (id) => console.log('View author profile:', id)
  };
})();

if (typeof window !== 'undefined') {
  window.TapesManager = TapesManager;
}
