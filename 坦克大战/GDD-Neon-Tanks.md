# Neon Tanks（霓虹坦克）— 游戏设计文档 (GDD)

> **版本**: v1.0  
> **日期**: 2026-08-16  
> **技术栈**: 纯 HTML + CSS + JavaScript / Canvas 渲染 / 零外部依赖  
> **目标**: 经典 FC《坦克大战》核心玩法 + Roguelike 成长 + Boss 战

---

## 目录

1. [项目概述](#1-项目概述)
2. [视觉与 UI 设计](#2-视觉与-ui-设计)
3. [核心玩法与操作](#3-核心玩法与操作)
4. [地图与障碍物](#4-地图与障碍物)
5. [强化道具系统](#5-强化道具系统)
6. [Boss 系统](#6-boss-系统)
7. [敌方 AI](#7-敌方-ai)
8. [游戏状态与流程](#8-游戏状态与流程)
9. [技术架构与代码结构](#9-技术架构与代码结构)
10. [交互与反馈](#10-交互与反馈)
11. [附录](#11-附录)

---

## 1. 项目概述

### 1.1 游戏名称
**Neon Tanks（霓虹坦克）**

### 1.2 核心玩法
经典 FC《坦克大战》核心（保护基地、摧毁敌军） + 现代 Roguelike 成长体系 + 巨型 Boss 战。

### 1.3 视觉风格
赛博朋克 / 科技感：
- 霓虹描边
- 动态扫描线
- 粒子爆炸
- 暗色网格底纹

### 1.4 技术栈
- 纯 HTML + CSS + JavaScript（单文件或三文件分离）
- 基于 Canvas 渲染
- 零外部依赖（无 npm、无 CDN）

---

## 2. 视觉与 UI 设计

### 2.1 整体色调

| 元素 | 颜色 | 色值 |
|------|------|------|
| 背景 | 深空蓝 | `#0a0f24` |
| 玩家坦克 | 青色发光 | `#00f3ff` |
| 敌方坦克 | 洋红发光 | `#ff0055` |
| Boss | 金色发光 | `#ffaa00` |
| 网格线 | 半透明深蓝 | `rgba(0, 243, 255, 0.06)` |

### 2.2 地图细节

#### 砖墙（Brick Wall）
- 外观：暗红色网格纹理，带微弱内发光
- 可摧毁：1 发子弹摧毁 1 格
- 破坏效果：碎块飞溅粒子（向四周随机散射 8-12 个碎片）

#### 钢墙（Steel Wall）
- 外观：银灰色带铆钉（四个角点小圆点模拟铆钉）
- 不可摧毁
- 子弹击中效果：火花粒子（6-8 个黄色短寿命粒子向外弹射）

#### 草丛（Grass）
- 外观：半透明绿色矩形，带闪烁动画（alpha 在 0.25~0.45 之间正弦波动）
- 隐匿效果：坦克进入草丛后，坦克本体 alpha 降至 0.3，轮廓虚化
- 子弹可穿越草丛

#### 水面（Water）
- 外观：流动波纹动态效果（使用 sin/cos 偏移绘制水平波纹线，每帧相位递增）
- 碰撞：坦克不可通过，子弹可穿越
- 视觉：深蓝色底 + 青色波纹线条

### 2.3 基地（老鹰 / 旗帜）

- 位置：地图正下方中央（y 坐标接近底部边界）
- 外观：小型旗帜或鹰形图标，颜色为玩家青色 `#00f3ff`
- 包围：被可摧毁的砖墙围绕（3x3 或自定义围墙）
- 受攻击时：基地闪烁红白交替，触发 "Game Over" 倒计时文字（3 秒）
- 被摧毁后：立即 Game Over

### 2.4 HUD 界面

#### 顶部状态栏
- 背景：半透明深色条带 `rgba(10, 15, 36, 0.85)`，底部带霓虹青色扫描线
- 内容布局（从左到右）：

| 项目 | 显示内容 | 格式 |
|------|----------|------|
| 当前波次 | Wave | `WAVE: 1` |
| 击杀数 | Kills | `KILLS: 0` |
| 玩家生命 | 心形图标 | `❤️ x 3` |
| 武器等级 | 当前等级 | `Lv.1 ~ Lv.5` |

- 字体：优先 `Orbitron`，降级 `Courier New`，加粗，带 `text-shadow` 发光

#### Boss 血条（独立于 HUD）
- 位置：Boss 头顶上方
- 外观：红色底条 + 金色填充，带脉冲发光动画
- 显示血量数值：`HP: 15/25`

---

## 3. 核心玩法与操作

### 3.1 玩家控制

| 操作 | 按键 | 说明 |
|------|------|------|
| 上移 | `W` 或 `↑` | 炮管朝上 |
| 下移 | `S` 或 `↓` | 炮管朝下 |
| 左移 | `A` 或 `←` | 炮管朝左 |
| 右移 | `D` 或 `→` | 炮管朝右 |
| 开火 | `Space` 或 `J` | 按住连发，有冷却 CD |

- 炮管朝向：始终指向最后一次移动方向（坦克停止时保持上次朝向）
- 连发 CD：约 200ms（防止子弹过密，具体数值可调）

### 3.2 坦克物理

- 碰撞规则：
  - 坦克无法穿透砖墙、钢墙、水面、地图边界
  - 坦克之间不可重叠（相互阻挡碰撞）
- 碰撞检测：AABB（轴对齐包围盒）
- 碰撞响应：推回至碰撞前位置（沿移动轴分离）

### 3.3 波次系统

#### 刷新规则
- 每波敌人数量：`5 + 当前波次 * 2`
- 示例：
  - Wave 1: 7 辆
  - Wave 5: 15 辆
  - Wave 10: 25 辆

#### 生成位置
- 从屏幕顶部左右两角或随机边缘生成（不可生成在墙体内部）
- 具体生成点：`(x=0, y=0)`, `(x=canvas_w-40, y=0)`, `(x=canvas_w/2, y=0)`

#### 波次切换
- 清空当前波次所有敌人 + 存活 Boss 后
- 显示 "WAVE X CLEAR!" 文字（2 秒）
- 间隔 3 秒后进入下一波

---

## 4. 地图与障碍物

### 4.1 地图系统

#### 二维数组定义
```javascript
// 0 = 空地, 1 = 砖墙, 2 = 钢墙, 3 = 草丛, 4 = 水面
const MAP_1 = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  // ... 13 rows
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
```

#### 网格规格
- 画布尺寸：`800 x 600`（建议值，可调整）
- 网格大小：`40 x 40` 像素
- 地图网格：`20 列 x 15 行`
- 基地位置：`(col=9~11, row=13~14)` 即底部中央

#### 预设地图（至少 3 张）
1. **经典对称**：中轴对称布局，砖墙为主，少量钢墙
2. **迷宫走廊**：窄通道 + 水面障碍，钢墙穿插
3. **开放战场**：较少墙体，大量草丛，适合快速战斗

地图在每局开始时随机选取。

### 4.2 障碍物交互矩阵

| 交互 | 玩家坦克 | 敌方坦克 | 玩家子弹 | 敌方子弹 |
|------|:--:|:--:|:--:|:--:|
| 砖墙 | 不可通过 | 不可通过 | 可摧毁(1发) | 可摧毁(1发) |
| 钢墙 | 不可通过 | 不可通过 | 火花效果 | 火花效果 |
| 草丛 | 可通过(隐匿) | 可通过(隐匿) | 可穿越 | 可穿越 |
| 水面 | 不可通过 | 不可通过 | 可穿越 | 可穿越 |

---

## 5. 强化道具系统

### 5.1 掉落规则

- 触发条件：击杀敌方坦克后
- 掉落概率：30%
- 外观：发光能量球，脉冲缩放动画（scale 1.0~1.3 正弦波动）
- 持续时间：5 秒后自动消失
- 拾取方式：玩家坦克触碰

### 5.2 道具类型（5 种）

| 编号 | 图标 | 名称 | 颜色 | 效果 |
|:--:|:--:|------|------|------|
| 1 | ⭐ | 火力升级 | 金色 `#ffaa00` | 子弹升级：单发→双发→环形散射(3发)→4发→5发穿透(子弹变大+穿透+1) |
| 2 | 🛡️ | 护盾 | 蓝色 `#00aaff` | 玩家周身旋转能量罩（3 个旋转光点），免疫 3 次伤害 |
| 3 | ⏳ | 时间冻结 | 白色 `#ffffff` | 全屏敌方坦克停止移动和射击 3 秒 |
| 4 | ⚡ | 全屏雷暴 | 黄色 `#ffff00` | 立即消灭当前屏幕内所有非 Boss 敌军 |
| 5 | 🔧 | 基地修复 | 绿色 `#00ff66` | 如果基地围墙被毁，立即重建基地围墙 |

### 5.3 武器等级详情

| 等级 | 子弹数量 | 子弹形状 | 特殊效果 |
|:--:|:--:|------|------|
| Lv.1 | 1 | 普通圆形 | 无 |
| Lv.2 | 2 | 并排双发 | 无 |
| Lv.3 | 3 | 环形散射（前方扇形 90°） | 无 |
| Lv.4 | 4 | 环形散射（前方扇形 120°） | 无 |
| Lv.5 | 5 | 环形散射（前方扇形 150°） | 子弹变大 1.5x，可穿透 1 个敌人 |

---

## 6. Boss 系统

### 6.1 出现条件

- 每 5 波（第 5、10、15... 波）代替普通敌人出场
- 屏幕中央显示红色警示文字：**"⚠ WARNING: BOSS APPROACHING ⚠"**（持续 2 秒，脉冲缩放）
- Boss 从屏幕顶部中央缓缓降下（入场动画 1.5 秒）

### 6.2 Boss 设计 — "巨像·铁幕"

#### 属性

| 属性 | 数值 |
|------|------|
| 体型 | 普通坦克的 2.5 倍（约 100x100 px） |
| 血量 | `15 + 波次 * 2` |
| 移动速度 | 随阶段变化 |
| 独立血条 | 显示在 Boss 头顶 |
| 颜色 | 金色发光 `#ffaa00` |

#### 阶段行为（AI 行为树）

| 阶段 | 血量阈值 | 移动速度 | 攻击模式 | 其他行为 |
|------|:--:|------|------|------|
| 阶段一 | > 60% | 慢（玩家速度 0.5x） | 连续单发点射（每 800ms 一发） | 向玩家方向移动 |
| 阶段二 | 30%~60% | 中（玩家速度 0.8x） | 扇形 3 发子弹（每 1200ms 一轮） | 开始绕玩家移动 |
| 阶段三 | < 30% | 快（玩家速度 1.3x） | 螺旋弹幕（8 发圆形扩散，每 1500ms 一轮） | 主动撞击玩家 |

#### 死亡效果
1. Boss 爆炸：全屏白色闪光（canvas 覆盖白色，持续 100ms 后渐隐）
2. 大量粒子爆炸（50+ 金色粒子向外扩散）
3. 掉落：玩家直接增加 3 条命
4. 屏幕显示 "BOSS DEFEATED!" 金色大字

---

## 7. 敌方 AI

### 7.1 普通敌人（Standard）

| 属性 | 数值 |
|------|------|
| 血量 | 1 |
| 移动速度 | 玩家速度的 0.6x |
| 子弹速度 | 中等 |
| 颜色 | 洋红 `#ff0055` |
| AI 行为 | 70% 概率向基地移动，30% 概率追击玩家 |
| 射击频率 | 每 1500ms 一发 |

### 7.2 快速敌人（Scout）

| 属性 | 数值 |
|------|------|
| 血量 | 1 |
| 移动速度 | 玩家速度的 1.2x |
| 子弹速度 | 快 |
| 颜色 | 亮洋红 `#ff3377` |
| AI 行为 | 专攻基地（90% 向基地移动） |
| 射击频率 | 每 2000ms 一发 |

### 7.3 重型敌人（Armored）

| 属性 | 数值 |
|------|------|
| 血量 | 3 |
| 移动速度 | 玩家速度的 0.35x |
| 子弹速度 | 极快（2x 普通子弹） |
| 颜色 | 深洋红 `#cc0044`，带额外装甲边框 |
| AI 行为 | 50% 向基地，50% 追击玩家 |
| 射击频率 | 每 1000ms 一发 |

### 7.4 敌方生成规则

- 新敌人生成间隔：`max(500ms, 2000ms - 波次 * 100ms)`（越往后生成越快）
- 每波敌人类型比例：
  - 普通：60%
  - 快速：25%
  - 重型：15%
- 同时在场敌人数量上限：6 辆（防止屏幕过于拥挤）

---

## 8. 游戏状态与流程

### 8.1 状态机

```
┌──────────┐    点击/Enter    ┌──────────┐
│  START   │ ───────────────→ │  PLAYING │
│  SCREEN  │                  │          │
└──────────┘                  └────┬─────┘
                                   │
                    Game Over / 胜利│
                                   ↓
                              ┌──────────┐
                              │ GAME OVER│
                              │  SCREEN  │
                              └────┬─────┘
                                   │ 点击/Enter
                                   ↓
                              ┌──────────┐
                              │  START   │ (循环)
                              └──────────┘
```

### 8.2 开始界面
- 动态标题 "NEON TANKS"（大号霓虹字体，带扫描线动画）
- 副标题 "A Cyberpunk Tank Battle"
- 闪烁提示："点击开始 / Press Enter"（每 800ms 切换可见性）
- 背景：随机敌人坦克缓慢移动的演示画面（或静态网格背景）

### 8.3 游戏进行
- 执行完整游戏逻辑
- 实时更新 HUD

### 8.4 Game Over 条件

| 条件 | 触发 | 结果 |
|------|------|------|
| 玩家生命归零 | 被敌方子弹击中 3 次（无护盾时） | Game Over |
| 基地被摧毁 | 敌方子弹击中基地 | Game Over（3 秒倒计时后） |

### 8.5 胜利条件
- 无限波次模式
- 阶段性目标：击败第 10 波 Boss 后显示 "VICTORY!" 画面
- 玩家可选择继续游戏（进入第 11 波）

### 8.6 生命系统
- 初始生命：3 条
- 被击中后：短暂无敌时间（1.5 秒，坦克闪烁）
- 额外生命获取：
  - 击败 Boss：+3 条
  - （可选扩展）每 10 波：+1 条

---

## 9. 技术架构与代码结构

### 9.1 文件结构

```
neon-tanks/
├── index.html          # 入口文件，Canvas 元素 + 基本布局
├── css/
│   └── style.css       # HUD 样式、字体、动画
└── js/
    ├── main.js         # 入口，初始化 Game
    ├── Game.js         # 核心引擎
    ├── Entity.js       # 实体基类
    ├── Tank.js         # 坦克类（玩家 + 敌人）
    ├── Bullet.js       # 子弹类
    ├── Map.js          # 地图系统
    ├── PowerUp.js      # 道具系统
    ├── ParticleSystem.js  # 粒子特效
    ├── Sound.js        # Web Audio API 音效
    ├── Input.js        # 输入管理（键盘 + 触摸）
    ├── Boss.js         # Boss 特殊逻辑（继承 Tank）
    └── constants.js    # 常量配置
```

### 9.2 核心类设计

#### Game（核心引擎）
```javascript
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'start';  // 'start' | 'playing' | 'gameover' | 'victory'
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.powerUps = [];
    this.particles = new ParticleSystem();
    this.map = null;
    this.wave = 0;
    this.kills = 0;
    this.baseAlive = true;
    this.frameCount = 0;
  }

  // 核心方法
  init()           // 初始化游戏
  update()         // 每帧更新（调用所有子系统的 update）
  render()         // 每帧渲染（调用所有子系统的 draw）
  gameLoop()       // requestAnimationFrame 循环
  startWave()      // 开始新波次
  spawnEnemy()     // 生成敌人
  checkCollisions()// 碰撞检测总调度
  gameOver()       // 游戏结束处理
  restart()        // 重新开始
}
```

#### Entity（实体基类）
```javascript
class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 0;
    this.direction = 'up';  // 'up' | 'down' | 'left' | 'right'
    this.active = true;     // 是否存活
  }

  draw(ctx) {}      // 子类重写
  update() {}       // 子类重写
  getBounds()       // 返回 AABB { x, y, width, height }
}
```

#### Tank（继承 Entity）
```javascript
class Tank extends Entity {
  constructor(x, y, type) {
    super(x, y, 36, 36);  // 普通坦克尺寸
    this.type = type;       // 'player' | 'enemy_standard' | 'enemy_scout' | 'enemy_armored' | 'boss'
    this.health = 1;
    this.maxHealth = 1;
    this.cooldown = 0;
    this.cooldownTime = 200; // 射击冷却 ms
    this.level = 1;          // 武器等级（仅玩家）
    this.shield = 0;         // 护盾剩余次数（仅玩家）
    this.invincible = 0;     // 无敌时间 ms（仅玩家）
    this.aiTimer = 0;        // AI 决策计时器
  }

  // 核心方法
  move(dx, dy, map)     // 移动 + 碰撞检测
  shoot()               // 开火，返回 Bullet 数组
  takeDamage(dmg)       // 受伤处理
  updateAI()            // 敌方 AI 行为更新
  draw(ctx)             // 绘制坦克（含霓虹发光效果）
}
```

#### Bullet（继承 Entity）
```javascript
class Bullet extends Entity {
  constructor(x, y, direction, isEnemy, damage) {
    super(x, y, 6, 6);  // 子弹尺寸
    this.direction = direction;
    this.isEnemy = isEnemy;
    this.damage = damage || 1;
    this.penetrate = 0;    // 穿透剩余次数（Lv.5 武器）
    this.speed = isEnemy ? 4 : 6;
  }

  update(map)   // 移动 + 边界检测 + 墙体碰撞
  draw(ctx)     // 绘制子弹（带发光尾迹）
}
```

#### Map（地图系统）
```javascript
class Map {
  constructor(grid) {
    this.grid = grid;        // 二维数组
    this.tileSize = 40;      // 每格像素
    this.cols = 20;
    this.rows = 15;
    this.waterPhase = 0;     // 水面动画相位
    this.grassPhase = 0;     // 草丛闪烁相位
  }

  static MAPS = [MAP_1, MAP_2, MAP_3];  // 预设地图

  getTile(col, row)          // 获取格子类型
  isSolid(col, row)          // 是否不可通过（1,2,4）
  isBlockingBullet(col, row) // 是否阻挡子弹（1,2）
  destroyTile(col, row)      // 摧毁砖墙
  getBasePosition()          // 返回基地坐标
  draw(ctx)                  // 渲染地图
  drawWater(ctx)             // 渲染水面波纹
  drawGrass(ctx)             // 渲染草丛闪烁
}
```

#### PowerUp（道具系统）
```javascript
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;  // 0-4 对应 5 种道具
    this.timer = 300;  // 5 秒 (60fps * 5)
    this.radius = 14;
    this.pulsePhase = 0;
  }

  static TYPES = [
    { name: 'firepower', icon: '⭐', color: '#ffaa00' },
    { name: 'shield',    icon: '🛡️', color: '#00aaff' },
    { name: 'freeze',    icon: '⏳', color: '#ffffff' },
    { name: 'lightning', icon: '⚡', color: '#ffff00' },
    { name: 'repair',    icon: '🔧', color: '#00ff66' },
  ];

  apply(player, game)   // 施加道具效果
  update()              // 倒计时 + 动画
  draw(ctx)             // 绘制发光能量球
}
```

#### ParticleSystem（粒子特效）
```javascript
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // 特效类型
  emitExplosion(x, y, color, count)     // 爆炸碎片
  emitSparks(x, y)                       // 钢墙火花
  emitTrail(x, y, color)                 // 尾迹粒子
  emitBossDeath(x, y)                    // Boss 死亡粒子
  emitBrickDebris(x, y)                  // 砖墙碎片

  update()    // 更新所有粒子（位置、衰减、生命）
  draw(ctx)   // 渲染所有粒子
}

class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color;
    this.size = size;
  }
}
```

#### Sound（Web Audio API 音效）
```javascript
class Sound {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  playShoot()      // 射击音效：短促高频方波 "滴"
  playExplosion()  // 爆炸音效：低频噪声衰减 "轰"
  playPickup()     // 拾取音效：上升双音 "叮"
  playBossWarning()// Boss 警告：低频脉冲
  playBossDeath()  // Boss 死亡：低频轰鸣 + 渐弱
  playGameOver()   // Game Over：下降音阶

  // 内部方法：生成简易合成音
  _playTone(freq, duration, type, volume)  // 播放单音
  _playNoise(duration, volume)             // 播放噪声
}
```

#### Input（输入管理）
```javascript
class Input {
  constructor() {
    this.keys = {};           // 当前按下的键
    this.justPressed = {};    // 本帧刚按下的键
    this.touchActive = false;
    this.touchData = {};      // 触摸数据
  }

  init()                // 绑定键盘/触摸事件
  isDown(key)           // 某键是否按住
  isJustPressed(key)    // 某键是否刚按下
  getDirection()        // 返回移动方向 { dx, dy }
  isFiring()            // 是否正在开火
  update()              // 每帧更新（清除 justPressed）
}
```

### 9.3 游戏循环流程

```
gameLoop() {
  1. 计算 deltaTime
  2. Input.update()                    // 更新输入状态
  3. switch (state):
     case 'start':
       renderStartScreen()
       if (Input.isJustPressed('Enter')) → state = 'playing', init()
     case 'playing':
       player.update()                 // 玩家移动 + 射击
       enemies.forEach(e => e.update())// 敌人 AI + 射击
       bullets.forEach(b => b.update())// 子弹移动 + 碰撞
       powerUps.forEach(p => p.update())// 道具倒计时
       particles.update()              // 粒子更新
       checkAllCollisions()            // 碰撞检测
       checkWaveStatus()               // 波次管理
       checkGameOver()                 // 游戏结束检测
       HUD.update()                    // 更新 HUD 数据
     case 'gameover':
       renderGameOverScreen()
       if (Input.isJustPressed('Enter')) → restart()
     case 'victory':
       renderVictoryScreen()
       if (Input.isJustPressed('Enter')) → continueGame() 或 restart()
  4. render()                          // 绘制所有内容
  5. requestAnimationFrame(gameLoop)
}
```

---

## 10. 交互与反馈

### 10.1 屏幕震动

- 触发条件：玩家坦克被击中
- 实现方式：Canvas 容器 CSS `transform: translate(x, y)`，使用随机偏移
- 参数：
  - 震动强度：`±3px`
  - 持续时间：`200ms`
  - 衰减：线性衰减

### 10.2 音效（Web Audio API）

| 事件 | 音效 | 实现方式 |
|------|------|------|
| 射击 | 短促 "滴" | 高频方波（1200Hz, 50ms） |
| 爆炸（敌毁） | 低沉 "轰" | 低频噪声（100~300Hz, 200ms 衰减） |
| 拾取道具 | 清脆 "叮" | 上升双音（800Hz→1200Hz, 100ms） |
| Boss 警告 | 低频脉冲 | 150Hz 脉冲 × 3 次 |
| Boss 死亡 | 轰鸣 | 低频噪声（50~200Hz, 500ms 衰减） |
| Game Over | 下降音阶 | 400→200→100Hz, 各 150ms |

### 10.3 触摸支持（移动端适配）

#### 虚拟摇杆
- 位置：屏幕左下角
- 外观：半透明圆形底盘 + 可拖动的操控杆
- 操作：触摸拖动控制方向，松手回弹

#### 开火按钮
- 位置：屏幕右下角
- 外观：半透明圆形按钮（红色边框）
- 操作：按住连续开火，松手停止

#### 响应式适配
- Canvas 根据窗口大小等比缩放
- 触摸设备自动显示虚拟控件
- 桌面端隐藏虚拟控件

---

## 11. 附录

### 11.1 预设地图数据

#### 地图 1：经典对称（Classic Symmetric）

```
20x15 网格
地图代码待 Builder 根据布局要求填充，核心要求：
- 基地在底部中央 (col=9~10, row=13~14)，被砖墙包围
- 中轴对称布局
- 包含砖墙、少量钢墙、草丛点缀
- 主要通道宽 2~3 格
```

#### 地图 2：迷宫走廊（Maze Corridor）

```
20x15 网格
核心要求：
- 窄通道（1~2 格宽）
- 水面障碍横跨中部
- 钢墙穿插在关键位置
- 草丛在角落设置伏击点
```

#### 地图 3：开放战场（Open Battlefield）

```
20x15 网格
核心要求：
- 较少墙体
- 大量草丛覆盖
- 钢墙仅在基地附近
- 适合快速移动和远程射击
```

### 11.2 调整参数表（供后续调优）

| 参数 | 默认值 | 说明 |
|------|:--:|------|
| 玩家速度 | 2.5 px/frame | 移动速度 |
| 玩家子弹速度 | 6 px/frame | 子弹飞行速度 |
| 玩家射击 CD | 200 ms | 连发间隔 |
| 敌人普通速度 | 1.5 px/frame | 普通敌人 |
| 敌人快速速度 | 3.0 px/frame | 快速敌人 |
| 敌人重型速度 | 0.9 px/frame | 重型敌人 |
| 敌人子弹速度 | 4 px/frame | 敌方子弹 |
| 敌人射击 CD | 1500 ms | 普通敌人射击间隔 |
| 道具掉落率 | 30% | 击杀后掉落概率 |
| 道具持续 | 5 秒 | 消失时间 |
| 玩家无敌时间 | 1.5 秒 | 被击中后 |
| 波次间隔 | 3 秒 | 波次间等待 |
| 同时在场敌人数 | 6 | 上限 |
| Boss 血量基础 | 15 | + 波次 * 2 |
| 画布尺寸 | 800 x 600 | 20 列 x 15 行 |
| 网格大小 | 40 px | 每格像素 |

### 11.3 开发优先级

| 优先级 | 模块 | 说明 |
|:--:|------|------|
| P0 | Canvas 渲染 + 游戏循环 | 最基础框架 |
| P0 | 地图系统 + 碰撞检测 | 核心玩法基础 |
| P0 | 玩家坦克 + 子弹 | 可操作 |
| P1 | 敌方 AI + 波次系统 | 可玩性 |
| P1 | HUD + 游戏状态 | 完整性 |
| P1 | 粒子特效 | 视觉反馈 |
| P2 | 道具系统 | Roguelike 成长 |
| P2 | Boss 系统 | 重头戏 |
| P2 | 音效 | 手感提升 |
| P3 | 触摸支持 | 移动端 |
| P3 | 屏幕震动 | 手感提升 |
| P3 | 3 张地图 | 多样性 |

---

> **文档状态**: 待审核  
> **下一步**: 用户审阅后优化，再发给 Builder 执行代码生成