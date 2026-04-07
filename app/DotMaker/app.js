const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_SIDE = 1024;

const elements = {
  form: document.getElementById('converter-form'),
  fileInput: document.getElementById('image'),
  convertButton: document.getElementById('convert'),
  downloadButton: document.getElementById('download'),
  status: document.getElementById('status'),
  originalPreview: document.getElementById('original-preview'),
  resultCanvas: document.getElementById('result-canvas'),
  palette: document.getElementById('palette')
};

const state = {
  opencvReady: false,
  originalUrl: null,
  resultUrl: null
};

function setStatus(message, tone = 'info') {
  elements.status.textContent = message;
  elements.status.classList.remove('ok', 'error');
  if (tone === 'ok') {
    elements.status.classList.add('ok');
  }
  if (tone === 'error') {
    elements.status.classList.add('error');
  }
}

function refreshActionState() {
  const ready = state.opencvReady;
  elements.convertButton.disabled = !ready;
  if (!ready) {
    elements.downloadButton.disabled = true;
  }
}

function setOriginalPreview(url) {
  if (state.originalUrl) {
    URL.revokeObjectURL(state.originalUrl);
  }
  state.originalUrl = url;
  elements.originalPreview.src = url;
}

function setResultDownloadUrl(url) {
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
  }
  state.resultUrl = url;
  elements.downloadButton.disabled = !url;
}

function clearPalette() {
  elements.palette.innerHTML = '';
}

function renderPalette(colors) {
  clearPalette();
  for (const color of colors) {
    const chip = document.createElement('div');
    chip.className = 'color-chip';

    const dot = document.createElement('span');
    dot.className = 'color-dot';
    dot.style.backgroundColor = color;

    const code = document.createElement('span');
    code.textContent = color;

    chip.appendChild(dot);
    chip.appendChild(code);
    elements.palette.appendChild(chip);
  }
}

function getCheckedInt(name, fallback) {
  const selected = elements.form.querySelector(`input[name="${name}"]:checked`);
  if (!selected) {
    return fallback;
  }
  return Number.parseInt(selected.value, 10);
}

function readOptions() {
  return {
    k: getCheckedInt('k', 4),
    scale: getCheckedInt('scale', 2),
    blur: getCheckedInt('blur', 0),
    erode: getCheckedInt('erode', 0),
    alpha: elements.form.querySelector('input[name="alpha"]').checked,
    toTw: elements.form.querySelector('input[name="to_tw"]').checked
  };
}

function fitSize(width, height, maxSide) {
  const maxCurrent = Math.max(width, height);
  if (maxCurrent <= maxSide) {
    return { width, height };
  }
  const ratio = maxSide / maxCurrent;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지 파일을 읽을 수 없습니다.'));
    };
    image.src = url;
  });
}

function drawToLimitedCanvas(image) {
  const target = fitSize(image.naturalWidth, image.naturalHeight, MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;

  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, target.width, target.height);

  return canvas;
}

async function detectPngColorType(file) {
  if (file.type !== 'image/png') {
    return null;
  }

  const bytes = new Uint8Array(await file.slice(0, 26).arrayBuffer());
  if (bytes.length < 26) {
    return null;
  }

  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < pngSignature.length; i += 1) {
    if (bytes[i] !== pngSignature[i]) {
      return null;
    }
  }

  return bytes[25];
}

function shouldUseAlphaMode(file, pngColorType, alphaEnabled) {
  if (!alphaEnabled) {
    return false;
  }
  if (file.type !== 'image/png') {
    return false;
  }
  return pngColorType === 3 || pngColorType === 4 || pngColorType === 6;
}

function containsZero(mat) {
  const data = mat.data;
  for (let i = 0; i < data.length; i += 1) {
    if (data[i] === 0) {
      return true;
    }
  }
  return false;
}

function toU8(value) {
  if (value <= 0) {
    return 0;
  }
  if (value >= 255) {
    return 255;
  }
  return Math.trunc(value);
}

function toHex(value) {
  return value.toString(16).padStart(2, '0');
}

function convertLikePython(sourceCanvas, options, alphaMode) {
  const mats = [];
  const push = (mat) => {
    mats.push(mat);
    return mat;
  };

  let finalMat = null;
  let colors = [];

  try {
    const src = push(cv.imread(sourceCanvas));

    let img;
    let alphaChannel = null;

    if (alphaMode) {
      alphaChannel = push(new cv.Mat());
      if (typeof cv.extractChannel === 'function') {
        cv.extractChannel(src, alphaChannel, 3);
      } else {
        const splitChannels = push(new cv.MatVector());
        cv.split(src, splitChannels);
        if (splitChannels.size() < 4) {
          throw new Error('알파 채널 추출에 실패했습니다.');
        }
        const extractedAlpha = push(splitChannels.get(3));
        extractedAlpha.copyTo(alphaChannel);
      }
      img = push(new cv.Mat());
      cv.cvtColor(src, img, cv.COLOR_RGBA2BGR);
    } else {
      img = push(new cv.Mat());
      cv.cvtColor(src, img, cv.COLOR_RGBA2BGR);
    }

    const h = img.rows;
    const w = img.cols;
    const dH = Math.floor(h / options.scale);
    const dW = Math.floor(w / options.scale);

    if (dH < 1 || dW < 1) {
      throw new Error('현재 배율에서 이미지 크기가 너무 작습니다. 배율을 낮춰주세요.');
    }

    if (options.erode === 1 || options.erode === 2) {
      const kernel = push(
        cv.matFromArray(
          3,
          3,
          cv.CV_8U,
          options.erode === 1
            ? [0, 1, 0, 1, 1, 1, 0, 1, 0]
            : [1, 1, 1, 1, 1, 1, 1, 1, 1]
        )
      );
      const eroded = push(new cv.Mat());
      cv.erode(img, eroded, kernel);
      img = eroded;
    }

    if (options.blur > 0) {
      const blurred = push(new cv.Mat());
      cv.bilateralFilter(img, blurred, 15, options.blur, 20, cv.BORDER_DEFAULT);
      img = blurred;
    }

    const reduced = push(new cv.Mat());
    cv.resize(img, reduced, new cv.Size(dW, dH), 0, 0, cv.INTER_NEAREST);

    let alphaExpanded = null;
    if (alphaMode && alphaChannel) {
      const alphaSmall = push(new cv.Mat());
      alphaExpanded = push(new cv.Mat());

      cv.resize(alphaChannel, alphaSmall, new cv.Size(dW, dH), 0, 0, cv.INTER_NEAREST);
      cv.resize(
        alphaSmall,
        alphaExpanded,
        new cv.Size(dW * options.scale, dH * options.scale),
        0,
        0,
        cv.INTER_NEAREST
      );
      cv.threshold(alphaExpanded, alphaExpanded, 0, 255, cv.THRESH_BINARY);

      if (!containsZero(alphaExpanded)) {
        alphaExpanded.ucharPtr(0, 0)[0] = 0;
      }
    }

    const sampleCount = reduced.rows * reduced.cols;
    const sampleData = new Float32Array(sampleCount * 3);
    const reducedData = reduced.data;

    for (let i = 0; i < sampleCount * 3; i += 1) {
      sampleData[i] = reducedData[i];
    }

    const samples = push(cv.matFromArray(sampleCount, 3, cv.CV_32F, sampleData));
    const labels = push(new cv.Mat());
    const centers = push(new cv.Mat());
    const criteria = new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 10, 1.0);

    cv.kmeans(samples, options.k, labels, criteria, 10, cv.KMEANS_PP_CENTERS, centers);

    const centerU8 = new Uint8Array(options.k * 3);
    for (let i = 0; i < options.k; i += 1) {
      centerU8[i * 3] = toU8(centers.floatAt(i, 0));
      centerU8[i * 3 + 1] = toU8(centers.floatAt(i, 1));
      centerU8[i * 3 + 2] = toU8(centers.floatAt(i, 2));
    }

    const resultReducedData = new Uint8Array(sampleCount * 3);
    for (let i = 0; i < sampleCount; i += 1) {
      const label = labels.intAt(i, 0);
      const srcIndex = label * 3;
      const dstIndex = i * 3;
      resultReducedData[dstIndex] = centerU8[srcIndex];
      resultReducedData[dstIndex + 1] = centerU8[srcIndex + 1];
      resultReducedData[dstIndex + 2] = centerU8[srcIndex + 2];
    }

    const resultReduced = push(cv.matFromArray(dH, dW, cv.CV_8UC3, resultReducedData));
    const resultScaled = push(new cv.Mat());
    cv.resize(
      resultReduced,
      resultScaled,
      new cv.Size(dW * options.scale, dH * options.scale),
      0,
      0,
      cv.INTER_NEAREST
    );

    if (alphaMode && alphaExpanded) {
      const channels = push(new cv.MatVector());
      cv.split(resultScaled, channels);
      channels.push_back(alphaExpanded);
      finalMat = push(new cv.Mat());
      cv.merge(channels, finalMat);
    } else if (options.toTw) {
      const alphaFill = push(new cv.Mat(resultScaled.rows, resultScaled.cols, cv.CV_8UC1, new cv.Scalar(255)));
      alphaFill.ucharPtr(0, 0)[0] = 0;

      const channels = push(new cv.MatVector());
      cv.split(resultScaled, channels);
      channels.push_back(alphaFill);
      finalMat = push(new cv.Mat());
      cv.merge(channels, finalMat);
    } else {
      finalMat = resultScaled;
    }

    const displayMat = push(new cv.Mat());
    if (finalMat.type() === cv.CV_8UC4) {
      cv.cvtColor(finalMat, displayMat, cv.COLOR_BGRA2RGBA);
    } else {
      cv.cvtColor(finalMat, displayMat, cv.COLOR_BGR2RGBA);
    }

    elements.resultCanvas.width = displayMat.cols;
    elements.resultCanvas.height = displayMat.rows;
    cv.imshow(elements.resultCanvas, displayMat);

    colors = [];
    for (let i = 0; i < options.k; i += 1) {
      const b = centerU8[i * 3];
      const g = centerU8[i * 3 + 1];
      const r = centerU8[i * 3 + 2];
      colors.push(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    }

    return colors;
  } finally {
    const deleted = new Set();
    for (const mat of mats) {
      if (!mat || deleted.has(mat)) {
        continue;
      }
      if (typeof mat.delete === 'function') {
        mat.delete();
      }
      deleted.add(mat);
    }
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('결과 이미지를 생성하지 못했습니다.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function setWorking(isWorking) {
  elements.convertButton.disabled = isWorking || !state.opencvReady;
  elements.downloadButton.disabled = isWorking || !state.resultUrl;
}

async function runConversion() {
  if (!state.opencvReady) {
    setStatus('아직 OpenCV가 로딩되지 않았습니다. 잠시 후 다시 시도해주세요.', 'error');
    return;
  }

  const file = elements.fileInput.files[0];
  if (!file) {
    setStatus('이미지 파일을 선택해주세요.', 'error');
    return;
  }

  if (!(file.type === 'image/png' || file.type === 'image/jpeg')) {
    setStatus('PNG 또는 JPEG 파일만 지원합니다.', 'error');
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    setStatus('파일 크기가 너무 큽니다. 2MB 이하 이미지만 사용할 수 있습니다.', 'error');
    return;
  }

  const options = readOptions();
  setWorking(true);
  setStatus('변환 중입니다...', 'info');

  try {
    const pngColorType = await detectPngColorType(file);
    const alphaMode = shouldUseAlphaMode(file, pngColorType, options.alpha);

    const { image, url } = await loadImage(file);
    setOriginalPreview(url);

    const sourceCanvas = drawToLimitedCanvas(image);
    const colors = convertLikePython(sourceCanvas, options, alphaMode);
    renderPalette(colors);

    const blob = await canvasToBlob(elements.resultCanvas);
    const downloadUrl = URL.createObjectURL(blob);
    setResultDownloadUrl(downloadUrl);

    const alphaInfo = alphaMode
      ? '원본 알파 채널을 유지했습니다.'
      : options.toTw
        ? 'Twitter용 1px 투명 픽셀을 추가했습니다.'
        : '알파 채널 없이 PNG를 생성했습니다.';

    setStatus(`변환이 완료되었습니다. ${alphaInfo}`, 'ok');
  } catch (error) {
    setResultDownloadUrl(null);
    clearPalette();
    setStatus(error.message || '변환 중 오류가 발생했습니다.', 'error');
  } finally {
    setWorking(false);
  }
}

function handleDownload() {
  if (!state.resultUrl) {
    return;
  }
  const link = document.createElement('a');
  link.href = state.resultUrl;
  link.download = 'pixel-converted.png';
  link.click();
}

function markOpenCvReady() {
  if (!window.cv || typeof cv.Mat !== 'function') {
    return;
  }
  state.opencvReady = true;
  refreshActionState();
  setStatus('OpenCV 로딩이 완료되었습니다. 이미지를 선택하고 변환을 실행하세요.');
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  runConversion();
});

elements.downloadButton.addEventListener('click', handleDownload);

window.addEventListener('opencv-ready', markOpenCvReady);
window.addEventListener('beforeunload', () => {
  if (state.originalUrl) {
    URL.revokeObjectURL(state.originalUrl);
  }
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
  }
});

refreshActionState();

if (window.cv && typeof cv.Mat === 'function') {
  markOpenCvReady();
} else {
  const waitTimer = window.setInterval(() => {
    if (window.cv && typeof cv.Mat === 'function') {
      window.clearInterval(waitTimer);
      markOpenCvReady();
    }
  }, 200);
}
