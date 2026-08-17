// Neon Tanks - 输入管理（键盘 + 触摸）

import { DIR } from './constants.js';

export class Input {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.prevKeys = {};
    this.touchActive = false;
    this.touchMove = { active: false, dx: 0, dy: 0 };
    this.touchFire = false;
    this._initKeyboard();
    this._initTouch();
  }

  _initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  _initTouch() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // 触摸设备检测
    const isTouchDevice = 'ontouchstart' in window;
    if (!isTouchDevice) return;

    this.touchActive = true;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        // 右半屏 = 开火
        if (tx > rect.width / 2) {
          this.touchFire = true;
        } else {
          // 左半屏 = 移动
          this.touchMove.active = true;
          this.touchMove.startX = tx;
          this.touchMove.startY = ty;
          this.touchMove.dx = 0;
          this.touchMove.dy = 0;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        if (tx <= rect.width / 2 && this.touchMove.active) {
          this.touchMove.dx = tx - this.touchMove.startX;
          this.touchMove.dy = ty - this.touchMove.startY;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        if (tx > rect.width / 2) {
          this.touchFire = false;
        } else {
          this.touchMove.active = false;
          this.touchMove.dx = 0;
          this.touchMove.dy = 0;
        }
      }
    }, { passive: false });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  getDirection() {
    let dx = 0, dy = 0;

    // 键盘
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) dy = -1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) dy = 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) dx = -1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx = 1;

    // 触摸
    if (this.touchMove.active) {
      const threshold = 15;
      const tdx = this.touchMove.dx;
      const tdy = this.touchMove.dy;
      if (Math.abs(tdx) > threshold) dx = Math.sign(tdx);
      if (Math.abs(tdy) > threshold) dy = Math.sign(tdy);
    }

    // 优先非零轴（避免斜对角）
    if (dx !== 0 && dy !== 0) {
      if (Math.abs(this.touchMove.dx || dx) > Math.abs(this.touchMove.dy || dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    return { dx, dy };
  }

  isFiring() {
    return this.isDown('Space') || this.isDown('KeyJ') || this.touchFire;
  }

  update() {
    this.justPressed = {};
    for (const key in this.keys) {
      if (this.keys[key] && !this.prevKeys[key]) {
        this.justPressed[key] = true;
      }
    }
    this.prevKeys = { ...this.keys };
  }
}