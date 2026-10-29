/**
 * BUDDY - supabase-config.js
 * Supabase client with Google Auth, Phone/Email verification,
 * Profiles searching, 1-to-1 Conversations management, and Realtime messaging.
 */

const BuddySupabase = (() => {
  const CONFIG = {
    USE_SUPABASE: true,
    SUPABASE_URL: 'https://wffhopjtylmaechroifj.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhvcGp0eWxtYWVjaHJvaWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NTY0MDYsImV4cCI6MjEwNzAzMjQwNn0.ZAfmbiuYOM2PKvmtoD90Az3cq3L3vlkYNmSG9LVkCiM'
  };

  let client = null;

  function init() {
    if (CONFIG.USE_SUPABASE && window.supabase) {
      try {
        client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        console.log('✅ [BUDDY] Supabase client initialized:', CONFIG.SUPABASE_URL);
      } catch (err) {
        console.error('❌ [BUDDY] Error initializing Supabase:', err);
      }
    }
    return client;
  }

  function getClient() {
    if (!client) init();
    return client;
  }

  /* ── 1. AUTHENTICATION (Google, Email, Phone OTP) ── */

  async function signInWithGoogle() {
    const c = getClient();
    if (!c) return { error: { message: 'Supabase client not initialized' } };
    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      return await c.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl }
      });
    } catch (err) {
      return { error: err };
    }
  }

  async function signInWithApple() {
    const c = getClient();
    if (!c) return { error: { message: 'Supabase client not initialized' } };
    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      return await c.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: redirectUrl }
      });
    } catch (err) {
      return { error: err };
    }
  }

  async function signUpWithEmail(email, password, metadata = {}) {
    const c = getClient();
    if (!c) return { error: { message: 'Supabase client not initialized' } };
    try {
      return await c.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
    } catch (err) {
      return { error: err };
    }
  }

  async function signInWithEmail(email, password) {
    const c = getClient();
    if (!c) return { error: { message: 'Supabase client not initialized' } };
    try {
      return await c.auth.signInWithPassword({ email, password });
    } catch (err) {
      return { error: err };
    }
  }

  async function sendPhoneOtp(phone) {
    const c = getClient();
    if (!c) return { error: { message: 'Supabase client not initialized' } };
    try {
      return await c.auth.signInWithOtp({ phone });
    } catch (err) {
      return { error: err };
    }
  }

  async function sendEmailOtp(email) {
    const c = getClient();
    if (!c) return { error: { message: 'Supabase client not initialized' } };
    try {
      return await c.auth.signInWithOtp({ email });
    } catch (err) {
      return { error: err };
    }
  }

  async function verifyOtp(identifier, token, type = 'email') {
    const c = getClient();
    if (!c) return { error: { message: 'Supabase client not initialized' } };
    try {
      if (type === 'sms' || type === 'phone') {
        return await c.auth.verifyOtp({ phone: identifier, token, type: 'sms' });
      } else {
        return await c.auth.verifyOtp({ email: identifier, token, type: 'email' });
      }
    } catch (err) {
      return { error: err };
    }
  }

  async function signOut() {
    const c = getClient();
    if (!c) return;
    try { await c.auth.signOut(); } catch(e) {}
  }

  async function getSession() {
    const c = getClient();
    if (!c) return null;
    try {
      const { data } = await c.auth.getSession();
      return data.session;
    } catch (e) {
      return null;
    }
  }

  /* ── 2. PROFILES & REAL USER SEARCH ── */

  async function upsertProfile(profile) {
    const c = getClient();
    if (!c) return null;
    try {
      const { data, error } = await c
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })
        .select()
        .single();
      if (error) console.warn('[BUDDY] upsertProfile error:', error.message);
      return data;
    } catch (err) {
      return null;
    }
  }

        async function searchProfiles(query, excludeUserId) {
    const c = getClient();
    if (!c) return [];
    try {
      const clean = (query || '').replace(/^@/, '').trim().toLowerCase();

      // Fetch all registered profiles
      const { data, error } = await c
        .from('profiles')
        .select('id, username, full_name, avatar_color, bio, status, mood')
        .limit(50);

      if (error || !data) {
        console.warn('[BUDDY Supabase] searchProfiles notice:', error ? error.message : 'no data');
        return [];
      }

      let results = data;

      if (clean) {
        // When searching, match any username or name containing the query
        results = results.filter(p => {
          const u = (p.username || '').toLowerCase();
          const fn = (p.full_name || '').toLowerCase();
          return u.includes(clean) || fn.includes(clean);
        });
      } else if (excludeUserId) {
        // When not searching, show others
        results = results.filter(p => p.id !== excludeUserId);
      }

      return results;
    } catch (err) {
      console.warn('[BUDDY Supabase] searchProfiles exception:', err);
      return [];
    }
  }

  /* ── 3. 1-TO-1 CONVERSATIONS ── */

  // Find existing conversation between two users or create a new one
  async function getOrCreateConversation(myId, peerId) {
    const c = getClient();
    if (!c || !myId || !peerId) return null;
    try {
      // 1. Find all conversations for myId
      const { data: myMembers, error: mErr } = await c
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', myId);

      if (mErr) console.warn('[BUDDY] getOrCreateConversation error:', mErr.message);

      const convIds = (myMembers || []).map(m => m.conversation_id);
      if (convIds.length > 0) {
        // Find if peerId is in any of these conversations
        const { data: matches } = await c
          .from('conversation_members')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('user_id', peerId)
          .limit(1);

        if (matches && matches.length > 0) {
          return matches[0].conversation_id;
        }
      }

      // 2. If no existing conversation, create a new row in conversations
      const { data: newConv, error: cErr } = await c
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (cErr || !newConv) {
        console.error('[BUDDY] Failed to create conversation:', cErr);
        return null;
      }

      // 3. Add both users as members of this conversation
      await c.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: myId },
        { conversation_id: newConv.id, user_id: peerId }
      ]);

      return newConv.id;
    } catch (err) {
      console.error('[BUDDY] getOrCreateConversation exception:', err);
      return null;
    }
  }

  // Load all real conversations for a given user from Supabase
  async function loadUserConversations(userId) {
    const c = getClient();
    if (!c || !userId) return [];
    try {
      const { data: myMembers, error: mErr } = await c
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      if (mErr || !myMembers) return [];

      const convIds = myMembers.map(m => m.conversation_id);
      if (convIds.length === 0) return [];

      const results = [];
      for (const cid of convIds) {
        // Find the OTHER member in this conversation
        const { data: peerMembers } = await c
          .from('conversation_members')
          .select('user_id, nickname')
          .eq('conversation_id', cid)
          .neq('user_id', userId)
          .limit(1);

        if (!peerMembers || peerMembers.length === 0) continue;
        const peerMember = peerMembers[0];

        // Fetch peer profile
        const { data: peerProfile } = await c
          .from('profiles')
          .select('*')
          .eq('id', peerMember.user_id)
          .single();

        if (!peerProfile) continue;

        // Fetch last message
        const { data: lastMsgs } = await c
          .from('messages')
          .select('*')
          .eq('conversation_id', cid)
          .neq('body', '[cleared]')
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMsg = lastMsgs && lastMsgs.length > 0 ? lastMsgs[0] : null;

        // Fetch exact unread count (messages sent by peer where seen = false)
        let unreadCount = 0;
        try {
          const { count } = await c
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', cid)
            .neq('sender_id', userId)
            .eq('seen', false)
            .neq('body', '[cleared]');
          unreadCount = count || 0;
        } catch(e) {}

        results.push({
          conversation_id: cid,
          peer: peerProfile,
          nickname: peerMember.nickname || '',
          lastMsg: lastMsg,
          unreadCount: unreadCount
        });
      }

      return results;
    } catch (err) {
      console.error('[BUDDY] loadUserConversations exception:', err);
      return [];
    }
  }

  /* ── 4. MESSAGES & REALTIME ── */

    async function fetchMessages(conversationId) {
    const c = getClient();
    if (!c || !conversationId) return [];
    try {
      const { data, error } = await c
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .neq('body', '[cleared]')
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('[BUDDY] fetchMessages error:', error.message);
        return [];
      }
      return (data || []).filter(m => m.body !== '[cleared]');
    } catch (err) {
      return [];
    }
  }

  async function insertMessage(msg) {
    const c = getClient();
    if (!c) return null;
    try {
      const { data, error } = await c
        .from('messages')
        .insert(msg)
        .select()
        .single();
      if (error) {
        console.error('[BUDDY] insertMessage error:', error.message, error.details);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[BUDDY] insertMessage exception:', err);
      return null;
    }
  }

    function subscribeToAllMessages(onNewMessage) {
    const c = getClient();
    if (!c) return null;
    try {
      const channel = c
        .channel('buddy-global-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          payload => {
            if (onNewMessage && payload.new) onNewMessage(payload.new);
          }
        )
        .subscribe();
      return channel;
    } catch (err) {
      console.warn('[BUDDY Realtime] subscribeToAllMessages error:', err);
      return null;
    }
  }

  function subscribeToMessages(conversationId, onMessage, onUpdate) {
    const c = getClient();
    if (!c || !conversationId) return null;
    try {
      const channel = c
        .channel('chat-' + conversationId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: 'conversation_id=eq.' + conversationId
          },
          payload => {
            if (onMessage && payload.new) onMessage(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: 'conversation_id=eq.' + conversationId
          },
          payload => {
            if (onUpdate && payload.new) onUpdate(payload.new);
          }
        )
        .subscribe();
      return channel;
    } catch (err) {
      return null;
    }
  }

    // Presence state tracking
  let presenceChannel = null;
  let onlineUserIds = new Set();

  function trackPresence(user, onSync) {
    const c = getClient();
    if (!c || !user || !user.id) return null;
    try {
      if (presenceChannel) {
        try { presenceChannel.unsubscribe(); } catch(e) {}
      }
      presenceChannel = c.channel('buddy-presence', {
        config: { presence: { key: user.id } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          onlineUserIds = new Set(Object.keys(state));
          if (onSync) onSync(Array.from(onlineUserIds));
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          onlineUserIds.add(key);
          if (onSync) onSync(Array.from(onlineUserIds));
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          onlineUserIds.delete(key);
          if (onSync) onSync(Array.from(onlineUserIds));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              username: user.username,
              online_at: new Date().toISOString()
            });
          }
        });
      return presenceChannel;
    } catch(err) {
      console.warn('[BUDDY Presence] error:', err);
      return null;
    }
  }

  function isUserOnline(userId) {
    if (!userId) return false;
    return onlineUserIds.has(userId);
  }

  function getOnlineUserIds() {
    return Array.from(onlineUserIds);
  }

    async function deleteConversationMessages(conversationId) {
    const c = getClient();
    if (!c || !conversationId) return false;
    try {
      // 1. Try physical delete
      try {
        await c.from('messages').delete().eq('conversation_id', conversationId);
      } catch(e) {}

      // 2. Mark rows as [cleared] in database (always succeeds with UPDATE policy)
      const { error } = await c
        .from('messages')
        .update({ body: '[cleared]', media_url: null, duration: null })
        .eq('conversation_id', conversationId);

      if (error) {
        console.warn('[BUDDY] deleteMessages notice:', error.message);
      }
      return true;
    } catch (err) {
      console.error('[BUDDY] deleteMessages exception:', err);
      return false;
    }
  }

  async function markConversationMessagesAsSeen(conversationId, recipientUserId) {
    const c = getClient();
    if (!c || !conversationId) return false;
    try {
      const { error } = await c
        .from('messages')
        .update({ seen: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', recipientUserId)
        .eq('seen', false);
      if (error) {
        console.warn('[BUDDY] markSeen error:', error.message);
        return false;
      }
      return true;
    } catch(err) {
      console.warn('[BUDDY] markSeen exception:', err);
      return false;
    }
  }

  // ── Call Signaling Realtime Broadcast ──
  let callSignalChannel = null;

  function subscribeToCallSignals(onSignal) {
    const c = getClient();
    if (!c) return null;
    try {
      if (callSignalChannel) {
        try { callSignalChannel.unsubscribe(); } catch(e) {}
      }
      callSignalChannel = c.channel('buddy-global-call-signaling', {
        config: { broadcast: { self: false } }
      });

      callSignalChannel
        .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
          if (onSignal && payload) {
            console.log('[Supabase Realtime] Received call-signal broadcast:', payload.action);
            onSignal(payload);
          }
        })
        .subscribe((status) => {
          console.log('[Supabase Realtime] Call signaling channel status:', status);
        });

      return callSignalChannel;
    } catch(err) {
      console.warn('[Supabase Realtime] subscribeToCallSignals error:', err);
      return null;
    }
  }

  function sendCallSignal(payload) {
    const c = getClient();
    if (!c) return false;
    try {
      if (!callSignalChannel || callSignalChannel.state !== 'joined') {
        callSignalChannel = c.channel('buddy-global-call-signaling', {
          config: { broadcast: { self: false } }
        });
        callSignalChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            callSignalChannel.send({
              type: 'broadcast',
              event: 'call-signal',
              payload
            });
          }
        });
      } else {
        callSignalChannel.send({
          type: 'broadcast',
          event: 'call-signal',
          payload
        });
      }
      return true;
    } catch(err) {
      console.warn('[Supabase Realtime] sendCallSignal error:', err);
      return false;
    }
  }


  return {
    CONFIG,
    init,
    getClient,
    signInWithGoogle,
    signInWithApple,
    signUpWithEmail,
    signInWithEmail,
    sendPhoneOtp,
    sendEmailOtp,
    verifyOtp,
    signOut,
    getSession,
    upsertProfile,
    searchProfiles,
    getOrCreateConversation,
    loadUserConversations,
    fetchMessages,
        insertMessage,
    subscribeToMessages,
    subscribeToCallSignals,
    sendCallSignal,
    subscribeToAllMessages,
    deleteConversationMessages,
    markConversationMessagesAsSeen,
    trackPresence,
    isUserOnline,
    getOnlineUserIds
  };
})();

window.BuddySupabase = BuddySupabase;
BuddySupabase.init();
