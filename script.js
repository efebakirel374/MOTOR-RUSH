const App = (() => {

    const storage = {
        get: (key, def) => {
            try {
                const v = localStorage.getItem(key);
                return v !== null ? JSON.parse(v) : def;
            } catch { return def; }
        },
        set: (key, val) => {
            try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
        }
    };

    const state = {
        coins: storage.get('moto_coins', 0),
        highscore: storage.get('moto_highscore', 0),
        musicOn: storage.get('moto_music', true),
        sfxOn: storage.get('moto_sfx', true),
        lowQuality: storage.get('moto_quality', false),
        selectedBike: storage.get('moto_bike', 0),
        ownedBikes: storage.get('moto_owned_bikes', [0]),
        upgrades: storage.get('moto_upgrades', {
            speed: 0, nitro: 0, drift: 0, brake: 0,
            coinMult: 0, coinMagnet: 0
        })
    };

    const BIKES = [
        { name: 'SPORT BIKE',  price: 0,    maxSpeed: 1.0,  accel: 1.0,  handling: 1.0,  color: '#00f5ff', accent: '#0099ff' },
        { name: 'RACING BIKE', price: 800,   maxSpeed: 1.2,  accel: 1.1,  handling: 0.9,  color: '#ff00aa', accent: '#ff6600' },
        { name: 'CYBER BIKE',  price: 1500,  maxSpeed: 1.15, accel: 1.3,  handling: 1.1,  color: '#00ff88', accent: '#00ccaa' },
        { name: 'NEON BIKE',   price: 2500,  maxSpeed: 1.25, accel: 1.2,  handling: 1.2,  color: '#ffee00', accent: '#ff8800' },
        { name: 'SUPER BIKE',  price: 5000,  maxSpeed: 1.5,  accel: 1.5,  handling: 1.3,  color: '#ff0040', accent: '#ff00aa' }
    ];

    const UPGRADES_DEF = [
        { key: 'speed',      icon: '🏎', name: 'HIZ ARTIŞI',     desc: 'Maksimum hızı artırır',                 maxLevel: 5, baseCost: 150, costMult: 1.7 },
        { key: 'nitro',      icon: '🔥', name: 'NITRO GÜCÜ',     desc: 'Nitro kapasitesini ve etkisini artırır', maxLevel: 5, baseCost: 200, costMult: 1.8 },
        { key: 'drift',      icon: '💨', name: 'DRIFT KONTROLÜ', desc: 'Viraj kontrolünü geliştirir',            maxLevel: 5, baseCost: 180, costMult: 1.6 },
        { key: 'brake',      icon: '🛑', name: 'FREN SİSTEMİ',   desc: 'Frenleme gücünü artırır',               maxLevel: 5, baseCost: 120, costMult: 1.5 },
        { key: 'coinMult',   icon: '◆',  name: 'ALTIN ÇARPANI',  desc: 'Kazanılan coin miktarını artırır',      maxLevel: 5, baseCost: 300, costMult: 2.0 },
        { key: 'coinMagnet', icon: '🧲', name: 'MANYETİK ÇEKIM', desc: 'Coinleri uzaktan çeker',                maxLevel: 3, baseCost: 500, costMult: 2.5 }
    ];

    const LEVEL_CONFIG = [
        { trafficCount: 4,  bgIndex: 0, trafficSpeed: 0.6,  roadColor: '#1a1a2e', lineColor: '#333366', rain: false, night: false },
        { trafficCount: 5,  bgIndex: 0, trafficSpeed: 0.7,  roadColor: '#1a1a2e', lineColor: '#333366', rain: false, night: false },
        { trafficCount: 6,  bgIndex: 1, trafficSpeed: 0.8,  roadColor: '#0d1a0d', lineColor: '#1a4a1a', rain: false, night: true  },
        { trafficCount: 7,  bgIndex: 1, trafficSpeed: 0.85, roadColor: '#0d1a0d', lineColor: '#1a4a1a', rain: true,  night: true  },
        { trafficCount: 8,  bgIndex: 2, trafficSpeed: 0.9,  roadColor: '#1a0a0a', lineColor: '#4a1a1a', rain: false, night: false },
        { trafficCount: 9,  bgIndex: 2, trafficSpeed: 0.95, roadColor: '#1a0a0a', lineColor: '#4a1a1a', rain: true,  night: false },
        { trafficCount: 10, bgIndex: 3, trafficSpeed: 1.0,  roadColor: '#0a0a1a', lineColor: '#1a1a4a', rain: false, night: true  },
        { trafficCount: 12, bgIndex: 3, trafficSpeed: 1.1,  roadColor: '#0a0a1a', lineColor: '#1a1a4a', rain: true,  night: true  },
        { trafficCount: 14, bgIndex: 4, trafficSpeed: 1.2,  roadColor: '#150a20', lineColor: '#3a1a5a', rain: false, night: false },
        { trafficCount: 16, bgIndex: 4, trafficSpeed: 1.35, roadColor: '#150a20', lineColor: '#3a1a5a', rain: true,  night: true  }
    ];

    const BG_THEMES = [
        { sky1: '#070b1a', sky2: '#0f1830', mountain: '#151c3a', mountain2: '#0d1224' },
        { sky1: '#051505', sky2: '#0a2010', mountain: '#0d2a0d', mountain2: '#071507' },
        { sky1: '#1a0505', sky2: '#2a0a0a', mountain: '#2a0a0a', mountain2: '#180505' },
        { sky1: '#05050a', sky2: '#0a0a15', mountain: '#0a0a20', mountain2: '#050508' },
        { sky1: '#100520', sky2: '#1a0a30', mountain: '#200a35', mountain2: '#100520' }
    ];

    let game = null;
    let audioCtx = null;
    let bgmNode = null;
    let bgmGain = null;

    function getAudioCtx() {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
        }
        return audioCtx;
    }

    function playSfx(type) {
        if (!state.sfxOn) return;
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;

        if (type === 'coin') {
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'crash') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'nitro') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'level') {
            [523, 659, 784, 1047].forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.frequency.value = f;
                g.gain.setValueAtTime(0, now + i * 0.1);
                g.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.05);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
                o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.2);
            });
        } else if (type === 'buy') {
            [659, 784, 1047].forEach((f, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.frequency.value = f;
                g.gain.setValueAtTime(0, now + i * 0.08);
                g.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.04);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
                o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.15);
            });
        }
    }

    function startBgm() {
        if (!state.musicOn) return;
        const ctx = getAudioCtx();
        if (!ctx) return;
        stopBgm();
        bgmGain = ctx.createGain();
        bgmGain.gain.value = 0.1;
        bgmGain.connect(ctx.destination);
        const notes = [110, 138, 165, 220, 138, 165, 196, 220];
        let idx = 0;
        const beatLen = 60 / 140;

        function playBeat() {
            if (!bgmGain) return;
            const now = ctx.currentTime;
            const bassOsc = ctx.createOscillator();
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.value = notes[idx % notes.length];
            const bassGain = ctx.createGain();
            bassGain.gain.setValueAtTime(0.4, now);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + beatLen * 0.8);
            bassOsc.connect(bassGain); bassGain.connect(bgmGain);
            bassOsc.start(now); bassOsc.stop(now + beatLen * 0.8);
            if (idx % 4 === 0 || idx % 4 === 2) {
                const ko = ctx.createOscillator();
                ko.frequency.setValueAtTime(120, now); ko.frequency.exponentialRampToValueAtTime(30, now + 0.08);
                const kg = ctx.createGain();
                kg.gain.setValueAtTime(0.5, now); kg.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                ko.connect(kg); kg.connect(bgmGain); ko.start(now); ko.stop(now + 0.1);
            }
            if (idx % 2 === 1) {
                const sg = ctx.createGain();
                const sb = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
                const d = sb.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
                const ss = ctx.createBufferSource();
                ss.buffer = sb; sg.gain.setValueAtTime(0.2, now);
                ss.connect(sg); sg.connect(bgmGain); ss.start(now);
            }
            idx++;
            bgmNode = setTimeout(playBeat, beatLen * 1000);
        }
        playBeat();
    }

    function stopBgm() {
        if (bgmNode) { clearTimeout(bgmNode); bgmNode = null; }
        if (bgmGain) { try { bgmGain.disconnect(); } catch {} bgmGain = null; }
    }

    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    function updateMenuUI() {
        document.getElementById('menu-highscore').textContent = state.highscore.toLocaleString();
        document.getElementById('menu-coins').textContent = state.coins.toLocaleString();
    }

    function getCoinMultiplier() { return 1 + state.upgrades.coinMult * 0.4; }
    function getMagnetRadius() { return 60 + state.upgrades.coinMagnet * 40; }

    function renderUpgradesGrid() {
        const grid = document.getElementById('upgrades-grid');
        const frag = document.createDocumentFragment();

        UPGRADES_DEF.forEach(def => {
            const lvl = state.upgrades[def.key] || 0;
            const maxed = lvl >= def.maxLevel;
            const cost = maxed ? 0 : Math.floor(def.baseCost * Math.pow(def.costMult, lvl));
            const canAfford = state.coins >= cost;

            const card = document.createElement('div');
            card.className = 'upgrade-card' + (maxed ? ' maxed' : (!canAfford ? ' cant-afford' : ''));
            card.innerHTML = `
                <div class="upgrade-icon">${def.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${def.name}</div>
                    <div class="upgrade-desc">${def.desc}</div>
                    <div class="upgrade-level-bar">
                        <div class="upgrade-level-fill" style="width:${(lvl / def.maxLevel) * 100}%"></div>
                    </div>
                </div>
                <div class="upgrade-price">
                    ${maxed
                        ? `<span class="price-maxed">MAX</span>`
                        : `<span class="price-icon">◆</span><span class="price-num">${cost}</span>`
                    }
                </div>
            `;

            if (!maxed && canAfford) {
                card.addEventListener('click', () => {
                    state.coins -= cost;
                    state.upgrades[def.key] = (state.upgrades[def.key] || 0) + 1;
                    storage.set('moto_coins', state.coins);
                    storage.set('moto_upgrades', state.upgrades);
                    playSfx('buy');
                    document.getElementById('market-coin-count').textContent = state.coins.toLocaleString();
                    grid.innerHTML = '';
                    renderUpgradesGrid();
                }, { passive: true });
            }
            frag.appendChild(card);
        });
        grid.appendChild(frag);
    }

    function drawBikePreview(canvas, bike) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.translate(W / 2, H / 2 + 10);
        ctx.scale(W / 200, W / 200);
        const c = bike.color, a = bike.accent;
        ctx.shadowBlur = 12; ctx.shadowColor = c;
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.ellipse(-20, 20, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(25, 20, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath(); ctx.arc(-20, 20, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(25, 20, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-20, 20); ctx.lineTo(0, -5); ctx.lineTo(25, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-5, -15); ctx.stroke();
        ctx.fillStyle = a; ctx.shadowColor = a;
        ctx.beginPath(); ctx.roundRect(-15, -20, 38, 28, 6); ctx.fill();
        ctx.fillStyle = c; ctx.shadowColor = c;
        ctx.beginPath(); ctx.roundRect(-5, -30, 18, 12, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.roundRect(-3, -28, 14, 10, 3); ctx.fill();
        ctx.fillStyle = '#ff6600'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.ellipse(-22, 20, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.ellipse(28, 20, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function renderBikesGrid() {
        const grid = document.getElementById('bikes-grid');
        grid.innerHTML = '';
        const frag = document.createDocumentFragment();

        BIKES.forEach((bike, idx) => {
            const owned = state.ownedBikes.includes(idx);
            const selected = state.selectedBike === idx;
            const card = document.createElement('div');
            card.className = 'bike-card' + (owned ? ' owned' : '') + (selected ? ' selected' : '');
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 150; previewCanvas.height = 75;
            previewCanvas.style.width = '100%'; previewCanvas.style.height = 'auto';

            const statRows = [
                { label: 'HIZ', val: bike.maxSpeed / 1.5 * 100, color: bike.color },
                { label: 'İVME', val: bike.accel / 1.5 * 100, color: bike.accent },
                { label: 'KONTROL', val: bike.handling / 1.3 * 100, color: '#00ff88' }
            ].map(s => `
                <div class="bike-stat-row">
                    <span class="bike-stat-label">${s.label}</span>
                    <div class="bike-stat-bar">
                        <div class="bike-stat-fill" style="width:${Math.min(100, s.val)}%;background:${s.color};box-shadow:0 0 5px ${s.color}80"></div>
                    </div>
                </div>`).join('');

            let badge = selected
                ? `<div class="bike-badge selected-badge">SEÇİLİ</div>`
                : owned
                    ? `<div class="bike-badge select">SEÇ</div>`
                    : `<div class="bike-badge buy"><span style="color:#ffee00;margin-right:4px">◆</span>${bike.price}</div>`;

            card.innerHTML = `
                <div class="bike-canvas-wrap"></div>
                <div class="bike-name">${bike.name}</div>
                <div class="bike-stats">${statRows}</div>
                <div class="bike-price-row">${badge}</div>`;

            card.querySelector('.bike-canvas-wrap').appendChild(previewCanvas);
            requestAnimationFrame(() => drawBikePreview(previewCanvas, bike));

            card.addEventListener('click', () => {
                if (selected) return;
                if (owned) {
                    state.selectedBike = idx;
                    storage.set('moto_bike', idx);
                    playSfx('buy');
                    renderBikesGrid();
                } else if (state.coins >= bike.price) {
                    state.coins -= bike.price;
                    state.ownedBikes.push(idx);
                    state.selectedBike = idx;
                    storage.set('moto_coins', state.coins);
                    storage.set('moto_owned_bikes', state.ownedBikes);
                    storage.set('moto_bike', idx);
                    playSfx('buy');
                    document.getElementById('market-coin-count').textContent = state.coins.toLocaleString();
                    renderBikesGrid();
                }
            }, { passive: true });
            frag.appendChild(card);
        });
        grid.appendChild(frag);
    }

    function openMarket(fromGame) {
        document.getElementById('market-coin-count').textContent = state.coins.toLocaleString();
        document.getElementById('upgrades-grid').innerHTML = '';
        renderUpgradesGrid();
        renderBikesGrid();
        document.getElementById('btn-back-market').onclick = () => {
            if (fromGame) {
                showScreen('game-screen');
                document.getElementById('gameover-overlay').classList.remove('hidden');
            } else {
                showScreen('main-menu');
                updateMenuUI();
            }
        };
        showScreen('market-screen');
    }

    class InputManager {
        constructor() {
            this.keys = {};
            this.touch = { left: false, right: false, up: false, down: false, nitro: false };
            this._activePointers = new Map();
            this._btnMap = new Map();
            this._keyDown = null;
            this._keyUp = null;
        }

        bindKeys() {
            this._keyDown = (e) => {
                this.keys[e.code] = true;
                if (e.code === 'Space' || e.code === 'ShiftLeft') this.touch.nitro = true;
                if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
            };
            this._keyUp = (e) => {
                this.keys[e.code] = false;
                if (e.code === 'Space' || e.code === 'ShiftLeft') this.touch.nitro = false;
            };
            document.addEventListener('keydown', this._keyDown, { passive: false });
            document.addEventListener('keyup', this._keyUp, { passive: true });
        }

        unbindKeys() {
            if (this._keyDown) document.removeEventListener('keydown', this._keyDown);
            if (this._keyUp) document.removeEventListener('keyup', this._keyUp);
            this._keyDown = null;
            this._keyUp = null;
        }

        bindTouchControls() {
            const mappings = [
                ['ctrl-left',  'left'],
                ['ctrl-right', 'right'],
                ['ctrl-up',    'up'],
                ['ctrl-down',  'down'],
                ['ctrl-nitro', 'nitro']
            ];

            const container = document.getElementById('mobile-controls');
            if (!container) return;

            mappings.forEach(([id, prop]) => {
                const el = document.getElementById(id);
                if (el) this._btnMap.set(el, prop);
            });

            this._onTouchStart = (e) => {
                e.preventDefault();
                for (const touch of e.changedTouches) {
                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                    const target = el ? el.closest('.ctrl-btn') : null;
                    if (target && this._btnMap.has(target)) {
                        this._activePointers.set(touch.identifier, target);
                        this.touch[this._btnMap.get(target)] = true;
                        target.classList.add('ctrl-btn--pressed');
                    }
                }
            };

            this._onTouchEnd = (e) => {
                e.preventDefault();
                for (const touch of e.changedTouches) {
                    const target = this._activePointers.get(touch.identifier);
                    if (target) {
                        this._activePointers.delete(touch.identifier);
                        const prop = this._btnMap.get(target);
                        const stillActive = [...this._activePointers.values()].some(t => this._btnMap.get(t) === prop);
                        if (!stillActive) this.touch[prop] = false;
                        target.classList.remove('ctrl-btn--pressed');
                    }
                }
            };

            this._onTouchMove = (e) => {
                e.preventDefault();
                for (const touch of e.changedTouches) {
                    const prevTarget = this._activePointers.get(touch.identifier);
                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                    const newTarget = el ? el.closest('.ctrl-btn') : null;

                    if (prevTarget !== newTarget) {
                        if (prevTarget) {
                            const prop = this._btnMap.get(prevTarget);
                            this._activePointers.delete(touch.identifier);
                            const stillActive = [...this._activePointers.values()].some(t => this._btnMap.get(t) === prop);
                            if (!stillActive) this.touch[prop] = false;
                            prevTarget.classList.remove('ctrl-btn--pressed');
                        }
                        if (newTarget && this._btnMap.has(newTarget)) {
                            this._activePointers.set(touch.identifier, newTarget);
                            this.touch[this._btnMap.get(newTarget)] = true;
                            newTarget.classList.add('ctrl-btn--pressed');
                        }
                    }
                }
            };

            this._onTouchCancel = (e) => {
                for (const touch of e.changedTouches) {
                    const target = this._activePointers.get(touch.identifier);
                    if (target) {
                        this._activePointers.delete(touch.identifier);
                        const prop = this._btnMap.get(target);
                        const stillActive = [...this._activePointers.values()].some(t => this._btnMap.get(t) === prop);
                        if (!stillActive) this.touch[prop] = false;
                        target.classList.remove('ctrl-btn--pressed');
                    }
                }
            };

            container.addEventListener('touchstart',  this._onTouchStart,  { passive: false });
            container.addEventListener('touchend',    this._onTouchEnd,    { passive: false });
            container.addEventListener('touchmove',   this._onTouchMove,   { passive: false });
            container.addEventListener('touchcancel', this._onTouchCancel, { passive: false });
        }

        unbindTouchControls() {
            const container = document.getElementById('mobile-controls');
            if (!container) return;
            if (this._onTouchStart)  container.removeEventListener('touchstart',  this._onTouchStart);
            if (this._onTouchEnd)    container.removeEventListener('touchend',    this._onTouchEnd);
            if (this._onTouchMove)   container.removeEventListener('touchmove',   this._onTouchMove);
            if (this._onTouchCancel) container.removeEventListener('touchcancel', this._onTouchCancel);
            this._activePointers.clear();
        }

        destroy() {
            this.unbindKeys();
            this.unbindTouchControls();
            this._btnMap.clear();
        }

        isLeft()  { return this.keys['ArrowLeft']  || this.keys['KeyA'] || this.touch.left; }
        isRight() { return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touch.right; }
        isUp()    { return this.keys['ArrowUp']    || this.keys['KeyW'] || this.touch.up; }
        isDown()  { return this.keys['ArrowDown']  || this.keys['KeyS'] || this.touch.down; }
        isNitro() { return this.keys['ShiftLeft']  || this.keys['Space'] || this.touch.nitro; }
    }

    class SpriteCache {
        constructor() {
            this._cache = new Map();
        }

        getTrafficSprite(type, color, w, h, lowQ) {
            const key = `${type}_${color}_${w}_${h}`;
            if (this._cache.has(key)) return this._cache.get(key);
            const oc = document.createElement('canvas');
            oc.width = w * 2 + 20;
            oc.height = h * 2 + 20;
            const ctx = oc.getContext('2d');
            const ox = oc.width / 2, oy = oc.height / 2;

            if (!lowQ) { ctx.shadowBlur = 10; ctx.shadowColor = color; }
            ctx.fillStyle = color;
            ctx.beginPath();
            if (type === 'truck') { ctx.roundRect(ox - w, oy - h, w * 2, h * 2, 4); }
            else if (type === 'sports') {
                ctx.moveTo(ox - w, oy - h * 0.2); ctx.lineTo(ox - w + 8, oy - h * 0.6);
                ctx.lineTo(ox + w - 8, oy - h * 0.6); ctx.lineTo(ox + w, oy - h * 0.2);
                ctx.lineTo(ox + w, oy + h); ctx.lineTo(ox - w, oy + h);
            } else { ctx.roundRect(ox - w, oy - h, w * 2, h * 2, 5); }
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath(); ctx.roundRect(ox - w + 4, oy - h + 4, w * 2 - 8, h * 0.7, 3); ctx.fill();
            if (!lowQ) {
                ctx.fillStyle = 'rgba(255,200,0,0.8)'; ctx.shadowColor = 'rgba(255,200,0,0.8)'; ctx.shadowBlur = 14;
                ctx.beginPath(); ctx.ellipse(ox - w + 6, oy - h + 7, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(ox + w - 6, oy - h + 7, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,50,50,0.9)'; ctx.shadowColor = 'rgba(255,50,50,0.9)';
                ctx.beginPath(); ctx.ellipse(ox - w + 6, oy + h - 7, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(ox + w - 6, oy + h - 7, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
            }
            this._cache.set(key, oc);
            return oc;
        }

        clear() { this._cache.clear(); }
    }

    class GameEngine {
        constructor(canvas) {
            this.canvas = canvas;
            this.dpr = state.lowQuality ? 1 : Math.min(window.devicePixelRatio || 1, 2);
            this.lowQ = state.lowQuality;
            this.resizeCanvas();
            this.ctx = canvas.getContext('2d', { alpha: false });

            this.running = false;
            this.paused = false;
            this.gameOver = false;
            this.raf = null;
            this.lastTime = 0;
            this.frameCount = 0;

            this._fpsCounter = 0;
            this._fpsTimer = 0;
            this._fps = 60;
            this._targetFps = 60;
            this._fpsInterval = 1000 / this._targetFps;
            this._lastFrameTime = 0;
            this._autoQualityTimer = 0;
            this._lowFpsCount = 0;

            this.level = 1;
            this.score = 0;
            this.earnedCoins = 0;
            this.scoreToNextLevel = 500;
            this.levelStartScore = 0;

            this.bikeData = BIKES[state.selectedBike];
            this.levelCfg = LEVEL_CONFIG[0];
            this.bgTheme = BG_THEMES[0];

            this.roadW = 320;
            this.roadX = 0;
            this.roadCenterX = 0;

            this.player = this.createPlayer();
            this.traffic = [];
            this.coins = [];
            this.particles = [];
            this.rainDrops = [];

            this.bgScrollY = 0;
            this.roadLineOffset = 0;

            this._nitroSfxCd = 0;
            this._coinRowTimer = 0;

            this.input = new InputManager();
            this.input.bindKeys();
            this.input.bindTouchControls();

            this.spriteCache = new SpriteCache();
            this.speedoCtx = document.getElementById('speedo-canvas').getContext('2d');

            this._hudScore = document.getElementById('hud-score');
            this._hudSpeed = document.getElementById('speed-num');
            this._hudNitro = document.getElementById('nitro-fill');
            this._hudFps = document.getElementById('hud-fps');
            this._hudCoins = document.getElementById('hud-coins');

            this._prevScore = -1;
            this._prevSpeed = -1;
            this._prevCoins = -1;

            this._resizeTimer = null;
            this._onResize = () => {
                clearTimeout(this._resizeTimer);
                this._resizeTimer = setTimeout(() => this.resizeCanvas(), 150);
            };
            window.addEventListener('resize', this._onResize, { passive: true });
            window.addEventListener('orientationchange', this._onResize, { passive: true });

            this._onVisibility = () => {
                if (document.hidden && !this.paused && !this.gameOver) {
                    this.pause();
                    document.getElementById('pause-overlay').classList.remove('hidden');
                }
            };
            document.addEventListener('visibilitychange', this._onVisibility);

            this.spawnInitialTraffic();
            this.initRain();
        }

        resizeCanvas() {
            const W = window.innerWidth;
            const H = window.innerHeight;
            this.canvas.width = Math.floor(W * this.dpr);
            this.canvas.height = Math.floor(H * this.dpr);
            this.canvas.style.width = W + 'px';
            this.canvas.style.height = H + 'px';
            this.W = W;
            this.H = H;
            this.roadCenterX = W / 2;
            this.roadX = this.roadCenterX - this.roadW / 2;
            if (this.ctx) this.ctx.scale !== undefined;
        }

        createPlayer() {
            return {
                x: this.W / 2,
                y: this.H * 0.7,
                w: 28, h: 56,
                vx: 0,
                speed: 0,
                maxSpeed: 420 * this.bikeData.maxSpeed * (1 + state.upgrades.speed * 0.08),
                accel: 180 * this.bikeData.accel,
                decel: 140 * (1 + state.upgrades.brake * 0.15),
                handling: 280 * this.bikeData.handling * (1 + state.upgrades.drift * 0.1),
                nitro: 1.0,
                nitroMax: 1.0 + state.upgrades.nitro * 0.2,
                nitroActive: false,
                tilt: 0,
                driftSmoke: 0,
                exhaustTimer: 0,
                invincible: 0,
                color: this.bikeData.color,
                accent: this.bikeData.accent
            };
        }

        spawnInitialTraffic() {
            for (let i = 0; i < this.levelCfg.trafficCount; i++) this.spawnTraffic(true);
        }

        spawnTraffic(initial) {
            const cfg = this.levelCfg;
            const lane = Math.floor(Math.random() * 3);
            const laneX = this.roadX + 40 + lane * ((this.roadW - 80) / 2) + (Math.random() - 0.5) * 18;
            const types = ['car', 'truck', 'van', 'sports'];
            const type = types[Math.floor(Math.random() * types.length)];
            const colors = ['#ff3366','#3366ff','#ffcc00','#33cc33','#cc33ff','#ff6600','#00cccc'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            let w = 18, h = 30;
            if (type === 'truck') { w = 20; h = 40; }
            else if (type === 'van') { w = 19; h = 35; }
            else if (type === 'sports') { w = 17; h = 27; }
            const spd = (120 + Math.random() * 80) * cfg.trafficSpeed;
            const y = initial ? Math.random() * this.H * 0.8 - this.H * 0.3 : -h * 2 - Math.random() * 200;
            this.traffic.push({ x: laneX, y, w, h, speed: spd, type, color });
        }

        spawnCoin(x, y) {
            this.coins.push({ x, y, r: 8, collected: false, glowPhase: Math.random() * Math.PI * 2 });
        }

        spawnCoinRow() {
            const lane = Math.floor(Math.random() * 3);
            const laneX = this.roadX + 50 + lane * ((this.roadW - 100) / 2);
            const count = 3 + Math.floor(Math.random() * 5);
            for (let i = 0; i < count; i++) this.spawnCoin(laneX + (Math.random() - 0.5) * 18, -i * 55 - 60);
        }

        initRain() {
            this.rainDrops = [];
            const count = this.lowQ ? 80 : 180;
            for (let i = 0; i < count; i++) {
                this.rainDrops.push({ x: Math.random() * this.W, y: Math.random() * this.H, len: 10 + Math.random() * 18 });
            }
        }

        spawnParticle(x, y, type) {
            if (this.lowQ && type !== 'crash') return;
            const count = type === 'crash' ? 16 : type === 'nitro' ? 3 : 5;
            const maxParticles = this.lowQ ? 30 : 120;
            if (this.particles.length > maxParticles) return;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = type === 'crash' ? 120 + Math.random() * 160 : 40 + Math.random() * 70;
                let color;
                if (type === 'crash') color = `hsl(${20 + Math.random() * 40},100%,${50 + Math.random() * 30}%)`;
                else if (type === 'nitro') color = '#ff00cc';
                else if (type === 'smoke') color = 'rgba(180,180,180,0.4)';
                else color = '#ffcc00';
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - (type === 'crash' ? 60 : 0),
                    life: 1.0,
                    decay: type === 'crash' ? 0.8 + Math.random() * 0.5 : 1.2 + Math.random() * 0.8,
                    size: type === 'crash' ? 4 + Math.random() * 5 : 2 + Math.random() * 3,
                    color
                });
            }
        }

        setLevel(lvl) {
            this.level = Math.min(lvl, 10);
            this.levelCfg = LEVEL_CONFIG[this.level - 1];
            this.bgTheme = BG_THEMES[this.levelCfg.bgIndex];
            this.traffic = [];
            this.spawnInitialTraffic();
            document.getElementById('hud-level').textContent = this.level;
            const ann = document.getElementById('level-announce');
            document.getElementById('announce-num').textContent = this.level;
            ann.classList.remove('hidden');
            ann.style.animation = 'none';
            void ann.offsetHeight;
            ann.style.animation = '';
            playSfx('level');
            setTimeout(() => ann.classList.add('hidden'), 2100);
            this.scoreToNextLevel = 500 + this.level * 400;
            this.levelStartScore = this.score;
        }

        checkAutoQuality(fps) {
            this._autoQualityTimer += 1;
            if (this._autoQualityTimer < 180) return;
            this._autoQualityTimer = 0;
            if (fps < 40 && !this.lowQ) {
                this._lowFpsCount++;
                if (this._lowFpsCount >= 3) {
                    this.lowQ = true;
                    state.lowQuality = true;
                    storage.set('moto_quality', true);
                    this.dpr = 1;
                    this.resizeCanvas();
                    this.spriteCache.clear();
                }
            } else if (fps > 55 && this._lowFpsCount > 0) {
                this._lowFpsCount = Math.max(0, this._lowFpsCount - 1);
            }
        }

        update(dt) {
            if (this.paused || this.gameOver) return;
            this.frameCount++;

            const p = this.player;
            const isNitro = this.input.isNitro() && p.nitro > 0;

            if (isNitro) {
                p.nitroActive = true;
                p.nitro = Math.max(0, p.nitro - dt * 0.6);
                this._nitroSfxCd -= dt;
                if (this._nitroSfxCd <= 0) { playSfx('nitro'); this._nitroSfxCd = 0.3; }
            } else {
                p.nitroActive = false;
                p.nitro = Math.min(p.nitroMax, p.nitro + dt * 0.25);
                this._nitroSfxCd = 0;
            }

            const nitroMult = p.nitroActive ? 1.6 : 1.0;
            const speedMult = nitroMult * (1 + (this.level - 1) * 0.12);

            if (this.input.isUp()) {
                p.speed = Math.min(p.maxSpeed * speedMult, p.speed + p.accel * dt * speedMult);
            } else if (this.input.isDown()) {
                p.speed = Math.max(0, p.speed - p.decel * dt * 2);
            } else {
                p.speed = Math.max(60, p.speed - p.decel * dt * 0.5);
            }

            const lateralF = Math.min(1, p.speed / 200);
            if (this.input.isLeft()) {
                p.vx = -p.handling * lateralF * nitroMult;
                p.tilt = Math.min(p.tilt + dt * 6, 0.4);
            } else if (this.input.isRight()) {
                p.vx = p.handling * lateralF * nitroMult;
                p.tilt = Math.max(p.tilt - dt * 6, -0.4);
            } else {
                p.vx *= Math.pow(0.05, dt);
                p.tilt *= Math.pow(0.1, dt);
            }

            p.x = Math.max(this.roadX + p.w / 2 + 4, Math.min(this.roadX + this.roadW - p.w / 2 - 4, p.x + p.vx * dt));

            if (!this.lowQ && Math.abs(p.vx) > 100 && lateralF > 0.5) {
                p.driftSmoke += dt;
                if (p.driftSmoke > 0.06) { this.spawnParticle(p.x, p.y + p.h * 0.4, 'smoke'); p.driftSmoke = 0; }
            } else { p.driftSmoke = 0; }

            if (p.nitroActive) {
                p.exhaustTimer += dt;
                if (p.exhaustTimer > 0.05) {
                    this.spawnParticle(p.x - 7, p.y + p.h * 0.45, 'nitro');
                    this.spawnParticle(p.x + 7, p.y + p.h * 0.45, 'nitro');
                    p.exhaustTimer = 0;
                }
            }

            const scrollSpeed = p.speed * dt;
            this.roadLineOffset = (this.roadLineOffset + scrollSpeed) % 80;
            this.bgScrollY = (this.bgScrollY + scrollSpeed * 0.3) % this.H;
            this.score += p.speed * dt * 0.04;

            this._coinRowTimer += dt;
            if (this._coinRowTimer > 3.0) { this.spawnCoinRow(); this._coinRowTimer = 0; }

            this.updateTraffic(dt, scrollSpeed);
            this.updateCoins(dt, scrollSpeed);
            this.updateParticles(dt);
            if (this.levelCfg.rain) this.updateRain(dt, scrollSpeed);
            if (this.score - this.levelStartScore > this.scoreToNextLevel && this.level < 10) this.setLevel(this.level + 1);
            if (p.invincible > 0) p.invincible -= dt;

            const scoreI = Math.floor(this.score);
            if (scoreI !== this._prevScore) { this._hudScore.textContent = scoreI.toLocaleString(); this._prevScore = scoreI; }
            const speedI = Math.floor(p.speed);
            if (speedI !== this._prevSpeed) { this._hudSpeed.textContent = speedI; this._prevSpeed = speedI; }
            this._hudNitro.style.width = (p.nitro / p.nitroMax * 100) + '%';
            this.updateSpeedometer();
        }

        updateTraffic(dt, scrollSpeed) {
            const cfg = this.levelCfg;
            for (let i = this.traffic.length - 1; i >= 0; i--) {
                const t = this.traffic[i];
                t.y += scrollSpeed - t.speed * dt;
                if (t.y > this.H + t.h * 2 + 20) {
                    this.traffic.splice(i, 1);
                    this.spawnTraffic(false);
                    continue;
                }
                if (this.player.invincible <= 0) {
                    const p = this.player;
                    if (Math.abs(p.x - t.x) < (p.w / 2 + t.w - 2) && Math.abs(p.y - t.y) < (p.h / 2 + t.h - 4)) {
                        this.onCrash();
                        return;
                    }
                }
            }
            while (this.traffic.length < cfg.trafficCount) this.spawnTraffic(false);
        }

        updateCoins(dt, scrollSpeed) {
            const magnetR = getMagnetRadius();
            const p = this.player;
            const hasMagnet = state.upgrades.coinMagnet > 0;
            const pull = 300 + state.upgrades.coinMagnet * 100;

            for (let i = this.coins.length - 1; i >= 0; i--) {
                const c = this.coins[i];
                c.y += scrollSpeed;
                if (!this.lowQ) c.glowPhase += dt * 4;

                if (hasMagnet) {
                    const dx = p.x - c.x, dy = p.y - c.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < magnetR && dist > 0.1) {
                        c.x += (dx / dist) * pull * dt;
                        c.y += (dy / dist) * pull * dt;
                    }
                }

                const dx = p.x - c.x, dy = p.y - c.y;
                if (dx * dx + dy * dy < 22 * 22) {
                    c.collected = true;
                    const earned = Math.ceil(getCoinMultiplier());
                    this.earnedCoins += earned;
                    state.coins += earned;
                    storage.set('moto_coins', state.coins);
                    const coinsI = state.coins;
                    if (coinsI !== this._prevCoins) { this._hudCoins.textContent = coinsI.toLocaleString(); this._prevCoins = coinsI; }
                    if (!this.lowQ) this.spawnParticle(c.x, c.y, 'coin');
                    playSfx('coin');
                }

                if (c.collected || c.y > this.H + 20) this.coins.splice(i, 1);
            }
        }

        updateParticles(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 200 * dt;
                p.life -= p.decay * dt;
                if (p.life <= 0) this.particles.splice(i, 1);
            }
        }

        updateRain(dt, scrollSpeed) {
            const spd = (500 + this.player.speed * 0.5) * dt;
            for (const d of this.rainDrops) {
                d.y += spd;
                if (d.y > this.H + d.len) { d.y = -d.len; d.x = Math.random() * this.W; }
            }
        }

        onCrash() {
            if (this.gameOver) return;
            this.gameOver = true;
            const p = this.player;
            p.speed = 0;
            this.spawnParticle(p.x, p.y, 'crash');
            playSfx('crash');
            if (this.score > state.highscore) {
                state.highscore = Math.floor(this.score);
                storage.set('moto_highscore', state.highscore);
            }
            document.getElementById('go-score').textContent = Math.floor(this.score).toLocaleString();
            document.getElementById('go-highscore').textContent = state.highscore.toLocaleString();
            document.getElementById('go-coins').textContent = this.earnedCoins.toLocaleString();
            document.getElementById('go-level').textContent = this.level;
            setTimeout(() => document.getElementById('gameover-overlay').classList.remove('hidden'), 600);
        }

        updateSpeedometer() {
            const ctx = this.speedoCtx;
            const W = 120, H = 68;
            ctx.clearRect(0, 0, W, H);
            const cx = 60, cy = 66, r = 52;
            const startAngle = Math.PI * 0.85, p = this.player;
            const ratio = Math.min(1, p.speed / p.maxSpeed);
            const arcEnd = startAngle + ratio * (Math.PI * 1.3);

            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 7;
            ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, startAngle + Math.PI * 1.3); ctx.stroke();

            const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
            grad.addColorStop(0, '#00f5ff');
            grad.addColorStop(0.5, '#00ff88');
            grad.addColorStop(1, p.nitroActive ? '#ff00aa' : '#ffee00');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 5;
            if (!this.lowQ) { ctx.shadowBlur = 10; ctx.shadowColor = p.nitroActive ? '#ff00aa' : '#00f5ff'; }
            ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, arcEnd); ctx.stroke();
            if (!this.lowQ) ctx.shadowBlur = 0;

            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(arcEnd) * (r - 8), cy + Math.sin(arcEnd) * (r - 8)); ctx.stroke();
            ctx.fillStyle = 'rgba(0,245,255,0.9)';
            ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
        }

        draw() {
            const ctx = this.ctx;
            const s = this.dpr;
            ctx.save();
            ctx.scale(s, s);
            const w = this.W, h = this.H;
            this.drawBackground(ctx, w, h);
            this.drawRoad(ctx, w, h);
            this.drawCoins(ctx);
            this.drawTraffic(ctx);
            if (!this.lowQ) this.drawParticles(ctx);
            this.drawPlayer(ctx);
            if (this.levelCfg.rain) this.drawRain(ctx, w, h);
            if (this.levelCfg.night) this.drawNightOverlay(ctx, w, h);
            ctx.restore();
        }

        drawBackground(ctx, w, h) {
            const t = this.bgTheme;
            const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
            skyGrad.addColorStop(0, t.sky1); skyGrad.addColorStop(1, t.sky2);
            ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h * 0.55);

            const phase = this.bgScrollY / h;
            const mCount = this.lowQ ? 2 : 3;
            for (let i = 0; i < mCount; i++) {
                const yBase = h * (0.25 + i * 0.06);
                const xOffset = (phase * 40 * (i + 1)) % w;
                ctx.fillStyle = i === 0 ? t.mountain : t.mountain2;
                ctx.beginPath(); ctx.moveTo(-xOffset, yBase);
                for (let x = -xOffset; x < w + 100; x += 80) {
                    const peak = yBase - 40 - Math.sin(x * 0.03 + i * 1.5) * 30 - Math.cos(x * 0.05 + i) * 20;
                    ctx.lineTo(x + 40, peak); ctx.lineTo(x + 80, yBase);
                }
                ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
            }
        }

        drawRoad(ctx, w, h) {
            const rx = this.roadX, rw = this.roadW;
            const cfg = this.levelCfg;

            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, rx, h);
            ctx.fillRect(rx + rw, 0, w - rx - rw, h);

            ctx.fillStyle = cfg.roadColor;
            ctx.fillRect(rx, 0, rw, h);

            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 2.5; ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(rx, 0); ctx.lineTo(rx, h);
            ctx.moveTo(rx + rw, 0); ctx.lineTo(rx + rw, h);
            ctx.stroke();

            if (!this.lowQ) {
                const eg1 = ctx.createLinearGradient(rx, 0, rx + 18, 0);
                eg1.addColorStop(0, 'rgba(0,245,255,0.12)'); eg1.addColorStop(1, 'transparent');
                ctx.fillStyle = eg1; ctx.fillRect(rx, 0, 18, h);
                const eg2 = ctx.createLinearGradient(rx + rw, 0, rx + rw - 18, 0);
                eg2.addColorStop(0, 'rgba(255,0,170,0.12)'); eg2.addColorStop(1, 'transparent');
                ctx.fillStyle = eg2; ctx.fillRect(rx + rw - 18, 0, 18, h);
            }

            ctx.strokeStyle = cfg.lineColor; ctx.lineWidth = 2;
            ctx.setLineDash([40, 40]); ctx.lineDashOffset = -this.roadLineOffset;
            for (let l = 1; l < 3; l++) {
                const lx = rx + (rw / 3) * l;
                ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, h); ctx.stroke();
            }
            ctx.setLineDash([]);

            const speedRatio = this.player.speed / this.player.maxSpeed;
            if (!this.lowQ && speedRatio > 0.5) {
                const alpha = (speedRatio - 0.5) * 0.25;
                const mgrad = ctx.createLinearGradient(0, 0, 0, h);
                mgrad.addColorStop(0, `rgba(0,0,0,${alpha})`);
                mgrad.addColorStop(0.35, 'transparent');
                mgrad.addColorStop(0.65, 'transparent');
                mgrad.addColorStop(1, `rgba(0,0,0,${alpha})`);
                ctx.fillStyle = mgrad; ctx.fillRect(0, 0, w, h);
            }
        }

        drawPlayer(ctx) {
            const p = this.player;
            if (p.invincible > 0 && Math.floor(p.invincible * 10) % 2 === 0) return;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(-p.tilt * 0.28);
            const c = p.color, a = p.accent;

            if (p.nitroActive && !this.lowQ) {
                const flameCount = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < flameCount; i++) {
                    const fx = (Math.random() - 0.5) * 14;
                    const fLen = 18 + Math.random() * 32;
                    const fg = ctx.createLinearGradient(fx, 13, fx, 13 + fLen);
                    fg.addColorStop(0, 'rgba(255,100,0,0.9)'); fg.addColorStop(0.4, 'rgba(255,0,100,0.5)'); fg.addColorStop(1, 'transparent');
                    ctx.fillStyle = fg;
                    ctx.beginPath(); ctx.ellipse(fx, 13 + fLen / 2, 4, fLen / 2, 0, 0, Math.PI * 2); ctx.fill();
                }
            }

            if (!this.lowQ) { ctx.shadowBlur = 18; ctx.shadowColor = c; }

            ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.beginPath(); ctx.arc(-9, 15, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(9, 15, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-9, 15); ctx.lineTo(0, -2); ctx.lineTo(9, 15); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-3, -10); ctx.stroke();

            ctx.fillStyle = a; if (!this.lowQ) ctx.shadowColor = a;
            ctx.beginPath(); ctx.roundRect(-10, -14, 20, 16, 4); ctx.fill();

            ctx.fillStyle = c; if (!this.lowQ) ctx.shadowColor = c;
            ctx.beginPath(); ctx.roundRect(-5, -23, 10, 10, 3); ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.beginPath(); ctx.roundRect(-4, -22, 8, 8, 2); ctx.fill();

            if (!this.lowQ) {
                ctx.fillStyle = '#ff6600'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 22;
                ctx.beginPath(); ctx.ellipse(-11, 15, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 28;
                ctx.beginPath(); ctx.ellipse(11, 15, 3.5, 3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            }
            ctx.restore();
        }

        drawTraffic(ctx) {
            for (const t of this.traffic) {
                const sprite = this.spriteCache.getTrafficSprite(t.type, t.color, t.w, t.h, this.lowQ);
                const ox = sprite.width / 2, oy = sprite.height / 2;
                ctx.drawImage(sprite, t.x - ox, t.y - oy);
            }
        }

        drawCoins(ctx) {
            for (const c of this.coins) {
                if (c.collected) continue;
                ctx.save();
                ctx.translate(c.x, c.y);
                if (!this.lowQ) {
                    const glow = 0.5 + Math.sin(c.glowPhase) * 0.3;
                    ctx.shadowBlur = 14 * glow; ctx.shadowColor = '#ffee00';
                    ctx.rotate(c.glowPhase * 0.5);
                }
                ctx.fillStyle = '#ffee00';
                ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
                if (!this.lowQ) {
                    ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.beginPath(); ctx.arc(-c.r * 0.3, -c.r * 0.3, c.r * 0.32, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                }
                ctx.restore();
            }
        }

        drawParticles(ctx) {
            for (const p of this.particles) {
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 6; ctx.shadowColor = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        }

        drawRain(ctx, w, h) {
            ctx.save();
            ctx.strokeStyle = 'rgba(160,210,255,0.22)'; ctx.lineWidth = 1;
            for (const d of this.rainDrops) {
                ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 1.5, d.y + d.len); ctx.stroke();
            }
            if (!this.lowQ) { ctx.fillStyle = 'rgba(100,150,255,0.03)'; ctx.fillRect(0, 0, w, h); }
            ctx.restore();
        }

        drawNightOverlay(ctx, w, h) {
            ctx.fillStyle = 'rgba(0,0,10,0.4)'; ctx.fillRect(0, 0, w, h);
            if (!this.lowQ) {
                const p = this.player;
                const hg = ctx.createRadialGradient(p.x, p.y - 28, 4, p.x, p.y - 28, 190);
                hg.addColorStop(0, 'rgba(255,240,180,0.2)'); hg.addColorStop(1, 'transparent');
                ctx.fillStyle = hg; ctx.fillRect(0, 0, w, h);
            }
        }

        loop(timestamp) {
            if (!this.running) return;

            const elapsed = timestamp - this._lastFrameTime;
            if (elapsed < this._fpsInterval - 2) {
                this.raf = requestAnimationFrame(ts => this.loop(ts));
                return;
            }
            this._lastFrameTime = timestamp - (elapsed % this._fpsInterval);

            const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
            this.lastTime = timestamp;

            this._fpsCounter++;
            this._fpsTimer += dt;
            if (this._fpsTimer >= 0.5) {
                this._fps = Math.round(this._fpsCounter / this._fpsTimer);
                this._fpsCounter = 0;
                this._fpsTimer = 0;
                this._hudFps.textContent = this._fps;
                if (this._fps < 40) this._hudFps.style.color = '#ff4444';
                else if (this._fps < 55) this._hudFps.style.color = '#ffaa00';
                else this._hudFps.style.color = '#00ff88';
                this.checkAutoQuality(this._fps);
            }

            if (!this.paused && !this.gameOver) this.update(dt);
            this.draw();
            this.raf = requestAnimationFrame(ts => this.loop(ts));
        }

        start() {
            this.running = true;
            this.lastTime = performance.now();
            this._lastFrameTime = performance.now();
            document.getElementById('hud-highscore') && (document.getElementById('hud-highscore').textContent = state.highscore.toLocaleString());
            this.setLevel(1);
            this.raf = requestAnimationFrame(ts => this.loop(ts));
        }

        stop() {
            this.running = false;
            if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
            this.input.destroy();
            window.removeEventListener('resize', this._onResize);
            window.removeEventListener('orientationchange', this._onResize);
            document.removeEventListener('visibilitychange', this._onVisibility);
            clearTimeout(this._resizeTimer);
            this.spriteCache.clear();
            this.particles = [];
            this.traffic = [];
            this.coins = [];
        }

        pause() { this.paused = true; }

        resume() {
            this.paused = false;
            this.lastTime = performance.now();
            this._lastFrameTime = performance.now();
        }
    }

    function startGame() {
        if (game) { game.stop(); game = null; }
        showScreen('game-screen');
        document.getElementById('gameover-overlay').classList.add('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');
        document.getElementById('mobile-controls').style.display = '';
        const canvas = document.getElementById('game-canvas');
        game = new GameEngine(canvas);
        game.start();
        startBgm();
    }

    function initUI() {
        document.getElementById('btn-start').addEventListener('click', () => {
            getAudioCtx();
            playSfx('buy');
            startGame();
        }, { passive: true });

        document.getElementById('btn-market-menu').addEventListener('click', () => {
            playSfx('buy');
            openMarket(false);
        }, { passive: true });

        document.getElementById('btn-settings-menu').addEventListener('click', () => {
            playSfx('buy');
            showScreen('settings-screen');
        }, { passive: true });

        document.getElementById('btn-back-settings').addEventListener('click', () => {
            showScreen('main-menu');
            updateMenuUI();
        }, { passive: true });

        document.getElementById('btn-pause').addEventListener('click', () => {
            if (game && !game.gameOver) {
                game.pause();
                document.getElementById('pause-overlay').classList.remove('hidden');
            }
        }, { passive: true });

        document.getElementById('btn-resume').addEventListener('click', () => {
            document.getElementById('pause-overlay').classList.add('hidden');
            if (game) game.resume();
        }, { passive: true });

        document.getElementById('btn-restart-pause').addEventListener('click', () => {
            document.getElementById('pause-overlay').classList.add('hidden');
            startGame();
        }, { passive: true });

        document.getElementById('btn-menu-pause').addEventListener('click', () => {
            document.getElementById('pause-overlay').classList.add('hidden');
            if (game) { game.stop(); game = null; }
            stopBgm();
            showScreen('main-menu');
            updateMenuUI();
        }, { passive: true });

        document.getElementById('btn-retry').addEventListener('click', () => {
            document.getElementById('gameover-overlay').classList.add('hidden');
            startGame();
        }, { passive: true });

        document.getElementById('btn-market-go').addEventListener('click', () => {
            openMarket(true);
        }, { passive: true });

        document.getElementById('btn-menu-go').addEventListener('click', () => {
            document.getElementById('gameover-overlay').classList.add('hidden');
            if (game) { game.stop(); game = null; }
            stopBgm();
            showScreen('main-menu');
            updateMenuUI();
        }, { passive: true });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
            }, { passive: true });
        });

        const musicBtn = document.getElementById('toggle-music');
        const sfxBtn = document.getElementById('toggle-sfx');
        const qualityBtn = document.getElementById('toggle-quality');

        if (!state.musicOn) { musicBtn.textContent = 'KAPALI'; musicBtn.classList.add('off'); }
        if (!state.sfxOn) { sfxBtn.textContent = 'KAPALI'; sfxBtn.classList.add('off'); }
        if (state.lowQuality) { qualityBtn.textContent = 'DÜŞÜK'; qualityBtn.classList.add('off'); }

        musicBtn.addEventListener('click', (e) => {
            state.musicOn = !state.musicOn;
            storage.set('moto_music', state.musicOn);
            e.target.textContent = state.musicOn ? 'AÇIK' : 'KAPALI';
            e.target.classList.toggle('off', !state.musicOn);
            if (state.musicOn) startBgm(); else stopBgm();
        }, { passive: true });

            sfxBtn.addEventListener('click', (e) => {
            state.sfxOn = !state.sfxOn;
            storage.set('moto_sfx', state.sfxOn);
            e.target.textContent = state.sfxOn ? 'AÇIK' : 'KAPALI';
            e.target.classList.toggle('off', !state.sfxOn);
        }, { passive: true });

        qualityBtn.addEventListener('click', (e) => {
            state.lowQuality = !state.lowQuality;
            storage.set('moto_quality', state.lowQuality);
            e.target.textContent = state.lowQuality ? 'DÜŞÜK' : 'YÜKSEK';
            e.target.classList.toggle('off', state.lowQuality);
        }, { passive: true });

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (confirm('Tüm veriler silinecek. Emin misiniz?')) {
                localStorage.clear();
                location.reload();
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#mobile-controls')) return;
        }, { passive: true });

        updateMenuUI();
    }

    return { init: initUI };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});