/**
 * BUDDY - activity-manager.js (v216)
 * Instagram-Style Activity & Friend Requests Hub
 * 
 * Capabilities:
 * - Real Instagram-style Heart (❤️) Activity Feed & Notification Drawer
 * - Friend / Follow Requests with [ Confirm ] & [ Delete ] actions
 * - Real-time notification when someone links / shares your uploaded Reel in their Story
 * - Mini square video / story thumbnail preview on the right (authentic Instagram layout)
 * - Filter pills: All | Friend Requests | Reels & Stories
 * - Live unread badge sync on top header Heart button
 * - Instant test simulation engines for testing Reel Linking & Friend Requests
 */

const ActivityManager = (() => {
  const STORAGE_KEY = 'buddy_instagram_activity_v2';
  const SEEN_ACTIVITIES_KEY = 'buddy_activity_seen_map_v1';

  const INITIAL_ACTIVITIES = [
    {
      id: 'act_req_dev',
      type: 'friend_request',
      sender_id: 'dev-kapoor',
      sender_name: 'Dev Kapoor',
      sender_username: '@dev_beats',
      sender_avatar: null,
      sender_color: '#0ea5e9',
      status: 'pending',
      text: 'sent you a friend request',
      detail: 'Producer & Gamer • 4.2 km away on Radar',
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      is_seen: false
    },
    {
      id: 'act_reel_ananya',
      type: 'reel_linked_story',
      sender_id: 'ananya-sharma',
      sender_name: 'Ananya Sharma',
      sender_username: '@ananya_coffee',
      sender_avatar: null,
      sender_color: '#f43f5e',
      status: 'done',
      text: 'linked your uploaded reel in their story 🎬',
      detail: 'Chasing sunsets with good music & friends',
      tape_id: 'tape-3',
      tape_video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      is_seen: false
    },
    {
      id: 'act_story_rohan',
      type: 'story_mention',
      sender_id: 'rohan-meera',
      sender_name: 'Rohan & Meera',
      sender_username: '@rohan_meera',
      sender_avatar: null,
      sender_color: '#8b5cf6',
      status: 'done',
      text: 'mentioned you in a 24h story moment ✨',
      detail: 'Midnight pancakes & laughing at memories',
      tape_id: 'tape-2',
      tape_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      is_seen: false
    },
    {
      id: 'act_like_priya',
      type: 'reel_like',
      sender_id: 'creator-priya',
      sender_name: 'Priya Sharma',
      sender_username: '@priya_vibe',
      sender_avatar: null,
      sender_color: '#ec4899',
      status: 'done',
      text: 'liked your reel 💖',
      detail: 'Nature blooms when you find true friends',
      tape_id: 'tape-1',
      tape_video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      created_at: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
      is_seen: true
    }
  ];

  let state = {
    activities: [],
    activeFilter: 'all', // 'all' | 'requests' | 'reels_stories'
    isInitialized: false
  };

  function _loadActivities() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
        return [...INITIAL_ACTIVITIES];
      }
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
        return [...INITIAL_ACTIVITIES];
      }
      return list;
    } catch (e) {
      return [...INITIAL_ACTIVITIES];
    }
  }

  function _saveActivities(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function _escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _formatTime(isoStr) {
    if (!isoStr) return 'Just now';
    const diffSec = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
    return `${Math.floor(diffSec / 86400)}d`;
  }

  function getUnreadCount() {
    state.activities = _loadActivities();
    return state.activities.filter(a => !a.is_seen && a.status === 'pending').length;
  }

  function updateBadge() {
    const badge = document.getElementById('activity-badge-dot');
    const badgeCount = document.getElementById('activity-badge-count');
    const unread = getUnreadCount();

    if (badge) {
      if (unread > 0) {
        badge.classList.remove('hidden');
        badge.textContent = unread > 9 ? '9+' : unread;
      } else {
        badge.classList.add('hidden');
      }
    }
    if (badgeCount) {
      badgeCount.textContent = unread;
    }
  }

  function openActivityHub() {
    state.activities = _loadActivities();
    const overlay = document.getElementById('activity-hub-overlay');
    if (!overlay) return;

    renderActivityFeed();
    overlay.classList.remove('hidden');

    // Mark seen after 1.5 seconds
    setTimeout(() => {
      let changed = false;
      state.activities.forEach(a => {
        if (!a.is_seen && a.type !== 'friend_request') {
          a.is_seen = true;
          changed = true;
        }
      });
      if (changed) {
        _saveActivities(state.activities);
        updateBadge();
      }
    }, 1500);
  }

  function closeActivityHub() {
    const overlay = document.getElementById('activity-hub-overlay');
    if (overlay) overlay.classList.add('hidden');
    updateBadge();
  }

  function setFilter(filter) {
    state.activeFilter = filter;
    document.querySelectorAll('.activity-filter-pill').forEach(pill => {
      if (pill.getAttribute('data-filter') === filter) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    renderActivityFeed();
  }

  function renderActivityFeed() {
    const listContainer = document.getElementById('activity-feed-list');
    if (!listContainer) return;

    state.activities = _loadActivities();

    let filtered = state.activities;
    if (state.activeFilter === 'requests') {
      filtered = state.activities.filter(a => a.type === 'friend_request');
    } else if (state.activeFilter === 'reels_stories') {
      filtered = state.activities.filter(a => a.type === 'reel_linked_story' || a.type === 'story_mention' || a.type === 'reel_like');
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="activity-empty-state">
          <div style="font-size:42px; margin-bottom:10px;">❤️</div>
          <div style="font-size:16px; font-weight:700; color:var(--text-1); margin-bottom:6px;">No Activity Yet</div>
          <p style="font-size:12.5px; color:var(--text-3); max-width:280px; margin:0 auto; line-height:1.5;">When someone sends you a friend request or links your uploaded reel into their story, you'll see it here.</p>
        </div>
      `;
      return;
    }

    // Split into Friend Requests and General Activity
    const pendingRequests = filtered.filter(a => a.type === 'friend_request' && a.status === 'pending');
    const otherActivities = filtered.filter(a => !(a.type === 'friend_request' && a.status === 'pending'));

    let html = '';

    // SECTION 1: INSTAGRAM STYLE FRIEND REQUESTS HEADER / BOX
    if (pendingRequests.length > 0 && (state.activeFilter === 'all' || state.activeFilter === 'requests')) {
      html += `
        <div class="act-section-heading">
          <span>Friend & Follow Requests</span>
          <span class="act-counter-tag">${pendingRequests.length}</span>
        </div>
        <div class="act-requests-stack">
          ${pendingRequests.map(req => _renderFriendRequestRow(req)).join('')}
        </div>
      `;
    }

    // SECTION 2: ACTIVITY FEED (Reels Linked to Story, Mentions, Likes)
    if (otherActivities.length > 0) {
      html += `
        <div class="act-section-heading">
          <span>${state.activeFilter === 'requests' ? 'Past Requests' : 'Recent Activity'}</span>
        </div>
        <div class="act-items-stack">
          ${otherActivities.map(act => _renderActivityRow(act)).join('')}
        </div>
      `;
    }

    listContainer.innerHTML = html;
  }

  function _renderFriendRequestRow(item) {
    const initial = (item.sender_name || 'U').charAt(0).toUpperCase();
    return `
      <div class="act-row act-request-card" id="act-row-${item.id}">
        <div class="act-avatar-wrap">
          <div class="act-avatar" style="background:${item.sender_color || '#6366f1'};">
            ${item.sender_avatar ? `<img src="${item.sender_avatar}" alt="${item.sender_name}"/>` : initial}
          </div>
          <span class="act-sub-badge">👋</span>
        </div>
        <div class="act-content">
          <div class="act-text-row">
            <strong class="act-sender-name">${_escape(item.sender_name)}</strong>
            <span class="act-sender-uname">${_escape(item.sender_username)}</span>
          </div>
          <div class="act-description">${_escape(item.text)}</div>
          <div class="act-time-row">${_formatTime(item.created_at)} • ${item.detail || 'BUDDY Community'}</div>
        </div>
        <div class="act-actions-wrap" id="act-actions-${item.id}">
          <button type="button" class="act-btn-delete" onclick="ActivityManager.deleteFriendRequest('${item.id}', '${item.sender_id}')" title="Delete request">Delete</button>
          <button type="button" class="act-btn-confirm" onclick="ActivityManager.confirmFriendRequest('${item.id}', '${item.sender_id}', '${_escape(item.sender_name)}')" title="Confirm friend request">Confirm</button>
        </div>
      </div>
    `;
  }

  function _renderActivityRow(item) {
    const initial = (item.sender_name || 'U').charAt(0).toUpperCase();
    const isReelLinked = item.type === 'reel_linked_story';
    const isStoryMention = item.type === 'story_mention';
    const isReelLike = item.type === 'reel_like';
    const isAcceptedReq = item.type === 'friend_request' && item.status === 'accepted';

    let iconBadge = '❤️';
    if (isReelLinked) iconBadge = '🔗';
    else if (isStoryMention) iconBadge = '✨';
    else if (isAcceptedReq) iconBadge = '🤝';

    // Right-side mini media thumbnail preview (Instagram style!)
    let thumbnailHtml = '';
    if (item.tape_video || item.tape_id) {
      thumbnailHtml = `
        <div class="act-media-thumbnail" onclick="ActivityManager.openLinkedReel('${item.tape_id || 'tape-1'}')" title="Watch linked reel">
          <div class="act-thumb-overlay">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <video class="act-thumb-video" src="${item.tape_video || 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'}" muted playsinline></video>
        </div>
      `;
    } else if (isStoryMention) {
      thumbnailHtml = `
        <div class="act-story-thumbnail" onclick="ActivityManager.openLinkedStory('${item.sender_id}')" title="View 24h story">
          <div class="act-story-ring-inner">
            <span>✨</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="act-row ${!item.is_seen ? 'act-unread' : ''}" id="act-row-${item.id}">
        <div class="act-avatar-wrap story-ring-active">
          <div class="act-avatar" style="background:${item.sender_color || '#ec4899'};">
            ${item.sender_avatar ? `<img src="${item.sender_avatar}" alt="${item.sender_name}"/>` : initial}
          </div>
          <span class="act-sub-badge">${iconBadge}</span>
        </div>

        <div class="act-content">
          <div class="act-description-inline">
            <strong class="act-sender-name">${_escape(item.sender_name)}</strong>
            <span class="act-action-desc">${_escape(item.text)}</span>
            <span class="act-time-stamp">${_formatTime(item.created_at)}</span>
          </div>
          ${item.detail ? `<div class="act-sub-detail">"${_escape(item.detail)}"</div>` : ''}
          ${isAcceptedReq ? `<div class="act-confirmed-pill">Friends ✓</div>` : ''}
        </div>

        ${thumbnailHtml}
      </div>
    `;
  }

  // ── CONFIRM FRIEND REQUEST (Instagram Style) ──
  function confirmFriendRequest(actId, buddyId, buddyName) {
    const item = state.activities.find(a => a.id === actId);
    if (item) {
      item.status = 'accepted';
      item.is_seen = true;
      _saveActivities(state.activities);
    }

    // Call ChatManager to accept into conversations
    if (window.ChatManager) {
      if (typeof window.ChatManager.acceptRequest === 'function') {
        window.ChatManager.acceptRequest(buddyId);
      }
      if (typeof window.ChatManager.ensureAndOpenBuddyChat === 'function') {
        const buddy = {
          id: buddyId,
          name: buddyName,
          color: item ? item.sender_color : '#6366f1',
          username: item ? item.sender_username : '@buddy'
        };
        window.ChatManager.ensureAndOpenBuddyChat(buddy, `Hey! 👋 We are now connected on BUDDY!`);
      }
    }

    // Play confirmation chime
    _playChime();

    // Update UI in-place
    const actionsBox = document.getElementById(`act-actions-${actId}`);
    if (actionsBox) {
      actionsBox.innerHTML = `
        <span class="act-confirmed-pill" style="background:rgba(16, 185, 129, 0.18); color:#10b981; border:1px solid rgba(16, 185, 129, 0.35);">
          Friends ✓
        </span>
      `;
    }

    updateBadge();

    if (window.showToast) {
      window.showToast(`✨ You and ${buddyName} are now connected as Friends!`);
    }
  }

  // ── DELETE FRIEND REQUEST ──
  function deleteFriendRequest(actId, buddyId) {
    state.activities = state.activities.filter(a => a.id !== actId);
    _saveActivities(state.activities);

    if (window.ChatManager && typeof window.ChatManager.declineRequest === 'function') {
      window.ChatManager.declineRequest(buddyId);
    }

    const row = document.getElementById(`act-row-${actId}`);
    if (row) {
      row.style.opacity = '0';
      row.style.transform = 'translateX(20px)';
      setTimeout(() => {
        row.remove();
        renderActivityFeed();
      }, 250);
    }

    updateBadge();

    if (window.showToast) {
      window.showToast(`🗑️ Friend request removed.`);
    }
  }

  // ── OPEN LINKED REEL ──
  function openLinkedReel(tapeId) {
    closeActivityHub();
    const tabTapesBtn = document.getElementById('tab-tapes-btn');
    if (tabTapesBtn) tabTapesBtn.click();

    setTimeout(() => {
      if (window.TapesManager && typeof window.TapesManager.focusTape === 'function') {
        window.TapesManager.focusTape(tapeId);
      } else {
        const card = document.querySelector(`.tape-card[data-tape-id="${tapeId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 200);
  }

  // ── OPEN LINKED STORY ──
  function openLinkedStory(userId) {
    closeActivityHub();
    if (window.StoriesManager && typeof window.StoriesManager.openStoryViewer === 'function') {
      window.StoriesManager.openStoryViewer(userId || 'ananya-sharma', 0);
    }
  }

  // ── LOG REEL LINKED TO STORY (When anyone links user's reel) ──
  function logReelLinkedToStory(actor, tape) {
    if (!actor || !tape) return;

    const newAct = {
      id: 'act_reel_' + Date.now(),
      type: 'reel_linked_story',
      sender_id: actor.id || 'ananya-sharma',
      sender_name: actor.name || 'Ananya Sharma',
      sender_username: actor.username || '@ananya_coffee',
      sender_avatar: actor.avatar || null,
      sender_color: actor.color || '#ec4899',
      status: 'done',
      text: 'linked your uploaded reel in their story 🎬',
      detail: tape.caption || tape.title || 'Awesome Reel Moment',
      tape_id: tape.id,
      tape_video: tape.video_url,
      created_at: new Date().toISOString(),
      is_seen: false
    };

    state.activities = _loadActivities();
    state.activities.unshift(newAct);
    _saveActivities(state.activities);
    updateBadge();

    // Show dedicated top Instagram notification
    _showActivityNotifBanner(newAct);
    _playChime();
  }

  // ── SIMULATION 1: TEST REEL LINKED TO STORY ──
  function simulateReelLinkedToStory(customTapeId) {
    const buddies = [
      { id: 'ananya-sharma', name: 'Ananya Sharma', username: '@ananya_coffee', color: '#f43f5e' },
      { id: 'dev-kapoor', name: 'Dev Kapoor', username: '@dev_beats', color: '#0ea5e9' },
      { id: 'simran-kaur', name: 'Simran Kaur', username: '@simran_art', color: '#10b981' }
    ];
    const buddy = buddies[Math.floor(Math.random() * buddies.length)];

    let tape = null;
    if (window.TapesManager && Array.isArray(window.TapesManager.getTapes?.())) {
      const tapes = window.TapesManager.getTapes();
      tape = tapes.find(t => t.id === customTapeId) || tapes[0];
    }
    if (!tape) {
      tape = {
        id: customTapeId || 'tape-3',
        caption: 'Chasing golden hour road trip & lo-fi beats with buddies 🚗🌅',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      };
    }

    logReelLinkedToStory(buddy, tape);

    if (window.showToast) {
      window.showToast(`✨ ${buddy.name} linked your uploaded reel in their story!`);
    }
  }

  // ── SIMULATION 2: TEST FRIEND REQUEST ──
  function simulateFriendRequest() {
    const candidates = [
      { id: 'simran-kaur', name: 'Simran Kaur', username: '@simran_art', color: '#10b981', bio: 'Art & Travel Diary • 6.5 km away' },
      { id: 'dev-kapoor', name: 'Dev Kapoor', username: '@dev_beats', color: '#0ea5e9', bio: 'Music producer by night • 4.2 km away' },
      { id: 'aarav-patel', name: 'Aarav Patel', username: '@aarav_p', color: '#8b5cf6', bio: 'Coffee & Late Night Talks' }
    ];
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    const newReq = {
      id: 'act_req_' + Date.now(),
      type: 'friend_request',
      sender_id: chosen.id,
      sender_name: chosen.name,
      sender_username: chosen.username,
      sender_avatar: null,
      sender_color: chosen.color,
      status: 'pending',
      text: 'sent you a friend request',
      detail: chosen.bio,
      created_at: new Date().toISOString(),
      is_seen: false
    };

    state.activities = _loadActivities();
    // remove duplicate if pending
    state.activities = state.activities.filter(a => !(a.sender_id === chosen.id && a.status === 'pending'));
    state.activities.unshift(newReq);
    _saveActivities(state.activities);
    updateBadge();

    // Trigger in ChatManager as well
    if (window.ChatManager && typeof window.ChatManager.receiveFriendRequest === 'function') {
      window.ChatManager.receiveFriendRequest(chosen, `Hey! 👋 Sent you a friend request. Let's connect! ✨`);
    } else {
      _showActivityNotifBanner(newReq);
      _playChime();
    }

    if (window.showToast) {
      window.showToast(`📩 Friend request received from ${chosen.name}!`);
    }
  }

  // ── NOTIFICATION BANNER POPUP ──
  function _showActivityNotifBanner(act) {
    let banner = document.getElementById('buddy-inapp-notif');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'buddy-inapp-notif';
      banner.className = 'buddy-inapp-notif hidden';
      document.body.appendChild(banner);
    }

    const isReel = act.type === 'reel_linked_story';
    const initial = (act.sender_name || 'U').charAt(0).toUpperCase();

    banner.className = 'buddy-inapp-notif request-notif-theme';
    banner.innerHTML = `
      <div class="inapp-notif-avatar" style="background:${act.sender_color || '#f43f5e'};">
        ${isReel ? '🎬' : '💌'}
      </div>
      <div class="inapp-notif-body">
        <div class="inapp-notif-header">
          <span class="inapp-notif-name"><span class="notif-tag-pill">${isReel ? 'REEL LINKED' : 'REQUEST'}</span> ${_escape(act.sender_name)}</span>
          <span class="inapp-notif-time">Just now</span>
        </div>
        <div class="inapp-notif-text">${_escape(act.text)}</div>
      </div>
      <div class="inapp-notif-actions">
        <button type="button" class="inapp-notif-btn notif-accept-btn" onclick="ActivityManager.openActivityHub(); document.getElementById('buddy-inapp-notif')?.classList.remove('show');">
          View
        </button>
      </div>
    `;

    banner.onclick = () => {
      openActivityHub();
      banner.classList.remove('show');
      setTimeout(() => banner.classList.add('hidden'), 300);
    };

    banner.classList.remove('hidden');
    requestAnimationFrame(() => banner.classList.add('show'));

    if (banner._hideTimer) clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(() => banner.classList.add('hidden'), 300);
    }, 5500);
  }

  function _playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.16, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.51);
    } catch(e) {}
  }

  function init() {
    if (state.isInitialized) return;
    state.isInitialized = true;
    console.log('❤️ [BUDDY Activity] Initializing Instagram Activity & Request Hub...');
    state.activities = _loadActivities();
    updateBadge();

    // Sync badge every 5 seconds
    setInterval(updateBadge, 5000);
  }

  return {
    init,
    getUnreadCount,
    updateBadge,
    openActivityHub,
    closeActivityHub,
    setFilter,
    renderActivityFeed,
    confirmFriendRequest,
    deleteFriendRequest,
    openLinkedReel,
    openLinkedStory,
    logReelLinkedToStory,
    simulateReelLinkedToStory,
    simulateFriendRequest
  };
})();

if (typeof window !== 'undefined') {
  window.ActivityManager = ActivityManager;
  document.addEventListener('DOMContentLoaded', () => {
    ActivityManager.init();
  });
}
