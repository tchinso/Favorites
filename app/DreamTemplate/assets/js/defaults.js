(() => {
const APP_VERSION = "2026.06.01";
const STORAGE_KEY = "unified-card-studio-v1";

const BASE_STYLE_CONFIGS = [
  {
    id: "instagram",
    label: "Instagram",
    accent: "#0095f6",
    canExportImage: true,
    canExportHtml: true,
    description: "프로필, 게시물, 스토리, DM 형태를 한 스타일 안에서 전환합니다.",
  },
  {
    id: "youtube",
    label: "YouTube",
    accent: "#ff0033",
    canExportImage: true,
    canExportHtml: true,
    description: "영상 페이지, 고정 댓글, 댓글 목록, 추천 영상을 구성합니다.",
  },
  {
    id: "wiki",
    label: "Wiki",
    accent: "#008275",
    canExportImage: true,
    canExportHtml: true,
    description: "위키 문서형 카드와 프로필 정보, 본문 섹션을 만듭니다.",
  },
  {
    id: "netflix",
    label: "Netflix",
    accent: "#e50914",
    canExportImage: true,
    canExportHtml: true,
    description: "메인 포스터, 상세 페이지, 에피소드 목록을 전환합니다.",
  },
  {
    id: "musicplayer",
    label: "Music",
    accent: "#555555",
    canExportImage: true,
    canExportHtml: true,
    description: "앨범 커버와 플레이어 UI가 있는 음악 카드입니다.",
  },
  {
    id: "timeline",
    label: "Timeline",
    accent: "#c23b46",
    canExportImage: true,
    canExportHtml: true,
    description: "1인 프로필과 연혁을 보드 형태로 배치합니다.",
  },
  {
    id: "couple",
    label: "Pair Line",
    accent: "#222222",
    canExportImage: true,
    canExportHtml: true,
    description: "2인 프로필, 공통 배너, 관계 타임라인을 구성합니다.",
  },
  {
    id: "messenger",
    label: "Messenger",
    accent: "#e56565",
    canExportImage: false,
    canExportHtml: true,
    description: "메신저 템플릿 스타일입니다. 이 스타일은 HTML로만 내보냅니다.",
  },
];

const STYLE_GROUPS = [
  { id: "instagram", label: "Instagram", defaultOpen: true },
  { id: "youtube", label: "YouTube", defaultOpen: true },
  { id: "wiki", label: "Wiki", defaultOpen: true },
  { id: "netflix", label: "Netflix", defaultOpen: true },
  { id: "musicplayer", label: "Music", defaultOpen: true },
  { id: "timeline", label: "Timeline", defaultOpen: true },
  { id: "couple", label: "Pair Line", defaultOpen: true },
  { id: "messenger", label: "Messenger", defaultOpen: true },
];

const STYLE_VARIANTS = [
  { id: "instagram-profile", baseStyle: "instagram", groupId: "instagram", label: "프로필", variantKey: "subtype", variantValue: "profile", description: "Instagram 프로필 화면입니다." },
  { id: "instagram-post", baseStyle: "instagram", groupId: "instagram", label: "게시물", variantKey: "subtype", variantValue: "post", description: "Instagram 게시물 화면입니다." },
  { id: "instagram-story", baseStyle: "instagram", groupId: "instagram", label: "스토리", variantKey: "subtype", variantValue: "story", description: "Instagram 스토리 화면입니다." },
  { id: "instagram-dm", baseStyle: "instagram", groupId: "instagram", label: "메시지", variantKey: "subtype", variantValue: "dm", description: "Instagram DM 화면입니다." },
  { id: "youtube-watch", baseStyle: "youtube", groupId: "youtube", label: "영상 페이지", description: "YouTube 영상 페이지, 고정 댓글, 댓글 목록, 추천 영상을 구성합니다." },
  { id: "wiki-document", baseStyle: "wiki", groupId: "wiki", label: "문서", description: "Wiki 문서형 카드와 프로필 정보, 본문 섹션을 만듭니다." },
  { id: "netflix-home", baseStyle: "netflix", groupId: "netflix", label: "메인 포스터", variantKey: "mode", variantValue: "home", description: "Netflix 메인 포스터 화면입니다." },
  { id: "netflix-detail", baseStyle: "netflix", groupId: "netflix", label: "상세 페이지", variantKey: "mode", variantValue: "detail", description: "Netflix 상세 페이지 화면입니다." },
  { id: "netflix-episodes", baseStyle: "netflix", groupId: "netflix", label: "에피소드", variantKey: "mode", variantValue: "episodes", description: "Netflix 에피소드 목록 화면입니다." },
  { id: "musicplayer-card", baseStyle: "musicplayer", groupId: "musicplayer", label: "플레이어", description: "앨범 커버와 플레이어 UI가 있는 음악 카드입니다." },
  { id: "timeline-profile", baseStyle: "timeline", groupId: "timeline", label: "1인 타임라인", description: "1인 프로필과 연혁을 보드 형태로 배치합니다." },
  { id: "couple-type-a", baseStyle: "couple", groupId: "couple", label: "A타입 트윈", variantKey: "layout", variantValue: "right", description: "Pair Line A타입입니다. 두 프로필 뒤에 타임라인을 배치합니다." },
  { id: "couple-type-b", baseStyle: "couple", groupId: "couple", label: "B타입 대칭", variantKey: "layout", variantValue: "center", description: "Pair Line B타입입니다. 타임라인을 중앙에 배치합니다." },
  { id: "messenger-html", baseStyle: "messenger", groupId: "messenger", label: "메신저", description: "메신저 템플릿 스타일입니다. HTML로만 내보냅니다." },
];

const STYLE_CONFIGS = STYLE_VARIANTS.map((variant) => {
  const base = BASE_STYLE_CONFIGS.find((item) => item.id === variant.baseStyle) || {};
  return {
    ...base,
    ...variant,
    accent: variant.accent || base.accent,
    canExportImage: variant.canExportImage ?? base.canExportImage,
    canExportHtml: variant.canExportHtml ?? base.canExportHtml,
    groupLabel: STYLE_GROUPS.find((group) => group.id === variant.groupId)?.label || base.label,
  };
});

const DEFAULT_STYLE_DATA = {
  instagram: {
    subtype: "post",
    username: "username",
    avatar: "",
    accentColor: "#0095f6",
    displayName: "Name",
    bio: "자유롭게 바이오를 입력하세요.\n#keyword",
    posts: "12",
    followers: "456",
    following: "789",
    hasStoryRing: true,
    highlights: [
      { title: "day", image: "" },
      { title: "work", image: "" },
      { title: "love", image: "" },
    ],
    feedImages: ["", "", "", "", "", ""],
    location: "Seoul",
    postImage: "",
    likes: "1,234",
    caption: "본문 내용을 입력하세요.",
    postTime: "방금 전",
    storyImage: "",
    storyTime: "1시간",
    storyTagVisible: true,
    storyTag: "@someone",
    storyTagX: 38,
    storyTagY: 44,
    dmDate: "오늘",
    dmInput: "메시지 입력...",
    dmMessages: [
      { side: "recv", text: "안녕! 이건 받은 메시지야.", image: "" },
      { side: "sent", text: "보낸 메시지는 포인트색으로 보여.", image: "" },
    ],
  },
  youtube: {
    mainImage: "",
    title: "영상 제목을 입력하세요",
    time: "10:00",
    searchQuery: "검색어",
    channelName: "채널 이름",
    channelAvatar: "",
    subscribers: "구독자 12.3만명",
    views: "조회수 45만회",
    date: "1일 전",
    likes: "6.1만",
    commentCount: "댓글 3개",
    pinnedName: "고정 댓글 작성자",
    pinnedAvatar: "",
    pinnedTime: "1시간 전",
    pinnedLikes: "894",
    pinnedText: "고정 댓글 내용을 입력하세요.",
    comments: [
      { type: "comment", name: "시청자 A", avatar: "", time: "방금 전", likes: "12", text: "첫 번째 댓글입니다." },
      { type: "reply", name: "시청자 B", avatar: "", time: "10분 전", likes: "3", text: "답글 형태의 댓글입니다." },
    ],
    related: [
      { title: "추천 영상 제목 1", channel: "추천 채널", time: "08:24", views: "조회수 1.2만회", date: "3일 전", thumb: "" },
      { title: "추천 영상 제목 2", channel: "추천 채널", time: "12:40", views: "조회수 9천회", date: "1주 전", thumb: "" },
      { title: "추천 영상 제목 3", channel: "추천 채널", time: "04:01", views: "조회수 3.4만회", date: "2주 전", thumb: "" },
    ],
  },
  wiki: {
    title: "문서 제목",
    themeColor: "#008275",
    titleTextColor: "#ffffff",
    editTime: "2026-06-01 16:00",
    categories: "분류명 | https://example.com\n등장인물 | https://example.com",
    showSpoiler: true,
    spoilerText: "이 문서에는 스포일러가 포함되어 있습니다.",
    profileTitle: "캐릭터 이름",
    profileSubtitle: "영문명 또는 부제목",
    profileImage: "",
    extraTitle: "기본 정보",
    extraText: "추가 소개를 입력하세요.",
    infoRows: [
      { label: "나이", value: "??" },
      { label: "소속", value: "입력값" },
      { label: "키워드", value: "keyword / keyword" },
    ],
    sections: [
      { title: "개요", body: "본문을 입력하세요. 줄바꿈은 그대로 반영됩니다." },
      { title: "작중 행적", body: "두 번째 문단을 입력하세요." },
    ],
  },
  netflix: {
    mode: "detail",
    heroImage: "",
    title: "작품 제목",
    subtitle: "ORIGINAL SERIES",
    tags: "감성 · 관계 · 성장",
    year: "2026",
    match: "98% 일치",
    age: "15+",
    quality: "HD",
    description: "작품 설명을 입력하세요. 넷플릭스 상세 페이지처럼 3줄 안팎으로 보이게 구성됩니다.",
    imageSource: "ⓒ source",
    rowTitle: "지금 뜨는 콘텐츠",
    thumbs: ["", "", ""],
    episodes: [
      { title: "1화. 시작", duration: "42분", desc: "첫 번째 에피소드 설명입니다.", thumb: "" },
      { title: "2화. 전환", duration: "45분", desc: "두 번째 에피소드 설명입니다.", thumb: "" },
    ],
  },
  musicplayer: {
    title: "노래 제목",
    artist: "가수 이름",
    coverImage: "",
    copyright: "ⓒ 출처",
    bgColor: "#f7f7f7",
    pointColor: "#757575",
    textColor: "#424242",
    progress: 38,
    volume: 55,
  },
  timeline: {
    themeColor: "#c23b46",
    mainImage: "",
    stickerImage: "",
    copyright: "source",
    catchphrase: "캐치프레이즈",
    name: "이름",
    keywords: "keyword 1, keyword 2, keyword 3",
    description: "상세 소개를 입력하세요. 타임라인 왼쪽 프로필 영역에 표시됩니다.",
    timelineTitle: "TIMELINE",
    entries: [
      { date: "2024", title: "첫 만남", desc: "타임라인 내용을 입력하세요." },
      { date: "2025", title: "전환점", desc: "두 번째 항목입니다." },
      { date: "2026", title: "현재", desc: "현재 상태를 적어보세요." },
    ],
  },
  couple: {
    layout: "center",
    pairName: "PAIR NAME",
    bannerImage: "",
    colorA: "#c23b46",
    colorB: "#3b5998",
    colorCommon: "#222222",
    personA: {
      label: "A",
      image: "",
      copyright: "A source",
      catchphrase: "A catchphrase",
      name: "Name A",
      keywords: "A1, A2, A3",
      description: "A 캐릭터 소개를 입력하세요.",
    },
    personB: {
      label: "B",
      image: "",
      copyright: "B source",
      catchphrase: "B catchphrase",
      name: "Name B",
      keywords: "B1, B2, B3",
      description: "B 캐릭터 소개를 입력하세요.",
    },
    timelineTitle: "PAIR TIMELINE",
    entries: [
      { owner: "common", date: "2024", title: "공통 사건", desc: "둘에게 함께 일어난 사건입니다." },
      { owner: "a", date: "2025", title: "A의 사건", desc: "A 중심 타임라인입니다." },
      { owner: "b", date: "2026", title: "B의 사건", desc: "B 중심 타임라인입니다." },
    ],
  },
  messenger: {
    headerTitle: "New Message",
    recipient: "ナちゃん",
    cancelText: "Cancel",
    pointColor: "#e56565",
    inputPlaceholder: "Add comment or Send",
    messages: [
      { images: ["", "", ""], text: "예시 텍스트 예시 텍스트 예시 텍스트", showComment: true },
      { images: ["", "", ""], text: "두 번째 사진 묶음의 코멘트입니다.", showComment: true },
    ],
  },
};

const LIST_FACTORIES = {
  instagram: {
    dmMessages: () => ({ side: "recv", text: "새 메시지", image: "" }),
  },
  youtube: {
    comments: () => ({ type: "comment", name: "새 댓글", avatar: "", time: "방금 전", likes: "0", text: "댓글 내용" }),
    related: () => ({ title: "새 추천 영상", channel: "채널", time: "00:00", views: "조회수 0회", date: "오늘", thumb: "" }),
  },
  wiki: {
    infoRows: () => ({ label: "항목", value: "내용" }),
    sections: () => ({ title: "새 문단", body: "내용을 입력하세요." }),
  },
  netflix: {
    episodes: () => ({ title: "새 에피소드", duration: "00분", desc: "에피소드 설명", thumb: "" }),
  },
  timeline: {
    entries: () => ({ date: "연도", title: "제목", desc: "내용" }),
  },
  couple: {
    entries: () => ({ owner: "common", date: "연도", title: "제목", desc: "내용" }),
  },
  messenger: {
    messages: () => ({ images: ["", "", ""], text: "새 코멘트", showComment: true }),
  },
};

function createDefaultState() {
  return {
    version: APP_VERSION,
    activeStyle: "instagram-post",
    openGroups: STYLE_GROUPS.reduce((groups, group) => {
      groups[group.id] = group.defaultOpen !== false;
      return groups;
    }, {}),
    styles: JSON.parse(JSON.stringify(DEFAULT_STYLE_DATA)),
    updatedAt: null,
  };
}

window.CardStudioDefaults = {
  APP_VERSION,
  STORAGE_KEY,
  STYLE_GROUPS,
  STYLE_CONFIGS,
  DEFAULT_STYLE_DATA,
  LIST_FACTORIES,
  createDefaultState,
};
})();
