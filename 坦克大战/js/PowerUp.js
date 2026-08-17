// Neon Tanks - 道具系统

import { Entity } from './Entity.js';
import { POWERUP_SIZE, POWERUP_TYPES, GAME } from './constants.js';

const POWERUP_CONFIG = [
  { name: 'firepower', icon: 'S', color: '#ffaa00', glowColor: 'rgba(255, 170, 0, 0.5)' },
  { name: 'shield',    icon: 'H', color: '#00aaff', glowColor: 'rgba(0, 170, 255, 0.5)' },
  { name: 'freeze',    icon: 'F', color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.5)' },
  { name: 'lightning', icon: 'L', color: '#ffff00', glowColor: 'rgba(255, 255, 0, 0.5)' },
  { name: 'repair',    icon: 'R', color: '#00ff66', glowColor: 'rgba(0, 255, 102, 0.5)' },
];

export class PowerUp extends Entity {
  constructor(x, y, type) {
    super(x, y, POWERUP_SIZE, POWERUP_SIZE);
    this.type = type;
    this.timer = GAME.powerUpDuration;
    this.pulsePhase = Math.random() * Math.PI * 2;
    const config = POWERUP_CONFIG[type];
    this.color = config.color;
    this.glowColor = config.glowColor;
    this.icon = config.icon;
    this.pickupEffect = false;
  }

  static randomType() {
    return Math.floor(Math.random() * 5);
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.active = false;
    }
    this.pulsePhase += dt * 0.005;
  }

  apply(player, game) {
    switch (this.type) {
      case POWERUP_TYPES.FIREPOWER:
        if (player.level < 5) {
          player.level++;
        }
        break;

      case POWERUP_TYPES.SHIELD:
        player.shield = GAME.shieldHits;
        break;

      case POWERUP_TYPES.FREEZE:
        game.freezeEnemies();
        break;

      case POWERUP_TYPES.LIGHTNING:
        game.killAllEnemies();
        break;

      case POWERUP_TYPES.REPAIR:
        game.repairBase();
        break;
    }
  }

  draw(ctx) {
    if (!this.active) return;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.15;
    const radius = this.width / 2 * pulseScale;

    ctx.save();

    // 外发光
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 15 * pulseScale;

    // 能量球
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // 内核
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 图标文字
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, cx, cy);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';

    // 闪烁提示（快过期时）
    if (this.timer < 1500) {
      const flashAlpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.3;
      ctx.strokeStyle = `rgba(255, 0, 0, ${flashAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}