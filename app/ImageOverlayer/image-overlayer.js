"use strict";

(() => {
  const MAX_OVERLAYS = 3;
  const EXPORT_MAX_EDGE = 3840;

  const els = {
    canvas: document.getElementById("canvas"),
    stage: document.getElementById("stage"),
    baseInput: document.getElementById("baseInput"),
    overlayInput: document.getElementById("overlayInput"),
    exportBtn: document.getElementById("exportBtn"),
    resetViewBtn: document.getElementById("resetView"),
    lockBaseBtn: document.getElementById("lockBase"),
    removeOverlayBtn: document.getElementById("removeOverlay"),
    clearOverlaysBtn: document.getElementById("clearOverlays"),
    opacitySlider: document.getElementById("opacity"),
    opacityVal: document.getElementById("opacityVal"),
    status: document.getElementById("status"),
    modePill: document.getElementById("mode-pill"),
    layerList: document.getElementById("layerList"),
    toast: document.getElementById("toast")
  };

  if (!els.canvas || !els.stage) return;

  const ctx = els.canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

  const state = {
    view: { x: 0, y: 0, scale: 1, initScale: 1, locked: false },
    base: { img: null, w: 0, h: 0, loaded: false, name: "" },
    overlays: [],
    activeOverlayId: null,
    nextOverlayId: 1,
    pointers: new Map(),
    gesture: null,
    wasPinching: false
  };

  function showToast(msg, ms = 1600) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), ms);
  }

  window.onerror = (message, source, line, column, error) => {
    console.error(error || message, source, line, column);
    showToast(String(message || error));
  };

  window.onunhandledrejection = (event) => {
    console.error(event.reason);
    showToast("Error: " + (event.reason?.message || event.reason));
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function mat(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    return { a, b, c, d, e, f };
  }

  function mul(m, n) {
    return {
      a: m.a * n.a + m.c * n.b,
      b: m.b * n.a + m.d * n.b,
      c: m.a * n.c + m.c * n.d,
      d: m.b * n.c + m.d * n.d,
      e: m.a * n.e + m.c * n.f + m.e,
      f: m.b * n.e + m.d * n.f + m.f
    };
  }

  function inv(m) {
    const det = m.a * m.d - m.b * m.c;
    if (!det) return mat();
    const id = 1 / det;
    return {
      a: m.d * id,
      b: -m.b * id,
      c: -m.c * id,
      d: m.a * id,
      e: (m.c * m.f - m.d * m.e) * id,
      f: (m.b * m.e - m.a * m.f) * id
    };
  }

  const M = {
    translate: (x, y) => mat(1, 0, 0, 1, x, y),
    scale: (s) => mat(s, 0, 0, s, 0, 0),
    rotate: (r) => {
      const c = Math.cos(r);
      const s = Math.sin(r);
      return mat(c, s, -s, c, 0, 0);
    }
  };

  function screenToBase(x, y) {
    return {
      x: (x - state.view.x) / state.view.scale,
      y: (y - state.view.y) / state.view.scale
    };
  }

  function overlayMatrix(overlay) {
    const ax = overlay.w * overlay.anchorX;
    const ay = overlay.h * overlay.anchorY;
    let m = M.translate(overlay.x, overlay.y);
    m = mul(m, M.rotate(overlay.rot));
    m = mul(m, M.scale(overlay.scale));
    m = mul(m, M.translate(-ax, -ay));
    return m;
  }

  function getOverlayById(id) {
    return state.overlays.find((overlay) => overlay.id === id) || null;
  }

  function getActiveOverlay() {
    return state.activeOverlayId == null ? null : getOverlayById(state.activeOverlayId);
  }

  function getOverlayIndexById(id) {
    return state.overlays.findIndex((overlay) => overlay.id === id);
  }

  function getTopOverlayAtScreenPoint(sx, sy, includeLocked = false) {
    const basePoint = screenToBase(sx, sy);
    for (let i = state.overlays.length - 1; i >= 0; i -= 1) {
      const overlay = state.overlays[i];
      if (!includeLocked && overlay.locked) continue;
      const invM = inv(overlayMatrix(overlay));
      const x = invM.a * basePoint.x + invM.c * basePoint.y + invM.e;
      const y = invM.b * basePoint.x + invM.d * basePoint.y + invM.f;
      if (x >= 0 && y >= 0 && x <= overlay.w && y <= overlay.h) return overlay;
    }
    return null;
  }

  function updateModePill(text) {
    if (!els.modePill) return;
    els.modePill.textContent = text;
  }

  function updateBaseLockButton() {
    if (!els.lockBaseBtn) return;
    els.lockBaseBtn.textContent = `Base Lock: ${state.view.locked ? "ON" : "OFF"}`;
    els.lockBaseBtn.classList.toggle("locked", state.view.locked);
  }

  function updateStatus() {
    if (!els.status) return;
    if (!state.base.loaded) {
      els.status.textContent = "Load a base image.";
      return;
    }

    const active = getActiveOverlay();
    const overlayCount = state.overlays.length;
    const activeLabel = active
      ? `Selected #${getOverlayIndexById(active.id) + 1}${active.locked ? " (locked)" : ""}`
      : "No layer selected";

    els.status.textContent = `Base: ${state.base.name} (${state.base.w}x${state.base.h}) | Overlays: ${overlayCount} | ${activeLabel}`;
  }

  function updateOpacityUI() {
    const active = getActiveOverlay();
    if (!els.opacitySlider || !els.opacityVal) return;

    if (!active) {
      els.opacitySlider.disabled = true;
      els.opacitySlider.value = "1";
      els.opacityVal.textContent = "-";
      return;
    }

    els.opacitySlider.disabled = false;
    els.opacitySlider.value = String(active.opacity);
    els.opacityVal.textContent = `${Math.round(active.opacity * 100)}%`;
  }

  function syncControls() {
    const hasBase = state.base.loaded;
    const hasActive = Boolean(getActiveOverlay());

    if (els.overlayInput) {
      els.overlayInput.disabled = !hasBase || state.overlays.length >= MAX_OVERLAYS;
    }
    if (els.removeOverlayBtn) {
      els.removeOverlayBtn.disabled = !hasActive;
    }
    if (els.clearOverlaysBtn) {
      els.clearOverlaysBtn.disabled = state.overlays.length === 0;
    }
    if (els.exportBtn) {
      els.exportBtn.disabled = !hasBase;
    }
    updateOpacityUI();
    updateBaseLockButton();
  }

  function ensureActiveOverlay() {
    if (state.activeOverlayId != null && getOverlayById(state.activeOverlayId)) return;
    state.activeOverlayId = state.overlays.length ? state.overlays[state.overlays.length - 1].id : null;
  }

  function setActiveOverlay(id, options = {}) {
    if (id == null || !getOverlayById(id)) {
      state.activeOverlayId = null;
    } else {
      state.activeOverlayId = id;
    }

    updateStatus();
    renderLayerList();
    syncControls();
    draw();

    if (!options.silent && state.activeOverlayId == null) {
      showToast("No overlay selected.");
    }
  }

  function fitBaseToStage() {
    if (!state.base.loaded) return;
    const rect = els.stage.getBoundingClientRect();
    const scale = Math.min(rect.width / state.base.w, rect.height / state.base.h);
    state.view.scale = Math.max(scale, 0.02);
    state.view.initScale = state.view.scale;
    state.view.x = rect.width / 2 - (state.base.w * state.view.scale) / 2;
    state.view.y = rect.height / 2 - (state.base.h * state.view.scale) / 2;
  }

  function resetOverlayPlacement(overlay, index = 0) {
    if (!state.base.loaded) return;
    const minBaseEdge = Math.min(state.base.w, state.base.h);
    const maxOverlayEdge = Math.max(overlay.w, overlay.h);
    overlay.scale = clamp((minBaseEdge * 0.4) / Math.max(1, maxOverlayEdge), 0.02, 10);
    overlay.rot = 0;
    const offset = index * minBaseEdge * 0.03;
    overlay.x = state.base.w * 0.5 + offset;
    overlay.y = state.base.h * 0.5 + offset;
  }

  function drawOverlay(targetCtx, overlay) {
    const ax = overlay.w * overlay.anchorX;
    const ay = overlay.h * overlay.anchorY;
    targetCtx.save();
    targetCtx.translate(overlay.x, overlay.y);
    targetCtx.rotate(overlay.rot);
    targetCtx.scale(overlay.scale, overlay.scale);
    targetCtx.translate(-ax, -ay);
    targetCtx.globalAlpha = overlay.opacity;
    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = "high";
    targetCtx.drawImage(overlay.img, 0, 0, overlay.w, overlay.h);
    targetCtx.restore();
  }

  function drawOverlayBounds(targetCtx, overlay) {
    const ax = overlay.w * overlay.anchorX;
    const ay = overlay.h * overlay.anchorY;

    targetCtx.save();
    targetCtx.translate(overlay.x, overlay.y);
    targetCtx.rotate(overlay.rot);
    targetCtx.scale(overlay.scale, overlay.scale);
    targetCtx.translate(-ax, -ay);
    targetCtx.globalAlpha = 1;
    targetCtx.lineWidth = 1 / Math.max(overlay.scale, 0.001);
    targetCtx.strokeStyle = "rgba(165, 180, 252, 0.95)";
    targetCtx.setLineDash([8 / Math.max(overlay.scale, 0.001), 6 / Math.max(overlay.scale, 0.001)]);
    targetCtx.strokeRect(0, 0, overlay.w, overlay.h);
    targetCtx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);

    if (!state.base.loaded) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.09)";
      ctx.font = "600 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Load a base image.", els.canvas.width / (2 * dpr), els.canvas.height / (2 * dpr));
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(state.view.x, state.view.y);
    ctx.scale(state.view.scale, state.view.scale);
    ctx.drawImage(state.base.img, 0, 0, state.base.w, state.base.h);

    for (const overlay of state.overlays) {
      drawOverlay(ctx, overlay);
    }

    const active = getActiveOverlay();
    if (active) drawOverlayBounds(ctx, active);
    ctx.restore();
  }

  function resizeCanvas() {
    const rect = els.stage.getBoundingClientRect();
    els.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    els.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    draw();
  }

  async function loadImageFromFile(file) {
    if (!file) return null;

    if ("createImageBitmap" in window) {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        return { source: bitmap, w: bitmap.width, h: bitmap.height };
      } catch {
        // Fallback below.
      }
    }

    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image."));
        img.src = url;
      });
      const w = image.naturalWidth || image.width;
      const h = image.naturalHeight || image.height;
      if (!w || !h) throw new Error("Invalid image dimensions.");
      return { source: image, w, h };
    } finally {
      window.setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore.
        }
      }, 10000);
    }
  }

  function removeOverlayById(id) {
    const index = getOverlayIndexById(id);
    if (index < 0) return;
    state.overlays.splice(index, 1);
    ensureActiveOverlay();
    updateStatus();
    renderLayerList();
    syncControls();
    draw();
  }

  function toggleOverlayLock(id) {
    const overlay = getOverlayById(id);
    if (!overlay) return;
    overlay.locked = !overlay.locked;
    updateStatus();
    renderLayerList();
    draw();
    const rowIndex = getOverlayIndexById(id) + 1;
    showToast(overlay.locked ? `Layer #${rowIndex} locked` : `Layer #${rowIndex} unlocked`);
  }

  function renderLayerList() {
    if (!els.layerList) return;
    els.layerList.innerHTML = "";

    if (!state.overlays.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No overlays yet.";
      els.layerList.appendChild(empty);
      return;
    }

    state.overlays.forEach((overlay, index) => {
      const row = document.createElement("div");
      row.className = "layer-item";
      row.dataset.overlayId = String(overlay.id);
      if (overlay.id === state.activeOverlayId) row.classList.add("active");

      const indexTag = document.createElement("div");
      indexTag.className = "layer-index";
      indexTag.textContent = String(index + 1);

      const name = document.createElement("div");
      name.className = "layer-name";
      name.textContent = overlay.name;

      const lockBtn = document.createElement("button");
      lockBtn.className = "mini";
      if (overlay.locked) lockBtn.classList.add("locked");
      lockBtn.type = "button";
      lockBtn.dataset.action = "lock";
      lockBtn.textContent = overlay.locked ? "Locked" : "Lock";

      const removeBtn = document.createElement("button");
      removeBtn.className = "mini danger";
      removeBtn.type = "button";
      removeBtn.dataset.action = "remove";
      removeBtn.textContent = "Delete";

      row.append(indexTag, name, lockBtn, removeBtn);

      row.addEventListener("click", (event) => {
        const actionButton = event.target instanceof Element ? event.target.closest("button[data-action]") : null;
        if (!actionButton) {
          setActiveOverlay(overlay.id, { silent: true });
          return;
        }

        if (actionButton.dataset.action === "lock") {
          toggleOverlayLock(overlay.id);
        } else if (actionButton.dataset.action === "remove") {
          removeOverlayById(overlay.id);
          showToast(`Layer #${index + 1} deleted`);
        }
      });

      els.layerList.appendChild(row);
    });
  }

  function makeOverlay(loaded, fileName) {
    return {
      id: state.nextOverlayId++,
      name: fileName,
      img: loaded.source,
      w: loaded.w,
      h: loaded.h,
      x: 0,
      y: 0,
      scale: 1,
      rot: 0,
      opacity: 1,
      anchorX: 0.5,
      anchorY: 0.5,
      locked: false
    };
  }

  function getPointerCenterAndDistance(p1, p2) {
    return {
      mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
      dist: Math.hypot(p2.x - p1.x, p2.y - p1.y),
      ang: Math.atan2(p2.y - p1.y, p2.x - p1.x)
    };
  }

  function startSingleGesture(clientX, clientY) {
    const overlay = getTopOverlayAtScreenPoint(clientX, clientY, false);
    if (overlay) {
      setActiveOverlay(overlay.id, { silent: true });
      state.gesture = {
        target: "overlay",
        mode: "drag",
        overlayId: overlay.id,
        start: {
          basePt: screenToBase(clientX, clientY),
          x: overlay.x,
          y: overlay.y
        }
      };
      updateModePill(`Drag layer #${getOverlayIndexById(overlay.id) + 1}`);
      return;
    }

    if (!state.base.loaded || state.view.locked) {
      state.gesture = null;
      updateModePill("Locked");
      return;
    }

    state.gesture = {
      target: "base",
      mode: "drag",
      start: {
        x: state.view.x,
        y: state.view.y,
        pointer: { x: clientX, y: clientY }
      }
    };
    updateModePill("Move base");
  }

  function startPinchGesture() {
    const points = [...state.pointers.values()];
    if (points.length < 2) return;

    const { mid, dist, ang } = getPointerCenterAndDistance(points[0], points[1]);
    const overlay = getTopOverlayAtScreenPoint(mid.x, mid.y, false);
    state.wasPinching = true;

    if (overlay) {
      setActiveOverlay(overlay.id, { silent: true });
      state.gesture = {
        target: "overlay",
        mode: "pinch",
        overlayId: overlay.id,
        start: {
          dist,
          ang,
          baseMid: screenToBase(mid.x, mid.y),
          x: overlay.x,
          y: overlay.y,
          scale: overlay.scale,
          rot: overlay.rot
        }
      };
      updateModePill(`Scale/rotate layer #${getOverlayIndexById(overlay.id) + 1}`);
      return;
    }

    if (!state.base.loaded || state.view.locked) {
      state.gesture = null;
      updateModePill("Locked");
      return;
    }

    state.gesture = {
      target: "base",
      mode: "pinch",
      start: {
        dist,
        world: screenToBase(mid.x, mid.y),
        scale: state.view.scale
      }
    };
    updateModePill("Zoom base");
  }

  function onPointerDown(event) {
    event.preventDefault();
    if (state.pointers.size >= 2) return;

    try {
      event.target.setPointerCapture?.(event.pointerId);
    } catch {
      // Ignore capture errors.
    }

    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointerCount = state.pointers.size;

    if (pointerCount === 1) {
      startSingleGesture(event.clientX, event.clientY);
    } else if (pointerCount === 2) {
      startPinchGesture();
    }
  }

  function onPointerMove(event) {
    if (!state.pointers.has(event.pointerId)) return;
    event.preventDefault();

    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const gesture = state.gesture;
    if (!gesture) return;

    const points = [...state.pointers.values()];

    if (gesture.mode === "drag" && points.length === 1) {
      if (gesture.target === "overlay") {
        const overlay = getOverlayById(gesture.overlayId);
        if (!overlay || overlay.locked) return;
        const bp = screenToBase(event.clientX, event.clientY);
        overlay.x = gesture.start.x + (bp.x - gesture.start.basePt.x);
        overlay.y = gesture.start.y + (bp.y - gesture.start.basePt.y);
      } else {
        if (state.view.locked) return;
        const dx = event.clientX - gesture.start.pointer.x;
        const dy = event.clientY - gesture.start.pointer.y;
        state.view.x = gesture.start.x + dx;
        state.view.y = gesture.start.y + dy;
      }
      draw();
      return;
    }

    if (gesture.mode === "pinch" && points.length === 2) {
      const { mid, dist, ang } = getPointerCenterAndDistance(points[0], points[1]);

      if (gesture.target === "overlay") {
        const overlay = getOverlayById(gesture.overlayId);
        if (!overlay || overlay.locked) return;
        const scaleFactor = clamp(dist / gesture.start.dist, 0.02, 100);
        overlay.scale = clamp(gesture.start.scale * scaleFactor, 0.02, 100);
        overlay.rot = gesture.start.rot + (ang - gesture.start.ang);
        const baseMid = screenToBase(mid.x, mid.y);
        overlay.x = gesture.start.x + (baseMid.x - gesture.start.baseMid.x);
        overlay.y = gesture.start.y + (baseMid.y - gesture.start.baseMid.y);
      } else {
        if (state.view.locked) return;
        const scale = clamp(gesture.start.scale * (dist / gesture.start.dist), 0.02, 50);
        state.view.scale = scale;
        state.view.x = mid.x - gesture.start.world.x * scale;
        state.view.y = mid.y - gesture.start.world.y * scale;
      }

      draw();
    }
  }

  function onPointerUp(event) {
    event.preventDefault();
    state.pointers.delete(event.pointerId);

    if (state.pointers.size < 2) {
      state.gesture = null;
    }
    if (state.pointers.size === 0) {
      state.wasPinching = false;
      updateModePill("Idle");
    }
  }

  function touchStart(event) {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      onPointerDown({
        pointerId: 1000 + touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: els.canvas,
        preventDefault: () => event.preventDefault()
      });
    }
  }

  function touchMove(event) {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      onPointerMove({
        pointerId: 1000 + touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: els.canvas,
        preventDefault: () => event.preventDefault()
      });
    }
  }

  function touchEnd(event) {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      onPointerUp({
        pointerId: 1000 + touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: els.canvas,
        preventDefault: () => event.preventDefault()
      });
    }
  }

  function attachInputEvents() {
    const opts = { passive: false };
    const supportsPointer = Boolean(window.PointerEvent && "onpointerdown" in window);

    if (supportsPointer) {
      els.canvas.addEventListener("pointerdown", onPointerDown, opts);
      els.canvas.addEventListener("pointermove", onPointerMove, opts);
      els.canvas.addEventListener("pointerup", onPointerUp, opts);
      els.canvas.addEventListener("pointercancel", onPointerUp, opts);
    } else {
      els.canvas.addEventListener("touchstart", touchStart, opts);
      els.canvas.addEventListener("touchmove", touchMove, opts);
      els.canvas.addEventListener("touchend", touchEnd, opts);
      els.canvas.addEventListener("touchcancel", touchEnd, opts);
    }

    els.canvas.addEventListener("gesturestart", (event) => event.preventDefault());
    els.canvas.addEventListener("gesturechange", (event) => event.preventDefault());
    els.canvas.addEventListener("gestureend", (event) => event.preventDefault());
  }

  function createExportCanvas() {
    const longestEdge = Math.max(state.base.w, state.base.h);
    const exportScale = longestEdge > EXPORT_MAX_EDGE ? EXPORT_MAX_EDGE / longestEdge : 1;
    const width = Math.max(1, Math.round(state.base.w * exportScale));
    const height = Math.max(1, Math.round(state.base.h * exportScale));

    const outCanvas = document.createElement("canvas");
    outCanvas.width = width;
    outCanvas.height = height;

    const outCtx = outCanvas.getContext("2d", { alpha: true });
    if (!outCtx) throw new Error("Failed to create export canvas.");

    outCtx.clearRect(0, 0, width, height);
    outCtx.save();
    outCtx.scale(exportScale, exportScale);
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = "high";
    outCtx.drawImage(state.base.img, 0, 0, state.base.w, state.base.h);
    for (const overlay of state.overlays) {
      drawOverlay(outCtx, overlay);
    }
    outCtx.restore();

    return { outCanvas, exportScale, width, height };
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function getExportFileName() {
    const baseName = (state.base.name || "overlayed").replace(/\.[^/.]+$/, "");
    return `${baseName}_overlayed.png`;
  }

  async function exportPng() {
    if (!state.base.loaded) {
      showToast("Load a base image first.");
      return;
    }

    const { outCanvas, exportScale, width, height } = createExportCanvas();

    if ("toBlob" in outCanvas) {
      const blob = await new Promise((resolve) => outCanvas.toBlob(resolve, "image/png"));
      if (!blob) {
        showToast("PNG export failed.");
        return;
      }
      downloadBlob(blob, getExportFileName());
    } else {
      const dataUrl = outCanvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = getExportFileName();
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }

    if (exportScale < 1) {
      showToast(`Saved ${width}x${height} (long edge limited to 3840px).`, 2200);
    } else {
      showToast(`Saved ${width}x${height} (base native size).`, 2200);
    }
  }

  async function onBaseInputChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const loaded = await loadImageFromFile(file).catch((error) => {
      showToast(error.message || "Failed to load base image.");
      return null;
    });
    if (!loaded) return;

    state.base = {
      img: loaded.source,
      w: loaded.w,
      h: loaded.h,
      loaded: true,
      name: file.name
    };

    fitBaseToStage();
    state.overlays.forEach((overlay, index) => resetOverlayPlacement(overlay, index));
    ensureActiveOverlay();
    updateStatus();
    renderLayerList();
    syncControls();
    draw();
    showToast(`Base loaded: ${file.name}`);
  }

  async function onOverlayInputChange(event) {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;

    if (!state.base.loaded) {
      showToast("Load a base image first.");
      return;
    }

    let added = 0;
    for (const file of files) {
      if (state.overlays.length >= MAX_OVERLAYS) {
        showToast(`You can add up to ${MAX_OVERLAYS} overlays.`);
        break;
      }

      const loaded = await loadImageFromFile(file).catch((error) => {
        showToast(error.message || `Failed to load: ${file.name}`);
        return null;
      });
      if (!loaded) continue;

      const overlay = makeOverlay(loaded, file.name);
      state.overlays.push(overlay);
      resetOverlayPlacement(overlay, state.overlays.length - 1);
      state.activeOverlayId = overlay.id;
      added += 1;
    }

    if (!added) return;

    updateStatus();
    renderLayerList();
    syncControls();
    draw();
    showToast(`Added ${added} overlay(s).`);
  }

  function wireUiEvents() {
    els.baseInput?.addEventListener("change", onBaseInputChange);
    els.overlayInput?.addEventListener("change", onOverlayInputChange);
    els.exportBtn?.addEventListener("click", exportPng);

    els.opacitySlider?.addEventListener("input", (event) => {
      const active = getActiveOverlay();
      if (!active) {
        updateOpacityUI();
        return;
      }
      active.opacity = clamp(Number(event.target.value || "1"), 0, 1);
      els.opacityVal.textContent = `${Math.round(active.opacity * 100)}%`;
      draw();
    });

    els.resetViewBtn?.addEventListener("click", () => {
      fitBaseToStage();
      draw();
      updateModePill("Idle");
      showToast("View reset.");
    });

    els.lockBaseBtn?.addEventListener("click", () => {
      state.view.locked = !state.view.locked;
      updateBaseLockButton();
      updateModePill(state.view.locked ? "Base locked" : "Idle");
      showToast(state.view.locked ? "Base pan/zoom locked." : "Base lock released.");
    });

    els.removeOverlayBtn?.addEventListener("click", () => {
      const active = getActiveOverlay();
      if (!active) {
        showToast("No overlay selected.");
        return;
      }
      const rowIndex = getOverlayIndexById(active.id) + 1;
      removeOverlayById(active.id);
      showToast(`Layer #${rowIndex} deleted.`);
    });

    els.clearOverlaysBtn?.addEventListener("click", () => {
      if (!state.overlays.length) return;
      state.overlays = [];
      state.activeOverlayId = null;
      updateStatus();
      renderLayerList();
      syncControls();
      draw();
      showToast("All overlays deleted.");
    });

    window.addEventListener("resize", () => {
      resizeCanvas();
      if (state.base.loaded) {
        fitBaseToStage();
        draw();
      }
    });
  }

  function init() {
    els.canvas.style.touchAction = "none";
    els.stage.style.touchAction = "none";
    attachInputEvents();
    wireUiEvents();
    resizeCanvas();
    renderLayerList();
    syncControls();
    updateStatus();
    updateModePill("Idle");
    showToast("Load a base image.");
  }

  init();
})();
