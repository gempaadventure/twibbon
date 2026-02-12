const canvas = document.getElementById('twibbonCanvas');
const ctx = canvas.getContext('2d');
const uploadFoto = document.getElementById('uploadFoto');
const zoomRange = document.getElementById('zoomRange');
const downloadBtn = document.getElementById('downloadBtn');

let userImg = new Image();
let twibbonImg = new Image();
let imgX = 0, imgY = 0, imgScale = 1;
let isDragging = false, startX, startY;
let animationFrameId = null;

// Konfigurasi Template
const templates = {
    '1:1': 'TWIBBON 11.png',
    '9:16': 'TWIBBON 916.png'
};

function startEditor(w, h) {
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    const ratio = `${w}:${h}`;
    document.getElementById('formatLabel').innerText = `Format ${ratio}`;
    
    twibbonImg.src = templates[ratio];
    twibbonImg.onload = () => {

        const displayWidth = 800;
        const scaleFactor = displayWidth / twibbonImg.naturalWidth;
        
        canvas.width = displayWidth;
        canvas.height = twibbonImg.naturalHeight * scaleFactor;

        imgX = canvas.width / 2;
        imgY = canvas.height / 2;

        draw();
    };
}

// 🔥 DRAW OPTIMASI (pakai requestAnimationFrame)
function draw() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    animationFrameId = requestAnimationFrame(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low';

        if (userImg.src) {
            ctx.save();
            ctx.translate(imgX, imgY);
            ctx.scale(imgScale, imgScale);
            ctx.drawImage(userImg, -userImg.width / 2, -userImg.height / 2);
            ctx.restore();
        }

        ctx.drawImage(twibbonImg, 0, 0, canvas.width, canvas.height);
    });
}

// Upload Foto
uploadFoto.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        userImg = new Image();
        userImg.onload = () => {
            imgScale = (canvas.width / userImg.width);
            zoomRange.value = imgScale;
            draw();
        };
        userImg.src = event.target.result;
    };
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
});

// 🔥 DOWNLOAD RESOLUSI ASLI (HD FIX)
downloadBtn.addEventListener('click', () => {

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    
    const originalWidth = twibbonImg.naturalWidth;
    const originalHeight = twibbonImg.naturalHeight;

    offCanvas.width = originalWidth;
    offCanvas.height = originalHeight;

    const ratio = originalWidth / canvas.width;

    if (userImg.src) {
        offCtx.save();
        offCtx.translate(imgX * ratio, imgY * ratio);
        offCtx.scale(imgScale * ratio, imgScale * ratio);

        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high';

        offCtx.drawImage(userImg, -userImg.width / 2, -userImg.height / 2);
        offCtx.restore();
    }

    offCtx.drawImage(twibbonImg, 0, 0, originalWidth, originalHeight);

    const dataURL = offCanvas.toDataURL("image/png", 1.0);

    const link = document.createElement('a');
    link.download = `Twibbon_HD_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
});

// Zoom
zoomRange.addEventListener('input', (e) => {
    imgScale = parseFloat(e.target.value);
    draw();
});

// Helper Koordinat
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

// Drag
const startAction = (e) => {
    isDragging = true;
    const pos = getPointerPos(e);
    startX = pos.x - imgX;
    startY = pos.y - imgY;
};

const moveAction = (e) => {
    if (!isDragging) return;
    if (e.type === 'touchmove') e.preventDefault();

    const pos = getPointerPos(e);
    imgX = pos.x - startX;
    imgY = pos.y - startY;

    draw();
};

const endAction = () => isDragging = false;

canvas.addEventListener('mousedown', startAction);
canvas.addEventListener('mousemove', moveAction);
window.addEventListener('mouseup', endAction);

canvas.addEventListener('touchstart', startAction, { passive: false });
canvas.addEventListener('touchmove', moveAction, { passive: false });
canvas.addEventListener('touchend', endAction);
