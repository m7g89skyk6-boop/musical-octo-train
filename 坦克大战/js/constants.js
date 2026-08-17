// Neon Tanks - 常量配置

// 画布
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// 网格
export const TILE_SIZE = 40;
export const COLS = 20;
export const ROWS = 15;

// 地图格子类型
export const TILE_EMPTY = 0;
export const TILE_BRICK = 1;
export const TILE_STEEL = 2;
export const TILE_GRASS = 3;
export const TILE_WATER = 4;

// 实体尺寸
export const TANK_SIZE = 36;
export const BULLET_SIZE = 6;
export const BOSS_SIZE = 90;
export const POWERUP_SIZE = 28;

// 颜色
export const COLORS = {
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

// 速度（px/frame @ 60fps）
export const SPEED = {
  player: 2.5,
  playerBullet: 6,
  enemyStandard: 1.5,
  enemyScout: 3.0,
  enemyArmored: 0.9,
  enemyBullet: 4,
  enemyBulletFast: 8,
  bossBullet: 5,
};

// 射击冷却（ms）
export const COOLDOWN = {
  player: 200,
  enemyStandard: 1500,
  enemyScout: 2000,
  enemyArmored: 1000,
  bossPhase1: 800,
  bossPhase2: 1200,
  bossPhase3: 1500,
};

// 血量
export const HEALTH = {
  player: 5,
  enemyStandard: 1,
  enemyScout: 1,
  enemyArmored: 3,
  bossBase: 15,
  bossScale: 2, // + 波次 * 2
};

// 敌方子弹伤害系数
export const ENEMY_BULLET_DAMAGE = 0.5;

// 玩家吸血（击杀回复血量）
export const PLAYER_LIFESTEAL = 0.5;

// 游戏参数
export const GAME = {
  enemyBase: 5,
  enemyScale: 2, // 5 + wave * 2
  maxEnemiesOnScreen: 4,
  spawnIntervalMin: 1200,
  spawnIntervalDecay: 40, // 每波减少 40ms
  waveInterval: 3000, // 波次间隔 ms
  playerInvincibleTime: 1500, // 受伤无敌 ms
  powerUpChance: 0.3,
  powerUpDuration: 5000, // ms
  freezeDuration: 3000,
  bossWaveInterval: 5, // 每 5 波出 Boss
  bossEntryDuration: 1500, // Boss 入场动画 ms
  victoryWave: 10, // 第 10 波胜利
  shieldHits: 3,
  bossLifeBonus: 3,
};

// 道具类型
export const POWERUP_TYPES = {
  FIREPOWER: 0,
  SHIELD: 1,
  FREEZE: 2,
  LIGHTNING: 3,
  REPAIR: 4,
};

// 方向
export const DIR = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

// 游戏状态
export const STATE = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
  VICTORY: 'victory',
};