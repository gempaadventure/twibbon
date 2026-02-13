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

const templates = {
    '1:1': 'TWIBBON 11.png',
    '9:16': 'TWIBBON 916 test.png'
};

function startEditor(w, h) {
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    const ratio = `${w}:${h}`;
    document.getElementById('formatLabel').innerText = `Format ${ratio}`;
    
    twibbonImg.src = templates[ratio];
    twibbonImg.onload = () => {
        // Optimasi Preview: Gunakan lebar 1000px agar tajam di layar, tapi tidak seberat file asli
        const displayWidth = 1000; 
        const scaleFactor = displayWidth / twibbonImg.naturalWidth;
        
        canvas.width = displayWidth;
        canvas.height = twibbonImg.naturalHeight * scaleFactor;

        // Reset posisi ke tengah
        imgX = canvas.width / 2;
        imgY = canvas.height / 2;

        draw();
    };
}

function draw() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    animationFrameId = requestAnimationFrame(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Preview mode: kualitas medium agar geser-geser lancar
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';

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

// Handler Upload
uploadFoto.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        userImg = new Image();
        userImg.onload = () => {
            // Auto-scale awal: menutupi canvas
            const scaleW = canvas.width / userImg.width;
            const scaleH = canvas.height / userImg.height;
            imgScale = Math.max(scaleW, scaleH);
            zoomRange.value = imgScale;
            draw();
        };
        userImg.src = event.target.result;
    };
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
});


// Fungsi untuk tombol Plus dan Minus
function adjustZoom(delta) {
    if (!userImg.src) return; // Jangan jalankan jika belum ada foto
    
    let currentValue = parseFloat(zoomRange.value);
    let newValue = currentValue + delta;
    
    // Pastikan tetap dalam batas min 0.1 dan max 5
    if (newValue < 0.1) newValue = 0.1;
    if (newValue > 5) newValue = 5;
    
    zoomRange.value = newValue;
    imgScale = newValue;
    draw();
}

// DOWNLOAD HD DENGAN NOTIFIKASI PROSES
downloadBtn.addEventListener('click', async () => {
    if (!userImg.src) {
        alert("Silakan pilih foto terlebih dahulu!");
        return;
    }

    // Indikator Loading
    const originalContent = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.style.opacity = "0.8";
    downloadBtn.innerHTML = `<span class="spinner"></span> Memproses HD...`;

    // Beri sedikit jeda agar UI sempat terupdate
    await new Promise(r => setTimeout(r, 500));

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    
    const originalWidth = twibbonImg.naturalWidth;
    const originalHeight = twibbonImg.naturalHeight;

    offCanvas.width = originalWidth;
    offCanvas.height = originalHeight;

    const ratio = originalWidth / canvas.width;

    // Export High Quality
    offCtx.imageSmoothingEnabled = true;
    offCtx.imageSmoothingQuality = 'high';

    if (userImg.src) {
        offCtx.save();
        offCtx.translate(imgX * ratio, imgY * ratio);
        offCtx.scale(imgScale * ratio, imgScale * ratio);
        offCtx.drawImage(userImg, -userImg.width / 2, -userImg.height / 2);
        offCtx.restore();
    }

    offCtx.drawImage(twibbonImg, 0, 0, originalWidth, originalHeight);

    try {
        const dataURL = offCanvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `Twibbon_HUT_GEMPA_${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        // Indikator Selesai
        downloadBtn.innerHTML = `✅ Berhasil Diunduh!`;
        downloadBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    } catch (err) {
        downloadBtn.innerHTML = `❌ Gagal Mengunduh`;
    } finally {
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = "1";
            downloadBtn.innerHTML = originalContent;
            downloadBtn.style.background = ""; // Balik ke CSS asli
        }, 3000);
    }
});

// ZOOM & DRAG (Optimized)
zoomRange.addEventListener('input', (e) => {
    imgScale = parseFloat(e.target.value);
    draw();
});

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

const startAction = (e) => {
    if (!userImg.src) return;
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
window.addEventListener('mousemove', moveAction);
window.addEventListener('mouseup', endAction);
canvas.addEventListener('touchstart', startAction, { passive: false });
canvas.addEventListener('touchmove', moveAction, { passive: false });
canvas.addEventListener('touchend', endAction);

function goBack() {
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
}

