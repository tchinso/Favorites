(() => {
const { createDefaultState, DEFAULT_STYLE_DATA, LIST_FACTORIES, STYLE_CONFIGS, STYLE_GROUPS } = window.CardStudioDefaults;
const { renderCard } = window.CardStudioRenderers;
const { renderEditor } = window.CardStudioTemplates;
const { clearStoredState, loadStoredState, saveStoredState } = window.CardStudioStorage;
const { fileToDataUrl, getByPath, mergeState, setByPath } = window.CardStudioUtils;
const { copyStandaloneHtml, downloadStandaloneHtml, exportCardImage } = window.CardStudioExporter;

let state = mergeState(createDefaultState(), loadStoredState());
let saveTimer = null;

const elements = {
  styleRail: document.querySelector("#styleRail"),
  editorTitle: document.querySelector("#editorTitle"),
  editorDescription: document.querySelector("#editorDescription"),
  editorFields: document.querySelector("#editorFields"),
  previewRoot: document.querySelector("#previewRoot"),
  draftStatus: document.querySelector("#draftStatus"),
  imageButton: document.querySelector("#exportImage"),
  htmlButton: document.querySelector("#downloadHtml"),
  copyButton: document.querySelector("#copyHtml"),
  saveButton: document.querySelector("#saveDraft"),
  loadButton: document.querySelector("#loadDraft"),
  collapseGroupsButton: document.querySelector("#collapseGroups"),
  expandGroupsButton: document.querySelector("#expandGroups"),
  resetStyleButton: document.querySelector("#resetStyle"),
  resetAllButton: document.querySelector("#resetAll"),
  toast: document.querySelector("#toast"),
};

init();

function init() {
  normalizeState();
  renderAll();
  bindEvents();
  updateDraftStatus(state.updatedAt, state.updatedAt ? "임시저장을 불러왔습니다." : "자동 임시저장 대기 중");
}

function bindEvents() {
  elements.styleRail.addEventListener("click", (event) => {
    const groupToggle = event.target.closest("[data-group-toggle]");
    if (groupToggle) {
      const groupId = groupToggle.dataset.groupToggle;
      state.openGroups[groupId] = !state.openGroups[groupId];
      renderStyleRail();
      persistSoon();
      return;
    }

    const button = event.target.closest("[data-style-id]");
    if (!button) return;
    state.activeStyle = button.dataset.styleId;
    applyActiveVariant();
    persistSoon();
    renderAll();
  });

  elements.editorFields.addEventListener("input", handleFieldInput);
  elements.editorFields.addEventListener("change", handleFieldChange);
  elements.editorFields.addEventListener("click", handleEditorAction);
  elements.previewRoot.addEventListener("click", handlePreviewAction);
  elements.previewRoot.addEventListener("keydown", handlePreviewKeydown);

  elements.collapseGroupsButton.addEventListener("click", () => {
    STYLE_GROUPS.forEach((group) => {
      state.openGroups[group.id] = false;
    });
    renderStyleRail();
    persistSoon("카테고리를 모두 접었습니다.");
  });

  elements.expandGroupsButton.addEventListener("click", () => {
    STYLE_GROUPS.forEach((group) => {
      state.openGroups[group.id] = true;
    });
    renderStyleRail();
    persistSoon("카테고리를 모두 펼쳤습니다.");
  });

  elements.imageButton.addEventListener("click", async () => {
    await runExport(() => exportCardImage(state.activeStyle), "이미지 파일을 저장했습니다.");
  });

  elements.htmlButton.addEventListener("click", async () => {
    const config = getActiveConfig();
    await runExport(
      () => downloadStandaloneHtml(state.activeStyle, getExportLabel(config), renderCurrentCard()),
      "HTML 파일을 저장했습니다.",
    );
  });

  elements.copyButton.addEventListener("click", async () => {
    const config = getActiveConfig();
    await runExport(
      () => copyStandaloneHtml(state.activeStyle, getExportLabel(config), renderCurrentCard()),
      "HTML 코드를 클립보드에 복사했습니다.",
    );
  });

  elements.saveButton.addEventListener("click", () => {
    const savedAt = saveStoredState(state);
    state.updatedAt = savedAt;
    updateDraftStatus(savedAt, "수동 임시저장 완료");
  });

  elements.loadButton.addEventListener("click", () => {
    const loaded = loadStoredState();
    if (!loaded) {
      showToast("불러올 임시저장이 없습니다.");
      return;
    }
    state = mergeState(createDefaultState(), loaded);
    normalizeState();
    renderAll();
    updateDraftStatus(state.updatedAt, "임시저장을 다시 불러왔습니다.");
  });

  elements.resetStyleButton.addEventListener("click", () => {
    const config = getActiveConfig();
    state.styles[config.baseStyle] = structuredClone(DEFAULT_STYLE_DATA[config.baseStyle]);
    applyActiveVariant();
    renderAll();
    persistSoon("현재 세부 스타일을 초기값으로 되돌렸습니다.");
  });

  elements.resetAllButton.addEventListener("click", () => {
    clearStoredState();
    state = createDefaultState();
    normalizeState();
    renderAll();
    updateDraftStatus(null, "전체 임시저장을 비웠습니다.");
  });

  window.addEventListener("beforeunload", () => saveStoredState(state));
}

function handleFieldInput(event) {
  const field = event.target.closest("[data-field]");
  if (!field) return;
  writeFieldValue(field);
  syncActiveStyleFromData(field.dataset.field);
  renderPreview();
  renderStyleRail();
  persistSoon();
}

async function handleFieldChange(event) {
  const imageInput = event.target.closest("[data-image-field]");
  if (imageInput) {
    const file = imageInput.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setByPath(getActiveData(), imageInput.dataset.imageField, dataUrl);
    renderEditorPanel();
    renderPreview();
    persistSoon("이미지를 적용했습니다.");
    return;
  }

  const field = event.target.closest("[data-field]");
  if (!field) return;
  writeFieldValue(field);
  const path = field.dataset.field;
  syncActiveStyleFromData(path);
  if (["subtype", "mode", "layout"].includes(path)) {
    renderStyleRail();
    renderEditorPanel();
  }
  renderPreview();
  persistSoon();
}

function handleEditorAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const config = getActiveConfig();
  const activeData = getActiveData();
  const action = button.dataset.action;

  if (action === "add-item") {
    const list = button.dataset.list;
    const factory = LIST_FACTORIES[config.baseStyle]?.[list];
    const target = getByPath(activeData, list);
    if (factory && Array.isArray(target)) target.push(factory());
  }

  if (action === "remove-item") {
    const list = button.dataset.list;
    const index = Number(button.dataset.index);
    const target = getByPath(activeData, list);
    if (Array.isArray(target)) target.splice(index, 1);
  }

  if (action === "clear-image") {
    setByPath(activeData, button.dataset.path, "");
  }

  renderEditorPanel();
  renderPreview();
  persistSoon(action === "clear-image" ? "이미지를 비웠습니다." : "목록을 갱신했습니다.");
}

function handlePreviewAction(event) {
  const sendButton = event.target.closest("[data-msg-send]");
  if (sendButton) {
    sendNextMessengerItem(sendButton.closest("[data-messenger-card]"));
    return;
  }

  const photo = event.target.closest(".msg-photo");
  if (!photo) return;
  const item = photo.closest(".msg-item");
  const comment = item?.querySelector(".msg-comment");
  if (comment) comment.classList.toggle("hide");
}

function handlePreviewKeydown(event) {
  const input = event.target.closest("[data-msg-input]");
  if (!input || event.key !== "Enter") return;
  event.preventDefault();
  sendNextMessengerItem(input.closest("[data-messenger-card]"));
}

function sendNextMessengerItem(card) {
  if (!card) return;
  const sequence = readMessengerSequence(card);
  const index = Number(card.dataset.nextIndex) || 0;
  if (index >= sequence.length) return;

  appendMessengerItem(card, sequence[index]);
  card.dataset.nextIndex = String(index + 1);

  const input = card.querySelector("[data-msg-input]");
  if (input) input.value = "";
}

function readMessengerSequence(card) {
  const script = card.querySelector("[data-msg-sequence]");
  if (!script) return [];
  try {
    const parsed = JSON.parse(script.textContent || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendMessengerItem(card, message) {
  const history = card.querySelector("[data-msg-history]");
  if (!history) return;

  const item = document.createElement("div");
  item.className = "msg-item";

  const photos = document.createElement("div");
  photos.className = "msg-photos";

  const images = Array.isArray(message?.images) ? message.images.filter(Boolean) : [message?.image, message?.image2].filter(Boolean);
  if (images.length) {
    images.forEach((src) => {
      const photo = document.createElement("div");
      photo.className = "msg-photo";
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      photo.append(img);
      photos.append(photo);
    });
  } else {
    const photo = document.createElement("div");
    photo.className = "msg-photo placeholder";
    const placeholder = document.createElement("span");
    placeholder.textContent = "PHOTO";
    photo.append(placeholder);
    photos.append(photo);
  }

  const comment = document.createElement("div");
  comment.className = "msg-comment";
  comment.textContent = message?.text || "";

  item.append(photos, comment);
  history.append(item);
  setTimeout(() => {
    history.scrollTop = history.scrollHeight;
  }, 50);
}

function writeFieldValue(field) {
  const value = field.type === "checkbox" ? field.checked : field.value;
  setByPath(getActiveData(), field.dataset.field, value);
}

function renderAll() {
  renderStyleRail();
  renderEditorPanel();
  renderPreview();
  renderExportButtons();
}

function renderStyleRail() {
  elements.styleRail.innerHTML = STYLE_GROUPS.map((group) => {
    const configs = STYLE_CONFIGS.filter((config) => config.groupId === group.id);
    const isOpen = state.openGroups?.[group.id] !== false;
    const activeInGroup = configs.some((config) => config.id === state.activeStyle);
    const tabs = configs.map((config) => {
      const active = config.id === state.activeStyle ? " active" : "";
      return `
        <button type="button" class="style-tab${active}" data-style-id="${config.id}" style="--accent:${config.accent}">
          <span>${config.label}</span>
          <small>${config.canExportImage ? "IMG · HTML" : "HTML"}</small>
        </button>
      `;
    }).join("");

    return `
      <section class="style-group${activeInGroup ? " has-active" : ""}${isOpen ? "" : " is-collapsed"}" style="--accent:${configs[0]?.accent || "#111827"}">
        <button type="button" class="style-group-toggle" data-group-toggle="${group.id}" aria-expanded="${isOpen ? "true" : "false"}">
          <span>${group.label}</span>
          <small>${configs.length}개</small>
          <i aria-hidden="true">${isOpen ? "⌃" : "⌄"}</i>
        </button>
        <div class="style-group-list"${isOpen ? "" : " hidden"}>${tabs}</div>
      </section>
    `;
  }).join("");
}

function renderEditorPanel() {
  const config = getActiveConfig();
  elements.editorTitle.textContent = getExportLabel(config);
  elements.editorDescription.textContent = config.description;
  elements.editorFields.innerHTML = renderEditor(config.baseStyle, getActiveData());
  renderExportButtons();
}

function renderPreview() {
  elements.previewRoot.innerHTML = renderCurrentCard();
  window.CardStudioRenderers.hydrateCard?.(elements.previewRoot);
}

function renderCurrentCard() {
  const config = getActiveConfig();
  return renderCard(config.baseStyle, getActiveData());
}

function renderExportButtons() {
  const config = getActiveConfig();
  elements.imageButton.disabled = !config.canExportImage;
  elements.imageButton.textContent = config.canExportImage ? "이미지 저장" : "HTML 전용";
}

function persistSoon(message = "자동 임시저장 완료") {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const savedAt = saveStoredState(state);
    state.updatedAt = savedAt;
    updateDraftStatus(savedAt, message);
  }, 350);
}

async function runExport(task, successMessage) {
  setExportBusy(true);
  try {
    await task();
    showToast(successMessage);
  } catch (error) {
    console.error(error);
    showToast(error.message || "내보내기 중 오류가 발생했습니다.");
  } finally {
    setExportBusy(false);
  }
}

function setExportBusy(isBusy) {
  elements.imageButton.disabled = isBusy || !getActiveConfig().canExportImage;
  elements.htmlButton.disabled = isBusy;
  elements.copyButton.disabled = isBusy;
  document.body.classList.toggle("is-busy", isBusy);
}

function getActiveConfig() {
  return STYLE_CONFIGS.find((config) => config.id === state.activeStyle) || STYLE_CONFIGS[0];
}

function getActiveData() {
  const config = getActiveConfig();
  return state.styles[config.baseStyle];
}

function getExportLabel(config) {
  return `${config.groupLabel} · ${config.label}`;
}

function updateDraftStatus(isoString, message) {
  const stamp = isoString ? new Date(isoString).toLocaleString("ko-KR", { hour12: false }) : "없음";
  elements.draftStatus.textContent = `${message} · 마지막 저장: ${stamp}`;
  showToast(message);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2200);
}

function normalizeState() {
  if (!state.openGroups) {
    state.openGroups = createDefaultState().openGroups;
  }

  const legacyMap = {
    instagram: "instagram-post",
    youtube: "youtube-watch",
    wiki: "wiki-document",
    netflix: "netflix-detail",
    musicplayer: "musicplayer-card",
    timeline: "timeline-profile",
    couple: "couple-type-b",
    messenger: "messenger-html",
  };

  if (legacyMap[state.activeStyle]) {
    state.activeStyle = legacyMap[state.activeStyle];
  }

  if (!STYLE_CONFIGS.some((config) => config.id === state.activeStyle)) {
    state.activeStyle = STYLE_CONFIGS[0].id;
  }

  normalizeMessengerData();
  normalizeInstagramData();
  applyActiveVariant();
}

function normalizeInstagramData() {
  const data = state.styles?.instagram;
  if (!data) return;
  if (!Array.isArray(data.highlights)) data.highlights = [];
  while (data.highlights.length < 1) data.highlights.push({ title: "new", image: "" });
  if (data.highlights.length > 3) data.highlights.length = 3;
}

function normalizeMessengerData() {
  const data = state.styles?.messenger;
  if (!data || !Array.isArray(data.messages)) return;

  data.messages = data.messages.map((message) => ({
    image: message.image || (Array.isArray(message.images) ? message.images[0] : "") || "",
    image2: message.image2 || (Array.isArray(message.images) ? message.images[1] : "") || "",
    text: message.text || "",
  }));
}

function applyActiveVariant() {
  const config = getActiveConfig();
  if (config.variantKey) {
    setByPath(state.styles[config.baseStyle], config.variantKey, config.variantValue);
  }
}

function syncActiveStyleFromData(path) {
  if (!["subtype", "mode", "layout"].includes(path)) return;
  const config = getActiveConfig();
  const value = getByPath(getActiveData(), path);
  const matching = STYLE_CONFIGS.find((item) => (
    item.baseStyle === config.baseStyle &&
    item.variantKey === path &&
    item.variantValue === value
  ));
  if (matching) state.activeStyle = matching.id;
}
})();
