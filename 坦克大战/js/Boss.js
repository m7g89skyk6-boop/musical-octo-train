// Neon Tanks - Boss 类

import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import {
  BOSS_SIZE, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT,
  COLORS, SPEED, COOLDOWN, HEALTH, ENEMY_BULLET_DAMAGE, DIR,
} from './constants.js';

export class Boss extends Tank {
  constructor(x, y, wave) {
    super(x, y, 'enemy_armored');
    this.width = BOSS_SIZE;
    this.height = BOSS_SIZE;
    this.wave = wave;
    this.maxHealth = HEALTH.bossBase + wave * HEALTH.bossScale;
    this.health = this.maxHealth;
    this.color = COLORS.boss;
    this.glowColor = COLORS.bossGlow;
    this.speed = SPEED.player * 0.5;
    this.cooldownTime = COOLDOWN.bossPhase1;
    this.direction = DIR.DOWN;
    this.entering = true;
    this.entryTimer = 0;
    this.entryDuration = 1500; // 入场动画 ms
    this.entryStartY = -BOSS_SIZE;
    this.targetY = TILE_SIZE * 2;
    this.phase = 1;
    this.spiralAngle = 0;
  }

  getPhase() {
    const ratio = this.health / this.maxHealth;
    if (ratio > 0.6) return 1;
    if (ratio > 0.3) return 2;
    return 3;
  }

  update(dt, map, otherTanks, player, bullets) {
    if (!this.active) return;

    // 入场动画
    if (this.entering) {
      this.entryTimer += dt;
      const progress = Math.min(this.entryTimer / this.entryDuration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      this.y = this.entryStartY + (this.targetY - this.entryStartY) * eased;
      if (progress >= 1) {
        this.entering = false;
      }
      return;
    }

    // 冷却
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;

    this.phase = this.getPhase();
    this._updatePhaseBehavior(dt, map, otherTanks, player, bullets);
  }

  _updatePhaseBehavior(dt, map, otherTanks, player, bullets) {
    if (!player || !player.active) return;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    switch (this.phase) {
      case 1:
        this.speed = SPEED.player * 0.5;
        this.cooldownTime = COOLDOWN.bossPhase1;
        // 向玩家缓慢移动
        this._moveToward(px, py, map, otherTanks);
        // 单发点射
        if (this.isFacingPlayer(player)) {
          this._shootSingle(bullets);
        }
        break;

      case 2:
        this.speed = SPEED.player * 0.8;
        this.cooldownTime = COOLDOWN.bossPhase2;
        // 绕玩家移动
        this._orbitPlayer(px, py, map, otherTanks);
        // 扇形 3 发
        if (this.cooldownTimer <= 0) {
          this._shootFan(bullets);
          this.cooldownTimer = this.cooldownTime;
        }
        break;

      case 3:
        this.speed = SPEED.player * 1.3;
        this.cooldownTime = COOLDOWN.bossPhase3;
        // 主动撞击玩家
        this._moveToward(px, py, map, otherTanks);
        // 螺旋弹幕
        if (this.cooldownTimer <= 0) {
          this._shootSpiral(bullets);
          this.cooldownTimer = this.cooldownTime;
        }
        break;
    }
  }

  _moveToward(tx, ty, map, otherTanks) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;

    let moveDx = 0, moveDy = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      moveDx = Math.sign(dx);
    } else {
      moveDy = Math.sign(dy);
    }

    const moved = this.move(moveDx, moveDy, map, otherTanks);
    if (!moved) {
      if (moveDx !== 0) {
        this.move(0, Math.sign(dy) || (Math.random() > 0.5 ? 1 : -1), map, otherTanks);
      } else {
        this.move(Math.sign(dx) || (Math.random() > 0.5 ? 1 : -1), 0, map, otherTanks);
      }
    }
  }

  _orbitPlayer(px, py, map, otherTanks) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    const targetDist = 150;

    if (dist < targetDist * 0.7) {
      // 太近，远离
      this._moveToward(cx + (cx - px), cy + (cy - py), map, otherTanks);
    } else if (dist > targetDist * 1.3) {
      // 太远，靠近
      this._moveToward(px, py, map, otherTanks);
    } else {
      // 绕圈（切线方向移动）
      const tangentX = -(py - cy);
      const tangentY = px - cx;
      const len = Math.sqrt(tangentX ** 2 + tangentY ** 2);
      if (len > 0) {
        this.move(Math.sign(tangentX / len), Math.sign(tangentY / len), map, otherTanks);
      }
    }
  }

  isFacingPlayer(player) {
    if (!player) return false;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    return this.isFacingTarget(px, py);
  }

  _shootSingle(bullets) {
    if (this.cooldownTimer > 0) return;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const b = new Bullet(cx - 3, cy - 3, this.direction, true, ENEMY_BULLET_DAMAGE, SPEED.bossBullet);
    b.color = COLORS.bulletBoss;
    bullets.push(b);
    this.cooldownTimer = this.cooldownTime;
  }

  _shootFan(bullets) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const baseAngle = this._directionToAngle(this.direction);
    const angles = [-25, 0, 25];
    for (const angle of angles) {
      const rad = (baseAngle + angle) * Math.PI / 180;
      const b = new Bullet(cx - 3, cy - 3, this.direction, true, ENEMY_BULLET_DAMAGE, SPEED.bossBullet);
      b.color = COLORS.bulletBoss;
      b._spreadAngle = rad;
      b._useSpread = true;
      bullets.push(b);
    }
  }

  _shootSpiral(bullets) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = this.spiralAngle + (i * Math.PI * 2) / count;
      const b = new Bullet(cx - 3, cy - 3, this.direction, true, ENEMY_BULLET_DAMAGE, SPEED.bossBullet);
      b.color = COLORS.bulletBoss;
      b._spreadAngle = angle;
      b._useSpread = true;
      bullets.push(b);
    }
    this.spiralAngle += Math.PI / 6; // 每轮旋转 30 度
  }

  draw(ctx) {
    if (!this.active) return;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const s = this.width;

    ctx.save();
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 20;

    // Boss 主体
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, s, s);

    // 内部装甲板
    ctx.fillStyle = this._darkenColor(this.color, 0.6);
    ctx.fillRect(this.x + 8, this.y + 8, s - 16, s - 16);

    // 核心
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 30;
    const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
    const coreSize = s * 0.3 * pulseScale;
    ctx.fillRect(cx - coreSize / 2, cy - coreSize / 2, coreSize, coreSize);

    ctx.shadowBlur = 0;

    // 炮管（双炮管）
    ctx.fillStyle = this._darkenColor(this.color, 0.3);
    const barrelW = 8;
    const barrelLen = s * 0.5;
    const barrelGap = 12;
    switch (this.direction) {
      case DIR.UP:
        ctx.fillRect(cx - barrelGap - barrelW / 2, this.y - barrelLen + s * 0.1, barrelW, barrelLen);
        ctx.fillRect(cx + barrelGap - barrelW / 2, this.y - barrelLen + s * 0.1, barrelW, barrelLen);
        break;
      case DIR.DOWN:
        ctx.fillRect(cx - barrelGap - barrelW / 2, this.y + s * 0.9, barrelW, barrelLen);
        ctx.fillRect(cx + barrelGap - barrelW / 2, this.y + s * 0.9, barrelW, barrelLen);
        break;
      case DIR.LEFT:
        ctx.fillRect(this.x - barrelLen + s * 0.1, cy - barrelGap - barrelW / 2, barrelLen, barrelW);
        ctx.fillRect(this.x - barrelLen + s * 0.1, cy + barrelGap - barrelW / 2, barrelLen, barrelW);
        break;
      case DIR.RIGHT:
        ctx.fillRect(this.x + s * 0.9, cy - barrelGap - barrelW / 2, barrelLen, barrelW);
        ctx.fillRect(this.x + s * 0.9, cy + barrelGap - barrelW / 2, barrelLen, barrelW);
        break;
    }

    ctx.restore();

    // 血条（在 Boss 头顶）
    this._drawHealthBar(ctx);
  }

  _drawHealthBar(ctx) {
    const barWidth = this.width;
    const barHeight = 8;
    const barX = this.x;
    const barY = this.y - 16;

    // 背景
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 血量
    const hpRatio = this.health / this.maxHealth;
    const hpColor = hpRatio > 0.6 ? '#00ff00' : hpRatio > 0.3 ? '#ffaa00' : '#ff0000';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    // 边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // 文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${this.health}/${this.maxHealth}`, this.x + barWidth / 2, barY - 4);
    ctx.textAlign = 'start';
  }
}