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

    // ===== фон =====
    // В MCPE 0.13 фон — статичная заблюренная картинка. Делаем её медленно
    // «дышащей» (лёгкий сдвиг), чтобы было живо, но без 3D-куба: на узком
    // экране куб давал чёрные щели между гранями.
    var panoRaf = null;
    var PANO_DRIFT = 14;   // амплитуда сдвига, px
    function startPano() {
        var bg = document.querySelector('.mcpe-pano');
        if (!bg || panoRaf) { return; }
        if (PANO_SPEED === 0) { return; }   // ?still=1
        var t0 = performance.now();
        function step(t) {
            var s = (t - t0) / 1000;
            var dx = Math.sin(s * 0.08) * PANO_DRIFT;
            var dy = Math.cos(s * 0.06) * PANO_DRIFT * 0.5;
            bg.style.transform = 'scale(1.1) translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
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
        if (document.hidden) { stopPano(); stopSplashPulse(); }
        else { startPano(); startSplashPulse(); }
    });

    // ===== пульсация сплэша =====
    // Ванильная формула 1.16.1: f = 1.8 - 0.1*|sin|, период 1000 мс.
    // Поворот -17.9° — как в MCPE 0.13 (в Java -20°).
    var SPLASH_ROT = -17.9;
    var splashRaf = null;
    function startSplashPulse() {
        var el = document.getElementById('mcpeSplash');
        if (!el || splashRaf) { return; }
        function step(t) {
            var f = 1.8 - 0.1 * Math.abs(Math.sin((t % 1000) / 1000 * Math.PI * 2));
            el.style.transform = 'rotate(' + SPLASH_ROT + 'deg) scale(' + (f / 1.8).toFixed(4) + ')';
            splashRaf = requestAnimationFrame(step);
        }
        splashRaf = requestAnimationFrame(step);
    }
    function stopSplashPulse() {
        if (splashRaf) { cancelAnimationFrame(splashRaf); splashRaf = null; }
    }

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
            startSplashPulse();
        } else {
            stopPano();
            stopSplashPulse();
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
            '<div class="mcpe-pano"></div>' +

            '<div class="mcpe-screen">' +
                '<div class="mcpe-logo-wrap">' +
                    '<img class="mcpe-logo" src="images/logo.png" alt="VINARCRAFT">' +
                    '<div class="mcpe-splash" id="mcpeSplash"></div>' +
                '</div>' +

                '<div class="mcpe-menu">' +
                    '<div class="mcpe-btn mcpe-btn-play" data-mcpe="about">Обо мне</div>' +
                    '<div class="mcpe-row-btns">' +
                        '<div class="mcpe-btn mcpe-btn-options" data-mcpe="contacts">Контакты</div>' +
                        '<div class="mcpe-btn mcpe-btn-skins" data-mcpe="music">Моя музыка</div>' +
                    '</div>' +
                '</div>' +

                '<div class="mcpe-icon-btn mcpe-btn-feedback" data-mcpe="quit" title="Выйти">' +
                    '<img src="images/fox_icon.png" alt="">' +
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
        // сплэш: ванильный пиксельный шрифт + пульсация, как в Java-виде.
        // Текст ставим здесь, где splash в области видимости.
        var spEl = root.querySelector('.mcpe-splash');
        if (spEl) {
            if (window.__mcSetBitmapText) {
                window.__mcSetBitmapText(spEl, splash, '#ffff00', '#3f3f00', { splash: true, scale: 0.55 });
            } else {
                spEl.textContent = splash;   // фолбэк, если Java-слой не загрузился
            }
        }
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
    // Надписи и назначение — как в Java-версии визитки:
    // «Обо мне» / «Контакты» / «Моя музыка», выход-пасхалка с лисой на иконке.
    function bindActions() {
        document.querySelectorAll('#mcpe-root [data-mcpe]').forEach(function (el) {
            el.addEventListener('click', function (ev) {
                ev.preventDefault();
                var a = el.getAttribute('data-mcpe');
                if (a === 'back') { playClick(); showOptions(false); return; }
                if (a === 'options') { playClick(); showOptions(true); return; }
                if (a === 'quit') {
                    // пасхалка с лисами и конфетти (как кнопка «Выйти» в Java)
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
