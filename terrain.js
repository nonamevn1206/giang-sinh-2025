// CÔNG NGHỆ TEXTURE PIXELATED BẰNG CANVAS (MINECRAFT 100% Khớp Màu)
function generatePixelTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    const noise = (variance) => Math.floor(Math.random() * variance * 2 - variance);
    const rgb = (r, g, b) => `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
    const rgba = (r, g, b, a) => `rgba(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))}, ${a})`;

    for(let x=0; x<16; x++) {
        for(let y=0; y<16; y++) {
            let color = '';
            
            if(type === 'grass_top') {
                const n = noise(10);
                color = rgb(93 + n, 176 + n, 67 + n); // Emerald Green
            } else if (type === 'dirt') {
                const n = noise(15);
                color = rgb(121 + n, 85 + n, 58 + n); // Brown Dirt
            } else if (type === 'grass_side') {
                // Rủ lá cỏ xuống rìa
                const grassDepth = 3 + Math.floor(Math.random()*4);
                if (y < grassDepth || (y === grassDepth && Math.random() > 0.5)) {
                    const n = noise(10);
                    color = rgb(93 + n, 176 + n, 67 + n);
                } else {
                    const n = noise(15);
                    color = rgb(121 + n, 85 + n, 58 + n); 
                }
            } else if (type === 'stone') {
                const n = noise(15);
                // Vết nứt chéo nhẹ trên đá
                const isCrack = (x+y)%4 === 0 && Math.random() < 0.2;
                color = isCrack ? rgb(90, 90, 90) : rgb(125 + n, 125 + n, 125 + n);
            } else if (type === 'wood') {
                const isLine = x === 0 || x === 15 || x === 4 || x === 11 || (Math.random() < 0.1);
                const n = noise(8);
                color = isLine ? rgb(62 + n, 46 + n, 26 + n) : rgb(104 + n, 83 + n, 50 + n); // Gỗ dọc sọc nhăn nheo
            } else if (type === 'wood_top') {
               const dist = Math.max(Math.abs(x-7.5), Math.abs(y-7.5));
               const ring = dist % 3 < 1.5;
               const n = noise(10);
               color = ring ? rgb(164 + n, 129 + n, 84 + n) : rgb(129 + n, 98 + n, 58 + n);
            } else if (type === 'leaves') {
                if (Math.random() < 0.25) {
                    color = 'rgba(0,0,0,0)'; // Lá thủng
                } else {
                    const n = noise(15);
                    color = rgba(47 + n, 113 + n, 18 + n, 1); // Màu xanh sồi già
                }
            } else if (type === 'coal_ore' || type === 'iron_ore' || type === 'gold_ore') {
                const isCrack = (x+y)%4 === 0 && Math.random() < 0.2;
                const n = noise(15);
                color = isCrack ? rgb(90, 90, 90) : rgb(125 + n, 125 + n, 125 + n); // Nền đá
                if (Math.random() > 0.8) {
                    if (type === 'coal_ore') color = rgb(20, 20, 20); // Than đen rỗ
                    if (type === 'iron_ore') color = rgb(215, 185, 160); // Sắt hồng cam
                    if (type === 'gold_ore') color = rgb(250, 230, 80); // Vàng choé
                }
            } else if (type === 'sand') {
                const n = noise(12);
                color = rgb(219 + n, 211 + n, 160 + n); // Cát nhám
            } else if (type === 'water') {
                color = rgba(43, 82, 195, 0.85); // Nước Đại Dương xanh lam nguyên khối
            } else if (type === 'torch') {
                if (y < 10) color = rgb(100+noise(5), 70+noise(5), 30+noise(5)); // Que gỗ nâu
                else if (y < 12) color = 'rgb(255, 204, 0)'; 
                else if (Math.random() > 0.3) color = 'rgb(255, 100, 0)'; 
                else color = 'rgb(255, 255, 100)';
                if (x < 6 || x > 9 || y === 0 || y === 15) color = 'rgba(0,0,0,0)'; // Vót nhọn thành cây gậy mảnh 
            } else if (type === 'cloud') {
                color = rgba(255, 255, 255, 0.85); // Mây trắng mờ
            } else if (type === 'pig' || type === 'pig_snout') {
                const n = noise(10); color = type === 'pig' ? rgb(238+n, 165+n, 165+n) : rgb(220, 110, 140);
            }
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    // Nước, Đuốc, Lá mây dùng vật liệu Xuyên Phóng / Tự sáng
    if (type === 'water') {
        const mat = new THREE.MeshPhongMaterial({ map: texture, transparent: true, opacity: 0.8, shininess: 100 });
        mat.side = THREE.DoubleSide; return mat;
    } else if (type === 'cloud') {
        const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.9, depthWrite: false });
        mat.side = THREE.DoubleSide; return mat;
    } else if (type === 'torch') {
        const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5 });
        return mat;
    }
    
    const mat = new THREE.MeshLambertMaterial({ map: texture });
    if (type === 'leaves') {
        mat.transparent = true;
        mat.alphaTest = 0.5; 
        mat.side = THREE.DoubleSide; 
    }
    return mat;
}

// Bảng vật liệu kết tụ Texture
const matDirt = generatePixelTexture('dirt');
const matStone = generatePixelTexture('stone');
const matWoodSide = generatePixelTexture('wood');
const matWoodTop = generatePixelTexture('wood_top');
const matGrassTop = generatePixelTexture('grass_top');
const matGrassSide = generatePixelTexture('grass_side');
const matLeaves = generatePixelTexture('leaves');
const matSand = generatePixelTexture('sand');
const matWater = generatePixelTexture('water');
const matTorch = generatePixelTexture('torch');
const matCloud = generatePixelTexture('cloud');
const matCoal = generatePixelTexture('coal_ore');
const matIron = generatePixelTexture('iron_ore');
const matGold = generatePixelTexture('gold_ore');

// Xuất vật liệu Heo cho mobs.js xài ké
window.matPigSkin = generatePixelTexture('pig');
window.matPigSnout = generatePixelTexture('pig_snout');

// 6 Mặt Vật Phẩm Cỏ và Gỗ cực chất (Right, Left, Top, Bottom, Front, Back)
const matGrassBlock = [matGrassSide, matGrassSide, matGrassTop, matDirt, matGrassSide, matGrassSide];
const matWoodBlock = [matWoodSide, matWoodSide, matWoodTop, matWoodTop, matWoodSide, matWoodSide];

const materialsGroup = {
    1: matGrassBlock,
    2: matDirt,
    3: matStone, 
    4: matWoodBlock,
    6: matLeaves,
    7: matSand,
    8: matWater,
    9: matTorch,
    10: matCloud,
    11: matCoal,
    12: matIron,
    13: matGold
};

const blockSize = 1;
const chunkSize = 120; // Tăng map rộng thêm để có hồ nước và sa mạc
let blocksMap = new Map(); 
let clouds = []; // Danh sách mây bay trên trời

const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

function initTerrain() {
    const simplex = new SimplexNoise();
    
    // Sinh mây trên trời
    for(let c = 0; c < 20; c++) {
        spawnCloud();
    }
    
    const waterLevel = -2; // Dưới mức này là ngập nước
    
    // TẠO 1 MẶT BIỂN KHỔNG LỒ (Chống sập FPS vì sinh quá nhiều block nước)
    const oceanGeo = new THREE.PlaneGeometry(chunkSize, chunkSize);
    const oceanMat = materialsGroup[8];
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2; // Nằm ngang
    ocean.position.y = waterLevel - 0.1;
    scene.add(ocean);
    // Lưu tọa độ mặc định để thuật toán vật lý nhận diện Nước
    window.oceanLevel = waterLevel;
    
    for (let x = -chunkSize/2; x < chunkSize/2; x++) {
        for (let z = -chunkSize/2; z < chunkSize/2; z++) {
            
            const distToCenter = Math.sqrt(x*x + z*z);
            const edgeFalloff = Math.max(0, (distToCenter - chunkSize/3) * 0.5);
            
            const noiseVal = simplex.noise2D(x * 0.04, z * 0.04);
            const yHeight = Math.floor(noiseVal * 6 - edgeFalloff); 
            
            // Đổ cột từ đáy ngầm lên
            for(let y = yHeight - 4; y <= yHeight; y++) {
                let type = 3; 
                
                if (y === yHeight) {
                    if (y <= waterLevel || y === waterLevel + 1) {
                         type = 7; // Thấp quá thì thành Bờ Cát (Sand)
                    } else {
                        type = 1; // Cỏ
                        if (Math.random() > 0.99 && distToCenter < chunkSize/2 - 5) {
                            const treeHeight = 4 + Math.floor(Math.random() * 2);
                            for(let t=1; t<=treeHeight; t++) placeBlock(x, y+t, z, 4, false); // Trồng cái thân gỗ
                            
                            // Sinh tán lá rậm rạp
                            for (let lx = -2; lx <= 2; lx++) {
                                for (let lz = -2; lz <= 2; lz++) {
                                    for (let ly = 0; ly <= 2; ly++) {
                                        if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && (ly === 2 || Math.random() < 0.5)) continue; 
                                        placeBlock(x + lx, y + treeHeight + ly - 1, z + lz, 6, false); 
                                    }
                                }
                            }
                        }
                    }
                } else if (y >= yHeight - 2) {
                    type = 2; // Đất nằm dưới cỏ
                } else {
                    // Sinh quặng dưới lòng đất thay vì Toàn là đá
                    const rand = Math.random();
                    if(rand < 0.05) type = 11; // 5% vấp quặng than
                    else if(rand < 0.08) type = 12; // 3% vấp quặng sắt
                    else if(rand < 0.09) type = 13; // 1% lượm được vàng
                }
                
                placeBlock(x, y, z, type, false);
            }
        }
    }
}

function spawnCloud() {
    const cloudCluster = new THREE.Group();
    // Tạo mây phẳng dẹt hình chữ nhật chuẩn Minecraft
    const width = 8 + Math.floor(Math.random() * 8);
    const depth = 8 + Math.floor(Math.random() * 8);
    const cGeo = new THREE.BoxGeometry(width, 1.5, depth);
    const cMesh = new THREE.Mesh(cGeo, materialsGroup[10]);
    
    // Nối thêm 1 khối nhỏ bên hông tạo cấu trúc mây ghép
    const pGeo = new THREE.BoxGeometry(width/2, 1.5, depth/2);
    const pMesh = new THREE.Mesh(pGeo, materialsGroup[10]);
    pMesh.position.set(width/2 + 1, 0, depth/2 + 1);
    
    cloudCluster.add(cMesh);
    cloudCluster.add(pMesh);
    
    // Đặt dọc theo lưới toạ độ nhưng trôi nổi
    cloudCluster.position.set(Math.random() * 200 - 100, 45, Math.random() * 200 - 100);
    scene.add(cloudCluster);
    clouds.push(cloudCluster);
}

function placeWaterBlock(x, y, z) {
    // Không dùng nữa để tiết kiệm RAM. Nước đã được thay bằng Plane bự.
}

const torchesLights = [];

function placeBlock(x, y, z, type, playSound = true) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    const key = `${x},${y},${z}`;
    if (blocksMap.has(key)) return; 

    const mat = materialsGroup[type];
    const geo = type === 9 ? new THREE.BoxGeometry(0.2, 0.8, 0.2) : blockGeometry;
    const mesh = new THREE.Mesh(geo, mat);
    
    if (type === 9) mesh.position.set(x, y - 0.1, z); // Thấp xuống tí
    else mesh.position.set(x, y, z);
    
    // Nước và Kính không cần Shadow
    if(type !== 8 && type !== 6 && type !== 10) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }
    
    mesh.userData = { type: type, x: x, y: y, z: z, key: key };
    scene.add(mesh);
    blocksMap.set(key, mesh);
    
    // Nếu là ngọn Điếu bùng phát 1 quầng sáng ban đêm
    if (type === 9) {
         const tLight = new THREE.PointLight(0xffaa00, 1.5, 12);
         tLight.position.set(x, y+0.5, z);
         scene.add(tLight);
         torchesLights.push({light: tLight, key: key});
    }
    
    if(playSound) window.playPlaceSound();
}

function breakBlock(key) {
    if (blocksMap.has(key)) {
        const mesh = blocksMap.get(key);
        scene.remove(mesh);
        blocksMap.delete(key);
        window.playBreakSound();
        spawnBreakParticles(mesh.position.x, mesh.position.y, mesh.position.z, mesh.userData.type);
        spawnItem(mesh.position.x, mesh.position.y, mesh.position.z, mesh.userData.type);
        
        // Hủy điếu cày
        if (mesh.userData.type === 9) {
            const tlIndex = torchesLights.findIndex(tl => tl.key === key);
            if(tlIndex !== -1) {
                 scene.remove(torchesLights[tlIndex].light);
                 torchesLights.splice(tlIndex, 1);
            }
        }
    }
}

// ------ THỰC THỂ VẬT PHẨM (DROPPED ITEMS) ------
window.droppedItems = [];
window.spawnItem = function(x, y, z, type) {
    if(!materialsGroup[type]) return;
    const iGeo = type === 9 ? new THREE.BoxGeometry(0.1, 0.4, 0.1) : new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const iMesh = new THREE.Mesh(iGeo, materialsGroup[type]);
    iMesh.position.set(x, y, z);
    scene.add(iMesh);
    
    window.droppedItems.push({
        mesh: iMesh,
        type: type,
        vx: (Math.random() - 0.5) * 4,
        vy: 3, // Bắn nhẹ lên trời
        vz: (Math.random() - 0.5) * 4,
        yFloor: y - 0.4, // Điểm rớt trên mặt khối dưới
        age: 0
    });
};

// ------ HIỆU ỨNG HẠT VỠ KHỐI ------
const breakParticles = [];
function spawnBreakParticles(x, y, z, type) {
    const mat = materialsGroup[type] || materialsGroup[1];
    for (let i = 0; i < 15; i++) {
        // Tạo khối nhỏ liti
        const minimesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), mat);
        minimesh.position.set(x + (Math.random()-0.5)*0.8, y + (Math.random()-0.5)*0.8, z + (Math.random()-0.5)*0.8);
        scene.add(minimesh);
        breakParticles.push({
            mesh: minimesh,
            vx: (Math.random() - 0.5) * 6, // Văng tứ tung
            vy: Math.random() * 6 + 2,     // Nẩy lên
            vz: (Math.random() - 0.5) * 6,
            life: 1.0 // Sống 1 giây
        });
    }
}

window.updateTerrainParticles = function(delta) {
    for (let i = breakParticles.length - 1; i >= 0; i--) {
        let p = breakParticles[i];
        p.vy -= 9.8 * 2.5 * delta; // Trọng lực mảnh vỡ
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        
        p.life -= delta;
        p.mesh.scale.setScalar(Math.max(0, p.life)); // Thu nhỏ mờ dần
        
        if (p.life <= 0) {
            scene.remove(p.mesh);
            breakParticles.splice(i, 1);
        }
    }
    
    // Vật phẩm rơi (Dropped Items) đụng đất nẩy lên và xoay đều
    for (let i = window.droppedItems.length - 1; i >= 0; i--) {
        let item = window.droppedItems[i];
        
        // Trọng lực kéo xuống liên tục
        if (item.mesh.position.y > item.yFloor) {
            item.vy -= 9.8 * 2.5 * delta; 
            item.mesh.position.x += item.vx * delta;
            item.mesh.position.z += item.vz * delta;
        } else {
             // Đụng sàn, văng nhẹ 1 chút rồi đứng yên
             if (Math.abs(item.vy) > 1.0) {
                  item.vy = -item.vy * 0.4; // Nẩy
                  item.vx *= 0.6; // Chậm lại
                  item.vz *= 0.6; 
             } else {
                  item.vy = 0; item.vx = 0; item.vz = 0; 
                  item.mesh.position.y = item.yFloor;
             }
        }
        item.mesh.position.y += item.vy * delta;
        
        // Trôi lơ lửng xoay đều đặc trưng Minecraft
        item.age += delta;
        item.mesh.rotation.y += delta;
        if(item.vy === 0) {
            item.mesh.position.y = item.yFloor + Math.sin(item.age * 3) * 0.1;
        }
    }

    // Gió thổi mây bay
    clouds.forEach(c => {
         c.position.x += 1.5 * delta;
         if(c.position.x > 150) c.position.x = -150; // Trôi vòng lại
    });
}
