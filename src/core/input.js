export class Input {
  constructor(el) {
    this.el = el;
    this.keys = new Set();
    this.pointer = { active: false, x: 0, y: 0, sx: 0, sy: 0, moved: false };
    this.dashQueued = false;
    this.dir = { x: 0, y: 0 };
    this.onDash = null;
    this.bind();
  }

  bind() {
    const kd = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === " " || k === "shift") {
        if (!this.keys.has(k)) this.dashQueued = true;
      }
      this.keys.add(k);
    };
    const ku = (e) => this.keys.delete(e.key.toLowerCase());

    window.addEventListener("keydown", kd, { passive: false });
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.pointer.active = false;
    });

    const el = this.el;
    const down = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      this.pointer.active = true;
      this.pointer.moved = false;
      this.pointer.sx = e.clientX;
      this.pointer.sy = e.clientY;
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!this.pointer.active) return;
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      if (Math.hypot(e.clientX - this.pointer.sx, e.clientY - this.pointer.sy) > 8) {
        this.pointer.moved = true;
      }
    };
    const up = (e) => {
      if (!this.pointer.active) return;
      // 轻点 = 冲刺
      if (!this.pointer.moved) this.dashQueued = true;
      this.pointer.active = false;
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  sample(camScale, camX) {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k.has("a") || k.has("arrowleft")) x -= 1;
    if (k.has("d") || k.has("arrowright")) x += 1;
    if (k.has("w") || k.has("arrowup")) y -= 1;
    if (k.has("s") || k.has("arrowdown")) y += 1;

    if (this.pointer.active && this.pointer.moved && x === 0 && y === 0) {
      const dx = this.pointer.x - this.pointer.sx;
      const dy = this.pointer.y - this.pointer.sy;
      const d = Math.hypot(dx, dy);
      if (d > 12) {
        x = dx / d;
        y = dy / d;
      }
    }

    this.dir.x = x;
    this.dir.y = y;

    const dash = this.dashQueued;
    this.dashQueued = false;
    return { x, y, dash };
  }
}
