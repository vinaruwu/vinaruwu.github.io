/* ============================================================
   vinar.lol — логика визитки в виде меню Minecraft 1.16.1
   ============================================================ */
(function () {
    'use strict';

    // ===== сплэши — наши, ванильная отрисовка =====
    var SPLASHES = [
        'Добро пожаловать на фурри вторник! :3',
        'Антон, стой!',
        'Приветик!',
        'Нужна жопа XXL',
        'бр бр потопила',
        '42 братуха',
        '54 братуха',
        'Привет, Эри!',
        'Привет, Артём!',
        'Привет, Паша!',
        'Привет, Юпин!'
    ];

    // ===== константы ванильного вида =====
    var FONT_SIZE_U = 10;       // кегль (em) текста GUI в u: у шрифта caps = 0.7em -> 7u, как в ванилле
    var DEBUG = new URLSearchParams(location.search);
    function debugNum(name, fallback) {
        var raw = DEBUG.get(name);
        if (raw === null || raw === '' || isNaN(parseFloat(raw))) { return fallback; }
        return parseFloat(raw);
    }
    var PANORAMA_SPEED = debugNum('speed', 1.0);   // скорость вращения панорамы, град/с
    var PANORAMA_YAW0 = debugNum('yaw', 12);     // стартовый ракурс (подогнан по референсу)
    var PANORAMA_PITCH = debugNum('pitch', -30);   // наклон камеры вниз
    if (DEBUG.get('still') === '1') { PANORAMA_SPEED = 0; }
    if (DEBUG.get('noblur') === '1') { document.body.classList.add('noblur'); }

    // ===== GUI-масштаб: формула auto 1.16.1 (делит окно, пока >= 320x240, cap 4) =====
    function calcScale() {
        var forced = new URLSearchParams(location.search).get('scale');
        if (forced) { return Math.max(1, parseInt(forced, 10) || 1); }
        var w = window.innerWidth;
        var h = window.innerHeight;
        var s = 1;
        while (s < 4 && w / (s + 1) >= 320 && h / (s + 1) >= 240) { s++; }
        return s;
    }

    function applyScale() {
        var s = calcScale();
        document.documentElement.style.setProperty('--u', s + 'px');
        document.documentElement.style.setProperty('--gh', (window.innerHeight / s).toFixed(4));
    }
    applyScale();
    window.addEventListener('resize', applyScale);

    // ===== защита контента (как на старой визитке) =====
    document.oncontextmenu = document.oncopy = document.onselectstart =
        document.ondragstart = document.ondrop = function (event) {
            event.preventDefault();
            return false;
        };

    // ===== звук клика — настоящий ui.button.click из 1.16.1 =====
    var clickSound = document.getElementById('clickSound');
    function playClick() {
        if (!clickSound) { return; }
        clickSound.pause();
        clickSound.currentTime = 0;
        clickSound.volume = 0.4;
        clickSound.play().catch(function () {});
    }

    // ===== переключение экранов =====
    var screenTitle = document.getElementById('screen-title');
    var screenOptions = document.getElementById('screen-options');

    function showScreen(name) {
        screenTitle.classList.toggle('hidden', name !== 'title');
        screenOptions.classList.toggle('hidden', name !== 'options');
    }

    // ===== кнопки =====
    document.querySelectorAll('.mc-btn, .mc-icon').forEach(function (btn) {
        btn.addEventListener('click', function (event) {
            event.preventDefault();
            var action = btn.getAttribute('data-action');
            var page = btn.getAttribute('data-page');
            if (action === 'options') {
                playClick();
                showScreen('options');
            } else if (action === 'back') {
                playClick();
                showScreen('title');
            } else if (action === 'quit') {
                playFoxAndConfetti();
            } else if (page) {
                loadPage(btn.getAttribute('data-href') || (page + '.html'), page);
            } else {
                playClick();
            }
        });
    });

    // ============================================================
    // ВАНИЛЬНЫЙ БИТМАП-ШРИФТ: ascii.png (латиница) + unicode_page_04
    // (кириллица) + glyph_sizes.bin — ровно то, чем игра рисует текст
    // ============================================================
    var FONT = { ready: false, queue: [] };
    var FUNKY = 'ÀÁÂÈÊËÍÓÔÕÚßãõğİıŒœŞşŴŵžȇ\u0000\u0000\u0000\u0000\u0000\u0000\u0000 !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\u0000ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αβΓπΣσμτΦΘΩδ∞∅∈∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u0000';

    (function initFont() {
        function img(src) {
            return new Promise(function (res, rej) {
                var i = new Image();
                i.onload = function () { res(i); };
                i.onerror = rej;
                i.src = src;
            });
        }
        FONT.whenReady = Promise.all([
            img('assets/font/vanilla/ascii.png'),
            img('assets/font/vanilla/unicode_page_04.png'),
            fetch('assets/font/vanilla/glyph_sizes.bin').then(function (r) { return r.arrayBuffer(); })
        ]).then(function (parts) {
            FONT.ascii = parts[0];
            FONT.page04 = parts[1];
            FONT.sizes = new Uint8Array(parts[2]);
            FONT.asciiW = measureAsciiWidths(FONT.ascii);
            FONT.ready = true;
            renderAllUiText();
        }).catch(function (e) {
            console.error('Ванильный шрифт не загрузился, остаётся вебфонт:', e);
        });
    })();

    function measureAsciiWidths(img) {
        var c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, 128, 128).data;
        var widths = [];
        for (var fi = 0; fi < 256; fi++) {
            var col = fi % 16, row = Math.floor(fi / 16);
            var last = -1;
            for (var x = 7; x >= 0 && last === -1; x--) {
                for (var y = 0; y < 8; y++) {
                    if (data[((row * 8 + y) * 128 + col * 8 + x) * 4 + 3] > 0) { last = x; break; }
                }
            }
            widths[fi] = last === -1 ? 4 : last + 2; // чернила + 1px пробел, как в игре
        }
        return widths;
    }

    function glyphInfo(ch) {
        var fi = FUNKY.indexOf(ch);
        if (fi !== -1) {
            return { img: FONT.ascii, sx: (fi % 16) * 8, sy: Math.floor(fi / 16) * 8, sw: 8, sh: 8, drawW: 8, adv: FONT.asciiW[fi] };
        }
        var code = ch.charCodeAt(0);
        if (code >= 0x0400 && code <= 0x04FF) {
            var b = FONT.sizes[code];
            if (!b) { return null; }
            var start = b >>> 4;
            var end = (b & 15) + 1;
            var ink = end - start;
            return { img: FONT.page04, sx: (code % 16) * 16 + start, sy: Math.floor((code & 255) / 16) * 16, sw: ink, sh: 16, drawW: ink / 2, adv: ink / 2 + 1 };
        }
        return null;
    }

    var tintCv = document.createElement('canvas');
    tintCv.width = 16; tintCv.height = 16;
    var tintCtx = tintCv.getContext('2d');

    function drawTinted(ctx, g, color, dx, dy) {
        tintCtx.clearRect(0, 0, 16, 16);
        tintCtx.globalCompositeOperation = 'source-over';
        tintCtx.drawImage(g.img, g.sx, g.sy, g.sw, g.sh, 0, 0, g.sw, g.sh);
        tintCtx.globalCompositeOperation = 'source-in';
        tintCtx.fillStyle = color;
        tintCtx.fillRect(0, 0, 16, 16);
        tintCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tintCv, 0, 0, g.sw, g.sh, dx, dy, g.drawW, 8);
    }

    function drawTextOnCanvas(canvas, text, color, shadow) {
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        var total = 0, glyphs = [], i, g;
        for (i = 0; i < text.length; i++) {
            g = glyphInfo(text.charAt(i));
            glyphs.push(g);
            total += g ? g.adv : 4;
        }
        canvas.width = Math.max(1, total);
        canvas.height = 8;
        var pass, x, j;
        for (pass = 0; pass < 2; pass++) { // 0 — тень (+1,+1), 1 — основной слой
            x = 0;
            for (j = 0; j < text.length; j++) {
                g = glyphs[j];
                if (g) {
                    drawTinted(ctx, g, pass === 0 ? shadow : color, x + (pass === 0 ? 1 : 0), pass === 0 ? 1 : 0);
                }
                x += g ? g.adv : 4;
            }
        }
        return { width: total };
    }

    function setBitmapText(el, text, color, shadow, opts) {
        var canvas = el.querySelector('canvas.mc-text');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'mc-text';
            var tn = null, i;
            for (i = 0; i < el.childNodes.length; i++) {
                if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) { tn = el.childNodes[i]; break; }
            }
            if (tn) { el.insertBefore(canvas, tn); el.removeChild(tn); }
            else { el.appendChild(canvas); }
        }
        el.dataset.mcText = text;
        el.dataset.mcColor = color;
        el.dataset.mcShadow = shadow;
        FONT.whenReady.then(function () {
            var m = drawTextOnCanvas(canvas, text, color, shadow);
            var scaleF = 1;
            if (opts && opts.splash) {
                // формула 1.16.1 с ванильными ширинами, но с потолком — иначе короткие сплэши огромные
                scaleF = Math.min(1.8 * 100 / (m.width + 32), 1.2);
            }
            canvas.style.width = 'calc(' + (m.width * scaleF).toFixed(3) + ' * var(--u))';
            canvas.style.height = 'calc(' + (8 * scaleF).toFixed(3) + ' * var(--u))';
        });
    }

    // собираем тексты UI ДО подмены на canvas
    var UI_TEXTS = [];
    (function collectUiTexts() {
        document.querySelectorAll('.mc-btn').forEach(function (el) {
            var t = el.textContent.trim();
            if (t) { UI_TEXTS.push({ el: el, text: t, hover: true, color: '#e0e0e0', shadow: '#383838' }); }
        });
        var sliderSpan = document.querySelector('.mc-slider span');
        if (sliderSpan) { UI_TEXTS.push({ el: sliderSpan, text: sliderSpan.textContent.trim(), hover: false, color: '#e0e0e0', shadow: '#383838' }); }
        var title = document.querySelector('.options-title');
        if (title) { UI_TEXTS.push({ el: title, text: title.textContent.trim(), hover: false, color: '#ffffff', shadow: '#3f3f3f' }); }
        ['version', 'copyright'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { UI_TEXTS.push({ el: el, text: el.textContent.trim(), hover: false, color: '#ffffff', shadow: '#3f3f3f' }); }
        });
    })();

    function renderAllUiText() {
        UI_TEXTS.forEach(function (item) {
            setBitmapText(item.el, item.text, item.color, item.shadow, {});
            if (item.hover) {
                item.el.addEventListener('mouseenter', function () {
                    drawTextOnCanvas(item.el.querySelector('canvas.mc-text'), item.text, '#ffffa0', '#3f3f28');
                });
                item.el.addEventListener('mouseleave', function () {
                    drawTextOnCanvas(item.el.querySelector('canvas.mc-text'), item.text, item.color, item.shadow);
                });
            }
        });
    }

    // ============================================================
    // СТРАНИЦЫ ВИЗИТКИ (роутер перенесён со старого script.js)
    // ============================================================

    var menuContainer = screenTitle;
    var contentSection = document.getElementById('page-overlay');
    window.panoramaSpeed = 0.0003; // скорость автоповорота лисы на «Обо мне»

    const totalFrames = 79;
    const frames = new Array(totalFrames);
    let loadedFrames = 0;

    function preloadFrames() {
        var loadFrame = function (i) {
            var img = new Image();
            img.src = 'images/frames/frame' + i + '.png?t=' + Date.now();
            img.onload = function () { frames[i] = img; loadedFrames++; };
            img.onerror = function () { loadedFrames++; };
        };
        for (var i = 0; i < totalFrames; i++) { loadFrame(i); }
    }
    preloadFrames();

    function loadPage(href, page) {
        if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0) {
            playClick();
            window.open(href, '_blank');
            return;
        }
        playClick();
        history.replaceState({}, '', '/');
        fetch(href)
            .then(function (response) { return response.text(); })
            .then(function (data) {
                var parser = new DOMParser();
                var newDoc = parser.parseFromString(data, 'text/html');
                var newContent = newDoc.querySelector('.content-section');
                if (newContent && contentSection) {
                    menuContainer.style.display = 'none';
                    contentSection.innerHTML = newContent.innerHTML;
                    contentSection.style.display = 'block';
                    if (page === 'about') { initAboutCanvas(); }
                    if (page === 'contacts') { initContacts(); }
                }
            })
            .catch(function (error) { console.error('Ошибка загрузки страницы:', error); });
    }

    function showMenu() {
        menuContainer.style.display = 'block';
        contentSection.style.display = 'none';
        contentSection.innerHTML = '';
        history.replaceState({}, '', '/');
    }

    document.addEventListener('click', function (event) {
        var backButton = event.target.closest('.btn-minecraft[data-action="back"]');
        if (backButton) {
            event.preventDefault();
            playClick();
            showMenu();
        }
    });

    function initContacts() {
        var contactButtons = contentSection.querySelectorAll('.contact-button');
        contactButtons.forEach(function (btn) {
            btn.addEventListener('click', function (event) {
                event.preventDefault();
                var href = btn.getAttribute('href');
                if (href) {
                    playClick();
                    window.open(href, '_blank');
                }
            });
        });
    }

    function initAboutCanvas() {
        var canvas = document.getElementById('gif_canvas');
        if (!canvas) { return; }
        var isMobile = window.innerWidth <= 600;
        canvas.width = isMobile ? 250 : 300;
        canvas.height = isMobile ? 250 : 300;
        var ctx = canvas.getContext('2d');
        var currentFrame = 0;
        var isDragging = false;
        var lastX = 0;
        var velocity = 0;
        var lastTime = 0;
        var isAutoRotating = true;
        var sensitivity = 10;
        var friction = 0.7;
        var minVelocity = 0.01;
        var maxVelocity = 100;
        var velocityScale = 1.2;
        var inertiaThreshold = 0.1;

        function mod(n, m) { return ((n % m) + m) % m; }

        function drawFrame(frameIndex) {
            var index = Math.floor(mod(frameIndex, totalFrames));
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (frames[index]) {
                ctx.drawImage(frames[index], 420, 0, 1080, 1080, 0, 0, canvas.width, canvas.height);
            }
        }

        function autoRotateAnimation(timestamp) {
            if (isAutoRotating && contentSection.style.display !== 'none') {
                if (!lastTime) { lastTime = timestamp; }
                var dt = (timestamp - lastTime) / 1000;
                currentFrame = mod(currentFrame + window.panoramaSpeed * 10000 * dt, totalFrames);
                drawFrame(currentFrame);
                lastTime = timestamp;
                requestAnimationFrame(autoRotateAnimation);
            }
        }

        function resumeAutoRotation() {
            if (!isAutoRotating && !isDragging) {
                setTimeout(function () {
                    if (contentSection.style.display === 'none') { return; }
                    isAutoRotating = true;
                    lastTime = performance.now();
                    requestAnimationFrame(autoRotateAnimation);
                }, 5000);
            }
        }

        function inertiaAnimation(timestamp) {
            if (!lastTime) { lastTime = timestamp; }
            var dt = (timestamp - lastTime) / 1000;
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

        var framesWait = setInterval(function () {
            if (loadedFrames >= totalFrames) {
                clearInterval(framesWait);
                drawFrame(0);
                requestAnimationFrame(autoRotateAnimation);
            }
        }, 100);

        canvas.addEventListener('mousedown', function (event) {
            isAutoRotating = false;
            isDragging = true;
            lastX = event.clientX;
            lastTime = performance.now();
            velocity = 0;
            canvas.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', function (event) {
            if (isDragging && loadedFrames >= totalFrames) {
                var dx = event.clientX - lastX;
                var framesToShift = dx / sensitivity;
                currentFrame = mod(currentFrame - framesToShift, totalFrames);
                drawFrame(currentFrame);
                var currentTime = performance.now();
                var dt = (currentTime - lastTime) / 1000;
                if (dt > 0) {
                    velocity = -(framesToShift / dt) * velocityScale;
                    velocity = Math.max(Math.min(velocity, maxVelocity), -maxVelocity);
                }
                lastX = event.clientX;
                lastTime = currentTime;
            }
        });

        document.addEventListener('mouseup', function () {
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

        canvas.addEventListener('touchstart', function (event) {
            isAutoRotating = false;
            isDragging = true;
            lastX = event.touches[0].clientX;
            lastTime = performance.now();
            velocity = 0;
        }, { passive: true });

        document.addEventListener('touchmove', function (event) {
            if (isDragging && loadedFrames >= totalFrames) {
                var dx = event.touches[0].clientX - lastX;
                var framesToShift = dx / sensitivity;
                currentFrame = mod(currentFrame - framesToShift, totalFrames);
                drawFrame(currentFrame);
                var currentTime = performance.now();
                var dt = (currentTime - lastTime) / 1000;
                if (dt > 0) {
                    velocity = -(framesToShift / dt) * velocityScale;
                    velocity = Math.max(Math.min(velocity, maxVelocity), -maxVelocity);
                }
                lastX = event.touches[0].clientX;
                lastTime = currentTime;
            }
        }, { passive: true });

        document.addEventListener('touchend', function () {
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
    }

    // прямой заход на старые адреса — открываем контент поверх меню
    (function restorePath() {
        var path = window.location.pathname;
        if (path === '/about.html' || path === '/contacts.html') {
            history.replaceState({}, '', '/');
            loadPage(path, path.replace('.html', ''));
        } else if (path === '/settings.html') {
            history.replaceState({}, '', '/');
            showScreen('options');
        }
    })();

    // ===== сплэш: случайный текст + ванильная пульсация =====
    var splashEl = document.getElementById('splash');

    function setupSplash() {
        var text = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
        setBitmapText(splashEl, text, '#ffff00', '#3f3f00', { splash: true });
    }

    // пульсация сплэша: f = 1.8 - 0.1*|sin| (формула 1.16.1), период 500 мс
    requestAnimationFrame(function pulse(t) {
        var f = 1.8 - 0.1 * Math.abs(Math.sin((t % 1000) / 1000 * Math.PI * 2));
        splashEl.style.transform = 'translate(-50%,-50%) rotate(-20deg) scale(' + (f / 1.8).toFixed(4) + ')';
        requestAnimationFrame(pulse);
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(setupSplash);
    } else {
        window.addEventListener('load', setupSplash);
    }

    // ===== вращающаяся панорама =====
    var cube = document.getElementById('panoCube');
    var yaw = PANORAMA_YAW0;
    var lastT = performance.now();
    requestAnimationFrame(function spin(t) {
        var dt = (t - lastT) / 1000;
        lastT = t;
        yaw += PANORAMA_SPEED * dt;
        cube.style.transform = 'rotateX(' + PANORAMA_PITCH + 'deg) rotateY(' + yaw.toFixed(3) + 'deg)';
        requestAnimationFrame(spin);
    });

    // ============================================================
    // ПАСХАЛКИ (перенесены со старой визитки)
    // ============================================================

    var foxButtonSound = document.getElementById('foxButtonSound');
    var doYouLoveMe = document.getElementById('doYouLoveMe');
    var idle = document.getElementById('idle');
    var doYouNeedMe = document.getElementById('doYouNeedMe');
    var endAudio = document.getElementById('end');
    var blackOverlay = document.getElementById('blackOverlay');
    var meImage = document.getElementById('meImage');
    var modal = document.getElementById('modal');
    var question = document.getElementById('question');
    var yesBtn = document.getElementById('yes');
    var noBtn = document.getElementById('no');
    var finalImage = document.getElementById('finalImage');
    var finalImg = document.getElementById('finalImg');

    [doYouLoveMe, idle, doYouNeedMe, endAudio].forEach(function (a) {
        if (a) { a.volume = 1; }
    });

    // --- лиса + конфетти на «Выйти из игры» ---
    var confettiCanvas = document.getElementById('confetti_canvas');
    var ctx = null;
    var particles = [];
    var confettiImage = new Image();
    confettiImage.src = 'images/confetti.png';

    if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        ctx = confettiCanvas.getContext('2d');
        window.addEventListener('resize', function () {
            confettiCanvas.width = window.innerWidth;
            confettiCanvas.height = window.innerHeight;
        });
    }

    function Particle() {
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

    Particle.prototype.update = function (deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.rotation += this.vRotation * deltaTime;
        var elapsed = performance.now() - this.creationTime;
        this.opacity = Math.max(0, 1 - elapsed / this.lifetime);
    };

    Particle.prototype.draw = function () {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.scale(this.scale, this.scale);
        ctx.drawImage(confettiImage, -25, -25, 50, 50);
        ctx.restore();
    };

    function createConfetti() {
        for (var i = 0; i < 100; i++) { particles.push(new Particle()); }
    }

    function animateConfetti() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        var deltaTime = 16 / 1000;
        particles = particles.filter(function (p) { return p.opacity > 0; });
        particles.forEach(function (p) {
            p.update(deltaTime);
            p.draw();
        });
        if (particles.length > 0) {
            requestAnimationFrame(animateConfetti);
        }
    }

    function playFoxAndConfetti() {
        if (foxButtonSound) {
            foxButtonSound.pause();
            foxButtonSound.currentTime = 0;
            foxButtonSound.volume = 1;
            foxButtonSound.play().catch(function () {});
        }
        if (confettiCanvas) {
            createConfetti();
            requestAnimationFrame(animateConfetti);
        }
    }

    // --- «Do you love me?» по клику на копирайт ---
    var currentQuestion = 1;
    var allYes = true;
    var idleLoopCount = 0;

    function showModal(q) {
        question.textContent = q;
        modal.style.display = 'block';
    }

    function handleChoice(choice) {
        if (choice === 'no') { allYes = false; }
        modal.style.display = 'none';
        idle.pause();
        idle.currentTime = 0;
        meImage.classList.remove('bounce', 'stretch', 'zoomIn');
        if (currentQuestion === 1) {
            currentQuestion = 2;
            showModal('Do you need me?');
            doYouNeedMe.play().catch(function () {});
            meImage.classList.add('stretch');
            doYouNeedMe.addEventListener('ended', function () {
                meImage.classList.remove('stretch');
                meImage.classList.add('bounce');
                idle.play().catch(function () {});
            }, { once: true });
        } else {
            meImage.style.display = 'block';
            endAudio.play().catch(function () {});
            meImage.classList.add('glitch');
            endAudio.addEventListener('ended', function () {
                meImage.classList.remove('glitch');
                setTimeout(function () {
                    meImage.classList.add('zoomIn');
                    meImage.addEventListener('animationend', function () {
                        meImage.classList.remove('zoomIn');
                        meImage.style.display = 'none';
                        finalImg.src = allYes ? 'images/end_image2.png' : 'images/end_image.png';
                        finalImage.style.display = 'block';
                        setTimeout(function () {
                            location.reload();
                        }, 5000);
                    }, { once: true });
                }, 0);
            }, { once: true });
        }
    }

    var copyright = document.getElementById('copyright');
    if (copyright) {
        copyright.addEventListener('click', function () {
            blackOverlay.style.display = 'block';
            meImage.style.display = 'block';
            currentQuestion = 1;
            allYes = true;
            idleLoopCount = 0;
            setTimeout(function () {
                doYouLoveMe.play().catch(function () {});
                meImage.classList.add('stretch');
                showModal('Do you love me?');
            }, 3000);
        });
    }

    if (doYouLoveMe) {
        doYouLoveMe.addEventListener('ended', function () {
            meImage.classList.remove('stretch');
            meImage.classList.add('bounce');
            idleLoopCount = 0;
            idle.play().catch(function () {});
        }, { once: true });
    }

    if (idle) {
        idle.addEventListener('ended', function () {
            idleLoopCount++;
            idle.play().catch(function () {});
        });
    }

    if (yesBtn) {
        yesBtn.addEventListener('click', function () {
            playClick();
            handleChoice('yes');
        });
    }

    if (noBtn) {
        noBtn.addEventListener('click', function () {
            playClick();
            handleChoice('no');
        });
    }

    [meImage, finalImg].forEach(function (el) {
        if (!el) { return; }
        el.oncontextmenu = function () { return false; };
        el.oncopy = function () { return false; };
        el.onselectstart = function () { return false; };
        el.ondragstart = function () { return false; };
        el.ondrop = function () { return false; };
    });
})();
