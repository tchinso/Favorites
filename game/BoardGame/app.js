"use strict";

const STORAGE_KEY = "strategy-board.lastGame";
const AI_TIME_LIMIT_MS = 1200;
const AI_SEARCH_BUDGET_MS = 900;
const GOMOKU_AI_SEARCH_BUDGET_MS = 1650;

const GAME_ORDER = [
  { id: "greatKingdom", label: "그레이트 킹덤" },
  { id: "variantGomoku", label: "변형 오목" },
  { id: "luckChess", label: "운빨 체스" },
  { id: "kamisado", label: "변형 카미사도" }
];

const ui = {
  title: document.getElementById("gameTitle"),
  subtitle: document.getElementById("gameSubtitle"),
  tabs: document.getElementById("gameTabs"),
  newGame: document.getElementById("newGameButton"),
  boardShell: document.getElementById("boardShell"),
  board: document.getElementById("board"),
  coordinates: document.getElementById("coordinates"),
  turnBadge: document.getElementById("turnBadge"),
  moveCounter: document.getElementById("moveCounter"),
  statusText: document.getElementById("statusText"),
  metricLabels: [
    document.getElementById("metricOneLabel"),
    document.getElementById("metricTwoLabel"),
    document.getElementById("metricThreeLabel")
  ],
  metricValues: [
    document.getElementById("metricOneValue"),
    document.getElementById("metricTwoValue"),
    document.getElementById("metricThreeValue")
  ],
  passButton: document.getElementById("passButton"),
  detailTitle: document.getElementById("detailTitle"),
  detailContent: document.getElementById("detailContent"),
  legendTitle: document.getElementById("legendTitle"),
  legend: document.getElementById("legend"),
  log: document.getElementById("log"),
  bonusModal: document.getElementById("bonusModal"),
  battlePreview: document.getElementById("battlePreview"),
  useBonus: document.getElementById("useBonusButton"),
  skipBonus: document.getElementById("skipBonusButton")
};

const gameFactories = {
  kamisado: createKamisadoGame,
  greatKingdom: createGreatKingdomGame,
  luckChess: createLuckChessGame,
  variantGomoku: createVariantGomokuGame
};

const games = new Map();
let activeGameId = null;
let activeGame = null;

const app = {
  isActive(id) {
    return activeGameId === id;
  },
  renderLogs,
  setBoardSize,
  setCoordinates,
  setMetrics,
  setStatus,
  setDetail,
  setLegend,
  hideBonusModal() {
    ui.bonusModal.hidden = true;
  }
};

function init() {
  renderTabs();
  const saved = readStoredGame();
  const initial = GAME_ORDER.some(game => game.id === saved) ? saved : "greatKingdom";
  switchGame(initial);

  ui.board.addEventListener("click", event => {
    const square = event.target.closest(".square");
    if (!square || !activeGame) return;
    activeGame.onSquareClick(Number(square.dataset.index));
  });

  ui.newGame.addEventListener("click", () => {
    if (activeGame) activeGame.newGame();
  });

  ui.passButton.addEventListener("click", () => {
    if (activeGame && activeGame.onPass) activeGame.onPass();
  });

  ui.useBonus.addEventListener("click", () => {
    if (activeGame && activeGame.onBonusDecision) activeGame.onBonusDecision(true);
  });

  ui.skipBonus.addEventListener("click", () => {
    if (activeGame && activeGame.onBonusDecision) activeGame.onBonusDecision(false);
  });
}

function renderTabs() {
  ui.tabs.innerHTML = "";
  for (const game of GAME_ORDER) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-button";
    button.textContent = game.label;
    button.dataset.game = game.id;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", "false");
    button.addEventListener("click", () => switchGame(game.id));
    ui.tabs.appendChild(button);
  }
}

function readStoredGame() {
  try {
    return window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

function writeStoredGame(id) {
  try {
    if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Embedded browsers can disable localStorage; only the remembered tab is skipped.
  }
}

function switchGame(id) {
  if (activeGame && activeGame.deactivate) activeGame.deactivate();
  activeGameId = id;
  writeStoredGame(id);
  app.hideBonusModal();

  if (!games.has(id)) {
    games.set(id, gameFactories[id](app));
    games.get(id).newGame();
  }

  activeGame = games.get(id);
  for (const button of ui.tabs.querySelectorAll(".tab-button")) {
    button.setAttribute("aria-selected", button.dataset.game === id ? "true" : "false");
  }
  activeGame.render();
}

function setBoardSize(size, variant) {
  ui.board.style.setProperty("--board-size", String(size));
  ui.boardShell.className = `board-shell ${variant}`;
}

function setCoordinates(labels) {
  ui.coordinates.innerHTML = labels.map(label => `<span>${label}</span>`).join("");
}

function setMetrics(metrics) {
  metrics.forEach((metric, index) => {
    ui.metricLabels[index].textContent = metric.label;
    ui.metricValues[index].textContent = metric.value;
  });
}

function setStatus({ badge, badgeClass = "", text, moves, done = false }) {
  ui.turnBadge.textContent = badge;
  ui.turnBadge.className = `badge ${done ? "done" : badgeClass}`;
  ui.statusText.textContent = text;
  ui.moveCounter.textContent = `${moves}수`;
}

function setDetail(title, html) {
  ui.detailTitle.textContent = title;
  ui.detailContent.innerHTML = html;
}

function setLegend(title, html) {
  ui.legendTitle.textContent = title;
  ui.legend.innerHTML = html;
}

function renderLogs(logs) {
  ui.log.innerHTML = "";
  for (const entry of logs.slice(0, 16)) {
    const row = document.createElement("div");
    row.className = `log-entry ${entry.kind || ""}`;
    row.textContent = entry.text;
    ui.log.appendChild(row);
  }
}

function oppositeSide(side) {
  return side === "player" ? "ai" : "player";
}

function elapsedLabel(start) {
  return `${Math.round(performance.now() - start)}ms`;
}

function createKamisadoGame(ctx) {
  const id = "kamisado";
  const size = 8;
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const colors = [
    { name: "주황", short: "O", hex: "#E69F00", ink: "#111827" },
    { name: "하늘", short: "S", hex: "#56B4E9", ink: "#111827" },
    { name: "초록", short: "G", hex: "#009E73", ink: "#ffffff" },
    { name: "노랑", short: "Y", hex: "#F0E442", ink: "#111827" },
    { name: "파랑", short: "B", hex: "#0072B2", ink: "#ffffff" },
    { name: "다홍", short: "V", hex: "#D55E00", ink: "#ffffff" },
    { name: "보라", short: "P", hex: "#CC79A7", ink: "#111827" },
    { name: "검정", short: "K", hex: "#1F2937", ink: "#ffffff" }
  ];

  let state;
  let boardColors;
  let selected = null;
  let legalForSelection = [];
  let logs = [];
  let lastMove = "-";
  let lastAiInfo = "대기";
  let lastAiMove = null;
  let aiTimer = null;

  function newGame() {
    clearAiTimer();
    boardColors = generateLatinBoard();
    const board = Array(size * size).fill(null);
    for (let file = 0; file < size; file += 1) {
      const playerColor = boardColors[indexOf(file, 0)];
      const aiColor = boardColors[indexOf(file, size - 1)];
      board[indexOf(file, 0)] = { side: "player", color: playerColor };
      board[indexOf(file, size - 1)] = { side: "ai", color: aiColor };
    }
    state = {
      board,
      turn: "player",
      forcedColor: null,
      lastMover: null,
      passCount: 0,
      moveCount: 0,
      winner: null
    };
    selected = null;
    legalForSelection = [];
    logs = [{ text: "새 변형 카미사도 시작. 플레이어가 선공입니다.", kind: "move" }];
    lastMove = "-";
    lastAiInfo = "대기";
    lastAiMove = null;
    render();
  }

  function render() {
    if (!ctx.isActive(id)) return;
    ui.title.textContent = "변형 카미사도";
    ui.subtitle.textContent = "8색 라틴 보드 · 도착 칸의 색이 상대의 다음 말을 강제합니다.";
    ctx.setBoardSize(size, "kamisado");
    ctx.setCoordinates(files);
    ui.passButton.hidden = true;

    const legalTargets = new Map(legalForSelection.map(move => [move.to, move]));
    const requiredPieces = new Set(getRequiredPieceIndexes());
    ui.board.innerHTML = "";
    for (let rank = size - 1; rank >= 0; rank -= 1) {
      for (let file = 0; file < size; file += 1) {
        const index = indexOf(file, rank);
        const color = colors[boardColors[index]];
        const square = document.createElement("button");
        square.type = "button";
        square.className = "square kamisado-cell";
        square.style.setProperty("--cell-color", color.hex);
        square.dataset.index = String(index);
        square.setAttribute("aria-label", `${coord(index)} ${color.name}`);
        if (index === selected) square.classList.add("selected");
        if (requiredPieces.has(index)) square.classList.add("required-piece");
        if (legalTargets.has(index)) square.classList.add("legal");
        if (lastAiMove && (index === lastAiMove.from || index === lastAiMove.to)) {
          square.classList.add(index === lastAiMove.from ? "ai-from" : "ai-to");
        }

        const piece = state.board[index];
        if (piece) {
          const pieceColor = colors[piece.color];
          const pieceEl = document.createElement("div");
          pieceEl.className = `kamisado-piece ${piece.side}`;
          if (requiredPieces.has(index)) pieceEl.classList.add("required");
          pieceEl.style.setProperty("--piece-color", pieceColor.hex);
          pieceEl.style.setProperty("--piece-ink", pieceColor.ink);
          pieceEl.textContent = pieceColor.short;
          square.appendChild(pieceEl);
        }

        const coordEl = document.createElement("span");
        coordEl.className = "coord";
        coordEl.textContent = coord(index);
        square.appendChild(coordEl);
        ui.board.appendChild(square);
      }
    }

    const done = Boolean(state.winner);
    const badge = done ? `${sideName(state.winner)} 승리` : `${sideName(state.turn)} 차례`;
    const badgeClass = state.turn === "ai" ? "ai-turn" : "";
    ctx.setStatus({
      badge,
      badgeClass,
      done,
      moves: state.moveCount,
      text: statusText()
    });

    const forced = state.forcedColor === null ? "자유 선택" : colors[state.forcedColor].name;
    const required = requiredPieces.size === 0
      ? "-"
      : [...requiredPieces].map(index => `${colorName(state.board[index].color)} ${coord(index)}`).join(", ");
    ctx.setMetrics([
      { label: "강제 색", value: forced },
      { label: state.turn === "player" ? "움직일 말" : "AI 읽기", value: state.turn === "player" ? required : lastAiInfo },
      { label: "최근 수", value: lastMove }
    ]);

    ctx.setDetail("진행", kamisadoDetailHtml());
    ctx.setLegend("8색", colors.map(color => (
      `<span class="legend-item"><i class="swatch" style="--swatch:${color.hex}"></i>${color.name}</span>`
    )).join(""));
    ctx.renderLogs(logs);
  }

  function onSquareClick(index) {
    if (!ctx.isActive(id) || state.winner || state.turn !== "player") return;
    const piece = state.board[index];

    if (selected !== null) {
      const move = legalForSelection.find(candidate => candidate.to === index);
      if (move) {
        applyPlayerMove(move);
        return;
      }
    }

    if (piece && piece.side === "player" && isPieceAllowed(state, index)) {
      selected = index;
      legalForSelection = movesForPiece(state, index);
    } else {
      selected = null;
      legalForSelection = [];
    }
    render();
  }

  function applyPlayerMove(move) {
    const piece = state.board[move.from];
    lastAiMove = null;
    state = applyAction(state, move);
    lastMove = `플레이어 ${colorName(piece.color)} ${coord(move.from)}→${coord(move.to)}`;
    addLog(lastMove);
    selected = null;
    legalForSelection = [];
    afterAction();
  }

  function afterAction() {
    settleForcedPasses();
    render();
    if (!state.winner && state.turn === "ai") {
      lastAiInfo = "계산 중";
      render();
      aiTimer = window.setTimeout(playAiTurn, 70);
    }
  }

  function playAiTurn() {
    if (!ctx.isActive(id) || state.winner || state.turn !== "ai") return;
    const start = performance.now();
    const choice = chooseAiMove(state, start + AI_SEARCH_BUDGET_MS);
    lastAiInfo = `${choice.depth}수 · ${elapsedLabel(start)}`;
    if (!choice.action || choice.action.type === "pass") {
      settleForcedPasses();
      render();
      return;
    }
    const piece = state.board[choice.action.from];
    state = applyAction(state, choice.action);
    lastAiMove = { from: choice.action.from, to: choice.action.to };
    lastMove = `AI ${colorName(piece.color)} ${coord(choice.action.from)}→${coord(choice.action.to)}`;
    addLog(lastMove, "ai");
    settleForcedPasses();
    render();
    if (!state.winner && state.turn === "ai") {
      lastAiInfo = "계산 중";
      render();
      aiTimer = window.setTimeout(playAiTurn, 70);
    }
  }

  function settleForcedPasses() {
    let guard = 0;
    while (!state.winner && guard < 4) {
      guard += 1;
      const actions = getLegalActions(state);
      if (actions.length !== 1 || actions[0].type !== "pass") break;
      const stuckIndex = forcedPieceIndex(state, state.turn);
      const side = state.turn;
      const color = stuckIndex === -1 ? state.forcedColor : state.board[stuckIndex].color;
      addLog(`${sideName(side)} ${colorName(color)} 말이 막혀 패스합니다.`, side === "ai" ? "ai" : "move");
      state = applyAction(state, actions[0]);
      if (state.winner) {
        addLog(`완전 교착. 마지막으로 움직인 ${sideName(oppositeSide(state.winner))} 패배입니다.`, "win");
      }
    }
  }

  function chooseAiMove(rootState, deadline) {
    const actions = orderActions(rootState, getLegalActions(rootState));
    if (actions.length === 0) return { action: null, depth: 0, score: -Infinity };
    let best = { action: actions[0], score: -Infinity, depth: 1 };
    for (const action of actions) {
      const score = evaluateState(applyAction(rootState, action));
      if (score > best.score) best = { action, score, depth: 1 };
    }

    for (let depth = 1; depth <= 40; depth += 1) {
      const context = { deadline, timeUp: false, nodes: 0 };
      const result = searchRoot(rootState, depth, context);
      if (context.timeUp || !result.action) break;
      best = { ...result, depth };
      if (Math.abs(result.score) > 90000 || performance.now() >= deadline) break;
    }
    return best;
  }

  function searchRoot(rootState, depth, context) {
    let bestAction = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const actions = orderActions(rootState, getLegalActions(rootState));
    for (const action of actions) {
      if (performance.now() >= context.deadline) {
        context.timeUp = true;
        break;
      }
      const score = minimax(applyAction(rootState, action), depth - 1, alpha, Infinity, context);
      if (context.timeUp) break;
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
      alpha = Math.max(alpha, bestScore);
    }
    return { action: bestAction, score: bestScore };
  }

  function minimax(searchState, depth, alpha, beta, context) {
    context.nodes += 1;
    if ((context.nodes & 31) === 0 && performance.now() >= context.deadline) {
      context.timeUp = true;
      return evaluateState(searchState);
    }
    if (searchState.winner || depth <= 0) return evaluateState(searchState);

    const actions = orderActions(searchState, getLegalActions(searchState));
    if (actions.length === 0) return evaluateState(searchState);
    const maximizing = searchState.turn === "ai";

    if (maximizing) {
      let value = -Infinity;
      for (const action of actions) {
        value = Math.max(value, minimax(applyAction(searchState, action), depth - 1, alpha, beta, context));
        if (context.timeUp) return evaluateState(searchState);
        alpha = Math.max(alpha, value);
        if (beta <= alpha) break;
      }
      return value;
    }

    let value = Infinity;
    for (const action of actions) {
      value = Math.min(value, minimax(applyAction(searchState, action), depth - 1, alpha, beta, context));
      if (context.timeUp) return evaluateState(searchState);
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  function evaluateState(searchState) {
    if (searchState.winner === "ai") return 100000 - searchState.moveCount;
    if (searchState.winner === "player") return -100000 + searchState.moveCount;

    let score = 0;
    for (let index = 0; index < searchState.board.length; index += 1) {
      const piece = searchState.board[index];
      if (!piece) continue;
      const rank = rankOf(index);
      const progress = piece.side === "player" ? rank : size - 1 - rank;
      const distance = piece.side === "player" ? size - 1 - rank : rank;
      const mobility = movesForPiece(searchState, index).length;
      const sign = piece.side === "ai" ? 1 : -1;
      score += sign * (progress * 1.4 - distance * 0.35 + mobility * 0.08);
      if (distance === 1) score += sign * 18;
    }

    const actions = getLegalActions(searchState);
    if (actions.length === 1 && actions[0].type === "pass") {
      score += searchState.turn === "player" ? 8 : -8;
    }
    return score;
  }

  function orderActions(searchState, actions) {
    return [...actions].sort((a, b) => actionScore(searchState, b) - actionScore(searchState, a));
  }

  function actionScore(searchState, action) {
    if (action.type === "pass") return searchState.turn === "ai" ? -6 : 6;
    const piece = searchState.board[action.from];
    const toRank = rankOf(action.to);
    const goalDistance = piece.side === "player" ? size - 1 - toRank : toRank;
    let score = 20 - goalDistance * 3;
    const next = applyAction(searchState, action);
    const replyActions = getLegalActions(next);
    if (next.winner === piece.side) score += 10000;
    if (replyActions.length === 1 && replyActions[0].type === "pass") score += 16;
    return piece.side === "ai" ? score : -score;
  }

  function getLegalActions(searchState) {
    if (searchState.winner) return [];
    const moves = [];
    for (let index = 0; index < searchState.board.length; index += 1) {
      if (isPieceAllowed(searchState, index)) {
        moves.push(...movesForPiece(searchState, index));
      }
    }
    if (moves.length > 0) return moves;
    if (searchState.forcedColor !== null) return [{ type: "pass" }];
    return [];
  }

  function isPieceAllowed(searchState, index) {
    const piece = searchState.board[index];
    if (!piece || piece.side !== searchState.turn) return false;
    return searchState.forcedColor === null || piece.color === searchState.forcedColor;
  }

  function getRequiredPieceIndexes() {
    if (!state || state.winner || state.turn !== "player") return [];
    const indexes = [];
    for (let index = 0; index < state.board.length; index += 1) {
      if (isPieceAllowed(state, index) && movesForPiece(state, index).length > 0) {
        indexes.push(index);
      }
    }
    return indexes;
  }

  function movesForPiece(searchState, from) {
    const piece = searchState.board[from];
    if (!piece) return [];
    const direction = piece.side === "player" ? 1 : -1;
    const moves = [];
    for (const [df, dr] of [[0, direction], [-1, direction], [1, direction]]) {
      let file = fileOf(from) + df;
      let rank = rankOf(from) + dr;
      while (inBounds(file, rank)) {
        const to = indexOf(file, rank);
        if (searchState.board[to]) break;
        moves.push({ type: "move", from, to });
        file += df;
        rank += dr;
      }
    }
    return moves;
  }

  function applyAction(searchState, action) {
    const next = cloneState(searchState);
    if (action.type === "pass") {
      const stuck = forcedPieceIndex(searchState, searchState.turn);
      next.forcedColor = stuck === -1 ? searchState.forcedColor : boardColors[stuck];
      next.turn = oppositeSide(searchState.turn);
      next.passCount = searchState.passCount + 1;
      if (next.passCount >= 2 && searchState.lastMover) {
        next.winner = oppositeSide(searchState.lastMover);
      }
      return next;
    }

    const piece = next.board[action.from];
    next.board[action.to] = piece;
    next.board[action.from] = null;
    next.moveCount += 1;
    next.lastMover = piece.side;
    next.passCount = 0;
    next.forcedColor = boardColors[action.to];
    if ((piece.side === "player" && rankOf(action.to) === size - 1) || (piece.side === "ai" && rankOf(action.to) === 0)) {
      next.winner = piece.side;
    } else {
      next.turn = oppositeSide(piece.side);
    }
    return next;
  }

  function cloneState(source) {
    return {
      board: source.board.map(piece => piece ? { ...piece } : null),
      turn: source.turn,
      forcedColor: source.forcedColor,
      lastMover: source.lastMover,
      passCount: source.passCount,
      moveCount: source.moveCount,
      winner: source.winner
    };
  }

  function forcedPieceIndex(searchState, side) {
    if (searchState.forcedColor === null) return -1;
    return searchState.board.findIndex(piece => piece && piece.side === side && piece.color === searchState.forcedColor);
  }

  function generateLatinBoard() {
    const base = shuffle([...Array(size).keys()]);
    const steps = [1, 3, 5, 7];
    const step = steps[Math.floor(Math.random() * steps.length)];
    const cells = Array(size * size).fill(0);
    for (let rank = 0; rank < size; rank += 1) {
      for (let file = 0; file < size; file += 1) {
        cells[indexOf(file, rank)] = base[(file + rank * step) % size];
      }
    }
    return cells;
  }

  function shuffle(values) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function statusText() {
    if (state.winner) return `${sideName(state.winner)}가 반대편 끝줄에 도달했습니다.`;
    if (state.turn === "ai") return "AI가 1.2초 안에서 수를 읽고 있습니다.";
    if (state.forcedColor === null) return "원하는 말을 선택하세요.";
    return `${colorName(state.forcedColor)} 말을 움직여야 합니다.`;
  }

  function kamisadoDetailHtml() {
    const playerPieces = state.board.filter(piece => piece && piece.side === "player").length;
    const aiPieces = state.board.filter(piece => piece && piece.side === "ai").length;
    const required = getRequiredPieceIndexes();
    const requiredText = required.length === 0
      ? "없음"
      : required.map(index => `${colorName(state.board[index].color)} ${coord(index)}`).join(", ");
    return `
      <div class="detail-grid">
        <span class="detail-item">플레이어 말 ${playerPieces}</span>
        <span class="detail-item">AI 말 ${aiPieces}</span>
        <span class="detail-item">움직일 말 ${requiredText}</span>
        <span class="detail-item">목표 끝줄 도달</span>
      </div>
    `;
  }

  function addLog(text, kind = "move") {
    logs.unshift({ text, kind });
    logs = logs.slice(0, 18);
  }

  function colorName(colorIndex) {
    return colorIndex === null || colorIndex === undefined ? "-" : colors[colorIndex].name;
  }

  function sideName(side) {
    return side === "player" ? "플레이어" : "AI";
  }

  function coord(index) {
    return `${files[fileOf(index)]}${rankOf(index) + 1}`;
  }

  function indexOf(file, rank) {
    return rank * size + file;
  }

  function fileOf(index) {
    return index % size;
  }

  function rankOf(index) {
    return Math.floor(index / size);
  }

  function inBounds(file, rank) {
    return file >= 0 && file < size && rank >= 0 && rank < size;
  }

  function clearAiTimer() {
    if (aiTimer) window.clearTimeout(aiTimer);
    aiTimer = null;
  }

  return {
    newGame,
    render,
    onSquareClick,
    deactivate: clearAiTimer
  };
}

function createGreatKingdomGame(ctx) {
  const id = "greatKingdom";
  const size = 9;
  const files = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
  const EMPTY = 0;
  const BLUE = 1;
  const ORANGE = 2;
  const NEUTRAL = 3;
  const player = BLUE;
  const ai = ORANGE;

  let state;
  let logs = [];
  let lastMove = "-";
  let lastAiInfo = "대기";
  let lastAiMove = null;
  let aiTimer = null;

  function newGame() {
    clearAiTimer();
    const board = Array(size * size).fill(EMPTY);
    board[indexOf(4, 4)] = NEUTRAL;
    state = {
      board,
      turn: player,
      moveCount: 0,
      passStreak: 0,
      winner: null,
      terminalReason: ""
    };
    logs = [{ text: "새 그레이트 킹덤 시작. 파란 성이 선공입니다.", kind: "move" }];
    lastMove = "-";
    lastAiInfo = "대기";
    lastAiMove = null;
    render();
  }

  function render() {
    if (!ctx.isActive(id)) return;
    ui.title.textContent = "그레이트 킹덤";
    ui.subtitle.textContent = "성 배치와 영토 계산. 두 번 연속 패스하면 점수로 판정합니다.";
    ctx.setBoardSize(size, "great-kingdom");
    ctx.setCoordinates(files);

    const territories = computeTerritories(state.board);
    const legal = new Set(getLegalActions(state).filter(action => action.type === "place").map(action => action.index));
    ui.board.innerHTML = "";

    for (let rank = size - 1; rank >= 0; rank -= 1) {
      for (let file = 0; file < size; file += 1) {
        const index = indexOf(file, rank);
        const square = document.createElement("button");
        square.type = "button";
        square.className = "square gk-cell";
        square.dataset.index = String(index);
        square.setAttribute("aria-label", coord(index));
        if (state.board[index] === EMPTY && territories.blue.has(index)) square.classList.add("player-territory");
        if (state.board[index] === EMPTY && territories.orange.has(index)) square.classList.add("ai-territory");
        if (state.turn === player && legal.has(index)) square.classList.add("legal");
        if (lastAiMove === index) square.classList.add("ai-to");

        const stone = state.board[index];
        if (stone !== EMPTY) {
          const castle = document.createElement("div");
          castle.className = `castle ${stone === BLUE ? "blue" : stone === ORANGE ? "orange" : "neutral"}`;
          castle.textContent = "♜";
          square.appendChild(castle);
        }

        const coordEl = document.createElement("span");
        coordEl.className = "coord";
        coordEl.textContent = coord(index);
        square.appendChild(coordEl);
        ui.board.appendChild(square);
      }
    }

    const scores = scoreBoard(state.board, territories);
    const done = Boolean(state.winner);
    ctx.setStatus({
      badge: done ? `${sideName(state.winner)} 승리` : `${sideName(state.turn)} 차례`,
      badgeClass: state.turn === ai ? "ai-turn" : "",
      done,
      moves: state.moveCount,
      text: statusText(scores)
    });

    ctx.setMetrics([
      { label: "점수", value: `파랑 ${scores.blue} : 주황 ${scores.orange}` },
      { label: "AI 읽기", value: lastAiInfo },
      { label: "최근 수", value: lastMove }
    ]);

    ui.passButton.hidden = state.turn !== player || done;
    ctx.setDetail("영토", `
      <div class="detail-grid">
        <span class="detail-item">파랑 영토 ${territories.blue.size}</span>
        <span class="detail-item">주황 영토 ${territories.orange.size}</span>
        <span class="detail-item">연속 패스 ${state.passStreak}</span>
        <span class="detail-item">덤 주황 +2.5</span>
      </div>
    `);
    ctx.setLegend("성", `
      <span class="legend-item"><i class="swatch" style="--swatch:#2563eb"></i>파랑 플레이어</span>
      <span class="legend-item"><i class="swatch" style="--swatch:#ea7a24"></i>주황 AI</span>
      <span class="legend-item"><i class="swatch" style="--swatch:#f8fafc"></i>중립 성</span>
      <span class="legend-item"><i class="swatch" style="--swatch:#dbeafe"></i>파랑 영토</span>
    `);
    ctx.renderLogs(logs);
  }

  function onSquareClick(index) {
    if (!ctx.isActive(id) || state.winner || state.turn !== player) return;
    if (!isLegalPlace(state.board, index, player)) return;
    applyPlayerAction({ type: "place", index });
  }

  function onPass() {
    if (!ctx.isActive(id) || state.winner || state.turn !== player) return;
    applyPlayerAction({ type: "pass" });
  }

  function applyPlayerAction(action) {
    lastAiMove = null;
    const result = applyAction(state, action);
    state = result.state;
    lastMove = action.type === "pass" ? "플레이어 패스" : `플레이어 ${coord(action.index)} 배치`;
    addLog(lastMove, action.type === "pass" ? "move" : "");
    if (result.captureWin) addLog("상대 성을 포위해 즉시 승리했습니다.", "win");
    afterAction();
  }

  function afterAction() {
    render();
    if (!state.winner && state.turn === ai) {
      lastAiInfo = "계산 중";
      render();
      aiTimer = window.setTimeout(playAiTurn, 80);
    }
  }

  function playAiTurn() {
    if (!ctx.isActive(id) || state.winner || state.turn !== ai) return;
    const start = performance.now();
    const choice = chooseAiAction(state, start + AI_SEARCH_BUDGET_MS);
    lastAiInfo = `${choice.depth}수 · ${elapsedLabel(start)}`;
    if (!choice.action) {
      choice.action = { type: "pass" };
    }
    const result = applyAction(state, choice.action);
    state = result.state;
    if (choice.action.type === "pass") {
      lastMove = "AI 패스";
      lastAiMove = null;
    } else {
      lastMove = `AI ${coord(choice.action.index)} 배치`;
      lastAiMove = choice.action.index;
    }
    addLog(lastMove, "ai");
    if (result.captureWin) addLog("AI가 성을 포위해 즉시 승리했습니다.", "win");
    render();
  }

  function chooseAiAction(rootState, deadline) {
    const actions = orderActions(rootState, getLegalActions(rootState), ai);
    if (actions.length === 0) return { action: { type: "pass" }, depth: 0, score: evaluate(rootState) };
    const immediate = actions.find(action => {
      const result = applyAction(rootState, action);
      return result.state.winner === ai;
    });
    if (immediate) return { action: immediate, depth: 1, score: 100000 };

    let best = { action: actions[0], score: -Infinity, depth: 1 };
    for (const action of actions) {
      const score = evaluate(applyAction(rootState, action).state);
      if (score > best.score) best = { action, score, depth: 1 };
    }

    for (let depth = 1; depth <= 7; depth += 1) {
      const context = { deadline, timeUp: false, nodes: 0 };
      const result = searchRoot(rootState, depth, context);
      if (context.timeUp || !result.action) break;
      best = { ...result, depth };
      if (Math.abs(result.score) > 90000 || performance.now() >= deadline) break;
    }
    return best;
  }

  function searchRoot(rootState, depth, context) {
    let bestAction = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const actions = orderActions(rootState, getLegalActions(rootState), ai);

    for (const action of actions) {
      if (performance.now() >= context.deadline) {
        context.timeUp = true;
        break;
      }
      const score = minimax(applyAction(rootState, action).state, depth - 1, alpha, Infinity, context);
      if (context.timeUp) break;
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
      alpha = Math.max(alpha, bestScore);
    }
    return { action: bestAction, score: bestScore };
  }

  function minimax(searchState, depth, alpha, beta, context) {
    context.nodes += 1;
    if ((context.nodes & 15) === 0 && performance.now() >= context.deadline) {
      context.timeUp = true;
      return evaluate(searchState);
    }
    if (searchState.winner || depth <= 0) return evaluate(searchState);

    const side = searchState.turn;
    const maximizing = side === ai;
    let actions = orderActions(searchState, getLegalActions(searchState), side);
    if (actions.length === 0) actions = [{ type: "pass" }];
    const pass = actions.find(action => action.type === "pass");
    const places = actions.filter(action => action.type !== "pass").slice(0, depth >= 3 ? 26 : 34);
    actions = pass ? [...places, pass] : places;

    if (maximizing) {
      let value = -Infinity;
      for (const action of actions) {
        value = Math.max(value, minimax(applyAction(searchState, action).state, depth - 1, alpha, beta, context));
        if (context.timeUp) return evaluate(searchState);
        alpha = Math.max(alpha, value);
        if (beta <= alpha) break;
      }
      return value;
    }

    let value = Infinity;
    for (const action of actions) {
      value = Math.min(value, minimax(applyAction(searchState, action).state, depth - 1, alpha, beta, context));
      if (context.timeUp) return evaluate(searchState);
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  function getLegalActions(searchState) {
    if (searchState.winner) return [];
    const actions = [];
    for (let index = 0; index < searchState.board.length; index += 1) {
      if (isLegalPlace(searchState.board, index, searchState.turn)) {
        actions.push({ type: "place", index });
      }
    }
    actions.push({ type: "pass" });
    return actions;
  }

  function isLegalPlace(board, index, side) {
    if (board[index] !== EMPTY) return false;
    const opponentTerritory = side === BLUE ? computeTerritoryFor(board, ORANGE) : computeTerritoryFor(board, BLUE);
    return !opponentTerritory.has(index);
  }

  function applyAction(searchState, action) {
    const next = {
      board: [...searchState.board],
      turn: searchState.turn,
      moveCount: searchState.moveCount + 1,
      passStreak: searchState.passStreak,
      winner: null,
      terminalReason: ""
    };

    if (action.type === "pass") {
      next.passStreak += 1;
      if (next.passStreak >= 2) {
        const scores = scoreBoard(next.board);
        next.winner = scores.blue >= scores.orange + 3 ? BLUE : ORANGE;
        next.terminalReason = `점수 판정 ${scores.blue}:${scores.orange}`;
      } else {
        next.turn = opponent(searchState.turn);
      }
      return { state: next, captureWin: false };
    }

    next.board[action.index] = searchState.turn;
    next.passStreak = 0;
    const captured = capturedOpponentGroups(next.board, action.index, searchState.turn);
    const ownGroup = getGroup(next.board, action.index);
    const ownSurrounded = liberties(next.board, ownGroup).size === 0;
    if (captured.length > 0) {
      next.winner = searchState.turn;
      next.terminalReason = ownSurrounded ? "동시 포위" : "공성";
      return { state: next, captureWin: true };
    }
    next.turn = opponent(searchState.turn);
    return { state: next, captureWin: false };
  }

  function computeTerritories(board) {
    return {
      blue: computeTerritoryFor(board, BLUE),
      orange: computeTerritoryFor(board, ORANGE)
    };
  }

  function computeTerritoryFor(board, side) {
    const territory = new Set();
    const visited = Array(board.length).fill(false);

    for (let start = 0; start < board.length; start += 1) {
      if (visited[start] || isTerritoryWall(board[start], side)) continue;

      const stack = [start];
      const emptyCells = [];
      const touchedEdges = new Set();
      let hasOpponentStone = false;
      visited[start] = true;

      while (stack.length > 0) {
        const current = stack.pop();
        const stone = board[current];
        if (stone === EMPTY) emptyCells.push(current);
        if (stone === opponent(side)) hasOpponentStone = true;
        markEdges(current, touchedEdges);

        for (const next of neighbors(current)) {
          if (!visited[next] && !isTerritoryWall(board[next], side)) {
            visited[next] = true;
            stack.push(next);
          }
        }
      }

      if (!hasOpponentStone && emptyCells.length > 0 && touchedEdges.size < 4) {
        for (const cell of emptyCells) territory.add(cell);
      }
    }
    return territory;
  }

  function isTerritoryWall(stone, side) {
    return stone === side || stone === NEUTRAL;
  }

  function capturedOpponentGroups(board, placedIndex, side) {
    const seen = new Set();
    const captured = [];
    for (const next of neighbors(placedIndex)) {
      if (board[next] !== opponent(side) || seen.has(next)) continue;
      const group = getGroup(board, next);
      for (const cell of group) seen.add(cell);
      if (liberties(board, group).size === 0) captured.push(group);
    }
    return captured;
  }

  function getGroup(board, start) {
    const side = board[start];
    const group = [];
    const stack = [start];
    const visited = new Set([start]);
    while (stack.length > 0) {
      const current = stack.pop();
      group.push(current);
      for (const next of neighbors(current)) {
        if (!visited.has(next) && board[next] === side) {
          visited.add(next);
          stack.push(next);
        }
      }
    }
    return group;
  }

  function liberties(board, group) {
    const result = new Set();
    for (const cell of group) {
      for (const next of neighbors(cell)) {
        if (board[next] === EMPTY) result.add(next);
      }
    }
    return result;
  }

  function scoreBoard(board, territories = computeTerritories(board)) {
    let blueStones = 0;
    let orangeStones = 0;
    for (const stone of board) {
      if (stone === BLUE) blueStones += 1;
      if (stone === ORANGE) orangeStones += 1;
    }
    return {
      blue: blueStones + territories.blue.size,
      orange: orangeStones + territories.orange.size
    };
  }

  function evaluate(searchState) {
    if (searchState.winner === ai) return 100000 - searchState.moveCount;
    if (searchState.winner === player) return -100000 + searchState.moveCount;

    const territories = computeTerritories(searchState.board);
    const scores = scoreBoard(searchState.board, territories);
    let value = (scores.orange + 2.5 - scores.blue) * 14;
    value += captureThreats(searchState.board, ai) * 40;
    value -= captureThreats(searchState.board, player) * 48;
    value += connectionScore(searchState.board, ai) * 0.9;
    value -= connectionScore(searchState.board, player) * 0.9;
    if (searchState.passStreak === 1) {
      value += scores.orange + 2.5 >= scores.blue ? 18 : -18;
    }
    return value;
  }

  function captureThreats(board, side) {
    const seen = new Set();
    let count = 0;
    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== opponent(side) || seen.has(index)) continue;
      const group = getGroup(board, index);
      for (const cell of group) seen.add(cell);
      const libs = liberties(board, group);
      if (libs.size === 1) {
        const liberty = [...libs][0];
        if (isLegalPlace(board, liberty, side)) count += 1;
      }
    }
    return count;
  }

  function connectionScore(board, side) {
    let score = 0;
    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== side) continue;
      for (const next of neighbors(index)) {
        if (board[next] === side) score += 1;
        if (board[next] === opponent(side)) score += 0.4;
      }
    }
    return score;
  }

  function orderActions(searchState, actions, side) {
    return [...actions].sort((a, b) => actionScore(searchState, b, side) - actionScore(searchState, a, side));
  }

  function actionScore(searchState, action, side) {
    if (action.type === "pass") {
      if (searchState.passStreak === 1) return evaluate(searchState) * (side === ai ? 1 : -1);
      return -30;
    }
    const result = applyAction(searchState, action);
    if (result.state.winner === side) return 100000;
    const file = fileOf(action.index);
    const rank = rankOf(action.index);
    const center = Math.abs(file - 4) + Math.abs(rank - 4);
    let score = 24 - center;
    for (const next of neighbors(action.index)) {
      if (searchState.board[next] === side) score += 7;
      if (searchState.board[next] === opponent(side)) score += 11;
      if (searchState.board[next] === NEUTRAL) score += 3;
    }
    const before = scoreBoard(searchState.board);
    const after = scoreBoard(result.state.board);
    score += side === BLUE ? (after.blue - before.blue) * 4 : (after.orange - before.orange) * 4;
    score -= side === BLUE ? (after.orange - before.orange) * 3 : (after.blue - before.blue) * 3;
    return score;
  }

  function statusText(scores) {
    if (state.winner) {
      return state.terminalReason ? `${state.terminalReason}. ${sideName(state.winner)} 승리입니다.` : `${sideName(state.winner)} 승리입니다.`;
    }
    if (state.turn === ai) return "AI가 1.2초 안에서 공성과 영토를 계산 중입니다.";
    return `빈칸에 성을 놓거나 패스할 수 있습니다. 현재 ${scores.blue}:${scores.orange}.`;
  }

  function addLog(text, kind = "move") {
    logs.unshift({ text, kind });
    logs = logs.slice(0, 18);
  }

  function sideName(side) {
    return side === BLUE ? "파랑" : "주황";
  }

  function opponent(side) {
    return side === BLUE ? ORANGE : BLUE;
  }

  function neighbors(index) {
    const file = fileOf(index);
    const rank = rankOf(index);
    const result = [];
    if (file > 0) result.push(indexOf(file - 1, rank));
    if (file < size - 1) result.push(indexOf(file + 1, rank));
    if (rank > 0) result.push(indexOf(file, rank - 1));
    if (rank < size - 1) result.push(indexOf(file, rank + 1));
    return result;
  }

  function markEdges(index, edges) {
    const file = fileOf(index);
    const rank = rankOf(index);
    if (file === 0) edges.add("left");
    if (file === size - 1) edges.add("right");
    if (rank === 0) edges.add("bottom");
    if (rank === size - 1) edges.add("top");
  }

  function coord(index) {
    return `${files[fileOf(index)]}${rankOf(index) + 1}`;
  }

  function indexOf(file, rank) {
    return rank * size + file;
  }

  function fileOf(index) {
    return index % size;
  }

  function rankOf(index) {
    return Math.floor(index / size);
  }

  function clearAiTimer() {
    if (aiTimer) window.clearTimeout(aiTimer);
    aiTimer = null;
  }

  return {
    newGame,
    render,
    onSquareClick,
    onPass,
    deactivate: clearAiTimer
  };
}

function createVariantGomokuGame(ctx) {
  const id = "variantGomoku";
  const size = 9;
  const files = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const lineWeights = [0, 2, 16, 130, 1200, 100000];

  let state;
  let logs = [];
  let lastMove = "-";
  let lastAiInfo = "대기";
  let lastAiMove = null;
  let aiTimer = null;

  function newGame() {
    clearAiTimer();
    state = {
      board: Array(size * size).fill(EMPTY),
      turn: BLACK,
      moveCount: 0,
      blackMoves: 0,
      whiteMoves: 0,
      purgeCount: 0,
      restrictionsLifted: false,
      winner: null,
      draw: false,
      lastPurge: null
    };
    logs = [{ text: "새 변형 오목 시작. 흑 플레이어가 선공입니다.", kind: "move" }];
    lastMove = "-";
    lastAiInfo = "대기";
    lastAiMove = null;
    render();
  }

  function render() {
    if (!ctx.isActive(id)) return;
    ui.title.textContent = "변형 오목";
    ui.subtitle.textContent = "9x9 칸 내부 착수 · 양측 금수 적용 · 총 40수마다 가장 붐빈 구역을 비웁니다.";
    ctx.setBoardSize(size, "variant-gomoku");
    ctx.setCoordinates(files);
    ui.passButton.hidden = true;

    const forbidden = state.turn === BLACK && !state.restrictionsLifted && !state.winner
      ? new Set(getForbiddenMoves(state.board, BLACK, state.restrictionsLifted))
      : new Set();

    ui.board.innerHTML = "";
    for (let rank = size - 1; rank >= 0; rank -= 1) {
      for (let file = 0; file < size; file += 1) {
        const index = indexOf(file, rank);
        const square = document.createElement("button");
        square.type = "button";
        square.className = "square gomoku-cell";
        square.dataset.index = String(index);
        square.setAttribute("aria-label", coord(index));
        if (state.board[index] === EMPTY && forbidden.has(index)) square.classList.add("forbidden");
        if (lastAiMove === index) square.classList.add("ai-to");

        const stone = state.board[index];
        if (stone !== EMPTY) {
          const stoneEl = document.createElement("div");
          stoneEl.className = `gomoku-stone ${stone === BLACK ? "black-stone" : "white-stone"}`;
          square.appendChild(stoneEl);
        }

        const coordEl = document.createElement("span");
        coordEl.className = "coord";
        coordEl.textContent = coord(index);
        square.appendChild(coordEl);
        ui.board.appendChild(square);
      }
    }

    const done = Boolean(state.winner) || state.draw;
    ctx.setStatus({
      badge: done ? resultBadge() : `${sideName(state.turn)} 차례`,
      badgeClass: state.turn === WHITE ? "ai-turn" : "",
      done,
      moves: state.moveCount,
      text: statusText(forbidden.size)
    });

    ctx.setMetrics([
      { label: "금수", value: state.restrictionsLifted ? "해제" : `${forbidden.size}곳` },
      { label: "AI 읽기", value: lastAiInfo },
      { label: "최근 수", value: lastMove }
    ]);

    const nextPurge = state.moveCount === 0 ? 40 : 40 - (state.moveCount % 40 || 40);
    ctx.setDetail("진행", `
      <div class="detail-grid">
        <span class="detail-item">흑 ${state.blackMoves}수</span>
        <span class="detail-item">백 ${state.whiteMoves}수</span>
        <span class="detail-item">정리까지 ${nextPurge}수</span>
        <span class="detail-item">${state.lastPurge ? state.lastPurge.name : "정리 없음"}</span>
      </div>
    `);
    ctx.setLegend("돌", `
      <span class="legend-item"><i class="swatch" style="--swatch:#111827"></i>흑 플레이어</span>
      <span class="legend-item"><i class="swatch" style="--swatch:#f8fafc"></i>백 AI</span>
      <span class="legend-item"><i class="swatch" style="--swatch:#dc2626"></i>금수점</span>
      <span class="legend-item"><i class="swatch" style="--swatch:#9fb5a3"></i>40수 구역 정리</span>
    `);
    ctx.renderLogs(logs);
  }

  function onSquareClick(index) {
    if (!ctx.isActive(id) || state.winner || state.draw || state.turn !== BLACK) return;
    if (state.board[index] !== EMPTY) return;
    if (!isLegalMove(state.board, index, BLACK, state.restrictionsLifted)) {
      lastMove = `${coord(index)} 금수`;
      addLog(`${coord(index)}는 3-3, 3-4 또는 4-3 금수점입니다.`, "battle");
      render();
      return;
    }
    applyRealMove(index);
  }

  function applyRealMove(index) {
    lastAiMove = null;
    const result = applyMove(state, index, true);
    state = result.state;
    lastMove = `흑 ${coord(index)}`;
    addLog(lastMove);
    logPurge(result.purge);
    render();

    if (!state.winner && !state.draw) {
      lastAiInfo = "계산 중";
      render();
      aiTimer = window.setTimeout(playAiTurn, 70);
    }
  }

  function playAiTurn() {
    if (!ctx.isActive(id) || state.winner || state.draw || state.turn !== WHITE) return;
    const start = performance.now();
    const choice = chooseAiMove(state, start + GOMOKU_AI_SEARCH_BUDGET_MS);
    lastAiInfo = `${choice.depth}수 · ${elapsedLabel(start)}`;

    if (choice.move === null || choice.move === undefined) {
      state = { ...state, draw: true };
      addLog("백 AI가 둘 수 없어 무승부입니다.", "win");
      render();
      return;
    }

    const result = applyMove(state, choice.move, true);
    state = result.state;
    lastAiMove = choice.move;
    lastMove = `백 ${coord(choice.move)}`;
    addLog(lastMove, "ai");
    logPurge(result.purge);
    render();
  }

  function chooseAiMove(rootState, deadline) {
    const moves = getSearchMoves(rootState, WHITE, 28);
    if (moves.length === 0) return { move: null, depth: 0, score: 0 };

    const win = moves.find(move => wouldWin(rootState.board, move, WHITE));
    if (win !== undefined) return { move: win, depth: 1, score: 1000000 };

    const playerWins = getSearchMoves(rootState, BLACK, 32).filter(move => wouldWin(rootState.board, move, BLACK));
    const block = moves.find(move => playerWins.includes(move));
    if (block !== undefined) return { move: block, depth: 1, score: 900000 };

    let best = { move: moves[0], depth: 1, score: -Infinity };
    for (const move of moves) {
      if (performance.now() >= deadline) break;
      const score = evaluate(applyMove(rootState, move, false).state);
      if (score > best.score) best = { move, depth: 1, score };
    }

    for (let depth = 1; depth <= 5; depth += 1) {
      const context = { deadline, nodes: 0, timeUp: false };
      const result = searchRoot(rootState, depth, context);
      if (context.timeUp || result.move === null) break;
      best = { ...result, depth };
      if (Math.abs(result.score) > 900000 || performance.now() >= deadline) break;
    }
    return best;
  }

  function searchRoot(rootState, depth, context) {
    let bestMove = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const rootMoves = getSearchMoves(rootState, WHITE, 18);

    for (const move of rootMoves) {
      if (performance.now() >= context.deadline) {
        context.timeUp = true;
        break;
      }
      const score = minimax(applyMove(rootState, move, false).state, depth - 1, alpha, Infinity, context);
      if (context.timeUp) break;
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    }
    return { move: bestMove, score: bestScore };
  }

  function minimax(searchState, depth, alpha, beta, context) {
    context.nodes += 1;
    if ((context.nodes & 31) === 0 && performance.now() >= context.deadline) {
      context.timeUp = true;
      return evaluate(searchState);
    }
    if (searchState.winner || searchState.draw || depth <= 0) return evaluate(searchState);

    const side = searchState.turn;
    const maximizing = side === WHITE;
    const limit = depth >= 3 ? 10 : 14;
    const moves = getSearchMoves(searchState, side, limit);
    if (moves.length === 0) return evaluate({ ...searchState, draw: true });

    if (maximizing) {
      let value = -Infinity;
      for (const move of moves) {
        value = Math.max(value, minimax(applyMove(searchState, move, false).state, depth - 1, alpha, beta, context));
        if (context.timeUp) return evaluate(searchState);
        alpha = Math.max(alpha, value);
        if (beta <= alpha) break;
      }
      return value;
    }

    let value = Infinity;
    for (const move of moves) {
      value = Math.min(value, minimax(applyMove(searchState, move, false).state, depth - 1, alpha, beta, context));
      if (context.timeUp) return evaluate(searchState);
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  function applyMove(source, index, useRandomPurge) {
    const side = source.turn;
    const next = {
      board: [...source.board],
      turn: opposite(side),
      moveCount: source.moveCount + 1,
      blackMoves: source.blackMoves + (side === BLACK ? 1 : 0),
      whiteMoves: source.whiteMoves + (side === WHITE ? 1 : 0),
      purgeCount: source.purgeCount,
      restrictionsLifted: source.restrictionsLifted,
      winner: null,
      draw: false,
      lastPurge: source.lastPurge
    };
    next.board[index] = side;

    if (checkWin(next.board, index, side)) {
      next.winner = side;
      return { state: next, purge: null };
    }

    let purge = null;
    if (next.moveCount > 0 && next.moveCount % 40 === 0) {
      purge = purgeCrowdedGroup(next.board, useRandomPurge);
      next.purgeCount += 1;
      next.restrictionsLifted = true;
      next.lastPurge = purge;
    }

    if (next.board.every(stone => stone !== EMPTY)) {
      next.draw = true;
    } else if (getLegalMoves(next, next.turn).length === 0) {
      next.draw = true;
    }

    return { state: next, purge };
  }

  function purgeCrowdedGroup(board, useRandom) {
    const groups = purgeGroups();
    let bestCount = -1;
    let candidates = [];
    for (const group of groups) {
      const count = group.cells.reduce((sum, cell) => sum + (board[cell] !== EMPTY ? 1 : 0), 0);
      if (count > bestCount) {
        bestCount = count;
        candidates = [{ ...group, count }];
      } else if (count === bestCount) {
        candidates.push({ ...group, count });
      }
    }

    const chosen = useRandom
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : candidates[0];
    for (const cell of chosen.cells) board[cell] = EMPTY;
    return chosen;
  }

  function purgeGroups() {
    const rowsOneToFive = [];
    const rowsFiveToNine = [];
    const colsAToE = [];
    const colsEToI = [];

    for (let rank = 0; rank <= 4; rank += 1) {
      for (let file = 0; file < size; file += 1) rowsOneToFive.push(indexOf(file, rank));
    }
    for (let rank = 4; rank < size; rank += 1) {
      for (let file = 0; file < size; file += 1) rowsFiveToNine.push(indexOf(file, rank));
    }
    for (let file = 0; file <= 4; file += 1) {
      for (let rank = 0; rank < size; rank += 1) colsAToE.push(indexOf(file, rank));
    }
    for (let file = 4; file < size; file += 1) {
      for (let rank = 0; rank < size; rank += 1) colsEToI.push(indexOf(file, rank));
    }

    return [
      { name: "1행부터 5행", cells: rowsOneToFive },
      { name: "5행부터 9행", cells: rowsFiveToNine },
      { name: "a열부터 e열", cells: colsAToE },
      { name: "e열부터 i열", cells: colsEToI }
    ];
  }

  function getLegalMoves(searchState, side) {
    const moves = [];
    for (let index = 0; index < searchState.board.length; index += 1) {
      if (isLegalMove(searchState.board, index, side, searchState.restrictionsLifted)) {
        moves.push(index);
      }
    }
    return moves;
  }

  function isLegalMove(board, index, side, restrictionsLifted) {
    if (board[index] !== EMPTY) return false;
    return !isForbiddenMove(board, index, side, restrictionsLifted);
  }

  function getForbiddenMoves(board, side, restrictionsLifted) {
    const result = [];
    if (restrictionsLifted) return result;
    for (let index = 0; index < board.length; index += 1) {
      if (board[index] === EMPTY && isForbiddenMove(board, index, side, restrictionsLifted)) {
        result.push(index);
      }
    }
    return result;
  }

  function isForbiddenMove(board, index, side, restrictionsLifted) {
    if (restrictionsLifted || board[index] !== EMPTY) return false;
    const next = [...board];
    next[index] = side;
    if (checkWin(next, index, side)) return false;
    const stats = forbiddenStats(next, index, side);
    return stats.threes >= 2 || (stats.threes >= 1 && stats.fours >= 1);
  }

  function forbiddenStats(board, index, side) {
    let threes = 0;
    let fours = 0;
    for (const direction of directions) {
      const four = createsFourInDirection(board, index, side, direction);
      if (four) {
        fours += 1;
      } else if (createsOpenThreeInDirection(board, index, side, direction)) {
        threes += 1;
      }
    }
    return { threes, fours };
  }

  function createsFourInDirection(board, index, side, direction) {
    return winningCompletionCells(board, side, direction, [index]).length > 0;
  }

  function createsOpenThreeInDirection(board, index, side, direction) {
    const line = lineCellsThrough(index, direction);
    for (const cell of line) {
      if (board[cell] !== EMPTY) continue;
      const next = [...board];
      next[cell] = side;
      if (lineRunCells(next, cell, side, direction).length >= 5) continue;
      const completions = winningCompletionCells(next, side, direction, [index, cell]);
      if (completions.length >= 2) return true;
    }
    return false;
  }

  function winningCompletionCells(board, side, direction, required) {
    const cells = lineCellsThrough(required[0], direction);
    const wins = [];
    for (const cell of cells) {
      if (board[cell] !== EMPTY) continue;
      const next = [...board];
      next[cell] = side;
      const run = lineRunCells(next, cell, side, direction);
      if (run.length >= 5 && required.every(requiredCell => run.includes(requiredCell))) {
        wins.push(cell);
      }
    }
    return wins;
  }

  function checkWin(board, index, side) {
    return directions.some(direction => lineRunCells(board, index, side, direction).length >= 5);
  }

  function wouldWin(board, index, side) {
    if (board[index] !== EMPTY) return false;
    const next = [...board];
    next[index] = side;
    return checkWin(next, index, side);
  }

  function lineRunCells(board, index, side, [df, dr]) {
    const run = [index];
    for (const sign of [-1, 1]) {
      let file = fileOf(index) + df * sign;
      let rank = rankOf(index) + dr * sign;
      while (inBounds(file, rank)) {
        const next = indexOf(file, rank);
        if (board[next] !== side) break;
        if (sign < 0) run.unshift(next);
        else run.push(next);
        file += df * sign;
        rank += dr * sign;
      }
    }
    return run;
  }

  function lineCellsThrough(index, [df, dr]) {
    let file = fileOf(index);
    let rank = rankOf(index);
    while (inBounds(file - df, rank - dr)) {
      file -= df;
      rank -= dr;
    }
    const cells = [];
    while (inBounds(file, rank)) {
      cells.push(indexOf(file, rank));
      file += df;
      rank += dr;
    }
    return cells;
  }

  function orderMoves(searchState, moves, side) {
    return [...moves].sort((a, b) => quickMoveScore(searchState, b, side) - quickMoveScore(searchState, a, side));
  }

  function quickMoveScore(searchState, move, side) {
    const opponentSide = opposite(side);
    if (wouldWin(searchState.board, move, side)) return 1000000;
    if (wouldWin(searchState.board, move, opponentSide)) return 850000;
    const center = 8 - (Math.abs(fileOf(move) - 4) + Math.abs(rankOf(move) - 4));
    let score = center * 4 + nearbyScore(searchState.board, move, side) * 8;
    score += patternScoreAfter(searchState.board, move, side);
    score += patternScoreAfter(searchState.board, move, opponentSide) * 0.82;
    return score;
  }

  function getSearchMoves(searchState, side, limit) {
    if (!searchState.board.some(stone => stone !== EMPTY)) return [indexOf(4, 4)];

    const candidates = [];
    for (let index = 0; index < searchState.board.length; index += 1) {
      if (searchState.board[index] !== EMPTY) continue;
      if (!hasNeighbor(searchState.board, index, 2)) continue;
      if (isLegalMove(searchState.board, index, side, searchState.restrictionsLifted)) candidates.push(index);
    }

    if (candidates.length === 0) return getLegalMoves(searchState, side).slice(0, limit);
    return orderMoves(searchState, candidates, side).slice(0, limit);
  }

  function patternScoreAfter(board, move, side) {
    const next = [...board];
    next[move] = side;
    let score = 0;
    for (const direction of directions) {
      const run = lineRunCells(next, move, side, direction);
      const openEnds = countOpenEnds(next, run, direction);
      const length = run.length;
      if (length >= 5) score += 100000;
      else if (length === 4 && openEnds >= 1) score += openEnds === 2 ? 9000 : 2800;
      else if (length === 3 && openEnds === 2) score += 950;
      else if (length === 3 && openEnds === 1) score += 180;
      else if (length === 2 && openEnds === 2) score += 48;
      else if (length === 2 && openEnds === 1) score += 16;
    }
    return score;
  }

  function countOpenEnds(board, run, [df, dr]) {
    const first = run[0];
    const last = run[run.length - 1];
    let open = 0;
    const beforeFile = fileOf(first) - df;
    const beforeRank = rankOf(first) - dr;
    const afterFile = fileOf(last) + df;
    const afterRank = rankOf(last) + dr;
    if (inBounds(beforeFile, beforeRank) && board[indexOf(beforeFile, beforeRank)] === EMPTY) open += 1;
    if (inBounds(afterFile, afterRank) && board[indexOf(afterFile, afterRank)] === EMPTY) open += 1;
    return open;
  }

  function nearbyScore(board, index, side) {
    let score = 0;
    const opponentSide = opposite(side);
    for (let df = -2; df <= 2; df += 1) {
      for (let dr = -2; dr <= 2; dr += 1) {
        if (df === 0 && dr === 0) continue;
        const file = fileOf(index) + df;
        const rank = rankOf(index) + dr;
        if (!inBounds(file, rank)) continue;
        const stone = board[indexOf(file, rank)];
        if (stone === side) score += 2;
        if (stone === opponentSide) score += 1;
      }
    }
    return score;
  }

  function evaluate(searchState) {
    if (searchState.winner === WHITE) return 1000000 - searchState.moveCount;
    if (searchState.winner === BLACK) return -1000000 + searchState.moveCount;
    if (searchState.draw) return 0;

    let score = 0;
    score += linePotential(searchState.board, WHITE);
    score -= linePotential(searchState.board, BLACK);
    score += threatPotential(searchState, WHITE);
    score -= threatPotential(searchState, BLACK);
    return score;
  }

  function linePotential(board, side) {
    let score = 0;
    for (const direction of directions) {
      for (let index = 0; index < board.length; index += 1) {
        const endFile = fileOf(index) + direction[0] * 4;
        const endRank = rankOf(index) + direction[1] * 4;
        if (!inBounds(endFile, endRank)) continue;

        let own = 0;
        let enemy = 0;
        for (let step = 0; step < 5; step += 1) {
          const cell = indexOf(fileOf(index) + direction[0] * step, rankOf(index) + direction[1] * step);
          if (board[cell] === side) own += 1;
          else if (board[cell] === opposite(side)) enemy += 1;
        }
        if (enemy === 0) score += lineWeights[own];
      }
    }
    return score;
  }

  function threatPotential(searchState, side) {
    const legal = getSearchMoves(searchState, side, 16);
    let score = 0;
    for (const move of legal) {
      if (wouldWin(searchState.board, move, side)) {
        score += 20000;
        continue;
      }
      score += patternScoreAfter(searchState.board, move, side) * 0.32;
    }
    return score;
  }

  function hasNeighbor(board, index, radius) {
    for (let df = -radius; df <= radius; df += 1) {
      for (let dr = -radius; dr <= radius; dr += 1) {
        if (df === 0 && dr === 0) continue;
        const file = fileOf(index) + df;
        const rank = rankOf(index) + dr;
        if (inBounds(file, rank) && board[indexOf(file, rank)] !== EMPTY) return true;
      }
    }
    return false;
  }

  function statusText(forbiddenCount) {
    if (state.winner) return `${sideName(state.winner)}이 5목을 완성했습니다.`;
    if (state.draw) return "둘 수 있는 수가 없어 무승부입니다.";
    if (state.turn === WHITE) return "백 AI가 1.8초 안에서 수를 읽고 있습니다.";
    if (state.restrictionsLifted) return "금수가 해제되었습니다. 원하는 빈칸에 두세요.";
    return `3-3, 3-4, 4-3 금수점 ${forbiddenCount}곳을 피해서 두세요.`;
  }

  function resultBadge() {
    if (state.winner) return `${sideName(state.winner)} 승리`;
    if (state.draw) return "무승부";
    return "게임 종료";
  }

  function logPurge(purge) {
    if (!purge) return;
    addLog(`40수 정리: ${purge.name} 구역의 돌 ${purge.count}개를 비웠습니다. 금수가 해제됩니다.`, "battle");
  }

  function addLog(text, kind = "move") {
    logs.unshift({ text, kind });
    logs = logs.slice(0, 18);
  }

  function sideName(side) {
    return side === BLACK ? "흑" : "백";
  }

  function opposite(side) {
    return side === BLACK ? WHITE : BLACK;
  }

  function coord(index) {
    return `${files[fileOf(index)]}${rankOf(index) + 1}`;
  }

  function indexOf(file, rank) {
    return rank * size + file;
  }

  function fileOf(index) {
    return index % size;
  }

  function rankOf(index) {
    return Math.floor(index / size);
  }

  function inBounds(file, rank) {
    return file >= 0 && file < size && rank >= 0 && rank < size;
  }

  function clearAiTimer() {
    if (aiTimer) window.clearTimeout(aiTimer);
    aiTimer = null;
  }

  return {
    newGame,
    render,
    onSquareClick,
    deactivate: clearAiTimer
  };
}

function createLuckChessGame(ctx) {
  const id = "luckChess";
  const size = 8;
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const maxSearchDepth = 7;
  const pieceInfo = {
    rook: { name: "루크", white: "♖", black: "♜", value: 5.4 },
    knight: { name: "나이트", white: "♘", black: "♞", value: 3.2 },
    cannon: { name: "캐논", white: "砲", black: "炮", value: 4.7 },
    king: { name: "킹", white: "♔", black: "♚", value: 120 },
    shinobi: { name: "시노비", white: "忍", black: "忍", value: 7.4 },
    pawn: { name: "폰", white: "♙", black: "♟", value: 1.15 }
  };

  let board = [];
  let currentTurn = "white";
  let selectedIndex = null;
  let legalMovesForSelection = [];
  let moveCount = 0;
  let whiteBonusUsed = false;
  let pendingBattle = null;
  let gameOver = false;
  let logs = [];
  let lastDice = null;
  let lastAiInfo = "대기";
  let lastMoveText = "-";
  let lastAiMove = null;
  let pieceId = 0;
  let aiTimer = null;

  function newGame() {
    clearAiTimer();
    board = Array(size * size).fill(null);
    pieceId = 0;
    currentTurn = "white";
    selectedIndex = null;
    legalMovesForSelection = [];
    moveCount = 0;
    whiteBonusUsed = false;
    pendingBattle = null;
    gameOver = false;
    logs = [];
    lastDice = null;
    lastAiInfo = "대기";
    lastMoveText = "-";
    lastAiMove = null;
    ctx.hideBonusModal();

    place("black", "rook", 0, 7);
    place("black", "cannon", 1, 7);
    place("black", "knight", 2, 7);
    place("black", "shinobi", 3, 7);
    place("black", "king", 4, 7);
    place("black", "knight", 5, 7);
    place("black", "cannon", 6, 7);
    place("black", "rook", 7, 7);
    for (let file = 0; file < size; file += 1) place("black", "pawn", file, 6);

    place("white", "rook", 0, 0);
    place("white", "cannon", 1, 0);
    place("white", "knight", 2, 0);
    place("white", "king", 3, 0);
    place("white", "shinobi", 4, 0);
    place("white", "knight", 5, 0);
    place("white", "cannon", 6, 0);
    place("white", "rook", 7, 0);
    for (let file = 0; file < size; file += 1) place("white", "pawn", file, 1);

    addLog("새 운빨 체스 시작. 백 플레이어가 선공입니다.");
    render();
  }

  function render() {
    if (!ctx.isActive(id)) return;
    ui.title.textContent = "8x8 운빨 체스";
    ui.subtitle.textContent = "백 선공 · 전투는 보너스와 주사위로 판정합니다.";
    ctx.setBoardSize(size, "luck-chess");
    ctx.setCoordinates(files);
    ui.passButton.hidden = true;
    renderBoard();
    renderStatus();
    renderDetails();
    ctx.renderLogs(logs);
  }

  function renderBoard() {
    const legalTargets = new Map(legalMovesForSelection.map(move => [move.to, move]));
    ui.board.innerHTML = "";

    for (let rank = size - 1; rank >= 0; rank -= 1) {
      for (let file = 0; file < size; file += 1) {
        const index = indexOf(file, rank);
        const square = document.createElement("button");
        square.type = "button";
        square.className = `square ${(file + rank) % 2 === 0 ? "dark" : "light"}`;
        square.dataset.index = String(index);
        square.setAttribute("aria-label", coord(index));

        if (index === selectedIndex) square.classList.add("selected");
        if (legalTargets.has(index)) square.classList.add(board[index] ? "capture" : "legal");
        if (lastAiMove && index === lastAiMove.from) square.classList.add("ai-from");
        if (lastAiMove && index === lastAiMove.to) square.classList.add("ai-to");

        const piece = board[index];
        if (piece) {
          const pieceEl = document.createElement("div");
          pieceEl.className = `piece ${piece.side} ${piece.type === "shinobi" ? "shinobi" : ""} ${piece.type === "cannon" ? "cannon" : ""}`;
          pieceEl.textContent = pieceInfo[piece.type][piece.side];
          square.appendChild(pieceEl);
        }

        const coordEl = document.createElement("span");
        coordEl.className = "coord";
        coordEl.textContent = coord(index);
        square.appendChild(coordEl);
        ui.board.appendChild(square);
      }
    }
  }

  function renderStatus() {
    const terminal = getTerminalStatus({ board, turn: currentTurn, moveCount, whiteBonusUsed });
    const done = gameOver || terminal.done;
    const text = done ? terminal.message : currentTurn === "white" ? "백 플레이어 차례입니다." : "흑 AI가 생각 중입니다.";
    ctx.setStatus({
      badge: done ? "게임 종료" : currentTurn === "white" ? "백 차례" : "흑 차례",
      badgeClass: currentTurn === "black" ? "ai-turn" : "",
      done,
      moves: moveCount,
      text
    });

    const bonusText = whiteBonusUsed ? "사용 완료" : moveCount >= 20 ? "사용 가능" : "20수 이후";
    ctx.setMetrics([
      { label: "+2 선택권", value: bonusText },
      { label: "AI 읽기", value: lastAiInfo },
      { label: "최근 수", value: lastMoveText }
    ]);
  }

  function renderDetails() {
    const diceText = lastDice
      ? `주사위 ${lastDice.attackerRoll}:${lastDice.defenderRoll} = ${lastDice.attackerTotal}:${lastDice.defenderTotal}`
      : "전투 없음";
    ctx.setDetail("전황", `
      <div class="detail-grid">
        <span class="detail-item">백 ${armyText("white")}</span>
        <span class="detail-item">흑 ${armyText("black")}</span>
        <span class="detail-item">${diceText}</span>
        <span class="detail-item">킹 제거 승리</span>
      </div>
    `);
    ctx.setLegend("말", `
      <span class="legend-item"><i class="mini-piece">♖</i> 루크</span>
      <span class="legend-item"><i class="mini-piece">♘</i> 나이트</span>
      <span class="legend-item"><i class="mini-piece">砲</i> 캐논</span>
      <span class="legend-item"><i class="mini-piece">♔</i> 킹</span>
      <span class="legend-item"><i class="mini-piece">♙</i> 폰</span>
      <span class="legend-item"><i class="mini-piece">忍</i> 시노비</span>
    `);
  }

  function armyText(side) {
    const order = ["king", "shinobi", "rook", "knight", "cannon", "pawn"];
    const counts = Object.fromEntries(order.map(type => [type, 0]));
    for (const piece of board) {
      if (piece && piece.side === side) counts[piece.type] += 1;
    }
    return order
      .filter(type => counts[type] > 0)
      .map(type => `${pieceInfo[type].name}${counts[type]}`)
      .join(" ");
  }

  function onSquareClick(index) {
    if (!ctx.isActive(id) || gameOver || currentTurn !== "white" || pendingBattle) return;
    const piece = board[index];

    if (selectedIndex !== null) {
      const chosenMove = legalMovesForSelection.find(move => move.to === index);
      if (chosenMove) {
        executeMove(chosenMove);
        return;
      }
    }

    if (piece && piece.side === currentTurn) {
      selectedIndex = index;
      legalMovesForSelection = getMovesForPiece(makeState(), index);
    } else {
      selectedIndex = null;
      legalMovesForSelection = [];
    }
    render();
  }

  function executeMove(move) {
    const attacker = board[move.from];
    const defender = board[move.to];
    lastAiMove = attacker.side === "black" ? { from: move.from, to: move.to } : null;

    if (defender) {
      pendingBattle = { move, attacker: { ...attacker }, defender: { ...defender } };
      if (attacker.side === "white" && shouldAskForBonus()) {
        showBonusModal();
      } else {
        resolvePendingBattle(false);
      }
      return;
    }

    board[move.to] = attacker;
    board[move.from] = null;
    lastDice = null;
    lastMoveText = `${sideName(attacker.side)} ${pieceInfo[attacker.type].name} ${coord(move.from)}→${coord(move.to)}`;
    addLog(lastMoveText, attacker.side === "black" ? "ai" : "move");
    completeMove();
  }

  function shouldAskForBonus() {
    return Boolean(pendingBattle && !whiteBonusUsed && moveCount >= 20);
  }

  function showBonusModal() {
    const { move, attacker, defender } = pendingBattle;
    const normal = getBattleModifiers(attacker, defender, false);
    const withBonus = getBattleModifiers(attacker, defender, true);
    const whiteRole = attacker.side === "white" ? "공격" : "방어";
    ui.battlePreview.innerHTML = `
      <strong>${coord(move.from)} ${pieceInfo[attacker.type].name}</strong> →
      <strong>${coord(move.to)} ${pieceInfo[defender.type].name}</strong><br>
      백은 이번 전투에서 ${whiteRole} 쪽입니다.<br>
      보류 시: 공격 +${normal.attacker}, 방어 +${normal.defender}<br>
      사용 시: 공격 +${withBonus.attacker}, 방어 +${withBonus.defender}
    `;
    ui.bonusModal.hidden = false;
  }

  function onBonusDecision(useWhiteBonus) {
    if (!ctx.isActive(id) || !pendingBattle) return;
    resolvePendingBattle(useWhiteBonus);
  }

  function resolvePendingBattle(useWhiteBonus) {
    if (!pendingBattle) return;
    ctx.hideBonusModal();

    const { move, attacker, defender } = pendingBattle;
    const modifiers = getBattleModifiers(attacker, defender, useWhiteBonus);
    const attackerRoll = rollDie();
    const defenderRoll = rollDie();
    const attackerTotal = attackerRoll + modifiers.attacker;
    const defenderTotal = defenderRoll + modifiers.defender;
    let resultText = "";

    if (useWhiteBonus) whiteBonusUsed = true;

    if (attackerTotal > defenderTotal) {
      board[move.to] = board[move.from];
      board[move.from] = null;
      resultText = `${sideName(attacker.side)} 공격 승`;
    } else if (defenderTotal > attackerTotal) {
      board[move.from] = null;
      resultText = `${sideName(defender.side)} 방어 승`;
    } else {
      resultText = "무승부, 공격 말 복귀";
    }

    lastDice = {
      attackerRoll,
      defenderRoll,
      attackerTotal,
      defenderTotal,
      attackerSide: attacker.side,
      defenderSide: defender.side
    };

    const bonusNote = useWhiteBonus ? " · 백 +2 사용" : "";
    const modNote = `공격 +${modifiers.attacker}, 방어 +${modifiers.defender}`;
    lastMoveText = `${sideName(attacker.side)} ${pieceInfo[attacker.type].name} ${coord(move.from)}→${coord(move.to)}`;
    addLog(
      `${lastMoveText}: ${modNote}${bonusNote}, 주사위 ${attackerRoll}:${defenderRoll} = ${attackerTotal}:${defenderTotal}. ${resultText}.`,
      "battle"
    );

    pendingBattle = null;
    completeMove();
  }

  function completeMove() {
    moveCount += 1;
    selectedIndex = null;
    legalMovesForSelection = [];

    const terminal = getTerminalStatus({ board, turn: currentTurn, moveCount, whiteBonusUsed });
    if (terminal.done) {
      gameOver = true;
      render();
      return;
    }

    currentTurn = opposite(currentTurn);
    const nextState = makeState();
    const nextMoves = getLegalMoves(nextState, currentTurn);
    if (nextMoves.length === 0) {
      gameOver = true;
      addLog(`${sideName(currentTurn)}이 움직일 수 없어 ${sideName(opposite(currentTurn))} 승리입니다.`, "win");
      render();
      return;
    }

    if (currentTurn === "black") {
      lastAiInfo = "계산 중";
      render();
      aiTimer = window.setTimeout(playAiTurn, 80);
    } else {
      render();
    }
  }

  function playAiTurn() {
    if (!ctx.isActive(id) || gameOver || currentTurn !== "black" || pendingBattle) return;
    const start = performance.now();
    const state = makeState();
    const choice = chooseAiMove(state, start + AI_SEARCH_BUDGET_MS);
    lastAiInfo = `${choice.depth}수 · ${elapsedLabel(start)}`;

    if (!choice.move) {
      gameOver = true;
      addLog("흑이 움직일 수 없어 백 승리입니다.", "win");
      render();
      return;
    }

    executeMove(choice.move);
  }

  function chooseAiMove(state, deadline) {
    const moves = orderMoves(state, getLegalMoves(state, "black"), true);
    if (moves.length === 0) return { move: null, depth: 0, score: -Infinity };

    let bestCompleted = greedyChoice(state, moves);
    let completedDepth = 0;

    for (let depth = 1; depth <= maxSearchDepth; depth += 1) {
      const result = searchRoot(state, moves, depth, deadline);
      if (!result.completed) break;
      bestCompleted = result;
      completedDepth = depth;
      if (Math.abs(result.score) > 90000 || performance.now() >= deadline) break;
    }

    return {
      move: bestCompleted.move,
      depth: completedDepth || 1,
      score: bestCompleted.score
    };
  }

  function searchRoot(state, rootMoves, depth, deadline) {
    let bestMove = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    const context = { timeUp: false, nodes: 0, deadline };

    for (const move of rootMoves) {
      if (performance.now() >= deadline) {
        context.timeUp = true;
        break;
      }
      const score = expectedMoveScore(state, move, depth - 1, alpha, beta, context);
      if (context.timeUp) break;
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    }

    return { completed: !context.timeUp && bestMove !== null, move: bestMove, score: bestScore, depth };
  }

  function minimax(state, depth, alpha, beta, context) {
    context.nodes += 1;
    if ((context.nodes & 31) === 0 && performance.now() >= context.deadline) {
      context.timeUp = true;
      return evaluateState(state);
    }

    const terminal = getTerminalStatus(state);
    if (terminal.done || depth <= 0) return evaluateState(state);

    const moves = getLegalMoves(state, state.turn);
    if (moves.length === 0) return state.turn === "black" ? -85000 : 85000;

    const maximizing = state.turn === "black";
    const ordered = orderMoves(state, moves, maximizing);

    if (maximizing) {
      let best = -Infinity;
      for (const move of ordered) {
        const score = expectedMoveScore(state, move, depth - 1, alpha, beta, context);
        if (context.timeUp) return evaluateState(state);
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (const move of ordered) {
      const score = expectedMoveScore(state, move, depth - 1, alpha, beta, context);
      if (context.timeUp) return evaluateState(state);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  function expectedMoveScore(state, move, depth, alpha, beta, context) {
    const outcomes = getSearchOutcomes(state, move);
    let score = 0;
    for (const outcome of outcomes) {
      score += outcome.probability * minimax(outcome.state, depth, alpha, beta, context);
      if (context.timeUp) return score;
    }
    return score;
  }

  function getSearchOutcomes(state, move) {
    const defender = state.board[move.to];
    if (!defender) return [applyQuietMove(state, move)];

    if (!state.whiteBonusUsed && state.moveCount >= 20) {
      const withoutBonus = buildBattleOutcomes(state, move, false);
      const withBonus = buildBattleOutcomes(state, move, true);
      const noScore = weightedStaticScore(withoutBonus);
      const yesScore = weightedStaticScore(withBonus);
      return yesScore < noScore ? withBonus : withoutBonus;
    }

    return buildBattleOutcomes(state, move, false);
  }

  function weightedStaticScore(outcomes) {
    return outcomes.reduce((sum, outcome) => sum + outcome.probability * evaluateState(outcome.state), 0);
  }

  function applyQuietMove(state, move) {
    const next = cloneState(state);
    next.board[move.to] = next.board[move.from];
    next.board[move.from] = null;
    next.turn = opposite(state.turn);
    next.moveCount += 1;
    return { probability: 1, state: next };
  }

  function buildBattleOutcomes(state, move, useWhiteBonus) {
    const attacker = state.board[move.from];
    const defender = state.board[move.to];
    const modifiers = getBattleModifiers(attacker, defender, useWhiteBonus);
    const counts = { attacker: 0, defender: 0, tie: 0 };

    for (let attackDie = 1; attackDie <= 6; attackDie += 1) {
      for (let defendDie = 1; defendDie <= 6; defendDie += 1) {
        const attackTotal = attackDie + modifiers.attacker;
        const defendTotal = defendDie + modifiers.defender;
        if (attackTotal > defendTotal) counts.attacker += 1;
        else if (defendTotal > attackTotal) counts.defender += 1;
        else counts.tie += 1;
      }
    }

    const outcomes = [];
    if (counts.attacker > 0) {
      outcomes.push({ probability: counts.attacker / 36, state: applyBattleResult(state, move, "attacker", useWhiteBonus) });
    }
    if (counts.defender > 0) {
      outcomes.push({ probability: counts.defender / 36, state: applyBattleResult(state, move, "defender", useWhiteBonus) });
    }
    if (counts.tie > 0) {
      outcomes.push({ probability: counts.tie / 36, state: applyBattleResult(state, move, "tie", useWhiteBonus) });
    }
    return outcomes;
  }

  function applyBattleResult(state, move, result, useWhiteBonus) {
    const next = cloneState(state);
    if (result === "attacker") {
      next.board[move.to] = next.board[move.from];
      next.board[move.from] = null;
    } else if (result === "defender") {
      next.board[move.from] = null;
    }
    next.turn = opposite(state.turn);
    next.moveCount += 1;
    if (useWhiteBonus) next.whiteBonusUsed = true;
    return next;
  }

  function greedyChoice(state, moves) {
    let bestMove = moves[0];
    let bestScore = -Infinity;
    for (const move of moves) {
      const score = weightedStaticScore(getSearchOutcomes(state, move));
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return { completed: true, move: bestMove, score: bestScore, depth: 1 };
  }

  function orderMoves(state, moves, descending) {
    return [...moves].sort((a, b) => {
      const delta = quickMoveScore(state, b) - quickMoveScore(state, a);
      return descending ? delta : -delta;
    });
  }

  function quickMoveScore(state, move) {
    const attacker = state.board[move.from];
    const defender = state.board[move.to];
    let score = 0;
    if (defender) {
      const probabilities = battleProbabilities(attacker, defender, false);
      score += pieceInfo[defender.type].value * probabilities.attacker;
      score -= pieceInfo[attacker.type].value * probabilities.defender * 0.86;
      if (defender.type === "king") score += 400;
      if (attacker.type === "king") score -= 8;
    } else {
      const fromCenter = centerDistance(move.from);
      const toCenter = centerDistance(move.to);
      score += (fromCenter - toCenter) * 0.08;
    }
    if (attacker.side === "white") score *= -1;
    return score;
  }

  function battleProbabilities(attacker, defender, useWhiteBonus) {
    const modifiers = getBattleModifiers(attacker, defender, useWhiteBonus);
    const counts = { attacker: 0, defender: 0, tie: 0 };
    for (let attackDie = 1; attackDie <= 6; attackDie += 1) {
      for (let defendDie = 1; defendDie <= 6; defendDie += 1) {
        const attackTotal = attackDie + modifiers.attacker;
        const defendTotal = defendDie + modifiers.defender;
        if (attackTotal > defendTotal) counts.attacker += 1;
        else if (defendTotal > attackTotal) counts.defender += 1;
        else counts.tie += 1;
      }
    }
    return {
      attacker: counts.attacker / 36,
      defender: counts.defender / 36,
      tie: counts.tie / 36
    };
  }

  function evaluateState(state) {
    const terminal = getTerminalStatus(state);
    if (terminal.done) {
      if (terminal.winner === "black") return 100000;
      if (terminal.winner === "white") return -100000;
      return 0;
    }

    let score = 0;
    for (let index = 0; index < state.board.length; index += 1) {
      const piece = state.board[index];
      if (!piece) continue;
      const sign = piece.side === "black" ? 1 : -1;
      let value = pieceInfo[piece.type].value;
      value += positionalValue(piece, index, state);
      score += sign * value;
    }

    score += kingBreathingRoom(state, "black") * 0.04;
    score -= kingBreathingRoom(state, "white") * 0.04;
    return score;
  }

  function positionalValue(piece, index, state) {
    const rank = rankOf(index);
    let value = 0;
    if (piece.type === "pawn") {
      value += piece.side === "black" ? (size - 1 - rank) * 0.07 : rank * 0.07;
    }
    if (piece.type === "knight" || piece.type === "shinobi" || piece.type === "cannon") {
      value += (size / 2 - centerDistance(index)) * 0.08;
    }
    if (piece.type === "rook") {
      value += openLines(state, index) * 0.03;
    }
    if (piece.type === "king") {
      value -= edgeDistancePenalty(index) * 0.035;
    }
    return value;
  }

  function getBattleModifiers(attacker, defender, useWhiteBonus) {
    let attackerBonus = 0;
    let defenderBonus = 0;

    if (defender.type !== "king" && defender.type !== "shinobi") {
      attackerBonus += 1;
    }
    if (defender.type === "shinobi" && attacker.type !== "shinobi") {
      defenderBonus += 1;
    }
    if (useWhiteBonus) {
      if (attacker.side === "white") attackerBonus += 2;
      else defenderBonus += 2;
    }

    return { attacker: attackerBonus, defender: defenderBonus };
  }

  function getLegalMoves(state, side) {
    const moves = [];
    for (let index = 0; index < state.board.length; index += 1) {
      const piece = state.board[index];
      if (piece && piece.side === side) {
        moves.push(...getMovesForPiece(state, index));
      }
    }
    return moves;
  }

  function getMovesForPiece(state, from) {
    const piece = state.board[from];
    if (!piece) return [];
    const file = fileOf(from);
    const rank = rankOf(from);
    const moves = [];
    const pushTarget = (targetFile, targetRank) => {
      if (!inBounds(targetFile, targetRank)) return;
      const to = indexOf(targetFile, targetRank);
      if (to === from) return;
      const target = state.board[to];
      if (!target || target.side !== piece.side) moves.push({ from, to });
    };

    if (piece.type === "rook") {
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [df, dr] of directions) {
        let nextFile = file + df;
        let nextRank = rank + dr;
        while (inBounds(nextFile, nextRank)) {
          const to = indexOf(nextFile, nextRank);
          const target = state.board[to];
          if (!target) {
            moves.push({ from, to });
          } else {
            if (target.side !== piece.side) moves.push({ from, to });
            break;
          }
          nextFile += df;
          nextRank += dr;
        }
      }
    }

    if (piece.type === "cannon") {
      const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
      for (const [df, dr] of directions) {
        let nextFile = file + df;
        let nextRank = rank + dr;
        let jumped = false;
        while (inBounds(nextFile, nextRank)) {
          const to = indexOf(nextFile, nextRank);
          const target = state.board[to];
          if (!jumped) {
            if (target) jumped = true;
          } else if (!target) {
            moves.push({ from, to });
          } else {
            if (target.side !== piece.side) moves.push({ from, to });
            break;
          }
          nextFile += df;
          nextRank += dr;
        }
      }
    }

    if (piece.type === "knight") {
      const jumps = [
        [1, 2], [2, 1], [2, -1], [1, -2],
        [-1, -2], [-2, -1], [-2, 1], [-1, 2]
      ];
      for (const [df, dr] of jumps) pushTarget(file + df, rank + dr);
    }

    if (piece.type === "king") {
      for (let df = -1; df <= 1; df += 1) {
        for (let dr = -1; dr <= 1; dr += 1) {
          if (df !== 0 || dr !== 0) pushTarget(file + df, rank + dr);
        }
      }
    }

    if (piece.type === "pawn") {
      const forward = piece.side === "white" ? 1 : -1;
      pushTarget(file, rank + forward);
      pushTarget(file - 1, rank);
      pushTarget(file + 1, rank);
    }

    if (piece.type === "shinobi") {
      const kingIndex = findKing(state, piece.side);
      if (kingIndex !== -1) {
        const kingFile = fileOf(kingIndex);
        const kingRank = rankOf(kingIndex);
        for (let df = -1; df <= 1; df += 1) {
          for (let dr = -1; dr <= 1; dr += 1) {
            if (df !== 0 || dr !== 0) pushTarget(kingFile + df, kingRank + dr);
          }
        }
      }
    }

    return moves;
  }

  function findKing(state, side) {
    return state.board.findIndex(piece => piece && piece.side === side && piece.type === "king");
  }

  function getTerminalStatus(state) {
    const whiteKingAlive = findKing(state, "white") !== -1;
    const blackKingAlive = findKing(state, "black") !== -1;
    if (!whiteKingAlive && !blackKingAlive) {
      return { done: true, winner: null, message: "양쪽 킹이 모두 사라져 무승부입니다." };
    }
    if (!whiteKingAlive) {
      return { done: true, winner: "black", message: "백 킹이 사라졌습니다. 흑 승리입니다." };
    }
    if (!blackKingAlive) {
      return { done: true, winner: "white", message: "흑 킹이 사라졌습니다. 백 승리입니다." };
    }
    return { done: false, winner: null, message: "" };
  }

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function makeState() {
    return {
      board: cloneBoard(board),
      turn: currentTurn,
      moveCount,
      whiteBonusUsed
    };
  }

  function cloneBoard(source) {
    return source.map(piece => piece ? { ...piece } : null);
  }

  function cloneState(state) {
    return {
      board: cloneBoard(state.board),
      turn: state.turn,
      moveCount: state.moveCount,
      whiteBonusUsed: state.whiteBonusUsed
    };
  }

  function makePiece(side, type) {
    pieceId += 1;
    return { id: `${side}-${type}-${pieceId}`, side, type };
  }

  function place(side, type, file, rank) {
    board[indexOf(file, rank)] = makePiece(side, type);
  }

  function addLog(text, kind = "move") {
    logs.unshift({ text, kind });
    logs = logs.slice(0, 18);
  }

  function centerDistance(index) {
    const file = fileOf(index);
    const rank = rankOf(index);
    const middle = (size - 1) / 2;
    return Math.abs(file - middle) + Math.abs(rank - middle);
  }

  function edgeDistancePenalty(index) {
    const file = fileOf(index);
    const rank = rankOf(index);
    return Math.max(0, 2 - Math.min(file, rank, size - 1 - file, size - 1 - rank));
  }

  function openLines(state, index) {
    const file = fileOf(index);
    const rank = rankOf(index);
    let count = 0;
    for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nextFile = file + df;
      const nextRank = rank + dr;
      if (inBounds(nextFile, nextRank) && !state.board[indexOf(nextFile, nextRank)]) count += 1;
    }
    return count;
  }

  function kingBreathingRoom(state, side) {
    const king = findKing(state, side);
    if (king === -1) return 0;
    const file = fileOf(king);
    const rank = rankOf(king);
    let count = 0;
    for (let df = -1; df <= 1; df += 1) {
      for (let dr = -1; dr <= 1; dr += 1) {
        if (df === 0 && dr === 0) continue;
        const nf = file + df;
        const nr = rank + dr;
        if (!inBounds(nf, nr)) continue;
        const target = state.board[indexOf(nf, nr)];
        if (!target || target.side !== side) count += 1;
      }
    }
    return count;
  }

  function opposite(side) {
    return side === "white" ? "black" : "white";
  }

  function sideName(side) {
    return side === "white" ? "백" : "흑";
  }

  function coord(index) {
    return `${files[fileOf(index)]}${rankOf(index) + 1}`;
  }

  function indexOf(file, rank) {
    return rank * size + file;
  }

  function fileOf(index) {
    return index % size;
  }

  function rankOf(index) {
    return Math.floor(index / size);
  }

  function inBounds(file, rank) {
    return file >= 0 && file < size && rank >= 0 && rank < size;
  }

  function clearAiTimer() {
    if (aiTimer) window.clearTimeout(aiTimer);
    aiTimer = null;
  }

  return {
    newGame,
    render,
    onSquareClick,
    onBonusDecision,
    deactivate() {
      clearAiTimer();
      ctx.hideBonusModal();
    }
  };
}

init();
