/**
 * BUDDY - stories-manager.js (v207)
 * Feature 1 (Inspired by WAF): 24-Hour Ephemeral Moments & Stories
 * 
 * Capabilities:
 * - 24-Hour Auto-Expiring Stories (Photo / Video / Text Moments)
 * - Instagram / WhatsApp style Horizontal Stories Rail above Chats
 * - Gradient Glowing Avatar Rings (Unseen vs Seen status)
 * - Full-Screen Segmented Progress Story Viewer with Tap Left/Right & Hold-to-Pause
 * - Quick Direct Message & Emoji Reaction Replies to 1-on-1 BUDDY Chat
 * - Offline LocalStorage Cache + Cloud Supabase Realtime Sync (100% Free ₹0)
 */

const StoriesManager = (() => {
  const STORAGE_KEY = 'buddy_stories_store_v1';
  const SEEN_KEY = 'buddy_stories_seen_v1';

  const GRADIENTS = [
    { id: 'sunset', name: 'Sunset Romance', val: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #f59e0b 100%)' },
    { id: 'neon', name: 'Neon Dream', val: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%)' },
    { id: 'ocean', name: 'Ocean Breeze', val: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)' },
    { id: 'emerald', name: 'Emerald Vibe', val: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)' },
    { id: 'luxe', name: 'Midnight Luxe', val: 'linear-gradient(135deg, #27272a 0%, #18181b 50%, #09090b 100%)' },
    { id: 'amber', name: 'Warm Amber', val: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)' }
  ];

  let state = {
    stories: [], // Array of story objects
    activeUserStories: [], // Stories of current viewing user
    activeUserIndex: 0,
    currentStoryIndex: 0,
    isPaused: false,
    storyTimer: null,
    progressInterval: null,
    progressPercent: 0,
    selectedGradient: GRADIENTS[0].val,
    addStoryType: 'text' // 'text' | 'photo'
  };

  // ── Helper: Get Current User ──
  function _getCurrentUser() {
    if (window.ChatManager && typeof window.ChatManager.getCurrentUser === 'function') {
      const u = window.ChatManager.getCurrentUser();
      if (u) return u;
    }
    try {
      const sess = localStorage.getItem('buddy-session');
      if (sess) return JSON.parse(sess);
    } catch (e) {}
    return { id: 'guest', name: 'You', username: '@you', color: '#f43f5e' };
  }

  // ── Helper: Load & Clean Expired Stories (Older than 24h) ──
  function _loadLocalStories() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      const now = Date.now();
      // Keep only stories less than 24h old
      const valid = list.filter(s => {
        const time = new Date(s.created_at).getTime();
        return (now - time) < 24 * 60 * 60 * 1000;
      });
      if (valid.length !== list.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      }
      return valid;
    } catch (e) {
      return [];
    }
  }

  function _saveLocalStories(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function _getSeenMap() {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function _markStorySeen(storyId) {
    try {
      const map = _getSeenMap();
      map[storyId] = Date.now();
      localStorage.setItem(SEEN_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  // ── Cloud Supabase Synchronization ──
  async function _syncCloudStories() {
    if (!window.BuddySupabase) return;
    try {
      const client = window.BuddySupabase.getClient ? window.BuddySupabase.getClient() : null;
      if (!client) return;

      const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await client
        .from('stories')
        .select('*')
        .gt('created_at', cutoff24h)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        // Merge with local stories
        const local = _loadLocalStories();
        const mergedMap = new Map();
        local.forEach(s => mergedMap.set(s.id, s));
        data.forEach(s => mergedMap.set(s.id, s));

        state.stories = Array.from(mergedMap.values());
        _saveLocalStories(state.stories);
        renderRail();
      }
    } catch (e) {
      console.warn('[BUDDY Stories] Cloud sync fallback:', e);
    }
  }

  // ── 1. RENDER STORIES HORIZONTAL RAIL ──
  function renderRail() {
    const rail = document.getElementById('stories-rail');
    if (!rail) return;

    state.stories = _loadLocalStories();
    const currentUser = _getCurrentUser();
    const seenMap = _getSeenMap();

    // Group stories by user_id
    const userMap = new Map();
    state.stories.forEach(s => {
      if (!userMap.has(s.user_id)) {
        userMap.set(s.user_id, {
          user_id: s.user_id,
          user_name: s.user_name || 'Friend',
          user_avatar: s.user_avatar || '',
          user_color: s.user_color || '#6366F1',
          stories: []
        });
      }
      userMap.get(s.user_id).stories.push(s);
    });

    const myStoriesObj = userMap.get(currentUser.id);
    const myStories = myStoriesObj ? myStoriesObj.stories : [];

    // Filter other friends' stories
    const friendGroups = Array.from(userMap.values()).filter(g => g.user_id !== currentUser.id);

    let html = '';

    // ITEM 1: YOUR STORY
    const hasMyStory = myStories.length > 0;
    const initial = (currentUser.name || 'U').charAt(0).toUpperCase();

    html += `
      <div class="story-rail-item ${hasMyStory ? 'has-story' : 'add-story'}" id="story-my-item">
        <div class="story-avatar-wrap ${hasMyStory ? 'active-ring' : ''}">
          <div class="story-avatar-circle" style="background: ${currentUser.color || '#f43f5e'};">
            ${currentUser.avatar ? `<img src="${currentUser.avatar}" alt="You" />` : initial}
          </div>
          <button type="button" class="story-add-badge-btn" id="btn-open-add-story" title="Add to Story">
            +
          </button>
        </div>
        <span class="story-user-name">${hasMyStory ? 'Your Story' : 'Add Story'}</span>
      </div>
    `;

    // ITEMS 2..N: FRIENDS' STORIES
    friendGroups.forEach(group => {
      const allSeen = group.stories.every(s => !!seenMap[s.id]);
      const fInitial = (group.user_name || 'F').charAt(0).toUpperCase();
      const displayName = group.user_name.split(' ')[0].slice(0, 9);

      html += `
        <div class="story-rail-item friend-story-item" data-user-id="${group.user_id}">
          <div class="story-avatar-wrap ${allSeen ? 'seen-ring' : 'active-ring'}">
            <div class="story-avatar-circle" style="background: ${group.user_color || '#8b5cf6'};">
              ${group.user_avatar ? `<img src="${group.user_avatar}" alt="${group.user_name}" />` : fInitial}
            </div>
          </div>
          <span class="story-user-name">${displayName}</span>
        </div>
      `;
    });

    rail.innerHTML = html;
    _bindRailEvents(userMap, myStories, currentUser);
  }

  function _bindRailEvents(userMap, myStories, currentUser) {
    // Add Story Button click
    const addBtn = document.getElementById('btn-open-add-story');
    if (addBtn) {
      addBtn.onclick = (e) => {
        e.stopPropagation();
        openAddStoryModal();
      };
    }

    // My Story Avatar click
    const myItem = document.getElementById('story-my-item');
    if (myItem) {
      myItem.onclick = (e) => {
        if (e.target.closest('#btn-open-add-story')) return;
        if (myStories.length > 0) {
          openStoryViewer(currentUser.id, 0);
        } else {
          openAddStoryModal();
        }
      };
    }

    // Friend Story Avatars click
    document.querySelectorAll('.friend-story-item').forEach(item => {
      item.onclick = () => {
        const uid = item.dataset.userId;
        if (uid && userMap.has(uid)) {
          openStoryViewer(uid, 0);
        }
      };
    });
  }

  // ── 2. ADD STORY MODAL (Photo & Text Thoughts) ──
  function openAddStoryModal() {
    const modal = document.getElementById('add-story-modal-overlay');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      _renderAddStoryModal();
    }
  }

  function closeAddStoryModal() {
    const modal = document.getElementById('add-story-modal-overlay');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }

  function _renderAddStoryModal() {
    const container = document.getElementById('add-story-content-wrap');
    if (!container) return;

    container.innerHTML = `
      <div class="add-story-sheet">
        <div class="add-story-header">
          <div class="add-story-title">
            <span>✨</span> Create Story
          </div>
          <button type="button" class="add-story-close-btn" id="btn-close-add-story">✕</button>
        </div>

        <!-- Mode Tabs: Text vs Photo -->
        <div class="add-story-tabs">
          <button type="button" class="as-tab-btn ${state.addStoryType === 'text' ? 'active' : ''}" id="as-tab-text">
            ✍️ Text Story
          </button>
          <button type="button" class="as-tab-btn ${state.addStoryType === 'photo' ? 'active' : ''}" id="as-tab-photo">
            📸 Photo / Video
          </button>
        </div>

        ${state.addStoryType === 'text' ? `
          <!-- Text Story View -->
          <div class="as-text-preview-card" style="background: ${state.selectedGradient};">
            <textarea 
              id="as-text-input" 
              class="as-text-textarea" 
              placeholder="What's on your mind? Share a thought, feeling, or lyric..." 
              maxlength="280"
              rows="4"
            ></textarea>
          </div>

          <!-- Color Gradient Picker -->
          <div class="as-palette-label">Choose Theme Background:</div>
          <div class="as-palette-row">
            ${GRADIENTS.map(g => `
              <button 
                type="button" 
                class="as-gradient-pill ${state.selectedGradient === g.val ? 'selected' : ''}" 
                style="background: ${g.val};" 
                data-grad="${g.val}"
                title="${g.name}"
              ></button>
            `).join('')}
          </div>
        ` : `
          <!-- Photo / Video View -->
          <div class="as-photo-dropzone" id="as-photo-zone">
            <input type="file" id="as-file-input" accept="image/*,video/*" class="hidden" />
            <div id="as-photo-preview-box">
              <span class="as-upload-icon">🖼️</span>
              <p class="as-upload-hint">Tap to select photo from gallery or take a picture</p>
              <button type="button" class="as-upload-btn" id="as-btn-pick-file">Choose Media</button>
            </div>
          </div>

          <div class="as-caption-box">
            <input type="text" id="as-photo-caption" placeholder="Add a sweet caption..." maxlength="120" />
          </div>
        `}

        <!-- Submit Button -->
        <button type="button" class="as-submit-btn" id="as-btn-publish">
          Share to Story 🚀
        </button>
      </div>
    `;

    _bindAddStoryEvents();
  }

  function _bindAddStoryEvents() {
    const closeBtn = document.getElementById('btn-close-add-story');
    if (closeBtn) closeBtn.onclick = () => closeAddStoryModal();

    const tabText = document.getElementById('as-tab-text');
    const tabPhoto = document.getElementById('as-tab-photo');

    if (tabText) {
      tabText.onclick = () => {
        state.addStoryType = 'text';
        _renderAddStoryModal();
      };
    }
    if (tabPhoto) {
      tabPhoto.onclick = () => {
        state.addStoryType = 'photo';
        _renderAddStoryModal();
      };
    }

    // Palette gradient clicks
    document.querySelectorAll('.as-gradient-pill').forEach(pill => {
      pill.onclick = () => {
        state.selectedGradient = pill.dataset.grad;
        const preview = document.querySelector('.as-text-preview-card');
        if (preview) preview.style.background = state.selectedGradient;
        document.querySelectorAll('.as-gradient-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
      };
    });

    // File picker
    const fileInput = document.getElementById('as-file-input');
    const pickBtn = document.getElementById('as-btn-pick-file');
    const photoZone = document.getElementById('as-photo-zone');

    if (pickBtn && fileInput) pickBtn.onclick = () => fileInput.click();
    if (photoZone && fileInput) {
      photoZone.onclick = (e) => {
        if (!e.target.closest('#as-file-input')) fileInput.click();
      };
    }

    let loadedMediaData = null;
    let loadedMediaType = 'photo';

    if (fileInput) {
      fileInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        loadedMediaType = file.type.startsWith('video') ? 'video' : 'photo';
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          loadedMediaData = loadEvt.target.result;
          const previewBox = document.getElementById('as-photo-preview-box');
          if (previewBox) {
            if (loadedMediaType === 'video') {
              previewBox.innerHTML = `
                <video src="${loadedMediaData}" autoplay muted loop class="as-preview-media"></video>
                <button type="button" class="as-change-media-btn" id="as-btn-repick">Change 🔄</button>
              `;
            } else {
              previewBox.innerHTML = `
                <img src="${loadedMediaData}" alt="Story Preview" class="as-preview-media" />
                <button type="button" class="as-change-media-btn" id="as-btn-repick">Change 🔄</button>
              `;
            }
            const repick = document.getElementById('as-btn-repick');
            if (repick) repick.onclick = (re) => { re.stopPropagation(); fileInput.click(); };
          }
        };
        reader.readAsDataURL(file);
      };
    }

    // Publish Story
    const publishBtn = document.getElementById('as-btn-publish');
    if (publishBtn) {
      publishBtn.onclick = async () => {
        const currentUser = _getCurrentUser();
        publishBtn.disabled = true;
        publishBtn.textContent = 'Publishing... ⏳';

        let storyObj = null;
        if (state.addStoryType === 'text') {
          const textEl = document.getElementById('as-text-input');
          const text = (textEl && textEl.value ? textEl.value.trim() : '');
          if (!text) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ Please write something in your story!');
            publishBtn.disabled = false;
            publishBtn.textContent = 'Share to Story 🚀';
            return;
          }

          storyObj = {
            id: 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            user_id: currentUser.id,
            user_name: currentUser.name || 'User',
            user_username: currentUser.username || '',
            user_avatar: currentUser.avatar || '',
            user_color: currentUser.color || '#6366F1',
            type: 'text',
            text_content: text,
            bg_gradient: state.selectedGradient,
            caption: '',
            created_at: new Date().toISOString()
          };
        } else {
          if (!loadedMediaData) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ Please choose a photo or video to share!');
            publishBtn.disabled = false;
            publishBtn.textContent = 'Share to Story 🚀';
            return;
          }

          const capEl = document.getElementById('as-photo-caption');
          storyObj = {
            id: 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            user_id: currentUser.id,
            user_name: currentUser.name || 'User',
            user_username: currentUser.username || '',
            user_avatar: currentUser.avatar || '',
            user_color: currentUser.color || '#6366F1',
            type: loadedMediaType,
            media_url: loadedMediaData,
            text_content: '',
            caption: capEl && capEl.value ? capEl.value.trim() : '',
            created_at: new Date().toISOString()
          };
        }

        // Save locally
        const currentList = _loadLocalStories();
        currentList.push(storyObj);
        _saveLocalStories(currentList);

        // Upload to Supabase if authenticated
        if (window.BuddySupabase && currentUser.id !== 'guest') {
          try {
            const client = window.BuddySupabase.getClient();
            if (client) {
              await client.from('stories').insert({
                id: storyObj.id,
                user_id: storyObj.user_id,
                user_name: storyObj.user_name,
                user_username: storyObj.user_username,
                user_avatar: storyObj.user_avatar,
                user_color: storyObj.user_color,
                type: storyObj.type,
                media_url: storyObj.media_url,
                text_content: storyObj.text_content,
                bg_gradient: storyObj.bg_gradient,
                caption: storyObj.caption,
                created_at: storyObj.created_at
              });
            }
          } catch (err) {
            console.warn('[BUDDY Stories] Cloud upload fallback to local cache:', err);
          }
        }

        closeAddStoryModal();
        renderRail();
        if (typeof window.showToast === 'function') {
          window.showToast('✨ Story published successfully!');
        }
      };
    }
  }

  // ── 3. FULLSCREEN STORY VIEWER ──
  function openStoryViewer(userId, startIndex = 0) {
    const list = _loadLocalStories();
    const userStories = list.filter(s => s.user_id === userId);
    if (userStories.length === 0) return;

    state.activeUserStories = userStories;
    state.currentStoryIndex = Math.min(Math.max(0, startIndex), userStories.length - 1);

    const modal = document.getElementById('story-viewer-modal-overlay');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      _renderCurrentStorySlide();
    }
  }

  function closeStoryViewer() {
    _clearStoryTimers();
    const modal = document.getElementById('story-viewer-modal-overlay');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }

  function _clearStoryTimers() {
    clearTimeout(state.storyTimer);
    clearInterval(state.progressInterval);
    state.progressPercent = 0;
  }

  function _renderCurrentStorySlide() {
    _clearStoryTimers();
    const story = state.activeUserStories[state.currentStoryIndex];
    if (!story) {
      closeStoryViewer();
      return;
    }

    _markStorySeen(story.id);

    const currentUser = _getCurrentUser();
    const isMyStory = story.user_id === currentUser.id;
    const container = document.getElementById('story-viewer-content');
    if (!container) return;

    // Relative time format (e.g., 2h ago)
    const timeAgo = _formatRelativeTime(story.created_at);
    const initial = (story.user_name || 'U').charAt(0).toUpperCase();

    container.innerHTML = `
      <div class="sv-slide-container" id="sv-slide-box">
        <!-- Segmented Top Progress Bars -->
        <div class="sv-progress-row">
          ${state.activeUserStories.map((_, i) => `
            <div class="sv-progress-track">
              <div class="sv-progress-fill" id="sv-prog-${i}" style="width: ${i < state.currentStoryIndex ? '100%' : (i === state.currentStoryIndex ? '0%' : '0%')};"></div>
            </div>
          `).join('')}
        </div>

        <!-- Top Header (Author & Close) -->
        <div class="sv-top-header">
          <div class="sv-author-meta">
            <div class="sv-avatar" style="background: ${story.user_color || '#6366F1'};">
              ${story.user_avatar ? `<img src="${story.user_avatar}" alt="${story.user_name}" />` : initial}
            </div>
            <div>
              <div class="sv-author-name">${story.user_name}</div>
              <div class="sv-timestamp">${timeAgo}</div>
            </div>
          </div>
          <div class="sv-header-actions">
            ${isMyStory ? `
              <button type="button" class="sv-delete-btn" id="sv-btn-delete-story" title="Delete Story">
                🗑️
              </button>
            ` : ''}
            <button type="button" class="sv-close-btn" id="sv-btn-close-viewer" title="Close">✕</button>
          </div>
        </div>

        <!-- Touch Zones for Navigation -->
        <div class="sv-touch-zone left" id="sv-touch-prev" title="Tap for previous slide"></div>
        <div class="sv-touch-zone right" id="sv-touch-next" title="Tap for next slide"></div>

        <!-- Main Slide Body -->
        <div class="sv-body-content">
          ${story.type === 'text' ? `
            <div class="sv-text-card" style="background: ${story.bg_gradient || 'linear-gradient(135deg, #f43f5e, #8b5cf6)'};">
              <p class="sv-text-body">${_escapeHtml(story.text_content)}</p>
            </div>
          ` : (story.type === 'video' ? `
            <video src="${story.media_url}" autoplay playsinline class="sv-media-asset" id="sv-video-el"></video>
            ${story.caption ? `<div class="sv-caption-pill">${_escapeHtml(story.caption)}</div>` : ''}
          ` : `
            <img src="${story.media_url}" alt="Story" class="sv-media-asset" />
            ${story.caption ? `<div class="sv-caption-pill">${_escapeHtml(story.caption)}</div>` : ''}
          `)}
        </div>

        <!-- Bottom Action / Reply Bar (for Friends' stories) -->
        ${!isMyStory ? `
          <div class="sv-bottom-reply-bar">
            <div class="sv-reply-input-wrap">
              <input 
                type="text" 
                id="sv-reply-input" 
                placeholder="Reply to ${story.user_name.split(' ')[0]}..." 
                autocomplete="off"
              />
              <button type="button" class="sv-btn-send-reply" id="sv-btn-send-reply">➤</button>
            </div>
            <!-- Quick Emoji Reactions -->
            <div class="sv-quick-reactions">
              <span class="sv-rx" data-rx="❤️">❤️</span>
              <span class="sv-rx" data-rx="😂">😂</span>
              <span class="sv-rx" data-rx="🔥">🔥</span>
              <span class="sv-rx" data-rx="👏">👏</span>
              <span class="sv-rx" data-rx="😮">😮</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    _bindViewerEvents(story, isMyStory);
    _startStoryProgressTimer();
  }

  function _bindViewerEvents(story, isMyStory) {
    const closeBtn = document.getElementById('sv-btn-close-viewer');
    if (closeBtn) closeBtn.onclick = () => closeStoryViewer();

    // Delete own story
    const deleteBtn = document.getElementById('sv-btn-delete-story');
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (!confirm('Delete this story?')) return;
        const list = _loadLocalStories().filter(s => s.id !== story.id);
        _saveLocalStories(list);

        if (window.BuddySupabase) {
          try {
            const client = window.BuddySupabase.getClient();
            if (client) await client.from('stories').delete().eq('id', story.id);
          } catch (e) {}
        }

        renderRail();
        closeStoryViewer();
        if (typeof window.showToast === 'function') window.showToast('🗑️ Story deleted');
      };
    }

    // Tap Left -> Previous Slide
    const leftZone = document.getElementById('sv-touch-prev');
    if (leftZone) {
      leftZone.onclick = () => {
        if (state.currentStoryIndex > 0) {
          state.currentStoryIndex--;
          _renderCurrentStorySlide();
        } else {
          closeStoryViewer();
        }
      };
    }

    // Tap Right -> Next Slide
    const rightZone = document.getElementById('sv-touch-next');
    if (rightZone) {
      rightZone.onclick = () => {
        if (state.currentStoryIndex < state.activeUserStories.length - 1) {
          state.currentStoryIndex++;
          _renderCurrentStorySlide();
        } else {
          closeStoryViewer();
        }
      };
    }

    // Hold to Pause (Touch & Mouse)
    const slideBox = document.getElementById('sv-slide-box');
    if (slideBox) {
      const onHoldStart = (e) => {
        if (e.target.closest('.sv-bottom-reply-bar') || e.target.closest('.sv-top-header')) return;
        state.isPaused = true;
        const v = document.getElementById('sv-video-el');
        if (v) v.pause();
      };
      const onHoldEnd = () => {
        state.isPaused = false;
        const v = document.getElementById('sv-video-el');
        if (v) v.play();
      };

      slideBox.addEventListener('touchstart', onHoldStart, { passive: true });
      slideBox.addEventListener('touchend', onHoldEnd);
      slideBox.addEventListener('mousedown', onHoldStart);
      slideBox.addEventListener('mouseup', onHoldEnd);
    }

    // Reply & Reactions to 1-on-1 BUDDY Chat
    if (!isMyStory) {
      const sendBtn = document.getElementById('sv-btn-send-reply');
      const input = document.getElementById('sv-reply-input');

      const handleSendReply = (customText) => {
        const text = customText || (input ? input.value.trim() : '');
        if (!text) return;

        const replyMsg = `📸 Replied to your story: "${text}"`;
        if (window.ChatManager && typeof window.ChatManager.sendDirectTextMessageToUser === 'function') {
          window.ChatManager.sendDirectTextMessageToUser({ id: story.user_id, name: story.user_name }, replyMsg);
        }

        if (input) input.value = '';
        if (typeof window.showToast === 'function') {
          window.showToast(`✉️ Replied to ${story.user_name}!`);
        }
      };

      if (sendBtn) sendBtn.onclick = () => handleSendReply();
      if (input) {
        input.onkeydown = (e) => {
          if (e.key === 'Enter') handleSendReply();
        };
      }

      // Quick Emoji Reactions
      document.querySelectorAll('.sv-rx').forEach(rx => {
        rx.onclick = () => {
          const emoji = rx.dataset.rx;
          handleSendReply(`Reacted ${emoji} to your story`);
          if (navigator.vibrate) navigator.vibrate(20);
        };
      });
    }
  }

  // ── Auto Progress Segment Timer (5 Seconds per Slide) ──
  function _startStoryProgressTimer() {
    const DURATION = 5000;
    const INTERVAL = 50;
    const totalTicks = DURATION / INTERVAL;
    let ticks = 0;

    const fillBar = document.getElementById(`sv-prog-${state.currentStoryIndex}`);

    state.progressInterval = setInterval(() => {
      if (state.isPaused) return;

      ticks++;
      const pct = Math.min(100, (ticks / totalTicks) * 100);
      if (fillBar) fillBar.style.width = pct + '%';

      if (ticks >= totalTicks) {
        clearInterval(state.progressInterval);
        // Advance to next slide
        if (state.currentStoryIndex < state.activeUserStories.length - 1) {
          state.currentStoryIndex++;
          _renderCurrentStorySlide();
        } else {
          closeStoryViewer();
          renderRail();
        }
      }
    }, INTERVAL);
  }

  function _formatRelativeTime(isoString) {
    if (!isoString) return 'Just now';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return '1d ago';
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
    console.log('📸 [BUDDY Stories] Initializing 24h Moments & Status Engine...');
    renderRail();
    _syncCloudStories();

    // Check periodically for expired stories
    setInterval(() => {
      _loadLocalStories();
      renderRail();
    }, 60000);
  }

  function addStoryWithMedia(mediaData) {
    if (!mediaData) return null;
    const currentUser = _getCurrentUser();
    const storyObj = {
      id: 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      user_id: currentUser.id,
      user_name: currentUser.name || 'User',
      user_username: currentUser.username || '',
      user_avatar: currentUser.avatar || '',
      user_color: currentUser.color || '#6366F1',
      type: mediaData.type || 'video',
      media_url: mediaData.media_url,
      caption: mediaData.caption || '',
      linked_tape_id: mediaData.linked_tape_id || null,
      created_at: new Date().toISOString()
    };
    state.stories = _loadLocalStories();
    state.stories.push(storyObj);
    _saveLocalStories(state.stories);
    renderRail();
    return storyObj;
  }

  return {
    init,
    renderRail,
    openAddStoryModal,
    closeAddStoryModal,
    addStoryWithMedia,
    openStoryViewer,
    closeStoryViewer
  };
})();

if (typeof window !== 'undefined') {
  window.StoriesManager = StoriesManager;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StoriesManager.init());
  } else {
    setTimeout(() => StoriesManager.init(), 60);
  }
}
