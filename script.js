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
let positionsFireworks = [], colorsFireworks = []; // NEW
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

// --- YOUTUBE MUSIC ---
let player;
window.onYouTubeIframeAPIReady = function () {
    console.log("YouTube API Ready");
    player = new YT.Player('youtube-audio', {
        height: '0',
        width: '0',
        videoId: 'ieVctH14vAA',
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'loop': 1,
            // 'origin': window.location.origin, // Sometimes helps with CORS
            'playlist': 'ieVctH14vAA' // Required for loop
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError // Add Error Handling
        }
    });
};

function onPlayerReady(event) {
    console.log("Player Ready, attempting play");
    event.target.playVideo();
    event.target.setVolume(50);
}

function onPlayerStateChange(event) {
    if (event.data === 0) { // Check if ended
        player.playVideo(); // Force Loop
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
    // Error 150/101 = Not Embeddable/Ownershit Restricted
    if (event.data === 150 || event.data === 101) {
        alert("Audio Error: This specific song blocks embedding. Please choose another.");
    }
}

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
        // Snowflake removed (Cleaned up)
        // Galaxy data gen removed
        generateKissData();
        // Combined Sleigh Scene
        generateSleighData();
        // Love data removed
        generateFireworksData();
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

// Galaxy generator removed

function generateTreeData() {
    const temp = [];
    const colorObj = new THREE.Color();

    // Partitioning particles
    const foliageCount = 4300; // Reduced for Star
    const starCount = 400; // Reserved for Star
    const lightCount = 500;
    const giftCount = CONFIG.particleCount - foliageCount - lightCount - starCount;

    // 1. REALISTIC FOLIAGE (Layers with Gaps + SNOW + ORNAMENTS)
    const layers = 6;
    const layerStep = CONFIG.treeHeight / layers;
    const layerConeHeight = layerStep * 0.85;

    for (let i = 0; i < foliageCount; i++) {
        const layerIndex = Math.floor(Math.random() * layers);
        const yBase = -CONFIG.treeHeight / 2 + layerIndex * layerStep;

        // Cone shape logic
        const h = Math.random() * layerConeHeight;
        const maxR = CONFIG.treeRadius * (1 - (layerIndex / (layers - 1))); // Tapering
        const r = Math.random() * maxR * (1 - h / layerConeHeight);

        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.sin(theta);
        const y = yBase + h;
        const z = r * Math.cos(theta);

        // Mix Green and Snowy White
        let color = new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.8, 0.2 + Math.random() * 0.3);
        if (Math.random() > 0.85) color.setHex(0xffffff); // Snow on leaves

        temp.push({ x, y, z, r: color.r, g: color.g, b: color.b });
    }

    // 2. PARTICLE STAR AT TOP (New Topper)
    const starY = CONFIG.treeHeight / 2 + 20;
    for (let i = 0; i < starCount; i++) {
        // Logic: 5-Pointed Star Shape
        const starA = Math.random() * Math.PI * 2;
        const outerR = 35;
        const innerR = 15;

        let rMax = innerR;
        const segment = Math.PI * 2 / 5;
        // Find nearest point
        const topOff = Math.PI / 2;
        // Normalize angle
        let normA = starA % (Math.PI * 2);
        if (normA < 0) normA += Math.PI * 2;

        let minDa = 100;
        for (let p = 0; p < 5; p++) {
            let pa = p * segment + topOff;
            // Wrap diff
            let diff = Math.abs(normA - pa);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < minDa) minDa = diff;
        }
        // Linear interpolation for star edge radius
        const t = minDa / (segment / 2);
        const limitR = outerR * (1 - t) + innerR * t;

        const rFinal = Math.random() * limitR;
        const sx = rFinal * Math.cos(starA);
        const sy = rFinal * Math.sin(starA) + starY;
        const sz = (Math.random() - 0.5) * 10;

        temp.push({
            x: sx, y: sy, z: sz,
            r: 1, g: 0.84, b: 0 // Gold
        });
    }

    // 3. SPIRAL LIGHTS (Helix - Adjusted for Scale)
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

    // 4. GIFT BOXES (Moved OUTSIDE the tree base)
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
    // 1. 3D VOLUMETRIC HEART (Outer Shell) - 3000 particles
    const heartCount = 3000;
    for (let i = 0; i < heartCount; i++) {
        const s = 0.5 + Math.random() * 0.5; // Surface heavy
        const theta = Math.random() * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(theta), 3);
        const hy = 13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta);
        const x = hx * 12 * s; // Larger: * 12
        const y = hy * 12 * s;
        const z = (Math.random() - 0.5) * 60 * s;
        // Color: Red/Pink
        colorObj.setHSL(0.95 + (1 - s) * 0.05, 1.0, 0.4 + s * 0.3);
        temp.push({ x, y, z, r: colorObj.r, g: colorObj.g, b: colorObj.b });
    }

    // 2. "I LOVE YOU" TEXT (Inside) - Remaining particles
    const textCount = CONFIG.particleCount - heartCount;
    const cvs = document.createElement('canvas'); cvs.width = 600; cvs.height = 300;
    const ctx = cvs.getContext('2d');
    ctx.font = "bold 80px 'Arial', sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("I LOVE", 300, 100);
    ctx.fillText("YOU", 300, 200);
    const data = ctx.getImageData(0, 0, 600, 300).data;

    // Sample text pixels
    const textParticles = [];
    for (let y = 0; y < 300; y += 4) {
        for (let x = 0; x < 600; x += 4) {
            const i = (y * 600 + x) * 4;
            if (data[i + 3] > 128) {
                textParticles.push({
                    x: (x - 300) * 0.8, // Smaller scale to fit inside
                    y: -(y - 150) * 0.8 + 20, // Center vertically
                    z: 20 // Slightly in front
                });
            }
        }
    }

    // Fill text buffer
    for (let i = 0; i < textCount; i++) {
        const p = textParticles[i % textParticles.length];
        if (p) {
            // White/Gold Text
            temp.push({ x: p.x, y: p.y, z: p.z, r: 1, g: 0.9, b: 0.5 });
        } else {
            // Fallback to heart center
            temp.push({ x: 0, y: 0, z: 0, r: 1, g: 0, b: 0 });
        }
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
    const img = new Image();
    // Local file: remove crossOrigin to avoid potential CORS issues on some setups
    // img.crossOrigin = "Anonymous"; 
    img.src = "santa_sleigh.png";
    img.onload = () => {
        try {
            const cvs = document.createElement('canvas');
            const ctx = cvs.getContext('2d');
            // Scale logic similar to processImageToBuffer but customized
            const sc = 250 / Math.max(img.width, img.height);
            cvs.width = img.width * sc; cvs.height = img.height * sc;
            ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
            const data = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
            const temp = [];
            for (let y = 0; y < cvs.height; y += 3) {
                for (let x = 0; x < cvs.width; x += 3) {
                    const i = (y * cvs.width + x) * 4;
                    // Lower threshold (20) to catch faint pixels
                    // Also check for non-black pixels if transparent fails
                    if (data[i + 3] > 20) {
                        temp.push({
                            x: (x - cvs.width / 2) * 2.5,
                            y: -(y - cvs.height / 2) * 2.5 + 20, // Adjustment
                            z: 0,
                            r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255
                        });
                    }
                }
            }
            if (temp.length === 0) {
                console.warn("Santa image processed but empty result.");
                generateTextToBuffer("SANTA", "EMPTY", positionsSleigh, colorsSleigh);
                return;
            }
            fillBuffer(temp, CONFIG.particleCount, positionsSleigh, colorsSleigh);
            console.log("Santa Sleigh Loaded. Particles:", temp.length);
        } catch (e) {
            console.error("Santa Image Processing Error:", e);
            generateTextToBuffer("SANTA", "ERROR", positionsSleigh, colorsSleigh);
        }
    };
    img.onerror = () => {
        console.warn("Santa image failed to load.");
        generateTextToBuffer("SANTA", "FAIL", positionsSleigh, colorsSleigh);
    };
}

// Galaxy generator removed

function generateKissData() { generateEmojiToBuffer("💏", positionsKiss, colorsKiss); }
// Santa/Reindeer removed
function generateKissData() { generateEmojiToBuffer("💏", positionsKiss, colorsKiss); }
// Santa/Reindeer removed
// generateLoveData removed (Merged into Heart)

function generateFireworksData() {
    const temp = [];
    const bursts = 7; // Number of explosions
    const particlesPerBurst = CONFIG.particleCount / bursts;

    for (let b = 0; b < bursts; b++) {
        // Random center for each burst
        const cx = (Math.random() - 0.5) * 600;
        const cy = (Math.random() - 0.5) * 400;
        const cz = (Math.random() - 0.5) * 200;
        const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.6); // Vivid random color

        for (let i = 0; i < particlesPerBurst; i++) {
            // Spherical explosion
            const r = 10 + Math.random() * 150; // Radius of burst
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            const x = cx + r * Math.sin(phi) * Math.cos(theta);
            const y = cy + r * Math.sin(phi) * Math.sin(theta);
            const z = cz + r * Math.cos(phi);

            // Sparkling tips (white)
            let rCol = color.r, gCol = color.g, bCol = color.b;
            if (Math.random() > 0.9) { rCol = 1; gCol = 1; bCol = 1; }

            temp.push({ x, y, z, r: rCol, g: gCol, b: bCol });
        }
    }
    fillBuffer(temp, CONFIG.particleCount, positionsFireworks, colorsFireworks);
}

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
    const mat = new THREE.PointsMaterial({
        size: 12, // Increased for glow
        map: createParticleTexture(),
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.9
    });
    particles = new THREE.Points(geom, mat);
    scene.add(particles);

    const sc = document.createElement('canvas'); sc.width = 60; sc.height = 60;
    // starSprite creation removed
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

    // INCREASED SENSITIVITY: 0.12 (was 0.08)
    if (dist(thumbTip, indexTip) < 0.12 && midUp && ringUp && pinkyUp) return 'OK'; // Kiss
    if (dist(thumbTip, indexTip) < 0.12 && !midUp) return 'FINGER_HEART';
    // SNAP: Thumb near Middle. Increased to 0.10 (was 0.06)
    if (dist(thumbTip, midTip) < 0.10) return 'SNAP';
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
    if (buf && buf.pos.length > 0) {
        // Use Swipe Transition
        swipeTo(buf.pos, buf.col, dir);
    }
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
        // SHOOTING HEARTS EFFECT
        if (Math.random() > 0.92) createFloatingHeart();
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

                } else if (lastGesture === 'VICTORY' && currentShape !== 'FIREWORKS') {
                    // VICTORY ✌️ -> FIREWORKS 🎆
                    morphTo(positionsFireworks, colorsFireworks); currentShape = 'FIREWORKS';

                } else if (lastGesture === 'ILY' && currentShape !== 'HEART') {
                    // ILY 🤟 -> HEART (with text)
                    morphTo(positionsHeart, colorsHeart); currentShape = 'HEART';

                } else if ((lastGesture === 'HEART_HANDS' || lastGesture === 'FINGER_HEART') && currentShape !== 'HEART') {
                    // HEART_HANDS 🫶 -> HEART ❤️
                    morphTo(positionsHeart, colorsHeart); currentShape = 'HEART';

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
            // starSprite.visible removed
        } else {
            // REMOVED AUTO-RESET to TREE. Shape will now persist.
            // if (currentShape !== 'TREE' && !isAnimating) {
            //    morphTo(positionsTree, colorsTree); currentShape = 'TREE';
            // }
            // starSprite.visible removed
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

function swipeTo(targetPos, targetCol, dir) {
    if (!particles || isAnimating || !targetPos) return;
    isAnimating = true;

    // Direction: -1 (Next) => Swipe Left (Particles move Left)
    // Direction: 1 (Prev) => Swipe Right (Particles move Right)
    const exitOffset = dir * -1000; // Move current OUT to this X
    const enterOffset = dir * 1000; // New particles start at this X

    const pos = particles.geometry.attributes.position.array;
    const col = particles.geometry.attributes.color.array;
    const startPos = Float32Array.from(pos);

    // 1. EXIT PHASE (Slide Out)
    const tweenExit = new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, 800)
        .easing(TWEEN.Easing.Cubic.In)
        .onUpdate((obj) => {
            for (let i = 0; i < CONFIG.particleCount; i++) {
                // Move X only similar to slide
                pos[i * 3] = startPos[i * 3] + exitOffset * obj.t;
                // Add slight random z/y noise for wind effect
                pos[i * 3 + 1] += (Math.random() - 0.5) * 2;
                pos[i * 3 + 2] += (Math.random() - 0.5) * 2;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        });

    // 2. ENTER PHASE (Slide In)
    const tweenEnter = new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .onStart(() => {
            // Reset particles to Start Position for Enter
            for (let i = 0; i < CONFIG.particleCount; i++) {
                const tx = targetPos[i % targetPos.length]?.x || 0;
                pos[i * 3] = tx + enterOffset; // Start from opposite side
                // Y/Z are target
                pos[i * 3 + 1] = targetPos[i % targetPos.length]?.y || 0;
                pos[i * 3 + 2] = targetPos[i % targetPos.length]?.z || 0;

                // Set Color Immediately
                const targetR = targetCol[(i % targetPos.length) * 3];
                const targetG = targetCol[(i % targetPos.length) * 3 + 1];
                const targetB = targetCol[(i % targetPos.length) * 3 + 2];
                col[i * 3] = targetR; col[i * 3 + 1] = targetG; col[i * 3 + 2] = targetB;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.geometry.attributes.color.needsUpdate = true;
        })
        .onUpdate((obj) => {
            for (let i = 0; i < CONFIG.particleCount; i++) {
                const tx = targetPos[i % targetPos.length]?.x || 0;
                // Move from EnterOffset to 0 (Target X)
                pos[i * 3] = (tx + enterOffset) + (tx - (tx + enterOffset)) * obj.t;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        })
        .onComplete(() => { isAnimating = false; });

    tweenExit.chain(tweenEnter);
    tweenExit.start();
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
            document.body.addEventListener('click', () => {
                vid.play();
                if (player && typeof player.playVideo === 'function') player.playVideo();
            }, { once: true });
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
// Start the Application
init();

// Aggressive Auto-Play Fallback
const interactions = ['click', 'touchstart', 'keydown'];
function tryPlayMusic() {
    if (player && player.getPlayerState() !== 1) {
        player.playVideo();
        console.log("User Interaction -> Attempting Play...");
        // Check 500ms later if it worked
        setTimeout(() => {
            if (player.getPlayerState() === 1) {
                console.log("Success! Removing listeners.");
                interactions.forEach(evt => document.body.removeEventListener(evt, tryPlayMusic));
            }
        }, 500);
    }
}
interactions.forEach(evt => document.body.addEventListener(evt, tryPlayMusic));

function createFloatingHeart() {
    const h = document.createElement('div');
    h.className = 'heart-particle';
    h.innerText = '❤️';
    h.style.left = (50 + (Math.random() - 0.5) * 20) + 'vw';
    h.style.top = '50vh';
    h.style.animationDuration = (2 + Math.random() * 2) + 's';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 4000);
}

function createParticleTexture() {
    const cvs = document.createElement('canvas'); cvs.width = 32; cvs.height = 32;
    const ctx = cvs.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(cvs);
    return tex;
}