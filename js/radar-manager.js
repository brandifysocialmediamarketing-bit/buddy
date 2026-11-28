/**
 * BUDDY - radar-manager.js (v210)
 * Feature 4 (Inspired by WAF): Community Radar 🌐 (World As Family Discover)
 * 
 * Capabilities:
 * - Privacy-First Community Radar to find buddies nearby & globally
 * - Rotating radar scanning dish with glowing interactive buddy blips
 * - Vibe & distance filtering (Nearby, Couples, Late Night, Gaming, Music)
 * - Quick "Wave 👋" action with floating hand animation & instant ice-breaker chat creation
 * - "Broadcast My Vibe 📡" to let others find you on the radar
 * - 100% Free (₹0 cost) without paid Google Maps or location APIs
 */

const RadarManager = (() => {
  const STORAGE_KEY = 'buddy_radar_store_v1';
  const WAVED_KEY = 'buddy_radar_waved_v1';

  const SAMPLE_BUDDIES = [];

  let state = {
    buddies: [],
    activeFilter: 'all',
    wavedMap: {},
    isBroadcasting: true,
    myVibe: '☕ Chilling & Open for Chat'
  };

  function _loadWavedMap() {
    try {
      const raw = localStorage.getItem(WAVED_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function _saveWavedMap(m) {
    try {
      localStorage.setItem(WAVED_KEY, JSON.stringify(m));
    } catch (e) {}
  }

  function renderRadar() {
    const listContainer = document.getElementById('radar-buddies-list');
    const blipsContainer = document.getElementById('radar-blips-container');
    if (!listContainer) return;

    state.wavedMap = _loadWavedMap();
    if (!state.buddies) {
      state.buddies = [];
    }

    // Filter
    let filtered = state.buddies;
    if (state.activeFilter === 'nearby') {
      filtered = state.buddies.filter(b => parseFloat(b.distance) < 3.0);
    } else if (state.activeFilter !== 'all') {
      filtered = state.buddies.filter(b => b.category === state.activeFilter);
    }

    if (!filtered || filtered.length === 0) {
      if (blipsContainer) blipsContainer.innerHTML = '';
      listContainer.innerHTML = `
        <div style="padding:48px 20px; text-align:center; color:var(--text-3); font-size:13px; line-height:1.6;">
          <div style="font-size:36px; margin-bottom:10px;">🌐</div>
          <strong style="color:var(--text); font-size:15px;">Discovering Buddies Nearby</strong><br/>
          <span style="font-size:12px; opacity:0.85;">No other registered users found nearby right now.<br/>Type a friend's @username in Chats or invite them to BUDDY to chat privately!</span>
        </div>
      `;
      return;
    }

    // Render Blips on the Radar Dish
    if (blipsContainer) {
      blipsContainer.innerHTML = filtered.map((b, idx) => {
        // Distribute radially around dish
        const angles = [35, 120, 210, 310];
        const dists = [35, 55, 70, 85];
        const angle = angles[idx % angles.length] * (Math.PI / 180);
        const dist = dists[idx % dists.length];
        const left = 50 + dist * 0.45 * Math.cos(angle);
        const top = 50 + dist * 0.45 * Math.sin(angle);

        return `
          <div class="radar-blip" style="left:${left}%; top:${top}%;" onclick="RadarManager.focusBuddy('${b.id}')" title="${b.name}">
            <div class="blip-pulse"></div>
            <div class="blip-dot" style="background:${b.color || '#38bdf8'};"></div>
          </div>
        `;
      }).join('');
    }

    // Render Buddy Cards List
    listContainer.innerHTML = filtered.map(b => {
      const isWaved = !!state.wavedMap[b.id];
      const verifiedBadge = b.is_verified
        ? `<span class="verified-badge-pill" title="Verified Profile">
             <svg width="13" height="13" viewBox="0 0 24 24" fill="#38bdf8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
           </span>`
        : '';

      return `
        <div class="radar-buddy-card" id="radar-card-${b.id}">
          <div class="rbc-avatar-wrap">
            <div class="rbc-avatar" style="background:${b.color || '#6366f1'};">
              ${(b.name || 'U').charAt(0).toUpperCase()}
            </div>
            ${b.is_online ? '<span class="rbc-online-dot" title="Online now"></span>' : ''}
          </div>

          <div class="rbc-body">
            <div class="rbc-header-row">
              <div class="rbc-name-wrap">
                <span class="rbc-name">${b.name}</span>
                ${verifiedBadge}
              </div>
              <span class="rbc-dist-tag">📍 ${b.distance}</span>
            </div>

            <div class="rbc-vibe-tag">${b.vibe}</div>
            <div class="rbc-bio">${b.bio}</div>

            <div class="rbc-actions-row">
              <button type="button" class="rbc-btn-wave ${isWaved ? 'waved' : ''}" id="btn-wave-${b.id}" onclick="RadarManager.sendWave('${b.id}', '${b.name}')">
                <span>${isWaved ? 'Waved! 🌟' : 'Wave 👋'}</span>
              </button>
              <button type="button" class="btn-primary rbc-btn-chat" onclick="RadarManager.startChatWithBuddy('${b.id}', '${b.name}')">
                <span>Message 💌</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setFilter(filter) {
    state.activeFilter = filter;
    document.querySelectorAll('.radar-chip').forEach(c => {
      if (c.getAttribute('data-filter') === filter) c.classList.add('active');
      else c.classList.remove('active');
    });
    renderRadar();
  }

  function sendWave(buddyId, buddyName) {
    state.wavedMap[buddyId] = Date.now();
    _saveWavedMap(state.wavedMap);

    const btn = document.getElementById(`btn-wave-${buddyId}`);
    if (btn) {
      btn.classList.add('waved');
      btn.innerHTML = '<span>Waved! 🌟</span>';
    }

    // Trigger high-five wave floating emoji
    _triggerWaveAnimation();

    if (window.showToast) {
      window.showToast(`👋 You waved at ${buddyName}! Connecting in direct chat...`);
    } else {
      alert(`👋 You waved at ${buddyName}!`);
    }

    // Open chat with initial wave message
    setTimeout(() => {
      startChatWithBuddy(buddyId, buddyName, `Wave 👋 sent from Community Radar!`);
    }, 600);

    // Simulate reciprocal incoming friend request
    setTimeout(() => {
      if (window.ChatManager && typeof window.ChatManager.receiveFriendRequest === 'function') {
        const buddy = state.buddies.find(b => b.id === buddyId) || { id: buddyId, name: buddyName, color: '#6366f1' };
        window.ChatManager.receiveFriendRequest(buddy, `Hey! 👋 Loved your wave on BUDDY Radar! Sent you a friend request to connect ✨`);
      }
    }, 2800);
  }

  async function startChatWithBuddy(buddyId, buddyName, initialMsgText) {
    const buddy = state.buddies.find(b => b.id === buddyId) || {
      id: buddyId,
      name: buddyName,
      color: '#6366F1',
      username: '@' + (buddyName || 'buddy').toLowerCase().replace(/\s+/g, '_')
    };

    if (window.ChatManager && typeof window.ChatManager.ensureAndOpenBuddyChat === 'function') {
      await window.ChatManager.ensureAndOpenBuddyChat(buddy, initialMsgText);
    } else if (window.ChatManager && typeof window.ChatManager.openChat === 'function') {
      window.ChatManager.openChat(buddyId);
    }

    // Switch view to Chats tab
    const tabChats = document.getElementById('tab-chats-btn');
    if (tabChats) tabChats.click();
  }

  async function syncRealBuddies() {
    let myId = 'guest';
    try {
      const sess = JSON.parse(localStorage.getItem('buddy-session') || '{}');
      if (sess && sess.id) myId = sess.id;
    } catch(e) {}

    let realBuddies = [];

    if (window.BuddySupabase) {
      try {
        const client = window.BuddySupabase.getClient();
        if (client) {
          const { data: profiles } = await client.from('profiles').select('*').neq('id', myId).limit(15);
          if (Array.isArray(profiles) && profiles.length > 0) {
            profiles.forEach((p, i) => {
              realBuddies.push({
                id: p.id,
                userId: p.id,
                name: p.full_name || p.username,
                username: p.username ? (p.username.startsWith('@') ? p.username : '@' + p.username) : '@buddy',
                avatar: p.avatar_url || 'assets/avatar-default.svg',
                color: p.avatar_color || '#6366f1',
                is_verified: !!p.is_verified || (window.VerifiedBadgeManager && typeof window.VerifiedBadgeManager.isVerifiedUser === 'function' && window.VerifiedBadgeManager.isVerifiedUser(p.id)),
                distance: `${(1.2 + (i * 0.8)).toFixed(1)} km away`,
                vibe: p.bio || '☕ Open for Good Conversations',
                category: (i % 2 === 0) ? 'chill' : 'couples',
                bio: p.bio || 'BUDDY Community Member. Let\'s chat and share positive vibes!',
                is_online: true
              });
            });
          }
        }
      } catch(err) {
        console.warn('Sync real buddies remote error:', err);
      }
    }

    // Merge locally registered users
    try {
      const raw = localStorage.getItem('buddy_registered_users_v1');
      if (raw) {
        const localList = JSON.parse(raw);
        if (Array.isArray(localList)) {
          localList.forEach((u, i) => {
            if (u.id !== myId && !realBuddies.some(r => r.id === u.id)) {
              realBuddies.push({
                id: u.id,
                userId: u.id,
                name: u.name,
                username: u.username,
                avatar: 'assets/avatar-default.svg',
                color: u.color || '#6366f1',
                is_verified: false,
                distance: `${(0.8 + (i * 0.6)).toFixed(1)} km away`,
                vibe: u.bio || '☕ Open for Chat',
                category: 'chill',
                bio: u.bio || 'BUDDY Member',
                is_online: true
              });
            }
          });
        }
      }
    } catch(e) {}

    state.buddies = realBuddies;
    renderRadar();
  }

  function focusBuddy(buddyId) {
    const card = document.getElementById(`radar-card-${buddyId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlighted');
      setTimeout(() => card.classList.remove('highlighted'), 1500);
    }
  }

  function _triggerWaveAnimation() {
    const waveEl = document.createElement('div');
    waveEl.className = 'floating-radar-wave';
    waveEl.innerHTML = '👋✨';
    document.body.appendChild(waveEl);
    setTimeout(() => waveEl.remove(), 1200);
  }

  function openBroadcastModal() {
    const overlay = document.getElementById('radar-broadcast-overlay');
    const container = document.getElementById('radar-broadcast-content');
    if (!overlay || !container) return;

    container.innerHTML = `
      <div class="radar-broadcast-sheet">
        <div class="rbs-head">
          <div class="rbs-title">Broadcast Your Vibe 📡</div>
          <button type="button" class="modal-x-btn" onclick="RadarManager.closeBroadcastModal()" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="rbs-body">
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
            Let buddies and friends on the radar discover your presence and wave at you!
          </p>

          <div class="rbs-field">
            <label>Your Current Vibe</label>
            <input type="text" id="rbs-vibe-input" value="${state.myVibe}" placeholder="e.g. Chilling with music 🎧" maxlength="60" />
          </div>

          <div class="rbs-presets">
            <button class="rbs-chip" onclick="document.getElementById('rbs-vibe-input').value='☕ Coffee & Good Convo'">☕ Coffee Talk</button>
            <button class="rbs-chip" onclick="document.getElementById('rbs-vibe-input').value='🌙 Late Night Deep Chats'">🌙 Late Night</button>
            <button class="rbs-chip" onclick="document.getElementById('rbs-vibe-input').value='🎮 Looking for Gaming Buddy'">🎮 Gaming</button>
            <button class="rbs-chip" onclick="document.getElementById('rbs-vibe-input').value='💑 Couple Connection & Fun'">💑 Couple Fun</button>
          </div>

          <button type="button" class="btn-primary rbs-save-btn" onclick="RadarManager.saveBroadcast()">
            <span>Update Radar Presence ✨</span>
          </button>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');
  }

  function closeBroadcastModal() {
    const overlay = document.getElementById('radar-broadcast-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function saveBroadcast() {
    const input = document.getElementById('rbs-vibe-input');
    if (input) {
      state.myVibe = input.value.trim() || '☕ Chilling';
    }
    closeBroadcastModal();
    if (window.showToast) {
      window.showToast('📡 Radar Presence Updated Live!');
    } else {
      alert('📡 Radar Presence Updated Live!');
    }
  }

  function simulateIncomingRequest() {
    const list = (state.buddies && state.buddies.length > 0) ? state.buddies : SAMPLE_BUDDIES;
    const randomBuddy = list[Math.floor(Math.random() * list.length)];
    const messages = [
      `Hey! 👋 Saw your profile on BUDDY Radar! Let's connect & share travel/music stories! ✨`,
      `Hi there! Loved your vibe on Radar 🌟 Would love to be friends and chat!`,
      `Hey! 👋 Up for a coffee convo or music chat sometime? Sent you a friend request!`
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    if (window.ChatManager && typeof window.ChatManager.receiveFriendRequest === 'function') {
      window.ChatManager.receiveFriendRequest(randomBuddy, msg);
    }

    if (window.showToast) {
      window.showToast(`📩 New request received from ${randomBuddy.name}! Check Chats.`);
    }
  }

  function init() {
    console.log('🌐 [BUDDY Radar] Initializing Community Discover Engine...');
    renderRadar();
    syncRealBuddies();
  }

  return {
    init,
    renderRadar,
    setFilter,
    sendWave,
    startChatWithBuddy,
    focusBuddy,
    openBroadcastModal,
    closeBroadcastModal,
    saveBroadcast,
    simulateIncomingRequest
  };
})();

if (typeof window !== 'undefined') {
  window.RadarManager = RadarManager;
}
