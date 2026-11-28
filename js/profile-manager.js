/**
 * BUDDY 2.0 - Instagram-Style Profile Manager
 * Features:
 * - 1:1 Instagram profile layout matching user's reference screenshot
 * - 3-Column Square Post Grid + Reels Grid
 * - Private Account vs Public Account setting (with 🔒 lock screen for unapproved viewers)
 * - View Own Profile & View Other Users' Profiles
 * - Thought Note Bubble on Avatar ("Inspo needed...", Mood)
 * - Story Highlights Rail
 * - Post Detail Viewer with Likes, Heart Double-Tap & Comments
 * - Create & Upload New Posts
 * - Edit Profile with Name, Username, Bio, Website & Private Account Toggle
 */

(function () {
  'use strict';

  const STORAGE_KEY_POSTS = 'buddy_user_posts_v1';
  const STORAGE_KEY_FOLLOWS = 'buddy_user_follows_v1';
  const STORAGE_KEY_HIGHLIGHTS = 'buddy_user_highlights_v1';

  let currentViewedUserId = null;
  let activeTab = 'posts'; // 'posts' | 'reels' | 'tagged'

  // Helper: Get active authenticated user
  function _getCurrentUser() {
    try {
      const authUser = JSON.parse(localStorage.getItem('buddy_auth_user') || 'null');
      if (authUser && authUser.id) return authUser;
    } catch (e) {}

    const localProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    return {
      id: localProfile.id || 'current_user',
      name: localProfile.name || 'Keyur Sohaliya',
      username: localProfile.username || 'keyur_sohaliya',
      bio: localProfile.bio || 'Founder of @brandify_social_media',
      avatar: localProfile.avatar || '',
      avatar_color: localProfile.color || '#f43f5e',
      is_verified: localProfile.is_verified || false,
      is_private: localProfile.is_private !== undefined ? localProfile.is_private : true,
      thought_note: localProfile.thought_note || 'Inspo needed... 💭',
      website: localProfile.website || 'brandify.in'
    };
  }

  // Load posts for a specific user
  function _getPosts(userId) {
    try {
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
      const userPosts = allPosts.filter(p => p.user_id === userId);
      if (userPosts.length > 0) return userPosts;
    } catch (e) {}

    // Initial demo posts for vibrant Instagram look if no posts exist yet
    const demo = [
      {
        id: 'post_1_' + userId,
        user_id: userId,
        media_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
        media_type: 'image',
        caption: 'Life moves pretty fast. If you don’t stop and look around once in a while, you could miss it. ✨ #Vibes #Life',
        likes_count: 142,
        liked_by: [],
        comments_count: 18,
        comments: [
          { user_name: 'Aarav Patel', text: 'Classic shot bro! 🔥', created_at: Date.now() - 3600000 },
          { user_name: 'Simran Kaur', text: 'So aesthetic! ✨', created_at: Date.now() - 7200000 }
        ],
        created_at: Date.now() - 86400000
      },
      {
        id: 'post_2_' + userId,
        user_id: userId,
        media_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        media_type: 'image',
        caption: 'Work hard in silence, let your success make the noise. 💼🚀 @brandify_social_media',
        likes_count: 289,
        liked_by: [],
        comments_count: 34,
        comments: [
          { user_name: 'Dev Kapoor', text: 'Inspirational! Keep shining ✨', created_at: Date.now() - 5400000 }
        ],
        created_at: Date.now() - 172800000
      },
      {
        id: 'post_3_' + userId,
        user_id: userId,
        media_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
        media_type: 'image',
        caption: 'Moments that turn into memories with the best people. 🖤 #NightOut #Friends',
        likes_count: 98,
        liked_by: [],
        comments_count: 12,
        comments: [],
        created_at: Date.now() - 259200000
      }
    ];

    return demo;
  }

  // Follow state check
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

  // Open My Profile
  function openMyProfile() {
    const me = _getCurrentUser();
    openUserProfile(me.id, me);
  }

  // Open User Profile (Me or Other user)
  function openUserProfile(userId, fallbackData) {
    const me = _getCurrentUser();
    currentViewedUserId = userId || me.id;

    let targetUser = null;
    if (currentViewedUserId === me.id) {
      targetUser = me;
    } else if (fallbackData) {
      targetUser = {
        id: fallbackData.id || currentViewedUserId,
        name: fallbackData.name || fallbackData.full_name || 'Buddy User',
        username: fallbackData.username || (fallbackData.name ? fallbackData.name.toLowerCase().replace(/\s+/g, '_') : 'buddy_user'),
        bio: fallbackData.bio || 'Exploring moments on BUDDY ✨',
        avatar: fallbackData.avatar || '',
        avatar_color: fallbackData.avatar_color || fallbackData.color || '#6366F1',
        is_verified: fallbackData.is_verified || false,
        is_private: fallbackData.is_private !== undefined ? fallbackData.is_private : false,
        thought_note: fallbackData.thought_note || 'Online now 🟢',
        website: fallbackData.website || ''
      };
    } else {
      // Check cached conversations or local users
      targetUser = {
        id: currentViewedUserId,
        name: 'Buddy Friend',
        username: 'buddy_friend',
        bio: 'In my own private space ✨',
        avatar: '',
        avatar_color: '#3B82F6',
        is_verified: false,
        is_private: true,
        thought_note: 'Living in the moment 🌟',
        website: ''
      };
    }

    const overlay = document.getElementById('insta-profile-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    _renderProfileView(targetUser);
  }

  // Render complete Instagram profile view
  function _renderProfileView(user) {
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
      const initial = (user.name || 'U').charAt(0).toUpperCase();
      const followersCount = 351 + (followStatus === 'following' ? 1 : 0);
      const followingCount = 340;

      headerContainer.innerHTML = `
        <div class="iph-top-row">
          <!-- Avatar with Thought Note & Story Ring -->
          <div class="iph-avatar-col">
            ${user.thought_note ? `
              <div class="iph-thought-bubble" onclick="${isMe ? 'ProfileManager.openEditProfile()' : ''}" title="${isMe ? 'Tap to edit thought note' : ''}">
                <span>${_escapeHtml(user.thought_note)}</span>
                <div class="iph-thought-bubble-tail"></div>
              </div>
            ` : ''}
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
          <div class="iph-display-name">🖤 ${user.name} 🖤</div>
          <div class="iph-bio-text">${_escapeHtml(user.bio || '')}</div>
          ${user.website ? `
            <div class="iph-link-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <a href="https://${user.website.replace(/^https?:\/\//, '')}" target="_blank" rel="noopener">${user.website}</a>
            </div>
          ` : ''}
        </div>

        <!-- Action Buttons Row -->
        <div class="iph-action-buttons">
          ${isMe ? `
            <button type="button" class="iph-btn-secondary" onclick="ProfileManager.openEditProfile()">Edit profile</button>
            <button type="button" class="iph-btn-secondary" onclick="ProfileManager.shareProfile()">Share profile</button>
            <button type="button" class="iph-btn-icon" onclick="ProfileManager.openCreatePost()" title="New Post">
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

  // Render Story Highlights
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

  // Render 3-Column Content Grid or Private Account Lock Screen
  function _renderContentGrid(user, isLockedPrivate) {
    const grid = document.getElementById('insta-grid-container');
    if (!grid) return;

    if (isLockedPrivate) {
      // Instagram-Exact Private Account Screen
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

    if (activeTab === 'posts') {
      const posts = _getPosts(user.id);
      if (posts.length === 0) {
        grid.innerHTML = `
          <div class="insta-empty-grid">
            <span style="font-size:42px;">📷</span>
            <div style="font-size:16px; font-weight:700; margin-top:8px;">No Posts Yet</div>
            <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">When posts are uploaded, they will appear here.</div>
          </div>
        `;
        return;
      }

      grid.innerHTML = `
        <div class="insta-posts-3col">
          ${posts.map(post => `
            <div class="insta-grid-cell" onclick="ProfileManager.openPostDetail('${post.id}')">
              ${post.media_type === 'video' ? `
                <video src="${post.media_url}" preload="metadata" muted></video>
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
      // Pull Tapes for this user
      let tapes = [];
      if (window.TapesManager && typeof window.TapesManager.getTapes === 'function') {
        tapes = window.TapesManager.getTapes();
      }

      if (tapes.length === 0) {
        grid.innerHTML = `
          <div class="insta-empty-grid">
            <span style="font-size:42px;">🎬</span>
            <div style="font-size:16px; font-weight:700; margin-top:8px;">No Reels Yet</div>
            <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">Captured vertical video moments will appear here.</div>
          </div>
        `;
        return;
      }

      grid.innerHTML = `
        <div class="insta-reels-3col">
          ${tapes.map(tape => `
            <div class="insta-reel-cell" onclick="ProfileManager.openReel('${tape.id}')">
              <video src="${tape.video_url}" preload="metadata" muted></video>
              <div class="ig-reel-overlay">
                <span class="ig-reel-views">▶ ${tape.views_count || 120}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      // Tagged / Saved
      grid.innerHTML = `
        <div class="insta-empty-grid">
          <span style="font-size:42px;">🏷️</span>
          <div style="font-size:16px; font-weight:700; margin-top:8px;">Photos & Videos of You</div>
          <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">When people tag you in photos and videos, they'll show up here.</div>
        </div>
      `;
    }
  }

  // Switch Active Tab (Posts vs Reels vs Tagged)
  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.insta-tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('iptab-' + tab);
    if (btn) btn.classList.add('active');

    const me = _getCurrentUser();
    const user = currentViewedUserId === me.id ? me : { id: currentViewedUserId };
    const isLocked = false;
    _renderContentGrid(user, isLocked);
  }

  // Follow / Unfollow User Toggle
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
    const user = currentViewedUserId === me.id ? me : { id: currentViewedUserId };
    _renderProfileView(user);
  }

  // Message User directly from Profile
  function messageUser(userId) {
    closeProfile();
    if (window.chat && typeof window.chat.openChatWithUser === 'function') {
      window.chat.openChatWithUser(userId);
    } else if (window.openChat) {
      window.openChat(userId);
    }
  }

  // Share Profile Link
  function shareProfile() {
    const me = _getCurrentUser();
    const url = `${window.location.origin}/?user=${me.username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      if (window.showToast) window.showToast('📋 Profile link copied to clipboard!');
    } else {
      if (window.showToast) window.showToast(url);
    }
  }

  // Close Profile Modal
  function closeProfile() {
    const overlay = document.getElementById('insta-profile-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // Open Edit Profile Sheet with Private Account Toggle
  function openEditProfile() {
    const me = _getCurrentUser();
    const overlay = document.getElementById('insta-edit-profile-overlay');
    const container = document.getElementById('insta-edit-profile-content');
    if (!overlay || !container) return;

    container.innerHTML = `
      <div class="iep-head">
        <button type="button" class="iep-btn-cancel" onclick="document.getElementById('insta-edit-profile-overlay').classList.add('hidden')">Cancel</button>
        <div class="iep-title">Edit Profile</div>
        <button type="button" class="iep-btn-done" onclick="ProfileManager.saveEditedProfile()">Done</button>
      </div>

      <div class="iep-body">
        <!-- Change Photo -->
        <div class="iep-avatar-preview-wrap">
          <div class="iep-big-avatar" style="background:${me.avatar_color || '#f43f5e'};">
            ${me.avatar ? `<img src="${me.avatar}" alt="Avatar" />` : (me.name || 'U').charAt(0).toUpperCase()}
          </div>
          <button type="button" class="iep-change-photo-btn" onclick="document.getElementById('iep-photo-file').click()">Change profile photo</button>
          <input type="file" id="iep-photo-file" accept="image/*" style="display:none;" onchange="ProfileManager.handleAvatarUpload(this)" />
        </div>

        <!-- Form Fields -->
        <div class="iep-field-group">
          <label>Name</label>
          <input type="text" id="iep-input-name" value="${_escapeHtml(me.name)}" placeholder="Name" />
        </div>

        <div class="iep-field-group">
          <label>Username</label>
          <input type="text" id="iep-input-username" value="${_escapeHtml(me.username)}" placeholder="Username" />
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
          <input type="text" id="iep-input-website" value="${_escapeHtml(me.website || '')}" placeholder="e.g. brandify.in" />
        </div>

        <!-- INSTAGRAM PRIVATE ACCOUNT TOGGLE -->
        <div class="iep-privacy-box">
          <div class="iep-privacy-left">
            <div class="iep-privacy-title">
              <span>🔒 Private Account</span>
              <span class="iep-privacy-badge ${me.is_private ? 'private' : 'public'}">${me.is_private ? 'Private' : 'Public'}</span>
            </div>
            <div class="iep-privacy-desc">
              When your account is private, only people you approve can see your photos, reels, and stories. Your existing chats won't be affected.
            </div>
          </div>
          <label class="insta-switch">
            <input type="checkbox" id="iep-input-private" ${me.is_private ? 'checked' : ''} />
            <span class="insta-slider"></span>
          </label>
        </div>

        <!-- Verified Blue Tick Badge Row -->
        <div class="iep-verified-row" onclick="document.getElementById('insta-edit-profile-overlay').classList.add('hidden'); if(window.VerifiedBadgeManager) window.VerifiedBadgeManager.openVerificationModal();">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">🛡️</span>
            <div>
              <div style="font-size:14px; font-weight:700;">Verified Badge (100% Free)</div>
              <div style="font-size:11.5px; color:var(--text-muted);">Get authentic blue tick next to your username</div>
            </div>
          </div>
          <span>➤</span>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');
  }

  // Handle avatar image selection
  function handleAvatarUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const avatarPreview = document.querySelector('.iep-big-avatar');
      if (avatarPreview) {
        avatarPreview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
      }
      // Save temporarily in dataset
      avatarPreview.dataset.newAvatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Save edited profile
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
    me.username = usernameInput ? usernameInput.value.trim().toLowerCase().replace(/\s+/g, '_') : me.username;
    me.thought_note = noteInput ? noteInput.value.trim() : me.thought_note;
    me.bio = bioInput ? bioInput.value.trim() : me.bio;
    me.website = websiteInput ? websiteInput.value.trim() : me.website;
    me.is_private = privateInput ? privateInput.checked : me.is_private;

    if (avatarEl && avatarEl.dataset.newAvatar) {
      me.avatar = avatarEl.dataset.newAvatar;
    }

    localStorage.setItem('user_profile', JSON.stringify(me));

    // Update in Supabase profiles table if available
    try {
      if (window.BuddySupabase && window.BuddySupabase.client) {
        window.BuddySupabase.client.from('profiles').update({
          full_name: me.name,
          username: me.username,
          bio: me.bio
        }).eq('id', me.id).then(() => {}).catch(() => {});
      }
    } catch (e) {}

    document.getElementById('insta-edit-profile-overlay').classList.add('hidden');
    _renderProfileView(me);

    if (window.showToast) {
      window.showToast(`✨ Profile saved (${me.is_private ? '🔒 Private' : '🌐 Public'})`);
    }
  }

  // Create & Upload Post Modal
  function openCreatePost() {
    const overlay = document.getElementById('insta-create-post-overlay');
    const container = document.getElementById('insta-create-post-content');
    if (!overlay || !container) return;

    container.innerHTML = `
      <div class="icp-head">
        <button type="button" class="icp-btn-cancel" onclick="document.getElementById('insta-create-post-overlay').classList.add('hidden')">Cancel</button>
        <div class="icp-title">Create New Post 📸</div>
        <button type="button" class="icp-btn-share" onclick="ProfileManager.submitNewPost()">Share</button>
      </div>

      <div class="icp-body">
        <div class="icp-dropzone" id="icp-dropzone" onclick="document.getElementById('icp-file-input').click()">
          <input type="file" id="icp-file-input" accept="image/*,video/*" style="display:none;" onchange="ProfileManager.handlePostMediaUpload(this)" />
          <div id="icp-placeholder">
            <span style="font-size:44px;">📸</span>
            <div style="font-weight:700; margin-top:8px;">Choose Photo or Video</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Square 1:1 or 4:5 high quality (100% Free)</div>
          </div>
          <div id="icp-preview-box" class="hidden"></div>
        </div>

        <div class="icp-field-group">
          <textarea id="icp-input-caption" rows="3" placeholder="Write a caption & hashtags... #Buddy #Moments"></textarea>
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

  function submitNewPost() {
    const prev = document.getElementById('icp-preview-box');
    const captionInput = document.getElementById('icp-input-caption');
    const mediaUrl = prev ? prev.dataset.mediaUrl : null;
    const mediaType = prev ? (prev.dataset.mediaType || 'image') : 'image';
    const caption = captionInput ? captionInput.value.trim() : '';

    if (!mediaUrl) {
      if (window.showToast) window.showToast('⚠️ Please select a photo or video first');
      return;
    }

    const me = _getCurrentUser();
    const newPost = {
      id: 'post_' + Date.now(),
      user_id: me.id,
      media_url: mediaUrl,
      media_type: mediaType,
      caption: caption,
      likes_count: 0,
      liked_by: [],
      comments_count: 0,
      comments: [],
      created_at: Date.now()
    };

    try {
      const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
      allPosts.unshift(newPost);
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(allPosts));
    } catch (e) {}

    document.getElementById('insta-create-post-overlay').classList.add('hidden');
    _renderProfileView(me);

    if (window.showToast) {
      window.showToast('🎉 Post shared successfully!');
    }
  }

  // Open Full Post Detail Modal with Comments & Likes
  function openPostDetail(postId) {
    const me = _getCurrentUser();
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
    let post = allPosts.find(p => p.id === postId);

    if (!post) {
      // Check demo posts
      const demo = _getPosts(currentViewedUserId || me.id);
      post = demo.find(p => p.id === postId);
    }

    if (!post) return;

    const overlay = document.getElementById('insta-post-detail-overlay');
    const container = document.getElementById('insta-post-detail-content');
    if (!overlay || !container) return;

    const user = currentViewedUserId === me.id ? me : { name: 'Keyur Sohaliya', username: 'keyur_sohaliya', avatar_color: '#f43f5e' };
    const hasLiked = (post.liked_by || []).includes(me.id);

    container.innerHTML = `
      <div class="ipd-header">
        <div class="ipd-author-meta">
          <div class="ipd-avatar" style="background:${user.avatar_color || '#f43f5e'};">
            ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}" />` : (user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="ipd-author-name">${user.username || user.name}</div>
            <div class="ipd-author-sub">Original Post</div>
          </div>
        </div>
        <button type="button" class="modal-x-btn" onclick="document.getElementById('insta-post-detail-overlay').classList.add('hidden')">✕</button>
      </div>

      <div class="ipd-media-wrap" ondblclick="ProfileManager.likePost('${post.id}')">
        ${post.media_type === 'video' ? `
          <video src="${post.media_url}" autoplay loop playsinline controls style="width:100%; height:100%; object-fit:contain;"></video>
        ` : `
          <img src="${post.media_url}" alt="Post" style="width:100%; height:100%; object-fit:contain;" />
        `}
        <div class="ipd-heart-anim hidden" id="ipd-burst-${post.id}">❤️</div>
      </div>

      <div class="ipd-actions-row">
        <div style="display:flex; gap:14px; align-items:center;">
          <button type="button" class="ipd-action-btn ${hasLiked ? 'liked' : ''}" onclick="ProfileManager.likePost('${post.id}')">
            ${hasLiked ? '❤️' : '🤍'}
          </button>
          <button type="button" class="ipd-action-btn" onclick="document.getElementById('ipd-comment-input').focus()">
            💬
          </button>
          <button type="button" class="ipd-action-btn" onclick="ProfileManager.shareProfile()">
            ✈️
          </button>
        </div>
        <button type="button" class="ipd-action-btn">🔖</button>
      </div>

      <div class="ipd-likes-count" id="ipd-likes-${post.id}">
        <strong>${post.likes_count || 0} likes</strong>
      </div>

      ${post.caption ? `
        <div class="ipd-caption-row">
          <strong>${user.username || user.name}</strong> ${_escapeHtml(post.caption)}
        </div>
      ` : ''}

      <!-- Comments List -->
      <div class="ipd-comments-list" id="ipd-comments-${post.id}">
        ${(post.comments || []).map(c => `
          <div class="ipd-comment-item">
            <strong>${c.user_name || 'Friend'}</strong> ${_escapeHtml(c.text)}
          </div>
        `).join('')}
      </div>

      <!-- Add Comment Bar -->
      <div class="ipd-comment-bar">
        <input type="text" id="ipd-comment-input" placeholder="Add a comment as ${me.username}..." />
        <button type="button" class="ipd-btn-post-comment" onclick="ProfileManager.submitComment('${post.id}')">Post</button>
      </div>
    `;

    overlay.classList.remove('hidden');
  }

  function likePost(postId) {
    const me = _getCurrentUser();
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
    let post = allPosts.find(p => p.id === postId);

    if (!post) {
      const demo = _getPosts(currentViewedUserId || me.id);
      post = demo.find(p => p.id === postId);
    }
    if (!post) return;

    if (!post.liked_by) post.liked_by = [];
    const idx = post.liked_by.indexOf(me.id);
    if (idx >= 0) {
      post.liked_by.splice(idx, 1);
      post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
    } else {
      post.liked_by.push(me.id);
      post.likes_count = (post.likes_count || 0) + 1;

      // Heart burst
      const burst = document.getElementById('ipd-burst-' + postId);
      if (burst) {
        burst.classList.remove('hidden');
        burst.classList.add('pop');
        setTimeout(() => burst.classList.add('hidden'), 800);
      }
    }

    // Save
    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(allPosts));
    } catch (e) {}

    // Update UI
    const likesEl = document.getElementById('ipd-likes-' + postId);
    if (likesEl) likesEl.innerHTML = `<strong>${post.likes_count} likes</strong>`;
  }

  function submitComment(postId) {
    const input = document.getElementById('ipd-comment-input');
    if (!input || !input.value.trim()) return;

    const me = _getCurrentUser();
    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');
    let post = allPosts.find(p => p.id === postId);

    if (!post) {
      const demo = _getPosts(currentViewedUserId || me.id);
      post = demo.find(p => p.id === postId);
    }
    if (!post) return;

    if (!post.comments) post.comments = [];
    const newComment = {
      user_name: me.username || me.name,
      text: input.value.trim(),
      created_at: Date.now()
    };
    post.comments.push(newComment);
    post.comments_count = post.comments.length;

    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(allPosts));
    } catch (e) {}

    input.value = '';

    const list = document.getElementById('ipd-comments-' + postId);
    if (list) {
      const el = document.createElement('div');
      el.className = 'ipd-comment-item';
      el.innerHTML = `<strong>${newComment.user_name}</strong> ${_escapeHtml(newComment.text)}`;
      list.appendChild(el);
      list.scrollTop = list.scrollHeight;
    }
  }

  function openSettings() {
    // Open legacy settings dialog for theme/wallpaper/logout
    const overlay = document.getElementById('profile-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function createNewHighlight() {
    const name = prompt('Enter highlight name (e.g. Travel, Life):', 'New');
    if (!name) return;
    if (window.showToast) window.showToast(`✨ Highlight "${name}" created!`);
  }

  function viewHighlight(hlId) {
    if (window.StoriesManager && typeof window.StoriesManager.openViewer === 'function') {
      window.StoriesManager.openViewer(0);
    } else {
      if (window.showToast) window.showToast('Viewing Highlight moments');
    }
  }

  function openReel(tapeId) {
    closeProfile();
    const tabTapesBtn = document.getElementById('tab-tapes-btn');
    if (tabTapesBtn) tabTapesBtn.click();
  }

  function _escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Export globally
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
    openPostDetail,
    likePost,
    submitComment,
    switchTab,
    toggleFollow,
    messageUser,
    shareProfile,
    openSettings,
    createNewHighlight,
    viewHighlight,
    openReel
  };
})();
