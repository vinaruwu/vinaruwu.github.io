var splashes = [
    "Добро пожаловать на фурри вторник! :3",
    "Антон, стой!",
    "Приветик!",
    "Нужна жопа XXL",
    "бр бр потопила",
    "42 братуха",
    "54 братуха",
    "Привет, Эри!",
    "Привет, Артём!",
    "Привет, Паша!",
    "Привет, Юпин!"
];
const splashElement = document.getElementById('splash');
if (splashElement) {
    splashElement.innerText = splashes[Math.floor(Math.random() * splashes.length)];
    function adjustSplashSize() {
        const textLength = splashElement.innerText.length;
        let fontSize = 24;
        if (textLength > 10) {
            fontSize = Math.max(18, 24 - (textLength - 10) * 0.5);
        }
        splashElement.style.fontSize = `${fontSize}px`;
    }
    document.addEventListener('DOMContentLoaded', adjustSplashSize);
    setInterval(adjustSplashSize, 1000);
}

const buttonSound = document.getElementById('buttonSound');
const foxButtonSound = document.getElementById('foxButtonSound');
const menuMusic = document.getElementById('menuMusic');
const doYouLoveMe = document.getElementById('doYouLoveMe');
const idle = document.getElementById('idle');
const doYouNeedMe = document.getElementById('doYouNeedMe');
const endAudio = document.getElementById('end');
const buttons = document.querySelectorAll('.btn-minecraft');
const menuContainer = document.querySelector('.menu-container');
const contentSection = document.querySelector('.content-section');
const copyright = document.querySelector('.copyright');
const blackOverlay = document.getElementById('blackOverlay');
const meImage = document.getElementById('meImage');
const modal = document.getElementById('modal');
const question = document.getElementById('question');
const yesBtn = document.getElementById('yes');
const noBtn = document.getElementById('no');
const finalImage = document.getElementById('finalImage');
const finalImg = document.getElementById('finalImg');

if (!buttonSound) console.error("buttonSound element not found! Check audio/button_click.mp3");
if (!foxButtonSound) console.error("foxButtonSound element not found! Check audio/fox_button_click.mp3");
if (!menuMusic) console.error("menuMusic element not found! Check audio/menu_music.mp3");
if (!doYouLoveMe) console.error("doYouLoveMe element not found! Check audio/doyouloveme.mp3");
if (!idle) console.error("idle element not found! Check audio/idle.mp3");
if (!doYouNeedMe) console.error("doYouNeedMe element not found! Check audio/doyouneedme.mp3");
if (!endAudio) console.error("end element not found! Check audio/end.mp3");

let buttonVolume = 100;
let musicVolume = 0;
let panoramaSpeed = 0.0003;

if (buttonSound) {
    buttonSound.volume = buttonVolume / 100;
    buttonSound.addEventListener('error', () => console.error("Failed to load buttonSound audio: audio/button_click.mp3"));
}
if (foxButtonSound) {
    foxButtonSound.volume = buttonVolume / 100;
    foxButtonSound.addEventListener('error', () => console.error("Failed to load foxButtonSound audio: audio/fox_button_click.mp3"));
}
if (menuMusic) {
    menuMusic.volume = musicVolume / 100;
    menuMusic.addEventListener('error', () => console.error("Failed to load menuMusic audio: audio/menu_music.mp3"));
}
if (doYouLoveMe) {
    doYouLoveMe.volume = 1;
}
if (idle) {
    idle.volume = 1;
}
if (doYouNeedMe) {
    doYouNeedMe.volume = 1;
}
if (endAudio) {
    endAudio.volume = 1;
}
window.panoramaSpeed = panoramaSpeed;

document.oncontextmenu = document.oncopy = document.onselectstart = document.ondragstart = document.ondrop = (event) => {
    event.preventDefault();
    return false;
};

const confettiCanvas = document.getElementById('confetti_canvas');
if (confettiCanvas) {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const ctx = confettiCanvas.getContext('2d');
    const confettiImage = new Image();
    confettiImage.src = 'images/confetti.png';
    let particles = [];

    class Particle {
        constructor() {
            this.x = Math.random() * confettiCanvas.width;
            this.y = confettiCanvas.height + 10;
            this.vx = (Math.random() - 0.5) * 16;
            this.vy = -(Math.random() * 8 + 8);
            this.rotation = Math.random() * 360;
            this.vRotation = (Math.random() - 0.5) * 360;
            this.opacity = 1;
            this.scale = Math.random() * 0.5 + 0.5;
            this.lifetime = 3000;
            this.creationTime = performance.now();
        }

        update(deltaTime) {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            this.rotation += this.vRotation * deltaTime;
            const elapsed = performance.now() - this.creationTime;
            this.opacity = Math.max(0, 1 - elapsed / this.lifetime);
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.scale(this.scale, this.scale);
            ctx.drawImage(confettiImage, -25, -25, 50, 50);
            ctx.restore();
        }
    }

    function createConfetti() {
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }
    }

    function animateConfetti(timestamp) {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        const deltaTime = 16 / 1000;
        particles = particles.filter(p => p.opacity > 0);
        particles.forEach(p => {
            p.update(deltaTime);
            p.draw();
        });
        if (particles.length > 0) {
            requestAnimationFrame(animateConfetti);
        }
    }

    confettiImage.onload = () => {
        console.log("Confetti image loaded");
    };
    confettiImage.onerror = () => {
        console.error("Failed to load confetti image: images/confetti.png");
    };

    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
}

const totalFrames = 79;
const frames = new Array(totalFrames);
let loadedFrames = 0;

function preloadFrames() {
    for (let i = 0; i < totalFrames; i++) {
        const img = new Image();
        img.src = `images/frames/frame${i}.png?t=${Date.now()}`;
        img.onload = () => {
            frames[i] = img;
            loadedFrames++;
            if (loadedFrames === totalFrames) {
                console.log("All frames preloaded:", loadedFrames);
            }
        };
        img.onerror = () => {
            console.error(`Failed to load images/frames/frame${i}.png`);
            loadedFrames++;
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    preloadFrames();
    // Инициализация обработчика для кнопки "Готово" на всех страницах
    document.addEventListener('click', (event) => {
        const backButton = event.target.closest('.btn-minecraft[data-action="back"]');
        if (backButton) {
            event.preventDefault(); // Чтобы не перезагружалась страница
            if (buttonSound) {
                buttonSound.pause();
                buttonSound.currentTime = 0;
                buttonSound.play().catch(error => console.error("Ошибка звука:", error));
            }
            showMenu();
            history.replaceState({}, '', '/'); // ← оставляем только replace, а не push
        }
    });
    // Проверка URL при загрузке страницы
    const path = window.location.pathname;
    const pages = ['/about.html', '/contacts.html', '/settings.html'];
    if (pages.includes(path)) {
        console.log(`Direct access to ${path}, redirecting to main page and loading content`);
        history.replaceState({}, '', '/');
        loadPage(path, path.replace('.html', ''));
    }
});

function initializeSliders() {
    const sliders = [
        {
            id: "buttonVolume",
            labelId: "buttonVolumeLabel",
            value: buttonVolume,
            format: (value) => `Звук кнопок: ${value}%`,
            ariaFormat: (value) => `Громкость кнопок: ${value}%`,
            callback: (value) => {
                buttonVolume = value;
                if (buttonSound) {
                    buttonSound.volume = value / 100;
                    console.log("Button volume set to:", value / 100);
                }
                if (foxButtonSound) {
                    foxButtonSound.volume = value / 100;
                    console.log("Fox button volume set to:", value / 100);
                }
            }
        },
        {
            id: "musicVolume",
            labelId: "musicVolumeLabel",
            value: musicVolume,
            format: (value) => `Музыка: ${value == 0 ? "Откл." : `${value}%`}`,
            ariaFormat: (value) => `Громкость музыки: ${value == 0 ? "Откл." : `${value}%`}`,
            callback: (value) => {
                musicVolume = value;
                if (menuMusic) {
                    menuMusic.volume = value / 100;
                    console.log("Music volume set to:", value / 100);
                    if (value > 0 && menuMusic.paused) {
                        menuMusic.play().catch(error => console.error("Ошибка воспроизведения музыки:", error));
                    } else if (value === 0) {
                        menuMusic.pause();
                        console.log("Music paused");
                    }
                }
            }
        },
        {
            id: "panoramaSpeed",
            labelId: "panoramaSpeedLabel",
            value: panoramaSpeed,
            format: (value) => `Скорость панорамы: ${parseFloat(value).toFixed(4)}`,
            ariaFormat: (value) => `Скорость панорамы: ${parseFloat(value).toFixed(4)}`,
            callback: (value) => {
                panoramaSpeed = parseFloat(value);
                window.panoramaSpeed = panoramaSpeed;
                console.log("Panorama speed set to:", panoramaSpeed);
            }
        }
    ];

    sliders.forEach(slider => {
        const el = document.getElementById(slider.id);
        const labelEl = document.getElementById(slider.labelId);
        if (!el || !labelEl) {
            console.error(`Slider or label not found: ${slider.id}, ${slider.labelId}`);
            return;
        }

        el.value = slider.value;
        el.setAttribute('aria-label', slider.ariaFormat(slider.value));
        labelEl.textContent = slider.format(slider.value);
        slider.callback(slider.value);

        el.addEventListener('input', () => {
            const value = el.value;
            el.setAttribute('aria-label', slider.ariaFormat(value));
            labelEl.textContent = slider.format(value);
            slider.callback(value);
        });

        el.addEventListener('keydown', (event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                if (buttonSound) {
                    buttonSound.pause();
                    buttonSound.currentTime = 0;
                    buttonSound.play().catch(error => console.error("Ошибка звука:", error));
                }
            }
        });
    });
}

function loadPage(href, page) {
    if (href.startsWith('http://') || href.startsWith('https://')) {
        if (buttonSound) {
            buttonSound.pause();
            buttonSound.currentTime = 0;
            buttonSound.play().catch(error => console.error("Ошибка воспроизведения звука:", error));
        }
        window.open(href, '_blank');
        return;
    }

    if (page === 'music') {
        if (buttonSound) {
            buttonSound.pause();
            buttonSound.currentTime = 0;
            buttonSound.play().catch(error => console.error("Ошибка воспроизведения звука:", error));
        }
        window.open(href, '_blank');
        return;
    }

    if (buttonSound) {
        buttonSound.pause();
        buttonSound.currentTime = 0;
        buttonSound.play().catch(error => console.error("Ошибка звука:", error));
    }
    // Устанавливаем URL на vinar.lol
    history.replaceState({}, '', '/'); // ← заменил на replaceState, чтоб не плодить историю
    fetch(href)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(data, 'text/html');
            const newContent = newDoc.querySelector('.content-section');
            if (newContent && menuContainer && contentSection) {
                menuContainer.style.display = 'none';
                contentSection.innerHTML = newContent.innerHTML;
                contentSection.style.display = 'block';
                console.log(`Loaded page: ${href}`);
                if (newContent.classList.contains('settings')) {
                    console.log("Settings page loaded, initializing sliders");
                    initializeSliders();
                }
                if (newContent.classList.contains('contacts')) {
                    console.log("Contacts page loaded, initializing contact buttons");
                    const contactButtons = contentSection.querySelectorAll('.contact-button');
                    contactButtons.forEach(btn => {
                        btn.addEventListener('click', function(event) {
                            event.preventDefault();
                            const href = btn.getAttribute('href');
                            if (href) {
                                if (buttonSound) {
                                    buttonSound.pause();
                                    buttonSound.currentTime = 0;
                                    buttonSound.play().catch(error => console.error("Ошибка звука:", error));
                                }
                                window.open(href, '_blank');
                            }
                        });
                    });
                }
                if (page === 'about') {
                    const canvas = document.getElementById('gif_canvas');
                    if (canvas) {
                        const isMobile = window.innerWidth <= 600;
                        canvas.width = isMobile ? 250 : 300;
                        canvas.height = isMobile ? 250 : 300;
                        const ctx = canvas.getContext('2d');
                        let currentFrame = 0;
                        let isDragging = false;
                        let startX = 0;
                        let lastX = 0;
                        let velocity = 0;
                        let lastTime = 0;
                        let isAutoRotating = true;
                        const sensitivity = 10;
                        const friction = 0.7;
                        const minVelocity = 0.01;
                        const maxVelocity = 100;
                        const velocityScale = 1.2;
                        const inertiaThreshold = 0.1;

                        function mod(n, m) {
                            return ((n % m) + m) % m;
                        }

                        function drawFrame(frameIndex) {
                            const index = Math.floor(mod(frameIndex, totalFrames));
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            if (frames[index]) {
                                const cropX = (1920 - 1080) / 2;
                                const cropY = 0;
                                const cropWidth = 1080;
                                const cropHeight = 1080;

                                const drawWidth = canvas.width;
                                const drawHeight = canvas.height;
                                const offsetX = 0;
                                const offsetY = 0;

                                ctx.drawImage(
                                    frames[index],
                                    cropX, cropY, cropWidth, cropHeight,
                                    offsetX, offsetY, drawWidth, drawHeight
                                );
                            } else {
                                console.error(`Frame ${index} not loaded`);
                            }
                        }

                        function autoRotateAnimation(timestamp) {
                            if (isAutoRotating) {
                                if (!lastTime) lastTime = timestamp;
                                const dt = (timestamp - lastTime) / 1000;
                                currentFrame = mod(currentFrame + window.panoramaSpeed * 10000 * dt, totalFrames);
                                drawFrame(currentFrame);
                                lastTime = timestamp;
                                requestAnimationFrame(autoRotateAnimation);
                            }
                        }

                        function resumeAutoRotation() {
                            if (!isAutoRotating && !isDragging) {
                                setTimeout(() => {
                                    isAutoRotating = true;
                                    lastTime = performance.now();
                                    requestAnimationFrame(autoRotateAnimation);
                                }, 5000);
                            }
                        }

                        function inertiaAnimation(timestamp) {
                            if (!lastTime) lastTime = timestamp;
                            const dt = (timestamp - lastTime) / 1000;
                            lastTime = timestamp;

                            currentFrame = mod(currentFrame + velocity * dt, totalFrames);
                            drawFrame(currentFrame);

                            velocity *= friction;
                            if (Math.abs(velocity) > minVelocity) {
                                requestAnimationFrame(inertiaAnimation);
                            } else {
                                velocity = 0;
                                resumeAutoRotation();
                            }
                        }

                        if (loadedFrames === totalFrames) {
                            console.log("All frames loaded, starting animation");
                            drawFrame(0);
                            requestAnimationFrame(autoRotateAnimation);
                        } else {
                            console.warn("Waiting for frames to load:", loadedFrames, "/", totalFrames);
                            const checkFramesInterval = setInterval(() => {
                                if (loadedFrames === totalFrames) {
                                    clearInterval(checkFramesInterval);
                                    console.log("All frames loaded, starting animation");
                                    drawFrame(0);
                                    requestAnimationFrame(autoRotateAnimation);
                                }
                            }, 100);
                        }

                        canvas.addEventListener('mousedown', (event) => {
                            if (loadedFrames === totalFrames) {
                                isAutoRotating = false;
                                isDragging = true;
                                startX = event.clientX;
                                lastX = event.clientX;
                                lastTime = performance.now();
                                velocity = 0;
                                canvas.style.cursor = 'grabbing';
                            }
                        });

                        document.addEventListener('mousemove', (event) => {
                            if (isDragging && loadedFrames === totalFrames) {
                                const dx = event.clientX - lastX;
                                const framesToShift = dx / sensitivity;
                                currentFrame = mod(currentFrame - framesToShift, totalFrames);
                                drawFrame(currentFrame);

                                const currentTime = performance.now();
                                const dt = (currentTime - lastTime) / 1000;
                                if (dt > 0) {
                                    velocity = -(framesToShift / dt) * velocityScale;
                                    velocity = Math.max(Math.min(velocity, maxVelocity), -maxVelocity);
                                }

                                lastX = event.clientX;
                                lastTime = currentTime;
                            }
                        });

                        document.addEventListener('mouseup', () => {
                            if (isDragging) {
                                isDragging = false;
                                canvas.style.cursor = 'grab';
                                if (Math.abs(velocity) > inertiaThreshold) {
                                    lastTime = performance.now();
                                    requestAnimationFrame(inertiaAnimation);
                                } else {
                                    velocity = 0;
                                    resumeAutoRotation();
                                }
                            }
                        });

                        document.addEventListener('mouseleave', () => {
                            if (isDragging) {
                                isDragging = false;
                                canvas.style.cursor = 'grab';
                                if (Math.abs(velocity) > inertiaThreshold) {
                                    lastTime = performance.now();
                                    requestAnimationFrame(inertiaAnimation);
                                } else {
                                    velocity = 0;
                                    resumeAutoRotation();
                                }
                            }
                        });

                        canvas.addEventListener('touchstart', (event) => {
                            if (loadedFrames === totalFrames) {
                                isAutoRotating = false;
                                isDragging = true;
                                startX = event.touches[0].clientX;
                                lastX = event.touches[0].clientX;
                                lastTime = performance.now();
                                velocity = 0;
                                canvas.style.cursor = 'grabbing';
                            }
                        });

                        document.addEventListener('touchmove', (event) => {
                            if (isDragging && loadedFrames === totalFrames) {
                                event.preventDefault();
                                const dx = event.touches[0].clientX - lastX;
                                const framesToShift = dx / sensitivity;
                                currentFrame = mod(currentFrame - framesToShift, totalFrames);
                                drawFrame(currentFrame);

                                const currentTime = performance.now();
                                const dt = (currentTime - lastTime) / 1000;
                                if (dt > 0) {
                                    velocity = -(framesToShift / dt) * velocityScale;
                                    velocity = Math.max(Math.min(velocity, maxVelocity), -maxVelocity);
                                }

                                lastX = event.touches[0].clientX;
                                lastTime = currentTime;
                            }
                        });

                        document.addEventListener('touchend', () => {
                            if (isDragging) {
                                isDragging = false;
                                canvas.style.cursor = 'grab';
                                if (Math.abs(velocity) > inertiaThreshold) {
                                    lastTime = performance.now();
                                    requestAnimationFrame(inertiaAnimation);
                                } else {
                                    velocity = 0;
                                    resumeAutoRotation();
                                }
                            }
                        });
                    } else {
                        console.error("Canvas not found on about page!");
                    }
                }
            } else {
                console.error("Контейнер .content-section не найден на странице:", href);
            }
        })
        .catch(error => console.error("Ошибка загрузки страницы:", error));
}

function showMenu() {
    if (menuContainer && contentSection) {
        menuContainer.style.display = 'block';
        contentSection.style.display = 'none';
        contentSection.innerHTML = '';
        history.replaceState({}, '', '/'); // ← заменил на replaceState
        console.log("Returned to main menu");
    } else {
        console.error("menuContainer or contentSection not found");
    }
}

buttons.forEach(btn => {
    btn.addEventListener('click', function(event) {
        event.preventDefault();
        const href = btn.getAttribute('href');
        const page = btn.getAttribute('data-page');
        const isExitButton = btn.getAttribute('data-special') === 'exit';
        if (isExitButton) {
            if (foxButtonSound) {
                foxButtonSound.pause();
                foxButtonSound.currentTime = 0;
                foxButtonSound.play().catch(error => console.error("Ошибка воспроизведения звука foxButtonSound:", error));
            }
            if (confettiCanvas) {
                createConfetti();
                requestAnimationFrame(animateConfetti);
            }
        } else if (buttonSound) {
            buttonSound.pause();
            buttonSound.currentTime = 0;
            buttonSound.play().catch(error => console.error("Ошибка воспроизведения звука:", error));
        }
        if (href && href !== '#' && page) {
            loadPage(href, page);
        }
    });
    btn.addEventListener('mouseleave', () => {
        btn.blur();
    });
    btn.addEventListener('mouseover', () => {
        window.status = '';
    });
    btn.addEventListener('mouseout', () => {
        window.status = '';
    });
});

let currentQuestion = 1;
let allYes = true;
let idleLoopCount = 0; // Счётчик воспроизведений idle.mp3

function showModal(q) {
    question.textContent = q;
    modal.style.display = 'block';
    console.log(`Modal shown with question: ${q}`);
}

function handleChoice(choice) {
    if (choice === 'no') {
        allYes = false;
    }
    modal.style.display = 'none';
    console.log(`Choice made: ${choice}, allYes: ${allYes}`);
    idle.pause();
    idle.currentTime = 0;
    meImage.classList.remove('bounce', 'stretch', 'zoomIn'); // Удаляем все предыдущие анимации
    if (currentQuestion === 1) {
        // После ответа на "Do you love me?" показываем следующий модал и воспроизводим doYouNeedMe.mp3
        currentQuestion = 2; // ← переместила сюда, чтоб сразу обновить
        showModal("Do you need me?"); // ← добавила показ второго модала сразу после ответа!
        doYouNeedMe.play().catch(error => console.error("Ошибка воспроизведения doYouNeedMe.mp3:", error));
        meImage.classList.add('stretch');
        doYouNeedMe.addEventListener('ended', () => {
            console.log("doYouNeedMe.mp3 ended, resuming idle.mp3 with bounce animation");
            meImage.classList.remove('stretch');
            meImage.classList.add('bounce');
            idle.play().catch(error => console.error("Ошибка воспроизведения idle.mp3:", error));
        }, { once: true });
    } else {
        console.log("Starting end.mp3 and applying glitch animation to meImage");
        meImage.style.display = 'block'; // Убедимся, что изображение видно
        endAudio.play().catch(error => console.error("Ошибка воспроизведения end.mp3:", error));
        meImage.classList.add('glitch');
        endAudio.addEventListener('ended', () => {
            console.log("end.mp3 finished, removing glitch animation");
            meImage.classList.remove('glitch');
            setTimeout(() => {
                console.log("Applying zoomIn animation to meImage");
                meImage.classList.add('zoomIn');
                meImage.addEventListener('animationend', () => {
                    console.log("zoomIn animation finished, hiding meImage and showing finalImage");
                    meImage.classList.remove('zoomIn');
                    meImage.style.display = 'none';
                    finalImg.src = allYes ? 'images/end_image2.png' : 'images/end_image.png';
                    finalImage.style.display = 'block';
                    setTimeout(() => {
                        console.log("Reloading page after 5 seconds");
                        location.reload();
                    }, 5000);
                }, { once: true });
            }, 0); // Задержка перед zoomIn
        }, { once: true });
    }
}

if (copyright) {
    copyright.addEventListener('click', () => {
        console.log("Copyright clicked, starting sequence");
        menuContainer.style.display = 'none';
        contentSection.style.display = 'none';
        blackOverlay.style.display = 'block';
        meImage.style.display = 'block';
        if (menuMusic) menuMusic.pause();
        currentQuestion = 1;
        allYes = true;
        idleLoopCount = 0; // Сбрасываем счётчик при клике
        setTimeout(() => {
            console.log("Playing doYouLoveMe.mp3 and showing modal");
            doYouLoveMe.play().catch(error => console.error("Ошибка воспроизведения doYouLoveMe.mp3:", error));
            meImage.classList.add('stretch');
            showModal("Do you love me?");
        }, 3000);
    });
}

if (doYouLoveMe) {
    doYouLoveMe.addEventListener('ended', () => {
        console.log("doYouLoveMe.mp3 finished, starting idle.mp3 with bounce animation");
        meImage.classList.remove('stretch');
        meImage.classList.add('bounce');
        idleLoopCount = 0; // Сбрасываем перед первым воспроизведением
        idle.play().catch(error => console.error("Ошибка воспроизведения idle.mp3:", error));
    }, { once: true });
}

if (idle) {
    idle.addEventListener('ended', () => {
        idleLoopCount++; // Увеличиваем счётчик
        console.log(`idle.mp3 ended, loop count: ${idleLoopCount}, currentQuestion: ${currentQuestion}`);
        if (currentQuestion === 1 && idleLoopCount === 1) {
            // После первого воспроизведения просто запускаем idle.mp3 снова
            idle.play().catch(error => console.error("Ошибка воспроизведения idle.mp3:", error));
        } else if (currentQuestion === 1 && idleLoopCount === 2) {
            // Убрала показ второго модала отсюда, теперь он в handleChoice после ответа на первый!
            idle.play().catch(error => console.error("Ошибка воспроизведения idle.mp3:", error));
        } else {
            // Продолжаем воспроизведение idle.mp3 в других случаях
            idle.play().catch(error => console.error("Ошибка воспроизведения idle.mp3:", error));
        }
    });
}

if (yesBtn) {
    yesBtn.addEventListener('click', () => {
        buttonSound.pause();
        buttonSound.currentTime = 0;
        buttonSound.play().catch(error => console.error("Ошибка звука:", error));
        console.log("Yes button clicked");
        handleChoice('yes');
    });
}

if (noBtn) {
    noBtn.addEventListener('click', () => {
        buttonSound.pause();
        buttonSound.currentTime = 0;
        buttonSound.play().catch(error => console.error("Ошибка звука:", error));
        console.log("No button clicked");
        handleChoice('no');
    });
}

if (meImage) {
    meImage.oncontextmenu = () => false;
    meImage.oncopy = () => false;
    meImage.onselectstart = () => false;
    meImage.ondragstart = () => false;
    meImage.ondrop = () => false;
}

if (finalImg) {
    finalImg.oncontextmenu = () => false;
    finalImg.oncopy = () => false;
    finalImg.onselectstart = () => false;
    finalImg.ondragstart = () => false;
    finalImg.ondrop = () => false;

}
