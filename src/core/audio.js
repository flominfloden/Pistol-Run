// 音效：KARDS 游戏内音效，按需解码，支持重叠播放
const BASE = "./sfx/";
const buffers = new Map();
const pending = new Map();

let ctx = null;
let master = null;
let muted = false;

export function initAudio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.62;
  master.connect(ctx.destination);
  return ctx;
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") ctx.resume();
}

export function setMuted(v) {
  muted = !!v;
  if (master) master.gain.value = muted ? 0 : 0.62;
}

export function isMuted() {
  return muted;
}

export function setVolume(v) {
  if (master) master.gain.value = muted ? 0 : Math.max(0, Math.min(1, v));
}

function fetchBuffer(name) {
  if (buffers.has(name)) return Promise.resolve(buffers.get(name));
  if (pending.has(name)) return pending.get(name);
  if (!ctx) return Promise.resolve(null);
  const p = fetch(BASE + name + ".webm")
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((ab) => (ab ? ctx.decodeAudioData(ab) : null))
    .then((buf) => {
      if (buf) buffers.set(name, buf);
      pending.delete(name);
      return buf;
    })
    .catch(() => {
      pending.delete(name);
      return null;
    });
  pending.set(name, p);
  return p;
}

const throttles = new Map();

export function play(name, { gain = 1, rate = 1, throttleMs = 40 } = {}) {
  if (!ctx || muted) return;
  const now = performance.now();
  const last = throttles.get(name) || 0;
  if (now - last < throttleMs) return;
  throttles.set(name, now);

  const go = (buf) => {
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(master);
    src.start(0);
  };

  const cached = buffers.get(name);
  if (cached) {
    go(cached);
  } else {
    fetchBuffer(name).then(go);
  }
}

export function warm(names) {
  if (!ctx) return;
  names.forEach((n) => fetchBuffer(n));
}
