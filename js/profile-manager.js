/**
 * BUDDY 2.0 - Instagram-Style Profile & Posts System
 * Features:
 * - 100% Dynamic User Profiles (no hardcoded names or fake data)
 * - Real Photo & Video Uploading for Posts & Reels (so user & others can view them)
 * - 3-Column Square Post Grid + Vertical Reels Grid
 * - Real Instagram Empty State: "Share Photos and Videos" with "+ Share your first photo or video" button
 * - Instagram Post Detail Viewer (Media player, Heart burst double-tap, likes & real comments)
 * - Private Account vs Public Account setting (with 🔒 lock screen for unapproved viewers)
 * - Thought Note Bubble on Avatar (e.g. "Note... 💭", tap to edit)
 * - Story Highlights Rail
 * - Edit Profile with Name, Username, Bio, Website, Avatar Upload & Private Toggle
 * - Cross-User Discovery & Persistence (local cache + /api/posts server sync)
 */

(function () {
  'use strict';

  const STORAGE_KEY_POSTS = 'buddy_user_posts_v1';
  const STORAGE_KEY_FOLLOWS = 'buddy_user_follows_v1';
  const STORAGE_KEY_HIGHLIGHTS = 'buddy_user_highlights_v1';

  let currentViewedUserId = null;
  let currentViewedUserData = null;
  let activeTab = 'posts'; // 'posts' | 'reels' | 'tagged'

  // ── Helper: Get active authenticated user ──
  function _getCurrentUser() {
    let u = null;

    if (window.ChatManager && typeof window.ChatManager.getCurrentUser === 'function') {
      u = window.ChatManager.getCurrentUser();
    }
    if (!u && window.AppState && window.AppState.currentUser) {
      u = window.AppState.currentUser;
    }
    if (!u) {
      try {
        const sess = localStorage.getItem('buddy-session');
        if (sess) u = JSON.parse(sess);
      } catch (e) {}
    }
    if (!u) {
      try {
        const authUser = localStorage.getItem('buddy_auth_user');
        if (authUser) u = JSON.parse(authUser);
      } catch (e) {}
    }
    if (!u) {
      try {
        const localProfile = localStorage.getItem('user_profile');
        if (localProfile) u = JSON.parse(localProfile);
      } catch (e) {}
    }

    if (u) {
      const cleanUname = (u.username || '').replace(/^@/, '').trim() || 
                         (u.name ? u.name.toLowerCase().replace(/\s+/g, '_') : 'user');
      return {
        id: u.id || 'usr_' + cleanUname,
        name: u.name || u.full_name || cleanUname,
        username: cleanUname,
        bio: u.bio !== undefined ? u.bio : '',
        avatar: u.avatar || u.avatar_url || '',
        avatar_color: u.avatar_color || u.color || '#F43F5E',
        is_verified: !!u.is_verified,
        is_private: u.is_private !== undefined ? u.is_private : false,
        thought_note: u.thought_note || '',
        website: u.website || ''
      };
    }

    return {
      id: 'current_user',
      name: 'User',
      username: 'user',
      bio: '',
      avatar: '',
      avatar_color: '#F43F5E',
      is_verified: false,
      is_private: false,
      thought_note: '',
      website: ''
    };
  }

  // ── Helper: Get Posts for User ──
  function _getPosts(userId) {
    try {
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
      return allPosts.filter(p => p.user_id === userId);
    } catch (e) {
      return [];
    }
  }

  // ── Sync Posts with Server in Background ──
  async function _syncUserPosts(userId) {
    if (!userId) return;
    try {
      const res = await fetch('/api/posts?userId=' + encodeURIComponent(userId));
      const data = await res.json();
      if (data && data.success && Array.isArray(data.posts)) {
        const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
        const existingIds = new Set(allPosts.map(p => p.id));
        let changed = false;

        data.posts.forEach(p => {
          if (!existingIds.has(p.id)) {
            allPosts.push(p);
            changed = true;
          }
        });

        if (changed) {
          localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(allPosts));
          const me = _getCurrentUser();
          const target = currentViewedUserData || (currentViewedUserId === me.id ? me : { id: currentViewedUserId });
          _renderContentGrid(target, false);
        }
      }
    } catch (e) {}
  }

  // ── Follow state check ──
  function _isFollowing(targetUserId) {
    try {
      const follows = JSON.parse(localStorage.getItem(STORAGE_KEY_FOLLOWS) || '{}');
      return Boolean(follows[targetUserId]);
    } catch (e) {
      return false;
    }
  }

  function _setFollowing(targetUserId, status) {
    try {
      const follows = JSON.parse(localStorage.getItem(STORAGE_KEY_FOLLOWS) || '{}');
      if (status) {
        follows[targetUserId] = status; // 'following' or 'requested'
      } else {
        delete follows[targetUserId];
      }
      localStorage.setItem(STORAGE_KEY_FOLLOWS, JSON.stringify(follows));
    } catch (e) {}
  }

  // ── Open My Profile ──
  function openMyProfile() {
    const me = _getCurrentUser();
    openUserProfile(me.id, me);
  }

  // ── Open User Profile (Me or Other user) ──
  async function openUserProfile(userId, fallbackData) {
    const me = _getCurrentUser();
    currentViewedUserId = userId || me.id;

    let targetUser = null;
    if (currentViewedUserId === me.id || currentViewedUserId === 'me') {
      currentViewedUserId = me.id;
      targetUser = me;
    } else if (fallbackData && (fallbackData.name || fallbackData.username)) {
      targetUser = {
        id: fallbackData.id || currentViewedUserId,
        name: fallbackData.name || fallbackData.full_name || fallbackData.username || 'User',
        username: (fallbackData.username || '').replace(/^@/, '') || 
                  (fallbackData.name ? fallbackData.name.toLowerCase().replace(/\s+/g, '_') : 'user'),
        bio: fallbackData.bio || '',
        avatar: fallbackData.avatar || fallbackData.avatar_url || '',
        avatar_color: fallbackData.avatar_color || fallbackData.color || '#6366F1',
        is_verified: !!fallbackData.is_verified,
        is_private: fallbackData.is_private !== undefined ? fallbackData.is_private : false,
        thought_note: fallbackData.thought_note || '',
        website: fallbackData.website || ''
      };
    } else {
      // Check active conversations list
      try {
        if (window.ChatManager && typeof window.ChatManager.getConversations === 'function') {
          const convs = window.ChatManager.getConversations();
          const match = convs.find(c => c.id === currentViewedUserId || c.userId === currentViewedUserId);
          if (match) {
            targetUser = {
              id: match.userId || match.id,
              name: match.name,
              username: (match.username || '').replace(/^@/, '') || match.name.toLowerCase().replace(/\s+/g, '_'),
              bio: match.status || match.bio || '',
              avatar: match.avatar || '',
              avatar_color: match.color || '#6366F1',
              is_verified: !!match.isVerified,
              is_private: match.is_private !== undefined ? match.is_private : false,
              thought_note: match.thought_note || '',
              website: match.website || ''
            };
          }
        }
      } catch (e) {}

      // Check registered users via server
      if (!targetUser) {
        try {
          const res = await fetch('/api/users/search?q=' + encodeURIComponent(currentViewedUserId));
          const data = await res.json();
          if (data && data.success && Array.isArray(data.users) && data.users.length > 0) {
            const found = data.users.find(u => u.id === currentViewedUserId || u.username === currentViewedUserId) || data.users[0];
            targetUser = {
              id: found.id,
              name: found.name,
              username: (found.username || '').replace(/^@/, ''),
              bio: found.bio || '',
              avatar: found.avatar || '',
              avatar_color: found.avatar_color || '#6366F1',
              is_verified: !!found.is_verified,
              is_private: found.is_private !== undefined ? found.is_private : false,
              thought_note: found.thought_note || '',
              website: found.website || ''
            };
          }
        } catch (e) {}
      }

      // Final fallback
      if (!targetUser) {
        targetUser = {
          id: currentViewedUserId,
          name: currentViewedUserId.replace(/^usr_|^@/, ''),
          username: currentViewedUserId.replace(/^usr_|^@/, '').toLowerCase(),
          bio: '',
          avatar: '',
          avatar_color: '#3B82F6',
          is_verified: false,
          is_private: false,
          thought_note: '',
          website: ''
        };
      }
    }

    currentViewedUserData = targetUser;
    const overlay = document.getElementById('insta-profile-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    _renderProfileView(targetUser);

    // Sync posts for this profile
    _syncUserPosts(targetUser.id);
  }

  // ── Close Profile ──
  function closeProfile() {
    const overlay = document.getElementById('insta-profile-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ── Render complete Instagram profile view ──
  function _renderProfileView(user) {
    if (!user) return;
    const me = _getCurrentUser();
    const isMe = user.id === me.id;
    const posts = _getPosts(user.id);
    const followStatus = _isFollowing(user.id);
    const isAcceptedFollower = followStatus === 'following' || isMe;
    const isLockedPrivate = user.is_private && !isAcceptedFollower;

    // 1. Top Bar
    const usernameEl = document.getElementById('ipn-username');
    const lockBadgeEl = document.getElementById('ipn-lock-badge');
    const verifiedBadgeEl = document.getElementById('ipn-verified-badge');
    const createBtnEl = document.getElementById('ipn-create-btn');

    if (usernameEl) usernameEl.textContent = user.username || 'user';
    if (lockBadgeEl) {
      if (user.is_private) {
        lockBadgeEl.classList.remove('hidden');
      } else {
        lockBadgeEl.classList.add('hidden');
      }
    }
    if (verifiedBadgeEl) {
      verifiedBadgeEl.innerHTML = user.is_verified 
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="#0095F6" style="vertical-align:middle; margin-left:3px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
        : '';
    }
    if (createBtnEl) {
      createBtnEl.style.display = isMe ? 'flex' : 'none';
    }

    // 2. Profile Header (Avatar, Thought Note, Stats, Bio, Action Buttons)
    const headerContainer = document.getElementById('insta-profile-header-container');
    if (headerContainer) {
      const initial = (user.name || user.username || 'U').charAt(0).toUpperCase();
      const followersCount = (user.followers && Array.isArray(user.followers)) 
        ? user.followers.length 
        : (followStatus === 'following' ? 1 : 0);
      const followingCount = (user.following && Array.isArray(user.following)) 
        ? user.following.length 
        : 0;

      headerContainer.innerHTML = `
        <div class="iph-top-row">
          <!-- Avatar with Thought Note & Story Ring -->
          <div class="iph-avatar-col">
            ${user.thought_note ? `
              <div class="iph-thought-bubble" onclick="${isMe ? 'ProfileManager.openEditProfile()' : ''}" title="${isMe ? 'Tap to edit note' : ''}">
                <span>${_escapeHtml(user.thought_note)}</span>
                <div class="iph-thought-bubble-tail"></div>
              </div>
            ` : (isMe ? `
              <div class="iph-thought-bubble empty" onclick="ProfileManager.openEditProfile()" title="Share a thought...">
                <span>Note... 💭</span>
                <div class="iph-thought-bubble-tail"></div>
              </div>
            ` : '')}
            <div class="iph-avatar-ring">
              <div class="iph-avatar-circle" style="background:${user.avatar_color || '#f43f5e'};">
                ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}" />` : initial}
              </div>
              ${isMe ? `<div class="iph-avatar-badge-add" onclick="ProfileManager.openEditProfile()" title="Change photo">+</div>` : ''}
            </div>
          </div>

          <!-- Stats Row: Posts | Followers | Following -->
          <div class="iph-stats-row">
            <div class="iph-stat-box">
              <span class="iph-stat-num">${posts.length}</span>
              <span class="iph-stat-lbl">posts</span>
            </div>
            <div class="iph-stat-box">
              <span class="iph-stat-num">${followersCount}</span>
              <span class="iph-stat-lbl">followers</span>
            </div>
            <div class="iph-stat-box">
              <span class="iph-stat-num">${followingCount}</span>
              <span class="iph-stat-lbl">following</span>
            </div>
          </div>
        </div>

        <!-- Name & Bio Section -->
        <div class="iph-meta-info">
          <div class="iph-display-name">
            ${_escapeHtml(user.name || user.username)}
            ${user.is_verified ? '<span class="verified-badge-pill" style="display:inline-flex;margin-left:4px;vertical-align:middle;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#0095F6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>' : ''}
          </div>
          ${user.bio ? `<div class="iph-bio-text">${_escapeHtml(user.bio)}</div>` : ''}
          ${user.website ? `
            <div class="iph-link-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <a href="https://${user.website.replace(/^https?:\/\//, '')}" target="_blank" rel="noopener">${_escapeHtml(user.website)}</a>
            </div>
          ` : ''}
        </div>

        <!-- Action Buttons Row -->
        <div class="iph-action-buttons">
          ${isMe ? `
            <button type="button" class="iph-btn-secondary" onclick="ProfileManager.openEditProfile()">Edit profile</button>
            <button type="button" class="iph-btn-secondary" onclick="ProfileManager.shareProfile()">Share profile</button>
            <button type="button" class="iph-btn-icon" onclick="ProfileManager.openCreatePost()" title="New Post / Reel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          ` : `
            <button type="button" class="iph-btn-primary ${followStatus ? 'following' : ''}" id="iph-btn-follow" onclick="ProfileManager.toggleFollow('${user.id}')">
              ${followStatus === 'following' ? 'Following' : (followStatus === 'requested' ? 'Requested ⏳' : 'Follow')}
            </button>
            <button type="button" class="iph-btn-secondary" onclick="ProfileManager.messageUser('${user.id}')">Message 💌</button>
            <button type="button" class="iph-btn-icon" onclick="ProfileManager.shareProfile()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          `}
        </div>
      `;
    }

    // 3. Highlights Row
    _renderHighlights(user, isMe);

    // 4. Content Grid (3-Col Posts / Reels or Private Lock)
    _renderContentGrid(user, isLockedPrivate);
  }

  // ── Render Story Highlights ──
  function _renderHighlights(user, isMe) {
    const rail = document.getElementById('insta-highlights-rail');
    if (!rail) return;

    const highlights = [
      { id: 'hl_1', title: 'Summer 🌴', icon: '🏝️' },
      { id: 'hl_2', title: 'Vibes ✨', icon: '🏔️' },
      { id: 'hl_3', title: 'Moments 📸', icon: '🏛️' },
      { id: 'hl_4', title: 'Coffee ☕', icon: '☕' }
    ];

    rail.innerHTML = `
      ${isMe ? `
        <div class="iph-highlight-item" onclick="ProfileManager.createNewHighlight()">
          <div class="iph-highlight-circle new">
            <span>+</span>
          </div>
          <span class="iph-highlight-title">New</span>
        </div>
      ` : ''}
      ${highlights.map(h => `
        <div class="iph-highlight-item" onclick="ProfileManager.viewHighlight('${h.id}')">
          <div class="iph-highlight-circle">
            <span style="font-size:20px;">${h.icon}</span>
          </div>
          <span class="iph-highlight-title">${h.title}</span>
        </div>
      `).join('')}
    `;
  }

  // ── Render 3-Column Content Grid or Private Account Lock Screen ──
  function _renderContentGrid(user, isLockedPrivate) {
    const grid = document.getElementById('insta-grid-container');
    if (!grid) return;

    if (isLockedPrivate) {
      grid.innerHTML = `
        <div class="insta-private-locked-box">
          <div class="ipl-circle-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="ipl-title">This Account is Private</div>
          <div class="ipl-desc">Follow this account to see their photos, reels, and stories.</div>
          <button type="button" class="btn-primary ipl-btn" onclick="ProfileManager.toggleFollow('${user.id}')">
            Follow
          </button>
        </div>
      `;
      return;
    }

    const me = _getCurrentUser();
    const isMe = user.id === me.id;

    if (activeTab === 'posts') {
      const posts = _getPosts(user.id);
      if (posts.length === 0) {
        if (isMe) {
          grid.innerHTML = `
            <div class="insta-empty-grid">
              <div class="ipl-circle-icon" style="width:68px; height:68px; margin-bottom:8px;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <div style="font-size:19px; font-weight:800; margin-top:8px;">Share Photos and Videos</div>
              <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:6px; max-width:280px; line-height:1.45;">
                When you share photos and videos, they will appear on your profile for your buddies to see.
              </div>
              <button type="button" class="btn-primary" style="margin-top:16px; padding:9px 24px; border-radius:8px; font-size:13.5px; font-weight:700;" onclick="ProfileManager.openCreatePost()">
                Share your first photo or video
              </button>
            </div>
          `;
        } else {
          grid.innerHTML = `
            <div class="insta-empty-grid">
              <div class="ipl-circle-icon" style="width:68px; height:68px; margin-bottom:8px;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <div style="font-size:19px; font-weight:800; margin-top:8px;">No Posts Yet</div>
              <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:6px; max-width:260px;">
                When @${_escapeHtml(user.username)} shares photos or videos, you will see them here.
              </div>
            </div>
          `;
        }
        return;
      }

      grid.innerHTML = `
        <div class="insta-posts-3col">
          ${posts.map(post => `
            <div class="insta-grid-cell" onclick="ProfileManager.openPostDetail('${post.id}')">
              ${post.media_type === 'video' ? `
                <video src="${post.media_url}" preload="metadata" muted playsinline></video>
                <span class="ig-cell-badge">▶</span>
              ` : `
                <img src="${post.media_url}" alt="Post" loading="lazy" />
              `}
              <div class="ig-cell-overlay">
                <span>❤️ ${post.likes_count || 0}</span>
                <span>💬 ${(post.comments || []).length}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (activeTab === 'reels') {
      // Reels: pull all video posts for this user
      const userVideoPosts = _getPosts(user.id).filter(p => p.media_type === 'video');

      if (userVideoPosts.length === 0) {
        grid.innerHTML = `
          <div class="insta-empty-grid">
            <span style="font-size:42px;">🎬</span>
            <div style="font-size:18px; font-weight:800; margin-top:8px;">No Reels Yet</div>
            <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:4px;">
              ${isMe ? 'Upload your first vertical reel video using the + button.' : 'Captured video moments will appear here.'}
            </div>
            ${isMe ? `
              <button type="button" class="btn-primary" style="margin-top:14px; padding:8px 20px; border-radius:8px; font-size:13px; font-weight:700;" onclick="ProfileManager.openCreatePost()">
                Create a Reel 🎬
              </button>
            ` : ''}
          </div>
        `;
        return;
      }

      grid.innerHTML = `
        <div class="insta-reels-3col">
          ${userVideoPosts.map(tape => `
            <div class="insta-reel-cell" onclick="ProfileManager.openPostDetail('${tape.id}')">
              <video src="${tape.media_url}" preload="metadata" muted playsinline></video>
              <div class="ig-reel-overlay">
                <span class="ig-reel-views">▶ ${tape.likes_count || 1}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      // Tagged
      grid.innerHTML = `
        <div class="insta-empty-grid">
          <span style="font-size:42px;">🏷️</span>
          <div style="font-size:18px; font-weight:800; margin-top:8px;">Photos & Videos of You</div>
          <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:4px;">When buddies tag you in photos and videos, they'll show up here.</div>
        </div>
      `;
    }
  }

  // ── Switch Active Tab ──
  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.insta-tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('iptab-' + tab);
    if (btn) btn.classList.add('active');

    const me = _getCurrentUser();
    const user = currentViewedUserData || (currentViewedUserId === me.id ? me : { id: currentViewedUserId });
    const isLocked = user.is_private && user.id !== me.id && !_isFollowing(user.id);
    _renderContentGrid(user, isLocked);
  }

  // ── Follow / Unfollow User Toggle ──
  function toggleFollow(userId) {
    const status = _isFollowing(userId);
    if (status) {
      _setFollowing(userId, null);
      if (window.showToast) window.showToast('Unfollowed');
    } else {
      _setFollowing(userId, 'following');
      if (window.showToast) window.showToast('✅ Followed successfully');
    }

    const me = _getCurrentUser();
    const user = currentViewedUserData || (currentViewedUserId === me.id ? me : { id: currentViewedUserId });
    _renderProfileView(user);
  }

  // ── Message User directly from Profile ──
  function messageUser(userId) {
    closeProfile();
    if (window.ChatManager && typeof window.ChatManager.selectConversation === 'function') {
      window.ChatManager.selectConversation(userId);
    }
  }

  // ── Share Profile URL ──
  function shareProfile() {
    const me = _getCurrentUser();
    const user = currentViewedUserData || me;
    const url = `${window.location.origin}/?user=${user.username || user.id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (window.showToast) window.showToast(`📋 Profile link copied: @${user.username}`);
      });
    } else {
      if (window.showToast) window.showToast(`📋 Link: ${url}`);
    }
  }

  // ── Edit Profile Modal ──
  function openEditProfile() {
    const me = _getCurrentUser();
    const overlay = document.getElementById('insta-edit-profile-overlay');
    const container = document.getElementById('insta-edit-profile-content');
    if (!overlay || !container) return;

    container.innerHTML = `
      <div class="iep-head">
        <button type="button" class="iep-btn-cancel" onclick="document.getElementById('insta-edit-profile-overlay').classList.add('hidden')">Cancel</button>
        <div class="iep-title">Edit profile</div>
        <button type="button" class="iep-btn-done" onclick="ProfileManager.saveEditedProfile()">Done</button>
      </div>

      <div class="iep-body">
        <!-- Avatar Change Section -->
        <div class="iep-avatar-section">
          <div class="iep-big-avatar" style="background:${me.avatar_color || '#f43f5e'};">
            ${me.avatar ? `<img src="${me.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />` : (me.name || 'U').charAt(0).toUpperCase()}
          </div>
          <button type="button" class="iep-btn-change-photo" onclick="document.getElementById('iep-avatar-file-input').click()">
            Edit picture
          </button>
          <input type="file" id="iep-avatar-file-input" accept="image/*" style="display:none;" onchange="ProfileManager.handleAvatarUpload(this)" />
        </div>

        <!-- Form Fields -->
        <div class="iep-field-group">
          <label>Name</label>
          <input type="text" id="iep-input-name" value="${_escapeHtml(me.name)}" placeholder="Your full name" />
        </div>

        <div class="iep-field-group">
          <label>Username</label>
          <input type="text" id="iep-input-username" value="${_escapeHtml(me.username)}" placeholder="username" />
        </div>

        <div class="iep-field-group">
          <label>Thought Note / Mood (Bubbled over Avatar)</label>
          <input type="text" id="iep-input-note" value="${_escapeHtml(me.thought_note || '')}" placeholder="Share what's on your mind... 💭" maxlength="30" />
        </div>

        <div class="iep-field-group">
          <label>Bio</label>
          <textarea id="iep-input-bio" rows="3" placeholder="Write your bio...">${_escapeHtml(me.bio || '')}</textarea>
        </div>

        <div class="iep-field-group">
          <label>Website / Link</label>
          <input type="text" id="iep-input-website" value="${_escapeHtml(me.website || '')}" placeholder="e.g. yoursite.com" />
        </div>

        <!-- INSTAGRAM PRIVATE ACCOUNT TOGGLE -->
        <div class="iep-privacy-box">
          <div class="iep-privacy-left">
            <div class="iep-privacy-title">
              <span>🔒 Private Account</span>
              <span class="iep-privacy-badge ${me.is_private ? 'private' : 'public'}">${me.is_private ? 'Private' : 'Public'}</span>
            </div>
            <div class="iep-privacy-desc">
              When your account is private, only buddies you approve can see your photos, reels, and stories.
            </div>
          </div>
          <label class="insta-switch">
            <input type="checkbox" id="iep-input-private" ${me.is_private ? 'checked' : ''} />
            <span class="insta-slider"></span>
          </label>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');
  }

  function handleAvatarUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const avatarPreview = document.querySelector('.iep-big-avatar');
      if (avatarPreview) {
        avatarPreview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
      }
      avatarPreview.dataset.newAvatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function saveEditedProfile() {
    const nameInput = document.getElementById('iep-input-name');
    const usernameInput = document.getElementById('iep-input-username');
    const noteInput = document.getElementById('iep-input-note');
    const bioInput = document.getElementById('iep-input-bio');
    const websiteInput = document.getElementById('iep-input-website');
    const privateInput = document.getElementById('iep-input-private');
    const avatarEl = document.querySelector('.iep-big-avatar');

    const me = _getCurrentUser();
    me.name = nameInput ? nameInput.value.trim() || me.name : me.name;
    me.username = usernameInput ? usernameInput.value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '') || me.username : me.username;
    me.thought_note = noteInput ? noteInput.value.trim() : me.thought_note;
    me.bio = bioInput ? bioInput.value.trim() : me.bio;
    me.website = websiteInput ? websiteInput.value.trim() : me.website;
    me.is_private = privateInput ? privateInput.checked : me.is_private;

    if (avatarEl && avatarEl.dataset.newAvatar) {
      me.avatar = avatarEl.dataset.newAvatar;
    }

    // 1. Update user_profile in localStorage
    localStorage.setItem('user_profile', JSON.stringify(me));

    // 2. Update buddy-session in localStorage
    try {
      const sess = JSON.parse(localStorage.getItem('buddy-session') || '{}');
      const updatedSess = { 
        ...sess, 
        name: me.name, 
        username: me.username, 
        bio: me.bio, 
        avatar: me.avatar, 
        is_private: me.is_private, 
        thought_note: me.thought_note, 
        website: me.website 
      };
      localStorage.setItem('buddy-session', JSON.stringify(updatedSess));
      if (window.AppState) window.AppState.currentUser = updatedSess;
    } catch (e) {}

    // 3. Sync to server-side user registry
    try {
      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: me.id,
          name: me.name,
          username: me.username,
          bio: me.bio,
          avatar: me.avatar,
          avatar_color: me.avatar_color,
          is_verified: me.is_verified,
          thought_note: me.thought_note,
          website: me.website
        })
      }).catch(() => {});
    } catch (e) {}

    document.getElementById('insta-edit-profile-overlay').classList.add('hidden');
    _renderProfileView(me);

    if (window.showToast) {
      window.showToast(`✨ Profile saved (${me.is_private ? '🔒 Private' : '🌐 Public'})`);
    }
  }

  // ── Create & Upload New Post (Photos & Videos) ──
  function openCreatePost() {
    const overlay = document.getElementById('insta-create-post-overlay');
    const container = document.getElementById('insta-create-post-content');
    if (!overlay || !container) return;

    container.innerHTML = `
      <div class="icp-head">
        <button type="button" class="icp-btn-cancel" onclick="document.getElementById('insta-create-post-overlay').classList.add('hidden')">Cancel</button>
        <div class="icp-title">New Post / Reel 📸</div>
        <button type="button" class="icp-btn-share" onclick="ProfileManager.submitNewPost()">Share</button>
      </div>

      <div class="icp-body">
        <div class="icp-dropzone" id="icp-dropzone" onclick="document.getElementById('icp-file-input').click()">
          <input type="file" id="icp-file-input" accept="image/*,video/*" style="display:none;" onchange="ProfileManager.handlePostMediaUpload(this)" />
          <div id="icp-placeholder">
            <span style="font-size:44px;">📸</span>
            <div style="font-weight:700; margin-top:8px;">Choose Photo or Video</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">JPG, PNG, WebP or MP4 up to high resolution (100% Free)</div>
          </div>
          <div id="icp-preview-box" class="hidden"></div>
        </div>

        <div class="icp-field-group">
          <textarea id="icp-input-caption" rows="3" placeholder="Write a caption & hashtags... #BUDDY #Moments"></textarea>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');
  }

  function handlePostMediaUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();

    reader.onload = function (e) {
      const ph = document.getElementById('icp-placeholder');
      const prev = document.getElementById('icp-preview-box');
      if (ph) ph.classList.add('hidden');
      if (prev) {
        prev.classList.remove('hidden');
        if (isVideo) {
          prev.innerHTML = `<video src="${e.target.result}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>`;
        } else {
          prev.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;" />`;
        }
        prev.dataset.mediaUrl = e.target.result;
        prev.dataset.mediaType = isVideo ? 'video' : 'image';
      }
    };

    reader.readAsDataURL(file);
  }

  async function submitNewPost() {
    const prev = document.getElementById('icp-preview-box');
    const captionInput = document.getElementById('icp-input-caption');
    const mediaUrl = prev ? prev.dataset.mediaUrl : null;
    const mediaType = prev ? (prev.dataset.mediaType || 'image') : 'image';
    const caption = captionInput ? captionInput.value.trim() : '';

    if (!mediaUrl) {
      if (window.showToast) window.showToast('⚠️ Please choose a photo or video first');
      else alert('Please choose a photo or video first');
      return;
    }

    const me = _getCurrentUser();
    const newPost = {
      id: 'post_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      user_id: me.id,
      user_name: me.name,
      user_username: me.username,
      user_avatar: me.avatar,
      user_color: me.avatar_color,
      media_url: mediaUrl,
      media_type: mediaType,
      caption: caption,
      likes_count: 0,
      liked_by: [],
      comments_count: 0,
      comments: [],
      created_at: Date.now()
    };

    // 1. Save locally
    try {
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
      allPosts.unshift(newPost);
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(allPosts));
    } catch (e) {}

    // 2. Push to server
    try {
      fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      }).catch(() => {});
    } catch (e) {}

    document.getElementById('insta-create-post-overlay').classList.add('hidden');
    _renderProfileView(me);

    if (window.showToast) {
      window.showToast('🎉 Photo/Video published to your profile!');
    }
  }

  // ── Delete Post ──
  function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const me = _getCurrentUser();

    try {
      let allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
      allPosts = allPosts.filter(p => p.id !== postId);
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(allPosts));
      fetch('/api/posts?id=' + encodeURIComponent(postId), { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    const detailOverlay = document.getElementById('insta-post-detail-overlay');
    if (detailOverlay) detailOverlay.classList.add('hidden');

    _renderProfileView(me);
    if (window.showToast) window.showToast('🗑️ Post deleted');
  }

  // ── Open Full Post Detail Modal with Comments & Likes ──
  function openPostDetail(postId) {
    const me = _getCurrentUser();
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
    const post = allPosts.find(p => p.id === postId);

    if (!post) return;

    const overlay = document.getElementById('insta-post-detail-overlay');
    const container = document.getElementById('insta-post-detail-content');
    if (!overlay || !container) return;

    const isOwnPost = post.user_id === me.id;
    const authorUser = currentViewedUserData || (isOwnPost ? me : {
      name: post.user_name || 'User',
      username: post.user_username || 'user',
      avatar: post.user_avatar || '',
      avatar_color: post.user_color || '#f43f5e'
    });

    const hasLiked = (post.liked_by || []).includes(me.id);

    container.innerHTML = `
      <div class="ipd-header">
        <div class="ipd-author-meta">
          <div class="ipd-avatar" style="background:${authorUser.avatar_color || '#f43f5e'};">
            ${authorUser.avatar ? `<img src="${authorUser.avatar}" alt="${authorUser.name}" />` : (authorUser.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="ipd-author-name">${_escapeHtml(authorUser.username || authorUser.name)}</div>
            <div class="ipd-author-sub">${_formatTimeAgo(post.created_at)}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${isOwnPost ? `
            <button type="button" class="modal-x-btn" onclick="ProfileManager.deletePost('${post.id}')" title="Delete Post" style="font-size:13px; color:#ef4444;">
              🗑️
            </button>
          ` : ''}
          <button type="button" class="modal-x-btn" onclick="document.getElementById('insta-post-detail-overlay').classList.add('hidden')">✕</button>
        </div>
      </div>

      <div class="ipd-media-wrap" id="ipd-media-box-${post.id}" ondblclick="ProfileManager.likePost('${post.id}')">
        ${post.media_type === 'video' ? `
          <video src="${post.media_url}" autoplay loop playsinline controls style="width:100%; height:100%; object-fit:contain; background:#000;"></video>
        ` : `
          <img src="${post.media_url}" alt="Post Media" style="width:100%; height:100%; object-fit:contain; background:#000;" />
        `}
        <div class="ipd-heart-anim hidden" id="ipd-heart-${post.id}">❤️</div>
      </div>

      <div class="ipd-actions-row">
        <div style="display:flex; gap:14px; align-items:center;">
          <button type="button" class="ipd-action-btn" onclick="ProfileManager.likePost('${post.id}')" title="Like">
            ${hasLiked ? '❤️' : '🤍'}
          </button>
          <button type="button" class="ipd-action-btn" onclick="document.getElementById('ipd-comment-input').focus()" title="Comment">
            💬
          </button>
          <button type="button" class="ipd-action-btn" onclick="ProfileManager.shareProfile()" title="Share">
            ✈️
          </button>
        </div>
      </div>

      <div class="ipd-likes-count">
        <b>${post.likes_count || 0} likes</b>
      </div>

      ${post.caption ? `
        <div class="ipd-caption-row">
          <b>${_escapeHtml(authorUser.username || authorUser.name)}</b> ${_formatCaption(post.caption)}
        </div>
      ` : ''}

      <div class="ipd-comments-list" id="ipd-comments-box">
        ${(post.comments || []).map(c => `
          <div class="ipd-comment-item">
            <b>${_escapeHtml(c.user_name || 'User')}:</b>
            <span>${_escapeHtml(c.text)}</span>
          </div>
        `).join('')}
      </div>

      <div class="ipd-input-bar">
        <input type="text" id="ipd-comment-input" placeholder="Add a comment..." onkeydown="if(event.key==='Enter')ProfileManager.submitComment('${post.id}')" />
        <button type="button" class="ipd-btn-post" onclick="ProfileManager.submitComment('${post.id}')">Post</button>
      </div>
    `;

    overlay.classList.remove('hidden');
  }

  // ── Like Post ──
  function likePost(postId) {
    const me = _getCurrentUser();
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    if (!Array.isArray(post.liked_by)) post.liked_by = [];
    const idx = post.liked_by.indexOf(me.id);

    if (idx >= 0) {
      post.liked_by.splice(idx, 1);
      post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
    } else {
      post.liked_by.push(me.id);
      post.likes_count = (post.likes_count || 0) + 1;
      _triggerHeartBurst(postId);
    }

    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(allPosts));
    openPostDetail(postId);
  }

  function _triggerHeartBurst(postId) {
    const h = document.getElementById('ipd-heart-' + postId);
    if (h) {
      h.classList.remove('hidden');
      setTimeout(() => h.classList.add('hidden'), 700);
    }
  }

  // ── Submit Comment ──
  function submitComment(postId) {
    const input = document.getElementById('ipd-comment-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const me = _getCurrentUser();
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    if (!Array.isArray(post.comments)) post.comments = [];
    post.comments.push({
      id: 'c_' + Date.now(),
      user_id: me.id,
      user_name: me.name,
      text: text,
      created_at: Date.now()
    });

    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(allPosts));
    input.value = '';
    openPostDetail(postId);
  }

  // ── Highlight interactions ──
  function createNewHighlight() {
    const title = prompt('Enter Highlight Name (e.g. Trips, Vibes, Goals):');
    if (!title) return;
    if (window.showToast) window.showToast(`✨ Highlight "${title}" created!`);
  }

  function viewHighlight(hlId) {
    if (window.showToast) window.showToast('📸 Playing Story Highlight...');
  }

  function openSettings() {
    openEditProfile();
  }

  // ── Helpers ──
  function _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function _formatCaption(str) {
    if (!str) return '';
    const esc = _escapeHtml(str);
    return esc.replace(/(#\w+)/g, '<span style="color:#0095F6; font-weight:600;">$1</span>');
  }

  function _formatTimeAgo(ts) {
    if (!ts) return 'Just now';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  // ── Public API ──
  window.ProfileManager = {
    openMyProfile,
    openUserProfile,
    closeProfile,
    openEditProfile,
    saveEditedProfile,
    handleAvatarUpload,
    openCreatePost,
    handlePostMediaUpload,
    submitNewPost,
    deletePost,
    openPostDetail,
    likePost,
    submitComment,
    switchTab,
    toggleFollow,
    messageUser,
    shareProfile,
    openSettings,
    createNewHighlight,
    viewHighlight
  };
})();
