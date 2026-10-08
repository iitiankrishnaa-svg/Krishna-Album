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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.7, 30);
    camera.add(pointLight); // Attach light to camera so front is always bright
    scene.add(camera);

    // 3. Create Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Duplicate slides to ensure a lush, dense globe (at least 6-8 items)
    let displayData = [...slideData];
    if (displayData.length > 0 && displayData.length < 8) {
        while(displayData.length < 8) {
            displayData = displayData.concat(slideData);
        }
    }

    const radius = Math.max(3.5, displayData.length * 0.45);
    
    // Update camera to always be comfortably outside the globe, regardless of how many photos exist!
    let baseCameraZ = radius + 5.5;
    if(window.innerWidth < 768) {
        baseCameraZ = radius + 8.5; // Step back further on mobile
    }
    camera.position.z = baseCameraZ;
    
    const textureLoader = new THREE.TextureLoader();
    const meshes = [];

    displayData.forEach((data, index) => {
        const angle = (index / displayData.length) * Math.PI * 2;
        
        const geometry = new THREE.PlaneGeometry(3, 4); // default 3:4 portrait
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.2,
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
                mesh.geometry.dispose();
                // Create geometry maintaining aspect ratio, max height 3.5
                mesh.geometry = new THREE.PlaneGeometry(3.5 * aspect, 3.5);
                
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
    let autoRotateSpeed = prefersReducedMotion ? 0 : 0.002;
    
    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    let velocity = 0;
    let targetRotation = 0;
    let isInteracting = false;
    let selectedMesh = null;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const overlayText = document.getElementById('globe-overlay-text');
    const overlayTitle = document.getElementById('globe-overlay-title');
    const overlayDesc = document.getElementById('globe-overlay-desc');
    const overlayDate = document.getElementById('globe-overlay-date');

    function updateOverlay(mesh) {
        if (!mesh) {
            overlayText.style.opacity = 0;
            return;
        }
        const data = mesh.userData.data;
        overlayTitle.textContent = data.title || 'Beautiful Memory';
        overlayDesc.textContent = data.desc || '';
        
        if (data.date) {
            overlayDate.textContent = data.date;
            overlayDate.style.display = 'inline-block';
        } else {
            overlayDate.style.display = 'none';
        }
        overlayText.style.opacity = 1;
    }

    function deselectAll() {
        if (!selectedMesh) return; // HUGE OPTIMIZATION: Prevent creating hundreds of GSAP tweens if nothing is actively selected
        
        gsap.to(selectedMesh.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
        gsap.to(selectedMesh.material.emissive, { r: 0, g: 0, b: 0, duration: 0.4 });
        
        selectedMesh = null;
        updateOverlay(null);
    }

    function selectMesh(mesh) {
        if(selectedMesh === mesh) return; // already selected
        deselectAll();
        selectedMesh = mesh;
        
        // Premium subtle glow & scale
        gsap.to(mesh.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.6, ease: "back.out(1.5)" });
        // Subtle pink/gold emissive glow
        gsap.to(mesh.material.emissive, { r: 0.15, g: 0.05, b: 0.1, duration: 0.6 });
        
        // Calculate shortest path rotation
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
                isInteracting = false;
                velocity = 0;
            }
        });
        
        updateOverlay(mesh);
    }

    // Pointer Events
    renderer.domElement.addEventListener('pointerdown', (e) => {
        isDragging = true;
        isInteracting = true;
        previousX = e.clientX;
        previousY = e.clientY;
        velocity = 0;
        gsap.killTweensOf(globeGroup.rotation);
        
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
            selectMesh(intersects[0].object);
        } else {
            deselectAll();
        }
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - previousX;
        const deltaY = e.clientY - previousY;
        
        // If they are scrolling vertically more than horizontally, don't spin globe aggressively
        if (Math.abs(deltaY) > Math.abs(deltaX) + 2) {
            // Probably scrolling page
        } else {
            // Horizontal rotation
            globeGroup.rotation.y += deltaX * 0.005;
            velocity = deltaX * 0.005;
            
            if (Math.abs(deltaX) > 3) {
                deselectAll(); 
            }
        }
        
        previousX = e.clientX;
        previousY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
        isDragging = false;
        setTimeout(() => { if (!isDragging) isInteracting = false; }, 2000);
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
                globeGroup.rotation.y -= autoRotateSpeed;
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

    // Start with front mesh highlighted
    setTimeout(() => {
        if (meshes.length > 0 && !isInteracting) {
            selectMesh(meshes[0]);
        }
    }, 1000);

    animate();
}
