document.addEventListener('DOMContentLoaded', init3DCarousel);

function init3DCarousel() {
    const container = document.getElementById('globe-carousel-container');
    if (!container) return;
    
    // Change touch-action to pan-y to allow vertical page scrolling on mobile
    container.style.touchAction = 'pan-y';

    // 1. Extract Data
    const slideData = [];
    
    // a) From HTML
    const dataSource = document.getElementById('globe-data-source');
    if(dataSource) {
        const slides = dataSource.querySelectorAll('.carousel-slide');
        slides.forEach(slide => {
            const img = slide.querySelector('img');
            if(!img) return;
            
            let src = img.getAttribute('src');
            if (!src && img.getAttribute('data-protected-src')) {
                try { src = atob(img.getAttribute('data-protected-src')); } catch(e){}
            }
            
            const titleEl = slide.querySelector('h3');
            const descEl = slide.querySelector('p');
            const dateEl = slide.querySelector('.carousel-date');
            
            if(src) {
                slideData.push({
                    src: src,
                    title: titleEl ? titleEl.textContent : 'Memory',
                    desc: descEl ? descEl.textContent : '',
                    date: dateEl ? dateEl.textContent : ''
                });
            }
        });
    }

    // b) From Global Array (_rawMemories)
    if (typeof _rawMemories !== 'undefined' && Array.isArray(_rawMemories)) {
        _rawMemories.forEach(encoded => {
            try {
                const src = atob(encoded);
                if (!slideData.find(d => d.src === src)) {
                    slideData.push({
                        src: src,
                        title: 'Sweet Memory',
                        desc: 'A precious moment forever recorded in our hearts.',
                        date: ''
                    });
                }
            } catch(e) {}
        });
    }

    // c) From Uploaded Gallery (nisha_updates)
    const updatesList = JSON.parse(localStorage.getItem('nisha_updates')) || [];
    updatesList.forEach(update => {
        if (update.url && !slideData.find(d => d.src === update.url)) {
            let dateStr = '';
            if (update.date) {
                const d = new Date(update.date);
                dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            }
            slideData.push({
                src: update.url,
                title: 'Uploaded Memory',
                desc: update.caption || 'A beautifully shared moment.',
                date: dateStr
            });
        }
    });

    if (slideData.length === 0) return;

    // 2. Three.js Setup
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 500);
    camera.position.z = 9; // Stepped back slightly for better mobile fit

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    // Removed the point light that was causing the sun glare effect.
    // Boosted AmbientLight to 1.0 for flat, even lighting.
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    scene.add(camera);

    // 3. Create Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    
    // Create Neon Glow Mesh (Hidden by default)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext('2d');
    const glowGrad = glowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    glowGrad.addColorStop(0, 'rgba(255, 70, 150, 0.8)');
    glowGrad.addColorStop(0.5, 'rgba(255, 70, 150, 0.3)');
    glowGrad.addColorStop(1, 'rgba(255, 70, 150, 0)');
    glowCtx.fillStyle = glowGrad;
    glowCtx.fillRect(0, 0, 256, 256);
    
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        map: glowTexture, 
        transparent: true, 
        blending: THREE.AdditiveBlending, 
        opacity: 0,
        depthWrite: false
    });
    const glowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMaterial);
    globeGroup.add(glowMesh);

    // Duplicate slides to ensure a lush, dense globe (at least 6-8 items)
    let displayData = [...slideData];
    if (displayData.length > 0 && displayData.length < 8) {
        while(displayData.length < 8) {
            displayData = displayData.concat(slideData);
        }
    }

    // Decrease the spacing multiplier (0.50 instead of 0.65) to bring pictures closer
    const radius = Math.max(4.0, displayData.length * 0.50);
    
    // Update camera to always be comfortably outside the globe
    // Increased the distance to shrink the overall size of the globe
    let baseCameraZ = radius + 9.5; 
    if(window.innerWidth < 768) {
        baseCameraZ = radius + 15.0; // Step back even further on mobile
    }
    camera.position.z = baseCameraZ;
    
    const textureLoader = new THREE.TextureLoader();
    const meshes = [];

    displayData.forEach((data, index) => {
        const angle = (index / displayData.length) * Math.PI * 2;
        
        const geometry = new THREE.PlaneGeometry(3, 4); // default 3:4 portrait
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 1.0,  // Flat lighting
            metalness: 0.0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0,
            emissive: new THREE.Color(0x000000)
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Position in a circle
        mesh.position.x = Math.sin(angle) * radius;
        mesh.position.z = Math.cos(angle) * radius;
        
        // Orient to face OUTWARD from the center
        mesh.rotation.y = angle;
        
        mesh.userData = { 
            angle: angle, 
            index: index, 
            data: data
        };

        globeGroup.add(mesh);
        meshes.push(mesh);

        // Load Texture
        if(data.src) {
            textureLoader.load(data.src, (texture) => {
                const aspect = texture.image.width / texture.image.height;
                
                // Calculate maximum allowed width to prevent overlap
                const arcLength = (2 * Math.PI * radius) / displayData.length;
                let maxAllowedWidth = arcLength * 0.95; // Leave 5% gap (much closer)
                maxAllowedWidth = Math.min(maxAllowedWidth, 6.0); // Absolute max width cap
                
                const maxAllowedHeight = 3.5;
                
                // Keep exact aspect ratio
                let targetW = maxAllowedHeight * aspect;
                let targetH = maxAllowedHeight;
                
                // If it's a wide landscape image, scale it down proportionally to fit the safe width
                if (targetW > maxAllowedWidth) {
                    targetW = maxAllowedWidth;
                    targetH = maxAllowedWidth / aspect;
                }
                
                mesh.geometry.dispose();
                mesh.geometry = new THREE.PlaneGeometry(targetW, targetH);
                
                texture.generateMipmaps = true;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                
                material.map = texture;
                material.needsUpdate = true;
                
                // Smooth fade in
                gsap.to(material, { opacity: 1, duration: 1.5 });
            });
        }
    });

    // 4. Interaction & Controls
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoRotateSpeed = prefersReducedMotion ? 0 : 0.0008; // Slower speed
    let autoRotateDirection = 1; // 1 for left-to-right, -1 for right-to-left
    
    let isDragging = false;
    let dragDistance = 0;
    let previousX = 0;
    let previousY = 0;
    let velocity = 0;
    let targetRotation = 0;
    let isInteracting = false;
    let selectedMesh = null;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function deselectAll() {
        if (!selectedMesh) return;
        
        gsap.to(selectedMesh.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
        gsap.to(selectedMesh.material.emissive, { r: 0, g: 0, b: 0, duration: 0.4 });
        
        // Hide neon glow
        gsap.to(glowMesh.material, { opacity: 0, duration: 0.4 });
        
        selectedMesh = null;
    }

    function selectMesh(mesh) {
        if(selectedMesh === mesh) return;
        deselectAll();
        selectedMesh = mesh;
        
        // Premium subtle glow & pop scale
        gsap.to(mesh.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.6, ease: "back.out(1.5)" });
        // Only a tiny emissive so the photo isn't overly tinted
        gsap.to(mesh.material.emissive, { r: 0.05, g: 0.0, b: 0.02, duration: 0.6 });
        
        // Position and show neon glow sprite directly behind the image
        glowMesh.position.copy(mesh.position);
        glowMesh.rotation.copy(mesh.rotation);
        // Push slightly toward center so it's behind the image
        const angle = mesh.userData.angle;
        glowMesh.position.x = Math.sin(angle) * (radius - 0.2);
        glowMesh.position.z = Math.cos(angle) * (radius - 0.2);
        
        // Scale glow based on image size
        const imgW = mesh.geometry.parameters.width || 3.5;
        const imgH = mesh.geometry.parameters.height || 3.5;
        glowMesh.scale.set(imgW + 2.0, imgH + 2.0, 1);
        
        gsap.to(glowMesh.material, { opacity: 1, duration: 0.6 });
        
        // Calculate shortest path rotation to bring mesh to center
        let currentGroupRot = globeGroup.rotation.y % (Math.PI * 2);
        if (currentGroupRot < 0) currentGroupRot += Math.PI * 2;
        
        let targetMeshRot = mesh.userData.angle;
        let targetGroupRot = -targetMeshRot;
        
        let diff = targetGroupRot - currentGroupRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        targetRotation = globeGroup.rotation.y + diff;
        
        isInteracting = true;
        gsap.to(globeGroup.rotation, { 
            y: targetRotation, 
            duration: 1.2, 
            ease: "power2.inOut",
            onComplete: () => {
                // Keep it focused until they move their mouse away
                velocity = 0;
            }
        });
    }

    // Pointer Events
    renderer.domElement.addEventListener('pointerdown', (e) => {
        isDragging = true;
        dragDistance = 0;
        previousX = e.clientX;
        previousY = e.clientY;
        velocity = 0;
        gsap.killTweensOf(globeGroup.rotation);
        isInteracting = true;
    });

    window.addEventListener('pointermove', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        
        if (isDragging) {
            const deltaX = e.clientX - previousX;
            const deltaY = e.clientY - previousY;
            dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
            
            // If dragging horizontally, update direction
            if (Math.abs(deltaX) > 1) {
                autoRotateDirection = Math.sign(deltaX);
            }
            
            if (Math.abs(deltaY) > Math.abs(deltaX) + 2) {
                // Probably scrolling page
            } else {
                globeGroup.rotation.y += deltaX * 0.005;
                velocity = deltaX * 0.005;
                
                if (dragDistance > 5) {
                    deselectAll(); 
                }
            }
            
            previousX = e.clientX;
            previousY = e.clientY;
        } else {
            // Not dragging. Check if mouse leaves the centered picture
            if (selectedMesh && !gsap.isTweening(globeGroup.rotation)) {
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                
                // Only un-pop if the cursor is within the canvas but not on the selected mesh
                if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObjects([selectedMesh]);
                    if (intersects.length === 0) {
                        deselectAll();
                        isInteracting = false;
                    }
                }
            }
        }
    });

    window.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        // If it was a short click, select the mesh
        if (dragDistance < 5) {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(meshes);
            if (intersects.length > 0) {
                selectMesh(intersects[0].object);
            } else {
                deselectAll();
                isInteracting = false;
            }
        } else {
            setTimeout(() => { if (!isDragging && !selectedMesh) isInteracting = false; }, 500);
        }
    });
    
    renderer.domElement.addEventListener('pointerleave', () => {
        if(selectedMesh) {
            deselectAll();
            isInteracting = false;
        }
    });
    
    window.addEventListener('pointerleave', () => {
        isDragging = false;
    });

    // Resize Handling
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        
        // Adjust camera distance dynamically for responsiveness
        if(window.innerWidth < 768) {
            camera.position.z = radius + 8.5;
        } else {
            camera.position.z = radius + 5.5;
        }
    });
    
    // Initial resize trigger
    window.dispatchEvent(new Event('resize'));

    const tempVector = new THREE.Vector3();

    // Main Loop
    function animate() {
        requestAnimationFrame(animate);

        if (!isDragging && !isInteracting) {
            if (Math.abs(velocity) > 0.0005) {
                velocity *= 0.94; // friction
                globeGroup.rotation.y += velocity;
            } else {
                globeGroup.rotation.y += autoRotateSpeed * autoRotateDirection;
            }
        } else if (!isDragging && Math.abs(velocity) > 0) {
            velocity *= 0.94;
            globeGroup.rotation.y += velocity;
        }

        const time = performance.now() * 0.001;
        meshes.forEach((mesh, i) => {
            // Gentle floating effect
            if (mesh !== selectedMesh) {
                mesh.position.y = Math.sin(time * 1.5 + i) * 0.15;
            } else {
                mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, 0, 0.1);
            }
            
            // Depth & Edge fading
            mesh.getWorldPosition(tempVector);
            
            // normalizedZ goes from 1 (front) to 0 (sides) to -1 (back)
            let normalizedZ = tempVector.z / radius;
            
            // At front (1.0), opacity is 1.0. At sides (0.0), opacity is 0.3. At back (-1.0), opacity is 0.1.
            let depthOpacity = 0.1;
            if (normalizedZ > 0) {
                // Front hemisphere: fade from 1.0 down to 0.3 at the edges
                depthOpacity = 0.3 + 0.7 * normalizedZ;
            } else {
                // Back hemisphere: fade from 0.3 down to 0.05
                depthOpacity = 0.05 + 0.25 * (1 + normalizedZ);
            }
            
            // Only apply depth fading if the texture has loaded and initial GSAP fade-in has given it some opacity
            if (mesh.material.map && mesh.material.opacity > 0.01) {
                // Avoid redundant assignments if closely matching
                const diff = Math.abs(mesh.material.opacity - depthOpacity);
                if(diff > 0.005) {
                    mesh.material.opacity = THREE.MathUtils.lerp(mesh.material.opacity, depthOpacity, 0.1);
                }
            }
        });

        renderer.render(scene, camera);
    }

    animate();
}
