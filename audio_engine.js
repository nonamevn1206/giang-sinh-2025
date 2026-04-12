// Hệ thống tạo Âm thanh bằng Web Audio API - Cải tiến Chân Thực 100%
let audioCtx;
const initAudio = () => {
    // Khởi tạo ngữ cảnh Audio khi có hành động
    window.addEventListener('click', () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }, { once: true });
}

// Hàm sinh tạp âm Vật lý (Giống tiếng nứt, vỡ, đất đá) thay thế tiếng điện tử Bíp Bíp
function createNoiseBuffer(audioCtx, duration) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // Tạo tạp âm trắng (White Noise) cực gắt
    }
    return buffer;
}

function playRealSound(type) {
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    
    if (type === 'pig') {
        // Tiếng heo ụt ịt xài sóng hài âm trầm
        const osc = audioCtx.createOscillator();
        const res = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15); // Hạ giọng khẹc
        res.gain.setValueAtTime(0.4, now);
        res.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(res); res.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.15);
        return;
    }

    // Các tiếng vật lý liên quan tới Gió, Đất vỡ, Đá nứt
    const duration = type === 'break' ? 0.25 : 0.1;
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(audioCtx, duration);
    
    // Ép dải tần thành tiếng Đất Đá bằng màng lọc (EQ)
    const filter = audioCtx.createBiquadFilter();
    filter.type = type === 'break' ? 'bandpass' : 'lowpass';
    filter.frequency.value = type === 'break' ? 1200 : 800; // 1200Hz tạo độ sắc bén của miểng chai/đá vỡ, 800Hz là tiếng bước lầm lỳ
    
    // Bao vây âm vực (Tránh méo tiếng, thu dọn gọn gàng như MC)
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(type === 'break' ? 1.0 : 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseSource.start(now);
}

window.playBreakSound = () => playRealSound('break');
window.playPlaceSound = () => playRealSound('place');
window.playFootstepSound = () => playRealSound('footstep');
window.playPigSound = () => playRealSound('pig');
