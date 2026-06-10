(() => {
const { backgroundStyle, escapeHtml, getByPath, nl2br, parseCategoryLines, parseKeywords } = window.CardStudioUtils;

const e = escapeHtml;

function renderCard(styleId, data) {
  const renderers = {
    instagram: renderInstagram,
    youtube: renderYoutube,
    wiki: renderWiki,
    netflix: renderNetflix,
    musicplayer: renderMusicPlayer,
    musicplayer2: renderMusicPlayer2,
    timeline: renderTimeline,
    couple: renderCouple,
    messenger: renderMessenger,
    catchphrase: renderCatchphrase,
    tamagotchi: renderTamagotchi,
    idcard: renderIdCard,
    toypack: renderToypack,
    playlist: renderPlaylist,
    renaitvshow: renderRenaiTvShow,
    lifefourcut: renderLifeFourCut,
    photoalbum: renderPhotoAlbum,
    netflixscreenshot: renderNetflixScreenshot,
    movieticket: renderMovieTicket,
    internetboard: renderInternetBoard,
    rpgmaker: renderRpgMaker,
    linestamp: renderLineStamp,
    poster: renderPoster,
  };
  return renderers[styleId]?.(data) || "";
}

function mediaBox(src, className, label, extra = "") {
  const style = backgroundStyle(src);
  return `<div class="${className} media-box" style="${style}" ${extra}>${src ? "" : `<span>${e(label)}</span>`}</div>`;
}

function panSurface(data, srcPath, className, label, fields = {}, options = {}) {
  const src = getByPath(data, srcPath) || "";
  const scalePath = fields.scale || `${srcPath}Scale`;
  const xPath = fields.x || `${srcPath}PanX`;
  const yPath = fields.y || `${srcPath}PanY`;
  const fit = options.fit === "contain" ? " contain" : "";
  const filter = options.filter ? ` style="filter:${options.filter}"` : "";
  const style = panStyle(data, { scale: scalePath, x: xPath, y: yPath }, options);
  const attrs = `data-bg-pan-surface data-pan-x-field="${e(xPath)}" data-pan-y-field="${e(yPath)}" data-pan-scale-field="${e(scalePath)}"`;
  return `<div class="${className} media-box pan-frame${src ? " has-pan-image" : ""}" style="${style}" ${attrs}>${src ? `<img class="pan-img${fit}" src="${e(src)}" alt=""${filter}>` : `<span>${e(label)}</span>`}</div>`;
}

function panStyle(data, fields = {}, options = {}) {
  const scale = Math.max(10, Number(getByPath(data, fields.scale)) || options.scaleFallback || 100) / 100;
  const panX = Number.isFinite(Number(getByPath(data, fields.x))) ? Number(getByPath(data, fields.x)) : 0;
  const panY = Number.isFinite(Number(getByPath(data, fields.y))) ? Number(getByPath(data, fields.y)) : 0;
  return `--pan-x:${panX}px;--pan-y:${panY}px;--pan-scale:${scale}`;
}

function avatar(src, className = "") {
  return `<div class="avatar ${className}" style="${backgroundStyle(src)}">${src ? "" : "<span></span>"}</div>`;
}

function faIcon(name, className = "") {
  const icons = {
    bars: ['0 0 448 512', 'M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z'],
    search: ['0 0 512 512', 'M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.2 253.9 416 208 416C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z'],
    microphone: ['0 0 384 512', 'M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24H264c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128S64 326.7 64 256V216z'],
    video: ['0 0 576 512', 'M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2V384c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1V174.9l14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z'],
    bell: ['0 0 448 512', 'M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zM224 512a64 64 0 0 0 64-64H160a64 64 0 0 0 64 64z'],
  };
  const icon = icons[name];
  return `<svg class="${className}" viewBox="${icon[0]}" aria-hidden="true"><path d="${icon[1]}"></path></svg>`;
}

function lineIcon(content, className = "") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${content}</svg>`;
}

function renderInstagram(data) {
  const mode = data.subtype || "post";
  const body = {
    profile: renderInstagramProfile,
    post: renderInstagramPost,
    story: renderInstagramStory,
    dm: renderInstagramDm,
  }[mode]?.(data);
  return `<article class="card-frame ig-card" data-export-card="instagram">${body}</article>`;
}

function renderInstagramProfile(data) {
  const highlightItems = Array.isArray(data.highlights) ? data.highlights.slice(0, 3) : [];
  while (highlightItems.length < 1) highlightItems.push({ title: "new", image: "" });
  const highlights = highlightItems
    .map((item) => `
      <div class="ig-highlight">
        <div class="ig-highlight-ring">${mediaBox(item.image, "ig-highlight-img", "HL")}</div>
        <span>${e(item.title || "title")}</span>
      </div>
    `)
    .join("");
  const feed = (data.feedImages || [])
    .map((src) => mediaBox(src, "ig-feed-cell", "PHOTO"))
    .join("");
  return `
    <div class="ig-profile-body">
      <div class="ig-profile-head">
        <div class="${data.hasStoryRing ? "story-ring" : ""}">${avatar(data.avatar, "ig-profile-avatar")}</div>
        <div class="ig-stats">
          <div><b>${e(data.posts)}</b><span>게시물</span></div>
          <div><b>${e(data.followers)}</b><span>팔로워</span></div>
          <div><b>${e(data.following)}</b><span>팔로잉</span></div>
        </div>
      </div>
      <div class="ig-bio">
        <b>${e(data.displayName || "Name")}</b>
        <p>${nl2br(data.bio || "")}</p>
      </div>
      <div class="ig-highlights">${highlights}</div>
    </div>
    <div class="ig-feed-grid">${feed}</div>
  `;
}

function renderInstagramPost(data) {
  const heart = lineIcon('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>');
  const comment = lineIcon('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>');
  const send = lineIcon('<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>');
  const bookmark = lineIcon('<polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21"></polygon>');
  return `
    <div class="ig-post-head">
      <div class="${data.hasStoryRing ? "story-ring tiny" : ""}">${avatar(data.avatar, "ig-post-avatar")}</div>
      <div><b>${e(data.username || "username")}</b><span>${e(data.location || "")}</span></div>
      <strong>•••</strong>
    </div>
    ${mediaBox(data.postImage, "ig-post-image", "POST IMAGE")}
    <div class="ig-actions"><div class="ig-actions-left">${heart}${comment}${send}</div>${bookmark}</div>
    <div class="ig-caption">
      <b>좋아요 ${e(data.likes || "0")}개</b>
      <p><strong>${e(data.username || "username")}</strong> ${renderHashtagText(data.caption || "", data.hashtagColor || "#00ADC8")}</p>
      <small>${e(data.postTime || "방금 전")}</small>
    </div>
  `;
}

function renderHashtagText(value, color) {
  const tagStyle = ` style="color:${e(color)}"`;
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => e(line).replace(/(^|\s)(#[^\s#]+)/g, (_, prefix, tag) => `${prefix}<span class="ig-hashtag"${tagStyle}>${tag}</span>`))
    .join("<br>");
}

function renderInstagramStory(data) {
  const tagStyle = `left:${Number(data.storyTagX) || 38}%;top:${Number(data.storyTagY) || 44}%`;
  const heart = lineIcon('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>');
  return `
    <div class="ig-story">
      ${mediaBox(data.storyImage, "ig-story-bg", "STORY")}
      <div class="ig-story-shade"></div>
      <div class="ig-story-head">
        <div class="${data.hasStoryRing ? "story-ring tiny" : ""}">${avatar(data.avatar, "ig-post-avatar")}</div>
        <b>${e(data.username || "username")}</b>
        <small>${e(data.storyTime || "")}</small>
      </div>
      ${data.storyTagVisible ? `<div class="ig-story-tag" style="${tagStyle}">${e(data.storyTag || "@tag")}</div>` : ""}
      <div class="ig-story-reply"><span>메시지 보내기...</span>${heart}</div>
    </div>
  `;
}

function renderInstagramDm(data) {
  const messages = (data.dmMessages || []).map((message) => {
    const image = message.image ? mediaBox(message.image, "ig-dm-image", "IMG") : "";
    if (message.side === "sent") {
      return `<div class="ig-dm-row sent"><div class="ig-dm-bubble" style="--dm-color:${e(data.accentColor)}">${image}${nl2br(message.text || "")}</div></div>`;
    }
    return `<div class="ig-dm-row recv">${avatar(data.avatar, "ig-dm-avatar")}<div class="ig-dm-bubble">${image}${nl2br(message.text || "")}</div></div>`;
  }).join("");
  return `
    <div class="ig-dm-head">
      <svg class="ig-dm-back" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
      <div class="${data.hasStoryRing ? "story-ring tiny" : ""}">${avatar(data.avatar, "ig-dm-header-avatar")}</div>
      <b>${e(data.username || "username")}</b>
    </div>
    <div class="ig-dm-body">
      <div class="ig-dm-date">${e(data.dmDate || "오늘")}</div>
      ${messages}
    </div>
    <div class="ig-dm-footer">
      <div class="ig-dm-input-pill">
        <span class="ig-dm-input-text">${e(data.dmInput || "메시지...")}</span>
        <svg class="ig-dm-mic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C9.79 2 8 3.79 8 6V11C8 13.21 9.79 15 12 15C14.21 15 16 13.21 16 11V6C16 3.79 14.21 2 12 2Z"/><path d="M19 10V11C19 14.87 15.87 18 12 18C8.13 18 5 14.87 5 11V10"/><path d="M12 18V22M8 22H16"/></svg>
      </div>
    </div>
  `;
}

function renderYoutube(data) {
  const comments = (data.comments || []).map(renderYoutubeComment).join("");
  const related = (data.related || []).map((video) => `
    <div class="yt-related">
      ${mediaBox(video.thumb, "yt-related-thumb", "THUMB")}
      <div>
        <b>${e(video.title || "추천 영상")}</b>
        <span>${e(video.channel || "채널")}</span>
        <small>${e(video.views || "")} · ${e(video.date || "")}</small>
      </div>
      <em>${e(video.time || "00:00")}</em>
    </div>
  `).join("");
  return `
    <article class="card-frame yt-card" data-export-card="youtube">
      <header class="yt-header">
        <div class="yt-header-left"><div class="yt-menu-icon">${faIcon("bars")}</div></div>
        <div class="yt-header-center">
          <div class="yt-search-wrapper">
            <div class="yt-search-input">${e(data.searchQuery || "검색어")}</div>
            <button type="button" class="yt-search-btn">${faIcon("search")}</button>
          </div>
          <button type="button" class="yt-mic-btn">${faIcon("microphone")}</button>
        </div>
        <div class="yt-header-right">
          <div class="yt-icon-btn">${faIcon("video")}</div>
          <div class="yt-icon-btn">${faIcon("bell")}</div>
          ${avatar(data.channelAvatar, "yt-user-avatar")}
        </div>
      </header>
      <main class="yt-layout">
        <section class="yt-primary">
          <div class="yt-player">
            ${mediaBox(data.mainImage, "yt-player-image", "VIDEO")}
            <span>${e(data.time || "00:00")}</span>
          </div>
          <h1>${e(data.title || "영상 제목")}</h1>
          <div class="yt-channel-row">
            <div class="yt-channel-block">
              ${avatar(data.channelAvatar, "yt-channel-avatar")}
              <div><b>${e(data.channelName || "채널 이름")}</b><small>${e(data.subscribers || "")}</small></div>
              <button>구독</button>
            </div>
            <div class="yt-actions">
              <span>${lineIcon('<path d="M7 22V10"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>')} ${e(data.likes || "0")}</span>
              <span>${lineIcon('<path d="M17 2v12"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>')}</span>
              <span>${lineIcon('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path><path d="M16 6l-4-4-4 4"></path><path d="M12 2v13"></path>')} 공유</span>
              <span>${lineIcon('<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>')} 오프라인 저장</span>
              <span>${lineIcon('<circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>')}</span>
            </div>
          </div>
          <div class="yt-comments-head">
            <b>${e(data.commentCount || "댓글 0개")}</b><span>정렬 기준</span>
          </div>
          <div class="yt-pin">
            <small>📌 ${e(data.channelName || "채널")} 님이 고정함</small>
            ${renderYoutubeComment({
              type: "comment",
              avatar: data.pinnedAvatar,
              name: data.pinnedName,
              time: data.pinnedTime,
              likes: data.pinnedLikes,
              text: data.pinnedText,
              owner: true,
            })}
          </div>
          ${comments}
        </section>
        <aside class="yt-secondary">${related}</aside>
      </main>
    </article>
  `;
}

function renderYoutubeComment(comment) {
  return `
    <div class="yt-comment ${comment.type === "reply" ? "is-reply" : ""}">
      ${avatar(comment.avatar, "yt-comment-avatar")}
      <div>
        <div class="yt-comment-line"><b>${e(comment.name || "익명")}</b>${comment.owner ? "<em>작성자</em>" : ""}<span>${e(comment.time || "")}</span></div>
        <p>${nl2br(comment.text || "")}</p>
        <small>👍 ${e(comment.likes || "0")} · 답글</small>
      </div>
    </div>
  `;
}

function renderWiki(data) {
  const categories = parseCategoryLines(data.categories).map((item) => {
    const label = e(item.label);
    return item.url
      ? `<a href="${e(item.url)}" target="_blank" rel="noreferrer">${label}</a>`
      : `<span>${label}</span>`;
  }).join(' <i>|</i> ');
  const infoRows = (data.infoRows || []).map((row) => `
    <tr>
      <td>${e(row.label || "")}</td>
      <td>${nl2br(row.value || "")}</td>
    </tr>
  `).join("");
  const toc = (data.sections || []).map((section, index) => `
    <li><a href="#wiki-section-${index + 1}">${index + 1}.</a> ${e(section.title || "문단")}</li>
  `).join("");
  const sections = (data.sections || []).map((section, index) => `
    <div class="wiki-section-block">
      <details open class="wiki-section">
        <summary>
          <h2 id="wiki-section-${index + 1}">
            <a href="#wiki-toc">${index + 1}.</a>
            <span><span>${e(section.title || "문단")}</span></span>
          </h2>
        </summary>
        <div class="wiki-body-content-text">${nl2br(section.body || "")}</div>
      </details>
    </div>
  `).join("");
  return `
    <article class="card-frame wiki-card wiki-main-container" style="--wiki-color:${e(data.themeColor)};--wiki-title:${e(data.titleTextColor)}" data-export-card="wiki">
      <h1 class="wiki-main-title">${e(data.title || "문서 제목")}</h1>
      <div class="wiki-edit-time">최근 수정 시각: ${e(data.editTime || "")}</div>
      <div class="wiki-category-box"><b>분류:</b> ${categories}</div>

      ${data.showSpoiler ? `
        <div class="wiki-spoiler">
          <div></div>
          <section>
            <strong>문서에 <span>스포일러</span>가 포함되어 있습니다.</strong>
            <p>${e(data.spoilerText || "이 문서가 설명하는 인물 등에 대한 반전 요소 등을 포함하고 있습니다.")}</p>
          </section>
        </div>
      ` : ""}

      <div class="wiki-infobox">
        <header>
          <h2>${e(data.profileTitle || "캐릭터 이름")}</h2>
          <p>${e(data.profileSubtitle || "")}</p>
        </header>
        ${data.profileImage ? `<div class="wiki-profile-image"><img src="${e(data.profileImage)}" alt=""></div>` : mediaBox("", "wiki-profile-image", "PROFILE")}
        <table>${infoRows}</table>
        ${data.showExtra ? `
          <details class="wiki-extra-box" open>
            <summary>▼ ${e(data.extraTitle || "기타 정보")} (접기/펴기)</summary>
            <div>${nl2br(data.extraText || "")}</div>
          </details>
        ` : ""}
      </div>

      <br>

      <div id="wiki-toc" class="wiki-toc">
        <details open>
          <summary><b>목차</b><span>∨</span></summary>
          <ol>${toc}</ol>
        </details>
      </div>

      ${sections}
    </article>
  `;
}

function renderNetflix(data) {
  const playIcon = '<svg class="flix-button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';
  const plusIcon = '<svg class="flix-button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>';
  const episodePlayIcon = '<svg class="flix-ep-play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';
  const hero = mediaBox(data.heroImage, "flix-hero-img", "POSTER");
  const homeThumbs = (data.thumbs || []).map((src) => mediaBox(src, "flix-thumb", "TITLE")).join("");
  const episodes = (data.episodes || []).map((episode, index) => `
    <div class="flix-episode">
      <div class="flix-ep-top">
        <div class="flix-ep-thumb-wrap">
          ${mediaBox(episode.thumb, "flix-ep-thumb", "EP")}
          <span class="flix-ep-play">${episodePlayIcon}</span>
        </div>
        <div class="flix-ep-info"><strong>${index + 1}. ${e(episode.title || "에피소드")}</strong><span>${e(episode.duration || "")}</span></div>
      </div>
      <p>${nl2br(episode.desc || "")}</p>
    </div>
  `).join("");
  const mode = data.mode || "detail";
  const netflixNav = `
    <nav class="flix-nav">
      <b>N</b>
      <span class="flix-nav-menu"><span>시리즈</span><span>영화</span><span>내가 찜한 콘텐츠</span></span>
      <span class="flix-nav-icons">
        ${lineIcon('<circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path>')}
        ${lineIcon('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>')}
        ${lineIcon('<path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path><line x1="2" y1="20" x2="2.01" y2="20"></line>')}
      </span>
    </nav>
  `;
  const homeHero = `
    <section class="flix-hero">
      ${hero}
      <div class="flix-gradient"></div>
      <div class="flix-hero-content">
        <small class="flix-series-label"><b>N</b> SERIES</small>
        <h1>${e(data.title || "작품 제목")}</h1>
        <div class="flix-tags">${e(data.tags || "")}</div>
        <div class="flix-buttons"><button type="button">${playIcon}<span>재생</span></button><button type="button">${plusIcon}<span>내가 찜한 콘텐츠</span></button></div>
      </div>
    </section>
    <div class="flix-source">${e(data.imageSource || "")}</div>
  `;
  const detailHero = `
    <section class="flix-hero">
      ${hero}
      <div class="flix-gradient"></div>
      <div class="flix-hero-content">
        <small class="flix-series-label"><b>N</b> ${e(data.subtitle || "ORIGINAL SERIES")}</small>
        <h1>${e(data.title || "작품 제목")}</h1>
        <div class="flix-meta"><b>${e(data.match || "")}</b><span>${e(data.year || "")}</span><span>${e(data.age || "")}</span><span>${e(data.quality || "")}</span></div>
        <p>${nl2br(data.description || "")}</p>
        <div class="flix-buttons"><button type="button">${playIcon}<span>재생</span></button><button type="button">${plusIcon}<span>찜하기</span></button></div>
      </div>
    </section>
    <div class="flix-source detail-source">${e(data.imageSource || "")}</div>
  `;
  return `
    <article class="card-frame flix-card mode-${e(mode)}" data-export-card="netflix">
      ${netflixNav}
      ${mode === "home" ? homeHero : ""}
      ${mode === "detail" ? detailHero : ""}
      ${mode === "home" ? `<section class="flix-row"><h2>${e(data.rowTitle || "콘텐츠")}</h2><div>${homeThumbs}</div></section>` : ""}
      ${mode !== "home" ? `<section class="flix-episodes"><h2>${mode === "episodes" ? "에피소드" : "회차"}</h2>${episodes}</section>` : ""}
    </article>
  `;
}

function renderMusicPlayer(data) {
  const progress = Number(data.progress) || 0;
  const volume = Number(data.volume) || 0;
  const previous = lineIcon('<polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line>');
  const play = lineIcon('<polygon points="8 5 19 12 8 19 8 5"></polygon>');
  const next = lineIcon('<polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line>');
  const volumeLow = lineIcon('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>');
  const volumeHigh = lineIcon('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>');
  return `
    <article class="card-frame music-card" style="--music-bg:${e(data.bgColor)};--music-point:${e(data.pointColor)};--music-text:${e(data.textColor)}" data-export-card="musicplayer">
      ${panSurface(data, "coverImage", "music-cover", "COVER", { scale: "imageScale", x: "imagePanX", y: "imagePanY" })}
      <div class="music-source">${e(data.copyright || "ⓒ source")}</div>
      <div class="music-info"><h1>${e(data.title || "노래 제목")}</h1><p>${e(data.artist || "가수 이름")}</p></div>
      <div class="music-slider"><span style="width:${progress}%"></span><b style="left:${progress}%"></b></div>
      <div class="music-controls"><button>${previous}</button><button class="music-play">${play}</button><button>${next}</button></div>
      <div class="music-volume"><span>${volumeLow}</span><div class="music-slider small"><span style="width:${volume}%"></span><b style="left:${volume}%"></b></div><span>${volumeHigh}</span></div>
    </article>
  `;
}

function renderMusicPlayer2() {
  return `
    <article class="card-frame musicplayer2-card" data-export-card="musicplayer2">
      <iframe class="musicplayer2-frame" src="musicplayer2.html" title="Music player B type"></iframe>
    </article>
  `;
}

function renderTimeline(data) {
  const keywords = parseKeywords(data.keywords).map((word) => `<span>${e(word)}</span>`).join("");
  const entries = (data.entries || []).map((item) => `
    <div class="tl-item">
      <div class="tl-marker"><span></span><i></i></div>
      <div class="tl-copy"><small>${e(item.date || "")}</small><h3>${e(item.title || "")}</h3><p>${nl2br(item.desc || "")}</p></div>
    </div>
  `).join("");
  return `
    <article class="card-frame timeline-card" style="--tl-color:${e(data.themeColor)}" data-export-card="timeline">
      <section class="tl-profile">
        ${panSurface(data, "mainImage", "tl-photo", "MAIN IMAGE", { scale: "mainImageScale", x: "mainImagePanX", y: "mainImagePanY" })}
        <div class="tl-source">ⓒ ${e(data.copyright || "source")}</div>
        <b>${e(data.catchphrase || "")}</b>
        <h1>${e(data.name || "이름")}</h1>
        <div class="tl-keywords">${keywords}</div>
        <p>${nl2br(data.description || "")}</p>
      </section>
      <section class="tl-list">
        <h2>${e(data.timelineTitle || "TIMELINE")}</h2>
        ${entries}
      </section>
      ${data.stickerImage ? `<div class="tl-sticker" style="${backgroundStyle(data.stickerImage)}"></div>` : ""}
    </article>
  `;
}

function renderCouple(data) {
  const entries = (data.entries || []).map((item) => {
    const ownerClass = item.owner === "a" ? "owner-a" : item.owner === "b" ? "owner-b" : "owner-common";
    return `
      <div class="pair-event ${ownerClass}">
        <div class="pair-marker"><div class="pair-dot"></div><i></i></div>
        <div><small>${e(item.date || "")}</small><h3>${e(item.title || "")}</h3><p>${nl2br(item.desc || "")}</p></div>
      </div>
    `;
  }).join("");
  return `
    <article class="card-frame pair-card layout-${e(data.layout || "center")}" style="--pair-a:${e(data.colorA)};--pair-b:${e(data.colorB)};--pair-common:${e(data.colorCommon)}" data-export-card="couple">
      <header class="pair-header">
        <h1>${e(data.pairName || "PAIR NAME")}</h1>
        ${panSurface(data, "bannerImage", "pair-banner", "BANNER", { scale: "bannerImageScale", x: "bannerImagePanX", y: "bannerImagePanY" })}
      </header>
      <section class="pair-body">
        ${renderPerson(data, "personA", "a")}
        <div class="pair-timeline">
          <h2>${e(data.timelineTitle || "PAIR TIMELINE")}</h2>
          ${entries}
        </div>
        ${renderPerson(data, "personB", "b")}
      </section>
    </article>
  `;
}

function renderPerson(data, personPath, side) {
  const person = getByPath(data, personPath) || {};
  const keywords = parseKeywords(person?.keywords).map((word) => `<span>${e(word)}</span>`).join("");
  return `
    <aside class="pair-person person-${side}">
      ${panSurface(data, `${personPath}.image`, "pair-photo", "PROFILE", { scale: `${personPath}.imageScale`, x: `${personPath}.imagePanX`, y: `${personPath}.imagePanY` })}
      <div class="pair-source">ⓒ ${e(person?.copyright || "source")}</div>
      <b>${e(person?.catchphrase || "")}</b>
      <h2>${e(person?.name || "Name")}</h2>
      <div class="pair-keywords">${keywords}</div>
      <p>${nl2br(person?.description || "")}</p>
    </aside>
  `;
}

function renderMessenger(data) {
  const initial = normalizeMessengerMessage({
    image: data.initialImage,
    text: data.initialText,
  });
  const sequence = (data.messages || []).map(normalizeMessengerMessage);
  const sequenceJson = JSON.stringify(sequence)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
  return `
    <article class="card-frame messenger-card" style="--msg-point:${e(data.pointColor)}" data-export-card="messenger" data-messenger-card data-next-index="0">
      <header class="msg-header">
        <h1>${e(data.headerTitle || "New Message")}</h1>
        <a class="cancel-btn">${e(data.cancelText || "Cancel")}</a>
      </header>
      <section class="msg-to">
        <div class="to-left-group">
          <span>To:</span>
          <b class="recipient-badge">${e(data.recipient || "recipient")}</b>
        </div>
        <div class="add-btn" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>
      </section>
      <section class="msg-history" data-msg-history>${renderMessengerItem(initial)}</section>
      <footer class="msg-input">
        <span class="msg-plus" aria-hidden="true">+</span>
        <div class="msg-pill">
          <input data-msg-input type="text" placeholder="${e(data.inputPlaceholder || "Add comment or Send")}">
          <button type="button" class="msg-send" data-msg-send aria-label="Send">
            <svg viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
          </button>
        </div>
      </footer>
      <script type="application/json" data-msg-sequence>${sequenceJson}</script>
    </article>
  `;
}

function normalizeMessengerMessage(message = {}) {
  const images = Array.isArray(message.images)
    ? message.images.filter(Boolean)
    : [message.image, message.image2].filter(Boolean);
  return {
    images,
    text: message.text || "",
  };
}

function renderMessengerItem(message) {
  const images = Array.isArray(message.images) ? message.images : [];
  const photo = images.length
    ? images.map((image) => `<div class="msg-photo"><img src="${e(image)}" alt=""></div>`).join("")
    : `<div class="msg-photo placeholder"><span>PHOTO</span></div>`;
  return `
    <div class="msg-item">
      <div class="msg-photos">${photo}</div>
      <div class="msg-comment">${nl2br(message.text || "")}</div>
    </div>
  `;
}

function renderCatchphrase(data) {
  const infoRows = (data.infoRows || [])
    .filter((row) => row.label || row.value)
    .map((row) => `
      <div class="cp-info-block">
        <div class="cp-info-label">${e(row.label || "")}</div>
        <div class="cp-info-value">${nl2br(row.value || "")}</div>
      </div>
    `).join("");
  const keywords = parseKeywords(data.keywords)
    .map((word) => `<span class="cp-kwtag">${e(word)}</span>`)
    .join("");
  const tone = Number(data.gradientTone) || 0;
  const alpha = (Number(data.gradientOpacity) || 0) / 100;
  const height = Number(data.gradientHeight) || 70;
  const grad = `linear-gradient(to top, rgba(${tone},${tone},${tone},${alpha.toFixed(2)}) 0%, rgba(${tone},${tone},${tone},${(alpha * 0.6).toFixed(2)}) ${Math.round(height * 0.45)}%, rgba(${tone},${tone},${tone},0) ${height}%)`;
  const font = data.nameFont === "Playfair Display" ? "'Playfair Display', serif" : "'Nunito', sans-serif";
  return `
    <article class="card-frame cp-card" style="--acc:${e(data.accentColor)};--ctxt:${e(data.textColor)};--cbg:${e(data.bgColor)}" data-export-card="catchphrase">
      ${panSurface(data, "image", "cp-img", "MAIN IMAGE", { scale: "imageScale", x: "imagePanX", y: "imagePanY" })}
      <div class="cp-grad" style="background:${grad}"></div>
      ${data.badge ? `<div class="cp-badge">${e(String(data.badge).toUpperCase())}</div>` : ""}
      ${data.keyTop ? `<div class="cp-keytop"><span class="cp-keytop-sparkle">✦</span><span class="cp-keytop-txt">${e(String(data.keyTop).toUpperCase())}</span></div>` : ""}
      <div class="cp-main">
        ${data.name ? `<h1 class="cp-name" style="font-family:${font}">${e(String(data.name).toUpperCase())}</h1>` : ""}
        <div class="cp-divider"></div>
        <p class="cp-phrase">${nl2br(data.phrase || "")}</p>
      </div>
      <div class="cp-info">
        <div class="cp-info-list">${infoRows}</div>
        ${keywords ? `<div class="cp-info-block"><div class="cp-info-label">Symbol</div><div class="cp-kwtags">${keywords}</div></div>` : ""}
      </div>
      <div class="cp-bar"></div>
    </article>
  `;
}

function renderTamagotchi(data) {
  const themes = {
    default: ["#ffe4e8", "#ff8fab", "#ffc2d1", "#fb6f92", "#ffffff"],
    white: ["#f5f5f5", "#ffffff", "#ffffff", "#d1d1d1", "#ffffff"],
    black: ["#333333", "#1a1a1a", "#444444", "#000000", "#333333"],
    blue: ["#e0f2fe", "#7dd3fc", "#bae6fd", "#38bdf8", "#ffffff"],
    mint: ["#dcfce7", "#6ee7b7", "#a7f3d0", "#34d399", "#ffffff"],
    purple: ["#f3e8ff", "#d8b4fe", "#e9d5ff", "#c084fc", "#ffffff"],
    lemon: ["#fffde7", "#fff176", "#fff9c4", "#fbc02d", "#ffffff"],
  };
  const [bg, shell, light, shadow, bezel] = themes[data.theme] || themes.default;
  return `
    <article class="card-frame tama-wrap" style="--tama-bg:${bg};--tama-shell:${shell};--tama-light:${light};--tama-shadow:${shadow};--tama-bezel:${bezel}" data-export-card="tamagotchi">
      <div class="tama-shell">
        <div class="tama-keychain"></div>
        <div class="tama-brand">Tamagotchi</div>
        <div class="tama-bezel">
          <div class="tama-lcd">
            <div class="tama-overlay"></div>
            <div class="tama-top"><span>${e(String(data.name || "MY CHAR").toUpperCase()).slice(0, 8)}</span><span>${e(data.days || "DAYS:01")}</span></div>
            <div class="tama-slot">
              ${data.image ? panSurface(data, "image", "tama-pan", "CHAR", { scale: "imageScale", x: "imagePanX", y: "imagePanY" }) : `<div class="tama-trigger">TAP TO<br>HATCH!</div>`}
            </div>
            <div class="tama-bottom"><span>${e(data.hearts || "♥♥♡♡")}</span><span>${e(data.stars || "★★☆☆")}</span></div>
          </div>
        </div>
        <div class="tama-buttons"><i></i><i></i><i></i></div>
      </div>
    </article>
  `;
}

function renderIdCard(data) {
  const color = data.accentColor || "#2050a0";
  const light = data.themeMode === "light";
  const side = data.side || "front";
  const type = data.type || "company";
  const content = side === "back" ? renderIdBack(data, type, color, light) : renderIdFront(data, type, color, light);
  return `
    <article class="card-frame idc-stage">
      <div class="idc-lanyard"><i></i><b style="background:${e(color)}"></b><i></i></div>
      <div class="idc-card" data-export-card="idcard">${content}</div>
    </article>
  `;
}

function renderIdFront(data, type, color, light) {
  if (type === "sentinel") return renderIdSentinelFront(data, color, light);
  if (type === "student") return renderIdStudentFront(data, color, light);
  if (type === "university") return renderIdUniversityFront(data, color, light);
  if (type === "lovers") return renderIdLoversFront(data, color, light);
  const bg = light ? "#ffffff" : "linear-gradient(160deg,#303340,#3a3d48)";
  return `
    <section class="idc-face idc-emp" style="background:${bg};--idc:${e(color)};--idc-main:${light ? "#222" : "#fff"};--idc-sub:${light ? "#666" : "rgba(255,255,255,.7)"}">
      <div class="idc-emp-dec a"></div><div class="idc-emp-dec b"></div><div class="idc-corner tr"></div><div class="idc-corner bl"></div>
      <header class="idc-emp-top"><span class="idc-logo">${e((data.companyName || "C").charAt(0))}</span><b>${e(data.companyName || "Company")}</b></header>
      ${renderIdPhoto(data)}
      <div class="idc-center">
        <small>EMPLOYEE</small>
        <h2>${e(data.name || "Name")}</h2>
        <p>${e(data.englishName || "English Name")}</p>
        ${data.access ? `<em>${e(data.access)}</em>` : ""}
      </div>
      <div class="idc-fields">
        ${idRow("DEPT", data.department)}
        ${idRow("POSITION", data.position)}
      </div>
      <div class="idc-twin"><span><small>JOINED</small><b>${e(data.joined || "")}</b></span><span><small>VALID</small><b>${e(data.valid || "")}</b></span></div>
      <footer class="idc-bottom"><span>${e(data.idNumber || "EMP-0000")}</span><i>◎</i></footer>
    </section>
  `;
}

function renderIdSentinelFront(data, color, light) {
  return `
    <section class="idc-face idc-sentinel" style="--idc:${e(color)};background:${light ? "#fff" : `linear-gradient(170deg,${shade(color, -20)},#060810,${shade(color, -10)})`};--idc-main:${light ? "#222" : "#fff"};--idc-sub:${light ? "#666" : "rgba(255,255,255,.7)"}">
      <header class="idc-sgb-head"><span>◎</span><div><b>S G B</b><small>SENTINEL GUIDANCE BUREAU</small></div><em>${e(data.sentinelClass || "S-Class").split("-")[0]}</em></header>
      ${renderIdPhoto(data)}
      <h2 class="idc-code">${e(data.codename || "CODENAME")}</h2>
      <p class="idc-pill">${e(data.ability || "ABILITY")}</p>
      <div class="idc-fields">${idRow("CLASS", data.sentinelClass)}${idRow("AFFILIATION", data.affiliation)}</div>
      <footer class="idc-bottom"><span>NO. ${e(data.idNumber || "SGB-0000")}</span></footer>
    </section>
  `;
}

function renderIdStudentFront(data, color, light) {
  return `
    <section class="idc-face idc-student" style="--idc:${e(color)};--idc-main:${light ? "#222" : "#fff"};--idc-sub:${light ? "#666" : "rgba(255,255,255,.7)"};background:${light ? "#fff" : "#2d3340"}">
      <header class="idc-stu-head"><span>◎</span><div><b>${e(data.school || "School")}</b><small>STUDENT ID / ${e(data.schoolType || "")}</small></div></header>
      ${renderIdPhoto(data)}
      <h2 class="idc-stu-name">${e(data.name || "Name")}</h2>
      <div class="idc-fields">${idRow("ENROLLMENT", data.enrollment)}${idRow("GRADUATION", data.graduation)}${idRow("GRADE", data.grade)}</div>
      <p class="idc-note">This card certifies the holder as a registered student.</p>
      <footer class="idc-barcode">${barcodeBars(data.idNumber || "STU-0000")}</footer>
      <div class="idc-colorbar"></div>
    </section>
  `;
}

function renderIdUniversityFront(data, color, light) {
  return `
    <section class="idc-face idc-uni" style="--idc:${e(color)};--idc-main:${light ? "#222" : "#fff"};--idc-sub:${light ? "#666" : "rgba(255,255,255,.7)"};background:${light ? "#fff" : "#2d3038"}">
      <header class="idc-uni-head"><span>◎</span><div><b>${e(data.university || "University")}</b><small>STUDENT IDENTIFICATION</small></div><em>STUDENT</em></header>
      ${renderIdPhoto(data)}
      <h2 class="idc-stu-name">${e(data.name || "Name")}</h2>
      <p class="idc-major">${e(data.major || "Major")}</p>
      <div class="idc-grid"><span><small>YEAR</small><b>${e(data.year || "")}</b></span><span><small>ADMITTED</small><b>${e(data.joined || "")}</b></span></div>
      <footer class="idc-bottom center"><small>STUDENT NO.</small><span>${e(data.idNumber || "U-0000")}</span></footer>
      <div class="idc-colorbar"></div>
    </section>
  `;
}

function renderIdLoversFront(data, color, light) {
  return `
    <section class="idc-face idc-luv" style="--idc:${e(color)};--idc-main:${light ? "#2d2228" : "#fff"};--idc-sub:${light ? "#8a767d" : "rgba(255,255,255,.7)"};background:${light ? "#fff" : "#2d2530"}">
      <div class="idc-luv-border"></div><div class="idc-luv-inner">
      <header><b>${e(data.club || "Lover's Club")}</b><small>LOVERS CARD</small></header>
      ${renderIdPhoto(data)}
      <h2>${e(data.name || "Name")}</h2><p>@${e(data.nickname || "nickname")}</p>
      <div class="idc-fields">${idRow("DATE OF BIRTH", data.birth)}${idRow("CLASS", data.className)}${idRow("NUMBER", data.number)}${idRow("NAME", data.bias)}${idRow("POSITION", data.position)}${idRow("MEMBERSHIP", data.membership)}</div>
      <footer>${e(data.idNumber || "FC-0000")} <span>♥ ♥ ♥</span></footer>
      </div>
    </section>
  `;
}

function renderIdBack(data, type, color, light) {
  const title = type === "sentinel" ? "SENTINEL GUIDANCE BUREAU" : type === "university" ? data.university : type === "lovers" ? data.club : type === "student" ? "Student ID" : data.companyName;
  return `
    <section class="idc-face idc-back" style="--idc:${e(color)};background:${light ? "#f7f7f5" : "#303340"};--idc-main:${light ? "#222" : "#fff"};--idc-sub:${light ? "#777" : "rgba(255,255,255,.75)"}">
      <h2>${e(title || "Identification Card")}</h2>
      <i></i>
      <b>NOTICE</b>
      <p>This card certifies the holder as an official member.<br>Cannot be lent, transferred, or duplicated.<br>Report loss immediately for reissue.<br>Misuse is subject to disciplinary action.</p>
      <div class="idc-barcode">${barcodeBars(data.idNumber || "0000")}</div>
      <footer><span>${e(data.idNumber || "0000")}</span><em></em></footer>
    </section>
  `;
}

function renderIdPhoto(data) {
  return data.photo
    ? panSurface(data, "photo", "idc-photo", "PHOTO", { scale: "photoScale", x: "photoPanX", y: "photoPanY" })
    : `<div class="idc-photo"><div class="idc-np"><i></i><b></b></div></div>`;
}

function idRow(label, value) {
  return `<div class="idc-row"><span>${e(label)}</span><b>${e(value || "")}</b></div>`;
}

function renderToypack(data) {
  return `
    <article class="card-frame toy-card" style="--toy-c1:${e(data.color1)};--toy-c2:${e(data.color2)};--toy-ac:${e(data.accentColor)};--toy-bg:${toyGradient(data.gradient, data.color1, data.color2)}" data-export-card="toypack">
      <div class="toy-hole"></div>
      <div class="toy-cut"><span>✂</span></div>
      ${data.series ? `<div class="toy-series">${e(String(data.series).toUpperCase())}</div>` : ""}
      <div class="toy-pixels" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <section class="toy-inner">
        <div class="toy-code">${barcodeBars("NO.01")}</div>
        ${panSurface(data, "image", "toy-image", "", { scale: "imageScale", x: "imagePanX", y: "imagePanY" }, { fit: "contain", filter: "drop-shadow(0 6px 20px rgba(220, 80, 130, 0.15))" })}
        ${data.mainName ? `<h2>${e(data.mainName)}</h2>` : ""}
      </section>
      <div class="toy-badge">+ 한정판 +</div>
      <div class="toy-number-badge">No. 01</div>
      <section class="toy-info"><b>CAUTION</b><p>Do not eat, no matter how cute it is.<br>For ages 3+. Keep out of reach of small children.<br>Avoid direct sunlight and humid environments.</p></section>
      <footer>${data.subName ? `* ${e(data.subName)} *` : "* * *"}</footer>
    </article>
  `;
}

function renderPlaylist(data) {
  const tracks = (data.tracks || []).map((track, index) => `
    <div class="pl-track">
      <span class="pl-num">${index + 1}</span>
      <span class="pl-play">▶</span>
      ${track.thumb ? `<div class="pl-art" style="${backgroundStyle(track.thumb)}"></div>` : `<div class="pl-art-ph">♪</div>`}
      <div class="pl-info"><b>${e(track.title || "Track")}</b><span>${e(track.artist || "—")}</span></div>
      ${track.link ? `<a class="pl-link" href="${e(track.link)}">↗</a>` : "<i></i>"}
    </div>
  `).join("");
  const bg = { white: ["#fffafd", "#fdf2f8", "#ffffff"], soft: ["#fce7f3", "#fbcfe0", "#ffffff"], blush: ["#ffd7e3", "#fbcfe0", "#ffffff"] }[data.bgTone] || ["#fffafd", "#fdf2f8", "#ffffff"];
  return `
    <article class="card-frame pl-card pl-${e(data.layout || "a")}" style="--pl-acc:${e(data.accentColor)};--pl-bg:${bg[0]};--pl-bg2:${bg[1]};--pl-card:${bg[2]}" data-export-card="playlist">
      <header class="pl-top">
        <div class="pl-logo-area">
          <span class="pl-logo-label">playlist</span>
          <div class="pl-title-row"><span>${e(data.name || "My Playlist")}</span></div>
        </div>
      </header>
      ${data.coverImage ? panSurface(data, "coverImage", "pl-cover has-img", "COVER", { scale: "coverImageScale", x: "coverImagePanX", y: "coverImagePanY" }) : `<div class="pl-cover"><div class="pl-cover-placeholder"><div>${lineIcon('<path d="M12 21s-7-4.5-9.5-9C.5 8 2.5 3 7 3c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4.5 0 6.5 5 4.5 9-2.5 4.5-9.5 9-9.5 9z"/>')}</div><h3>사진 넣기</h3><p>클릭하여 업로드</p></div></div>`}
      <div class="pl-meta"><span>♥</span><b>${(data.tracks || []).length} TRACKS</b></div>
      <div class="pl-divider"><i></i><span>♥ Tracks</span><i></i></div>
      <section class="pl-list">${tracks || `<div class="pl-empty"><div class="pl-empty-icon">${lineIcon('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>')}</div><h3>아직 비어 있어요</h3><p>추가 버튼으로 트랙을 넣어보세요</p></div>`}</section>
    </article>
  `;
}

function renderRenaiTvShow(data) {
  const cardA = data.cards?.[0] || {};
  const cardB = data.cards?.[1] || {};
  return `
    <article class="card-frame renai-stage${data.singleMode ? " single" : ""}" style="--rn-theme:${e(data.themeColor)};--rn-deep:${e(data.themeDeep)};--rn-bg1:${e(data.bg1)};--rn-bg2:${e(data.bg2)}" data-export-card="renaitvshow">
      <div class="renai-pattern"></div>
      <span class="renai-corner tl">✦</span><span class="renai-corner br">✦</span><span class="renai-tag">CHARACTER PROFILE</span>
      ${renaiSilhouette(data, "leftFullImage", "i.")}
      <div class="renai-center">
        ${renaiProfileCard(data, 0)}
        <div class="renai-relation">
          ${renaiAvatar(data, "cards.0.faceImage", "A")}
          <div><span>→</span><p>${e(data.relationA || "캐릭터 관계 서술")}</p><span>←</span><p>${e(data.relationB || "캐릭터 관계 서술")}</p></div>
          ${renaiAvatar(data, "cards.1.faceImage", "B")}
        </div>
        ${renaiProfileCard(data, 1)}
      </div>
      ${renaiSilhouette(data, "rightFullImage", "ii.")}
    </article>
  `;
}

function renaiProfileCard(data, index) {
  const card = data.cards?.[index] || {};
  const attrs = (card.attrs || []).map((row) => `<div class="renai-attr"><b>${e(row.label || "")}</b><p>${nl2br(row.value || "")}</p></div>`).join("");
  return `
    <section class="renai-card">
      <header><h2>${e(card.title || "ORIGINAL CHARACTER : NAME")}</h2><span></span><span></span><span></span></header>
      <div class="renai-card-body"><div class="renai-attrs">${attrs}</div><div class="renai-face">${renaiFace(data, index)}<div class="renai-colors"><i></i><i></i></div></div></div>
    </section>
  `;
}

function renaiFace(data, index) {
  const path = `cards.${index}.faceImage`;
  return getByPath(data, path)
    ? panSurface(data, path, "renai-face-img", "FACE", { scale: `cards.${index}.faceImageScale`, x: `cards.${index}.faceImagePanX`, y: `cards.${index}.faceImagePanY` })
    : `<span>얼굴 이미지</span>`;
}

function renaiSilhouette(data, srcPath, label) {
  const src = getByPath(data, srcPath);
  return `<aside class="renai-sil"><b>${label}</b>${src ? panSurface(data, srcPath, "renai-sil-img", "FULL", { scale: `${srcPath}Scale`, x: `${srcPath}PanX`, y: `${srcPath}PanY` }, { fit: "contain" }) : `<div><span>전신 PNG</span></div>`}</aside>`;
}

function renaiAvatar(data, srcPath, label) {
  return getByPath(data, srcPath)
    ? panSurface(data, srcPath, "renai-avatar", label, { scale: `${srcPath}Scale`, x: `${srcPath}PanX`, y: `${srcPath}PanY` })
    : `<div class="renai-avatar"><span>${e(label)}</span></div>`;
}

function renderLifeFourCut(data) {
  const theme = {
    white: ["#f8f9fa", "#ffffff", "#2b2b2b", "#f4f5f6"],
    midnight: ["#121212", "#1c1c1c", "#d4d4d4", "#242424"],
    rose: ["#fcf5f5", "#fff0f3", "#8c5a61", "#ffe9ec"],
    sage: ["#f3f5f2", "#e8ece6", "#4a5c48", "#dfe4dd"],
    lavender: ["#f6f5fc", "#ebe8fc", "#5c548a", "#e3dff5"],
  }[data.theme] || ["#f8f9fa", "#ffffff", "#2b2b2b", "#f4f5f6"];
  const imgs = (data.images || []).slice(0, 4);
  while (imgs.length < 4) imgs.push("");
  return `
    <article class="card-frame l4-stage" style="--l4-bg:${theme[0]};--l4-frame:${theme[1]};--l4-text:${theme[2]};--l4-slot:${theme[3]};--l4-font:'${e(data.font || "Cormorant Garamond")}', serif">
      <div class="l4-frame" data-export-card="lifefourcut">
        ${imgs.map((src) => `<div class="l4-slot">${src ? `<img src="${e(src)}" alt="">` : `<span>+</span>`}</div>`).join("")}
        <div class="l4-text">${e(data.title || "Cherished Memories")}</div>
      </div>
    </article>
  `;
}

function renderPhotoAlbum(data) {
  const count = Math.max(1, Math.min(9, Number(data.slotCount) || 6));
  const imgs = (data.images || []).slice(0, count);
  while (imgs.length < count) imgs.push("");
  return `
    <article class="card-frame album-card" style="--pa-t1:${e(data.theme1)};--pa-t2:${e(data.theme2)};--pa-bg:${e(data.bgColor)};--pa-paper:${e(data.paperColor)}" data-export-card="photoalbum">
      <div class="album-meta"><span>${e(data.page || "PAGE. 01")}</span><span>${e(data.date || "DATE. YYYY. MM. DD")}</span></div>
      <header><h1>${e(data.title || "Pair Title")}</h1><i></i><p><span>${e(data.nameA || "Character A")}</span><b>×</b><span>${e(data.nameB || "Character B")}</span></p></header>
      <blockquote>${e(data.quote || "")}</blockquote>
      <section class="album-grid">${imgs.map((src) => `<div class="album-slot"><div>${src ? `<img src="${e(src)}" alt="">` : `<span><b>+</b><small>photo</small></span>`}</div></div>`).join("")}</section>
      <footer>${e(data.credit || "@YOUR_NAME")}</footer>
    </article>
  `;
}

function renderNetflixScreenshot(data) {
  const y = data.letterbox ? "670px" : "760px";
  const subtitle = data.line1 && data.line2
    ? `<p style="bottom:92px">${e(data.line1)}</p><p style="bottom:52px">${e(data.line2)}</p>`
    : `<p style="bottom:${data.letterbox ? "52px" : "40px"}">${e(data.line1 || data.line2 || "")}</p>`;
  return `
    <article class="card-frame ns-card pan-frame ${data.vignette ? "has-vignette" : ""} ${data.letterbox ? "has-letterbox" : ""} ns-${e(data.subtitleStyle || "netflix")}" style="${panStyle(data, { scale: "imageScale", x: "imagePanX", y: "imagePanY" })};--ns-filter:${netflixFilter(data)};--ns-bright:${Number(data.brightness) || 1};--ns-sub-y:${y}" data-export-card="netflixscreenshot" data-bg-pan-surface data-pan-x-field="imagePanX" data-pan-y-field="imagePanY" data-pan-scale-field="imageScale">
      ${data.image ? `<img class="pan-img" src="${e(data.image)}" alt="" style="filter:var(--ns-filter)">` : `<div class="ns-empty">UPLOAD FRAME</div>`}
      ${data.blur ? `<div class="ns-blur">${data.image ? `<img class="pan-img" src="${e(data.image)}" alt="" style="filter:var(--ns-filter) blur(6px)">` : ""}</div>` : ""}
      <div class="ns-subs">${subtitle}</div>
    </article>
  `;
}

function renderMovieTicket(data) {
  const type = data.ticketType || "movie";
  const body = type === "boarding" ? renderBoardingPass(data) : type === "receipt" ? renderReceipt(data) : renderCinemaTicket(data);
  return `<article class="card-frame ticket-stage" style="--tk-c1:${e(data.color1)};--tk-c2:${e(data.color2)}">${body}</article>`;
}

function renderCinemaTicket(data) {
  return `
    <section class="tk-movie" data-export-card="movieticket">
      <div class="tk-movie-main"><div class="tk-movie-head">ADMIT ONE ✦ CINEMA</div>${ticketImage(data, "tk-movie-img")}<h1>${e(data.title || "MOVIE TITLE")}</h1><h2>${e(data.subtitle || "")}</h2><p>${e(data.cast || "")}</p>
      <div class="tk-info">${ticketInfo("DATE", data.date)}${ticketInfo("TIME", data.time)}${ticketInfo("SEAT", data.seat)}${ticketInfo("INFO", data.info)}</div></div>
      <footer><div>${barcodeBars(data.title || "MOVIE")}</div><span>${e(data.stubText || "THANK YOU FOR COMING")}</span></footer>
    </section>
  `;
}

function renderBoardingPass(data) {
  return `
    <section class="tk-boarding" data-export-card="movieticket">
      <main><header><b>${e(data.airline || "AIRLINE NAME")}</b><span>${e(data.classBadge || "FIRST CLASS")}</span></header><div class="tk-bp-body">${ticketImage(data, "tk-bp-img")}<div><div class="tk-route"><section><b>${e(data.fromCode || "ICN")}</b><span>${e(data.fromCity || "SEOUL")}</span></section><i>✈</i><section><b>${e(data.toCode || "JFK")}</b><span>${e(data.toCity || "NEW YORK")}</span></section></div><div class="tk-grid">${ticketInfo("PASSENGER", data.passenger, true)}${ticketInfo("FLIGHT", data.flight)}${ticketInfo("DATE", data.date)}${ticketInfo("TIME", data.time)}${ticketInfo("GATE", data.gate)}${ticketInfo("SEAT", data.seat)}${ticketInfo("REMARKS", data.info)}</div></div></div></main>
      <aside><small>BOARDING PASS</small><h2>${e(data.fromCode || "ICN")} <span>➔</span> ${e(data.toCode || "JFK")}</h2><div><small>SEAT</small><b>${e(data.seat || "01A")}</b></div>${barcodeBars(data.flight || "FL000")}</aside>
    </section>
  `;
}

function renderReceipt(data) {
  const rows = (data.items || []).map((item) => `<tr><td><b>${e(item.name || "ITEM")}</b><span>${e(item.qty || "1 x")}</span></td><td>${e(item.price || "0")}</td></tr>`).join("");
  return `
    <section class="tk-receipt" data-export-card="movieticket">
      <header><h1>${e(data.receiptStore || "STORE NAME")}</h1><small>RECEIPT OF TRANSACTION</small></header>
      <div class="tk-rc-meta">${idRow("Date:", data.date)}${idRow("Order:", data.order)}${idRow("Client:", data.client)}${idRow("Server:", data.server)}</div>
      ${ticketImage(data, "tk-rc-img")}
      <table><thead><tr><th>ITEM</th><th>PRICE</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="tk-total"><span>TOTAL</span><b>${e(data.total || "30,000")}</b></div>
      <footer>${barcodeBars(data.order || "#00142")}<span>${e(data.receiptMessage || "HAVE A NICE DAY")}</span></footer>
    </section>
  `;
}

function renderPoster(data) {
  const mode = data.mode || "book";
  const body = {
    book: renderPosterBook,
    magazine: renderPosterMagazine,
    movie: renderPosterMovie,
    device: renderPosterDevice,
  }[mode]?.(data) || renderPosterBook(data);
  const rootClass = data.textTheme === "dark" ? " theme-black" : "";
  return `
    <article class="card-frame poster-card capture-area${rootClass}" style="${posterRootStyle(data)}" data-export-card="poster">
      <div class="poster-noise${data.showNoise ? " visible" : ""}"></div>
      <div class="poster-tilt-wrap">${body}</div>
    </article>
  `;
}

function renderPosterBook(data) {
  const coverClass = posterCoverClass(data, "book-front");
  return `
    <div class="mockup-book">
      <div class="book-wrapper">
        <div class="book-spine" style="background-color:${e(data.spineColor || "#1a1a1a")}">
          <div class="spine-bg-layer cover-bg" style="${posterCoverBg(data, true)}"></div>
          <div class="spine-rib" style="top:30px;"></div>
          <div class="spine-rib" style="bottom:60px;"></div>
          <div class="spine-text text-drag center-x" style="top:50%;">${e(data.bookSpineTitle || "TITLE")}</div>
          <div class="spine-text text-drag center-x" style="font-size:7px; letter-spacing:1px; --base-rot:0deg; bottom:20px;">${e(data.bookSpinePublisher || "PUB")}</div>
        </div>
        <div class="book-pages"></div>
        <div class="${coverClass}">
          ${posterCoverLayer(data)}
          <div class="sheen-overlay"></div>
          <div class="deco-group${data.showText !== false ? " visible" : ""} book-deco-frame"></div>
          ${posterPlaceholder("📖")}
          <div class="${posterTextOverlayClass(data)}" style="${posterOverlayStyle(data)}">
            <div class="dyn-title sync-title text-drag" style="${posterTitleStyle(data, "font-family:'Nanum Myeongjo', serif;")}">${e(data.title || "BOOK TITLE")}</div>
            <div class="dyn-author sync-author text-drag">${e(data.author || "AUTHOR NAME")}</div>
          </div>
          <div class="deco-group${data.showText !== false ? " visible" : ""} text-drag center-x theme-target book-publisher-logo">${e(data.bookPublisher || "PUBLISHER")}</div>
          ${posterBarcode(data)}
        </div>
      </div>
    </div>
  `;
}

function renderPosterMagazine(data) {
  const coverClass = posterCoverClass(data, "magazine-front");
  return `
    <div class="mockup-magazine">
      <div class="${coverClass}">
        ${posterCoverLayer(data)}
        <div class="sheen-overlay"></div>
        <div class="deco-group${data.showText !== false ? " visible" : ""} mag-masthead text-drag center-x">${e(data.magazineMasthead || "MAGAZINE")}</div>
        <div class="deco-group${data.showText !== false ? " visible" : ""} mag-side-text text-drag">${e(data.magazineSideText || "ISSUE NO. 01 / SPRING 2026")}</div>
        <div class="deco-group${data.showText !== false ? " visible" : ""} mag-blurb mag-blurb-left text-drag">
          <div class="blurb-title">${e(data.magazineLeftTitle || "FEATURED")}</div>
          <div class="blurb-sub">${e(data.magazineLeftSub || "The Sound of Style")}</div>
        </div>
        <div class="deco-group${data.showText !== false ? " visible" : ""} mag-blurb mag-blurb-right text-drag" style="text-align:right;">
          <div class="blurb-title">${e(data.magazineRightTitle || "TRENDS")}</div>
          <div class="blurb-sub">${e(data.magazineRightSub || "Future of Fashion")}</div>
        </div>
        ${posterPlaceholder("📰")}
        <div class="${posterTextOverlayClass(data)}" style="padding-bottom:60px;${posterOverlayStyle(data)}">
          <div class="dyn-title sync-title text-drag" style="${posterTitleStyle(data)}">${e(data.title || "MAIN STORY")}</div>
          <div class="dyn-author sync-author text-drag" style="margin-top:6px; font-size:12px;">${e(data.author || "Read the exclusive interview")}</div>
        </div>
        <div class="deco-group${data.showText !== false ? " visible" : ""} mag-issue-info text-drag">${e(data.magazineIssue || "JUNE 2026 / ISSUE NO. 142")}</div>
        ${posterBarcode(data)}
      </div>
    </div>
  `;
}

function renderPosterMovie(data) {
  const coverClass = posterCoverClass(data, "movie-front");
  const creditsVisible = data.showText !== false && data.showCredits !== false;
  return `
    <div class="mockup-movie">
      <div class="${coverClass}">
        ${posterCoverLayer(data)}
        <div class="sheen-overlay"></div>
        <div class="deco-group${creditsVisible ? " visible" : ""} movie-laurel text-drag center-x">
          <svg viewBox="0 0 100 40" style="pointer-events:none; width:45px; height:18px; fill:currentColor;">
            <path d="M40,30 C20,30 10,15 15,10 C20,15 35,25 40,30 Z"></path>
            <path d="M60,30 C80,30 90,15 85,10 C80,15 65,25 60,30 Z"></path>
            <circle cx="50" cy="20" r="4"></circle>
          </svg>
          <span style="pointer-events:auto; display:block;">${nl2br(`${data.movieLaurel || "OFFICIAL SELECTION"}\n${data.movieFestival || "FESTIVAL FILM"}`)}</span>
        </div>
        ${posterPlaceholder("🎬")}
        <div class="${posterTextOverlayClass(data)}" style="${posterOverlayStyle(data)}">
          <div class="dyn-author sync-author text-drag">${e(data.author || "A FILM BY DIRECTOR")}</div>
          <div class="dyn-title sync-title text-drag" style="${posterTitleStyle(data, "font-family:'Oswald', sans-serif;")}">${e(data.title || "MOVIE TITLE")}</div>
        </div>
        <div class="deco-group${creditsVisible ? " visible" : ""} movie-credits-block text-drag center-x">
          <div class="mc-cast sync-author">${e(data.movieCast || "ACTOR A · ACTOR B · ACTOR C")}</div>
          <div class="mc-crew">${nl2br(data.movieCrew || "director of photography JOHN DOE edited by JANE SMITH production designer TOM LEE\nmusic by ALAN SMITHEE produced by MOVIE STUDIO")}</div>
        </div>
      </div>
    </div>
  `;
}

function renderPosterDevice(data) {
  const coverClass = posterCoverClass(data, "device-screen");
  const tags = (data.webTags || []).map((tag) => `<div class="wn-tag">${e(tag.text || "#태그")}</div>`).join("");
  return `
    <div class="mockup-device">
      <div class="device-frame">
        <div class="device-notch"></div>
        <div class="${coverClass}">
          ${posterCoverLayer(data)}
          <div class="deco-group${data.showText !== false ? " visible" : ""} app-ui-top">
            <div class="app-status-bar">
              <span class="text-drag">${e(data.webStatusLeft || "12:26")}</span>
              <span class="text-drag">${e(data.webStatusRight || "LTE 🔋")}</span>
            </div>
            <span class="text-drag app-back-btn">${e(data.webBack || "←")}</span>
          </div>
          <div class="sheen-overlay"></div>
          ${posterPlaceholder("📱")}
          <div class="${posterTextOverlayClass(data)}" style="${posterOverlayStyle(data)}">
            <div class="dyn-author sync-author text-drag" style="font-size:11px; margin-bottom:4px; opacity:0.9; letter-spacing:0.5px;">${e(data.author || "AUTHOR NAME")}</div>
            <div class="dyn-title sync-title text-drag" style="${posterTitleStyle(data, "font-size:28px; line-height:1.2;")}">${e(data.title || "NOVEL TITLE")}</div>
            <div class="deco-group${data.showText !== false ? " visible" : ""} wn-stats text-drag">
              <span style="color:#ffc107; font-size:11px;">${e(data.webRatingStars || "★★★★★")}</span>
              <span style="font-weight:800; font-size:11px; margin-left:2px; color:#ffc107;">${e(data.webRating || "4.9")}</span>
              <span style="color:rgba(255,255,255,0.8); font-size:9px; margin-left:6px; font-weight:600;">${e(data.webViews || "👁️ 1.2M")}</span>
            </div>
            <div class="deco-group${data.showText !== false ? " visible" : ""} wn-tags text-drag">${tags}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function posterCoverClass(data, baseClass) {
  return `${baseClass} draggable-cover${data.image ? " has-image" : ""}${data.showSheen !== false ? " has-sheen" : ""}`;
}

function posterCoverLayer(data) {
  const brightness = Math.max(0.3, (Number(data.brightness) || 100) / 100);
  return data.image
    ? panSurface(data, "image", "cover-bg", "", { scale: "imageScale", x: "imagePanX", y: "imagePanY" }, { filter: `brightness(${brightness})` })
    : `<div class="cover-bg"></div>`;
}

function posterCoverBg(data, spine = false) {
  const position = spine ? "left center" : `${Number(data.imageX) || 50}% ${Number(data.imageY) || 50}%`;
  const scale = Math.max(1, (Number(data.zoom) || 100) / 100);
  const brightness = Math.max(0.3, (Number(data.brightness) || 100) / 100);
  const bg = data.image ? `background-image:url('${String(data.image).replaceAll("'", "\\'")}');` : "";
  return `${bg}background-position:${position};transform:scale(${scale});filter:brightness(${brightness});`;
}

function posterRootStyle(data) {
  const textColor = data.textTheme === "dark" ? "#111111" : (data.textColor || "#ffffff");
  return [
    `background:${e(data.bgColor || "#e9e9eb")}`,
    `--poster-text-color:${e(textColor)}`,
    `--glow-color:${posterRgba(data.glowColor || "#000000", 0.4)}`,
    `--grad-color:${posterRgba(data.gradientColor || "#000000", 0.85)}`,
  ].join(";");
}

function posterTextOverlayClass(data) {
  return `cover-text-overlay${data.showText === false ? "" : " visible"}${data.showShadow === false ? "" : " has-shadow"}`;
}

function posterOverlayStyle(data) {
  return data.showGradient ? "background:linear-gradient(to top, var(--grad-color) 0%, transparent 70%);" : "";
}

function posterTitleStyle(data, base = "") {
  const styles = [base];
  if (data.fontFamily) styles.push(`font-family:'${e(data.fontFamily)}', sans-serif;`);
  if (data.titleSize) styles.push(`font-size:${Number(data.titleSize) || ""}px;`);
  return styles.filter(Boolean).join("");
}

function posterPlaceholder(icon) {
  return `<div class="cover-placeholder"><div class="ph-icon">${icon}</div><div class="ph-text">이미지를 업로드하세요</div></div>`;
}

function posterBarcode(data) {
  return `
    <div class="cover-barcode${data.showBarcode ? " visible" : ""}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" preserveAspectRatio="none">
        <rect width="60" height="30" fill="white"></rect>
        <g fill="black"><rect x="3" y="2" width="1" height="22"></rect><rect x="5" y="2" width="2" height="22"></rect><rect x="8" y="2" width="1" height="22"></rect><rect x="10" y="2" width="1" height="22"></rect><rect x="12" y="2" width="3" height="22"></rect><rect x="16" y="2" width="1" height="22"></rect><rect x="18" y="2" width="2" height="22"></rect><rect x="22" y="2" width="1" height="22"></rect><rect x="24" y="2" width="1" height="22"></rect><rect x="26" y="2" width="3" height="22"></rect><rect x="30" y="2" width="1" height="22"></rect><rect x="32" y="2" width="2" height="22"></rect><rect x="35" y="2" width="1" height="22"></rect><rect x="37" y="2" width="1" height="22"></rect><rect x="39" y="2" width="2" height="22"></rect><rect x="42" y="2" width="1" height="22"></rect><rect x="44" y="2" width="3" height="22"></rect><rect x="48" y="2" width="1" height="22"></rect><rect x="50" y="2" width="2" height="22"></rect><rect x="53" y="2" width="1" height="22"></rect><rect x="55" y="2" width="2" height="22"></rect></g>
      </svg>
    </div>
  `;
}

function renderLineStamp(data) {
  const state = normalizeLineStampState(data);
  const json = JSON.stringify(state).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e");
  const hasGuide = !state.backgroundImage && !state.layers.length;
  return `
    <article class="card-frame linestamp-card" data-linestamp-card>
      <canvas class="linestamp-canvas" width="600" height="600" data-export-card="linestamp"></canvas>
      <div class="linestamp-guide"${hasGuide ? "" : " hidden"}>
        <div class="linestamp-guide-icon">T</div>
        <div class="linestamp-guide-text">텍스트를 추가하거나 배경 이미지를 넣어주세요</div>
      </div>
      <script type="application/json" data-linestamp-state>${json}</script>
      <script>${lineStampHydratorScript()}</script>
    </article>
  `;
}

function normalizeLineStampState(data) {
  const number = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const defaultLayer = {
    id: 1,
    text: "텍스트 입력",
    font: "'Noto Sans KR',sans-serif",
    fontSize: 60,
    letterSpacing: 0,
    x: 300,
    y: 300,
    color: "#111827",
    strokeColor: "#ffffff",
    strokeWidth: 6,
    shadowColor: "#000000",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    opacity: 1,
    rotate: 0,
    outlineStyle: "line",
    style: "normal",
    useGrad: false,
    g1: "#4f46e5",
    g2: "#ec4899",
    gradDir: 0,
  };
  const layers = Array.isArray(data.layers) ? data.layers : [];
  const normalizedLayers = layers.map((layer, index) => ({
    ...defaultLayer,
    ...layer,
    id: number(layer.id, index + 1),
    fontSize: number(layer.fontSize, 60),
    letterSpacing: number(layer.letterSpacing, 0),
    x: number(layer.x, 300),
    y: number(layer.y, 300),
    strokeWidth: number(layer.strokeWidth, 6),
    shadowBlur: number(layer.shadowBlur, 0),
    shadowOffsetX: number(layer.shadowOffsetX, 0),
    shadowOffsetY: number(layer.shadowOffsetY, 0),
    opacity: Math.max(0, Math.min(1, number(layer.opacity, 1))),
    rotate: number(layer.rotate, 0),
    gradDir: number(layer.gradDir, 0),
  }));
  return {
    backgroundImage: data.backgroundImage || "",
    bgColor: data.bgColor || "transparent",
    bgScale: Math.max(10, Math.min(300, number(data.bgScale, 100))),
    bgPanX: data.bgPanX === "" ? "" : number(data.bgPanX, ""),
    bgPanY: data.bgPanY === "" ? "" : number(data.bgPanY, ""),
    bgLocked: data.bgLocked === true,
    selectedLayerId: data.selectedLayerId ?? normalizedLayers.at(-1)?.id ?? null,
    nextLayerId: Math.max(number(data.nextLayerId, normalizedLayers.length + 1), normalizedLayers.length + 1),
    layers: normalizedLayers,
  };
}

function lineStampHydratorScript() {
  return `(${installLineStampHydrator.toString()})();window.CardStudioLineStampHydrate(document.currentScript.closest("[data-linestamp-card]"));`;
}

function installLineStampHydrator() {
  if (window.CardStudioLineStampHydrate) return;

  const SIZE = 600;

  function hydrate(root) {
    const cards = root?.matches?.("[data-linestamp-card]")
      ? [root]
      : Array.from((root || document).querySelectorAll?.("[data-linestamp-card]") || []);
    cards.forEach(hydrateOne);
  }

  function hydrateOne(card) {
    const canvas = card.querySelector(".linestamp-canvas");
    const stateScript = card.querySelector("[data-linestamp-state]");
    if (!canvas || !stateScript) return;

    let state;
    try {
      state = normalizeState(JSON.parse(stateScript.textContent || "{}"));
    } catch {
      state = normalizeState({});
    }

    const api = createApi(card, canvas, state);
    card._lineStampApi = api;
    api.ready.then(() => api.draw(true));
  }

  function normalizeState(data) {
    const number = (value, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const layers = Array.isArray(data.layers) ? data.layers : [];
    return {
      backgroundImage: data.backgroundImage || "",
      bgColor: data.bgColor || "transparent",
      bgScale: Math.max(10, Math.min(300, number(data.bgScale, 100))),
      bgPanX: data.bgPanX === "" ? "" : number(data.bgPanX, ""),
      bgPanY: data.bgPanY === "" ? "" : number(data.bgPanY, ""),
      bgLocked: data.bgLocked === true,
      selectedLayerId: data.selectedLayerId ?? layers.at(-1)?.id ?? null,
      layers: layers.map((layer, index) => ({
        id: number(layer.id, index + 1),
        text: String(layer.text || ""),
        font: layer.font || "'Noto Sans KR',sans-serif",
        fontSize: number(layer.fontSize, 60),
        letterSpacing: number(layer.letterSpacing, 0),
        x: number(layer.x, SIZE / 2),
        y: number(layer.y, SIZE / 2),
        color: layer.color || "#111827",
        strokeColor: layer.strokeColor || "#ffffff",
        strokeWidth: number(layer.strokeWidth, 6),
        shadowColor: layer.shadowColor || "#000000",
        shadowBlur: number(layer.shadowBlur, 0),
        shadowOffsetX: number(layer.shadowOffsetX, 0),
        shadowOffsetY: number(layer.shadowOffsetY, 0),
        opacity: Math.max(0, Math.min(1, number(layer.opacity, 1))),
        rotate: number(layer.rotate, 0),
        outlineStyle: layer.outlineStyle || "line",
        style: layer.style || "normal",
        useGrad: layer.useGrad === true,
        g1: layer.g1 || "#4f46e5",
        g2: layer.g2 || "#ec4899",
        gradDir: number(layer.gradDir, 0),
      })),
    };
  }

  function createApi(card, canvas, state) {
    const ctx = canvas.getContext("2d");
    let bgImage = null;
    let dragging = false;
    let draggingBg = false;
    let resizing = false;
    let rotating = false;
    let dox = 0;
    let doy = 0;
    let bgDox = 0;
    let bgDoy = 0;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let resizeStartFontSize = 0;
    let rotateStartAngle = 0;
    let rotateStartRot = 0;

    const ready = Promise.all([
      loadImage(state.backgroundImage).then((img) => { bgImage = img; }),
      document.fonts?.ready || Promise.resolve(),
    ]).then(() => {
      initBgPan();
      bind();
      updateGuide();
    });

    function bind() {
      if (canvas._lineStampBound) return;
      canvas._lineStampBound = true;
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    function initBgPan() {
      if (!bgImage) return;
      const scale = getBgScale();
      if (!Number.isFinite(Number(state.bgPanX))) {
        state.bgPanX = (SIZE - bgImage.width * scale) / 2;
      }
      if (!Number.isFinite(Number(state.bgPanY))) {
        state.bgPanY = (SIZE - bgImage.height * scale) / 2;
      }
    }

    function getBgScale() {
      if (!bgImage) return 1;
      const baseScale = Math.max(SIZE / bgImage.width, SIZE / bgImage.height);
      return baseScale * (Number(state.bgScale) || 100) / 100;
    }

    function draw(includeSelection = true, targetCtx = ctx) {
      targetCtx.clearRect(0, 0, SIZE, SIZE);
      if (state.bgColor !== "transparent") {
        targetCtx.fillStyle = state.bgColor;
        targetCtx.fillRect(0, 0, SIZE, SIZE);
      }
      if (bgImage) {
        const scale = getBgScale();
        targetCtx.save();
        targetCtx.drawImage(bgImage, Number(state.bgPanX) || 0, Number(state.bgPanY) || 0, bgImage.width * scale, bgImage.height * scale);
        targetCtx.restore();
      }
      state.layers.forEach((layer) => drawLayer(layer, targetCtx));
      if (includeSelection) {
        const selected = getSelectedLayer();
        if (selected) drawSelection(selected, targetCtx);
      }
      updateGuide();
    }

    function drawLayer(layer, targetCtx) {
      targetCtx.save();
      targetCtx.globalAlpha = layer.opacity;
      targetCtx.translate(layer.x, layer.y);
      targetCtx.rotate(layer.rotate * Math.PI / 180);
      targetCtx.font = makeFont(layer);
      targetCtx.textAlign = "center";
      targetCtx.textBaseline = "middle";
      if ("letterSpacing" in targetCtx) targetCtx.letterSpacing = `${layer.letterSpacing}px`;

      if (layer.outlineStyle === "double") {
        targetCtx.shadowBlur = 0;
        targetCtx.shadowColor = "transparent";
        targetCtx.strokeStyle = layer.color;
        targetCtx.lineWidth = layer.strokeWidth + 12;
        targetCtx.lineJoin = "round";
        targetCtx.strokeText(layer.text, 0, 0);
      }

      if (layer.outlineStyle !== "none" && layer.outlineStyle !== "glow" && layer.strokeWidth > 0) {
        targetCtx.shadowBlur = 0;
        targetCtx.shadowColor = "transparent";
        targetCtx.strokeStyle = layer.strokeColor;
        targetCtx.lineWidth = layer.strokeWidth;
        targetCtx.lineJoin = "round";
        targetCtx.strokeText(layer.text, 0, 0);
      }

      if (layer.shadowBlur > 0 || layer.shadowOffsetX !== 0 || layer.shadowOffsetY !== 0) {
        targetCtx.shadowColor = layer.shadowColor;
        targetCtx.shadowBlur = layer.shadowBlur;
        targetCtx.shadowOffsetX = layer.shadowOffsetX;
        targetCtx.shadowOffsetY = layer.shadowOffsetY;
      } else {
        targetCtx.shadowBlur = 0;
        targetCtx.shadowColor = "transparent";
        targetCtx.shadowOffsetX = 0;
        targetCtx.shadowOffsetY = 0;
      }

      let fillStyle = layer.color;
      if (layer.useGrad && layer.text.trim() !== "") {
        const measured = targetCtx.measureText(layer.text);
        const width = measured.width || 100;
        const height = layer.fontSize;
        const rad = ((layer.gradDir || 0) * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const radius = (Math.abs(cos) * width + Math.abs(sin) * height) / 2;
        const gradient = targetCtx.createLinearGradient(-cos * radius, -sin * radius, cos * radius, sin * radius);
        gradient.addColorStop(0, layer.g1);
        gradient.addColorStop(1, layer.g2);
        fillStyle = gradient;
      }

      if (layer.outlineStyle === "glow") {
        const savedShadow = {
          color: targetCtx.shadowColor,
          blur: targetCtx.shadowBlur,
          offX: targetCtx.shadowOffsetX,
          offY: targetCtx.shadowOffsetY,
        };
        for (let glow = 3; glow >= 0; glow -= 1) {
          targetCtx.shadowColor = layer.strokeColor;
          targetCtx.shadowBlur = 8 + glow * 10;
          targetCtx.shadowOffsetX = 0;
          targetCtx.shadowOffsetY = 0;
          targetCtx.fillStyle = fillStyle;
          targetCtx.fillText(layer.text, 0, 0);
        }
        targetCtx.shadowColor = savedShadow.color;
        targetCtx.shadowBlur = savedShadow.blur;
        targetCtx.shadowOffsetX = savedShadow.offX;
        targetCtx.shadowOffsetY = savedShadow.offY;
      }

      targetCtx.fillStyle = fillStyle;
      targetCtx.fillText(layer.text, 0, 0);
      targetCtx.restore();
    }

    function makeFont(layer) {
      const weight = layer.style === "bold" ? "700" : "400";
      const italic = layer.style === "italic" ? "italic " : "";
      return `${italic}${weight} ${layer.fontSize}px ${layer.font}`;
    }

    function getSelectionHandles(layer) {
      ctx.save();
      ctx.font = makeFont(layer);
      if ("letterSpacing" in ctx) ctx.letterSpacing = `${layer.letterSpacing}px`;
      const width = ctx.measureText(layer.text).width;
      ctx.restore();
      const hw = width / 2 + 20;
      const hh = layer.fontSize / 2 + 16;
      return {
        hw,
        hh,
        corners: [
          { id: "tl", lx: -hw, ly: -hh },
          { id: "tr", lx: hw, ly: -hh },
          { id: "bl", lx: -hw, ly: hh },
          { id: "br", lx: hw, ly: hh },
        ],
        rotate: { id: "rot", lx: 0, ly: -hh - 28 },
      };
    }

    function localToWorld(layer, lx, ly) {
      const rad = layer.rotate * Math.PI / 180;
      return {
        x: layer.x + lx * Math.cos(rad) - ly * Math.sin(rad),
        y: layer.y + lx * Math.sin(rad) + ly * Math.cos(rad),
      };
    }

    function drawSelection(layer, targetCtx) {
      const { hw, hh, corners, rotate } = getSelectionHandles(layer);
      targetCtx.save();
      targetCtx.translate(layer.x, layer.y);
      targetCtx.rotate(layer.rotate * Math.PI / 180);
      targetCtx.strokeStyle = "rgba(79,70,229,0.85)";
      targetCtx.lineWidth = 1.5;
      targetCtx.setLineDash([6, 4]);
      targetCtx.strokeRect(-hw, -hh, hw * 2, hh * 2);
      targetCtx.setLineDash([]);
      targetCtx.beginPath();
      targetCtx.moveTo(0, -hh);
      targetCtx.lineTo(0, -hh - 28);
      targetCtx.strokeStyle = "rgba(79,70,229,0.6)";
      targetCtx.stroke();
      targetCtx.restore();

      corners.forEach((corner) => {
        const point = localToWorld(layer, corner.lx, corner.ly);
        targetCtx.save();
        targetCtx.translate(point.x, point.y);
        targetCtx.rotate(layer.rotate * Math.PI / 180);
        targetCtx.fillStyle = "#ffffff";
        targetCtx.strokeStyle = "rgba(79,70,229,0.9)";
        targetCtx.lineWidth = 1.5;
        targetCtx.beginPath();
        targetCtx.rect(-6, -6, 12, 12);
        targetCtx.fill();
        targetCtx.stroke();
        targetCtx.restore();
      });

      const point = localToWorld(layer, rotate.lx, rotate.ly);
      targetCtx.beginPath();
      targetCtx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      targetCtx.fillStyle = "rgba(79,70,229,0.9)";
      targetCtx.fill();
      targetCtx.strokeStyle = "#ffffff";
      targetCtx.lineWidth = 2;
      targetCtx.stroke();
      targetCtx.save();
      targetCtx.translate(point.x, point.y);
      targetCtx.strokeStyle = "#ffffff";
      targetCtx.lineWidth = 1.5;
      targetCtx.beginPath();
      targetCtx.arc(0, 0, 4, -Math.PI * 0.8, Math.PI * 0.8);
      targetCtx.stroke();
      targetCtx.restore();
    }

    function getCoords(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (SIZE / rect.width),
        y: (event.clientY - rect.top) * (SIZE / rect.height),
      };
    }

    function hitTest(x, y) {
      for (let index = state.layers.length - 1; index >= 0; index -= 1) {
        const layer = state.layers[index];
        ctx.font = makeFont(layer);
        if ("letterSpacing" in ctx) ctx.letterSpacing = `${layer.letterSpacing}px`;
        const width = ctx.measureText(layer.text).width;
        const hw = width / 2 + 20;
        const hh = layer.fontSize / 2 + 20;
        const dx = x - layer.x;
        const dy = y - layer.y;
        const rad = -layer.rotate * Math.PI / 180;
        const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
        if (Math.abs(rx) < hw && Math.abs(ry) < hh) return layer;
      }
      return null;
    }

    function hitHandle(x, y) {
      const layer = getSelectedLayer();
      if (!layer) return null;
      const handles = getSelectionHandles(layer);
      const rotatePoint = localToWorld(layer, handles.rotate.lx, handles.rotate.ly);
      if (Math.hypot(x - rotatePoint.x, y - rotatePoint.y) < 16) return "rot";
      for (const corner of handles.corners) {
        const point = localToWorld(layer, corner.lx, corner.ly);
        if (Math.hypot(x - point.x, y - point.y) < 14) return corner.id;
      }
      return null;
    }

    function onPointerDown(event) {
      const { x, y } = getCoords(event);
      canvas.setPointerCapture?.(event.pointerId);

      if (event.button === 2) {
        const layer = getSelectedLayer() || hitTest(x, y);
        if (layer) {
          state.selectedLayerId = layer.id;
          rotating = true;
          rotateStartAngle = Math.atan2(y - layer.y, x - layer.x);
          rotateStartRot = layer.rotate;
          canvas.style.cursor = "crosshair";
          draw(true);
          emitUpdate();
        }
        return;
      }

      const handle = hitHandle(x, y);
      if (handle) {
        const layer = getSelectedLayer();
        if (handle === "rot") {
          rotating = true;
          rotateStartAngle = Math.atan2(y - layer.y, x - layer.x);
          rotateStartRot = layer.rotate;
          canvas.style.cursor = "crosshair";
        } else {
          resizing = true;
          resizeStartX = x;
          resizeStartY = y;
          resizeStartFontSize = layer.fontSize;
          canvas.style.cursor = "nwse-resize";
        }
        return;
      }

      const layer = hitTest(x, y);
      if (layer) {
        state.selectedLayerId = layer.id;
        if (event.shiftKey) {
          resizing = true;
          resizeStartX = x;
          resizeStartY = y;
          resizeStartFontSize = layer.fontSize;
          canvas.style.cursor = "nwse-resize";
        } else {
          dragging = true;
          dox = x - layer.x;
          doy = y - layer.y;
          canvas.style.cursor = "grabbing";
        }
        draw(true);
        emitUpdate();
      } else if (bgImage && !state.bgLocked) {
        draggingBg = true;
        bgDox = x - (Number(state.bgPanX) || 0);
        bgDoy = y - (Number(state.bgPanY) || 0);
        state.selectedLayerId = null;
        canvas.style.cursor = "grabbing";
        draw(true);
        emitUpdate();
      } else {
        state.selectedLayerId = null;
        draw(true);
        emitUpdate();
      }
    }

    function onPointerMove(event) {
      const { x, y } = getCoords(event);
      const layer = getSelectedLayer();
      if (rotating && layer) {
        const angle = Math.atan2(y - layer.y, x - layer.x);
        const delta = (angle - rotateStartAngle) * 180 / Math.PI;
        layer.rotate = Math.round(rotateStartRot + delta);
        draw(true);
        return;
      }
      if (resizing && layer) {
        const dist = Math.hypot(x - layer.x, y - layer.y);
        const startDist = Math.hypot(resizeStartX - layer.x, resizeStartY - layer.y);
        layer.fontSize = Math.max(10, Math.round(resizeStartFontSize * dist / (startDist || 1)));
        draw(true);
        return;
      }
      if (dragging && layer) {
        layer.x = x - dox;
        layer.y = y - doy;
        draw(true);
        return;
      }
      if (draggingBg) {
        state.bgPanX = x - bgDox;
        state.bgPanY = y - bgDoy;
        draw(true);
        return;
      }

      const handle = hitHandle(x, y);
      if (handle === "rot") canvas.style.cursor = "crosshair";
      else if (handle) canvas.style.cursor = "nwse-resize";
      else canvas.style.cursor = hitTest(x, y) ? "grab" : (bgImage && !state.bgLocked ? "move" : "default");
    }

    function onPointerUp(event) {
      dragging = false;
      draggingBg = false;
      resizing = false;
      rotating = false;
      canvas.style.cursor = "default";
      canvas.releasePointerCapture?.(event.pointerId);
      emitUpdate();
    }

    function getSelectedLayer() {
      return state.layers.find((layer) => String(layer.id) === String(state.selectedLayerId)) || null;
    }

    function updateGuide() {
      const guide = card.querySelector(".linestamp-guide");
      if (guide) guide.hidden = Boolean(bgImage || state.layers.length);
    }

    function exportState() {
      return {
        backgroundImage: state.backgroundImage,
        bgColor: state.bgColor,
        bgScale: state.bgScale,
        bgPanX: state.bgPanX,
        bgPanY: state.bgPanY,
        bgLocked: state.bgLocked,
        selectedLayerId: state.selectedLayerId,
        layers: state.layers.map((layer) => ({ ...layer })),
      };
    }

    function emitUpdate() {
      card.dispatchEvent(new CustomEvent("linestamp:update", {
        bubbles: true,
        detail: exportState(),
      }));
    }

    async function download(filename) {
      await ready;
      const out = document.createElement("canvas");
      out.width = SIZE;
      out.height = SIZE;
      draw(false, out.getContext("2d"));
      const link = document.createElement("a");
      link.download = filename || `linestamp-${Date.now()}.png`;
      link.href = out.toDataURL("image/png", 1.0);
      document.body.append(link);
      link.click();
      link.remove();
    }

    return { ready, draw, download };
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function exportActive(filename) {
    const card = document.querySelector("[data-linestamp-card]");
    if (!card?._lineStampApi) return false;
    await card._lineStampApi.download(filename);
    return true;
  }

  window.CardStudioLineStampHydrate = hydrate;
  window.CardStudioLineStampExport = exportActive;
}

function posterRgba(hex, alpha) {
  const match = String(hex || "").match(/^#?([0-9a-f]{6})$/i);
  if (!match) return `rgba(0,0,0,${alpha})`;
  const value = match[1];
  const rgb = [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function renderRpgMaker(data) {
  const state = normalizeRpgMakerState(data);
  const size = ({ "4:3": [816, 624], "16:9": [1024, 576], "1:1": [720, 720] })[state.ratio] || [816, 624];
  const json = JSON.stringify(state).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e");
  return `
    <article class="card-frame rpgmaker-card" data-export-card="rpgmaker" data-rpgmaker-card>
      <canvas class="rpgmaker-canvas" width="${size[0]}" height="${size[1]}" data-bg-pan-surface data-pan-x-field="panX" data-pan-y-field="panY" data-pan-scale-field="bgScale" data-pan-live-render="rpgmaker"></canvas>
      <div class="rpgmaker-empty">
        <div class="big">사진을 넣어줘</div>
        <div>왼쪽에서 배경 이미지를 올리면<br>바로 픽셀풍 + 메시지 창이 합성돼</div>
      </div>
      <script type="application/json" data-rpgmaker-state>${json}</script>
      <script>${rpgMakerHydratorScript()}</script>
    </article>
  `;
}

function normalizeRpgMakerState(data) {
  const number = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    bgImage: data.bgImage || "",
    bgScale: normalizeRpgMakerScale(number(data.bgScale, 100)),
    panX: number(data.panX, 0),
    panY: number(data.panY, 0),
    pixelSize: number(data.pixelSize, 6),
    levels: number(data.levels, 8),
    dither: data.dither !== false,
    scanline: data.scanline !== false,
    vignette: data.vignette !== false,
    dialogue: String(data.dialogue || ""),
    speaker: String(data.speaker || ""),
    nameColor: data.nameColor || "#ffcb47",
    theme: data.theme || "classic",
    boxOpacity: number(data.boxOpacity, 86),
    faceImage: data.faceImage || "",
    faceSide: data.faceSide === "right" ? "right" : "left",
    font: data.font || "Galmuri11",
    fontSize: number(data.fontSize, 26),
    ratio: data.ratio || "4:3",
    showArrow: data.showArrow !== false,
    choices: String(data.choices || ""),
  };
}

function rpgMakerHydratorScript() {
  return `(${installRpgMakerHydrator.toString()})();window.CardStudioRpgMakerHydrate(document.currentScript.closest("[data-rpgmaker-card]"));`;
}

function hydrateCard(root = document) {
  installRpgMakerHydrator();
  installLineStampHydrator();
  window.CardStudioRpgMakerHydrate(root);
  window.CardStudioLineStampHydrate(root);
}

function installRpgMakerHydrator() {
  if (window.CardStudioRpgMakerHydrate) return;

  const THEMES = {
    classic: { fill: ["#1b3a8f", "#0c1c4d"], border: "#cfe0ff", inner: "#7fa8ff", text: "#ffffff", nameBox: "#10204f" },
    dark: { fill: ["#10131c", "#05070d"], border: "#3a4360", inner: "#6b7798", text: "#e8ecf7", nameBox: "#0a0d15" },
    parchment: { fill: ["#e8d6a8", "#caa86a"], border: "#5a3d1c", inner: "#a07a3c", text: "#3a2a12", nameBox: "#b89a5c" },
    rose: { fill: ["#7a2046", "#3d0f24"], border: "#ffd0e0", inner: "#ff7fb0", text: "#fff0f5", nameBox: "#4d1430" },
    mono: { fill: ["#202020", "#000000"], border: "#ffffff", inner: "#888888", text: "#ffffff", nameBox: "#111111" },
    galge: { fill: ["#fff2f8", "#ffd9ea"], border: "#ff8fc0", inner: "#ffb3d4", text: "#5a2742", nameBox: "#ff9ec8" },
    sky: { fill: ["#e3f3ff", "#bfe2ff"], border: "#5aa8e6", inner: "#9cd0f2", text: "#163a59", nameBox: "#a9d8f7" },
    neon: { fill: ["#1a0036", "#06010f"], border: "#ff2bd6", inner: "#22e0ff", text: "#eafcff", nameBox: "#2a0552" },
    gameboy: { fill: ["#306230", "#0f380f"], border: "#9bbc0f", inner: "#8bac0f", text: "#cfe89b", nameBox: "#0f380f" },
    royal: { fill: ["#3a1f6b", "#190b38"], border: "#ffd86b", inner: "#b89cff", text: "#fff4d6", nameBox: "#26145a" },
    horror: { fill: ["#1a0606", "#000000"], border: "#c41d1d", inner: "#5a1414", text: "#f0d2d2", nameBox: "#160404" },
    mint: { fill: ["#e9fff6", "#c4f4e2"], border: "#3fc79a", inner: "#8fe3c5", text: "#0f4435", nameBox: "#aaf0d8" },
  };
  const RATIOS = { "4:3": [816, 624], "16:9": [1024, 576], "1:1": [720, 720] };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const FONTS = {
    Galmuri11: "https://cdn.jsdelivr.net/npm/galmuri/dist/Galmuri11.woff2",
    Galmuri14: "https://cdn.jsdelivr.net/npm/galmuri/dist/Galmuri14.woff2",
    DungGeunMo: "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/DungGeunMo.woff",
    NeoDunggeunmo: "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2206-01@1.0/NeoDunggeunmoPro-Regular.woff2",
  };
  const loadedFonts = new Set(["monospace"]);

  function hydrate(root) {
    const cards = root?.matches?.("[data-rpgmaker-card]")
      ? [root]
      : Array.from((root || document).querySelectorAll?.("[data-rpgmaker-card]") || []);
    cards.forEach(hydrateOne);
  }

  function hydrateOne(card) {
    const canvas = card.querySelector(".rpgmaker-canvas");
    const stateScript = card.querySelector("[data-rpgmaker-state]");
    if (!canvas || !stateScript) return;
    let state;
    try {
      state = JSON.parse(stateScript.textContent || "{}");
    } catch {
      state = {};
    }
    state = normalizeState(state);
    const token = {};
    card._rpgmakerToken = token;
    ensureFont(state.font).then(() => {
      Promise.all([loadImage(state.bgImage), loadImage(state.faceImage)]).then(([bgImg, faceImg]) => {
        if (card._rpgmakerToken !== token) return;
        draw(card, canvas, state, bgImg, faceImg);
      });
    });
  }

  function normalizeState(data) {
    const num = (value, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const opacity = num(data.boxOpacity, 86);
    return {
      bgImage: data.bgImage || "",
      bgScale: Math.max(1, Math.min(4, num(data.bgScale, 1) > 10 ? num(data.bgScale, 100) / 100 : num(data.bgScale, 1))),
      panX: num(data.panX, 0),
      panY: num(data.panY, 0),
      pixelSize: Math.max(1, num(data.pixelSize, 6) | 0),
      levels: Math.max(2, num(data.levels, 8) | 0),
      dither: data.dither !== false,
      scanline: data.scanline !== false,
      vignette: data.vignette !== false,
      dialogue: String(data.dialogue || ""),
      speaker: String(data.speaker || ""),
      nameColor: data.nameColor || "#ffcb47",
      theme: THEMES[data.theme] ? data.theme : "classic",
      boxOpacity: opacity > 1 ? opacity / 100 : opacity,
      faceImage: data.faceImage || "",
      faceSide: data.faceSide === "right" ? "right" : "left",
      font: data.font || "Galmuri11",
      fontSize: Math.max(16, Math.min(48, num(data.fontSize, 26) | 0)),
      ratio: RATIOS[data.ratio] ? data.ratio : "4:3",
      showArrow: data.showArrow !== false,
      choices: String(data.choices || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 4),
    };
  }

  function ensureFont(font) {
    if (!font || font === "monospace" || loadedFonts.has(font) || !FONTS[font] || !window.FontFace) {
      return Promise.resolve();
    }
    const ff = new FontFace(font, "url(" + FONTS[font] + ")");
    return ff.load().then((face) => {
      document.fonts.add(face);
      loadedFonts.add(font);
    }).catch(() => {});
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function cssFont(state, px) {
    const fam = loadedFonts.has(state.font) ? state.font : (loadedFonts.has("Galmuri11") ? "Galmuri11" : "monospace");
    return px + "px '" + fam + "', monospace";
  }

  function coverRect(img, tw, th) {
    const ir = img.width / img.height;
    const tr = tw / th;
    let sw, sh, sx, sy;
    if (ir > tr) {
      sh = img.height;
      sw = sh * tr;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / tr;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    return [sx, sy, sw, sh];
  }

  function viewRect(img, tw, th, scale, panX, panY) {
    const base = coverRect(img, tw, th);
    const cw = base[2] / scale;
    const ch = base[3] / scale;
    let cx = base[0] + (base[2] - cw) / 2 + panX;
    let cy = base[1] + (base[3] - ch) / 2 + panY;
    cx = Math.max(0, Math.min(img.width - cw, cx));
    cy = Math.max(0, Math.min(img.height - ch, cy));
    return [cx, cy, cw, ch];
  }

  function pixelate(img, tw, th, opts) {
    const px = Math.max(1, opts.pixelSize | 0);
    const sw = Math.max(1, Math.round(tw / px));
    const sh = Math.max(1, Math.round(th / px));
    const small = document.createElement("canvas");
    small.width = sw;
    small.height = sh;
    const sc = small.getContext("2d");
    const crop = opts.crop || coverRect(img, tw, th);
    sc.imageSmoothingEnabled = true;
    sc.drawImage(img, crop[0], crop[1], crop[2], crop[3], 0, 0, sw, sh);
    const levels = Math.max(2, opts.levels | 0);
    const id = sc.getImageData(0, 0, sw, sh);
    const d = id.data;
    const step = 255 / (levels - 1);
    for (let y = 0; y < sh; y += 1) {
      for (let x = 0; x < sw; x += 1) {
        const i = (y * sw + x) * 4;
        const dith = opts.dither ? (BAYER[y & 3][x & 3] / 16 - 0.5) * step : 0;
        for (let c = 0; c < 3; c += 1) {
          let v = d[i + c] + dith;
          v = Math.round(v / step) * step;
          d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
      }
    }
    sc.putImageData(id, 0, 0);
    const out = document.createElement("canvas");
    out.width = tw;
    out.height = th;
    const oc = out.getContext("2d");
    oc.imageSmoothingEnabled = false;
    oc.drawImage(small, 0, 0, sw, sh, 0, 0, tw, th);
    return out;
  }

  function wrapLines(ctx, state, text, maxW, fontPx) {
    ctx.font = cssFont(state, fontPx);
    const out = [];
    String(text || "").split("\n").forEach((paragraph) => {
      if (paragraph === "") {
        out.push("");
        return;
      }
      let line = "";
      Array.from(paragraph).forEach((ch) => {
        const test = line + ch;
        if (ctx.measureText(test).width > maxW && line !== "") {
          out.push(line);
          line = ch;
        } else {
          line = test;
        }
      });
      out.push(line);
    });
    return out;
  }

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function draw(card, canvas, state, bgImg, faceImg) {
    const ctx = canvas.getContext("2d");
    const size = RATIOS[state.ratio];
    const W = size[0];
    const H = size[1];
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    const empty = card.querySelector(".rpgmaker-empty");
    if (!bgImg) {
      ctx.clearRect(0, 0, W, H);
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    const bgCache = pixelate(bgImg, W, H, {
      pixelSize: state.pixelSize,
      levels: state.levels,
      dither: state.dither,
      crop: viewRect(bgImg, W, H, state.bgScale, state.panX, state.panY),
    });
    ctx.drawImage(bgCache, 0, 0);

    if (state.vignette) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    const th = THEMES[state.theme];
    const m = Math.round(W * 0.035);
    const boxH = Math.round(H * 0.30);
    const bx = m;
    const by = H - boxH - m;
    const bw = W - m * 2;
    const bh = boxH;
    const rad = Math.round(W * 0.018);

    ctx.globalAlpha = state.boxOpacity;
    const grad = ctx.createLinearGradient(0, by, 0, by + bh);
    grad.addColorStop(0, th.fill[0]);
    grad.addColorStop(1, th.fill[1]);
    rr(ctx, bx, by, bw, bh, rad);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.lineWidth = Math.max(3, Math.round(W * 0.006));
    ctx.strokeStyle = th.border;
    rr(ctx, bx, by, bw, bh, rad);
    ctx.stroke();
    ctx.lineWidth = Math.max(1, Math.round(W * 0.0022));
    ctx.strokeStyle = th.inner;
    const pad2 = Math.round(W * 0.012);
    rr(ctx, bx + pad2, by + pad2, bw - pad2 * 2, bh - pad2 * 2, Math.max(2, rad - pad2));
    ctx.stroke();

    let textX = bx + Math.round(W * 0.035);
    let textW = bw - Math.round(W * 0.07);
    let faceCache = null;
    if (faceImg) {
      faceCache = pixelate(faceImg, 256, 256, {
        pixelSize: Math.max(2, Math.round(state.pixelSize * 0.7)),
        levels: state.levels,
        dither: state.dither,
      });
      const fs = Math.round(bh * 0.74);
      const fy = by + (bh - fs) / 2;
      const fx = state.faceSide === "left" ? bx + Math.round(W * 0.025) : bx + bw - fs - Math.round(W * 0.025);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      rr(ctx, fx - 4, fy - 4, fs + 8, fs + 8, 8);
      ctx.fill();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(faceCache, fx, fy, fs, fs);
      ctx.lineWidth = 2;
      ctx.strokeStyle = th.inner;
      rr(ctx, fx, fy, fs, fs, 6);
      ctx.stroke();
      if (state.faceSide === "left") {
        textX = fx + fs + Math.round(W * 0.03);
        textW = bx + bw - textX - Math.round(W * 0.035);
      } else {
        textX = bx + Math.round(W * 0.035);
        textW = fx - textX - Math.round(W * 0.03);
      }
    }

    if (state.speaker.trim()) {
      ctx.font = cssFont(state, Math.round(state.fontSize * 0.9));
      const nm = state.speaker.trim();
      const nw = ctx.measureText(nm).width + Math.round(W * 0.04);
      const nh = Math.round(state.fontSize * 1.5);
      const nx = bx + Math.round(W * 0.025);
      const ny = by - nh * 0.55;
      ctx.globalAlpha = state.boxOpacity;
      rr(ctx, nx, ny, nw, nh, 8);
      ctx.fillStyle = th.nameBox;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.strokeStyle = th.border;
      rr(ctx, nx, ny, nw, nh, 8);
      ctx.stroke();
      ctx.fillStyle = state.nameColor;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(nm, nx + Math.round(W * 0.02), ny + nh / 2 + 1);
    }

    const fs = state.fontSize;
    const lines = wrapLines(ctx, state, state.dialogue, textW, fs);
    const lineH = Math.round(fs * 1.4);
    let ty = by + Math.round(bh * 0.16) + (state.speaker.trim() ? Math.round(fs * 0.2) : 0);
    if (faceCache) ty = by + Math.round(bh * 0.16);
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.font = cssFont(state, fs);
    lines.forEach((line, index) => {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(line, textX + 2, ty + index * lineH + 2);
      ctx.fillStyle = th.text;
      ctx.fillText(line, textX, ty + index * lineH);
    });

    if (state.choices.length) {
      const cfs = Math.round(fs * 0.92);
      ctx.font = cssFont(state, cfs);
      let maxw = 0;
      state.choices.forEach((choice) => {
        maxw = Math.max(maxw, ctx.measureText(choice).width);
      });
      const cw = maxw + Math.round(W * 0.08);
      const chh = Math.round(cfs * 1.7);
      const ch = state.choices.length * chh + Math.round(W * 0.02);
      const cxp = bx + bw - cw - Math.round(W * 0.03);
      const cyp = by - ch - Math.round(H * 0.02);
      ctx.globalAlpha = state.boxOpacity;
      rr(ctx, cxp, cyp, cw, ch, 10);
      ctx.fillStyle = th.fill[1];
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = Math.max(2, Math.round(W * 0.004));
      ctx.strokeStyle = th.border;
      rr(ctx, cxp, cyp, cw, ch, 10);
      ctx.stroke();
      ctx.textBaseline = "middle";
      state.choices.forEach((choice, index) => {
        const yy = cyp + Math.round(W * 0.01) + chh * index + chh / 2;
        if (index === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          rr(ctx, cxp + 6, cyp + Math.round(W * 0.01) + chh * index + 4, cw - 12, chh - 8, 6);
          ctx.fill();
          ctx.fillStyle = th.border;
          ctx.fillText("▶", cxp + Math.round(W * 0.018), yy);
        }
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillText(choice, cxp + Math.round(W * 0.05) + 2, yy + 1);
        ctx.fillStyle = th.text;
        ctx.fillText(choice, cxp + Math.round(W * 0.05), yy);
      });
    } else if (state.showArrow) {
      ctx.fillStyle = th.border;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = cssFont(state, Math.round(fs * 0.9));
      ctx.fillText("▼", bx + bw - Math.round(W * 0.05), by + bh - Math.round(bh * 0.14));
    }

    if (state.scanline) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#000";
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      ctx.globalAlpha = 1;
    }
  }

  window.CardStudioRpgMakerHydrate = hydrate;
}

function renderInternetBoard(data) {
  const controls = data.showPreviewControls !== false;
  const comments = Array.isArray(data.comments) ? data.comments : [];
  const tagText = formatInternetBoardTag(data);
  const commentHtml = comments.map((comment) => `
    <div class="chat-bubble">
      <div class="chat-header">
        <span class="chat-name">익명톡</span>
        ${controls ? `<div class="chat-actions"><button class="chat-action-btn" type="button">수정</button><button class="chat-action-btn" type="button">삭제</button></div>` : ""}
      </div>
      <div class="chat-text">${nl2br(comment.text || "")}</div>
    </div>
  `).join("");
  const commentsBox = comments.length || controls ? `
    <div class="comments-box${comments.length ? "" : " empty"}">
      ${commentHtml}
      ${controls ? `
        <div class="comment-input-wrap">
          <input type="text" class="msg-input" placeholder="따뜻한 댓글을 남겨주세요." readonly>
          <button class="btn-send" type="button" aria-label="댓글 보내기"><i class="ri-send-plane-2-fill"></i></button>
        </div>
      ` : ""}
    </div>
  ` : "";
  return `
    <article class="card-frame ab-post-card post-card${data.darkMode ? " dark-mode" : ""}" data-export-card="internetboard">
      <div class="post-header">
        <div class="post-header-left">
          <div class="avatar-box">${e(data.avatarText || "익")}</div>
          <div class="post-user-info">
            <div class="name-time-row">
              <h4 class="post-author">${e(data.author || "익명사용자")}</h4>
              <p class="post-date">${e(data.date || "방금 전")}</p>
            </div>
            <span class="post-tag-badge">${e(tagText)}</span>
          </div>
        </div>
        ${controls ? `<div class="post-actions"><button class="post-action-btn edit" type="button">수정</button><button class="post-action-btn delete" type="button">삭제</button></div>` : ""}
      </div>
      <div class="post-content">
        <h3>${e(data.title || "제목을 입력하세요")}</h3>
        <div class="post-text">${nl2br(data.content || "")}</div>
      </div>
      ${data.image ? `<img src="${e(data.image)}" class="post-image" alt="">` : ""}
      <div class="stats-row">
        ${anonStat(anonEyeIcon(), data.views)}
        ${anonStat(anonHeartIcon(), data.likes)}
        ${anonStat(anonBookmarkIcon(), data.bookmarks)}
      </div>
      ${controls ? `
        <div class="btn-group">
          ${anonAction("ri-heart-3-line", "좋아요")}
          ${anonAction("ri-bookmark-line", "북마크")}
          ${anonAction("ri-share-forward-line", "공유")}
        </div>
      ` : ""}
      ${commentsBox}
    </article>
  `;
}

function formatInternetBoardTag(data) {
  const legacy = String(data.tag || "").trim();
  const emoji = String(data.tagEmoji || "").trim() || legacy.split(/\s+/)[0] || "☕";
  const name = String(data.tagName || "").trim() || legacy.replace(emoji, "").trim() || "일상";
  return `${emoji} ${name}`.trim();
}

function anonStat(icon, value) {
  return `<span>${icon}${e(value || "0")}</span>`;
}

function anonAction(icon, label) {
  return `<button class="icon-btn" type="button"><i class="${icon}"></i>${e(label)}</button>`;
}

function anonEyeIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3c5.392 0 9.878 3.88 10.819 9-.94 5.12-5.427 9-10.819 9-5.392 0-9.878-3.88-10.819-9C2.121 6.88 6.608 3 12 3zm0 16a9.005 9.005 0 0 0 8.777-7 9.005 9.005 0 0 0-17.554 0A9.005 9.005 0 0 0 12 19zm0-2a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>`;
}

function anonHeartIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="#ff5252"><path d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228z"/></svg>`;
}

function anonBookmarkIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="#ffb300"><path d="M5 2h14a1 1 0 0 1 1 1v19.143a.5.5 0 0 1-.766.424L12 18.03l-7.234 4.536A.5.5 0 0 1 4 22.143V3a1 1 0 0 1 1-1z"/></svg>`;
}

function ticketImage(data, className) {
  return data.image
    ? panSurface(data, "image", `${className} tk-img`, "Photo", { scale: "imageScale", x: "imagePanX", y: "imagePanY" })
    : `<div class="${className} tk-img"><span>+<small>Photo</small></span></div>`;
}

function normalizeRpgMakerScale(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 1;
  return scale > 10 ? scale / 100 : scale;
}

function ticketInfo(label, value, full = false) {
  return `<div class="${full ? "full" : ""}"><small>${e(label)}</small><b>${e(value || "")}</b></div>`;
}

function barcodeBars(value) {
  const seed = String(value || "0000").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `<svg class="mini-barcode" viewBox="0 0 120 20" preserveAspectRatio="none" aria-hidden="true">${Array.from({ length: 45 }, (_, index) => {
    const width = ((seed + index * 7) % 3) + 1;
    const x = index * 2.7;
    return index % 2 ? "" : `<rect x="${x}" y="1" width="${width}" height="14"></rect>`;
  }).join("")}<text x="60" y="19" text-anchor="middle">${e(value)}</text></svg>`;
}

function toyGradient(value, color1, color2) {
  if (value === "radial") return `radial-gradient(circle, ${e(color1)}, ${e(color2)})`;
  const direction = value === "vertical" ? "180deg" : value === "horizontal" ? "90deg" : "135deg";
  return `linear-gradient(${direction}, ${e(color1)}, ${e(color2)})`;
}

function netflixFilter(data) {
  const brightness = `brightness(${Number(data.brightness) || 1})`;
  const lut = {
    none: "",
    tealOrange: "contrast(1.1) saturate(1.1) sepia(0.1) hue-rotate(-5deg)",
    warm: "sepia(0.2) brightness(0.95) contrast(1.05)",
    cold: "contrast(1.05) saturate(0.9) hue-rotate(170deg) sepia(0.1)",
    bw: "grayscale(1) contrast(1.1) brightness(0.9)",
  }[data.lut] || "";
  return `${brightness} ${lut}`;
}

function shade(hex, amount) {
  const value = String(hex || "#000000").replace("#", "");
  const rgb = [0, 2, 4].map((start) => Math.max(0, Math.min(255, parseInt(value.slice(start, start + 2), 16) + amount)));
  return `#${rgb.map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

window.CardStudioRenderers = {
  renderCard,
  hydrateCard,
};
})();
