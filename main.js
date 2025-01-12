let camera, scene, renderer;
let mesh;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };
let scale = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

if (typeof THREE === 'undefined') {
    console.error('Three.js is not loaded!');
}

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#042c41"); // Turkish flag red
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
    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('touchmove', onTouchMove, false);
    renderer.domElement.addEventListener('touchend', onTouchEnd, false);
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
    if (!isDragging) return;

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
    if (event.touches.length === 2) {
        previousTouchDistance = getTouchDistance(event);
    } else {
        onPointerDown(event);
    }
}

function onTouchMove(event) {
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
    if (event.touches.length < 2) {
        previousTouchDistance = 0;
    }
    onPointerUp(event);
} 