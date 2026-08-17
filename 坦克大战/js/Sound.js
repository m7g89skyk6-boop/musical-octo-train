// Neon Tanks - Web Audio API 音效

export class Sound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  }

  _ensureContext() {
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  _playTone(freq, duration, type = 'square', volume = 0.1) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  _playNoise(duration, volume = 0.08) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
  }

  playShoot() {
    this._playTone(1200, 0.05, 'square', 0.06);
  }

  playExplosion() {
    this._playNoise(0.2, 0.1);
    this._playTone(80, 0.15, 'sawtooth', 0.08);
  }

  playPickup() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  playBossWarning() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this._playTone(150, 0.2, 'sawtooth', 0.12), i * 400);
    }
  }

  playBossDeath() {
    this._playNoise(0.5, 0.15);
    this._playTone(60, 0.4, 'sawtooth', 0.12);
    setTimeout(() => this._playTone(40, 0.3, 'sawtooth', 0.1), 200);
  }

  playGameOver() {
    const notes = [400, 300, 200, 100];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.2, 'square', 0.1), i * 200);
    });
  }

  playFreeze() {
    this._playTone(600, 0.1, 'sine', 0.08);
    setTimeout(() => this._playTone(400, 0.15, 'sine', 0.08), 100);
  }

  playLightning() {
    this._playNoise(0.3, 0.15);
    this._playTone(200, 0.2, 'sawtooth', 0.1);
  }

  playPlayerHit() {
    this._playNoise(0.1, 0.08);
    this._playTone(200, 0.1, 'square', 0.06);
  }
}