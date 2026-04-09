let magicProgress = 0;
let isStage2Active = false;
let magicYtPlayer;
let loveYtPlayer;

// Inject Youtube API
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function() {
    magicYtPlayer = new YT.Player('youtube-audio-player', {
        height: '0',
        width: '0',
        videoId: 'IePlyx767aU',
        playerVars: { 'autoplay': 0, 'controls': 0, 'loop': 1, 'playlist': 'IePlyx767aU' }
    });
    
    loveYtPlayer = new YT.Player('youtube-love-player', {
        height: '0',
        width: '0',
        videoId: '75PPdm1hTzQ',
        playerVars: { 'autoplay': 0, 'controls': 0, 'loop': 1, 'playlist': '75PPdm1hTzQ' }
    });
};

// Biến chia sẻ toạ độ ngón tay cho particles.js
window.handPointer = {
    x: undefined,
    y: undefined,
    isActive: false
};

const videoElement = document.getElementById('input_video');
const webcamPreview = document.getElementById('webcam-preview');
const startBtn = document.getElementById('start-btn');
const loadingText = document.getElementById('loading');

startBtn.addEventListener('click', async () => {
    startBtn.classList.add('hidden-element');
    loadingText.classList.remove('hidden');

    try {
        // Xin quyền camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        webcamPreview.srcObject = stream;
        videoElement.srcObject = stream; // Để mediapipe phân tích
        videoElement.play();
        
        initializeHandTracking();
    } catch (err) {
        alert("Bỏ qua lỗi: Cậu phải cho phép dùng Camera mới có phép màu chứ! Tải lại trang và thử cấp quyền lại nha (Hoặc là cậu chưa dùng đúng localhost)!");
        startBtn.classList.remove('hidden-element');
        loadingText.classList.add('hidden');
    }
});

function initializeHandTracking() {
    // Khởi tạo AI Hand Tracking của Google MediaPipe
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1, // Bắt 1 tay cho mượt
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 640,
        height: 480
    });
    
    // Bắt đầu chạy Camera cho AI phân tích
    camera.start().then(() => {
        // Chuyển sang Giai đoạn 2 khi Camera nạp xong
        document.getElementById('stage-1').classList.remove('active');
        document.getElementById('stage-1').classList.add('hidden');
        
        document.getElementById('stage-2').classList.remove('hidden');
        
        // Phát nhạc thu thập ma thuật qua Youtube Video Link
        if (magicYtPlayer && typeof magicYtPlayer.playVideo === 'function') {
            magicYtPlayer.setVolume(50); // Âm lượng 50% cho dịu nhẹ
            magicYtPlayer.playVideo();
        } else {
            console.log('Youtube Player chưa tải xong.');
        }

        setTimeout(() => {
            document.getElementById('stage-2').classList.add('active');
            isStage2Active = true;
        }, 50); // delay nhỏ để trigger css transition
    });
}

function onResults(results) {
    // Không block bằng isStage2Active nữa, để Stage 3 vẫn xài được cử chỉ tay
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Có bàn tay
        window.handPointer.isActive = true;
        const landmarks = results.multiHandLandmarks[0];
        
        // Ngón trỏ (Index Finger Tip là điểm số 8 trong landmarks)
        const indexFinger = landmarks[8];
        
        // Vì camera bị lật ngược ngang (mirror), ta tính x là 1 - x
        const screenX = (1 - indexFinger.x) * window.innerWidth;
        const screenY = indexFinger.y * window.innerHeight;
        
        window.handPointer.x = screenX;
        window.handPointer.y = screenY;
        
        // Mỗi khung hình tay di chuyển tăng thanh ma thuật lên 1 tí
        increaseMagic();
        
    } else {
        // Không nhận diện được bàn tay trong khung hình
        window.handPointer.isActive = false;
        window.handPointer.x = undefined;
        window.handPointer.y = undefined;
    }
}

function increaseMagic() {
    if (magicProgress >= 100) return;
    
    magicProgress += 0.3; // Tốc độ đầy của thanh, sau khoảng 330 frames (chúi tay vài giây) là đầy
    if (magicProgress > 100) magicProgress = 100;
    
    document.getElementById('magic-meter-fill').style.width = magicProgress + '%';
    document.getElementById('progress-percent').innerText = Math.floor(magicProgress);
    
    if (magicProgress >= 100) {
        unlockConfessionStage();
    }
}

function unlockConfessionStage() {
    isStage2Active = false;
    // Bỏ dòng window.handPointer.isActive = false; để Stage 3 vẫn ra hạt ma thuật
    
    // Giai đoạn 3 xuất hiện
    const stage2 = document.getElementById('stage-2');
    stage2.classList.remove('active');
    stage2.classList.add('hidden');
    
    const stage3 = document.getElementById('stage-3');
    stage3.classList.remove('hidden');
    
    setTimeout(() => {
        stage3.classList.add('active');
        document.body.classList.add('mode-confession'); 
        
        // Chuyển âm thanh
        if (magicYtPlayer && typeof magicYtPlayer.pauseVideo === 'function') {
            magicYtPlayer.pauseVideo();
        }
        
        if (loveYtPlayer && typeof loveYtPlayer.playVideo === 'function') {
            loveYtPlayer.setVolume(100);
            loveYtPlayer.playVideo();
        } else {
            console.log('Youtube Love Player chưa tải xong.');
        }

        // Gọi chuỗi mã lệnh animation đỉnh cao bên script.js
        if(typeof window.startConfessionSequence === 'function') {
            window.startConfessionSequence();
        }
    }, 1000); 
}
