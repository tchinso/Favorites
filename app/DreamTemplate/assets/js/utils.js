(() => {
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}

function nl2br(value) {
  return escapeHtml(value).replaceAll(/\r?\n/g, "<br>");
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, Number(number) || 0));
}

function getByPath(source, path) {
  return String(path)
    .split(".")
    .filter(Boolean)
    .reduce((cursor, key) => (cursor == null ? undefined : cursor[key]), source);
}

function setByPath(source, path, value) {
  const parts = String(path).split(".").filter(Boolean);
  let cursor = source;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    const nextKey = parts[index + 1];
    if (cursor[key] == null) {
      cursor[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    cursor = cursor[key];
  }
  cursor[parts.at(-1)] = value;
}

function parseKeywords(value) {
  return String(value || "")
    .split(/[,/·\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCategoryLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => {
      const [label, url] = line.split("|").map((part) => part.trim());
      return { label, url };
    })
    .filter((item) => item.label);
}

function backgroundStyle(src, fallback = "") {
  if (!src) return fallback;
  return `background-image:url('${String(src).replaceAll("'", "\\'")}')`;
}

function imagePlaceholder(label = "IMAGE") {
  return `<div class="image-placeholder"><span>${escapeHtml(label)}</span></div>`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function downloadText(filename, text, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function makeFilename(styleId, extension) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${styleId}-card-${stamp}.${extension}`;
}

function mergeState(defaultState, savedState) {
  if (!savedState || typeof savedState !== "object") return defaultState;
  const merged = structuredClone(defaultState);
  if (savedState.activeStyle) merged.activeStyle = savedState.activeStyle;
  if (savedState.openGroups && typeof savedState.openGroups === "object") {
    merged.openGroups = { ...merged.openGroups, ...savedState.openGroups };
  }
  if (savedState.updatedAt) merged.updatedAt = savedState.updatedAt;
  for (const [styleId, styleData] of Object.entries(savedState.styles || {})) {
    if (!merged.styles[styleId]) continue;
    merged.styles[styleId] = mergeObjects(merged.styles[styleId], styleData);
  }
  return merged;
}

function mergeObjects(base, incoming) {
  if (Array.isArray(base)) return Array.isArray(incoming) ? incoming : base;
  if (!incoming || typeof incoming !== "object") return base;
  const next = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) {
      next[key] = value;
    } else if (value && typeof value === "object" && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      next[key] = mergeObjects(base[key], value);
    } else {
      next[key] = value;
    }
  }
  return next;
}

window.CardStudioUtils = {
  escapeHtml,
  escapeAttr,
  nl2br,
  clamp,
  getByPath,
  setByPath,
  parseKeywords,
  parseCategoryLines,
  backgroundStyle,
  imagePlaceholder,
  fileToDataUrl,
  downloadText,
  makeFilename,
  mergeState,
};
})();
