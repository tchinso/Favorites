(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TextEncodingEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BOM = {
    utf8: Uint8Array.from([0xef, 0xbb, 0xbf]),
    utf16le: Uint8Array.from([0xff, 0xfe]),
    utf16be: Uint8Array.from([0xfe, 0xff]),
    utf32le: Uint8Array.from([0xff, 0xfe, 0x00, 0x00]),
    utf32be: Uint8Array.from([0x00, 0x00, 0xfe, 0xff])
  };

  const ENCODINGS = [
    { id: 'utf8', label: 'UTF-8', targetLabel: 'UTF-8 (BOM 없음)', group: 'Unicode', detect: true, target: true, decoder: 'utf-8' },
    { id: 'utf8bom', label: 'UTF-8 (BOM 포함)', group: 'Unicode', target: true, base: 'utf8', bom: 'utf8' },
    { id: 'utf16le', label: 'UTF-16 LE', targetLabel: 'UTF-16 LE (BOM 없음)', group: 'Unicode', detect: true, target: true },
    { id: 'utf16lebom', label: 'UTF-16 LE (BOM 포함)', group: 'Unicode', target: true, base: 'utf16le', bom: 'utf16le' },
    { id: 'utf16be', label: 'UTF-16 BE', targetLabel: 'UTF-16 BE (BOM 없음)', group: 'Unicode', detect: true, target: true },
    { id: 'utf16bebom', label: 'UTF-16 BE (BOM 포함)', group: 'Unicode', target: true, base: 'utf16be', bom: 'utf16be' },
    { id: 'utf32le', label: 'UTF-32 LE', targetLabel: 'UTF-32 LE (BOM 없음)', group: 'Unicode', detect: true, target: true },
    { id: 'utf32lebom', label: 'UTF-32 LE (BOM 포함)', group: 'Unicode', target: true, base: 'utf32le', bom: 'utf32le' },
    { id: 'utf32be', label: 'UTF-32 BE', targetLabel: 'UTF-32 BE (BOM 없음)', group: 'Unicode', detect: true, target: true },
    { id: 'utf32bebom', label: 'UTF-32 BE (BOM 포함)', group: 'Unicode', target: true, base: 'utf32be', bom: 'utf32be' },
    { id: 'cp949', label: 'CP949 / UHC (한국 Windows)', group: '한국어', detect: true, target: true, decoder: 'euc-kr', iconv: 'cp949', language: 'ko' },
    { id: 'euckr', label: 'EUC-KR / KS X 1001', group: '한국어', detect: true, target: true, decoder: 'euc-kr', iconv: 'euc-kr', language: 'ko', strictSubset: true },
    { id: 'iso2022kr', label: 'ISO-2022-KR (레거시 메일)', group: '한국어', detect: true, target: true, language: 'ko', custom: true },
    { id: 'cp932', label: 'CP932 / Windows-31J / Shift_JIS', group: '일본어', detect: true, target: true, decoder: 'shift_jis', iconv: 'cp932', language: 'ja' },
    { id: 'eucjp', label: 'EUC-JP', group: '일본어', detect: true, target: true, decoder: 'euc-jp', iconv: 'euc-jp', language: 'ja' },
    { id: 'iso2022jp', label: 'ISO-2022-JP / JIS (레거시 메일)', group: '일본어', detect: true, target: true, decoder: 'iso-2022-jp', language: 'ja', custom: true },
    { id: 'gb18030', label: 'GB18030 (중국어)', group: '중국어', detect: true, target: true, decoder: 'gb18030', iconv: 'gb18030', language: 'zh' },
    { id: 'gbk', label: 'GBK / CP936 (중국어)', group: '중국어', detect: true, target: true, decoder: 'gbk', iconv: 'gbk', language: 'zh' },
    { id: 'big5', label: 'Big5 (번체 중국어)', group: '중국어', detect: true, target: true, decoder: 'big5', iconv: 'big5', language: 'zh' },
    { id: 'windows1252', label: 'Windows-1252', group: '서유럽', detect: true, target: true, decoder: 'windows-1252', iconv: 'windows1252', language: 'latin' },
    { id: 'iso88591', label: 'ISO-8859-1 / Latin-1', group: '서유럽', detect: true, target: true, decoder: 'iso-8859-1', iconv: 'iso-8859-1', language: 'latin' },
    { id: 'iso885915', label: 'ISO-8859-15 / Latin-9', group: '서유럽', detect: true, target: true, decoder: 'iso-8859-15', iconv: 'iso-8859-15', language: 'latin' },
    { id: 'ascii', label: 'ASCII (7-bit)', group: '기타', target: true, decoder: 'ascii', iconv: 'ascii', language: 'ascii' }
  ];

  const BY_ID = Object.fromEntries(ENCODINGS.map((item) => [item.id, item]));
  const DETECT_IDS = ENCODINGS.filter((item) => item.detect).map((item) => item.id);
  const EXTENSION_PRIORS = {
    '.bat': { cp949: 7, cp932: 6, windows1252: 5, utf8: 4 },
    '.cmd': { cp949: 7, cp932: 6, windows1252: 5, utf8: 4 },
    '.ps1': { utf8: 8, utf16le: 7, cp949: 2, windows1252: 2 },
    '.smi': { cp949: 6, euckr: 5, utf8: 5, cp932: 2 },
    '.srt': { utf8: 5, cp949: 4, euckr: 4, cp932: 4, windows1252: 3 },
    '.ass': { utf8: 6, cp949: 4, euckr: 4, cp932: 4 },
    '.csv': { utf8: 5, cp949: 5, windows1252: 4, gb18030: 4 },
    '.md': { utf8: 8 }, '.json': { utf8: 9 }, '.xml': { utf8: 7 }, '.html': { utf8: 7 }
  };

  function asBytes(value) {
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return Uint8Array.from(value || []);
  }

  function concat(parts) {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) { output.set(part, offset); offset += part.length; }
    return output;
  }

  function startsWith(bytes, prefix) {
    if (bytes.length < prefix.length) return false;
    for (let i = 0; i < prefix.length; i += 1) if (bytes[i] !== prefix[i]) return false;
    return true;
  }

  function detectBom(input) {
    const bytes = asBytes(input);
    if (startsWith(bytes, BOM.utf32le)) return { id: 'utf32le', outputId: 'utf32lebom', label: 'UTF-32 LE BOM', length: 4 };
    if (startsWith(bytes, BOM.utf32be)) return { id: 'utf32be', outputId: 'utf32bebom', label: 'UTF-32 BE BOM', length: 4 };
    if (startsWith(bytes, BOM.utf8)) return { id: 'utf8', outputId: 'utf8bom', label: 'UTF-8 BOM', length: 3 };
    if (startsWith(bytes, BOM.utf16le)) return { id: 'utf16le', outputId: 'utf16lebom', label: 'UTF-16 LE BOM', length: 2 };
    if (startsWith(bytes, BOM.utf16be)) return { id: 'utf16be', outputId: 'utf16bebom', label: 'UTF-16 BE BOM', length: 2 };
    return null;
  }

  function validateUtf8(bytes, allowTruncated) {
    let invalid = 0; let units = 0; let i = startsWith(bytes, BOM.utf8) ? 3 : 0;
    while (i < bytes.length) {
      const b = bytes[i];
      if (b <= 0x7f) { i += 1; continue; }
      let needed; let min2 = 0x80; let max2 = 0xbf;
      if (b >= 0xc2 && b <= 0xdf) needed = 1;
      else if (b >= 0xe0 && b <= 0xef) { needed = 2; if (b === 0xe0) min2 = 0xa0; if (b === 0xed) max2 = 0x9f; }
      else if (b >= 0xf0 && b <= 0xf4) { needed = 3; if (b === 0xf0) min2 = 0x90; if (b === 0xf4) max2 = 0x8f; }
      else { invalid += 1; i += 1; continue; }
      if (i + needed >= bytes.length) { if (!allowTruncated) invalid += bytes.length - i; break; }
      if (bytes[i + 1] < min2 || bytes[i + 1] > max2) { invalid += 1; i += 1; continue; }
      let ok = true;
      for (let j = 2; j <= needed; j += 1) if (bytes[i + j] < 0x80 || bytes[i + j] > 0xbf) ok = false;
      if (!ok) { invalid += 1; i += 1; continue; }
      units += 1; i += needed + 1;
    }
    return resultValidation(bytes, invalid, units, { signature: units });
  }

  function validatePairEncoding(bytes, kind, allowTruncated) {
    let invalid = 0; let units = 0; let extension = 0; let kana = 0; let plane2 = 0;
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i];
      if (b <= 0x7f) { i += 1; continue; }
      if (kind === 'cp932' && b >= 0xa1 && b <= 0xdf) { kana += 1; units += 1; i += 1; continue; }
      if (kind === 'eucjp' && b === 0x8e) {
        if (i + 1 >= bytes.length) { if (!allowTruncated) invalid += 1; break; }
        if (bytes[i + 1] >= 0xa1 && bytes[i + 1] <= 0xdf) { kana += 1; units += 1; i += 2; } else { invalid += 1; i += 1; }
        continue;
      }
      if (kind === 'eucjp' && b === 0x8f) {
        if (i + 2 >= bytes.length) { if (!allowTruncated) invalid += bytes.length - i; break; }
        if (inRange(bytes[i + 1], 0xa1, 0xfe) && inRange(bytes[i + 2], 0xa1, 0xfe)) { plane2 += 1; units += 1; i += 3; } else { invalid += 1; i += 1; }
        continue;
      }
      if (i + 1 >= bytes.length) { if (!allowTruncated) invalid += 1; break; }
      const t = bytes[i + 1]; let ok = false;
      if (kind === 'cp932') ok = (inRange(b, 0x81, 0x9f) || inRange(b, 0xe0, 0xfc)) && (inRange(t, 0x40, 0x7e) || inRange(t, 0x80, 0xfc));
      else if (kind === 'eucjp' || kind === 'euckr') ok = inRange(b, 0xa1, 0xfe) && inRange(t, 0xa1, 0xfe);
      else if (kind === 'cp949') {
        const ks = inRange(b, 0xa1, 0xfe) && inRange(t, 0xa1, 0xfe);
        const uhc = inRange(b, 0x81, 0xc6) && (inRange(t, 0x41, 0x5a) || inRange(t, 0x61, 0x7a) || inRange(t, 0x81, 0xfe));
        ok = ks || uhc; if (uhc && !ks) extension += 1;
      } else if (kind === 'gbk') ok = inRange(b, 0x81, 0xfe) && inRange(t, 0x40, 0xfe) && t !== 0x7f;
      else if (kind === 'big5') ok = inRange(b, 0x81, 0xfe) && (inRange(t, 0x40, 0x7e) || inRange(t, 0xa1, 0xfe));
      if (ok) { units += 1; i += 2; } else { invalid += 1; i += 1; }
    }
    return resultValidation(bytes, invalid, units, { extension, kana, plane2, signature: units + kana + plane2 });
  }

  function validateGb18030(bytes, allowTruncated) {
    let invalid = 0; let units = 0; let fourByte = 0;
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i]; if (b <= 0x7f) { i += 1; continue; }
      if (!inRange(b, 0x81, 0xfe)) { invalid += 1; i += 1; continue; }
      if (i + 1 >= bytes.length) { if (!allowTruncated) invalid += 1; break; }
      const b2 = bytes[i + 1];
      if (inRange(b2, 0x40, 0xfe) && b2 !== 0x7f) { units += 1; i += 2; continue; }
      if (inRange(b2, 0x30, 0x39)) {
        if (i + 3 >= bytes.length) { if (!allowTruncated) invalid += bytes.length - i; break; }
        if (inRange(bytes[i + 2], 0x81, 0xfe) && inRange(bytes[i + 3], 0x30, 0x39)) { units += 1; fourByte += 1; i += 4; continue; }
      }
      invalid += 1; i += 1;
    }
    return resultValidation(bytes, invalid, units, { fourByte, signature: units + fourByte * 3 });
  }

  function validateIso2022(bytes, kind) {
    let invalid = 0; let units = 0; let escapes = 0; let shifted = false; let mode = 'ascii';
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i];
      if (b > 0x7f) { invalid += 1; i += 1; continue; }
      if (b === 0x1b) {
        const tail = Array.from(bytes.slice(i, i + 4));
        if (kind === 'jp' && tail.length >= 3 && tail[1] === 0x28 && [0x42, 0x4a, 0x49].includes(tail[2])) { mode = tail[2] === 0x49 ? 'kana' : 'ascii'; escapes += 1; i += 3; continue; }
        if (kind === 'jp' && tail.length >= 3 && tail[1] === 0x24 && [0x40, 0x42].includes(tail[2])) { mode = 'jis'; escapes += 1; i += 3; continue; }
        if (kind === 'kr' && tail.length >= 4 && tail[1] === 0x24 && tail[2] === 0x29 && tail[3] === 0x43) { escapes += 1; i += 4; continue; }
        invalid += 1; i += 1; continue;
      }
      if (kind === 'kr' && b === 0x0e) { shifted = true; i += 1; continue; }
      if (kind === 'kr' && b === 0x0f) { shifted = false; i += 1; continue; }
      const doubleMode = kind === 'jp' ? mode === 'jis' : shifted;
      if (doubleMode) {
        if (i + 1 < bytes.length && inRange(b, 0x21, 0x7e) && inRange(bytes[i + 1], 0x21, 0x7e)) { units += 1; i += 2; }
        else { invalid += 1; i += 1; }
      } else { if (kind === 'jp' && mode === 'kana' && !inRange(b, 0x21, 0x5f) && b >= 0x20) invalid += 1; i += 1; }
    }
    if (escapes === 0) invalid += 1;
    return resultValidation(bytes, invalid, units, { escapes, signature: escapes * 5 + units });
  }

  function validateUnicodeWidth(bytes, width, littleEndian) {
    const bom = detectBom(bytes); const offset = bom && bom.id === `utf${width}${littleEndian ? 'le' : 'be'}` ? bom.length : 0;
    let invalid = (bytes.length - offset) % (width / 8); let units = 0; let laneNulls = 0; let expectedNulls = 0;
    const step = width / 8;
    for (let i = offset; i + step - 1 < bytes.length; i += step) {
      if (width === 16) {
        const code = littleEndian ? bytes[i] | (bytes[i + 1] << 8) : (bytes[i] << 8) | bytes[i + 1];
        if (code >= 0xd800 && code <= 0xdbff) {
          if (i + 3 >= bytes.length) { invalid += 1; break; }
          const next = littleEndian ? bytes[i + 2] | (bytes[i + 3] << 8) : (bytes[i + 2] << 8) | bytes[i + 3];
          if (next < 0xdc00 || next > 0xdfff) invalid += 1; else i += 2;
        } else if (code >= 0xdc00 && code <= 0xdfff) invalid += 1;
      } else {
        const cp = littleEndian ? ((bytes[i] | bytes[i + 1] << 8 | bytes[i + 2] << 16 | bytes[i + 3] << 24) >>> 0) : ((bytes[i] << 24 | bytes[i + 1] << 16 | bytes[i + 2] << 8 | bytes[i + 3]) >>> 0);
        if (cp > 0x10ffff || inRange(cp, 0xd800, 0xdfff)) invalid += 1;
      }
      units += 1;
      for (let j = 0; j < step; j += 1) if (bytes[i + j] === 0) { laneNulls += 1; if ((littleEndian && j > 0) || (!littleEndian && j < step - 1)) expectedNulls += 1; }
    }
    const laneRatio = laneNulls ? expectedNulls / laneNulls : 0;
    return resultValidation(bytes, invalid, units, { laneRatio, signature: laneNulls });
  }

  function resultValidation(bytes, invalid, units, extra) {
    return Object.assign({ valid: invalid === 0, invalid, units, highBytes: countHigh(bytes), asciiOnly: countHigh(bytes) === 0 }, extra || {});
  }
  function inRange(value, min, max) { return value >= min && value <= max; }
  function countHigh(bytes) { let count = 0; for (const b of bytes) if (b >= 0x80) count += 1; return count; }

  function validateBytes(input, id, options) {
    const bytes = asBytes(input); const allowTruncated = !!(options && options.allowTruncated);
    if (id === 'utf8') return validateUtf8(bytes, allowTruncated);
    if (id === 'utf16le') return validateUnicodeWidth(bytes, 16, true);
    if (id === 'utf16be') return validateUnicodeWidth(bytes, 16, false);
    if (id === 'utf32le') return validateUnicodeWidth(bytes, 32, true);
    if (id === 'utf32be') return validateUnicodeWidth(bytes, 32, false);
    if (['cp932', 'eucjp', 'euckr', 'cp949', 'gbk', 'big5'].includes(id)) return validatePairEncoding(bytes, id, allowTruncated);
    if (id === 'gb18030') return validateGb18030(bytes, allowTruncated);
    if (id === 'iso2022jp') return validateIso2022(bytes, 'jp');
    if (id === 'iso2022kr') return validateIso2022(bytes, 'kr');
    if (id === 'ascii') return resultValidation(bytes, countHigh(bytes), 0, { signature: 0 });
    return resultValidation(bytes, 0, 0, { signature: 0 });
  }

  function resolveBase(id) { return BY_ID[id] && BY_ID[id].base ? BY_ID[id].base : id; }

  function create(options) {
    const iconv = options && options.iconv ? options.iconv : null;
    function decode(input, requestedId, decodeOptions) {
      const bytes = asBytes(input); const id = resolveBase(requestedId); const config = BY_ID[id];
      const strict = !decodeOptions || decodeOptions.strict !== false;
      if (!config) return failure(`알 수 없는 인코딩: ${requestedId}`);
      const inputBom = detectBom(bytes);
      if (strict && inputBom && id.startsWith('utf') && inputBom.id !== id) return failure(`${inputBom.label}이 선택한 ${config.label}과 일치하지 않습니다.`);
      const validation = validateBytes(bytes, id);
      if (strict && !validation.valid) return failure(`유효하지 않은 ${config.label} 바이트 (${validation.invalid}곳)`, validation);
      try {
        let text; let engine;
        if (id === 'utf16le' || id === 'utf16be') { text = decodeUtf16(bytes, id === 'utf16le'); engine = 'strict UTF-16'; }
        else if (id === 'utf32le' || id === 'utf32be') { text = decodeUtf32(bytes, id === 'utf32le'); engine = 'strict UTF-32'; }
        else if (id === 'iso2022jp') { const converted = iso2022JpToEucJp(bytes); const result = decodeLegacy(converted, BY_ID.eucjp, iconv, strict); text = result.text; engine = `ISO-2022-JP → ${result.engine}`; }
        else if (id === 'iso2022kr') { const converted = iso2022KrToEucKr(bytes); const result = decodeLegacy(converted, BY_ID.euckr, iconv, strict); text = result.text; engine = `ISO-2022-KR → ${result.engine}`; }
        else if (id === 'utf8') { text = new TextDecoder('utf-8', { fatal: strict }).decode(stripMatchingBom(bytes, id)); engine = 'TextDecoder(utf-8, strict)'; }
        else { const result = decodeLegacy(bytes, config, iconv, strict); text = result.text; engine = result.engine; }
        return { ok: true, text, engine, validation };
      } catch (error) { return failure(error && error.message ? error.message : String(error), validation); }
    }

    function encode(text, requestedId) {
      const config = BY_ID[requestedId]; if (!config) return failure(`알 수 없는 인코딩: ${requestedId}`);
      const id = resolveBase(requestedId);
      try {
        let bytes;
        if (id === 'utf8') bytes = new TextEncoder().encode(text);
        else if (id === 'utf16le' || id === 'utf16be') bytes = encodeUtf16(text, id === 'utf16le');
        else if (id === 'utf32le' || id === 'utf32be') bytes = encodeUtf32(text, id === 'utf32le');
        else if (id === 'iso2022jp') bytes = eucJpToIso2022Jp(encodeLegacy(text, BY_ID.eucjp, iconv));
        else if (id === 'iso2022kr') bytes = eucKrToIso2022Kr(encodeLegacy(text, BY_ID.euckr, iconv));
        else bytes = encodeLegacy(text, BY_ID[id], iconv);
        const bomKey = config.bom;
        if (bomKey) bytes = concat([BOM[bomKey], stripMatchingBom(bytes, id)]);
        const validation = validateBytes(stripMatchingBom(bytes, id), id);
        if (!validation.valid) return failure(`${config.label} 출력 바이트 검증 실패 (${validation.invalid}곳)`, validation);
        const roundTrip = decode(bytes, requestedId, { strict: true });
        const loss = compareText(text, roundTrip.ok ? roundTrip.text : '');
        return { ok: true, bytes, validation, loss, roundTripOk: roundTrip.ok, warning: loss.count ? `${loss.count.toLocaleString()}개 문자 위치가 왕복 변환에서 달라집니다.` : '' };
      } catch (error) { return failure(error && error.message ? error.message : String(error)); }
    }

    function detect(input, detectionOptions) {
      const bytes = asBytes(input); const opts = detectionOptions || {}; const bom = detectBom(bytes);
      if (!bytes.length) return { selectedId: 'utf8', confidence: 0, confidenceLabel: '판단 불가', candidates: [], bom: null, asciiOnly: true, binary: false, note: '빈 파일' };
      const max = opts.maxSampleBytes || 256 * 1024;
      const sample = bytes.length > max ? bytes.slice(0, max) : bytes;
      const asciiOnly = countHigh(sample) === 0 && !sample.includes(0);
      const candidates = DETECT_IDS.map((id) => evaluate(id, sample, opts.extension || '', bom, decode)).sort((a, b) => b.score - a.score);
      let selectedId = candidates[0] ? candidates[0].id : 'utf8'; let note = '';
      const isoSignature = candidates.find((item) => (item.id === 'iso2022jp' || item.id === 'iso2022kr') && item.validation && item.validation.escapes > 0 && item.score > -500);
      if (bom) { selectedId = bom.id; note = `${bom.label}이 인코딩을 확정합니다.`; }
      else if (isoSignature) { selectedId = isoSignature.id; note = 'ISO-2022 상태 전환 이스케이프가 인코딩을 식별합니다.'; }
      else if (asciiOnly) { selectedId = 'utf8'; note = '7-bit ASCII 범위만 사용되어 여러 ASCII 호환 인코딩과 구별할 수 없습니다. UTF-8로 안전하게 처리합니다.'; }
      else {
        const euc = candidates.find((item) => item.id === 'euckr');
        const cp949 = candidates.find((item) => item.id === 'cp949');
        if ((selectedId === 'euckr' || selectedId === 'cp949') && euc && cp949 && euc.score > -500 && cp949.validation.extension === 0 && Math.abs(euc.score - cp949.score) < 4) {
          selectedId = 'euckr';
          note = '모든 한글 바이트가 EUC-KR 영역에 있어 CP949와 바이트만으로 구별할 수 없습니다. 더 좁은 호환 규격인 EUC-KR로 표시합니다.';
        }
      }
      const selected = candidates.find((item) => item.id === selectedId) || candidates[0];
      const runnerUp = candidates.find((item) => item.id !== selectedId && item.score > -500);
      const gap = selected && runnerUp ? selected.score - runnerUp.score : 100;
      let confidence = bom ? 0.995 : isoSignature ? 0.98 : asciiOnly ? 0.55 : clamp(0.35 + Math.max(0, gap) / 100 + Math.max(0, (selected ? selected.score : 0) - 80) / 400, 0.15, 0.98);
      if (!bom && !isoSignature && selected && selected.validation && selected.validation.signature >= 2) confidence = Math.min(0.98, confidence + 0.06);
      if (note.includes('CP949와')) confidence = Math.min(confidence, 0.68);
      if (!note && confidence < 0.7) note = '상위 후보의 차이가 작습니다. 후보 미리보기와 깨진 문자 여부를 확인하세요.';
      return { selectedId, confidence, confidenceLabel: confidence >= 0.9 ? '높음' : confidence >= 0.7 ? '중간' : '낮음', candidates, bom, asciiOnly, binary: isLikelyBinary(bytes, bom), note };
    }

    return { decode, encode, detect, validateBytes, detectBom, encodings: ENCODINGS, byId: BY_ID, supports: (id) => supportsEncoding(BY_ID[id], iconv) };
  }

  function decodeLegacy(bytes, config, iconv, strict) {
    // The bundled tables are preferred for legacy encodings. Some otherwise
    // conforming runtimes expose "euc-kr" but omit CP949/UHC extension mappings.
    // Byte validation above supplies strictness before this table lookup.
    if (iconv && typeof iconv.decode === 'function' && iconvExists(iconv, config.iconv)) return { text: String(iconv.decode(asBytes(bytes), config.iconv)), engine: `iconv-lite(${config.iconv}, validated)` };
    if (config.decoder && typeof TextDecoder !== 'undefined') {
      try { return { text: new TextDecoder(config.decoder, { fatal: strict }).decode(bytes), engine: `TextDecoder(${config.decoder}${strict ? ', strict' : ''})` }; } catch (error) { throw error; }
    }
    throw new Error(`${config.label} 디코더를 이 브라우저에서 사용할 수 없습니다.`);
  }

  function encodeLegacy(text, config, iconv) {
    if (!iconv || typeof iconv.encode !== 'function' || !iconvExists(iconv, config.iconv)) throw new Error(`${config.label} 인코더를 사용할 수 없습니다.`);
    const bytes = asBytes(iconv.encode(text, config.iconv));
    if (config.id === 'euckr') {
      const validation = validatePairEncoding(bytes, 'euckr', false);
      if (!validation.valid) throw new Error('EUC-KR에 없는 문자가 포함되어 있습니다. CP949 또는 UTF-8을 선택하세요.');
    }
    return bytes;
  }

  function iconvExists(iconv, label) { try { return !iconv.encodingExists || !!iconv.encodingExists(label); } catch (_error) { return false; } }

  function supportsEncoding(config, iconv) {
    if (!config) return { decode: false, encode: false };
    const id = resolveBase(config.id);
    if (id.startsWith('utf') || id === 'iso2022jp' || id === 'iso2022kr') return { decode: true, encode: id.startsWith('utf') || !!iconv };
    let nativeDecode = false; try { if (config.decoder) { new TextDecoder(config.decoder); nativeDecode = true; } } catch (_error) { /* no-op */ }
    const iconvOk = !!(iconv && config.iconv && iconvExists(iconv, config.iconv));
    return { decode: nativeDecode || iconvOk, encode: iconvOk, nativeDecode, iconv: iconvOk };
  }

  function evaluate(id, sample, extension, bom, decode) {
    const config = BY_ID[id]; const validation = validateBytes(sample, id, { allowTruncated: true }); const reasons = [];
    if (!validation.valid) return { id, label: config.label, score: -600 - validation.invalid, preview: '[바이트 구조 불일치]', engine: '-', validation, reasons: [`유효하지 않은 바이트 ${validation.invalid}곳`] };
    // The bounded sample can end between multibyte code units. Structural validation
    // already allows that final partial unit, so preview decoding is deliberately lenient.
    const decoded = decode(sample, id, { strict: false });
    if (!decoded.ok) return { id, label: config.label, score: -550, preview: `[디코드 실패] ${decoded.error}`, engine: '-', validation, reasons: ['엄격 디코드 실패'] };
    const text = decoded.text; let score = 40 + textQuality(text); const language = languageLikelihood(text); const highRatio = validation.highBytes / Math.max(sample.length, 1);
    if (bom) { if (bom.id === id) { score += 1000; reasons.push('BOM 일치'); } else if (id.startsWith('utf')) score -= 250; }
    if (id === 'utf8') { if (validation.units) { score += 105 + Math.min(30, validation.units / 8); reasons.push(`유효한 UTF-8 멀티바이트 ${validation.units}개`); } else score += 18; }
    if (id.startsWith('utf16') || id.startsWith('utf32')) {
      score += validation.laneRatio * 80; if (validation.signature && validation.laneRatio > 0.7) reasons.push('널 바이트 위치가 엔디언 패턴과 일치');
      if (!bom && validation.laneRatio < 0.45) score -= 100;
    }
    if (id === 'iso2022jp' || id === 'iso2022kr') { score += validation.escapes * 120; reasons.push(`ISO-2022 이스케이프 ${validation.escapes}개`); }
    if (['cp949', 'euckr', 'cp932', 'eucjp', 'gb18030', 'gbk', 'big5'].includes(id)) {
      if (validation.units) { score += 35 + Math.min(32, validation.units / 5); reasons.push(`유효한 멀티바이트 ${validation.units}개`); } else score -= 12;
    }
    if (id === 'cp949' && validation.extension) {
      const extensionShare = validation.extension / Math.max(validation.units, 1);
      score += 12 + Math.min(22, validation.extension * 2);
      reasons.push(`CP949 확장 영역 ${validation.extension}개`);
      // Shift_JIS byte pairs frequently all fall inside UHC extension ranges and
      // decode to rare-looking Hangul (e.g. こんにちは -> 궞귪궸...). A real Korean
      // document normally carries lexical evidence or a mixture of KS X 1001 pairs.
      if (extensionShare > 0.8 && language.koWords === 0) { score -= 62; reasons.push('확장 영역 과밀·한국어 어휘 없음'); }
    }
    if (id === 'gb18030' && validation.fourByte) { score += 45; reasons.push('GB18030 4바이트 문자 발견'); }
    if (config.language && language[config.language] !== undefined) { score += language[config.language]; if (language[config.language] > 15) reasons.push(`${languageName(config.language)} 문자 분포`); }
    if (config.language === 'latin') { score += language.latin; if (highRatio > 0.35) score -= 8; }
    if (config.language === 'ko' && language.ja > language.ko + 15) score -= 25;
    if (config.language === 'ja' && language.ko > language.ja + 15) score -= 25;
    const prior = (EXTENSION_PRIORS[(extension || '').toLowerCase()] || {})[id] || 0; score += prior;
    if (prior) reasons.push('파일 형식 사전 확률');
    return { id, label: config.label, score, preview: preview(text), engine: decoded.engine, validation, reasons: reasons.slice(0, 4), language };
  }

  function textQuality(text) {
    const length = Math.max(text.length, 1); const replacement = count(text, /\uFFFD/g); const controls = count(text, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g);
    const privateUse = count(text, /[\ue000-\uf8ff]/g); const unpaired = count(text, /[\ud800-\udfff]/g);
    let score = 38 - replacement / length * 700 - controls / length * 420 - privateUse / length * 180 - unpaired / length * 700;
    if (/\r?\n/.test(text)) score += 4; if (text.length < 8) score -= 12;
    return clamp(score, -220, 45);
  }

  function languageLikelihood(text) {
    const length = Math.max(Array.from(text).length, 1);
    const hangul = count(text, /[\uac00-\ud7a3]/g); const hira = count(text, /[\u3041-\u3096]/g); const kata = count(text, /[\u30a1-\u30fa\u30fc]/g); const cjk = count(text, /[\u3400-\u9fff]/g);
    const latin = count(text, /[A-Za-zÀ-ž]/g); const koWords = count(text, /(?:입니다|합니다|그리고|에서|으로|있는|없는|대한|파일|문자|변환|안녕|한국|한글|확장|테스트|자막|이름)/g);
    const jaWords = count(text, /(?:です|ます|して|から|まで|この|その|日本|文字|変換|こんにちは|東京|字幕|テスト)/g); const jaPunct = count(text, /[。、「」『』・]/g);
    return {
      ko: clamp((hangul / length) * 135 + koWords * 12, 0, 78),
      ja: clamp(((hira + kata) / length) * 130 + (cjk / length) * 20 + jaWords * 12 + jaPunct / length * 30, 0, 78),
      zh: clamp((cjk / length) * 95 - (hira + kata + hangul) / length * 100, 0, 62),
      latin: clamp((latin / length) * 38, 0, 32), ascii: 0, koWords, jaWords
    };
  }

  function languageName(id) { return ({ ko: '한국어', ja: '일본어', zh: '중국어', latin: '라틴 문자' })[id] || id; }
  function count(text, regex) { const found = text.match(regex); return found ? found.length : 0; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function preview(text) { const normalized = text.replace(/\r/g, ''); return normalized.length > 420 ? `${normalized.slice(0, 420)}\n…` : (normalized || '(빈 내용)'); }
  function failure(error, validation) { return { ok: false, error, text: '', bytes: new Uint8Array(), validation }; }

  function stripMatchingBom(input, id) {
    const bytes = asBytes(input); const bom = detectBom(bytes); return bom && bom.id === id ? bytes.slice(bom.length) : bytes;
  }

  function decodeUtf16(input, littleEndian) {
    const bytes = stripMatchingBom(asBytes(input), littleEndian ? 'utf16le' : 'utf16be'); if (bytes.length % 2) throw new Error('UTF-16 바이트 길이가 홀수입니다.');
    let output = '';
    for (let i = 0; i < bytes.length; i += 2) { const code = littleEndian ? bytes[i] | bytes[i + 1] << 8 : bytes[i] << 8 | bytes[i + 1]; output += String.fromCharCode(code); }
    return output;
  }

  function decodeUtf32(input, littleEndian) {
    const bytes = stripMatchingBom(asBytes(input), littleEndian ? 'utf32le' : 'utf32be'); if (bytes.length % 4) throw new Error('UTF-32 바이트 길이가 4의 배수가 아닙니다.');
    let output = '';
    for (let i = 0; i < bytes.length; i += 4) { const cp = littleEndian ? ((bytes[i] | bytes[i + 1] << 8 | bytes[i + 2] << 16 | bytes[i + 3] << 24) >>> 0) : ((bytes[i] << 24 | bytes[i + 1] << 16 | bytes[i + 2] << 8 | bytes[i + 3]) >>> 0); if (cp > 0x10ffff || inRange(cp, 0xd800, 0xdfff)) throw new Error(`잘못된 UTF-32 코드 포인트 U+${cp.toString(16)}`); output += String.fromCodePoint(cp); }
    return output;
  }

  function encodeUtf16(text, littleEndian) {
    const bytes = new Uint8Array(text.length * 2);
    for (let i = 0; i < text.length; i += 1) { const code = text.charCodeAt(i); bytes[i * 2 + (littleEndian ? 0 : 1)] = code & 0xff; bytes[i * 2 + (littleEndian ? 1 : 0)] = code >>> 8; }
    return bytes;
  }

  function encodeUtf32(text, littleEndian) {
    const points = Array.from(text, (char) => char.codePointAt(0)); const bytes = new Uint8Array(points.length * 4);
    points.forEach((cp, index) => { const i = index * 4; if (littleEndian) { bytes[i] = cp; bytes[i + 1] = cp >>> 8; bytes[i + 2] = cp >>> 16; bytes[i + 3] = cp >>> 24; } else { bytes[i] = cp >>> 24; bytes[i + 1] = cp >>> 16; bytes[i + 2] = cp >>> 8; bytes[i + 3] = cp; } });
    return bytes;
  }

  function iso2022JpToEucJp(input) {
    const bytes = asBytes(input); const out = []; let mode = 'ascii';
    for (let i = 0; i < bytes.length;) {
      if (bytes[i] === 0x1b && i + 2 < bytes.length) {
        if (bytes[i + 1] === 0x24 && [0x40, 0x42].includes(bytes[i + 2])) { mode = 'jis'; i += 3; continue; }
        if (bytes[i + 1] === 0x28 && [0x42, 0x4a, 0x49].includes(bytes[i + 2])) { mode = bytes[i + 2] === 0x49 ? 'kana' : 'ascii'; i += 3; continue; }
      }
      if (mode === 'jis' && i + 1 < bytes.length) { out.push(bytes[i] + 0x80, bytes[i + 1] + 0x80); i += 2; }
      else if (mode === 'kana' && bytes[i] >= 0x21 && bytes[i] <= 0x5f) { out.push(0x8e, bytes[i] + 0x80); i += 1; }
      else { out.push(bytes[i]); i += 1; }
    }
    return Uint8Array.from(out);
  }

  function eucJpToIso2022Jp(input) {
    const bytes = asBytes(input); const out = []; let mode = 'ascii';
    function switchMode(next) { if (mode === next) return; out.push(0x1b, ...(next === 'jis' ? [0x24, 0x42] : next === 'kana' ? [0x28, 0x49] : [0x28, 0x42])); mode = next; }
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i];
      if (b <= 0x7f) { switchMode('ascii'); out.push(b); i += 1; }
      else if (b === 0x8e && i + 1 < bytes.length) { switchMode('kana'); out.push(bytes[i + 1] - 0x80); i += 2; }
      else if (inRange(b, 0xa1, 0xfe) && i + 1 < bytes.length && inRange(bytes[i + 1], 0xa1, 0xfe)) { switchMode('jis'); out.push(b - 0x80, bytes[i + 1] - 0x80); i += 2; }
      else throw new Error('ISO-2022-JP로 표현할 수 없는 EUC-JP 바이트가 있습니다.');
    }
    switchMode('ascii'); return Uint8Array.from(out);
  }

  function iso2022KrToEucKr(input) {
    const bytes = asBytes(input); const out = []; let shifted = false;
    for (let i = 0; i < bytes.length;) {
      if (bytes[i] === 0x1b && i + 3 < bytes.length && bytes[i + 1] === 0x24 && bytes[i + 2] === 0x29 && bytes[i + 3] === 0x43) { i += 4; continue; }
      if (bytes[i] === 0x0e) { shifted = true; i += 1; continue; }
      if (bytes[i] === 0x0f) { shifted = false; i += 1; continue; }
      if (shifted && i + 1 < bytes.length) { out.push(bytes[i] + 0x80, bytes[i + 1] + 0x80); i += 2; } else { out.push(bytes[i]); i += 1; }
    }
    return Uint8Array.from(out);
  }

  function eucKrToIso2022Kr(input) {
    const bytes = asBytes(input); const out = [0x1b, 0x24, 0x29, 0x43]; let shifted = false;
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i];
      if (b <= 0x7f) { if (shifted) { out.push(0x0f); shifted = false; } out.push(b); i += 1; }
      else if (i + 1 < bytes.length && inRange(b, 0xa1, 0xfe) && inRange(bytes[i + 1], 0xa1, 0xfe)) { if (!shifted) { out.push(0x0e); shifted = true; } out.push(b - 0x80, bytes[i + 1] - 0x80); i += 2; }
      else throw new Error('ISO-2022-KR로 표현할 수 없는 문자가 있습니다.');
    }
    if (shifted) out.push(0x0f); return Uint8Array.from(out);
  }

  function compareText(expected, actual) {
    const a = Array.from(expected); const b = Array.from(actual); const max = Math.max(a.length, b.length); let countDiff = 0; const examples = [];
    for (let i = 0; i < max; i += 1) if (a[i] !== b[i]) { countDiff += 1; if (examples.length < 8) examples.push({ index: i, expected: a[i] || '∅', actual: b[i] || '∅' }); }
    return { count: countDiff, checked: max, examples };
  }

  function isLikelyBinary(input, bom) {
    if (bom && bom.id !== 'utf8') return false;
    const bytes = asBytes(input).slice(0, 32768); let controls = 0; let nulls = 0;
    for (const b of bytes) { if (b === 0) nulls += 1; if ((b < 0x20 && ![0x09, 0x0a, 0x0d, 0x0c].includes(b)) || b === 0x7f) controls += 1; }
    return nulls / bytes.length > 0.08 || controls / bytes.length > 0.18;
  }

  return { create, ENCODINGS, BY_ID, validateBytes, detectBom, compareText, internals: { iso2022JpToEucJp, eucJpToIso2022Jp, iso2022KrToEucKr, eucKrToIso2022Kr } };
});
