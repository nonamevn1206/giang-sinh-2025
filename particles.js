// Config lại nhận Toạ độ tay thực tế thay vì Chuột
const canvas = document.getElementById('particle-canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.zIndex = '1';
canvas.style.pointerEvents = 'none';

const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 12 + 3; // Hạt to hơn để dễ thấy
        this.speedX = Math.random() * 8 - 4; // Tỏa ra mạnh hơn
        this.speedY = Math.random() * 8 - 4;
        
        // Màu sắc rực rỡ tương phản mạnh trên nền hồng: Đỏ tươi, Trắng sáng, Vàng Gold, Tím
        const colors = ['#fff', '#ff0000', '#ffd700', '#ff1493', '#8a2be2'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = 1; 
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.1) this.size -= 0.15;
        this.life -= 0.02; 
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        // Vẽ tia sáng xoẹt hình thoi nhỏ giấu nhẹm (bằng arc tròn cho đơn giản nhưng hiệu quả cao)
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

function handleParticles() {
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        
        // Mạng lưới kết nối tia chớp ngẫu nhiên
        for (let j = i; j < particlesArray.length; j++) {
            const dx = particlesArray[i].x - particlesArray[j].x;
            const dy = particlesArray[i].y - particlesArray[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) { 
                ctx.beginPath();
                ctx.strokeStyle = particlesArray[i].color;
                ctx.lineWidth = 0.5;
                ctx.globalAlpha = particlesArray[i].life; 
                ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
        
        if (particlesArray[i].life <= 0 || particlesArray[i].size <= 0.1) {
            particlesArray.splice(i, 1);
            i--;
        }
    }
}

// Bắn thêm các vì sao trôi thụ động (Star field tĩnh)
setInterval(() => {
    if(particlesArray.length < 80) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let p = new Particle(x, y);
        p.speedX = Math.random() * 1 - 0.5;
        p.speedY = Math.random() * 1 - 0.5;
        particlesArray.push(p);
    }
}, 100);

function animate() {
    // Dùng clearRect để hiển thị 100% css background, không dùng fillRect màu đục che phông nền
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    
    // Kiểm tra biến window.handPointer từ AI
    if (window.handPointer && window.handPointer.isActive) {
        // Sinh ra RẤT NHIỀU chùm tia tại vị trí tay thật để nổi bật
        for (let j = 0; j < 10; j++) {
            particlesArray.push(new Particle(window.handPointer.x, window.handPointer.y));
        }
    }
    
    handleParticles();
    requestAnimationFrame(animate);
}

animate();
