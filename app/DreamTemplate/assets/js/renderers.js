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
          <b>${e(data.posts)}</b><span>게시물</span>
          <b>${e(data.followers)}</b><span>팔로워</span>
          <b>${e(data.following)}</b><span>팔로잉</span>
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
  const messages = (data.messages || []).map((message) => {
    const images = (message.images || []).filter(Boolean);
    const imageMarkup = images.length
      ? images.map((src) => `<div class="msg-photo"><img src="${e(src)}" alt=""></div>`).join("")
      : `<div class="msg-photo placeholder"><span>PHOTO</span></div>`;
    return `
      <div class="msg-item">
        <div class="msg-photos">${imageMarkup}</div>
        ${message.showComment ? `<div class="msg-comment">${nl2br(message.text || "")}</div>` : ""}
      </div>
    `;
  }).join("");
  return `
    <article class="card-frame messenger-card" style="--msg-point:${e(data.pointColor)}" data-export-card="messenger">
      <header class="msg-header"><h1>${e(data.headerTitle || "New Message")}</h1><a>${e(data.cancelText || "Cancel")}</a></header>
      <section class="msg-to"><span>To:</span><b>${e(data.recipient || "recipient")}</b><i>＋</i></section>
      <section class="msg-history">${messages}</section>
      <footer class="msg-input"><span class="msg-plus">＋</span><p><span>${e(data.inputPlaceholder || "Add comment or Send")}</span><b>↑</b></p></footer>
    </article>
  `;
}

window.CardStudioRenderers = {
  renderCard,
};
})();
