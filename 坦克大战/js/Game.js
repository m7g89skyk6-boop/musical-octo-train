// Neon Tanks - 合并版（支持 file:// 协议直接打开）
(function() {
'use strict';

// ========== constants.js ==========
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 40;
const COLS = 20;
const ROWS = 15;
const TILE_EMPTY = 0;
const TILE_BRICK = 1;
const TILE_STEEL = 2;
const TILE_GRASS = 3;
const TILE_WATER = 4;
const TANK_SIZE = 36;
const BULLET_SIZE = 6;
const BOSS_SIZE = 90;
const POWERUP_SIZE = 28;

const COLORS = {
  bg: '#0a0f24',
  grid: 'rgba(0, 243, 255, 0.06)',
  player: '#00f3ff',
  playerGlow: 'rgba(0, 243, 255, 0.5)',
  enemy: '#ff0055',
  enemyGlow: 'rgba(255, 0, 85, 0.5)',
  enemyScout: '#ff3377',
  enemyArmored: '#cc0044',
  boss: '#ffaa00',
  bossGlow: 'rgba(255, 170, 0, 0.6)',
  brick: '#8b1a1a',
  brickStroke: '#cc3333',
  steel: '#a0a0a0',
  steelRivet: '#707070',
  grass: 'rgba(0, 200, 80, 0.35)',
  water: '#0a3060',
  waterLine: 'rgba(0, 200, 255, 0.3)',
  bulletPlayer: '#00f3ff',
  bulletEnemy: '#ff0055',
  bulletBoss: '#ffaa00',
  shield: '#00aaff',
  shieldGlow: 'rgba(0, 170, 255, 0.4)',
  base: '#00f3ff',
  baseGlow: 'rgba(0, 243, 255, 0.6)',
  white: '#ffffff',
  warning: '#ff0000',
  gold: '#ffaa00',
};

const SPEED = {
  player: 2.5,
  playerBullet: 6,
  enemyStandard: 1.5,
  enemyScout: 3.0,
  enemyArmored: 0.9,
  enemyBullet: 4,
  enemyBulletFast: 8,
  bossBullet: 5,
};

const COOLDOWN = {
  player: 200,
  enemyStandard: 1500,
  enemyScout: 2000,
  enemyArmored: 1000,
  bossPhase1: 800,
  bossPhase2: 1200,
  bossPhase3: 1500,
};

const HEALTH = {
  player: 5,
  enemyStandard: 1,
  enemyScout: 1,
  enemyArmored: 3,
  bossBase: 15,
  bossScale: 2,
};

const ENEMY_BULLET_DAMAGE = 0.5;
const PLAYER_LIFESTEAL = 0.5; // 玩家击杀回复血量

const GAME_CFG = {
  enemyBase: 5,
  enemyScale: 2,
  maxEnemiesOnScreen: 4,
  spawnIntervalMin: 1200,
  spawnIntervalDecay: 40,
  waveInterval: 3000,
  playerInvincibleTime: 1500,
  powerUpChance: 0.3,
  powerUpDuration: 5000,
  freezeDuration: 3000,
  bossWaveInterval: 5,
  bossEntryDuration: 1500,
  victoryWave: 10,
  shieldHits: 3,
  bossLifeBonus: 3,
};

const POWERUP_TYPES = {
  FIREPOWER: 0,
  SHIELD: 1,
  FREEZE: 2,
  LIGHTNING: 3,
  REPAIR: 4,
};

const DIR = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

const STATE = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
  VICTORY: 'victory',
};

// ========== Entity.js ==========
class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 0;
    this.direction = 'up';
    this.active = true;
  }
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
  collidesWith(other) {
    const a = this.getBounds();
    const b = other.getBounds();
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }
  update() {}
  draw(ctx) {}
}

// ========== ParticleSystem.js ==========
class _Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color; this.size = size; this.active = true;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.98; this.vy *= 0.98;
    this.life--;
    if (this.life <= 0) this.active = false;
  }
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size * alpha / 2, this.y - this.size * alpha / 2, this.size * alpha, this.size * alpha);
    ctx.globalAlpha = 1;
  }
}

class ParticleSystem {
  constructor() { this.particles = []; }
  emitExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push(new _Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 20 + Math.floor(Math.random() * 20), color, 2 + Math.random() * 4));
    }
  }
  emitSparks(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push(new _Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 10 + Math.floor(Math.random() * 10), '#ffcc00', 2));
    }
  }
  emitBrickDebris(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push(new _Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 15 + Math.floor(Math.random() * 15), '#cc5533', 3));
    }
  }
  emitTrail(x, y, color) {
    this.particles.push(new _Particle(x, y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 8 + Math.floor(Math.random() * 5), color, 2));
  }
  emitBossDeath(x, y) {
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60;
      const speed = 2 + Math.random() * 6;
      this.particles.push(new _Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 30 + Math.floor(Math.random() * 40), Math.random() > 0.5 ? '#ffaa00' : '#ffdd00', 3 + Math.random() * 6));
    }
  }
  emitShootFlash(x, y, color) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      this.particles.push(new _Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 6, color, 2));
    }
  }
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (!this.particles[i].active) this.particles.splice(i, 1);
    }
    // 限制最大粒子数，防止掉帧
    if (this.particles.length > 200) {
      this.particles.splice(0, this.particles.length - 200);
    }
  }
  draw(ctx) {
    for (const p of this.particles) p.draw(ctx);
  }
  clear() { this.particles = []; }
}

// ========== Sound.js ==========
class Sound {
  constructor() {
    this.ctx = null; this.enabled = true;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { this.enabled = false; }
  }
  _ensureContext() {
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  _playTone(freq, duration, type = 'square', volume = 0.1) {
    const ctx = this._ensureContext(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
  }
  _playNoise(duration, volume = 0.08) {
    const ctx = this._ensureContext(); if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain); gain.connect(ctx.destination);
    source.start(ctx.currentTime); source.stop(ctx.currentTime + duration);
  }
  playShoot() { this._playTone(1200, 0.05, 'square', 0.06); }
  playExplosion() { this._playNoise(0.2, 0.1); this._playTone(80, 0.15, 'sawtooth', 0.08); }
  playPickup() {
    const ctx = this._ensureContext(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  }
  playBossWarning() { for (let i = 0; i < 3; i++) setTimeout(() => this._playTone(150, 0.2, 'sawtooth', 0.12), i * 400); }
  playBossDeath() { this._playNoise(0.5, 0.15); this._playTone(60, 0.4, 'sawtooth', 0.12); setTimeout(() => this._playTone(40, 0.3, 'sawtooth', 0.1), 200); }
  playGameOver() { [400, 300, 200, 100].forEach((freq, i) => setTimeout(() => this._playTone(freq, 0.2, 'square', 0.1), i * 200)); }
  playFreeze() { this._playTone(600, 0.1, 'sine', 0.08); setTimeout(() => this._playTone(400, 0.15, 'sine', 0.08), 100); }
  playLightning() { this._playNoise(0.3, 0.15); this._playTone(200, 0.2, 'sawtooth', 0.1); }
  playPlayerHit() { this._playNoise(0.1, 0.08); this._playTone(200, 0.1, 'square', 0.06); }
}

// ========== Input.js ==========
class Input {
  constructor() {
    this.keys = {}; this.justPressed = {}; this.prevKeys = {};
    this.touchActive = false;
    this.touchMove = { active: false, dx: 0, dy: 0 };
    this.touchFire = false;
    this._initKeyboard();
    this._initTouch();
  }
  _initKeyboard() {
    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }
  _initTouch() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const isTouchDevice = 'ontouchstart' in window;
    if (!isTouchDevice) return;
    this.touchActive = true;
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        if (tx > rect.width / 2) { this.touchFire = true; }
        else { this.touchMove.active = true; this.touchMove.startX = tx; this.touchMove.startY = touch.clientY - rect.top; this.touchMove.dx = 0; this.touchMove.dy = 0; }
      }
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        if (tx <= rect.width / 2 && this.touchMove.active) {
          this.touchMove.dx = tx - this.touchMove.startX;
          this.touchMove.dy = touch.clientY - rect.top - this.touchMove.startY;
        }
      }
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        if (touch.clientX - rect.left > rect.width / 2) { this.touchFire = false; }
        else { this.touchMove.active = false; this.touchMove.dx = 0; this.touchMove.dy = 0; }
      }
    }, { passive: false });
  }
  isDown(code) { return !!this.keys[code]; }
  isJustPressed(code) { return !!this.justPressed[code]; }
  getDirection() {
    let dx = 0, dy = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) dy = -1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) dy = 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) dx = -1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx = 1;
    if (this.touchMove.active) {
      const threshold = 15;
      if (Math.abs(this.touchMove.dx) > threshold) dx = Math.sign(this.touchMove.dx);
      if (Math.abs(this.touchMove.dy) > threshold) dy = Math.sign(this.touchMove.dy);
    }
    if (dx !== 0 && dy !== 0) {
      if (Math.abs(this.touchMove.dx || dx) > Math.abs(this.touchMove.dy || dy)) dy = 0;
      else dx = 0;
    }
    return { dx, dy };
  }
  isFiring() { return this.isDown('Space') || this.isDown('KeyJ') || this.touchFire; }
  update() {
    this.justPressed = {};
    for (const key in this.keys) {
      if (this.keys[key] && !this.prevKeys[key]) this.justPressed[key] = true;
    }
    this.prevKeys = { ...this.keys };
  }
}

// ========== Map.js ==========
const MAP_DATA = [
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,1,0,0,0,0,0,1,0,0,1,1,0,0,0],
    [0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,1,0,3,3,3,3,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,3,0,0,3,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
  ],
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0],
    [0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
    [0,0,3,3,1,0,0,0,0,0,0,0,0,0,0,1,3,3,0,0],
    [0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,4,4,4,4,0,0,4,4,4,4,0,0,0,0,0],
    [0,0,0,0,0,4,0,0,0,0,0,0,0,0,4,0,0,0,0,0],
    [0,0,0,0,0,4,0,0,0,0,0,0,0,0,4,0,0,0,0,0],
    [0,0,0,0,0,4,4,4,4,0,0,4,4,4,4,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
  ],
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0],
    [0,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,3,3,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [3,3,0,0,0,0,3,3,0,0,0,0,3,3,0,0,0,0,3,3],
    [3,3,0,0,0,0,3,3,0,0,0,0,3,3,0,0,0,0,3,3],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0],
  ],
];

class Map {
  constructor(mapIndex = 0) {
    this.tileSize = TILE_SIZE;
    this.cols = COLS;
    this.rows = ROWS;
    this.waterPhase = 0;
    this.grassPhase = 0;
    this.grid = MAP_DATA[mapIndex % MAP_DATA.length].map(row => [...row]);
    this._grassPositions = this._buildGrassPositions();
  }
  _buildGrassPositions() {
    const positions = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] === TILE_GRASS) {
          positions.push({ x: col * this.tileSize, y: row * this.tileSize });
        }
      }
    }
    return positions;
  }
  static getRandomMapIndex() { return Math.floor(Math.random() * MAP_DATA.length); }
  getTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return TILE_EMPTY;
    return this.grid[row][col];
  }
  getTileAtPixel(px, py) { return this.getTile(Math.floor(px / this.tileSize), Math.floor(py / this.tileSize)); }
  isSolid(col, row) { const t = this.getTile(col, row); return t === TILE_BRICK || t === TILE_STEEL || t === TILE_WATER; }
  isSolidPixel(px, py) { return this.isSolid(Math.floor(px / this.tileSize), Math.floor(py / this.tileSize)); }
  isBlockingBullet(col, row) { const t = this.getTile(col, row); return t === TILE_BRICK || t === TILE_STEEL; }
  destroyTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    if (this.grid[row][col] === TILE_BRICK) { this.grid[row][col] = TILE_EMPTY; return true; }
    return false;
  }
  getBasePosition() {
    return { col: 9, row: 13, x: 9 * this.tileSize, y: 13 * this.tileSize, width: 2 * this.tileSize, height: 2 * this.tileSize };
  }
  isBaseWall(col, row) {
    const base = this.getBasePosition();
    const bc = base.col, br = base.row;
    if (col >= bc - 1 && col <= bc + 2 && row >= br - 1 && row <= br + 2) {
      if (col >= bc && col <= bc + 1 && row >= br && row <= br + 1) return false;
      return true;
    }
    return false;
  }
  rebuildBaseWalls() {
    const base = this.getBasePosition();
    const bc = base.col, br = base.row;
    for (let r = br - 1; r <= br + 2; r++) {
      for (let c = bc - 1; c <= bc + 2; c++) {
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          if (c >= bc && c <= bc + 1 && r >= br && r <= br + 1) continue;
          this.grid[r][c] = TILE_BRICK;
        }
      }
    }
  }
  update(dt) { this.waterPhase += 0.05; this.grassPhase += 0.03; }
  draw(ctx) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.grid[row][col];
        const x = col * this.tileSize, y = row * this.tileSize;
        switch (tile) {
          case TILE_BRICK: this._drawBrick(ctx, x, y); break;
          case TILE_STEEL: this._drawSteel(ctx, x, y); break;
          case TILE_GRASS: this._drawGrass(ctx, x, y); break;
          case TILE_WATER: this._drawWater(ctx, x, y); break;
        }
      }
    }
  }
  drawBase(ctx, baseAlive) {
    const base = this.getBasePosition();
    const cx = base.x + base.width / 2, cy = base.y + base.height / 2;
    ctx.save();
    ctx.fillStyle = !baseAlive ? (Math.sin(Date.now() * 0.05) > 0 ? '#ff0000' : COLORS.base) : COLORS.base;
    ctx.shadowColor = COLORS.baseGlow; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(cx - 15, cy + 10); ctx.lineTo(cx, cy - 15); ctx.lineTo(cx + 15, cy + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COLORS.base; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15); ctx.stroke();
    ctx.fillRect(cx - 8, cy + 12, 16, 6);
    ctx.restore();
  }
  _drawBrick(ctx, x, y) {
    const s = this.tileSize;
    ctx.fillStyle = COLORS.brick; ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = COLORS.brickStroke; ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
    ctx.beginPath(); ctx.moveTo(x + s / 2, y + 1); ctx.lineTo(x + s / 2, y + s - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 1, y + s / 2); ctx.lineTo(x + s - 1, y + s / 2); ctx.stroke();
  }
  _drawSteel(ctx, x, y) {
    const s = this.tileSize;
    ctx.fillStyle = COLORS.steel; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = COLORS.steelRivet;
    [[5,5],[s-5,5],[5,s-5],[s-5,s-5]].forEach(([rx,ry]) => { ctx.beginPath(); ctx.arc(x+rx, y+ry, 3, 0, Math.PI*2); ctx.fill(); });
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.strokeRect(x+1, y+1, s-2, s-2);
  }
  _drawGrass(ctx, x, y) {
    const s = this.tileSize;
    const alpha = 0.25 + Math.sin(this.grassPhase + x * 0.1 + y * 0.1) * 0.1;
    ctx.fillStyle = `rgba(0, 180, 60, ${alpha})`; ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = `rgba(0, 220, 80, ${alpha * 0.5})`; ctx.lineWidth = 1;
    for (let i = 2; i < s; i += 6) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i - 3, y + s); ctx.stroke(); }
  }
  _drawWater(ctx, x, y) {
    const s = this.tileSize;
    ctx.fillStyle = COLORS.water; ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = COLORS.waterLine; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const offsetY = (this.waterPhase * 10 + i * 12 + x * 0.3) % (s + 10) - 5;
      ctx.beginPath(); ctx.moveTo(x, y + offsetY);
      for (let px = 0; px <= s; px += 4) ctx.lineTo(x + px, y + offsetY + Math.sin((px + this.waterPhase * 20) * 0.15) * 3);
      ctx.stroke();
    }
  }
}

// ========== Bullet.js ==========
class Bullet extends Entity {
  constructor(x, y, direction, isEnemy, damage = 1, speed = 6) {
    super(x, y, BULLET_SIZE, BULLET_SIZE);
    this.direction = direction; this.isEnemy = isEnemy; this.damage = damage;
    this.penetrate = 0; this.speed = speed;
    this.color = isEnemy ? COLORS.bulletEnemy : COLORS.bulletPlayer;
    this.trail = [];
  }
  update(map) {
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life--;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2, life: 4 });
    if (this.trail.length > 5) this.trail.shift();
    // 逐段碰撞检测，防止跳过砖块
    const steps = Math.ceil(this.speed / 4); // 每4px检测一次
    const stepX = this.direction === DIR.LEFT ? -4 : this.direction === DIR.RIGHT ? 4 : 0;
    const stepY = this.direction === DIR.UP ? -4 : this.direction === DIR.DOWN ? 4 : 0;
    for (let s = 0; s < steps; s++) {
      this.x += stepX;
      this.y += stepY;
      if (this.x < -this.width || this.x > CANVAS_WIDTH || this.y < -this.height || this.y > CANVAS_HEIGHT) { this.active = false; return; }
      const hitCol = Math.floor((this.x + this.width / 2) / map.tileSize);
      const hitRow = Math.floor((this.y + this.height / 2) / map.tileSize);
      const tile = map.getTile(hitCol, hitRow);
      if (tile === TILE_BRICK) { map.destroyTile(hitCol, hitRow); return { destroyedTile: true, col: hitCol, row: hitRow }; }
      else if (tile === TILE_STEEL) { return { hitSteel: true, col: hitCol, row: hitRow }; }
    }
    return null;
  }
  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      ctx.globalAlpha = t.life / 4 * 0.5; ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(t.x, t.y, this.width * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.shadowColor = this.color; ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 4, 0, Math.PI * 2); ctx.fill();
  }
}

// ========== Tank.js ==========
class Tank extends Entity {
  constructor(x, y, type) {
    super(x, y, TANK_SIZE, TANK_SIZE);
    this.type = type;
    this.direction = DIR.UP;
    this.health = 1; this.maxHealth = 1;
    this.cooldownTimer = 0; this.cooldownTime = 200;
    this.level = 1; this.shield = 0; this.invincible = 0;
    this.aiTimer = 0; this.aiTarget = 'base'; this.aiChangeTimer = 0;
    this.frozen = false; this.frozenTimer = 0; this.flicker = 0;
    this._initByType();
  }
  _initByType() {
    switch (this.type) {
      case 'player':
        this.speed = SPEED.player; this.health = HEALTH.player; this.maxHealth = HEALTH.player;
        this.cooldownTime = COOLDOWN.player; this.color = COLORS.player; this.glowColor = COLORS.playerGlow;
        this.direction = DIR.UP; break;
      case 'enemy_standard':
        this.speed = SPEED.enemyStandard; this.health = HEALTH.enemyStandard; this.maxHealth = HEALTH.enemyStandard;
        this.cooldownTime = COOLDOWN.enemyStandard; this.color = COLORS.enemy; this.glowColor = COLORS.enemyGlow;
        this.aiTarget = Math.random() < 0.3 ? 'player' : 'base'; break;
      case 'enemy_scout':
        this.speed = SPEED.enemyScout; this.health = HEALTH.enemyScout; this.maxHealth = HEALTH.enemyScout;
        this.cooldownTime = COOLDOWN.enemyScout; this.color = COLORS.enemyScout; this.glowColor = COLORS.enemyGlow;
        this.aiTarget = 'base'; break;
      case 'enemy_armored':
        this.speed = SPEED.enemyArmored; this.health = HEALTH.enemyArmored; this.maxHealth = HEALTH.enemyArmored;
        this.cooldownTime = COOLDOWN.enemyArmored; this.color = COLORS.enemyArmored; this.glowColor = COLORS.enemyGlow;
        this.aiTarget = Math.random() < 0.5 ? 'player' : 'base'; break;
    }
  }
  move(dx, dy, map, otherTanks) {
    if (dx === 0 && dy === 0) return false;
    if (this.frozen) return false;
    if (dy < 0) this.direction = DIR.UP;
    else if (dy > 0) this.direction = DIR.DOWN;
    else if (dx < 0) this.direction = DIR.LEFT;
    else if (dx > 0) this.direction = DIR.RIGHT;
    const newX = this.x + dx * this.speed, newY = this.y + dy * this.speed;
    if (newX < 0 || newX + this.width > CANVAS_WIDTH || newY < 0 || newY + this.height > CANVAS_HEIGHT) return false;
    const corners = [[newX, newY], [newX + this.width - 1, newY], [newX, newY + this.height - 1], [newX + this.width - 1, newY + this.height - 1]];
    for (const [cx, cy] of corners) { if (map.isSolidPixel(cx, cy)) return false; }
    const tempBounds = { x: newX, y: newY, width: this.width, height: this.height };
    for (const other of otherTanks) {
      if (other === this || !other.active) continue;
      const ob = other.getBounds();
      if (tempBounds.x < ob.x + ob.width && tempBounds.x + tempBounds.width > ob.x &&
          tempBounds.y < ob.y + ob.height && tempBounds.y + tempBounds.height > ob.y) return false;
    }
    this.x = newX; this.y = newY; return true;
  }
  shoot(bullets) {
    if (this.cooldownTimer > 0) return;
    this.cooldownTimer = this.cooldownTime;
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    const isEnemy = this.type !== 'player';
    const bulletSpeed = isEnemy ? (this.type === 'enemy_armored' ? SPEED.enemyBulletFast : SPEED.enemyBullet) : SPEED.playerBullet;
    const bulletCount = isEnemy ? 1 : this._getBulletCount();
    const bullets_arr = [];
    if (bulletCount === 1) {
      bullets_arr.push(this._createBullet(cx, cy, this.direction, isEnemy, bulletSpeed));
    } else if (bulletCount === 2) {
      if (this.direction === DIR.UP || this.direction === DIR.DOWN) {
        bullets_arr.push(this._createBullet(cx - 8, cy, this.direction, isEnemy, bulletSpeed));
        bullets_arr.push(this._createBullet(cx + 8, cy, this.direction, isEnemy, bulletSpeed));
      } else {
        bullets_arr.push(this._createBullet(cx, cy - 8, this.direction, isEnemy, bulletSpeed));
        bullets_arr.push(this._createBullet(cx, cy + 8, this.direction, isEnemy, bulletSpeed));
      }
    } else {
      const spreadAngles = this._getSpreadAngles(bulletCount);
      const baseAngle = this._directionToAngle(this.direction);
      for (const angle of spreadAngles) {
        const rad = (baseAngle + angle) * Math.PI / 180;
        const b = this._createBullet(cx, cy, this.direction, isEnemy, bulletSpeed);
        b._spreadAngle = rad; b._useSpread = true; b.direction = this.direction;
        if (this.level >= 5) { b.penetrate = 1; b.width = Math.floor(b.width * 1.5); b.height = Math.floor(b.height * 1.5); }
        bullets_arr.push(b);
      }
    }
    for (const b of bullets_arr) bullets.push(b);
    return bullets_arr;
  }
  _getBulletCount() { if (this.type !== 'player') return 1; return Math.min(this.level, 5); }
  _getSpreadAngles(count) { if (count <= 1) return [0]; if (count === 2) return [0, 0]; if (count === 3) return [-30, 0, 30]; if (count === 4) return [-45, -15, 15, 45]; return [-60, -30, 0, 30, 60]; }
  _directionToAngle(dir) { switch (dir) { case DIR.UP: return -90; case DIR.DOWN: return 90; case DIR.LEFT: return 180; case DIR.RIGHT: return 0; default: return -90; } }
  _createBullet(cx, cy, direction, isEnemy, speed) { return new Bullet(cx - 3, cy - 3, direction, isEnemy, isEnemy ? ENEMY_BULLET_DAMAGE : 1, speed); }
  takeDamage(dmg) {
    if (this.type === 'player' && this.invincible > 0) return false;
    if (this.type === 'player' && this.shield > 0) { this.shield--; return false; }
    this.health -= dmg;
    if (this.health <= 0) { this.active = false; return true; }
    if (this.type === 'player') this.invincible = 1500;
    return false;
  }
  update(dt, map, otherTanks, player, bullets) {
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.frozenTimer > 0) { this.frozenTimer -= dt; if (this.frozenTimer <= 0) this.frozen = false; }
    this.flicker += dt * 0.01;
    if (this.type !== 'player' && this.active) this._updateAI(dt, map, otherTanks, player, bullets);
  }
  _updateAI(dt, map, otherTanks, player, bullets) {
    if (this.frozen) return;
    this.aiChangeTimer += dt;
    if (this.aiChangeTimer > 1500) {
      this.aiChangeTimer = 0;
      if (this.type === 'enemy_standard') this.aiTarget = Math.random() < 0.3 ? 'player' : 'base';
      else if (this.type === 'enemy_scout') this.aiTarget = Math.random() < 0.1 ? 'player' : 'base';
      else this.aiTarget = Math.random() < 0.5 ? 'player' : 'base';
    }
    let targetX, targetY;
    if (this.aiTarget === 'player' && player && player.active) { targetX = player.x + player.width / 2; targetY = player.y + player.height / 2; }
    else { const base = map.getBasePosition(); targetX = base.x + base.width / 2; targetY = base.y + base.height / 2; }
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    const dx = targetX - cx, dy = targetY - cy;
    let moveDx = 0, moveDy = 0;
    if (Math.abs(dx) > Math.abs(dy)) moveDx = Math.sign(dx); else moveDy = Math.sign(dy);
    const moved = this.move(moveDx, moveDy, map, otherTanks);
    if (!moved) {
      if (moveDx !== 0) this.move(0, Math.sign(dy) || (Math.random() > 0.5 ? 1 : -1), map, otherTanks);
      else this.move(Math.sign(dx) || (Math.random() > 0.5 ? 1 : -1), 0, map, otherTanks);
    }
    if (this.isFacingTarget(targetX, targetY)) this.shoot(bullets);
  }
  isFacingTarget(tx, ty) {
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2, margin = 20;
    switch (this.direction) {
      case DIR.UP: return ty < cy && Math.abs(tx - cx) < margin;
      case DIR.DOWN: return ty > cy && Math.abs(tx - cx) < margin;
      case DIR.LEFT: return tx < cx && Math.abs(ty - cy) < margin;
      case DIR.RIGHT: return tx > cx && Math.abs(ty - cy) < margin;
      default: return false;
    }
  }
  draw(ctx) {
    if (!this.active) return;
    if (this.type === 'player' && this.invincible > 0 && Math.floor(this.invincible / 100) % 2 === 0) return;
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2, s = this.width;
    ctx.save();
    ctx.shadowColor = this.glowColor; ctx.shadowBlur = 12;
    ctx.fillStyle = this.color; ctx.fillRect(this.x + 2, this.y + 2, s - 4, s - 4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = this._darkenColor(this.color, 0.5);
    const trackW = 5;
    if (this.direction === DIR.UP || this.direction === DIR.DOWN) { ctx.fillRect(this.x, this.y, trackW, s); ctx.fillRect(this.x + s - trackW, this.y, trackW, s); }
    else { ctx.fillRect(this.x, this.y, s, trackW); ctx.fillRect(this.x, this.y + s - trackW, s, trackW); }
    ctx.fillStyle = this._darkenColor(this.color, 0.3);
    const barrelW = 6, barrelLen = s * 0.55;
    switch (this.direction) {
      case DIR.UP: ctx.fillRect(cx - barrelW / 2, this.y - barrelLen + s * 0.15, barrelW, barrelLen); break;
      case DIR.DOWN: ctx.fillRect(cx - barrelW / 2, this.y + s * 0.85, barrelW, barrelLen); break;
      case DIR.LEFT: ctx.fillRect(this.x - barrelLen + s * 0.15, cy - barrelW / 2, barrelLen, barrelW); break;
      case DIR.RIGHT: ctx.fillRect(this.x + s * 0.85, cy - barrelW / 2, barrelLen, barrelW); break;
    }
    if (this.type === 'enemy_armored') { ctx.strokeStyle = this._lightenColor(this.color, 0.3); ctx.lineWidth = 2; ctx.strokeRect(this.x + 1, this.y + 1, s - 2, s - 2); }
    if (this.shield > 0) this._drawShield(ctx, cx, cy);
    // 血条（最大生命>1时始终显示）
    if (this.maxHealth > 1) {
      this._drawHealthBar(ctx);
    }
    ctx.restore();
  }
  _drawShield(ctx, cx, cy) {
    const time = Date.now() * 0.003, radius = this.width * 0.7;
    ctx.strokeStyle = COLORS.shield; ctx.lineWidth = 2; ctx.shadowColor = COLORS.shieldGlow; ctx.shadowBlur = 10;
    for (let i = 0; i < 3; i++) {
      const angle = time + (i * Math.PI * 2) / 3;
      ctx.fillStyle = COLORS.shield; ctx.beginPath(); ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  }
  _drawHealthBar(ctx) {
	    const barW = this.width + 4, barH = 5, barX = this.x - 2, barY = this.y - 12;
	    // 背景阴影
	    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
	    // 背景
	    ctx.fillStyle = '#222'; ctx.fillRect(barX, barY, barW, barH);
	    // 血量
	    const ratio = Math.max(0, this.health / this.maxHealth);
	    const hpColor = ratio > 0.6 ? '#00ff66' : ratio > 0.3 ? '#ffaa00' : '#ff3333';
	    ctx.fillStyle = hpColor; ctx.fillRect(barX, barY, barW * ratio, barH);
	    // 边框
	    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
	  }
  _darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r*factor)},${Math.floor(g*factor)},${Math.floor(b*factor)})`;
  }
  _lightenColor(hex, factor) {
    const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * (1 + factor)));
    const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * (1 + factor)));
    const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * (1 + factor)));
    return `rgb(${r},${g},${b})`;
  }
}

// ========== Boss.js ==========
class Boss extends Tank {
  constructor(x, y, wave) {
    super(x, y, 'enemy_armored');
    this.width = BOSS_SIZE; this.height = BOSS_SIZE;
    this.wave = wave;
    this.maxHealth = HEALTH.bossBase + wave * HEALTH.bossScale;
    this.health = this.maxHealth;
    this.color = COLORS.boss; this.glowColor = COLORS.bossGlow;
    this.speed = SPEED.player * 0.5; this.cooldownTime = COOLDOWN.bossPhase1;
    this.direction = DIR.DOWN;
    this.entering = true; this.entryTimer = 0; this.entryDuration = 1500;
    this.entryStartY = -BOSS_SIZE; this.targetY = TILE_SIZE * 2;
    this.phase = 1; this.spiralAngle = 0;
  }
  getPhase() { const ratio = this.health / this.maxHealth; if (ratio > 0.6) return 1; if (ratio > 0.3) return 2; return 3; }
  update(dt, map, otherTanks, player, bullets) {
    if (!this.active) return;
    if (this.entering) {
      this.entryTimer += dt;
      const progress = Math.min(this.entryTimer / this.entryDuration, 1);
      this.y = this.entryStartY + (this.targetY - this.entryStartY) * (1 - Math.pow(1 - progress, 3));
      if (progress >= 1) this.entering = false;
      return;
    }
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    this.phase = this.getPhase();
    this._updatePhaseBehavior(dt, map, otherTanks, player, bullets);
  }
  _updatePhaseBehavior(dt, map, otherTanks, player, bullets) {
    if (!player || !player.active) return;
    const px = player.x + player.width / 2, py = player.y + player.height / 2;
    switch (this.phase) {
      case 1:
        this.speed = SPEED.player * 0.5; this.cooldownTime = COOLDOWN.bossPhase1;
        this._moveToward(px, py, map, otherTanks);
        if (this.isFacingPlayer(player)) this._shootSingle(bullets);
        break;
      case 2:
        this.speed = SPEED.player * 0.8; this.cooldownTime = COOLDOWN.bossPhase2;
        this._orbitPlayer(px, py, map, otherTanks);
        if (this.cooldownTimer <= 0) { this._shootFan(bullets); this.cooldownTimer = this.cooldownTime; }
        break;
      case 3:
        this.speed = SPEED.player * 1.3; this.cooldownTime = COOLDOWN.bossPhase3;
        this._moveToward(px, py, map, otherTanks);
        if (this.cooldownTimer <= 0) { this._shootSpiral(bullets); this.cooldownTimer = this.cooldownTime; }
        break;
    }
  }
  _moveToward(tx, ty, map, otherTanks) {
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    const dx = tx - cx, dy = ty - cy;
    let moveDx = 0, moveDy = 0;
    if (Math.abs(dx) > Math.abs(dy)) moveDx = Math.sign(dx); else moveDy = Math.sign(dy);
    if (!this.move(moveDx, moveDy, map, otherTanks)) {
      if (moveDx !== 0) this.move(0, Math.sign(dy) || (Math.random() > 0.5 ? 1 : -1), map, otherTanks);
      else this.move(Math.sign(dx) || (Math.random() > 0.5 ? 1 : -1), 0, map, otherTanks);
    }
  }
  _orbitPlayer(px, py, map, otherTanks) {
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2), targetDist = 150;
    if (dist < targetDist * 0.7) this._moveToward(cx + (cx - px), cy + (cy - py), map, otherTanks);
    else if (dist > targetDist * 1.3) this._moveToward(px, py, map, otherTanks);
    else { const len = Math.sqrt((py - cy) ** 2 + (px - cx) ** 2); if (len > 0) this.move(Math.sign(-(py - cy) / len), Math.sign((px - cx) / len), map, otherTanks); }
  }
  isFacingPlayer(player) { if (!player) return false; return this.isFacingTarget(player.x + player.width / 2, player.y + player.height / 2); }
  _shootSingle(bullets) {
    if (this.cooldownTimer > 0) return;
    const b = new Bullet(this.x + this.width / 2 - 3, this.y + this.height / 2 - 3, this.direction, true, ENEMY_BULLET_DAMAGE, SPEED.bossBullet);
    b.color = COLORS.bulletBoss; bullets.push(b); this.cooldownTimer = this.cooldownTime;
  }
  _shootFan(bullets) {
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    const baseAngle = this._directionToAngle(this.direction);
    for (const angle of [-25, 0, 25]) {
      const rad = (baseAngle + angle) * Math.PI / 180;
      const b = new Bullet(cx - 3, cy - 3, this.direction, true, ENEMY_BULLET_DAMAGE, SPEED.bossBullet);
      b.color = COLORS.bulletBoss; b._spreadAngle = rad; b._useSpread = true; bullets.push(b);
    }
  }
  _shootSpiral(bullets) {
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    for (let i = 0; i < 8; i++) {
      const angle = this.spiralAngle + (i * Math.PI * 2) / 8;
      const b = new Bullet(cx - 3, cy - 3, this.direction, true, ENEMY_BULLET_DAMAGE, SPEED.bossBullet);
      b.color = COLORS.bulletBoss; b._spreadAngle = angle; b._useSpread = true; bullets.push(b);
    }
    this.spiralAngle += Math.PI / 6;
  }
  draw(ctx) {
    if (!this.active) return;
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2, s = this.width;
    ctx.save();
    ctx.shadowColor = this.glowColor; ctx.shadowBlur = 20;
    ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, s, s);
    ctx.fillStyle = this._darkenColor(this.color, 0.6); ctx.fillRect(this.x + 8, this.y + 8, s - 16, s - 16);
    ctx.fillStyle = this.color; ctx.shadowBlur = 30;
    const coreSize = s * 0.3 * (1 + Math.sin(Date.now() * 0.005) * 0.1);
    ctx.fillRect(cx - coreSize / 2, cy - coreSize / 2, coreSize, coreSize);
    ctx.shadowBlur = 0;
    ctx.fillStyle = this._darkenColor(this.color, 0.3);
    const barrelW = 8, barrelLen = s * 0.5, barrelGap = 12;
    switch (this.direction) {
      case DIR.UP: ctx.fillRect(cx - barrelGap - barrelW / 2, this.y - barrelLen + s * 0.1, barrelW, barrelLen); ctx.fillRect(cx + barrelGap - barrelW / 2, this.y - barrelLen + s * 0.1, barrelW, barrelLen); break;
      case DIR.DOWN: ctx.fillRect(cx - barrelGap - barrelW / 2, this.y + s * 0.9, barrelW, barrelLen); ctx.fillRect(cx + barrelGap - barrelW / 2, this.y + s * 0.9, barrelW, barrelLen); break;
      case DIR.LEFT: ctx.fillRect(this.x - barrelLen + s * 0.1, cy - barrelGap - barrelW / 2, barrelLen, barrelW); ctx.fillRect(this.x - barrelLen + s * 0.1, cy + barrelGap - barrelW / 2, barrelLen, barrelW); break;
      case DIR.RIGHT: ctx.fillRect(this.x + s * 0.9, cy - barrelGap - barrelW / 2, barrelLen, barrelW); ctx.fillRect(this.x + s * 0.9, cy + barrelGap - barrelW / 2, barrelLen, barrelW); break;
    }
    ctx.restore();
    this._drawHealthBar(ctx);
  }
  _drawHealthBar(ctx) {
	    const barWidth = this.width + 4, barHeight = 7, barX = this.x - 2, barY = this.y - 18;
	    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
	    ctx.fillStyle = '#222'; ctx.fillRect(barX, barY, barWidth, barHeight);
	    const hpRatio = Math.max(0, this.health / this.maxHealth);
	    ctx.fillStyle = hpRatio > 0.6 ? '#00ff66' : hpRatio > 0.3 ? '#ffaa00' : '#ff3333';
	    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
	    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, barHeight);
	    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'center';
	    ctx.fillText(`HP: ${this.health}/${this.maxHealth}`, this.x + barWidth / 2, barY - 4);
	    ctx.textAlign = 'start';
	  }
}

// ========== PowerUp.js ==========
const POWERUP_CONFIG = [
  { name: 'firepower', icon: 'S', color: '#ffaa00', glowColor: 'rgba(255, 170, 0, 0.5)' },
  { name: 'shield',    icon: 'H', color: '#00aaff', glowColor: 'rgba(0, 170, 255, 0.5)' },
  { name: 'freeze',    icon: 'F', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.5)' },
  { name: 'lightning', icon: 'L', color: '#ffff00', glowColor: 'rgba(255, 255, 0, 0.5)' },
  { name: 'repair',    icon: 'R', color: '#00ff66', glowColor: 'rgba(0, 255, 102, 0.5)' },
];

class PowerUp extends Entity {
  constructor(x, y, type) {
    super(x, y, POWERUP_SIZE, POWERUP_SIZE);
    this.type = type; this.timer = GAME_CFG.powerUpDuration;
    this.pulsePhase = Math.random() * Math.PI * 2;
    const config = POWERUP_CONFIG[type];
    this.color = config.color; this.glowColor = config.glowColor; this.icon = config.icon;
  }
  static randomType() { return Math.floor(Math.random() * 5); }
  update(dt) { this.timer -= dt; if (this.timer <= 0) this.active = false; this.pulsePhase += dt * 0.005; }
  apply(player, game) {
    switch (this.type) {
      case POWERUP_TYPES.FIREPOWER: if (player.level < 5) player.level++; break;
      case POWERUP_TYPES.SHIELD: player.shield = GAME_CFG.shieldHits; break;
      case POWERUP_TYPES.FREEZE: game.freezeEnemies(); break;
      case POWERUP_TYPES.LIGHTNING: game.killAllEnemies(); break;
      case POWERUP_TYPES.REPAIR: game.repairBase(); break;
    }
  }
  draw(ctx) {
    if (!this.active) return;
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.15, radius = this.width / 2 * pulseScale;
    ctx.save();
    ctx.shadowColor = this.glowColor; ctx.shadowBlur = 15 * pulseScale;
    ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000'; ctx.font = 'bold 14px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, cx, cy);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    if (this.timer < 1500) {
      ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(Date.now() * 0.02) * 0.3})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

// ========== Game.js ==========
class Game {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.state = STATE.START;
    this.input = new Input(); this.sound = new Sound(); this.particles = new ParticleSystem();
    this.player = null; this.enemies = []; this.bullets = []; this.powerUps = []; this.boss = null; this.map = null;
    this.wave = 0; this.kills = 0; this.baseAlive = true; this.baseDestroyedTimer = 0; this.frameCount = 0;
    this.waveCooldown = 0; this.spawnTimer = 0; this.enemiesToSpawn = 0; this.enemiesSpawned = 0;
    this.freezeTimer = 0; this.screenShake = 0; this.flashAlpha = 0; this.lastTime = 0;
    this.startBlinkTimer = 0; this.startBlink = true;
    this.notificationText = ''; this.notificationTimer = 0;
    this.isMobile = 'ontouchstart' in window;
    this._gridCache = null; // 网格缓存
    this._gridCacheDirty = true;
    this._boundStartHandler = this._handleStartInput.bind(this);
    window.addEventListener('keydown', this._boundStartHandler);
    this.canvas.addEventListener('click', this._boundStartHandler);
  }
  _handleStartInput(e) {
    if (this.state === STATE.START && (e.type === 'click' || e.code === 'Enter' || e.code === 'Space')) {
      e.preventDefault(); this.sound._ensureContext(); this.init();
    }
  }
  init() {
    this.map = new Map(Map.getRandomMapIndex());
    this.player = new Tank(9 * TILE_SIZE + 2, 12 * TILE_SIZE, 'player');
    this.player.direction = 'up';
    this.enemies = []; this.bullets = []; this.powerUps = []; this.boss = null; this.particles.clear();
    this.wave = 0; this.kills = 0; this.baseAlive = true; this.baseDestroyedTimer = 0; this.frameCount = 0;
    this.waveCooldown = 0; this.spawnTimer = 0; this.enemiesToSpawn = 0; this.enemiesSpawned = 0;
    this.freezeTimer = 0; this.screenShake = 0; this.flashAlpha = 0;
    this.notificationText = ''; this.notificationTimer = 0;
    this.state = STATE.PLAYING; this.startWave();
  }
  startWave() {
    this.wave++;
    this.enemiesToSpawn = GAME_CFG.enemyBase + this.wave * GAME_CFG.enemyScale;
    this.enemiesSpawned = 0; this.spawnTimer = 0; this.boss = null;
    if (this.wave % GAME_CFG.bossWaveInterval === 0) {
      this.showNotification('WARNING: BOSS APPROACHING', 2000);
      this.sound.playBossWarning();
      this.boss = new Boss(CANVAS_WIDTH / 2 - 45, -90, this.wave);
    }
  }
  showNotification(text, duration) { this.notificationText = text; this.notificationTimer = duration; }
  freezeEnemies() { this.freezeTimer = GAME_CFG.freezeDuration; this.sound.playFreeze(); }
  killAllEnemies() {
    let count = 0;
    for (const enemy of this.enemies) {
      if (enemy.active) { enemy.active = false; this.particles.emitExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color); count++; }
    }
    this.kills += count; this.sound.playLightning();
  }
  repairBase() { this.map.rebuildBaseWalls(); this.baseAlive = true; this.baseDestroyedTimer = 0; this.sound.playPickup(); }
  update(timestamp) {
    if (this.lastTime === 0) this.lastTime = timestamp;
    const dt = Math.min(timestamp - this.lastTime, 50); this.lastTime = timestamp;
    this.input.update();
    if (this.state === STATE.START) {
      this.startBlinkTimer += dt;
      if (this.startBlinkTimer > 800) { this.startBlinkTimer = 0; this.startBlink = !this.startBlink; }
      if (this.input.isJustPressed('Enter') || this.input.isJustPressed('Space')) { this.sound._ensureContext(); this.init(); }
      return;
    }
    if (this.state === STATE.GAMEOVER || this.state === STATE.VICTORY) {
      if (this.input.isJustPressed('Enter') || this.input.isJustPressed('Space')) this.state = STATE.START;
      return;
    }
    this.frameCount++;
    if (this.screenShake > 0) this.screenShake *= 0.85; if (this.screenShake < 0.1) this.screenShake = 0;
    if (this.flashAlpha > 0) this.flashAlpha -= 0.02;
    if (this.notificationTimer > 0) this.notificationTimer -= dt;
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    this.particles.update(); this.map.update(dt);
    this._updatePlayer(dt);
    if (this.boss && this.boss.active) {
      if (!this.boss.entering) this.boss.update(dt, this.map, this._getAllTanks(), this.player, this.bullets);
      else this.boss.update(dt, this.map, [], this.player, this.bullets);
    }
    const allTanks = this._getAllTanks();
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.frozen = this.freezeTimer > 0;
      enemy.update(dt, this.map, allTanks, this.player, this.bullets);
    }
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (!bullet.active) { this.bullets.splice(i, 1); continue; }
      if (bullet._useSpread && bullet._spreadAngle !== undefined) {
	        // 逐段碰撞检测，防止跳过砖块
	        const spdSteps = Math.ceil(bullet.speed / 4);
	        const spdStepX = Math.cos(bullet._spreadAngle) * 4;
	        const spdStepY = Math.sin(bullet._spreadAngle) * 4;
	        let spreadHit = false;
	        for (let s = 0; s < spdSteps; s++) {
	          bullet.x += spdStepX;
	          bullet.y += spdStepY;
	          if (bullet.x < -bullet.width || bullet.x > CANVAS_WIDTH || bullet.y < -bullet.height || bullet.y > CANVAS_HEIGHT) { bullet.active = false; spreadHit = true; break; }
	          const hitCol = Math.floor((bullet.x + bullet.width / 2) / TILE_SIZE);
	          const hitRow = Math.floor((bullet.y + bullet.height / 2) / TILE_SIZE);
	          const tile = this.map.getTile(hitCol, hitRow);
	          if (tile === TILE_BRICK) {
	            this.map.destroyTile(hitCol, hitRow);
	            this.particles.emitBrickDebris(hitCol * TILE_SIZE + TILE_SIZE / 2, hitRow * TILE_SIZE + TILE_SIZE / 2);
	            if (bullet.penetrate <= 0) { bullet.active = false; spreadHit = true; break; }
	            else bullet.penetrate--;
	          } else if (tile === TILE_STEEL) {
	            this.particles.emitSparks(hitCol * TILE_SIZE + TILE_SIZE / 2, hitRow * TILE_SIZE + TILE_SIZE / 2);
	            bullet.active = false; spreadHit = true; break;
	          }
	        }
	        if (spreadHit) { this.bullets.splice(i, 1); continue; }
	      } else {
        const result = bullet.update(this.map);
        if (!bullet.active) { this.bullets.splice(i, 1); continue; }
        if (result) {
          if (result.destroyedTile) this.particles.emitBrickDebris(result.col * TILE_SIZE + TILE_SIZE / 2, result.row * TILE_SIZE + TILE_SIZE / 2);
          else if (result.hitSteel) this.particles.emitSparks(result.col * TILE_SIZE + TILE_SIZE / 2, result.row * TILE_SIZE + TILE_SIZE / 2);
          bullet.active = false; this.bullets.splice(i, 1); continue;
        }
      }
      // 尾迹粒子（每2帧发射一次，减少开销）
      if (this.frameCount % 2 === 0) {
        this.particles.emitTrail(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.color);
      }
    }
    for (let i = this.powerUps.length - 1; i >= 0; i--) { this.powerUps[i].update(dt); if (!this.powerUps[i].active) this.powerUps.splice(i, 1); }
    this._checkCollisions();
    this._updateSpawning(dt);
    this._checkWaveStatus(dt);
    if (!this.baseAlive && this.baseDestroyedTimer > 0) { this.baseDestroyedTimer -= dt; if (this.baseDestroyedTimer <= 0) this._gameOver(); }
  }
  _updatePlayer(dt) {
    if (!this.player || !this.player.active) return;
    this.player.update(dt, this.map, this._getAllTanks(), this.player, this.bullets);
    const dir = this.input.getDirection();
    this.player.move(dir.dx, dir.dy, this.map, this._getAllTanks());
    if (this.input.isFiring()) { const bullets = this.player.shoot(this.bullets); if (bullets && bullets.length > 0) this.sound.playShoot(); }
  }
  _getAllTanks() {
    const tanks = [...this.enemies];
    if (this.player && this.player.active) tanks.push(this.player);
    if (this.boss && this.boss.active && !this.boss.entering) tanks.push(this.boss);
    return tanks;
  }
  _checkCollisions() {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const bullet = this.bullets[bi];
      if (!bullet.active || bullet.isEnemy) continue;
      if (this.boss && this.boss.active && !this.boss.entering && bullet.collidesWith(this.boss)) {
        bullet.active = false; this.bullets.splice(bi, 1); this.boss.takeDamage(bullet.damage);
        this.particles.emitSparks(bullet.x, bullet.y);
        if (!this.boss.active) this._onBossDeath();
        continue;
      }
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        if (!enemy.active) continue;
        if (bullet.collidesWith(enemy)) {
          bullet.active = false; this.bullets.splice(bi, 1);
          const killed = enemy.takeDamage(bullet.damage);
          if (killed) { this.particles.emitExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color); this.sound.playExplosion(); this.kills++; this._tryDropPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2); this._applyLifesteal(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2); }
          else this.particles.emitSparks(bullet.x, bullet.y);
          break;
        }
      }
    }
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const bullet = this.bullets[bi];
      if (!bullet.active || !bullet.isEnemy) continue;
      if (!this.player || !this.player.active) continue;
      if (bullet.collidesWith(this.player)) {
        bullet.active = false; this.bullets.splice(bi, 1);
        const killed = this.player.takeDamage(bullet.damage);
        this.sound.playPlayerHit(); this.screenShake = 3;
        if (killed) { this.particles.emitExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.player.color); this._gameOver(); }
        continue;
      }
      if (this.baseAlive) {
        const base = this.map.getBasePosition();
        const bb = bullet.getBounds();
        if (bb.x < base.x + base.width && bb.x + bb.width > base.x && bb.y < base.y + base.height && bb.y + bb.height > base.y) {
          bullet.active = false; this.bullets.splice(bi, 1); this.baseAlive = false; this.baseDestroyedTimer = 3000;
          this.sound.playExplosion(); this.particles.emitExplosion(base.x + base.width / 2, base.y + base.height / 2, COLORS.base);
        }
      }
    }
    if (this.boss && this.boss.active && !this.boss.entering && this.boss.phase === 3 && this.player && this.player.active && this.boss.collidesWith(this.player)) {
      const killed = this.player.takeDamage(1); this.sound.playPlayerHit(); this.screenShake = 5;
      if (killed) { this.particles.emitExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.player.color); this._gameOver(); }
    }
    if (this.player && this.player.active) {
      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        if (this.player.collidesWith(this.powerUps[i])) {
          this.powerUps[i].apply(this.player, this); this.sound.playPickup();
          this.powerUps[i].active = false; this.powerUps.splice(i, 1);
        }
      }
    }
  }
  _tryDropPowerUp(x, y) { if (Math.random() < GAME_CFG.powerUpChance) this.powerUps.push(new PowerUp(x - 14, y - 14, PowerUp.randomType())); }
  _updateSpawning(dt) {
    if (this.enemiesToSpawn <= 0) return;
    this.spawnTimer += dt;
    if (this.spawnTimer >= Math.max(500, GAME_CFG.spawnIntervalMin - this.wave * GAME_CFG.spawnIntervalDecay)) {
      this.spawnTimer = 0;
      if (this.enemies.filter(e => e.active).length < GAME_CFG.maxEnemiesOnScreen) this._spawnEnemy();
    }
  }
  _spawnEnemy() {
    const spawnX = Math.random() * (CANVAS_WIDTH - 40), spawnY = 0;
    const col = Math.floor((spawnX + 20) / TILE_SIZE), row = Math.floor((spawnY + 20) / TILE_SIZE);
    if (this.map.isSolid(col, row) || this.map.isSolid(col, row + 1)) {
      const altX = (Math.random() < 0.5 ? 0 : CANVAS_WIDTH - 40);
      const altCol = Math.floor((altX + 20) / TILE_SIZE);
      if (this.map.isSolid(altCol, row) || this.map.isSolid(altCol, row + 1)) return;
      this._createEnemyAt(altX, spawnY);
    } else this._createEnemyAt(spawnX, spawnY);
  }
  _createEnemyAt(x, y) {
    const rand = Math.random();
    let type = rand < 0.6 ? 'enemy_standard' : rand < 0.85 ? 'enemy_scout' : 'enemy_armored';
    const enemy = new Tank(x, y, type); enemy.direction = 'down';
    this.enemies.push(enemy); this.enemiesSpawned++; this.enemiesToSpawn--;
  }
  _checkWaveStatus(dt) {
    const allEnemiesCleared = this.enemiesToSpawn <= 0 && this.enemies.filter(e => e.active).length === 0;
    const bossCleared = !this.boss || !this.boss.active;
    if (allEnemiesCleared && bossCleared) {
      if (this.waveCooldown === 0) {
        this.waveCooldown = GAME_CFG.waveInterval;
        this.showNotification(`WAVE ${this.wave} CLEAR!`, 2000);
        if (this.wave >= GAME_CFG.victoryWave) { this.state = STATE.VICTORY; return; }
      }
      this.waveCooldown -= dt;
      if (this.waveCooldown <= 0) { this.waveCooldown = 0; this.startWave(); }
    }
  }
  _onBossDeath() {
    this.particles.emitBossDeath(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2);
    this.flashAlpha = 1; this.sound.playBossDeath();
    this.player.health = Math.min(this.player.health + GAME_CFG.bossLifeBonus, this.player.maxHealth);
    this.showNotification('BOSS DEFEATED! +3 LIVES', 3000);
  }
  _gameOver() { this.state = STATE.GAMEOVER; this.sound.playGameOver(); }
  _applyLifesteal(x, y) {
    if (!this.player || !this.player.active || this.player.health >= this.player.maxHealth) return;
    this.player.health = Math.min(this.player.health + PLAYER_LIFESTEAL, this.player.maxHealth);
    // 绿色治疗粒子效果
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.particles.push(new _Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 15 + Math.floor(Math.random() * 10), '#00ff66', 3));
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    let shakeX = 0, shakeY = 0;
    if (this.screenShake > 0) { shakeX = (Math.random() - 0.5) * this.screenShake * 2; shakeY = (Math.random() - 0.5) * this.screenShake * 2; }
    ctx.save(); ctx.translate(shakeX, shakeY);
    if (this.state === STATE.START) { this._renderStartScreen(ctx); ctx.restore(); return; }
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this._drawGrid(ctx); this.map.draw(ctx);
    for (const pu of this.powerUps) pu.draw(ctx);
    for (const bullet of this.bullets) bullet.draw(ctx);
    for (const enemy of this.enemies) this._drawWithGrassCheck(ctx, enemy);
    if (this.boss && this.boss.active) this.boss.draw(ctx);
    if (this.player && this.player.active) this._drawWithGrassCheck(ctx, this.player);
    this.map.drawBase(ctx, this.baseAlive);
    this.particles.draw(ctx);
    this._drawGrassOverlay(ctx);
    ctx.restore();
    if (this.flashAlpha > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); }
    this._drawHUD(ctx);
    if (this.notificationTimer > 0) this._drawNotification(ctx);
    if (this.state === STATE.GAMEOVER) this._drawGameOverScreen(ctx);
    else if (this.state === STATE.VICTORY) this._drawVictoryScreen(ctx);
  }
  _drawGrid(ctx) {
    if (!this._gridCache || this._gridCacheDirty) {
      this._gridCache = document.createElement('canvas');
      this._gridCache.width = CANVAS_WIDTH;
      this._gridCache.height = CANVAS_HEIGHT;
      const gc = this._gridCache.getContext('2d');
      gc.strokeStyle = COLORS.grid;
      gc.lineWidth = 0.5;
      for (let x = 0; x <= CANVAS_WIDTH; x += TILE_SIZE) { gc.beginPath(); gc.moveTo(x, 0); gc.lineTo(x, CANVAS_HEIGHT); gc.stroke(); }
      for (let y = 0; y <= CANVAS_HEIGHT; y += TILE_SIZE) { gc.beginPath(); gc.moveTo(0, y); gc.lineTo(CANVAS_WIDTH, y); gc.stroke(); }
      this._gridCacheDirty = false;
    }
    ctx.drawImage(this._gridCache, 0, 0);
  }
  _drawWithGrassCheck(ctx, entity) {
    if (!entity || !entity.active) return;
    if (this.map.getTileAtPixel(entity.x + entity.width / 2, entity.y + entity.height / 2) === TILE_GRASS) { ctx.save(); ctx.globalAlpha = 0.3; entity.draw(ctx); ctx.restore(); }
    else entity.draw(ctx);
  }
  _drawGrassOverlay(ctx) {
    for (const pos of this.map._grassPositions) {
      const alpha = 0.25 + Math.sin(this.map.grassPhase + pos.x * 0.1 + pos.y * 0.1) * 0.1;
      ctx.fillStyle = `rgba(0, 180, 60, ${alpha})`;
      ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
    }
  }
  _drawHUD(ctx) {
    ctx.fillStyle = 'rgba(10, 15, 36, 0.85)'; ctx.fillRect(0, 0, CANVAS_WIDTH, 36);
    ctx.strokeStyle = COLORS.player; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.moveTo(0, 35); ctx.lineTo(CANVAS_WIDTH, 35); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.player; ctx.font = 'bold 12px "Courier New", monospace'; ctx.textBaseline = 'middle';
    const y = 18;
    ctx.fillText(`WAVE: ${this.wave}`, 15, y);
    ctx.fillText(`KILLS: ${this.kills}`, 180, y);
    ctx.fillText(`LIVES: ${'\u2665'.repeat(Math.max(0, this.player ? this.player.health : 0))}`, 370, y);
    ctx.fillStyle = COLORS.gold; ctx.fillText(`Lv.${this.player ? this.player.level : 1}`, 580, y);
    if (this.player && this.player.shield > 0) { ctx.fillStyle = COLORS.shield; ctx.fillText(`SHIELD: ${this.player.shield}`, 660, y); }
    if (this.freezeTimer > 0) { ctx.fillStyle = '#ffffff'; ctx.fillText(`FREEZE: ${(this.freezeTimer / 1000).toFixed(1)}s`, 660, y); }
    ctx.textBaseline = 'alphabetic';
  }
  _drawNotification(ctx) {
    ctx.save(); ctx.globalAlpha = Math.min(1, this.notificationTimer / 500);
    ctx.fillStyle = this.notificationText.includes('WARNING') || this.notificationText.includes('BOSS') ? '#ff0000' : COLORS.gold;
    ctx.font = 'bold 24px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
    ctx.fillText(this.notificationText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    ctx.shadowBlur = 0; ctx.textAlign = 'start'; ctx.restore();
  }
  _renderStartScreen(ctx) {
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this._drawGrid(ctx);
    ctx.save();
    ctx.shadowColor = COLORS.player; ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.player; ctx.font = 'bold 48px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.fillText('NEON TANKS', CANVAS_WIDTH / 2, 200); ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.enemy; ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('A CYBERPUNK TANK BATTLE', CANVAS_WIDTH / 2, 250);
    if (this.startBlink) { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px "Courier New", monospace'; ctx.fillText('PRESS ENTER OR CLICK TO START', CANVAS_WIDTH / 2, 380); }
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px "Courier New", monospace';
    ctx.fillText('WASD / Arrow Keys: Move', CANVAS_WIDTH / 2, 430);
    ctx.fillText('SPACE / J: Fire', CANVAS_WIDTH / 2, 455);
    ctx.fillText('Protect the base!', CANVAS_WIDTH / 2, 490);
    ctx.textAlign = 'start'; ctx.restore();
  }
  _drawGameOverScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save();
    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 48px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20); ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(`WAVE: ${this.wave}  |  KILLS: ${this.kills}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    ctx.fillText('PRESS ENTER TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    ctx.textAlign = 'start'; ctx.restore();
  }
  _drawVictoryScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save();
    ctx.fillStyle = COLORS.gold; ctx.font = 'bold 48px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.shadowColor = COLORS.gold; ctx.shadowBlur = 20;
    ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20); ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(`YOU SURVIVED ${this.wave} WAVES!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    ctx.fillText(`KILLS: ${this.kills}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    ctx.fillText('PRESS ENTER TO PLAY AGAIN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
    ctx.textAlign = 'start'; ctx.restore();
  }
  gameLoop(timestamp) { this.update(timestamp); this.render(); this._rafId = requestAnimationFrame((t) => this.gameLoop(t)); }
  start() { this.lastTime = 0; this._rafId = requestAnimationFrame((t) => this.gameLoop(t)); }
  stop() { if (this._rafId) cancelAnimationFrame(this._rafId); }
}

// ========== main.js ==========
const canvas = document.getElementById('gameCanvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

function resizeCanvas() {
  const maxWidth = window.innerWidth, maxHeight = window.innerHeight - 10;
  const scale = Math.min(maxWidth / CANVAS_WIDTH, maxHeight / CANVAS_HEIGHT);
  canvas.style.width = `${CANVAS_WIDTH * scale}px`;
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const game = new Game(canvas);
game.start();

})();