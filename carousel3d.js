document.addEventListener('DOMContentLoaded', init3DCarousel);

function init3DCarousel() {
    const container = document.getElementById('globe-carousel-container');
    if (!container) return;
    
    // Change touch-action to pan-y to allow vertical page scrolling on mobile
    container.style.touchAction = 'pan-y';

    // 1. Extract Data
    const dataSource = document.getElementById('globe-data-source');
    if(!dataSource) return;
    const slides = dataSource.querySelectorAll('.carousel-slide');
    const slideData = [];

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
        
        slideData.push({
            src: src,
            title: titleEl ? titleEl.textContent : '',
            desc: descEl ? descEl.textContent : '',
            date: dateEl ? dateEl.textContent : ''
        });
    });

    if (slideData.length === 0) return;

    // 2. Three.js Setup
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
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
                
                material.map = texture;
                material.needsUpdate = true;
                
                // Smooth fade in
                gsap.to(material, { opacity: 1, duration: 1.5 });
            });
        }
    });

    // 4. Interaction & Controls
    let autoRotateSpeed = 0.002;
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
        meshes.forEach(m => {
            gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
            gsap.to(m.material.emissive, { r: 0, g: 0, b: 0, duration: 0.4 });
        });
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
        
        // Adjust camera distance for mobile so sphere isn't too huge
        if(window.innerWidth < 768) {
            camera.position.z = 12;
        } else {
            camera.position.z = 9;
        }
    });
    
    // Initial resize trigger
    window.dispatchEvent(new Event('resize'));

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

        const time = Date.now() * 0.001;
        meshes.forEach((mesh, i) => {
            // Gentle floating effect
            if (mesh !== selectedMesh) {
                mesh.position.y = Math.sin(time * 1.5 + i) * 0.15;
            } else {
                mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, 0, 0.1);
            }
            
            // Depth fading
            const vector = new THREE.Vector3();
            mesh.getWorldPosition(vector);
            
            let depthOpacity = 1.0;
            if (vector.z < 0) {
                // Image is moving to the back hemisphere
                depthOpacity = 1.0 - (Math.abs(vector.z) / radius) * 0.6; // dims back images
            }
            
            if (mesh.material.map && mesh.material.opacity > 0.1) {
                mesh.material.opacity = THREE.MathUtils.lerp(mesh.material.opacity, depthOpacity, 0.1);
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
