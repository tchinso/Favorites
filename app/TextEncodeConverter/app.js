(() => {
  'use strict';
  const EngineModule = window.TextEncodingEngine;
  const iconv = resolveIconv();
  const engine = EngineModule.create({ iconv });
  const MAX_PREVIEW_BYTES = 2 * 1024 * 1024;
  const MAX_PREVIEW_CHARS = 180000;
  const LARGE_FILE_BYTES = 25 * 1024 * 1024;
  const state = { file: null, bytes: null, detection: null, sourceId: 'utf8', targetId: 'utf8', url: '', outputName: '' };
  const $ = (id) => document.getElementById(id);
  const dom = {
    drop: $('dropZone'), browse: $('browseButton'), sampleKo: $('sampleKoreanButton'), sampleJa: $('sampleJapaneseButton'), input: $('fileInput'), fileMeta: $('fileMeta'), summary: $('detectSummary'),
    badge: $('confidenceBadge'), bar: $('confidenceBar'), cards: $('candidateCards'), source: $('sourceEncodingSelect'), target: $('targetEncodingSelect'),
    allowLoss: $('allowLossCheckbox'), convert: $('convertButton'), download: $('downloadButton'), conversion: $('conversionMeta'),
    preview: $('mainPreview'), previewMeta: $('previewMeta'), apiIntro: $('apiIntro'), supportBody: $('apiSupportBody'), log: $('logArea')
  };

  function init() {
    populateSelects(); bindEvents(); renderSupport();
    log('info', `엔진 준비 완료 · iconv-lite ${iconv ? '사용 가능' : '사용 불가'}`);
    window.addEventListener('beforeunload', clearArtifact);
  }

  function bindEvents() {
    dom.browse.addEventListener('click', (event) => { event.stopPropagation(); dom.input.click(); });
    dom.sampleKo.addEventListener('click', async (event) => { event.stopPropagation(); await loadSample('cp949'); });
    dom.sampleJa.addEventListener('click', async (event) => { event.stopPropagation(); await loadSample('cp932'); });
    dom.drop.addEventListener('click', () => dom.input.click());
    dom.input.addEventListener('change', async () => { if (dom.input.files[0]) await loadFile(dom.input.files[0]); dom.input.value = ''; });
    ['dragenter', 'dragover'].forEach((name) => dom.drop.addEventListener(name, (event) => { event.preventDefault(); dom.drop.classList.add('dragging'); }));
    ['dragleave', 'dragend'].forEach((name) => dom.drop.addEventListener(name, () => dom.drop.classList.remove('dragging')));
    dom.drop.addEventListener('drop', async (event) => { event.preventDefault(); dom.drop.classList.remove('dragging'); if (event.dataTransfer.files[0]) await loadFile(event.dataTransfer.files[0]); });
    dom.source.addEventListener('change', () => selectSource(dom.source.value, false));
    dom.target.addEventListener('change', () => { state.targetId = dom.target.value; clearArtifact(); setConversion('', ''); });
    dom.allowLoss.addEventListener('change', () => { clearArtifact(); setConversion('', ''); });
    dom.convert.addEventListener('click', convert);
    dom.download.addEventListener('click', download);
  }

  async function loadFile(file) {
    clearArtifact(); setConversion('', '');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      state.file = file; state.bytes = bytes;
      const extension = extensionOf(file.name);
      state.detection = engine.detect(bytes, { extension });
      state.sourceId = state.detection.selectedId;
      dom.source.value = state.sourceId;
      dom.source.disabled = false; dom.target.disabled = false; dom.convert.disabled = false;
      dom.fileMeta.hidden = false;
      dom.fileMeta.textContent = `${file.name} · ${formatBytes(bytes.length)} · ${extension || '확장자 없음'}${state.detection.binary ? ' · 바이너리 가능성 있음' : ''}`;
      renderDetection(); renderCandidates(); updatePreview();
      log('success', `파일 분석 완료: ${file.name} (${formatBytes(bytes.length)})`);
      if (bytes.length > LARGE_FILE_BYTES) log('warn', '대용량 파일입니다. 감지는 앞부분 표본을 사용하고 변환은 전체 파일을 처리합니다.');
      if (state.detection.binary) log('warn', '제어/널 바이트 비율이 높아 바이너리 파일일 가능성이 있습니다.');
    } catch (error) { log('error', `파일 읽기 실패: ${error.message}`); setConversion(error.message, 'error'); }
  }

  async function loadSample(id) {
    const text = id === 'cp949'
      ? '안녕하세요. CP949 확장 한글 똠·햏을 포함한 한국어 인코딩 감지 샘플입니다.\r\n변환 전후의 줄바꿈도 그대로 보존합니다.'
      : 'こんにちは。東京から届いたCP932文字コードの検出サンプルです。\r\n変換後も改行をそのまま保持します。';
    const encoded = engine.encode(text, id);
    if (!encoded.ok) { setConversion(encoded.error, 'error'); return; }
    await loadFile(new File([encoded.bytes], `sample-${id}.txt`, { type: 'text/plain' }));
  }

  function renderDetection() {
    const result = state.detection; if (!result) return;
    const selected = engine.byId[result.selectedId]; const percent = Math.round(result.confidence * 100);
    dom.badge.className = `confidence-badge ${result.confidenceLabel === '높음' ? 'high' : result.confidenceLabel === '낮음' ? 'low' : ''}`;
    dom.badge.textContent = `${result.confidenceLabel} · ${percent}%`;
    dom.bar.style.width = `${percent}%`;
    const bomText = result.bom ? ` · ${result.bom.label}` : '';
    dom.summary.innerHTML = `<strong>${escapeHtml(selected.label)}</strong>으로 판단했습니다${bomText}. ${escapeHtml(result.note || '바이트 구조와 문자 분포가 가장 잘 맞습니다.')}`;
  }

  function renderCandidates() {
    dom.cards.innerHTML = '';
    const viable = state.detection.candidates.filter((item) => item.score > 0).slice(0, 6);
    for (const item of viable) {
      const button = document.createElement('button'); button.type = 'button'; button.className = `candidate-card${item.id === state.sourceId ? ' active' : ''}`;
      button.innerHTML = `<div class="candidate-title"><span>${escapeHtml(item.label)}</span><span class="candidate-score">${item.score.toFixed(1)}</span></div><div class="candidate-reasons">${escapeHtml(item.reasons.join(' · ') || 'ASCII 호환 또는 언어 증거 부족')}</div><pre>${escapeHtml(item.preview)}</pre>`;
      button.addEventListener('click', () => selectSource(item.id, false)); dom.cards.appendChild(button);
    }
    if (!viable.length) dom.cards.innerHTML = '<div class="empty">유효한 후보를 찾지 못했습니다. 수동으로 원본 인코딩을 선택하세요.</div>';
  }

  function selectSource(id, automatic) {
    if (!engine.byId[id]) return; state.sourceId = id; dom.source.value = id; clearArtifact(); setConversion('', ''); renderCandidates(); updatePreview();
    if (!automatic) log('info', `원본 인코딩 선택: ${engine.byId[id].label}`);
  }

  function updatePreview() {
    if (!state.bytes) return;
    const sliced = state.bytes.length > MAX_PREVIEW_BYTES; const bytes = sliced ? state.bytes.slice(0, MAX_PREVIEW_BYTES) : state.bytes;
    const result = engine.decode(bytes, state.sourceId, { strict: !sliced });
    if (!result.ok) { dom.preview.textContent = `[엄격 디코드 실패]\n${result.error}`; dom.previewMeta.textContent = engine.byId[state.sourceId].label; return; }
    const trimmed = result.text.length > MAX_PREVIEW_CHARS; dom.preview.textContent = trimmed ? `${result.text.slice(0, MAX_PREVIEW_CHARS)}\n…` : result.text;
    dom.previewMeta.textContent = `${engine.byId[state.sourceId].label} · ${result.engine}${sliced ? ` · 앞 ${formatBytes(MAX_PREVIEW_BYTES)}` : ''}${trimmed ? ' · 표시 길이 제한' : ''}`;
  }

  async function convert() {
    if (!state.bytes) return;
    dom.convert.disabled = true; dom.convert.textContent = '검증 및 변환 중…'; clearArtifact();
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const decoded = engine.decode(state.bytes, state.sourceId, { strict: true });
      if (!decoded.ok) throw new Error(`원본 바이트가 ${engine.byId[state.sourceId].label} 규칙에 맞지 않습니다: ${decoded.error}`);
      const encoded = engine.encode(decoded.text, state.targetId);
      if (!encoded.ok) throw new Error(encoded.error);
      const from = engine.byId[state.sourceId].label; const to = engine.byId[state.targetId].label;
      if (encoded.loss.count > 0 && !dom.allowLoss.checked) {
        const examples = encoded.loss.examples.map((item) => `${item.expected}→${item.actual}`).join(', ');
        setConversion(`변환을 중단했습니다. ${encoded.loss.count.toLocaleString()}개 문자 위치에서 손실 감지 (${examples}). 손실 허용을 켜거나 UTF 계열을 선택하세요.`, 'warning');
        log('warn', `${from} → ${to}: 왕복 손실로 출력 보류`); return;
      }
      setArtifact(encoded.bytes);
      const lossText = encoded.loss.count ? ` · 손실 ${encoded.loss.count.toLocaleString()}곳 허용됨` : ' · 왕복 손실 없음';
      setConversion(`${from} → ${to} · ${formatBytes(state.bytes.length)} → ${formatBytes(encoded.bytes.length)}${lossText}`, encoded.loss.count ? 'warning' : 'success');
      log(encoded.loss.count ? 'warn' : 'success', `변환 완료: ${from} → ${to}${lossText}`);
    } catch (error) { setConversion(error.message, 'error'); log('error', `변환 실패: ${error.message}`); }
    finally { dom.convert.disabled = false; dom.convert.textContent = '엄격 검증 후 변환'; }
  }

  function setArtifact(bytes) {
    clearArtifact(); const blob = new Blob([bytes], { type: 'application/octet-stream' }); state.url = URL.createObjectURL(blob); state.outputName = outputName(state.file.name, state.targetId);
    dom.download.disabled = false; dom.download.textContent = `결과 다운로드 (${formatBytes(bytes.length)})`;
  }
  function clearArtifact() { if (state.url) URL.revokeObjectURL(state.url); state.url = ''; state.outputName = ''; dom.download.disabled = true; dom.download.textContent = '결과 다운로드'; }
  function download() { if (!state.url) return; const anchor = document.createElement('a'); anchor.href = state.url; anchor.download = state.outputName; document.body.appendChild(anchor); anchor.click(); anchor.remove(); log('info', `다운로드: ${state.outputName}`); }

  function populateSelects() {
    addGroupedOptions(dom.source, engine.encodings.filter((item) => item.detect || item.id === 'ascii'));
    addGroupedOptions(dom.target, engine.encodings.filter((item) => item.target));
    dom.source.value = state.sourceId; dom.target.value = state.targetId;
  }
  function addGroupedOptions(select, items) {
    const groups = new Map(); for (const item of items) { if (!groups.has(item.group)) groups.set(item.group, []); groups.get(item.group).push(item); }
    for (const [name, encodings] of groups) { const group = document.createElement('optgroup'); group.label = name; for (const encoding of encodings) { const option = document.createElement('option'); option.value = encoding.id; option.textContent = select === dom.target && encoding.targetLabel ? encoding.targetLabel : encoding.label; const support = engine.supports(encoding.id); if (select === dom.target && !support.encode) { option.disabled = true; option.textContent += ' (인코더 없음)'; } group.appendChild(option); } select.appendChild(group); }
  }

  function renderSupport() {
    dom.apiIntro.textContent = `브라우저 기본 디코더와 로컬 iconv-lite를 조합합니다. 레거시 출력 인코더: ${iconv ? '준비됨' : '사용 불가'}. ISO-2022-JP/KR은 엄격 변환기를 추가로 사용합니다.`;
    for (const encoding of engine.encodings.filter((item) => item.detect || item.target)) { const support = engine.supports(encoding.id); const row = document.createElement('tr'); row.innerHTML = `<td>${escapeHtml(encoding.label)}</td><td>${escapeHtml(encoding.group)}</td><td>${support.decode ? '지원' : '미지원'}</td><td>${support.encode ? '지원' : '미지원'}</td>`; dom.supportBody.appendChild(row); }
  }

  function resolveIconv() {
    const candidates = [window.iconv, window.iconvLite, window.iconvLiteUmd, window.Iconv, window.default];
    if (typeof window.encode === 'function' && typeof window.decode === 'function') candidates.push({ encode: window.encode, decode: window.decode, encodingExists: window.encodingExists });
    for (const candidate of candidates) { const value = candidate && candidate.default ? candidate.default : candidate; if (value && typeof value.encode === 'function' && typeof value.decode === 'function') return value; }
    return null;
  }
  function setConversion(message, kind) { dom.conversion.textContent = message; dom.conversion.className = `conversion-meta${kind ? ` ${kind}` : ''}`; }
  function extensionOf(name) { const match = /(?:^|\/)(?:.*?)(\.[^.\/]+)$/.exec(name); return match ? match[1].toLowerCase() : ''; }
  function outputName(name, id) { const dot = name.lastIndexOf('.'); const base = dot > 0 ? name.slice(0, dot) : name; const ext = dot > 0 ? name.slice(dot) : '.txt'; return `${base}.${id}${ext}`; }
  function formatBytes(value) { if (value < 1024) return `${value} B`; if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`; if (value < 1073741824) return `${(value / 1048576).toFixed(2)} MB`; return `${(value / 1073741824).toFixed(2)} GB`; }
  function escapeHtml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function log(level, message) { const line = document.createElement('div'); line.className = `log-line ${level}`; line.textContent = `[${new Date().toLocaleTimeString('ko-KR', { hour12: false })}] ${message}`; dom.log.prepend(line); while (dom.log.childElementCount > 120) dom.log.lastElementChild.remove(); }
  document.addEventListener('DOMContentLoaded', init);
})();
