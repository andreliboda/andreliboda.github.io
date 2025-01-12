let camera, scene, renderer;
let mesh;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };
let scale = 3;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
let particles;
let particlesGeometry;
const particleCount = 150;
const particleRadius = 8; // Increased from 5 to 8 for even more spread
const particleSpeed = 0.0005; // Speed of particle movement
let isFlipped = false;
let isRotating = false;
const particleRotationSpeed = 0.0001; // Very slow rotation speed
let particleRotation = 0;
const textureLoader = new THREE.TextureLoader();
const particleRotationMin = 0;
const particleRotationMax = Math.PI * 2;
const particleRotationSpeedMin = 0.001;
const particleRotationSpeedMax = 0.003;
const HEART_PARTICLE_COUNT = 20;
const SPARKLE_INTERVAL = 2000; // New sparkle every 2 seconds
const BACKGROUND_STARS_COUNT = 2000;
const SIDE_HEARTS_COUNT = 12;  // Hearts on each side
const HEART_COLORS = [
    new THREE.Color("#ff9ecd"), // Light pink
    new THREE.Color("#ff7eb9"), // Pink
    new THREE.Color("#ff699b"), // Dark pink
];

if (typeof THREE === 'undefined') {
    console.error('Three.js is not loaded!');
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
});

function init() {
    scene = new THREE.Scene();
    
    // Create a gradient background
    const backgroundColor1 = new THREE.Color("#042c41");
    const backgroundColor2 = new THREE.Color("#0a4c6d");
    const backgroundTexture = createGradientTexture(backgroundColor1, backgroundColor2);
    scene.background = backgroundTexture;
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a plane geometry (width, height)
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    
    // Create a group to hold both sides
    const group = new THREE.Group();
    
    // Front plane
    const frontTexture = textureLoader.load('front_texture.PNG');
    const frontMaterial = new THREE.MeshBasicMaterial({ 
        map: frontTexture,
        side: THREE.FrontSide
    });
    const frontPlane = new THREE.Mesh(geometry, frontMaterial);
    
    // Back plane (rotated 180 degrees)
    const backTexture = textureLoader.load('back_texture.PNG');
    const backMaterial = new THREE.MeshBasicMaterial({ 
        map: backTexture,
        side: THREE.FrontSide
    });
    const backPlane = new THREE.Mesh(geometry, backMaterial);
    backPlane.rotation.y = Math.PI; // Rotate 180 degrees
    backPlane.position.z = -0.01; // Slight offset to prevent z-fighting

    // Add both planes to the group
    group.add(frontPlane);
    group.add(backPlane);
    
    // Assign the group to mesh for rotation handling
    mesh = group;
    scene.add(mesh);

    camera.position.z = 5;

    // Add event listeners for interaction
    renderer.domElement.addEventListener('mousedown', onPointerDown);
    renderer.domElement.addEventListener('touchstart', onPointerDown);
    
    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('touchmove', onPointerMove);
    
    renderer.domElement.addEventListener('mouseup', onPointerUp);
    renderer.domElement.addEventListener('touchend', onPointerUp);
    
    window.addEventListener('resize', onWindowResize, false);

    // Add wheel event for mouse zoom
    renderer.domElement.addEventListener('wheel', onMouseWheel, false);
    
    // Add touch events for pinch zoom
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });

    // Add this after setting up the card mesh
    createParticles();
    scene.add(particles);

    // Add this after creating the mesh
    mesh.scale.set(scale, scale, scale); // Set initial scale to match starting zoom level

    // Add button click handler
    document.getElementById('flip-button').addEventListener('click', flipCard);

    // Add stars to background
    createBackgroundStars();

    createFloatingSideElements();

    // Add this to prevent default touch behavior globally
    document.addEventListener('touchmove', function(event) {
        event.preventDefault();
    }, { passive: false });
}

function onPointerDown(event) {
    isDragging = true;
    if (event.type === 'touchstart') {
        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    } else {
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
}

function onPointerMove(event) {
    if (!isDragging || isRotating) return;
    
    let currentPosition;
    if (event.type === 'touchmove') {
        currentPosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    } else {
        currentPosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    const deltaMove = {
        x: currentPosition.x - previousMousePosition.x,
        y: currentPosition.y - previousMousePosition.y
    };

    rotation.x += deltaMove.y * 0.005;
    rotation.y += deltaMove.x * 0.005;

    mesh.rotation.x = rotation.x;
    mesh.rotation.y = rotation.y;

    previousMousePosition = currentPosition;
}

function onPointerUp() {
    isDragging = false;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Add twinkling effect to background stars
    const stars = scene.children.find(child => child instanceof THREE.Points && child !== particles);
    if (stars && stars.geometry.attributes.size) {
        const sizes = stars.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i++) {
            sizes[i] = Math.random() * 0.2 + 0.1;
        }
        stars.geometry.attributes.size.needsUpdate = true;
    }
    
    // Add particle animation
    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        const randomFactors = particles.geometry.attributes.randomFactors.array;
        const rotations = particles.geometry.attributes.rotation.array;
        const rotationSpeeds = particles.geometry.attributes.rotationSpeed.array;
        const time = Date.now() * particleSpeed;

        // Add smooth rotation to the entire particle system
        particleRotation += particleRotationSpeed;
        particles.rotation.y = particleRotation;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Create smooth random movement using sine waves
            positions[i3] += Math.sin(time + randomFactors[i3]) * 0.002;
            positions[i3 + 1] += Math.sin(time + randomFactors[i3 + 1]) * 0.002;
            positions[i3 + 2] += Math.sin(time + randomFactors[i3 + 2]) * 0.002;

            // Keep particles within bounds
            const distance = Math.sqrt(
                positions[i3] ** 2 + 
                positions[i3 + 1] ** 2 + 
                positions[i3 + 2] ** 2
            );

            if (distance > particleRadius) {
                const scale = particleRadius / distance;
                positions[i3] *= scale;
                positions[i3 + 1] *= scale;
                positions[i3 + 2] *= scale;
            }
        }

        // Update individual particle rotations
        for (let i = 0; i < particleCount; i++) {
            rotations[i] += rotationSpeeds[i];
            if (rotations[i] > Math.PI * 2) {
                rotations[i] -= Math.PI * 2;
            }
        }

        particles.geometry.attributes.rotation.needsUpdate = true;
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Make particles follow card rotation while maintaining their own rotation
        particles.rotation.x = mesh.rotation.x;
        particles.rotation.y = mesh.rotation.y + particleRotation;
        particles.rotation.z = mesh.rotation.z;
    }

    // Add subtle color shifting to particles
    if (particles) {
        const colors = particles.geometry.attributes.color.array;
        for (let i = 0; i < particleCount * 3; i += 3) {
            colors[i] += Math.sin(Date.now() * 0.001 + i) * 0.001;     // Red
            colors[i + 1] += Math.sin(Date.now() * 0.002 + i) * 0.001; // Green
            colors[i + 2] += Math.sin(Date.now() * 0.003 + i) * 0.001; // Blue
        }
        particles.geometry.attributes.color.needsUpdate = true;
    }
    
    // Animate floating hearts
    scene.children.forEach(child => {
        if (child.geometry instanceof THREE.ShapeGeometry) {
            const time = Date.now() * child.userData.floatSpeed;
            
            // Floating motion
            child.position.y = child.userData.initialY + Math.sin(time + child.userData.phase) * 0.3;
            
            // Gentle rotation
            child.rotation.z += child.userData.rotateSpeed;
            
            // Subtle scale pulsing
            const scale = 1 + Math.sin(time * 2 + child.userData.phase) * 0.1;
            child.scale.set(scale, scale, scale);
        }
    });
    
    renderer.render(scene, camera);
}

let previousTouchDistance = 0;

function onMouseWheel(event) {
    event.preventDefault();
    
    // Adjust zoom based on wheel delta
    scale -= event.deltaY * 0.001;
    
    // Clamp scale between MIN_ZOOM and MAX_ZOOM
    scale = Math.min(Math.max(scale, MIN_ZOOM), MAX_ZOOM);
    
    mesh.scale.set(scale, scale, scale);
}

function getTouchDistance(event) {
    if (event.touches.length < 2) return 0;
    
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(event) {
    event.preventDefault(); // Prevent default touch behavior
    
    if (event.touches.length === 2) {
        previousTouchDistance = getTouchDistance(event);
    } else {
        onPointerDown(event);
    }
}

function onTouchMove(event) {
    event.preventDefault(); // Prevent default touch behavior
    
    if (event.touches.length === 2) {
        // Handle pinch zoom
        const currentTouchDistance = getTouchDistance(event);
        const delta = (currentTouchDistance - previousTouchDistance) * 0.01;
        
        scale += delta;
        scale = Math.min(Math.max(scale, MIN_ZOOM), MAX_ZOOM);
        mesh.scale.set(scale, scale, scale);
        
        previousTouchDistance = currentTouchDistance;
    } else {
        onPointerMove(event);
    }
}

function onTouchEnd(event) {
    event.preventDefault(); // Prevent default touch behavior
    
    if (event.touches.length < 2) {
        previousTouchDistance = 0;
    }
    onPointerUp(event);
}

function createParticles() {
    particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const randomFactors = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const rotations = new Float32Array(particleCount);
    const rotationSpeeds = new Float32Array(particleCount);

    // Updated color palette with more magical colors
    const colorPalette = [
        [1.0, 0.8, 0.4],    // Bright gold
        [0.94, 0.69, 0.73], // Soft pink
        [0.7, 0.3, 0.7],    // Purple
        [0.3, 0.7, 0.9],    // Light blue
        [1.0, 0.5, 0.0]     // Orange
    ];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;
        const r = (Math.random() * 0.9 + 0.1) * particleRadius;

        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = r * Math.cos(phi);

        randomFactors[i3] = Math.random() * Math.PI * 2;
        randomFactors[i3 + 1] = Math.random() * Math.PI * 2;
        randomFactors[i3 + 2] = Math.random() * Math.PI * 2;

        const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i3] = randomColor[0];
        colors[i3 + 1] = randomColor[1];
        colors[i3 + 2] = randomColor[2];

        rotations[i] = Math.random() * particleRotationMax;
        rotationSpeeds[i] = particleRotationSpeedMin + Math.random() * (particleRotationSpeedMax - particleRotationSpeedMin);
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('randomFactors', new THREE.BufferAttribute(randomFactors, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
    particlesGeometry.setAttribute('rotationSpeed', new THREE.BufferAttribute(rotationSpeeds, 1));

    const particleTexture = textureLoader.load('particle.jpg');
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.15,
        transparent: true,
        opacity: 0.6,
        map: particleTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
        alphaTest: 0.1
    });

    particles = new THREE.Points(particlesGeometry, particleMaterial);
}

function flipCard() {
    if (isRotating) return; // Prevent multiple rotations at once
    
    isRotating = true;
    isFlipped = !isFlipped;
    
    const targetRotation = isFlipped ? Math.PI : 0;
    const startRotation = mesh.rotation.y;
    const duration = 1000; // Animation duration in ms
    const startTime = Date.now();

    function animateRotation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        mesh.rotation.y = startRotation + (targetRotation - startRotation) * easeProgress;
        
        if (progress < 1) {
            requestAnimationFrame(animateRotation);
        } else {
            isRotating = false;
            mesh.rotation.y = targetRotation; // Ensure we end up exactly at the target
            rotation.y = targetRotation; // Update the rotation tracking variable
        }
    }

    animateRotation();
}

function createGradientTexture(color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, color1.getStyle());
    gradient.addColorStop(1, color2.getStyle());
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 2, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createBackgroundStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(BACKGROUND_STARS_COUNT * 3);
    const starSizes = new Float32Array(BACKGROUND_STARS_COUNT);
    
    for(let i = 0; i < BACKGROUND_STARS_COUNT; i++) {
        const i3 = i * 3;
        starPositions[i3] = (Math.random() - 0.5) * 500;
        starPositions[i3 + 1] = (Math.random() - 0.5) * 100;
        starPositions[i3 + 2] = -50; // Behind everything else
        
        starSizes[i] = Math.random() * 0.2 + 0.1;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        size: 0.1,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function createFloatingSideElements() {
    const heartShape = new THREE.Shape();
    
    // Simpler, more reliable heart shape
    heartShape.moveTo(0, 0.35);
    heartShape.bezierCurveTo(-0.5, 1, -1, 0.35, 0, -0.35);
    heartShape.bezierCurveTo(1, 0.35, 0.5, 1, 0, 0.35);

    const geometry = new THREE.ShapeGeometry(heartShape);
    geometry.scale(0.15, 0.15, 0.15);

    // Create hearts for both sides
    for (let i = 0; i < SIDE_HEARTS_COUNT * 2; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const heart = new THREE.Mesh(geometry, material);
        
        // Position hearts even further to the sides
        const side = i < SIDE_HEARTS_COUNT ? -1 : 1;
        heart.position.x = side * (7 + Math.random() * 4); // Even more spread on X axis
        heart.position.y = Math.random() * 6 - 3;
        heart.position.z = Math.random() * 3 - 1.5;
        
        heart.rotation.z = Math.random() * Math.PI;
        
        heart.userData.initialY = heart.position.y;
        heart.userData.floatSpeed = 0.001 + Math.random() * 0.002;
        heart.userData.rotateSpeed = 0.002 + Math.random() * 0.002;
        heart.userData.phase = Math.random() * Math.PI * 2;
        
        scene.add(heart);
    }
} 