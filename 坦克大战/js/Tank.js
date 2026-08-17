// Neon Tanks - 坦克类（玩家 + 敌人）

import { Entity } from './Entity.js';
import { Bullet } from './Bullet.js';
import {
  TANK_SIZE, TILE_SIZE, COLS, ROWS, CANVAS_WIDTH, CANVAS_HEIGHT,
  COLORS, SPEED, COOLDOWN, HEALTH, ENEMY_BULLET_DAMAGE, DIR, TILE_GRASS,
} from './constants.js';

export class Tank extends Entity {
  constructor(x, y, type) {
    super(x, y, TANK_SIZE, TANK_SIZE);
    this.type = type; // 'player' | 'enemy_standard' | 'enemy_scout' | 'enemy_armored'
    this.direction = DIR.UP;
    this.health = 1;
    this.maxHealth = 1;
    this.cooldownTimer = 0;
    this.cooldownTime = 200;
    this.level = 1; // 武器等级（仅玩家）
    this.shield = 0; // 护盾次数
    this.invincible = 0; // 无敌时间 ms
    this.aiTimer = 0;
    this.aiTarget = 'base'; // 'base' | 'player'
    this.aiChangeTimer = 0;
    this.frozen = false;
    this.frozenTimer = 0;
    this.flicker = 0;

    this._initByType();
  }

  _initByType() {
    switch (this.type) {
      case 'player':
        this.speed = SPEED.player;
        this.health = HEALTH.player;
        this.maxHealth = HEALTH.player;
        this.cooldownTime = COOLDOWN.player;
        this.color = COLORS.player;
        this.glowColor = COLORS.playerGlow;
        this.direction = DIR.UP;
        break;
      case 'enemy_standard':
        this.speed = SPEED.enemyStandard;
        this.health = HEALTH.enemyStandard;
        this.maxHealth = HEALTH.enemyStandard;
        this.cooldownTime = COOLDOWN.enemyStandard;
        this.color = COLORS.enemy;
        this.glowColor = COLORS.enemyGlow;
        this.aiTarget = Math.random() < 0.3 ? 'player' : 'base';
        break;
      case 'enemy_scout':
        this.speed = SPEED.enemyScout;
        this.health = HEALTH.enemyScout;
        this.maxHealth = HEALTH.enemyScout;
        this.cooldownTime = COOLDOWN.enemyScout;
        this.color = COLORS.enemyScout;
        this.glowColor = COLORS.enemyGlow;
        this.aiTarget = 'base';
        break;
      case 'enemy_armored':
        this.speed = SPEED.enemyArmored;
        this.health = HEALTH.enemyArmored;
        this.maxHealth = HEALTH.enemyArmored;
        this.cooldownTime = COOLDOWN.enemyArmored;
        this.color = COLORS.enemyArmored;
        this.glowColor = COLORS.enemyGlow;
        this.aiTarget = Math.random() < 0.5 ? 'player' : 'base';
        break;
    }
  }

  // --- 移动 ---
  move(dx, dy, map, otherTanks) {
    if (dx === 0 && dy === 0) return false;
    if (this.frozen) return false;

    // 确定方向
    if (dy < 0) this.direction = DIR.UP;
    else if (dy > 0) this.direction = DIR.DOWN;
    else if (dx < 0) this.direction = DIR.LEFT;
    else if (dx > 0) this.direction = DIR.RIGHT;

    const newX = this.x + dx * this.speed;
    const newY = this.y + dy * this.speed;

    // 边界检测
    if (newX < 0 || newX + this.width > CANVAS_WIDTH ||
        newY < 0 || newY + this.height > CANVAS_HEIGHT) {
      return false;
    }

    // 地图碰撞检测（四角）
    const corners = [
      [newX, newY],
      [newX + this.width - 1, newY],
      [newX, newY + this.height - 1],
      [newX + this.width - 1, newY + this.height - 1],
    ];
    for (const [cx, cy] of corners) {
      if (map.isSolidPixel(cx, cy)) return false;
    }

    // 使用临时位置检测与其他坦克碰撞
    const tempBounds = { x: newX, y: newY, width: this.width, height: this.height };
    for (const other of otherTanks) {
      if (other === this || !other.active) continue;
      const ob = other.getBounds();
      if (tempBounds.x < ob.x + ob.width &&
          tempBounds.x + tempBounds.width > ob.x &&
          tempBounds.y < ob.y + ob.height &&
          tempBounds.y + tempBounds.height > ob.y) {
        return false;
      }
    }

    this.x = newX;
    this.y = newY;
    return true;
  }

  // --- 射击 ---
  shoot(bullets) {
    if (this.cooldownTimer > 0) return;
    this.cooldownTimer = this.cooldownTime;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const isEnemy = this.type !== 'player';
    const bulletSpeed = isEnemy
      ? (this.type === 'enemy_armored' ? SPEED.enemyBulletFast : SPEED.enemyBullet)
      : SPEED.playerBullet;
    const bulletColor = isEnemy ? COLORS.bulletEnemy : COLORS.bulletPlayer;

    const bulletCount = isEnemy ? 1 : this._getBulletCount();
    const bullets_arr = [];

    if (bulletCount === 1) {
      bullets_arr.push(this._createBullet(cx, cy, this.direction, isEnemy, bulletSpeed));
    } else if (bulletCount === 2) {
      // 并排双发
      if (this.direction === DIR.UP || this.direction === DIR.DOWN) {
        bullets_arr.push(this._createBullet(cx - 8, cy, this.direction, isEnemy, bulletSpeed));
        bullets_arr.push(this._createBullet(cx + 8, cy, this.direction, isEnemy, bulletSpeed));
      } else {
        bullets_arr.push(this._createBullet(cx, cy - 8, this.direction, isEnemy, bulletSpeed));
        bullets_arr.push(this._createBullet(cx, cy + 8, this.direction, isEnemy, bulletSpeed));
      }
    } else {
      // 环形散射
      const spreadAngles = this._getSpreadAngles(bulletCount);
      const baseAngle = this._directionToAngle(this.direction);
      for (const angle of spreadAngles) {
        const rad = (baseAngle + angle) * Math.PI / 180;
        const b = this._createBullet(cx, cy, this.direction, isEnemy, bulletSpeed);
        // 在创建后调整方向（存储角度用于实际移动）
        b._spreadAngle = rad;
        b._useSpread = true;
        b.direction = this.direction; // 保留基础方向
        if (this.level >= 5) {
          b.penetrate = 1;
          b.width = Math.floor(b.width * 1.5);
          b.height = Math.floor(b.height * 1.5);
        }
        bullets_arr.push(b);
      }
    }

    for (const b of bullets_arr) {
      bullets.push(b);
    }
    return bullets_arr;
  }

  _getBulletCount() {
    if (this.type !== 'player') return 1;
    return Math.min(this.level, 5);
  }

  _getSpreadAngles(count) {
    if (count <= 1) return [0];
    if (count === 2) return [0, 0]; // 双发并排，不散射
    if (count === 3) return [-30, 0, 30];
    if (count === 4) return [-45, -15, 15, 45];
    return [-60, -30, 0, 30, 60]; // 5发
  }

  _directionToAngle(dir) {
    switch (dir) {
      case DIR.UP: return -90;
      case DIR.DOWN: return 90;
      case DIR.LEFT: return 180;
      case DIR.RIGHT: return 0;
      default: return -90;
    }
  }

  _createBullet(cx, cy, direction, isEnemy, speed) {
    const bx = cx - 3;
    const by = cy - 3;
    const b = new Bullet(bx, by, direction, isEnemy, isEnemy ? ENEMY_BULLET_DAMAGE : 1, speed);
    return b;
  }

  // --- 受伤 ---
  takeDamage(dmg) {
    if (this.type === 'player' && this.invincible > 0) return false;
    if (this.type === 'player' && this.shield > 0) {
      this.shield--;
      return false; // 护盾吸收
    }
    this.health -= dmg;
    if (this.health <= 0) {
      this.active = false;
      return true; // 死亡
    }
    if (this.type === 'player') {
      this.invincible = 1500;
    }
    return false;
  }

  // --- 更新 ---
  update(dt, map, otherTanks, player, bullets) {
    // 冷却更新
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      if (this.frozenTimer <= 0) this.frozen = false;
    }
    this.flicker += dt * 0.01;

    // 敌人 AI
    if (this.type !== 'player' && this.active) {
      this._updateAI(dt, map, otherTanks, player, bullets);
    }
  }

  _updateAI(dt, map, otherTanks, player, bullets) {
    if (this.frozen) return;

    this.aiChangeTimer += dt;
    // 每 1.5 秒重新评估目标
    if (this.aiChangeTimer > 1500) {
      this.aiChangeTimer = 0;
      if (this.type === 'enemy_standard') {
        this.aiTarget = Math.random() < 0.3 ? 'player' : 'base';
      } else if (this.type === 'enemy_scout') {
        this.aiTarget = Math.random() < 0.1 ? 'player' : 'base';
      } else {
        this.aiTarget = Math.random() < 0.5 ? 'player' : 'base';
      }
    }

    // 确定目标位置
    let targetX, targetY;
    if (this.aiTarget === 'player' && player && player.active) {
      targetX = player.x + player.width / 2;
      targetY = player.y + player.height / 2;
    } else {
      const base = map.getBasePosition();
      targetX = base.x + base.width / 2;
      targetY = base.y + base.height / 2;
    }

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const dx = targetX - cx;
    const dy = targetY - cy;

    // 尝试移动
    let moveDx = 0, moveDy = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      moveDx = Math.sign(dx);
    } else {
      moveDy = Math.sign(dy);
    }

    const moved = this.move(moveDx, moveDy, map, otherTanks);
    if (!moved) {
      // 撞墙后尝试另一个方向
      if (moveDx !== 0) {
        this.move(0, Math.sign(dy) || (Math.random() > 0.5 ? 1 : -1), map, otherTanks);
      } else {
        this.move(Math.sign(dx) || (Math.random() > 0.5 ? 1 : -1), 0, map, otherTanks);
      }
    }

    // 射击
    if (this.isFacingTarget(targetX, targetY)) {
      this.shoot(bullets);
    }
  }

  isFacingTarget(tx, ty) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const margin = 20;
    switch (this.direction) {
      case DIR.UP: return ty < cy && Math.abs(tx - cx) < margin;
      case DIR.DOWN: return ty > cy && Math.abs(tx - cx) < margin;
      case DIR.LEFT: return tx < cx && Math.abs(ty - cy) < margin;
      case DIR.RIGHT: return tx > cx && Math.abs(ty - cy) < margin;
      default: return false;
    }
  }

  // --- 绘制 ---
  draw(ctx) {
    if (!this.active) return;
    if (this.type === 'player' && this.invincible > 0) {
      // 无敌闪烁
      if (Math.floor(this.invincible / 100) % 2 === 0) return;
    }

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const s = this.width;

    // 草丛隐匿效果
    let alpha = 1;
    const grassCheck = this._checkGrassAround(ctx.canvas);
    // 简化：使用 context 全局 alpha
    // 实际上草丛检测应该在 Game 层做

    ctx.save();

    // 发光效果
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 12;

    // 坦克主体
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x + 2, this.y + 2, s - 4, s - 4);

    ctx.shadowBlur = 0;

    // 坦克履带
    ctx.fillStyle = this._darkenColor(this.color, 0.5);
    const trackW = 5;
    if (this.direction === DIR.UP || this.direction === DIR.DOWN) {
      ctx.fillRect(this.x, this.y, trackW, s);
      ctx.fillRect(this.x + s - trackW, this.y, trackW, s);
    } else {
      ctx.fillRect(this.x, this.y, s, trackW);
      ctx.fillRect(this.x, this.y + s - trackW, s, trackW);
    }

    // 炮管
    ctx.fillStyle = this._darkenColor(this.color, 0.3);
    const barrelW = 6;
    const barrelLen = s * 0.55;
    switch (this.direction) {
      case DIR.UP:
        ctx.fillRect(cx - barrelW / 2, this.y - barrelLen + s * 0.15, barrelW, barrelLen);
        break;
      case DIR.DOWN:
        ctx.fillRect(cx - barrelW / 2, this.y + s * 0.85, barrelW, barrelLen);
        break;
      case DIR.LEFT:
        ctx.fillRect(this.x - barrelLen + s * 0.15, cy - barrelW / 2, barrelLen, barrelW);
        break;
      case DIR.RIGHT:
        ctx.fillRect(this.x + s * 0.85, cy - barrelW / 2, barrelLen, barrelW);
        break;
    }

    // 装甲敌人额外边框
    if (this.type === 'enemy_armored') {
      ctx.strokeStyle = this._lightenColor(this.color, 0.3);
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x + 1, this.y + 1, s - 2, s - 2);
    }

    // 护盾效果
    if (this.shield > 0) {
      this._drawShield(ctx, cx, cy);
    }

    // 血条（最大生命>1时始终显示）
    if (this.maxHealth > 1) {
      this._drawHealthBar(ctx);
    }

    ctx.restore();
  }

  _drawShield(ctx, cx, cy) {
    const time = Date.now() * 0.003;
    const radius = this.width * 0.7;
    ctx.strokeStyle = COLORS.shield;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.shieldGlow;
    ctx.shadowBlur = 10;

    // 旋转能量点
    for (let i = 0; i < 3; i++) {
      const angle = time + (i * Math.PI * 2) / 3;
      const sx = cx + Math.cos(angle) * radius;
      const sy = cy + Math.sin(angle) * radius;
      ctx.fillStyle = COLORS.shield;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
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

  _checkGrassAround(canvas) {
    // 简化：在 Game 层处理
    return false;
  }

  _darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.floor(r * factor);
    const dg = Math.floor(g * factor);
    const db = Math.floor(b * factor);
    return `rgb(${dr},${dg},${db})`;
  }

  _lightenColor(hex, factor) {
    const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * (1 + factor)));
    const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * (1 + factor)));
    const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * (1 + factor)));
    return `rgb(${r},${g},${b})`;
  }
}