document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for Reduced Motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 2. 3D Tilt Cards
    const cards = document.querySelectorAll('.magic-card');
    
    cards.forEach(card => {
        // Only apply tilt if reduced motion is false and on non-touch devices ideally, 
        // but pointer events handle both gracefully.
        if (!prefersReducedMotion) {
            card.addEventListener('pointermove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element
                const y = e.clientY - rect.top;  // y position within the element
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate tilt (max 8 degrees)
                const rotateX = ((y - centerY) / centerY) * -8;
                const rotateY = ((x - centerX) / centerX) * 8;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                
                // Update glow position
                const glow = card.querySelector('.magic-card-glow');
                if(glow) {
                    // center glow on pointer
                    glow.style.transform = `translate(${x - 150}px, ${y - 150}px)`; // 150 is half the width/height of glow
                    glow.style.opacity = '1';
                }
            });
            
            card.addEventListener('pointerleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
                const glow = card.querySelector('.magic-card-glow');
                if(glow) glow.style.opacity = '0';
            });
        }
    });

    // 3. Interactive Canvas Background
    if (!prefersReducedMotion) {
        initMagicCanvas();
    }
});

function initMagicCanvas() {
    const canvas = document.getElementById('magic-bg-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false }); // alpha: false for performance if drawing solid background
    let width, height;
    
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    
    // Resize handler
    const resize = () => {
        const parent = canvas.parentElement;
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
        initParticles();
    };
    window.addEventListener('resize', resize);
    
    // Mouse tracking for parallax
    canvas.parentElement.addEventListener('pointermove', (e) => {
        const rect = canvas.getBoundingClientRect();
        targetMouseX = e.clientX - rect.left;
        targetMouseY = e.clientY - rect.top;
    });

    function initParticles() {
        particles = [];
        // Keep particle count reasonable for performance
        const count = Math.min(Math.floor(width / 30), 50); 
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 0.5,
                baseX: Math.random() * width,
                baseY: Math.random() * height,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.02,
                glowSize: Math.random() * 30 + 10,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        
        // Solid dark background
        ctx.fillStyle = '#030005';
        ctx.fillRect(0, 0, width, height);
        
        // Smooth mouse follow
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        
        // Render blobs/particles
        particles.forEach(p => {
            // Natural floating
            p.angle += p.spin;
            p.baseX += p.speedX;
            p.baseY += p.speedY;
            
            // Wrap around edges gracefully
            if (p.baseX > width + 50) p.baseX = -50;
            if (p.baseX < -50) p.baseX = width + 50;
            if (p.baseY > height + 50) p.baseY = -50;
            if (p.baseY < -50) p.baseY = height + 50;
            
            // Parallax based on mouse
            const parallaxX = (mouseX - width/2) * (p.size * 0.02);
            const parallaxY = (mouseY - height/2) * (p.size * 0.02);
            
            p.x = p.baseX + Math.sin(p.angle) * 20 - parallaxX;
            p.y = p.baseY + Math.cos(p.angle) * 20 - parallaxY;
            
            // Draw soft glowing orb
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowSize);
            gradient.addColorStop(0, `rgba(255, 118, 150, ${p.opacity})`);
            gradient.addColorStop(1, 'rgba(255, 118, 150, 0)');
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw tiny solid core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 1.5})`;
            ctx.fill();
        });
    }

    resize();
    animate();
}
