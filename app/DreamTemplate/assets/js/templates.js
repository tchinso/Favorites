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
    catchphrase: catchphraseEditor,
    tamagotchi: tamagotchiEditor,
    idcard: idCardEditor,
    toypack: toypackEditor,
    playlist: playlistEditor,
    renaitvshow: renaiTvShowEditor,
    lifefourcut: lifeFourCutEditor,
    photoalbum: photoAlbumEditor,
    netflixscreenshot: netflixScreenshotEditor,
    movieticket: movieTicketEditor,
    internetboard: internetBoardEditor,
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
    ${checkbox(data, "showExtra", "기타 정보 박스 표시")}
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
  `) + section("처음 보이는 메시지", `
    ${imageField(data, "initialImage", "처음 사진")}
    ${textarea(data, "initialText", "처음 메시지")}
  `) + section("보내기 순서", `
    ${listHeader("전송될 메시지", "messages", "메시지 추가")}
    ${(data.messages || []).map((_, index) => listItem(`메시지 ${index + 1}`, "messages", index, `
      ${imageField(data, `messages.${index}.image`, "사진 1")}
      ${imageField(data, `messages.${index}.image2`, "사진 2")}
      ${textarea(data, `messages.${index}.text`, "메시지")}
    `)).join("")}
  `);
}

function catchphraseEditor(data) {
  return section("이미지", `
    ${imageField(data, "image", "메인 이미지")}
    <div class="grid-3">
      ${field(data, "imageX", "이미지 X", { type: "range", min: 0, max: 100 })}
      ${field(data, "imageY", "이미지 Y", { type: "range", min: 0, max: 100 })}
      ${field(data, "imageZoom", "이미지 크기", { type: "range", min: 60, max: 200 })}
    </div>
  `) + section("텍스트", `
    ${field(data, "name", "이름")}
    ${field(data, "keyTop", "상단 키워드")}
    ${textarea(data, "phrase", "캐치프레이즈")}
    ${field(data, "badge", "우측 배지")}
    ${select(data, "nameFont", "이름 글꼴", [
      { value: "Nunito", label: "Nunito" },
      { value: "Playfair Display", label: "Playfair" },
    ])}
  `) + section("정보", `
    ${listHeader("정보 항목", "infoRows", "항목 추가")}
    ${(data.infoRows || []).map((_, index) => listItem(`정보 ${index + 1}`, "infoRows", index, `
      ${field(data, `infoRows.${index}.label`, "라벨")}
      ${field(data, `infoRows.${index}.value`, "값")}
    `)).join("")}
    ${field(data, "keywords", "Symbol 키워드", { placeholder: "쉼표로 구분" })}
  `) + section("색상/그라데이션", `
    <div class="grid-3">${field(data, "accentColor", "강조 컬러", { type: "color" })}${field(data, "bgColor", "배경 컬러", { type: "color" })}${field(data, "textColor", "텍스트 컬러", { type: "color" })}</div>
    <div class="grid-3">${field(data, "gradientTone", "그라데이션 색조", { type: "range", min: 0, max: 255 })}${field(data, "gradientOpacity", "그라데이션 강도", { type: "range", min: 0, max: 100 })}${field(data, "gradientHeight", "그라데이션 높이", { type: "range", min: 20, max: 100 })}</div>
  `);
}

function tamagotchiEditor(data) {
  return section("다마고치", `
    ${select(data, "theme", "테마", [
      { value: "default", label: "Peach" },
      { value: "white", label: "White" },
      { value: "black", label: "Black" },
      { value: "purple", label: "Purple" },
      { value: "blue", label: "Blue" },
      { value: "mint", label: "Mint" },
      { value: "lemon", label: "Lemon" },
    ])}
    ${imageField(data, "image", "캐릭터 이미지")}
    <div class="grid-3">
      ${field(data, "imageX", "이미지 X", { type: "range", min: -120, max: 120 })}
      ${field(data, "imageY", "이미지 Y", { type: "range", min: -120, max: 120 })}
      ${field(data, "imageZoom", "이미지 크기", { type: "range", min: 40, max: 220 })}
    </div>
    ${field(data, "name", "이름", { placeholder: "최대 8자" })}
    <div class="grid-3">${field(data, "days", "DAYS")}${field(data, "hearts", "하트")}${field(data, "stars", "별")}</div>
  `);
}

function idCardEditor(data) {
  const common = section("카드 유형", `
    ${select(data, "type", "유형", [
      { value: "company", label: "Employee ID" },
      { value: "sentinel", label: "Sentinel / Guide" },
      { value: "student", label: "Student ID" },
      { value: "university", label: "University ID" },
      { value: "lovers", label: "Lovers Card" },
    ])}
    ${select(data, "side", "면", [
      { value: "front", label: "Front" },
      { value: "back", label: "Back" },
    ])}
    ${select(data, "themeMode", "테마", [
      { value: "dark", label: "Dark" },
      { value: "light", label: "Light" },
    ])}
    <div class="grid-2">${field(data, "accentColor", "포인트색", { type: "color" })}${imageField(data, "photo", "증명사진")}</div>
  `);
  const type = data.type || "company";
  const fields = {
    company: section("Employee", `
      ${field(data, "companyName", "Company")}
      ${field(data, "name", "Name")}
      ${field(data, "englishName", "English")}
      <div class="grid-2">${field(data, "department", "Dept")}${field(data, "position", "Position")}</div>
      <div class="grid-3">${field(data, "idNumber", "No.")}${field(data, "joined", "Joined")}${field(data, "valid", "Valid")}</div>
      ${field(data, "access", "Access Level")}
    `),
    sentinel: section("Sentinel / Guide", `
      ${field(data, "codename", "Codename")}
      ${field(data, "ability", "Ability")}
      <div class="grid-2">${field(data, "sentinelType", "Type")}${field(data, "sentinelClass", "Class")}</div>
      ${field(data, "affiliation", "Affiliation")}
      ${field(data, "idNumber", "No.")}
    `),
    student: section("Student", `
      ${field(data, "school", "School")}
      ${field(data, "schoolType", "Type")}
      ${field(data, "name", "Name")}
      ${field(data, "grade", "Grade")}
      <div class="grid-3">${field(data, "enrollment", "Enrollment")}${field(data, "graduation", "Graduation")}${field(data, "idNumber", "No.")}</div>
    `),
    university: section("University", `
      ${field(data, "university", "University")}
      ${field(data, "major", "Major")}
      ${field(data, "name", "Name")}
      <div class="grid-3">${field(data, "year", "Year")}${field(data, "idNumber", "No.")}${field(data, "joined", "Admission")}</div>
      <div class="grid-2">${field(data, "library", "Library")}${field(data, "dormitory", "Dormitory")}</div>
    `),
    lovers: section("Lovers Card", `
      ${field(data, "club", "Club Name")}
      ${field(data, "name", "Name")}
      ${field(data, "nickname", "Nickname")}
      ${field(data, "bias", "Favorite")}
      <div class="grid-3">${field(data, "birth", "Birth")}${field(data, "className", "Class")}${field(data, "number", "Number")}</div>
      <div class="grid-2">${field(data, "position", "Position")}${field(data, "membership", "Membership")}</div>
      ${field(data, "idNumber", "No.")}
    `),
  }[type];
  return common + fields;
}

function toypackEditor(data) {
  return section("이미지/이름", `
    ${imageField(data, "image", "패키지 이미지")}
    <div class="grid-3">
      ${field(data, "imageX", "이미지 X", { type: "range", min: -140, max: 140 })}
      ${field(data, "imageY", "이미지 Y", { type: "range", min: -140, max: 140 })}
      ${field(data, "imageZoom", "이미지 크기", { type: "range", min: 20, max: 300 })}
    </div>
    ${field(data, "mainName", "캐릭터 이름")}
    ${field(data, "subName", "서브 타이틀")}
    ${field(data, "series", "시리즈")}
  `) + section("색상", `
    <div class="grid-3">${field(data, "color1", "컬러 1", { type: "color" })}${field(data, "color2", "컬러 2", { type: "color" })}${field(data, "accentColor", "포인트", { type: "color" })}</div>
    ${select(data, "gradient", "그라데이션", [
      { value: "diagonal", label: "↗" },
      { value: "vertical", label: "↓" },
      { value: "horizontal", label: "→" },
      { value: "radial", label: "Radial" },
    ])}
  `);
}

function playlistEditor(data) {
  return section("플레이리스트", `
    ${field(data, "name", "플레이리스트 이름")}
    ${imageField(data, "coverImage", "커버 이미지")}
    ${field(data, "accentColor", "포인트색", { type: "color" })}
    ${select(data, "bgTone", "배경", [
      { value: "white", label: "화이트" },
      { value: "soft", label: "소프트" },
      { value: "blush", label: "블러쉬" },
    ])}
  `) + section("트랙", `
    ${listHeader("트랙", "tracks", "트랙 추가")}
    ${(data.tracks || []).map((_, index) => listItem(`트랙 ${index + 1}`, "tracks", index, `
      ${imageField(data, `tracks.${index}.thumb`, "썸네일")}
      ${field(data, `tracks.${index}.title`, "제목")}
      ${field(data, `tracks.${index}.artist`, "아티스트")}
      ${field(data, `tracks.${index}.link`, "링크")}
    `)).join("")}
  `);
}

function renaiTvShowEditor(data) {
  const cardEditor = (cardIndex, title) => section(title, `
    ${field(data, `cards.${cardIndex}.title`, "카드 제목")}
    ${imageField(data, `cards.${cardIndex}.faceImage`, "얼굴 이미지")}
    ${listHeader("속성", `cards.${cardIndex}.attrs`, "항목 추가")}
    ${(data.cards?.[cardIndex]?.attrs || []).map((_, index) => listItem(`항목 ${index + 1}`, `cards.${cardIndex}.attrs`, index, `
      ${field(data, `cards.${cardIndex}.attrs.${index}.label`, "라벨")}
      ${textarea(data, `cards.${cardIndex}.attrs.${index}.value`, "내용")}
    `)).join("")}
  `);
  return section("보드", `
    <div class="grid-3">${field(data, "themeColor", "테마", { type: "color" })}${field(data, "themeDeep", "딥 컬러", { type: "color" })}${checkbox(data, "singleMode", "싱글 모드")}</div>
    <div class="grid-2">${field(data, "bg1", "배경 1", { type: "color" })}${field(data, "bg2", "배경 2", { type: "color" })}</div>
    <div class="grid-2">${imageField(data, "leftFullImage", "왼쪽 전신")}${imageField(data, "rightFullImage", "오른쪽 전신")}</div>
    ${field(data, "relationA", "관계 화살표 A→B")}
    ${field(data, "relationB", "관계 화살표 B→A")}
  `) + cardEditor(0, "카드 1") + cardEditor(1, "카드 2");
}

function lifeFourCutEditor(data) {
  return section("인생네컷", `
    ${select(data, "theme", "테마", [
      { value: "white", label: "Pure White" },
      { value: "midnight", label: "Midnight Black" },
      { value: "rose", label: "Rose Blush" },
      { value: "sage", label: "Sage Green" },
      { value: "lavender", label: "Lavender Fog" },
    ])}
    ${select(data, "font", "글꼴", [
      { value: "Cormorant Garamond", label: "Cormorant" },
      { value: "Gowun Batang", label: "Gowun Batang" },
      { value: "Pinyon Script", label: "Pinyon Script" },
    ])}
    ${field(data, "title", "하단 문구")}
    <div class="grid-2">${[0, 1, 2, 3].map((index) => imageField(data, `images.${index}`, `사진 ${index + 1}`)).join("")}</div>
  `);
}

function photoAlbumEditor(data) {
  return section("포토앨범", `
    <div class="grid-3">${field(data, "theme1", "테마 1", { type: "color" })}${field(data, "theme2", "테마 2", { type: "color" })}${field(data, "bgColor", "배경", { type: "color" })}</div>
    ${field(data, "paperColor", "종이색", { type: "color" })}
    <div class="grid-2">${field(data, "page", "페이지")}${field(data, "date", "날짜")}</div>
    ${field(data, "title", "타이틀")}
    <div class="grid-2">${field(data, "nameA", "이름 A")}${field(data, "nameB", "이름 B")}</div>
    ${textarea(data, "quote", "인용문")}
    ${field(data, "credit", "크레딧")}
    ${field(data, "slotCount", "사진 수", { type: "range", min: 1, max: 9 })}
  `) + section("사진", `
    <div class="grid-3">${Array.from({ length: 9 }, (_, index) => imageField(data, `images.${index}`, `사진 ${index + 1}`)).join("")}</div>
  `);
}

function netflixScreenshotEditor(data) {
  return section("프레임", `
    ${imageField(data, "image", "영상 이미지")}
    <div class="grid-3">${field(data, "imageX", "이미지 X", { type: "range", min: 0, max: 100 })}${field(data, "imageY", "이미지 Y", { type: "range", min: 0, max: 100 })}${field(data, "imageZoom", "이미지 크기", { type: "range", min: 10, max: 300 })}</div>
    <div class="grid-2">${field(data, "line1", "상단 자막")}${field(data, "line2", "하단 자막")}</div>
    ${select(data, "subtitleStyle", "자막 스타일", [
      { value: "netflix", label: "Netflix" },
      { value: "festival", label: "영화제" },
      { value: "documentary", label: "다큐" },
      { value: "anime", label: "애니" },
    ])}
    ${select(data, "lut", "LUT", [
      { value: "none", label: "None" },
      { value: "tealOrange", label: "Teal Orange" },
      { value: "warm", label: "Warm" },
      { value: "cold", label: "Cold" },
      { value: "bw", label: "B/W" },
    ])}
    ${field(data, "brightness", "밝기", { type: "range", min: 0.5, max: 1.3, step: 0.01 })}
    ${checkbox(data, "letterbox", "레터박스")}
    ${checkbox(data, "vignette", "소프트 비네팅")}
    ${checkbox(data, "blur", "뎁스 블러")}
  `);
}

function movieTicketEditor(data) {
  const common = section("티켓 설정", `
    ${select(data, "ticketType", "유형", [
      { value: "movie", label: "Movie" },
      { value: "boarding", label: "Boarding" },
      { value: "receipt", label: "Receipt" },
    ])}
    <div class="grid-2">${field(data, "color1", "컬러 1", { type: "color" })}${field(data, "color2", "컬러 2", { type: "color" })}</div>
    ${imageField(data, "image", "사진")}
  `);
  const type = data.ticketType || "movie";
  const fields = {
    movie: section("Movie", `
      ${field(data, "title", "제목")}
      ${field(data, "subtitle", "부제")}
      ${field(data, "cast", "캐스트")}
      <div class="grid-2">${field(data, "date", "날짜")}${field(data, "time", "시간")}</div>
      <div class="grid-2">${field(data, "seat", "좌석")}${field(data, "info", "정보")}</div>
      ${field(data, "stubText", "스텁 문구")}
    `),
    boarding: section("Boarding", `
      ${field(data, "airline", "항공사")}
      ${field(data, "classBadge", "클래스")}
      <div class="grid-2">${field(data, "fromCode", "출발 코드")}${field(data, "toCode", "도착 코드")}</div>
      <div class="grid-2">${field(data, "fromCity", "출발 도시")}${field(data, "toCity", "도착 도시")}</div>
      ${field(data, "passenger", "승객")}
      <div class="grid-4">${field(data, "flight", "편명")}${field(data, "date", "날짜")}${field(data, "time", "시간")}${field(data, "gate", "게이트")}</div>
      <div class="grid-2">${field(data, "seat", "좌석")}${field(data, "info", "비고")}</div>
    `),
    receipt: section("Receipt", `
      ${field(data, "receiptStore", "가게명")}
      <div class="grid-2">${field(data, "date", "날짜")}${field(data, "order", "주문번호")}</div>
      <div class="grid-2">${field(data, "client", "Client")}${field(data, "server", "Server")}</div>
      ${listHeader("영수증 항목", "items", "항목 추가")}
      ${(data.items || []).map((_, index) => listItem(`항목 ${index + 1}`, "items", index, `
        ${field(data, `items.${index}.name`, "이름")}
        <div class="grid-2">${field(data, `items.${index}.qty`, "수량")}${field(data, `items.${index}.price`, "금액")}</div>
      `)).join("")}
      ${field(data, "total", "합계")}
      ${field(data, "receiptMessage", "하단 문구")}
    `),
  }[type];
  return common + fields;
}

function internetBoardEditor(data) {
  return section("게시글", `
    ${select(data, "tag", "태그", [
      { value: "☕ 일상", label: "☕ 일상" },
      { value: "☁️ 플러피", label: "☁️ 플러피" },
      { value: "🔥 핫이슈", label: "🔥 핫이슈" },
      { value: "🤫 고민", label: "🤫 고민" },
      { value: "💖 연애", label: "💖 연애" },
      { value: "💻 직장", label: "💻 직장" },
    ])}
    ${checkbox(data, "darkMode", "다크 모드")}
    <div class="grid-2">${field(data, "author", "작성자")}${field(data, "date", "시간")}</div>
    <div class="grid-2">${field(data, "avatarText", "아바타 글자")}${checkbox(data, "showPreviewControls", "미리보기 버튼 표시")}</div>
    ${field(data, "title", "제목")}
    ${textarea(data, "content", "본문", "오늘 어떤 일이 있었나요?")}
    ${imageField(data, "image", "첨부 이미지")}
    <div class="grid-3">${field(data, "views", "조회수")}${field(data, "likes", "좋아요")}${field(data, "bookmarks", "북마크")}</div>
  `) + section("댓글", `
    ${listHeader("댓글", "comments", "댓글 추가")}
    ${(data.comments || []).map((_, index) => listItem(`댓글 ${index + 1}`, "comments", index, `
      ${textarea(data, `comments.${index}.text`, "내용", "따뜻한 댓글을 남겨주세요.")}
    `)).join("")}
  `);
}

window.CardStudioTemplates = {
  renderEditor,
};
})();
