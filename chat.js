// ============================================================
// ROMANTIC CHAT ROOM — Truly LIVE Real-Time Engine ❤️
//
// Features:
//  • Instant Live Messaging (<100ms WebSocket & Broadcast sync)
//  • Firebase Realtime Database support (permanent cross-device sync)
//  • Instant multi-tab / device fallback (works out of the box)
//  • Live Typing Indicators ("Nisha is typing..." / "Krishna is typing...")
//  • Live Online Presence ("Nisha is here 💕" / "Krishna is here 💜")
//  • Cloudinary Photo Sharing (lightbox preview)
//  • Soft romantic Web-Audio chimes on new messages
//  • Real-time message deletion across both devices
//  • Remembers device sender preference (Nisha / Krishna)
// ============================================================

// ── 1. Firebase Config (Optional for permanent cloud DB) ────
// If you have a free Firebase project from console.firebase.google.com,
// paste your config below. Even WITHOUT this, live chat works
// instantly via the real-time WebSocket pub/sub network!
const FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    databaseURL: "", // e.g. "https://your-project-default-rtdb.firebaseio.com"
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// ── 2. Cloudinary Config (for Photo Sharing) ────────────────
const CLD_CLOUD   = 'dvlxnbn7c';
const CLD_PRESET  = 'nisha_upload';
const CLD_IMG_URL = `https://api.cloudinary.com/v1_1/${CLD_CLOUD}/image/upload`;

// ── 3. WebSocket PubSub Config (Instant live cross-device) ──
const WS_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const WS_TOPIC      = 'nk_love_room_dvlxnbn7c/live_events';

// ── State ───────────────────────────────────────────────────
let activeSender   = localStorage.getItem('nk_chat_my_sender') || 'nisha';
let pendingChatImg = null;
let isChatOpen     = false;
let isSending      = false;
let lastMsgCount   = parseInt(localStorage.getItem('nk_chat_last_seen_count')) || 0;
let _renderedIds   = [];

// Typing & presence tracking
let typingTimeout      = null;
let isLocalTyping      = false;

// Realtime clients
let firebaseDb = null;
let mqttClient = null;
let bcChannel  = null;

// Local storage cache
const LS_KEY = 'nk_chat_messages_v4';
function getLocalMsgs()     { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } }
function saveLocalMsgs(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

const $ = id => document.getElementById(id);

// ── 4. Dynamic Script Loader ────────────────────────────────
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ── 5. Real-Time Network Initialization ─────────────────────
async function initRealtimeEngine() {
    // A) BroadcastChannel for instant same-browser 0ms sync
    if ('BroadcastChannel' in window) {
        try {
            bcChannel = new BroadcastChannel('nk_love_chat_bc');
            bcChannel.onmessage = e => handleIncomingEvent(e.data, 'broadcast');
        } catch(e) {
            console.warn('[Chat] BroadcastChannel error:', e);
        }
    }

    // B) Try Firebase Realtime Database if configured
    const hasFirebase = FIREBASE_CONFIG.databaseURL && FIREBASE_CONFIG.apiKey;
    if (hasFirebase) {
        try {
            await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');
            if (window.firebase && !firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            if (window.firebase) {
                firebaseDb = firebase.database();
                console.log('[Chat] Firebase Realtime Database connected! ❤️');
                setupFirebaseListeners();
                return;
            }
        } catch (err) {
            console.warn('[Chat] Firebase init fallback:', err.message);
        }
    }

    // C) Public WebSocket fallback (Instant cross-device live messaging)
    initMqttWebSocket();
}

function initMqttWebSocket() {
    loadScript('https://unpkg.com/mqtt@5.3.4/dist/mqtt.min.js')
        .then(() => {
            if (!window.mqtt) return;
            const clientId = 'nk_client_' + Math.random().toString(16).slice(2, 10);
            mqttClient = mqtt.connect(WS_BROKER_URL, {
                clientId,
                clean: true,
                connectTimeout: 5000,
                reconnectPeriod: 3000
            });

            mqttClient.on('connect', () => {
                console.log('[Chat] Live WebSocket Broker Connected! 🚀');
                mqttClient.subscribe(WS_TOPIC, { qos: 1 });
                sendLiveEvent({ type: 'presence', sender: activeSender, status: 'online' });
            });

            mqttClient.on('message', (topic, payload) => {
                try {
                    const data = JSON.parse(payload.toString());
                    handleIncomingEvent(data, 'websocket');
                } catch(e) {}
            });
        })
        .catch(err => console.warn('[Chat] MQTT WebSocket unavailable:', err));
}

// ── 6. Firebase Listeners ───────────────────────────────────
function setupFirebaseListeners() {
    if (!firebaseDb) return;

    const msgsRef = firebaseDb.ref('nk_chat/messages');

    msgsRef.on('child_added', snapshot => {
        const msg = snapshot.val();
        if (!msg || !msg.id) return;
        msg._fbKey = snapshot.key;
        handleIncomingMessage(msg);
    });

    msgsRef.on('child_removed', snapshot => {
        const deleted = snapshot.val();
        if (deleted && deleted.id) {
            handleRemoteDelete(deleted.id);
        }
    });

    firebaseDb.ref('nk_chat/typing').on('value', snapshot => {
        const val = snapshot.val() || {};
        const partner = activeSender === 'nisha' ? 'krishna' : 'nisha';
        updateTypingUI(!!val[partner], partner);
    });

    firebaseDb.ref('.info/connected').on('value', snap => {
        if (snap.val() === true) {
            const presRef = firebaseDb.ref('nk_chat/presence/' + activeSender);
            presRef.onDisconnect().set(false);
            presRef.set(true);
        }
    });

    firebaseDb.ref('nk_chat/presence').on('value', snap => {
        const val = snap.val() || {};
        const partner = activeSender === 'nisha' ? 'krishna' : 'nisha';
        updatePresenceUI(!!val[partner], partner);
    });
}

// ── 7. Unified Event Dispatcher & Receiver ──────────────────
function sendLiveEvent(event) {
    if (bcChannel) {
        try { bcChannel.postMessage(event); } catch(e) {}
    }
    if (mqttClient && mqttClient.connected) {
        try {
            mqttClient.publish(WS_TOPIC, JSON.stringify(event), { qos: 1 });
        } catch(e) {}
    }
}

function handleIncomingEvent(event, source) {
    if (!event || !event.type) return;

    if (event.type === 'message') {
        handleIncomingMessage(event.data);
    } else if (event.type === 'delete') {
        handleRemoteDelete(event.id);
    } else if (event.type === 'typing') {
        if (event.sender !== activeSender) {
            updateTypingUI(event.isTyping, event.sender);
        }
    } else if (event.type === 'presence') {
        if (event.sender !== activeSender) {
            updatePresenceUI(event.status === 'online', event.sender);
        }
    }
}

function handleIncomingMessage(msg) {
    if (!msg || !msg.id) return;

    const current = getLocalMsgs();
    const existing = current.find(m => m.id === msg.id);

    if (!existing) {
        current.push(msg);
        current.sort((a, b) => a.timestamp - b.timestamp);
        saveLocalMsgs(current);

        if (msg.sender !== activeSender) {
            playLoveChime();
        }

        if (isChatOpen) {
            renderMessages(current, true);
            lastMsgCount = current.length;
            localStorage.setItem('nk_chat_last_seen_count', lastMsgCount);
        } else {
            incrementUnreadBadge();
        }
    }
}

function handleRemoteDelete(msgId) {
    let current = getLocalMsgs().filter(m => m.id !== msgId);
    saveLocalMsgs(current);
    _renderedIds = _renderedIds.filter(id => id !== msgId);

    const area = $('chat-messages');
    if (area) {
        const el = area.querySelector(`[data-msg-id="${msgId}"]`);
        if (el) {
            el.style.transition = 'all 0.3s ease';
            el.style.opacity = '0';
            el.style.transform = 'scale(0.8)';
            setTimeout(() => el.remove(), 300);
        }
    }
}

// ── 8. Sound & UI Notifications ─────────────────────────────
function playLoveChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.06, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        gain2.gain.setValueAtTime(0.08, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.5);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.7);
    } catch(e) {}
}

function incrementUnreadBadge() {
    const current = getLocalMsgs();
    const diff = current.length - lastMsgCount;
    const badge = $('chat-unread-badge');
    if (badge && diff > 0) {
        badge.textContent = diff > 9 ? '9+' : diff;
        badge.style.display = 'flex';
        badge.style.animation = 'none';
        void badge.offsetWidth;
        badge.style.animation = 'badgeBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
}

function updateTypingUI(isTyping, sender) {
    const typingEl = $('chat-typing');
    if (!typingEl) return;

    if (isTyping) {
        typingEl.style.display = 'flex';
        let nameSpan = typingEl.querySelector('.typing-sender-name');
        if (!nameSpan) {
            nameSpan = document.createElement('span');
            nameSpan.className = 'typing-sender-name';
            nameSpan.style.cssText = 'font-size:0.75rem; color:#ff4b6a; margin-left:8px; font-weight:500;';
            typingEl.appendChild(nameSpan);
        }
        nameSpan.textContent = (sender === 'nisha' ? 'Nisha' : 'Krishna') + ' is typing...';
    } else {
        typingEl.style.display = 'none';
    }
}

function updatePresenceUI(isOnline, sender) {
    const dot = $('chat-online-dot') || document.querySelector('.online-dot');
    const headerStatus = document.querySelector('.chat-header-status');
    if (!dot || !headerStatus) return;

    if (isOnline) {
        dot.style.background = '#00ff88';
        dot.style.boxShadow  = '0 0 10px #00ff88';
        headerStatus.innerHTML = `<span class="online-dot" style="background:#00ff88; box-shadow:0 0 10px #00ff88;"></span> ${sender === 'nisha' ? 'Nisha is here 💕' : 'Krishna is here 💜'}`;
    } else {
        headerStatus.innerHTML = `<span class="online-dot"></span> Our Love Room`;
    }
}

// ── 9. Cloudinary Image Upload ──────────────────────────────
async function uploadChatImage(file) {
    const fd = new FormData();
    fd.append('file',          file);
    fd.append('upload_preset', CLD_PRESET);
    fd.append('folder',        'nk_chat_images');
    const res  = await fetch(CLD_IMG_URL, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Image upload failed');
}

// ── 10. Sending Messages ────────────────────────────────────
async function sendChatMessage() {
    if (isSending) return;

    const textInput = $('chat-text-input');
    const sendBtn   = $('chat-send-btn');
    const text      = textInput ? textInput.value.trim() : '';
    if (!text && !pendingChatImg) return;

    isSending = true;
    if (sendBtn) { sendBtn.disabled = true; sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

    try {
        let imageUrl = null;
        if (pendingChatImg) {
            imageUrl = await uploadChatImage(pendingChatImg.file);
        }

        const msg = {
            id:        `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            sender:    activeSender,
            text:      text     || null,
            imageUrl:  imageUrl || null,
            type:      imageUrl ? 'image' : 'text',
            timestamp: Date.now()
        };
        Object.keys(msg).forEach(k => msg[k] === null && delete msg[k]);

        // Clear input immediately
        if (textInput) { textInput.value = ''; textInput.style.height = 'auto'; }
        clearChatImgPreview();
        broadcastTypingStatus(false);

        // 1. Save locally
        const msgs = getLocalMsgs();
        msgs.push(msg);
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        saveLocalMsgs(msgs);

        // 2. Render immediately
        renderMessages(msgs, true);
        lastMsgCount = msgs.length;
        localStorage.setItem('nk_chat_last_seen_count', lastMsgCount);

        // 3. Send to Firebase if configured
        if (firebaseDb) {
            try {
                await firebaseDb.ref('nk_chat/messages').push(msg);
            } catch(fbErr) {
                console.warn('[Chat] Firebase push error:', fbErr);
            }
        }

        // 4. Send via Real-Time Live WebSocket & BroadcastChannel
        sendLiveEvent({ type: 'message', data: msg });

        burstChatHearts();

    } catch (err) {
        console.error('[Chat] Send error:', err);
        alert('Could not upload image. Please check internet connection.');
    } finally {
        isSending = false;
        if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>'; }
    }
}

// ── 11. Typing Broadcast ────────────────────────────────────
function handleTypingKeystroke() {
    if (!isLocalTyping) {
        isLocalTyping = true;
        broadcastTypingStatus(true);
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isLocalTyping = false;
        broadcastTypingStatus(false);
    }, 2500);
}

function broadcastTypingStatus(isTyping) {
    if (firebaseDb) {
        try { firebaseDb.ref('nk_chat/typing/' + activeSender).set(isTyping); } catch(e) {}
    }
    sendLiveEvent({ type: 'typing', sender: activeSender, isTyping });
}

// ── 12. Deleting Messages ───────────────────────────────────
function showDeleteConfirm(msgId) {
    let existing = $('chat-delete-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id        = 'chat-delete-modal-overlay';
    overlay.className = 'chat-delete-overlay';
    overlay.style.pointerEvents = 'all';
    overlay.innerHTML = `
        <div class="chat-delete-box">
            <div class="chat-delete-title">Delete Message?</div>
            <div class="chat-delete-desc">This romantic memory will be erased forever... 😢</div>
            <div class="chat-delete-actions">
                <button class="chat-del-btn chat-del-cancel" id="chat-del-cancel">Keep it ❤️</button>
                <button class="chat-del-btn chat-del-confirm" id="chat-del-confirm">Delete 🗑️</button>
            </div>
        </div>`;

    const chatWin = document.querySelector('.chat-window');
    if (chatWin) chatWin.appendChild(overlay);

    overlay.querySelector('#chat-del-cancel').onclick  = () => overlay.remove();
    overlay.querySelector('#chat-del-confirm').onclick = () => { overlay.remove(); deleteMessage(msgId); };
}

async function deleteMessage(msgId) {
    // 1. Remove locally
    handleRemoteDelete(msgId);

    // 2. Remove in Firebase if active
    if (firebaseDb) {
        try {
            const snap = await firebaseDb.ref('nk_chat/messages').orderByChild('id').equalTo(msgId).once('value');
            if (snap.exists()) {
                snap.forEach(child => child.ref.remove());
            }
        } catch(e) {
            console.warn('[Chat] Firebase delete error:', e);
        }
    }

    // 3. Broadcast delete event to partner device
    sendLiveEvent({ type: 'delete', id: msgId });
}

// ── 13. Message Rendering with Smart Diffing ────────────────
function renderMessages(messages, forceScroll = false) {
    const area = $('chat-messages');
    if (!area) return;

    if (!messages || messages.length === 0) {
        area.innerHTML = `
            <div class="chat-empty-state">
                <div class="empty-icon">💌</div>
                <p>No messages yet...<br>Say something sweet! ❤️</p>
            </div>`;
        _renderedIds = [];
        return;
    }

    const wasAtBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 80;
    const newIds      = messages.map(m => m.id);

    if (JSON.stringify(newIds) === JSON.stringify(_renderedIds)) return;

    const existingSet = new Set(_renderedIds);
    const newSet      = new Set(newIds);

    // Remove deleted items
    _renderedIds.forEach(id => {
        if (!newSet.has(id)) {
            const el = area.querySelector(`[data-msg-id="${id}"]`);
            if (el) el.remove();
        }
    });

    const emptyState = area.querySelector('.chat-empty-state');
    if (emptyState) emptyState.remove();

    const renderedDates = new Set();
    area.querySelectorAll('.chat-date-divider').forEach(d => renderedDates.add(d.dataset.date));

    const fragment = document.createDocumentFragment();

    messages.forEach(msg => {
        if (existingSet.has(msg.id)) return;

        const d       = new Date(msg.timestamp);
        const dateTxt = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const timeTxt = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const sender  = msg.sender || 'nisha';

        if (!renderedDates.has(dateTxt)) {
            const div = document.createElement('div');
            div.className      = 'chat-date-divider';
            div.textContent    = dateTxt;
            div.dataset.date   = dateTxt;
            fragment.appendChild(div);
            renderedDates.add(dateTxt);
        }

        const wrap = document.createElement('div');
        wrap.className      = `chat-msg ${sender}`;
        wrap.dataset.msgId  = msg.id;

        const label = document.createElement('div');
        label.className   = 'msg-sender-label';
        label.textContent = sender === 'nisha' ? '💗 Nisha' : '💜 Krishna';

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';

        if (msg.type === 'image' && msg.imageUrl) {
            const img      = document.createElement('img');
            img.src        = msg.imageUrl;
            img.alt        = 'Shared photo';
            img.loading    = 'lazy';
            img.style.marginBottom = msg.text ? '8px' : '0';
            img.addEventListener('click', () => openChatImgLightbox(msg.imageUrl));
            bubble.appendChild(img);
            if (msg.text) {
                const p = document.createElement('p');
                p.style.margin = '0';
                p.textContent  = msg.text;
                bubble.appendChild(p);
            }
        } else {
            bubble.textContent = msg.text || '';
        }

        if (sender === 'nisha' && !msg.imageUrl) {
            const heart = document.createElement('span');
            heart.className   = 'msg-emoji-float';
            heart.textContent = randomHeart();
            bubble.appendChild(heart);
        }

        const time = document.createElement('div');
        time.className   = 'msg-time';
        time.textContent = timeTxt;

        // Long press / right-click to delete
        let pressTimer;
        const triggerDelete = () => showDeleteConfirm(msg.id);
        const cancelPress   = () => clearTimeout(pressTimer);
        bubble.addEventListener('touchstart',  () => { pressTimer = setTimeout(triggerDelete, 600); }, { passive: true });
        bubble.addEventListener('touchend',    cancelPress);
        bubble.addEventListener('touchmove',   cancelPress);
        bubble.addEventListener('touchcancel', cancelPress);
        bubble.addEventListener('mousedown',   e => { if (e.button === 0) pressTimer = setTimeout(triggerDelete, 600); });
        bubble.addEventListener('mouseup',     cancelPress);
        bubble.addEventListener('mouseleave',  cancelPress);
        bubble.addEventListener('contextmenu', e => { e.preventDefault(); cancelPress(); triggerDelete(); });

        wrap.appendChild(label);
        wrap.appendChild(bubble);
        wrap.appendChild(time);
        fragment.appendChild(wrap);
    });

    if (fragment.childNodes.length > 0) {
        requestAnimationFrame(() => {
            area.appendChild(fragment);
            if (forceScroll || wasAtBottom) area.scrollTop = area.scrollHeight;
        });
    }

    _renderedIds = newIds;
}

function randomHeart() {
    const h = ['💕','💖','💗','❤️','💝','💞','🩷'];
    return h[Math.floor(Math.random() * h.length)];
}

// ── 14. Chat Modal Open / Close ─────────────────────────────
function openChat() {
    const modal = $('chat-modal');
    if (!modal) return;
    isChatOpen = true;
    sessionStorage.setItem('nk_chat_open', 'true');
    modal.classList.add('chat-open');
    document.body.style.overflow = 'hidden';

    const win = document.querySelector('.chat-window');
    if (win) {
        const x = sessionStorage.getItem('nk_chat_x');
        const y = sessionStorage.getItem('nk_chat_y');
        if (x !== null && y !== null) {
            win.style.transition = 'none';
            win.style.transform  = `translate(${x}px, ${y}px) scale(1)`;
            void win.offsetWidth;
            win.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }
    }

    // Pause background music during chat
    const bgMusic  = $('bg-music');
    const musicBtn = $('music-btn');
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
        if (musicBtn) { musicBtn.innerHTML = '<i class="fas fa-music"></i>'; musicBtn.classList.remove('playing'); }
    }

    const badge = $('chat-unread-badge');
    if (badge) badge.style.display = 'none';

    const msgs = getLocalMsgs();
    renderMessages(msgs, true);
    lastMsgCount = msgs.length;
    localStorage.setItem('nk_chat_last_seen_count', lastMsgCount);

    // Announce presence
    sendLiveEvent({ type: 'presence', sender: activeSender, status: 'online' });

    setTimeout(() => { const i = $('chat-text-input'); if (i) i.focus(); }, 350);
}

function closeChat() {
    const modal = $('chat-modal');
    const win   = document.querySelector('.chat-window');
    if (!modal) return;
    isChatOpen = false;
    sessionStorage.setItem('nk_chat_open', 'false');
    modal.classList.remove('chat-open');
    if (win) {
        win.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        const x = sessionStorage.getItem('nk_chat_x');
        const y = sessionStorage.getItem('nk_chat_y');
        win.style.transform = (x !== null && y !== null) ? `translate(${x}px, ${y}px) scale(0.92)` : '';
    }
    document.body.style.overflow = 'auto';
    broadcastTypingStatus(false);
}

// ── 15. Window Dragging ─────────────────────────────────────
function makeDraggable(el, handle) {
    let isDragging = false, startX, startY, initialX = 0, initialY = 0, currentX = 0, currentY = 0;

    const dragStart = e => {
        if (e.target.closest('#close-chat-btn') || e.target.closest('#chat-start-call-btn')) return;
        if (e.button && e.button !== 0) return;
        isDragging = true;
        el.style.transition = 'none';
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const match = el.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        initialX = match ? parseFloat(match[1]) : 0;
        initialY = match ? parseFloat(match[2]) : 0;
        startX = clientX - initialX;
        startY = clientY - initialY;
    };
    const dragEnd = () => {
        if (isDragging) {
            sessionStorage.setItem('nk_chat_x', currentX);
            sessionStorage.setItem('nk_chat_y', currentY);
        }
        isDragging = false;
    };
    const drag = e => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        currentX = clientX - startX;
        currentY = clientY - startY;
        el.style.transform = `translate(${currentX}px, ${currentY}px) scale(1)`;
    };

    handle.addEventListener('mousedown',  dragStart);
    handle.addEventListener('touchstart', dragStart, { passive: false });
    document.addEventListener('mouseup',  dragEnd);
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
}

// ── 16. Image Handling & Lightbox ───────────────────────────
function handleChatImageSelect(file) {
    if (!file) return;
    pendingChatImg = { file, previewUrl: URL.createObjectURL(file) };
    const preview    = $('chat-img-preview');
    const previewImg = $('chat-img-preview-img');
    if (preview && previewImg) { previewImg.src = pendingChatImg.previewUrl; preview.style.display = 'block'; }
    const sendBtn = $('chat-send-btn');
    if (sendBtn) sendBtn.disabled = false;
}

function clearChatImgPreview() {
    pendingChatImg = null;
    const preview    = $('chat-img-preview');
    const previewImg = $('chat-img-preview-img');
    if (preview)    preview.style.display = 'none';
    if (previewImg) previewImg.src        = '';
    const fi = $('chat-img-file-input');
    if (fi) fi.value = '';
}

function openChatImgLightbox(src) {
    const lb  = $('chat-img-lightbox');
    const img = $('chat-lbox-img');
    if (!lb || !img) return;
    img.src = src;
    lb.classList.add('active');
}
function closeChatImgLightbox() {
    const lb = $('chat-img-lightbox');
    if (lb) lb.classList.remove('active');
}

// ── 17. Heart Burst Animations ──────────────────────────────
function burstChatHearts() {
    const area   = $('chat-messages');
    if (!area) return;
    const emojis = ['❤️','💕','💖','✨','🌸'];
    for (let i = 0; i < 4; i++) {
        const h         = document.createElement('div');
        h.className     = 'chat-heart-burst';
        h.textContent   = emojis[Math.floor(Math.random() * emojis.length)];
        h.style.right   = `${8 + Math.random() * 35}px`;
        h.style.bottom  = `${70 + Math.random() * 50}px`;
        h.style.animationDelay = `${i * 0.1}s`;
        area.appendChild(h);
        setTimeout(() => h.remove(), 1800);
    }
}

// ── 18. Sender Toggle & Device Preference ───────────────────
function setSender(sender) {
    activeSender = sender;
    localStorage.setItem('nk_chat_my_sender', sender);

    const nb  = $('sender-nisha-btn');
    const kb  = $('sender-krishna-btn');
    const inp = $('chat-text-input');

    if (nb && kb) {
        if (sender === 'nisha') {
            nb.classList.add('active');      nb.classList.remove('krishna-active');
            kb.classList.remove('active', 'krishna-active');
        } else {
            kb.classList.add('active', 'krishna-active');
            nb.classList.remove('active', 'krishna-active');
        }
    }
    if (inp) {
        inp.placeholder = sender === 'nisha'
            ? 'Say something sweet, Nisha 💗...'
            : 'Your turn, Krishna 💜...';
    }

    sendLiveEvent({ type: 'presence', sender: activeSender, status: 'online' });
}

// ── 19. Initialize UI & Event Handlers ──────────────────────
function initChatUI() {
    if (sessionStorage.getItem('site_unlocked') !== 'true') return;

    // Start real-time engine
    initRealtimeEngine();

    const floatBtnContainer = document.querySelector('.chat-float-btn-container');
    if (floatBtnContainer) floatBtnContainer.style.display = 'block';

    const floatBtn = $('chat-float-btn');
    if (floatBtn) floatBtn.addEventListener('click', () => isChatOpen ? closeChat() : openChat());

    const chatWin    = document.querySelector('.chat-window');
    const chatHeader = document.querySelector('.chat-header');
    if (chatWin && chatHeader) makeDraggable(chatWin, chatHeader);

    const closeBtn = $('close-chat-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeChat);

    const nb = $('sender-nisha-btn');
    const kb = $('sender-krishna-btn');
    if (nb) nb.addEventListener('click', () => setSender('nisha'));
    if (kb) kb.addEventListener('click', () => setSender('krishna'));

    const startCallBtn = $('chat-start-call-btn');
    if (startCallBtn) startCallBtn.addEventListener('click', () => alert('Calling feature coming soon! 📞❤️'));

    setSender(activeSender);

    const textInput = $('chat-text-input');
    const sendBtn   = $('chat-send-btn');

    function updateSendBtn() {
        if (sendBtn) sendBtn.disabled = !textInput.value.trim() && !pendingChatImg;
    }

    if (textInput) {
        textInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
            else { handleTypingKeystroke(); }
        });
        ['input', 'keyup', 'paste', 'compositionend'].forEach(evt =>
            textInput.addEventListener(evt, () => {
                updateSendBtn();
                handleTypingKeystroke();
                textInput.style.height = 'auto';
                textInput.style.height = Math.min(textInput.scrollHeight, 90) + 'px';
            })
        );
    }

    if (sendBtn) {
        sendBtn.disabled = true;
        const sendHandler = e => {
            e.preventDefault();
            const hasText = textInput && textInput.value.trim();
            if (hasText || pendingChatImg) {
                sendBtn.disabled = false;
                sendChatMessage();
            }
        };
        sendBtn.addEventListener('click',    sendHandler);
        sendBtn.addEventListener('touchend', sendHandler, { passive: false });
    }

    const imgBtn    = $('chat-img-btn');
    const fileInput = $('chat-img-file-input');
    if (imgBtn && fileInput) {
        imgBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => { if (e.target.files[0]) handleChatImageSelect(e.target.files[0]); });
    }

    const pc = $('chat-img-preview-close');
    if (pc) pc.addEventListener('click', clearChatImgPreview);

    const lb      = $('chat-img-lightbox');
    const lbClose = $('chat-lbox-close');
    if (lbClose) lbClose.addEventListener('click', closeChatImgLightbox);
    if (lb)      lb.addEventListener('click', e => { if (e.target === lb) closeChatImgLightbox(); });

    const modal = $('chat-modal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeChat(); });

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isChatOpen) closeChat(); });

    // Initial badge update
    incrementUnreadBadge();

    // Auto-open if chat was left open across page refresh
    if (sessionStorage.getItem('nk_chat_open') === 'true') openChat();
}

// ── 20. Bootstrapping ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('site_unlocked') === 'true') {
        initChatUI();
    } else {
        const poll = setInterval(() => {
            if (sessionStorage.getItem('site_unlocked') === 'true') {
                clearInterval(poll);
                initChatUI();
            }
        }, 500);
    }
});
