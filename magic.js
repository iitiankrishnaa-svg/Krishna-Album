document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for Reduced Motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 2. 3D Interactive Cubes
    const cubes = document.querySelectorAll('.magic-cube-container');
    
    cubes.forEach((cube, index) => {
        let isDragging = false;
        let startX, startY;
        
        // Give each cube a slightly different initial rotation to look natural
        let currentX = 25 + (index * 15);
        let currentY = -15 - (index * 5);
        let targetX = currentX;
        let targetY = currentY;
        
        cube.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
        });
        
        window.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            targetX += dx * 0.4;
            targetY -= dy * 0.4; // inverted for natural drag feel
            
            startX = e.clientX;
            startY = e.clientY;
        });
        
        window.addEventListener('pointerup', () => {
            isDragging = false;
        });
        
        function animateCube() {
            if (!prefersReducedMotion) {
                // Auto spin slowly when not dragging
                if (!isDragging) {
                    targetX += 0.15;
                    targetY += 0.05;
                }
            }
            
            // Smooth lerp interpolation
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;
            
            cube.style.transform = `rotateX(${currentY}deg) rotateY(${currentX}deg)`;
            requestAnimationFrame(animateCube);
        }
        
        animateCube();
    });

    // 3. Interactive Canvas Background
    if (!prefersReducedMotion) {
        initMagicCanvas();
    }
});

function initMagicCanvas() {
    const canvas = document.getElementById('magic-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    let width, height;
    let particles = [];
    
    let mouse = { x: -1000, y: -1000, speed: 0 };
    let lastMouse = { x: -1000, y: -1000 };
    let isTouching = false;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Physics & Visual Configuration
    const config = {
        influenceRadius: 280,   // How far the cursor magnetic field reaches
        baseSpring: 0.008,      // How strongly particles want to return to their home position
        friction: 0.82,         // Damping to prevent infinite oscillation
        maxAttraction: 0.045,   // Magnetic pull strength when cursor is SLOW
        minAttraction: 0.002,   // Magnetic pull strength when cursor is FAST
        connectionDist: 140,    // Maximum distance for drawing web lines
        lineColor: '255, 118, 150', // Pinkish theme
        maxSpeed: 60            // Speed threshold for interpolation
    };

    function resize() {
        width = canvas.parentElement.clientWidth;
        height = canvas.parentElement.clientHeight;
        canvas.width = width;
        canvas.height = height;
        initParticles();
    }
    window.addEventListener('resize', resize);

    function initParticles() {
        particles = [];
        let area = width * height;
        let isMobile = window.innerWidth < 768;
        // Optimal count: dense enough for a web, sparse enough for 60fps
        let count = Math.min(Math.floor(area / (isMobile ? 12000 : 7000)), 400);
        
        if (prefersReducedMotion) count = Math.floor(count * 0.4);

        for (let i = 0; i < count; i++) {
            let bx = Math.random() * width;
            let by = Math.random() * height;
            particles.push({
                id: i,
                x: bx,
                y: by,
                baseX: bx,
                baseY: by,
                vx: 0,
                vy: 0,
                radius: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.7 + 0.1,
                driftX: (Math.random() - 0.5) * 0.5,
                driftY: (Math.random() - 0.5) * 0.5,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    // Interaction Listeners (Listening globally since canvas is fixed background)
    window.addEventListener('pointermove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        isTouching = true;
    }, {passive: true});

    document.documentElement.addEventListener('pointerleave', () => {
        isTouching = false;
        mouse.x = -1000;
        mouse.y = -1000;
    });

    function updatePhysics() {
        // Calculate raw cursor speed
        let dx = mouse.x - lastMouse.x;
        let dy = mouse.y - lastMouse.y;
        let rawSpeed = Math.sqrt(dx * dx + dy * dy);
        
        // Smooth the speed to prevent erratic physics jumps
        mouse.speed = mouse.speed * 0.75 + rawSpeed * 0.25;
        
        lastMouse.x = mouse.x;
        lastMouse.y = mouse.y;

        // Map speed to attraction force: Slow = High Attraction, Fast = Low Attraction
        let speedFactor = Math.min(mouse.speed / config.maxSpeed, 1.0);
        let currentAttraction = config.maxAttraction - (config.maxAttraction - config.minAttraction) * speedFactor;

        if (prefersReducedMotion) currentAttraction = 0;

        // Spatial Grid for O(N) neighbor connecting
        const cellSize = config.connectionDist;
        const grid = new Map();
        
        function getCellKey(x, y) {
            return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
        }

        // Apply physics to particles
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            
            // 1. Natural Organic Drift
            p.angle += 0.015;
            let driftTargetX = p.baseX + Math.sin(p.angle) * 20 * p.driftX;
            let driftTargetY = p.baseY + Math.cos(p.angle) * 20 * p.driftY;

            // 2. Magnetic Cursor Attraction (only if touching and close enough)
            if (isTouching && !prefersReducedMotion) {
                let dX = mouse.x - p.x;
                let dY = mouse.y - p.y;
                let distSq = dX * dX + dY * dY;
                let infSq = config.influenceRadius * config.influenceRadius;

                if (distSq < infSq) {
                    let dist = Math.sqrt(distSq);
                    // Force gets stronger closer to the cursor
                    let force = (1 - dist / config.influenceRadius) * currentAttraction;
                    p.vx += dX * force;
                    p.vy += dY * force;
                }
            }

            // 3. Spring Force (pulls particle back to its natural resting place)
            // If the cursor moves too fast, currentAttraction drops, and this spring force takes over,
            // yanking the particle out of the cursor's grip (inertia effect).
            let sX = driftTargetX - p.x;
            let sY = driftTargetY - p.y;
            p.vx += sX * config.baseSpring;
            p.vy += sY * config.baseSpring;

            // 4. Friction/Damping
            p.vx *= config.friction;
            p.vy *= config.friction;

            // 5. Update Position
            p.x += p.vx;
            p.y += p.vy;

            // 6. Assign to spatial grid for web rendering
            let key = getCellKey(p.x, p.y);
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(p);
        }

        return grid;
    }

    function draw(grid) {
        // Clear background
        ctx.fillStyle = '#030005';
        ctx.fillRect(0, 0, width, height);

        const cellSize = config.connectionDist;
        const cellDistSq = cellSize * cellSize;

        // Render Spider-Web Lines using Spatial Hash
        ctx.lineWidth = 0.8;
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            
            let cx = Math.floor(p.x / cellSize);
            let cy = Math.floor(p.y / cellSize);
            
            // Check current and adjacent 8 cells only
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    let key = `${cx + x},${cy + y}`;
                    if (grid.has(key)) {
                        let neighbors = grid.get(key);
                        for (let j = 0; j < neighbors.length; j++) {
                            let p2 = neighbors[j];
                            // Prevent drawing line twice (A->B, B->A) or to self
                            if (p2.id <= p.id) continue;
                            
                            let dx = p.x - p2.x;
                            let dy = p.y - p2.y;
                            let distSq = dx * dx + dy * dy;
                            
                            if (distSq < cellDistSq) {
                                let dist = Math.sqrt(distSq);
                                // Lines fade out smoothly at the edge of the connection distance
                                let opacity = (1 - dist / cellSize) * 0.45 * p.opacity;
                                
                                ctx.strokeStyle = `rgba(${config.lineColor}, ${opacity})`;
                                ctx.beginPath();
                                ctx.moveTo(p.x, p.y);
                                ctx.lineTo(p2.x, p2.y);
                                ctx.stroke();
                            }
                        }
                    }
                }
            }
            
            // Render Anchor Particle
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render subtle cursor glow
        if (isTouching && !prefersReducedMotion) {
            let glowGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
            glowGrad.addColorStop(0, `rgba(${config.lineColor}, 0.08)`);
            glowGrad.addColorStop(1, `rgba(${config.lineColor}, 0)`);
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function loop() {
        requestAnimationFrame(loop);
        const grid = updatePhysics();
        draw(grid);
    }

    resize();
    loop();
}
