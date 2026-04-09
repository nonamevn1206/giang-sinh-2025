const txtElem = document.getElementById('typewriter-text');
const btnContainer = document.getElementById('btn-container');
const imgContainer = document.getElementById('reveal-image-container');
const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const confessionText = "Tớ đã giữ bí mật này lâu lắm rồi... Cậu làm người yêu tớ nhé?";
const loveAudio = document.getElementById('love-audio'); // Quản lý nhạc tình yêu

window.startConfessionSequence = function() {
    // Thêm các hạt bụi phép thuật trôi lơ lửng ở Stage 3 ngay lập tức
    startStage3AmbientParticles();

    setTimeout(() => {
        imgContainer.classList.remove('scale-zero');
        imgContainer.classList.add('elastic-bounce');
    }, 500);
    
    setTimeout(() => {
        typeWriter(0);
    }, 1500);
    
    // Parallax mượt nhẹ (nhẹ nhàng hơn cũ)
    const card = document.getElementById('love-card');
    window.addEventListener('mousemove', (e) => {
        let xAxis = (window.innerWidth / 2 - e.pageX) / 40;
        let yAxis = (window.innerHeight / 2 - e.pageY) / 40;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
}

function typeWriter(i) {
    if (i < confessionText.length) {
        txtElem.innerHTML += confessionText.charAt(i);
        setTimeout(() => typeWriter(i + 1), 70); 
    } else {
        txtElem.classList.remove('typing-cursor');
        setTimeout(() => {
            btnContainer.classList.remove('hidden-element');
            btnContainer.classList.add('fade-in-up');
            activateDodgeProtocol();
        }, 800);
    }
}

function activateDodgeProtocol() {
    const dodge = () => {
        const maxX = window.innerWidth - noBtn.offsetWidth - 20;
        const maxY = window.innerHeight - noBtn.offsetHeight - 20;
        
        // Trải nghiệm bớt giật cục hơn cho nút
        let randomX = Math.floor(Math.random() * maxX);
        let randomY = Math.floor(Math.random() * maxY);
        
        let randomScale = 0.8 + Math.random() * 0.4;
        let randomRotate = Math.floor(Math.random() * 90) - 45; // Xoay ít thôi cho đỡ mỏi mắt
        
        noBtn.style.position = 'fixed';
        noBtn.style.transition = 'all 0.4s ease-out';
        noBtn.style.left = randomX + 'px';
        noBtn.style.top = randomY + 'px';
        noBtn.style.transform = `scale(${randomScale}) rotate(${randomRotate}deg)`;
        
        const teases = ["Đâu dễ thế 🥰", "Lêu Lêu 😜", "Sao mà nhấn được!", "Nhấn nút 'Đồng ý' kia kìa 😘", "Đừng cố 🥳"];
        noBtn.innerHTML = teases[Math.floor(Math.random() * teases.length)];
    };

    noBtn.addEventListener('mousemove', dodge); // mousemove êm hơn mouseover
    noBtn.addEventListener('touchstart', dodge);
    noBtn.addEventListener('click', dodge);
}

yesBtn.addEventListener('click', () => {
    btnContainer.style.display = 'none';
    txtElem.style.display = 'none';
    
    const mainImg = imgContainer.querySelector('img');
    mainImg.src = 'happy.png';
    mainImg.style.transform = 'scale(1.1)';
    mainImg.style.boxShadow = '0 0 50px rgba(255, 105, 135, 0.8)'; // Dịu hơn
    
    const msg = document.getElementById('message');
    msg.classList.remove('hidden');
    msg.classList.add('fade-in-up');
    
    document.body.classList.add('mode-celebration');
    triggerMegaParticleStorm();
    
    // Chuyển sang Giai đoạn chốt hạ (Stage 4) sau 4.5 giây
    setTimeout(() => {
        document.getElementById('stage-3').classList.remove('active');
        document.getElementById('stage-3').classList.add('hidden');
        
        const stage4 = document.getElementById('stage-4');
        stage4.classList.remove('hidden');
        setTimeout(() => {
            stage4.classList.add('active');
            triggerKissStorm();
        }, 500);
    }, 4500); // Đổi thành 4.5s
});

function triggerMegaParticleStorm() {
    // 1. Pháo hoa bung toả chậm, nhẹ nhàng
    const fireworksContainer = document.getElementById('mega-fireworks-container');
    const colors = ['#ffffff', '#ffb6c1', '#ff69b4', '#ffe4e1'];
    
    let fwTimer = setInterval(() => {
        let cx = window.innerWidth / 2 + (Math.random() * 800 - 400);
        let cy = window.innerHeight / 2 + (Math.random() * 500 - 250);
        
        // Ít tia pháo hoa hơn (20 thay vì 40)
        for (let i = 0; i < 20; i++) {
            let particle = document.createElement('div');
            particle.classList.add('mega-firework');
            particle.style.left = cx + 'px';
            particle.style.top = cy + 'px';
            
            let size = Math.random() * 10 + 5;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            let angle = Math.random() * Math.PI * 2;
            let force = Math.random() * 10 + 5; // Lực yếu đi để bung chậm
            particle.style.setProperty('--sx', Math.cos(angle) * force);
            particle.style.setProperty('--sy', Math.sin(angle) * force);
            
            fireworksContainer.appendChild(particle);
            setTimeout(() => particle.remove(), 2000); // Tồn tại lâu hơn một xíu cho mượt
        }
    }, 600);

    // 2. Mưa mây trái tim mộng mơ
    const heartsLayer = document.getElementById('hearts-layer');
    const hSymbols = ['🌸', '💖', '💝', '✨', '💕', '💗'];
    
    let heartTimer = setInterval(() => {
        let heart = document.createElement('div');
        heart.classList.add('falling-heart');
        heart.innerHTML = hSymbols[Math.floor(Math.random() * hSymbols.length)];
        heart.style.left = Math.random() * window.innerWidth + 'px';
        heart.style.fontSize = Math.random() * 30 + 15 + 'px';
        heart.style.animationDuration = Math.random() * 3 + 3 + 's'; // Rơi chậm
        
        heartsLayer.appendChild(heart);
        setTimeout(() => heart.remove(), 6000);
    }, 150); 
    
    setTimeout(() => {
        clearInterval(fwTimer);
        clearInterval(heartTimer);
    }, 45000);
}

// ------ KISS STORM CHO GIAI ĐOẠN 4 ------
function triggerKissStorm() {
    const heartsLayer = document.getElementById('hearts-layer');
    setInterval(() => {
        let kiss = document.createElement('div');
        kiss.classList.add('falling-heart');
        kiss.innerHTML = '💋';
        kiss.style.left = Math.random() * window.innerWidth + 'px';
        kiss.style.fontSize = Math.random() * 50 + 40 + 'px'; // Cỡ siêu bự
        kiss.style.animationDuration = Math.random() * 2 + 1 + 's'; // Rơi vèo vèo kiểu vồ vập
        kiss.style.zIndex = '99999';
        
        heartsLayer.appendChild(kiss);
        setTimeout(() => kiss.remove(), 3000);
    }, 150); // Mật độ dày đặc
}

// ------ AMBIENT PARTICLES (Lơ lửng thụ động) ------
function startStage3AmbientParticles() {
    const heartsLayer = document.getElementById('hearts-layer');
    setInterval(() => {
        const p = document.createElement('div');
        p.classList.add('falling-heart');
        p.innerHTML = ['✨','💫','🌟','💖'][Math.floor(Math.random()*4)];
        p.style.left = Math.random() * window.innerWidth + 'px';
        p.style.fontSize = Math.random() * 15 + 10 + 'px';
        p.style.opacity = '0.4';
        p.style.animationDuration = Math.random() * 4 + 4 + 's';
        
        heartsLayer.appendChild(p);
        setTimeout(() => p.remove(), 8000);
    }, 400); // Mỗi 0.4s rơi 1 hạt tạo không gian động
}

// ------ INTERACTIVE CLICK (Nụ hôn, Trái tim phình to khi chạm) ------
document.addEventListener('click', createClickEffect);
document.addEventListener('touchstart', (e) => {
    if(e.touches.length > 0) {
        createClickEffect(e.touches[0]);
    }
}, {passive: true});

function createClickEffect(e) {
    // Chỉ kích hoạt ở Giai đoạn Tỏ Tình (Stage 3)
    const stage3 = document.getElementById('stage-3');
    if (!stage3.classList.contains('active')) return;
    
    // Nếu vô tình click trúng nút thì bỏ qua để nút chạy sự kiện của nó
    if(e.target.tagName === 'BUTTON') return;
    
    const clickEmojis = ['❤️', '💋', '💖', '💘', '🌸'];
    const el = document.createElement('div');
    el.innerHTML = clickEmojis[Math.floor(Math.random() * clickEmojis.length)];
    el.className = 'click-animation';
    el.style.left = e.clientX + 'px';
    el.style.top = e.clientY + 'px';
    
    document.body.appendChild(el);
    
    setTimeout(() => {
        el.remove();
    }, 1500);
}
