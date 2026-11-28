/**
 * BUDDY Universal Auto-Adaptive Layout Engine
 * Guarantees 100% fluid, responsive, cross-device layout adaptation across:
 * - Mobile Phones (iPhone, Android, Samsung, Pixel)
 * - Tablets & iPads (Portrait & Landscape)
 * - Foldables (Samsung Galaxy Z Fold cover/inner screens)
 * - Laptops, Desktops, & Ultra-wide displays
 * - Dynamic Virtual Keyboards & Safe Area Insets
 */

(function () {
  'use strict';

  const docEl = document.documentElement;

  function updateMetrics() {
    try {
      const vv = window.visualViewport;
      const innerW = window.innerWidth;
      const innerH = window.innerHeight;

      // Real visible viewport height & width
      const vh = vv ? vv.height : innerH;
      const vw = vv ? vv.width : innerW;

      // Virtual keyboard height detection
      const keyboardH = Math.max(0, innerH - vh);
      const isKeyboardOpen = keyboardH > 100;

      // Update CSS variables on document root
      docEl.style.setProperty('--app-vh', `${Math.round(vh)}px`);
      docEl.style.setProperty('--app-vw', `${Math.round(vw)}px`);
      docEl.style.setProperty('--app-height', `${Math.round(vh)}px`);
      docEl.style.setProperty('--keyboard-height', `${Math.round(keyboardH)}px`);

      // Device categorization
      let device = 'desktop';
      if (vw <= 360) {
        device = 'fold-narrow'; // Ultra-narrow fold cover screen
      } else if (vw <= 768) {
        device = 'mobile';
      } else if (vw <= 1024) {
        device = 'tablet';
      } else {
        device = 'desktop';
      }

      const orientation = vw > vh ? 'landscape' : 'portrait';
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      const isAndroid = /Android/i.test(navigator.userAgent || '');

      // Set dataset attributes for targetable CSS
      docEl.dataset.device = device;
      docEl.dataset.orientation = orientation;
      docEl.dataset.keyboard = isKeyboardOpen ? 'open' : 'closed';
      docEl.dataset.touch = isTouch ? 'true' : 'false';
      docEl.dataset.os = isIos ? 'ios' : (isAndroid ? 'android' : 'desktop');

      // Auto-scroll chat to bottom if keyboard just popped open
      if (isKeyboardOpen && docEl.classList.contains('chat-open')) {
        const msgs = document.getElementById('messages-area');
        if (msgs) {
          setTimeout(() => {
            msgs.scrollTop = msgs.scrollHeight;
          }, 60);
        }
      }
    } catch (err) {
      console.warn('[AdaptiveEngine] updateMetrics error:', err);
    }
  }

  // Initial immediate run
  updateMetrics();

  // Listeners for all viewport change sources
  window.addEventListener('resize', updateMetrics, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(updateMetrics, 100);
    setTimeout(updateMetrics, 350);
  }, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateMetrics, { passive: true });
    window.visualViewport.addEventListener('scroll', updateMetrics, { passive: true });
  }

  // Double check on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateMetrics);
  } else {
    setTimeout(updateMetrics, 0);
  }

  // Expose global controller
  window.BuddyAdaptive = {
    recompute: updateMetrics,
    getDevice: () => docEl.dataset.device || 'desktop',
    getOrientation: () => docEl.dataset.orientation || 'portrait',
    isKeyboardOpen: () => docEl.dataset.keyboard === 'open',
    isTouch: () => docEl.dataset.touch === 'true'
  };
})();
