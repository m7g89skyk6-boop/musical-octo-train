// Neon Tanks - 地图系统

import { TILE_SIZE, COLS, ROWS, TILE_EMPTY, TILE_BRICK, TILE_STEEL, TILE_GRASS, TILE_WATER, COLORS } from './constants.js';

// 预设地图（20x15）
// 0=空地 1=砖墙 2=钢墙 3=草丛 4=水面
const MAP_DATA = [
  // 地图1：经典对称
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
  // 地图2：迷宫走廊
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
  // 地图3：开放战场
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

export class Map {
  constructor(mapIndex = 0) {
    this.tileSize = TILE_SIZE;
    this.cols = COLS;
    this.rows = ROWS;
    this.waterPhase = 0;
    this.grassPhase = 0;
    this.grid = MAP_DATA[mapIndex % MAP_DATA.length].map(row => [...row]);
  }

  static getRandomMapIndex() {
    return Math.floor(Math.random() * MAP_DATA.length);
  }

  getTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return TILE_EMPTY;
    return this.grid[row][col];
  }

  getTileAtPixel(px, py) {
    const col = Math.floor(px / this.tileSize);
    const row = Math.floor(py / this.tileSize);
    return this.getTile(col, row);
  }

  isSolid(col, row) {
    const tile = this.getTile(col, row);
    return tile === TILE_BRICK || tile === TILE_STEEL || tile === TILE_WATER;
  }

  isSolidPixel(px, py) {
    const col = Math.floor(px / this.tileSize);
    const row = Math.floor(py / this.tileSize);
    return this.isSolid(col, row);
  }

  isBlockingBullet(col, row) {
    const tile = this.getTile(col, row);
    return tile === TILE_BRICK || tile === TILE_STEEL;
  }

  destroyTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    if (this.grid[row][col] === TILE_BRICK) {
      this.grid[row][col] = TILE_EMPTY;
      return true;
    }
    return false;
  }

  getBasePosition() {
    // 基地在底部中央 (col 9-10, row 13-14)
    return {
      col: 9,
      row: 13,
      x: 9 * this.tileSize,
      y: 13 * this.tileSize,
      width: 2 * this.tileSize,
      height: 2 * this.tileSize,
    };
  }

  isBaseWall(col, row) {
    // 检查是否属于基地围墙（不包括基地本身）
    const base = this.getBasePosition();
    const baseCol = base.col;
    const baseRow = base.row;
    // 基地围墙：3x3 包围，但内部 2x2 是基地
    if (col >= baseCol - 1 && col <= baseCol + 2 && row >= baseRow - 1 && row <= baseRow + 2) {
      // 排除基地核心区域
      if (col >= baseCol && col <= baseCol + 1 && row >= baseRow && row <= baseRow + 1) {
        return false;
      }
      return true;
    }
    return false;
  }

  rebuildBaseWalls() {
    const base = this.getBasePosition();
    const baseCol = base.col;
    const baseRow = base.row;
    for (let r = baseRow - 1; r <= baseRow + 2; r++) {
      for (let c = baseCol - 1; c <= baseCol + 2; c++) {
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          // 排除基地核心
          if (c >= baseCol && c <= baseCol + 1 && r >= baseRow && r <= baseRow + 1) continue;
          this.grid[r][c] = TILE_BRICK;
        }
      }
    }
  }

  update(dt) {
    this.waterPhase += 0.05;
    this.grassPhase += 0.03;
  }

  draw(ctx) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.grid[row][col];
        const x = col * this.tileSize;
        const y = row * this.tileSize;

        switch (tile) {
          case TILE_BRICK:
            this._drawBrick(ctx, x, y);
            break;
          case TILE_STEEL:
            this._drawSteel(ctx, x, y);
            break;
          case TILE_GRASS:
            this._drawGrass(ctx, x, y);
            break;
          case TILE_WATER:
            this._drawWater(ctx, x, y);
            break;
        }
      }
    }
  }

  drawBase(ctx, baseAlive) {
    const base = this.getBasePosition();
    const cx = base.x + base.width / 2;
    const cy = base.y + base.height / 2;

    ctx.save();
    if (!baseAlive) {
      // 基地被摧毁时闪烁
      const flash = Math.sin(Date.now() * 0.05) > 0;
      ctx.fillStyle = flash ? '#ff0000' : COLORS.base;
    } else {
      ctx.fillStyle = COLORS.base;
    }

    ctx.shadowColor = COLORS.baseGlow;
    ctx.shadowBlur = 10;

    // 绘制旗帜/老鹰图标
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy + 10);
    ctx.lineTo(cx, cy - 15);
    ctx.lineTo(cx + 15, cy + 10);
    ctx.closePath();
    ctx.fill();

    // 旗杆
    ctx.strokeStyle = COLORS.base;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 15);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();

    // 底座
    ctx.fillStyle = COLORS.base;
    ctx.fillRect(cx - 8, cy + 12, 16, 6);

    ctx.restore();
  }

  _drawBrick(ctx, x, y) {
    const s = this.tileSize;
    ctx.fillStyle = COLORS.brick;
    ctx.fillRect(x, y, s, s);

    ctx.strokeStyle = COLORS.brickStroke;
    ctx.lineWidth = 0.5;
    // 砖缝纹理
    ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
    ctx.beginPath();
    ctx.moveTo(x + s / 2, y + 1);
    ctx.lineTo(x + s / 2, y + s - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 1, y + s / 2);
    ctx.lineTo(x + s - 1, y + s / 2);
    ctx.stroke();
  }

  _drawSteel(ctx, x, y) {
    const s = this.tileSize;
    ctx.fillStyle = COLORS.steel;
    ctx.fillRect(x, y, s, s);

    // 铆钉
    ctx.fillStyle = COLORS.steelRivet;
    const r = 3;
    const margin = 5;
    [
      [margin, margin],
      [s - margin, margin],
      [margin, s - margin],
      [s - margin, s - margin],
    ].forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(x + rx, y + ry, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 边框
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
  }

  _drawGrass(ctx, x, y) {
    const s = this.tileSize;
    const alpha = 0.25 + Math.sin(this.grassPhase + x * 0.1 + y * 0.1) * 0.1;
    ctx.fillStyle = `rgba(0, 180, 60, ${alpha})`;
    ctx.fillRect(x, y, s, s);

    // 草丛纹理线
    ctx.strokeStyle = `rgba(0, 220, 80, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    for (let i = 2; i < s; i += 6) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i - 3, y + s);
      ctx.stroke();
    }
  }

  _drawWater(ctx, x, y) {
    const s = this.tileSize;
    ctx.fillStyle = COLORS.water;
    ctx.fillRect(x, y, s, s);

    // 动态波纹
    ctx.strokeStyle = COLORS.waterLine;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const offsetY = (this.waterPhase * 10 + i * 12 + x * 0.3) % (s + 10) - 5;
      ctx.beginPath();
      ctx.moveTo(x, y + offsetY);
      for (let px = 0; px <= s; px += 4) {
        const py = y + offsetY + Math.sin((px + this.waterPhase * 20) * 0.15) * 3;
        ctx.lineTo(x + px, py);
      }
      ctx.stroke();
    }
  }
}