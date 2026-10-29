/**
 * BUDDY – auth.js
 * Verified Authentication: Google Sign-In, Email/Phone OTP Verification,
 * and Supabase Profiles Sync.
 */

const AuthManager = (() => {
  let pendingAuth = {
    type: 'email', // 'email' or 'phone'
    identifier: '',
    name: '',
    username: ''
  };

  function init() {
    _bindAuthNav();
    _bindMethodTabs();
    _bindForms();
    _bindAppleAuth();
    _bindGoogleAuth();
    _bindPasswordToggles();
    _checkExistingSession();
  }

  /* ── 1. SESSION CHECK ── */
  async function _checkExistingSession() {
    if (window.BuddySupabase) {
      const session = await BuddySupabase.getSession();
      if (session && session.user) {
        const meta = session.user.user_metadata || {};
        const email = session.user.email || session.user.phone || '';
        const name = meta.full_name || meta.name || _nameFromEmail(email) || 'Buddy User';
        const rawUsername = meta.username || meta.preferred_username || (email ? email.split('@')[0] : 'user_' + session.user.id.slice(0, 5));
        const username = rawUsername.startsWith('@') ? rawUsername : '@' + rawUsername;

        const u = {
          id: session.user.id,
          name: name,
          username: username,
          email: email,
          color: '#6366F1'
        };
        // Ensure profile is in Supabase profiles table
        BuddySupabase.upsertProfile({
          id: u.id,
          username: u.username,
          full_name: u.name,
          avatar_color: u.color
        });
        _enterApp(u, true);
        return;
      }
    }

    // Check local storage session (only if real user, skip old demo u1)
    let hasSession = false;
    try {
      const saved = localStorage.getItem('buddy-session');
      if (saved) {
        const user = JSON.parse(saved);
        if (user && user.id && user.id !== 'u1') {
          _enterApp(user, false);
          hasSession = true;
        }
      }
    } catch(e) {}

    if (!hasSession) {
      _showAuthScreen();
    }
  }

  /* ── 2. APPLE & GOOGLE SOCIAL AUTH ── */
  function _bindAppleAuth() {
    const btns = [document.getElementById('apple-login-btn'), document.getElementById('apple-signup-btn')];
    btns.forEach(btn => {
      if (!btn) return;
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        const origContent = btn.innerHTML;
        btn.innerHTML = '<span>Connecting to Apple ID... 🍏</span>';

        try {
          if (!window.BuddySupabase || !window.BuddySupabase.signInWithApple) {
            throw new Error('Supabase client not ready');
          }
          const { data, error } = await window.BuddySupabase.signInWithApple();
          if (error) {
            console.warn('[Apple Auth] Notice:', error);
            const msg = error.message || '';
            if (msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('unsupported provider')) {
              showToast('⚠️ Supabase me Apple Provider ON nahi hai. Supabase Dashboard (Auth > Providers > Apple) me ON karein, ya Email/Password se Login karein!', 6500);
            } else {
              showToast('⚠️ Apple Sign-In: ' + msg, 5000);
            }
            btn.disabled = false;
            btn.innerHTML = origContent;
          }
        } catch (err) {
          console.error('[Apple Auth] error:', err);
          showToast('⚠️ Apple Sign-In: ' + err.message, 4500);
          btn.disabled = false;
          btn.innerHTML = origContent;
        }
      });
    });
  }

  function _bindGoogleAuth() {
    const btns = [document.getElementById('google-login-btn'), document.getElementById('google-signup-btn')];
    btns.forEach(btn => {
      if (!btn) return;
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        const origContent = btn.innerHTML;
        btn.innerHTML = '<span>Connecting to Google... ⏳</span>';

        try {
          if (!window.BuddySupabase || !window.BuddySupabase.signInWithGoogle) {
            throw new Error('Supabase client not ready');
          }
          const { data, error } = await window.BuddySupabase.signInWithGoogle();
          if (error) {
            console.warn('[Google Auth] Notice:', error);
            const msg = error.message || '';
            if (msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('unsupported provider')) {
              showToast('⚠️ Supabase me Google Provider ON nahi hai. Supabase Dashboard (Auth > Providers > Google) me ON karein, ya Email/Password se Login karein!', 6500);
            } else {
              showToast('⚠️ Google Sign-In: ' + msg, 5000);
            }
            btn.disabled = false;
            btn.innerHTML = origContent;
          }
        } catch (err) {
          console.error('[Google Auth] error:', err);
          showToast('⚠️ Google Sign-In: ' + err.message, 4500);
          btn.disabled = false;
          btn.innerHTML = origContent;
        }
      });
    });
  }

  /* ── 3. METHOD TABS (Email vs Phone) ── */
  function _bindMethodTabs() {
    const emailTab = document.getElementById('tab-email-btn');
    const phoneTab = document.getElementById('tab-phone-btn');
    const emailForm = document.getElementById('login-form');
    const phoneForm = document.getElementById('phone-login-form');

    if (emailTab && phoneTab) {
      emailTab.addEventListener('click', () => {
        emailTab.classList.add('active');
        phoneTab.classList.remove('active');
        if (emailForm) emailForm.classList.remove('hidden');
        if (phoneForm) phoneForm.classList.add('hidden');
      });
      phoneTab.addEventListener('click', () => {
        phoneTab.classList.add('active');
        emailTab.classList.remove('active');
        if (emailForm) emailForm.classList.add('hidden');
        if (phoneForm) phoneForm.classList.remove('hidden');
      });
    }
  }

  /* ── 4. NAVIGATION BETWEEN SCREENS ── */
  function _bindAuthNav() {
    const goSignupBtn = document.getElementById('go-signup-btn');
    const goLoginBtn = document.getElementById('go-login-btn');
    const forgotBtn = document.getElementById('forgot-btn');
    const backLoginBtn = document.getElementById('back-login-btn');
    const otpBackBtn = document.getElementById('otp-back-btn');

    if (goSignupBtn) goSignupBtn.addEventListener('click', () => _showView('signup'));
    if (goLoginBtn) goLoginBtn.addEventListener('click', () => _showView('login'));
    if (forgotBtn) forgotBtn.addEventListener('click', () => _showView('forgot'));
    if (backLoginBtn) backLoginBtn.addEventListener('click', () => _showView('login'));
    if (otpBackBtn) otpBackBtn.addEventListener('click', () => _showView('login'));
  }

  function _showView(name) {
    ['login', 'signup', 'otp', 'forgot'].forEach(v => {
      const el = document.getElementById(v + '-view');
      if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(name + '-view');
    if (target) target.classList.remove('hidden');
  }

  /* ── 5. FORM SUBMISSIONS ── */
  function _bindForms() {
    // Email Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', e => {
        e.preventDefault();
        _handleEmailLogin();
      });
    }

    // Phone Login
    const phoneForm = document.getElementById('phone-login-form');
    if (phoneForm) {
      phoneForm.addEventListener('submit', e => {
        e.preventDefault();
        _handlePhoneLogin();
      });
    }

    // Sign Up Form (Verified registration)
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', e => {
        e.preventDefault();
        _handleSignup();
      });
    }

    // OTP Verification Form
    const otpForm = document.getElementById('otp-form');
    if (otpForm) {
      otpForm.addEventListener('submit', e => {
        e.preventDefault();
        _handleOtpVerification();
      });
    }

    // Forgot Password Form
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', e => {
        e.preventDefault();
        _handleForgot();
      });
    }
  }

  /* ── Email Login Handler ── */
  async function _handleEmailLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showToast('⚠️ Please enter your email and password.');
      return;
    }

    showToast('🔄 Signing in...');
    const res = await BuddySupabase.signInWithEmail(email, password);

    if (res && res.data && res.data.user) {
      const suUser = res.data.user;
      const u = {
        id: suUser.id,
        name: suUser.user_metadata?.full_name || _nameFromEmail(email),
        username: suUser.user_metadata?.username || '@' + email.split('@')[0],
        email: suUser.email,
        color: '#6366F1'
      };
      // Upsert profile in Supabase
      await BuddySupabase.upsertProfile({
        id: u.id,
        username: u.username,
        full_name: u.name,
        avatar_color: u.color
      });
      _enterApp(u, true);
      showToast('👋 Welcome back, ' + u.name + '!');
      return;
    }

    if (res && res.error) {
      if (res.error.message.includes('Email not confirmed') || res.error.message.includes('email_not_confirmed')) {
        showToast('📧 Kripya apne Email inbox me jakar confirmation link dabayein ya Supabase me Confirm Email OFF karein!', 6000);
      } else {
        showToast('❌ ' + res.error.message);
      }
    }
  }

  /* ── Phone Login Handler ── */
  async function _handlePhoneLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    if (!phone) {
      showToast('⚠️ Enter your mobile number with country code (e.g. +91 9876543210)');
      return;
    }

    showToast('📲 Sending verification code...');
    const res = await BuddySupabase.sendPhoneOtp(phone);

    if (res && res.error) {
      showToast('❌ ' + res.error.message);
      return;
    }

    pendingAuth = { type: 'phone', identifier: phone, name: 'User', username: '@' + phone.slice(-4) };
    const label = document.getElementById('otp-target-label');
    if (label) label.textContent = 'Enter the 6-digit code sent to ' + phone;
    _showView('otp');
    showToast('📨 OTP sent! Please verify.');
  }

  /* ── Sign Up Handler (Verified) ── */
  async function _handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    let username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;

    if (!name || !username || !email || !password) {
      showToast('⚠️ Please fill in all fields.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showToast('⚠️ Kripya valid Email ID daalein (jaise yourname@gmail.com). Mobile number nahi.');
      return;
    }
    if (password.length < 6) {
      showToast('⚠️ Password must be at least 6 characters.');
      return;
    }

    if (!username.startsWith('@')) username = '@' + username;

    showToast('🔄 Creating verified account in Supabase...');

    const res = await BuddySupabase.signUpWithEmail(email, password, {
      full_name: name,
      username: username
    });

    if (res && res.error) {
      showToast('❌ ' + res.error.message);
      return;
    }

    if (res && res.data && res.data.user) {
      const u = {
        id: res.data.user.id,
        name,
        username,
        email,
        color: _randColor()
      };

      await BuddySupabase.upsertProfile({
        id: u.id,
        username: u.username,
        full_name: u.name,
        avatar_color: u.color
      });

      if (res.data.session) {
        _enterApp(u, true);
        showToast('🎉 Account created! Welcome to BUDDY!');
      } else {
        showToast('🎉 Account created! Kripya apne Email me verification link check karein.', 6000);
        setTimeout(() => _showView('login'), 2000);
      }
    }
  }

  /* ── OTP Verification Handler ── */
  async function _handleOtpVerification() {
    const code = document.getElementById('otp-code-input').value.trim();
    if (!code || code.length < 6) {
      showToast('⚠️ Enter the complete 6-digit code.');
      return;
    }

    showToast('🔄 Verifying code...');
    const res = await BuddySupabase.verifyOtp(pendingAuth.identifier, code, pendingAuth.type);

    if (res && res.data && res.data.user) {
      const u = {
        id: res.data.user.id,
        name: pendingAuth.name || _nameFromEmail(pendingAuth.identifier),
        username: pendingAuth.username || '@' + pendingAuth.identifier.split('@')[0],
        email: pendingAuth.identifier,
        color: _randColor()
      };
      // Upsert profile in Supabase
      await BuddySupabase.upsertProfile({
        id: u.id,
        username: u.username,
        full_name: u.name,
        avatar_color: u.color
      });
      _enterApp(u, true);
      showToast('✅ Account verified successfully! Welcome!');
    } else {
      showToast('❌ Invalid verification code. Please check and try again.');
    }
  }

  function _handleForgot() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { showToast('⚠️ Enter your email first.'); return; }
    BuddySupabase.sendEmailOtp(email);
    showToast('📧 Reset link sent! Check your inbox.');
    setTimeout(() => _showView('login'), 1500);
  }

  /* ── 6. ENTER APP ── */
  function _enterApp(user, save = false) {
    if (save) localStorage.setItem('buddy-session', JSON.stringify(user));

    window.AppState = window.AppState || {};
    AppState.currentUser = user;

    const initials = _initials(user.name);
    const el = document.getElementById('sidebar-user-initials');
    if (el) el.textContent = initials;

    _populateProfile(user);

    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    if (authScreen) {
      authScreen.classList.add('hidden');
      authScreen.style.setProperty('display', 'none', 'important');
    }
    if (appScreen) {
      appScreen.classList.remove('hidden');
      appScreen.style.removeProperty('display');
    }

    if (window.ChatManager) {
      window.ChatManager.init(user);
    }
  }

  function _populateProfile(user) {
    const initials = _initials(user.name);
    const bigAv = document.getElementById('profile-big-avatar');
    if (bigAv) { bigAv.textContent = initials; bigAv.style.background = 'var(--primary-grad)'; }

    const fn = document.getElementById('profile-full-name');
    if (fn) fn.textContent = user.name;

    const un = document.getElementById('profile-uname');
    if (un) un.textContent = user.username || '@user';

    const em = document.getElementById('profile-email-text');
    if (em) em.textContent = user.email || '';
  }

  function _showAuthScreen() {
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    if (authScreen) {
      authScreen.classList.remove('hidden');
      authScreen.style.removeProperty('display');
    }
    if (appScreen) {
      appScreen.classList.add('hidden');
      appScreen.style.setProperty('display', 'none', 'important');
    }
    // Reset view to Login tab
    const loginView = document.getElementById('view-login');
    const signupView = document.getElementById('view-signup');
    const otpView = document.getElementById('view-otp');
    const forgotView = document.getElementById('view-forgot');
    if (loginView) loginView.classList.remove('hidden');
    if (signupView) signupView.classList.add('hidden');
    if (otpView) otpView.classList.add('hidden');
    if (forgotView) forgotView.classList.add('hidden');
  }

  async function logout() {
    try {
      if (typeof window.showToast === 'function') {
        showToast('🔒 Logging out...', 1500);
      }

      // 1. Close profile overlay modal
      const profileOverlay = document.getElementById('profile-overlay');
      if (profileOverlay) profileOverlay.classList.add('hidden');

      // 2. Disconnect any active WebRTC calls
      if (window.WebRTCCall && typeof window.WebRTCCall.endCall === 'function') {
        try { window.WebRTCCall.endCall('User logged out'); } catch(e) {}
      }

      // 3. Supabase SignOut
      if (window.BuddySupabase) {
        try {
          await BuddySupabase.signOut();
        } catch(e) {
          console.warn('Supabase signOut notice:', e);
        }
      }

      // 4. Thoroughly purge all session & Supabase auth tokens from localStorage
      try {
        localStorage.removeItem('buddy-session');
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('sb-') || k.startsWith('supabase.') || k.includes('auth-token') || k === 'buddy-session')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch(e) {}

      // 5. Clear sessionStorage
      try {
        sessionStorage.clear();
      } catch(e) {}

      // 6. Reset global in-memory user state
      if (window.AppState) {
        AppState.currentUser = null;
      }

      // 7. Show Auth Screen immediately
      _showAuthScreen();

      // 8. Clean reload to root URL
      setTimeout(() => {
        window.location.replace(window.location.origin + window.location.pathname);
      }, 200);

    } catch (err) {
      console.error('Logout error:', err);
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch(e) {}
      window.location.replace(window.location.origin + window.location.pathname);
    }
  }

  function _bindPasswordToggles() {
    document.querySelectorAll('.eye-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.for);
        if (!inp) return;
        const showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        btn.querySelector('.eye-open').style.display  = showing ? '' : 'none';
        btn.querySelector('.eye-closed').style.display = showing ? 'none' : '';
      });
    });
  }

  function _initials(name) {
    return (name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  function _nameFromEmail(email) {
    return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim() || 'User';
  }

  function _randColor() {
    return ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'][Math.floor(Math.random() * 7)];
  }

  return { init, logout };
})();

window.AuthManager = AuthManager;
