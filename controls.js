let controls;
let currentSlotIndex = 0;
const hotbarItems = [1, 2, 3, 4, 6, 7, 9, 0, 0];
let currentBlockType = hotbarItems[currentSlotIndex]; // Loại khối đang chọn
let raycaster;
let stepTimer = 0;
let headBobbingAngle = 0; // Biến dao động màn hình
let isMining = false;
let miningTimer = 0;
let miningTargetKey = null;
let viewmodelSwingAngle = 0;

function initControls() {
    controls = new THREE.PointerLockControls(camera, document.body);
    raycaster = new THREE.Raycaster();
    
    document.addEventListener('click', function (e) {
        // Không khóa chuột nếu đang click vào UI túi đồ
        if (e.target.closest('#inventory-screen') || e.target.closest('#survival-ui') || window.isDead) return;
        if (!controls.isLocked) {
            controls.lock();
        }
    });
    
    controls.addEventListener('lock', () => {
        if (document.getElementById('instructions')) document.getElementById('instructions').style.display = 'none';
        // Bật Engine Âm thanh một khi người dùng chơi (để vượt chính sách chặn autoplay)
        if (typeof audioCtx !== 'undefined' && audioCtx.state === 'suspended') audioCtx.resume();
    });
    
    controls.addEventListener('unlock', () => {
        // Không hiện lại hướng dẫn nữa
        moveForward = moveBackward = moveLeft = moveRight = false; // Ngừng di chuyển khi mở lock
    });
    
    // Bật tắt Inventory với phím E
    document.addEventListener('keydown', (e) => {
        if(e.code === 'KeyE') {
            if (typeof window.toggleInventory === 'function') window.toggleInventory();
        }
    });
    
    // Hệ thống chọn Hotbar 1-4
    // Cập nhật hỗ trợ lăn chuột để đổi Hotbar
    document.addEventListener('wheel', (e) => {
        if (window.isInventoryOpen) return;
        if (e.deltaY > 0) currentSlotIndex = (currentSlotIndex + 1) % 9;
        else currentSlotIndex = (currentSlotIndex - 1 + 9) % 9;
        
        currentBlockType = hotbarItems[currentSlotIndex];
        
        const slots = document.querySelectorAll('#hotbar .slot');
        slots.forEach(el => el.classList.remove('active'));
        if (slots[currentSlotIndex]) slots[currentSlotIndex].classList.add('active');
    });

    // Hệ thống chọn Hotbar 1-9 bằng số
    document.addEventListener('keydown', (e) => {
        if(e.key >= '1' && e.key <= '9') {
            currentSlotIndex = parseInt(e.key) - 1;
            currentBlockType = hotbarItems[currentSlotIndex];
            
            const slots = document.querySelectorAll('#hotbar .slot');
            slots.forEach(el => el.classList.remove('active'));
            if (slots[currentSlotIndex]) slots[currentSlotIndex].classList.add('active');
        }
    });

    // Sự kiện di chuyển WASD
    const onKeyDown = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp': case 'KeyW': moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': moveRight = true; break;
            case 'Space':
                if ( canJump === true ) {
                    velocity.y += 10;
                    canJump = false;
                }
                break;
        }
    };
    const onKeyUp = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp': case 'KeyW': moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': moveRight = false; break;
        }
    };
    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );
    
    document.addEventListener('mouseup', (e) => {
        if(e.button === 0) {
            isMining = false;
            miningTimer = 0;
            miningTargetKey = null;
        }
    });

    // Phá / Xây Khối bằng Chuột
    document.addEventListener('mousedown', (e) => {
        if(!controls.isLocked) return;
        
        // Bắn tia quét khối xuyên đệ quy để bắt kịp Thực Thể Mobs
        raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            // Lọc ra Khối Địa hình HOẶC Khối Động Vật
            const intersect = intersects.find(hit => hit.object.geometry && (
                 (hit.object.geometry.type === 'BoxGeometry' && hit.object.userData && hit.object.userData.type) || 
                 (hit.object.userData && hit.object.userData.isMob)
            ));
            if (!intersect || intersect.distance > 8) return; // Tầm đánh 8 blocks
            
            if (e.button === 0) {
                // Click phải mỏi tay, Click đè (Mining)
                if (intersect.object.userData.isMob) {
                    if (typeof window.hitMob === 'function') window.hitMob(intersect.object.userData.mobId);
                    viewmodelSwingAngle = Math.PI; // Vung tay
                } else {
                    isMining = true;
                    miningTargetKey = intersect.object.userData.key;
                    miningTimer = 0;
                }
            } else if (e.button === 2) {
                // Click phải - Place Block (Chỉ được xây nếu không chĩa mỏ vào lợn)
                if (intersect.object.userData.isMob) return; 

                const point = intersect.point;
                const normal = intersect.face.normal;
                
                // Toán học để tìm vị trí vách gắn khối
                const placeX = Math.round(intersect.object.parent ? intersect.object.parent.position.x + normal.x : intersect.object.position.x + normal.x);
                const placeY = Math.round(intersect.object.position.y + normal.y);
                const placeZ = Math.round(intersect.object.position.z + normal.z);
                
                // Cấm xây đè lên ngực mình - Tính khoảng cách
                const distToPlayer = Math.sqrt(Math.pow(camera.position.x - placeX, 2) + Math.pow((camera.position.y - playerHeight/2) - placeY, 2) + Math.pow(camera.position.z - placeZ, 2));
                
                if (distToPlayer > 1.0) {
                    placeBlock(placeX, placeY, placeZ, currentBlockType);
                }
            }
        }
    });
}

function updateControls(delta) {
    if (!controls || !controls.isLocked) {
        window.headBobbingOffset = THREE.MathUtils.lerp(window.headBobbingOffset || 0, 0, 10 * delta);
        return;
    }

    // Head / View Bobbing (Màn hình dao động chân thật khi chạy) - Sử dụng biên độ Offset Y thay vì Rotation Quaternion chống lỗi Camera lộn ngược
    const isMoving = moveForward || moveBackward || moveLeft || moveRight;
    if (isMoving && canJump) {
        headBobbingAngle += delta * 15; // Tần số đảo mắt
        
        window.headBobbingOffset = Math.sin(headBobbingAngle) * 0.12; 
        
        // Quản lý âm thanh bước chân
        stepTimer += delta;
        if(stepTimer > 0.4) {
             window.playFootstepSound();
             stepTimer = 0;
        }
    } else {
        // Nhanh chóng đưa màn hình thăng bằng khi đứng lại
        window.headBobbingOffset = THREE.MathUtils.lerp(window.headBobbingOffset || 0, 0, 10 * delta);
    }
    
    // ------ TIẾN TRÌNH KHAI THÁC & HOẠT ẢNH BÀN TAY (VIEWMODEL) ------
    if (isMining) {
         miningTimer += delta;
         viewmodelSwingAngle += delta * 15; // Tay giật cục đập liên tục
         
         if (miningTimer >= 0.6) { // Tốn 0.6s để phá vỡ khối
             breakBlock(miningTargetKey);
             isMining = false; // Phá xong thì reset, click phát nữa mới phá tiếp
             miningTimer = 0;
         }
    } else {
         if(viewmodelSwingAngle > 0) viewmodelSwingAngle -= delta * 10;
         else viewmodelSwingAngle = 0;
    }
    
    if (typeof window.viewmodelGroup !== 'undefined') {
         // Cầm vật phẩm hay tay trần
         if (currentBlockType !== 0) {
             window.heldBlockMesh.visible = true;
             window.handMesh.visible = false;
             if (typeof materialsGroup !== 'undefined' && materialsGroup[currentBlockType]) {
                 window.heldBlockMesh.material = materialsGroup[currentBlockType];
                 if (Array.isArray(materialsGroup[currentBlockType])) { // Cho phép hiển thị mảng Texture đa mặt
                      window.heldBlockMesh.geometry = window.heldBlockMesh.geometry; // Trigger update
                 }
             }
         } else {
             window.heldBlockMesh.visible = false;
             window.handMesh.visible = true;
         }
         
         // Animate gật gù bàn tay 
         const bobbing = isMoving && canJump ? Math.sin(headBobbingAngle)*0.05 : 0;
         window.viewmodelGroup.position.set(0, bobbing - Math.sin(viewmodelSwingAngle)*0.3, -Math.sin(viewmodelSwingAngle)*0.2);
         window.viewmodelGroup.rotation.x = -Math.sin(viewmodelSwingAngle)*0.5;
    }
}
