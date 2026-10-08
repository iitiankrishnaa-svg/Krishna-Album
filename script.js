// ============================================================
// IMAGE PROTECTION SYSTEM
// Paths are base64-encoded so they are never exposed in plain
// text inside HTML or JS source before the user has unlocked.
// revealProtectedImages() is called only after authentication.
// ============================================================

// Decode a base64 string back to a normal path
function _d(b) { try { return atob(b); } catch(e) { return ''; } }

// Global Memories Array (base64-encoded paths)
const _rawMemories = [
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAzMTlfMTExNDQ4MjcxX0hEUl9QT1JUUkFJVC5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAzMTlfMTExNDU2OTk5X0hEUl9QT1JUUkFJVC5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUctMjAyNjAzMTktV0EwMDU4LmpwZw==',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAzMTdfMTA0NzQxNjIyX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAzMTdfMTA0NzQ1MjE3X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy8xNzY2NDAwNjIwNzE3LmpwZw==',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAyMTJfMTIwODE3MzYyX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAyMTJfMTUyMzI1MTk2X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy8xNzY0NDk2MDY2NzY2fjIuanBn',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAyMTJfMTIwODQ2ODYxX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAyMTJfMTUxMjAwNDI5X0hEUl9QT1JUUkFJVC5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUctMjAyNTA3MjYtV0EwMjAyLmpwZw==',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDJfMTI0NTQyNDQwX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDJfMTU0MDIxMTkyX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDRfMTU1MTQ5MDEzX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDRfMTYxMDE1NjAwX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA3MTNfMTEzNDQ1MzYyX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA3MTNfMTYxODAwMDQ5X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA3MTNfMTc0MTE5MjI3X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTEwMTZfMDgxODI2MTIxX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDJfMTI0NTMyMTkzX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDJfMTY0MjM1OTc0X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDNfMDI0OTM1MTg0X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDRfMTYyNDE0MjYwX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA2MDRfMTYzNTI4NjEwX0hEUl9QT1JUUkFJVC5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA3MTNfMTU1MDI0MjQ4LmpwZw==',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA3MTNfMTU1NzQzNTcxX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTA3MTNfMTYwNTM5NDk4X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTEwMTZfMDgxODI5MTA2X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTEwMTZfMTc1MTUwNTA5X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTEyMTdfMTIxODA0ODg2X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTEyMTdfMTMzNTExNjczX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTEyMTdfMTM0OTM3MDAzX0hEUl9QT1JUUkFJVC5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTEyMTdfMTc0NzAxNTk3X0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNTEyMTdfMTgxNjA1MjcwX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUdfMjAyNjAyMTFfMjEyNDQwNDgzX0hEUi5qcGc=',
    'YXNzZXRzL2ltYWdlcy8yMDI1MDgwMV8xNjA5NTctQ09MTEFHRS5qcGc=',
    'YXNzZXRzL2ltYWdlcy9JTUctMjAyNTA1MjAtV0EwMDI1LmpwZw==',
    'YXNzZXRzL2ltYWdlcy9JTUctMjAyNTA2MjAtV0EwMDk4LmpwZw==',
    'YXNzZXRzL2ltYWdlcy8yMDI1MTIyN18yMTQ5MzYtQ09MTEFHRS5qcGc='
];

// ─────────────────────────────────────────────────────────────────────────────
// Keep allMemories LOCKED until after auth.
// The array is decoded lazily in getUnlockedMemories(), called only post-auth.
// ─────────────────────────────────────────────────────────────────────────────
let _memoriesDecoded = false;
let allMemories = [];   // stays empty until unlocked

function getUnlockedMemories() {
    if (!_memoriesDecoded) {
        allMemories = _rawMemories.map(_d);
        _memoriesDecoded = true;
    }
    return allMemories;
}

// -------------------------------------------------------
// Reveal all protected images (call ONLY after auth)
// -------------------------------------------------------
function revealProtectedImages() {
    if (sessionStorage.getItem('site_unlocked') !== 'true') return; // double-guard
    document.querySelectorAll('[data-protected-src]').forEach(el => {
        const encoded = el.getAttribute('data-protected-src');
        if (encoded) {
            el.src = _d(encoded);
            el.removeAttribute('data-protected-src');
        }
    });
}

// ── IMAGE GUARDIAN ────────────────────────────────────────────────────────────
// Watches the entire DOM. If the page is NOT authenticated and any <img>
// gets a src set (e.g. via DevTools or JS injection), wipe it immediately.
// ─────────────────────────────────────────────────────────────────────────────
const _imageGuardian = new MutationObserver((mutations) => {
    if (sessionStorage.getItem('site_unlocked') === 'true') return; // authenticated
    mutations.forEach(m => {
        // Newly added nodes
        m.addedNodes && m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            const imgs = node.tagName === 'IMG' ? [node] : Array.from(node.querySelectorAll('img'));
            imgs.forEach(img => {
                if (img.src && !img.src.startsWith('data:') && img.id !== 'chat-img-preview-img' && img.id !== 'chat-lbox-img') {
                    img.src = '';
                }
            });
        });
        // Attribute changes on existing images
        if (m.type === 'attributes' && m.attributeName === 'src' && m.target.tagName === 'IMG') {
            const img = m.target;
            // Allow blank, data-URIs, favicon, and chat images
            if (img.src && !img.src.startsWith('data:') &&
                !img.src.includes('favicon') &&
                img.id !== 'chat-img-preview-img' && img.id !== 'chat-lbox-img') {
                img.removeAttribute('src');
            }
        }
    });
});
_imageGuardian.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
});

// Also observe dynamically-added protected images AFTER auth
const _protectedObserver = new MutationObserver(() => {
    if (sessionStorage.getItem('site_unlocked') === 'true') {
        revealProtectedImages();
    }
});
_protectedObserver.observe(document.documentElement, { childList: true, subtree: true });


// --- Cinematic Film Strip Initialization (called POST-AUTH only) ---
function initFilmStrip() {
    const filmStrip = document.getElementById('film-strip-scroll');
    if (!filmStrip) return;

    // Use decoded memories — only available post-auth
    const filmImages = getUnlockedMemories().slice(0, 15);
    if (!filmImages.length) return;

    // Create fragments for better performance
    const fragment = document.createDocumentFragment();
    
    // We double the list to create a seamless tiling effect for infinite scroll
    const doubleImages = [...filmImages, ...filmImages];

    doubleImages.forEach(imgSrc => {
        const frame = document.createElement('div');
        frame.className = 'film-frame';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = "Memory Piece";
        img.loading = "lazy";
        
        frame.appendChild(img);
        fragment.appendChild(frame);
    });

    filmStrip.appendChild(fragment);
}

document.addEventListener('DOMContentLoaded', () => {
    // initFilmStrip() is intentionally NOT called here.
    // It is deferred until after authentication to prevent
    // image URLs from appearing in the Network tab.
    // 1. Navigation Menus & Smooth Scrolling
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navBrand = document.querySelector('.nav-brand');

    if (navBrand) {
        navBrand.addEventListener('click', (e) => {
            const heartSearchModal = document.getElementById('heart-search-modal');
            const bgMusic = document.getElementById('bg-music');
            
            if (e.target.classList.contains('brand-icon') && heartSearchModal) {
                e.preventDefault();
                heartSearchModal.style.display = 'flex';
                if (window.resetSearchState) resetSearchState();
                
                // Play special Heart Search music
                if (bgMusic) {
                    const musicSource = bgMusic.querySelector('source');
                    if (musicSource) {
                        musicSource.src = 'assets/music/heart.mp3';
                        bgMusic.load();
                        bgMusic.play().catch(()=>{});
                    }
                }
            } else {
                window.location.reload();
            }
        });
    }


    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.classList.remove('active'); // Close mobile menu

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // offset for fixed nav
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. Shrink/Style Nav on Scroll
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.padding = '10px 30px';
            nav.style.background = 'rgba(255, 255, 255, 0.85)';
        } else {
            nav.style.padding = '15px 30px';
            nav.style.background = 'rgba(255, 255, 255, 0.65)';
        }
    });

    // 3. Carousel Logic
    const track = document.getElementById('carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.getElementById('carousel-right');
        const prevButton = document.getElementById('carousel-left');
        const dotsNav = document.getElementById('carousel-nav');
        const dots = Array.from(dotsNav.children);

        let currentSlideIndex = 0;
        
        // Arrange slides next to one another
        const setSlidePosition = () => {
            slides.forEach((slide, index) => {
                slide.style.left = index * 100 + '%';
            });
        };
        setSlidePosition();

        const moveToSlide = (currentSlide, targetSlide, targetIndex) => {
            track.style.transform = 'translateX(-' + targetIndex * 100 + '%)';
            currentSlide.classList.remove('current-slide');
            targetSlide.classList.add('current-slide');
        };

        const updateDots = (currentDot, targetDot) => {
            currentDot.classList.remove('current-indicator');
            targetDot.classList.add('current-indicator');
        };

        nextButton.addEventListener('click', () => {
            const currentSlide = track.querySelector('.current-slide');
            const currentDot = dotsNav.querySelector('.current-indicator');
            
            currentSlideIndex++;
            if(currentSlideIndex >= slides.length) currentSlideIndex = 0;
            
            const nextSlide = slides[currentSlideIndex];
            const nextDot = dots[currentSlideIndex];

            moveToSlide(currentSlide, nextSlide, currentSlideIndex);
            updateDots(currentDot, nextDot);
        });

        prevButton.addEventListener('click', () => {
            const currentSlide = track.querySelector('.current-slide');
            const currentDot = dotsNav.querySelector('.current-indicator');
            
            currentSlideIndex--;
            if(currentSlideIndex < 0) currentSlideIndex = slides.length - 1;
            
            const prevSlide = slides[currentSlideIndex];
            const prevDot = dots[currentSlideIndex];

            moveToSlide(currentSlide, prevSlide, currentSlideIndex);
            updateDots(currentDot, prevDot);
        });

        dotsNav.addEventListener('click', e => {
            const targetDot = e.target.closest('button');
            if (!targetDot) return;

            const currentSlide = track.querySelector('.current-slide');
            const currentDot = dotsNav.querySelector('.current-indicator');
            const targetIndex = dots.findIndex(dot => dot === targetDot);
            const targetSlide = slides[targetIndex];

            currentSlideIndex = targetIndex;
            moveToSlide(currentSlide, targetSlide, currentSlideIndex);
            updateDots(currentDot, targetDot);
        });

        // Auto Advance Carousel
        setInterval(() => {
            nextButton.click();
        }, 5000);
    }

    // 4. Masonry Lightbox with Navigation
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const masonryItems = Array.from(document.querySelectorAll('.masonry-item'));
    
    let currentGalleryIndex = 0;

    const updateLightboxContent = (index) => {
        if (index < 0 || index >= masonryItems.length) return;
        const item = masonryItems[index];
        const img = item.querySelector('img');
        const caption = item.getAttribute('data-caption');
        
        // Let CSS handle the opening animation smoothly
        lightboxImg.src = img.src;
        if (lightboxCaption) lightboxCaption.textContent = caption || '';
        
        currentGalleryIndex = index;
    };


    masonryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            updateLightboxContent(index);
            if (lightbox) {
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    const showNextImage = () => {
        currentGalleryIndex = (currentGalleryIndex + 1) % masonryItems.length;
        updateLightboxContent(currentGalleryIndex);
    };

    const showPrevImage = () => {
        currentGalleryIndex = (currentGalleryIndex - 1 + masonryItems.length) % masonryItems.length;
        updateLightboxContent(currentGalleryIndex);
    };

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextImage();
        });
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrevImage();
        });
    }

    const closeLightbox = () => {
        if (!lightbox) return;
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            if (lightboxImg) lightboxImg.src = '';
        }, 300);
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        // Swipe Support for Mobile Gallery sliding
        let touchStartX = 0;
        let touchEndX = 0;

        lightbox.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        lightbox.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) showNextImage(); // Swipe Left
            if (touchEndX > touchStartX + 50) showPrevImage(); // Swipe Right
        }, {passive: true});
    }

    // Keyboard Arrow Overrides
    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'ArrowLeft') showPrevImage();
        if (e.key === 'Escape') closeLightbox();
    });

    // 5. Video Player Handlers (Multiple Videos)
    const videoContainers = document.querySelectorAll('.video-container');

    videoContainers.forEach(container => {
        const video = container.querySelector('.custom-video');
        const vidOverlay = container.querySelector('.vid-overlay');
        const playBtnOverlay = container.querySelector('.play-btn-overlay');
        const playPauseBtn = container.querySelector('.play-pause');
        const muteBtn = container.querySelector('.mute');
        const progressBar = container.querySelector('.progress-bar');
        const progressFilled = container.querySelector('.progress-filled');

        const togglePlay = () => {
            if (video.paused) {
                // Pause all other videos
                document.querySelectorAll('.custom-video').forEach(v => {
                    if (v !== video) {
                        v.pause();
                        v.parentElement.querySelector('.vid-overlay').classList.remove('hidden');
                        v.parentElement.querySelector('.play-pause').innerHTML = '<i class="fas fa-play"></i>';
                    }
                });
                
                video.play();
                vidOverlay.classList.add('hidden');
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                video.pause();
                vidOverlay.classList.remove('hidden');
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        };

        playBtnOverlay.addEventListener('click', togglePlay);
        playPauseBtn.addEventListener('click', togglePlay);
        video.addEventListener('click', togglePlay);

        video.addEventListener('timeupdate', () => {
            const percent = (video.currentTime / video.duration) * 100;
            progressFilled.style.width = `${percent}%`;
        });

        progressBar.addEventListener('click', (e) => {
            const scrubTime = (e.offsetX / progressBar.offsetWidth) * video.duration;
            video.currentTime = scrubTime;
        });

        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });
    });

    // 6. Like Button Interactions
    const likeBtns = document.querySelectorAll('.like-btn');
    likeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('liked');
            const icon = this.querySelector('i');
            const countSpan = this.querySelector('.like-count');
            let count = parseInt(countSpan.textContent);
            
            if (this.classList.contains('liked')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                count++;
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                count--;
            }
            countSpan.textContent = count;
            
            // Create minor floating hearts effect around the button
            createMiniHearts(this);
        });
    });

    function createMiniHearts(btn) {
        const rect = btn.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('i');
            heart.className = 'fas fa-heart';
            heart.style.position = 'fixed';
            heart.style.left = `${rect.left + rect.width / 2 + (Math.random() * 20 - 10)}px`;
            heart.style.top = `${rect.top}px`;
            heart.style.color = 'var(--deep-red)';
            heart.style.fontSize = `${Math.random() * 10 + 10}px`;
            heart.style.pointerEvents = 'none';
            heart.style.zIndex = '9999';
            heart.style.transition = 'all 1s ease-out';
            
            document.body.appendChild(heart);
            
            setTimeout(() => {
                heart.style.transform = `translateY(-50px) scale(0)`;
                heart.style.opacity = '0';
            }, 50);
            
            setTimeout(() => {
                heart.remove();
            }, 1050);
        }
    }

    // 7. Floating Background Hearts Generator
    const heartsContainer = document.getElementById('hearts-container');
    const createBackgroundHeart = () => {
        const heart = document.createElement('i');
        heart.className = 'fas fa-heart floating-heart';
        
        // Random properties
        const size = Math.random() * 20 + 10;
        const leftPos = Math.random() * 100;
        const duration = Math.random() * 10 + 10; // 10s to 20s
        
        heart.style.fontSize = `${size}px`;
        heart.style.left = `${leftPos}vw`;
        heart.style.animationDuration = `${duration}s`;
        
        heartsContainer.appendChild(heart);
        
        // Remove after animation completes
        setTimeout(() => {
            heart.remove();
        }, duration * 1000);
    };

    // Generate initial hearts (fewer for performance)
    for (let i = 0; i < 5; i++) {
        setTimeout(createBackgroundHeart, Math.random() * 4000);
    }
    
    // Continuously generate (throttled to reduce lag)
    setInterval(createBackgroundHeart, 4000);
});

    // 8. Scroll Reveal Animations
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // 9. Floating Music Player & Autoplay attempt
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');

    // --- Weekly Music Shuffle logic (Rotates every 1 week) ---
    window.refreshMusicForPage = function() {
        if (!bgMusic) return;
        const musicList = [
            'assets/music/home.mp3',
            'assets/music/moment.mp3',
            'assets/music/gallery.mp3',
            'assets/music/album.mp3',
            'assets/music/video.mp3',
            'assets/music/diary.mp3',
            'assets/music/heart.mp3'
        ];
        const pageList = [
            'index.html',
            'moments.html',
            'memory.html',
            'album.html',
            'videos.html',
            'diary.html'
        ];
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const pageIdx = pageList.indexOf(currentPath);
        
        if (pageIdx !== -1) {
            const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
            const shuffledIdx = (pageIdx + weekIndex) % musicList.length;
            const musicSource = bgMusic.querySelector('source');
            if (musicSource) {
                musicSource.src = musicList[shuffledIdx];
                bgMusic.load();
                // Avoid autoplaying if it was paused before
                const musicBtn = document.getElementById('music-btn');
                if (musicBtn && musicBtn.classList.contains('playing')) {
                    bgMusic.play().catch(()=>{});
                }
            }
        }
    };
    refreshMusicForPage();


    if (bgMusic && musicBtn) {
        // Toggle play/pause
        musicBtn.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play();
                musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
                musicBtn.classList.add('playing');
            } else {
                bgMusic.pause();
                musicBtn.innerHTML = '<i class="fas fa-music"></i>';
                musicBtn.classList.remove('playing');
            }
        });

        // Aggressive Autoplay Attempt
        const playMusic = () => {
            if (bgMusic.paused) {
                bgMusic.play().then(() => {
                    musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    musicBtn.classList.add('playing');
                }).catch(e => {
                    // Browser blocked it, keep trying on any user interaction
                    ['click', 'scroll', 'touchstart', 'mousemove', 'keydown'].forEach(evt => {
                        document.body.addEventListener(evt, function startAudio() {
                            if (bgMusic.paused) {
                                bgMusic.play().then(() => {
                                    musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
                                    musicBtn.classList.add('playing');
                                }).catch(err => { /* Ignore */ });
                            }
                            document.body.removeEventListener(evt, startAudio);
                        }, { once: true });
                    });
                });
            }
        };

        // Try immediately
        playMusic();
        // And ensure it tries when page finishes loading
        window.addEventListener('load', playMusic);
    }

    // 10. Password Protection — Tamper-Proof System
    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 1: Inject a <style> that hides ALL body content until authenticated.
    //          The overlay is the *only* thing visible while locked.
    // LAYER 2: MutationObserver re-injects the overlay the instant it is removed
    //          or hidden via DevTools.
    // LAYER 3: 500 ms heartbeat re-locks the page if the session or overlay
    //          is tampered with at any point.
    // ─────────────────────────────────────────────────────────────────────────

    const LOCK_STYLE_ID = '__site_lock_style__';
    const OVERLAY_ID    = 'password-overlay';
    const CORRECT_PASS  = 'Krishnanisha2829';

    // ── Helper: is the site currently authenticated? ──────────────────────────
    function _isAuthenticated() {
        if (sessionStorage.getItem('site_unlocked') !== 'true') return false;
        const isOtp    = sessionStorage.getItem('otp_session') === 'true';
        const expire   = parseInt(sessionStorage.getItem('otp_expire') || '0');
        if (isOtp && Date.now() > expire) {
            sessionStorage.clear();
            return false;
        }
        return true;
    }

    // ── Helper: inject the lock <style> that hides all page content ───────────
    function _injectLockStyle() {
        if (document.getElementById(LOCK_STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = LOCK_STYLE_ID;
        // Hide every direct child of body except the overlay and its helpers.
        // Using !important so DevTools inline edits on individual elements
        // still can't reveal content.
        s.textContent = `
            body > *:not(#${OVERLAY_ID}):not(#otp-modal) {
                visibility: hidden !important;
                pointer-events: none !important;
            }
            body { overflow: hidden !important; background: #1a0010 !important; }
            #${OVERLAY_ID} {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
            }
        `;
        document.head.appendChild(s);
    }

    // ── Helper: remove lock style, show content ───────────────────────────────
    function _removeLockStyle() {
        const s = document.getElementById(LOCK_STYLE_ID);
        if (s) s.remove();
        document.body.style.overflow = '';
    }

    // ── Helper: build (or re-build) the overlay element ──────────────────────
    function _buildOverlay() {
        let ov = document.getElementById(OVERLAY_ID);
        if (!ov) {
            ov = document.createElement('div');
            ov.id = OVERLAY_ID;
            ov.className = 'password-overlay';
            ov.innerHTML = `
                <div class="password-card glass-card glowing-border">
                    <div style="background:rgba(255,118,150,0.1);padding:8px;border-radius:15px;margin-bottom:15px;font-weight:bold;color:var(--deep-red);font-size:0.9rem;letter-spacing:1px;">
                        <i class="fas fa-magic"></i> Hint: Try 1 2 3 4 5 6 password
                    </div>
                    <h2 class="romantic-title" style="font-size:2.8rem;margin-bottom:5px;">Only For Us ❤️</h2>
                    <p style="color:var(--text-muted);font-weight:500;font-size:1.1rem;margin-bottom:15px;">Please enter our special password</p>
                    <div class="password-input-group">
                        <input type="password" id="secret-password" placeholder="Enter Password...">
                        <button id="unlock-btn" class="glowing-btn"><i class="fas fa-key"></i> Unlock</button>
                    </div>
                    <div style="margin:20px 0;color:var(--text-muted);font-size:0.9rem;position:relative;">
                        <span style="background:white;padding:0 10px;z-index:1;position:relative;">OR</span>
                        <hr style="position:absolute;top:50%;left:0;right:0;border:none;border-top:1px solid rgba(0,0,0,0.1);margin:0;">
                    </div>
                    <button id="get-otp-btn" class="otp-trigger-btn">
                        <i class="fas fa-mobile-alt"></i> Get OTP Access
                    </button>
                    <p id="password-error" class="password-error">Incorrect password, my love. Try again.</p>
                </div>`;
            document.body.prepend(ov);
        }
        return ov;
    }

    // ── LOCK: enforce overlay + hidden content ────────────────────────────────
    function _lockPage() {
        _injectLockStyle();
        _buildOverlay();
        _attachPasswordListeners();
    }

    // ── UNLOCK: remove lock style, hide overlay smoothly ─────────────────────
    function _unlockPage(isOtpLogin) {
        sessionStorage.setItem('site_unlocked', 'true');
        _removeLockStyle();

        // Stop all security observers — no longer needed post-auth
        _imageGuardian.disconnect();
        _tamperObserver.disconnect();
        clearInterval(_heartbeat);

        revealProtectedImages();
        initFilmStrip(); // Safe to load film strip images now

        const ov = document.getElementById(OVERLAY_ID);
        if (ov) {
            ov.style.transition = 'opacity 0.6s';
            ov.style.opacity = '0';
            setTimeout(() => {
                ov.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 620);
        }

        enableProtection(); // Block DevTools / inspect for ALL sessions
        if (!isOtpLogin) startMusicIfPossible();
    }

    // ── Attach password / OTP listeners to overlay ────────────────────────────
    function _attachPasswordListeners() {
        // Password unlock
        const secretPasswordInput = document.getElementById('secret-password');
        const unlockBtn           = document.getElementById('unlock-btn');
        const getOtpBtn           = document.getElementById('get-otp-btn');

        const unlockSite = () => {
            const entered = secretPasswordInput ? secretPasswordInput.value : '';
            if (entered === CORRECT_PASS) {
                _unlockPage(false);
            } else {
                window.location.href = 'wrong-password.html';
            }
        };

        if (unlockBtn)           unlockBtn.addEventListener('click', unlockSite);
        if (secretPasswordInput) {
            secretPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') unlockSite();
            });
            setTimeout(() => secretPasswordInput.focus(), 500);
        }

        // --- Telegram OTP Config ---
        const telegramBotToken = "8720649890:AAH9PahcotUz2Jl6ciYgQuIRXUDm99zlpso";
        const telegramChatId   = "6913400880";
        let generatedOtp = null;

        // OTP modal elements (may be in DOM already or need to be accessed fresh)
        const otpModal     = document.getElementById('otp-modal');
        const closeOtp     = document.getElementById('close-otp');
        const verifyOtpBtn = document.getElementById('verify-otp-btn');
        const otpCodeInput = document.getElementById('otp-code');
        const otpError     = document.getElementById('otp-error');

        if (getOtpBtn) {
            getOtpBtn.addEventListener('click', () => {
                generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                getOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending to Telegram...';
                getOtpBtn.disabled = true;

                const message    = `❤️ Babu, your Secret OTP to unlock our world is: ${generatedOtp}\n(Valid for 5 minutes)`;
                const telegramUrl= `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${telegramChatId}&text=${encodeURIComponent(message)}`;

                fetch(telegramUrl)
                    .then(r => r.json())
                    .then(data => {
                        if (data.ok) {
                            if (otpModal) otpModal.classList.add('active');
                            getOtpBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Get OTP Access';
                            getOtpBtn.disabled = false;
                        } else { throw new Error(data.description || "Telegram Error"); }
                    })
                    .catch(err => {
                        console.error("Telegram Error:", err);
                        alert("Oops! Telegram bot issue: " + err.message);
                        getOtpBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Get OTP Access';
                        getOtpBtn.disabled = false;
                    });
            });
        }

        if (verifyOtpBtn) {
            verifyOtpBtn.addEventListener('click', () => {
                const code = otpCodeInput ? otpCodeInput.value.trim() : '';
                if (!generatedOtp) { alert("Please request an OTP first!"); return; }
                if (code.length !== 6) { alert("Please enter a 6-digit OTP code."); return; }

                verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
                verifyOtpBtn.disabled = true;

                if (code === generatedOtp) {
                    sessionStorage.setItem('site_unlocked', 'true');
                    sessionStorage.setItem('otp_session', 'true');
                    sessionStorage.setItem('otp_expire', Date.now() + 5 * 60 * 1000);
                    revealProtectedImages();
                    if (otpModal) otpModal.classList.remove('active');
                    window.location.reload();
                } else {
                    if (otpError) otpError.style.display = 'block';
                    verifyOtpBtn.innerHTML = 'Verify & Unlock';
                    verifyOtpBtn.disabled = false;
                }
            });
            
            if (otpCodeInput) {
                otpCodeInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        verifyOtpBtn.click();
                    }
                });
            }
        }

        if (closeOtp) closeOtp.addEventListener('click', () => {
            if (otpModal) otpModal.classList.remove('active');
            if (otpError) otpError.style.display = 'none';
        });
    }

    // ════════════════════════════════════════════════════════════════════════════
    // LAYER 2 — MutationObserver: Re-inject overlay instantly if removed/hidden
    // ════════════════════════════════════════════════════════════════════════════
    const _tamperObserver = new MutationObserver(() => {
        if (_isAuthenticated()) return; // don't interfere after real login

        const ov = document.getElementById(OVERLAY_ID);
        const ls = document.getElementById(LOCK_STYLE_ID);

        const overlayMissing  = !ov;
        const overlayHidden   = ov && (
            ov.style.display === 'none'  ||
            ov.style.visibility === 'hidden' ||
            ov.style.opacity === '0'
        );
        const lockStyleMissing = !ls;

        if (overlayMissing || overlayHidden || lockStyleMissing) {
            // Someone tampered — re-lock immediately
            _lockPage();
        }
    });

    _tamperObserver.observe(document.documentElement, {
        childList:  true,
        subtree:    true,
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden']
    });

    // ════════════════════════════════════════════════════════════════════════════
    // LAYER 3 — Heartbeat: Check every 500 ms that lock is still intact
    // ════════════════════════════════════════════════════════════════════════════
    const _heartbeat = setInterval(() => {
        if (_isAuthenticated()) {
            clearInterval(_heartbeat);
            return;
        }
        const ov = document.getElementById(OVERLAY_ID);
        const ls = document.getElementById(LOCK_STYLE_ID);

        // If overlay is gone or lock-style is stripped → re-lock
        if (!ov || !ls) {
            _lockPage();
            return;
        }
        // Also guard against computed style tricks (e.g., adding a CSS class)
        const cs = window.getComputedStyle(ov);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1) {
            _lockPage();
        }
    }, 500);

    // ════════════════════════════════════════════════════════════════════════════
    // BOOT — decide lock or unlock on page load
    // ════════════════════════════════════════════════════════════════════════════
    {
        const isUnlocked  = _isAuthenticated();
        const isOtpSession= sessionStorage.getItem('otp_session') === 'true';
        const expireTime  = parseInt(sessionStorage.getItem('otp_expire') || '0');

        if (isUnlocked) {
            // Valid session — stop ALL security observers (they cause lag on loaded pages)
            _imageGuardian.disconnect();
            _tamperObserver.disconnect();
            clearInterval(_heartbeat);

            _removeLockStyle();
            const ov = document.getElementById(OVERLAY_ID);
            if (ov) ov.style.display = 'none';
            revealProtectedImages();
            initFilmStrip(); // Load film strip after auth confirmed
            enableProtection(); // Block DevTools for all authenticated sessions
            if (isOtpSession) {
                startLogoutTimer(expireTime);
            }
        } else {
            // Not authenticated — lock everything
            _lockPage();
        }
    }

    function startLogoutTimer(expire) {
        const timerElem = document.getElementById('otp-timer');
        const countdownElem = document.getElementById('timer-countdown');
        if (!timerElem || !countdownElem) return;

        timerElem.style.display = 'block';
        const interval = setInterval(() => {
            const timeLeft = expire - Date.now();
            if (timeLeft <= 0) {
                clearInterval(interval);
                sessionStorage.clear();
                window.location.reload();
            } else {
                const mins = Math.floor(timeLeft / 60000);
                const secs = Math.floor((timeLeft % 60000) / 1000);
                countdownElem.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
            }
        }, 1000);
    }

    function enableProtection() {
        // Protection disabled per user request
        return;
    }

    function startMusicIfPossible() {
        const bgMusic = document.getElementById('bg-music');
        const musicBtn = document.getElementById('music-btn');
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().then(() => {
                if(musicBtn) {
                    musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    musicBtn.classList.add('playing');
                }
            }).catch(()=>{});
        }
    }

// 11. Instagram Modal Logic
const instaModal = document.getElementById('insta-modal');
const instaTrigger = document.getElementById('insta-trigger');
const closeInsta = document.getElementById('close-insta');

if (instaTrigger && instaModal) {
    instaTrigger.addEventListener('click', () => {
        instaModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    const hideInstaModal = () => {
        instaModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    if (closeInsta) closeInsta.addEventListener('click', hideInstaModal);
    
    instaModal.addEventListener('click', (e) => {
        if (e.target === instaModal) hideInstaModal();
    });

    // Close on Esc key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && instaModal.classList.contains('active')) {
            hideInstaModal();
        }
    });
}
// 12. Cursor Magic Effect (PC & Mobile)
const magicParticles = ['❤️', '💖', '✨', '⭐', '💝', '🌟', '💗'];
let lastCursorX = 0;
let lastCursorY = 0;

let lastParticleTime = 0;

function createMagicParticle(x, y) {
    const now = Date.now();
    // Max 20 particles per second (every 50ms)
    if (now - lastParticleTime < 50) return;
    
    const dist = Math.hypot(x - lastCursorX, y - lastCursorY);
    // Only spawn if mouse moved a decent amount
    if (dist < 40) return;
    
    lastParticleTime = now;
    lastCursorX = x;
    lastCursorY = y;
    
    const particle = document.createElement('span');
    particle.className = 'cursor-particle';
    particle.textContent = magicParticles[Math.floor(Math.random() * magicParticles.length)];
    
    // Performance optimization: use transform instead of left/top if possible, but for absolute positioning left/top is okay if not animating them.
    const dx = (Math.random() - 0.5) * 100;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    
    // Make them smaller and fade faster
    const size = 0.5 + Math.random() * 0.5;
    particle.style.fontSize = `${size}rem`;
    // Hardware acceleration hint
    particle.style.willChange = 'transform, opacity';
    
    document.body.appendChild(particle);
    
    // Remove faster to keep DOM clean (1.5s instead of 2.5s)
    setTimeout(() => {
        if(particle.parentNode) particle.remove();
    }, 1500);
}

document.addEventListener('mousemove', (e) => {
    // requestAnimationFrame ensures it runs optimally during the browser render cycle
    requestAnimationFrame(() => createMagicParticle(e.clientX, e.clientY));
});

document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
        requestAnimationFrame(() => createMagicParticle(e.touches[0].clientX, e.touches[0].clientY));
    }
}, {passive: true});
// 13. Story Modal Logic
const storyModal = document.getElementById('story-modal');
const closeStory = document.getElementById('close-story');
const readMoreBtns = document.querySelectorAll('.read-more');

if (readMoreBtns.length > 0 && storyModal) {
    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            const urlToDelete = btnEl.getAttribute('data-url');
            if(confirm('Are you sure you want to delete this picture? It will be removed globally from all devices.')) {
                
                // Show loading state
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting globally...';
                btnEl.style.opacity = '0.7';
                btnEl.disabled = true;

                // 1. Mark globally as deleted
                try {
                    const parts = urlToDelete.split('/');
                    const filenameWithExt = parts[parts.length - 1];
                    const publicId = filenameWithExt.split('.')[0];
                    if (publicId) {
                        const formData = new FormData();
                        formData.append('file', new Blob(['deleted'], {type: 'text/plain'}));
                        formData.append('upload_preset', typeof CLOUDINARY_UPLOAD_PRESET !== 'undefined' ? CLOUDINARY_UPLOAD_PRESET : 'nisha_upload');
                        formData.append('public_id', 'deleted_' + publicId);
                        formData.append('tags', 'nk_deleted_marker');
                        await fetch('https://api.cloudinary.com/v1_1/dvlxnbn7c/raw/upload', {
                            method: 'POST', body: formData
                        });
                    }
                } catch(err) {
                    console.log('Global delete failed:', err);
                }

                // 2. Local cleanup
                let hiddenUrls = JSON.parse(localStorage.getItem('nisha_hidden_urls')) || [];
                if (!hiddenUrls.includes(urlToDelete)) {
                    hiddenUrls.push(urlToDelete);
                    localStorage.setItem('nisha_hidden_urls', JSON.stringify(hiddenUrls));
                }
                
                let curUpdates = JSON.parse(localStorage.getItem('nisha_updates')) || [];
                curUpdates = curUpdates.filter(u => u.url !== urlToDelete);
                localStorage.setItem('nisha_updates', JSON.stringify(curUpdates));
                updatesList = curUpdates;
                
                let curVideos = JSON.parse(localStorage.getItem('nisha_videos')) || [];
                curVideos = curVideos.filter(v => v.url !== urlToDelete);
                localStorage.setItem('nisha_videos', JSON.stringify(curVideos));
                
                renderSettingsGrid();
                if(typeof renderUpdates === 'function') renderUpdates();
                if(typeof renderUploadedVideos === 'function') renderUploadedVideos();
            }
        });
    });

    const hideStoryModal = () => {
        storyModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    if (closeStory) closeStory.addEventListener('click', hideStoryModal);
    
    storyModal.addEventListener('click', (e) => {
        if (e.target === storyModal) hideStoryModal();
    });

    // Close on Esc key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && storyModal.classList.contains('active')) {
            hideStoryModal();
        }
    });
}
// 14. 3D Album Book Logic (Realistic Hand Tuning)
const bookElement = document.querySelector("#book");

if (bookElement) {
    // Inject dynamic album additions before reading bookPages
    const albumAdditions = JSON.parse(localStorage.getItem('nisha_album_additions')) || [];
    if (albumAdditions.length > 0) {
        const pages = document.querySelectorAll(".book-page");
        const backCover = pages[pages.length - 1]; // The last page is always the back cover
        let currentMaxPageNum = pages.length * 2 - 2;
        
        const themes = ['theme-peach', 'theme-mint', 'theme-sky', 'theme-rose', 'theme-lavender', 'theme-cream'];
        
        albumAdditions.forEach((addition, i) => {
            currentMaxPageNum++;
            const pageNumFront = currentMaxPageNum;
            currentMaxPageNum++;
            const pageNumBack = currentMaxPageNum;
            
            const theme = themes[i % themes.length];
            const dateObj = new Date(addition.date);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            
            const newPage = document.createElement('div');
            newPage.className = 'book-page';
            newPage.innerHTML = `
                <div class="page-front">
                    <img src="${addition.url}" alt="Memory" class="album-img">
                    <div class="album-date">${dateStr}</div>
                    <span class="page-num">${pageNumFront}</span>
                </div>
                <div class="page-back ${theme}">
                    <div class="album-text" contenteditable="true" title="Click to edit your memory ❤️">
                        ${addition.caption || "A new sweet memory..."} <br><br>
                        Added from Updates ✨
                    </div>
                    <span class="page-num">${pageNumBack}</span>
                </div>
            `;
            // Insert before back cover
            bookElement.insertBefore(newPage, backCover);
        });
        
        // Update back cover numbers
        const backCoverFrontNum = backCover.querySelector('.page-front .page-num');
        const backCoverBackNum = backCover.querySelector('.page-back .page-num');
        if (backCoverFrontNum) backCoverFrontNum.textContent = currentMaxPageNum + 1;
        if (backCoverBackNum) backCoverBackNum.textContent = currentMaxPageNum + 2;
    }
}

const bookPages = document.querySelectorAll(".book-page");

if (bookElement && bookPages.length > 0) {
    let currLocation = 1;
    let numOfPapers = bookPages.length;
    let maxLocation = numOfPapers + 1;
    let isFlipping = false;

    function openBook() {
        bookElement.style.transform = "translateX(50%)";
    }

    function closeBook(isAtBeginning) {
        if(isAtBeginning) {
            bookElement.style.transform = "translateX(0%)";
        } else {
            bookElement.style.transform = "translateX(100%)";
        }
    }

    function goNextPage() {
        if(currLocation < maxLocation) {
            if (currLocation === 1) openBook();
            const page = bookPages[currLocation - 1];
            page.classList.add("flipped");
            page.style.zIndex = 1000;
            
            if (currLocation === numOfPapers) closeBook(false);
            currLocation++;
            setTimeout(() => {
                page.style.zIndex = currLocation;
            }, 600);
        }
    }

    function goPrevPage() {
        if(currLocation > 1) {
            if (currLocation === 2) closeBook(true);
            if (currLocation === maxLocation) openBook();
            const page = bookPages[currLocation - 2];
            page.classList.remove("flipped");
            page.style.zIndex = 1000;
            
            currLocation--;
            setTimeout(() => {
                page.style.zIndex = numOfPapers - (currLocation - 1);
            }, 600);
        }
    }

    bookPages.forEach((page, index) => {
        page.addEventListener('click', (e) => {
             if (e.target.classList.contains('album-text')) return;
             if (isFlipping) return;
             isFlipping = true;
             setTimeout(() => { isFlipping = false; }, 800);

             if (!page.classList.contains('flipped')) {
                 if (index + 1 === currLocation) {
                     goNextPage();
                 }
             } else {
                 if (index + 1 === currLocation - 1) {
                     goPrevPage();
                 }
             }
        });
    });


    // Editable Album Text Logic
    const albumTexts = document.querySelectorAll('.album-text');
    albumTexts.forEach((el, index) => {
        // Skip specific non-editable elements if any (like covers, though user said all left pages)
        el.contentEditable = true;
        el.title = "Click to edit your memory ❤️";
        const storageKey = `album_text_p${index}`;
        
        // Load saved content
        const savedText = localStorage.getItem(storageKey);
        if (savedText) {
            el.innerHTML = savedText;
        }

        // Save on change
        el.addEventListener('blur', () => {
            localStorage.setItem(storageKey, el.innerHTML);
        });
        
        // Also stop propagation to prevent flips
        el.addEventListener('click', (e) => e.stopPropagation());
    });

    // Swipe Logic for Phone (Mobile)
    let touchStartX = 0;
    const threshold = 50;

    bookElement.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    bookElement.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchStartX - touchEndX;

        if (isFlipping) return;

        if (swipeDistance > threshold) {
            // Swipe Left -> Next
            goNextPage();
            isFlipping = true;
            setTimeout(() => { isFlipping = false; }, 500);
        } else if (swipeDistance < -threshold) {
            // Swipe Right -> Prev
            goPrevPage();
            isFlipping = true;
            setTimeout(() => { isFlipping = false; }, 500);
        }
    }, {passive: true});

    // 15. Magic Jump Logic
    const magicInput = document.getElementById('magic-page-num');
    const magicBtn = document.getElementById('magic-continue-btn');
    const magicError = document.getElementById('magic-error');

    if (magicBtn && magicInput) {
        // Press Enter to Trigger
        magicInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                magicBtn.click();
            }
        });

        magicBtn.addEventListener('click', () => {
            const targetPage = parseInt(magicInput.value);
            const totalPages = bookPages.length * 2;

            if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
                magicError.style.display = 'block';
                return;
            }
            magicError.style.display = 'none';

            const targetPosition = Math.floor(targetPage / 2) + 1;

            const performJump = async () => {
                bookPages.forEach(p => p.classList.add('magic-jump-active'));
                
                // Spawn more Roses during jump (Rain only on book area)
                const roseInterval = setInterval(() => {
                    const rose = document.createElement('div');
                    rose.className = 'falling-rose';
                    const icons = ['🌹', '🌸', '🌷', '💖', '✨'];
                    rose.textContent = icons[Math.floor(Math.random() * icons.length)];
                    
                    // Spread across book area (-50% to 150% of 400px width covers the spread)
                    rose.style.left = (Math.random() * 200 - 50) + '%';
                    rose.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
                    
                    const bookBox = document.querySelector('.book-container');
                    if (bookBox) bookBox.appendChild(rose);
                    
                    setTimeout(() => rose.remove(), 3000);
                }, 50); 
                
                if (targetPosition > currLocation) {
                    while (currLocation < targetPosition) {
                        goNextPage();
                        await new Promise(r => setTimeout(r, 100));
                    }
                } else if (targetPosition < currLocation) {
                    while (currLocation > targetPosition) {
                        goPrevPage();
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
                
                // Stop Roses
                clearInterval(roseInterval);
                
                setTimeout(() => {
                    bookPages.forEach(p => p.classList.remove('magic-jump-active'));
                }, 1000);
            };

            performJump();
        });
    }

    bookPages.forEach((page, index) => {
        page.style.zIndex = numOfPapers - index;
    });
}

// --- Magic Heart Search Logic --- 
const heartSearchModal = document.getElementById('heart-search-modal');
const closeSearchModal = document.getElementById('close-search-modal');
const triggerSearch = document.getElementById('trigger-search');
const magicHeartSvg = document.getElementById('magic-heart-svg');
const svgSearchImg = document.getElementById('svg-search-img');
const navBrand = document.querySelector('.nav-brand');

// Ensure resetSearchState is globally available
window.resetSearchState = function() {
    if (!magicHeartSvg) return;
    magicHeartSvg.setAttribute('class', 'magic-heart-svg magic-heart-idle');
    svgSearchImg.style.opacity = '0';
    svgSearchImg.setAttribute('href', '');
    document.querySelector('.search-instruction').textContent = 'Click the heart to find a special memory... ❤️';
};

if (closeSearchModal) {
    closeSearchModal.onclick = () => {
        heartSearchModal.style.display = 'none';
        resetSearchState();
        
        // Restore page default music behavior if it was playing
        if (window.refreshMusicForPage) window.refreshMusicForPage();
    };
}


if (triggerSearch) {
    // 1. CLICK TRIGGER (Start Search)
    triggerSearch.addEventListener('click', (e) => {
        if (!isDraggingHandled) {
            startMagicSearch();
        }
    });

    // 2. DRAG / SWIPE TO SPIN
    let isMouseDown = false;
    let startX = 0;
    let currentRotationY = 0;
    let isDraggingHandled = false;
    let dragStartTime = 0;

    const onStart = (e) => {
        if (isSearching) return;
        isMouseDown = true;
        isDraggingHandled = false;
        dragStartTime = Date.now();
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        
        // Pause idle animation to take manual control
        magicHeartSvg.style.animation = 'none';
        
        // Get current rotation if possible (though we start from 0 for simplicity)
        const transform = window.getComputedStyle(magicHeartSvg).transform;
        // Parsing transform is complex, so we'll just snap to a known value or start at 0
    };

    const onMove = (e) => {
        if (!isMouseDown) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const diffX = x - startX;
        
        if (Math.abs(diffX) > 5) {
            isDraggingHandled = true;
        }

        const sensitivity = 1.0; 
        const newTempRotateY = currentRotationY + (diffX * sensitivity);
        magicHeartSvg.style.transform = `rotateY(${newTempRotateY}deg) scale(1.1)`;
        // Store temp value to be finalized in onEnd
        magicHeartSvg.dataset.tempRotation = newTempRotateY;
    };

    const onEnd = () => {
        if (!isMouseDown) return;
        isMouseDown = false;
        
        if (isDraggingHandled) {
            currentRotationY = parseFloat(magicHeartSvg.dataset.tempRotation) || 0;
        }

        const duration = Date.now() - dragStartTime;
        if (duration < 200 && !isDraggingHandled) {
            // It was a click, animation will be restored by startMagicSearch
        } else {
            // User manually spun it, let's keep it there or restart idle after a while
            setTimeout(() => {
                if (!isMouseDown && !isSearching) {
                    magicHeartSvg.style.animation = 'rotate3DSlow 8s infinite linear';
                }
            }, 3000);
        }
    };

    triggerSearch.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    triggerSearch.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
}

let isSearching = false;


function startMagicSearch() {
    if (isSearching || !magicHeartSvg) return;
    isSearching = true;

    // 1. Change Animation
    magicHeartSvg.style.animation = 'none'; // Clear any manual or idle transforms
    // Force a reflow to restart animation properly if needed
    void magicHeartSvg.offsetWidth;
    magicHeartSvg.setAttribute('class', 'magic-heart-svg magic-heart-spinning');
    document.querySelector('.search-instruction').textContent = 'Searching our beautiful memories...';

    // 2. Start Flashing Images inside SVG
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        const _mem = getUnlockedMemories();
        const randomImg = _mem[Math.floor(Math.random() * _mem.length)];
        svgSearchImg.setAttribute('href', randomImg);
        svgSearchImg.style.opacity = '1';
        flashCount++;
    }, 100);

    // 3. Final Reveal after 2.5 seconds
    setTimeout(() => {
        clearInterval(flashInterval);
        
        const _mem2 = getUnlockedMemories();
        const finalImg = _mem2[Math.floor(Math.random() * _mem2.length)];
        svgSearchImg.setAttribute('href', finalImg);
        svgSearchImg.style.opacity = '1';
        
        // Add reveal class for extra glow and gentle hovering
        magicHeartSvg.setAttribute('class', 'magic-heart-svg revealed');
        magicHeartSvg.style.transformOrigin = 'center center';
        
        document.querySelector('.search-instruction').innerHTML = 'Found it! A moment for you... <br> ❤️ ♾️ ❤️';
        
        setTimeout(() => {
            isSearching = false;
        }, 1500);

    }, 2500);
}

// --- Cloudinary Config and Upload Logic ---
const CLOUDINARY_URL      = 'https://api.cloudinary.com/v1_1/dvlxnbn7c/image/upload';
const CLOUDINARY_VID_URL  = 'https://api.cloudinary.com/v1_1/dvlxnbn7c/video/upload';
// Note: Create an unsigned upload preset named "nisha_upload" in your Cloudinary Dashboard
const CLOUDINARY_UPLOAD_PRESET = 'nisha_upload';

// current upload type: 'image' | 'video'
let currentUploadType = 'image';

const updateGrid = document.getElementById('update-grid');
const uploadModal = document.getElementById('upload-modal');
const openUploadBtn = document.getElementById('open-upload-modal-btn');
const closeUploadBtn = document.getElementById('close-upload');
const imageUploadInput = document.getElementById('image-upload-input');
const uploadFileName = document.getElementById('upload-file-name');
const uploadPreviewContainer = document.getElementById('upload-preview-container');
const uploadPreviewImg = document.getElementById('upload-preview-img');
const uploadCaptionInput = document.getElementById('upload-caption');
const submitUploadBtn = document.getElementById('submit-upload-btn');
const uploadStatus = document.getElementById('upload-status');

// Load stored updates (Newest first)
let updatesList = JSON.parse(localStorage.getItem('nisha_updates')) || [];

// --- Global Sync Images ---
async function syncGlobalUpdates() {
    try {
        let globallyDeleted = new Set();
        try {
            const delRes = await fetch('https://res.cloudinary.com/dvlxnbn7c/raw/list/nk_deleted_marker.json');
            if (delRes.ok) {
                const delData = await delRes.json();
                delData.resources.forEach(r => {
                    if (r.public_id.startsWith('deleted_')) globallyDeleted.add(r.public_id.replace('deleted_', ''));
                });
            }
        } catch(e) {}

        const res = await fetch('https://res.cloudinary.com/dvlxnbn7c/image/list/nk_global_updates.json');
        if (res.ok) {
            const data = await res.json();
            let currentUpdates = JSON.parse(localStorage.getItem('nisha_updates')) || [];
            let hiddenUrls = JSON.parse(localStorage.getItem('nisha_hidden_urls')) || [];
            
            data.resources.forEach(r => {
                if (globallyDeleted.has(r.public_id)) return;
                const url = `https://res.cloudinary.com/dvlxnbn7c/image/upload/v${r.version}/${r.public_id}.${r.format}`;
                if (!hiddenUrls.includes(url) && !currentUpdates.some(u => u.url === url)) {
                    currentUpdates.push({ url: url, caption: '', date: r.created_at });
                }
            });
            currentUpdates = currentUpdates.filter(u => !hiddenUrls.includes(u.url));
            currentUpdates = currentUpdates.filter(u => {
                const pid = u.url.split('/').pop().split('.')[0];
                return !globallyDeleted.has(pid);
            });
            currentUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));
            updatesList = currentUpdates;
            localStorage.setItem('nisha_updates', JSON.stringify(updatesList));
        }
    } catch (e) {
        console.log("Global image sync failed:", e);
    }
    renderUpdates();
    if(typeof renderSettingsGrid === 'function') renderSettingsGrid();
}

function renderUpdates() {
    if (!updateGrid) return;
    updateGrid.innerHTML = '';
    
    let albumAdditions = JSON.parse(localStorage.getItem('nisha_album_additions')) || [];
    
    updatesList.forEach((update, index) => {
        const item = document.createElement('div');
        item.className = 'masonry-item item-medium update-item';
        
        const dateObj = new Date(update.date);
        const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        
        const isInAlbum = albumAdditions.some(a => a.url === update.url);
        
        let albumButtonsHTML = '';
        if (isInAlbum) {
            albumButtonsHTML = `
                <div style="display: flex; align-items: center; margin-top: 10px;">
                    <button class="already-in-album-btn glowing-btn" style="font-size: 0.85rem; padding: 5px 12px; border-radius: 20px; border: none; background: #4CAF50; box-shadow: 0 0 10px #4CAF50; color: white; cursor: default;">
                        <i class="fas fa-check"></i> Already in Album
                    </button>
                    <button class="remove-from-album-btn" data-index="${index}" style="margin-left: 10px; font-size: 0.85rem; padding: 5px 12px; border-radius: 20px; border: 1px solid #4CAF50; background: transparent; color: #4CAF50; cursor: pointer; transition: all 0.2s;" title="Remove from book">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        } else {
            albumButtonsHTML = `
                <button class="add-to-album-btn glowing-btn" data-index="${index}" style="margin-top: 10px; font-size: 0.85rem; padding: 5px 12px; border-radius: 20px; border: none; background: linear-gradient(135deg, var(--primary-pink), var(--primary-purple)); color: white; cursor: pointer;">
                    <i class="fas fa-book-medical"></i> Add to Album
                </button>
            `;
        }
        
        item.innerHTML = `
            <div class="update-image-container" style="position: relative;">
                <img src="${update.url}" alt="Update Image" loading="lazy">
                <button class="delete-update-btn" data-index="${index}" style="position: absolute; top: 10px; right: 10px; background: rgba(255,0,0,0.7); color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: transform 0.2s;" title="Delete this memory">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="update-details" style="position: relative;">
                <div class="update-date">${dateStr}</div>
                ${update.caption ? `<div class="update-caption">${update.caption}</div>` : ''}
                ${albumButtonsHTML}
            </div>
        `;
        updateGrid.appendChild(item);
    });

    // Handle Delete clicks
    document.querySelectorAll('.delete-update-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            const urlToDelete = btnEl.getAttribute('data-url');
            if(confirm('Are you sure you want to delete this picture? It will be removed globally from all devices.')) {
                
                // Show loading state
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting globally...';
                btnEl.style.opacity = '0.7';
                btnEl.disabled = true;

                // 1. Mark globally as deleted
                try {
                    const parts = urlToDelete.split('/');
                    const filenameWithExt = parts[parts.length - 1];
                    const publicId = filenameWithExt.split('.')[0];
                    if (publicId) {
                        const formData = new FormData();
                        formData.append('file', new Blob(['deleted'], {type: 'text/plain'}));
                        formData.append('upload_preset', typeof CLOUDINARY_UPLOAD_PRESET !== 'undefined' ? CLOUDINARY_UPLOAD_PRESET : 'nisha_upload');
                        formData.append('public_id', 'deleted_' + publicId);
                        formData.append('tags', 'nk_deleted_marker');
                        await fetch('https://api.cloudinary.com/v1_1/dvlxnbn7c/raw/upload', {
                            method: 'POST', body: formData
                        });
                    }
                } catch(err) {
                    console.log('Global delete failed:', err);
                }

                // 2. Local cleanup
                let hiddenUrls = JSON.parse(localStorage.getItem('nisha_hidden_urls')) || [];
                if (!hiddenUrls.includes(urlToDelete)) {
                    hiddenUrls.push(urlToDelete);
                    localStorage.setItem('nisha_hidden_urls', JSON.stringify(hiddenUrls));
                }
                
                let curUpdates = JSON.parse(localStorage.getItem('nisha_updates')) || [];
                curUpdates = curUpdates.filter(u => u.url !== urlToDelete);
                localStorage.setItem('nisha_updates', JSON.stringify(curUpdates));
                updatesList = curUpdates;
                
                let curVideos = JSON.parse(localStorage.getItem('nisha_videos')) || [];
                curVideos = curVideos.filter(v => v.url !== urlToDelete);
                localStorage.setItem('nisha_videos', JSON.stringify(curVideos));
                
                renderSettingsGrid();
                if(typeof renderUpdates === 'function') renderUpdates();
                if(typeof renderUploadedVideos === 'function') renderUploadedVideos();
            }
        });
    });

    // Handle "Add to Album" clicks
    document.querySelectorAll('.add-to-album-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            const urlToDelete = btnEl.getAttribute('data-url');
            if(confirm('Are you sure you want to delete this picture? It will be removed globally from all devices.')) {
                
                // Show loading state
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting globally...';
                btnEl.style.opacity = '0.7';
                btnEl.disabled = true;

                // 1. Mark globally as deleted
                try {
                    const parts = urlToDelete.split('/');
                    const filenameWithExt = parts[parts.length - 1];
                    const publicId = filenameWithExt.split('.')[0];
                    if (publicId) {
                        const formData = new FormData();
                        formData.append('file', new Blob(['deleted'], {type: 'text/plain'}));
                        formData.append('upload_preset', typeof CLOUDINARY_UPLOAD_PRESET !== 'undefined' ? CLOUDINARY_UPLOAD_PRESET : 'nisha_upload');
                        formData.append('public_id', 'deleted_' + publicId);
                        formData.append('tags', 'nk_deleted_marker');
                        await fetch('https://api.cloudinary.com/v1_1/dvlxnbn7c/raw/upload', {
                            method: 'POST', body: formData
                        });
                    }
                } catch(err) {
                    console.log('Global delete failed:', err);
                }

                // 2. Local cleanup
                let hiddenUrls = JSON.parse(localStorage.getItem('nisha_hidden_urls')) || [];
                if (!hiddenUrls.includes(urlToDelete)) {
                    hiddenUrls.push(urlToDelete);
                    localStorage.setItem('nisha_hidden_urls', JSON.stringify(hiddenUrls));
                }
                
                let curUpdates = JSON.parse(localStorage.getItem('nisha_updates')) || [];
                curUpdates = curUpdates.filter(u => u.url !== urlToDelete);
                localStorage.setItem('nisha_updates', JSON.stringify(curUpdates));
                updatesList = curUpdates;
                
                let curVideos = JSON.parse(localStorage.getItem('nisha_videos')) || [];
                curVideos = curVideos.filter(v => v.url !== urlToDelete);
                localStorage.setItem('nisha_videos', JSON.stringify(curVideos));
                
                renderSettingsGrid();
                if(typeof renderUpdates === 'function') renderUpdates();
                if(typeof renderUploadedVideos === 'function') renderUploadedVideos();
            }
        });
    });

    // Handle "Remove from Album" clicks
    document.querySelectorAll('.remove-from-album-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            const urlToDelete = btnEl.getAttribute('data-url');
            if(confirm('Are you sure you want to delete this picture? It will be removed globally from all devices.')) {
                
                // Show loading state
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting globally...';
                btnEl.style.opacity = '0.7';
                btnEl.disabled = true;

                // 1. Mark globally as deleted
                try {
                    const parts = urlToDelete.split('/');
                    const filenameWithExt = parts[parts.length - 1];
                    const publicId = filenameWithExt.split('.')[0];
                    if (publicId) {
                        const formData = new FormData();
                        formData.append('file', new Blob(['deleted'], {type: 'text/plain'}));
                        formData.append('upload_preset', typeof CLOUDINARY_UPLOAD_PRESET !== 'undefined' ? CLOUDINARY_UPLOAD_PRESET : 'nisha_upload');
                        formData.append('public_id', 'deleted_' + publicId);
                        formData.append('tags', 'nk_deleted_marker');
                        await fetch('https://api.cloudinary.com/v1_1/dvlxnbn7c/raw/upload', {
                            method: 'POST', body: formData
                        });
                    }
                } catch(err) {
                    console.log('Global delete failed:', err);
                }

                // 2. Local cleanup
                let hiddenUrls = JSON.parse(localStorage.getItem('nisha_hidden_urls')) || [];
                if (!hiddenUrls.includes(urlToDelete)) {
                    hiddenUrls.push(urlToDelete);
                    localStorage.setItem('nisha_hidden_urls', JSON.stringify(hiddenUrls));
                }
                
                let curUpdates = JSON.parse(localStorage.getItem('nisha_updates')) || [];
                curUpdates = curUpdates.filter(u => u.url !== urlToDelete);
                localStorage.setItem('nisha_updates', JSON.stringify(curUpdates));
                updatesList = curUpdates;
                
                let curVideos = JSON.parse(localStorage.getItem('nisha_videos')) || [];
                curVideos = curVideos.filter(v => v.url !== urlToDelete);
                localStorage.setItem('nisha_videos', JSON.stringify(curVideos));
                
                renderSettingsGrid();
                if(typeof renderUpdates === 'function') renderUpdates();
                if(typeof renderUploadedVideos === 'function') renderUploadedVideos();
            }
        });
    });
}

// Initial render
syncGlobalUpdates();

// Handle Modal Open/Close
if (openUploadBtn) {
    // Show the float button if site is unlocked (for pages that hide it by default)
    if (sessionStorage.getItem('site_unlocked') === 'true') {
        const vidFloat = document.getElementById('video-upload-float-container');
        if (vidFloat) vidFloat.style.display = 'block';
    }

    openUploadBtn.addEventListener('click', () => {
        const uploadModal = document.getElementById('upload-modal');
        if (uploadModal) uploadModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        resetUploadForm();
    });
}

const closeUploadBtn2 = document.getElementById('close-upload');
if (closeUploadBtn2) {
    closeUploadBtn2.addEventListener('click', () => {
        const uploadModal = document.getElementById('upload-modal');
        if (uploadModal) uploadModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

function resetUploadForm() {
    if (imageUploadInput) imageUploadInput.value = '';
    const uploadFileName = document.getElementById('upload-file-name');
    const uploadPreviewContainer = document.getElementById('upload-preview-container');
    const uploadPreviewImg = document.getElementById('upload-preview-img');
    const uploadPreviewVideo = document.getElementById('upload-preview-video');
    const uploadCaptionInput = document.getElementById('upload-caption');
    const submitUploadBtn = document.getElementById('submit-upload-btn');
    const uploadBtnText = document.getElementById('upload-btn-text');
    const uploadStatus = document.getElementById('upload-status');

    if (uploadFileName) uploadFileName.textContent = currentUploadType === 'video' ? 'Select Video' : 'Select Photo';
    if (uploadPreviewContainer) uploadPreviewContainer.classList.add('hidden');
    if (uploadPreviewImg) { uploadPreviewImg.src = ''; uploadPreviewImg.style.display = 'none'; }
    if (uploadPreviewVideo) { uploadPreviewVideo.src = ''; uploadPreviewVideo.style.display = 'none'; }
    if (uploadCaptionInput) uploadCaptionInput.value = '';
    if (submitUploadBtn) submitUploadBtn.disabled = true;
    if (uploadBtnText) uploadBtnText.textContent = currentUploadType === 'video' ? 'Upload Video' : 'Upload Photo';
    if (uploadStatus) uploadStatus.textContent = '';
}

// --- Upload Type Toggle ---
const uploadTypeImageBtn = document.getElementById('upload-type-image');
const uploadTypeVideoBtn = document.getElementById('upload-type-video');

if (uploadTypeImageBtn && uploadTypeVideoBtn) {
    const setUploadType = (type) => {
        currentUploadType = type;
        const isVideo = type === 'video';
        uploadTypeImageBtn.classList.toggle('active', !isVideo);
        uploadTypeVideoBtn.classList.toggle('active', isVideo);
        // Update file input accept
        if (imageUploadInput) imageUploadInput.accept = isVideo ? 'video/*' : 'image/*';
        // Update label icon
        const labelIcon = document.querySelector('#upload-label i');
        if (labelIcon) labelIcon.className = isVideo ? 'fas fa-film fa-3x' : 'fas fa-cloud-upload-alt fa-3x';
        // Reset form text
        resetUploadForm();
    };
    uploadTypeImageBtn.addEventListener('click', () => setUploadType('image'));
    uploadTypeVideoBtn.addEventListener('click', () => setUploadType('video'));
}

// Handle File Selection (Image OR Video)
if (imageUploadInput) {
    imageUploadInput.addEventListener('change', function() {
        const file = this.files[0];
        const uploadFileName = document.getElementById('upload-file-name');
        const uploadPreviewContainer = document.getElementById('upload-preview-container');
        const uploadPreviewImg = document.getElementById('upload-preview-img');
        const uploadPreviewVideo = document.getElementById('upload-preview-video');
        const submitUploadBtn = document.getElementById('submit-upload-btn');
        if (file) {
            if (uploadFileName) uploadFileName.textContent = file.name;
            if (uploadPreviewContainer) uploadPreviewContainer.classList.remove('hidden');
            if (currentUploadType === 'video') {
                if (uploadPreviewImg) uploadPreviewImg.style.display = 'none';
                if (uploadPreviewVideo) {
                    uploadPreviewVideo.src = URL.createObjectURL(file);
                    uploadPreviewVideo.style.display = 'block';
                }
            } else {
                if (uploadPreviewVideo) uploadPreviewVideo.style.display = 'none';
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (uploadPreviewImg) {
                        uploadPreviewImg.src = e.target.result;
                        uploadPreviewImg.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
            if (submitUploadBtn) submitUploadBtn.disabled = false;
        } else {
            resetUploadForm();
        }
    });
}

// Handle Upload to Cloudinary (Image OR Video)
if (submitUploadBtn) {
    submitUploadBtn.addEventListener('click', async () => {
        const submitUploadBtn  = document.getElementById('submit-upload-btn');
        const uploadCaptionInput = document.getElementById('upload-caption');
        const uploadStatus     = document.getElementById('upload-status');
        const file = imageUploadInput ? imageUploadInput.files[0] : null;
        if (!file) return;

        submitUploadBtn.disabled = true;
        submitUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        if (uploadStatus) {
            uploadStatus.textContent = 'Uploading to Cloudinary...';
            uploadStatus.style.color = 'var(--deep-red)';
        }

        const isVideo = currentUploadType === 'video';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        if (isVideo) {
            formData.append('folder', 'nk_uploaded_videos');
            formData.append('tags', 'nk_global_videos');
        } else {
            formData.append('tags', 'nk_global_updates');
        }

        const endpoint = isVideo ? CLOUDINARY_VID_URL : CLOUDINARY_URL;

        try {
            const response = await fetch(endpoint, { method: 'POST', body: formData });
            const data = await response.json();

            if (data.secure_url) {
                const caption = uploadCaptionInput ? uploadCaptionInput.value.trim() : '';

                if (isVideo) {
                    // Store in videos list
                    let videosList = JSON.parse(localStorage.getItem('nisha_videos')) || [];
                    videosList.unshift({
                        url: data.secure_url,
                        caption: caption,
                        date: new Date().toISOString()
                    });
                    localStorage.setItem('nisha_videos', JSON.stringify(videosList));
                    renderUploadedVideos();
                } else {
                    // Store in updates list (images)
                    const newUpdate = {
                        url: data.secure_url,
                        caption: caption,
                        date: new Date().toISOString()
                    };
                    updatesList.unshift(newUpdate);
                    localStorage.setItem('nisha_updates', JSON.stringify(updatesList));
                    renderUpdates();
                }

                if (uploadStatus) {
                    uploadStatus.textContent = 'Uploaded successfully! ❤️';
                    uploadStatus.style.color = '#4CAF50';
                }

                setTimeout(() => {
                    const uploadModal = document.getElementById('upload-modal');
                    if (uploadModal) uploadModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    if (!isVideo) window.location.hash = '#update';
                }, 1500);
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            if (uploadStatus) {
                uploadStatus.textContent = 'Failed: ' + error.message;
                uploadStatus.style.color = 'var(--deep-red)';
            }
            submitUploadBtn.disabled = false;
            submitUploadBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span id="upload-btn-text">' + (isVideo ? 'Upload Video' : 'Upload Photo') + '</span>';
        }
    });
}

// --- Render Uploaded Videos (on videos.html) ---
function renderUploadedVideos() {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    // Remove previously rendered uploaded videos (those with class nk-uploaded-video)
    document.querySelectorAll('.nk-uploaded-video').forEach(el => el.remove());

    const videosList = JSON.parse(localStorage.getItem('nisha_videos')) || [];
    const deleteVideoModal = document.getElementById('delete-video-modal');

    videosList.forEach((vid, index) => {
        const container = document.createElement('div');
        container.className = 'video-container glass-card nk-uploaded-video';
        container.style.position = 'relative';

        const dateObj = new Date(vid.date);
        const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        container.innerHTML = `
            <video class="custom-video" preload="metadata" loop playsinline controlsList="nodownload noplaybackrate" disablePictureInPicture>
                <source src="${vid.url}" type="video/mp4">
                Your browser does not support HTML5 video.
            </video>
            <div class="video-overlay vid-overlay">
                <div class="play-btn glowing-btn play-btn-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-controls vid-controls">
                <button class="play-pause"><i class="fas fa-pause"></i></button>
                <div class="progress-bar"><div class="progress-filled"></div></div>
                <button class="mute"><i class="fas fa-volume-up"></i></button>
            </div>
            ${vid.caption ? `<div style="padding:8px 12px;font-size:0.9rem;font-family:var(--font-handwriting);font-weight:600;color:var(--text-main);background:rgba(255,255,255,0.8);">${vid.caption}</div>` : ''}
            <div style="padding:4px 12px 8px;font-size:0.75rem;color:var(--primary-pink);font-weight:600;background:rgba(255,255,255,0.8);">${dateStr}</div>
            <!-- Delete Button -->
            <button class="nk-video-delete-btn" data-index="${index}" title="Delete this video" style="position:absolute;top:10px;right:10px;background:rgba(255,0,0,0.75);color:white;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);box-shadow:0 4px 10px rgba(0,0,0,0.2);transition:transform 0.2s;z-index:10;">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        videoGrid.appendChild(container);
    });

    // Re-init video controls for newly added videos
    document.querySelectorAll('.nk-uploaded-video').forEach(container => {
        const video         = container.querySelector('.custom-video');
        const vidOverlay    = container.querySelector('.vid-overlay');
        const playBtnOverlay = container.querySelector('.play-btn-overlay');
        const playPauseBtn  = container.querySelector('.play-pause');
        const muteBtn       = container.querySelector('.mute');
        const progressBar   = container.querySelector('.progress-bar');
        const progressFilled = container.querySelector('.progress-filled');
        if (!video) return;

        const togglePlay = () => {
            if (video.paused) {
                document.querySelectorAll('.custom-video').forEach(v => {
                    if (v !== video) {
                        v.pause();
                        const ov = v.closest('.video-container');
                        if (ov) {
                            const o = ov.querySelector('.vid-overlay');
                            const p = ov.querySelector('.play-pause');
                            if (o) o.classList.remove('hidden');
                            if (p) p.innerHTML = '<i class="fas fa-play"></i>';
                        }
                    }
                });
                video.play();
                vidOverlay.classList.add('hidden');
                if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                video.pause();
                vidOverlay.classList.remove('hidden');
                if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        };
        if (playBtnOverlay) playBtnOverlay.addEventListener('click', togglePlay);
        if (playPauseBtn)  playPauseBtn.addEventListener('click', togglePlay);
        video.addEventListener('click', togglePlay);
        video.addEventListener('timeupdate', () => {
            if (progressFilled && video.duration) {
                progressFilled.style.width = `${(video.currentTime / video.duration) * 100}%`;
            }
        });
        if (progressBar) progressBar.addEventListener('click', (e) => {
            video.currentTime = (e.offsetX / progressBar.offsetWidth) * video.duration;
        });
        if (muteBtn) muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });
    });

    // Handle delete button clicks
    document.querySelectorAll('.nk-video-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            const urlToDelete = btnEl.getAttribute('data-url');
            if(confirm('Are you sure you want to delete this picture? It will be removed globally from all devices.')) {
                
                // Show loading state
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting globally...';
                btnEl.style.opacity = '0.7';
                btnEl.disabled = true;

                // 1. Mark globally as deleted
                try {
                    const parts = urlToDelete.split('/');
                    const filenameWithExt = parts[parts.length - 1];
                    const publicId = filenameWithExt.split('.')[0];
                    if (publicId) {
                        const formData = new FormData();
                        formData.append('file', new Blob(['deleted'], {type: 'text/plain'}));
                        formData.append('upload_preset', typeof CLOUDINARY_UPLOAD_PRESET !== 'undefined' ? CLOUDINARY_UPLOAD_PRESET : 'nisha_upload');
                        formData.append('public_id', 'deleted_' + publicId);
                        formData.append('tags', 'nk_deleted_marker');
                        await fetch('https://api.cloudinary.com/v1_1/dvlxnbn7c/raw/upload', {
                            method: 'POST', body: formData
                        });
                    }
                } catch(err) {
                    console.log('Global delete failed:', err);
                }

                // 2. Local cleanup
                let hiddenUrls = JSON.parse(localStorage.getItem('nisha_hidden_urls')) || [];
                if (!hiddenUrls.includes(urlToDelete)) {
                    hiddenUrls.push(urlToDelete);
                    localStorage.setItem('nisha_hidden_urls', JSON.stringify(hiddenUrls));
                }
                
                let curUpdates = JSON.parse(localStorage.getItem('nisha_updates')) || [];
                curUpdates = curUpdates.filter(u => u.url !== urlToDelete);
                localStorage.setItem('nisha_updates', JSON.stringify(curUpdates));
                updatesList = curUpdates;
                
                let curVideos = JSON.parse(localStorage.getItem('nisha_videos')) || [];
                curVideos = curVideos.filter(v => v.url !== urlToDelete);
                localStorage.setItem('nisha_videos', JSON.stringify(curVideos));
                
                renderSettingsGrid();
                if(typeof renderUpdates === 'function') renderUpdates();
                if(typeof renderUploadedVideos === 'function') renderUploadedVideos();
            }
        });
    });
}

// --- Global Sync ---
async function syncGlobalVideos() {
    try {
        let globallyDeleted = new Set();
        try {
            const delRes = await fetch('https://res.cloudinary.com/dvlxnbn7c/raw/list/nk_deleted_marker.json');
            if (delRes.ok) {
                const delData = await delRes.json();
                delData.resources.forEach(r => {
                    if (r.public_id.startsWith('deleted_')) globallyDeleted.add(r.public_id.replace('deleted_', ''));
                });
            }
        } catch(e) {}

        const res = await fetch('https://res.cloudinary.com/dvlxnbn7c/video/list/nk_global_videos.json');
        if (res.ok) {
            const data = await res.json();
            let videosList = JSON.parse(localStorage.getItem('nisha_videos')) || [];
            let hiddenUrls = JSON.parse(localStorage.getItem('nisha_hidden_urls')) || [];
            
            data.resources.forEach(r => {
                if (globallyDeleted.has(r.public_id)) return;
                const url = `https://res.cloudinary.com/dvlxnbn7c/video/upload/v${r.version}/${r.public_id}.${r.format}`;
                if (!hiddenUrls.includes(url) && !videosList.some(v => v.url === url)) {
                    videosList.push({ url: url, caption: '', date: r.created_at });
                }
            });
            videosList = videosList.filter(v => !hiddenUrls.includes(v.url));
            videosList = videosList.filter(v => {
                const pid = v.url.split('/').pop().split('.')[0];
                return !globallyDeleted.has(pid);
            });
            videosList.sort((a, b) => new Date(b.date) - new Date(a.date));
            localStorage.setItem('nisha_videos', JSON.stringify(videosList));
        }
    } catch (e) {
        console.log("Global sync failed:", e);
    }
    renderUploadedVideos();
    if(typeof renderSettingsGrid === 'function') renderSettingsGrid();
}

// Initial render of uploaded videos if on videos page
syncGlobalVideos();

// --- Settings Page Logic ---
function renderSettingsGrid() {
    const settingsGrid = document.getElementById('settings-grid');
    if (!settingsGrid) return;
    
    settingsGrid.innerHTML = '';
    
    const updates = JSON.parse(localStorage.getItem('nisha_updates')) || [];
    const videos = JSON.parse(localStorage.getItem('nisha_videos')) || [];
    
    const allMedia = [...updates.map(u => ({...u, type: 'image'})), ...videos.map(v => ({...v, type: 'video'}))];
    allMedia.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allMedia.length === 0) {
        settingsGrid.innerHTML = '<p style="color: white; grid-column: 1/-1; text-align: center;">No uploaded pictures or videos found.</p>';
        return;
    }
    
    allMedia.forEach((media) => {
        const item = document.createElement('div');
        item.className = 'glass-card';
        item.style.position = 'relative';
        item.style.padding = '10px';
        item.style.borderRadius = '15px';
        item.style.overflow = 'hidden';
        
        let mediaHtml = '';
        if (media.type === 'image') {
            mediaHtml = `<img src="${media.url}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;" alt="Uploaded pic">`;
        } else {
            mediaHtml = `<video src="${media.url}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;" controls preload="metadata"></video>`;
        }
        
        item.innerHTML = `
            ${mediaHtml}
            <button class="delete-media-btn glowing-btn" data-url="${media.url}" style="margin-top: 15px; width: 100%; background: #ff4b6a; border: none; border-radius: 8px; color: white; padding: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold;">
                <i class="fas fa-trash-alt"></i> Delete Picture
            </button>
        `;
        settingsGrid.appendChild(item);
    });
    
    document.querySelectorAll('.delete-media-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            const urlToDelete = btnEl.getAttribute('data-url');
            if(confirm('Are you sure you want to delete this picture? It will be removed globally from all devices.')) {
                
                // Show loading state
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting globally...';
                btnEl.style.opacity = '0.7';
                btnEl.disabled = true;

                // 1. Mark globally as deleted
                try {
                    const parts = urlToDelete.split('/');
                    const filenameWithExt = parts[parts.length - 1];
                    const publicId = filenameWithExt.split('.')[0];
                    if (publicId) {
                        const formData = new FormData();
                        formData.append('file', new Blob(['deleted'], {type: 'text/plain'}));
                        formData.append('upload_preset', typeof CLOUDINARY_UPLOAD_PRESET !== 'undefined' ? CLOUDINARY_UPLOAD_PRESET : 'nisha_upload');
                        formData.append('public_id', 'deleted_' + publicId);
                        formData.append('tags', 'nk_deleted_marker');
                        await fetch('https://api.cloudinary.com/v1_1/dvlxnbn7c/raw/upload', {
                            method: 'POST', body: formData
                        });
                    }
                } catch(err) {
                    console.log('Global delete failed:', err);
                }

                // 2. Local cleanup
                let hiddenUrls = JSON.parse(localStorage.getItem('nisha_hidden_urls')) || [];
                if (!hiddenUrls.includes(urlToDelete)) {
                    hiddenUrls.push(urlToDelete);
                    localStorage.setItem('nisha_hidden_urls', JSON.stringify(hiddenUrls));
                }
                
                let curUpdates = JSON.parse(localStorage.getItem('nisha_updates')) || [];
                curUpdates = curUpdates.filter(u => u.url !== urlToDelete);
                localStorage.setItem('nisha_updates', JSON.stringify(curUpdates));
                updatesList = curUpdates;
                
                let curVideos = JSON.parse(localStorage.getItem('nisha_videos')) || [];
                curVideos = curVideos.filter(v => v.url !== urlToDelete);
                localStorage.setItem('nisha_videos', JSON.stringify(curVideos));
                
                renderSettingsGrid();
                if(typeof renderUpdates === 'function') renderUpdates();
                if(typeof renderUploadedVideos === 'function') renderUploadedVideos();
            }
        });
    });
}
renderSettingsGrid();
