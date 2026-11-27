// Turkey Trot — keyboard + mouse. Arrow keys / WASD move, Up / Space jumps,
// Shift or a mouse click dashes toward the pointer. P pauses, M mutes,
// R restarts, Enter starts from a menu screen.
export class Input {
  constructor(canvas) {
    this.left = false;
    this.right = false;
    this.jumpHeld = false;
    this.jumpPressed = false; // edge: consumed by the loop each frame
    this.dashPressed = false; // edge: consumed by the loop each frame
    this.pausePressed = false;
    this.mutePressed = false;
    this.restartPressed = false;
    this.startPressed = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.canvas = canvas;
    this.onFirstGesture = null;
    this._gestured = false;
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    canvas.addEventListener('pointerdown', (e) => this.onPointer(e));
    canvas.addEventListener('pointermove', (e) => this.onMove(e));
  }

  _gesture() {
    if (!this._gestured) {
      this._gestured = true;
      if (this.onFirstGesture) this.onFirstGesture();
    }
  }

  onKey(e, down) {
    const k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
    this._gesture();
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.left = down;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') this.right = down;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') {
      if (down && !this.jumpHeld) this.jumpPressed = true;
      this.jumpHeld = down;
    } else if (k === 'Shift') {
      if (down) this.dashPressed = true;
    } else if (k === 'p' || k === 'P') {
      if (down) this.pausePressed = true;
    } else if (k === 'm' || k === 'M') {
      if (down) this.mutePressed = true;
    } else if (k === 'r' || k === 'R') {
      if (down) this.restartPressed = true;
    } else if (k === 'Enter') {
      if (down) this.startPressed = true;
    }
  }

  onPointer(e) {
    this._gesture();
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = ((e.clientX - rect.left) / rect.width) * 1280;
    this.mouseY = ((e.clientY - rect.top) / rect.height) * 720;
    this.mouseDown = true;
    this.dashPressed = true;
  }

  onMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = ((e.clientX - rect.left) / rect.width) * 1280;
    this.mouseY = ((e.clientY - rect.top) / rect.height) * 720;
  }

  // The loop calls this at the end of every frame: edges live for one frame.
  endFrame() {
    this.jumpPressed = false;
    this.dashPressed = false;
    this.pausePressed = false;
    this.mutePressed = false;
    this.restartPressed = false;
    this.startPressed = false;
    this.mouseDown = false;
  }
}
