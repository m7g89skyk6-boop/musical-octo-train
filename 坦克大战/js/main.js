// Neon Tanks - 入口文件

import { Game } from './Game.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

const canvas = document.getElementById('gameCanvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// 响应式缩放
function resizeCanvas() {
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight - 10;
  const scale = Math.min(maxWidth / CANVAS_WIDTH, maxHeight / CANVAS_HEIGHT);
  canvas.style.width = `${CANVAS_WIDTH * scale}px`;
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 点击开始（移动端适配）
canvas.addEventListener('click', () => {
  // 会在 Input/Game 中处理
});

const game = new Game(canvas);
game.start();