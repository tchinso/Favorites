(() => {
  const $ = (id) => document.getElementById(`jd_${id}`);

  const el = {
    drop: $("drop"),
    file: $("file"),
    meta: $("meta"),
    sizeInfo: $("sizeInfo"),
    elaInfo: $("elaInfo"),
    sharpScore: $("sharpScore"),

    maxSide: $("maxSide"),
    maxSideNum: $("maxSideNum"),
    elaQ: $("elaQ"),
    elaQNum: $("elaQNum"),
    elaGain: $("elaGain"),
    elaGainNum: $("elaGainNum"),
    noiseGain: $("noiseGain"),
    noiseGainNum: $("noiseGainNum"),
    sharpGain: $("sharpGain"),
    sharpGainNum: $("sharpGainNum"),

    cvOriginal: $("cvOriginal"),
    cvELA: $("cvELA"),
    cvR: $("cvR"),
    cvG: $("cvG"),
    cvB: $("cvB"),
    cvNoise: $("cvNoise"),
    cvSharp: $("cvSharp"),
    cvH: $("cvH"),
    cvS: $("cvS"),
    cvV: $("cvV"),
    cvCb: $("cvCb"),
    cvCr: $("cvCr")
  };

  const ctx = (cv) => cv.getContext("2d", { willReadFrequently: true });

  const hidden = document.createElement("canvas");
  const hctx = hidden.getContext("2d", { willReadFrequently: true });

  const state = {
    img: null,
    w: 0, h: 0,
    imageData: null
  };

  // --- UI: range <-> number sync
  function bindRange(range, num, onChange) {
    const syncFromRange = () => { num.value = range.value; onChange?.(); };
    const syncFromNum = () => {
      let v = Number(num.value);
      if (Number.isNaN(v)) v = Number(range.value);
      v = Math.max(Number(range.min), Math.min(Number(range.max), v));
      range.value = String(v);
      num.value = String(v);
      onChange?.();
    };
    range.addEventListener("input", syncFromRange);
    num.addEventListener("change", syncFromNum);
    syncFromRange();
  }

  bindRange(el.maxSide, el.maxSideNum, () => rerunIfReady());
  bindRange(el.elaQ, el.elaQNum, () => rerunIfReady());
  bindRange(el.elaGain, el.elaGainNum, () => rerunIfReady());
  bindRange(el.noiseGain, el.noiseGainNum, () => rerunIfReady());
  bindRange(el.sharpGain, el.sharpGainNum, () => rerunIfReady());

  // --- drag & drop
  el.drop.addEventListener("click", () => el.file.click());
  el.drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") el.file.click();
  });

  ["dragenter","dragover"].forEach(evt => el.drop.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation();
    el.drop.classList.add("drag");
  }));
  ["dragleave","drop"].forEach(evt => el.drop.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation();
    el.drop.classList.remove("drag");
  }));
  el.drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  });

  el.file.addEventListener("change", () => {
    const f = el.file.files?.[0];
    if (f) handleFile(f);
  });

  // --- save buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-save]");
    if (!btn) return;
    const id = btn.getAttribute("data-save");
    const canvas = $(id);
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${id}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  });

  function setCanvasSize(cv, w, h) { cv.width = w; cv.height = h; }

  function scaledDims(w, h, maxSide) {
    if (!maxSide || maxSide <= 0) return { w, h, scale: 1 };
    const m = Math.max(w, h);
    const s = Math.min(1, maxSide / m);
    return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)), scale: s };
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
      img.src = url;
    });
  }

  async function handleFile(file) {
    try {
      el.meta.textContent = `불러오는 중… ${file.name}`;
      const img = await loadImageFromFile(file);
      state.img = img;

      const maxSide = Number(el.maxSide.value);
      const d = scaledDims(img.naturalWidth, img.naturalHeight, maxSide);
      state.w = d.w; state.h = d.h;

      setCanvasSize(hidden, state.w, state.h);
      hctx.clearRect(0,0,state.w,state.h);
      hctx.drawImage(img, 0, 0, state.w, state.h);

      state.imageData = hctx.getImageData(0, 0, state.w, state.h);

      el.meta.innerHTML =
        `파일: <b>${escapeHtml(file.name)}</b><br/>` +
        `원본: ${img.naturalWidth}×${img.naturalHeight}<br/>` +
        `분석: ${state.w}×${state.h} (스케일 ${Math.round(d.scale*100)}%)`;

      rerun();
    } catch (e) {
      el.meta.textContent = "이미지 로드 실패(다른 파일로 다시 시도해봐)";
      console.error(e);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  function rerunIfReady() {
    if (!state.imageData) return;
    rerun();
  }

  function drawImageDataToCanvas(imageData, cv) {
    setCanvasSize(cv, imageData.width, imageData.height);
    ctx(cv).putImageData(imageData, 0, 0);
  }

  function toGray(r,g,b) {
    return (0.299*r + 0.587*g + 0.114*b);
  }

  // --- ELA: original vs JPEG recompress
  async function computeELA(baseImageData, jpegQuality01, gain) {
    // Draw original into temp canvas
    setCanvasSize(hidden, baseImageData.width, baseImageData.height);
    hctx.putImageData(baseImageData, 0, 0);

    const dataUrl = hidden.toDataURL("image/jpeg", jpegQuality01);
    const jpegImg = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    // Draw jpeg back
    hctx.clearRect(0,0,hidden.width,hidden.height);
    hctx.drawImage(jpegImg, 0, 0, hidden.width, hidden.height);
    const jpegData = hctx.getImageData(0,0,hidden.width,hidden.height);

    const a = baseImageData.data;
    const b = jpegData.data;
    const out = new ImageData(baseImageData.width, baseImageData.height);
    const o = out.data;

    let maxDiff = 0;
    for (let i=0; i<a.length; i+=4) {
      const dr = Math.abs(a[i]   - b[i]);
      const dg = Math.abs(a[i+1] - b[i+1]);
      const db = Math.abs(a[i+2] - b[i+2]);
      const diff = (dr + dg + db) / 3;
      if (diff > maxDiff) maxDiff = diff;

      const v = clamp8(diff * gain);
      o[i]=v; o[i+1]=v; o[i+2]=v; o[i+3]=255;
    }
    return { out, maxDiff };
  }

  // --- Channel split (grayscale for each channel)
  function channelSplit(baseImageData) {
    const { width:w, height:h, data } = baseImageData;
    const outR = new ImageData(w,h);
    const outG = new ImageData(w,h);
    const outB = new ImageData(w,h);

    for (let i=0; i<data.length; i+=4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      outR.data[i]=r; outR.data[i+1]=r; outR.data[i+2]=r; outR.data[i+3]=255;
      outG.data[i]=g; outG.data[i+1]=g; outG.data[i+2]=g; outG.data[i+3]=255;
      outB.data[i]=b; outB.data[i+1]=b; outB.data[i+2]=b; outB.data[i+3]=255;
    }
    return { outR, outG, outB };
  }

  // --- Gaussian-ish blur on grayscale (separable 1D kernel)
  function blurGray(gray, w, h) {
    // kernel approx: [1,4,6,4,1] / 16
    const k = [1,4,6,4,1];
    const div = 16;

    const tmp = new Float32Array(w*h);
    const out = new Float32Array(w*h);

    // horizontal
    for (let y=0; y<h; y++) {
      const row = y*w;
      for (let x=0; x<w; x++) {
        let s = 0;
        for (let i=-2; i<=2; i++) {
          const xx = Math.min(w-1, Math.max(0, x+i));
          s += gray[row+xx] * k[i+2];
        }
        tmp[row+x] = s / div;
      }
    }

    // vertical
    for (let y=0; y<h; y++) {
      for (let x=0; x<w; x++) {
        let s = 0;
        for (let i=-2; i<=2; i++) {
          const yy = Math.min(h-1, Math.max(0, y+i));
          s += tmp[yy*w + x] * k[i+2];
        }
        out[y*w + x] = s / div;
      }
    }
    return out;
  }

  // --- Noise residual map: (gray - blur(gray)) amplified around mid-gray
  function noiseResidual(baseImageData, gain) {
    const { width:w, height:h, data } = baseImageData;
    const gray = new Float32Array(w*h);
    for (let y=0; y<h; y++) {
      for (let x=0; x<w; x++) {
        const i = (y*w + x)*4;
        gray[y*w+x] = toGray(data[i], data[i+1], data[i+2]);
      }
    }
    const bl = blurGray(gray, w, h);
    const out = new ImageData(w,h);
    for (let p=0; p<w*h; p++) {
      const r = (gray[p] - bl[p]) * gain;
      const v = clamp8(128 + r);
      const i = p*4;
      out.data[i]=v; out.data[i+1]=v; out.data[i+2]=v; out.data[i+3]=255;
    }
    return out;
  }

  // --- Laplacian sharpness map
  function sharpnessMap(baseImageData, gain) {
    const { width:w, height:h, data } = baseImageData;
    const gray = new Float32Array(w*h);
    for (let p=0; p<w*h; p++) {
      const i=p*4;
      gray[p] = toGray(data[i], data[i+1], data[i+2]);
    }

    // laplacian 3x3: [-1 -1 -1; -1 8 -1; -1 -1 -1]
    const mag = new Float32Array(w*h);
    let sum = 0;

    for (let y=0; y<h; y++) {
      for (let x=0; x<w; x++) {
        const c = gray[y*w + x];
        let acc = 8*c;

        for (let yy=-1; yy<=1; yy++) {
          for (let xx=-1; xx<=1; xx++) {
            if (xx===0 && yy===0) continue;
            const nx = Math.min(w-1, Math.max(0, x+xx));
            const ny = Math.min(h-1, Math.max(0, y+yy));
            acc += -1 * gray[ny*w + nx];
          }
        }
        const m = Math.abs(acc) * gain;
        mag[y*w + x] = m;
        sum += m;
      }
    }

    // normalize using approx 99th percentile (sampling)
    const p99 = approxPercentile(mag, 0.99);
    const out = new ImageData(w,h);
    for (let p=0; p<w*h; p++) {
      const v = clamp8((mag[p] / (p99 || 1)) * 255);
      const i=p*4;
      out.data[i]=v; out.data[i+1]=v; out.data[i+2]=v; out.data[i+3]=255;
    }

    const avg = sum / (w*h);
    return { out, score: avg, p99 };
  }

  function approxPercentile(arr, q) {
    const n = arr.length;
    if (n === 0) return 1;
    const step = Math.max(1, Math.floor(n / 50000)); // sample up to ~50k
    const sample = [];
    for (let i=0; i<n; i+=step) sample.push(arr[i]);
    sample.sort((a,b)=>a-b);
    const idx = Math.min(sample.length-1, Math.max(0, Math.floor(sample.length*q)));
    return sample[idx] || 1;
  }

  // --- HSV and YCbCr split
  function hsvAndYCbCr(baseImageData) {
    const { width:w, height:h, data } = baseImageData;
    const outH = new ImageData(w,h);
    const outS = new ImageData(w,h);
    const outV = new ImageData(w,h);
    const outCb = new ImageData(w,h);
    const outCr = new ImageData(w,h);

    for (let i=0; i<data.length; i+=4) {
      const r = data[i] / 255, g = data[i+1] / 255, b = data[i+2] / 255;
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      const d = max - min;

      // HSV
      let hVal = 0;
      if (d !== 0) {
        if (max === r) hVal = ((g - b) / d) % 6;
        else if (max === g) hVal = ((b - r) / d) + 2;
        else hVal = ((r - g) / d) + 4;
        hVal *= 60;
        if (hVal < 0) hVal += 360;
      }
      const sVal = (max === 0) ? 0 : (d / max);
      const vVal = max;

      const H = clamp8((hVal / 360) * 255);
      const S = clamp8(sVal * 255);
      const V = clamp8(vVal * 255);

      outH.data[i]=H; outH.data[i+1]=H; outH.data[i+2]=H; outH.data[i+3]=255;
      outS.data[i]=S; outS.data[i+1]=S; outS.data[i+2]=S; outS.data[i+3]=255;
      outV.data[i]=V; outV.data[i+1]=V; outV.data[i+2]=V; outV.data[i+3]=255;

      // YCbCr (BT.601 full-range style)
      const R = data[i], G = data[i+1], B = data[i+2];
      const Cb = 128 - 0.168736*R - 0.331264*G + 0.5*B;
      const Cr = 128 + 0.5*R - 0.418688*G - 0.081312*B;

      const cb = clamp8(Cb);
      const cr = clamp8(Cr);
      outCb.data[i]=cb; outCb.data[i+1]=cb; outCb.data[i+2]=cb; outCb.data[i+3]=255;
      outCr.data[i]=cr; outCr.data[i+1]=cr; outCr.data[i+2]=cr; outCr.data[i+3]=255;
    }

    return { outH, outS, outV, outCb, outCr };
  }

  function clamp8(v) {
    v = Math.round(v);
    return v < 0 ? 0 : (v > 255 ? 255 : v);
  }

  async function rerun() {
    const base = state.imageData;
    if (!base) return;

    // draw original
    drawImageDataToCanvas(base, el.cvOriginal);
    el.sizeInfo.textContent = `${base.width}×${base.height}`;

    // channel split
    const ch = channelSplit(base);
    drawImageDataToCanvas(ch.outR, el.cvR);
    drawImageDataToCanvas(ch.outG, el.cvG);
    drawImageDataToCanvas(ch.outB, el.cvB);

    // ELA
    const q = Number(el.elaQ.value) / 100;
    const eg = Number(el.elaGain.value);
    el.elaInfo.textContent = `Q=${Math.round(q*100)} / gain=${eg}`;
    const ela = await computeELA(base, q, eg);
    drawImageDataToCanvas(ela.out, el.cvELA);

    // Noise residual
    const ng = Number(el.noiseGain.value);
    const nz = noiseResidual(base, ng);
    drawImageDataToCanvas(nz, el.cvNoise);

    // Sharpness map
    const sg = Number(el.sharpGain.value);
    const sh = sharpnessMap(base, sg);
    drawImageDataToCanvas(sh.out, el.cvSharp);
    el.sharpScore.textContent = `평균 고주파 강도≈ ${sh.score.toFixed(2)} / p99≈ ${sh.p99.toFixed(2)}`;

    // HSV + YCbCr
    const cs = hsvAndYCbCr(base);
    drawImageDataToCanvas(cs.outH, el.cvH);
    drawImageDataToCanvas(cs.outS, el.cvS);
    drawImageDataToCanvas(cs.outV, el.cvV);
    drawImageDataToCanvas(cs.outCb, el.cvCb);
    drawImageDataToCanvas(cs.outCr, el.cvCr);
  }

})();
