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
    <div class="ig-topbar">
      <strong>${e(data.username || "username")}</strong>
      <span>•••</span>
    </div>
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
  return `
    <div class="ig-post-head">
      <div class="${data.hasStoryRing ? "story-ring tiny" : ""}">${avatar(data.avatar, "ig-post-avatar")}</div>
      <div><b>${e(data.username || "username")}</b><span>${e(data.location || "")}</span></div>
      <strong>•••</strong>
    </div>
    ${mediaBox(data.postImage, "ig-post-image", "POST IMAGE")}
    <div class="ig-actions"><span>♡</span><span>💬</span><span>↗</span><span>▢</span></div>
    <div class="ig-caption">
      <b>좋아요 ${e(data.likes || "0")}개</b>
      <p><strong>${e(data.username || "username")}</strong> ${nl2br(data.caption || "")}</p>
      <small>${e(data.postTime || "방금 전")}</small>
    </div>
  `;
}

function renderInstagramStory(data) {
  const tagStyle = `left:${Number(data.storyTagX) || 38}%;top:${Number(data.storyTagY) || 44}%`;
  return `
    <div class="ig-story">
      ${mediaBox(data.storyImage, "ig-story-bg", "STORY")}
      <div class="ig-story-shade"></div>
      <div class="ig-story-progress"><span></span><span></span><span></span></div>
      <div class="ig-story-head">
        <div class="${data.hasStoryRing ? "story-ring tiny" : ""}">${avatar(data.avatar, "ig-post-avatar")}</div>
        <b>${e(data.username || "username")}</b>
        <small>${e(data.storyTime || "")}</small>
      </div>
      ${data.storyTagVisible ? `<div class="ig-story-tag" style="${tagStyle}">${e(data.storyTag || "@tag")}</div>` : ""}
      <div class="ig-story-reply"><span>메시지 보내기</span><b>♡</b><b>↗</b></div>
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
    <div class="ig-dm-head"><span>‹</span><b>${e(data.username || "username")}</b><span>ⓘ</span></div>
    <div class="ig-dm-body">
      <div class="ig-dm-date">${e(data.dmDate || "오늘")}</div>
      ${messages}
    </div>
    <div class="ig-dm-footer"><span>${e(data.dmInput || "메시지 입력...")}</span><b>◎</b></div>
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
        <div class="yt-logo"><span>▶</span> ViewTube</div>
        <div class="yt-search">${e(data.searchQuery || "검색어")}</div>
        ${avatar(data.channelAvatar, "yt-user-avatar")}
      </header>
      <main class="yt-layout">
        <section class="yt-primary">
          <div class="yt-player">
            ${mediaBox(data.mainImage, "yt-player-image", "VIDEO")}
            <span>${e(data.time || "00:00")}</span>
          </div>
          <h1>${e(data.title || "영상 제목")}</h1>
          <div class="yt-video-meta">${e(data.views || "")} · ${e(data.date || "")}</div>
          <div class="yt-channel-row">
            ${avatar(data.channelAvatar, "yt-channel-avatar")}
            <div><b>${e(data.channelName || "채널 이름")}</b><small>${e(data.subscribers || "")}</small></div>
            <button>구독</button>
            <div class="yt-actions"><span>👍 ${e(data.likes || "0")}</span><span>공유</span><span>저장</span></div>
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
  const categories = parseCategoryLines(data.categories).map((item) => `<span>${e(item.label)}</span>`).join("");
  const infoRows = (data.infoRows || []).map((row) => `<li><b>${e(row.label)}</b><span>${nl2br(row.value)}</span></li>`).join("");
  const sections = (data.sections || []).map((section, index) => `
    <section class="wiki-section">
      <h2><span>${index + 1}</span>${e(section.title || "문단")}</h2>
      <p>${nl2br(section.body || "")}</p>
    </section>
  `).join("");
  return `
    <article class="card-frame wiki-card" style="--wiki-color:${e(data.themeColor)};--wiki-title:${e(data.titleTextColor)}" data-export-card="wiki">
      <header class="wiki-titlebar">
        <div><b>${e(data.title || "문서 제목")}</b><small>최근 수정: ${e(data.editTime || "")}</small></div>
        <span>WIKI</span>
      </header>
      <div class="wiki-categories">${categories}</div>
      ${data.showSpoiler ? `<div class="wiki-spoiler">${e(data.spoilerText || "스포일러 경고")}</div>` : ""}
      <div class="wiki-layout">
        <aside class="wiki-infobox">
          <h1>${e(data.profileTitle || "이름")}</h1>
          <p>${e(data.profileSubtitle || "")}</p>
          ${mediaBox(data.profileImage, "wiki-profile-img", "PROFILE")}
          <h3>${e(data.extraTitle || "기본 정보")}</h3>
          <p>${nl2br(data.extraText || "")}</p>
          <ul>${infoRows}</ul>
        </aside>
        <div class="wiki-content">${sections}</div>
      </div>
    </article>
  `;
}

function renderNetflix(data) {
  const hero = mediaBox(data.heroImage, "flix-hero-img", "POSTER");
  const homeThumbs = (data.thumbs || []).map((src) => mediaBox(src, "flix-thumb", "TITLE")).join("");
  const episodes = (data.episodes || []).map((episode, index) => `
    <div class="flix-episode">
      <b>${index + 1}</b>
      ${mediaBox(episode.thumb, "flix-ep-thumb", "EP")}
      <div><strong>${e(episode.title || "에피소드")}</strong><span>${e(episode.duration || "")}</span><p>${nl2br(episode.desc || "")}</p></div>
    </div>
  `).join("");
  const mode = data.mode || "detail";
  const homeHero = `
    <section class="flix-hero">
      ${hero}
      <div class="flix-gradient"></div>
      <div class="flix-hero-content">
        <h1>${e(data.title || "작품 제목")}</h1>
        <div class="flix-tags">${e(data.tags || "")}</div>
        <div class="flix-buttons"><button>▶ 재생</button><button>＋ 내가 찜한 콘텐츠</button></div>
        <em>${e(data.imageSource || "")}</em>
      </div>
    </section>
  `;
  const detailHero = `
    <section class="flix-hero">
      ${hero}
      <div class="flix-gradient"></div>
      <div class="flix-hero-content">
        <small>${e(data.subtitle || "ORIGINAL SERIES")}</small>
        <h1>${e(data.title || "작품 제목")}</h1>
        <div class="flix-meta"><b>${e(data.match || "")}</b><span>${e(data.year || "")}</span><span>${e(data.age || "")}</span><span>${e(data.quality || "")}</span></div>
        <p>${nl2br(data.description || "")}</p>
        <div class="flix-buttons"><button>▶ 재생</button><button>＋ 내가 찜한 콘텐츠</button></div>
        <em>${e(data.imageSource || "")}</em>
      </div>
    </section>
  `;
  return `
    <article class="card-frame flix-card mode-${e(mode)}" data-export-card="netflix">
      <nav class="flix-nav"><b>N</b><span>시리즈</span><span>영화</span><span>내가 찜한 콘텐츠</span></nav>
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
  return `
    <article class="card-frame music-card" style="--music-bg:${e(data.bgColor)};--music-point:${e(data.pointColor)};--music-text:${e(data.textColor)}" data-export-card="musicplayer">
      ${mediaBox(data.coverImage, "music-cover", "COVER")}
      <div class="music-source">${e(data.copyright || "ⓒ source")}</div>
      <div class="music-info"><h1>${e(data.title || "노래 제목")}</h1><p>${e(data.artist || "가수 이름")}</p></div>
      <div class="music-slider"><span style="width:${progress}%"></span><b style="left:${progress}%"></b></div>
      <div class="music-controls"><span>⏮</span><button>▶</button><span>⏭</span></div>
      <div class="music-volume"><span>🔈</span><div class="music-slider small"><span style="width:${volume}%"></span><b style="left:${volume}%"></b></div><span>🔊</span></div>
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
        <div class="pair-dot"></div>
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
      <footer class="msg-input"><span>＋</span><p>${e(data.inputPlaceholder || "Add comment or Send")}</p><b>↑</b></footer>
    </article>
  `;
}

window.CardStudioRenderers = {
  renderCard,
};
})();
