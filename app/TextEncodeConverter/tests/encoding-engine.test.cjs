'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const iconv = require('../vendor/iconv-lite-umd.js');
const moduleApi = require('../encoding-engine.js');
const engine = moduleApi.create({ iconv });

const KO = '안녕하세요. 대한민국 서울에서 작성한 한국어 문자 인코딩 변환 테스트입니다. 파일을 안전하게 저장합니다.\r\n두 번째 줄입니다.';
const JA = 'こんにちは。日本語の文字コード変換テストです。東京からのお知らせです。\r\n二行目です。';
const MIXED = 'Encoding test — 한글과 日本語, café, 😀\r\nline 2';

test('detects every Unicode BOM deterministically', () => {
  const cases = [
    ['utf8bom', 'utf8'], ['utf16lebom', 'utf16le'], ['utf16bebom', 'utf16be'],
    ['utf32lebom', 'utf32le'], ['utf32bebom', 'utf32be']
  ];
  for (const [target, expected] of cases) {
    const encoded = engine.encode(MIXED, target);
    assert.equal(encoded.ok, true, encoded.error);
    const detected = engine.detect(encoded.bytes, { extension: '.txt' });
    assert.equal(detected.selectedId, expected);
    assert.ok(detected.confidence >= 0.99);
  }
});

test('round-trips Unicode encodings with explicit BOM policy', () => {
  for (const id of ['utf8', 'utf8bom', 'utf16le', 'utf16lebom', 'utf16be', 'utf16bebom', 'utf32le', 'utf32lebom', 'utf32be', 'utf32bebom']) {
    const encoded = engine.encode(MIXED, id);
    assert.equal(encoded.ok, true, `${id}: ${encoded.error}`);
    assert.equal(encoded.loss.count, 0, id);
    const decoded = engine.decode(encoded.bytes, id, { strict: true });
    assert.equal(decoded.ok, true, `${id}: ${decoded.error}`);
    assert.equal(decoded.text, MIXED, id);
  }
});

test('round-trips Korean and Japanese legacy encodings', () => {
  for (const [id, text] of [['cp949', KO], ['euckr', KO], ['iso2022kr', KO], ['cp932', JA], ['eucjp', JA], ['iso2022jp', JA]]) {
    const encoded = engine.encode(text, id);
    assert.equal(encoded.ok, true, `${id}: ${encoded.error}`);
    assert.equal(encoded.loss.count, 0, id);
    const decoded = engine.decode(encoded.bytes, id, { strict: true });
    assert.equal(decoded.ok, true, `${id}: ${decoded.error}`);
    assert.equal(decoded.text, text, id);
  }
});

test('round-trips CP949/CP932 extensions plus Chinese and Western encodings', () => {
  const cases = [
    ['cp949', '확장 한글 똠·햏·뷁'],
    ['cp932', 'Windows拡張 ①㈱髙﨑 テスト'],
    ['gb18030', '简体中文编码转换测试𠀀'],
    ['gbk', '简体中文编码转换测试'],
    ['big5', '繁體中文編碼轉換測試'],
    ['windows1252', 'Résumé — “smart quotes” €'],
    ['iso88591', 'Résumé déjà vu £'],
    ['iso885915', 'Résumé déjà vu €']
  ];
  for (const [id, text] of cases) {
    const encoded = engine.encode(text, id);
    assert.equal(encoded.ok, true, `${id}: ${encoded.error}`);
    assert.equal(encoded.loss.count, 0, `${id}: ${JSON.stringify(encoded.loss.examples)}`);
    assert.equal(engine.decode(encoded.bytes, id, { strict: true }).text, text);
  }
});

test('detects representative UTF-8, Korean, and Japanese corpora', () => {
  const cases = [
    ['utf8', MIXED, 'utf8'],
    ['euckr', KO, 'euckr'],
    ['cp932', JA, 'cp932'],
    ['eucjp', JA, 'eucjp'],
    ['iso2022jp', JA, 'iso2022jp'],
    ['iso2022kr', KO, 'iso2022kr']
  ];
  for (const [id, text, expected] of cases) {
    const encoded = engine.encode(text, id);
    assert.equal(encoded.ok, true, encoded.error);
    const detected = engine.detect(encoded.bytes, { extension: '.txt' });
    assert.equal(detected.selectedId, expected, `${id}: ${detected.candidates.slice(0, 3).map((item) => `${item.id}:${item.score}`).join(', ')}`);
  }
});

test('detects varied subtitle, CSV, script, and prose corpora', () => {
  const corpora = [
    ['utf8', '한글 UTF-8 / 日本語 / emoji 😀 / café', '.txt'],
    ['utf8', 'name,city,note\r\n김민수,서울,안녕하세요\r\n田中,東京,こんにちは', '.csv'],
    ['euckr', '1\r\n00:00:01,000 --> 00:00:03,000\r\n안녕하세요. 자막 테스트입니다.', '.srt'],
    ['euckr', '대한민국의 역사와 문화에 대한 문서입니다. 오늘 날씨가 좋습니다.', '.txt'],
    ['cp949', '@echo off\r\necho 확장 한글 똠 햏 뷁\r\nset 이름=테스트', '.bat'],
    ['cp949', '<SYNC Start=1000><P Class=KRCC>안녕하세요 똠 햏</P>', '.smi'],
    ['cp932', '1\r\n00:00:01,000 --> 00:00:03,000\r\nこんにちは。字幕のテストです。', '.srt'],
    ['cp932', '東京の今日の天気をお知らせします。日本語の文書です。', '.txt'],
    ['eucjp', 'これは日本語の文章です。文字コードを正しく判定します。', '.txt'],
    ['eucjp', '名前,都市,説明\r\n田中,東京,日本語のCSVです', '.csv'],
    ['iso2022jp', '日本語メールです。文字コードを確認してください。', '.txt'],
    ['iso2022kr', '한국어 전자우편입니다. 문자 인코딩을 확인해 주세요.', '.txt']
  ];
  for (const [id, text, extension] of corpora) {
    const encoded = engine.encode(text, id);
    assert.equal(encoded.ok, true, `${id}: ${encoded.error}`);
    const detected = engine.detect(encoded.bytes, { extension });
    assert.equal(detected.selectedId, id, `${id}/${extension}: ${detected.candidates.slice(0, 3).map((item) => `${item.id}:${item.score.toFixed(1)}`).join(', ')}`);
  }
});

test('distinguishes CP949 extension bytes from strict EUC-KR', () => {
  const text = 'CP949 확장 한글: 똠, 뙤, 햏, 뷁';
  const encoded = engine.encode(text, 'cp949');
  assert.equal(encoded.ok, true, encoded.error);
  assert.ok(encoded.validation.extension > 0);
  assert.equal(engine.validateBytes(encoded.bytes, 'euckr').valid, false);
  assert.equal(engine.detect(encoded.bytes, { extension: '.txt' }).selectedId, 'cp949');
});

test('reports ambiguity for the EUC-KR and CP949 common subset', () => {
  const encoded = engine.encode(KO, 'euckr');
  const detected = engine.detect(encoded.bytes);
  assert.equal(detected.selectedId, 'euckr');
  assert.match(detected.note, /CP949/);
  assert.ok(detected.confidence < 0.7);
});

test('treats plain ASCII as encoding-neutral UTF-8', () => {
  const detected = engine.detect(new TextEncoder().encode('plain ASCII text\r\nline two'));
  assert.equal(detected.selectedId, 'utf8');
  assert.equal(detected.asciiOnly, true);
  assert.match(detected.note, /구별할 수 없습니다/);
});

test('rejects malformed byte sequences in strict mode', () => {
  const cases = [
    ['utf8', [0xe3, 0x28, 0xa1]], ['cp932', [0x82, 0x20]], ['eucjp', [0x8f, 0xa1, 0x20]],
    ['euckr', [0xa1, 0x41]], ['cp949', [0x81, 0x20]], ['utf16le', [0x41]], ['utf32be', [0x00, 0x11, 0x00, 0x00]]
  ];
  for (const [id, bytes] of cases) {
    const result = engine.decode(Uint8Array.from(bytes), id, { strict: true });
    assert.equal(result.ok, false, id);
  }
});

test('rejects a BOM that contradicts the manually selected Unicode endian', () => {
  const little = engine.encode('Endian 확인', 'utf16lebom');
  const big = engine.decode(little.bytes, 'utf16be', { strict: true });
  assert.equal(big.ok, false);
  assert.match(big.error, /일치하지 않습니다/);
});

test('does not duplicate or leak a BOM across explicit output policies', () => {
  const withBom = engine.encode('BOM 정책', 'utf8bom');
  const decoded = engine.decode(withBom.bytes, 'utf8', { strict: true });
  assert.equal(decoded.text, 'BOM 정책');
  const withoutBom = engine.encode(decoded.text, 'utf8');
  assert.deepEqual(Array.from(withoutBom.bytes.slice(0, 3)), Array.from(new TextEncoder().encode('BOM')));
  assert.deepEqual(Array.from(withBom.bytes.slice(0, 3)), [0xef, 0xbb, 0xbf]);
});

test('has a working encoder and decoder path for every advertised target', () => {
  for (const encoding of engine.encodings.filter((item) => item.target)) {
    const support = engine.supports(encoding.id);
    assert.equal(support.decode, true, `${encoding.id} decode`);
    assert.equal(support.encode, true, `${encoding.id} encode`);
  }
});

test('surfaces representability loss instead of silently approving it', () => {
  for (const id of ['ascii', 'euckr', 'cp949', 'cp932', 'iso2022jp', 'iso2022kr']) {
    const result = engine.encode(`손실 검사 😀 ${JA}`, id);
    assert.equal(result.ok, true, `${id}: ${result.error}`);
    assert.ok(result.loss.count > 0, id);
    assert.ok(result.loss.examples.length > 0, id);
  }
});

test('preserves CRLF and final newline exactly through conversion', () => {
  const text = '첫 줄\r\n둘째 줄\r\n';
  const cp949 = engine.encode(text, 'cp949');
  const decoded = engine.decode(cp949.bytes, 'cp949', { strict: true });
  const utf8 = engine.encode(decoded.text, 'utf8');
  assert.equal(new TextDecoder().decode(utf8.bytes), text);
});

test('bounded detection tolerates a sample ending inside a multibyte sequence', () => {
  const prefix = '가'.repeat(131071) + '각';
  const bytes = engine.encode(prefix, 'cp949').bytes;
  const result = engine.detect(bytes, { maxSampleBytes: 262143 });
  assert.ok(result.candidates.some((item) => item.id === 'cp949' && item.score > -500));
});

test('ISO-2022 converters emit identifying escape sequences', () => {
  const jp = engine.encode(JA, 'iso2022jp').bytes;
  const kr = engine.encode(KO, 'iso2022kr').bytes;
  assert.deepEqual(Array.from(jp.slice(0, 3)), [0x1b, 0x24, 0x42]);
  assert.deepEqual(Array.from(kr.slice(0, 4)), [0x1b, 0x24, 0x29, 0x43]);
  assert.ok(engine.validateBytes(jp, 'iso2022jp').escapes > 0);
  assert.ok(engine.validateBytes(kr, 'iso2022kr').escapes > 0);
});
