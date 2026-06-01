(() => {
const { backgroundStyle, escapeHtml, nl2br, parseCategoryLines, parseKeywords } = window.CardStudioUtils;

const e = escapeHtml;

function renderCard(styleId, data) {
  const renderers = {
    instagram: renderInstagram,
    youtube: renderYoutube,
    wiki: renderWiki,
    netflix: renderNetflix,
    musicplayer: renderMusicPlayer,
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
  };
  return renderers[styleId]?.(data) || "";
}

function mediaBox(src, className, label, extra = "") {
  const style = backgroundStyle(src);
  return `<div class="${className} media-box" style="${style}" ${extra}>${src ? "" : `<span>${e(label)}</span>`}</div>`;
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
  const highlights = (data.highlights || [])
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
      <p><strong>${e(data.username || "username")}</strong> ${nl2br(data.caption || "")}</p>
      <small>${e(data.postTime || "방금 전")}</small>
    </div>
  `;
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
  const hero = mediaBox(data.heroImage, "flix-hero-img", "POSTER");
  const homeThumbs = (data.thumbs || []).map((src) => mediaBox(src, "flix-thumb", "TITLE")).join("");
  const episodes = (data.episodes || []).map((episode, index) => `
    <div class="flix-episode">
      <div class="flix-ep-top">
        <div class="flix-ep-thumb-wrap">
          ${mediaBox(episode.thumb, "flix-ep-thumb", "EP")}
          <span class="flix-ep-play">▶</span>
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
        <div class="flix-buttons"><button>▶ 재생</button><button>＋ 내가 찜한 콘텐츠</button></div>
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
        <div class="flix-buttons"><button>▶ 재생</button><button>＋ 내가 찜한 콘텐츠</button></div>
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
      ${mediaBox(data.coverImage, "music-cover", "COVER")}
      <div class="music-source">${e(data.copyright || "ⓒ source")}</div>
      <div class="music-info"><h1>${e(data.title || "노래 제목")}</h1><p>${e(data.artist || "가수 이름")}</p></div>
      <div class="music-slider"><span style="width:${progress}%"></span><b style="left:${progress}%"></b></div>
      <div class="music-controls"><button>${previous}</button><button class="music-play">${play}</button><button>${next}</button></div>
      <div class="music-volume"><span>${volumeLow}</span><div class="music-slider small"><span style="width:${volume}%"></span><b style="left:${volume}%"></b></div><span>${volumeHigh}</span></div>
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
        ${mediaBox(data.mainImage, "tl-photo", "MAIN IMAGE")}
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
        ${mediaBox(data.bannerImage, "pair-banner", "BANNER")}
      </header>
      <section class="pair-body">
        ${renderPerson(data.personA, "a")}
        <div class="pair-timeline">
          <h2>${e(data.timelineTitle || "PAIR TIMELINE")}</h2>
          ${entries}
        </div>
        ${renderPerson(data.personB, "b")}
      </section>
    </article>
  `;
}

function renderPerson(person, side) {
  const keywords = parseKeywords(person?.keywords).map((word) => `<span>${e(word)}</span>`).join("");
  return `
    <aside class="pair-person person-${side}">
      ${mediaBox(person?.image, "pair-photo", "PROFILE")}
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
  const imageX = (Number(data.imageX) || 50) - 50;
  const imageY = (Number(data.imageY) || 50) - 50;
  const zoom = (Number(data.imageZoom) || 100) / 100;
  const grad = `linear-gradient(to top, rgba(${tone},${tone},${tone},${alpha.toFixed(2)}) 0%, rgba(${tone},${tone},${tone},${(alpha * 0.6).toFixed(2)}) ${Math.round(height * 0.45)}%, rgba(${tone},${tone},${tone},0) ${height}%)`;
  const font = data.nameFont === "Playfair Display" ? "'Playfair Display', serif" : "'Nunito', sans-serif";
  return `
    <article class="card-frame cp-card" style="--acc:${e(data.accentColor)};--ctxt:${e(data.textColor)};--cbg:${e(data.bgColor)}" data-export-card="catchphrase">
      ${data.image ? `<img class="cp-img" src="${e(data.image)}" alt="" style="transform:translate(${imageX * 8}px, ${imageY * 6}px) scale(${zoom})">` : ""}
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
  const zoom = (Number(data.imageZoom) || 100) / 100;
  const tx = Number(data.imageX) || 0;
  const ty = Number(data.imageY) || 0;
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
              ${data.image ? `<img src="${e(data.image)}" alt="" style="transform:translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${zoom})">` : `<div class="tama-trigger">TAP TO<br>HATCH!</div>`}
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
      ${renderIdPhoto(data.photo)}
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
      ${renderIdPhoto(data.photo)}
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
      ${renderIdPhoto(data.photo)}
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
      ${renderIdPhoto(data.photo)}
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
      ${renderIdPhoto(data.photo)}
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

function renderIdPhoto(src) {
  return `<div class="idc-photo">${src ? `<img src="${e(src)}" alt="">` : `<div class="idc-np"><i></i><b></b></div>`}</div>`;
}

function idRow(label, value) {
  return `<div class="idc-row"><span>${e(label)}</span><b>${e(value || "")}</b></div>`;
}

function renderToypack(data) {
  const imageX = Number(data.imageX) || 0;
  const imageY = Number(data.imageY) || 0;
  const imageZoom = (Number(data.imageZoom) || 100) / 100;
  return `
    <article class="card-frame toy-card" style="--toy-c1:${e(data.color1)};--toy-c2:${e(data.color2)};--toy-ac:${e(data.accentColor)};--toy-bg:${toyGradient(data.gradient, data.color1, data.color2)};--toy-img-x:${imageX}px;--toy-img-y:${imageY}px;--toy-img-z:${imageZoom}" data-export-card="toypack">
      <div class="toy-hole"></div>
      <div class="toy-cut"><span>✂</span></div>
      ${data.series ? `<div class="toy-series">${e(String(data.series).toUpperCase())}</div>` : ""}
      <div class="toy-pixels" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <section class="toy-inner">
        <div class="toy-code">${barcodeBars("NO.01")}</div>
        <div class="toy-image">
          ${data.image ? `<img src="${e(data.image)}" alt="">` : `<span></span>`}
        </div>
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
    <article class="card-frame pl-card" style="--pl-acc:${e(data.accentColor)};--pl-bg:${bg[0]};--pl-bg2:${bg[1]};--pl-card:${bg[2]}" data-export-card="playlist">
      <header class="pl-top">
        <div class="pl-logo-area">
          <span class="pl-logo-label">playlist</span>
          <div class="pl-title-row"><span>${e(data.name || "My Playlist")}</span></div>
        </div>
      </header>
      <div class="pl-cover ${data.coverImage ? "has-img" : ""}" style="${backgroundStyle(data.coverImage)}">${data.coverImage ? "" : `<div class="pl-cover-placeholder"><div>${lineIcon('<path d="M12 21s-7-4.5-9.5-9C.5 8 2.5 3 7 3c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4.5 0 6.5 5 4.5 9-2.5 4.5-9.5 9-9.5 9z"/>')}</div><h3>사진 넣기</h3><p>클릭하여 업로드</p></div>`}</div>
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
      ${renaiSilhouette(data.leftFullImage, "i.")}
      <div class="renai-center">
        ${renaiProfileCard(cardA)}
        <div class="renai-relation">
          ${renaiAvatar(cardA.faceImage, "A")}
          <div><span>→</span><p>${e(data.relationA || "캐릭터 관계 서술")}</p><span>←</span><p>${e(data.relationB || "캐릭터 관계 서술")}</p></div>
          ${renaiAvatar(cardB.faceImage, "B")}
        </div>
        ${renaiProfileCard(cardB)}
      </div>
      ${renaiSilhouette(data.rightFullImage, "ii.")}
    </article>
  `;
}

function renaiProfileCard(card) {
  const attrs = (card.attrs || []).map((row) => `<div class="renai-attr"><b>${e(row.label || "")}</b><p>${nl2br(row.value || "")}</p></div>`).join("");
  return `
    <section class="renai-card">
      <header><h2>${e(card.title || "ORIGINAL CHARACTER : NAME")}</h2><span></span><span></span><span></span></header>
      <div class="renai-card-body"><div class="renai-attrs">${attrs}</div><div class="renai-face">${card.faceImage ? `<img src="${e(card.faceImage)}" alt="">` : `<span>얼굴 이미지</span>`}<div class="renai-colors"><i></i><i></i></div></div></div>
    </section>
  `;
}

function renaiSilhouette(src, label) {
  return `<aside class="renai-sil"><b>${label}</b><div>${src ? `<img src="${e(src)}" alt="">` : `<span>전신 PNG</span>`}</div></aside>`;
}

function renaiAvatar(src, label) {
  return `<div class="renai-avatar">${src ? `<img src="${e(src)}" alt="">` : `<span>${e(label)}</span>`}</div>`;
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
    <article class="card-frame ns-card ${data.vignette ? "has-vignette" : ""} ${data.letterbox ? "has-letterbox" : ""} ns-${e(data.subtitleStyle || "netflix")}" style="--ns-filter:${netflixFilter(data)};--ns-x:${e(data.imageX)}%;--ns-y:${e(data.imageY)}%;--ns-z:${(Number(data.imageZoom) || 100) / 100};--ns-bright:${Number(data.brightness) || 1};--ns-sub-y:${y}" data-export-card="netflixscreenshot">
      ${data.image ? `<img src="${e(data.image)}" alt="">` : `<div class="ns-empty">UPLOAD FRAME</div>`}
      ${data.blur ? `<div class="ns-blur">${data.image ? `<img src="${e(data.image)}" alt="">` : ""}</div>` : ""}
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
      <div class="tk-movie-main"><div class="tk-movie-head">ADMIT ONE ✦ CINEMA</div>${ticketImage(data.image, "tk-movie-img")}<h1>${e(data.title || "MOVIE TITLE")}</h1><h2>${e(data.subtitle || "")}</h2><p>${e(data.cast || "")}</p>
      <div class="tk-info">${ticketInfo("DATE", data.date)}${ticketInfo("TIME", data.time)}${ticketInfo("SEAT", data.seat)}${ticketInfo("INFO", data.info)}</div></div>
      <footer><div>${barcodeBars(data.title || "MOVIE")}</div><span>${e(data.stubText || "THANK YOU FOR COMING")}</span></footer>
    </section>
  `;
}

function renderBoardingPass(data) {
  return `
    <section class="tk-boarding" data-export-card="movieticket">
      <main><header><b>${e(data.airline || "AIRLINE NAME")}</b><span>${e(data.classBadge || "FIRST CLASS")}</span></header><div class="tk-bp-body">${ticketImage(data.image, "tk-bp-img")}<div><div class="tk-route"><section><b>${e(data.fromCode || "ICN")}</b><span>${e(data.fromCity || "SEOUL")}</span></section><i>✈</i><section><b>${e(data.toCode || "JFK")}</b><span>${e(data.toCity || "NEW YORK")}</span></section></div><div class="tk-grid">${ticketInfo("PASSENGER", data.passenger, true)}${ticketInfo("FLIGHT", data.flight)}${ticketInfo("DATE", data.date)}${ticketInfo("TIME", data.time)}${ticketInfo("GATE", data.gate)}${ticketInfo("SEAT", data.seat)}${ticketInfo("REMARKS", data.info)}</div></div></div></main>
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
      ${ticketImage(data.image, "tk-rc-img")}
      <table><thead><tr><th>ITEM</th><th>PRICE</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="tk-total"><span>TOTAL</span><b>${e(data.total || "30,000")}</b></div>
      <footer>${barcodeBars(data.order || "#00142")}<span>${e(data.receiptMessage || "HAVE A NICE DAY")}</span></footer>
    </section>
  `;
}

function renderInternetBoard(data) {
  const controls = data.showPreviewControls !== false;
  const comments = Array.isArray(data.comments) ? data.comments : [];
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
            <span class="post-tag-badge">${e(data.tag || "☕ 일상")}</span>
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
          ${anonAction("ri-share-forward-line", "공유")}
          ${anonAction("ri-screenshot-2-line", "캡처")}
          ${anonAction("ri-file-copy-line", "복사")}
        </div>
      ` : ""}
      ${commentsBox}
    </article>
  `;
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

function ticketImage(src, className) {
  return `<div class="${className} tk-img">${src ? `<img src="${e(src)}" alt="">` : `<span>+<small>Photo</small></span>`}</div>`;
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
};
})();
