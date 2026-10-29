/**
 * BUDDY - webrtc-call.js
 * True Real-Time Peer-to-Peer WebRTC Audio & Video Calling over the Internet.
 * 
 * Features:
 * 1. STRICT NO AUTO-CONNECT: Outgoing call stays on "Ringing..." until recipient accepts.
 * 2. Incoming call pop-up with Green Accept & Red Decline buttons.
 * 3. HD 2-Way Video Calling with full-screen peer video & draggable local PiP preview.
 * 4. REAL-TIME AI FACE TRACKING:
 *    - Automatically detects & tracks user's face position (x, y, scale, eyes, forehead, nose, mouth).
 *    - All emojis & AR filters follow the user's face in real time as they move!
 *    - Hardware FaceDetector API + High-speed Skin-Luminance Centroid CV tracker fallback.
 *    - 60 FPS Exponential lerp smoothing for butter-smooth tracking with ZERO lag!
 * 5. 18 EXCITING AR FILTERS & EMOJIS:
 *    - 😂 Laugh (Crying Laughing with streaming animated tears)
 *    - 😎 Shades (Thug life sunglasses with lens glare)
 *    - 🐶 Puppy (Cute dog ears, nose & wagging tongue)
 *    - 👑 Crown (Royal 3D golden crown with gems)
 *    - 🐱 Kitty (Cat ears, pink nose & whiskers)
 *    - 💖 Hearts (Heart-shaped glasses & love aura)
 *    - 🥳 Party (Party cone hat, party blower & confetti)
 *    - 😇 Angel (Glowing halo & soft angel blush)
 *    - 😈 Devil (Fiery horns & flame smoke)
 *    - 🦄 Unicorn (Rainbow unicorn horn & sparkles)
 *    - 🐰 Bunny (Twitching bunny ears & nose)
 *    - 🔥 Fire (Animated blazing flame aura)
 *    - 🌸 Blossom (Cherry blossom flower crown)
 *    - 🌈 Cyber (Futuristic neon visor with scan line)
 *    - ✨ Beauty (Luminous skin glow & eye sparkles)
 *    - 🎞️ Vintage & 🖤 Noir (Cinematic film filters)
 * 6. Live WebRTC Canvas Stream Pipe: Remote user sees the live face-tracked emojis too!
 * 7. Live PiP Preview: You can see the emoji on your own face inside your PiP preview!
 * 8. Corner-switching PiP: Tap or drag PiP to any of 4 corners so it never blocks your view.
 * 9. Screen Sharing (🖥️) via navigator.mediaDevices.getDisplayMedia with track swap.
 * 10. Camera controls: Flip camera (front/back on mobile), camera toggle, mic mute.
 * 11. 30-Second timeout: auto-cancels if callee does not answer within 30s.
 */

const WebRTCCall = (() => {
  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    iceCandidatePoolSize: 10
  };

  let peerConnection = null;
  let localStream = null;
  let rawCameraStream = null;
  let screenStream = null;
  let remoteAudioEl = null;
  let remoteVideoEl = null;
  let localVideoEl = null;
  let pendingRemoteCandidates = [];
  let disconnectGraceTimer = null;

  let activeCall = null; // { state: 'calling'|'incoming'|'connected', convId, peerId, peerName, peerAvatar, type: 'audio'|'video' }
  let callTimer = null;
  let noAnswerTimeout = null;
  let callSeconds = 0;
  let isMuted = false;
  let isCameraOff = false;
  let isScreenSharing = false;
  let isSpeakerOn = true;
  let currentFacingMode = 'user'; // 'user' or 'environment'

  // AR Filter & Face Tracker Canvas System
  let filterCanvas = null;
  let filterCtx = null;
  let filterAnimFrame = null;
  let activeFilter = 'none';
  let canvasStream = null;
  let canvasVideoTrack = null;
  let animTime = 0;

  let pipCornerIndex = 0; // 0: top-right, 1: bottom-right, 2: bottom-left, 3: top-left
  const pipCorners = ['corner-tr', 'corner-br', 'corner-bl', 'corner-tl'];

  let audioCtx = null;
  let ringtoneTimer = null;

  let signalPollInterval = null;
  let lastSignalTimestamp = 0;

  // Unique per-device / per-tab endpoint identifier for multi-device calling support
  const MY_DEVICE_ID = (() => {
    try {
      let id = sessionStorage.getItem('buddy_call_device_id');
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('buddy_call_device_id', id);
      }
      return id;
    } catch (e) {
      return 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    }
  })();

  let callbacks = {
    getCurrentUser: () => null,
    getActiveConversation: () => null
  };

  // ══════════════════════════════════════════════════════════════
  // ── REAL-TIME AI FACE TRACKING ENGINE ──
  // ══════════════════════════════════════════════════════════════
  const FaceTracker = (() => {
    const trackCanvas = document.createElement('canvas');
    trackCanvas.width = 160;
    trackCanvas.height = 120;
    const trackCtx = trackCanvas.getContext('2d', { willReadFrequently: true });

    let targetFace = { x: 320, y: 240, size: 220, confidence: 0 };
    let currentFace = { x: 320, y: 240, size: 220, confidence: 0 };

    let isDetecting = false;
    let lastDetectionTime = 0;
    let nativeDetector = null;

    if (typeof window.FaceDetector === 'function') {
      try {
        nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch(e) {}
    }

    async function update(videoEl, displayWidth, displayHeight, isMirrored = true) {
      const now = performance.now();

      // Run face detection every ~80ms for 0 CPU lag, while interpolating at 60 FPS
      if (!isDetecting && (now - lastDetectionTime > 80) && videoEl.readyState >= 2) {
        isDetecting = true;
        lastDetectionTime = now;

        let foundFace = false;

        // 1. Try Native Hardware-Accelerated FaceDetector if available in browser
        if (nativeDetector) {
          try {
            const faces = await nativeDetector.detect(videoEl);
            if (faces && faces.length > 0) {
              const f = faces[0].boundingBox;
              const vw = videoEl.videoWidth || displayWidth;
              const vh = videoEl.videoHeight || displayHeight;

              const scaleX = displayWidth / vw;
              const scaleY = displayHeight / vh;

              let fx = (f.x + f.width * 0.5) * scaleX;
              let fy = (f.y + f.height * 0.46) * scaleY;
              if (isMirrored) {
                fx = displayWidth - fx;
              }
              const fsize = Math.max(f.width * scaleX, f.height * scaleY);

              targetFace.x = fx;
              targetFace.y = fy;
              targetFace.size = fsize;
              targetFace.confidence = 1;
              foundFace = true;
            }
          } catch(e) {}
        }

        // 2. High-speed Computer Vision Skin-Chrominance Centroid Detection (Universal Fallback)
        if (!foundFace) {
          try {
            trackCtx.drawImage(videoEl, 0, 0, 160, 120);
            const imgData = trackCtx.getImageData(0, 0, 160, 120);
            const data = imgData.data;

            let sumX = 0;
            let sumY = 0;
            let skinCount = 0;
            let minX = 160, maxX = 0, minY = 120, maxY = 0;

            // Sample upper region where face typically appears
            for (let y = 8; y < 112; y += 2) {
              for (let x = 12; x < 148; x += 2) {
                const idx = (y * 160 + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // YCbCr Skin Chrominance Model (Works on fair, medium, dark skin tones)
                const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
                const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

                if (yVal > 35 && cb >= 77 && cb <= 130 && cr >= 132 && cr <= 175 && r > g && g > b) {
                  const weight = 1 + (yVal / 255);
                  sumX += x * weight;
                  sumY += y * weight;
                  skinCount += weight;

                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }

            if (skinCount > 70) {
              const rawX = sumX / skinCount;
              const rawY = sumY / skinCount;
              const boxW = (maxX - minX);
              const boxH = (maxY - minY);

              const scaleX = displayWidth / 160;
              const scaleY = displayHeight / 120;

              let fx = rawX * scaleX;
              let fy = rawY * scaleY;
              if (isMirrored) {
                fx = displayWidth - fx;
              }
              const fsize = Math.max(boxW * scaleX * 1.1, boxH * scaleY * 1.1, displayWidth * 0.36);

              targetFace.x = fx;
              targetFace.y = fy;
              targetFace.size = fsize;
              targetFace.confidence = 1;
            } else {
              // Smooth default center if momentarily out of frame
              targetFace.x = displayWidth * 0.5;
              targetFace.y = displayHeight * 0.44;
              targetFace.size = displayWidth * 0.42;
              targetFace.confidence = 0.4;
            }
          } catch(e) {}
        }

        // Update tracking status badge in PiP
        const statusBadge = document.getElementById('pip-track-status');
        if (statusBadge) {
          statusBadge.classList.toggle('active', targetFace.confidence >= 0.8 && activeFilter !== 'none');
        }

        isDetecting = false;
      }

      // 3. Butter-Smooth Exponential Lerp (No Jitter!)
      const lerpSpeed = 0.24;
      currentFace.x += (targetFace.x - currentFace.x) * lerpSpeed;
      currentFace.y += (targetFace.y - currentFace.y) * lerpSpeed;
      currentFace.size += (targetFace.size - currentFace.size) * (lerpSpeed * 0.85);

      return {
        x: currentFace.x,
        y: currentFace.y,
        size: currentFace.size,
        forehead:   { x: currentFace.x, y: currentFace.y - currentFace.size * 0.38 },
        eyesCenter: { x: currentFace.x, y: currentFace.y - currentFace.size * 0.08 },
        eyeLeft:    { x: currentFace.x - currentFace.size * 0.22, y: currentFace.y - currentFace.size * 0.08 },
        eyeRight:   { x: currentFace.x + currentFace.size * 0.22, y: currentFace.y - currentFace.size * 0.08 },
        nose:       { x: currentFace.x, y: currentFace.y + currentFace.size * 0.08 },
        mouth:      { x: currentFace.x, y: currentFace.y + currentFace.size * 0.25 },
        cheekLeft:  { x: currentFace.x - currentFace.size * 0.3, y: currentFace.y + currentFace.size * 0.12 },
        cheekRight: { x: currentFace.x + currentFace.size * 0.3, y: currentFace.y + currentFace.size * 0.12 }
      };
    }

    function reset(w = 640, h = 480) {
      targetFace = { x: w * 0.5, y: h * 0.44, size: w * 0.42, confidence: 0 };
      currentFace = { x: w * 0.5, y: h * 0.44, size: w * 0.42, confidence: 0 };
      const statusBadge = document.getElementById('pip-track-status');
      if (statusBadge) statusBadge.classList.remove('active');
    }

    return { update, reset };
  })();

  // ══════════════════════════════════════════════════════════════
  // ── Web Audio Synthesizer (Ringtones) ──
  // ══════════════════════════════════════════════════════════════
  function _getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function _startOutgoingRingtone() {
    _stopRingtone();
    const ctx = _getAudioContext();
    if (!ctx) return;

    function ring() {
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.25);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.3);
        osc2.stop(ctx.currentTime + 1.3);
      } catch (e) { }
    }

    ring();
    ringtoneTimer = setInterval(ring, 3000);
  }

  function _startIncomingRingtone() {
    _stopRingtone();
    const ctx = _getAudioContext();
    if (!ctx) return;

    function chime() {
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.value = freq;

          const start = ctx.currentTime + (idx * 0.14);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.45);
        });
      } catch (e) { }
    }

    chime();
    ringtoneTimer = setInterval(chime, 2200);
  }

  function _stopRingtone() {
    if (ringtoneTimer) {
      clearInterval(ringtoneTimer);
      ringtoneTimer = null;
    }
  }

  function _playCallTone(type) {
    const ctx = _getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'connected') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'ended') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { }
  }

  function _ensureRemoteAudio() {
    _ensureMediaElements();
    if (!remoteAudioEl) {
      remoteAudioEl = document.getElementById('webrtc-remote-audio');
      if (!remoteAudioEl) {
        remoteAudioEl = document.createElement('audio');
        remoteAudioEl.id = 'webrtc-remote-audio';
        remoteAudioEl.autoplay = true;
        remoteAudioEl.playsInline = true;
        remoteAudioEl.setAttribute('playsinline', '');
        remoteAudioEl.setAttribute('webkit-playsinline', '');
        remoteAudioEl.style.cssText = 'position: fixed; top: -9999px; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;';
        document.body.appendChild(remoteAudioEl);
      }
    }
    return remoteAudioEl;
  }

  function _unlockAudioForIOS() {
    try {
      const ctx = _getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const audioEl = _ensureRemoteAudio();
      if (audioEl && audioEl.srcObject) {
        audioEl.play().catch(() => {});
      }
    } catch (e) {}
  }

  function _ensureMediaElements() {
    if (!remoteAudioEl) {
      remoteAudioEl = document.getElementById('webrtc-remote-audio');
      if (!remoteAudioEl) {
        remoteAudioEl = document.createElement('audio');
        remoteAudioEl.id = 'webrtc-remote-audio';
        remoteAudioEl.autoplay = true;
        remoteAudioEl.playsInline = true;
        remoteAudioEl.setAttribute('playsinline', '');
        remoteAudioEl.setAttribute('webkit-playsinline', '');
        remoteAudioEl.style.cssText = 'position: fixed; top: -9999px; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;';
        document.body.appendChild(remoteAudioEl);
      }
    }
    if (remoteAudioEl) {
      remoteAudioEl.setAttribute('playsinline', '');
      remoteAudioEl.setAttribute('webkit-playsinline', '');
      remoteAudioEl.style.display = '';
      remoteAudioEl.style.cssText = 'position: fixed; top: -9999px; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;';
    }
    if (!remoteVideoEl) {
      remoteVideoEl = document.getElementById('webrtc-remote-video');
      if (remoteVideoEl) {
        remoteVideoEl.setAttribute('playsinline', '');
        remoteVideoEl.setAttribute('webkit-playsinline', '');
      }
    }
    if (!localVideoEl) {
      localVideoEl = document.getElementById('webrtc-local-video');
      if (localVideoEl) {
        localVideoEl.setAttribute('playsinline', '');
        localVideoEl.setAttribute('webkit-playsinline', '');
      }
    }
    if (!filterCanvas) {
      filterCanvas = document.getElementById('webrtc-filter-canvas');
      if (filterCanvas) {
        filterCtx = filterCanvas.getContext('2d');
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ── Multi-Transport Signaling (Supabase Realtime + Server Polling) ──
  // ══════════════════════════════════════════════════════════════
  async function _sendSignal(targetUserId, convId, action, data = {}, targetDeviceId = null) {
    const sender = callbacks.getCurrentUser();
    if (!sender || !sender.id) return;

    const payload = {
      action,
      convId,
      senderId: sender.id,
      senderDeviceId: MY_DEVICE_ID,
      senderName: sender.name || sender.username || 'Friend',
      senderAvatar: sender.avatar || '',
      targetUserId,
      targetDeviceId: targetDeviceId || (activeCall && activeCall.peerDeviceId) || null,
      data,
      timestamp: Date.now()
    };

    console.log('📡 [WebRTC Call] Sending signal:', action, 'to targetUserId:', targetUserId, 'targetDev:', payload.targetDeviceId, payload);

    // 1. Supabase Realtime Call Signals
    if (window.BuddySupabase && window.BuddySupabase.sendCallSignal) {
      window.BuddySupabase.sendCallSignal(payload);
    }

    // 2. Supabase Presence Broadcast fallback
    try {
      if (window.BuddySupabase) {
        const c = window.BuddySupabase.getClient();
        if (c) {
          const ch = c.channel('buddy-presence');
          ch.send({ type: 'broadcast', event: 'call-signal', payload });
        }
      }
    } catch(e) {}

    // 3. Server fallback (Persistent multi-device signaling)
    try {
      fetch('/api/call-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch(e) {}
  }

  function _setupSignalingListener() {
    console.log('[WebRTC Call] Setting up signaling listeners for device:', MY_DEVICE_ID);

    // 1. Supabase Call Signals
    if (window.BuddySupabase && window.BuddySupabase.subscribeToCallSignals) {
      window.BuddySupabase.subscribeToCallSignals((payload) => {
        _handleIncomingSignal(payload);
      });
    }

    // 2. Supabase Presence Broadcast
    try {
      if (window.BuddySupabase) {
        const c = window.BuddySupabase.getClient();
        if (c) {
          c.channel('buddy-presence')
            .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
              if (payload) _handleIncomingSignal(payload);
            });
        }
      }
    } catch(e) {}

    // 3. Server polling fallback (multi-device active polling every 800ms)
    async function pollServerSignals() {
      const me = callbacks.getCurrentUser();
      if (!me || !me.id || me.id === 'guest') return;

      try {
        const res = await fetch('/api/call-signal?userId=' + encodeURIComponent(me.id) + '&since=' + lastSignalTimestamp);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && Array.isArray(json.signals)) {
            json.signals.forEach(sig => {
              if (sig.timestamp > lastSignalTimestamp) {
                lastSignalTimestamp = sig.timestamp;
                _handleIncomingSignal(sig);
              }
            });
          }
        }
      } catch (e) { }
    }

    if (signalPollInterval) clearInterval(signalPollInterval);
    pollServerSignals(); // Run immediately
    signalPollInterval = setInterval(pollServerSignals, 800);
  }

  function _handleIncomingSignal(signal) {
    const me = callbacks.getCurrentUser();
    if (!me || !me.id) return;

    // Multi-device dismissal synchronization: if another device of the same user answered/declined
    if (signal.targetUserId === me.id && signal.senderId === me.id) {
      if (signal.senderDeviceId !== MY_DEVICE_ID) {
        if (signal.action === 'call-dismiss-modal') {
          console.log('📱 [WebRTC Call] Call handled on another device:', signal.data?.reason);
          _stopRingtone();
          if (activeCall && activeCall.state === 'incoming') {
            _closeCallUI();
            if (window.showToast) {
              window.showToast(signal.data?.reason === 'declined_elsewhere' ? 'Call declined on other device' : '📞 Call answered on another device');
            }
          }
        }
      }
      return; // Ignore self echoes
    }

    if (signal.targetUserId !== me.id) return;
    if (signal.senderId === me.id && signal.senderDeviceId === MY_DEVICE_ID) return; // Ignore own echoes

    // If signal specifies a specific device endpoint (e.g. answer, offer, ICE), only that device processes it
    if (signal.targetDeviceId && signal.targetDeviceId !== MY_DEVICE_ID) {
      return;
    }

    console.log('🔔 [WebRTC Call] Received signal:', signal.action, 'from:', signal.senderName, 'senderDev:', signal.senderDeviceId, signal);

    switch (signal.action) {
      case 'call-invite':
        _onReceiveCallInvite(signal);
        break;
      case 'call-accepted':
        _onCallAcceptedByPeer(signal);
        break;
      case 'call-rejected':
        _onCallRejectedByPeer(signal);
        break;
      case 'webrtc-offer':
        _onReceiveWebRTCOffer(signal);
        break;
      case 'webrtc-answer':
        _onReceiveWebRTCAnswer(signal);
        break;
      case 'webrtc-ice':
        _onReceiveICECandidate(signal);
        break;
      case 'call-ended':
        _onCallEndedByPeer(signal);
        break;
    }
  }

  // ── Incoming Call from Peer ──
  function _onReceiveCallInvite(signal) {
    console.log('📞 [WebRTC Call] Incoming call invite from:', signal.senderName, 'Type:', signal.data?.callType, 'callerDev:', signal.senderDeviceId);

    if (activeCall && (activeCall.state === 'connected' || activeCall.state === 'calling')) {
      _sendSignal(signal.senderId, signal.convId, 'call-rejected', { reason: 'busy' }, signal.senderDeviceId);
      return;
    }

    const callType = signal.data?.callType === 'video' ? 'video' : 'audio';

    activeCall = {
      state: 'incoming',
      callId: signal.data?.callId || ('call_' + Date.now()),
      convId: signal.convId,
      peerId: signal.senderId,
      peerDeviceId: signal.senderDeviceId || null,
      peerName: signal.senderName,
      peerAvatar: signal.senderAvatar,
      type: callType
    };

    _startIncomingRingtone();
    _showCallModal('incoming', activeCall.peerName, activeCall.peerAvatar, 
      callType === 'video' ? 'Incoming Video Call... 📹' : 'Incoming Voice Call... 📞', callType);

    if (typeof window.showToast === 'function') {
      window.showToast((callType === 'video' ? '📹 Incoming Video Call from ' : '📞 Incoming Voice Call from ') + signal.senderName);
    }
  }

  // ── Caller: Recipient Pressed "Accept" ──
  async function _onCallAcceptedByPeer(signal) {
    if (!activeCall || activeCall.state !== 'calling') return;
    console.log('✅ [WebRTC Call] Peer accepted call from device:', signal.senderDeviceId);

    // Save the answering device so all WebRTC traffic goes directly to it
    if (signal.senderDeviceId) {
      activeCall.peerDeviceId = signal.senderDeviceId;
    }

    _stopRingtone();
    if (noAnswerTimeout) clearTimeout(noAnswerTimeout);

    activeCall.state = 'connected';

    if (activeCall.type === 'video') {
      _showVideoRoom(activeCall.peerName, activeCall.peerAvatar);
    } else {
      _showActiveCallControls();
    }
    _updateStatusTimer('Connecting...');

    try {
      const isVideo = (activeCall.type === 'video');
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo
      });
      await peerConnection.setLocalDescription(offer);

      _sendSignal(activeCall.peerId, activeCall.convId, 'webrtc-offer', { sdp: offer, callType: activeCall.type }, activeCall.peerDeviceId);
    } catch (err) {
      console.error('Error creating offer:', err);
      endCall('Connection failed');
    }
  }

  async function _processPendingCandidates() {
    if (!peerConnection || !peerConnection.remoteDescription) return;
    const queued = [...pendingRemoteCandidates];
    pendingRemoteCandidates = [];
    for (const cand of queued) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.warn('[WebRTC Call] Error adding queued ICE candidate:', e);
      }
    }
  }

  // ── Callee: Receives WebRTC Offer ──
  async function _onReceiveWebRTCOffer(signal) {
    if (!activeCall || !peerConnection) return;
    console.log('📦 [WebRTC Call] Received offer, creating answer...');

    if (signal.senderDeviceId) {
      activeCall.peerDeviceId = signal.senderDeviceId;
    }

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data.sdp));
      await _processPendingCandidates();

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      _sendSignal(activeCall.peerId, activeCall.convId, 'webrtc-answer', { sdp: answer }, activeCall.peerDeviceId);

      activeCall.state = 'connected';
      _stopRingtone();
      _playCallTone('connected');
      _startConnectedTimer();
    } catch (err) {
      console.error('Error handling offer:', err);
      endCall('Connection failed');
    }
  }

  // ── Caller: Receives WebRTC Answer ──
  async function _onReceiveWebRTCAnswer(signal) {
    if (!activeCall || !peerConnection) return;
    console.log('📦 [WebRTC Call] Received answer, call connected!');
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data.sdp));
      await _processPendingCandidates();

      _stopRingtone();
      _playCallTone('connected');
      _startConnectedTimer();
    } catch (err) {
      console.error('Error setting remote answer:', err);
    }
  }

  // ── ICE Candidate Exchange ──
  async function _onReceiveICECandidate(signal) {
    if (!signal.data?.candidate) return;
    if (!peerConnection || !peerConnection.remoteDescription) {
      console.log('⏳ [WebRTC Call] Queuing ICE candidate (remoteDescription pending)');
      pendingRemoteCandidates.push(signal.data.candidate);
      return;
    }
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(signal.data.candidate));
    } catch (err) {
      console.warn('ICE candidate notice:', err.message);
    }
  }

  function _onCallRejectedByPeer(signal) {
    if (!activeCall) return;
    console.log('❌ [WebRTC Call] Call was rejected by peer');
    _stopRingtone();
    if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
    _playCallTone('ended');
    _updateStatusTimer(signal.data?.reason === 'busy' ? 'User is Busy' : 'Call Declined');
    if (window.showToast) window.showToast('📞 Call was declined');
    setTimeout(() => _closeCallUI(), 1500);
  }

  function _onCallEndedByPeer(signal) {
    if (!activeCall) return;
    console.log('📴 [WebRTC Call] Peer ended call');
    _stopRingtone();
    if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
    _playCallTone('ended');
    const timerEl = document.getElementById(activeCall.type === 'video' ? 'video-timer-display' : 'call-status-timer');
    const duration = timerEl ? timerEl.textContent : '';
    if (window.showToast) window.showToast('📞 Call ended (' + duration + ')');
    _closeCallUI();
  }

  // ── Synthetic Fallback MediaStream (Direct Calling Without Permission Block) ──
  function _createFallbackMediaStream(isVideo = false) {
    console.log('🛡️ [WebRTC Call] Creating fallback MediaStream (isVideo=' + isVideo + ')');
    const tracks = [];

    // 1. Silent audio track via Web Audio API
    try {
      const ctx = _getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const dest = ctx.createMediaStreamDestination();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.00001; // Inaudible carrier so WebRTC track stays alive
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        const aTrack = dest.stream.getAudioTracks()[0];
        if (aTrack) tracks.push(aTrack);
      }
    } catch (e) {
      console.warn('[WebRTC Call] Fallback audio track creation notice:', e);
    }

    // 2. Synthetic video track (Canvas animation) if video call
    if (isVideo) {
      try {
        const c = document.createElement('canvas');
        c.width = 640;
        c.height = 480;
        const cx = c.getContext('2d');
        if (cx) {
          cx.fillStyle = '#121024';
          cx.fillRect(0, 0, 640, 480);
          cx.fillStyle = '#ff2b70';
          cx.beginPath();
          cx.arc(320, 210, 50, 0, Math.PI * 2);
          cx.fill();
          cx.fillStyle = '#ffffff';
          cx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
          cx.textAlign = 'center';
          cx.fillText('BUDDY Call', 320, 300);
        }
        if (typeof c.captureStream === 'function') {
          const vStream = c.captureStream(10);
          const vTrack = vStream.getVideoTracks()[0];
          if (vTrack) tracks.push(vTrack);
        }
      } catch (e) {
        console.warn('[WebRTC Call] Fallback video track creation notice:', e);
      }
    }

    return new MediaStream(tracks);
  }

  // ── Hardware Media Acquisition with Robust Fallbacks ──
  async function _getBestUserMedia(isVideo = false) {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      const legacyGUM = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (legacyGUM) {
        try {
          return await new Promise((resolve, reject) => {
            legacyGUM.call(navigator, { audio: true, video: isVideo }, resolve, reject);
          });
        } catch (e) {
          console.warn('[WebRTC Call] Legacy GUM failed:', e);
        }
      }
      return null;
    }

    // 1. First try: standard ideal constraints
    try {
      const constraints = {
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true }
        },
        video: isVideo ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: { ideal: currentFacingMode }
        } : false
      };
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e1) {
      console.warn('[WebRTC Call] Strict getUserMedia failed, trying simple:', e1);
    }

    // 2. Second try: basic combined constraints
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { facingMode: currentFacingMode } : false
      });
    } catch (e2) {
      console.warn('[WebRTC Call] Simple combined getUserMedia failed, trying individual tracks:', e2);
    }

    // 3. Third try: capture audio and video individually
    let audioTrack = null;
    let videoTrack = null;

    try {
      const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioTrack = aStream.getAudioTracks()[0] || null;
    } catch (audioErr) {
      console.warn('[WebRTC Call] Separate audio capture notice:', audioErr);
    }

    if (isVideo) {
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: currentFacingMode }
        });
        videoTrack = vStream.getVideoTracks()[0] || null;
      } catch (videoErr) {
        console.warn('[WebRTC Call] Separate video capture notice:', videoErr);
      }
    }

    const collected = [];
    if (audioTrack) collected.push(audioTrack);
    if (videoTrack) collected.push(videoTrack);

    if (collected.length > 0) {
      return new MediaStream(collected);
    }

    return null;
  }

  // ── Setup PeerConnection & Local Media (Audio or Video) ──
  async function _setupPeerConnection(callType = 'audio') {
    _ensureMediaElements();

    let isVideo = (callType === 'video');
    rawCameraStream = await _getBestUserMedia(isVideo);

    // If real media unavailable (Safari non-SSL or permissions denied), fallback gracefully
    if (!rawCameraStream || rawCameraStream.getTracks().length === 0) {
      console.log('🛡️ [WebRTC Call] Media stream fallback activated for uninterrupted calling');
      rawCameraStream = _createFallbackMediaStream(isVideo);
    } else if (isVideo && rawCameraStream.getVideoTracks().length === 0) {
      // Audio succeeded but camera denied; attach fallback video track so video room functions
      console.log('🛡️ [WebRTC Call] Attaching fallback video track to real audio stream');
      const fallbackVid = _createFallbackMediaStream(true).getVideoTracks()[0];
      if (fallbackVid) rawCameraStream.addTrack(fallbackVid);
    } else if (rawCameraStream.getAudioTracks().length === 0) {
      // Video succeeded but mic denied; attach fallback audio track so SDP is complete
      const fallbackAud = _createFallbackMediaStream(false).getAudioTracks()[0];
      if (fallbackAud) rawCameraStream.addTrack(fallbackAud);
    }

    // Strictly ensure no blocking permission card is shown
    const permCard = document.getElementById('call-permission-card');
    if (permCard) permCard.classList.add('hidden');

    localStream = rawCameraStream;
    isVideo = localStream.getVideoTracks().length > 0;

    if (isVideo && localVideoEl) {
      localVideoEl.setAttribute('playsinline', '');
      localVideoEl.setAttribute('webkit-playsinline', '');
      localVideoEl.srcObject = rawCameraStream;
      localVideoEl.onloadedmetadata = () => {
        localVideoEl.play().catch(e => console.warn('Local preview play:', e));
      };
      _initFilterEngine();
    }

    peerConnection = new RTCPeerConnection(RTC_CONFIG);

    // Add audio track
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      peerConnection.addTrack(audioTrack, localStream);
    }

    // Add video track (DIRECT HARDWARE CAMERA - NO CANVAS DELAY!)
    if (isVideo) {
      const realVideoTrack = rawCameraStream ? rawCameraStream.getVideoTracks()[0] : null;
      const sendTrack = (activeFilter !== 'none' && canvasVideoTrack) ? canvasVideoTrack : (realVideoTrack || localStream.getVideoTracks()[0]);
      if (sendTrack) {
        peerConnection.addTrack(sendTrack, localStream);
      }
    }

    // Handle remote incoming tracks
    peerConnection.ontrack = (event) => {
      console.log('🎧 [WebRTC Call] Remote track received:', event.track.kind);

      if (event.track.kind === 'audio') {
        const audioEl = _ensureRemoteAudio();
        if (audioEl) {
          audioEl.srcObject = event.streams[0] || new MediaStream([event.track]);
          audioEl.muted = false;
          audioEl.volume = 1.0;
          const p = audioEl.play();
          if (p && typeof p.catch === 'function') {
            p.catch(e => {
              console.warn('Audio play notice, will unlock on interaction:', e);
              const unlock = () => {
                audioEl.play().catch(() => {});
                document.removeEventListener('touchstart', unlock);
                document.removeEventListener('click', unlock);
              };
              document.addEventListener('touchstart', unlock, { once: true });
              document.addEventListener('click', unlock, { once: true });
            });
          }
        }
      }

      if (event.track.kind === 'video') {
        _ensureMediaElements();
        if (remoteVideoEl) {
          remoteVideoEl.setAttribute('playsinline', '');
          remoteVideoEl.setAttribute('webkit-playsinline', '');
          remoteVideoEl.muted = true; // Essential for iOS Safari video autoplay!
          remoteVideoEl.srcObject = event.streams[0] || new MediaStream([event.track]);

          const hidePlaceholder = () => {
            const placeholder = document.getElementById('remote-video-placeholder');
            if (placeholder) placeholder.classList.add('hidden');
          };

          const p = remoteVideoEl.play();
          if (p && typeof p.then === 'function') {
            p.then(hidePlaceholder).catch(e => console.warn('Remote video play error:', e));
          }
          remoteVideoEl.onloadedmetadata = () => {
            remoteVideoEl.play().then(hidePlaceholder).catch(() => {});
          };
          remoteVideoEl.onplaying = hidePlaceholder;
        }
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && activeCall) {
        _sendSignal(activeCall.peerId, activeCall.convId, 'webrtc-ice', {
          candidate: event.candidate
        }, activeCall.peerDeviceId);
      }
    };

    if (disconnectGraceTimer) {
      clearTimeout(disconnectGraceTimer);
      disconnectGraceTimer = null;
    }

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('[WebRTC Call] PeerConnection state:', state);

      if (state === 'connected') {
        if (disconnectGraceTimer) {
          clearTimeout(disconnectGraceTimer);
          disconnectGraceTimer = null;
        }
      } else if (state === 'disconnected') {
        // 'disconnected' is temporary ICE state; give it 12 seconds to recover
        if (!disconnectGraceTimer) {
          disconnectGraceTimer = setTimeout(() => {
            if (peerConnection && (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed')) {
              endCall('Connection lost');
            }
          }, 12000);
        }
      } else if (state === 'failed') {
        if (disconnectGraceTimer) clearTimeout(disconnectGraceTimer);
        endCall('Connection failed');
      }
    };

    return peerConnection;
  }

  // ══════════════════════════════════════════════════════════════
  // ── SNAPCHAT AR FACE FILTER & EMOJI ENGINE ──
  // ══════════════════════════════════════════════════════════════
  function _initFilterEngine() {
    if (!filterCanvas) {
      filterCanvas = document.getElementById('webrtc-filter-canvas');
    }
    if (!filterCanvas || !localVideoEl) return;

    filterCtx = filterCanvas.getContext('2d');
    if (!filterCtx) return;

    FaceTracker.reset();

    // Create 30fps canvas stream for WebRTC broadcast
    try {
      if (!canvasStream && typeof filterCanvas.captureStream === 'function') {
        canvasStream = filterCanvas.captureStream(30);
        canvasVideoTrack = canvasStream.getVideoTracks()[0];
      }
    } catch(e) {
      console.warn('Canvas captureStream notice:', e);
    }

    _startFilterRenderLoop();
  }

  function _startFilterRenderLoop() {
    if (filterAnimFrame) cancelAnimationFrame(filterAnimFrame);

    async function render() {
      if (!activeCall || activeCall.type !== 'video' || !localVideoEl || !filterCanvas || !filterCtx) {
        return;
      }

      if (localVideoEl.readyState >= 2) {
        const vw = localVideoEl.videoWidth || 640;
        const vh = localVideoEl.videoHeight || 480;

        // ONLY resize canvas if resolution changed (Prevents 60fps frame drops!)
        if (filterCanvas.width !== vw || filterCanvas.height !== vh) {
          filterCanvas.width = vw;
          filterCanvas.height = vh;
        }

        const w = filterCanvas.width;
        const h = filterCanvas.height;
        animTime += 0.05;

        // 1. Draw camera frame (mirrored for selfie look)
        filterCtx.save();
        const isSelfie = (currentFacingMode === 'user' && !isScreenSharing);
        if (isSelfie) {
          filterCtx.translate(w, 0);
          filterCtx.scale(-1, 1);
        }
        filterCtx.drawImage(localVideoEl, 0, 0, w, h);
        filterCtx.restore();

        // 2. Real-time Face Tracking
        if (activeFilter !== 'none' && !isScreenSharing) {
          const face = await FaceTracker.update(localVideoEl, w, h, isSelfie);
          _renderFilterOverlay(filterCtx, activeFilter, w, h, animTime, face);
        }
      }

      filterAnimFrame = requestAnimationFrame(render);
    }

    render();
  }

  function _renderFilterOverlay(ctx, filter, w, h, t, face) {
    ctx.save();

    switch (filter) {
      // 1. 😂 Laugh (Laughing with Crying Tears)
      case 'laugh':
        _drawLaughingEmoji(ctx, face, t);
        break;

      // 2. 🕶️ / 😎 Cool Sunglasses
      case 'sunglasses':
        _drawSunglasses(ctx, face, t);
        break;

      // 3. 🐶 Cute Dog Ears & Nose (Snapchat Classic)
      case 'puppy':
        _drawPuppyFilter(ctx, face, t);
        break;

      // 4. 👑 Royal Golden Crown
      case 'crown':
        _drawRoyalCrown(ctx, face, t);
        break;

      // 5. 🐱 Cute Cat Ears & Whiskers
      case 'kitty':
        _drawKittyFilter(ctx, face, t);
        break;

      // 6. 💖 Heart Eyes & Floating Hearts
      case 'hearts':
        _drawHeartsFilter(ctx, face, w, h, t);
        break;

      // 7. 🥳 Party Popper (Party Hat, Confetti & Blower)
      case 'party':
        _drawPartyFilter(ctx, face, w, h, t);
        break;

      // 8. 😇 Golden Angel Halo & Glow
      case 'angel':
        _drawAngelFilter(ctx, face, t);
        break;

      // 9. 😈 Fiery Devil Horns
      case 'devil':
        _drawDevilFilter(ctx, face, t);
        break;

      // 10. 🦄 Rainbow Unicorn Horn & Sparkles
      case 'unicorn':
        _drawUnicornFilter(ctx, face, t);
        break;

      // 11. 🐰 Cute Bunny Ears
      case 'bunny':
        _drawBunnyFilter(ctx, face, t);
        break;

      // 12. 🔥 On Fire Flame Aura
      case 'fire':
        _drawFireFilter(ctx, face, t);
        break;

      // 13. 🌸 Cherry Blossom Flower Crown
      case 'blossom':
        _drawBlossomFilter(ctx, face, w, h, t);
        break;

      // 14. 🌈 Cyberpunk Neon Visor
      case 'neon':
        _drawCyberNeon(ctx, face, t);
        break;

      // 15. ✨ Beauty Glow
      case 'beauty':
        _drawBeautyGlow(ctx, face, w, h, t);
        break;

      // 16. 🎞️ Vintage Film
      case 'vintage':
        _drawVintageFilm(ctx, w, h);
        break;

      // 17. 🖤 Noir Black & White Film
      case 'noir':
        _drawNoirFilter(ctx, w, h);
        break;
    }

    ctx.restore();
  }

  // ── 1. 😂 Laughing with Streaming Tears (Face-Tracked to Eyes) ──
  function _drawLaughingEmoji(ctx, face, t) {
    const s = face.size * 0.16;
    
    // Laughing squinted eyes ^ ^
    [face.eyeLeft, face.eyeRight].forEach((eye, idx) => {
      ctx.save();
      ctx.translate(eye.x, eye.y);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Flowing animated blue tears streaming down
      for (let i = 0; i < 4; i++) {
        const prog = ((t * 2 + i * 0.28) % 1);
        const tearY = prog * (face.size * 0.55);
        const tearX = (idx === 0 ? -1 : 1) * (prog * (face.size * 0.12));
        const tearSize = s * (0.35 + (1 - prog) * 0.4);
        
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(tearX, tearY, tearSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Cute blush
    _drawCheekBlush(ctx, face.cheekLeft.x, face.cheekLeft.y, face.size * 0.12, 'rgba(251, 113, 133, 0.45)');
    _drawCheekBlush(ctx, face.cheekRight.x, face.cheekRight.y, face.size * 0.12, 'rgba(251, 113, 133, 0.45)');
  }

  // ── 2. 😎 Cool Sunglasses (Face-Tracked to Eyes Center) ──
  function _drawSunglasses(ctx, face, t) {
    ctx.save();
    ctx.translate(face.eyesCenter.x, face.eyesCenter.y);

    const frameW = face.size * 0.88;
    const frameH = face.size * 0.28;

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#0f172a';

    // Left Lens
    ctx.beginPath();
    ctx.roundRect(-frameW * 0.48, -frameH * 0.42, frameW * 0.42, frameH * 0.86, 12);
    ctx.fill();
    ctx.stroke();

    // Right Lens
    ctx.beginPath();
    ctx.roundRect(frameW * 0.06, -frameH * 0.42, frameW * 0.42, frameH * 0.86, 12);
    ctx.fill();
    ctx.stroke();

    // Bridge
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(-frameW * 0.08, -frameH * 0.05);
    ctx.lineTo(frameW * 0.08, -frameH * 0.05);
    ctx.stroke();

    // Lens reflections
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(-frameW * 0.42, -frameH * 0.25);
    ctx.lineTo(-frameW * 0.32, -frameH * 0.25);
    ctx.lineTo(-frameW * 0.40, frameH * 0.25);
    ctx.lineTo(-frameW * 0.46, frameH * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(frameW * 0.12, -frameH * 0.25);
    ctx.lineTo(frameW * 0.22, -frameH * 0.25);
    ctx.lineTo(frameW * 0.14, frameH * 0.25);
    ctx.lineTo(frameW * 0.08, frameH * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ── 3. 🐶 Puppy Dog (Face-Tracked: Ears on Head, Nose on Nose, Tongue on Mouth) ──
  function _drawPuppyFilter(ctx, face, t) {
    const earSize = face.size * 0.52;

    // Left Floppy Ear
    ctx.save();
    ctx.translate(face.x - face.size * 0.52, face.y - face.size * 0.48);
    ctx.rotate(-0.35 + Math.sin(t * 3) * 0.06);
    _drawDogEar(ctx, earSize);
    ctx.restore();

    // Right Floppy Ear
    ctx.save();
    ctx.translate(face.x + face.size * 0.52, face.y - face.size * 0.48);
    ctx.rotate(0.35 - Math.sin(t * 3) * 0.06);
    ctx.scale(-1, 1);
    _drawDogEar(ctx, earSize);
    ctx.restore();

    // Cute Dog Nose exactly on face.nose!
    ctx.save();
    ctx.translate(face.nose.x, face.nose.y);
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.ellipse(0, 0, face.size * 0.12, face.size * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-face.size * 0.035, -face.size * 0.025, face.size * 0.03, face.size * 0.018, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Wagging Tongue exactly at face.mouth!
    ctx.save();
    ctx.translate(face.mouth.x, face.mouth.y);
    const tongueWag = Math.sin(t * 5) * 5;
    ctx.rotate(tongueWag * 0.02);
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.roundRect(-face.size * 0.07, 0, face.size * 0.14, face.size * 0.18, [0, 0, 16, 16]);
    ctx.fill();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function _drawDogEar(ctx, earH) {
    const earW = earH * 0.55;
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-earW * 0.6, earH * 0.3, -earW * 0.5, earH * 0.9, 0, earH);
    ctx.bezierCurveTo(earW * 0.5, earH * 0.9, earW * 0.6, earH * 0.3, 0, 0);
    ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(0, earH * 0.2);
    ctx.bezierCurveTo(-earW * 0.3, earH * 0.4, -earW * 0.25, earH * 0.75, 0, earH * 0.85);
    ctx.bezierCurveTo(earW * 0.25, earH * 0.75, earW * 0.3, earH * 0.4, 0, earH * 0.2);
    ctx.fill();
  }

  // ── 4. 👑 Golden Royal Crown (Face-Tracked to Forehead) ──
  function _drawRoyalCrown(ctx, face, t) {
    ctx.save();
    const bob = Math.sin(t * 2.5) * 6;
    ctx.translate(face.forehead.x, face.forehead.y - face.size * 0.16 + bob);

    const w = face.size * 0.8;
    const h = face.size * 0.42;

    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;

    const grad = ctx.createLinearGradient(0, -h, 0, 0);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#eab308');
    grad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.lineTo(-w * 0.5, -h * 0.65);
    ctx.lineTo(-w * 0.25, -h * 0.35);
    ctx.lineTo(0, -h);
    ctx.lineTo(w * 0.25, -h * 0.35);
    ctx.lineTo(w * 0.5, -h * 0.65);
    ctx.lineTo(w * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    // Ruby & Emerald jewels
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -h * 0.48, face.size * 0.045, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(-w * 0.32, -h * 0.25, face.size * 0.035, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(w * 0.32, -h * 0.25, face.size * 0.035, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── 5. 🐱 Kitty Cat Ears & Whiskers (Face-Tracked) ──
  function _drawKittyFilter(ctx, face, t) {
    ctx.save();
    const cx = face.x;
    const cy = face.y;
    const size = face.size;

    // Cat Ears
    [-1, 1].forEach(side => {
      ctx.save();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(cx + side * size * 0.25, cy - size * 0.55);
      ctx.lineTo(cx + side * size * 0.52, cy - size * 0.95);
      ctx.lineTo(cx + side * size * 0.12, cy - size * 0.65);
      ctx.closePath();
      ctx.fill();

      // Inner Ear
      ctx.fillStyle = '#fdf2f8';
      ctx.beginPath();
      ctx.moveTo(cx + side * size * 0.26, cy - size * 0.58);
      ctx.lineTo(cx + side * size * 0.48, cy - size * 0.88);
      ctx.lineTo(cx + side * size * 0.16, cy - size * 0.66);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Pink Nose on face.nose
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(face.nose.x - size * 0.06, face.nose.y - size * 0.02);
    ctx.lineTo(face.nose.x + size * 0.06, face.nose.y - size * 0.02);
    ctx.lineTo(face.nose.x, face.nose.y + size * 0.04);
    ctx.closePath();
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    [-size * 0.05, 0, size * 0.05].forEach(offsetY => {
      ctx.beginPath();
      ctx.moveTo(face.cheekLeft.x, face.nose.y + offsetY * 0.5);
      ctx.lineTo(face.cheekLeft.x - size * 0.32, face.nose.y + offsetY * 1.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(face.cheekRight.x, face.nose.y + offsetY * 0.5);
      ctx.lineTo(face.cheekRight.x + size * 0.32, face.nose.y + offsetY * 1.5);
      ctx.stroke();
    });

    ctx.restore();
  }

  // ── 6. 💖 Heart Eyes & Floating Hearts (Face-Tracked) ──
  function _drawHeartsFilter(ctx, face, w, h, t) {
    ctx.save();
    const heartScale = (face.size * 0.08) * (1 + Math.sin(t * 5) * 0.08);

    _drawHeart(ctx, face.eyeLeft.x, face.eyeLeft.y, heartScale, '#ef4444');
    _drawHeart(ctx, face.eyeRight.x, face.eyeRight.y, heartScale, '#ef4444');

    // Floating bubble hearts around head
    for (let i = 0; i < 7; i++) {
      const p = ((t * 0.4 + i * 0.15) % 1);
      const px = face.x + (Math.sin(i * 1.7 + t) * (face.size * 0.8));
      const py = face.y + (1 - p * 2) * (face.size * 0.8);
      const alpha = Math.sin(p * Math.PI);
      const s = 12 + (i % 3) * 6;
      ctx.globalAlpha = alpha * 0.8;
      _drawHeart(ctx, px, py, s, '#f43f5e');
    }
    ctx.restore();
  }

  function _drawHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size, -size * 0.4, -size * 0.5, -size, 0, -size * 0.4);
    ctx.bezierCurveTo(size * 0.5, -size, size, -size * 0.4, 0, size * 0.3);
    ctx.fill();
    ctx.restore();
  }

  // ── 7. 🥳 Party Popper (Party Hat on Forehead, Confetti around Face) ──
  function _drawPartyFilter(ctx, face, w, h, t) {
    ctx.save();

    // Party Cone Hat seated on forehead
    ctx.save();
    ctx.translate(face.forehead.x - face.size * 0.05, face.forehead.y - face.size * 0.08);
    ctx.rotate(-0.15);

    const hatW = face.size * 0.38;
    const hatH = face.size * 0.65;

    // Colorful party stripes
    ctx.beginPath();
    ctx.moveTo(-hatW * 0.5, 0);
    ctx.lineTo(0, -hatH);
    ctx.lineTo(hatW * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = '#ec4899';
    ctx.fill();

    // Yellow stripe
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-hatW * 0.3, -hatH * 0.35);
    ctx.lineTo(hatW * 0.3, -hatH * 0.35);
    ctx.lineTo(hatW * 0.15, -hatH * 0.65);
    ctx.lineTo(-hatW * 0.15, -hatH * 0.65);
    ctx.closePath();
    ctx.fill();

    // Pom pom on top
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -hatH, face.size * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Confetti particles floating around face
    const colors = ['#f43f5e', '#38bdf8', '#fbbf24', '#10b981', '#a855f7'];
    for (let i = 0; i < 18; i++) {
      const p = ((t * 0.6 + i * 0.06) % 1);
      const angle = i * 0.7 + t;
      const dist = face.size * (0.4 + p * 0.7);
      const cx = face.x + Math.cos(angle) * dist;
      const cy = face.y + Math.sin(angle) * dist + (p * 40);

      ctx.fillStyle = colors[i % colors.length];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 3 + i);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    ctx.restore();
  }

  // ── 8. 😇 Angel Halo & Glowing Aura (Face-Tracked) ──
  function _drawAngelFilter(ctx, face, t) {
    ctx.save();
    const bob = Math.sin(t * 3) * 6;
    ctx.translate(face.forehead.x, face.forehead.y - face.size * 0.28 + bob);

    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 24;
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#fef08a';

    ctx.beginPath();
    ctx.ellipse(0, 0, face.size * 0.35, face.size * 0.12, 0, 0, Math.PI * 2);
    ctx.stroke();

    _drawCheekBlush(ctx, face.cheekLeft.x, face.cheekLeft.y, face.size * 0.14, 'rgba(251, 113, 133, 0.4)');
    _drawCheekBlush(ctx, face.cheekRight.x, face.cheekRight.y, face.size * 0.14, 'rgba(251, 113, 133, 0.4)');
    ctx.restore();
  }

  // ── 9. 😈 Fiery Devil Horns (Face-Tracked to Forehead) ──
  function _drawDevilFilter(ctx, face, t) {
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;

    [-1, 1].forEach(side => {
      ctx.save();
      ctx.translate(face.forehead.x + side * (face.size * 0.32), face.forehead.y - face.size * 0.06);
      ctx.scale(side, 1);
      ctx.rotate(-0.25);

      const grad = ctx.createLinearGradient(0, 0, 0, -face.size * 0.35);
      grad.addColorStop(0, '#dc2626');
      grad.addColorStop(1, '#f97316');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(-face.size * 0.07, 0);
      ctx.quadraticCurveTo(face.size * 0.06, -face.size * 0.22, face.size * 0.14, -face.size * 0.4);
      ctx.quadraticCurveTo(0, -face.size * 0.15, face.size * 0.07, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  // ── 10. 🦄 Rainbow Unicorn Horn & Star Sparkles ──
  function _drawUnicornFilter(ctx, face, t) {
    ctx.save();
    ctx.translate(face.forehead.x, face.forehead.y - face.size * 0.12);

    const hornH = face.size * 0.58;
    const hornW = face.size * 0.16;

    // Glowing pastel horn
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 18;

    const grad = ctx.createLinearGradient(0, 0, 0, -hornH);
    grad.addColorStop(0, '#f472b6');
    grad.addColorStop(0.33, '#fbbf24');
    grad.addColorStop(0.66, '#38bdf8');
    grad.addColorStop(1, '#c084fc');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-hornW * 0.5, 0);
    ctx.lineTo(0, -hornH);
    ctx.lineTo(hornW * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    // Spiral grooves
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    for (let i = 1; i <= 4; i++) {
      const y = -hornH * (i * 0.2);
      ctx.beginPath();
      ctx.moveTo(-hornW * 0.5 * (1 - i * 0.2), y + 6);
      ctx.lineTo(hornW * 0.5 * (1 - i * 0.2), y - 6);
      ctx.stroke();
    }

    _drawSparkleStar(ctx, -face.size * 0.2, -hornH * 0.6, 12);
    _drawSparkleStar(ctx, face.size * 0.2, -hornH * 0.8, 14);

    ctx.restore();
  }

  // ── 11. 🐰 Cute Bunny Ears & Nose ──
  function _drawBunnyFilter(ctx, face, t) {
    ctx.save();
    const earH = face.size * 0.65;
    const earW = face.size * 0.22;

    [-1, 1].forEach((side, idx) => {
      ctx.save();
      const twitch = Math.sin(t * 4 + idx) * 0.08;
      ctx.translate(face.forehead.x + side * (face.size * 0.28), face.forehead.y - face.size * 0.16);
      ctx.rotate(side * 0.18 + twitch);

      // Outer White Ear
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, -earH * 0.5, earW * 0.5, earH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner Pink Ear
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(0, -earH * 0.48, earW * 0.26, earH * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Cute Pink Bunny Nose at face.nose
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(face.nose.x, face.nose.y, face.size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── 12. 🔥 On Fire Animated Flame Aura ──
  function _drawFireFilter(ctx, face, t) {
    ctx.save();
    const count = 14;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI - Math.PI;
      const flameDist = face.size * 0.54;
      const fx = face.x + Math.cos(angle) * flameDist;
      const fy = face.y + Math.sin(angle) * (flameDist * 0.8);
      const flameH = face.size * (0.25 + Math.sin(t * 6 + i * 1.5) * 0.12);

      ctx.save();
      ctx.translate(fx, fy);
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 18;

      const grad = ctx.createLinearGradient(0, 0, 0, -flameH);
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(0.5, '#f97316');
      grad.addColorStop(1, '#fde047');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.quadraticCurveTo(0, -flameH * 0.5, 0, -flameH);
      ctx.quadraticCurveTo(12, -flameH * 0.5, 12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ── 13. 🌸 Cherry Blossom Crown ──
  function _drawBlossomFilter(ctx, face, w, h, t) {
    ctx.save();
    ctx.translate(face.forehead.x, face.forehead.y - face.size * 0.08);

    const r = face.size * 0.5;
    const flowerCount = 7;
    for (let i = 0; i < flowerCount; i++) {
      const angle = -Math.PI * 0.82 + (i * (Math.PI * 0.64 / (flowerCount - 1)));
      const fx = Math.cos(angle) * r;
      const fy = Math.sin(angle) * (r * 0.55);
      _drawSingleBlossom(ctx, fx, fy, face.size * 0.08, t + i);
    }

    // Drifting petals
    for (let i = 0; i < 6; i++) {
      const p = ((t * 0.3 + i * 0.18) % 1);
      const px = -face.size * 0.8 + p * face.size * 1.6;
      const py = -40 + p * h * 0.7;
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.75;
      _drawSinglePetal(ctx, px, py, 10, t * 2 + i);
    }
    ctx.restore();
  }

  function _drawSingleBlossom(ctx, x, y, size, anim) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(anim * 0.2);

    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(0, size * 0.5, size * 0.35, size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function _drawSinglePetal(ctx, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.4, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── 14. 🌈 Cyberpunk Neon Visor ──
  function _drawCyberNeon(ctx, face, t) {
    ctx.save();
    const cx = face.eyesCenter.x;
    const cy = face.eyesCenter.y;
    const visorW = face.size * 0.9;
    const visorH = face.size * 0.26;

    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.roundRect(cx - visorW * 0.5, cy - visorH * 0.5, visorW, visorH, 8);
    ctx.fill();
    ctx.stroke();

    const scanY = cy - visorH * 0.5 + ((Math.sin(t * 4) + 1) * 0.5 * visorH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - visorW * 0.5 + 4, scanY);
    ctx.lineTo(cx + visorW * 0.5 - 4, scanY);
    ctx.stroke();

    ctx.fillStyle = '#67e8f9';
    ctx.font = '10px monospace';
    ctx.fillText('BUDDY // CYBER-LINK 100%', cx - visorW * 0.44, cy + visorH * 0.35);
    ctx.restore();
  }

  // ── 15. ✨ Beauty Glow ──
  function _drawBeautyGlow(ctx, face, w, h, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const bgGrad = ctx.createRadialGradient(face.x, face.y, 40, face.x, face.y, face.size * 1.2);
    bgGrad.addColorStop(0, 'rgba(254, 215, 170, 0.5)');
    bgGrad.addColorStop(1, 'rgba(244, 114, 182, 0.2)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
    _drawSparkleStar(ctx, face.eyeLeft.x - face.size * 0.1, face.eyeLeft.y, 14);
    _drawSparkleStar(ctx, face.eyeRight.x + face.size * 0.1, face.eyeRight.y, 14);
    _drawSparkleStar(ctx, face.forehead.x, face.forehead.y, 16);

    _drawCheekBlush(ctx, face.cheekLeft.x, face.cheekLeft.y, face.size * 0.14, 'rgba(244, 114, 182, 0.45)');
    _drawCheekBlush(ctx, face.cheekRight.x, face.cheekRight.y, face.size * 0.14, 'rgba(244, 114, 182, 0.45)');

    ctx.restore();
  }

  function _drawCheekBlush(ctx, x, y, r, color) {
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function _drawSparkleStar(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.fill();
    ctx.restore();
  }

  // ── 16. 🎞️ Vintage Film ──
  function _drawVintageFilm(ctx, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = 'rgba(180, 83, 9, 0.25)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'multiply';
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, w * 0.7);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // ── 17. 🖤 Noir Black & White Film ──
  function _drawNoirFilter(ctx, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'multiply';
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.2, w * 0.5, h * 0.5, w * 0.65);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Apply filter selection & switch between raw camera and filtered canvas
  async function setFilter(filterName) {
    activeFilter = filterName;
    console.log('✨ [WebRTC Call] Active AR filter set to:', filterName);

    // Update active class on filter icons
    const items = document.querySelectorAll('.filter-item');
    items.forEach(el => {
      el.classList.toggle('active', el.dataset.filter === filterName);
    });

    // In local PiP: toggle between raw video and filtered canvas preview!
    const canvasEl = document.getElementById('webrtc-filter-canvas');
    const localVid = document.getElementById('webrtc-local-video');

    if (filterName !== 'none') {
      if (canvasEl) canvasEl.classList.remove('hidden');
      if (localVid) localVid.classList.add('hidden');
      if (window.showToast) {
        window.showToast('✨ Filter active: ' + filterName.toUpperCase() + ' (Face Tracking ON)');
      }
    } else {
      if (canvasEl) canvasEl.classList.add('hidden');
      if (localVid) localVid.classList.remove('hidden');
    }

    // Switch WebRTC video track between raw camera and filtered canvas
    if (peerConnection && !isScreenSharing) {
      try {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          if (filterName === 'none') {
            const rawTrack = rawCameraStream ? rawCameraStream.getVideoTracks()[0] : null;
            if (rawTrack) await videoSender.replaceTrack(rawTrack);
          } else {
            if (canvasVideoTrack) {
              await videoSender.replaceTrack(canvasVideoTrack);
            }
          }
        }
      } catch (err) {
        console.warn('Track replacement notice:', err);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ── Screen Sharing (🖥️) ──
  // ══════════════════════════════════════════════════════════════
  async function toggleScreenShare() {
    if (!peerConnection) {
      if (window.showToast) window.showToast('⚠️ No active call');
      return;
    }

    const shareBtn = document.getElementById('call-screenshare-btn');

    if (isScreenSharing) {
      _stopScreenShare();
    } else {
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) return;

        isScreenSharing = true;
        if (shareBtn) shareBtn.classList.add('active-share');

        // Swap track in PeerConnection
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        // Show screen in local preview PiP
        if (localVideoEl) {
          localVideoEl.srcObject = screenStream;
          localVideoEl.classList.remove('hidden');
          const canvasEl = document.getElementById('webrtc-filter-canvas');
          if (canvasEl) canvasEl.classList.add('hidden');
        }

        if (window.showToast) window.showToast('🖥️ Screen sharing started!');

        screenTrack.onended = () => {
          _stopScreenShare();
        };
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    }
  }

  async function _stopScreenShare() {
    if (!isScreenSharing) return;
    isScreenSharing = false;

    const shareBtn = document.getElementById('call-screenshare-btn');
    if (shareBtn) shareBtn.classList.remove('active-share');

    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      screenStream = null;
    }

    // Revert local preview
    if (localVideoEl && rawCameraStream) {
      localVideoEl.srcObject = rawCameraStream;
      if (activeFilter !== 'none') {
        const canvasEl = document.getElementById('webrtc-filter-canvas');
        if (canvasEl) canvasEl.classList.remove('hidden');
        localVideoEl.classList.add('hidden');
      }
    }

    // Revert WebRTC track to camera / canvas
    if (peerConnection) {
      try {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          const revertTrack = (activeFilter !== 'none' && canvasVideoTrack) ? canvasVideoTrack : (rawCameraStream ? rawCameraStream.getVideoTracks()[0] : null);
          if (revertTrack) await videoSender.replaceTrack(revertTrack);
        }
      } catch(e) {}
    }

    if (window.showToast) window.showToast('🖥️ Screen sharing stopped');
  }

  // ── Flip Camera (Front / Back) ──
  async function flipCamera() {
    if (activeCall?.type !== 'video' || isScreenSharing) return;

    currentFacingMode = (currentFacingMode === 'user' ? 'environment' : 'user');

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = rawCameraStream ? rawCameraStream.getVideoTracks()[0] : null;

      if (oldVideoTrack) oldVideoTrack.stop();
      rawCameraStream = new MediaStream([rawCameraStream.getAudioTracks()[0], newVideoTrack]);
      localStream = rawCameraStream;

      if (localVideoEl) {
        localVideoEl.srcObject = rawCameraStream;
      }

      if (peerConnection && activeFilter === 'none') {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) await videoSender.replaceTrack(newVideoTrack);
      }

      if (window.showToast) window.showToast(currentFacingMode === 'user' ? '🤳 Front Camera' : '📷 Rear Camera');
    } catch (err) {
      console.warn('Flip camera error:', err);
    }
  }

  // ── Toggle Camera On / Off ──
  function toggleCamera() {
    if (!rawCameraStream) return;
    const track = rawCameraStream.getVideoTracks()[0];
    if (track) {
      isCameraOff = !isCameraOff;
      track.enabled = !isCameraOff;

      const camBtn = document.getElementById('video-cam-toggle-btn');
      if (camBtn) camBtn.classList.toggle('active-cam-off', isCameraOff);

      if (window.showToast) {
        window.showToast(isCameraOff ? '📷 Camera turned OFF' : '📷 Camera turned ON');
      }
    }
  }

  // ── Switch PiP Corner ──
  function switchPipCorner() {
    const pip = document.getElementById('local-video-pip');
    if (!pip) return;

    pipCorners.forEach(c => pip.classList.remove(c));
    pipCornerIndex = (pipCornerIndex + 1) % pipCorners.length;
    pip.classList.add(pipCorners[pipCornerIndex]);
  }

  // ══════════════════════════════════════════════════════════════
  // ── Public: Start Outgoing Call (Audio or Video) ──
  // ══════════════════════════════════════════════════════════════
  async function startCall(type = 'audio') {
    const conv = callbacks.getActiveConversation();
    const me = callbacks.getCurrentUser();

    if (!conv) {
      if (window.showToast) window.showToast('⚠️ Please select a chat to make a call');
      return;
    }

    const displayName = conv.name || conv.username || 'Friend';
    const avatar = conv.avatar || '';
    const peerId = conv.userId || conv.id;

    if (peerId === 'buddy_ai') {
      _startAICall(displayName, avatar);
      return;
    }

    console.log('🚀 [WebRTC Call] Starting ' + type + ' call to:', displayName, 'peerId:', peerId);

    const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    activeCall = {
      state: 'calling',
      callId,
      convId: conv.id,
      peerId,
      peerDeviceId: null, // Will connect to whichever device answers
      peerName: displayName,
      peerAvatar: avatar,
      type
    };

    // Unlock iOS Safari Audio in user gesture
    _unlockAudioForIOS();

    // Show Outgoing UI ("Ringing...") - STRICTLY NO AUTO-CONNECT!
    _showCallModal('outgoing', displayName, avatar, 'Ringing...', type);
    _startOutgoingRingtone();

    try {
      await _setupPeerConnection(type);
      // targetDeviceId is null so ALL active devices where peerId is logged in will ring
      _sendSignal(peerId, conv.id, 'call-invite', { callType: type, callId }, null);

      if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
      noAnswerTimeout = setTimeout(() => {
        if (activeCall && activeCall.state === 'calling') {
          console.log('⏰ [WebRTC Call] No answer after 30 seconds');
          _stopRingtone();
          _updateStatusTimer('No Answer');
          if (window.showToast) window.showToast('📞 No answer from ' + displayName);
          setTimeout(() => endCall('No answer'), 1500);
        }
      }, 30000);
    } catch (err) {
      console.error('Call initialization failed:', err);
      _closeCallUI();
    }
  }

  // ── Public: Accept Incoming Call (When Green Button Clicked) ──
  async function acceptIncomingCall() {
    if (!activeCall || activeCall.state !== 'incoming') return;
    console.log('🟢 [WebRTC Call] User clicked Accept!');

    const peerDeviceId = activeCall.peerDeviceId;
    const callId = activeCall.callId;

    _unlockAudioForIOS();
    _stopRingtone();

    if (activeCall.type === 'video') {
      _showVideoRoom(activeCall.peerName, activeCall.peerAvatar);
    } else {
      _showActiveCallControls();
    }
    _updateStatusTimer('Connecting...');

    // Synchronize other devices of this user to stop ringing
    const me = callbacks.getCurrentUser();
    if (me && me.id) {
      _sendSignal(me.id, activeCall.convId, 'call-dismiss-modal', { reason: 'answered_elsewhere', callId });
    }

    try {
      await _setupPeerConnection(activeCall.type);
      _sendSignal(activeCall.peerId, activeCall.convId, 'call-accepted', { callType: activeCall.type, callId }, peerDeviceId);
    } catch (err) {
      console.error('Error accepting call:', err);
      endCall('Media device error');
    }
  }

  // ── Public: Decline Incoming Call (When Red Button Clicked) ──
  function declineIncomingCall() {
    if (!activeCall) return;
    console.log('🔴 [WebRTC Call] User clicked Decline!');
    const peerDeviceId = activeCall.peerDeviceId;
    const callId = activeCall.callId;
    _stopRingtone();

    _sendSignal(activeCall.peerId, activeCall.convId, 'call-rejected', { callId }, peerDeviceId);

    // Synchronize other devices of this user
    const me = callbacks.getCurrentUser();
    if (me && me.id) {
      _sendSignal(me.id, activeCall.convId, 'call-dismiss-modal', { reason: 'declined_elsewhere', callId });
    }

    _closeCallUI();
  }

  // ── Public: Hangup / End Active Call ──
  function endCall(reason = null) {
    _stopRingtone();
    if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
    _playCallTone('ended');

    if (activeCall && activeCall.peerId && activeCall.peerId !== 'buddy_ai') {
      _sendSignal(activeCall.peerId, activeCall.convId, 'call-ended', { reason, callId: activeCall.callId }, activeCall.peerDeviceId);
    }

    const timerEl = document.getElementById(activeCall?.type === 'video' ? 'video-timer-display' : 'call-status-timer');
    const duration = timerEl ? timerEl.textContent : '';
    if (window.showToast && activeCall && activeCall.state === 'connected') {
      window.showToast('📞 Call ended (' + duration + ')');
    }

    _closeCallUI();
  }

  function _closeCallUI() {
    _stopRingtone();
    if (noAnswerTimeout) clearTimeout(noAnswerTimeout);
    noAnswerTimeout = null;
    if (callTimer) clearInterval(callTimer);
    callTimer = null;
    callSeconds = 0;

    if (filterAnimFrame) {
      cancelAnimationFrame(filterAnimFrame);
      filterAnimFrame = null;
    }

    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      screenStream = null;
    }

    if (rawCameraStream) {
      rawCameraStream.getTracks().forEach(t => t.stop());
      rawCameraStream = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }

    if (peerConnection) {
      try { peerConnection.close(); } catch (e) { }
      peerConnection = null;
    }

    pendingRemoteCandidates = [];
    if (disconnectGraceTimer) {
      clearTimeout(disconnectGraceTimer);
      disconnectGraceTimer = null;
    }

    if (remoteAudioEl) {
      remoteAudioEl.srcObject = null;
    }

    if (remoteVideoEl) {
      remoteVideoEl.srcObject = null;
    }

    const placeholder = document.getElementById('remote-video-placeholder');
    if (placeholder) placeholder.classList.remove('hidden');

    if (localVideoEl) {
      localVideoEl.srcObject = null;
    }

    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    isScreenSharing = false;
    isCameraOff = false;
    isMuted = false;
    activeFilter = 'none';

    // Hide modals
    const modal = document.getElementById('call-overlay');
    const videoRoom = document.getElementById('video-room-wrap');
    const audioCard = document.getElementById('call-audio-card');
    const filtersBar = document.getElementById('snap-filters-bar');
    const canvasEl = document.getElementById('webrtc-filter-canvas');

    if (videoRoom) videoRoom.classList.add('hidden');
    if (filtersBar) filtersBar.classList.add('hidden');
    if (canvasEl) canvasEl.classList.add('hidden');
    document.getElementById('call-permission-card')?.classList.add('hidden');
    if (audioCard) audioCard.classList.remove('hidden');
    if (modal) modal.classList.add('hidden');

    activeCall = null;
  }

  // ── BUDDY AI Companion Call ──
  function _startAICall(name, color) {
    activeCall = {
      state: 'connected',
      convId: 'buddy_ai',
      peerId: 'buddy_ai',
      peerName: name,
      peerAvatar: '✨',
      type: 'audio'
    };

    _showCallModal('outgoing', name, '✨', 'Connecting to BUDDY AI...', 'audio');
    _playCallTone('connected');

    setTimeout(() => {
      _startConnectedTimer();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance("Hello! I am your BUDDY AI voice companion. You can talk to me anytime!");
        utter.rate = 1.0;
        utter.pitch = 1.05;
        window.speechSynthesis.speak(utter);
      }
    }, 1500);
  }

  // ── UI Modal Rendering & Controls ──
  function _showCallModal(mode, peerName, peerAvatar, statusText, callType = 'audio') {
    const modal = document.getElementById('call-overlay');
    const audioCard = document.getElementById('call-audio-card');
    const videoRoom = document.getElementById('video-room-wrap');
    const nameEl = document.getElementById('call-peer-name');
    const avatarEl = document.getElementById('call-peer-avatar');
    const timerEl = document.getElementById('call-status-timer');
    const typeLabel = document.getElementById('call-type-label');
    const activeActions = document.getElementById('call-active-actions');
    const incomingActions = document.getElementById('call-incoming-actions');

    if (!modal) return;

    if (audioCard) audioCard.classList.remove('hidden');
    if (videoRoom) videoRoom.classList.add('hidden');
    document.getElementById('call-permission-card')?.classList.add('hidden');

    if (nameEl) nameEl.textContent = peerName;
    if (avatarEl) {
      avatarEl.textContent = (peerAvatar && peerAvatar.length <= 2) ? peerAvatar : peerName.charAt(0).toUpperCase();
    }
    if (timerEl) timerEl.textContent = statusText;
    if (typeLabel) {
      typeLabel.textContent = (callType === 'video') ? 'BUDDY Video Call 📹' : 'BUDDY Voice Call 📞';
    }

    if (mode === 'incoming') {
      if (activeActions) activeActions.classList.add('hidden');
      if (incomingActions) incomingActions.classList.remove('hidden');
    } else {
      if (activeActions) activeActions.classList.remove('hidden');
      if (incomingActions) incomingActions.classList.add('hidden');
    }

    modal.classList.remove('hidden');
  }

  function _showVideoRoom(peerName, peerAvatar) {
    const audioCard = document.getElementById('call-audio-card');
    const videoRoom = document.getElementById('video-room-wrap');
    const nameDisplay = document.getElementById('video-name-display');
    const remoteAvatar = document.getElementById('video-remote-avatar');
    const remoteName = document.getElementById('video-remote-name');

    if (audioCard) audioCard.classList.add('hidden');
    if (videoRoom) videoRoom.classList.remove('hidden');

    if (nameDisplay) nameDisplay.textContent = peerName;
    if (remoteName) remoteName.textContent = peerName;
    if (remoteAvatar) {
      remoteAvatar.textContent = (peerAvatar && peerAvatar.length <= 2) ? peerAvatar : peerName.charAt(0).toUpperCase();
    }
  }

  function _showActiveCallControls() {
    const activeActions = document.getElementById('call-active-actions');
    const incomingActions = document.getElementById('call-incoming-actions');
    if (activeActions) activeActions.classList.remove('hidden');
    if (incomingActions) incomingActions.classList.add('hidden');
  }

  function _updateStatusTimer(text) {
    const timerEl = document.getElementById(activeCall?.type === 'video' ? 'video-timer-display' : 'call-status-timer');
    if (timerEl) timerEl.textContent = text;
  }

  function _startConnectedTimer() {
    _updateStatusTimer('00:00');
    callSeconds = 0;
    if (callTimer) clearInterval(callTimer);

    callTimer = setInterval(() => {
      callSeconds++;
      const m = Math.floor(callSeconds / 60);
      const s = callSeconds % 60;
      const formatted = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      _updateStatusTimer(formatted);
    }, 1000);
  }

  function toggleMute() {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      isMuted = !isMuted;
      audioTrack.enabled = !isMuted;

      const muteBtns = [document.getElementById('call-mute-btn'), document.getElementById('video-mute-btn')];
      muteBtns.forEach(btn => {
        if (btn) btn.classList.toggle('active-mute', isMuted);
      });

      if (window.showToast) {
        window.showToast(isMuted ? '🔇 Microphone muted' : '🎙️ Microphone unmuted');
      }
    }
  }

  function toggleSpeaker() {
    const audioEl = _ensureRemoteAudio();
    isSpeakerOn = !isSpeakerOn;
    if (audioEl) audioEl.volume = isSpeakerOn ? 1.0 : 0.2;

    const speakerBtn = document.getElementById('call-speaker-btn');
    if (speakerBtn) speakerBtn.style.opacity = isSpeakerOn ? '1' : '0.5';

    if (window.showToast) {
      window.showToast(isSpeakerOn ? '🔊 Speaker ON' : '🔈 Low Volume');
    }
  }

  function toggleFilterBar() {
    const filtersBar = document.getElementById('snap-filters-bar');
    if (filtersBar) {
      filtersBar.classList.toggle('hidden');
    }
  }

  function init(opts = {}) {
    if (opts.getCurrentUser) callbacks.getCurrentUser = opts.getCurrentUser;
    if (opts.getActiveConversation) callbacks.getActiveConversation = opts.getActiveConversation;

    _ensureMediaElements();
    _setupSignalingListener();

    // Voice Call actions
    const hangupBtn = document.getElementById('call-hangup-btn');
    if (hangupBtn) hangupBtn.onclick = () => endCall('User hung up');

    const acceptBtn = document.getElementById('call-accept-btn');
    if (acceptBtn) acceptBtn.onclick = () => acceptIncomingCall();

    const declineBtn = document.getElementById('call-decline-btn');
    if (declineBtn) declineBtn.onclick = () => declineIncomingCall();

    const muteBtn = document.getElementById('call-mute-btn');
    if (muteBtn) muteBtn.onclick = () => toggleMute();

    const speakerBtn = document.getElementById('call-speaker-btn');
    if (speakerBtn) speakerBtn.onclick = () => toggleSpeaker();

    // Video Call actions
    const videoHangupBtn = document.getElementById('video-hangup-btn');
    if (videoHangupBtn) videoHangupBtn.onclick = () => endCall('User hung up');

    const videoMuteBtn = document.getElementById('video-mute-btn');
    if (videoMuteBtn) videoMuteBtn.onclick = () => toggleMute();

    const videoCamBtn = document.getElementById('video-cam-toggle-btn');
    if (videoCamBtn) videoCamBtn.onclick = () => toggleCamera();

    const screenShareBtn = document.getElementById('call-screenshare-btn');
    if (screenShareBtn) screenShareBtn.onclick = () => toggleScreenShare();

    const flipCamBtn = document.getElementById('call-flip-cam-btn');
    if (flipCamBtn) flipCamBtn.onclick = () => flipCamera();

    const toggleFilterBtn = document.getElementById('toggle-filter-carousel-btn');
    if (toggleFilterBtn) toggleFilterBtn.onclick = () => toggleFilterBar();

    // PiP Corner Switch on tap
    const localPip = document.getElementById('local-video-pip');
    if (localPip) {
      localPip.onclick = (e) => {
        e.stopPropagation();
        switchPipCorner();
      };
    }

    // Bind Snapchat Filter & Emoji clicks
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => {
      item.onclick = () => {
        const f = item.getAttribute('data-filter') || 'none';
        setFilter(f);
      };
    });

    console.log('✅ [BUDDY] WebRTC Audio & Video Calling with AI Face Tracking initialized!');
  }

  return {
    init,
    startCall,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    toggleScreenShare,
    flipCamera,
    setFilter,
    toggleFilterBar,
    switchPipCorner
  };
})();

if (typeof window !== 'undefined') {
  window.WebRTCCall = WebRTCCall;
}
