// --- CONFIGURATION ---
const CONFIG = {
    // Gallery: Add your image paths here!
    galleryImages: ['avarta.png', 'ny2.png', 'ny3.png', 'user_photo.jpg'],
    particleCount: 6000,
    treeHeight: 600, // Reduced from 750 (Too big)
    treeRadius: 260, // Reduced from 320
    morphSpeed: 2000, // Slower for smoothness
    handGracePeriod: 2000,
    starSize: 30,
    swipeThreshold: 0.15, // Speed needed to trigger swipe
    swipeCooldown: 1000   // Ms before next swipe
};

// --- GLOBALS ---
let scene, camera, renderer, composer;
let particles, starSprite;
// Buffers
let positionsTree = [], colorsTree = [];
let positionsHeart = [], colorsHeart = [];
let positionsText = [], colorsText = [];
// Rose buffers removed
let positionsStar = [], colorsStar = [];
// Snowflake, Reindeer, Santa buffers REPLACED by Sleigh
let positionsSleigh = [], colorsSleigh = []; // Combined scene
let positionsBox = [], colorsBox = [];
// Galaxy removed
let positionsKiss = [], colorsKiss = [];
// Santa/Reindeer removed
let positionsLove = [], colorsLove = [];
let galleryBuffers = [];
let currentGalleryIndex = 0;

let currentShape = 'TEXT';
let lastGesture = 'TEXT';
let isAnimating = false;
let lastHandTime = 0;
let autoRotateAngle = 0;
let currentRotation = { x: 0, y: 0 };
let targetRotation = { x: 0, y: 0 };
let handsInstance;
let lastWristX = 0;
let lastSwipeTime = 0;

// --- INITIALIZATION ---
function init() {
    try {
        setupScene();
        // Generate Procedural Shapes
        generateTreeData();
        generateHeartData();
        generateTextData();
        // Rose setup removed
        generateStarData();
        // Snowflake removed
        generateBoxData();
        // Galaxy data gen removed
        generateKissData();
        // Combined Sleigh Scene
        generateSleighData();
        // Santa/Reindeer removed
        generateLoveData();
        // Load Gallery
        loadGallery();
        // Start App
        initApp();
    } catch (e) {
        showError("Init Error: " + e.message);
    }
}

function setupScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020202, 0.0006);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 500;
    camera.position.y = 50;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0; bloomPass.strength = 1.4; bloomPass.radius = 0.6;
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    composer.addPass(bloomPass);
    window.addEventListener('resize', onWindowResize);
}

function initApp() {
    createObjects();
    setupAI();
    createSnowflakes();
    animate();
}

// --- SHAPE GENERATORS ---
function fillBuffer(source, count, posTarget, colTarget) {
    if (source.length === 0) return;
    for (let i = 0; i < count; i++) {
        const p = source[i % source.length];
        const z = p.z !== undefined ? p.z : (Math.random() - 0.5) * 10;
        posTarget.push({ x: p.x, y: p.y, z: z });
        colTarget.push(p.r, p.g, p.b);
    }
}

function generateBoxData() {
    // Replaced Box with Special User Image
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = "special_image.jpg";
    img.onload = () => {
        processImageToBuffer(img, positionsBox, colorsBox);
    };
    img.onerror = () => {
        console.warn("Special image not found, falling back to Box");
        // Fallback to original box if image fails
        const temp = [];
        const size = 100;
        for (let i = 0; i < 2000; i++) {
            const face = Math.floor(Math.random() * 6);
            let x, y, z;
            const u = (Math.random() - 0.5) * 2 * size;
            const v = (Math.random() - 0.5) * 2 * size;
            if (face === 0) { x = size; y = u; z = v; }
            else if (face === 1) { x = -size; y = u; z = v; }
            else if (face === 2) { y = size; x = u; z = v; }
            else if (face === 3) { y = -size; x = u; z = v; }
            else if (face === 4) { z = size; x = u; y = v; }
            else { z = -size; x = u; y = v; }
            let color = { r: 1, g: 0, b: 0 };
            if (Math.abs(u) < 20 || Math.abs(v) < 20) color = { r: 1, g: 0.84, b: 0 };
            temp.push({ x, y, z, r: color.r, g: color.g, b: color.b });
        }
        fillBuffer(temp, CONFIG.particleCount, positionsBox, colorsBox);
    };
}

function generateTreeData() {
    const temp = [];
    const colorObj = new THREE.Color();

    // Partitioning particles
    const foliageCount = 4500;
    const lightCount = 500;
    const giftCount = CONFIG.particleCount - foliageCount - lightCount; // ~1000

    // 1. REALISTIC FOLIAGE (Layers with Gaps + SNOW + ORNAMENTS)
    const layers = 6;
    const layerStep = CONFIG.treeHeight / layers;
    const layerConeHeight = layerStep * 0.85;

    for (let i = 0; i < foliageCount; i++) {
        const layerIndex = Math.floor(Math.random() * layers);
        const layerBaseY = -CONFIG.treeHeight / 2 + (layerIndex * layerStep);

        const t = Math.random();
        const y = layerBaseY + t * layerConeHeight;

        const globalTaper = 1 - ((y + CONFIG.treeHeight / 2) / CONFIG.treeHeight);
        const layerTaper = 1 - t;

        // Add some noise to radius for fluffiness
        const r = CONFIG.treeRadius * globalTaper * layerTaper * (0.8 + Math.random() * 0.4);
        const theta = Math.random() * Math.PI * 2;

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        // COLOR LOGIC
        const radiusRatio = r / (CONFIG.treeRadius * globalTaper + 0.1);

        // Snow Tips: If near the outer edge (radiusRatio > 0.9) AND high up the layer (t < 0.3)
        // Upper part of branches gets snow
        if (radiusRatio > 0.85 && t < 0.4) {
            colorObj.setHex(0xffffff); // Snow White
        } else if (Math.random() < 0.05 && radiusRatio > 0.6) {
            // Ornaments (5% chance on outer branches)
            const ornamentColor = Math.random();
            if (ornamentColor < 0.33) colorObj.setHex(0xff0000); // Red Ball
            else if (ornamentColor < 0.66) colorObj.setHex(0xffd700); // Gold Ball
            else colorObj.setHex(0x0000ff); // Blue Ball
        } else {
            // Standard Green Foliage
            const lightness = 0.3 + Math.random() * 0.4;
            colorObj.setHSL(0.33, 1.0, lightness);
            // Force pure green for non-snow outer tips
            if (radiusRatio > 0.8) colorObj.setHex(0x00ff00);
        }

        temp.push({ x, y, z, r: colorObj.r, g: colorObj.g, b: colorObj.b });
    }

    // 2. SPIRAL LIGHTS (Helix - Adjusted for Scale)
    for (let i = 0; i < lightCount; i++) {
        const t = i / lightCount;
        const y = -CONFIG.treeHeight / 2 + t * CONFIG.treeHeight * 0.95;
        const r = (CONFIG.treeRadius * (1 - t) * 0.9) + 10;
        const theta = t * Math.PI * 2 * 12; // More turns

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        if (Math.random() > 0.5) colorObj.setHex(0xffd700);
        else colorObj.setHex(0xffffff);

        temp.push({ x, y, z, r: colorObj.r, g: colorObj.g, b: colorObj.b });
    }

    // 3. GIFT BOXES (Moved OUTSIDE the tree base)
    const boxCount = 20;
    const particlesPerBox = Math.floor(giftCount / boxCount);
    for (let b = 0; b < boxCount; b++) {
        const angle = Math.random() * Math.PI * 2;
        // Dist must be > treeRadius (260). Range: 280 - 400
        const dist = CONFIG.treeRadius + 20 + Math.random() * 120;
        const cx = Math.cos(angle) * dist;
        const cz = Math.sin(angle) * dist;
        const cy = -CONFIG.treeHeight / 2 + 15;
        const size = 15 + Math.random() * 20; // Bigger boxes
        const boxColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
        for (let p = 0; p < particlesPerBox; p++) {
            const bx = (Math.random() - 0.5) * size;
            const by = (Math.random() - 0.5) * size;
            const bz = (Math.random() - 0.5) * size;
            temp.push({ x: cx + bx, y: cy + by, z: cz + bz, r: boxColor.r, g: boxColor.g, b: boxColor.b });
        }
    }
    fillBuffer(temp, CONFIG.particleCount, positionsTree, colorsTree);
}
function generateHeartData() {
    const temp = [];
    const colorObj = new THREE.Color();

    // Volumetric Heart (Concentric Layers)
    for (let i = 0; i < CONFIG.particleCount; i++) {
        // Random scale (0 to 1) for volume
        // Math.pow(Math.random(), 0.5) pushes more particles to outer surface
        const s = 0.2 + Math.random() * 0.8;

        const theta = Math.random() * Math.PI * 2;
        // Heart Formula
        const hx = 16 * Math.pow(Math.sin(theta), 3);
        const hy = 13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta);

        // Scale x/y
        const x = hx * 8 * s;
        const y = hy * 8 * s;

        // Z-axis volume (Puffy heart)
        // Thickness decreases as we get to the edge of the heart shape to mimic rounded volume
        // Or simple: thickness proportional to scale
        const z = (Math.random() - 0.5) * 40 * s;

        // Color Gradient:
        // Inner (Low s) = Dark Red. Outer (High s) = Bright Pink/Red
        const hue = 0.95 + (1 - s) * 0.05; // 0.95 (Red) to 1.0 (Red-Pink)
        const light = 0.3 + s * 0.4; // 0.3 (Dark) to 0.7 (Bright)

        colorObj.setHSL(hue, 1.0, light);

        temp.push({ x, y, z, r: colorObj.r, g: colorObj.g, b: colorObj.b });
    }
    fillBuffer(temp, CONFIG.particleCount, positionsHeart, colorsHeart);
}
function generateTextData() { generateTextToBuffer("MERRY", "CHRISTMAS", positionsText, colorsText); }
// Rose generator removed
function generateStarData() {
    // Canvas Drawn 5-Point Star
    const cvs = document.createElement('canvas'); cvs.width = 300; cvs.height = 300;
    const ctx = cvs.getContext('2d');
    const cx = 150, cy = 150, outerRadius = 100, innerRadius = 40;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 2.5) * i - Math.PI / 2;
        const x = cx + Math.cos(angle) * outerRadius;
        const y = cy + Math.sin(angle) * outerRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        const innerAngle = (Math.PI / 2.5) * (i + 0.5) - Math.PI / 2;
        const ix = cx + Math.cos(innerAngle) * innerRadius;
        const iy = cy + Math.sin(innerAngle) * innerRadius;
        ctx.lineTo(ix, iy);
    }
    ctx.closePath();

    // Vivid Gradient
    const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, outerRadius);
    grd.addColorStop(0, "white");
    grd.addColorStop(0.4, "yellow");
    grd.addColorStop(0.8, "gold");
    grd.addColorStop(1, "orange");
    ctx.fillStyle = grd;
    ctx.fill();

    const data = ctx.getImageData(0, 0, 300, 300).data;
    const temp = [];
    for (let y = 0; y < 300; y += 4) {
        for (let x = 0; x < 300; x += 4) {
            const i = (y * 300 + x) * 4;
            if (data[i + 3] > 100) {
                temp.push({
                    x: (x - 150) * 2.5, // Scale up
                    y: -(y - 150) * 2.5,
                    z: 0,
                    r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255
                });
            }
        }
    }
    // Fallback if empty
    if (temp.length === 0) temp.push({ x: 0, y: 0, z: 0, r: 1, g: 1, b: 0 });

    fillBuffer(temp, CONFIG.particleCount, positionsStar, colorsStar);
}



function generateSleighData() {
    // Composite Scene: Reindeer + Sleigh + Santa + Bag
    const cvs = document.createElement('canvas'); cvs.width = 600; cvs.height = 300;
    const ctx = cvs.getContext('2d');

    // Draw Reindeers (Left)
    ctx.font = "100px serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🦌", 100, 180); // Lead Reindeer
    ctx.fillText("🦌", 200, 160); // Second Reindeer

    // Draw Sleigh (Right)
    ctx.font = "150px serif";
    ctx.fillText("🛷", 400, 200);

    // Draw Santa (In Sleigh)
    ctx.font = "100px serif";
    ctx.fillText("🎅", 420, 160); // Sitting in Sleigh

    // Draw Gift Bag (Back)
    ctx.font = "80px serif";
    ctx.fillText("🎁", 520, 170); // Overflowing bag

    // Draw Reins (Connection)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(140, 170); ctx.lineTo(350, 200); // Reindeer 1 to Sleigh
    ctx.moveTo(240, 150); ctx.lineTo(350, 200); // Reindeer 2 to Sleigh
    ctx.stroke();

    const data = ctx.getImageData(0, 0, 600, 300).data;
    const temp = [];
    for (let y = 0; y < 300; y += 4) {
        for (let x = 0; x < 600; x += 4) {
            const i = (y * 600 + x) * 4;
            if (data[i + 3] > 100) {
                temp.push({
                    x: (x - 300) * 2.0, // Scale up
                    y: -(y - 150) * 2.0,
                    z: 0,
                    r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255
                });
            }
        }
    }
    if (temp.length === 0) temp.push({ x: 0, y: 0, z: 0, r: 1, g: 0, b: 0 });
    fillBuffer(temp, CONFIG.particleCount, positionsSleigh, colorsSleigh);
}

// Galaxy generator removed

function generateKissData() { generateEmojiToBuffer("💏", positionsKiss, colorsKiss); }
// Santa/Reindeer removed
function generateLoveData() { generateTextToBuffer("I LOVE", "YOU", positionsLove, colorsLove); }

function generateEmojiToBuffer(emoji, targetPos, targetCol) {
    const cvs = document.createElement('canvas'); cvs.width = 300; cvs.height = 300;
    const ctx = cvs.getContext('2d');
    ctx.font = "bold 200px serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(emoji, 150, 160);
    const data = ctx.getImageData(0, 0, 300, 300).data;
    const temp = [];
    for (let y = 0; y < 300; y += 4) {
        for (let x = 0; x < 300; x += 4) {
            const i = (y * 300 + x) * 4;
            if (data[i + 3] > 128) {
                temp.push({
                    x: (x - 150) * 1.5, y: -(y - 150) * 1.5, z: 0,
                    r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255
                });
            }
        }
    }
    fillBuffer(temp, CONFIG.particleCount, targetPos, targetCol);
}

function generateTextToBuffer(line1, line2, targetPos, targetCol) {
    const cvs = document.createElement('canvas'); cvs.width = 600; cvs.height = 300;
    const ctx = cvs.getContext('2d');
    // Changed font to be more readable
    ctx.font = "bold 70px 'Segoe UI', 'Arial', sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(line1, 300, 100);
    ctx.fillText(line2, 300, 200);
    const data = ctx.getImageData(0, 0, 600, 300).data;
    const temp = [];
    for (let y = 0; y < 300; y += 4) {
        for (let x = 0; x < 600; x += 4) {
            if (data[(y * 600 + x) * 4 + 3] > 128) {
                temp.push({ x: (x - 300) * 1.5, y: -(y - 150) * 1.5, z: 0, r: 1, g: 0.8, b: 0.2 });
            }
        }
    }
    if (temp.length === 0) temp.push({ x: 0, y: 0, z: 0, r: 1, g: 1, b: 1 });
    fillBuffer(temp, CONFIG.particleCount, targetPos, targetCol);
}

// --- GALLERY ---
function loadGallery() {
    CONFIG.galleryImages.forEach(() => { galleryBuffers.push({ pos: [], col: [] }); });
    CONFIG.galleryImages.forEach((url, index) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => { processImageToBuffer(img, galleryBuffers[index].pos, galleryBuffers[index].col); };
        img.onerror = () => {
            console.warn(`Gallery image ${url} failed.Gen text.`);
            generateTextToBuffer("FAMILY", `PHOTO ${index + 1} `, galleryBuffers[index].pos, galleryBuffers[index].col);
        };
    });
}
function processImageToBuffer(img, posT, colT) {
    const cvs = document.createElement('canvas'); const ctx = cvs.getContext('2d');
    const sc = 250 / Math.max(img.width, img.height);
    cvs.width = img.width * sc; cvs.height = img.height * sc;
    ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
    const data = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
    const temp = [];
    for (let y = 0; y < cvs.height; y += 3) {
        for (let x = 0; x < cvs.width; x += 3) {
            const i = (y * cvs.width + x) * 4;
            if (data[i + 3] > 128) {
                temp.push({
                    x: (x - cvs.width / 2) * 2.5, y: -(y - cvs.height / 2) * 2.5, z: 0,
                    r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255
                });
            }
        }
    }
    fillBuffer(temp, CONFIG.particleCount, posT, colT);
}

// --- OBJECTS ---
function createObjects() {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(CONFIG.particleCount * 3);
    const col = new Float32Array(CONFIG.particleCount * 3);
    for (let i = 0; i < CONFIG.particleCount; i++) {
        pos[i * 3] = positionsText[i].x; pos[i * 3 + 1] = positionsText[i].y; pos[i * 3 + 2] = positionsText[i].z;
        col[i * 3] = colorsText[i]; col[i * 3 + 1] = colorsText[i + 1]; col[i * 3 + 2] = colorsText[i + 2];
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 5, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    particles = new THREE.Points(geom, mat);
    scene.add(particles);

    const sc = document.createElement('canvas'); sc.width = 60; sc.height = 60;
    const ctx = sc.getContext('2d');
    const sg = ctx.createRadialGradient(30, 30, 0, 30, 30, 30);
    sg.addColorStop(0, '#fff'); sg.addColorStop(0.4, 'gold'); sg.addColorStop(1, 'transparent');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(30, 30, 30, 0, Math.PI * 2); ctx.fill();
    starSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.Texture(sc), color: 0xffff00 }));
    starSprite.material.map.needsUpdate = true; starSprite.scale.set(40, 40, 1);
    starSprite.position.y = CONFIG.treeHeight / 2 + 20;
    scene.add(starSprite);
}

// --- GESTURE LOGIC ---
function detectGesture(lm, lm2) {
    if (lm && lm2) {
        const i1 = lm[8], i2 = lm2[8];
        const t1 = lm[4], t2 = lm2[4];
        if (Math.hypot(i1.x - i2.x, i1.y - i2.y) < 0.15 && Math.hypot(t1.x - t2.x, t1.y - t2.y) < 0.15) return 'HEART_HANDS';
    }
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const thumbTip = lm[4], indexTip = lm[8], midTip = lm[12], wrist = lm[0];
    const indexUp = lm[8].y < lm[6].y;
    const midUp = lm[12].y < lm[10].y;
    const ringUp = lm[16].y < lm[14].y;
    const pinkyUp = lm[20].y < lm[18].y;
    let fingersUpCount = 0;
    if (indexUp) fingersUpCount++; if (midUp) fingersUpCount++; if (ringUp) fingersUpCount++; if (pinkyUp) fingersUpCount++;

    if (fingersUpCount === 0) return 'FIST';
    if (fingersUpCount === 1 && indexUp) return 'ONE';
    if (fingersUpCount === 2 && indexUp && midUp) return 'VICTORY';

    // ROCK (Thumb In) vs ILY (Thumb Out)
    if (fingersUpCount === 2 && indexUp && pinkyUp) {
        // Simple Thumb Check: is thumb tip far from index knuckle?
        if (Math.hypot(lm[4].x - lm[5].x, lm[4].y - lm[5].y) > 0.1) return 'ILY';
        else return 'ROCK'; // Usually Rock is 'Fist' but in some contexts standard rock is 2 fingers? Medipipe 'Rock' is usually index/pinky.
    }

    if (fingersUpCount === 3) return 'THREE';
    if (fingersUpCount === 4 && lm[4].x > lm[3].x) return 'FOUR'; // Thumb In (Right Hand) - approx
    if (fingersUpCount >= 4 && lm[4].y < lm[3].y) return 'OPEN';
    if (wrist.y < indexTip.y && wrist.y < midTip.y) return 'DOWN';
    if (dist(thumbTip, indexTip) < 0.08 && midUp && ringUp && pinkyUp) return 'OK'; // Kiss
    if (dist(thumbTip, indexTip) < 0.08 && !midUp) return 'FINGER_HEART';
    if (!indexUp && !midUp && !ringUp && !pinkyUp && lm[4].x < lm[3].x) return 'THUMB_UP'; // Santa

    return 'UNKNOWN';
}

function handleSwipe(wristX) {
    const now = Date.now();
    if (now - lastSwipeTime < CONFIG.swipeCooldown) return;
    if (lastWristX !== 0) {
        const delta = wristX - lastWristX;
        if (delta > CONFIG.swipeThreshold) {
            lastSwipeTime = now; changeGalleryImage(-1);
        } else if (delta < -CONFIG.swipeThreshold) {
            lastSwipeTime = now; changeGalleryImage(1);
        }
    }
    lastWristX = wristX;
}

function changeGalleryImage(dir) {
    if (currentShape !== 'IMAGE') return;
    currentGalleryIndex = (currentGalleryIndex + dir + galleryBuffers.length) % galleryBuffers.length;
    const buf = galleryBuffers[currentGalleryIndex];
    if (buf && buf.pos.length > 0) morphTo(buf.pos, buf.col);
}

function morphTo(targetPos, targetCol) {
    if (!particles || isAnimating || !targetPos) return;
    isAnimating = true;

    // 1. SCATTER PHASE (Tản ra khắp nơi)
    // Create random scatter positions
    const scatterPos = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
        const r = 400 + Math.random() * 400; // Wide scatter radius
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        scatterPos.push({
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi)
        });
    }

    const pos = particles.geometry.attributes.position.array;
    const col = particles.geometry.attributes.color.array;
    const startPos = Float32Array.from(pos);
    const startCol = Float32Array.from(col);

    const tweenScatter = new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, 1200) // Increase duration for smoothness
        .easing(TWEEN.Easing.Quadratic.InOut) // Smoother easing
        .onUpdate((obj) => {
            for (let i = 0; i < CONFIG.particleCount; i++) {
                // Interpolate Start -> Scatter
                pos[i * 3] = startPos[i * 3] + (scatterPos[i].x - startPos[i * 3]) * obj.t;
                pos[i * 3 + 1] = startPos[i * 3 + 1] + (scatterPos[i].y - startPos[i * 3 + 1]) * obj.t;
                pos[i * 3 + 2] = startPos[i * 3 + 2] + (scatterPos[i].z - startPos[i * 3 + 2]) * obj.t;

                // Flash to White
                if (obj.t < 0.5) {
                    col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 1;
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.geometry.attributes.color.needsUpdate = true;
        });

    // SPIN EFFECT (Xoay ảnh)
    new TWEEN.Tween(particles.rotation)
        .to({ y: particles.rotation.y + Math.PI * 2 }, 2500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();

    // 2. FORM PHASE (Tạo thành ảnh)
    const tweenForm = new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, 2000) // Increase duration
        .easing(TWEEN.Easing.Quadratic.InOut) // Smoother assembly
        .delay(100)
        .onUpdate((obj) => {
            for (let i = 0; i < CONFIG.particleCount; i++) {
                const tx = targetPos[i % targetPos.length]?.x || 0;
                const ty = targetPos[i % targetPos.length]?.y || 0;
                const tz = targetPos[i % targetPos.length]?.z || 0;
                const targetR = targetCol[(i % targetPos.length) * 3];
                const targetG = targetCol[(i % targetPos.length) * 3 + 1];
                const targetB = targetCol[(i % targetPos.length) * 3 + 2];

                // Interpolate Scatter -> Target
                pos[i * 3] = scatterPos[i].x + (tx - scatterPos[i].x) * obj.t;
                pos[i * 3 + 1] = scatterPos[i].y + (ty - scatterPos[i].y) * obj.t;
                pos[i * 3 + 2] = scatterPos[i].z + (tz - scatterPos[i].z) * obj.t;

                col[i * 3] = 1 + (targetR - 1) * obj.t;
                col[i * 3 + 1] = 1 + (targetG - 1) * obj.t;
                col[i * 3 + 2] = 1 + (targetB - 1) * obj.t;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.geometry.attributes.color.needsUpdate = true;
        })
        .onComplete(() => { isAnimating = false; });

    // Chain: Scatter -> Form
    tweenScatter.chain(tweenForm);
    tweenScatter.start();
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();

    // -- TWINKLE --
    if (currentShape === 'TREE' && !isAnimating && particles) {
        const col = particles.geometry.attributes.color.array;
        for (let k = 0; k < 50; k++) {
            const idx = Math.floor(Math.random() * CONFIG.particleCount);
            col[idx * 3] = 1; col[idx * 3 + 1] = 1; col[idx * 3 + 2] = 1;
        }
        particles.geometry.attributes.color.needsUpdate = true;
    }

    const vid = document.getElementById('video-input');
    const can = document.getElementById('camera-feed');
    if (vid && can && vid.readyState === 4) can.getContext('2d').drawImage(vid, 0, 0, can.width, can.height);

    // --- HEARTBEAT ANIMATION ---
    if (currentShape === 'HEART' && !isAnimating) {
        // Pulse Effect: Fast beat
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.1 + Math.sin(Date.now() * 0.008 + Math.PI * 0.5) * 0.02;
        particles.scale.set(pulse, pulse, pulse);
    } else if (currentShape !== 'SLEIGH') { // Sleigh logic might interfere otherwise
        particles.scale.set(1, 1, 1);
    }

    if (particles) {
        // --- FLYING SLEIGH ANIMATION ---
        if (currentShape === 'SLEIGH' && !isAnimating) {
            // Move Right
            particles.position.x += 2;
            // Gentle Bobbing
            particles.position.y += Math.sin(Date.now() * 0.002) * 0.5;

            // Wrap around screen
            if (particles.position.x > 500) particles.position.x = -500;
        } else {
            // Reset position for other shapes
            particles.position.x += (0 - particles.position.x) * 0.1;
            particles.position.y += (0 - particles.position.y) * 0.1;
        }

        const isHandActive = (Date.now() - lastHandTime) < CONFIG.handGracePeriod;
        if (isHandActive) {
            if (!isAnimating) {
                if (lastGesture === 'OPEN' && currentShape !== 'TREE') {
                    // HAND OPEN 🖐️ -> TREE 🎄
                    morphTo(positionsTree, colorsTree); currentShape = 'TREE';

                } else if (lastGesture === 'THUMB_UP' && currentShape !== 'SLEIGH') {
                    // THUMB UP 👍 -> SANTA 🎅
                    morphTo(positionsSleigh, colorsSleigh); currentShape = 'SLEIGH';

                    // COUPLE REMOVED (Again) ❌
                    // } else if (lastGesture === 'VICTORY' && currentShape !== 'KISS') {
                    //    // VICTORY ✌️ -> COUPLE 💏
                    //    morphTo(positionsKiss, colorsKiss); currentShape = 'KISS';

                } else if ((lastGesture === 'HEART_HANDS' || lastGesture === 'FINGER_HEART' || lastGesture === 'ILY') && currentShape !== 'HEART') {
                    // HEART / ILY 🫶🤟 -> HEART ❤️
                    morphTo(positionsHeart, colorsHeart); currentShape = 'HEART';

                } else if (lastGesture === 'FIST' && currentShape !== 'BOX') {
                    // FIST ✊ -> BOX 🎁
                    morphTo(positionsBox, colorsBox); currentShape = 'BOX';

                } else if (lastGesture === 'OK' && currentShape !== 'TEXT') {
                    // OK 👌 -> TEXT "Merry Xmas" 📜
                    morphTo(positionsText, colorsText); currentShape = 'TEXT';

                } else if (lastGesture === 'THREE' && currentShape !== 'IMAGE') {
                    // THREE 🤟 -> GALLERY IMAGE 🖼️
                    const b = galleryBuffers[currentGalleryIndex];
                    if (b && b.pos.length > 0) { morphTo(b.pos, b.col); currentShape = 'IMAGE'; }
                }
                // STAR REMOVED as requested ❌🌟
            }
            if (currentShape !== 'SLEIGH') {
                currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
                currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;
            } else {
                // For Sleigh, we also allow rotation now as requested "All effects follow hand"
                // But maybe we dampen it or keep it? 
                // User said "ALL effects must follow". So we enable it.
                currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
                currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;
            }
            starSprite.visible = (currentShape === 'TREE');
        } else {
            // REMOVED AUTO-RESET to TREE. Shape will now persist.
            // if (currentShape !== 'TREE' && !isAnimating) {
            //    morphTo(positionsTree, colorsTree); currentShape = 'TREE';
            // }
            starSprite.visible = true;
            autoRotateAngle += 0.003;
            currentRotation.y = autoRotateAngle;
            currentRotation.x += (0 - currentRotation.x) * 0.05;
        }

        // Apply rotation to ALL shapes including Sleigh
        particles.rotation.y = currentRotation.y;
        particles.rotation.x = currentRotation.x;
    }
    composer.render();
}

// --- NATIVE CAMERA & AI ---
async function setupAI() {
    const vid = document.getElementById('video-input');
    const loadText = document.getElementById('loading-text');

    // 1. Check for File Protocol
    if (window.location.protocol === 'file:') {
        alert("CRITICAL ERROR: You are running this file directly used 'file://'.\n\nBrowsers BLOCK camera access in this mode.\nPlease use a Local Server (e.g. VS Code Live Server).");
        if (loadText) loadText.innerHTML = "ERROR: FILESYSTEM DETECTED<br>Please use Local Server!";
        return;
    }

    // 2. Init Hands
    handsInstance = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    handsInstance.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.2, minTrackingConfidence: 0.2 });

    handsInstance.onResults(results => {
        const hStat = document.getElementById('hand-status');
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            lastHandTime = Date.now();
            const lm1 = results.multiHandLandmarks[0];
            const lm2 = results.multiHandLandmarks.length > 1 ? results.multiHandLandmarks[1] : null;

            if (lm1) handleSwipe(lm1[9].x);
            const gesture = detectGesture(lm1, lm2);
            if (gesture !== 'UNKNOWN') {
                lastGesture = gesture;
            }

            // Control BOTH axes
            targetRotation.y = -(lm1[9].x - 0.5) * 6; // Left/Right hand -> Rotate Y
            targetRotation.x = -(lm1[9].y - 0.5) * 6; // Up/Down hand -> Rotate X
        }
    });

    // 3. Native Camera (Robust)
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Browser API Not Supported (Non-Secure Context?)");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
        vid.srcObject = stream;

        // Handle Auto-Play Policies
        try {
            await vid.play();
        } catch (e) {
            console.warn("Auto-play blocked, waiting for interaction", e);
            if (loadText) loadText.innerHTML = "CLICK TO START<br>(Browser Blocked AutoPlay)";
            document.body.addEventListener('click', () => { vid.play(); }, { once: true });
        }

        const l = document.getElementById('loading');
        if (l) { l.style.opacity = 0; setTimeout(() => l.remove(), 800); }
        document.getElementById('sys-status').innerText = "RUNNING";
        processVideo();
    } catch (error) {
        console.error("Camera Error:", error);
        if (loadText) {
            loadText.innerHTML = `CAMERA ERROR:<br>${error.name}<br>(${error.message})`;
            loadText.style.color = 'red';
        }
        alert("Camera Error: " + error.message + "\n\n1. Check Permissions\n2. Use HTTPS/Localhost\n3. Close other camera apps");
    }
}

async function processVideo() {
    const vid = document.getElementById('video-input');
    if (vid && vid.readyState === 4) { await handsInstance.send({ image: vid }); }
    requestAnimationFrame(processVideo);
}

function showError(m) { console.error(m); alert("Error: " + m); }
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
}

// --- SNOWFALL LOGIC ---
function createSnowflakes() {
    const container = document.getElementById('snow-container');
    if (!container) return;

    // Increased count for better density
    const count = 70;
    const chars = ['❄️', '❅', '❆', '•', '·'];

    for (let i = 0; i < count; i++) {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');
        flake.innerText = chars[Math.floor(Math.random() * chars.length)];

        // --- RANDOM PHYSICAL PROPERTIES ---
        // Position
        flake.style.left = Math.random() * 100 + 'vw';

        // Depth / Size: Bigger = Faster & Clearer. Smaller = Slower & Blurry
        const depth = Math.random(); // 0 (far) to 1 (near)
        const size = 0.5 + depth * 1.5; // 0.5em to 2em
        flake.style.fontSize = size + 'em';

        // Blur for depth of field
        if (depth < 0.5) flake.style.filter = `blur(${2 - depth * 4}px)`; // Far flakes are blurry
        else flake.style.filter = 'none'; // Near flakes are crisp

        // Opacity
        flake.style.opacity = 0.4 + depth * 0.6; // Far = faint, Near = opaque

        // Animation Speed (Physics: Near objects fall faster perceptually)
        const fallSpeed = 3 + (1 - depth) * 5; // 3s (fast/near) to 8s (slow/far)
        const swaySpeed = 2 + Math.random() * 4; // Random sway freq

        flake.style.animationDuration = `${fallSpeed}s, ${swaySpeed}s`;
        flake.style.animationDelay = `-${Math.random() * 10}s, -${Math.random() * 5}s`; // Negative delay to start mid-air

        container.appendChild(flake);
    }
}

// Start the Application
init();