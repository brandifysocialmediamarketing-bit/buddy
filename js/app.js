/**
 * BUDDY - app.js
 * Application master controller & delegated interaction handler
 */

/* ── Global State ── */
window.AppState = { currentUser: null };

/* ── Global Toast Utility ── */
let _toastTimer = null;
window.showToast = showToast;
function showToast(msg, ms = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

/* ── Delegated Global UI Click Handlers ── */
document.addEventListener('click', (e) => {
  // CHAT LIST ITEM CLICK (Guarantees chat always opens on click)
  const chatItem = e.target.closest('.chat-item, .chat-list-item');
  if (chatItem && chatItem.dataset.id) {
    if (window.ChatManager && window.ChatManager.openChat) {
      window.ChatManager.openChat(chatItem.dataset.id);
    }
  }

  // BACK BUTTON (Returns to sidebar list on mobile screens)
  if (e.target.closest('#back-btn')) {
    document.getElementById('empty-state')?.classList.remove('hidden');
    document.getElementById('active-chat')?.classList.add('hidden');
    document.getElementById('app-screen')?.classList.remove('chat-open');
    document.body.classList.remove('chat-open');
  }

  // 3-DOTS MORE BUTTON CLICK (Toggle Dropdown)
  if (e.target.closest('#chat-more-btn')) {
    const drop = document.getElementById('chat-more-drop');
    if (drop) drop.classList.toggle('hidden');
  }

  // CLOSE MORE DROPDOWN ON OUTSIDE CLICK
  if (!e.target.closest('#chat-more-drop') && !e.target.closest('#chat-more-btn')) {
    document.getElementById('chat-more-drop')?.classList.add('hidden');
  }

  // CLEAR CHAT TRIGGER (Handles both 3-dots dropdown & info modal)
  if (e.target.closest('#clear-chat-item') || e.target.closest('#modal-clear-chat-btn')) {
    e.stopPropagation();
    document.getElementById('chat-more-drop')?.classList.add('hidden');
    document.getElementById('chat-info-overlay')?.classList.add('hidden');
    if (window.ChatManager && window.ChatManager.clearChat) {
      window.ChatManager.clearChat();
    }
  }

  // REMOVE FRIEND TRIGGER (Handles both 3-dots dropdown & info modal)
  if (e.target.closest('#remove-friend-item') || e.target.closest('#modal-remove-friend-btn')) {
    e.stopPropagation();
    document.getElementById('chat-more-drop')?.classList.add('hidden');
    document.getElementById('chat-info-overlay')?.classList.add('hidden');
    if (window.ChatManager && window.ChatManager.removeFriend) {
      window.ChatManager.removeFriend();
    }
  }

  // VIEW DETAILS FROM 3-DOTS MENU
  if (e.target.closest('#view-profile-item')) {
    document.getElementById('chat-more-drop')?.classList.add('hidden');
    const overlay = document.getElementById('chat-info-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  // TOGGLE PIN FROM 3-DOTS MENU
  if (e.target.closest('#toggle-pin-item')) {
    document.getElementById('chat-more-drop')?.classList.add('hidden');
    if (window.ChatManager && window.ChatManager.togglePin) {
      window.ChatManager.togglePin();
    }
  }

  // 1. NEW CHAT BUTTON (+) OR EMPTY START CHAT BUTTON
  if (e.target.closest('#new-chat-btn') || e.target.closest('#empty-start-chat-btn')) {
    if (window.ChatManager && window.ChatManager.openNewChat) {
      window.ChatManager.openNewChat();
    } else {
      const overlay = document.getElementById('new-chat-overlay');
      if (overlay) overlay.classList.remove('hidden');
    }
  }

  // CLOSE NEW CHAT
  if (e.target.closest('#close-new-chat-btn')) {
    const overlay = document.getElementById('new-chat-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // 2. PROFILE BUTTON
  if (e.target.closest('#profile-open-btn')) {
    const overlay = document.getElementById('profile-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  // CLOSE PROFILE
  if (e.target.closest('#close-profile-btn')) {
    const overlay = document.getElementById('profile-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // 3. LOGOUT BUTTON (Handled primarily by chat.js & AuthManager)
  if (e.target.closest('#logout-btn')) {
    // If not already handled, trigger logout directly
    if (window.AuthManager && typeof window.AuthManager.logout === 'function') {
      window.AuthManager.logout();
    }
  }

  // 4. THEME TOGGLE BUTTONS (Header Moon/Sun or Profile Theme pill)
  if (e.target.closest('#theme-toggle-btn') || e.target.closest('#profile-theme-btn')) {
    if (window.ThemeManager) {
      const next = window.ThemeManager.toggle();
      showToast(next === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
    }
  }

  // 5. CHAT ACCENT COLOR BUTTONS
  const accentDot = e.target.closest('.accent-dot');
  if (accentDot) {
    const accent = accentDot.dataset.accent;
    if (accent && window.ThemeManager) {
      window.ThemeManager.setAccent(accent);
      document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
      accentDot.classList.add('active');
      showToast('💖 Romantic accent theme updated!');
    }
  }

  // 6. AVATAR PRESET SWATCHES
  const swatch = e.target.closest('#avatar-presets .avatar-swatch');
  if (swatch) {
    document.querySelectorAll('#avatar-presets .avatar-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    const bigAv = document.getElementById('profile-big-avatar');
    if (bigAv) bigAv.style.background = swatch.style.background;
  }

  // 7. MOOD CHIPS
  const moodChip = e.target.closest('#mood-chips .mood-chip');
  if (moodChip) {
    document.querySelectorAll('#mood-chips .mood-chip').forEach(c => c.classList.remove('active'));
    moodChip.classList.add('active');
  }

  // 8. CONVERSATION DETAILS (INFO) MODAL
  if (e.target.closest('#chat-info-btn') || e.target.closest('#chat-peer-info-click')) {
    const overlay = document.getElementById('chat-info-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }
  if (e.target.closest('#close-info-btn')) {
    const overlay = document.getElementById('chat-info-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // 10. EMOJI TOGGLE BUTTON
  if (e.target.closest('#emoji-toggle-btn')) {
    const popover = document.getElementById('emoji-picker-popover');
    const btn = document.getElementById('emoji-toggle-btn');
    if (popover) {
      const isHidden = popover.classList.contains('hidden');
      if (isHidden) {
        popover.classList.remove('hidden');
        btn?.classList.add('is-open');
        if (window.ChatManager && window.ChatManager.renderEmojiGrid) {
          window.ChatManager.renderEmojiGrid('love');
        }
      } else {
        popover.classList.add('hidden');
        btn?.classList.remove('is-open');
      }
    }
  }

  // CLOSE EMOJI POPOVER ON OUTSIDE CLICK
  if (!e.target.closest('#emoji-picker-popover') && !e.target.closest('#emoji-toggle-btn')) {
    const popover = document.getElementById('emoji-picker-popover');
    if (popover && !popover.classList.contains('hidden')) {
      popover.classList.add('hidden');
      document.getElementById('emoji-toggle-btn')?.classList.remove('is-open');
    }
  }

  // 9. CALL HANGUP
  if (e.target.closest('#call-hangup-btn')) {
    const modal = document.getElementById('call-overlay');
    if (modal) modal.classList.add('hidden');
  }
});

/* ── Custom Color Picker Live Input & Change Handler (Mobile + Desktop) ── */
function _handleCustomColorPick(e) {
  if (e.target && (e.target.id === 'profile-custom-color' || e.target.id === 'chat-custom-color')) {
    const hex = e.target.value;
    if (window.ThemeManager) {
      window.ThemeManager.setCustomColor(hex);
      document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
    }
    const otherId = e.target.id === 'profile-custom-color' ? 'chat-custom-color' : 'profile-custom-color';
    const otherEl = document.getElementById(otherId);
    if (otherEl) otherEl.value = hex;
  }
}
document.addEventListener('input', _handleCustomColorPick);
document.addEventListener('change', _handleCustomColorPick);

/* ── Boot Initializer ── */
(function boot() {
  // Initialize Auth (which validates session and boots ChatManager once)
  if (window.AuthManager) {
    window.AuthManager.init();
  }
})();
