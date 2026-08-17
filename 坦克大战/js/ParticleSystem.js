// Neon Tanks - 粒子特效系统

class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life--;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    const size = this.size * alpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emitExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 20 + Math.floor(Math.random() * 20);
      const size = 2 + Math.random() * 4;
      this.particles.push(new Particle(x, y, vx, vy, life, color, size));
    }
  }

  emitSparks(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 10 + Math.floor(Math.random() * 10);
      this.particles.push(new Particle(x, y, vx, vy, life, '#ffcc00', 2));
    }
  }

  emitBrickDebris(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 15 + Math.floor(Math.random() * 15);
      this.particles.push(new Particle(x, y, vx, vy, life, '#cc5533', 3));
    }
  }

  emitTrail(x, y, color) {
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;
    const life = 8 + Math.floor(Math.random() * 5);
    this.particles.push(new Particle(x, y, vx, vy, life, color, 2));
  }

  emitBossDeath(x, y) {
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60;
      const speed = 2 + Math.random() * 6;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 30 + Math.floor(Math.random() * 40);
      const size = 3 + Math.random() * 6;
      const color = Math.random() > 0.5 ? '#ffaa00' : '#ffdd00';
      this.particles.push(new Particle(x, y, vx, vy, life, color, size));
    }
  }

  emitShootFlash(x, y, color) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.particles.push(new Particle(x, y, vx, vy, 6, color, 2));
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (!this.particles[i].active) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }

  clear() {
    this.particles = [];
  }
}