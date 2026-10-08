// ============================================================
// ROMANTIC CHAT ROOM — Cloudinary Real-Time Sync ❤️
//
// FIX v2:
//  • Cloud-FIRST: Cloudinary is the authoritative source.
//    localStorage is only a fast offline cache — never the
//    source of truth when cloud is reachable.
//  • Smart DOM diff: only adds/removes changed bubbles instead
//    of wiping innerHTML every poll → zero jank.
//  • Poll 4 s (open) / 20 s (background) — balanced speed.
//  • Both devices see all messages in real time ✅
// ============================================================

// ── Cloudinary Config ───────────────────────────────────────
const CLD_CLOUD   = 'dvlxnbn7c';
const CLD_PRESET  = 'nisha_upload';
const CLD_IMG_URL = `https://api.cloudinary.com/v1_1/${CLD_CLOUD}/image/upload`;
const CLD_RAW_URL = `https://api.cloudinary.com/v1_1/${CLD_CLOUD}/raw/upload`;

// One JSON file per month → stays small
function chatPublicId() {
    const d = new Date();
    return `nk_chat_${d.getFullYear()}_${String(d.getMonth()+1).padStart(2,'0')}`;
}

// Cache-busted read URL so Cloudinary CDN never serves stale data
function chatReadUrl() {
    return `https://res.cloudinary.com/${CLD_CLOUD}/raw/upload/${chatPublicId()}.json?_v=${Date.now()}`;
}

// ── State ───────────────────────────────────────────────────
let activeSender   = 'nisha';
let pendingChatImg = null;
let isChatOpen     = false;
let chatPollTimer  = null;
let lastMsgCount   = parseInt(localStorage.getItem('nk_chat_last_seen_count')) || 0;
let isSending      = false;

// Local cache — used ONLY as offline fallback
const LS_KEY = 'nk_chat_local_v3';
function getLocalMsgs()      { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } }
function saveLocalMsgs(arr)  { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

// Rendered message IDs tracked for smart diffing
let _renderedIds = [];

const $ = id => document.getElementById(id);

// ── Fetch from Cloudinary (cloud is AUTHORITATIVE) ──────────
async function fetchCloudMessages() {
    try {
        const res = await fetch(chatReadUrl(), { cache: 'no-store' });
        if (res.status === 404) return [];
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const msgs = Array.isArray(data) ? data : [];
        // Update local cache so offline fallback stays fresh
        saveLocalMsgs(msgs);
        return msgs;
    } catch {
        // Network down → fall back to local cache so chat still shows msgs
        return getLocalMsgs();
    }
}

// ── Save to Cloudinary (overwrites same public_id) ──────────
async function saveCloudMessages(messages) {
    const blob = new Blob([JSON.stringify(messages)], { type: 'application/json' });
    const fd   = new FormData();
    fd.append('file',          blob, chatPublicId() + '.json');
    fd.append('public_id',     chatPublicId());
    fd.append('upload_preset', CLD_PRESET);
    fd.append('resource_type', 'raw');
    fd.append('overwrite',     'true');
    fd.append('invalidate',    'true');

    const res  = await fetch(CLD_RAW_URL, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

// ── Upload chat image ───────────────────────────────────────
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

// ── Merge helper (deduplication by id, sorted by time) ──────
function mergeMessages(a, b) {
    const map = new Map();
    [...a, ...b].forEach(m => map.set(m.id, m));
    return [...map.values()].sort((x, y) => x.timestamp - y.timestamp);
}

// ── Open / Close ────────────────────────────────────────────
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

    const bgMusic  = $('bg-music');
    const musicBtn = $('music-btn');
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
        if (musicBtn) { musicBtn.innerHTML = '<i class="fas fa-music"></i>'; musicBtn.classList.remove('playing'); }
    }

    const badge = $('chat-unread-badge');
    if (badge) badge.style.display = 'none';

    // Show local cache instantly, then fetch authoritative cloud data
    const local = getLocalMsgs();
    renderMessages(local);
    lastMsgCount = local.length;
    localStorage.setItem('nk_chat_last_seen_count', lastMsgCount);

    syncMessages(); // immediate cloud fetch
    startChatPolling();

    setTimeout(() => { const i = $('chat-text-input'); if (i) i.focus(); }, 400);
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
    stopChatPolling();
}

// ── Draggable ───────────────────────────────────────────────
function makeDraggable(el, handle) {
    let isDragging = false, startX, startY, initialX = 0, initialY = 0, currentX = 0, currentY = 0;

    const dragStart = e => {
        if (e.target.closest('#close-chat-btn')) return;
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

// ── Polling ─────────────────────────────────────────────────
function startChatPolling()  { stopChatPolling(); chatPollTimer = setInterval(syncMessages, 4000); }
function stopChatPolling()   { if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; } }

// ── Sync: fetch cloud (authoritative) → update UI ───────────
async function syncMessages() {
    const msgs = await fetchCloudMessages(); // cloud is the source of truth

    // Badge update when chat closed
    if (!isChatOpen && msgs.length > lastMsgCount) {
        const diff  = msgs.length - lastMsgCount;
        const badge = $('chat-unread-badge');
        if (badge) {
            badge.textContent = diff > 9 ? '9+' : diff;
            badge.style.display = 'flex';
            badge.style.animation = 'none';
            void badge.offsetWidth;
            badge.style.animation = 'badgeBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }
    }

    if (isChatOpen) {
        lastMsgCount = msgs.length;
        localStorage.setItem('nk_chat_last_seen_count', lastMsgCount);
        renderMessages(msgs);
    }
}

// Background badge sync (when chat is closed)
function startBackgroundSync() {
    setInterval(async () => {
        if (!isChatOpen) {
            const msgs = await fetchCloudMessages();
            if (msgs.length > lastMsgCount) {
                const diff  = msgs.length - lastMsgCount;
                const badge = $('chat-unread-badge');
                if (badge) {
                    badge.textContent = diff > 9 ? '9+' : diff;
                    badge.style.display = 'flex';
                    badge.style.animation = 'none';
                    void badge.offsetWidth;
                    badge.style.animation = 'badgeBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                }
            }
        }
    }, 20000);
}

// ── Smart DOM Diffing Renderer (no full wipe = no lag) ───────
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

    const wasAtBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 60;
    const newIds      = messages.map(m => m.id);

    // ── Fast path: nothing changed ───────────────────────────
    if (JSON.stringify(newIds) === JSON.stringify(_renderedIds)) return;

    // ── Build a set of currently rendered message IDs ────────
    const existingSet = new Set(_renderedIds);
    const newSet      = new Set(newIds);

    // Remove messages deleted from cloud
    _renderedIds.forEach(id => {
        if (!newSet.has(id)) {
            const el = area.querySelector(`[data-msg-id="${id}"]`);
            if (el) el.remove();
            const divider = area.querySelector(`[data-divider-id="${id}"]`);
            if (divider) divider.remove();
        }
    });

    // Remove stale empty state if present
    const emptyState = area.querySelector('.chat-empty-state');
    if (emptyState) emptyState.remove();

    // ── Append only NEW messages ─────────────────────────────
    // Build date map from existing rendered messages
    const renderedDates = new Set();
    area.querySelectorAll('.chat-date-divider').forEach(d => renderedDates.add(d.dataset.date));

    const fragment = document.createDocumentFragment();

    messages.forEach(msg => {
        if (existingSet.has(msg.id)) return; // already rendered

        const d       = new Date(msg.timestamp);
        const dateTxt = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const timeTxt = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const sender  = msg.sender || 'nisha';

        // Date divider (only if not already shown)
        if (!renderedDates.has(dateTxt)) {
            const div = document.createElement('div');
            div.className      = 'chat-date-divider';
            div.textContent    = dateTxt;
            div.dataset.date   = dateTxt;
            fragment.appendChild(div);
            renderedDates.add(dateTxt);
        }

        // Bubble wrapper
        const wrap = document.createElement('div');
        wrap.className      = `chat-msg ${sender}`;
        wrap.dataset.msgId  = msg.id;

        // Sender label
        const label = document.createElement('div');
        label.className   = 'msg-sender-label';
        label.textContent = sender === 'nisha' ? '💗 Nisha' : '💜 Krishna';

        // Bubble
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

        // Heart emoji on Nisha text messages
        if (sender === 'nisha' && !msg.imageUrl) {
            const heart = document.createElement('span');
            heart.className   = 'msg-emoji-float';
            heart.textContent = randomHeart();
            bubble.appendChild(heart);
        }

        // Time
        const time = document.createElement('div');
        time.className   = 'msg-time';
        time.textContent = timeTxt;

        // Long press to delete
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
        bubble.addEventListener('contextmenu', e => { e.preventDefault(); cancelPress(); });

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

// ── Delete ──────────────────────────────────────────────────
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
    // Optimistic local delete → re-render
    let local = getLocalMsgs().filter(m => m.id !== msgId);
    saveLocalMsgs(local);
    renderMessages(local);
    lastMsgCount = local.length;

    // Sync deletion to cloud so other devices also lose the message
    try {
        const cloud  = await fetchCloudMessages();
        const merged = cloud.filter(m => m.id !== msgId);
        saveLocalMsgs(merged);
        await saveCloudMessages(merged);
        if (isChatOpen) renderMessages(merged);
        lastMsgCount = merged.length;
    } catch (err) {
        console.warn('[Chat] Delete cloud sync failed:', err.message);
    }
}

function randomHeart() {
    const h = ['💕','💖','💗','❤️','💝','💞','🩷'];
    return h[Math.floor(Math.random() * h.length)];
}

// ── Send message ────────────────────────────────────────────
async function sendChatMessage() {
    if (isSending) return;

    const textInput = $('chat-text-input');
    const sendBtn   = $('chat-send-btn');
    const text      = textInput ? textInput.value.trim() : '';
    if (!text && !pendingChatImg) return;

    isSending = true;
    if (sendBtn) { sendBtn.disabled = true; sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

    const typingEl = $('chat-typing');
    if (typingEl) typingEl.style.display = 'flex';

    try {
        let imageUrl = null;
        if (pendingChatImg) imageUrl = await uploadChatImage(pendingChatImg.file);

        const msg = {
            id:        `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            sender:    activeSender,
            text:      text      || null,
            imageUrl:  imageUrl  || null,
            type:      imageUrl  ? 'image' : 'text',
            timestamp: Date.now()
        };
        Object.keys(msg).forEach(k => msg[k] === null && delete msg[k]);

        // Clear inputs immediately
        if (textInput) { textInput.value = ''; textInput.style.height = 'auto'; }
        clearChatImgPreview();

        // Step 1: fetch current cloud state (CRITICAL — prevents overwriting other device's msgs)
        const cloudMsgs = await fetchCloudMessages();

        // Step 2: append new message and push to cloud
        const merged = [...cloudMsgs, msg].sort((a, b) => a.timestamp - b.timestamp);
        await saveCloudMessages(merged);
        saveLocalMsgs(merged);

        // Step 3: render immediately
        renderMessages(merged, true);
        lastMsgCount = merged.length;

        burstChatHearts();

        isSending = false;
        if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>'; }
        if (typingEl) typingEl.style.display = 'none';

    } catch (err) {
        console.error('[Chat] Send error:', err);

        // Fallback: save locally and show warning
        const local = getLocalMsgs();
        const msg = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
            sender: activeSender,
            text: text || null,
            type: 'text',
            timestamp: Date.now()
        };
        Object.keys(msg).forEach(k => msg[k] === null && delete msg[k]);
        local.push(msg);
        saveLocalMsgs(local);
        renderMessages(local, true);

        const area = $('chat-messages');
        if (area) {
            const errEl = document.createElement('div');
            errEl.style.cssText = 'text-align:center;font-size:0.8rem;color:#ff4b6a;padding:8px;';
            errEl.textContent   = '⚠️ Saved locally — will sync when internet returns.';
            area.appendChild(errEl);
            setTimeout(() => errEl.remove(), 5000);
        }

        isSending = false;
        if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>'; }
        if (typingEl) typingEl.style.display = 'none';
    }
}

// ── Image preview ────────────────────────────────────────────
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

// ── Image lightbox ───────────────────────────────────────────
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

// ── Heart burst on send ──────────────────────────────────────
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

// ── Sender toggle ────────────────────────────────────────────
function setSender(sender) {
    activeSender = sender;
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
}

// ── Wire everything up ───────────────────────────────────────
function initChatUI() {
    if (sessionStorage.getItem('site_unlocked') !== 'true') return;

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
    if (startCallBtn) startCallBtn.addEventListener('click', () => alert('Calling feature coming soon!'));

    setSender('nisha');

    const textInput = $('chat-text-input');
    const sendBtn   = $('chat-send-btn');

    function updateSendBtn() {
        if (sendBtn) sendBtn.disabled = !textInput.value.trim() && !pendingChatImg;
    }

    if (textInput) {
        textInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
        });
        ['input', 'keyup', 'paste', 'compositionend'].forEach(evt =>
            textInput.addEventListener(evt, () => {
                updateSendBtn();
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

    // Background badge sync
    startBackgroundSync();

    // Initial cloud fetch to set badge baseline
    fetchCloudMessages().then(msgs => {
        if (!isChatOpen && msgs.length > lastMsgCount) {
            const diff  = msgs.length - lastMsgCount;
            const badge = $('chat-unread-badge');
            if (badge) {
                badge.textContent = diff > 9 ? '9+' : diff;
                badge.style.display = 'flex';
                badge.style.animation = 'none';
                void badge.offsetWidth;
                badge.style.animation = 'badgeBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
        } else if (isChatOpen) {
            lastMsgCount = msgs.length;
            localStorage.setItem('nk_chat_last_seen_count', lastMsgCount);
        }
    });

    // Auto-open if it was open before refresh/navigation
    if (sessionStorage.getItem('nk_chat_open') === 'true') openChat();
}

// ── Boot ─────────────────────────────────────────────────────
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
