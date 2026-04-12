const playerHeight = 1.6;
let velocity = new THREE.Vector3(); // Giữ trục Y để lo các tác vụ rơi tự do, Nhảy
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, isSwimming = false;
let canJump = false;
let highestFallY = 0; // Đỉnh tính sát thương té
let prevY = 0;
let spawnImmunityTimer = 3.0; // Miễn nhiễm sát thương ngã 3s đầu

function initPhysics() {
    camera.position.set(0, 30, 0); 
}

const checkBlockCollision = (px, py, pz) => {
    const key = `${Math.round(px)},${Math.round(py)},${Math.round(pz)}`;
    if (!blocksMap.has(key)) return false;
    
    const blockType = blocksMap.get(key).userData.type;
    // Các khối được đi xuyên qua: Đuốc(9), Mây(10)
    return blockType !== 9 && blockType !== 10;
};

function updatePhysics(delta) {
    if (!controls || !controls.isLocked || window.isDead) return;
    
    if (spawnImmunityTimer > 0) spawnImmunityTimer -= delta;
    
    // ------- KIỂM TRA MÔI TRƯỜNG NƯỚC BẰNG THUẬT TOÁN ĐẠI DƯƠNG TỔNG QUAN -------
    const headY = camera.position.y;
    const bodyInWater = (headY - 0.5) <= (typeof window.oceanLevel !== 'undefined' ? window.oceanLevel : -999);
    
    if (bodyInWater) {
        // Vật lý bơi dưới nước (Trọng lực rất thấp nổi bập bềnh, tốc độ chậm)
        velocity.y -= 1.0 * delta; 
        if(velocity.y < -3) velocity.y = -3; // Chìm từ từ
        
        // Nhấn Space để bơi trồi lên
        if (canJump) velocity.y = 4.0;
        canJump = false;
        
        highestFallY = camera.position.y; // Rớt xuống nước không mất máu
    } else {
        // ------- TRỤC Y: RO RƠI TRỌNG LỰC TRÊN CẠN -------
        velocity.y -= 9.8 * 2.5 * delta; 
        if (velocity.y < -1) {
            // Đang rơi lơ lửng, cập nhật đỉnh rớt để tí tính sát thương
            if (camera.position.y > highestFallY) highestFallY = camera.position.y;
        }
    }
    
    camera.position.y += velocity.y * delta;
    
    const feetY = camera.position.y - playerHeight;
    // Kiểm tra Chạm đất
    if (!bodyInWater && checkBlockCollision(camera.position.x, feetY, camera.position.z)) {
        // TÍNH SÁT THƯƠNG TÉ NGÃ
        const fallDistance = highestFallY - camera.position.y;
        if (fallDistance > 4.0 && spawnImmunityTimer <= 0) {
            const damage = Math.floor(fallDistance - 3); // Rớt 4 ô mất 1 máu, rơi 10 ô mất 7 máu
            window.takeDamage(damage);
        }
        
        highestFallY = camera.position.y; // Xóa sổ nợ ngã
        
        velocity.y = Math.max(0, velocity.y); // Ngưng rớt
        camera.position.y = Math.round(feetY) + 0.5 + playerHeight; // Cân bằng đứng chắc chân
        canJump = true;
    } else if (bodyInWater) {
        // Cho phép nhảy ngụp nước tiếp
        canJump = true;
    } else {
        // Phục hồi lại toạ độ nếu lỡ rơi lủng bản đồ
        if(camera.position.y < -40) {
            window.takeDamage(10); // Té Void = Chết ngay lập tức
        }
    }
    
    // ------- TRỤC X & Z: KINEMATIC TRƯỢT MƯỢT MÀ -------
    const isMoving = moveForward || moveBackward || moveLeft || moveRight;
    const speed = bodyInWater ? 3.0 * delta : (isMoving && window.playerHunger > 3 ? 7.0 * delta : 4.0 * delta); // Ở dưới nước hoăt Đói quá thì đi chậm
    
    if (isMoving && !bodyInWater) {
        window.drainHunger(delta); // Đi/chạy sẽ tuột năng lượng
    }
    
    const prevX = camera.position.x;
    const prevZ = camera.position.z;

    if (moveForward) controls.moveForward(speed);
    if (moveBackward) controls.moveForward(-speed);
    if (moveRight) controls.moveRight(speed);
    if (moveLeft) controls.moveRight(-speed);
    
    const curX = camera.position.x;
    const curZ = camera.position.z;
    
    // Hàm Quét vật cản trên Toàn Bộ Cơ Thể (Mắt, Bụng, Chân)
    const isPlayerColliding = (px, pz) => {
        const pyFeet = camera.position.y - playerHeight + 0.1; 
        const pyHead = camera.position.y - 0.2; 
        return checkBlockCollision(px, pyFeet, pz, false) || checkBlockCollision(px, pyHead, pz, false);
    };
    
    // Trượt kẹt Tường (Áp dụng kỹ thuật Tính toán Biệt Lập hai Trục X và Z)
    if (isPlayerColliding(curX, prevZ)) {
        camera.position.x = prevX; // Đụng tường dọc, khoá X lướt Z
    }
    if (isPlayerColliding(camera.position.x, curZ)) { // Dùng X thực tế mới có
        camera.position.z = prevZ; // Đụng tường ngang, khoá Z lướt X
    }
    
    // ------- CẢM BIẾN NHẶT VẬT PHẨM -------
    if (window.droppedItems) {
        for (let i = window.droppedItems.length - 1; i >= 0; i--) {
            const item = window.droppedItems[i];
            const dx = camera.position.x - item.mesh.position.x;
            const dy = (camera.position.y - playerHeight/2) - item.mesh.position.y;
            const dz = camera.position.z - item.mesh.position.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < 1.5 && item.age > 0.5) { // Cấm nhặt ngay lúc vừa phá, delay 0.5s bay ra
                 if(typeof scene !== 'undefined') scene.remove(item.mesh);
                 window.droppedItems.splice(i, 1);
                 if(typeof window.playPlaceSound === 'function') window.playPlaceSound(); // Âm thanh Pop vui tai
            }
        }
    }
}
