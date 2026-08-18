(() => {
  "use strict";

  const S = 2;
  const PORTRAIT = { cw: 600, ch: 956, p: { x: 44, y: 44, w: 512, h: 690 }, shell: "min(100%,352px)" };
  const LANDSCAPE = { cw: 956, ch: 600, p: { x: 44, y: 44, w: 689, h: 512 }, shell: "min(100%,528px)" };
  const FILTERS = [
    ["none", "원본", ""], ["soft", "뽀샤시", "brightness(1.08) saturate(1.08) contrast(.95)"],
    ["warm", "따뜻", "sepia(.22) saturate(1.3) brightness(1.03)"], ["cool", "시원", "hue-rotate(-12deg) saturate(1.2) brightness(1.05)"],
    ["pastel", "파스텔", "saturate(.78) brightness(1.12) contrast(.94)"], ["vintage", "빈티지", "sepia(.42) contrast(.92) saturate(.85)"],
    ["mono", "흑백", "grayscale(1) contrast(1.05)"],
  ];
  const BRUSHES = [["pen", "펜"], ["marker", "형광펜"], ["glow", "네온"], ["eraser", "지우개"]];
  const INK_COLORS = ["#ff5c8a", "#f5619c", "#ff8ab5", "#ffb3d2", "#ffffff", "#5d4450", "#e5334f", "#ffd9e8", "#c48aa8"];
  const TEXT_COLORS = ["#ff5c8a", "#ffffff", "#5d4450", "#f5619c", "#ff8ab5", "#ffb3d2", "#e5334f", "#ffe0ec", "#c48aa8"];
  const SUB_COLORS = ["#ffffff", "#5d4450", "#ff5c8a", "#ffb3d2", "#ffe0ec", "#f5619c"];
  const FRAME_COLORS = ["#ffffff", "#fff8fb", "#fff1f6", "#ffe6ef", "#ffd9e7", "#ffc9dd", "#fdeef7", "#fff7ef", "#4a3a42", "#211a1e"];
  const PAT_COLORS = ["#ffdbe8", "#fff0f6", "#ffffff", "#ffc2d8", "#ffa8c8", "#ffe3ee", "#ffd0c4", "#f7e2ec"];
  const FX_COLORS = ["#ffffff", "#ffeaf3", "#ffd9e8", "#ffb3d2", "#ff8ab5", "#fff0f6", "#ffd7c9"];
  const FONTS = [
    ["Nanum Pen Script", "나눔 펜"], ["Gaegu", "개구"], ["Hi Melody", "하이멜로디"], ["Gamja Flower", "감자꽃"],
    ["Poor Story", "푸어스토리"], ["East Sea Dokdo", "동해 손글씨"], ["Nanum Brush Script", "붓글씨"], ["Single Day", "싱글데이"], ["Cute Font", "큐트"],
    ["Dongle", "동글"], ["Yeon Sung", "연성"], ["Jua", "주아"], ["Kirang Haerang", "기랑해랑"],
    ["Bagel Fat One", "베이글"], ["Gasoek One", "가속"], ["Moirai One", "모이라이"], ["Black Han Sans", "검은고딕"],
    ["Gowun Dodum", "고운돋움"], ["Sunflower", "해바라기"], ["Diphylleia", "산하엽"], ["Nanum Myeongjo", "명조"], ["Pretendard Variable", "프리텐다드"],
  ];
  const FX = [["none", "기본"], ["outline", "테두리"], ["shadow", "그림자"], ["neon", "네온"], ["gradient", "그라데이션"], ["pop", "두꺼운 테두리"]];
  const PATTERNS = [["none", "없음"], ["dots", "도트"], ["gingham", "체크"], ["hearts", "하트"], ["fade", "그라데이션"]];
  const MOTIONS = [["none", "없음"], ["sparkle", "반짝"], ["glitter", "가루"], ["star", "별"], ["heart", "하트"], ["petal", "꽃잎"], ["snow", "눈"], ["bokeh", "보케"], ["bubble", "물방울"], ["ring", "물결"]];
  const FINISHES = [["none", "없음"], ["glow", "뽀샤시"], ["leak", "빛번짐"], ["vignette", "비네트"], ["dream", "몽글"]];
  const ANIMATED = new Set(["sparkle", "glitter", "star", "heart", "petal", "snow", "bokeh", "bubble", "ring"]);

  let CARD_W = PORTRAIT.cw;
  let CARD_H = PORTRAIT.ch;
  let PHOTO = { ...PORTRAIT.p };
  let cv = null;
  let ctx = null;
  let shell = null;
  let toastTimer = null;
  let rafId = null;
  let animRAF = null;
  let animT = 0;
  let lastTS = 0;
  let lastDraw = 0;
  let drag = null;
  let pinch = null;
  let curStroke = null;
  let inkDirty = true;
  let pKey = "";
  let particles = [];
  let busy = false;
  const pointers = new Map();
  const stickerImgs = [];
  const ink = document.createElement("canvas");
  const ictx = ink.getContext("2d");
  const state = makeState();

  function makeState() {
    return {
      tool: "photo", photo: null, filter: "none", frameColor: "#ffffff", pattern: "none", patternColor: "#ffd8e5", innerEdge: "thin",
      motion: "none", fxColor: "#ffffff", fxCount: 16, finish: "none", quality: 3, gifScale: .85, gifFrames: 24,
      strokes: [], items: [], selected: null, brush: { type: "pen", color: "#ff5c8a", size: 6 },
      text: { font: "Nanum Pen Script", fx: "none", color: "#ff5c8a", sub: "#ffffff", size: 46, bold: false },
      sticker: { size: 130, opacity: 1 }, history: [],
    };
  }

  const $ = (id) => document.getElementById(id);
  const active = () => Boolean(cv && document.body.contains(cv));
  const ui = (id) => active() ? $(id) : null;

  function toast(message) {
    const target = ui("chekiToast");
    if (!target) return;
    target.textContent = message;
    target.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => target.classList.remove("show"), 1700);
  }

  function hint(message) {
    const target = ui("hint");
    if (target) target.textContent = message;
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  function isDark(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
  }

  function rgba(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }

  function heartPath(c, x, y, s) {
    c.beginPath(); c.moveTo(x, y + s * .92);
    c.bezierCurveTo(x - s * 1.55, y - s * .28, x - s * .52, y - s * 1.24, x, y - s * .34);
    c.bezierCurveTo(x + s * .52, y - s * 1.24, x + s * 1.55, y - s * .28, x, y + s * .92); c.closePath();
  }

  function sparklePath(c, x, y, radius) {
    const r = radius * .19;
    c.beginPath(); c.moveTo(x, y - radius); c.quadraticCurveTo(x + r, y - r, x + radius, y); c.quadraticCurveTo(x + r, y + r, x, y + radius);
    c.quadraticCurveTo(x - r, y + r, x - radius, y); c.quadraticCurveTo(x - r, y - r, x, y - radius); c.closePath();
  }

  function starPath(c, x, y, radius, rotation) {
    const r = radius * .44;
    c.save(); c.translate(x, y); c.rotate(rotation || 0); c.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const size = i % 2 ? r : radius;
      c[i ? "lineTo" : "moveTo"](Math.cos(angle) * size, Math.sin(angle) * size);
    }
    c.closePath(); c.restore();
  }

  function petalPath(c, x, y, s, rotation) {
    c.save(); c.translate(x, y); c.rotate(rotation); c.beginPath(); c.moveTo(0, -s);
    c.bezierCurveTo(s * .92, -s * .5, s * .72, s * .72, 0, s); c.bezierCurveTo(-s * .72, s * .72, -s * .92, -s * .5, 0, -s);
    c.closePath(); c.restore();
  }

  function wideDir() {
    return CARD_H - (PHOTO.y + PHOTO.h) >= CARD_W - (PHOTO.x + PHOTO.w) ? "v" : "h";
  }

  function mulberry32(seed) {
    return () => {
      let value = seed |= 0;
      seed = value + 0x6D2B79F5 | 0;
      value = Math.imul(value ^ value >>> 15, 1 | value);
      value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function ensureParticles() {
    const key = `${state.motion}|${state.fxCount}`;
    if (key === pKey) return;
    pKey = key;
    const random = mulberry32(20260818);
    particles = Array.from({ length: state.fxCount }, () => ({ x: random(), y: random(), s: .55 + random() * .9, ph: random(), sp: 1 + Math.floor(random() * 3), rot: random() * Math.PI * 2, sway: .02 + random() * .05 }));
  }

  function drawStroke(c, stroke, scale, options = {}) {
    const points = stroke.points;
    if (!points.length) return;
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    let color = stroke.color;
    let width = stroke.size * scale;
    if (stroke.type === "marker") { if (!options.flat) c.globalAlpha = .42; width = stroke.size * 2.3 * scale; }
    if (stroke.type === "glow") { if (!options.flat) { c.shadowColor = stroke.color; c.shadowBlur = stroke.size * 2.4 * scale; } if (options.core) { color = "#ffffff"; width = Math.max(1, width * .45); } }
    if (stroke.type === "eraser") { c.globalCompositeOperation = "destination-out"; width = stroke.size * 2.4 * scale; }
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = width;
    if (points.length === 1) { c.beginPath(); c.arc(points[0].x * scale, points[0].y * scale, width / 2, 0, Math.PI * 2); c.fill(); }
    else {
      c.beginPath(); c.moveTo(points[0].x * scale, points[0].y * scale);
      for (let i = 1; i < points.length - 1; i += 1) {
        const midpointX = (points[i].x + points[i + 1].x) / 2 * scale;
        const midpointY = (points[i].y + points[i + 1].y) / 2 * scale;
        c.quadraticCurveTo(points[i].x * scale, points[i].y * scale, midpointX, midpointY);
      }
      c.lineTo(points.at(-1).x * scale, points.at(-1).y * scale); c.stroke();
      if (stroke.type === "glow" && !options.flat && !options.core) { c.shadowBlur = 0; c.lineWidth = Math.max(1, width * .45); c.strokeStyle = "#fff"; c.stroke(); }
    }
    c.restore();
  }

  function makeLayer(c) {
    const layer = document.createElement("canvas");
    layer.width = c.canvas.width; layer.height = c.canvas.height;
    return layer;
  }

  function paintStrokes(c, scale) {
    for (let i = 0; i < state.strokes.length;) {
      const stroke = state.strokes[i];
      if (stroke.type === "marker") {
        let end = i; while (end < state.strokes.length && state.strokes[end].type === "marker" && state.strokes[end].color === stroke.color) end += 1;
        const layer = makeLayer(c); const layerCtx = layer.getContext("2d");
        for (let index = i; index < end; index += 1) drawStroke(layerCtx, state.strokes[index], scale, { flat: true });
        c.save(); c.globalAlpha = .42; c.drawImage(layer, 0, 0); c.restore(); i = end;
      } else if (stroke.type === "glow") {
        let end = i; while (end < state.strokes.length && state.strokes[end].type === "glow" && state.strokes[end].color === stroke.color) end += 1;
        const body = makeLayer(c); const core = makeLayer(c); const bodyCtx = body.getContext("2d"); const coreCtx = core.getContext("2d"); let blur = 0;
        for (let index = i; index < end; index += 1) { drawStroke(bodyCtx, state.strokes[index], scale, { flat: true }); drawStroke(coreCtx, state.strokes[index], scale, { flat: true, core: true }); blur = Math.max(blur, state.strokes[index].size * 2.4 * scale); }
        c.save(); c.shadowColor = stroke.color; c.shadowBlur = blur; c.drawImage(body, 0, 0); c.drawImage(body, 0, 0); c.shadowBlur = 0; c.drawImage(body, 0, 0); c.drawImage(core, 0, 0); c.restore(); i = end;
      } else { drawStroke(c, stroke, scale); i += 1; }
    }
  }

  function buildInk(scale) {
    const width = CARD_W * scale; const height = CARD_H * scale;
    if (ink.width !== width || ink.height !== height) { ink.width = width; ink.height = height; } else if (inkDirty) ictx.clearRect(0, 0, width, height); else return ink;
    paintStrokes(ictx, scale); inkDirty = false; return ink;
  }

  function buildInkAt(scale) {
    const layer = document.createElement("canvas"); layer.width = CARD_W * scale; layer.height = CARD_H * scale; paintStrokes(layer.getContext("2d"), scale); return layer;
  }

  function drawMotion(c, scale, time) {
    if (state.motion === "none") return;
    ensureParticles();
    const X = PHOTO.x * scale; const Y = PHOTO.y * scale; const W = PHOTO.w * scale; const H = PHOTO.h * scale; const base = Math.min(W, H); const color = state.fxColor; const TAU = Math.PI * 2;
    const wrap = (value) => { const wrapped = value % 1; return wrapped < 0 ? wrapped + 1 : wrapped; };
    const edge = (y) => Math.min(1, Math.sin(Math.max(0, Math.min(1, y)) * Math.PI) * 2.4);
    const twinkle = (phase) => { const value = (Math.sin(phase * TAU - Math.PI / 2) + 1) / 2; return value * value * (3 - 2 * value); };
    c.save(); c.beginPath(); c.rect(X, Y, W, H); c.clip();
    for (const particle of particles) {
      const kind = state.motion; const phase = wrap(time * particle.sp + particle.ph); let px; let py; let alpha = 1; let size = base * .02 * particle.s; let rotation = particle.rot;
      if (["sparkle", "glitter", "star"].includes(kind)) { const tw = twinkle(phase); px = X + particle.x * W; py = Y + particle.y * H; alpha = .12 + .88 * tw; size = base * (kind === "glitter" ? .010 : kind === "star" ? .026 : .030) * particle.s * (.45 + .55 * tw); }
      else if (kind === "heart") { const y = wrap(particle.y - phase); px = X + (particle.x + Math.sin((phase + particle.ph) * TAU) * particle.sway) * W; py = Y + y * H; alpha = edge(y) * .9; size = base * .019 * particle.s * (.9 + .1 * Math.sin(phase * TAU)); }
      else if (kind === "petal") { const y = wrap(particle.y + phase); px = X + (particle.x + Math.sin((phase * 2 + particle.ph) * TAU) * particle.sway * 1.7) * W; py = Y + y * H; alpha = edge(y) * .85; size = base * .017 * particle.s; rotation = particle.rot + phase * TAU; }
      else if (kind === "snow") { const y = wrap(particle.y + phase * .6); px = X + (particle.x + Math.sin((phase + particle.ph) * TAU) * particle.sway * 1.3) * W; py = Y + y * H; alpha = edge(y) * .75; size = base * .011 * particle.s; }
      else if (kind === "bubble") { const y = wrap(particle.y - phase * .8); px = X + (particle.x + Math.sin((phase + particle.ph) * TAU) * particle.sway) * W; py = Y + y * H; alpha = edge(y) * .6; size = base * .024 * particle.s; }
      else if (kind === "ring") { px = X + particle.x * W; py = Y + particle.y * H; alpha = Math.sin(phase * Math.PI) * .5; size = base * (.012 + .085 * phase) * particle.s; }
      else { const y = wrap(particle.y - phase * .22); px = X + particle.x * W; py = Y + y * H; alpha = .12 + .11 * Math.sin(phase * TAU); size = base * .075 * particle.s * (.9 + .1 * Math.sin(phase * TAU + 1)); }
      c.globalAlpha = Math.max(0, Math.min(1, alpha));
      if (kind === "bokeh") { const gradient = c.createRadialGradient(px, py, 0, px, py, size); gradient.addColorStop(0, rgba(color, .8)); gradient.addColorStop(.5, rgba(color, .34)); gradient.addColorStop(1, rgba(color, 0)); c.fillStyle = gradient; c.beginPath(); c.arc(px, py, size, 0, TAU); c.fill(); }
      else if (kind === "ring") { c.strokeStyle = color; c.lineWidth = Math.max(1, size * .08); c.shadowColor = rgba(color, .8); c.shadowBlur = size * .4; c.beginPath(); c.arc(px, py, size, 0, TAU); c.stroke(); c.shadowBlur = 0; }
      else if (kind === "bubble") { c.strokeStyle = color; c.lineWidth = Math.max(1, size * .10); c.beginPath(); c.arc(px, py, size, 0, TAU); c.stroke(); c.fillStyle = rgba(color, .26); c.beginPath(); c.arc(px, py, size, 0, TAU); c.fill(); c.fillStyle = rgba("#ffffff", .7); c.beginPath(); c.arc(px - size * .32, py - size * .34, size * .17, 0, TAU); c.fill(); }
      else if (kind === "snow") { const gradient = c.createRadialGradient(px, py, 0, px, py, size * 1.9); gradient.addColorStop(0, rgba(color, .95)); gradient.addColorStop(.45, rgba(color, .55)); gradient.addColorStop(1, rgba(color, 0)); c.fillStyle = gradient; c.beginPath(); c.arc(px, py, size * 1.9, 0, TAU); c.fill(); }
      else { c.fillStyle = color; c.shadowColor = rgba(color, .9); c.shadowBlur = size * (kind === "glitter" ? 1.7 : 1.15); if (kind === "heart") heartPath(c, px, py, size); else if (kind === "petal") petalPath(c, px, py, size, rotation); else if (kind === "star") starPath(c, px, py, size, rotation); else if (kind === "glitter") { c.beginPath(); c.arc(px, py, size, 0, TAU); } else { c.save(); c.translate(px, py); c.rotate(rotation); sparklePath(c, 0, 0, size); c.restore(); } c.fill(); c.shadowBlur = 0; }
    }
    c.restore();
  }

  function drawFinish(c, scale) {
    if (state.finish === "none") return;
    const X = PHOTO.x * scale; const Y = PHOTO.y * scale; const W = PHOTO.w * scale; const H = PHOTO.h * scale;
    c.save(); c.beginPath(); c.rect(X, Y, W, H); c.clip();
    if (state.finish === "glow") { const gradient = c.createRadialGradient(X + W * .5, Y + H * .38, 0, X + W * .5, Y + H * .38, Math.max(W, H) * .75); gradient.addColorStop(0, "rgba(255,255,255,.30)"); gradient.addColorStop(.6, "rgba(255,246,250,.10)"); gradient.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gradient; c.fillRect(X, Y, W, H); }
    else if (state.finish === "leak") { const gradient = c.createLinearGradient(X + W, Y, X + W * .15, Y + H * .7); gradient.addColorStop(0, "rgba(255,170,205,.42)"); gradient.addColorStop(.45, "rgba(255,225,190,.20)"); gradient.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gradient; c.fillRect(X, Y, W, H); }
    else if (state.finish === "vignette") { const gradient = c.createRadialGradient(X + W * .5, Y + H * .5, Math.min(W, H) * .34, X + W * .5, Y + H * .5, Math.max(W, H) * .72); gradient.addColorStop(0, "rgba(92,69,80,0)"); gradient.addColorStop(1, "rgba(92,69,80,.30)"); c.fillStyle = gradient; c.fillRect(X, Y, W, H); }
    else if (state.finish === "dream") { const gradient = c.createLinearGradient(X, Y, X + W, Y + H); gradient.addColorStop(0, "rgba(255,196,224,.26)"); gradient.addColorStop(.5, "rgba(255,255,255,.06)"); gradient.addColorStop(1, "rgba(198,214,255,.26)"); c.fillStyle = gradient; c.fillRect(X, Y, W, H); }
    c.restore();
  }

  function drawPattern(c, scale) {
    if (state.pattern === "none") return;
    const W = CARD_W * scale; const H = CARD_H * scale;
    c.save(); c.beginPath(); roundRect(c, 0, 0, W, H, 8 * scale); c.rect(PHOTO.x * scale, PHOTO.y * scale, PHOTO.w * scale, PHOTO.h * scale); c.clip("evenodd"); c.fillStyle = state.patternColor;
    if (state.pattern === "dots") { const grid = 28 * scale; c.globalAlpha = .8; for (let y = grid / 2; y < H; y += grid) for (let x = ((Math.round(y / grid) % 2) ? grid / 2 : 0) + grid / 2; x < W; x += grid) { c.beginPath(); c.arc(x, y, 1.8 * scale, 0, Math.PI * 2); c.fill(); } }
    else if (state.pattern === "gingham") { const block = 22 * scale; c.globalAlpha = .32; for (let x = 0; x < W; x += block * 2) c.fillRect(x, 0, block, H); for (let y = 0; y < H; y += block * 2) c.fillRect(0, y, W, block); }
    else if (state.pattern === "hearts") { const grid = 40 * scale; c.globalAlpha = .72; for (let y = grid / 2; y < H; y += grid) for (let x = ((Math.round(y / grid) % 2) ? grid / 2 : 0) + grid / 2; x < W; x += grid) { heartPath(c, x, y, 3.2 * scale); c.fill(); } }
    else { const gradient = wideDir() === "v" ? c.createLinearGradient(0, H, 0, H * .42) : c.createLinearGradient(W, 0, W * .42, 0); gradient.addColorStop(0, rgba(state.patternColor, .95)); gradient.addColorStop(1, rgba(state.patternColor, 0)); c.fillStyle = gradient; c.fillRect(0, 0, W, H); }
    c.restore();
  }

  function drawTextItem(c, item, scale) {
    c.save(); c.translate(item.x * scale, item.y * scale); c.rotate(item.rot);
    const fontSize = item.size * scale; c.font = `${item.bold ? 800 : 400} ${fontSize}px "${item.font}", "Nanum Pen Script", sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    const lines = (item.text || " ").split("\n"); const lineHeight = fontSize * 1.16; let width = 0; for (const line of lines) width = Math.max(width, c.measureText(line).width); const height = lineHeight * lines.length;
    item._w = Math.max(width, fontSize * .6) / scale; item._h = height / scale;
    lines.forEach((line, index) => { const y = (index - (lines.length - 1) / 2) * lineHeight; c.save();
      if (item.fx === "shadow") { c.shadowColor = item.sub; c.shadowBlur = fontSize * .05; c.shadowOffsetX = fontSize * .045; c.shadowOffsetY = fontSize * .055; c.fillStyle = item.color; c.fillText(line, 0, y); }
      else if (item.fx === "outline") { c.lineJoin = "round"; c.miterLimit = 2; c.lineWidth = fontSize * .15; c.strokeStyle = item.sub; c.strokeText(line, 0, y); c.fillStyle = item.color; c.fillText(line, 0, y); }
      else if (item.fx === "neon") { c.shadowColor = item.color; c.fillStyle = item.color; c.shadowBlur = fontSize * .95; c.fillText(line, 0, y); c.fillText(line, 0, y); c.shadowBlur = fontSize * .48; c.fillText(line, 0, y); c.shadowBlur = fontSize * .24; c.fillStyle = "#ffffff"; c.fillText(line, 0, y); c.shadowBlur = fontSize * .10; c.fillText(line, 0, y); }
      else if (item.fx === "gradient") { const gradient = c.createLinearGradient(-width / 2, 0, width / 2, 0); gradient.addColorStop(0, item.color); gradient.addColorStop(.5, "#ffd6e6"); gradient.addColorStop(1, item.sub); c.fillStyle = gradient; c.fillText(line, 0, y); }
      else if (item.fx === "pop") { c.lineJoin = "round"; c.lineWidth = fontSize * .32; c.strokeStyle = item.sub; c.strokeText(line, 0, y); c.lineWidth = fontSize * .14; c.strokeStyle = item.color; c.strokeText(line, 0, y); c.fillStyle = item.color; c.fillText(line, 0, y); }
      else { c.fillStyle = item.color; c.fillText(line, 0, y); }
      c.restore();
    });
    c.restore();
  }

  function drawImageItem(c, item, scale) {
    const image = stickerImgs[item.img]; if (!image || !image.naturalWidth) return;
    const width = item.size; const height = item.size * (image.naturalHeight / image.naturalWidth); item._w = width; item._h = height;
    c.save(); c.translate(item.x * scale, item.y * scale); c.rotate(item.rot); if (item.flip) c.scale(-1, 1); c.globalAlpha = item.opacity == null ? 1 : item.opacity; c.drawImage(image, -width / 2 * scale, -height / 2 * scale, width * scale, height * scale); c.restore();
  }

  function renderTo(c, scale, showSelection, time = 0) {
    c.save(); c.clearRect(0, 0, CARD_W * scale, CARD_H * scale); roundRect(c, 0, 0, CARD_W * scale, CARD_H * scale, 8 * scale); c.fillStyle = state.frameColor; c.fill(); drawPattern(c, scale);
    c.save(); c.beginPath(); c.rect(PHOTO.x * scale, PHOTO.y * scale, PHOTO.w * scale, PHOTO.h * scale); c.clip();
    if (state.photo) { const photo = state.photo; c.save(); c.translate(photo.x * scale, photo.y * scale); c.rotate(photo.rot); c.scale(photo.flip ? -1 : 1, 1); const filter = FILTERS.find((item) => item[0] === state.filter); if (filter?.[2]) c.filter = filter[2]; const width = photo.img.naturalWidth * photo.scale * scale; const height = photo.img.naturalHeight * photo.scale * scale; c.drawImage(photo.img, -width / 2, -height / 2, width, height); c.restore(); }
    else { c.fillStyle = "#fbf3f7"; c.fillRect(PHOTO.x * scale, PHOTO.y * scale, PHOTO.w * scale, PHOTO.h * scale); c.fillStyle = "#e2cbd8"; c.font = `${20 * scale}px "Pretendard Variable", Pretendard, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("일러스트를 올려주세요", (PHOTO.x + PHOTO.w / 2) * scale, (PHOTO.y + PHOTO.h / 2) * scale); }
    drawFinish(c, scale); drawMotion(c, scale, time); c.restore();
    if (state.innerEdge === "thin") { c.save(); c.lineWidth = 1.2 * scale; c.strokeStyle = isDark(state.frameColor) ? "rgba(255,255,255,.20)" : "rgba(92,69,80,.10)"; c.strokeRect(PHOTO.x * scale, PHOTO.y * scale, PHOTO.w * scale, PHOTO.h * scale); c.restore(); }
    else if (state.innerEdge === "shadow") { c.save(); const gradient = c.createLinearGradient(0, PHOTO.y * scale, 0, (PHOTO.y + 46) * scale); gradient.addColorStop(0, "rgba(92,69,80,.13)"); gradient.addColorStop(1, "rgba(92,69,80,0)"); c.fillStyle = gradient; c.fillRect(PHOTO.x * scale, PHOTO.y * scale, PHOTO.w * scale, 46 * scale); c.restore(); }
    c.save(); roundRect(c, 0, 0, CARD_W * scale, CARD_H * scale, 8 * scale); c.clip(); c.drawImage(scale === S ? buildInk(scale) : buildInkAt(scale), 0, 0); c.restore();
    for (const item of state.items) { if (item.type === "image") drawImageItem(c, item, scale); else drawTextItem(c, item, scale); }
    if (showSelection && state.selected) { const item = state.selected; const pad = 10; const halfWidth = item._w / 2 + pad; const halfHeight = item._h / 2 + pad; c.save(); c.translate(item.x * scale, item.y * scale); c.rotate(item.rot); c.strokeStyle = "#ff5c8a"; c.lineWidth = 1.4 * scale; c.setLineDash([5 * scale, 4 * scale]); c.strokeRect(-halfWidth * scale, -halfHeight * scale, halfWidth * 2 * scale, halfHeight * 2 * scale); c.setLineDash([]); c.fillStyle = "#ff5c8a"; c.beginPath(); c.arc(halfWidth * scale, halfHeight * scale, 7 * scale, 0, Math.PI * 2); c.fill(); c.fillStyle = "#fff"; c.strokeStyle = "#ff5c8a"; c.lineWidth = 1.4 * scale; c.beginPath(); c.arc(-halfWidth * scale, -halfHeight * scale, 7 * scale, 0, Math.PI * 2); c.fill(); c.stroke(); c.strokeStyle = "#ff5c8a"; c.lineWidth = 1.8 * scale; c.lineCap = "round"; c.beginPath(); c.moveTo(-halfWidth * scale - 3 * scale, -halfHeight * scale - 3 * scale); c.lineTo(-halfWidth * scale + 3 * scale, -halfHeight * scale + 3 * scale); c.moveTo(-halfWidth * scale + 3 * scale, -halfHeight * scale - 3 * scale); c.lineTo(-halfWidth * scale - 3 * scale, -halfHeight * scale + 3 * scale); c.stroke(); c.restore(); }
    c.restore();
  }

  function stopAnimation() {
    if (animRAF) cancelAnimationFrame(animRAF);
    if (rafId) cancelAnimationFrame(rafId);
    animRAF = null; rafId = null; animT = 0; lastTS = 0; lastDraw = 0;
  }

  function tickAnimation(timestamp) {
    if (!active()) { stopAnimation(); return; }
    animRAF = requestAnimationFrame(tickAnimation); if (!lastTS) lastTS = timestamp; animT = (animT + (timestamp - lastTS) / 5200) % 1; lastTS = timestamp; if (timestamp - lastDraw < 33) return; lastDraw = timestamp; renderTo(ctx, S, true, animT);
  }

  function updateAnimation() {
    const isAnimated = ANIMATED.has(state.motion);
    if (isAnimated && !animRAF) { lastTS = 0; animRAF = requestAnimationFrame(tickAnimation); }
    else if (!isAnimated && animRAF) { cancelAnimationFrame(animRAF); animRAF = null; animT = 0; render(); }
  }

  function render() {
    if (!active() || animRAF || rafId) return;
    rafId = requestAnimationFrame(() => { rafId = null; if (active()) renderTo(ctx, S, true, animT); });
  }

  function toCard(event) {
    const rect = cv.getBoundingClientRect(); return { x: (event.clientX - rect.left) / rect.width * CARD_W, y: (event.clientY - rect.top) / rect.height * CARD_H };
  }

  function localOf(item, point) { const dx = point.x - item.x; const dy = point.y - item.y; const angle = -item.rot; return { x: dx * Math.cos(angle) - dy * Math.sin(angle), y: dx * Math.sin(angle) + dy * Math.cos(angle) }; }
  function hitItem(point) { for (let i = state.items.length - 1; i >= 0; i -= 1) { const item = state.items[i]; const local = localOf(item, point); if (Math.abs(local.x) <= item._w / 2 + 12 && Math.abs(local.y) <= item._h / 2 + 12) return item; } return null; }
  function handleHit(point) { const item = state.selected; if (!item) return null; const local = localOf(item, point); const halfWidth = item._w / 2 + 10; const halfHeight = item._h / 2 + 10; if (Math.hypot(local.x - halfWidth, local.y - halfHeight) < 18) return "resize"; if (Math.hypot(local.x + halfWidth, local.y + halfHeight) < 18) return "delete"; return null; }

  function snapshot() { return JSON.stringify({ strokes: state.strokes, items: state.items.map((item) => ({ ...item })), photo: state.photo ? { x: state.photo.x, y: state.photo.y, scale: state.photo.scale, rot: state.photo.rot, flip: state.photo.flip } : null }); }
  function pushHistory() { state.history.push(snapshot()); if (state.history.length > 40) state.history.shift(); }
  function undo() { const item = state.history.pop(); if (!item) { toast("되돌릴 게 없어요"); return; } const restored = JSON.parse(item); state.strokes = restored.strokes; state.items = restored.items; inkDirty = true; if (restored.photo && state.photo) Object.assign(state.photo, restored.photo); state.selected = null; render(); }

  function clampPhoto() {
    const photo = state.photo; if (!photo) return;
    const cos = Math.abs(Math.cos(photo.rot)); const sin = Math.abs(Math.sin(photo.rot)); const halfWidth = PHOTO.w / 2; const halfHeight = PHOTO.h / 2; const needX = halfWidth * cos + halfHeight * sin; const needY = halfWidth * sin + halfHeight * cos;
    const minScale = Math.max(2 * needX / photo.img.naturalWidth, 2 * needY / photo.img.naturalHeight); if (photo.scale < minScale) photo.scale = minScale;
    const width = photo.img.naturalWidth * photo.scale; const height = photo.img.naturalHeight * photo.scale; const centerX = PHOTO.x + PHOTO.w / 2; const centerY = PHOTO.y + PHOTO.h / 2; const ux = Math.cos(photo.rot); const uy = Math.sin(photo.rot); let dx = centerX - photo.x; let dy = centerY - photo.y; let a = dx * ux + dy * uy; let b = -dx * uy + dy * ux; const limitA = Math.max(0, width / 2 - needX); const limitB = Math.max(0, height / 2 - needY); a = Math.max(-limitA, Math.min(limitA, a)); b = Math.max(-limitB, Math.min(limitB, b)); dx = a * ux - b * uy; dy = a * uy + b * ux; photo.x = centerX - dx; photo.y = centerY - dy;
  }

  function syncPhotoUI() {
    if (!state.photo) return;
    const zoom = ui("zoom"); const zoomValue = ui("zoomVal"); const rotation = ui("rot"); const rotationValue = ui("rotVal"); if (!zoom || !rotation) return;
    const percent = Math.round(state.photo.scale * 100); zoom.value = Math.max(10, Math.min(400, percent)); zoomValue.textContent = `${percent}%`; let degrees = Math.round(state.photo.rot * 180 / Math.PI) % 360; if (degrees > 180) degrees -= 360; if (degrees < -180) degrees += 360; rotation.value = degrees; rotationValue.textContent = `${degrees}°`;
  }

  function fitPhoto() { const photo = state.photo; if (!photo) return; photo.rot = 0; photo.flip = false; photo.scale = Math.max(PHOTO.w / photo.img.naturalWidth, PHOTO.h / photo.img.naturalHeight); photo.x = PHOTO.x + PHOTO.w / 2; photo.y = PHOTO.y + PHOTO.h / 2; clampPhoto(); syncPhotoUI(); render(); }
  function centerPhoto() { const photo = state.photo; if (!photo) return; photo.x = PHOTO.x + PHOTO.w / 2; photo.y = PHOTO.y + PHOTO.h / 2; clampPhoto(); syncPhotoUI(); render(); }
  function loadImage(source) { const image = new Image(); image.onload = () => { state.photo = { img: image, x: PHOTO.x + PHOTO.w / 2, y: PHOTO.y + PHOTO.h / 2, scale: 1, rot: 0, flip: false }; fitPhoto(); hint("드래그로 옮기고, 휠이나 두 손가락으로 크기를 맞춰보세요"); toast("일러스트를 올렸어요"); }; image.onerror = () => toast("이 이미지는 읽지 못했어요"); image.src = source; }
  function readFile(file) { if (!file || !file.type.startsWith("image/")) { toast("이미지 파일만 올릴 수 있어요"); return; } const reader = new FileReader(); reader.onload = () => loadImage(reader.result); reader.readAsDataURL(file); }

  function selectItem(item) {
    state.selected = item;
    if (item?.type === "image") { state.sticker.size = item.size; state.sticker.opacity = item.opacity == null ? 1 : item.opacity; ui("stSize").value = Math.round(Math.min(400, item.size)); ui("stSizeVal").textContent = Math.round(item.size); ui("stOpacity").value = Math.round(state.sticker.opacity * 100); ui("stOpacityVal").textContent = `${Math.round(state.sticker.opacity * 100)}%`; }
    else if (item) { ui("textInput").value = item.text; ui("fontSel").value = item.font; Object.assign(state.text, { font: item.font, fx: item.fx, color: item.color, sub: item.sub, size: item.size, bold: !!item.bold }); ui("textSize").value = Math.round(Math.min(140, item.size)); ui("textSizeVal").textContent = Math.round(item.size); markPressed("fxChips", item.fx); markPressed("textSwatches", item.color); markPressed("subSwatches", item.sub); markPressed("weights", item.bold ? "bold" : "normal"); updateSubLabel(); }
    render();
  }

  function removeItem(item) { const index = state.items.indexOf(item); if (index > -1) { pushHistory(); state.items.splice(index, 1); } state.selected = null; render(); }
  function addTextItem() { const text = ui("textInput").value.trim(); if (!text) { toast("문구를 먼저 적어주세요"); ui("textInput").focus(); return; } pushHistory(); const item = { type: "text", text, font: state.text.font, fx: state.text.fx, color: state.text.color, sub: state.text.sub, size: state.text.size, bold: state.text.bold, x: PHOTO.x + PHOTO.w / 2, y: PHOTO.y + PHOTO.h * .78, rot: Math.random() * .12 - .06, _w: 100, _h: 40 }; state.items.push(item); selectItem(item); hint("글씨를 끌어 옮기고, 모서리 점으로 크기와 각도를 맞춰보세요"); }

  function markPressed(id, value) { const box = ui(id); if (!box) return; [...box.children].forEach((element) => element.setAttribute("aria-pressed", String(element.dataset.val === value))); }
  function makeChips(id, list, current, onPick) { const box = ui(id); if (!box) return; box.innerHTML = ""; list.forEach(([value, label]) => { const button = document.createElement("button"); button.className = "cheki-option"; button.type = "button"; button.textContent = label; button.dataset.val = value; button.setAttribute("aria-pressed", String(value === current)); button.onclick = () => { markPressed(id, value); onPick(value); }; box.appendChild(button); }); }
  function makeSwatches(id, colors, current, onPick) { const box = ui(id); if (!box) return; box.innerHTML = ""; colors.forEach((color) => { const button = document.createElement("button"); button.className = "cheki-color-swatch"; button.type = "button"; button.style.background = color; button.dataset.val = color; button.title = color; button.setAttribute("aria-pressed", String(color === current)); button.onclick = () => { markPressed(id, color); onPick(color); }; box.appendChild(button); }); const input = document.createElement("input"); input.className = "cheki-color-input"; input.type = "color"; input.value = current; input.title = "직접 고르기"; input.oninput = (event) => { markPressed(id, "__custom__"); onPick(event.target.value); }; box.appendChild(input); }

  function updateSubLabel() { const label = ui("colorLabel"); const field = ui("subColorField"); const subLabel = ui("subColorLabel"); if (!label || !field) return; label.textContent = state.text.fx === "neon" ? "네온 빛 색" : "글자색"; const next = { outline: "테두리색", shadow: "그림자색", gradient: "끝 색", pop: "테두리색" }[state.text.fx]; field.style.display = next ? "" : "none"; if (next) subLabel.textContent = next; }

  function renderStickerGrid() { const grid = ui("stGrid"); if (!grid) return; grid.innerHTML = ""; stickerImgs.forEach((image, index) => { if (!image) return; const thumb = document.createElement("div"); thumb.className = "cheki-sticker-thumb"; thumb.setAttribute("role", "button"); thumb.tabIndex = 0; thumb.title = "붙이기"; thumb.onkeydown = (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); addSticker(index); } }; const picture = document.createElement("img"); picture.src = image.src; picture.alt = ""; thumb.appendChild(picture); thumb.onclick = () => addSticker(index); const remove = document.createElement("button"); remove.className = "x"; remove.type = "button"; remove.textContent = "×"; remove.title = "목록에서 빼기"; remove.onclick = (event) => { event.stopPropagation(); pushHistory(); state.items = state.items.filter((item) => !(item.type === "image" && item.img === index)); stickerImgs[index] = null; if (state.selected && !state.items.includes(state.selected)) state.selected = null; renderStickerGrid(); render(); }; thumb.appendChild(remove); grid.appendChild(thumb); }); ui("stGridField").style.display = grid.children.length ? "" : "none"; }
  function addSticker(index) { const image = stickerImgs[index]; if (!image) return; pushHistory(); const item = { type: "image", img: index, size: state.sticker.size, opacity: state.sticker.opacity, x: PHOTO.x + PHOTO.w / 2, y: PHOTO.y + PHOTO.h / 2, rot: Math.random() * .14 - .07, flip: false, _w: 100, _h: 100 }; state.items.push(item); selectItem(item); hint("스티커를 끌어 옮기고, 모서리 점으로 크기와 각도를 맞춰보세요"); }
  function readSticker(file) { if (!file || !file.type.startsWith("image/")) { toast("이미지 파일만 올릴 수 있어요"); return; } const reader = new FileReader(); reader.onload = () => { const image = new Image(); image.onload = () => { const index = stickerImgs.length; stickerImgs.push(image); renderStickerGrid(); addSticker(index); toast("스티커를 붙였어요"); }; image.onerror = () => toast("이 이미지는 읽지 못했어요"); image.src = reader.result; }; reader.readAsDataURL(file); }

  function setTool(tool) {
    state.tool = tool; ui("chekiTool").value = tool; cv.classList.toggle("drawing", tool === "draw");
    if (tool === "draw") { state.selected = null; hint("카드 위 어디든 싸인을 남겨보세요"); } else if (tool === "text") hint("문구를 적고 글씨 올리기를 눌러주세요"); else if (tool === "sticker") hint("이미지를 올리면 카드 위에 붙일 수 있어요"); else if (tool === "effect") hint("반짝임을 고르면 미리보기가 움직입니다"); else if (tool === "frame") hint("프레임 색과 무늬를 골라보세요"); else hint(state.photo ? "드래그로 옮기고 휠로 크기를 맞춰보세요" : "사진 탭에서 일러스트를 올려주세요"); render();
  }

  function changeOrientation(value) {
    const config = value === "landscape" ? LANDSCAPE : PORTRAIT; const oldWidth = CARD_W; const oldHeight = CARD_H; CARD_W = config.cw; CARD_H = config.ch; PHOTO = { ...config.p }; cv.width = CARD_W * S; cv.height = CARD_H * S; shell.style.width = config.shell; const kx = CARD_W / oldWidth; const ky = CARD_H / oldHeight; state.items.forEach((item) => { item.x *= kx; item.y *= ky; }); state.strokes.forEach((stroke) => stroke.points.forEach((point) => { point.x *= kx; point.y *= ky; })); inkDirty = true; if (state.photo) fitPhoto(); render();
  }

  function bindCanvas() {
    cv.addEventListener("pointerdown", (event) => { cv.setPointerCapture(event.pointerId); const point = toCard(event); pointers.set(event.pointerId, point); if (pointers.size === 2 && state.tool !== "draw" && state.photo && !(drag && drag.mode !== "photo")) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), scale: state.photo.scale, rot: state.photo.rot, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, px: state.photo.x, py: state.photo.y }; drag = null; curStroke = null; return; } if (pointers.size > 1) return; if (state.tool === "draw") { pushHistory(); curStroke = { type: state.brush.type, color: state.brush.color, size: state.brush.size, points: [point] }; state.strokes.push(curStroke); inkDirty = true; render(); return; } const handle = handleHit(point); if (handle === "delete") { removeItem(state.selected); return; } if (handle === "resize") { const item = state.selected; drag = { mode: "resize", item, d0: Math.hypot(point.x - item.x, point.y - item.y), s0: item.size, a0: Math.atan2(point.y - item.y, point.x - item.x), r0: item.rot }; return; } const item = hitItem(point); if (item) { selectItem(item); drag = { mode: "move", item, dx: point.x - item.x, dy: point.y - item.y }; return; } selectItem(null); if (state.photo) drag = { mode: "photo", dx: point.x - state.photo.x, dy: point.y - state.photo.y }; });
    cv.addEventListener("pointermove", (event) => { if (!pointers.has(event.pointerId)) return; const point = toCard(event); pointers.set(event.pointerId, point); if (pinch && pointers.size === 2) { const [a, b] = [...pointers.values()]; const distance = Math.hypot(a.x - b.x, a.y - b.y); const angle = Math.atan2(b.y - a.y, b.x - a.x); const centerX = (a.x + b.x) / 2; const centerY = (a.y + b.y) / 2; state.photo.scale = Math.max(.02, pinch.scale * (distance / pinch.d)); state.photo.rot = pinch.rot + (angle - pinch.ang); state.photo.x = pinch.px + (centerX - pinch.cx); state.photo.y = pinch.py + (centerY - pinch.cy); clampPhoto(); syncPhotoUI(); render(); return; } if (curStroke) { const last = curStroke.points.at(-1); if (Math.hypot(point.x - last.x, point.y - last.y) > 1.1) { curStroke.points.push(point); inkDirty = true; render(); } return; } if (!drag) return; if (drag.mode === "photo") { state.photo.x = point.x - drag.dx; state.photo.y = point.y - drag.dy; clampPhoto(); render(); } else if (drag.mode === "move") { drag.item.x = point.x - drag.dx; drag.item.y = point.y - drag.dy; render(); } else if (drag.mode === "resize") { const item = drag.item; const distance = Math.hypot(point.x - item.x, point.y - item.y); item.size = Math.max(8, Math.min(400, drag.s0 * (distance / Math.max(6, drag.d0)))); item.rot = drag.r0 + (Math.atan2(point.y - item.y, point.x - item.x) - drag.a0); if (item.type === "image") { ui("stSize").value = Math.round(Math.min(400, item.size)); ui("stSizeVal").textContent = Math.round(item.size); } else { ui("textSize").value = Math.round(Math.min(140, item.size)); ui("textSizeVal").textContent = Math.round(item.size); } render(); } });
    const endPointer = (event) => { pointers.delete(event.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) { drag = null; curStroke = null; } }; cv.addEventListener("pointerup", endPointer); cv.addEventListener("pointercancel", endPointer);
    cv.addEventListener("wheel", (event) => { if (!state.photo || state.tool === "draw") return; event.preventDefault(); const point = toCard(event); const photo = state.photo; const nextScale = Math.max(.02, Math.min(12, photo.scale * (event.deltaY < 0 ? 1.08 : 1 / 1.08))); const factor = nextScale / photo.scale; photo.x = point.x - (point.x - photo.x) * factor; photo.y = point.y - (point.y - photo.y) * factor; photo.scale = nextScale; clampPhoto(); syncPhotoUI(); render(); }, { passive: false });
  }

  function bindControls() {
    const toolInput = ui("chekiTool");
    toolInput.value = state.tool;
    toolInput.onchange = (event) => setTool(event.target.value);
    makeChips("filters", FILTERS.map((filter) => [filter[0], filter[1]]), "none", (value) => { state.filter = value; render(); });
    ui("file").onchange = (event) => { readFile(event.target.files[0]); event.target.value = ""; };
    ui("zoom").oninput = (event) => { if (!state.photo) { toast("먼저 일러스트를 올려주세요"); return; } state.photo.scale = +event.target.value / 100; clampPhoto(); syncPhotoUI(); render(); }; ui("rot").oninput = (event) => { if (!state.photo) return; state.photo.rot = +event.target.value * Math.PI / 180; clampPhoto(); syncPhotoUI(); render(); }; ui("flipBtn").onclick = () => { if (state.photo) { state.photo.flip = !state.photo.flip; render(); } }; ui("fillBtn").onclick = () => state.photo ? centerPhoto() : toast("먼저 일러스트를 올려주세요"); ui("resetPhotoBtn").onclick = () => { if (!state.photo) { toast("먼저 일러스트를 올려주세요"); return; } fitPhoto(); toast("사진을 처음 상태로 되돌렸어요"); };
    makeChips("brushTypes", BRUSHES, "pen", (value) => { state.brush.type = value; }); makeSwatches("inkSwatches", INK_COLORS, state.brush.color, (color) => { state.brush.color = color; }); ui("brushSize").oninput = (event) => { state.brush.size = +event.target.value; ui("brushSizeVal").textContent = event.target.value; }; ui("undoStroke").onclick = () => { if (state.strokes.length) { pushHistory(); state.strokes.pop(); inkDirty = true; render(); } else toast("지울 획이 없어요"); }; ui("clearInk").onclick = () => { if (state.strokes.length) { pushHistory(); state.strokes = []; inkDirty = true; render(); toast("싸인을 지웠어요"); } };
    const font = ui("fontSel"); font.innerHTML = ""; FONTS.forEach(([value, label]) => { const option = document.createElement("option"); option.value = value; option.textContent = label; option.style.fontFamily = `"${value}", sans-serif`; if (value === "Dongle") option.style.fontSize = "19px"; font.appendChild(option); }); font.value = state.text.font; font.onchange = (event) => { state.text.font = event.target.value; if (state.selected && state.selected.type !== "image") { state.selected.font = event.target.value; render(); } }; makeChips("weights", [["normal", "보통"], ["bold", "두껍게"]], "normal", (value) => { state.text.bold = value === "bold"; if (state.selected && state.selected.type !== "image") { state.selected.bold = state.text.bold; render(); } }); makeChips("fxChips", FX, "none", (value) => { state.text.fx = value; updateSubLabel(); if (state.selected && state.selected.type !== "image") { state.selected.fx = value; render(); } }); makeSwatches("textSwatches", TEXT_COLORS, state.text.color, (color) => { state.text.color = color; if (state.selected && state.selected.type !== "image") { state.selected.color = color; render(); } }); makeSwatches("subSwatches", SUB_COLORS, state.text.sub, (color) => { state.text.sub = color; if (state.selected && state.selected.type !== "image") { state.selected.sub = color; render(); } }); ui("textSize").oninput = (event) => { state.text.size = +event.target.value; ui("textSizeVal").textContent = event.target.value; if (state.selected && state.selected.type !== "image") { state.selected.size = +event.target.value; render(); } }; ui("textInput").oninput = (event) => { if (state.selected && state.selected.type !== "image") { state.selected.text = event.target.value || " "; render(); } }; ui("addText").onclick = addTextItem; ui("delItem").onclick = () => state.selected ? removeItem(state.selected) : toast("먼저 지울 글씨를 눌러주세요"); ui("clearItems").onclick = () => { if (state.items.length) { pushHistory(); state.items = []; state.selected = null; render(); toast("글씨를 모두 지웠어요"); } }; updateSubLabel();
    makeSwatches("frameSwatches", FRAME_COLORS, state.frameColor, (color) => { state.frameColor = color; render(); }); makeChips("patterns", PATTERNS, "none", (value) => { state.pattern = value; render(); }); makeSwatches("patSwatches", PAT_COLORS, state.patternColor, (color) => { state.patternColor = color; render(); }); makeChips("innerEdge", [["none", "없음"], ["thin", "얇게"], ["shadow", "그림자"]], "thin", (value) => { state.innerEdge = value; render(); }); makeChips("orient", [["portrait", "세로"], ["landscape", "가로"]], "portrait", changeOrientation); makeChips("quality", [["2", "보통"], ["3", "고화질"], ["4", "최고"]], "3", (value) => { state.quality = +value; });
    ui("stFile").onchange = (event) => { [...event.target.files].forEach(readSticker); event.target.value = ""; }; ui("stSize").oninput = (event) => { state.sticker.size = +event.target.value; ui("stSizeVal").textContent = event.target.value; if (state.selected?.type === "image") { state.selected.size = +event.target.value; render(); } }; ui("stOpacity").oninput = (event) => { state.sticker.opacity = +event.target.value / 100; ui("stOpacityVal").textContent = `${event.target.value}%`; if (state.selected?.type === "image") { state.selected.opacity = state.sticker.opacity; render(); } }; ui("stFlip").onclick = () => { if (!state.selected || state.selected.type !== "image") { toast("먼저 스티커를 눌러주세요"); return; } state.selected.flip = !state.selected.flip; render(); }; ui("stDel").onclick = () => { if (!state.selected || state.selected.type !== "image") { toast("먼저 스티커를 눌러주세요"); return; } removeItem(state.selected); };
    makeChips("motions", MOTIONS, "none", (value) => { state.motion = value; pKey = ""; updateAnimation(); render(); }); makeSwatches("fxSwatches", FX_COLORS, state.fxColor, (color) => { state.fxColor = color; render(); }); ui("fxCount").oninput = (event) => { state.fxCount = +event.target.value; ui("fxCountVal").textContent = event.target.value; pKey = ""; render(); }; makeChips("finishes", FINISHES, "none", (value) => { state.finish = value; render(); });
    ui("undoBtn").onclick = undo; ui("gifBtn").onclick = saveGif;
  }

  function outputCanvas(scale = state.quality) { const output = document.createElement("canvas"); output.width = CARD_W * scale; output.height = CARD_H * scale; renderTo(output.getContext("2d"), scale, false); return output; }
  function savePng(filename = "") { const output = outputCanvas(); const date = new Date(); const pad = (value) => String(value).padStart(2, "0"); const link = document.createElement("a"); link.download = filename || `cheki_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}.png`; link.href = output.toDataURL("image/png"); link.click(); toast("체키를 저장했어요"); return true; }
  function standaloneHtml(label = "Cheki") { const image = outputCanvas(2).toDataURL("image/png"); return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${label} Card</title><style>html,body{min-height:100%;margin:0}body{display:grid;min-height:100vh;place-items:center;background:#f3f4f6;padding:24px;box-sizing:border-box}img{display:block;max-width:100%;height:auto;box-shadow:0 14px 36px rgba(0,0,0,.16)}</style></head><body><img src="${image}" width="${CARD_W}" height="${CARD_H}" alt="${label}"></body></html>`; }
  async function loadGifLib() { if (window.CardStudioChekiGif) return window.CardStudioChekiGif; await new Promise((resolve, reject) => { const script = document.createElement("script"); script.src = "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js"; script.onload = resolve; script.onerror = () => reject(new Error("script")); document.head.appendChild(script); }); const worker = await (await fetch("https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js")).text(); window.CardStudioChekiGif = { worker: URL.createObjectURL(new Blob([worker], { type: "application/javascript" })) }; return window.CardStudioChekiGif; }
  async function saveGif() { if (busy) return; if (!ANIMATED.has(state.motion)) { toast("효과 탭에서 움직이는 효과를 먼저 골라주세요"); return; } const button = ui("gifBtn"); const label = button.textContent; busy = true; button.classList.add("busy"); button.textContent = "만드는 중 0%"; try { const lib = await loadGifLib(); const width = Math.round(CARD_W * state.gifScale); const height = Math.round(CARD_H * state.gifScale); const layer = document.createElement("canvas"); layer.width = width; layer.height = height; const output = document.createElement("canvas"); output.width = width; output.height = height; const layerCtx = layer.getContext("2d"); const outputCtx = output.getContext("2d"); const gif = new GIF({ workers: 2, quality: 8, width, height, workerScript: lib.worker, dither: false }); const delay = Math.round(2600 / state.gifFrames); for (let i = 0; i < state.gifFrames; i += 1) { layerCtx.setTransform(1, 0, 0, 1, 0, 0); renderTo(layerCtx, state.gifScale, false, i / state.gifFrames); outputCtx.fillStyle = "#ffffff"; outputCtx.fillRect(0, 0, width, height); outputCtx.drawImage(layer, 0, 0); gif.addFrame(outputCtx, { copy: true, delay }); } const blob = await new Promise((resolve, reject) => { gif.on("progress", (value) => { button.textContent = `만드는 중 ${Math.round(value * 100)}%`; }); gif.on("finished", resolve); gif.on("abort", () => reject(new Error("abort"))); gif.render(); }); const date = new Date(); const pad = (value) => String(value).padStart(2, "0"); const link = document.createElement("a"); link.download = `cheki_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}.gif`; link.href = URL.createObjectURL(blob); link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 4000); toast("GIF를 저장했어요"); } catch (_) { toast("GIF를 만들지 못했어요. 잠시 후 다시 시도해 주세요"); } finally { busy = false; if (active()) { button.classList.remove("busy"); button.textContent = label; } } }

  function reset() { Object.assign(state, makeState()); CARD_W = PORTRAIT.cw; CARD_H = PORTRAIT.ch; PHOTO = { ...PORTRAIT.p }; stickerImgs.length = 0; inkDirty = true; pKey = ""; if (cv) { cv.width = CARD_W * S; cv.height = CARD_H * S; shell.style.width = PORTRAIT.shell; } updateAnimation(); if (active()) { bindControls(); renderStickerGrid(); hint("사진 탭에서 일러스트를 올려주세요"); render(); toast("처음 상태로 돌아왔어요"); } }

  function bindGlobalEvents() {
    document.addEventListener("dragover", (event) => { if (active()) event.preventDefault(); }); document.addEventListener("drop", (event) => { if (!active()) return; event.preventDefault(); const files = event.dataTransfer.files; if (!files?.[0]) return; if (state.tool === "sticker") [...files].forEach(readSticker); else readFile(files[0]); }); document.addEventListener("paste", (event) => { if (!active()) return; for (const item of event.clipboardData?.items || []) if (item.type.startsWith("image/")) { if (state.tool === "sticker") readSticker(item.getAsFile()); else readFile(item.getAsFile()); break; } }); document.addEventListener("keydown", (event) => { if (!active() || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return; if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undo(); } if ((event.key === "Delete" || event.key === "Backspace") && state.selected) { event.preventDefault(); removeItem(state.selected); } if (event.key === "Escape") selectItem(null); });
  }

  let globalsBound = false;
  function mount() {
    const nextCanvas = document.querySelector("[data-cheki-card] #cheki");
    if (!nextCanvas) { cv = null; ctx = null; shell = null; stopAnimation(); return; }
    if (cv === nextCanvas) return;
    cv = nextCanvas; ctx = cv.getContext("2d"); shell = ui("cardShell"); cv.width = CARD_W * S; cv.height = CARD_H * S; shell.style.width = CARD_W === LANDSCAPE.cw ? LANDSCAPE.shell : PORTRAIT.shell;
    bindCanvas(); bindControls(); renderStickerGrid(); if (!globalsBound) { bindGlobalEvents(); globalsBound = true; }
    if (document.fonts) Promise.all(FONTS.map(([font]) => document.fonts.load(`40px "${font}"`, "가나다 ABC"))).then(() => document.fonts.ready).then(render).catch(() => render()); else render(); render();
  }

  window.CardStudioCheki = { mount, reset, exportPng: savePng, standaloneHtml };
})();
