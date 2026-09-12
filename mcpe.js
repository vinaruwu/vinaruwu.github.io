/* ============================================================
   MCPE 0.13 (Pocket Edition) — мобильный вид визитки.
   Геометрия и текстуры из APK Minecraft PE 0.13.0.
   Виртуальный экран 320x180 юнитов, масштаб = высота/180.
   Java-вид (mc.js) не трогается: этот слой только добавляет
   режим и переключатель.
   ============================================================ */
(function () {
    'use strict';

    var MODE_KEY = 'vinarcraft-mode';

    // ===== панорама 0.13 (как в Java-слое, но своими текстурами) =====
    var PANO_SPEED = 1.0;
    var PANO_YAW0 = 12;
    var PANO_PITCH = -30;

    var DEBUG = new URLSearchParams(location.search);
    if (DEBUG.get('still') === '1') { PANO_SPEED = 0; }

    var isMcpe = false;

    // ===== определение режима =====
    function detectTouch() {
        return (('ontouchstart' in window) || navigator.maxTouchPoints > 0) &&
               Math.min(window.innerWidth, window.innerHeight) < 900;
    }

    function preferredMode() {
        var forced = DEBUG.get('mode');
        if (forced === 'mcpe' || forced === 'java') { return forced; }
        var saved = null;
        try { saved = localStorage.getItem(MODE_KEY); } catch (e) { }
        if (saved === 'mcpe' || saved === 'java') { return saved; }
        return detectTouch() ? 'mcpe' : 'java';
    }

    // ===== геометрия =====
    // Родная формула PE 0.13: масштаб = высота / 180 (виртуальный экран 320x180).
    // Но у PE экран телефона по пропорциям ближе к 16:9, а браузер на портрете
    // даёт высокое узкое окно. Поэтому:
    //   база  — по высоте, как в игре;
    //   верх  — чтобы Play (100 юнитов) не вылез за ширину;
    //   низ   — чтобы кнопка осталась удобной для пальца.
    function applyMcpeScale() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        var portrait = h >= w;

        // PE: units = высота / 180. На портрете не даём раздуться сильнее,
        // чем позволяет ширина (иначе кнопки уедут за края).
        var byHeight = h / 180;
        var maxByWidth = (w * 0.86) / 100;   // Play занимает 100 юнитов

        var u = byHeight;
        if (u > maxByWidth) { u = maxByWidth; }

        // Комфортный тап: Play 26 юнитов по высоте -> не меньше 44 CSS px.
        // Потолок ограничен шириной, иначе снова вылезем.
        var minTap = 44 / 30;
        var lo = Math.min(minTap, maxByWidth);
        if (u < lo) { u = lo; }

        // Пропорции кнопок как в 0.13: они вытянутые, а не квадратные.
        // Play 100 юнитов шириной — держим её высоту в разумных рамках,
        // поэтому сверху ограничиваем не только шириной, но и «стройностью».
        var byProportion = w / 150;   // 100u кнопки ≈ 2/3 ширины экрана
        if (portrait && u > byProportion) { u = byProportion; }
        if (u < lo) { u = lo; }

        // На широком (ландшафт/десктоп) окне не даём элементам быть огромными
        var cap = h / 200;
        if (u > cap && u > lo) { u = Math.max(lo, cap); }

        document.documentElement.style.setProperty('--u', u.toFixed(4) + 'px');
        document.documentElement.style.setProperty('--gh', (h / u).toFixed(4));
    }

    // ===== панорама =====
    var panoRaf = null;
    function startPano() {
        var cube = document.getElementById('mcpePanoCube');
        if (!cube || panoRaf) { return; }
        var yaw = PANO_YAW0;
        var last = performance.now();
        function step(t) {
            var dt = (t - last) / 1000;
            last = t;
            yaw += PANO_SPEED * dt;
            cube.style.transform = 'rotateX(' + PANO_PITCH + 'deg) rotateY(' + yaw.toFixed(3) + 'deg)';
            panoRaf = requestAnimationFrame(step);
        }
        panoRaf = requestAnimationFrame(step);
    }
    function stopPano() {
        if (panoRaf) { cancelAnimationFrame(panoRaf); panoRaf = null; }
    }

    // не жжём батарею на скрытой вкладке
    document.addEventListener('visibilitychange', function () {
        if (!isMcpe) { return; }
        if (document.hidden) { stopPano(); } else { startPano(); }
    });

    // ===== экраны =====
    function showOptions(open) {
        var el = document.getElementById('mcpe-options');
        if (el) { el.classList.toggle('open', !!open); }
        // фолбэк для :has() — по нему прячем иконки и уводим тумблер
        document.documentElement.classList.toggle('mcpe-opts-open', !!open);
    }

    // ===== звук клика — тот же ui.button.click =====
    function playClick() {
        var s = document.getElementById('clickSound');
        if (!s) { return; }
        s.pause();
        s.currentTime = 0;
        s.volume = 0.4;
        s.play().catch(function () { });
    }

    // ===== переключение режима =====
    function setMode(mode, remember) {
        isMcpe = (mode === 'mcpe');
        document.documentElement.classList.toggle('mcpe-mode', isMcpe);
        if (remember) {
            try { localStorage.setItem(MODE_KEY, mode); } catch (e) { }
        }
        document.querySelectorAll('.mcpe-toggle button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-mode') === mode);
        });
        if (isMcpe) {
            applyMcpeScale();
            startPano();
        } else {
            stopPano();
            // вернуть Java-слой: пересчитать его масштаб
            if (window.__mcJavaRescale) { window.__mcJavaRescale(); }
        }
    }

    // ===== сборка слоя =====
    function buildRoot() {
        var root = document.getElementById('mcpe-root');
        if (!root) { return; }

        var splashes = [
            'Теперь и на телефоне!', 'Приветик!', 'Антон, стой!',
            '42 братуха', '54 братуха', 'Привет, Эри!', 'Привет, Артём!',
            'бр бр потопила', 'Сделано с душой :3', 'Играй в кармане!'
        ];
        var splash = splashes[Math.floor(Math.random() * splashes.length)];

        root.innerHTML =
            '<div class="mcpe-pano"><div class="mcpe-pano-cube" id="mcpePanoCube">' +
                '<div class="mcpe-pano-face f-front"></div>' +
                '<div class="mcpe-pano-face f-right"></div>' +
                '<div class="mcpe-pano-face f-back"></div>' +
                '<div class="mcpe-pano-face f-left"></div>' +
                '<div class="mcpe-pano-face f-top"></div>' +
                '<div class="mcpe-pano-face f-bottom"></div>' +
            '</div></div>' +

            '<div class="mcpe-screen">' +
                '<img class="mcpe-logo" src="assets/mcpe/title.png" alt="VINARCRAFT">' +
                '<div class="mcpe-splash"></div>' +

                '<div class="mcpe-menu">' +
                    '<div class="mcpe-btn mcpe-btn-play" data-mcpe="about">Play</div>' +
                    '<div class="mcpe-row-btns">' +
                        '<div class="mcpe-btn mcpe-btn-options" data-mcpe="options">Options</div>' +
                        '<div class="mcpe-btn mcpe-btn-skins" data-mcpe="music">Skins</div>' +
                    '</div>' +
                '</div>' +

                '<div class="mcpe-icon-btn mcpe-btn-feedback" data-mcpe="quit">' +
                    '<img src="assets/mcpe/Language18.png" alt="">' +
                '</div>' +
                '<div class="mcpe-icon-btn mcpe-btn-lang" data-mcpe="contacts">' +
                    '<img src="assets/mcpe/Language18.png" alt="">' +
                '</div>' +

                '<div class="mcpe-version">v0.13.2 alpha</div>' +
                '<div class="mcpe-copyright">©Mojang AB</div>' +
            '</div>' +

            '<div class="mcpe-options" id="mcpe-options">' +
                '<div class="mcpe-options-header">' +
                    '<div class="mcpe-btn mcpe-back" data-mcpe="back">Back</div>' +
                    'Options' +
                '</div>' +
                '<div class="mcpe-tabs">' +
                    '<div class="mcpe-tab active"><div class="ico ico-game"></div></div>' +
                    '<div class="mcpe-tab"><div class="ico ico-graphics"></div></div>' +
                    '<div class="mcpe-tab"><div class="ico ico-controls"></div></div>' +
                    '<div class="mcpe-tab"><div class="ico ico-sound"></div></div>' +
                '</div>' +
                '<div class="mcpe-options-body">' +
                    '<div class="mcpe-group-title">Game</div>' +
                    row('Имя', 'text', 'Винар') +
                    row('Сложность', 'slider', 0.5) +
                    row('Вид от третьего лица', 'check', false) +
                    row('Локальная игра', 'check', true) +
                    '<div class="mcpe-group-title">Graphics</div>' +
                    row('Дальность прорисовки', 'slider', 0.6) +
                    row('Яркость', 'slider', 0.5) +
                    row('Плавное освещение', 'check', true) +
                    '<div class="mcpe-group-title">Controls</div>' +
                    row('Чувствительность', 'slider', 0.4) +
                    row('Автопрыжок', 'check', true) +
                    '<div class="mcpe-group-title">Sound</div>' +
                    row('Музыка', 'slider', 0.7) +
                    row('Звуки', 'slider', 1.0) +
                '</div>' +
            '</div>';
    }

    function row(label, kind, value) {
        var control = '';
        if (kind === 'slider') {
            var pct = Math.round((value || 0) * 100);
            control = '<div class="slider"><div class="knob" style="left:calc(' + pct + '% - 4 * var(--u))"></div></div>';
        } else if (kind === 'check') {
            control = '<div class="checkbox' + (value ? ' on' : '') + '">' + (value ? '✔' : '') + '</div>';
        } else {
            control = '<div class="checkbox">' + (value || '') + '</div>';
        }
        return '<div class="mcpe-row"><span class="label">' + label + '</span>' + control + '</div>';
    }

    // ===== тумблер =====
    // Один элемент на всю страницу. В Java-режиме он оформлен ванильной
    // кнопкой 1.16.1 (правила в mc.css), в MCPE-режиме — плоской кнопкой
    // 0.13 (правила в mcpe.css). Здесь только логика переключения.
    function buildToggle(mode) {
        var t = document.getElementById('mc-toggle');
        if (!t) { return; }
        document.documentElement.classList.toggle('mcpe-mode', mode === 'mcpe');
        t.querySelectorAll('button').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-mode') === mode);
            b.addEventListener('click', function () {
                var m = b.getAttribute('data-mode');
                if ((m === 'mcpe') === isMcpe) { return; }
                playClick();
                showOptions(false);
                setMode(m, true);
            });
        });
    }

    // ===== обработчики кнопок MCPE =====
    function bindActions() {
        document.querySelectorAll('#mcpe-root [data-mcpe]').forEach(function (el) {
            el.addEventListener('click', function (ev) {
                ev.preventDefault();
                var a = el.getAttribute('data-mcpe');
                if (a === 'options') { playClick(); showOptions(true); return; }
                if (a === 'back') { playClick(); showOptions(false); return; }
                if (a === 'quit') {
                    // в 0.13 на этом месте была кнопка feedback; у нас — пасхалка с лисой
                    if (window.__mcQuitEgg) { window.__mcQuitEgg(); }
                    return;
                }
                if (a === 'music') {
                    playClick();
                    window.open('https://bnd.lc/vinar', '_blank');
                    return;
                }
                if (a === 'about' || a === 'contacts') {
                    if (window.__mcOpenPage) { window.__mcOpenPage(a); }
                    else { playClick(); }
                    return;
                }
                playClick();
            });
        });

        // вкладки настроек — только визуальное переключение, как заглушки в 0.13
        document.querySelectorAll('.mcpe-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                playClick();
                document.querySelectorAll('.mcpe-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
            });
        });
    }

    // ===== инициализация =====
    function init() {
        buildRoot();
        var mode = preferredMode();
        buildToggle(mode);
        bindActions();
        var sp = document.querySelector('.mcpe-splash');
        if (sp) { sp.textContent = sp.textContent || ''; }
        setMode(mode, false);

        window.addEventListener('resize', function () {
            if (isMcpe) { applyMcpeScale(); }
        });
        window.addEventListener('orientationchange', function () {
            setTimeout(function () { if (isMcpe) { applyMcpeScale(); } }, 150);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // наружу — для mc.js
    window.__mcpeSetMode = setMode;
    window.__mcpeIsActive = function () { return isMcpe; };
})();
