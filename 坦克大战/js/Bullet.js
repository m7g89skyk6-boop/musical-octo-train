// Neon Tanks - 子弹类

import { Entity } from './Entity.js';
import { BULLET_SIZE, COLORS, DIR, TILE_BRICK, TILE_STEEL, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class Bullet extends Entity {
  constructor(x, y, direction, isEnemy, damage = 1, speed = 6) {
    super(x, y, BULLET_SIZE, BULLET_SIZE);
    this.direction = direction;
    this.isEnemy = isEnemy;
    this.damage = damage;
    this.penetrate = 0;
    this.speed = speed;
    this.color = isEnemy ? COLORS.bulletEnemy : COLORS.bulletPlayer;
    this.trail = [];
  }

  update(map) {
    // 更新尾迹生命
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
      if (this.x < -this.width || this.x > CANVAS_WIDTH ||
          this.y < -this.height || this.y > CANVAS_HEIGHT) {
        this.active = false;
        return;
      }
      const hitCol = Math.floor((this.x + this.width / 2) / map.tileSize);
      const hitRow = Math.floor((this.y + this.height / 2) / map.tileSize);
      const tile = map.getTile(hitCol, hitRow);
      if (tile === TILE_BRICK) {
        map.destroyTile(hitCol, hitRow);
        return { destroyedTile: true, col: hitCol, row: hitRow };
      } else if (tile === TILE_STEEL) {
        return { hitSteel: true, col: hitCol, row: hitRow };
      }
    }
    return null;
  }

  draw(ctx) {
    // 尾迹
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = t.life / 4 * 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.width * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 子弹主体（发光）
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 内核（白色高亮）
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}