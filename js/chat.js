/**
 * BUDDY - chat.js
 * 1. Single default AI Companion ("BUDDY AI") with smart contextual chats.
 * 2. Real users only appear when searched by @username from Supabase.
 * 3. True 1-to-1 Cloud Messaging with Supabase Realtime & Auto-Sync.
 * 4. Voice notes, calling simulation, double-tap hearts, and themes.
 */

const ChatManager = (() => {
  let currentUser = null;
  let conversations = [];
  let activeConvId = null;
  let currentRealtimeSub = null;
  let pollInterval = null;

  let isRecording = false;
  let recSeconds = 0;
  let recInterval = null;

  let callTimer = null;
  let callSeconds = 0;
  let isCallMuted = false;

  let currentlyPlayingAudioId = null;
  let audioPlayInterval = null;

  const EMOJI_SETS = {
    love: ['❤️', '💖', '💕', '💘', '💓', '💗', '💞', '😍', '🥰', '😘', '😻', '💌', '🌹', '💐', '💋', '✨', '💍', '🕊️'],
    smileys: ['😊', '😂', '🤣', '🥺', '😇', '😎', '🥳', '😋', '😜', '🤪', '🤗', '🤭', '😏', '😌', '🤤', '😴', '🤐', '🤫'],
    gestures: ['👍', '🙌', '👏', '🤝', '✌️', '🤟', '🤘', '👊', '🤞', '🤙', '👋', '🙏', '💪', '👌', '🤏', '💃', '🕺', '🔥'],
    vibe: ['⚡', '🌟', '🌙', '💫', '🌈', '🍕', '☕', '🍷', '🎉', '🎈', '🎵', '🎶', '🏖️', '🚀', '🔮', '🧸', '🌺', '☕']
  };

  let _isInitialized = false;

  
  // In-App Notification Toast
  function _showInAppNotification(conv, text) {
    let banner = document.getElementById('buddy-inapp-notif');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'buddy-inapp-notif';
      banner.className = 'buddy-inapp-notif hidden';
      document.body.appendChild(banner);
    }

    const name = conv.nickname || conv.name || 'Friend';
    const initials = _initials(name);
    const bg = conv.color || '#6366F1';

    banner.innerHTML = `
      <div class="inapp-notif-avatar" style="background:${bg}">${conv.isAI ? '✨' : initials}</div>
      <div class="inapp-notif-body">
        <div class="inapp-notif-header">
          <span class="inapp-notif-name">${_esc(name)}</span>
          <span class="inapp-notif-time">Just now</span>
        </div>
        <div class="inapp-notif-text">${_esc(text)}</div>
      </div>
      <button type="button" class="inapp-notif-btn">Reply</button>
    `;

    banner.onclick = () => {
      openChat(conv.id);
      banner.classList.remove('show');
      setTimeout(() => banner.classList.add('hidden'), 300);
    };

    banner.classList.remove('hidden');
    requestAnimationFrame(() => banner.classList.add('show'));

    if (banner._hideTimer) clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(() => banner.classList.add('hidden'), 300);
    }, 4500);
  }

  // Soft notification audio chime
  function _playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch(e) {}
  }

  // Handle global incoming realtime messages
  async function _handleGlobalIncomingMessage(m) {
    if (!m || !currentUser || !currentUser.id) return;
    if (m.sender_id === currentUser.id) return;
    if (m.body === '[cleared]') return;

    let conv = conversations.find(c => c.id === m.conversation_id);
    if (!conv) {
      await _syncConversationsFromSupabase(true);
      conv = conversations.find(c => c.id === m.conversation_id);
    }
    if (!conv) return;

    const timeStr = new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const previewStr = m.type === 'voice' ? '🎙️ Voice note' : (m.type === 'image' ? '📷 Photo' : (m.type === 'video' ? '🎥 Video' : (m.body || 'New message')));

    conv.lastMsgPreview = previewStr;
    conv.lastMsgTime = timeStr;

    if (!conv.messages) conv.messages = [];
    if (!conv.messages.some(existing => existing.id === m.id)) {
      conv.messages.push({
        id: m.id,
        from: 'them',
        type: m.type || 'text',
        body: m.body || '',
        media: m.media_url,
        duration: m.duration,
        time: timeStr,
        seen: (activeConvId === conv.id),
        reactions: []
      });
    }

    if (activeConvId === conv.id) {
      conv.unread = 0;
      localStorage.setItem('buddy_last_seen_' + conv.id, m.id);
      _renderMessages(conv);
    } else {
      conv.unread = (conv.unread || 0) + 1;
      _showInAppNotification(conv, previewStr);
      _playNotificationSound();
    }

    // Move to top
    conversations = [
      ...conversations.filter(c => c.pinned),
      conv,
      ...conversations.filter(c => !c.pinned && c.id !== conv.id)
    ];

    _renderChatList();
  }

  async function init(user) {
    currentUser = user || { id: 'guest', name: 'User', username: '@user', color: '#6366F1' };

    if (!_isInitialized) {
      _isInitialized = true;
      _initConversations();
      _renderChatList();
      _bindEvents();
      _bindComposer();
      _bindReactionsAndDoubleTap();
      _bindVoiceRecording();
      _bindEmojiPicker();
      _bindCalls();
      _bindChatInfoModal();
      _bindSearch();
      _bindNewChat();
      _bindProfile();
      // App always opens on Home screen / conversations list (never auto-opens buddy_ai)
    } else {
      _renderChatList();
    }

    // Sync cloud conversations for real users
    await _syncConversationsFromSupabase();

    // Start background live polling (every 2.5 seconds) for instant sync across tabs & devices
    _startLiveSync();
      if (window.BuddySupabase && BuddySupabase.subscribeToAllMessages) {
        BuddySupabase.subscribeToAllMessages(_handleGlobalIncomingMessage);
      }
  }

  function _initConversations() {
    conversations = [_getBuddyAIConv()];
  }

  function _getBuddyAIConv() {
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      id: 'buddy_ai',
      isAI: true,
      userId: 'buddy_ai',
      name: 'BUDDY AI',
      username: '@buddy_ai',
      color: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
      status: 'Online • AI Companion',
      pinned: true,
      accent: 'rose',
      unread: 0,
      messages: [
        {
          id: 'ai_welcome',
          from: 'them',
          type: 'text',
          body: "Hello! 👋 I'm BUDDY AI, your personal 24/7 companion. Ask me anything, chat with me, share your mood, or seek relationship/life advice. I'm always here for you! ✨",
          time: t,
          seen: true,
          reactions: ['💖']
        }
      ]
    };
  }

  /* ── SYNC CONVERSATIONS FROM SUPABASE ── */
  async function _syncConversationsFromSupabase(isSilent = false) {
    if (!window.BuddySupabase || !currentUser || !currentUser.id || currentUser.id === 'guest') return;
    try {
      const cloudConvs = await BuddySupabase.loadUserConversations(currentUser.id);
      if (!cloudConvs) return;

      let changed = false;
      cloudConvs.forEach(item => {
        // Skip if marked as removed by user
        const isRemoved = localStorage.getItem('buddy_removed_conv_' + item.conversation_id + '_' + currentUser.id) === 'true' ||
                          (item.peer && localStorage.getItem('buddy_removed_peer_' + item.peer.id + '_' + currentUser.id) === 'true');
        let existing = conversations.find(c => c.id === item.conversation_id || c.userId === item.peer.id);
        if (isRemoved) {
          if (existing) {
            conversations = conversations.filter(c => c.id !== existing.id);
            changed = true;
          }
          return;
        }
        const last = item.lastMsg;
        const timeStr = last ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        let previewStr = last ? (last.type === 'voice' ? '🎙️ Voice note' : (last.type === 'image' ? '📷 Photo' : last.body)) : 'Started conversation';
        const isMine = last ? (last.sender_id === currentUser.id) : false;

        const dbUnreadCount = (item.unreadCount !== undefined && item.unreadCount !== null) ? item.unreadCount : 0;

        if (!existing) {
          existing = {
            id: item.conversation_id,
            isAI: false,
            userId: item.peer.id,
            name: item.nickname || item.peer.full_name || item.peer.username,
            username: item.peer.username,
            color: item.peer.avatar_color || '#6366F1',
            status: item.peer.status || 'Active now',
            nickname: item.nickname || '',
            pinned: false,
            accent: 'indigo',
            unread: (activeConvId === item.conversation_id) ? 0 : dbUnreadCount,
            lastMsgPreview: (isMine ? 'You: ' : '') + previewStr,
            lastMsgTime: timeStr,
            messages: []
          };
          conversations.push(existing);
          changed = true;
        } else {
          if (existing.id !== item.conversation_id) {
            existing.id = item.conversation_id;
            changed = true;
          }
          existing.status = item.peer.status || 'Active now';
          if (last) {
            const formattedPreview = (isMine ? 'You: ' : '') + previewStr;
            if (existing.lastMsgPreview !== formattedPreview || existing.lastMsgTime !== timeStr) {
              existing.lastMsgPreview = formattedPreview;
              existing.lastMsgTime = timeStr;
              changed = true;
            }
          }

          // Exact unread count synchronization:
          if (existing.id === activeConvId) {
            if (existing.unread !== 0) {
              existing.unread = 0;
              changed = true;
            }
          } else {
            if (existing.unread !== dbUnreadCount) {
              existing.unread = dbUnreadCount;
              changed = true;
            }
          }
        }
      });

      if (changed || !isSilent) {
        _renderChatList();
      }
    } catch (err) {
      console.warn('[BUDDY] _syncConversationsFromSupabase error:', err);
    }
  }

  function _startLiveSync() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
      if (!currentUser || !currentUser.id || currentUser.id === 'guest') return;

      // 1. Check for newly created conversations
      await _syncConversationsFromSupabase(true);

      // 2. If active conversation is a real user, poll for any new incoming messages
      if (activeConvId && activeConvId !== 'buddy_ai' && window.BuddySupabase) {
        const conv = conversations.find(c => c.id === activeConvId);
        if (conv && !conv.isAI) {
          const dbMsgs = await BuddySupabase.fetchMessages(conv.id);
          if (dbMsgs && dbMsgs.length > 0) {
            let hasNew = false;
            const clearedTime = localStorage.getItem('buddy_cleared_' + conv.id + '_' + currentUser.id);
            const clearedTs = clearedTime ? parseInt(clearedTime, 10) : 0;

            dbMsgs.forEach(m => {
              const msgTs = new Date(m.created_at).getTime();
              if (clearedTs && msgTs <= clearedTs) return;

              // Check if pending local message matches
              if (m.sender_id === currentUser.id) {
                const pending = conv.messages.find(existing => existing.from === 'me' && existing.id.startsWith('m_') && existing.body === (m.body || '') && existing.type === (m.type || 'text'));
                if (pending) {
                  pending.id = m.id;
                  pending.seen = true;
                  return;
                }
              }

              if (!conv.messages.some(existing => existing.id === m.id)) {
                conv.messages.push({
                  id: m.id,
                  from: m.sender_id === currentUser.id ? 'me' : 'them',
                  type: m.type || 'text',
                  body: m.body || '',
                  media: m.media_url,
                  duration: m.duration,
                  time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  seen: true,
                  reactions: []
                });
                hasNew = true;
              }
            });

            if (hasNew) {
              _renderMessages(conv);
              _renderChatList();
            }
          }
        }
      }
    }, 2500);
  }

  /* ── CHAT LIST RENDERING ── */
  function _renderChatList(filter) {
    const list = document.getElementById('chat-list');
    if (!list) return;
    list.innerHTML = '';

    const q = (filter || '').toLowerCase().trim();
    let filtered = conversations.filter(c => {
      const displayName = c.nickname || c.name || '';
      const uname = c.username || '';
      return displayName.toLowerCase().includes(q) || uname.toLowerCase().includes(q);
    });

    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

    filtered.forEach(conv => {
      const last = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
      const isActive = conv.id === activeConvId;
      const displayName = conv.nickname || conv.name;

      let rawPreview = conv.lastMsgPreview || (conv.isAI ? 'AI Companion' : 'Tap to start chat');
      let timeLabel = conv.lastMsgTime || '';
      let isMine = false;

      if (last) {
        if (last.type === 'text') rawPreview = last.body;
        else if (last.type === 'voice') rawPreview = '🎙️ Voice note (' + (last.duration || '0:05') + ')';
        else if (last.type === 'image') rawPreview = '📷 Photo';
        else if (last.type === 'video') rawPreview = '🎥 Video';
        timeLabel = last.time || '';
        isMine = last.from === 'me';
      }

      let formattedPreview = rawPreview;
      if (isMine && !formattedPreview.startsWith('You:')) {
        formattedPreview = 'You: ' + formattedPreview;
      } else if (!isMine && conv.unread > 0) {
        formattedPreview = '💬 ' + formattedPreview;
      }

      const el = document.createElement('div');
      el.className = 'chat-item' + (isActive ? ' active' : '') + (conv.unread > 0 ? ' unread' : '');
      el.dataset.id = conv.id;

      el.innerHTML = `
        <div class="chat-item-avatar-wrap">
          <div class="chat-item-avatar ${conv.isAI ? 'ai-avatar' : ''}" style="background:${conv.color}">
            ${conv.isAI ? '✨' : _initials(displayName)}
          </div>
          <span class="online-dot ${conv.isAI ? 'ai-dot' : ''}"></span>
        </div>
        <div class="chat-item-info">
          <div class="chat-item-row-top">
            <span class="chat-item-name ${conv.unread > 0 ? 'unread-name' : ''}">
              ${_esc(displayName)}
              ${conv.isAI ? '<span class="ai-badge">AI</span>' : ''}
              ${conv.pinned && !conv.isAI ? '<span class="pinned-badge" title="Pinned">📌</span>' : ''}
            </span>
            <span class="chat-item-time ${conv.unread > 0 ? 'unread-time' : ''}">${timeLabel}</span>
          </div>
          <div class="chat-item-row-bot">
            <span class="chat-item-preview ${conv.unread > 0 ? 'unread-preview' : ''}" title="${_esc(formattedPreview)}">${_esc(formattedPreview)}</span>
            ${conv.unread > 0 ? ('<span class="unread-badge">' + conv.unread + '</span>') : ''}
          </div>
        </div>
      `;

      el.addEventListener('click', () => openChat(conv.id));
      list.appendChild(el);
    });

    if (conversations.length === 1 && conversations[0].isAI) {
      const hint = document.createElement('div');
      hint.style.cssText = 'padding: 16px; text-align: center; color: var(--text-3); font-size: 12px; line-height: 1.5;';
      hint.innerHTML = '🔍 Search friends above by <b>@username</b> to start private 1-to-1 chats!';
      list.appendChild(hint);
    }
  }

  /* ── OPEN CHAT ── */
  async function openChat(convId) {
    activeConvId = convId;
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    // Immediately reset unread count and re-render so badge disappears instantly
    conv.unread = 0;
    _renderChatList();

    // Mark all unseen messages as seen in Supabase database
    if (!conv.isAI && window.BuddySupabase && currentUser && currentUser.id) {
      BuddySupabase.markConversationMessagesAsSeen(conv.id, currentUser.id);
    }

    const displayName = conv.nickname || conv.name;

    const av = document.getElementById('chat-peer-avatar');
    if (av) {
      av.textContent = conv.isAI ? '✨' : _initials(displayName);
      av.style.background = conv.color;
      if (conv.isAI) av.classList.add('ai-avatar'); else av.classList.remove('ai-avatar');
    }

    const nm = document.getElementById('chat-peer-name');
    if (nm) {
      nm.innerHTML = _esc(displayName) + (conv.isAI ? '<span class="ai-badge">AI</span>' : '');
    }

    const pinTag = document.getElementById('chat-pinned-tag');
    if (pinTag) pinTag.classList.toggle('hidden', !conv.pinned || conv.isAI);

    const st = document.getElementById('chat-peer-status');
    if (st) st.textContent = conv.isAI ? 'Always Online • AI Companion' : (conv.status || 'Active now');

    // Respect user's active theme or custom chat color without overwriting
    if (conv.customColor) {
      window.ThemeManager?.setCustomColor(conv.customColor);
    } else if (conv.accent && conv.accent !== 'rose' && conv.accent !== 'indigo') {
      window.ThemeManager?.setAccent(conv.accent);
    } else {
      const savedCustom = localStorage.getItem('buddy-custom-color');
      if (savedCustom) {
        window.ThemeManager?.setCustomColor(savedCustom);
      } else {
        const savedAccent = localStorage.getItem('buddy-accent') || conv.accent || 'rose';
        window.ThemeManager?.setAccent(savedAccent);
      }
    }

    document.getElementById('empty-state')?.classList.add('hidden');
    document.getElementById('active-chat')?.classList.remove('hidden');
    document.getElementById('app-screen')?.classList.add('chat-open');
    document.body.classList.add('chat-open');
    document.documentElement.style.removeProperty('--app-height');
    window.scrollTo(0, 0);
    if (window.WallpaperManager) window.WallpaperManager.apply(window.WallpaperManager.getActive());

    _renderChatList();
    _renderMessages(conv);
    _closeAttachMenu();
    _closeEmojiPicker();

    // If real 1-to-1 conversation, load history from Supabase & connect Realtime
    if (!conv.isAI && window.BuddySupabase) {
      try {
        const dbMsgs = await BuddySupabase.fetchMessages(conv.id);
        if (dbMsgs && dbMsgs.length > 0) {
          const clearedTime = localStorage.getItem('buddy_cleared_' + conv.id + '_' + currentUser.id);
          const clearedTs = clearedTime ? parseInt(clearedTime, 10) : 0;

          conv.messages = dbMsgs
            .filter(m => {
              const msgTs = new Date(m.created_at).getTime();
              return !clearedTs || msgTs > clearedTs;
            })
            .map(m => ({
              id: m.id,
              from: m.sender_id === currentUser.id ? 'me' : 'them',
              type: m.type || 'text',
              body: m.body || '',
              media: m.media_url,
              duration: m.duration,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              seen: true,
              reactions: []
            }));
          _renderMessages(conv);
          _renderChatList();
        }
      } catch (err) {
        console.warn('[BUDDY] Error loading messages from DB:', err);
      }

      // Supabase Realtime Channel
      if (currentRealtimeSub) {
        try { currentRealtimeSub.unsubscribe(); } catch(e) {}
      }
      currentRealtimeSub = BuddySupabase.subscribeToMessages(conv.id, (newMsg) => {
        if (newMsg && newMsg.conversation_id === conv.id) {
          // If from current user, reconcile with pending local message
          if (newMsg.sender_id === currentUser.id) {
            const pending = conv.messages.find(m => m.from === 'me' && m.id.startsWith('m_') && m.body === (newMsg.body || '') && m.type === (newMsg.type || 'text'));
            if (pending) {
              pending.id = newMsg.id;
              pending.seen = true;
              return;
            }
          }

          if (!conv.messages.some(m => m.id === newMsg.id)) {
            const incoming = {
              id: newMsg.id,
              from: newMsg.sender_id === currentUser.id ? 'me' : 'them',
              type: newMsg.type || 'text',
              body: newMsg.body || '',
              media: newMsg.media_url,
              duration: newMsg.duration,
              time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              seen: true,
              reactions: []
            };
            conv.messages.push(incoming);
            _renderMessages(conv);
            _renderChatList();
          }
        }
      });
    }

    // Only auto-focus on desktop with physical keyboard; NEVER on mobile touch devices
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
    if (!isTouchDevice) {
      setTimeout(() => {
        const inp = document.getElementById('message-input');
        if (inp) inp.focus();
      }, 100);
    }
  }

  /* ── RENDER MESSAGES ── */
  function _renderMessages(conv) {
    const area = document.getElementById('messages-area');
    if (!area) return;
    area.innerHTML = '';

    const dateDivider = document.createElement('div');
    dateDivider.className = 'msg-date-divider';
    dateDivider.innerHTML = '<span>Today</span>';
    area.appendChild(dateDivider);

    conv.messages.forEach((msg, idx) => {
      const isSent = msg.from === 'me';
      const prevMsg = idx > 0 ? conv.messages[idx - 1] : null;
      const isFirstOfGroup = !prevMsg || prevMsg.from !== msg.from || (msg.time && prevMsg.time && msg.time !== prevMsg.time);

      let senderHeaderHtml = '';
      if (!isSent && isFirstOfGroup) {
        const senderName = msg.sender_name || msg.senderName || conv.nickname || conv.name || 'Friend';
        const senderAvatarContent = conv.isAI
          ? '✨'
          : (conv.avatar ? `<img src="${conv.avatar}" alt="${_esc(senderName)}">` : _initials(senderName));
        const senderBg = conv.color || 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)';

        senderHeaderHtml = `
          <div class="msg-sender-header" data-sender-name="${_esc(senderName)}">
            <div class="msg-sender-avatar" style="background:${senderBg}">
              ${senderAvatarContent}
            </div>
            <span class="msg-sender-name">${_esc(senderName)}</span>
          </div>
        `;
      }

      const wrap = document.createElement('div');
      wrap.className = 'msg-wrap ' + (isSent ? 'sent' : 'received');
      wrap.dataset.msgId = msg.id;

      let content = '';

      if (msg.type === 'text') {
        const quizMatch = msg.body && msg.body.match(/[?&]quiz=(q_[a-zA-Z0-9_-]+)/);
        if (quizMatch) {
          const qId = quizMatch[1];
          content = `
            <div class="msg-bubble ${isSent ? 'sent' : 'received'} msg-quiz-card" data-msg-id="${msg.id}">
              <div class="msg-quiz-card-badge">💗 Friendship Quiz Challenge</div>
              <div class="msg-quiz-card-title">🎮 Don't Block Me!</div>
              <div class="msg-quiz-card-body">${_esc(msg.body).replace(/\n/g, '<br>')}</div>
              <button type="button" class="btn-play-chat-quiz" data-quiz-id="${qId}">
                🌸 Play Quiz Now ➔
              </button>
            </div>
          `;
        } else {
          content = `<div class="msg-bubble ${isSent ? 'sent' : 'received'}" data-msg-id="${msg.id}">${_esc(msg.body)}</div>`;
        }
      } else if (msg.type === 'image') {
        const src = msg.media || msg.media_url || msg.body;
        content = `
          <div class="msg-media" data-msg-id="${msg.id}">
            <img src="${src}" alt="Photo" class="msg-media-img" loading="lazy" />
          </div>`;
      } else if (msg.type === 'video') {
        const src = msg.media || msg.media_url || msg.body;
        content = `
          <div class="msg-media" data-msg-id="${msg.id}">
            <video src="${src}" controls class="msg-media-img" playsinline></video>
          </div>`;
      } else if (msg.type === 'voice') {
        const audioSrc = msg.media || msg.media_url || '';
        content = `
          <div class="msg-bubble voice-bubble ${isSent ? 'sent' : 'received'}" data-msg-id="${msg.id}">
            <button type="button" class="voice-play-btn" data-audio-id="${msg.id}" data-audio-src="${_esc(audioSrc)}" aria-label="Play voice note">
              <svg class="play-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <svg class="pause-icon hidden" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            </button>
            <div class="voice-waveform">
              <span class="vwave-bar" style="height:6px"></span>
              <span class="vwave-bar" style="height:14px"></span>
              <span class="vwave-bar" style="height:10px"></span>
              <span class="vwave-bar" style="height:18px"></span>
              <span class="vwave-bar" style="height:8px"></span>
              <span class="vwave-bar" style="height:12px"></span>
              <span class="vwave-bar" style="height:16px"></span>
              <span class="vwave-bar" style="height:6px"></span>
            </div>
            <span class="voice-time" id="vtime-${msg.id}">${msg.duration || '0:05'}</span>
            <button type="button" class="voice-dl-btn" data-audio-src="${_esc(audioSrc)}" title="Download audio 📥" aria-label="Download voice note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>`;
      }

      let reactionsHtml = '';
      if (msg.reactions && msg.reactions.length > 0) {
        reactionsHtml = '<div class="msg-reactions">';
        msg.reactions.forEach(r => {
          reactionsHtml += `<span class="msg-reaction-pill" data-msg-id="${msg.id}" data-reaction="${r}">${r}</span>`;
        });
        reactionsHtml += '</div>';
      }

      const fwdBadge = msg.isForwarded ? `
        <div class="forwarded-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 14 20 9 15 4"/>
            <path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
          </svg>
          <span>Forwarded</span>
        </div>` : '';

      wrap.innerHTML = `
        ${senderHeaderHtml}
        <div class="msg-row-wrap">
          <div class="msg-inner">
            ${fwdBadge}
            ${content}
            ${reactionsHtml}
            <div class="msg-meta">
              <span class="msg-time">${msg.time}</span>
              ${isSent ? `
                <span class="msg-status" title="${msg.seen ? 'Read' : 'Delivered'}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${msg.seen ? '#6366F1' : 'currentColor'}" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                    <polyline points="20 12 15 17" />
                  </svg>
                </span>` : ''}
            </div>
            <div class="reaction-bar hidden" data-msg-id="${msg.id}">
              <button class="reaction-bar-btn" data-emoji="❤️">❤️</button>
              <button class="reaction-bar-btn" data-emoji="😂">😂</button>
              <button class="reaction-bar-btn" data-emoji="😮">😮</button>
              <button class="reaction-bar-btn" data-emoji="😢">😢</button>
              <button class="reaction-bar-btn" data-emoji="👏">👏</button>
              <button class="reaction-bar-btn forward-btn" data-msg-id="${msg.id}" title="Share / Forward ✈️">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
          <button type="button" class="insta-msg-share-btn" data-msg-id="${msg.id}" title="Share / Forward ✈️" aria-label="Share message">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      `;

      if (idx === conv.messages.length - 1) {
        wrap.classList.add('animate-in');
      }
      area.appendChild(wrap);
    });

    const anchor = document.createElement('div');
    anchor.id = 'messages-bottom-anchor';
    anchor.className = 'messages-bottom-anchor';
    area.appendChild(anchor);

    _scrollToBottom(false);
    _attachVoicePlayHandlers();
  }

  function _scrollToBottom(smooth = false) {
    const area = document.getElementById('messages-area');
    if (!area) return;

    const doScroll = () => {
      area.scrollTop = area.scrollHeight + 9999;
      const anchor = area.querySelector('.messages-bottom-anchor');
      if (anchor) {
        try {
          anchor.scrollIntoView({ block: 'end', behavior: smooth ? 'smooth' : 'auto' });
        } catch(e) {}
      }
    };

    doScroll();
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 60);
    setTimeout(doScroll, 180);
  }

  let _activeAudio = null;
  function _attachVoicePlayHandlers() {
    document.querySelectorAll('.voice-play-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const msgId = btn.dataset.audioId;
        const audioSrc = btn.dataset.audioSrc;
        const bubble = btn.closest('.voice-bubble');
        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');
        const timeLabel = document.getElementById('vtime-' + msgId);

        if (currentlyPlayingAudioId === msgId) {
          if (_activeAudio) {
            _activeAudio.pause();
            _activeAudio = null;
          }
          if (audioPlayInterval) clearInterval(audioPlayInterval);
          currentlyPlayingAudioId = null;
          bubble?.classList.remove('is-playing');
          playIcon?.classList.remove('hidden');
          pauseIcon?.classList.add('hidden');
          return;
        }

        if (_activeAudio) {
          _activeAudio.pause();
          _activeAudio = null;
        }
        if (audioPlayInterval) clearInterval(audioPlayInterval);
        document.querySelectorAll('.voice-bubble.is-playing').forEach(b => {
          b.classList.remove('is-playing');
          b.querySelector('.play-icon')?.classList.remove('hidden');
          b.querySelector('.pause-icon')?.classList.add('hidden');
        });

        currentlyPlayingAudioId = msgId;
        bubble?.classList.add('is-playing');
        playIcon?.classList.add('hidden');
        pauseIcon?.classList.remove('hidden');

        if (audioSrc && audioSrc.startsWith('data:audio')) {
          _activeAudio = new Audio(audioSrc);
          _activeAudio.play().catch(err => console.warn('Audio play note:', err.message));
          _activeAudio.onended = () => {
            currentlyPlayingAudioId = null;
            bubble?.classList.remove('is-playing');
            playIcon?.classList.remove('hidden');
            pauseIcon?.classList.add('hidden');
          };
          _activeAudio.ontimeupdate = () => {
            if (_activeAudio && timeLabel) {
              const cur = Math.floor(_activeAudio.currentTime);
              const m = Math.floor(cur / 60);
              const s = cur % 60;
              timeLabel.textContent = m + ':' + (s < 10 ? '0' : '') + s;
            }
          };
        } else {
          let elapsed = 0;
          audioPlayInterval = setInterval(() => {
            elapsed++;
            if (timeLabel) timeLabel.textContent = '0:0' + elapsed;
            if (elapsed >= 5) {
              clearInterval(audioPlayInterval);
              currentlyPlayingAudioId = null;
              bubble?.classList.remove('is-playing');
              playIcon?.classList.remove('hidden');
              pauseIcon?.classList.add('hidden');
              if (timeLabel) timeLabel.textContent = '0:05';
            }
          }, 1000);
        }
      };
    });
  }

  /* ── COMPOSER & SENDING ── */
  let _heartSending = false;
  let _isSendingMsg = false;
  function _bindComposer() {
    const inp = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const quickHeartBtn = document.getElementById('quick-heart-btn');
    const attachBtn = document.getElementById('attach-toggle-btn');

    if (inp) {
      // Tap anywhere on the input wrapper immediately focuses the input
      const inputWrap = inp.closest('.msg-input-wrap');
      if (inputWrap) {
        inputWrap.addEventListener('click', () => {
          if (document.activeElement !== inp) inp.focus();
        });
      }

      inp.addEventListener('input', () => {
        const val = inp.value.trim();
        if (val.length > 0) {
          sendBtn?.classList.remove('hidden');
          quickHeartBtn?.classList.add('hidden');
        } else {
          sendBtn?.classList.add('hidden');
          quickHeartBtn?.classList.remove('hidden');
        }
      });

      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          if (isRecording) {
            e.preventDefault();
            e.stopPropagation();
            _sendVoiceRecording();
            return;
          }
          if (!e.shiftKey) {
            e.preventDefault();
            _sendMessage();
          }
        }
      });
    }

    if (sendBtn) {
      let _lastSendTap = 0;
      const doSend = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const now = Date.now();
        if (now - _lastSendTap < 250) return;
        _lastSendTap = now;
        _sendMessage();
        if (inp && document.activeElement !== inp) {
          try { inp.focus(); } catch (err) {}
        }
      };

      // Direct touchstart handler with preventDefault to keep keyboard focus & send immediately
      sendBtn.addEventListener('touchstart', doSend, { passive: false });
      sendBtn.addEventListener('click', doSend);
    }

    // Quick heart with strict single-handler and debounce lock (guarantees exactly 1 heart)
    if (quickHeartBtn) {
      let _lastHeartTap = 0;
      const doHeart = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const now = Date.now();
        if (now - _lastHeartTap < 400) return;
        _lastHeartTap = now;
        if (_heartSending) return;
        _heartSending = true;
        _sendDirectMessage('❤️', 'text');
        showToast('❤️ Sent');
        if (inp) {
          try { inp.focus(); } catch (err) {}
        }
        setTimeout(() => { _heartSending = false; }, 800);
      };

      quickHeartBtn.addEventListener('touchstart', doHeart, { passive: false });
      quickHeartBtn.addEventListener('click', doHeart);
    }

    // Track when input was focused so keyboard open transition is never interrupted
    let _inputFocusedAt = 0;
    if (inp) {
      inp.addEventListener('focus', () => {
        _inputFocusedAt = Date.now();
      });
    }

    // Dismiss keyboard on mobile only when user deliberately drags message history down
    const msgsArea = document.getElementById('messages-area');
    if (msgsArea) {
      let touchStartY = 0;
      msgsArea.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      msgsArea.addEventListener('touchmove', (e) => {
        if (!e.touches || !e.touches[0]) return;
        if (Date.now() - _inputFocusedAt < 1200) return;

        // Downward drag (pull down messages)
        const diffY = e.touches[0].clientY - touchStartY;
        if (diffY > 60) {
          if (inp && document.activeElement === inp) {
            inp.blur();
          }
        }
      }, { passive: true });
    }

    if (attachBtn) {
      attachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _toggleAttachMenu();
      });
    }

    document.getElementById('attach-photo-btn')?.addEventListener('click', () => {
      document.getElementById('photo-file-input')?.click();
      _closeAttachMenu();
    });

    document.getElementById('attach-video-btn')?.addEventListener('click', () => {
      document.getElementById('video-file-input')?.click();
      _closeAttachMenu();
    });

    document.getElementById('photo-file-input')?.addEventListener('change', (e) => _handleMedia(e, 'image'));
    document.getElementById('video-file-input')?.addEventListener('change', (e) => _handleMedia(e, 'video'));

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#attach-menu') && !e.target.closest('#attach-toggle-btn')) _closeAttachMenu();
      if (!e.target.closest('#emoji-picker-popover') && !e.target.closest('#emoji-toggle-btn')) _closeEmojiPicker();
      if (!e.target.closest('#chat-more-drop') && !e.target.closest('#chat-more-btn')) {
        document.getElementById('chat-more-drop')?.classList.add('hidden');
      }
    });
  }

  function _sendMessage() {
    if (_isSendingMsg) return;
    const inp = document.getElementById('message-input');
    if (!inp) return;
    const text = inp.value.trim();
    if (!text) return;

    _isSendingMsg = true;
    try {
      _sendDirectMessage(text, 'text');
      inp.value = '';

      const sendBtn = document.getElementById('send-btn');
      const quickHeartBtn = document.getElementById('quick-heart-btn');
      if (sendBtn) sendBtn.classList.add('hidden');
      if (quickHeartBtn) quickHeartBtn.classList.remove('hidden');

      if (inp && document.activeElement !== inp) {
        try { inp.focus(); } catch (err) {}
      }
    } catch (err) {
      console.error('[BUDDY] _sendMessage error:', err);
    } finally {
      setTimeout(() => {
        _isSendingMsg = false;
      }, 80);
    }

    _scrollToBottom(false);
  }

  function _sendDirectMessage(content, type = 'text', mediaUrl = null, duration = null) {
    if (!activeConvId) return;
    const conv = conversations.find(c => c.id === activeConvId);
    if (!conv) return;

    const tempId = 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const msg = {
      id: tempId,
      from: 'me',
      type: type,
      body: type === 'text' ? content : (content || ''),
      media: mediaUrl || undefined,
      duration: duration || undefined,
      time: _now(),
      seen: false,
      reactions: []
    };

    if (!Array.isArray(conv.messages)) {
      conv.messages = [];
    }
    conv.messages.push(msg);
    _renderMessages(conv);
    _renderChatList();

    if (conv.isAI) {
      _respondWithAI(conv, content);
      return;
    }

    if (window.BuddySupabase && currentUser && currentUser.id && conv.id) {
      BuddySupabase.insertMessage({
        conversation_id: conv.id,
        sender_id: currentUser.id,
        type: type,
        body: msg.body || '',
        media_url: mediaUrl || null,
        duration: duration || null
      }).then(inserted => {
        if (inserted && inserted.id) {
          msg.id = inserted.id;
          msg.seen = true;
          _renderMessages(conv);
        }
      }).catch(err => {
        console.warn('[BUDDY] Send message error:', err);
      });
    }
  }

  /* ── BUDDY AI LOGIC ── */
  function _respondWithAI(conv, userText) {
    const statusEl = document.getElementById('chat-peer-status');
    if (statusEl) statusEl.textContent = 'BUDDY AI is thinking... 💭';

    setTimeout(() => {
      const reply = _generateAIResponse(userText);
      const aiMsg = {
        id: 'ai_' + Date.now(),
        from: 'them',
        type: 'text',
        body: reply,
        time: _now(),
        seen: true,
        reactions: ['✨']
      };

      conv.messages.push(aiMsg);
      _renderMessages(conv);
      _renderChatList();

      if (statusEl) statusEl.textContent = 'Online • AI Companion';
    }, 1100);
  }

  function _generateAIResponse(userText) {
    const text = (userText || '').toLowerCase().trim();

    if (text === '❤️' || text.includes('love you') || text.includes('pyaar')) {
      return "Aww, sending so much love right back to you! ❤️ I'm always here for you.";
    }
    if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('namaste')) {
      return "Hey there! 👋 So glad you're here. How is your day going?";
    }
    if (text.includes('how are you') || text.includes('kaise ho')) {
      return "I'm doing wonderful, thank you for asking! 😊 How are you feeling today?";
    }
    if (text.includes('sad') || text.includes('depressed') || text.includes('cry') || text.includes('upset') || text.includes('bad day')) {
      return "I hear you, and it's completely okay to feel this way. 🫂 Rough moments pass, but you are strong. Want to talk about it?";
    }
    if (text.includes('joke') || text.includes('funny') || text.includes('hasao')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything! 😂",
        "Why did the computer catch a cold? Because it left its Windows open! 💻❄️",
        "Why was the math book sad? Because it had too many problems! 📖"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    if (text.includes('who are you') || text.includes('koun ho')) {
      return "I'm BUDDY AI! ✨ Your private, intelligent 1-to-1 companion in BUDDY. You can chat with me, share your mood, ask for advice, or just vibe 24/7!";
    }
    if (text.includes('quote') || text.includes('motivation') || text.includes('shayari')) {
      const quotes = [
        "🌟 'Every great story begins with a small step.' Keep going, you've got this!",
        "💫 'Stars can't shine without darkness.' This chapter is making you stronger!",
        "✨ 'Be kind to your mind today. You are doing wonderfully.'"
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    }

    const defaultReplies = [
      "That's so thoughtful! Tell me more about that. ✨",
      "I love hearing from you! You always bring interesting thoughts. 😊",
      "I'm listening closely. How does that make you feel?",
      "Every talk with you is special! Always here whenever you want to chat. 💖",
      "That makes total sense! What do you plan to do next?"
    ];
    return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
  }

  /* ── HANDLE MEDIA ATTACHMENTS (PHOTOS & VIDEOS) ── */
  function _handleMedia(e, type) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('⚠️ File is too large (maximum 25MB allowed)');
      e.target.value = '';
      return;
    }

    showToast(type === 'image' ? '⏳ Sending photo...' : '⏳ Sending video...');

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      _sendDirectMessage(type === 'image' ? '📷 Photo' : '🎥 Video', type, dataUrl);
      showToast(type === 'image' ? '📷 Photo sent!' : '🎥 Video sent!');
    };
    reader.onerror = () => {
      showToast('❌ Error reading file');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  /* ── VOICE RECORDING (MIC) ── */
  let _mediaRecorder = null;
  let _audioChunks = [];
  let _recordedAudioDataUrl = null;

  function _bindVoiceRecording() {
    const micBtn = document.getElementById('mic-btn');
    const recordBar = document.getElementById('voice-record-bar');
    const recTimer = document.getElementById('rec-timer');
    const cancelBtn = document.getElementById('rec-cancel-btn');
    const sendBtn = document.getElementById('rec-send-btn');

    if (!micBtn || !recordBar) return;

    micBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      isRecording = true;
      recSeconds = 0;
      recTimer.textContent = '0:00';
      recordBar.classList.remove('hidden');
      _audioChunks = [];
      _recordedAudioDataUrl = null;

      // Real microphone recording with MediaRecorder
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          _mediaRecorder = new MediaRecorder(stream);
          _mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              _audioChunks.push(event.data);
            }
          };
          _mediaRecorder.onstop = () => {
            if (_audioChunks.length > 0) {
              const audioBlob = new Blob(_audioChunks, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.onloadend = () => {
                _recordedAudioDataUrl = reader.result;
              };
              reader.readAsDataURL(audioBlob);
            }
            stream.getTracks().forEach(track => track.stop());
          };
          _mediaRecorder.start();
        } catch (err) {
          console.warn('[BUDDY] Mic access note:', err.message);
          _mediaRecorder = null;
        }
      }

      if (recInterval) clearInterval(recInterval);
      recInterval = setInterval(() => {
        recSeconds++;
        const m = Math.floor(recSeconds / 60);
        const s = recSeconds % 60;
        recTimer.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      }, 1000);
    });

    if (cancelBtn) cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      _stopRecording(true);
      showToast('🗑️ Voice note cancelled');
    });

    if (sendBtn) sendBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      _sendVoiceRecording();
    });
  }

  
  function _sendVoiceRecording() {
    if (!isRecording) return;
    const recTimer = document.getElementById('rec-timer');
    const dur = recTimer ? recTimer.textContent : '0:02';
    const finalDur = (dur === '0:00') ? '0:02' : dur;
    _stopRecording(false);

    setTimeout(() => {
      _sendDirectMessage('🎙️ Voice Note', 'voice', _recordedAudioDataUrl || null, finalDur);
      if (typeof showToast === 'function') showToast('🎙️ Voice note sent!');
    }, 180);
  }

  function _stopRecording(isCancelled = false) {
    isRecording = false;
    clearInterval(recInterval);
    document.getElementById('voice-record-bar')?.classList.add('hidden');
    if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
      try {
        _mediaRecorder.stop();
      } catch (err) {}
    }
    if (isCancelled) {
      _audioChunks = [];
      _recordedAudioDataUrl = null;
    }
  }

  /* ── EMOJI PICKER ── */
  function _bindEmojiPicker() {
    const btn = document.getElementById('emoji-toggle-btn');
    const popover = document.getElementById('emoji-picker-popover');
    const tabs = document.querySelectorAll('.emoji-tab, .emoji-tab-btn');

    if (!btn || !popover) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      popover.classList.toggle('hidden');
      if (!popover.classList.contains('hidden')) {
        _renderEmojiGrid('love');
      }
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _renderEmojiGrid(tab.dataset.cat);
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#emoji-picker-popover') && !e.target.closest('#emoji-toggle-btn')) {
        popover.classList.add('hidden');
      }
    });
  }

  function _renderEmojiGrid(cat) {
    const grid = document.getElementById('emoji-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const list = EMOJI_SETS[cat] || EMOJI_SETS.love;

    list.forEach(emoji => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'emoji-cell-btn';
      b.textContent = emoji;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const inp = document.getElementById('message-input');
        if (inp) {
          inp.value += emoji;
          inp.focus();
        }
        const sendBtn = document.getElementById('send-btn');
        const quickHeartBtn = document.getElementById('quick-heart-btn');
        if (sendBtn) sendBtn.classList.remove('hidden');
        if (quickHeartBtn) quickHeartBtn.classList.add('hidden');
      });
      grid.appendChild(b);
    });
  }

  function _closeEmojiPicker() {
    const p = document.getElementById('emoji-picker-popover');
    if (p) p.classList.add('hidden');
  }

  function _toggleAttachMenu() {
    const m = document.getElementById('attach-menu');
    if (m) m.classList.toggle('hidden');
  }

  function _closeAttachMenu() {
    const m = document.getElementById('attach-menu');
    if (m) m.classList.add('hidden');
  }

  /* ── DOUBLE-TAP REACTIONS ── */
  function _bindReactionsAndDoubleTap() {
    const area = document.getElementById('messages-area');
    if (!area) return;

    let lastTapTime = 0;
    let lastTapTarget = null;

    area.addEventListener('click', (e) => {
      // 1. Emoji clicked from floating reaction bar
      const rxBtn = e.target.closest('.reaction-bar-btn');
      if (rxBtn) {
        e.stopPropagation();
        const emoji = rxBtn.dataset.emoji;
        const bar = rxBtn.closest('.reaction-bar');
        const msgId = bar?.dataset.msgId;
        if (bar) bar.classList.add('hidden');
        if (msgId) _toggleReaction(msgId, emoji);
        return;
      }

      // 2. Click on existing reaction pill badge to toggle/remove it
      const pill = e.target.closest('.msg-reaction-pill');
      if (pill) {
        e.stopPropagation();
        const emoji = pill.dataset.reaction;
        const msgId = pill.dataset.msgId;
        if (msgId) _toggleReaction(msgId, emoji);
        return;
      }

      // 3. Click on message bubble or media to show/hide reaction bar
      const bubble = e.target.closest('.msg-bubble, .msg-media');
      if (bubble) {
        e.stopPropagation();
        const now = Date.now();
        const msgWrap = bubble.closest('.msg-wrap');
        const bar = msgWrap ? msgWrap.querySelector('.reaction-bar') : null;

        // Double-tap: trigger heart burst
        if (lastTapTarget === bubble && (now - lastTapTime) < 350) {
          const msgId = bubble.dataset.msgId;
          _triggerHeartBurst(bubble);
          _toggleReaction(msgId, '❤️');
          if (bar) bar.classList.add('hidden');
          lastTapTime = 0;
          lastTapTarget = null;
          return;
        }

        lastTapTime = now;
        lastTapTarget = bubble;

        // Single click: toggle reaction bar for this specific message
        const isHidden = !bar || bar.classList.contains('hidden');

        // Hide any open reaction bars on other messages
        document.querySelectorAll('.reaction-bar').forEach(b => b.classList.add('hidden'));

        // If it was hidden, show it
        if (bar && isHidden) {
          bar.classList.remove('hidden');
        }
        return;
      }

      // 4. Clicked outside message: hide all reaction bars
      document.querySelectorAll('.reaction-bar').forEach(b => b.classList.add('hidden'));
    });

    // Outside click anywhere on screen closes all reaction bars
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.reaction-bar') && !e.target.closest('.msg-bubble') && !e.target.closest('.msg-media')) {
        document.querySelectorAll('.reaction-bar').forEach(b => b.classList.add('hidden'));
      }
    });
  }

  function _triggerHeartBurst(bubble) {
    const burst = document.createElement('div');
    burst.className = 'heart-burst';
    burst.textContent = '❤️';
    bubble.appendChild(burst);
    setTimeout(() => burst.remove(), 850);
  }

  function _toggleReaction(msgId, emoji) {
    const conv = conversations.find(c => c.id === activeConvId);
    if (!conv) return;
    const msg = conv.messages.find(m => m.id === msgId);
    if (!msg) return;

    msg.reactions = msg.reactions || [];
    const idx = msg.reactions.indexOf(emoji);
    if (idx > -1) msg.reactions.splice(idx, 1);
    else msg.reactions.push(emoji);

    _renderMessages(conv);
  }

  /* ── CALLS (Audio & Video Simulation) ── */
  /* ── TRUE WEBRTC AUDIO & VOICE CALLING ── */
  function _bindCalls() {
    if (window.WebRTCCall) {
      window.WebRTCCall.init({
        getCurrentUser: () => currentUser,
        getActiveConversation: () => conversations.find(c => c.id === activeConvId)
      });
    }

    const audioBtn = document.getElementById('call-audio-btn');
    const videoBtn = document.getElementById('call-video-btn');

    if (audioBtn) {
      audioBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.WebRTCCall) {
          window.WebRTCCall.startCall('audio');
        }
      };
    }

    if (videoBtn) {
      videoBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.WebRTCCall) {
          window.WebRTCCall.startCall('video');
        }
      };
    }
  }

  /* ── CHAT INFO MODAL ── */
  function _bindChatInfoModal() {
    const infoBtn = document.getElementById('chat-info-btn');
    const peerClick = document.getElementById('chat-peer-info-click');
    const overlay = document.getElementById('chat-info-overlay');
    const closeBtn = document.getElementById('close-info-btn');
    const saveNickBtn = document.getElementById('save-nickname-btn');
    const nickInput = document.getElementById('info-nickname-input');
    const pinToggle = document.getElementById('pin-chat-toggle');
    const clearBtn = document.getElementById('modal-clear-chat-btn');
    const blockBtn = document.getElementById('block-user-btn');

    if (!infoBtn || !overlay) return;

    function _openDetails() {
      if (!activeConvId) return;
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;

      document.getElementById('info-peer-avatar').textContent = conv.isAI ? '✨' : _initials(conv.name);
      document.getElementById('info-peer-avatar').style.background = conv.color;
      document.getElementById('info-peer-name').textContent = conv.name;
      document.getElementById('info-peer-uname').textContent = conv.username;
      document.getElementById('info-peer-status-text').textContent = conv.status;

      if (nickInput) nickInput.value = conv.nickname || '';
      if (pinToggle) pinToggle.checked = !!conv.pinned;

      const removeBtn = document.getElementById('modal-remove-friend-btn');
      if (removeBtn) {
        removeBtn.style.display = conv.isAI ? 'none' : 'flex';
      }

      overlay.classList.remove('hidden');
    }

    infoBtn.addEventListener('click', _openDetails);
    if (peerClick) peerClick.addEventListener('click', _openDetails);
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

    if (saveNickBtn) saveNickBtn.addEventListener('click', () => {
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;
      conv.nickname = nickInput.value.trim();

      const display = conv.nickname || conv.name;
      document.getElementById('chat-peer-name').innerHTML = _esc(display) + (conv.isAI ? '<span class="ai-badge">AI</span>' : '');
      _renderChatList();
      showToast('✏️ Nickname updated to "' + display + '"');
    });

    if (pinToggle) pinToggle.addEventListener('change', () => {
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;
      conv.pinned = pinToggle.checked;
      document.getElementById('chat-pinned-tag')?.classList.toggle('hidden', !conv.pinned);
      _renderChatList();
      showToast(conv.pinned ? '📌 Chat pinned to top!' : 'Chat unpinned');
    });

    function clearChatForThisDevice() {
      if (!activeConvId) return;
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;

      if (!confirm('Clear chat on this device only? (Your partner will still have the chat)')) {
        return;
      }

      const now = Date.now();
      localStorage.setItem('buddy_cleared_' + conv.id + '_' + currentUser.id, now.toString());

      conv.messages = [];
      _renderMessages(conv);
      _renderChatList();

      document.getElementById('chat-info-overlay')?.classList.add('hidden');
      document.getElementById('chat-more-drop')?.classList.add('hidden');
      showToast('🗑️ Chat cleared on this device only');
    }

    function togglePinCurrentChat() {
      if (!activeConvId) return;
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;
      conv.pinned = !conv.pinned;
      document.getElementById('chat-pinned-tag')?.classList.toggle('hidden', !conv.pinned || conv.isAI);
      _renderChatList();
      showToast(conv.pinned ? '📌 Chat pinned to top!' : 'Chat unpinned');
    }

    if (clearBtn) clearBtn.addEventListener('click', clearChatForThisDevice);

    function removeCurrentFriend() {
      if (!activeConvId) return;
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;

      if (conv.isAI) {
        showToast('✨ BUDDY AI cannot be removed');
        return;
      }

      const displayName = conv.nickname || conv.name || conv.username || 'this user';
      if (!confirm('Remove ' + displayName + ' from your chats?\n\nYou can add them back anytime by searching ' + (conv.username || '') + '.')) {
        return;
      }

      const peerId = conv.userId || (conv.peer ? conv.peer.id : '');
      localStorage.setItem('buddy_removed_conv_' + conv.id + '_' + currentUser.id, 'true');
      if (peerId) {
        localStorage.setItem('buddy_removed_peer_' + peerId + '_' + currentUser.id, 'true');
      }

      conversations = conversations.filter(c => c.id !== conv.id);

      document.getElementById('chat-info-overlay')?.classList.add('hidden');
      document.getElementById('chat-more-drop')?.classList.add('hidden');

      openChat('buddy_ai');
      _renderChatList();

      showToast('🗑️ ' + displayName + ' removed from chats');
    }

    const removeFriendBtn = document.getElementById('modal-remove-friend-btn');
    if (removeFriendBtn) removeFriendBtn.addEventListener('click', removeCurrentFriend);
    const removeFriendItem = document.getElementById('remove-friend-item');
    if (removeFriendItem) removeFriendItem.addEventListener('click', removeCurrentFriend);

    let isBlocked = false;
    if (blockBtn) blockBtn.addEventListener('click', () => {
      isBlocked = !isBlocked;
      document.getElementById('block-btn-text').textContent = isBlocked ? 'Unblock Contact' : 'Block Contact';
      showToast(isBlocked ? '🚫 Contact blocked' : '✓ Contact unblocked');
    });
  }

  /* ── SEARCH & USER DISCOVERY ── */
  function _bindSearch() {
    const inp = document.getElementById('chat-search-input');
    if (!inp) return;
    let debounceTimer = null;

    inp.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const q = inp.value.trim();
        _renderChatList(q);

        if (q.length >= 2 && window.BuddySupabase) {
          const results = await BuddySupabase.searchProfiles(q, currentUser?.id);
          if (results && results.length > 0) {
            _showSearchMatchesInModal(results);
          }
        }
      }, 300);
    });
  }

  function _bindNewChat() {
    const openBtn = document.getElementById('new-chat-btn');
    const ctaBtn = document.getElementById('empty-start-chat-btn');
    const overlay = document.getElementById('new-chat-overlay');
    const closeBtn = document.getElementById('close-new-chat-btn');
    const search = document.getElementById('new-chat-search-input');

    if (!overlay) return;

    function _open() {
      overlay.classList.remove('hidden');
      if (search) {
        search.placeholder = 'Search registered users by @username...';
        search.value = '';
        search.focus();
      }
      _renderSearchUserList('');
    }

    if (openBtn) openBtn.addEventListener('click', _open);
    if (ctaBtn) ctaBtn.addEventListener('click', _open);
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

    let searchTimer = null;
    if (search) {
      search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => _renderSearchUserList(search.value), 300);
      });
    }
  }

  async function _renderSearchUserList(query) {
    const container = document.getElementById('user-list-container');
    if (!container) return;
    container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-3); font-size:13px;">Type a friend&#39;s <b>@username</b> to find and connect privately...</div>';

    const q = (query || '').trim();
    if (!q || q.length < 2) return;

    container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-3);">Searching registered users...</div>';

    let matches = [];
    if (window.BuddySupabase) {
      matches = await BuddySupabase.searchProfiles(q, currentUser?.id);
    }

    if (!matches || matches.length === 0) {
      container.innerHTML = `<div style="padding:28px 16px; text-align:center; color:var(--text-3); font-size:13px; line-height:1.6;">
        No user found with "<b>${_esc(q)}</b>"<br/>
        <span style="font-size:11px;">Make sure your friend has registered and verified their @username on BUDDY!</span>
      </div>`;
      return;
    }

    container.innerHTML = '';
    matches.forEach(u => {
      const el = document.createElement('div');
      el.className = 'user-pick-item';
      el.innerHTML = `
        <div class="chat-item-avatar" style="background:${u.avatar_color || '#6366F1'}">${_initials(u.full_name || u.username)}</div>
        <div class="user-pick-info">
          <div class="user-pick-name">${_esc(u.full_name || 'User')}</div>
          <div class="user-pick-uname">${_esc(u.username)} • ${_esc(u.bio || 'Verified Member')}</div>
        </div>
      `;
      el.addEventListener('click', async () => {
        await _startRealChatWithUser(u);
        document.getElementById('new-chat-overlay')?.classList.add('hidden');
      });
      container.appendChild(el);
    });
  }

  function _showSearchMatchesInModal(results) {
    const overlay = document.getElementById('new-chat-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    const container = document.getElementById('user-list-container');
    if (!container) return;
    container.innerHTML = '';

    results.forEach(u => {
      const el = document.createElement('div');
      el.className = 'user-pick-item';
      el.innerHTML = `
        <div class="chat-item-avatar" style="background:${u.avatar_color || '#6366F1'}">${_initials(u.full_name || u.username)}</div>
        <div class="user-pick-info">
          <div class="user-pick-name">${_esc(u.full_name || 'User')}</div>
          <div class="user-pick-uname">${_esc(u.username)} • ${_esc(u.bio || 'Verified Member')}</div>
        </div>
      `;
      el.addEventListener('click', async () => {
        await _startRealChatWithUser(u);
        overlay.classList.add('hidden');
      });
      container.appendChild(el);
    });
  }

  async function _startRealChatWithUser(u) {
    showToast('💬 Connecting chat with ' + (u.full_name || u.username) + '...');

    let convId = null;
    if (window.BuddySupabase && currentUser && currentUser.id) {
      convId = await BuddySupabase.getOrCreateConversation(currentUser.id, u.id);
    }
    if (!convId) {
      convId = 'c_' + u.id;
    }

    // Clear any removed flags so friend is restored in chat list
    localStorage.removeItem('buddy_removed_peer_' + u.id + '_' + currentUser.id);
    if (convId) localStorage.removeItem('buddy_removed_conv_' + convId + '_' + currentUser.id);

    let existing = conversations.find(c => c.id === convId || c.userId === u.id);
    if (!existing) {
      existing = {
        id: convId,
        isAI: false,
        userId: u.id,
        name: u.full_name || u.username,
        username: u.username,
        color: u.avatar_color || '#6366F1',
        status: u.status || 'Active now',
        nickname: '',
        pinned: false,
        accent: 'indigo',
        unread: 0,
        messages: []
      };
      conversations.splice(1, 0, existing);
    } else {
      existing.id = convId;
    }
    _renderChatList();
    openChat(existing.id);
    showToast('✓ ' + (u.full_name || u.username) + ' added to your chats!');
  }

  /* ── PROFILE MODAL ── */
  function _bindProfile() {
    const openBtn = document.getElementById('profile-open-btn');
    const overlay = document.getElementById('profile-overlay');
    const closeBtn = document.getElementById('close-profile-btn');
    const themeBtn = document.getElementById('profile-theme-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');

    if (!overlay) return;

    if (openBtn) openBtn.addEventListener('click', () => overlay.classList.remove('hidden'));
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = ThemeManager.toggle();
        showToast(next === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to log out?')) {
          if (window.AuthManager && typeof window.AuthManager.logout === 'function') {
            window.AuthManager.logout();
          } else {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
          }
        }
      });
    }

    document.querySelectorAll('#avatar-presets .avatar-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('#avatar-presets .avatar-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        const bigAv = document.getElementById('profile-big-avatar');
        if (bigAv) bigAv.style.background = sw.style.background;
      });
    });

    document.querySelectorAll('#mood-chips .mood-chip').forEach(mc => {
      mc.addEventListener('click', () => {
        document.querySelectorAll('#mood-chips .mood-chip').forEach(c => c.classList.remove('active'));
        mc.classList.add('active');
      });
    });

    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', async () => {
        const bio = document.getElementById('profile-bio-input').value.trim();
        const activeMood = document.querySelector('#mood-chips .mood-chip.active');
        const moodText = activeMood ? activeMood.dataset.mood : 'Available';

        if (currentUser) {
          currentUser.bio = bio;
          currentUser.mood = moodText;
          localStorage.setItem('buddy-session', JSON.stringify(currentUser));

          if (window.BuddySupabase) {
            await BuddySupabase.upsertProfile({
              id: currentUser.id,
              username: currentUser.username,
              full_name: currentUser.name,
              bio: bio,
              mood: moodText
            });
          }
        }
        overlay.classList.add('hidden');
        showToast('✓ Profile updated in cloud!');
      });
    }
  }

  
  /* ── FULLSCREEN IMAGE LIGHTBOX & DOWNLOAD LOGIC ── */
  let _currentLightboxSrc = '';

  
  /* ── AUTHENTIC INSTAGRAM-STYLE SHARE / FORWARD LOGIC ── */
  let _msgToForward = null;
  const _sentTargetIds = new Set();

  function _openForwardModal(msgId) {
    if (!activeConvId) return;
    const currentConv = conversations.find(c => c.id === activeConvId);
    if (!currentConv) return;
    const msg = currentConv.messages.find(m => m.id === msgId);
    if (!msg) return;

    _msgToForward = msg;
    _sentTargetIds.clear();

    const noteInp = document.getElementById('forward-note-input');
    if (noteInp) noteInp.value = '';

    const searchInp = document.getElementById('forward-search-input');
    if (searchInp) searchInp.value = '';

    _renderInstaQuickRow();
    _renderForwardContactsList();

    const overlay = document.getElementById('forward-overlay');
    if (overlay) overlay.classList.remove('hidden');

    document.querySelectorAll('.reaction-bar').forEach(b => b.classList.add('hidden'));
  }

  function _closeForwardModal() {
    const overlay = document.getElementById('forward-overlay');
    if (overlay) overlay.classList.add('hidden');
    _msgToForward = null;
    _sentTargetIds.clear();
  }

  function _renderInstaQuickRow() {
    const quickRow = document.getElementById('insta-quick-row');
    if (!quickRow) return;
    quickRow.innerHTML = '';

    // Show up to 8 top conversations in Instagram story carousel style
    const topConvs = conversations.slice(0, 8);
    topConvs.forEach(conv => {
      const displayName = conv.nickname || conv.name;
      const isSent = _sentTargetIds.has(conv.id);

      const item = document.createElement('div');
      item.className = 'insta-quick-item';

      item.innerHTML = `
        <div class="insta-quick-avatar-ring">
          <div class="insta-quick-avatar" style="background:${conv.color}">
            ${conv.isAI ? '✨' : _initials(displayName)}
          </div>
        </div>
        <div class="insta-quick-name">${_esc(displayName)}</div>
      `;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        _sendForwardToConversation(conv.id, null);
      });

      quickRow.appendChild(item);
    });
  }

  function _renderForwardContactsList(filter = '') {
    const listEl = document.getElementById('forward-contacts-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const q = (filter || '').toLowerCase().trim();
    const available = conversations.filter(c => {
      const name = (c.nickname || c.name || '').toLowerCase();
      const uname = (c.username || '').toLowerCase();
      return name.includes(q) || uname.includes(q);
    });

    if (available.length === 0) {
      listEl.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-3); font-size:13px;">No accounts found</div>';
      return;
    }

    available.forEach(conv => {
      const displayName = conv.nickname || conv.name;
      const uname = conv.username || (conv.isAI ? '@buddy.ai' : '@user');
      const isSent = _sentTargetIds.has(conv.id);

      const row = document.createElement('div');
      row.className = 'insta-contact-row';

      row.innerHTML = `
        <div class="insta-contact-left">
          <div class="insta-contact-avatar" style="background:${conv.color}">
            ${conv.isAI ? '✨' : _initials(displayName)}
          </div>
          <div class="insta-contact-meta">
            <div class="insta-contact-name">
              ${_esc(displayName)}
              ${conv.isAI ? '<span class="ai-badge" style="margin-left:4px;">AI</span>' : ''}
            </div>
            <div class="insta-contact-uname">${_esc(uname)}</div>
          </div>
        </div>
        <button type="button" class="insta-send-btn ${isSent ? 'is-sent' : ''}" data-conv-id="${conv.id}">
          ${isSent ? 'Sent ✓' : 'Send'}
        </button>
      `;

      const sendBtn = row.querySelector('.insta-send-btn');
      if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (_sentTargetIds.has(conv.id)) return;
          _sendForwardToConversation(conv.id, sendBtn);
        });
      }

      listEl.appendChild(row);
    });
  }

  function _sendForwardToConversation(targetConvId, btnEl = null) {
    if (!_msgToForward || !targetConvId) return;
    const targetConv = conversations.find(c => c.id === targetConvId);
    if (!targetConv) return;

    _sentTargetIds.add(targetConvId);

    // Update button state to Instagram "Sent ✓"
    if (btnEl) {
      btnEl.textContent = 'Sent ✓';
      btnEl.classList.add('is-sent');
    }
    // Update any matching buttons in list
    document.querySelectorAll(`.insta-send-btn[data-conv-id="${targetConvId}"]`).forEach(b => {
      b.textContent = 'Sent ✓';
      b.classList.add('is-sent');
    });

    const noteText = document.getElementById('forward-note-input')?.value.trim();

    const tempId = 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const forwardedMsg = {
      id: tempId,
      from: 'me',
      type: _msgToForward.type || 'text',
      body: _msgToForward.body || '',
      media: _msgToForward.media || _msgToForward.media_url || undefined,
      duration: _msgToForward.duration || undefined,
      isForwarded: true,
      time: _now(),
      seen: false,
      reactions: []
    };

    targetConv.messages.push(forwardedMsg);

    // If an optional note was entered in "Write a message...", send it right after
    if (noteText) {
      const noteMsg = {
        id: 'm_note_' + Date.now(),
        from: 'me',
        type: 'text',
        body: noteText,
        time: _now(),
        seen: false,
        reactions: []
      };
      targetConv.messages.push(noteMsg);
    }

    if (activeConvId === targetConvId) {
      _renderMessages(targetConv);
    }
    _renderChatList();

    // Sync to Supabase if real conversation
    if (!targetConv.isAI && window.BuddySupabase && currentUser && currentUser.id && targetConv.id) {
      BuddySupabase.insertMessage({
        conversation_id: targetConv.id,
        sender_id: currentUser.id,
        type: forwardedMsg.type,
        body: forwardedMsg.body || '',
        media_url: forwardedMsg.media || null,
        duration: forwardedMsg.duration || null
      }).then(inserted => {
        if (inserted && inserted.id) {
          forwardedMsg.id = inserted.id;
          forwardedMsg.seen = true;
          if (activeConvId === targetConvId) _renderMessages(targetConv);
        }
      }).catch(err => console.warn('[BUDDY] Forward sync error:', err));

      if (noteText) {
        BuddySupabase.insertMessage({
          conversation_id: targetConv.id,
          sender_id: currentUser.id,
          type: 'text',
          body: noteText,
          media_url: null,
          duration: null
        }).catch(err => console.warn('[BUDDY] Note sync error:', err));
      }
    } else if (targetConv.isAI) {
      _respondWithAI(targetConv, forwardedMsg.body || 'Forwarded content');
    }

    const targetName = targetConv.nickname || targetConv.name;
    if (typeof showToast === 'function') {
      showToast('✈️ Sent to ' + targetName + '!');
    }
  }

  function _downloadVoiceNoteFile(src) {
    if (!src) {
      if (typeof showToast === 'function') showToast('⚠️ No audio recording found');
      return;
    }
    const filename = 'BUDDY_voice_' + Date.now() + '.webm';
    _saveImageToDevice(src); // uses robust dataUrl/blob download
    if (typeof showToast === 'function') {
      showToast('💾 Voice recording saved to device!');
    }
  }

  function _openImageLightbox(src) {
    if (!src) return;
    _currentLightboxSrc = src;
    const overlay = document.getElementById('image-lightbox-overlay');
    const imgEl = document.getElementById('lightbox-img');
    if (!overlay || !imgEl) return;

    imgEl.src = src;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function _closeImageLightbox() {
    const overlay = document.getElementById('image-lightbox-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function _saveImageToDevice(src) {
    if (!src) return;
    const filename = 'BUDDY_photo_' + Date.now() + '.jpg';

    if (src.startsWith('data:') || src.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = src;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (typeof showToast === 'function') showToast('💾 Photo saved to your device!');
      return;
    }

    // External URL download via Blob
    fetch(src, { mode: 'cors' })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
        if (typeof showToast === 'function') showToast('💾 Photo saved to your device!');
      })
      .catch(() => {
        // Fallback direct anchor click
        const a = document.createElement('a');
        a.href = src;
        a.target = '_blank';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (typeof showToast === 'function') showToast('💾 Photo download started!');
      });
  }

  function _bindEvents() {
    
    // Lightbox Controls
    
    // Forward Modal Controls
    document.getElementById('close-forward-btn')?.addEventListener('click', _closeForwardModal);
    document.getElementById('forward-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'forward-overlay') _closeForwardModal();
    });
    document.getElementById('forward-search-input')?.addEventListener('input', (e) => {
      _renderForwardContactsList(e.target.value);
    });

    // Done button in Instagram share sheet
    document.getElementById('forward-done-btn')?.addEventListener('click', _closeForwardModal);

    // Delegate forward clicks, voice download clicks & message click selection
    document.getElementById('messages-area')?.addEventListener('click', (e) => {
      const fwdBtn = e.target.closest('.forward-btn, .insta-msg-share-btn');
      if (fwdBtn) {
        e.stopPropagation();
        const msgId = fwdBtn.dataset.msgId;
        if (msgId) _openForwardModal(msgId);
        return;
      }

      const voiceDlBtn = e.target.closest('.voice-dl-btn');
      if (voiceDlBtn) {
        e.stopPropagation();
        const src = voiceDlBtn.dataset.audioSrc;
        _downloadVoiceNoteFile(src);
        return;
      }

      // Message click toggle: jab user message par click kare to share button show ho
      const msgWrap = e.target.closest('.msg-wrap');
      if (msgWrap) {
        if (e.target.closest('.voice-play-btn, .reaction-bar-btn, .msg-reaction-pill')) return;
        const wasActive = msgWrap.classList.contains('active-msg');
        document.querySelectorAll('.msg-wrap.active-msg').forEach(w => w.classList.remove('active-msg'));
        if (!wasActive) {
          msgWrap.classList.add('active-msg');
        }
      }
    });

    // Clicking anywhere outside messages closes active share button
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.msg-wrap') && !e.target.closest('.forward-btn, .insta-msg-share-btn, #forward-overlay')) {
        document.querySelectorAll('.msg-wrap.active-msg').forEach(w => w.classList.remove('active-msg'));
      }
    });

    document.getElementById('lightbox-close-btn')?.addEventListener('click', _closeImageLightbox);
    document.getElementById('lightbox-download-btn')?.addEventListener('click', () => {
      _saveImageToDevice(_currentLightboxSrc);
    });
    document.getElementById('image-lightbox-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'image-lightbox-overlay' || e.target.id === 'lightbox-content') {
        _closeImageLightbox();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        _closeImageLightbox();
        if (isRecording) {
          _stopRecording(true);
          if (typeof showToast === 'function') showToast('🗑️ Voice note cancelled');
        }
      }
      if (e.key === 'Enter' && isRecording) {
        e.preventDefault();
        e.stopPropagation();
        _sendVoiceRecording();
      }
    });

    // Delegate clicks on chat images to open in Lightbox
    document.getElementById('messages-area')?.addEventListener('click', (e) => {
      const mediaImg = e.target.closest('.msg-media-img');
      if (mediaImg) {
        e.stopPropagation();
        const src = mediaImg.src || mediaImg.getAttribute('src');
        if (src) _openImageLightbox(src);
      }
    });

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.remove('chat-open');
        document.body.classList.remove('keyboard-visible');
        document.getElementById('app-screen')?.classList.remove('chat-open');
        document.documentElement.style.removeProperty('--app-height');
        document.documentElement.style.removeProperty('--app-top');
        activeConvId = null;
        document.getElementById('message-input')?.blur();
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        _renderChatList();
      });
    }

    // Universal Mobile Viewport & Virtual Keyboard Handler (iOS, Android, Tablets, Desktop)
    let _lastVpHeight = 0;
    function syncMobileViewport() {
      if (!document.body.classList.contains('chat-open')) return;
      
      const vp = window.visualViewport;
      if (!vp) return;

      const h = Math.round(vp.height);
      const isKeyboard = (document.activeElement === msgInp) || 
                         (h < (window.screen.height - 120)) || 
                         (window.innerHeight < (window.screen.height - 120));

      document.body.classList.toggle('keyboard-visible', isKeyboard);
      document.documentElement.style.setProperty('--app-height', `${h}px`);

      // Keep window scroll pinned at 0 so iOS Safari never pushes the chat header & messages off-screen
      if (window.scrollY !== 0 || window.pageYOffset !== 0) {
        window.scrollTo(0, 0);
      }
      if (document.body.scrollTop !== 0) document.body.scrollTop = 0;
      if (document.documentElement.scrollTop !== 0) document.documentElement.scrollTop = 0;

      // Only scroll to bottom when viewport size actually changes (keyboard opens/closes)
      if (Math.abs(h - _lastVpHeight) > 25) {
        _lastVpHeight = h;
        _scrollToBottom(false);
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncMobileViewport);
    }
    window.addEventListener('scroll', () => {
      if (document.body.classList.contains('chat-open')) {
        if (window.scrollY !== 0 || window.pageYOffset !== 0) {
          window.scrollTo(0, 0);
        }
      }
    }, { passive: true });

    const msgInp = document.getElementById('message-input');
    if (msgInp) {
      msgInp.addEventListener('focus', () => {
        document.body.classList.add('keyboard-visible');
        syncMobileViewport();
      });
      msgInp.addEventListener('blur', () => {
        setTimeout(() => {
          document.body.classList.remove('keyboard-visible');
          document.documentElement.style.removeProperty('--app-height');
          syncMobileViewport();
        }, 120);
      });
    }
  }

  function _initials(name) {
    return (name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  function _now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function _esc(t) {
    const d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
  }

  return {
    init,
    openChat,
    openNewChat: () => document.getElementById('new-chat-overlay')?.classList.remove('hidden'),
    removeFriend: () => {
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;
      if (conv.isAI) {
        showToast('✨ BUDDY AI cannot be removed');
        return;
      }
      const displayName = conv.nickname || conv.name || conv.username || 'this user';
      if (!confirm('Remove ' + displayName + ' from your chats?\n\nYou can add them back anytime by searching ' + (conv.username || '') + '.')) {
        return;
      }
      const peerId = conv.userId || (conv.peer ? conv.peer.id : '');
      localStorage.setItem('buddy_removed_conv_' + conv.id + '_' + currentUser.id, 'true');
      if (peerId) {
        localStorage.setItem('buddy_removed_peer_' + peerId + '_' + currentUser.id, 'true');
      }
      conversations = conversations.filter(c => c.id !== conv.id);
      document.getElementById('chat-info-overlay')?.classList.add('hidden');
      document.getElementById('chat-more-drop')?.classList.add('hidden');
      openChat('buddy_ai');
      _renderChatList();
      showToast('🗑️ ' + displayName + ' removed from chats');
    },
    clearChat: () => {
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;
      if (!confirm('Clear chat on this device only? (Your partner will still have the chat)')) return;
      const now = Date.now();
      localStorage.setItem('buddy_cleared_' + conv.id + '_' + currentUser.id, now.toString());
      conv.messages = [];
      _renderMessages(conv);
      _renderChatList();
      document.getElementById('chat-info-overlay')?.classList.add('hidden');
      document.getElementById('chat-more-drop')?.classList.add('hidden');
      showToast('🗑️ Chat cleared on this device only');
    },
    togglePin: () => {
      const conv = conversations.find(c => c.id === activeConvId);
      if (!conv) return;
      conv.pinned = !conv.pinned;
      document.getElementById('chat-pinned-tag')?.classList.toggle('hidden', !conv.pinned || conv.isAI);
      _renderChatList();
      showToast(conv.pinned ? '📌 Chat pinned to top!' : 'Chat unpinned');
    },
    getAllFriendsAndProfiles: async () => {
      const list = [];
      const seenIds = new Set();

      // 1. All existing active conversations
      (conversations || []).forEach(c => {
        seenIds.add(c.id);
        if (c.userId) seenIds.add(c.userId);
        list.push({
          id: c.id,
          userId: c.userId || null,
          name: c.nickname || c.name || c.username || (c.isAI ? 'BUDDY AI ✨' : 'Friend'),
          username: c.username || (c.isAI ? '@buddy_ai' : ''),
          avatar: c.avatar || null,
          color: c.color || '#6366F1',
          status: c.status || (c.isAI ? 'Always Online' : 'Active now'),
          isAI: !!c.isAI
        });
      });

      // 2. Fetch all registered profiles in the app from Supabase
      if (window.BuddySupabase && typeof window.BuddySupabase.searchProfiles === 'function') {
        try {
          const profiles = await window.BuddySupabase.searchProfiles('', currentUser?.id);
          if (Array.isArray(profiles)) {
            profiles.forEach(p => {
              if (currentUser && p.id === currentUser.id) return;
              if (!seenIds.has(p.id) && !seenIds.has('c_' + p.id)) {
                seenIds.add(p.id);
                list.push({
                  id: 'c_' + p.id,
                  userId: p.id,
                  full_name: p.full_name,
                  name: p.full_name || p.username || 'Friend',
                  username: p.username ? (p.username.startsWith('@') ? p.username : '@' + p.username) : '',
                  avatar: null,
                  color: p.avatar_color || '#6366F1',
                  status: p.status || 'Active now',
                  isAI: false,
                  rawUser: p
                });
              }
            });
          }
        } catch(e) {
          console.warn('[BUDDY] searchProfiles notice:', e);
        }
      }

      return list;
    },
    getFriendConversations: () => {
      return (conversations || []).map(c => ({
        id: c.id,
        name: c.nickname || c.name || c.username || (c.isAI ? 'BUDDY AI ✨' : 'Friend'),
        avatar: c.avatar || null,
        color: c.color || '#3b82f6',
        isAI: !!c.isAI,
        username: c.username || ''
      }));
    },
    sendQuizInviteToUser: async (target, quizId, creatorName) => {
      let conv = (conversations || []).find(c => c.id === target.id || (target.userId && c.userId === target.userId));

      if (!conv && target.rawUser) {
        try {
          await _startRealChatWithUser(target.rawUser);
          conv = (conversations || []).find(c => c.userId === target.rawUser.id || c.id === 'c_' + target.rawUser.id);
        } catch(e) {
          console.warn('Error starting chat for invite:', e);
        }
      }

      if (!conv) {
        conv = (conversations || []).find(c => c.id === target.id);
      }

      if (conv) {
        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?quiz=${encodeURIComponent(quizId)}`;
        const text = `🎮 Don't Block Me 💗\nHey! I created a 10-question friendship quiz about me! Can you score 100% or will you get blocked? 😜\n👉 Play here: ${link}`;

        const prevActive = activeConvId;
        activeConvId = conv.id;
        _sendDirectMessage(text, 'text');
        activeConvId = prevActive;
        return true;
      }
      return false;
    },
    sendQuizInvite: (convId, quizId, creatorName) => {
      const conv = (conversations || []).find(c => c.id === convId);
      if (!conv) return false;
      const baseUrl = window.location.origin + window.location.pathname;
      const link = `${baseUrl}?quiz=${encodeURIComponent(quizId)}`;
      const text = `🎮 Don't Block Me 💗\nHey! I made a 10-question friendship quiz about me! Can you score 100% or will you get blocked? 😜\n👉 Play here: ${link}`;

      const prevActive = activeConvId;
      activeConvId = conv.id;
      _sendDirectMessage(text, 'text');
      activeConvId = prevActive;
      return true;
    }
  };
})();

window.ChatManager = ChatManager;
