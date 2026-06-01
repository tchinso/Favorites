(() => {
const { STYLE_CONFIGS } = window.CardStudioDefaults;
const { downloadText, makeFilename } = window.CardStudioUtils;

async function exportCardImage(styleId) {
  const config = STYLE_CONFIGS.find((item) => item.id === styleId);
  if (!config?.canExportImage) {
    throw new Error("이 스타일은 HTML 내보내기만 지원합니다.");
  }
  const target = document.querySelector("[data-export-card]");
  if (!target) throw new Error("내보낼 미리보기를 찾을 수 없습니다.");
  if (!window.html2canvas) throw new Error("이미지 내보내기 라이브러리가 아직 로드되지 않았습니다.");

  target.classList.add("is-exporting");
  let canvas;
  try {
    canvas = await window.html2canvas(target, {
      backgroundColor: null,
      scale: Math.max(2, Math.min(3, window.devicePixelRatio || 2)),
      useCORS: true,
      logging: false,
    });
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
  const css = await collectCssText();
  const title = `${label} Card`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeTitle(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
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
${cardHtml}
${styleId === "messenger" || styleId === "messenger-html" ? messengerToggleScript() : ""}
</body>
</html>`;
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

function escapeTitle(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function messengerToggleScript() {
  return `<script>
document.addEventListener("click", function(event) {
  var photo = event.target.closest(".msg-photo");
  if (!photo) return;
  var item = photo.closest(".msg-item");
  var comment = item && item.querySelector(".msg-comment");
  if (comment) comment.hidden = !comment.hidden;
});
</script>`;
}

window.CardStudioExporter = {
  exportCardImage,
  buildStandaloneHtml,
  downloadStandaloneHtml,
  copyStandaloneHtml,
};
})();
