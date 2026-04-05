const TYPE_TO_CODE = { bar: "b", pie: "p", line: "l" };
const CODE_TO_TYPE = { b: "bar", p: "pie", l: "line" };
const DEFAULT_STATE = {
  type: "bar",
  title: "",
  dataText: "A,30\nB,22\nC,48",
  lineXType: "number",
  pieGroupSmall: true,
  pieThreshold: 5,
  lineTrend: false,
};

const PLACEHOLDERS = {
  bar: "A,30\nB,22\nC,48",
  pie: "사과,30\n바나나,8\n포도,2\n수박,60",
  lineNumber: "0,10\n1,14\n2,21\n3,27",
  lineDate: "2026-01-01,10\n2026-02-01,15\n2026-03-01,22",
};

const HINTS = {
  bar: "형식: 레이블,값 (예: A,30). 값만 입력하면 레이블은 자동 생성됩니다.",
  pie: "형식: 레이블,값 (예: 사과,30). pie는 음수 값을 지원하지 않습니다.",
  lineNumber: "형식: x,y (예: 1,20). x는 숫자.",
  lineDate: "형식: x,y (예: 2026-01-01,20). x는 날짜 문자열.",
};

let mainChart = null;
let secondaryChart = null;
let currentRegression = null;
let currentXType = "number";
let lastShareUrl = "";

const ui = {};

window.addEventListener("error", (event) => {
  if (ui.statusText) {
    setStatus(`런타임 오류: ${event.message}`, true);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (ui.statusText) {
    const reasonText = event.reason instanceof Error ? event.reason.message : String(event.reason);
    setStatus(`비동기 오류: ${reasonText}`, true);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  void init();
});

async function init() {
  bindElements();
  bindEvents();

  const restored = await readStateFromUrl();
  if (restored) {
    applyStateToForm(restored);
  } else {
    applyStateToForm(DEFAULT_STATE);
  }

  updateControlVisibility();
  const initialOk = await renderAndSync(true);
  if (!initialOk && !ui.shareUrlOutput.value) {
    ui.shareUrlOutput.value = window.location.href;
  }
  setStatus("그래프 준비 완료");
}

function bindElements() {
  ui.chartTitle = document.getElementById("chartTitle");
  ui.chartType = document.getElementById("chartType");
  ui.dataInput = document.getElementById("dataInput");
  ui.formatHint = document.getElementById("formatHint");
  ui.renderBtn = document.getElementById("renderBtn");
  ui.copyBtn = document.getElementById("copyBtn");
  ui.shareUrlOutput = document.getElementById("shareUrlOutput");
  ui.statusText = document.getElementById("statusText");
  ui.pieOptions = document.getElementById("pieOptions");
  ui.pieGroupSmall = document.getElementById("pieGroupSmall");
  ui.pieThreshold = document.getElementById("pieThreshold");
  ui.lineOptions = document.getElementById("lineOptions");
  ui.lineXType = document.getElementById("lineXType");
  ui.lineTrend = document.getElementById("lineTrend");
  ui.mainChartCanvas = document.getElementById("mainChart");
  ui.secondaryWrap = document.getElementById("secondaryWrap");
  ui.secondaryChartCanvas = document.getElementById("secondaryChart");
  ui.forecastWrap = document.getElementById("forecastWrap");
  ui.targetYInput = document.getElementById("targetYInput");
  ui.predictBtn = document.getElementById("predictBtn");
  ui.predictResult = document.getElementById("predictResult");
}

function bindEvents() {
  ui.chartType.addEventListener("change", () => {
    updateControlVisibility();
  });
  ui.lineXType.addEventListener("change", () => {
    updateControlVisibility();
  });
  ui.lineTrend.addEventListener("change", () => {
    updateControlVisibility();
    updateForecastVisibility();
  });
  ui.renderBtn.addEventListener("click", () => {
    void renderAndSync();
  });
  ui.copyBtn.addEventListener("click", () => {
    void copyShareUrl();
  });
  ui.predictBtn.addEventListener("click", () => {
    runPrediction();
  });
  ui.targetYInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runPrediction();
    }
  });
}

function readStateFromForm() {
  return {
    type: ui.chartType.value,
    title: ui.chartTitle.value.trim(),
    dataText: ui.dataInput.value.trim(),
    lineXType: ui.lineXType.value,
    pieGroupSmall: ui.pieGroupSmall.checked,
    pieThreshold: sanitizeThreshold(ui.pieThreshold.value),
    lineTrend: ui.lineTrend.checked,
  };
}

function applyStateToForm(state) {
  ui.chartType.value = state.type || DEFAULT_STATE.type;
  ui.chartTitle.value = state.title || "";
  ui.dataInput.value = state.dataText || defaultDataForType(state.type, state.lineXType);
  ui.lineXType.value = state.lineXType || "number";
  ui.pieGroupSmall.checked = Boolean(state.pieGroupSmall);
  ui.pieThreshold.value = String(sanitizeThreshold(state.pieThreshold));
  ui.lineTrend.checked = Boolean(state.lineTrend);
  updateControlVisibility();
}

function updateControlVisibility() {
  const type = ui.chartType.value;
  const xType = ui.lineXType.value;

  ui.pieOptions.classList.toggle("hidden", type !== "pie");
  ui.lineOptions.classList.toggle("hidden", type !== "line");
  ui.forecastWrap.classList.toggle("hidden", type !== "line");

  if (!ui.dataInput.value.trim()) {
    ui.dataInput.value = defaultDataForType(type, xType);
  }

  if (type === "bar") {
    ui.dataInput.placeholder = PLACEHOLDERS.bar;
    ui.formatHint.textContent = HINTS.bar;
  } else if (type === "pie") {
    ui.dataInput.placeholder = PLACEHOLDERS.pie;
    ui.formatHint.textContent = HINTS.pie;
  } else if (xType === "date") {
    ui.dataInput.placeholder = PLACEHOLDERS.lineDate;
    ui.formatHint.textContent = HINTS.lineDate;
  } else {
    ui.dataInput.placeholder = PLACEHOLDERS.lineNumber;
    ui.formatHint.textContent = HINTS.lineNumber;
  }

  updateForecastVisibility();
}

function defaultDataForType(type, xType) {
  if (type === "pie") return PLACEHOLDERS.pie;
  if (type === "line") return xType === "date" ? PLACEHOLDERS.lineDate : PLACEHOLDERS.lineNumber;
  return PLACEHOLDERS.bar;
}

async function renderAndSync(silent = false) {
  const state = readStateFromForm();

  try {
    const packed = await packState(state);
    lastShareUrl = writePackedStateToLocation(packed);
    ui.shareUrlOutput.value = lastShareUrl;
  } catch (error) {
    setStatus(error instanceof Error ? `URL 생성 실패: ${error.message}` : "URL 생성 실패", true);
    return false;
  }

  let warning = "";
  try {
    warning = renderChart(state);
  } catch (error) {
    const message =
      error instanceof Error
        ? `URL은 생성됐지만 그래프 렌더링 실패: ${error.message}`
        : "URL은 생성됐지만 그래프 렌더링 실패";
    if (!silent) {
      setStatus(message, true);
    }
    return true;
  }

  if (!silent) {
    if (warning) {
      setStatus(`${warning} / URL 반영 완료`);
    } else {
      setStatus("그래프 생성 및 URL 반영 완료");
    }
  }
  return true;
}

async function copyShareUrl() {
  const ok = await renderAndSync(true);
  if (!ok) {
    // 그래프는 그려졌지만 URL 저장에 실패한 경우를 위해 직접 공유 URL 생성을 한 번 더 시도.
    try {
      const state = readStateFromForm();
      const packed = await packState(state);
      lastShareUrl = buildShareUrlFromPacked(packed);
      ui.shareUrlOutput.value = lastShareUrl;
    } catch (_) {
      return;
    }
  }
  const targetUrl = lastShareUrl || window.location.href;
  try {
    const copied = await copyText(targetUrl);
    if (!copied) {
      setStatus(`자동 복사가 실패했습니다. 이 URL을 수동 복사해 주세요: ${targetUrl}`, true);
      return;
    }
    setStatus("공유 URL을 복사했습니다.");
  } catch (error) {
    void error;
    setStatus(`클립보드 복사가 실패해 수동 복사가 필요합니다: ${targetUrl}`, true);
  }
}

async function copyText(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback to execCommand below.
    }
  }

  const ghost = document.createElement("textarea");
  ghost.value = text;
  ghost.setAttribute("readonly", "");
  ghost.style.position = "fixed";
  ghost.style.opacity = "0";
  ghost.style.left = "-9999px";
  document.body.appendChild(ghost);
  ghost.focus();
  ghost.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (_) {
    copied = false;
  }
  document.body.removeChild(ghost);
  if (!copied) {
    try {
      window.prompt("아래 URL을 복사해 주세요.", text);
    } catch (_) {
      // Ignore.
    }
  }
  return copied;
}

function renderChart(state) {
  if (typeof Chart === "undefined") {
    throw new Error("차트 라이브러리(Chart.js) 로드 실패");
  }

  destroyCharts();
  ui.secondaryWrap.classList.add("hidden");
  ui.predictResult.textContent = "";
  currentRegression = null;
  currentXType = state.lineXType;

  if (!state.dataText) {
    throw new Error("데이터를 입력해 주세요.");
  }

  if (state.type === "bar") {
    renderBarChart(state);
    updateForecastVisibility();
    return "";
  }
  if (state.type === "pie") {
    renderPieChart(state);
    updateForecastVisibility();
    return "";
  }
  const warning = renderLineChart(state);
  updateForecastVisibility();
  return warning;
}

function renderBarChart(state) {
  const rows = parseCategoryData(state.dataText, false);
  const labels = rows.map((row) => row.label);
  const values = rows.map((row) => row.value);

  mainChart = new Chart(ui.mainChartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: state.title || "값",
          data: values,
          backgroundColor: buildColors(values.length, 0.72),
          borderColor: buildColors(values.length, 1),
          borderWidth: 1.2,
        },
      ],
    },
    options: commonOptions(state.title, {
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: { display: false },
      },
    }),
  });
}

function renderPieChart(state) {
  const rows = parseCategoryData(state.dataText, true);
  const threshold = sanitizeThreshold(state.pieThreshold);
  let mainRows = rows;
  let smallRows = [];

  if (state.pieGroupSmall) {
    const grouped = groupSmallPieSlices(rows, threshold);
    mainRows = grouped.main;
    smallRows = grouped.small;
  }

  mainChart = new Chart(ui.mainChartCanvas, {
    type: "pie",
    data: {
      labels: mainRows.map((row) => row.label),
      datasets: [
        {
          data: mainRows.map((row) => row.value),
          backgroundColor: buildColors(mainRows.length, 0.8),
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.75)",
        },
      ],
    },
    options: commonOptions(state.title, {}),
  });

  if (smallRows.length > 0) {
    ui.secondaryWrap.classList.remove("hidden");
    secondaryChart = new Chart(ui.secondaryChartCanvas, {
      type: "pie",
      data: {
        labels: smallRows.map((row) => row.label),
        datasets: [
          {
            data: smallRows.map((row) => row.value),
            backgroundColor: buildColors(smallRows.length, 0.76),
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.75)",
          },
        ],
      },
      options: commonOptions("기타 상세", {}),
    });
  }
}

function renderLineChart(state) {
  const parsed = parseLineData(state.dataText, state.lineXType);
  const points = parsed.points;
  const resolvedXType = parsed.xType;
  currentXType = resolvedXType;

  const datasets = [
    {
      label: state.title || "원본",
      data: points.map((point) => ({ x: point.x, y: point.y })),
      borderColor: "rgba(0, 127, 95, 0.95)",
      backgroundColor: "rgba(0, 127, 95, 0.18)",
      pointRadius: 4,
      pointHoverRadius: 5,
      tension: 0.25,
      fill: false,
    },
  ];

  let warning = "";
  if (resolvedXType !== state.lineXType) {
    warning = `x축 타입을 "${resolvedXType}"로 자동 해석했습니다.`;
  }

  if (state.lineTrend) {
    if (points.length < 2) {
      warning = [warning, "추세선은 최소 2개 데이터 포인트가 필요합니다."].filter(Boolean).join(" / ");
    } else {
      const regression = linearRegression(points);
      currentRegression = regression;
      const [minX, maxX] = minMaxX(points);
      datasets.push({
        label: "선형회귀 추세선",
        data: [
          { x: minX, y: predictY(regression, minX) },
          { x: maxX, y: predictY(regression, maxX) },
        ],
        borderColor: "rgba(247, 127, 0, 0.95)",
        borderDash: [8, 6],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      });
    }
  }

  mainChart = new Chart(ui.mainChartCanvas, {
    type: "line",
    data: { datasets },
    options: commonOptions(state.title, {
      parsing: false,
      scales: {
        x: {
          type: "linear",
          ticks: {
            callback(value) {
              const numericValue = Number(value);
              return resolvedXType === "date" ? formatDateTick(numericValue) : formatNumber(numericValue);
            },
          },
        },
        y: { beginAtZero: false },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              const xValue = context.parsed.x;
              const yValue = context.parsed.y;
              const xLabel =
                resolvedXType === "date" ? formatDateTime(new Date(xValue).getTime()) : formatNumber(xValue);
              return `${context.dataset.label}: (${xLabel}, ${formatNumber(yValue)})`;
            },
          },
        },
      },
    }),
  });

  return warning;
}

function updateForecastVisibility() {
  const shouldShow = ui.chartType.value === "line" && ui.lineTrend.checked && currentRegression !== null;
  ui.forecastWrap.classList.toggle("hidden", !shouldShow);
}

function runPrediction() {
  if (!currentRegression) {
    setStatus("추세선을 먼저 활성화하고 그래프를 생성해 주세요.", true);
    return;
  }
  const targetY = Number(ui.targetYInput.value);
  if (!Number.isFinite(targetY)) {
    setStatus("목표 y값을 숫자로 입력해 주세요.", true);
    return;
  }
  const { slope, intercept } = currentRegression;
  if (slope === 0) {
    if (targetY === intercept) {
      ui.predictResult.textContent = "기울기가 0이라 모든 x에서 같은 y입니다.";
      return;
    }
    ui.predictResult.textContent = "기울기가 0이라 해당 y값에 도달하지 않습니다.";
    return;
  }
  const predictedX = (targetY - intercept) / slope;

  if (currentXType === "date") {
    const predictedDate = new Date(predictedX);
    ui.predictResult.textContent = `예측 x: ${formatDateTime(predictedDate.getTime())}`;
    return;
  }
  ui.predictResult.textContent = `예측 x: ${formatNumber(predictedX)}`;
}

function parseCategoryData(rawText, positiveOnly) {
  const lines = splitLines(rawText);
  if (lines.length === 0) {
    throw new Error("데이터 줄이 비어 있습니다.");
  }
  return lines.map((line, index) => {
    const parts = line.split(/[,\t;]/).map((part) => part.trim());
    let label;
    let valueToken;
    if (parts.length >= 2) {
      label = parts.slice(0, -1).join(" ").trim() || `항목 ${index + 1}`;
      valueToken = parts[parts.length - 1];
    } else {
      label = `항목 ${index + 1}`;
      valueToken = parts[0];
    }

    const value = Number(valueToken);
    if (!Number.isFinite(value)) {
      throw new Error(`${index + 1}행의 값이 숫자가 아닙니다: "${valueToken}"`);
    }
    if (positiveOnly && value < 0) {
      throw new Error(`${index + 1}행은 pie에서 음수 값을 사용할 수 없습니다.`);
    }
    return { label, value };
  });
}

function parseLineData(rawText, xType) {
  const lines = splitLines(rawText);
  if (lines.length === 0) {
    throw new Error("line 데이터가 비어 있습니다.");
  }

  const rows = lines.map((line, index) => {
    const parts = line.split(/[,\t;]/).map((part) => part.trim());
    if (parts.length < 2) {
      throw new Error(`${index + 1}행은 "x,y" 형식이어야 합니다.`);
    }
    const xToken = parts[0];
    const yToken = parts[parts.length - 1];
    const y = Number(yToken);
    if (!Number.isFinite(y)) {
      throw new Error(`${index + 1}행의 y값이 숫자가 아닙니다: "${yToken}"`);
    }
    return { xToken, y, rowIndex: index + 1 };
  });

  const normalized = normalizeXType(xType);
  const numberOk = rows.every((row) => Number.isFinite(Number(row.xToken)));
  const dateOk = rows.every((row) => Number.isFinite(Date.parse(row.xToken)));

  let resolvedXType = normalized;
  if (normalized === "number" && !numberOk && dateOk) {
    resolvedXType = "date";
  } else if (normalized === "date" && !dateOk && numberOk) {
    resolvedXType = "number";
  }

  const points = rows.map((row) => {
    if (resolvedXType === "date") {
      const parsedDate = Date.parse(row.xToken);
      if (!Number.isFinite(parsedDate)) {
        throw new Error(`${row.rowIndex}행의 날짜를 해석할 수 없습니다: "${row.xToken}"`);
      }
      return { x: parsedDate, y: row.y };
    }
    const parsedNumber = Number(row.xToken);
    if (!Number.isFinite(parsedNumber)) {
      throw new Error(`${row.rowIndex}행의 x값이 숫자가 아닙니다: "${row.xToken}"`);
    }
    return { x: parsedNumber, y: row.y };
  });

  points.sort((a, b) => a.x - b.x);
  return { points, xType: resolvedXType };
}

function splitLines(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function groupSmallPieSlices(rows, thresholdPercent) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (total <= 0) {
    return { main: rows, small: [] };
  }

  const threshold = Math.max(0, thresholdPercent);
  const marked = rows.map((row) => {
    const ratio = (row.value / total) * 100;
    return { ...row, isSmall: ratio < threshold };
  });

  const small = marked.filter((row) => row.isSmall);
  if (small.length < 2 || small.length >= rows.length) {
    return { main: rows, small: [] };
  }

  const large = marked.filter((row) => !row.isSmall).map(stripSmallMark);
  const smallTotal = small.reduce((sum, row) => sum + row.value, 0);
  const main = [...large, { label: `기타 (${small.length})`, value: smallTotal }];
  return { main, small: small.map(stripSmallMark) };
}

function stripSmallMark(row) {
  return { label: row.label, value: row.value };
}

function linearRegression(points) {
  const n = points.length;
  const sums = points.reduce(
    (acc, point) => {
      acc.sumX += point.x;
      acc.sumY += point.y;
      acc.sumXX += point.x * point.x;
      acc.sumXY += point.x * point.y;
      return acc;
    },
    { sumX: 0, sumY: 0, sumXX: 0, sumXY: 0 }
  );

  const denominator = n * sums.sumXX - sums.sumX * sums.sumX;
  if (denominator === 0) {
    const intercept = sums.sumY / n;
    return { slope: 0, intercept };
  }

  const slope = (n * sums.sumXY - sums.sumX * sums.sumY) / denominator;
  const intercept = (sums.sumY - slope * sums.sumX) / n;
  return { slope, intercept };
}

function predictY(regression, xValue) {
  return regression.slope * xValue + regression.intercept;
}

function minMaxX(points) {
  let minX = points[0].x;
  let maxX = points[0].x;
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].x < minX) minX = points[i].x;
    if (points[i].x > maxX) maxX = points[i].x;
  }
  if (minX === maxX) {
    maxX = minX + 1;
  }
  return [minX, maxX];
}

function commonOptions(title, override) {
  return mergeOptions(
    {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: Boolean(title),
          text: title || "",
          color: "#1b263b",
          font: { family: "Space Grotesk, Noto Sans KR, sans-serif", size: 17, weight: "700" },
        },
      },
    },
    override
  );
}

function mergeOptions(base, override) {
  const output = deepCopy(base);
  Object.keys(override).forEach((key) => {
    const value = override[key];
    if (value && typeof value === "object" && !Array.isArray(value) && output[key] && typeof output[key] === "object") {
      output[key] = mergeOptions(output[key], value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

function deepCopy(value) {
  if (Array.isArray(value)) {
    return value.map((item) => deepCopy(item));
  }
  if (value && typeof value === "object") {
    const copy = {};
    Object.keys(value).forEach((key) => {
      copy[key] = deepCopy(value[key]);
    });
    return copy;
  }
  return value;
}

function buildColors(length, alpha) {
  const colors = [];
  for (let i = 0; i < length; i += 1) {
    const hue = Math.round((i * 360) / Math.max(1, length));
    colors.push(`hsla(${hue}, 72%, 48%, ${alpha})`);
  }
  return colors;
}

function destroyCharts() {
  if (mainChart) {
    mainChart.destroy();
    mainChart = null;
  }
  if (secondaryChart) {
    secondaryChart.destroy();
    secondaryChart = null;
  }
}

function setStatus(message, isError = false) {
  ui.statusText.textContent = message;
  ui.statusText.classList.toggle("error", Boolean(isError));
}

function sanitizeThreshold(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 5;
  return Math.min(40, Math.max(0.1, numberValue));
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
}

function formatDateTick(value) {
  if (!Number.isFinite(value)) return "";
  const date = new Date(value);
  return date.toLocaleDateString("ko-KR");
}

function formatDateTime(value) {
  if (!Number.isFinite(value)) return "";
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function packState(state) {
  const compact = {
    v: 1,
    t: TYPE_TO_CODE[state.type] || "b",
    h: state.title || "",
    d: state.dataText || "",
    x: state.lineXType === "date" ? "d" : "n",
    pg: state.pieGroupSmall ? 1 : 0,
    pt: sanitizeThreshold(state.pieThreshold),
    tr: state.lineTrend ? 1 : 0,
  };
  return `r${stringToBase64Url(JSON.stringify(compact))}`;
}

async function readStateFromUrl() {
  const packed = getPackedStateFromLocation();
  if (!packed) return null;
  try {
    const mode = packed[0];
    const payload = packed.slice(1);
    if (!payload) return null;
    let jsonText = "";
    if (mode === "r" || mode === "u") {
      jsonText = base64UrlToString(payload);
    } else if (mode === "g") {
      jsonText = await decodeLegacyGzipPayload(payload);
    } else {
      jsonText = base64UrlToString(packed);
    }
    const compact = JSON.parse(jsonText);
    return {
      type: CODE_TO_TYPE[compact.t] || "bar",
      title: compact.h || "",
      dataText: compact.d || "",
      lineXType: compact.x === "d" ? "date" : "number",
      pieGroupSmall: Boolean(compact.pg),
      pieThreshold: sanitizeThreshold(compact.pt),
      lineTrend: Boolean(compact.tr),
    };
  } catch (error) {
    setStatus(error instanceof Error ? `URL 데이터 복원 실패: ${error.message}` : "URL 데이터 복원 실패", true);
    return null;
  }
}

function getPackedStateFromLocation() {
  const url = new URL(window.location.href);
  const rawHash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (rawHash) {
    const hashPacked = new URLSearchParams(rawHash).get("s");
    if (hashPacked) {
      return hashPacked;
    }
  }
  const queryPacked = url.searchParams.get("s");
  return queryPacked || null;
}

function writePackedStateToLocation(packed) {
  const targetHash = `#s=${packed}`;
  const hashUrl = buildShareUrlFromPacked(packed);
  let applied = false;

  try {
    window.history.replaceState({}, "", hashUrl);
    applied = getPackedStateFromLocation() === packed;
  } catch (_) {
    applied = false;
  }

  if (!applied) {
    try {
      window.location.hash = `s=${packed}`;
      applied = getPackedStateFromLocation() === packed;
    } catch (_) {
      applied = false;
    }
  }

  if (!applied) {
    try {
      window.location.replace(hashUrl);
      applied = getPackedStateFromLocation() === packed;
    } catch (_) {
      applied = false;
    }
  }

  return applied ? new URL(window.location.href).toString() : hashUrl;
}

function buildShareUrlFromPacked(packed) {
  const url = new URL(window.location.href);
  url.searchParams.delete("s");
  url.hash = `s=${packed}`;
  return url.toString();
}

function normalizeXType(xType) {
  return xType === "date" ? "date" : "number";
}

function stringToBase64Url(value) {
  const encoded = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return btoa(encoded).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToString(value) {
  const binary = base64UrlToBinary(value);
  let percentEncoded = "";
  for (let i = 0; i < binary.length; i += 1) {
    percentEncoded += `%${binary.charCodeAt(i).toString(16).padStart(2, "0")}`;
  }
  return decodeURIComponent(percentEncoded);
}

function base64UrlToBinary(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  return atob(base64 + padding);
}

function base64UrlToBytes(value) {
  const binary = base64UrlToBinary(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function decodeLegacyGzipPayload(payload) {
  if (!("DecompressionStream" in window) || typeof TextDecoder === "undefined") {
    throw new Error("구형 압축 URL을 복원할 수 없는 브라우저입니다.");
  }
  const bytes = base64UrlToBytes(payload);
  const stream = new DecompressionStream("gzip");
  const writer = stream.writable.getWriter();
  await writer.write(bytes);
  await writer.close();
  const buffer = await new Response(stream.readable).arrayBuffer();
  return new TextDecoder().decode(new Uint8Array(buffer));
}
