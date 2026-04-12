let scene, camera, renderer, clock;

function init() {
    scene = new THREE.Scene();
    // Bầu trời
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

    // Camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Ánh sáng mô phỏng Mặt Trời
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Tạo nhóm Ánh sáng tự nhiên để xoay (Mặt trời & Mặt trăng)
    window.sunGroup = new THREE.Group();
    
    // Khối lượng Mặt trời vuông
    const sunGeo = new THREE.PlaneGeometry(30, 30);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, side: THREE.DoubleSide });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(0, 150, 0); // Treo tít trên cao
    window.sunGroup.add(sunMesh);
    
    // Khối lượng Mặt trăng vuông
    const moonGeo = new THREE.PlaneGeometry(25, 25);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, side: THREE.DoubleSide });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(0, -150, 0); // Nằm đối diện mặt trời
    window.sunGroup.add(moonMesh);
    
    // Bầu trời Đầy Sao (Night Stars)
    const starGeo = new THREE.BufferGeometry();
    const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 1.0});
    const starVerts = [];
    for(let i=0; i<1500; i++) {
        starVerts.push((Math.random()-0.5)*600, (Math.random()-0.5)*600, (Math.random()-0.5)*600);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    window.stars = new THREE.Points(starGeo, starMat);
    window.sunGroup.add(window.stars); // Quay cùng cụm trăng
    
    window.dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    window.dirLight.position.set(0, 150, 0);
    window.dirLight.castShadow = true;
    window.dirLight.shadow.camera.left = -60;
    window.dirLight.shadow.camera.right = 60;
    window.dirLight.shadow.camera.top = 60;
    window.dirLight.shadow.camera.bottom = -60;
    window.sunGroup.add(window.dirLight);
    scene.add(window.sunGroup);

    clock = new THREE.Clock();

    // Khởi chạy các khối lượng công việc
    initAudio();
    initTerrain();
    // Tạo Player Controller (Ngước/Thẳng, Di chuyển)
    initControls();
    
    // ------ BÀN TAY (VIEWMODEL) ------
    window.viewmodelGroup = new THREE.Group();
    // Tay trần (Mặc định)
    window.handMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), new THREE.MeshLambertMaterial({color: 0xcca685}));
    window.handMesh.position.set(0.3, -0.3, -0.5);
    window.handMesh.rotation.set(-0.3, -0.2, -0.2);
    // Khối cầm trên tay
    window.heldBlockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshLambertMaterial({color: 0x866043}));
    window.heldBlockMesh.position.set(0.3, -0.2, -0.5);
    window.heldBlockMesh.rotation.set(-0.2, -0.2, -0.1);
    window.heldBlockMesh.visible = false;
    
    window.viewmodelGroup.add(window.handMesh);
    window.viewmodelGroup.add(window.heldBlockMesh);
    camera.add(window.viewmodelGroup);
    scene.add(camera); // Thêm camera vào scene để viewmodel đi kèm chiếu bóng
    
    initPhysics();
    initMobs();

    window.addEventListener('resize', onWindowResize, false);
    
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let dayNightTime = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1); 
    
    // Tách hiệu ứng bobbing ra khỏi hệ thống vật lý để không bị lỗi văng màn hình
    if (window.headBobbingOffset) camera.position.y -= window.headBobbingOffset;
    
    if(!window.isDead) { // Nếu chết rồi thì thế giới đóng băng
        updatePhysics(delta);
        updateControls(delta);
        updateMobs(delta);
        if (typeof window.updateTerrainParticles === 'function') window.updateTerrainParticles(delta);
        
        // Chu kỳ Thời gian (Ngày Đêm)
        dayNightTime += delta * 0.05; // Tốc độ trôi thời gian
        const sunAngle = dayNightTime;
        window.sunGroup.rotation.z = sunAngle;
        
        // Đổi màu bầu trời theo Góc mặt trời
        const isDay = Math.sin(sunAngle) > 0;
        const currentLight = isDay ? 1.0 : 0.1;
        window.dirLight.intensity = currentLight;
        
        if (isDay) {
            scene.background.setHex(0x87CEEB); // Xanh lam ban ngày
            scene.fog.color.setHex(0x87CEEB);
            window.stars.visible = false;
        } else {
            scene.background.setHex(0x050510); // Đen kịt ban đêm
            scene.fog.color.setHex(0x050510);
            window.stars.visible = true;
        }
    }
    
    if (window.headBobbingOffset) camera.position.y += window.headBobbingOffset;
    
    renderer.render(scene, camera);
}

// ------ HỆ THỐNG SINH LÝ NHÂN VẬT ------
window.playerHealth = 10;
window.playerHunger = 10;
window.isDead = false;

window.takeDamage = function(amount) {
    if (amount <= 0 || window.isDead) return;
    window.playerHealth -= amount;
    window.playBreakSound(); // Tiếng rắc gãy xương mượn từ gõ đá
    
    // Chớp đỏ màn hình
    const overlay = document.getElementById('damage-overlay');
    overlay.style.opacity = '1';
    setTimeout(() => overlay.style.opacity = '0', 300);
    
    renderSurvivalUI();
    
    if (window.playerHealth <= 0) {
        window.isDead = true;
        document.getElementById('death-screen').style.display = 'flex';
        document.exitPointerLock();
    }
};

window.drainHunger = function(delta) {
    window.playerHunger -= 0.05 * delta; 
    if (window.playerHunger < 0) {
         window.playerHunger = 0;
         window.takeDamage(1); // Cứ mỗi nhịp đói tột độ thì mất 1 máu
    }
    // Render UI hạn chế để không bị nghẽn (Mỗi số chẵn 1,2,3..)
    if (Math.abs(Math.floor(window.playerHunger) - Math.floor(window.playerHunger + 0.05*delta)) >= 1) {
         renderSurvivalUI();
    }
};

window.respawn = function() {
    window.playerHealth = 10;
    window.playerHunger = 10;
    window.isDead = false;
    camera.position.set(0, 30, 0); // Về trời
    document.getElementById('death-screen').style.display = 'none';
    renderSurvivalUI();
};

function renderSurvivalUI() {
    const hpDiv = document.getElementById('health-bar');
    const hgDiv = document.getElementById('hunger-bar');
    if (!hpDiv || !hgDiv) return;
    
    hpDiv.innerHTML = '';
    hgDiv.innerHTML = '';
    
    for(let i=0; i<10; i++) {
        hpDiv.innerHTML += `<div class="heart ${i >= window.playerHealth ? 'empty' : ''}"></div>`;
        hgDiv.innerHTML += `<div class="chicken ${i >= Math.floor(window.playerHunger) ? 'empty' : ''}"></div>`;
    }
}

// Chạy lần đầu để hiện Trái tim
window.addEventListener('load', () => setTimeout(renderSurvivalUI, 500));

window.onload = init;
