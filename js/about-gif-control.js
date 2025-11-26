const canvas = document.getElementById("gifCanvas");
const ctx = canvas.getContext("2d");

// === НАСТРОЙКИ ===
const frameCount = 33; // ⚠️ поменяй на количество кадров твоей гифки
const framePath = "images/frames"; // путь к кадрам
const frameExt = ".png";

let frames = [];
let loaded = 0;

// Загружаем все кадры
for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = `${framePath}${i}${frameExt}`;
    img.onload = () => {
        loaded++;
        if (loaded === frameCount) {
            drawFrame(0); // первый кадр — статичный
        }
    };
    frames.push(img);
}

let currentFrame = 0;
let isDragging = false;
let lastX = 0;

function drawFrame(index) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frames[index], 0, 0, canvas.width, canvas.height);
}

canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
});

window.addEventListener("mouseup", () => {
    isDragging = false;
});

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let deltaX = e.clientX - lastX;
    lastX = e.clientX;

    if (deltaX < 0) {
        // движение влево → вперёд
        currentFrame = (currentFrame + 1) % frameCount;
    } else if (deltaX > 0) {
        // движение вправо → назад
        currentFrame = (currentFrame - 1 + frameCount) % frameCount;
    }
    drawFrame(currentFrame);
});
