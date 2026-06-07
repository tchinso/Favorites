(() => {
const { STYLE_CONFIGS } = window.CardStudioDefaults;
const { downloadText, makeFilename } = window.CardStudioUtils;

async function exportCardImage(styleId) {
  const config = STYLE_CONFIGS.find((item) => item.id === styleId);
  if (!config?.canExportImage) {
    throw new Error("???ㅽ??쇱? HTML ?대낫?닿린留?吏?먰빀?덈떎.");
  }
  if (config.baseStyle === "linestamp" && window.CardStudioLineStampExport) {
    const exported = await window.CardStudioLineStampExport(makeFilename(styleId, "png"));
    if (exported) return;
  }
  if (config.baseStyle === "musicplayer2") {
    const exported = await exportMusicPlayer2(makeFilename(styleId, "png"));
    if (exported) return;
  }
  const target = document.querySelector("[data-export-card]");
  if (!target) throw new Error("?대낫??誘몃━蹂닿린瑜?李얠쓣 ???놁뒿?덈떎.");

  target.classList.add("is-exporting");
  let canvas;
  try {
    canvas = await captureElementAsRenderedCanvas(target);
  } finally {
    target.classList.remove("is-exporting");
  }

  const link = document.createElement("a");
  link.download = makeFilename(styleId, "png");
  link.href = canvas.toDataURL("image/png", 1.0);
  document.body.append(link);
  link.click();
  link.remove();
}

async function buildStandaloneHtml(styleId, label, cardHtml) {
  const config = STYLE_CONFIGS.find((item) => item.id === styleId);
  if (config?.baseStyle === "musicplayer2") {
    try {
      const response = await fetch("musicplayer2.html");
      if (response.ok) return await response.text();
    } catch {
      // Fall through to the regular iframe wrapper when the source file cannot be fetched.
    }
  }
  const css = await collectCssText();
  const portableCardHtml = await inlineLocalImageSources(cardHtml);
  const title = `${label} Card`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeTitle(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Courier+Prime:wght@400;700&family=DM+Mono:wght@400;500&family=DM+Serif+Display:ital@0;1&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500;1,600&family=Fredoka+One&family=Gowun+Batang&family=Hahmlet:wght@400;600&family=Hi+Melody&family=IBM+Plex+Mono:wght@400;600;700&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@1,500;1,600&family=Nanum+Gothic&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=Noto+Serif+KR:wght@400;700&family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Outfit:wght@300;400;500;600;700;800;900&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Roboto:wght@400;500;700;900&family=Space+Mono:wght@400;700&family=Special+Elite&family=VT323&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Oswald:wght@300;400;700;900&family=Bebas+Neue&family=Raleway:wght@300;400;700&family=Anton&family=Noto+Serif+KR:wght@200;300;400;700&family=Gowun+Dodum&family=Nanum+Myeongjo:wght@400;700;800&family=Inter:wght@300;400;500;600;800;900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=DM+Mono:wght@400;500&family=Jua&family=Do+Hyeon&family=Gugi&family=Gaegu&family=Nanum+Brush+Script&family=Nanum+Pen+Script&family=Hi+Melody&family=East+Sea+Dokdo&family=Sunflower:wght@700&family=Bubblegum+Sans&family=Fredoka+One&family=Pacifico&family=Boogaloo&family=Lilita+One&family=Righteous&family=Comfortaa:wght@700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css">
<style>
${css}
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  background: #f3f4f6;
  padding: 24px;
}
.app-shell, .editor-panel, .preview-toolbar, .style-rail, .toast { display: none !important; }
.preview-stage { all: unset; display: block; }
</style>
</head>
<body>
${portableCardHtml}
${styleId === "messenger" || styleId === "messenger-html" ? messengerToggleScript() : ""}
</body>
</html>`;
}

async function exportMusicPlayer2(filename) {
  const frame = document.querySelector(".musicplayer2-frame");
  const doc = frame?.contentDocument;
  const win = frame?.contentWindow;
  const target = doc?.querySelector("#editor-body");
  const capture = win?.html2canvas || window.html2canvas;
  if (!target || !capture) return false;

  const canvas = await capture(target, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => {
      const clonedTarget = clonedDoc.querySelector("#editor-body");
      if (!clonedTarget) return;
      clonedTarget.style.width = "1150px";
      clonedTarget.style.maxWidth = "1150px";
      clonedTarget.style.padding = "50px 60px";
      clonedTarget.style.boxShadow = "none";
    },
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 1.0);
  document.body.append(link);
  link.click();
  link.remove();
  return true;
}

async function captureElementAsRenderedCanvas(target) {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("모바일이거나 브라우저가 캡쳐API를 지원하지 않아, 직접 캡쳐해야 합니다. 안드로이드는 브라우저에서 데스크탑 모드를 켜서 캡쳐하는 것을 권장합니다.");
  }

  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error("PNG로 내보낼 미리보기 영역을 찾을 수 없습니다.");
  }
  if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) {
    throw new Error("미리보기 카드가 화면 안에 보이도록 스크롤한 뒤 다시 내보내 주세요.");
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: "browser",
    },
    preferCurrentTab: true,
    audio: false,
  });

  let video;
  try {
    video = await streamToVideo(stream);
    const scaleX = video.videoWidth / window.innerWidth;
    const scaleY = video.videoHeight / window.innerHeight;
    const sourceX = Math.max(0, Math.round(rect.left * scaleX));
    const sourceY = Math.max(0, Math.round(rect.top * scaleY));
    const sourceWidth = Math.min(video.videoWidth - sourceX, Math.round(rect.width * scaleX));
    const sourceHeight = Math.min(video.videoHeight - sourceY, Math.round(rect.height * scaleY));
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      throw new Error("미리보기 카드가 화면 안에 보이도록 스크롤한 뒤 다시 내보내 주세요.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
    return canvas;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    video?.remove();
  }
}

function streamToVideo(stream) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.onloadedmetadata = async () => {
      try {
        await video.play();
        if (video.videoWidth && video.videoHeight) {
          resolve(video);
        } else {
          reject(new Error("화면 캡처 영상을 읽지 못했습니다."));
        }
      } catch (error) {
        reject(error);
      }
    };
    video.onerror = () => reject(new Error("화면 캡처 영상을 읽지 못했습니다."));
  });
}

async function downloadStandaloneHtml(styleId, label, cardHtml) {
  const html = await buildStandaloneHtml(styleId, label, cardHtml);
  downloadText(makeFilename(styleId, "html"), html, "text/html;charset=utf-8");
}

async function copyStandaloneHtml(styleId, label, cardHtml) {
  const html = await buildStandaloneHtml(styleId, label, cardHtml);
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(html);
      return;
    } catch {
      // Fall through to the textarea copy path for file:// and unfocused tabs.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = html;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function collectCssText() {
  let text = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      text += Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
    } catch {
      // Ignore cross-origin sheets. The local app stylesheet is same-origin.
    }
  }
  if (text.trim()) return text;
  try {
    const response = await fetch("assets/css/app.css");
    return response.ok ? response.text() : "";
  } catch {
    return "";
  }
}

async function inlineLocalImageSources(html) {
  const sources = collectLocalImageSources(html);
  if (!sources.length) return html;

  let nextHtml = html;
  for (const src of sources) {
    const dataUrl = await imageSourceToDataUrl(src);
    if (!dataUrl) continue;
    nextHtml = nextHtml.split(src).join(dataUrl);
  }
  return nextHtml;
}

function collectLocalImageSources(html) {
  const sources = new Set();
  const srcAttrPattern = /<img\b[^>]*\bsrc="([^"]+)"/gi;
  for (const match of html.matchAll(srcAttrPattern)) {
    if (isPortableCandidate(match[1])) sources.add(match[1]);
  }

  const jsonImagePattern = /"((?:\.\/)?(?:messenger|assets)\/[^"]+\.(?:png|jpe?g|webp|gif|svg))"/gi;
  for (const match of html.matchAll(jsonImagePattern)) {
    if (isPortableCandidate(match[1])) sources.add(match[1]);
  }
  return Array.from(sources);
}

function isPortableCandidate(src) {
  return Boolean(src) && !/^(?:data:|https?:|blob:|#)/i.test(src);
}

async function imageSourceToDataUrl(src) {
  try {
    const response = await fetch(src);
    if (!response.ok) return "";
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return "";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function escapeTitle(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function messengerToggleScript() {
  return `<script>
document.addEventListener("click", function(event) {
  var sendButton = event.target.closest("[data-msg-send]");
  if (sendButton) {
    sendNextMessengerItem(sendButton.closest("[data-messenger-card]"));
    return;
  }

  var photo = event.target.closest(".msg-photo");
  if (!photo) return;
  var item = photo.closest(".msg-item");
  var comment = item && item.querySelector(".msg-comment");
  if (comment) comment.classList.toggle("hide");
});

document.addEventListener("keydown", function(event) {
  var input = event.target.closest("[data-msg-input]");
  if (!input || event.key !== "Enter") return;
  event.preventDefault();
  sendNextMessengerItem(input.closest("[data-messenger-card]"));
});

function sendNextMessengerItem(card) {
  if (!card) return;
  var sequence = readMessengerSequence(card);
  var index = Number(card.dataset.nextIndex) || 0;
  if (index >= sequence.length) return;

  appendMessengerItem(card, sequence[index]);
  card.dataset.nextIndex = String(index + 1);

  var input = card.querySelector("[data-msg-input]");
  if (input) input.value = "";
}

function readMessengerSequence(card) {
  var script = card.querySelector("[data-msg-sequence]");
  if (!script) return [];
  try {
    var parsed = JSON.parse(script.textContent || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function appendMessengerItem(card, message) {
  var history = card.querySelector("[data-msg-history]");
  if (!history) return;

  var item = document.createElement("div");
  item.className = "msg-item";

  var photos = document.createElement("div");
  photos.className = "msg-photos";

  var images = message && Array.isArray(message.images)
    ? message.images.filter(Boolean)
    : [message && message.image, message && message.image2].filter(Boolean);

  if (images.length) {
    images.forEach(function(src) {
      var photo = document.createElement("div");
      photo.className = "msg-photo";
      var img = document.createElement("img");
      img.src = src;
      img.alt = "";
      photo.append(img);
      photos.append(photo);
    });
  } else {
    var photo = document.createElement("div");
    photo.className = "msg-photo placeholder";
    var placeholder = document.createElement("span");
    placeholder.textContent = "PHOTO";
    photo.append(placeholder);
    photos.append(photo);
  }

  var comment = document.createElement("div");
  comment.className = "msg-comment";
  comment.textContent = message && message.text ? message.text : "";

  item.append(photos, comment);
  history.append(item);
  setTimeout(function() {
    history.scrollTop = history.scrollHeight;
  }, 50);
}
</script>`;
}

window.CardStudioExporter = {
  exportCardImage,
  buildStandaloneHtml,
  downloadStandaloneHtml,
  copyStandaloneHtml,
};
})();
