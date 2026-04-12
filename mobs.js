const pigs = [];
const zombies = [];
const fishes = [];
let mobIdCounter = 0;
let pigGlobalTime = 0; // Biến thời gian chung dùng để xoay khớp

function initMobs() {
    for(let i = 0; i < 4; i++) spawnPig();
    for(let i = 0; i < 3; i++) spawnZombie();
    for(let i = 0; i < 6; i++) spawnFish();
}

function spawnPig() {
    const root = new THREE.Group(); // Thân vỏ gốc vật lý
    const matSkin = typeof window.matPigSkin !== 'undefined' ? window.matPigSkin : new THREE.MeshLambertMaterial({color: 0xffb6c1}); 
    const matSnout = typeof window.matPigSnout !== 'undefined' ? window.matPigSnout : new THREE.MeshLambertMaterial({color: 0xff69b4});
    
    // Thân vỏ hình hộp (Chuẩn tỷ lệ: Dài 1.2, Rộng 0.8, Cao 0.8)
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 1.2); 
    const body = new THREE.Mesh(bodyGeo, matSkin);
    body.position.y = 0.6; // Nâng thân lên khỏi mặt đất
    body.castShadow = true;
    root.add(body);
    
    // Đầu heo
    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const head = new THREE.Mesh(headGeo, matSkin);
    head.position.set(0, 0.8, 0.6 + 0.3); // Gắn lồi ra phía trước
    head.castShadow = true;
    
    // Mõm heo gắn lên đầu
    const snoutGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
    const snout = new THREE.Mesh(snoutGeo, matSnout);
    snout.position.set(0, -0.1, 0.35);
    head.add(snout);
    
    // Đính thêm Cặp mắt
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({color: 0x000000});
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.2, 0.1, 0.31);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.2, 0.1, 0.31);
    head.add(eyeL); head.add(eyeR);
    
    root.add(head);

    // Bốn cái chân nhí nhố
    const legGeo = new THREE.BoxGeometry(0.3, 0.4, 0.3);
    const legs = [];
    const px = [-0.25, 0.25, -0.25, 0.25];
    const pz = [0.4, 0.4, -0.4, -0.4];
    
    for(let i=0; i<4; i++) {
        // Sử dụng Group để làm Khớp Xoay (Pivot Point) ngay chính háng lợn, thay vì xoay theo giữa cục thịt
        const legPivot = new THREE.Group();
        legPivot.position.set(px[i], 0.4, pz[i]);
        
        const legMesh = new THREE.Mesh(legGeo, matSkin);
        legMesh.position.y = -0.2; // Dịch cục lưới thấp xuống khỏi trục xoay
        legMesh.castShadow = true;
        
        legPivot.add(legMesh);
        root.add(legPivot);
        legs.push(legPivot);
    }
    
    // Đặt ngẫu nhiên trên bản đồ
    root.position.set( Math.random() * 30 - 15, 25, Math.random() * 30 - 15 );
    scene.add(root);
    
    const myId = mobIdCounter++;
    
    // Gắn nhãn để tia Raycaster nhận diện là con vật
    root.traverse(child => {
        if(child.isMesh) {
             child.userData.isMob = true;
             child.userData.mobId = myId;
             // Tạo copy màu gốc để nhấp nháy đỏ
             child.userData.originalColor = child.material.color ? child.material.color.clone() : new THREE.Color();
        }
    });
    
    // Ghi sổ các thực thể Mobs này và Trí óc thần kinh của chúng
    pigs.push({
        id: myId,
        mesh: root,
        legs: legs, // Lưu lại 4 cái giò để điều khiển khớp
        velocity: new THREE.Vector3(0,0,0),
        timer: Math.random() * 2, 
        direction: Math.random() * Math.PI * 2,
        hp: 10,
        panicTimer: 0,
        redTintTimer: 0,
        isDead: false
    });
}

// ------ HỆ THỐNG CHIẾN ĐẤU (CHỊU ĐÒN) ------
window.hitMob = function(mobId) {
    // Thống nhất xử lý đánh chung (Pig Lợn hoặc Cương Thi Zombie)
    let mob = pigs.find(p => p.id === mobId);
    let isZombie = false;
    if(!mob) { mob = zombies.find(z => z.id === mobId); isZombie = true; }
    
    if(!mob || mob.isDead) return;
    
    mob.hp -= 4; // Kiếm đâm
    window.playBreakSound(); 
    if (!isZombie && typeof window.playPigSound === 'function') window.playPigSound(); // Tiếng lợn
    
    // Nhuộm đỏ
    mob.redTintTimer = 0.4;
    mob.mesh.traverse(child => {
         if(child.isMesh && child.material && child.material.color) {
              child.material.color.setHex(0xff0000);
         }
    });
    
    // Bật hoảng loạn
    mob.panicTimer = 3.0; 
    mob.timer = 0; 
    
    // Giật lùi
    const pushDir = new THREE.Vector3(0, 0, -1);
    pushDir.applyQuaternion(camera.quaternion);
    mob.velocity.x += pushDir.x * 12;
    mob.velocity.z += pushDir.z * 12;
    mob.velocity.y += 10;
    
    if (mob.hp <= 0) {
        mob.isDead = true;
        mob.mesh.rotation.x = Math.PI / 2; // Gục
        mob.timer = 0; // Kích hoạt chạy đếm ngược chết 1 giây
    }
}

function updateMobs(delta) {
    pigGlobalTime += delta * 8; // Tốc độ chạy vung vẩy giò

    for (let i = pigs.length - 1; i >= 0; i--) {
        let pig = pigs[i];
        
        // Hoàn màu thịt lợn sau khi bị nhuộm đỏ 
        if (pig.redTintTimer > 0) {
             pig.redTintTimer -= delta;
             if (pig.redTintTimer <= 0 && !pig.isDead) { // Phục hồi
                  pig.mesh.traverse(child => {
                      if(child.isMesh && child.material && child.userData.originalColor) {
                           child.material.color.copy(child.userData.originalColor);
                      }
                  });
             }
        }
        
        // Quá trình thực thi cái chết
        if (pig.isDead) {
             pig.timer -= delta;
             pig.mesh.position.y -= 2 * delta; // Chìm dần xuống đất
             if(pig.redTintTimer <= -1.0) { // Đã chết khoảng 1s
                 scene.remove(pig.mesh);
                 pigs.splice(i, 1); // Xác định xóa vĩnh viễn
                 
                 // Rớt văng ra 1 Miếng Thịt Heo siêu nhỏ rớt ngay đúng thân lợn
                 if(typeof window.droppedItems !== 'undefined') {
                     const meatGeo = new THREE.BoxGeometry(0.3, 0.2, 0.3);
                     const meatMat = new THREE.MeshLambertMaterial({color: 0xffaaaa});
                     const meat = new THREE.Mesh(meatGeo, meatMat);
                     meat.position.copy(pig.mesh.position);
                     scene.add(meat);
                     window.droppedItems.push({
                         mesh: meat, type: 'meat', // Thêm định danh mới dẫu chưa có trên Hotbar
                         vx: (Math.random() - 0.5) * 4, vy: 5, vz: (Math.random() - 0.5) * 4,
                         yFloor: pig.mesh.position.y - 1.0, age: 0
                     });
                 }
                 // Spawn lại ở rìa bản đồ tạo hệ sinh thái vĩnh cửu
                 spawnPig(); 
             }
             continue; // Bỏ qua vật lý và AI lợn sống
        }

        // --- CODE AI SỐNG SÓT BÊN DƯỚI ---
        // Áp dụng Định luật Vật lý (Trọng lực cho con heo)
        pig.velocity.y -= 9.8 * 2.5 * delta;
        pig.mesh.position.y += pig.velocity.y * delta;
        
        // Xoá trôi trượt (Friction văng lùi nhè nhẹ)
        pig.velocity.x *= 0.9;
        pig.velocity.z *= 0.9;
        
        // Lõi Vận tốc hoảng loạn
        let currentSpeed = 0.5;
        if(pig.panicTimer > 0) {
             pig.panicTimer -= delta;
             currentSpeed = 3.5; // Tăng tốc độ cuống cuồng X7 lấp lánh chạy tán loạn 
        }

        // Con heo va chạm và đứng lên khối đất đá
        const yCheck = pig.mesh.position.y;
        let isOnGround = false;
        if (typeof blocksMap !== 'undefined' && blocksMap.has(`${Math.round(pig.mesh.position.x)},${Math.round(yCheck-0.2)},${Math.round(pig.mesh.position.z)}`)) {
            pig.velocity.y = 0;
            pig.mesh.position.y = Math.round(yCheck) + 0.3; // Trồi lên cực chuẩn
            isOnGround = true;
        }

        // Lập trình AI ngẫu nhiên
        pig.timer -= delta;
        if(pig.timer <= 0) {
            pig.timer = pig.panicTimer > 0 ? 0.3 + Math.random()*0.5 : 1 + Math.random() * 4; 
            
            // Xoay mặt tìm đường
            pig.direction += (Math.random() - 0.5) * Math.PI * (pig.panicTimer > 0 ? 0.8 : 1.5); 
            pig.mesh.rotation.y = pig.direction;
            
            // Heo rống "Ụt ịttt" văng tứ phía
            if(Math.random() > (pig.panicTimer > 0 ? 0.2 : 0.8)) {
                if (typeof window.playPigSound === 'function') window.playPigSound();
            }
            // Mắc kẹt bưng biền tưng lên
            if(isOnGround && Math.random() > 0.6) {
                pig.velocity.y = pig.panicTimer > 0 ? 12 : 8; 
            }
        }
        
        // Áp dụng đường đi di chuyển
        const speed = isOnGround ? currentSpeed : currentSpeed/2;
        
        const newX = pig.mesh.position.x + Math.sin(pig.direction) * speed * delta + pig.velocity.x * delta;
        const newZ = pig.mesh.position.z + Math.cos(pig.direction) * speed * delta + pig.velocity.z * delta;
        
        // Animation lố lăng
        if (isOnGround) {
             const swingScale = pig.panicTimer > 0 ? 3.0 : 1.0; 
             pig.legs[0].rotation.x = Math.sin(pigGlobalTime * swingScale);       
             pig.legs[1].rotation.x = -Math.sin(pigGlobalTime * swingScale);      
             pig.legs[2].rotation.x = -Math.sin(pigGlobalTime * swingScale);      
             pig.legs[3].rotation.x = Math.sin(pigGlobalTime * swingScale);       
        } else {
             pig.legs.forEach(leg => leg.rotation.x = 0);
        }
        
        // Hệ thống va Tường lũng nhũng ngớ ngẩn (Tìm đường kém)
        const midBodyY = pig.mesh.position.y + 0.8;
        if (typeof blocksMap !== 'undefined' && blocksMap.has(`${Math.round(newX)},${Math.round(midBodyY)},${Math.round(newZ)}`)) {
            pig.direction += Math.PI; // Úp mặt quay đầu
            pig.mesh.rotation.y = pig.direction;
            if(isOnGround && Math.random() > 0.3) pig.velocity.y += 6; 
        } else {
             pig.mesh.position.x = newX;
             pig.mesh.position.z = newZ;
        }
        
        // Heo rớt map 
        if(pig.mesh.position.y < -30) {
            pig.hp = 0; pig.isDead = true; window.hitMob(pig.id); 
        }
    }
    
    // --- CẬP NHẬT TRÍ TUỆ NHÂN TẠO ZOMBIE ---
    for (let i = zombies.length - 1; i >= 0; i--) {
        let zomb = zombies[i];
        if (zomb.isDead) { // Cương thi ngã gục
             zomb.timer -= delta;
             zomb.mesh.position.y -= 2 * delta;
             if(zomb.timer <= -1.0) {
                 scene.remove(zomb.mesh);
                 zombies.splice(i, 1);
                 spawnZombie(); 
             }
             continue;
        }

        // Tọng lực
        zomb.velocity.y -= 9.8 * 2.5 * delta;
        zomb.mesh.position.y += zomb.velocity.y * delta;
        
        const yCheck = zomb.mesh.position.y;
        let isOnGround = false;
        if (typeof blocksMap !== 'undefined' && blocksMap.has(`${Math.round(zomb.mesh.position.x)},${Math.round(yCheck-0.2)},${Math.round(zomb.mesh.position.z)}`)) {
            zomb.velocity.y = 0;
            zomb.mesh.position.y = Math.round(yCheck) + 0.3; // Trồi
            isOnGround = true;
        }

        // Zombie định vị đánh hơi mồ hôi của Player
        const pX = typeof camera !== 'undefined' ? camera.position.x : 0;
        const pZ = typeof camera !== 'undefined' ? camera.position.z : 0;
        const distToPlayer = Math.sqrt(Math.pow(pX - zomb.mesh.position.x, 2) + Math.pow(pZ - zomb.mesh.position.z, 2));

        if (distToPlayer < 20) {
            // Player ở gần (Bán kính 20 blocks) -> Đuổi đánh
            zomb.direction = Math.atan2(pX - zomb.mesh.position.x, pZ - zomb.mesh.position.z) + Math.random()*0.2 - 0.1; // Thêm chút mù quáng
            if (distToPlayer < 1.5 && zomb.timer <= 0) {
                // Cắn người chơi
                if (typeof window.takeDamage === 'function') window.takeDamage(2); // Cắn mất 2 máu
                zomb.timer = 1.0; // Cooldown cắn
            }
        } else {
             // Lang thang vật vờ
             zomb.timer -= delta;
             if(zomb.timer <= 0) {
                 zomb.timer = 2 + Math.random() * 3; 
                 zomb.direction += (Math.random() - 0.5) * Math.PI; 
             }
        }
        if(zomb.timer > 0) zomb.timer -= delta; // Giảm Cooldown
        
        zomb.mesh.rotation.y = zomb.direction;
        
        const speed = isOnGround ? 1.8 : 0.5; // Zombie chậm rì
        const newX = zomb.mesh.position.x + Math.sin(zomb.direction) * speed * delta;
        const newZ = zomb.mesh.position.z + Math.cos(zomb.direction) * speed * delta;
        
        if (isOnGround) {
             zomb.legs[0].rotation.x = Math.sin(pigGlobalTime * 0.8);       
             zomb.legs[1].rotation.x = -Math.sin(pigGlobalTime * 0.8);      
        } else {
             zomb.legs.forEach(leg => leg.rotation.x = 0);
        }
        
        // Quệt tường thì cố gắng nhảy lên (Zombie tìm đường cơ bản)
        const midBodyY = zomb.mesh.position.y + 0.8;
        if (typeof blocksMap !== 'undefined' && blocksMap.has(`${Math.round(newX)},${Math.round(midBodyY)},${Math.round(newZ)}`)) {
            if(isOnGround && Math.random() > 0.5) zomb.velocity.y += 8.5; // Khá bật nhún
            else zomb.direction += Math.PI/2; 
        } else {
             zomb.mesh.position.x = newX;
             zomb.mesh.position.z = newZ;
        }
        
        if(zomb.mesh.position.y < -30) { zomb.hp = 0; zomb.isDead = true; }
    }
    
    // --- CẬP NHẬT CÁ BƠI (FISH AI) ---
    for (let i = fishes.length - 1; i >= 0; i--) {
        let fish = fishes[i];
        fish.timer -= delta;
        if (fish.timer <= 0) {
            fish.timer = 1 + Math.random();
            fish.direction += (Math.random() - 0.5) * Math.PI;
        }
        fish.mesh.rotation.y = fish.direction;
        fish.mesh.rotation.z = Math.sin(pigGlobalTime*3)*0.2; // Cá lượn đuôi
        
        const fSpeed = 2.5;
        const newX = fish.mesh.position.x + Math.sin(fish.direction) * fSpeed * delta;
        const newZ = fish.mesh.position.z + Math.cos(fish.direction) * fSpeed * delta;
        
        // Cấm cá bơi lên bờ
        if (typeof blocksMap !== 'undefined' && blocksMap.has(`${Math.round(newX)},${Math.round(fish.mesh.position.y)},${Math.round(newZ)}`)) {
            fish.direction += Math.PI; // Quay lưng
        } else {
            fish.mesh.position.x = newX;
            fish.mesh.position.z = newZ;
        }
    }
}

// ------ THÊM THỰC THỂ CƯƠNG THI (ZOMBIE) VÀ CÁ (FISH) ------
function spawnZombie() {
    const root = new THREE.Group();
    // Zombie Đầu bự
    const zHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshLambertMaterial({color: 0x3b8543})); // Xanh chuối rách
    zHead.position.set(0, 1.4, 0); root.add(zHead);
    // Áo xanh da trời (Cyan Shirt)
    const zBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), new THREE.MeshLambertMaterial({color: 0x3dacc7}));
    zBody.position.set(0, 0.4, 0); root.add(zBody);
    // Tay đưa ra phía trước
    const zArmL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), new THREE.MeshLambertMaterial({color: 0x3b8543}));
    zArmL.position.set(0.6, 0.6, 0.4); zArmL.rotation.x = Math.PI / 2; root.add(zArmL);
    const zArmR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), new THREE.MeshLambertMaterial({color: 0x3b8543}));
    zArmR.position.set(-0.6, 0.6, 0.4); zArmR.rotation.x = Math.PI / 2; root.add(zArmR);
    // Quần tím than (Blue Pants)
    const legs = [];
    for(let i=0; i<2; i++) {
        const legP = new THREE.Group();
        legP.position.set(i===0? 0.2: -0.2, -0.2, 0);
        const legM = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.4), new THREE.MeshLambertMaterial({color: 0x3b3b7a}));
        legM.position.y = -0.5;
        legP.add(legM); root.add(legP); legs.push(legP);
    }
    
    root.position.set(Math.random() * 60 - 30, 25, Math.random() * 60 - 30);
    scene.add(root);
    
    const myId = mobIdCounter++;
    root.traverse(c => { if(c.isMesh) { c.userData.isMob = true; c.userData.mobId = myId; c.userData.originalColor = c.material.color.clone(); } });
    
    zombies.push({ id: myId, mesh: root, legs: legs, velocity: new THREE.Vector3(0,0,0), timer: 0, direction: 0, hp: 20, isDead: false, redTintTimer: 0, panicTimer: 0 });
}

function spawnFish() {
    const root = new THREE.Group();
    // Khối cam (Cá hề)
    const fishBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), new THREE.MeshLambertMaterial({color: 0xff8c00}));
    root.add(fishBody);
    root.position.set(Math.random()*40-20, (typeof window.oceanLevel !== 'undefined' ? window.oceanLevel : -2) - 0.5, Math.random()*40-20);
    scene.add(root);
    
    fishes.push({ mesh: root, direction: Math.random()*Math.PI*2, timer: 0 });
}
