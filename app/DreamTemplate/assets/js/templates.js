(() => {
const { backgroundStyle, escapeAttr, escapeHtml, getByPath } = window.CardStudioUtils;

const e = escapeHtml;
const a = escapeAttr;

function renderEditor(styleId, data) {
  const templates = {
    instagram: instagramEditor,
    youtube: youtubeEditor,
    wiki: wikiEditor,
    netflix: netflixEditor,
    musicplayer: musicEditor,
    timeline: timelineEditor,
    couple: coupleEditor,
    messenger: messengerEditor,
  };
  return templates[styleId]?.(data) || "";
}

function section(title, body) {
  return `<section class="editor-section"><h3>${e(title)}</h3>${body}</section>`;
}

function field(data, path, label, options = {}) {
  const type = options.type || "text";
  const value = getByPath(data, path) ?? "";
  const placeholder = options.placeholder ? ` placeholder="${a(options.placeholder)}"` : "";
  const min = options.min != null ? ` min="${a(options.min)}"` : "";
  const max = options.max != null ? ` max="${a(options.max)}"` : "";
  const step = options.step != null ? ` step="${a(options.step)}"` : "";
  return `
    <label class="form-field">
      <span>${e(label)}</span>
      <input data-field="${a(path)}" type="${a(type)}" value="${a(value)}"${placeholder}${min}${max}${step}>
    </label>
  `;
}

function textarea(data, path, label, placeholder = "") {
  const value = getByPath(data, path) ?? "";
  return `
    <label class="form-field">
      <span>${e(label)}</span>
      <textarea data-field="${a(path)}" placeholder="${a(placeholder)}">${a(value)}</textarea>
    </label>
  `;
}

function select(data, path, label, options) {
  const value = getByPath(data, path) ?? "";
  const opts = options.map((option) => {
    const selected = String(option.value) === String(value) ? " selected" : "";
    return `<option value="${a(option.value)}"${selected}>${e(option.label)}</option>`;
  }).join("");
  return `
    <label class="form-field">
      <span>${e(label)}</span>
      <select data-field="${a(path)}">${opts}</select>
    </label>
  `;
}

function checkbox(data, path, label) {
  const checked = getByPath(data, path) ? " checked" : "";
  return `
    <label class="check-field">
      <input data-field="${a(path)}" type="checkbox"${checked}>
      <span>${e(label)}</span>
    </label>
  `;
}

function imageField(data, path, label) {
  const value = getByPath(data, path) || "";
  return `
    <div class="form-field">
      <span>${e(label)}</span>
      <div class="image-picker">
        <div class="image-thumb" style="${backgroundStyle(value)}">${value ? "" : "<span>IMG</span>"}</div>
        <div>
          <input data-image-field="${a(path)}" type="file" accept="image/*">
          <button type="button" class="ghost-button" data-action="clear-image" data-path="${a(path)}">이미지 비우기</button>
        </div>
      </div>
    </div>
  `;
}

function listHeader(label, listName, addLabel = "항목 추가") {
  return `
    <div class="list-header">
      <h4>${e(label)}</h4>
      <button type="button" data-action="add-item" data-list="${a(listName)}">${e(addLabel)}</button>
    </div>
  `;
}

function listItem(title, listName, index, body) {
  return `
    <div class="repeat-card">
      <div class="repeat-head">
        <strong>${e(title)}</strong>
        <button type="button" data-action="remove-item" data-list="${a(listName)}" data-index="${index}">삭제</button>
      </div>
      ${body}
    </div>
  `;
}

function instagramEditor(data) {
  const common = section("공통", `
    ${select(data, "subtype", "화면 유형", [
      { value: "post", label: "게시물" },
      { value: "profile", label: "프로필" },
      { value: "story", label: "스토리" },
      { value: "dm", label: "DM" },
    ])}
    ${field(data, "username", "사용자명")}
    ${imageField(data, "avatar", "프로필 이미지")}
    ${field(data, "accentColor", "포인트색", { type: "color" })}
    ${checkbox(data, "hasStoryRing", "스토리 링 표시")}
  `);
  const mode = data.subtype || "post";
  const modeFields = {
    profile: section("프로필", `
      ${field(data, "displayName", "표시 이름")}
      ${textarea(data, "bio", "바이오")}
      <div class="grid-3">${field(data, "posts", "게시물")}${field(data, "followers", "팔로워")}${field(data, "following", "팔로잉")}</div>
      ${section("하이라이트", (data.highlights || []).map((item, index) => `
        <div class="mini-grid">
          ${imageField(data, `highlights.${index}.image`, `하이라이트 ${index + 1}`)}
          ${field(data, `highlights.${index}.title`, "이름")}
        </div>
      `).join(""))}
      ${section("피드 사진", (data.feedImages || []).map((_, index) => imageField(data, `feedImages.${index}`, `피드 ${index + 1}`)).join(""))}
    `),
    post: section("게시물", `
      ${field(data, "location", "위치")}
      ${imageField(data, "postImage", "게시물 이미지")}
      ${field(data, "likes", "좋아요 수")}
      ${textarea(data, "caption", "본문")}
      ${field(data, "postTime", "시간")}
    `),
    story: section("스토리", `
      ${imageField(data, "storyImage", "스토리 이미지")}
      ${field(data, "storyTime", "시간 표시")}
      ${checkbox(data, "storyTagVisible", "태그 표시")}
      ${field(data, "storyTag", "태그 텍스트")}
      <div class="grid-2">${field(data, "storyTagX", "태그 X", { type: "range", min: 5, max: 80 })}${field(data, "storyTagY", "태그 Y", { type: "range", min: 10, max: 80 })}</div>
    `),
    dm: section("DM", `
      ${field(data, "dmDate", "날짜")}
      ${field(data, "dmInput", "입력창 문구")}
      ${listHeader("메시지", "dmMessages", "메시지 추가")}
      ${(data.dmMessages || []).map((_, index) => listItem(`메시지 ${index + 1}`, "dmMessages", index, `
        ${select(data, `dmMessages.${index}.side`, "방향", [
          { value: "recv", label: "받은 메시지" },
          { value: "sent", label: "보낸 메시지" },
        ])}
        ${textarea(data, `dmMessages.${index}.text`, "내용")}
        ${imageField(data, `dmMessages.${index}.image`, "첨부 이미지")}
      `)).join("")}
    `),
  }[mode];
  return common + modeFields;
}

function youtubeEditor(data) {
  return section("영상", `
    ${imageField(data, "mainImage", "메인 썸네일")}
    ${field(data, "title", "영상 제목")}
    <div class="grid-3">${field(data, "time", "길이")}${field(data, "views", "조회수")}${field(data, "date", "날짜")}</div>
    ${field(data, "searchQuery", "검색창")}
  `) + section("채널", `
    ${imageField(data, "channelAvatar", "채널 프로필")}
    ${field(data, "channelName", "채널명")}
    ${field(data, "subscribers", "구독자")}
    ${field(data, "likes", "좋아요")}
  `) + section("고정 댓글", `
    ${imageField(data, "pinnedAvatar", "댓글 프로필")}
    ${field(data, "pinnedName", "작성자")}
    <div class="grid-2">${field(data, "pinnedTime", "시간")}${field(data, "pinnedLikes", "좋아요")}</div>
    ${textarea(data, "pinnedText", "댓글 내용")}
  `) + section("댓글 목록", `
    ${field(data, "commentCount", "댓글 수 표시")}
    ${listHeader("댓글", "comments", "댓글 추가")}
    ${(data.comments || []).map((_, index) => listItem(`댓글 ${index + 1}`, "comments", index, `
      ${select(data, `comments.${index}.type`, "형태", [
        { value: "comment", label: "일반 댓글" },
        { value: "reply", label: "답글" },
      ])}
      ${imageField(data, `comments.${index}.avatar`, "프로필")}
      ${field(data, `comments.${index}.name`, "이름")}
      <div class="grid-2">${field(data, `comments.${index}.time`, "시간")}${field(data, `comments.${index}.likes`, "좋아요")}</div>
      ${textarea(data, `comments.${index}.text`, "내용")}
    `)).join("")}
  `) + section("추천 영상", `
    ${listHeader("추천 영상", "related", "추천 추가")}
    ${(data.related || []).map((_, index) => listItem(`추천 ${index + 1}`, "related", index, `
      ${imageField(data, `related.${index}.thumb`, "썸네일")}
      ${field(data, `related.${index}.title`, "제목")}
      ${field(data, `related.${index}.channel`, "채널")}
      <div class="grid-3">${field(data, `related.${index}.time`, "길이")}${field(data, `related.${index}.views`, "조회수")}${field(data, `related.${index}.date`, "날짜")}</div>
    `)).join("")}
  `);
}

function wikiEditor(data) {
  return section("문서 설정", `
    ${field(data, "title", "문서 제목")}
    <div class="grid-2">${field(data, "themeColor", "테마색", { type: "color" })}${field(data, "titleTextColor", "제목 글자색", { type: "color" })}</div>
    ${field(data, "editTime", "최근 수정")}
    ${textarea(data, "categories", "분류", "분류명 | https://example.com")}
    ${checkbox(data, "showSpoiler", "스포일러 경고 표시")}
    ${field(data, "spoilerText", "경고 문구")}
  `) + section("프로필 박스", `
    ${imageField(data, "profileImage", "프로필 이미지")}
    ${field(data, "profileTitle", "이름")}
    ${field(data, "profileSubtitle", "부제목")}
    ${field(data, "extraTitle", "추가 정보 제목")}
    ${textarea(data, "extraText", "추가 정보 내용")}
    ${listHeader("정보 행", "infoRows", "정보 추가")}
    ${(data.infoRows || []).map((_, index) => listItem(`정보 ${index + 1}`, "infoRows", index, `
      ${field(data, `infoRows.${index}.label`, "항목")}
      ${textarea(data, `infoRows.${index}.value`, "내용")}
    `)).join("")}
  `) + section("본문", `
    ${listHeader("문단", "sections", "문단 추가")}
    ${(data.sections || []).map((_, index) => listItem(`문단 ${index + 1}`, "sections", index, `
      ${field(data, `sections.${index}.title`, "제목")}
      ${textarea(data, `sections.${index}.body`, "내용")}
    `)).join("")}
  `);
}

function netflixEditor(data) {
  return section("화면", `
    ${select(data, "mode", "화면 유형", [
      { value: "detail", label: "상세 페이지" },
      { value: "home", label: "메인 포스터" },
      { value: "episodes", label: "에피소드만" },
    ])}
    ${imageField(data, "heroImage", "메인 이미지")}
    ${field(data, "imageSource", "이미지 출처")}
    ${field(data, "subtitle", "상단 라벨")}
    ${field(data, "title", "작품 제목")}
    ${field(data, "tags", "태그")}
    <div class="grid-4">${field(data, "year", "연도")}${field(data, "match", "일치율")}${field(data, "age", "등급")}${field(data, "quality", "화질")}</div>
    ${textarea(data, "description", "설명")}
  `) + section("메인 포스터 행", `
    ${field(data, "rowTitle", "행 제목")}
    ${(data.thumbs || []).map((_, index) => imageField(data, `thumbs.${index}`, `포스터 ${index + 1}`)).join("")}
  `) + section("에피소드", `
    ${listHeader("에피소드", "episodes", "에피소드 추가")}
    ${(data.episodes || []).map((_, index) => listItem(`에피소드 ${index + 1}`, "episodes", index, `
      ${imageField(data, `episodes.${index}.thumb`, "썸네일")}
      ${field(data, `episodes.${index}.title`, "제목")}
      ${field(data, `episodes.${index}.duration`, "길이")}
      ${textarea(data, `episodes.${index}.desc`, "설명")}
    `)).join("")}
  `);
}

function musicEditor(data) {
  return section("음악 카드", `
    ${imageField(data, "coverImage", "커버 이미지")}
    ${field(data, "title", "제목")}
    ${field(data, "artist", "아티스트")}
    ${field(data, "copyright", "출처")}
    <div class="grid-3">${field(data, "bgColor", "배경색", { type: "color" })}${field(data, "pointColor", "포인트색", { type: "color" })}${field(data, "textColor", "글자색", { type: "color" })}</div>
    <div class="grid-2">${field(data, "progress", "진행률", { type: "range", min: 0, max: 100 })}${field(data, "volume", "볼륨", { type: "range", min: 0, max: 100 })}</div>
  `);
}

function timelineEditor(data) {
  return section("프로필", `
    ${field(data, "themeColor", "포인트색", { type: "color" })}
    ${imageField(data, "mainImage", "메인 이미지")}
    ${imageField(data, "stickerImage", "스티커 이미지")}
    ${field(data, "copyright", "출처")}
    ${field(data, "catchphrase", "캐치프레이즈")}
    ${field(data, "name", "이름")}
    ${field(data, "keywords", "키워드", { placeholder: "쉼표로 구분" })}
    ${textarea(data, "description", "상세 소개")}
  `) + section("타임라인", `
    ${field(data, "timelineTitle", "타임라인 제목")}
    ${listHeader("타임라인", "entries", "항목 추가")}
    ${(data.entries || []).map((_, index) => listItem(`항목 ${index + 1}`, "entries", index, `
      ${field(data, `entries.${index}.date`, "날짜")}
      ${field(data, `entries.${index}.title`, "제목")}
      ${textarea(data, `entries.${index}.desc`, "내용")}
    `)).join("")}
  `);
}

function coupleEditor(data) {
  const person = (prefix, title) => section(title, `
    ${imageField(data, `${prefix}.image`, "프로필 이미지")}
    ${field(data, `${prefix}.copyright`, "출처")}
    ${field(data, `${prefix}.catchphrase`, "캐치프레이즈")}
    ${field(data, `${prefix}.name`, "이름")}
    ${field(data, `${prefix}.keywords`, "키워드")}
    ${textarea(data, `${prefix}.description`, "소개")}
  `);
  return section("공통", `
    ${select(data, "layout", "레이아웃", [
      { value: "center", label: "타임라인 중앙" },
      { value: "right", label: "타임라인 우측" },
    ])}
    ${field(data, "pairName", "페어명")}
    ${imageField(data, "bannerImage", "공통 배너")}
    <div class="grid-3">${field(data, "colorA", "A 색", { type: "color" })}${field(data, "colorB", "B 색", { type: "color" })}${field(data, "colorCommon", "공통 색", { type: "color" })}</div>
  `) + person("personA", "A 프로필") + person("personB", "B 프로필") + section("관계 타임라인", `
    ${field(data, "timelineTitle", "타임라인 제목")}
    ${listHeader("타임라인", "entries", "항목 추가")}
    ${(data.entries || []).map((_, index) => listItem(`항목 ${index + 1}`, "entries", index, `
      ${select(data, `entries.${index}.owner`, "소유", [
        { value: "common", label: "공통" },
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ])}
      ${field(data, `entries.${index}.date`, "날짜")}
      ${field(data, `entries.${index}.title`, "제목")}
      ${textarea(data, `entries.${index}.desc`, "내용")}
    `)).join("")}
  `);
}

function messengerEditor(data) {
  return section("메신저", `
    ${field(data, "headerTitle", "상단 제목")}
    ${field(data, "recipient", "받는 사람")}
    ${field(data, "cancelText", "취소 문구")}
    ${field(data, "pointColor", "포인트색", { type: "color" })}
    ${field(data, "inputPlaceholder", "입력창 문구")}
  `) + section("사진 묶음", `
    ${listHeader("메시지 묶음", "messages", "묶음 추가")}
    ${(data.messages || []).map((_, index) => listItem(`묶음 ${index + 1}`, "messages", index, `
      <div class="grid-3">
        ${imageField(data, `messages.${index}.images.0`, "사진 1")}
        ${imageField(data, `messages.${index}.images.1`, "사진 2")}
        ${imageField(data, `messages.${index}.images.2`, "사진 3")}
      </div>
      ${textarea(data, `messages.${index}.text`, "코멘트")}
      ${checkbox(data, `messages.${index}.showComment`, "코멘트 표시")}
    `)).join("")}
  `);
}

window.CardStudioTemplates = {
  renderEditor,
};
})();
